// ═══════════════════════════════════════════════════════════════════════════
// fiscal-reconciliar · los documentos COLGADOS
//
// 🔴 Existe porque un webhook que no llega no deja síntoma: el documento se
//    queda en `emitiendo` para siempre y la pantalla dice «preparando». Este
//    reloj es lo que convierte ese silencio en un número.
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { resolverPuerto } from '../_shared/facturacion/mod.ts';

Deno.serve(async (req) => {
  const secreto = Deno.env.get('DESPACHO_SECRET') ?? '';
  if (!secreto || req.headers.get('x-despacho-secret') !== secreto) {
    return Response.json({ ok: false, codigo: 'no_autorizado' }, { status: 401 });
  }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: cfg } = await db.from('app_config').select('valor').eq('clave', 'fiscal_proveedor').maybeSingle();
  const puerto = resolverPuerto(cfg?.valor ?? 'manual', Deno.env.get('FACTURACION_WEBHOOK_SECRET') ?? 'pruebas');

  const ahora = Date.now();
  const hace = (min: number) => new Date(ahora - min * 60_000).toISOString();

  // BORRADOR > 5 min: nació y nadie lo emitió.
  const { data: borradores } = await db.from('documentos_fiscales')
    .select('id, pago_intento_id').eq('estado', 'borrador').lt('created_at', hace(5)).limit(50);

  // EMITIENDO > 30 min: salió y el webhook no volvió.
  const { data: colgados } = await db.from('documentos_fiscales')
    .select('id, referencia_proveedor').eq('estado', 'emitiendo').lt('updated_at', hace(30)).limit(50);

  let reconsultados = 0;
  for (const d of colgados ?? []) {
    if (!d.referencia_proveedor) continue;
    try {
      const r = await puerto.consultarEstado(d.referencia_proveedor);
      const parche: Record<string, unknown> = { estado: r.estado, motivo_rechazo: r.motivo ?? null };
      if (r.estado === 'autorizada') parche.autorizado_en = r.autorizado_en ?? new Date().toISOString();
      await db.from('documentos_fiscales').update(parche).eq('id', d.id);
      reconsultados++;
    } catch { /* se cuenta abajo como colgado; no se pierde */ }
  }

  /* Los pagos SIN documento: lo que el outbox no pudo escribir. Se cuenta acá
     porque es el único lugar que mira lo que NO existe. */
  const { data: huerfanos } = await db.rpc('pagos_aprobados_sin_documento', { p_desde: hace(60 * 24) });

  return Response.json({
    ok: true,
    borradores_viejos: borradores?.length ?? 0,
    emitiendo_colgados: colgados?.length ?? 0,
    reconsultados,
    pagos_sin_documento_24h: (huerfanos as unknown[])?.length ?? 0,
  });
});
