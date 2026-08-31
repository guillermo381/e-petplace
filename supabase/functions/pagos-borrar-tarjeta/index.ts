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
  /* 🔴 S107 · D-922 — SE ACEPTA `token` ADEMÁS DE `tarjeta_id`, y hay que decir
     por qué no rompe la decisión de al lado.

     ⚠️ EL CHOQUE, declarado: el comentario de abajo dice *«el token jamás viaja
     desde el teléfono»*, y es una decisión de seguridad, no un detalle. Sigue
     rigiendo para el camino normal — con `tarjeta_id`, el token se resuelve del
     servidor y nada cambia.

     Pero con `card/list` como fuente hay tarjetas **sin fila local**, y ésas no
     tienen `tarjeta_id` que mandar. *Exigirlo las volvería imborrables — que es
     justo el defecto que `D-922` viene a cerrar.*

     🔑 LA PROPIEDAD SE CONSERVA PORQUE **NO SE LE CREE AL CLIENTE**: si viene
     `token`, no se borra por confianza — se le pregunta a `card/list` por los
     uid de ESTA persona y sólo se sigue si el token aparece ahí. *Un token que
     el teléfono nombra no es un token que el teléfono demuestra tener.* */
  const tokenPedido = typeof body.token === 'string' && body.token.trim()
    ? body.token.trim() : null;
  if (!tarjetaId && !tokenPedido) return json({ ok: false, codigo: 'datos_invalidos' }, 400);

  /* 🔴 PERTENENCIA. Solo ids del cliente, y el servidor resuelve el resto: el
     token **jamás viaja desde el teléfono**. */
  const q = admin.from('tarjetas_guardadas')
    .select('id, token, proveedor_uid, user_id')
    .eq('user_id', uid);
  const { data: tj, error: e1 } = await (tarjetaId
    ? q.eq('id', tarjetaId)
    : q.eq('token', tokenPedido as string)).maybeSingle();
  if (e1) return json({ ok: false, codigo: 'no_pudimos_leer' }, 503);
  /* 🔴 SIN FILA LOCAL NO ES «NO ES TUYA»: puede ser una que sólo vive en el
     proveedor — el caso que `D-922` existe para reparar. Se sigue **sólo** si
     vino por token, y su pertenencia se prueba abajo contra `card/list`. */
  if (!tj && !tokenPedido) return json({ ok: false, codigo: 'no_es_tu_tarjeta' }, 404);

  /* ── A′ · EL FRENO DE LA GUARDERÍA (firma del founder, 28-ago) ────────────
     🔴 La FK `guarderia_suscripciones.tarjeta_id` es **`NO ACTION`** —la única
     de las cuatro que no es `SET NULL`—, así que el DELETE local rebotaría con
     un error de FK y la app diría un genérico.

     Pero el daño real no es el rebote feo: **con `card/delete` la tarjeta se
     borraría del proveedor igual**, y quedaría un plan de guardería cobrando
     contra un token muerto. *Nadie se enteraría hasta el día del cobro.*

     ⇒ Se frena ANTES de tocar al proveedor, y el rebote **dice la causa**
     (`D-961` del otro lado del cable: un rebote genérico manda a reintentar
     para siempre). La voz vive en la app y manda a soporte —que existe,
     `/cuenta/ayuda` con WhatsApp— y **no promete cambiar el medio**, porque ese
     flujo todavía no existe. *Prometer una acción que no existe es peor que
     frenar sin salida.* */
  if (tj) {
    const { data: susc } = await admin.from('guarderia_suscripciones')
      .select('id').eq('tarjeta_id', tj.id).neq('estado', 'cancelada').limit(1);
    if (susc && susc.length > 0) {
      return json({ ok: false, codigo: 'tarjeta_con_plan_activo' }, 409);
    }
  }

  // ── ① EL PROVEEDOR PRIMERO ────────────────────────────────────────────────
  /* ── QUÉ SE LE PIDE AL PROVEEDOR ─────────────────────────────────────────
     Con fila local: lo de siempre, resuelto del servidor.
     Sin fila local (sólo vive en Nuvei): **el uid sale del estable de esta
     persona, jamás del cuerpo del request** — el teléfono nombra el token, no
     elige de quién es. */
  let uidBorrar: string | null = tj?.proveedor_uid ?? null;
  let tokenBorrar: string | null = tj?.token ?? null;

  if (!tj && tokenPedido) {
    const { data: uidEstable } = await admin.rpc('obtener_uid_proveedor', {
      p_user_id: uid, p_proveedor: 'nuvei',
    }).then((r) => r, () => ({ data: null }));
    if (typeof uidEstable !== 'string' || !uidEstable) {
      return json({ ok: false, codigo: 'sin_uid_estable' }, 409);
    }
    /* 🔴 LA PERTENENCIA SE PRUEBA, NO SE ACEPTA. Se le pregunta al proveedor
       por las tarjetas de ESTE uid y sólo se sigue si el token está ahí.
       *Sin esto, cualquiera con una sesión podría pedir el borrado de un token
       ajeno con sólo nombrarlo.* Y si no se pudo preguntar **no se borra**:
       ante la duda sobre de quién es algo, la respuesta es no. */
    let pertenece = false;
    try {
      const r = await fetch(`${BASE}/v2/card/list?uid=${encodeURIComponent(uidEstable)}`, {
        headers: { 'Content-Type': 'application/json', 'Auth-Token': authToken() },
      });
      if (!r.ok) return json({ ok: false, codigo: 'no_pudimos_verificar' }, 503);
      const js = await r.json().catch(() => ({}));
      const cards = Array.isArray(js?.cards) ? js.cards : [];
      pertenece = cards.some((c: Record<string, unknown>) => String(c.token ?? '') === tokenPedido);
    } catch {
      return json({ ok: false, codigo: 'no_pudimos_verificar' }, 503);
    }
    if (!pertenece) return json({ ok: false, codigo: 'no_es_tu_tarjeta' }, 404);
    uidBorrar = uidEstable;
    tokenBorrar = tokenPedido;
  }

  if (uidBorrar && tokenBorrar) {
    try {
      const r = await fetch(`${BASE}/v2/card/delete/`, {
        method: 'POST',
        headers: { 'Auth-Token': authToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: { token: tokenBorrar }, user: { id: uidBorrar } }),
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
  /* 🔴 SIN FILA LOCAL NO HAY NADA QUE BORRAR ACÁ, y **eso es un éxito**: la
     tarjeta era del proveedor y del proveedor se fue. *Tratar la ausencia como
     fallo diría «borrado a medias» sobre un borrado completo.* */
  const { error: e2 } = tj
    ? await admin.from('tarjetas_guardadas').delete().eq('id', tj.id).eq('user_id', uid)
    : { error: null };
  if (e2) {
    console.error('[borrar-tarjeta] el proveedor borró y nosotros no', e2);
    return json({ ok: false, codigo: 'borrado_a_medias' }, 500);
  }

  return json({ ok: true });
});
