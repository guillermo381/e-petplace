// ═══════════════════════════════════════════════════════════════════════════
// S101-A · BUZÓN DE WEBHOOKS DE PASARELA — v0
//
// 🔴 ESTA VERSIÓN NO MUEVE NINGÚN ESTADO. Recibe, persiste el crudo, registra
//    el resultado de validar el `stoken`, y responde 200. El actuador viene
//    después SOBRE ESTE MISMO ENDPOINT, para que la URL registrada ante la
//    pasarela no cambie nunca.
//
// 🔴 POR QUÉ HAY DOS FUNCIONES Y NO UNA CON BANDERA: el censo B0 §7 midió que
//    NO existe proyecto Supabase de staging — hay un solo proyecto activo. Los
//    eventos del sandbox aterrizan sobre la misma base que los reales. Dos
//    despliegues con secretos separados y la columna `ambiente` obligatoria es
//    la mitigación mientras eso sea cierto. Una bandera compartida sería un
//    solo error de configuración entre la prueba y la plata.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createHash } from 'node:crypto';

const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const APP_CODE = Deno.env.get('NUVEI_APP_CODE_SERVER') ?? '';
const APP_KEY = Deno.env.get('NUVEI_APP_KEY_SERVER') ?? '';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

/**
 * stoken = MD5(transaction_id + "_" + application_code + "_" + user_id + "_" + app_key)
 *
 * ⚠️ La UBICACIÓN del stoken dentro del payload NO está medida contra sandbox
 *    (no hay credenciales todavía). Se busca en tres lugares A PROPÓSITO y el
 *    campo `detalle` deja escrito cuál acertó en el primer evento real.
 *    Cuando se sepa, se fija uno y se borran los otros dos.
 */
/* ═══ 🔑 LA RECETA DEL `stoken` — CONTESTADA POR EL PROVEEDOR (20-ago) ══════
   **HMAC-SHA256**, con la *application key* como **CLAVE** (no como pedazo del
   mensaje) y el mensaje `orderId_applicationCode_uid`.

   🔴 POR QUÉ NO SALIÓ MIDIENDO, y es la lección: se probaron **~200.000 recetas
   de hash PLANO** —permutaciones de los ocho campos del crudo, seis
   separadores, cuatro algoritmos, la clave al principio y al final, las dos
   credenciales— y **ninguna podía acertar**, porque el espacio entero estaba
   equivocado: *la clave no era un campo más de la cadena, era la llave del
   HMAC*. **Una búsqueda exhaustiva dentro de la familia equivocada se siente
   como evidencia de que la respuesta no existe.** La contestó una línea del
   proveedor, igual que el `vat`.

   ✅ **Validada contra la historia ANTES de ser ley** (orden de mesa): de los
   24 eventos guardados con `stoken`, **19 validan y son los 19 firmados por el
   proveedor**. Los 5 restantes son **sondas nuestras de S101-A**
   (`transaction.id = TEST-1` / `TEST-429`, `user.id = u` / `u-1`, sin
   `application_code`): *nadie les calculó un stoken jamás, así que no pueden
   validar — no son un contraejemplo de la fórmula, son filas que no fueron
   firmadas.* **19/19 de lo firmado.**

   🔴🔴 **Y LO QUE LA RECETA DESTAPA, QUE NO ES CHICO:** la clave se elige por la
   credencial DEL EVENTO. Las altas vienen firmadas con la **CLIENT**… y la
   CLIENT **es pública por diseño: la sirve nuestra propia página de pago**.
   ⇒ **El `stoken` de un callback de ALTA no es un control de seguridad**:
   cualquiera que abra la página puede firmar uno. Solo el de **cobro** —clave
   SERVER, que jamás sale del servidor— autentica de verdad.
   ⇒ **EL ACTUADOR SOLO PUEDE MOVER PLATA CON EVENTOS `-SERVER`.** Tratar los
   dos iguales sería poner un candado cuya llave está colgada en la puerta. */
const RECETA = 'hmac-sha256-v2:HMAC(appKey, tx_appCode_uid)';

function verificarStoken(
  txId: string, appCode: string, uid: string, recibido: string,
): { valido: boolean | null; receta: string; credencial: string } {
  /* La credencial se elige por lo que el proveedor DIJO haber usado — es un
     dato del payload, no un supuesto nuestro. */
  const esServer = appCode.toUpperCase().endsWith('-SERVER');
  const credencial = esServer ? 'SERVER' : appCode ? 'CLIENT' : 'desconocida';
  const key = esServer ? APP_KEY : KEY_CLIENT;

  if (!recibido || !txId || !appCode || !uid || !key)
    return { valido: null, receta: RECETA, credencial };

  const calc = createHmac('sha256', key)
    .update(`${txId}_${appCode}_${uid}`)
    .digest('hex');
  return { valido: calc.toLowerCase() === recibido.toLowerCase(), receta: RECETA, credencial };
}

/* ☠️ EL BANCO DE PRUEBAS COMBINATORIO Y SU ENSAYO MURIERON ACÁ (Ley 37).
   Existieron para no gastar el tiro del débito averiguando la fórmula, y su
   trabajo lo terminó el proveedor. **Se van enteros, con su secreto**:
   `PAGOS_ENSAYO_SECRET` queda sin consumidor y entra a la baja del cierre.
   *Un diagnóstico que sobrevive a su pregunta es una puerta abierta que ya no
   sirve para nada.* */

