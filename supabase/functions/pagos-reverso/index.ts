// ═══════════════════════════════════════════════════════════════════════════
// S105-D · EL REVERSO DE NUVEI — la llamada al proveedor
//
// 🔴 NO ES UNA PUERTA DEL CLIENTE. La llama una mano (soporte) o el founder,
//    con el secreto de despacho. *Un endpoint que devuelve plata y que puede
//    invocar cualquiera con sesión es un endpoint que devuelve la plata de
//    otro.* `LETRA_SALDO` rige: la vía automática de una cancelación es el
//    SALDO; el reverso al medio original es **camino manual**.
//
// ── LO QUE VA POR CONSTRUCCIÓN, no por comentario ──────────────────────────
//
// ① **NO SE MANDA `order.amount`.** Su doc dice que sin ese campo refunda el
//    TOTAL. Así *«en Ecuador el reverso es siempre total»* queda expresado en
//    la forma del request: **no hay dónde poner un parcial.**
//    *Un comentario que dice «no mandar parcial» se puede ignorar; un cuerpo
//    que no tiene el campo, no.*
//
// ② **`more_info: true` SIEMPRE.** Sin él la respuesta trae sólo
//    `status`/`detail`; con él vienen `authorization_code`, `refund_amount`,
//    `status_detail` y el id — **que es exactamente lo que hay que persistir y
//    lo que la certificación pide.** *Un campo opcional que trae lo que
//    necesitamos no es opcional para nosotros.*
//
// ③ **`failure` del carrier NO es final: se reintenta, hasta 5.** Dato de su
//    doc. *Tratar un fallo de carrier como veredicto deja plata sin devolver
//    por una condición transitoria — y del lado del cliente eso no se
//    distingue de que no quisimos devolverla.*
//
// ④ **`status_detail 34` (PARCIAL) puede llegar aunque nunca lo pidamos** —
//    está en el ejemplo de respuesta de su doc. No se descarta ni se traduce a
//    éxito: se persiste y **la RPC lo marca `reverso_fallido`**, que es un
//    hallazgo de soporte. ⚠️ **Qué hace el ACTUADOR con un 34 es de A**
//    (`D-923`), y se declara acá para que no quede sin dueño.
//
// ⑤ `reference_label` es de QR Colombia. **No aplica** y no se manda.
//
// ✅ EL SUJETO SÍ SE MUEVE — y esta edge **no lo hace ni tiene que saberlo.**
//    `D-923` la cerró A con un trigger `AFTER UPDATE OF estado` sobre
//    `pagos_intentos`: al entrar a `reversado` se llama a
//    `mover_sujeto_por_reverso`. Nuestra RPC hace ese UPDATE ⇒ se dispara solo.
//
//    🔴 ESTA LÍNEA ES UNA CORRECCIÓN, NO UNA DESCRIPCIÓN NUEVA: hasta la cura
//    de A la respuesta devolvía `sujeto_movido: false` **cableado**, y el día
//    que el trigger nació **pasó a mentir** — le decía a soporte que moviera a
//    mano algo ya movido. *Una constante que afirma sobre el mundo se vuelve
//    falsa el día que el mundo cambia, y no lo avisa: no hay typecheck para
//    una verdad vencida.*
//    ⇒ El campo ahora se **deriva de lo que la RPC contesta**, jamás se afirma.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { encodeHex } from 'jsr:@std/encoding/hex';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const APP_CODE = Deno.env.get('NUVEI_APP_CODE_SERVER') ?? '';
const APP_KEY = Deno.env.get('NUVEI_APP_KEY_SERVER') ?? '';
const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const DESPACHO = Deno.env.get('DESPACHO_SECRET') ?? '';

/* 🔴 QA Y PDN SON HOSTS DISTINTOS y el ambiente lo decide un secret, jamás una
   bandera del request — misma ley que el cobro y que el buzón. */
