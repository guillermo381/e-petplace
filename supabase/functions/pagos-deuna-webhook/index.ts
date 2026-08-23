// ═══════════════════════════════════════════════════════════════════════════
// S103-D · `pagos-deuna-webhook` — EL BUZÓN DE DEUNA
//
// 🔴 EL WEBHOOK ES SEÑAL, NO VERDAD (LETRA_DEUNA §7). Su autenticación son
//    **headers estáticos** — más débil que el HMAC de Nuvei. Por eso la letra
//    ordena DOS capas, y la segunda NO ES OPCIONAL:
//
//      ① SECRETO PROPIO en header, generado por nosotros, registrado con DeUna,
//         validado acá y **rotable** (vive en secrets, jamás en código).
//      ② **CONSULTA ACTIVA OBLIGATORIA**: ante un webhook válido se pregunta
//         `payment/info` con el `transactionId` persistido, y **sólo esa
//         respuesta verificada alimenta al actuador.**
//         *Un webhook con el secreto correcto y datos falsos muere en la
//          consulta.*
//
// 🔴 EL ORDEN ES ① GUARDAR EL CRUDO · ② ANALIZAR · ③ COMPLETAR — la enmienda de
//    diseño de S101 (20-ago), y acá se hereda con su porqué: un buzón que
//    promete persistir todo no puede tener un camino de entrada capaz de 500.
//    **Un 5xx corta los reintentos del proveedor**, así que cualquier bug de
//    análisis se convertiría en pérdida permanente de un evento de plata.
//    Medido en Nuvei: el callback del primer débito real llegó y devolvimos
//    500; durante horas el hallazgo fue «el callback no llega».
//
// 🔴 §9 · EL DATO PERSONAL: el payload trae **cédula y nombre del pagador**
//    (`ordererIdentification` / `ordererName`, `customerIdentification` /
//    `customerFullName`). Se persisten **SOLO en el crudo** y **JAMÁS en un
//    log**. Este archivo no tiene un solo `console.log` del payload — sólo de
//    ids y códigos de resultado.
//
// ⚠️ NO DESPLEGADA. Deploy pide autorización del founder por tanda.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { timingSafeEqual } from 'node:crypto';
/* El predicado de la verdad verificada vive aparte para poder testearlo sin
   montar el cliente de Supabase — ver `_verdad.ts`. */
import { cuerpoDeConsulta, esVerdadVerificada } from './_verdad.ts';

const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const API_KEY = Deno.env.get('DEUNA_API_KEY') ?? '';
const API_SECRET = Deno.env.get('DEUNA_API_SECRET') ?? '';
/* ① Nuestro secreto, no el suyo. Lo generamos, lo registramos con DeUna como
   header del webhook, y se rota cambiando este secret.

   🔴 SON DOS, Y ESA ES LA ROTACIÓN SIN VENTANA CIEGA. El secreto viaja en un
   header ESTÁTICO que se registra del lado del proveedor: entre que
   desplegamos un valor nuevo y que ellos lo cargan pasa un tiempo que no
   controlamos. Con un solo secret, ese tiempo es **una ventana en la que todo
   webhook legítimo se rechaza** — y los rechazados no se reintentan
   indefinidamente.
   Aceptar el ACTUAL y el SIGUIENTE a la vez convierte la rotación en dos
   despliegues sin corte. Procedimiento completo:
   `docs/relevamientos/S103-D-ALTA-Y-ROTACION-WEBHOOK-DEUNA.md`.

   ⚠️ Los dos son válidos MIENTRAS DURE la rotación. Dejar `_SIGUIENTE` cargado
   para siempre es tener dos llaves vivas sin razón: el paso 2 existe
   justamente para retirarlo, y el procedimiento lo pide con su verificación. */
const WEBHOOK_SECRET = Deno.env.get('DEUNA_WEBHOOK_SECRET') ?? '';
const WEBHOOK_SECRET_SIGUIENTE = Deno.env.get('DEUNA_WEBHOOK_SECRET_SIGUIENTE') ?? '';
const HEADER_SECRETO = 'x-epetplace-secret';

