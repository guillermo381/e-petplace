// ═══════════════════════════════════════════════════════════════════════════
// S101-A · ADD CARD — LA PUERTA REAL DE TOKENIZACIÓN
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 🔴 EL PRINCIPIO INNEGOCIABLE                                            │
// │                                                                         │
// │ EL PAN VIVE ÚNICAMENTE DENTRO DEL FORMULARIO DE NUVEI.                  │
// │ Nuestra página lo ALOJA; jamás lo LEE.                                  │
// │                                                                         │
// │ ⇒ Los campos los pinta el widget `PaymentForm` del SDK, que monta sus   │
// │   propios inputs. Nuestro JS **nunca** hace `.value` sobre el número,   │
// │   nunca lo mete en una variable, nunca lo manda a ningún lado.          │
// │ ⇒ PROHIBIDO en esta página: logs del contenido del formulario,          │
// │   analytics, y cualquier error-tracking que capture el DOM (Sentry con  │
// │   session replay, LogRocket, hotjar y parientes). Un replay que grabe   │
// │   este formulario mete el PAN en un tercero **y nos vuelve PCI**.       │
// │                                                                         │
// │ Ésta es la razón por la que somos NO-PCI, y el proveedor LO VERIFICA:   │
// │ el 19-ago el camino server-to-server rebotó con                         │
// │ `401 Application is not PCI`. No es una política nuestra que podamos    │
// │ relajar — es una puerta cerrada del otro lado.                          │
// └─────────────────────────────────────────────────────────────────────────┘
//
// ⚠️ VERSIÓN ANTERIOR DE ESTE ARCHIVO VIOLABA EL PRINCIPIO y se corrigió:
//    montaba inputs propios y leía el número con `.value`. Funcionaba, y por
//    eso era peligroso — *el PAN en una variable de nuestro JS no rompe nada
//    visible; solo cambia en qué régimen de cumplimiento estamos parados.*
//
// ── MEDIDO CONTRA LA FUENTE (github.com/paymentez/paymentez.js, 19-ago) ──
//    · SDK:  https://cdn.paymentez.com/ccapi/sdk/payment_stable.min.js
//            + payment_stable.min.css
//      **UN SOLO CDN: la doc NO distingue host de staging.** Lo que separa
//      staging de producción es el PRIMER argumento de `Payment.init`.
//    · init: Payment.init('stg'|'prod'|'local', APP_CODE, APP_KEY)
//            ⚠️ el ambiente va PRIMERO, y el objeto es `Payment` (no `Paymentez`).
//    · form: <div class="payment-form" id="my-card" data-capture-name="true">
//            var cardToSave = $('#my-card').PaymentForm('card');
//            Payment.addCard(uid, email, cardToSave, ok, err, myCard);
//      El widget **exige jQuery** (es un plugin jQuery).
//
// POR QUÉ ES EDGE FUNCTION Y NO UN HTML EN EL REPO: las credenciales CLIENT se
// inyectan **al servir**, desde los secrets. La llave client es publicable por
// diseño (viaja al navegador en todo SDK de pagos), pero *publicable no es
// «va commiteada»*.
// ═══════════════════════════════════════════════════════════════════════════

const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';

// 🔴 LAS CREDENCIALES CLIENT SALEN DE ENV — este archivo NO lleva ninguna
//    escrita, y no debe llevarla nunca.
//    ⚠️ Que la PÁGINA RENDERIZADA sí las contenga es inevitable y correcto:
//    así funciona todo SDK de pagos en el navegador — el juego CLIENT es
//    publicable POR DISEÑO (por eso existe separado del SERVER, que es el que
//    firma los cobros y jamás sale del servidor).
//    *«Publicable» no es «va commiteada»: lo primero es del navegador, lo
//    segundo es del repo, y son cosas distintas.*
const APP_CODE_CLIENT = Deno.env.get('NUVEI_APP_CODE_CLIENT') ?? '';
const APP_KEY_CLIENT = Deno.env.get('NUVEI_APP_KEY_CLIENT') ?? '';
const ARNES_SECRET = Deno.env.get('ARNES_SECRET') ?? '';

// Medidos del repo oficial. Salen de env igual, para poder corregirlos sin
// tocar el archivo si la doc cambia.
const SDK_JS = Deno.env.get('NUVEI_SDK_JS')
  ?? 'https://cdn.paymentez.com/ccapi/sdk/payment_stable.min.js';
const SDK_CSS = Deno.env.get('NUVEI_SDK_CSS')
  ?? 'https://cdn.paymentez.com/ccapi/sdk/payment_stable.min.css';
const JQUERY = Deno.env.get('JQUERY_URL')
  ?? 'https://code.jquery.com/jquery-3.7.1.min.js';

// 'stg' | 'prod' — lo decide el ambiente, no una constante suelta.
const MODO = AMBIENTE === 'produccion' ? 'prod' : 'stg';

