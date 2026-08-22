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
import { createHash, createHmac } from 'node:crypto';
/* 🔴 `createHmac` FALTABA EN EL IMPORT y el uso estaba escrito igual. En Deno eso
   no es un error de compilación: es un **ReferenceError en runtime**, uncaught,
   que la plataforma devuelve como **500 Internal Server Error** — y un 500
   DETIENE los reintentos de Nuvei para siempre.
   *Un typecheck no corre sobre estas funciones, así que el único lugar donde
   este defecto podía aparecer era el request real de un cobro real.* */

const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const APP_CODE = Deno.env.get('NUVEI_APP_CODE_SERVER') ?? '';
const APP_KEY = Deno.env.get('NUVEI_APP_KEY_SERVER') ?? '';
/* 🔴 S103-A · LA CURA DE `KEY_CLIENT`, y el aviso de arriba se cobró a sí mismo.
   El comentario de la línea 19 describe EXACTAMENTE esta clase de defecto —un
   símbolo usado y nunca definido, ReferenceError en runtime, invisible al
   typecheck— y **sesenta líneas más abajo el archivo la cometía otra vez**:
   `verificarStoken` usaba `KEY_CLIENT` y nadie lo declaraba nunca.

   **Medido, no supuesto:** las 8 filas CLIENT del 21-ago en `webhook_events`
   dicen, las ocho, `analisis_fallo: ReferenceError: KEY_CLIENT is not defined`.
   Las 20 filas SERVER del mismo día validaron (`stoken_valido = true`) — el
   corte cae exacto sobre la credencial, porque la rama SERVER usa `APP_KEY`,
   que sí estaba declarada.

   *La advertencia vivía en un comentario, y un comentario se cumple mientras
   alguien lo lea* (`L-326`). Lo que de verdad cierra esta clase es el juez de
   símbolos — y **está ciego a ella**: mide «símbolo de MÓDULO usado sin
   importar», y esto es un identificador libre. Su verde con el defecto vivo
   quedó medido y declarado para B, que es su dueña.

   El `?? ''` no es adorno: mantiene el fail-closed que el resto del archivo ya
   tiene —sin credencial, `verificarStoken` devuelve `valido: null` y lo dice en
   `detalle`— en vez de romper. **Un secreto ausente tiene que producir un nulo
   honesto, jamás un 500 que mate los reintentos del proveedor.** */
const KEY_CLIENT = Deno.env.get('NUVEI_APP_KEY_CLIENT') ?? '';

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

/** Guarda el crudo y **devuelve el id**, para completarlo después. Lo mínimo
 *  indispensable: si esto falla, no hay evento. */
