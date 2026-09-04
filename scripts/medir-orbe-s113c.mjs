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

di('── ① ¿EL ORBE ESTÁ MONTADO? ───────────────────────────────');
/* 🔴 **EL ORBE SE LOCALIZA POR SU VOZ EXACTA, Y ESTO LO CORRIGIÓ SU PROPIO
   ROJO.** La primera versión buscaba `/^Abrir a |^Pregúntale a /` y tomaba
   `.first()`: con la fila abierta, el primero en el DOM **es la fila** —la
   pieza la dibuja antes que el orbe— así que el segundo toque le pegaba a la
   fila y abría la Hoja. El arnés reportó *«un toque hizo dos cosas»* y **la
   que hacía dos cosas era la medición.**
   Medido en la pieza: el orbe grande lleva `accessibilityLabel={voz.orbe}`
   SIEMPRE (:729) y la fila lleva `voz.preguntar` — se distinguen por nombre,
   y el estado se lee de `aria-expanded`, que el orbe sí publica. */
const orbe = () => page.getByRole('button', { name: 'Abrir a Nexo', exact: true });
if ((await orbe().count()) === 0) {
  di('orbe en reposo: NO montado');
  di(`pantalla: ${(await texto()).split('\n').slice(0, 6).join(' · ')}`);
  await browser.close();
  process.exit(2);
}
const leer = async () => ({
  nombre: await orbe().getAttribute('aria-label'),
  expandido: await orbe().getAttribute('aria-expanded'),
});
di(`reposo · ${JSON.stringify(await leer())} · nodos con esa voz: ${await orbe().count()}`);

di('\n── ② UN TOQUE: ABRE ───────────────────────────────────────');
await orbe().click();
await page.waitForTimeout(1500);
const tras1 = JSON.stringify(await leer());
const t1 = await texto();
const dedos1 = ['Peso', 'Vacuna', 'Antiparasitario', 'Foto'].filter((d) => t1.includes(d));
di(`orbe: ${tras1} · dedos a la vista: ${dedos1.join(' · ') || 'ninguno'}`);
di(`abrió: ${dedos1.length === 4 ? 'SÍ' : 'NO'}`);
di(`¿abrió TAMBIÉN la Hoja? ${marcasHoja(t1).length > 0 ? 'SÍ — dos cosas de un toque 🔴' : 'no ✓'}`);

di('\n── ③ OTRO TOQUE EN EL ORBE: CIERRA ────────────────────────');
await orbe().click();
await page.waitForTimeout(1500);
const tras2 = JSON.stringify(await leer());
const t2 = await texto();
const dedos2 = ['Peso', 'Antiparasitario'].filter((d) => t2.includes(d));
di(`orbe: ${tras2} · dedos a la vista: ${dedos2.join(' · ') || 'ninguno'}`);
di(`cerró: ${dedos2.length === 0 ? 'SÍ' : 'NO'}`);
di(`¿abrió la Hoja al cerrar? ${marcasHoja(t2).length > 0 ? 'SÍ — dos cosas de un toque 🔴' : 'no ✓'}`);

di('\n── ④ LA FILA «Pregúntale» ABRE LA HOJA ────────────────────');
await orbe().click();
await page.waitForTimeout(1500);
/* La fila es el orbe CHICO, con la misma voz. El grande, ya abierto, se llama
   «Abrir a …» otra vez (su onPress es onCerrar), así que se distinguen. */
const fila = page.getByRole('button', { name: /^Pregúntale a /i });
di(`nodos «Pregúntale»: ${await fila.count()} (esperado 1: sólo la fila — el orbe ya no lleva esa voz)`);
await fila.first().click();
await page.waitForTimeout(2500);
const t3 = await texto();
di(`marcas de la Hoja: ${marcasHoja(t3).join(' · ') || 'NINGUNA'}`);
di(`la fila cerró la pata: ${['Peso', 'Antiparasitario'].some((d) => t3.includes(d)) ? 'no' : 'sí'}`);

di(`\nerrores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await browser.close();
