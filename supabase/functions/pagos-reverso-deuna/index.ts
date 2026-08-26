// ═══════════════════════════════════════════════════════════════════════════
// S105-D · EL REVERSO DE DEUNA — la llamada al proveedor
//
// 🔴 NO ES UNA PUERTA DEL CLIENTE. La llama una mano (soporte) con el secreto
//    de despacho. `LETRA_SALDO` rige: la vía automática de una cancelación es
//    el SALDO; el reverso al medio original es **camino manual**.
//
// ── LOS TRES DELTAS CONTRA LA EDGE DE NUVEI, todos MEDIDOS hoy en QA ───────
//
// ① **VENTANA DE 24 HORAS**, no «mismo día». La decide la RPC —que es donde
//    tiene que vivir— y esta edge no la re-implementa. *Dos lugares que
//    calculan la misma ventana es cómo se desincronizan.*
//
// ② **`transactionReverseId` EXISTE Y ES DISTINTO del `transactionId`**
//    (medido: `efa88734-…` contra `89600c04-…`). Va a `proveedor_reverso_id`,
//    que en Nuvei quedaba redundante y acá guarda información nueva.
//
// ③ 🔴 **`status: true` NO ES EL DISCRIMINADOR — y esto es la razón de ser de
//    la verificación de abajo.** Medido dos veces contra QA:
//      · transacción **NO pagada** → `status:true` + *«The QR with id 4262774
//        has been successfully cleaned»* + **`transactionReverseId: null`**
//      · transacción **pagada**    → `status:true` + *«Refund executed
//        successfully for transferNumber 89600c04-…»* + **id presente**
//
//    ⇒ **el mismo `true` para «devolví la plata» y para «cancelé un QR que
//    nadie pagó».** Quien lo lea como éxito marca reversada una transacción
//    que nunca tuvo plata.
//
//    **Por eso esta edge NO persiste con la respuesta del refund: vuelve a
//    preguntar con `payment/info` y exige `REVERSED`.** Es la misma ley que el
//    buzón: *el webhook es señal, la consulta activa es la verdad.*
//
//    ✅ Y de paso quedó medido que **el refund NO toca el punto de venta**: su
//    `message` nombra la transacción, no el POS. *Eso confirma por medición lo
//    que el proveedor había dicho de palabra, y es lo que descongeló este
//    endpoint después de media jornada.*
//
// 🔴 NO MUEVE EL SUJETO — `D-923`, de A. La respuesta lo DICE.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const API_KEY = Deno.env.get('DEUNA_API_KEY') ?? '';
const API_SECRET = Deno.env.get('DEUNA_API_SECRET') ?? '';
const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const DESPACHO = Deno.env.get('DESPACHO_SECRET') ?? '';

/* El override es del simulador y en producción se ignora — misma ley que las
   otras tres piezas del riel. */
const OVERRIDE = Deno.env.get('DEUNA_BASE_URL') ?? '';
const BASE = AMBIENTE === 'produccion'
  ? 'https://apis-merchant.pdn.deunalab.com'
  : (OVERRIDE || 'https://apis-merchant.qa.deunalab.com');
const RUTA = '/merchant/v1/payment';   // sin `api/` — medido

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