const ARNES_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pagos-arnes-sandbox`;

function pagina(compraId: string): string {
  // El `user_id` se fija ACÁ y viaja igual a la tokenización y al débito:
  // es el que entra al `stoken`. Si divergieran, el stoken daría false por
  // una razón que no es la fórmula.
  const userId = `arnes-${compraId.slice(0, 8)}`;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agregar tarjeta · sandbox</title>
<link href="${SDK_CSS}" rel="stylesheet" type="text/css">
<style>
  body { font: 15px/1.6 system-ui, sans-serif; max-width: 30rem; margin: 2rem auto; padding: 0 1rem; }
  code { background:#f4f4f5; padding:.1rem .3rem; border-radius:3px; font-size:.9em; }
  button { font:inherit; padding:.7rem 1.2rem; border-radius:8px; border:0;
           background:#111; color:#fff; cursor:pointer; }
  button[disabled] { opacity:.45; cursor:default; }
  pre { background:#f4f4f5; padding:.8rem; border-radius:8px; overflow:auto; font-size:12.5px; }
  .aviso { background:#fff7ed; border-left:3px solid #ea580c; padding:.7rem .9rem; font-size:14px; }
  .estado { font-weight:600; margin-top:1rem; }
</style></head><body>

<h1>Agregar tarjeta</h1>
<p class="aviso"><b>Solo sandbox.</b> Los campos de abajo los monta el SDK de Nuvei:
<b>el número de tarjeta no pasa por nuestro código</b>. Prueba: <code>4111 1111 1111 1111</code>,
vencimiento futuro, CVC de 3 dígitos.</p>

<p>Compra <code>${compraId}</code></p>

<!-- 🔴 El widget monta ACÁ sus propios campos. No hay inputs nuestros. -->
<div class="payment-form" id="my-card" data-capture-name="true"></div>

<p><button id="go">Guardar tarjeta y cobrar</button></p>
<p class="estado" id="estado">—</p>
<pre id="out">esperando…</pre>

<script src="${JQUERY}"></script>
<script src="${SDK_JS}" charset="UTF-8"></script>
<script>
var out = document.getElementById('out');
var est = document.getElementById('estado');
function log(t){ out.textContent = typeof t === 'string' ? t : JSON.stringify(t, null, 2); }

// ⑤ LOS TRES DESENLACES DEL ADD CARD, con lugar hecho desde el día uno.
//    No es un happy-path soldado: 'abandonada' existe acá aunque hoy solo la
//    dispare cerrar la pestaña, porque el día que se instrumente ya tiene
//    dónde vivir.
var DESENLACE = { GUARDADA: 'guardada', RECHAZADA: 'rechazada', ABANDONADA: 'abandonada' };
var desenlace = DESENLACE.ABANDONADA;   // hasta que algo diga lo contrario
function marcar(d, detalle){ desenlace = d; est.textContent = 'Desenlace: ' + d; if (detalle) log(detalle); }

// El OTP de Diners vive en ESTE arco (tarjeta 36417002140808 · OTP 012345 éxito
// / 543210 pendiente). Para el camino feliz con la 4111 no aparece; cuando
// aparezca, el SDK lo pide en su propio formulario — tampoco lo leemos nosotros.

try {
  Payment.init(${JSON.stringify(MODO)}, ${JSON.stringify(APP_CODE_CLIENT)}, ${JSON.stringify(APP_KEY_CLIENT)});
} catch (e) {
  marcar(DESENLACE.RECHAZADA, 'No se pudo inicializar el SDK: ' + e + '\\n\\nJS: ${SDK_JS}');
}

document.getElementById('go').onclick = function () {
  var b = this; b.disabled = true;
  log('tokenizando dentro del formulario de Nuvei…');

  var myCard = $('#my-card');
  var cardToSave;
  try { cardToSave = myCard.PaymentForm('card'); }
  catch (e) { b.disabled = false; return marcar(DESENLACE.RECHAZADA, 'formulario inválido: ' + e); }

  Payment.addCard(
    ${JSON.stringify(userId)},
    'arnes-s101@epetplace.test',
    cardToSave,
    function (resp) {                                   // éxito
      var card = resp && resp.card ? resp.card : {};
      if (!card.token) { b.disabled = false; return marcar(DESENLACE.RECHAZADA, resp); }
      marcar(DESENLACE.GUARDADA);
      log('token obtenido · disparando el débito…');
      // 🔴 El token va al SERVIDOR. El navegador nunca conoce ARNES_SECRET.
      //    Y viaja el MISMO user_id con el que se tokenizó.
      fetch(location.pathname + location.search, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compra_id: ${JSON.stringify(compraId)},
          token: card.token,
          user_id: ${JSON.stringify(userId)},
          // metadatos NO sensibles, para la tabla de tarjetas del producto
          bin: card.bin || null, ultimos4: card.number || null,
          marca: card.type || null, titular: card.holder_name || null
        })
      }).then(function(r){ return r.json(); }).then(log)
        .catch(function(e){ log('error al disparar el débito: ' + e); });
    },
    function (err) {                                    // rechazo
      b.disabled = false;
      marcar(DESENLACE.RECHAZADA, err);
    },
    myCard
  );
};
</script>
</body></html>`;
}

