// ═══════════════════════════════════════════════════════════════════════════
// fiscal-webhook · el proveedor avisa AUTORIZADO / RECHAZADO
//
// 🔴 PERSISTIR ANTES DE ANALIZAR (regla del motor de pagos, S101): el crudo se
//    guarda primero. *Si el analizador lanza, el proveedor deja de reintentar y
//    del aviso no queda nada.*
// 🔴 La firma se verifica CON EL PUERTO: el simulador firma con su propio secreto
//    de pruebas. Un webhook sin firma verificada no mueve un documento fiscal.
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { resolverPuerto } from '../_shared/facturacion/mod.ts';

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: cfg } = await db.from('app_config').select('valor').eq('clave', 'fiscal_proveedor').maybeSingle();
  const puerto = resolverPuerto(cfg?.valor ?? 'manual', Deno.env.get('FACTURACION_WEBHOOK_SECRET') ?? 'pruebas');

  const r = await puerto.recibirWebhook(req);
  if (!r.verificado) {
    /* 401 y no 400: es una credencial que no valida, no un cuerpo mal armado.
       Confundirlos manda a soporte a buscar el problema equivocado. */
    return Response.json({ ok: false, codigo: 'firma_invalida', motivo: r.motivo }, { status: 401 });
  }
  if (!r.referencia) {
    return Response.json({ ok: false, codigo: 'sin_referencia' }, { status: 400 });
  }

  const { data: doc } = await db.from('documentos_fiscales')
    .select('id, estado').eq('referencia_proveedor', r.referencia).maybeSingle();
  if (!doc) return Response.json({ ok: false, codigo: 'documento_no_encontrado' }, { status: 404 });

  const parche: Record<string, unknown> = { estado: r.estado, motivo_rechazo: r.motivo ?? null };
  if (r.estado === 'autorizada') parche.autorizado_en = new Date().toISOString();

  /* Los archivos van a Storage PRIVADO. El bucket `fiscal` no se sirve por URL
     pública: se lee por URL firmada, y sólo por la puerta de packages/api. */
  if (r.xml) {
    const ruta = `${doc.id}/comprobante.xml`;
    await db.storage.from('fiscal').upload(ruta, new Blob([r.xml], { type: 'application/xml' }), { upsert: true });
    parche.xml_url = ruta;
  }
  if (r.ride) {
    const ruta = `${doc.id}/ride.html`;
    await db.storage.from('fiscal').upload(ruta, new Blob([r.ride], { type: 'text/html' }), { upsert: true });
    parche.pdf_url = ruta;
  }

  /* 🔴 El estado se escribe DESPUÉS de los archivos, a propósito: el trigger de
     inmutabilidad deja mover urls sobre un `autorizada`, pero si el estado
     entrara primero y la subida fallara, quedaría una factura autorizada sin
     respaldo y sin forma de saberlo. */
  await db.from('documentos_fiscales').update(parche).eq('id', doc.id);
  return Response.json({ ok: true, documento_id: doc.id, estado: r.estado });
});
