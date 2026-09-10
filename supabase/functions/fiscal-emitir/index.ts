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
// La clave y el secuencial los resuelve `fiscal_reservar_numero` del lado de la
// base, en un solo hecho: acá ya no se construyen.
import { construirCanonico, CONSUMIDOR_FINAL, CANONICO_VERSION,
         type ItemCanonico, type ReceptorCanonico,
         type CatalogosSri } from '../_shared/facturacion/canonico.ts';

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

/**
 * TODO update del pipeline fiscal pasa por acá.
 *
 * 🔴 CERO FILAS ES UN ROJO, NO UN SILENCIO. En supabase-js un update que no
 *    encuentra su fila **no es error**: devuelve `{ error: null }` y sigue. Ése
 *    es el modo de falla que dejó dos secuenciales quemados y ninguna fila con
 *    ellos — la edge informó `emitiendo` y la fila se quedó en `borrador`.
 *    `.select('id')` obliga a PostgREST a devolver lo que tocó, y contar eso es
 *    la única forma de saber que tocó algo.
 */
/* Recibe la CONSULTA ya armada, no el cliente: el builder de PostgREST es
   *thenable* pero no es una Promise, y atar el helper al genérico del cliente
   arrastra los parámetros del schema. Así el helper es una línea y no miente. */
async function exigeUnaFila(
  q: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
  paso: string,
): Promise<void> {
  const { data, error } = await q;
  if (error) throw new Error(`${paso}: ${error.message}`);
  if (!data || data.length !== 1) {
    throw new Error(`${paso}: afectó ${data?.length ?? 0} filas — la escritura no llegó`);
  }
}

