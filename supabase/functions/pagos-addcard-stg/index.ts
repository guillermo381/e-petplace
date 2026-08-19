// ═══════════════════════════════════════════════════════════════════════════
// S101-A · ADD CARD — LA PUERTA REAL DE TOKENIZACIÓN
//
// Nace porque el camino server-to-server MURIÓ POR MEDICIÓN: Nuvei rebota
// `401 Application is not PCI` — ni siquiera en sandbox. **No era una
// preferencia de arquitectura: es que ese camino no existe para nosotros.**
//
// 🔴 ESTO SÍ ES CAMINO DEL PRODUCTO. El PAN se tokeniza EN EL NAVEGADOR contra
//    el dominio de Nuvei y **jamás toca nuestro servidor** — que es
//    exactamente lo que la cabecera del arnés advertía y lo que la letra de la
//    puerta de pago iba a pedir igual. Esta página es la v0 de esa puerta:
//    fea, mínima, y por el camino correcto.
//
// POR QUÉ ES UNA EDGE FUNCTION Y NO UN HTML EN EL REPO:
//    las credenciales CLIENT se inyectan **en el momento de servir**, desde los
//    secrets. Un HTML estático las tendría escritas adentro y commiteadas.
//    *El juego CLIENT es menos sensible que el SERVER, pero «menos sensible»
//    no es «va al repo».*
//
// ⚠️ PUERTA: se sirve solo con `?k=<ARNES_SECRET>`. Es proporcionado para un
//    ensayo de sandbox que corre el founder, y **se declara su costo**: el
//    secreto viaja en la URL y queda en el historial del navegador. Para el
//    arco real del Add Card la puerta es la sesión del usuario, no un secreto
//    en la query — esto muere con esa letra.
// ═══════════════════════════════════════════════════════════════════════════

const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const APP_CODE_CLIENT = Deno.env.get('NUVEI_APP_CODE_CLIENT') ?? '';
const APP_KEY_CLIENT = Deno.env.get('NUVEI_APP_KEY_CLIENT') ?? '';
const ARNES_SECRET = Deno.env.get('ARNES_SECRET') ?? '';

// ⚠️ NO MEDIDO: la URL del SDK sale de env para no clavar en código algo que
//    nadie verificó. Si la doc dice otra, se cambia el secreto y no el archivo.
const SDK_URL = Deno.env.get('NUVEI_SDK_URL')
  ?? 'https://cdn.paymentez.com/ccapi/sdk/payment_checkout_3.0.0.js';

const ARNES_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pagos-arnes-sandbox`;

function pagina(compraId: string, k: string): string {
  // El `user_id` se fija ACÁ y viaja igual a la tokenización y al débito:
  // es el que entra al stoken.
  const userId = `arnes-${compraId.slice(0, 8)}`;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Add Card · sandbox S101</title>
<style>
  body { font: 15px/1.5 system-ui, sans-serif; max-width: 34rem; margin: 2rem auto; padding: 0 1rem; }
  code { background: #f4f4f5; padding: .1rem .3rem; border-radius: 3px; }
  button { font: inherit; padding: .6rem 1.1rem; border-radius: 6px; border: 0;
           background: #111; color: #fff; cursor: pointer; }
  button[disabled] { opacity: .5; cursor: default; }
  pre { background: #f4f4f5; padding: .8rem; border-radius: 6px; overflow: auto; font-size: 13px; }
  .aviso { background: #fff7ed; border-left: 3px solid #ea580c; padding: .7rem .9rem; }
</style></head><body>
<h1>Add Card · sandbox</h1>
<p class="aviso"><b>Solo sandbox.</b> El PAN se tokeniza en el navegador contra Nuvei;
nuestro servidor no lo ve. Tarjeta de prueba: <code>4111 1111 1111 1111</code>,
vencimiento futuro, CVC de 3 dígitos.</p>

<p>Compra: <code>${compraId}</code> · user: <code>${userId}</code></p>

<p>
  <label>Número <input id="num" value="4111111111111111" size="22"></label><br>
  <label>MM <input id="mm" value="12" size="3"></label>
  <label>AAAA <input id="yy" value="2030" size="5"></label>
  <label>CVC <input id="cvc" value="123" size="4"></label>
</p>

<p><button id="go">Tokenizar y cobrar</button></p>
<pre id="out">esperando…</pre>

<script src="${SDK_URL}"></script>
<script>
const out = document.getElementById('out');
const log = (t) => { out.textContent = typeof t === 'string' ? t : JSON.stringify(t, null, 2); };

try {
  // El SDK de Nuvei/Paymentez se inicializa con el juego CLIENT.
  Paymentez.init(${JSON.stringify(APP_CODE_CLIENT)}, ${JSON.stringify(APP_KEY_CLIENT)}, 'stg');
} catch (e) { log('No se pudo inicializar el SDK: ' + e + '\\n\\nSDK: ${SDK_URL}'); }

document.getElementById('go').onclick = function () {
  const b = this; b.disabled = true; log('tokenizando en el navegador…');
  const card = {
    number: document.getElementById('num').value.trim(),
    holder_name: 'ARNES S101',
    expiry_month: parseInt(document.getElementById('mm').value, 10),
    expiry_year: parseInt(document.getElementById('yy').value, 10),
    cvc: document.getElementById('cvc').value.trim(),
    type: 'vi'
  };
  const user = { id: ${JSON.stringify(userId)}, email: 'arnes-s101@epetplace.test' };

  Paymentez.addCard(user, card, function (resp) {
    if (!resp || !resp.card || !resp.card.token) {
      log({ paso: 'tokenizacion_fallo', respuesta: resp });
      b.disabled = false; return;
    }
    log('token obtenido (' + String(resp.card.token).slice(0, 6) + '…) · disparando el débito…');
    // 🔴 El token va al SERVIDOR, que es quien tiene el secreto del arnés.
    //    El navegador nunca conoce ARNES_SECRET.
    fetch(location.pathname + location.search, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compra_id: ${JSON.stringify(compraId)},
                             token: resp.card.token, user_id: user.id })
    }).then(r => r.json()).then(log).catch(e => log('error: ' + e));
  });
};
</script>
</body></html>`;
}

Deno.serve(async (req) => {
  if (AMBIENTE !== 'sandbox') {
    return new Response('Solo sandbox. El cobro real pide firma explícita.', { status: 403 });
  }

  const url = new URL(req.url);
  const k = url.searchParams.get('k') ?? '';
  if (!ARNES_SECRET || k !== ARNES_SECRET) {
    return new Response('no autorizado', { status: 401 });
  }

  // ── GET: sirve la página con las credenciales CLIENT inyectadas ──
  if (req.method === 'GET') {
    const compraId = url.searchParams.get('compra') ?? '';
    if (!compraId) return new Response('falta ?compra=<uuid>', { status: 400 });
    if (!APP_CODE_CLIENT || !APP_KEY_CLIENT) {
      return new Response(
        'Faltan NUVEI_APP_CODE_CLIENT / NUVEI_APP_KEY_CLIENT en los secrets.',
        { status: 500 });
    }
    return new Response(pagina(compraId, k), {
      status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // ── POST: recibe el token del navegador y llama al arnés CON el secreto ──
  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const r = await fetch(ARNES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-arnes-secret': ARNES_SECRET },
      body: JSON.stringify(body),
    });
    return new Response(await r.text(), {
      status: r.status, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405 });
});
