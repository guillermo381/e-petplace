// ═══════════════════════════════════════════════════════════════════════════
// S101-B · FASE 5 · BORRAR UN MEDIO DE PAGO
//
// 🔴 ES UN ACTO SERVER-SIDE, y la letra §7 lo dice por una razón concreta:
//    **el endpoint del proveedor Y la fila local.** La tabla tiene policy de
//    DELETE —el dueño puede borrar la suya, *quitar una tarjeta es derecho de
//    la persona*— pero borrar solo la fila **deja el token vivo en Nuvei**.
//    *Una tarjeta que la familia cree borrada y que el proveedor todavía puede
//    cobrar no está borrada: está escondida.*
//
// 🔴 EL ORDEN IMPORTA: primero el proveedor, después nosotros. Si el proveedor
//    falla, **la fila local NO se toca** y la familia lo ve como «no pudimos».
//    Al revés —borrar local primero— dejaría un token huérfano que nadie puede
//    volver a encontrar para borrarlo.
//
// 🔴 Y EL BORDE QUE LA LETRA MANDA ENSAYAR, declarado acá: borrar con un intento
//    en vuelo. La compuerta `token_ausente` del cobro es la que tiene que
//    hablar en el próximo intento — no un error crudo.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createHash } from 'node:crypto';

const APP_CODE = Deno.env.get('NUVEI_APP_CODE_SERVER') ?? '';
const APP_KEY = Deno.env.get('NUVEI_APP_KEY_SERVER') ?? '';
const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const BASE = AMBIENTE === 'produccion'
  ? 'https://ccapi.paymentez.com'
  : 'https://ccapi-stg.paymentez.com';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

function authToken(): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  return btoa(`${APP_CODE};${ts};${createHash('sha256').update(APP_KEY + ts).digest('hex')}`);
}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, codigo: 'metodo' }, 405);

  /* 🔴 LA SESIÓN AUTORIZA, y su ausencia se distingue de su ilegibilidad:
     «sin sesión» es 401 del cliente; «no pude verificarla» es 503 nuestro.
     *Mezclarlos le diría a alguien logueado que se loguee.* */
  const jwt = (req.headers.get('authorization') ?? '').replace(/^Bearer /i, '');
  if (!jwt) return json({ ok: false, codigo: 'sin_sesion' }, 401);

  let uid: string;
  try {
    const { data, error } = await admin.auth.getUser(jwt);
    if (error || !data.user) return json({ ok: false, codigo: 'sin_sesion' }, 401);
    uid = data.user.id;
  } catch {
    return json({ ok: false, codigo: 'sesion_no_verificable' }, 503);
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ ok: false, codigo: 'datos_invalidos' }, 400); }
  const tarjetaId = typeof body.tarjeta_id === 'string' ? body.tarjeta_id : null;
  if (!tarjetaId) return json({ ok: false, codigo: 'datos_invalidos' }, 400);

  /* 🔴 PERTENENCIA. Solo ids del cliente, y el servidor resuelve el resto: el
     token **jamás viaja desde el teléfono**. */
  const { data: tj, error: e1 } = await admin
    .from('tarjetas_guardadas')
    .select('id, token, proveedor_uid, user_id')
    .eq('id', tarjetaId)
    .eq('user_id', uid)
    .maybeSingle();
  if (e1) return json({ ok: false, codigo: 'no_pudimos_leer' }, 503);
  if (!tj) return json({ ok: false, codigo: 'no_es_tu_tarjeta' }, 404);

  // ── ① EL PROVEEDOR PRIMERO ────────────────────────────────────────────────
  if (tj.proveedor_uid) {
    try {
      const r = await fetch(`${BASE}/v2/card/delete/`, {
        method: 'POST',
        headers: { 'Auth-Token': authToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: { token: tj.token }, user: { id: tj.proveedor_uid } }),
      });
      if (!r.ok) {
        const crudo = await r.text().catch(() => '');
        console.error('[borrar-tarjeta] el proveedor rechazó', r.status, crudo.slice(0, 300));
        /* 🔴 La fila local NO se toca. *Borrarla igual dejaría un token vivo que
           nadie puede volver a encontrar para borrar.* */
        return json({ ok: false, codigo: 'proveedor_rechazo' }, 502);
      }
    } catch (e) {
      console.error('[borrar-tarjeta] no pude hablar con el proveedor', e);
      return json({ ok: false, codigo: 'proveedor_sin_respuesta' }, 503);
    }
  }
  /* Sin `proveedor_uid` no hay a quién pedirle el borrado — son las tarjetas
     anteriores a la columna. Se borra la fila local y **se dice en el log**:
     *el token queda vivo allá, y eso es un hecho que alguien tiene que poder
     encontrar después.* */
  else console.warn('[borrar-tarjeta] tarjeta sin proveedor_uid: solo se borra local', tarjetaId);

  // ── ② NOSOTROS DESPUÉS ────────────────────────────────────────────────────
  const { error: e2 } = await admin.from('tarjetas_guardadas').delete().eq('id', tarjetaId).eq('user_id', uid);
  if (e2) {
    console.error('[borrar-tarjeta] el proveedor borró y nosotros no', e2);
    return json({ ok: false, codigo: 'borrado_a_medias' }, 500);
  }

  return json({ ok: true });
});