const BASE = AMBIENTE === 'produccion'
  ? 'https://ccapi.paymentez.com'
  : 'https://ccapi-stg.paymentez.com';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ventana de 15 s ⇒ se genera en el momento, jamás se cachea.
 *  **Copia exacta del mecanismo vivo de `pagos-cobro`**, no una variante. */
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

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, codigo: 'metodo_no_permitido' }, 405);

  /* La puerta: sólo la casa. Mismo guard que el barrido y los despachadores. */
  if (!DESPACHO) return json({ ok: false, codigo: 'servidor_sin_configurar' }, 500);
  if (req.headers.get('x-despacho-secret') !== DESPACHO) {
    return json({ ok: false, codigo: 'no_autorizado' }, 401);
  }
  if (!SUPABASE_URL || !SERVICE_ROLE || !APP_CODE || !APP_KEY) {
    return json({ ok: false, codigo: 'servidor_sin_configurar' }, 500);
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const intentoId = typeof body.intento_id === 'string' ? body.intento_id : '';
  if (!UUID_RE.test(intentoId)) return json({ ok: false, codigo: 'intento_id_invalido' }, 400);

  /* 🔴 EL MONTO NI SIQUIERA SE ACEPTA. Rechazarlo en vez de ignorarlo: si se
     ignora, el llamador se cree con la facultad de pedir un parcial y el día
     que el server la respete, la pide. *El estado malo es inexpresable, no
     sólo desatendido.* (misma ley que la puerta de DeUna con `monto`) */
  if ('monto' in body || 'amount' in body) {
    return json({ ok: false, codigo: 'monto_no_se_recibe',
                  nota: 'el reverso en Ecuador es total: no hay parcial que pedir' }, 400);
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  /* Se lee el intento para sacar SU transaction_id. **Jamás viene del
     llamador**: si viniera, se podría reversar la transacción de otro. */
  const { data: it, error: eI } = await db.from('pagos_intentos')
    .select('id, proveedor, estado, proveedor_transaction_id')
    .eq('id', intentoId).maybeSingle();
  if (eI) return json({ ok: false, codigo: 'no_se_pudo_leer' }, 500);
  if (!it) return json({ ok: false, codigo: 'intento_no_existe' }, 404);
  if (it.proveedor !== 'nuvei') {
    /* 🔴 El cruce de rieles, cortado acá también y no sólo en la RPC: esta
       edge habla con el host de Nuvei. *Los dos rieles ya se confundieron dos
       veces en esta mesa, y una casi toca el punto de venta de DeUna.* */
    return json({ ok: false, codigo: 'proveedor_no_es_nuvei', proveedor: it.proveedor }, 409);
  }
  if (!it.proveedor_transaction_id) {
    return json({ ok: false, codigo: 'sin_transaction_id' }, 409);
  }

  /* ═══ 🔴 LA VENTANA SE PREGUNTA **ANTES** DE TOCAR PLATA ═══════════════
     Esto estaba DESPUÉS del refund: se le pedía la devolución al proveedor y
     recién al registrarla se miraba si la ventana estaba abierta. *Si el
     proveedor aceptaba fuera de nuestra ventana, la plata volvía y el registro
     rebotaba: **plata devuelta sin rastro nuestro.***

     Que hoy sea inalcanzable —porque el proveedor probablemente rechace
     igual— **no lo vuelve seguro: lo vuelve seguro POR EL PROVEEDOR**, y eso es
     depender de un tercero para nuestra propia integridad.

     🔴 Es la MISMA función que usa el registro, no una segunda opinión: dos
     lugares que calculan la misma ventana se desincronizan el día que una se
     corrija — y acá las ventanas ya difieren por riel. */
  const { data: puede, error: ePv } = await db.rpc('puede_reversar_nuvei', {
    p_intento_id: intentoId,
  });
  if (ePv) return json({ ok: false, codigo: 'no_se_pudo_verificar_ventana' }, 500);
  if ((puede as Record<string, unknown>)?.ok !== true) {
    /* Se corta SIN haber llamado al proveedor: no hay plata en movimiento. */
    return json({ ok: false, ...(puede as Record<string, unknown>) }, 409);
  }

  // ── LA LLAMADA, con su política de reintento ──────────────────────────────
  const cuerpo = {
    transaction: { id: it.proveedor_transaction_id },
    more_info: true,   // ② no es opcional para nosotros
    // ① sin `order.amount` ⇒ el proveedor refunda el TOTAL.
  };

  const MAX = 5;                       // ③ dato de su doc
  let intento = 0;
  let status = 0;
  let crudo = '';
  let js: Record<string, unknown> = {};

  while (intento < MAX) {
    intento++;
    try {
      const r = await fetch(`${BASE}/v2/transaction/refund/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Auth-Token': await authToken() },
        body: JSON.stringify(cuerpo),
      });
      status = r.status;
      crudo = await r.text();
      try { js = JSON.parse(crudo); } catch { js = {}; }
    } catch (e) {
      /* No pudimos preguntar ≠ el reverso falló. Se reintenta. */
      console.error('[reverso] la llamada no respondio', String(e).slice(0, 200));
      status = 0; js = {};
    }

    const tx = (js.transaction ?? {}) as Record<string, unknown>;
    const st = String(tx.status ?? js.status ?? '').toLowerCase();

    /* ③ `failure` del carrier ⇒ TRANSITORIO, hasta 5 veces. Cualquier otro
       desenlace —éxito o rechazo con motivo— corta el bucle: reintentar un
       rechazo definitivo no lo vuelve aceptación. */
    const transitorio = status === 0 || status >= 500 || st === 'failure';
    if (!transitorio) break;
    if (intento < MAX) await dormir(400 * intento);   // espaciado creciente
  }

  const tx = (js.transaction ?? {}) as Record<string, unknown>;
  const statusProveedor = String(tx.status ?? js.status ?? '');
  const statusDetail = String(tx.status_detail ?? '');
  const reversoId = String(tx.id ?? '');
  const refundAmount = Number(tx.refund_amount ?? tx.amount ?? 0);
  const authCode = String(tx.authorization_code ?? '');

  const exito = status >= 200 && status < 300
    && statusProveedor.toLowerCase() !== 'failure';

  if (!exito) {
    /* 🔴 NO se persiste como reversado lo que no se reversó. Se devuelve el
       crudo para que soporte lo lea, **y el intento queda intacto**. */
    return json({
      ok: false, codigo: 'reverso_no_confirmado',
      intentos: intento, http: status,
      status_proveedor: statusProveedor || null,
      crudo: crudo.slice(0, 1200),
    }, 502);
  }

  // ── LA PERSISTENCIA, con su ventana y su candado, en la base ──────────────
  const { data: reg, error: eR } = await db.rpc('registrar_reverso_nuvei', {
    p_intento_id: intentoId,
    p_reverso_id: reversoId || null,
    p_status_detail: statusDetail || null,
    p_refund_amount: Number.isFinite(refundAmount) ? refundAmount : null,
    p_auth_code: authCode || null,
  });

  if (eR) {
    /* 🔴 EL PEOR ESTADO POSIBLE Y SE DICE CON TODAS LAS LETRAS: el proveedor
       YA devolvió la plata y nosotros no pudimos registrarlo. *No se reintenta
       el refund —eso pediría un segundo reverso— y no se calla.* */
    console.error('[reverso] 🔴 REFUND HECHO Y NO REGISTRADO', intentoId, eR.message);
    return json({
      ok: false, codigo: 'reversado_sin_registrar',
      nota: 'el proveedor devolvio la plata y la persistencia fallo: caso de soporte',
      reverso_id: reversoId, crudo: crudo.slice(0, 1200), causa: eR.message,
    }, 500);
  }

  /* ¿El trigger movió el sujeto? Se va a mirar. Si la lectura misma falla no
     se inventa un veredicto: queda `null`, que la respuesta traduce a
     «no movido» — el lado conservador, el que manda a soporte a revisar. */
  const { data: post } = await db.from('pagos_intentos')
    .select('payload_crudo').eq('id', intentoId).maybeSingle();
  const sujetoNoMovido =
    ((post?.payload_crudo ?? {}) as Record<string, unknown>).sujeto_no_movido ?? null;

  return json({
    ok: true,
    registro: reg,
    intentos: intento,
    status_detail: statusDetail || null,
    refund_amount: Number.isFinite(refundAmount) ? refundAmount : null,
    /* 🔴 MEDIDO, NO AFIRMADO. El trigger de A mueve el sujeto y **atrapa su
       propio fallo a propósito** —para no revertir el registro de un reverso
       que ya ocurrió— dejándolo escrito en `payload_crudo.sujeto_no_movido`.
       ⇒ La única forma honesta de contestar esto es ir a mirar. Un `true`
       cableado sería la misma clase de mentira que era el `false`. */
    sujeto_movido: sujetoNoMovido === null,
    ...(sujetoNoMovido ? { sujeto_no_movido: sujetoNoMovido } : {}),
    crudo: crudo.slice(0, 1200),
  });
});