function extraer(p: Record<string, any>) {
  const t = p?.transaction ?? {};

  // 🔴 CUÁL de los tres lugares trajo el stoken SE REGISTRA, no se adivina.
  //    El comentario de arriba prometía que `detalle` diría cuál acertó y la
  //    primera versión NO lo guardaba: decía «stoken no coincide» sin decir de
  //    dónde lo sacó. **El evento real de Nuvei es una observación de una sola
  //    vez** — si llega y no anotamos la procedencia, un `false` no distingue
  //    «la fórmula está mal» de «lo leí del lugar equivocado», y hay que
  //    esperar al siguiente evento para desempatar.
  const candidatos: Array<[string, unknown]> = [
    ['transaction.stoken', t.stoken],
    ['raiz.stoken', p?.stoken],
    ['card.stoken', p?.card?.stoken],
  ];
  const hit = candidatos.find(([, v]) => typeof v === 'string' && v.length > 0);

  return {
    txId: String(t.id ?? p?.transaction_id ?? ''),
    userId: String(p?.user?.id ?? t.user_id ?? ''),
    stoken: hit ? String(hit[1]) : '',
    stokenDe: hit ? hit[0] : 'ninguno de los tres',
    /* El `application_code` que el proveedor REALMENTE usó para firmar. Es un
       dato del payload, no un supuesto nuestro — y es el que separa las altas
       (CLIENT) de los cobros (SERVER). */
    appCode: String(t.application_code ?? p?.application_code ?? ''),
    devRef: String(t.dev_reference ?? ''),
    auth: String(t.authorization_code ?? ''),
    email: String(p?.user?.email ?? ''),
    status: t.status ?? null,
    detail: t.status_detail ?? null,
    monto: t.amount ?? null,
  };
}

async function guardar(row: Record<string, unknown>) {
  const { error } = await db.from('webhook_events').insert({
    ambiente: AMBIENTE,
    proveedor: 'nuvei',
    ...row,
  });
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const crudo = await req.text();

  // ① ILEGIBLE → se guarda igual y se responde 200.
  //    Reintentar un JSON roto durante 48 h no lo arregla, y sí llena la cola.
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(crudo);
  } catch {
    try {
      await guardar({
        payload: { crudo_no_json: crudo.slice(0, 10_000) },
        resultado: 'ilegible',
        detalle: 'body no parseable como JSON',
      });
    } catch (e) {
      console.error('[webhook] no se pudo guardar el ilegible', e);
    }
    return new Response('ok', { status: 200 });
  }

  const d = extraer(payload);

  // ② VALIDACIÓN DEL STOKEN. En v0 solo se REGISTRA el resultado: no corta
  //    nada porque no hay nada que cortar todavía. Cuando el actuador entre,
  //    esta misma verificación pasa a ser la puerta.
  const v = verificarStoken(d.txId, d.appCode, d.userId, d.stoken);
  const valido = v.valido;
  /* 🔴 EL FRENO DECLARA CONTRA QUÉ MIDIÓ (L-285). La v0 decía «no coincide» a
     secas, y por eso 24 filas fueron **una sola observación repetida** sin que
     nadie pudiera saberlo. Ahora cada fila lleva la fórmula, la credencial y —
     lo que decide si el actuador puede tocarla— si el evento está **autenticado
     de verdad**. */
  const autenticado = valido === true && v.credencial === 'SERVER';
  const detalle =
    `receta=${v.receta} · credencial=${v.credencial} · autenticado=${autenticado}` +
    (valido === null ? ' · no evaluable: faltan datos o credencial' : '') +
    ` · stoken_de=${d.stokenDe} · dev_reference=${d.devRef} · status=${d.status}/${d.detail}`;

  // ③ PERSISTIR SIEMPRE, incluso lo rechazado.
  try {
    await guardar({
      transaction_id: d.txId || null,
      payload,
      stoken_valido: valido,
      resultado: valido === false ? 'stoken_invalido' : 'recibido',
      detalle,
    });
  } catch (e) {
    // 🔴 429, NO 500 — Y LA DIFERENCIA ES EL REINTENTO ENTERO.
    //
    //    La doc de Nuvei: los reintentos corren hasta recibir 200 durante 48 h,
    //    **pero un status ≥ 500 los DETIENE definitivamente.**
    //
    //    La primera versión devolvía 500 «a propósito, para que reintenten» —
    //    y lograba exactamente lo contrario: **mataba el único reintento que
    //    queremos.** Un evento que no pudimos guardar y que además nadie
    //    reenvía es un evento perdido para siempre, y en pagos eso es un cobro
    //    sin traza.
    //
    //    Se elige **429** entre los 4xx porque es el único que dice la verdad:
    //    no es culpa del que llama (400 lo culparía a él), no es permanente —
    //    es «no pude ahora, volvé». *El código de estado es parte del
    //    contrato, no decoración: acá decidía si el evento existe o no.*
    console.error('[webhook] fallo al persistir', e);
    return new Response(
      JSON.stringify({ ok: false, error: 'no_pudimos_persistir', reintentar: true }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ④ 200 rápido. Si tarda, reintentan con backoff hasta 48 h.
  return new Response('ok', { status: 200 });
});
