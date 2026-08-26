// ═══════════════════════════════════════════════════════════════════════════
// S105-D · LAS TARJETAS QUE EL PROVEEDOR TIENE POR VÁLIDAS
//
// Contrato: `docs/CONTRATO_CARD_LIST_NUVEI.md` (medición real de staging,
// 25-ago-2026). Diseño firmado en `D-922`. **Acá no se decide nada nuevo.**
//
//   GET https://ccapi-stg.paymentez.com/v2/card/list?uid=<proveedor_uid>
//   → { result_size, cards: [{ holder_name, number, bin, type,
//       transaction_reference, status, token, expiry_month, expiry_year }] }
//
// ⚠️ El dominio dice `paymentez` porque es la plataforma que Nuvei adquirió.
//    **Es el mismo proveedor** — quien lo «corrija» rompe la llamada, mismo
//    cuidado que el typo `idTransacionReference` de DeUna.
//
// ── LAS CUATRO REGLAS FIRMADAS, y ninguna se re-decide acá ─────────────────
//
// ① **Se consulta al abrir el listado, NO se cachea.** *Una lista de medios de
//    pago cacheada es una lista que ofrece una tarjeta que el banco ya rechazó.*
//
// ② 🔴 **FAIL-OPEN si el proveedor no responde**, con la voz que lo dice.
//    *Fail-closed dejaría a alguien sin poder pagar por un tercero lento.*
//    **El peor caso de mostrar sin verificar es el estado de HOY; el de no
//    mostrar nada es peor que hoy.** Por eso el degradado devuelve la lista
//    local y lo declara en `verificado: false`.
//
// ③ **El `status` va EN VUELO: no nace columna.** *Un estado del proveedor
//    guardado en nuestra tabla es un estado que envejece sin avisar* — y el
//    día que difieran, nadie sabría cuál manda.
//
// ④ **Filtro BINARIO: sólo `valid`.** Lo que no lo esté **no se lista y no se
//    reactiva: se agrega de nuevo.** *El caso que lo motiva, del founder:
//    alguien que abre el alta y no completa el OTP no debería ver esa tarjeta.*
//
// ── 🔴 POR QUÉ CONSULTA VARIOS uid Y NO UNO — medido, no elegido ───────────
//
// `D-921`: hoy el `uid` ante el proveedor es **el id del alta**, así que un
// usuario tiene **tantos uid como altas**. Medido al escribir esto: **8
// tarjetas · 8 uid distintos · 1 usuario.**
//
// ⇒ **Preguntar por un solo uid devolvería UNA tarjeta y ocultaría siete.**
// Se consulta por **todos los uid que ese usuario tiene**, más el **uid
// estable** cuando exista (`obtener_uid_proveedor`).
//
// ✅ **Y esto se achica solo:** cuando `D-921` cure, los uid nuevos serán uno
// por persona y el parque viejo se extingue ⇒ **la misma edge pasa a hacer una
// sola llamada sin cambiar una línea.** *No es un workaround: es el mismo
// algoritmo sobre un parque que va a dejar de estar disperso.*
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { encodeHex } from 'jsr:@std/encoding/hex';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const APP_CODE = Deno.env.get('NUVEI_APP_CODE_SERVER') ?? '';
const APP_KEY = Deno.env.get('NUVEI_APP_KEY_SERVER') ?? '';
const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';

const BASE = AMBIENTE === 'produccion'
  ? 'https://ccapi.paymentez.com'
  : 'https://ccapi-stg.paymentez.com';

/** Tope de uid por consulta. Con `D-921` curado esto vale 1 y sobra.
 *  Mientras tanto acota el fan-out **y se DECLARA si recorta** (§no-silent-caps). */
const TOPE_UID = 12;