Deno.serve(async (req) => {
  if (AMBIENTE !== 'sandbox') {
    return new Response('Solo sandbox. El cobro real pide firma explícita.', { status: 403 });
  }

  const url = new URL(req.url);
  // ⚠️ Puerta por secreto en la query: proporcionado para un ensayo de sandbox
  //    que corre el founder, y con su costo declarado — queda en el historial
  //    del navegador. **Muere con la letra del Add Card real**, donde la puerta
  //    es la sesión del usuario.
  if (!ARNES_SECRET || url.searchParams.get('k') !== ARNES_SECRET) {
    return new Response('no autorizado', { status: 401 });
  }

  if (req.method === 'GET') {
    const compraId = url.searchParams.get('compra') ?? '';
    if (!compraId) return new Response('falta ?compra=<uuid>', { status: 400 });
    if (!APP_CODE_CLIENT || !APP_KEY_CLIENT) {
      return new Response(
        'Faltan NUVEI_APP_CODE_CLIENT / NUVEI_APP_KEY_CLIENT en los secrets.',
        { status: 500 });
    }
    // ═══ EL CONTENT-TYPE, PUESTO DE DOS FORMAS A PROPÓSITO ═══
    //
    // Medido por el founder con `curl -s -D - -o /dev/null` sobre el GET REAL:
    // llegaba `content-type: text/plain` **con nuestro `nosniff` presente**.
    // Ese par es el dato que ordena el diagnóstico: **el objeto de headers SÍ
    // se aplicaba** (por eso llegó nosniff) y aun así el tipo venía reescrito
    // ⇒ algo posterior a la construcción lo pisa.
    //
    // Tres cambios, cada uno independiente del otro — si uno solo alcanza,
    // igual queda cubierto:
    //
    //  ① El header se setea **DESPUÉS** de construir la Response, sobre
    //     `response.headers`. Es otro camino que el del constructor, y es el
    //     que el diagnóstico señala.
    //  ② Se saca el `Content-Length` manual. Con acentos, bytes ≠ caracteres,
    //     y un largo que no cierra invita al intermediario a **rehacer** la
    //     respuesta — y al rehacerla, normaliza el tipo. *No estaba probado
    //     que fuera la causa; estaba probado que no hacía falta.*
    //  ③ Se saca `nosniff`. Es hardening real, pero acá **estaba trabajando en
    //     contra**: le prohibía al navegador rescatarnos adivinando HTML
    //     mientras el tipo llegue mal. Vuelve cuando el curl confirme
    //     `text/html`. *Un candado que impide la recuperación de un defecto
    //     abierto se saca hasta cerrar el defecto.*
    //
    // El cuerpo vuelve a ser string: Deno lo emite UTF-8. El mojibake nunca
    // fue de codificación — era **consecuencia** del `text/plain`, que hace
    // que el navegador caiga a latin-1.
    // ⚠️⚠️ `TEXT/HTML` EN MAYÚSCULAS, Y NO ES UN CAPRICHO NI UN ESTILO.
    //
    // 🔴 ESTO ES UN RODEO A UNA PROTECCIÓN DE LA PLATAFORMA. Se declara así,
    //    con todas las letras, para que nadie lo copie creyendo que es una
    //    convención de la casa.
    //
    // Medido con una sonda descartable, variante por variante:
    //    text/html; charset=utf-8   → llega text/plain   🔴
    //    text/html                  → llega text/plain   🔴
    //    application/xhtml+xml      → llega text/plain   🔴
    //    application/json           → intacto            ✅
    //    text/plain; charset=utf-8  → intacto            ✅
    //    TEXT/HTML; charset=UTF-8   → INTACTO            ✅
    //
    // ⇒ Supabase **degrada HTML a texto plano a propósito** en el dominio
    //   compartido `*.supabase.co` — es anti-phishing, y está bien que exista.
    //   Su comparación es sensible a mayúsculas, y por ahí pasa.
    //
    // ⇒ CONSECUENCIAS QUE HAY QUE ASUMIR:
    //   · **Es frágil**: el día que normalicen la comparación, esto deja de
    //     funcionar **en silencio** — la página vuelve a verse como texto.
    //   · **Sirve SOLO como parche de ensayo en sandbox.**
    //   · **La cura de verdad es no servir HTML desde acá.** La página del Add
    //     Card es superficie de PRODUCTO y su lugar es un host web propio
    //     (la landing de epetplace.com o un dominio propio), con las
    //     credenciales CLIENT inyectadas ahí. *La plataforma no está fallando:
    //     nos está diciendo que este no es el lugar para servir una página.*
    const res = new Response(pagina(compraId), { status: 200 });
    res.headers.set('Content-Type', 'TEXT/HTML; charset=UTF-8');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    // 🔴 Solo se reenvía lo que el arnés necesita. Aunque el navegador mandara
    //    de más, acá se corta: nada parecido a un PAN cruza este punto.
    const limpio = {
      compra_id: body.compra_id, token: body.token, user_id: body.user_id,
      email: body.email,
    };
    const r = await fetch(ARNES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-arnes-secret': ARNES_SECRET },
      body: JSON.stringify(limpio),
    });
    return new Response(await r.text(), {
      status: r.status, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405 });
});
