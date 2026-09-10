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
import { construirClaveAcceso } from '../_shared/facturacion/clave_acceso.ts';
import { construirCanonico, CONSUMIDOR_FINAL, CANONICO_VERSION,
         type ItemCanonico, type ReceptorCanonico } from '../_shared/facturacion/canonico.ts';

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

      // ③ la clave, del lado nuestro
      const codigoNumerico = String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
      const clave = construirClaveAcceso({
        fecha: new Date(), tipoComprobante: d.tipo, ruc: emisor.ruc,
        ambiente: emisor.ambiente as 1 | 2,
        establecimiento: emisor.establecimiento, puntoEmision: emisor.punto_emision,
        secuencial: sec as string, codigoNumerico,
      });

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

      const canonico = construirCanonico({
        tipo: d.tipo, emisor, receptor, items,
        razonSocialCuentaComercial: nombreCuenta,
        referencias: { pago_intento_id: d.pago_intento_id, origen_tipo: lineas[0]?.origen_tipo ?? null,
                       origen_id: lineas[0]?.origen_id ?? null },
      });

      // ④ PERSISTIR ANTES DEL POST — el paso que vuelve reintentable todo esto
      await db.from('documentos_fiscales').update({
        estado: 'emitiendo', establecimiento: emisor.establecimiento,
        punto_emision: emisor.punto_emision, secuencial: sec, clave_acceso: clave,
        canonico, canonico_version: CANONICO_VERSION, proveedor: puerto.nombre,
        subtotal_0: canonico.subtotales_por_tarifa.find((g) => g.tarifa_pct === 0)?.base ?? 0,
        subtotal_15: canonico.subtotales_por_tarifa.find((g) => g.tarifa_pct !== 0)?.base ?? 0,
        iva: canonico.subtotales_por_tarifa.reduce((a, g) => a + g.valor_iva, 0),
        total: canonico.total,
      }).eq('id', d.id);

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