Deno.serve(async (req) => {
  // Guard de perímetro, mismo molde que despachar-push: secreto compartido.
  // 🔴 NUNCA la anon key: es pública y viaja en el bundle.
  const secreto = Deno.env.get('DESPACHO_SECRET') ?? '';
  if (!secreto || req.headers.get('x-despacho-secret') !== secreto) {
    return json({ ok: false, codigo: 'no_autorizado' }, 401);
  }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: cfg } = await db.from('app_config').select('clave,valor')
    .in('clave', ['fiscal_proveedor', 'fiscal_ambiente', 'fiscal_simular_cupo_agotado']);
  const proveedor = cfg?.find((c) => c.clave === 'fiscal_proveedor')?.valor ?? 'manual';
  const simularCupo = cfg?.find((c) => c.clave === 'fiscal_simular_cupo_agotado')?.valor === 'true';
  const puerto = resolverPuerto(proveedor,
    Deno.env.get('FACTURACION_WEBHOOK_SECRET') ?? 'pruebas', simularCupo);

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

  /* 🔴 LA COLA INCLUYE LOS `emitiendo`, y sin eso la retriabilidad que el
     encabezado promete no existía: un documento que quedó en vuelo —timeout,
     proveedor caído, cupo agotado— **no lo levantaba nadie**. Ahora vuelve, y
     REUSA su secuencial —`fiscal_reservar_numero` es idempotente—: tomarle uno
     nuevo dejaría un hueco que hay que explicarle al SRI. */
  const { data: pendientes } = await db.from('documentos_fiscales')
    .select('*').in('estado', ['borrador', 'emitiendo']).eq('sentido', 'emitido').limit(20);

  const hechos: unknown[] = [];
  for (const d of pendientes ?? []) {
    try {
      /* ⓪ 🔴 SI EL PROVEEDOR YA LO TOMÓ, SE CONSULTA — NO SE RE-EMITE.
         Defecto que introduje al meter los `emitiendo` en la cola: con una
         `referencia_proveedor` ya asignada, cada tick del reloj volvía a hacer
         POST del MISMO comprobante. *Un reintento de algo que sí llegó no es un
         reintento: es un envío duplicado, y del otro lado hay un comprobante
         real.* Medido en el e2e: cuatro corridas, cuatro POST. */
      if (d.referencia_proveedor && d.estado === 'emitiendo') {
        const c = await puerto.consultarEstado(d.referencia_proveedor);
        await exigeUnaFila(db.from('documentos_fiscales').update({
          estado: c.estado,
          motivo_rechazo: c.motivo ?? null,
          ...(c.autorizado_en ? { autorizado_en: c.autorizado_en } : {}),
        }).eq('id', d.id).select('id'), 'consulta_estado');
        const { data: f } = await db.from('documentos_fiscales')
          .select('estado,secuencial').eq('id', d.id).maybeSingle();
        hechos.push({ id: d.id, camino: 'consultado', leido_de_la_fila: true,
                      estado: f?.estado, secuencial: f?.secuencial });
        continue;
      }

      // ① las líneas: son la base imponible. Sin ellas no se emite (fail-closed).
      const { data: lineas } = await db.from('pagos_desglose_lineas')
        .select('*').eq('pago_intento_id', d.pago_intento_id).order('linea');
      if (!lineas?.length) {
        await exigeUnaFila(db.from('documentos_fiscales').update({
          estado: 'pendiente_manual',
          motivo_rechazo: 'sin_lineas_fiscales: no hay base imponible que facturar',
        }).eq('id', d.id).select('id'), 'sin_lineas');
        hechos.push({ id: d.id, resultado: 'sin_lineas' });
        continue;
      }

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
        await exigeUnaFila(db.from('documentos_fiscales').update({
          estado: 'pendiente_manual',
          motivo_rechazo: `forma_pago: ${JSON.stringify(fp ?? { codigo: 'sin_respuesta' })}`.slice(0, 400),
        }).eq('id', d.id).select('id'), 'sin_forma_de_pago');
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
        await exigeUnaFila(db.from('documentos_fiscales').update({
          estado: 'pendiente_manual',
          motivo_rechazo: 'agente_retencion_sin_resolucion: el emisor se declara agente '
                        + 'de retención y no tiene número de resolución cargado.',
        }).eq('id', d.id).select('id'), 'agente_retencion');
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

      // ④ EL NÚMERO Y SU FILA, EN UN SOLO HECHO
      //
      // 🔴 Era: RPC del secuencial → UPDATE aparte. Entre los dos había una
      //    ventana, y el e2e de E la encontró: el UPDATE rebotó, nadie leyó el
      //    error, y **el número quedó consumido sin vivir en ninguna fila**.
      //    Ahora `fiscal_reservar_numero` toma el número, deriva la clave y
      //    escribe la fila en la MISMA transacción: o la fila queda con su
      //    número, o el número no se consume. Y es idempotente, así que un
      //    reintento reusa el suyo en vez de abrir un hueco.
      const { data: reserva, error: eRes } = await db.rpc('fiscal_reservar_numero', {
        p_documento_id: d.id,
        p_canonico: canonico,
        p_canonico_version: CANONICO_VERSION,
        p_proveedor: puerto.nombre,
        p_subtotal_0: canonico.subtotales_por_tarifa.find((g) => g.tarifa_pct === 0)?.base ?? 0,
        p_subtotal_15: canonico.subtotales_por_tarifa.find((g) => g.tarifa_pct !== 0)?.base ?? 0,
        p_iva: canonico.subtotales_por_tarifa.reduce((a, g) => a + g.valor_iva, 0),
        p_total: canonico.total,
      });
      if (eRes) throw new Error(`reservar_numero: ${eRes.message}`);
      if (!reserva?.ok) throw new Error(`reservar_numero: ${JSON.stringify(reserva)}`);
      const clave: string = reserva.clave_acceso;

      // ⑤ recién ahora, afuera
      const r = await puerto.emitir({ ...canonico, clave_acceso: clave });

      /* Un rechazo REINTENTABLE no pierde la factura: queda en `emitiendo` con
         su secuencial y su clave, y el reconciliador la vuelve a tomar. */
      const reintentable = r.reintentable === true;
      await exigeUnaFila(db.from('documentos_fiscales').update({
        referencia_proveedor: r.referencia,
        estado: reintentable ? 'emitiendo' : r.estado,
        motivo_rechazo: r.motivo ?? null,
      }).eq('id', d.id).select('id'), 'resultado_emision');

      /* 🔴 EL PARTE SE ARMA LEYENDO LA FILA. Antes salía de variables locales:
         decía `estado: 'emitiendo'` porque ESO fue lo que se intentó, no lo que
         quedó. *Un instrumento que informa su intención en vez de su efecto no
         está midiendo* — y su `ok` fue exactamente lo que tapó el defecto. */
      const { data: fila } = await db.from('documentos_fiscales')
        .select('estado,secuencial,clave_acceso,motivo_rechazo').eq('id', d.id).maybeSingle();

      hechos.push({
        id: d.id,
        leido_de_la_fila: true,
        estado: fila?.estado ?? '(no se pudo releer)',
        secuencial: fila?.secuencial ?? null,
        tiene_clave: !!fila?.clave_acceso,
        ...(reintentable ? { en_cola_por: r.codigo ?? 'reintentable' } : {}),
        ...(fila?.estado !== (reintentable ? 'emitiendo' : r.estado)
            ? { divergencia: `el puerto dijo ${r.estado} y la fila dice ${fila?.estado}` }
            : {}),
      });
    } catch (e) {
      /* Un rechazo NO reutiliza el secuencial: la corrección es un documento
         NUEVO que apunta al rechazado (tanda 2). Acá sólo se nombra el fallo. */
      /* Ni el registro del fallo se da por hecho: si TAMBIÉN afecta 0 filas,
         se grita en el log — que es el único lugar que queda. */
      try {
        await exigeUnaFila(db.from('documentos_fiscales').update({
          estado: 'no_autorizada', motivo_rechazo: `emitir: ${String(e).slice(0, 180)}`,
        }).eq('id', d.id).select('id'), 'registrar_fallo');
      } catch (e2) {
        console.error(`fiscal_emitir_sin_rastro documento=${d.id} ${String(e2).slice(0, 160)}`);
      }
      hechos.push({ id: d.id, error: String(e).slice(0, 120) });
    }
  }
  return json({ ok: true, proveedor: puerto.nombre, procesados: hechos.length, hechos });
});
