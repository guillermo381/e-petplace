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
function calcularStoken(txId: string, userId: string): string {
  return createHash('md5')
    .update(`${txId}_${APP_CODE}_${userId}_${APP_KEY}`)
    .digest('hex');
}

/* ═══ 🔴 EL BANCO DE PRUEBAS DEL STOKEN — DIAGNÓSTICO, JAMÁS AUTORIDAD ═══════
   **Medido el 20-ago abriendo el crudo guardado**, antes de gastar el tiro
   único del débito:
     · el `stoken` que llega tiene **64 caracteres** ⇒ es **SHA-256**. Nuestra
       fórmula calcula **MD5** (32) ⇒ **no puede coincidir jamás, por largo**;
     · los 25 callosbacks guardados traen `application_code` terminado en
       **`-CLIENT`** (son altas de tarjeta) y nosotros firmamos con la clave
       **SERVER** ⇒ **credenciales cruzadas**, la misma familia de defecto que
       ya nos costó dos rojos hoy.
   ⇒ 24 de 24 en `false` tienen **dos causas candidatas**, y una sola fila no
     alcanzaba para desempatarlas.

   🔴 **ESTO NO OTORGA VALIDEZ.** `stoken_valido` lo sigue decidiendo la receta
   canónica y nada más. *Un verificador que acepta «cualquiera de N recetas»
   deja entrar por la más débil — sería cambiar un candado por una lista de
   llaves.* Esto solo ANOTA qué receta reproduce el valor recibido, para poder
   **fijar una** y borrar el banco.

   Es L-285 aplicada: *el freno declara contra qué midió.* La v0 decía «stoken
   no coincide» sin decir contra qué — y por eso 24 filas no enseñaron nada. */
const CODE_CLIENT = Deno.env.get('NUVEI_APP_CODE_CLIENT') ?? '';
const KEY_CLIENT = Deno.env.get('NUVEI_APP_KEY_CLIENT') ?? '';

