/**
 * ¿EL ORBE SE ENCIENDE? — medición del lote 0.2 (S113-C).
 *
 * La captura del founder muestra el orbe SIN encender al abrirse. La causa
 * puede ser de la pieza (B) o del montaje (C), y esto lo decide con evidencia
 * en vez de con una lectura del código.
 *
 * 🔴 **QUÉ SE MIRA, Y POR QUÉ ESO Y NO UN PÍXEL.** La pieza decide el violeta
 * con `violeta = abierta || estado === 'despierta' || estado === 'hablando'`
 * (`PresenciaCoach.tsx:522`), y expone dos cosas que dicen si `abierta` LLEGÓ:
 *   · `accessibilityState={{ expanded: abierta }}`  → `aria-expanded` en web
 *   · `accessibilityLabel={abierta ? voz.preguntar : voz.orbe}`
 * *Si las dos cambian al tocar, `abierta` llegó y el problema no es el
 * montaje.* Un screenshot diría «no se ve violeta» sin decir de quién es.
 *
 * Sólo lectura: entra con la sesión demo, toca el orbe y mira.
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(`${e.name}: ${e.message}`));

const texto = async () => await page.evaluate(() => document.body.innerText).catch(() => '');
const esperar = async (frase, veces = 60) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) { await page.waitForTimeout(1000); t = await texto(); }
  return t;
};

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 240000 });
await esperar('Contraseña', 90);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(18000);

const di = (s) => console.log(s);
const marcasHoja = (t) =>
  ['¿Qué edad tiene?', '¿Cómo va su carnet?', '¿Qué actividad tiene?', 'Soy Nexo'].filter((f) => t.includes(f));

/* El orbe grande se localiza por su voz EXACTA. Desde el lote 0.3 esa voz
   CAMBIA con el estado —«Abrir a Nexo» cerrado, «Cerrar a Nexo» abierto—, así
   que se busca por cualquiera de las dos y se lee cuál salió. La fila lleva
   «Pregúntale a Nexo» y no colisiona con ninguna. */
const orbe = () => page.getByRole('button', { name: /^(Abrir|Cerrar) a Nexo$/ });
const leer = async () => await orbe().getAttribute('aria-label');

di('── ① EL ORBE EN REPOSO ────────────────────────────────────');
if ((await orbe().count()) === 0) {
  di('orbe: NO montado');
  di(`pantalla: ${(await texto()).split('\n').slice(0, 6).join(' · ')}`);
  await browser.close();
  process.exit(2);
}
di(`nodos: ${await orbe().count()} · aria-label="${await leer()}"`);
di(`dice «Abrir»: ${/^Abrir/.test((await leer()) ?? '') ? 'SÍ ✓' : 'NO 🔴'}`);

di('\n── ② ABIERTO: ¿DICE «Cerrar»? ─────────────────────────────');
await orbe().click();
await page.waitForTimeout(1500);
const abierto = await leer();
di(`aria-label="${abierto}"`);
di(`dice «Cerrar»: ${/^Cerrar/.test(abierto ?? '') ? 'SÍ ✓' : 'NO 🔴'}`);
const tAb = await texto();
di(`dedos a la vista: ${['Peso', 'Vacuna', 'Antiparasitario', 'Foto'].filter((d) => tAb.includes(d)).join(' · ')}`);

di('\n── ③ LA HOJA: ¿MUESTRA EL ORBE VIOLETA? ───────────────────');
await page.getByRole('button', { name: /^Pregúntale a /i }).first().click();
await page.waitForTimeout(2500);
const tH = await texto();
di(`marcas de la Hoja: ${marcasHoja(tH).join(' · ') || 'NINGUNA'}`);

/* 🔴 **NO se mira un píxel: se mira el DIBUJO.** `CabeceraCoach` monta un
   `<svg>` con un `radialGradient` cuyos tres stops son la paleta del Coach.
   Si esos hex están en el DOM, el orbe violeta se dibujó. *Un screenshot
   diría «se ve algo violeta» sin decir si es el orbe o el velo.* */
const PALETA = ['#AE59FF', '#9E3AFF', '#7C2DD4'];
const encontrados = await page.evaluate((hexes) => {
  /* Se mide en TODO el documento y además dentro de la cabecera: si los stops
     están en la página pero no bajo la cabecera, el problema es el selector y
     no el dibujo — y eso hay que poder distinguirlo antes de acusar a nadie. */
  const stopsDe = (raiz) =>
    [...raiz.querySelectorAll('svg stop')].map((x) => (x.getAttribute('stop-color') ?? '').toUpperCase());
  const doc = stopsDe(document.body);
  const cab = document.querySelector('[aria-label="Nexo"]');
  return {
    svgsEnDoc: document.querySelectorAll('svg').length,
    enDoc: hexes.filter((h) => doc.includes(h.toUpperCase())),
    tieneCabecera: cab !== null,
    svgsEnCabecera: cab === null ? 0 : cab.querySelectorAll('svg').length,
    enCabecera: cab === null ? [] : hexes.filter((h) => stopsDe(cab).includes(h.toUpperCase())),
    etiquetaCabecera: cab === null ? null : cab.getAttribute('aria-label'),
  };
}, PALETA);
di(`svgs en el documento: ${encontrados.svgsEnDoc}`);
di(`stops de la paleta EN EL DOCUMENTO: ${encontrados.enDoc.join(' · ') || 'NINGUNO'}`);
di(`cabecera («Nexo»): ${encontrados.tieneCabecera ? 'hallada' : 'NO hallada'} · svgs adentro: ${encontrados.svgsEnCabecera}`);
di(`stops de la paleta EN LA CABECERA: ${encontrados.enCabecera.join(' · ') || 'NINGUNO'}`);
di(`⇒ el orbe violeta ${encontrados.enCabecera.length >= 2 ? 'SE DIBUJA EN LA HOJA ✓' : 'NO se dibuja en la Hoja 🔴'}`);

di(`\nerrores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await browser.close();