const cabeceras = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
  'x-api-secret': API_SECRET,
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, codigo: 'metodo_no_permitido' }, 405);
  if (!DESPACHO) return json({ ok: false, codigo: 'servidor_sin_configurar' }, 500);
  if (req.headers.get('x-despacho-secret') !== DESPACHO) {
    return json({ ok: false, codigo: 'no_autorizado' }, 401);
  }
  if (!SUPABASE_URL || !SERVICE_ROLE || !API_KEY || !API_SECRET) {
    return json({ ok: false, codigo: 'servidor_sin_configurar' }, 500);
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const intentoId = typeof body.intento_id === 'string' ? body.intento_id : '';
  if (!UUID_RE.test(intentoId)) return json({ ok: false, codigo: 'intento_id_invalido' }, 400);

  /* El monto ni se acepta: el reverso es TOTAL. Rechazar en vez de ignorar —
     si se ignora, el llamador se cree con la facultad. */
  if ('monto' in body || 'amount' in body) {
    return json({ ok: false, codigo: 'monto_no_se_recibe',
                  nota: 'el reverso de DeUna es total: no hay parcial que pedir' }, 400);
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  /* El `transactionId` sale de NUESTRA fila, jamás del llamador: si viniera de
     afuera se podría reversar la transacción de otro. */
  const { data: it, error: eI } = await db.from('pagos_intentos')
    .select('id, proveedor, estado, proveedor_transaction_id')
    .eq('id', intentoId).maybeSingle();
  if (eI) return json({ ok: false, codigo: 'no_se_pudo_leer' }, 500);
  if (!it) return json({ ok: false, codigo: 'intento_no_existe' }, 404);
  if (it.proveedor !== 'deuna') {
    return json({ ok: false, codigo: 'proveedor_no_es_deuna', proveedor: it.proveedor }, 409);
  }
  if (!it.proveedor_transaction_id) {
    return json({ ok: false, codigo: 'sin_transaction_id' }, 409);
  }
  const txId = it.proveedor_transaction_id;

  /* ═══ 🔴 LA VENTANA (24 h) SE PREGUNTA ANTES DEL REFUND ════════════════
     Mismo defecto que su hermana de Nuvei y misma cura: preguntar antes de
     mover plata, con la MISMA función que usa el registro.
     *Acá la ventana es de 24 horas — no «mismo día», que es Nuvei— y por eso
     una copia del cálculo en la edge sería el lugar exacto donde se
     confundirían.* */
  const { data: puede, error: ePv } = await db.rpc('puede_reversar_deuna', {
    p_intento_id: intentoId,
  });
  if (ePv) return json({ ok: false, codigo: 'no_se_pudo_verificar_ventana' }, 500);
  if ((puede as Record<string, unknown>)?.ok !== true) {
    return json({ ok: false, ...(puede as Record<string, unknown>) }, 409);
  }

  // ── ① EL REFUND ───────────────────────────────────────────────────────────
  let crudoRefund = '';
  let refund: Record<string, unknown> = {};
  try {
    const r = await fetch(`${BASE}${RUTA}/refund`, {
      method: 'POST', headers: cabeceras,
      /* La MISMA pareja `idType` + id que el `info` — mismo contrato de
         identificación en las tres rutas (§2). */
      body: JSON.stringify({ idType: '0', idTransacionReference: txId }),
    });
    /* 🔴 SE PARSEA EL TEXTO COMPLETO Y RECIÉN DESPUÉS SE TRUNCA. Al revés
       costó la primera corrida del riel: la respuesta de `request` mide 7844
       bytes por el QR, el `slice` partía el JSON y un `catch` mudo convertía el
       truncado en «el proveedor no mandó los campos». */
    const texto = await r.text();
    try { refund = JSON.parse(texto); } catch { /* queda el crudo */ }
    crudoRefund = texto.slice(0, 2000);
    if (!r.ok) {
      return json({ ok: false, codigo: 'refund_rechazado',
                    http: r.status, crudo: crudoRefund }, 502);
    }
  } catch (e) {
    /* No pudimos pedir ≠ no se reversó. **No se marca nada**: el intento queda
       como estaba y se puede reintentar. */
    return json({ ok: false, codigo: 'sin_respuesta',
                  detalle: String(e).slice(0, 200) }, 504);
  }

  const reversoId = typeof refund.transactionReverseId === 'string'
    ? refund.transactionReverseId : null;

  /* ③ 🔴 ACÁ NO SE DECIDE CON `status`. Si no vino el id, lo que ocurrió fue
     una cancelación de QR sobre algo no pagado — y eso NO es un reverso.
     *Se corta antes de preguntar: sin id no hay nada que confirmar.* */
  if (!reversoId) {
    return json({
      ok: false, codigo: 'sin_transaction_reverse_id',
      nota: 'el proveedor no devolvio transactionReverseId: fue una cancelacion '
          + 'de QR, no un reverso. `status: true` vuelve igual en los dos casos.',
      crudo: crudoRefund,
    }, 409);
  }

  // ── ② LA VERDAD SE PREGUNTA, NO SE ASUME ─────────────────────────────────
  let estadoInfo = '';
  let montoInfo: number | null = null;
  let crudoInfo = '';
  try {
    const r2 = await fetch(`${BASE}${RUTA}/info`, {
      method: 'POST', headers: cabeceras,
      body: JSON.stringify({ idType: '0', idTransacionReference: txId }),
    });
    const t2 = await r2.text();
    let info: Record<string, unknown> = {};
    try { info = JSON.parse(t2); } catch { /* queda el crudo */ }
    crudoInfo = t2.slice(0, 2000);
    estadoInfo = String(info.status ?? '');
    const m = Number(info.amount ?? 0);
    montoInfo = Number.isFinite(m) ? m : null;
  } catch (e) {
    /* 🔴 EL PEOR ESTADO Y SE DICE: el refund YA salió y no pudimos confirmarlo.
       *No se reintenta el refund —eso pediría un segundo reverso— y no se
       marca de nuestro lado sin confirmación.* */
    return json({
      ok: false, codigo: 'reversado_sin_confirmar',
      nota: 'el refund se ejecuto y la consulta de confirmacion no respondio: '
          + 'caso de soporte, NO se reintenta el refund',
      reverso_id: reversoId, crudo: crudoRefund,
      detalle: String(e).slice(0, 200),
    }, 500);
  }

  // ── ③ LA PERSISTENCIA, con su ventana de 24 h en la base ─────────────────
  const { data: reg, error: eR } = await db.rpc('registrar_reverso_deuna', {
    p_intento_id: intentoId,
    p_reverso_id: reversoId,
    p_monto: montoInfo,
    p_estado_info: estadoInfo,
    p_crudo: { refund, info_estado: estadoInfo, ambiente: AMBIENTE },
  });

  if (eR) {
    console.error('[reverso-deuna] 🔴 REFUND HECHO Y NO REGISTRADO', intentoId, eR.message);
    return json({
      ok: false, codigo: 'reversado_sin_registrar',
      nota: 'el proveedor devolvio la plata y la persistencia fallo: soporte',
      reverso_id: reversoId, causa: eR.message, crudo: crudoRefund,
    }, 500);
  }

  return json({
    ok: true,
    registro: reg,
    reverso_id: reversoId,
    estado_info: estadoInfo,
    monto: montoInfo,
    /* Se repite acá lo que la RPC ya dice: quien llama a la edge no siempre
       lee el objeto anidado, y **el sujeto NO se movió** (`D-923`). */
    sujeto_movido: false,
    crudo_refund: crudoRefund,
    crudo_info: crudoInfo,
  });
});