function recetaQueCoincide(
  txId: string, userId: string, status: string, appCode: string, recibido: string,
  amount: string, auth: string, detail: string, email: string,
): string {
  if (!recibido) return 'sin_stoken';

  /* 🔴 LA MATRIZ DE LA PRIMERA PASADA ERA MÍA, NO MEDIDA: seis órdenes que se
     me ocurrieron, y las 144 fallaron. **Un espacio de búsqueda inventado que
     no encuentra nada no prueba que la respuesta no esté ahí: prueba que no
     buscaste donde estaba.** Ahora se recorre de forma COMBINATORIA sobre los
     campos que el crudo realmente trae. */
  const pool: Record<string, string> = {
    TX: txId, UID: userId, ST: status, CODE: appCode,
    AMT: amount, AUTH: auth, DETAIL: detail, EMAIL: email,
  };
  const nombres = Object.keys(pool);
  const juegos: Array<[string, string]> = [['SERVER', APP_KEY], ['CLIENT', KEY_CLIENT]];
  const seps = ['_', '', '.', '-', '|', ':'];
  const algos = ['sha256', 'md5', 'sha1', 'sha512'];

  function* perms(n: number, pre: string[] = []): Generator<string[]> {
    if (pre.length === n) { yield pre; return; }
    for (const x of nombres) if (!pre.includes(x)) yield* perms(n, [...pre, x]);
  }

  for (const [quien, key] of juegos) {
    if (!key) continue;
    for (let n = 1; n <= 4; n++)
      for (const orden of perms(n))
        for (const pos of ['fin', 'inicio'])
          for (const sep of seps)
            for (const algo of algos) {
              const campos = orden.map((k) => pool[k]);
              const s = (pos === 'fin' ? [...campos, key] : [key, ...campos]).join(sep);
              if (createHash(algo).update(s).digest('hex').toLowerCase() === recibido.toLowerCase())
                return `RECETA=${algo}|sep="${sep}"|key_al_${pos}|${orden.join('+')}|clave=${quien}`;
            }
  }
  return 'ninguna_de_la_matriz_combinatoria';
}

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

  /* ═══ ☠️ ENSAYO — NACE CON SU MUERTE ESCRITA ═══════════════════════════════
     Corre el banco de pruebas contra un crudo YA GUARDADO y **devuelve la
     receta sin persistir nada**.

     🔴 POR QUÉ EXISTE, y por qué no es un lujo: la alternativa era **gastar el
     tiro único del débito** para averiguar una fórmula que los 25 crudos ya
     guardados podían contestar solos. *Un disparo que se usa para responder lo
     que la evidencia vieja ya sabía es un disparo perdido.*

     🔴 NO MUEVE, NO GUARDA, NO VALIDA NADA. Devuelve un nombre de receta.
     **Muere junto con el banco de pruebas**, en cuanto la receta se fije. */
  if (new URL(req.url).searchParams.get('ensayo') === '1') {
    /* 🔴 Secreto PROPIO, no el `ARNES_SECRET`: ése quedó en chat e historial
       de navegador en S101-A y **está pendiente de rotación**. *Reusar un
       secreto que ya sabés que se filtró es elegir la comodidad sobre lo
       único que un secreto tiene que ser.* */
    const secreto = Deno.env.get('PAGOS_ENSAYO_SECRET') ?? '';
    if (!secreto || req.headers.get('x-ensayo-secret') !== secreto)
      return new Response('no', { status: 401 });
    return Response.json({
      ensayo: true,
      largo_stoken: d.stoken.length,
      stoken_de: d.stokenDe,
      app_code_del_payload: d.appCode,
      receta: recetaQueCoincide(
        d.txId, d.userId, String(d.status ?? ''), String(d.appCode ?? ''), d.stoken,
        String(d.monto ?? ''), String(d.auth ?? ''), String(d.detail ?? ''), String(d.email ?? ''),
      ),
    });
  }

  // ② VALIDACIÓN DEL STOKEN. En v0 solo se REGISTRA el resultado: no corta
  //    nada porque no hay nada que cortar todavía. Cuando el actuador entre,
  //    esta misma verificación pasa a ser la puerta.
  let valido: boolean | null = null;
  let detalle = 'v0 buzón: no se movió ningún estado';
  if (d.txId && d.userId && d.stoken && APP_CODE && APP_KEY) {
    valido = calcularStoken(d.txId, d.userId).toLowerCase() === d.stoken.toLowerCase();
    /* 🔴 El freno DECLARA CONTRA QUÉ MIDIÓ (L-285). La v0 decía «no coincide»
       a secas, y 24 filas no enseñaron nada porque el `false` no distinguía
       fórmula equivocada de credencial cruzada. */
    if (!valido) detalle = `stoken no coincide · ${recetaQueCoincide(
      d.txId, d.userId, String(d.status ?? ''), String(d.appCode ?? ''), d.stoken,
      String(d.monto ?? ''), String(d.auth ?? ''), String(d.detail ?? ''), String(d.email ?? ''),
    )}`;
  } else {
    const faltan = [
      !d.txId && 'transaction_id',
      !d.userId && 'user_id',
      !d.stoken && 'stoken',
      !APP_CODE && 'APP_CODE',
      !APP_KEY && 'APP_KEY',
    ].filter(Boolean).join(', ');
    detalle = `no se pudo validar: faltan ${faltan}`;
  }

  // ③ PERSISTIR SIEMPRE, incluso lo rechazado.
  try {
    await guardar({
      transaction_id: d.txId || null,
      payload,
      stoken_valido: valido,
      resultado: valido === false ? 'stoken_invalido' : 'recibido',
      detalle: `${detalle} · stoken_de=${d.stokenDe} · dev_reference=${d.devRef} · status=${d.status}/${d.detail}`,
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
