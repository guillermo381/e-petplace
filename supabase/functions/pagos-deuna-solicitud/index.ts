// ═══════════════════════════════════════════════════════════════════════════
// S103-D · `pagos-deuna-solicitud` — LA PUERTA DEL RIEL DEUNA
//
// La llama la APP con la sesión de la familia. Crea el intento, pide el código
// a DeUna y devuelve **el código de 6 dígitos con su vencimiento**.
//
// 🔴 ES LA HERMANA DE `pagos-cobro`, CON EL MISMO CONTRATO DE SEGURIDAD — y se
//    escribió leyendo su cuerpo, no de memoria:
//      ① la SESIÓN es la autorización (JWT del usuario, jamás un secreto que
//         una app publicada tendría que guardar);
//      ② 🔴 EL MONTO JAMÁS VIAJA DEL CLIENTE — sale del desglose congelado;
//      ③ pertenencia verificada, con la MISMA respuesta para «no existe» y «es
//         de otro» (si no, es un oráculo de compras ajenas);
//      ④ compuertas server-side;
//      ⑤ credenciales que jamás salen de acá;
//      ⑥ devuelve SEÑAL, jamás «pagado».
//
// 🔴 LA DIFERENCIA DE NATURALEZA (LETRA_DEUNA §1): Nuvei es PULL —debitamos una
//    tarjeta— y DeUna es PUSH: el cliente paga desde SU app. Por eso acá **no
//    hay tarjeta, no hay token y no hay OTP**, y la compuerta #5 de E3 (token
//    vigente) NO APLICA. Ninguna compuerta nueva nace.
//
// ⚠️ NO DESPLEGADA. `pointOfSale` sigue sin dato (S103-D §2ter) y el deploy
//    pide autorización del founder por tanda.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
/* El motivo del rechazo se lee de la forma REAL del error de DeUna, que viene
   anidado. Vive aparte para poder probarlo contra los errores grabados. */
import { motivoDeError } from './_motivo.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const API_KEY = Deno.env.get('DEUNA_API_KEY') ?? '';
const API_SECRET = Deno.env.get('DEUNA_API_SECRET') ?? '';
const POS = Deno.env.get('DEUNA_POINT_OF_SALE') ?? '';
const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';

/* 🔴 QA Y PDN SON HOSTS DISTINTOS Y EL AMBIENTE LO DECIDE UN SECRET, jamás una
   bandera del request. *Una bandera compartida entre la prueba y la plata es un
   solo error de configuración de distancia.* (misma ley que el buzón de Nuvei) */
/* 🔴 EL OVERRIDE EXISTE PARA EL SIMULADOR LOCAL, Y TIENE CANDADO:
   **en producción se ignora, siempre.** Sin ese candado, una variable de
   entorno mal puesta podría mandar cobros reales a un host que no es el
   proveedor. *Una perilla de pruebas que también funciona en producción no es
   una perilla de pruebas: es un agujero con buenas intenciones.* */
const OVERRIDE = Deno.env.get('DEUNA_BASE_URL') ?? '';
const BASE = AMBIENTE === 'produccion'
  ? 'https://apis-merchant.pdn.deunalab.com'
  : (OVERRIDE || 'https://apis-merchant.qa.deunalab.com');

/* 🔴 SIN EL `api/`. Medido contra QA: `/merchant/api/v1/payment/*` devuelve 404
   y `/merchant/v1/payment/*` responde. La doc del proveedor dice lo primero.
   *Un 404 acá sería indistinguible de «la transacción no existe», que es un
   caso de negocio real.* (S103-D §2) */
