// ═══════════════════════════════════════════════════════════════════════════
// S101-A · ARNÉS DEL PRIMER COBRO SANDBOX — ② y ③ de la orden de mesa
//
// 🔴🔴 ESTE CAMINO **JAMÁS ES DEL PRODUCTO**. QUE NADIE LO PROMUEVA.
//
//    Acá el PAN de la tarjeta pasa por NUESTRO servidor para tokenizar
//    server-to-server contra el sandbox. **En producción eso no ocurre y no
//    puede ocurrir:** el PAN lo tokeniza el WebView de Nuvei contra su propio
//    dominio, y nuestro servidor **nunca lo ve**. Ése es el arco del Add Card,
//    que tiene su propia letra en camino.
//
//    Esto existe para UNA cosa: disparar el primer cobro de sandbox y provocar
//    el primer webhook real, que es lo que cierra la pregunta del `stoken`.
//    Si alguien copia este archivo hacia un flujo de cliente, **está metiendo
//    datos de tarjeta en nuestra infraestructura y con eso todo el alcance de
//    PCI que la tokenización existe para evitar.**
//
// 🔴 FRENO DURO: se niega a correr si `PAGOS_AMBIENTE` no es 'sandbox'.
//    Firma del founder: sandbox solamente; el primer cobro real pide firma
//    explícita aparte.
//
// 🔴 El token es EFÍMERO: se usa en el acto y se descarta. NO se persiste —
//    no existe tabla de tarjetas y no se inventa una para un ensayo.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createHash } from 'node:crypto';

const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const APP_CODE = Deno.env.get('NUVEI_APP_CODE_SERVER') ?? '';
const APP_KEY = Deno.env.get('NUVEI_APP_KEY_SERVER') ?? '';
const ARNES_SECRET = Deno.env.get('ARNES_SECRET') ?? '';

// ⚠️ NO MEDIDO contra el sandbox: la base se toma de env para no clavar en
//    código una URL que nadie verificó. Si Nuvei usa otro host, se cambia el
//    secreto y no el archivo.
const BASE = Deno.env.get('NUVEI_BASE_URL') ?? 'https://ccapi-stg.paymentez.com';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

/**
 * Auth-Token = Base64(APP_CODE;UNIX_TIMESTAMP;SHA256(app_key + timestamp))
 *
 * 🔴 SE GENERA EN EL MOMENTO DE CADA REQUEST, jamás se cachea: la ventana es
 *    de 15 segundos. Un reloj desincronizado hace fallar cobros que no tienen
 *    nada malo — por eso el timestamp sale del reloj del server en el instante
 *    de la llamada y no de ninguna variable de arriba.
 */
function authToken(): string {
  const ts = Math.floor(Date.now() / 1000);
  const hash = createHash('sha256').update(`${APP_KEY}${ts}`).digest('hex');
  return btoa(`${APP_CODE};${ts};${hash}`);
}

async function nuvei(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Auth-Token': authToken() },
    body: JSON.stringify(body),
  });
  const texto = await r.text();
  let json: unknown = null;
  try { json = JSON.parse(texto); } catch { /* se devuelve el crudo */ }
  return { status: r.status, json, crudo: texto.slice(0, 4000) };
}

const paso: Array<Record<string, unknown>> = [];
const anotar = (n: string, d: Record<string, unknown>) => { paso.push({ paso: n, ...d }); };