const BASE = AMBIENTE === 'produccion'
  ? 'https://apis-merchant.pdn.deunalab.com'
  : 'https://apis-merchant.qa.deunalab.com';
const RUTA = '/merchant/v1/payment';   // sin `api/` — medido (S103-D §2)

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

/** Comparación en tiempo constante contra UN candidato: una comparación con
 *  `===` filtra el secreto por el tiempo que tarda en fallar. */
function coincide(recibido: string, esperado: string): boolean {
  if (!esperado || !recibido) return false;
  const a = new TextEncoder().encode(recibido);
  const b = new TextEncoder().encode(esperado);
  /* La diferencia de longitud se filtra igual (es observable), pero comparar
     buffers de distinto largo lanza. Es la concesión conocida del patrón. */
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * ¿El header trae un secreto válido? Acepta el ACTUAL o el SIGUIENTE.
 *
 * 🔴 **Se evalúan LOS DOS SIEMPRE, sin cortocircuito.** Un `||` devolvería
 * antes cuando acierta el primero, y esa diferencia de tiempo dice *cuál* de
 * los dos acertó. *Es poca información, pero es información sobre un secreto y
 * no cuesta nada no darla.*
 */
function secretoValido(recibido: string): boolean {
  const a = coincide(recibido, WEBHOOK_SECRET);
  const b = coincide(recibido, WEBHOOK_SECRET_SIGUIENTE);
  return a || b;
}

/** Guarda el crudo y devuelve el id. Lo mínimo indispensable: si esto falla,
 *  no hay evento. */
async function guardarCrudo(payload: unknown): Promise<string> {
  const { data, error } = await db.from('webhook_events').insert({
    ambiente: AMBIENTE, proveedor: 'deuna', payload,
    /* 🔴 `origen` desde el INSERT: dice por qué puerta entró este evento.
       `verificado` NO se escribe acá — todavía no preguntamos nada, y **su
       ausencia es la verdad**: NULL significa «sin veredicto», que es distinto
       de `false` («preguntamos y no confirmó»). */
    origen: 'webhook',
    /* `desconocido` y no un valor nuevo: el CHECK de `resultado` tiene
       vocabulario cerrado y ampliarlo es decisión de letra, no atajo de
       código. Dice exactamente lo que pasó —llegó y su desenlace no se
       determinó— y el análisis lo reemplaza un instante después. */
    resultado: 'desconocido',
    detalle: 'crudo persistido antes de analizar',
  }).select('id').single();
  if (error) throw error;
  return data.id as string;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const texto = await req.text();

  // ① ILEGIBLE → se guarda igual y se responde 200. Reintentar un JSON roto
  //    durante horas no lo arregla, y sí llena la cola.
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(texto);
  } catch {
    try {
      await db.from('webhook_events').insert({
        ambiente: AMBIENTE, proveedor: 'deuna', origen: 'webhook',
        payload: { crudo_no_json: texto.slice(0, 10_000) },
        resultado: 'ilegible', detalle: 'body no parseable como JSON',
      });
    } catch (e) {
      console.error('[deuna] no se pudo guardar el ilegible', String(e).slice(0, 200));
    }
    return new Response('ok', { status: 200 });
  }

  // ── ② EL CRUDO, ANTES DE RAZONAR SOBRE ÉL ─────────────────────────────────
  let idFila: string;
  try {
    idFila = await guardarCrudo(payload);
  } catch (e) {
    // Único caso que merece reintento: no pudimos guardar. 429, jamás 500.
    console.error('[deuna] fallo al persistir el crudo', String(e).slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: 'no_pudimos_persistir', reintentar: true }),
      { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // ── CAPA ① · EL SECRETO PROPIO ──────────────────────────────────────────
    const ok1 = secretoValido(req.headers.get(HEADER_SECRETO) ?? '');
    if (!ok1) {
      /* Se registra y se CORTA. **El evento rechazado se guarda igual**: un
         webhook con secreto inválido es la traza de un intento de fraude, y
         descartarlo sin guardarlo es perder la única evidencia. */
      await db.from('webhook_events').update({
        stoken_valido: false, verificado: false, resultado: 'secreto_invalido',
        detalle: `secreto=invalido · header=${HEADER_SECRETO} · verificado=no`,
      }).eq('id', idFila);
      // 200: no queremos que reintente 3 veces algo que va a rechazar igual.
      return new Response('ok', { status: 200 });
    }

    // El id del proveedor, en los dos lugares donde puede venir.
    const txId = String(payload?.transactionId ?? payload?.transaction?.id ?? '');
    const refCorta = String(payload?.internalTransactionReference ?? '');

    if (!txId && !refCorta) {
      await db.from('webhook_events').update({
        stoken_valido: true, verificado: false, resultado: 'desconocido',
        detalle: 'secreto=ok · verificado=no · sin transactionId ni referencia',
      }).eq('id', idFila);
      return new Response('ok', { status: 200 });
    }

    // ── CAPA ② · LA CONSULTA ACTIVA — **NO ES OPCIONAL** ────────────────────
    /* 🔴 El webhook NO transiciona por sí solo. Preguntamos al proveedor y sólo
       su respuesta verificada alimenta al actuador.
       🔑 La forma de los campos está MEDIDA (S103-D §2quater), y nadie la
          habría adivinado:
            · `idType` es **STRING** "0"/"1" — un 0 numérico rebota;
            · el campo se llama **`idTransacionReference`** — con el typo del
              proveedor (*Transacion*), no `transactionId`.
       ═══ 🔴 SE PREFIERE `idType "1"` — NUESTRA REFERENCIA ═══════════════════
       *(dictamen de mesa, 22-ago. Antes era al revés: `"0"` con `"1"` de
       respaldo.)*

       **La razón está MEDIDA, no argumentada:** la respuesta real de QA por
       `idType "0"` trae **`internalTransactionReference` VACÍO**. Y el actuador
       resuelve el sujeto **sólo** por ese campo. ⇒ Con `"0"`, una consulta
       perfecta puede volver **sin la llave para saber a quién aplicarle el
       pago**, y el actuador contestaría `sin_referencia_corta` sobre un cobro
       que sí ocurrió.

       Por `idType "1"` la respuesta **devuelve la referencia de vuelta por
       eco** — medido en la misma corrida. *La consulta que hacemos con nuestra
       llave nos devuelve nuestra llave.*

       🔴 **POR QUÉ ESTA CURA VA ACÁ Y NO EN EL ACTUADOR** (el argumento de la
       mesa, que es el que importa): parchear el actuador para tolerar una
       referencia vacía **agregaría tolerancia justo donde la casa acaba de
       decidir fail-closed**. Esta cura deja el actuador intacto y **no toca el
       webhook para nada** — la fuente de verdad sigue siendo `info`, entera.

       ⚠️ **El fallback a `"0"` se conserva** para el caso de un webhook que no
       traiga referencia (⚪ no medido: la forma del webhook nunca se observó).
       *No es simetría con lo de antes: es que sin referencia no hay `"1"`
       posible, y preguntar con `"0"` es mejor que no preguntar.* */
    let verificado = false;
    let infoCrudo: Record<string, unknown> = {};
    try {
      const r = await fetch(`${BASE}${RUTA}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY, 'x-api-secret': API_SECRET,
        },
        body: JSON.stringify(cuerpoDeConsulta(txId, refCorta)),
      });
      const t = (await r.text()).slice(0, 4000);
      try { infoCrudo = JSON.parse(t); } catch { /* el crudo alcanza */ }

      /* 🔴 EL FANTASMA — el predicado vive arriba, exportado y con test propio
         sobre la respuesta REAL grabada de QA. */
      verificado = esVerdadVerificada(r.ok, infoCrudo);
    } catch (e) {
      /* No pudimos preguntar ≠ el pago es falso. Queda `no_verificado` y **el
         barrido lo va a encontrar**: no se confirma, y tampoco se rechaza. */
      console.error('[deuna] la consulta activa no respondio', String(e).slice(0, 200));
    }

    /* El detalle lleva las DOS capas por separado — `_evento_autenticado` lee
       `verificado=si`, y sin eso el actuador no toca nada.
       🔴 NO SE ESCRIBE NI UN CAMPO DEL PAGADOR ACÁ: el detalle es texto que se
          lee en tableros y consultas, y §9 dice que la cédula vive **sólo en el
          crudo**. */
    const detalle = `secreto=ok · verificado=${verificado ? 'si' : 'no'}`
      + ` · estado_proveedor=${String(infoCrudo.status ?? 'sin_respuesta')}`
      + ` · tx=${txId || '-'} · ref=${refCorta || '-'}`;

    await db.from('webhook_events').update({
      transaction_id: txId || null,
      stoken_valido: true,                 // capa ① pasó
      /* ═══ 🔴 EL VEREDICTO VA A SU COLUMNA, NO AL TEXTO ══════════════════
         `_evento_autenticado` lee **`verificado IS TRUE`**. Antes leía
         `detalle ILIKE '%verificado=si%'` — y `detalle` es el campo de
         DIAGNÓSTICO, donde este mismo archivo escribe el mensaje de una
         excepción. **Medido: un `analisis_fallo` que contuviera la cadena
         autenticaba el evento.**

         *Un campo que un humano lee para diagnosticar y una función lee para
         autorizar tiene dos dueños con intereses opuestos — y el que escribe
         para diagnosticar no sabe que está firmando.*

         ⚠️ El texto de `detalle` **se conserva igual**: sirve para leerlo en un
         tablero. Lo que cambió es **quién manda**. */
      verificado,
      resultado: verificado ? 'recibido' : 'no_verificado',
      detalle,
      /* 🔴 El crudo se ENRIQUECE con la respuesta de la consulta, porque es la
         que de verdad decidió. *Guardar sólo lo que llegó y no lo que
         preguntamos deja sin auditar el eslabón que manda.* */
      payload: { webhook: payload, info: infoCrudo },
    }).eq('id', idFila);

    // ── EL ACTUADOR — sólo con verdad verificada ────────────────────────────
    /* Se llama ACÁ, después del veredicto y **con el evento ya a salvo**. Si el
       actuador falla, el 200 se devuelve igual: el evento está persistido y el
       barrido lo resuelve. *Un fallo del actuador no puede costar el reintento
       del proveedor.*
       (Precedente: en Nuvei el actuador existía, estaba encendido, y nadie lo
        llamaba — motor sin puerta, y el arnés no lo veía porque llamaba al
        actuador directo, salteándose justo el eslabón que faltaba.) */
    if (verificado) {
      try {
        const { data: act, error: e3 } = await db.rpc('aplicar_evento_de_pago',
          { p_evento_id: idFila });
        if (e3) console.error('[deuna] el actuador fallo', e3.message?.slice(0, 200));
        // 🔴 Se loguea el VEREDICTO, jamás el payload: ahí viaja la cédula.
        else console.log('[deuna] actuador:', JSON.stringify(act)?.slice(0, 300));
      } catch (e) {
        console.error('[deuna] el actuador lanzo', String(e).slice(0, 200));
      }
    }
  } catch (e) {
    /* El análisis falló, **el evento NO se pierde**: queda con su crudo entero
       y se puede volver a analizar cuando el defecto esté curado.
       (En Nuvei esto mismo se cobró con 8 eventos y un `KEY_CLIENT` no
        declarado — se pudieron leer justamente porque el crudo ya estaba.) */
    console.error('[deuna] el analisis fallo; el crudo quedo a salvo', String(e).slice(0, 200));
    try {
      await db.from('webhook_events')
        .update({ detalle: `analisis_fallo: ${String(e).slice(0, 400)}` })
        .eq('id', idFila);
    } catch { /* ni siquiera esto puede tumbar la respuesta */ }
  }

  // 200 rápido. El proveedor reintenta 3 veces cada 30 s ante el primer fallo.
  return new Response('ok', { status: 200 });
});