const RUTA = '/merchant/v1/payment';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, codigo: 'metodo_no_permitido' }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE || !API_KEY || !API_SECRET || !POS) {
    /* 🔴 EL POS ENTRA EN ESTE GUARD A PROPÓSITO. Sin él el proveedor rebota
       `Hierarchy tree parent not found`, y ese error se lee como un problema de
       la transacción y no como una configuración que falta. *Fallar temprano y
       con nombre propio vale más que fallar tarde con el nombre de otro.* */
    return json({ ok: false, codigo: 'servidor_sin_configurar' }, 500);
  }

  // ── ① LA SESIÓN ES LA AUTORIZACIÓN ────────────────────────────────────────
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return json({ ok: false, codigo: 'sin_sesion' }, 401);

  const comoUsuario = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } }, auth: { persistSession: false },
  });
  const { data: u, error: eU } = await comoUsuario.auth.getUser();
  // «No hay sesión» y «no se pudo verificar» son cosas distintas: tratarlas
  // igual esconde una caída del proveedor de auth detrás de un 401 del usuario.
  if (eU) return json({ ok: false, codigo: 'sesion_no_verificable' }, 503);
  if (!u?.user) return json({ ok: false, codigo: 'sin_sesion' }, 401);
  const userId = u.user.id;

  // ── El sujeto: compra O cita, EXACTAMENTE UNO ─────────────────────────────
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const compraId = typeof body.compra_id === 'string' ? body.compra_id : '';
  const citaId = typeof body.cita_id === 'string' ? body.cita_id : '';
  const hayCompra = UUID_RE.test(compraId);
  const hayCita = UUID_RE.test(citaId);
  if (hayCompra === hayCita) return json({ ok: false, codigo: 'datos_invalidos' }, 400);

  // 🔴 Si llega un monto, se RECHAZA en vez de ignorarse: ignorarlo dejaría
  //    vivo un cliente que se cree con esa facultad.
  if ('monto' in body || 'amount' in body || 'total' in body) {
    return json({ ok: false, codigo: 'monto_no_se_recibe' }, 400);
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // ── ③ PERTENENCIA ─────────────────────────────────────────────────────────
  let moneda = 'USD';
  if (hayCompra) {
    const { data: c } = await db.from('compras')
      .select('id, user_id, moneda').eq('id', compraId).maybeSingle();
    if (!c || c.user_id !== userId) return json({ ok: false, codigo: 'compra_no_existe' }, 409);
    moneda = c.moneda ?? 'USD';
  } else {
    const { data: cita } = await db.from('evento_cita_servicio')
      .select('id, mascota_id').eq('id', citaId).maybeSingle();
    if (!cita) return json({ ok: false, codigo: 'cita_no_existe' }, 409);
    /* La variante CON USUARIO EXPLÍCITO: acá corremos con service_role y
       `auth.uid()` es NULL — la original diría que no siempre. */
    const { data: puede } = await db.rpc('user_tiene_acceso_a_mascota_como', {
      p_user_id: userId, p_mascota_id: cita.mascota_id,
    });
    if (puede !== true) return json({ ok: false, codigo: 'cita_no_existe' }, 409);
  }

  // ── ② EL MONTO SALE DEL DESGLOSE CONGELADO ────────────────────────────────
  let monto = 0, pedidoDelIntento: string | null = null;
  if (hayCompra) {
    const { data: d } = await db.from('compra_desglose')
      .select('pedido_id, total').eq('compra_id', compraId);
    if (!d || d.length === 0) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    monto = d.reduce((a, r) => a + Number(r.total ?? 0), 0);
    pedidoDelIntento = d[0].pedido_id;
  } else {
    const { data: d } = await db.from('cita_desglose')
      .select('total, moneda').eq('cita_id', citaId).maybeSingle();
    // Fail-closed: sin desglose congelado no hay cobro. El desglose es lo que
    // se le prometió al cliente al reservar.
    if (!d) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    monto = Number(d.total ?? 0);
    moneda = d.moneda ?? 'USD';
  }
  const sujeto = hayCompra ? compraId : citaId;
  if (!(monto > 0)) return json({ ok: false, codigo: 'monto_invalido' }, 409);

  // ── ④ COMPUERTAS SERVER-SIDE ──────────────────────────────────────────────
  /* La #5 (token vigente) NO APLICA: en DeUna no hay tarjeta. Se declara en
     `no_evaluables` en vez de callarse — *una compuerta que no puede evaluar y
     calla es peor que una que falta: la que falta se nota* (§5.0). */
  if (hayCompra) {
    const { data: g } = await db.rpc('verificar_compuertas_pre_cobro',
      { p_compra_id: compraId, p_token: null });
    const gate = (g ?? {}) as Record<string, unknown>;
    if (gate.ok !== true) {
      return json({ ok: false, codigo: gate.codigo ?? 'no_se_pudo_completar',
                    no_evaluables: gate.no_evaluables ?? [] }, 409);
    }
  }

  // ── LA REFERENCIA CORTA ───────────────────────────────────────────────────
  /* 🔴 <= 20 chars: el UUID de 36 NO CABE (LETRA_DEUNA §4). La genera la base
     por secuencia ofuscada — única por construcción, y **se resuelve a intento
     POR TABLA, jamás parseando el string**. */
  const { data: ref, error: eR } = await db.rpc('deuna_nueva_referencia');
  if (eR || typeof ref !== 'string') return json({ ok: false, codigo: 'no_se_pudo_completar' }, 500);

  // ── EL INTENTO, ANTES DE DISPARAR ─────────────────────────────────────────
  /* Si pedimos el código y perdemos la respuesta, esta fila es lo único que
     prueba que se pidió. Sin ella el caso ④ (no llega ninguno) es indetectable:
     no habría contra qué barrer. */
  const { data: intento, error: eI } = await db.from('pagos_intentos').insert({
    pedido_id: pedidoDelIntento, cita_id: hayCita ? citaId : null,
    compra_id: hayCompra ? compraId : null,
    proveedor: 'deuna', forma: 'codigo_push', estado: 'iniciado',
    proveedor_referencia: sujeto, referencia_corta: ref,
    monto, moneda,
    clave_idempotencia: `deuna:${sujeto}:${ref}`,
    // La sesión ES el pagador (LETRA_SALDO §2). Explícito y jamás por DEFAULT
    // auth.uid(): acá corremos con service_role y ahí es NULL.
    pagador_user_id: userId, pagador_origen: 'sesion',
  }).select('id').single();
  if (eI) return json({ ok: false, codigo: 'no_se_pudo_completar' }, 500);

  // ── ⑤ LA SOLICITUD A DEUNA ────────────────────────────────────────────────
  /* 🔑 LA FORMA DEL CUERPO, MEDIDA CONTRA QA CAMPO POR CAMPO (S103-D §2bis):
       · `format: "5"` + `qrType: "dynamic"` ⇒ una llamada devuelve código, QR
         y deeplink. **v1 muestra SOLO el código** (firma ① del founder); QR y
         deeplink quedan en el crudo como reserva sin pantalla.
       · `detail` ≤ 50 y SIN dato personal (no se le muestra al cliente).
       · `expiredTime` es **NÚMERO**, jamás string.
       · 🔴 **`currency` NO DEBE EXISTIR** — rebota el request entero. Es el
         campo que cualquiera agregaría por analogía con Nuvei, que sí lo lleva. */
  let status = 0; let crudo = ''; let resp: Record<string, unknown> = {};
  try {
    const r = await fetch(`${BASE}${RUTA}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY, 'x-api-secret': API_SECRET,
      },
      body: JSON.stringify({
        pointOfSale: POS,
        qrType: 'dynamic',
        format: '5',
        amount: Number(monto.toFixed(2)),
        detail: `e-PetPlace ${sujeto.slice(0, 8)}`,   // ≤50, sin dato personal
        internalTransactionReference: ref,
      }),
    });
    status = r.status;
    crudo = (await r.text()).slice(0, 4000);
    try { resp = JSON.parse(crudo); } catch { /* el crudo queda igual */ }
  } catch (e) {
    /* Red caída ≠ rechazo. El intento queda en vuelo y el barrido lo encuentra
       — no se cierra como rechazado por no haber podido preguntar. */
    await db.from('pagos_intentos').update({
      motivo_rechazo: `red: ${String(e).slice(0, 200)}`,
    }).eq('id', intento.id);
    return json({ ok: false, codigo: 'sin_respuesta' }, 504);
  }

  const d = (resp.data ?? resp) as Record<string, unknown>;
  const txId = typeof d.transactionId === 'string' ? d.transactionId : null;
  const codigo = d.numericCode != null ? String(d.numericCode) : null;

  if (status < 200 || status >= 300 || !txId || !codigo) {
    /* 🔴 EL MOTIVO JAMÁS QUEDA NULL (L-316), con `http_<status>` de último
       recurso. Un rechazo sin motivo obliga a abrir el crudo, y nadie lo abre
       cuando hay una explicación plausible a mano. */
    const faltantes = [!txId && 'sin transactionId', !codigo && 'sin numericCode']
      .filter(Boolean).join(' · ');
    const motivo = [motivoDeError(resp, status), faltantes]
      .filter(Boolean).join(' | ').slice(0, 400);
    await db.from('pagos_intentos').update({
      estado: 'rechazado', motivo_rechazo: motivo,
      cerrado_en: new Date().toISOString(), payload_crudo: resp,
    }).eq('id', intento.id);
    return json({ ok: false, codigo: 'no_se_pudo_completar', motivo }, 409);
  }

  /* 🔴 EL RELOJ DEL CÓDIGO: 3 minutos. **Es del proveedor y no lo elegimos.**
     ⚠️ TENSIÓN DECLARADA (S103-D §8): su doc dice «3 min fijos, no
     configurables», pero el request acepta `expiredTime`. Hasta que soporte
     conteste (pregunta #10), **el vencimiento se toma de la RESPUESTA si viene,
     y sólo si no viene se asume 3 min** — *preferir el dato del proveedor a
     nuestro supuesto es lo que evita que la cuenta regresiva mienta.* */
  const expiraProveedor = typeof d.expiredAt === 'string' ? Date.parse(d.expiredAt) : NaN;
  const expira = new Date(Number.isFinite(expiraProveedor)
    ? expiraProveedor : Date.now() + 3 * 60_000);

  await db.from('pagos_intentos').update({
    estado: 'pendiente',
    proveedor_transaction_id: txId,
    codigo_numerico: codigo,
    codigo_expira_en: expira.toISOString(),
    payload_crudo: resp,   // QR y deeplink viven acá: reserva sin pantalla
  }).eq('id', intento.id);

  /* 🔴 ⑥ SEÑAL, JAMÁS «PAGADO». Que exista el código no significa que alguien
     haya pagado: eso lo dice el webhook verificado, o el barrido. */
  return json({
    ok: true,
    intento_id: intento.id,
    codigo,                                  // los 6 dígitos, para la pantalla
    expira_en: expira.toISOString(),         // el reloj DEL CÓDIGO
    monto, moneda,
    estado: 'esperando_pago',
  });
});
