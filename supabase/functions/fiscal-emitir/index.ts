// ═══════════════════════════════════════════════════════════════════════════
// fiscal-emitir · BORRADOR → EMITIENDO → (webhook) AUTORIZADA
//
// 🔴 EL ORDEN NO ES ESTILO Y ES LO ÚNICO QUE HACE ESTO REINTENTABLE:
//    secuencial atómico → clave → **PERSISTIR `emitiendo` CON secuencial y clave**
//    → recién ahí el POST. *Un timeout después del POST encuentra el MISMO
//    documento con el MISMO número; si se persistiera después, cada reintento
//    consumiría un secuencial nuevo y dejaría huecos en la numeración que hay
//    que explicarle al SRI.*
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { resolverPuerto } from '../_shared/facturacion/mod.ts';
import { reconstruirClaveAcceso, ambienteTexto } from '../_shared/facturacion/clave_acceso.ts';
import { construirCanonico, CONSUMIDOR_FINAL, CANONICO_VERSION,
         type ItemCanonico, type ReceptorCanonico,
         type CatalogosSri } from '../_shared/facturacion/canonico.ts';

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

Deno.serve(async (req) => {
  // Guard de perímetro, mismo molde que despachar-push: secreto compartido.
  // 🔴 NUNCA la anon key: es pública y viaja en el bundle.
  const secreto = Deno.env.get('DESPACHO_SECRET') ?? '';
  if (!secreto || req.headers.get('x-despacho-secret') !== secreto) {
    return json({ ok: false, codigo: 'no_autorizado' }, 401);
  }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: cfg } = await db.from('app_config').select('clave,valor')
    .in('clave', ['fiscal_proveedor', 'fiscal_ambiente']);
  const proveedor = cfg?.find((c) => c.clave === 'fiscal_proveedor')?.valor ?? 'manual';
  const puerto = resolverPuerto(proveedor, Deno.env.get('FACTURACION_WEBHOOK_SECRET') ?? 'pruebas');

  const { data: emisor } = await db.from('fiscal_emisor').select('*').single();
  if (!emisor) return json({ ok: false, codigo: 'sin_emisor_configurado' }, 409);

  /* ── LOS CÓDIGOS DEL SRI SON DATO ─────────────────────────────────────────
     Se leen UNA vez por corrida y se pasan al canónico, que los CONGELA en el
     documento. *Un documento que para reimprimirse tuviera que volver a
     consultar el catálogo no se puede reimprimir dos años después: para
     entonces la tarifa cambió.* Fail-closed: sin catálogo no se emite. */
  const [{ data: tasasRows }, { data: identRows }] = await Promise.all([
    db.from('cat_tasas_impuesto')
      .select('codigo,codigo_sri,codigo_porcentaje_sri').eq('activo', true),
    db.from('cat_identificacion_sri')
      .select('codigo,codigo_sri').eq('country_code', 'EC').eq('activo', true),
  ]);
  if (!tasasRows?.length || !identRows?.length) {
    return json({ ok: false, codigo: 'catalogo_sri_vacio' }, 409);
  }
  const catalogos: CatalogosSri = {
    tasas: Object.fromEntries(tasasRows
      .filter((t) => t.codigo_sri && t.codigo_porcentaje_sri)
      .map((t) => [t.codigo, { codigo_sri: t.codigo_sri!, codigo_porcentaje_sri: t.codigo_porcentaje_sri! }])),
    identificacion: Object.fromEntries(identRows.map((i) => [i.codigo, i.codigo_sri])),
  };

  const { data: pendientes } = await db.from('documentos_fiscales')
    .select('*').eq('estado', 'borrador').eq('sentido', 'emitido').limit(20);

  const hechos: unknown[] = [];
  for (const d of pendientes ?? []) {
    try {
      // ① las líneas: son la base imponible. Sin ellas no se emite (fail-closed).
      const { data: lineas } = await db.from('pagos_desglose_lineas')
        .select('*').eq('pago_intento_id', d.pago_intento_id).order('linea');
      if (!lineas?.length) {
        await db.from('documentos_fiscales').update({
          estado: 'pendiente_manual',
          motivo_rechazo: 'sin_lineas_fiscales: no hay base imponible que facturar',
        }).eq('id', d.id);
        hechos.push({ id: d.id, resultado: 'sin_lineas' });
        continue;
      }

      // ② el secuencial, ATÓMICO (FOR UPDATE del lado de la base)
      const { data: sec, error: eSec } = await db.rpc('tomar_secuencial_fiscal', {
        p_ruc: emisor.ruc, p_establecimiento: emisor.establecimiento,
        p_punto_emision: emisor.punto_emision, p_tipo: d.tipo,
      });
      if (eSec || !sec) throw new Error(`secuencial: ${eSec?.message ?? 'vacio'}`);

      // ③ la clave, del lado nuestro — y DERIVADA, no sorteada.
      //
      // 🔴 Los dos insumos salen de la FILA, no del ambiente: la fecha es
      //    `fecha_emision` (era `new Date()`, el reloj de la edge — un documento
      //    de las 21:30 en Guayaquil quedaba con la clave del día siguiente) y el
      //    código numérico sale del secuencial (era `Math.random()`). *Con eso la
      //    clave deja de ser un dato que hay que ir a buscar y pasa a ser una
      //    función de la fila: se recalcula y se coteja.*
      const clave = reconstruirClaveAcceso(
        { fecha_emision: d.fecha_emision, tipo: d.tipo,
          establecimiento: emisor.establecimiento, punto_emision: emisor.punto_emision,
          secuencial: sec as string },
        { ruc: emisor.ruc, ambiente: emisor.ambiente },
      );

      const items: ItemCanonico[] = lineas.map((l) => ({
        linea: l.linea, descripcion: l.descripcion, cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario), descuento: Number(l.descuento),
        codigo_iva: l.codigo_iva, tarifa_pct: Number(l.tarifa_pct),
        base: Number(l.base), valor_iva: Number(l.valor_iva),
      }));

      const receptor: ReceptorCanonico = d.identificacion
        ? { tipo_identificacion: d.tipo_identificacion, identificacion: d.identificacion,
            razon_social: d.razon_social ?? 'CONSUMIDOR FINAL',
            direccion: d.direccion, email: d.email }
        : CONSUMIDOR_FINAL;

      let nombreCuenta: string | null = null;
      if (d.cuenta_comercial_id) {
        const { data: cc } = await db.from('cuentas_comerciales')
          .select('razon_social').eq('id', d.cuenta_comercial_id).maybeSingle();
        nombreCuenta = cc?.razon_social ?? null;
      }

      /* 🔴 LA FORMA DE PAGO, FAIL-CLOSED. Medido: la base no distingue crédito de
         débito —`marca` es la marca de la tarjeta, `forma` es el flujo— así que
         para nuvei el medio hay que declararlo. Sin él el documento ESPERA en
         vez de salir con un `<formaPago>` inventado. */
      const { data: fp } = await db.rpc('fiscal_forma_pago_del_intento',
                                        { p_intento_id: d.pago_intento_id });
      if (!fp?.ok) {
        await db.from('documentos_fiscales').update({
          estado: 'pendiente_manual',
          motivo_rechazo: `forma_pago: ${JSON.stringify(fp ?? { codigo: 'sin_respuesta' })}`.slice(0, 400),
        }).eq('id', d.id);
        hechos.push({ id: d.id, resultado: 'sin_forma_de_pago' });
        continue;
      }

      const emisorCanonico = {
        ...emisor,
        /* Cae a la matriz si nadie declaró la del local — y se ve en el dato,
           no se disfraza: el XML lleva la dirección que la casa realmente tiene. */
        direccion_establecimiento: emisor.direccion_establecimiento ?? emisor.direccion_matriz,
      };

      /* 🔴 FAIL-CLOSED del 2.1.0: decirse agente de retención sin declarar la
         resolución produciría el campo vacío o inventado. El documento espera. */
      if (emisor.agente_retencion && !emisor.agente_retencion_resolucion) {
        await db.from('documentos_fiscales').update({
          estado: 'pendiente_manual',
          motivo_rechazo: 'agente_retencion_sin_resolucion: el emisor se declara agente '
                        + 'de retención y no tiene número de resolución cargado.',
        }).eq('id', d.id);
        hechos.push({ id: d.id, resultado: 'agente_retencion_sin_resolucion' });
        continue;
      }

      const canonico = construirCanonico({
        tipo: d.tipo, fecha_emision: d.fecha_emision, emisor: emisorCanonico,
        receptor, items, catalogos, forma_pago_sri: fp.codigo_sri,
        razonSocialCuentaComercial: nombreCuenta,
        referencias: { pago_intento_id: d.pago_intento_id, origen_tipo: lineas[0]?.origen_tipo ?? null,
                       origen_id: lineas[0]?.origen_id ?? null },
      });

      // ④ PERSISTIR ANTES DEL POST — el paso que vuelve reintentable todo esto
      //
      // 🔴 SU ERROR SE LEE. Era `await` a secas: supabase-js NO lanza, devuelve
      //    `{ error }` — así que un rebote de CHECK aquí dejaba el documento en
      //    `borrador` y el pase siguiente le tomaba OTRO secuencial. *Un fallo que
      //    no se lee no se ve como fallo: se ve como huecos en la numeración que
      //    hay que explicarle al SRI meses después.*
      const { error: ePersist } = await db.from('documentos_fiscales').update({
        estado: 'emitiendo', establecimiento: emisor.establecimiento,
        punto_emision: emisor.punto_emision, secuencial: sec, clave_acceso: clave,
        /* 🔴 EL EMISOR SE CONGELA EN LA FILA, y sin esto «reconstruible desde la
           fila» sería falso: `fiscal_emisor` es UNA fila mutable —el día que
           cambie el establecimiento o el ambiente pase a producción, toda clave
           vieja dejaría de recalcular—. *Un cotejo que necesita una tabla que
           puede haber cambiado no verifica el pasado: lo reescribe.* */
        ruc_emisor: emisor.ruc,
        razon_social_emisor: emisor.razon_social,
        direccion_emisor: emisor.direccion_matriz,
        sri_ambiente: ambienteTexto(emisor.ambiente),   // 'pruebas'|'produccion' — su CHECK
        canonico, canonico_version: CANONICO_VERSION, proveedor: puerto.nombre,
        subtotal_0: canonico.subtotales_por_tarifa.find((g) => g.tarifa_pct === 0)?.base ?? 0,
        subtotal_15: canonico.subtotales_por_tarifa.find((g) => g.tarifa_pct !== 0)?.base ?? 0,
        iva: canonico.subtotales_por_tarifa.reduce((a, g) => a + g.valor_iva, 0),
        total: canonico.total,
      }).eq('id', d.id);
      if (ePersist) throw new Error(`persistir_antes_del_post: ${ePersist.message}`);

      // ⑤ recién ahora, afuera
      const r = await puerto.emitir({ ...canonico, clave_acceso: clave });
      await db.from('documentos_fiscales').update({
        referencia_proveedor: r.referencia,
        estado: r.estado,
        motivo_rechazo: r.motivo ?? null,
      }).eq('id', d.id);

      hechos.push({ id: d.id, secuencial: sec, estado: r.estado });
    } catch (e) {
      /* Un rechazo NO reutiliza el secuencial: la corrección es un documento
         NUEVO que apunta al rechazado (tanda 2). Acá sólo se nombra el fallo. */
      await db.from('documentos_fiscales').update({
        estado: 'no_autorizada', motivo_rechazo: `emitir: ${String(e).slice(0, 180)}`,
      }).eq('id', d.id);
      hechos.push({ id: d.id, error: String(e).slice(0, 120) });
    }
  }
  return json({ ok: true, proveedor: puerto.nombre, procesados: hechos.length, hechos });
});