async function authToken(): Promise<string> {
  const ts = Math.floor(Date.now() / 1000);
  const h = encodeHex(await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(`${APP_KEY}${ts}`)));
  return btoa(`${APP_CODE};${ts};${h}`);
}

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, codigo: 'metodo_no_permitido' }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE || !APP_CODE || !APP_KEY) {
    return json({ ok: false, codigo: 'servidor_sin_configurar' }, 500);
  }

  // ── LA SESIÓN ES LA AUTORIZACIÓN — el uid jamás viene del cliente ─────────
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return json({ ok: false, codigo: 'sin_sesion' }, 401);
  const comoUsuario = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } }, auth: { persistSession: false },
  });
  const { data: u, error: eU } = await comoUsuario.auth.getUser();
  /* «No hay sesión» y «no se pudo verificar» son cosas distintas: tratarlas
     igual esconde una caída del proveedor de auth detrás de un 401 del usuario. */
  if (eU) return json({ ok: false, codigo: 'sesion_no_verificable' }, 503);
  if (!u?.user) return json({ ok: false, codigo: 'sin_sesion' }, 401);
  const userId = u.user.id;

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // ── NUESTRAS TARJETAS — la lista local, que es el piso del fail-open ──────
  const { data: locales, error: eT } = await db.from('tarjetas_guardadas')
    /* 🔴 `creada_en`, no `creado_en` — medido: la primera versión inventó el
       nombre y el `select` entero rebotaba con `no_se_pudo_leer`, que es un
       código honesto y **no dice cuál columna**. *Un error de lectura que no
       nombra el campo obliga a medir el esquema, que es lo que había que hacer
       antes de escribirlo.*
       Y se filtra por PROVEEDOR: esta edge habla con Nuvei, y una tarjeta de
       otro riel no tiene `card/list` que consultar. */
    .select('id, token, proveedor_uid, marca, bin, ultimos4, alias, creada_en, estado')
    .eq('user_id', userId)
    .eq('proveedor', 'nuvei');
  if (eT) return json({ ok: false, codigo: 'no_se_pudo_leer' }, 500);

  const tarjetas = locales ?? [];
  if (tarjetas.length === 0) {
    return json({ ok: true, verificado: true, tarjetas: [], uid_consultados: 0 });
  }

  /* Los uid a preguntar: los de las tarjetas + el ESTABLE si ya existe.
     El estable va aunque no tenga tarjetas todavía: es el que va a traerlas
     cuando `D-921` cure. */
  const { data: uidEstable } = await db.rpc('obtener_uid_proveedor', {
    p_user_id: userId, p_proveedor: 'nuvei',
  }).then((r) => r, () => ({ data: null }));

  const uids = [...new Set([
    ...(typeof uidEstable === 'string' && uidEstable ? [uidEstable] : []),
    ...tarjetas.map((t) => String(t.proveedor_uid ?? '')).filter(Boolean),
  ])];
  const uidsAPreguntar = uids.slice(0, TOPE_UID);
  /* 🔴 SI SE RECORTA, SE DICE. *Un tope silencioso se lee como «esto es todo»
     cuando es «esto es lo que miré».* */
  const recortados = uids.length - uidsAPreguntar.length;

  // ── LA CONSULTA AL PROVEEDOR ─────────────────────────────────────────────
  /** token → status, según el proveedor. */
  const estadoPorToken = new Map<string, string>();
  let huboRespuesta = false;
  let fallos = 0;

  for (const uid of uidsAPreguntar) {
    try {
      const r = await fetch(`${BASE}/v2/card/list?uid=${encodeURIComponent(uid)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Auth-Token': await authToken() },
      });
      if (!r.ok) { fallos++; continue; }
      const js = await r.json().catch(() => ({}));
      const cards = Array.isArray(js?.cards) ? js.cards : [];
      huboRespuesta = true;
      for (const c of cards) {
        const tk = String((c as Record<string, unknown>).token ?? '');
        if (tk) estadoPorToken.set(tk, String((c as Record<string, unknown>).status ?? ''));
      }
    } catch (e) {
      fallos++;
      console.error('[tarjetas] card/list no respondio', uid.slice(0, 8), String(e).slice(0, 120));
    }
  }

  /* ② 🔴 FAIL-OPEN, Y ES DECISIÓN FIRMADA, NO DESCUIDO.
     Si NINGUNA consulta respondió, se devuelve la lista local **entera** con
     `verificado: false`, para que la superficie lo diga con voz.
     *Dejar a alguien sin poder pagar porque un tercero está lento es peor que
     el estado de hoy — y el estado de hoy es exactamente mostrar sin
     verificar.* */
  if (!huboRespuesta) {
    return json({
      ok: true,
      verificado: false,
      motivo: 'el proveedor no respondio: se muestran las tarjetas sin verificar',
      uid_consultados: uidsAPreguntar.length,
      fallos,
      tarjetas: tarjetas.map((t) => ({
        id: t.id, token: t.token, marca: t.marca, bin: t.bin,
        ultimos4: t.ultimos4, alias: t.alias,
        /* Sin veredicto del proveedor NO se inventa uno: `null` significa
           «no preguntamos», que es distinto de `valid`. */
        estado_proveedor: null,
      })),
    });
  }

  /* ④ FILTRO BINARIO: sólo `valid`. Lo que no lo esté **no se lista** — y no
     se reactiva: se agrega de nuevo. */
  const validas = tarjetas.filter((t) => estadoPorToken.get(String(t.token)) === 'valid');
  const ocultas = tarjetas.length - validas.length;

  return json({
    ok: true,
    verificado: true,
    /* Cuántos uid hizo falta preguntar: **con `D-921` curado esto vale 1**, y
       verlo bajar es la señal de que el parque viejo se extinguió. */
    uid_consultados: uidsAPreguntar.length,
    ...(recortados > 0 ? { uid_no_consultados: recortados } : {}),
    ...(fallos > 0 ? { uid_sin_respuesta: fallos } : {}),
    /* Cuántas se ocultaron y por qué: *un listado que encoge sin explicación
       se lee como que perdimos una tarjeta.* */
    ocultas_por_estado: ocultas,
    tarjetas: validas.map((t) => ({
      id: t.id, token: t.token, marca: t.marca, bin: t.bin,
      ultimos4: t.ultimos4, alias: t.alias,
      /* ③ EN VUELO: viaja en la respuesta y **no se persiste**. */
      estado_proveedor: 'valid',
    })),
  });
});
