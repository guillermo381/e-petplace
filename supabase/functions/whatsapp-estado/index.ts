// whatsapp-estado — EL WEBHOOK DE ESTADO DE META (S114-A, firma founder)
//
// Cierra la mitad de D-1055 que SÍ se puede: WhatsApp da receipts por webhook
// (sent/delivered/read/failed), a diferencia de push (FCM v1 no da receipt por
// mensaje). Meta llama acá SIN JWT nuestro ⇒ verify_jwt=false; la autenticación
// es la FIRMA de Meta (X-Hub-Signature-256 con el app secret) en el POST, y el
// verify_token en el GET de alta.
//
// Estados, por lo que el webhook CONFIRMA (monótonos, jamás se degradan):
//   aceptada_transporte → Meta aceptó (2xx)      [lo pone despachar-whatsapp]
//   entregada_aparato   → Meta dice DELIVERED    [entrega REAL]
//   leida               → Meta dice READ
//   fallida             → Meta dice FAILED
//
// Secrets: META_APP_SECRET (firma), META_WEBHOOK_VERIFY_TOKEN (alta GET).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // ── GET · alta del webhook en Meta ────────────────────────────────────────
  if (req.method === 'GET') {
    const modo = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const esperado = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN') ?? '';
    if (modo === 'subscribe' && esperado && token === esperado) {
      return new Response(challenge ?? '', { status: 200 });
    }
    return new Response('no', { status: 403 });
  }

  if (req.method !== 'POST') return new Response('no', { status: 405 });

  // ── POST · la FIRMA de Meta es la autenticación ───────────────────────────
  const crudo = await req.text();
  const firma = req.headers.get('x-hub-signature-256') ?? '';
  const secret = Deno.env.get('META_APP_SECRET') ?? '';
  if (!secret) return new Response('sin_app_secret', { status: 500 });
  const esperada = 'sha256=' + createHmac('sha256', secret).update(crudo).digest('hex');
  // comparación byte a byte (largo primero)
  let ok = firma.length === esperada.length;
  for (let i = 0; ok && i < firma.length; i++) ok = firma[i] === esperada[i];
  if (!ok) return new Response('firma_invalida', { status: 401 });

  let cuerpo: Record<string, unknown>;
  try { cuerpo = JSON.parse(crudo); } catch { return new Response('json_invalido', { status: 400 }); }

  // ── recorrer los statuses y subir el estado de cada entrega por su wamid ───
  // Meta: entry[].changes[].value.statuses[] = { id: wamid, status, timestamp }
  const mapa: Record<string, { estado: string; desde: string[] }> = {
    delivered: { estado: 'entregada_aparato', desde: ['aceptada_transporte'] },
    read:      { estado: 'leida',             desde: ['aceptada_transporte', 'entregada_aparato'] },
    failed:    { estado: 'fallida',           desde: ['encolada', 'aceptada_transporte'] },
    // 'sent' no cambia nada: ya está en aceptada_transporte.
  };
  let tocadas = 0;
  const entry = (cuerpo.entry as Array<Record<string, unknown>>) ?? [];
  for (const e of entry) {
    const changes = (e.changes as Array<Record<string, unknown>>) ?? [];
    for (const ch of changes) {
      const value = (ch.value as Record<string, unknown>) ?? {};
      const statuses = (value.statuses as Array<{ id?: string; status?: string; errors?: unknown }>) ?? [];
      for (const st of statuses) {
        const wamid = st.id;
        const m = st.status ? mapa[st.status] : undefined;
        if (!wamid || !m) continue;
        // monótono: sólo sube desde los estados permitidos (no degrada leida→delivered)
        const { data } = await db.from('notificacion_entrega')
          .update({
            estado: m.estado,
            actualizado_en: new Date().toISOString(),
            cerrado_en: new Date().toISOString(),
            ...(st.status === 'failed' ? { motivo: `meta_failed:${JSON.stringify(st.errors ?? null).slice(0, 200)}` } : {}),
          })
          .eq('proveedor_msg_id', wamid)
          .in('estado', m.desde)
          .select('id');
        if (data && data.length) tocadas += data.length;
      }
    }
  }

  // Meta exige 200 o reintenta. Devolvemos 200 aunque no hayamos encontrado la
  // entrega (un wamid que no es nuestro no es un error del webhook).
  return Response.json({ ok: true, tocadas });
});