Deno.serve(async (req) => {
  // ── Puerta. Sin esto sería un endpoint público que cobra. ──
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!ARNES_SECRET || req.headers.get('x-arnes-secret') !== ARNES_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'no_autorizado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Freno de ambiente. Antes que nada. ──
  if (AMBIENTE !== 'sandbox') {
    return new Response(JSON.stringify({
      ok: false,
      error: 'ambiente_no_sandbox',
      detalle: `PAGOS_AMBIENTE='${AMBIENTE}'. Este arnés corre SOLO en sandbox. ` +
               'El primer cobro real pide firma explícita del founder.',
    }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const body = await req.json().catch(() => ({})) as Record<string, any>;
  const compraId: string = body.compra_id ?? '';
  const tarjeta = body.tarjeta ?? null;   // ⚠️ de la DOC de Nuvei, ver abajo
  const email: string = body.email ?? 'arnes-s101@epetplace.test';

  // ── ENMIENDA ADITIVA (19-ago, tras el 401 «Application is not PCI») ──
  //
  // 🔴 EL CAMINO DE `tarjeta` NO SE TOCÓ: si Erick habilita la tokenización
  //    directa en staging, este arnés dispara sin un solo cambio, como se
  //    ordenó.
  //
  // Lo que se agrega es la OTRA punta: aceptar un `token` ya emitido por el
  // SDK del navegador (el camino REAL del producto). Se hace acá y no en una
  // función nueva a propósito: duplicar el débito significaría duplicar las
  // compuertas, el registro del intento y la regla de la señal optimista —
  // tres lugares donde después divergen.
  const tokenExterno: string | null = typeof body.token === 'string' && body.token.trim()
    ? body.token.trim() : null;
  // El `user.id` DEBE ser el mismo con el que se tokenizó: es el que entra al
  // stoken. Si viene de afuera, manda el de afuera.
  const userExterno: string | null = typeof body.user_id === 'string' && body.user_id.trim()
    ? body.user_id.trim() : null;

  if (!compraId) {
    return new Response(JSON.stringify({ ok: false, error: 'falta_compra_id' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // 🔴 LA TARJETA DE PRUEBA NO SE INVENTA. Viene en el request, de la doc de
  //    Nuvei. Fabricar un PAN plausible es la clase de dato verosímil-y-falso
  //    que esta casa ya pagó caro: pasaría los formatos y fallaría en el cobro
  //    sin decir por qué.
  if (!tokenExterno && (!tarjeta?.number || !tarjeta?.expiry_month || !tarjeta?.expiry_year || !tarjeta?.cvc)) {
    return new Response(JSON.stringify({
      ok: false, error: 'falta_tarjeta_o_token',
      detalle: 'O bien { token, user_id } ya emitido por el SDK del navegador (camino REAL), ' +
               'o bien { tarjeta: { number, holder_name, expiry_month, expiry_year, cvc, type } } ' +
               'de la doc de Nuvei (camino server-to-server, que exige app PCI). ' +
               'No se inventa ningún PAN.',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!APP_CODE || !APP_KEY) {
    return new Response(JSON.stringify({ ok: false, error: 'faltan_credenciales' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  // 🔴 EL user.id ES EL QUE ENTRA AL STOKEN. Si el token vino de afuera, hay
  //    que usar EL MISMO con el que se tokenizó — si acá inventáramos otro, el
  //    stoken daría false por una razón que no es la fórmula, y habríamos
  //    quemado la observación de un solo tiro diagnosticando el problema
  //    equivocado.
  const userId = userExterno ?? `arnes-${compraId.slice(0, 8)}`;

  try {
    // ═══ 1 · LA COMPRA Y SU DESGLOSE CONGELADO ═══
    // 🔴 El monto sale del DESGLOSE CONGELADO, jamás de los totales vivos del
    //    pedido: el desglose es lo que se le prometió al cliente al cobrar.
    const { data: compra, error: eC } = await db
      .from('compras').select('id, total, moneda, estado').eq('id', compraId).single();
    if (eC || !compra) throw new Error(`compra_no_legible: ${eC?.message}`);

    const { data: desglose, error: eD } = await db
      .from('compra_desglose').select('pedido_id, total, subtotal, impuesto, envio')
      .eq('compra_id', compraId);
    if (eD) throw new Error(`desglose_no_legible: ${eD.message}`);

    const montoCongelado = (desglose ?? []).reduce((a, d) => a + Number(d.total), 0);

    // 🔴 EL IVA SALE DEL DESGLOSE CONGELADO, NO DE UN 0 FIJO.
    //    La primera versión mandaba `vat: 0` hardcodeado y Nuvei rebotó 403
    //    `order.vat Invalid`. Acá el número lo dice el desglose — que es el
    //    mismo que se le prometió al cliente. *Un impuesto tecleado a mano en
    //    el request es un número que puede divergir del que se cobró.*
    //    `p_vat` permite forzarlo SOLO para probar variantes contra el
    //    sandbox sin redeployar; en producto no existe.
    const ivaCongelado = (desglose ?? []).reduce((a, d) => a + Number(d.impuesto ?? 0), 0);
    const baseImponible = (desglose ?? []).reduce((a, d) => a + Number(d.subtotal ?? 0), 0);
    const vat = typeof body.vat === 'number' ? body.vat : Number(ivaCongelado.toFixed(2));
    const taxable = typeof body.taxable_amount === 'number'
      ? body.taxable_amount
      : (vat > 0 ? Number(baseImponible.toFixed(2)) : 0);

    anotar('1_compra', {
      estado: compra.estado, total_compra: compra.total,
      monto_congelado: montoCongelado, lineas_desglose: (desglose ?? []).length,
      vat_congelado: ivaCongelado, vat_enviado: vat, taxable_amount: taxable,
      nota: ivaCongelado === 0
        ? 'IVA 0 (EC_IVA_0). Si Nuvei rebota `order.vat Invalid`, el choque es contra la tasa configurada en LA CUENTA, no contra este pedido.'
        : undefined,
    });

    // ═══ 2 · EL TOKEN ═══
    // Camino A (REAL): vino del SDK del navegador. Nuestro server nunca vio el PAN.
    // Camino B (server-to-server): tokenizamos acá. **MEDIDO 19-ago: Nuvei lo
    //   rebota con 401 «Application is not PCI», ni siquiera en sandbox.** Se
    //   conserva intacto por orden de mesa: si Erick habilita la tokenización
    //   directa en staging, dispara sin cambios.
    let token: string | null = tokenExterno;
    if (token) {
      anotar('2_tokenizacion', {
        via: 'SDK del navegador (camino real)', token_obtenido: true,
        token_preview: token.slice(0, 6) + '…',
        nota: 'el PAN nunca tocó nuestro servidor',
      });
    } else {
    const add = await nuvei('/v2/card/add/', {
      user: { id: userId, email },
      card: {
        number: tarjeta.number,
        holder_name: tarjeta.holder_name ?? 'ARNES S101',
        expiry_month: tarjeta.expiry_month,
        expiry_year: tarjeta.expiry_year,
        cvc: tarjeta.cvc,
        type: tarjeta.type ?? 'vi',
      },
    });
    token = (add.json as any)?.card?.token ?? null;
    anotar('2_tokenizacion', {
      via: 'server-to-server', http: add.status, token_obtenido: !!token,
      // el token NO se persiste; se muestra truncado solo para la traza del arnés
      token_preview: token ? String(token).slice(0, 6) + '…' : null,
      respuesta: token ? undefined : add.crudo,
      pista: add.status === 401
        ? 'HTTP 401 «Application is not PCI»: este camino NO existe para una app no-PCI. Usar el Add Card del navegador.'
        : undefined,
    });
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: 'tokenizacion_fallo', paso }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
    }

    // ═══ 3 · LAS COMPUERTAS PRE-COBRO — ANTES de registrar y de disparar ═══
    // Corren primero a propósito: si el intento se registrara antes, la
    // compuerta 0 se dispararía contra el propio arnés.
    const { data: gates, error: eG } = await db
      .rpc('verificar_compuertas_pre_cobro', { p_compra_id: compraId, p_token: token });
    if (eG) throw new Error(`compuertas_no_corrieron: ${eG.message}`);
    anotar('3_compuertas', gates as Record<string, unknown>);

    if (!(gates as any)?.ok) {
      // 🔴 No se toca la tarjeta. Es el punto entero de E3.
      return new Response(JSON.stringify({ ok: false, error: 'compuerta_cerrada', paso }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    // ═══ 4 · REGISTRAR EL INTENTO **ANTES** DE DISPARAR ═══
    // 🔴 Si disparamos y perdemos la respuesta, esta fila es lo único que
    //    prueba que se disparó. Sin ella, el caso ④ (no llega ninguno) es
    //    indetectable: no habría contra qué barrer.
    //    Además deja la compuerta 0 armada contra un segundo intento.
    const claveArnes = `arnes:${compraId}:${Date.now()}`;
    const pedidoIds = (desglose ?? []).map((d) => d.pedido_id);
    const { data: intento, error: eI } = await db
      .from('pagos_intentos')
      .insert({
        pedido_id: pedidoIds[0], compra_id: compraId, proveedor: 'nuvei',
        proveedor_referencia: compraId, monto: montoCongelado,
        moneda: compra.moneda ?? 'USD', forma: 'tokenizacion',
        estado: 'iniciado', clave_idempotencia: claveArnes,
      })
      .select('id').single();
    if (eI) throw new Error(`intento_no_registrado: ${eI.message}`);
    anotar('4_intento_registrado', { intento_id: intento.id, estado: 'iniciado' });

    // ═══ 5 · EL DÉBITO ═══
    // `dev_reference` = LA COMPRA (firma S100), jamás un pedido.
    const debit = await nuvei('/v2/transaction/debit/', {
      user: { id: userId, email },
      order: {
        amount: Number(montoCongelado.toFixed(2)),
        description: typeof body.descripcion === 'string' && body.descripcion.trim()
          ? body.descripcion.trim()                       // escenarios de rechazo de la doc
          : `e-PetPlace compra ${compraId.slice(0, 8)}`,
        dev_reference: compraId,
        vat,
        taxable_amount: taxable,
      },
      card: { token },
    });
    const tx = (debit.json as any)?.transaction ?? {};
    anotar('5_debito', {
      http: debit.status, status: tx.status ?? null, status_detail: tx.status_detail ?? null,
      transaction_id: tx.id ?? null, authorization_code: tx.authorization_code ?? null,
      crudo: tx.id ? undefined : debit.crudo,
    });

    // ═══ 6 · LA RESPUESTA SÍNCRONA ES SEÑAL OPTIMISTA, JAMÁS CONFIRMACIÓN ═══
    // 🔴 Caso ② de la letra. Acá NO se llama a confirmar_pago_*. El pedido se
    //    confirma cuando el WEBHOOK lo diga. Escribir 'aprobado' desde esta
    //    respuesta sería creerle al canal que la letra declara no confiable.
    const aprobado = tx.status === 'success';

    // 🔴 EL MOTIVO SE ARMA CON LO QUE HAYA, Y NUNCA QUEDA NULL EN UN RECHAZO.
    //    Medido en el intento `14e5319d`: quedó `rechazado` con
    //    `motivo_rechazo = NULL` y `cerrado_en = NULL`, porque el error de
    //    Nuvei no venía en `transaction.message` sino en un objeto `error` de
    //    primer nivel — y mi lectura solo miraba el primero.
    //    *Un rechazo sin motivo obliga a abrir el payload crudo para saber qué
    //    pasó; y el payload crudo no se puede listar ni contar.*
    const err = (debit.json as any)?.error ?? null;
    const motivo = aprobado ? null : (
      tx.message
      ?? (err ? `${err.type ?? 'error'}: ${err.description ?? ''} ${err.help ? '· ' + err.help : ''}`.trim() : null)
      ?? (tx.status_detail !== undefined ? `status_detail=${tx.status_detail}` : null)
      ?? `http_${debit.status}`     // último recurso: jamás NULL
    );

    // 🔴 UN INTENTO QUE TERMINÓ SE CIERRA. Sin `cerrado_en`, un intento muerto
    //    es indistinguible de uno en vuelo para cualquiera que mire la tabla —
    //    y la compuerta 0 existe precisamente para no cobrar dos veces.
    await db.from('pagos_intentos').update({
      estado: aprobado ? 'pendiente' : 'rechazado',
      proveedor_transaction_id: tx.id ? String(tx.id) : null,
      authorization_code: tx.authorization_code ?? null,
      motivo_rechazo: motivo,
      payload_crudo: (debit.json ?? { crudo: debit.crudo }) as Record<string, unknown>,
      actualizado_en: new Date().toISOString(),
      cerrado_en: aprobado ? null : new Date().toISOString(),
    }).eq('id', intento.id);

    return new Response(JSON.stringify({
      ok: true,
      aviso: 'La respuesta síncrona es SEÑAL OPTIMISTA. El pedido NO está confirmado ' +
             'hasta que llegue el webhook. Mirá webhook_events.',
      compra_id: compraId, intento_id: intento.id,
      transaction_id: tx.id ?? null, paso,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (e) {
    anotar('error', { mensaje: String(e) });
    return new Response(JSON.stringify({ ok: false, error: String(e), paso }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});