async function guardarCrudo(payload: unknown): Promise<string> {
  const { data, error } = await db.from('webhook_events').insert({
    ambiente: AMBIENTE,
    proveedor: 'nuvei',
    payload,
    /* 🔴 `desconocido` y no un estado nuevo: el CHECK de `resultado` tiene
       vocabulario cerrado, y **ampliarlo es una decisión de letra, no un
       atajo de código**. `desconocido` dice exactamente lo que pasó —el
       evento llegó y su desenlace todavía no se determinó— y el análisis lo
       reemplaza un instante después. *Inventar un valor que el CHECK rechaza
       fue lo que rompió la primera versión de esta cura: la persistencia
       falló, devolvimos 429, y el buzón «que persiste todo» no persistió.* */
    resultado: 'desconocido',
    detalle: 'crudo persistido antes de analizar',
  }).select('id').single();
  if (error) throw error;
  return data.id as string;
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

  /* ═══ 🔴 ENMIENDA DE DISEÑO (20-ago) — SE PERSISTE ANTES DE ANALIZAR ══════
     **Un buzón que promete persistir todo no puede tener un camino de entrada
     capaz de 500.** La v0 analizaba primero y guardaba después, así que
     cualquier defecto del análisis —una fórmula, un campo nuevo, un import que
     falta— **se llevaba el evento puesto**.

     Y el costo no es «se pierde un log»: **un 500 detiene los reintentos de
     Nuvei definitivamente** (su doc: reintentan hasta 200 durante 48 h, pero
     ≥500 corta). *Analizar antes de guardar convierte cualquier bug de análisis
     en pérdida permanente de un evento de plata.*

     Medido el 20-ago: el callback del primer débito real (`DF-2098100`) **SÍ
     llegó** y nosotros devolvimos 500. Durante horas el hallazgo fue «el
     callback no llega» — *era nuestro, y estábamos buscando afuera.*

     ⇒ Orden nuevo: **① guardar el crudo · ② analizar · ③ completar la fila.**
     Si ② o ③ fallan, el evento **ya está a salvo** y respondemos 200: el
     análisis se puede rehacer sobre el crudo cuando queramos; el evento
     perdido no vuelve nunca. */
  let idFila: string | null = null;
  try {
    idFila = await guardarCrudo(payload);
  } catch (e) {
    // Único caso que merece reintento: no pudimos guardar. 429, jamás 500.
    console.error('[webhook] fallo al persistir el crudo', e);
    return new Response(
      JSON.stringify({ ok: false, error: 'no_pudimos_persistir', reintentar: true }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const d = extraer(payload);
    const v = verificarStoken(d.txId, d.appCode, d.userId, d.stoken);
    /* 🔴 EL FRENO DECLARA CONTRA QUÉ MIDIÓ (L-285). Cada fila lleva la fórmula,
       la credencial y —lo que decide si el actuador puede tocarla— si el evento
       está **autenticado de verdad**. */
    const autenticado = v.valido === true && v.credencial === 'SERVER';
    const detalle =
      `receta=${v.receta} · credencial=${v.credencial} · autenticado=${autenticado}` +
      (v.valido === null ? ' · no evaluable: faltan datos o credencial' : '') +
      ` · stoken_de=${d.stokenDe} · dev_reference=${d.devRef} · status=${d.status}/${d.detail}`;

    await db.from('webhook_events').update({
      transaction_id: d.txId || null,
      stoken_valido: v.valido,
      resultado: v.valido === false ? 'stoken_invalido' : 'recibido',
      detalle,
    }).eq('id', idFila);
    /* ═══ 🔴 LA PUERTA DEL ACTUADOR ══════════════════════════════════════
       **Medido el 20-ago con un pago real:** el evento llegaba, se guardaba
       `autenticado=true`… y la compra se quedaba en `esperando_pago`.
       El actuador existía, estaba encendido, y **nadie lo llamaba**.
       *Motor sin puerta* — y **el arnés no podía verlo porque llamaba al
       actuador directo**, saltándose justo el eslabón que faltaba.

       ⇒ Se llama ACÁ, después de tener el veredicto y **con el evento ya a
         salvo**. Si el actuador falla, **el 200 se devuelve igual**: el evento
         está persistido y el barrido lo resuelve. *Un fallo del actuador no
         puede costar el reintento del proveedor.* */
    try {
      const { data: act, error: e3 } = await db.rpc('aplicar_evento_de_pago', {
        p_evento_id: idFila,
      });
      if (e3) console.error('[webhook] el actuador falló', e3);
      else console.log('[webhook] actuador:', JSON.stringify(act));
    } catch (e) {
      console.error('[webhook] el actuador lanzó', e);
    }
  } catch (e) {
    /* 🔴 El análisis falló, **el evento NO se pierde**. Queda con
       `resultado='recibido_sin_analizar'` y su crudo entero: se puede volver a
       analizar cuando el defecto esté curado. *Antes, esto era un 500 y el
       evento no existía.* */
    console.error('[webhook] el análisis falló; el crudo quedó a salvo', e);
    try {
      await db.from('webhook_events')
        .update({ detalle: `analisis_fallo: ${String(e).slice(0, 400)}` })
        .eq('id', idFila);
    } catch { /* ni siquiera esto puede tumbar la respuesta */ }
  }

  // ④ 200 rápido. Si tarda, reintentan con backoff hasta 48 h.
  return new Response('ok', { status: 200 });
});
