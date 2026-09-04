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
di('── ① ¿EL ORBE ESTÁ MONTADO? ───────────────────────────────');
/* Cerrado, su nombre accesible es `voz.orbe` = «Abrir a Nexo». */
const orbe = page.getByRole('button', { name: /Abrir a /i }).first();
const hay = await orbe.count();
di(`orbe en reposo: ${hay > 0 ? 'SÍ, montado' : 'NO montado'}`);
if (hay === 0) {
  di('(sin orbe no hay nada que medir — puede ser memorial, hogar sin mascotas o ruta silenciada)');
  di(`pantalla: ${(await texto()).split('\n').slice(0, 6).join(' · ')}`);
  await browser.close();
  process.exit(2);
}

const leer = async () => {
  const b = page.getByRole('button', { name: /Abrir a |Pregúntale a /i }).first();
  return {
    nombre: await b.getAttribute('aria-label'),
    expanded: await b.getAttribute('aria-expanded'),
  };
};

const antes = await leer();
di(`   antes  · aria-label="${antes.nombre}" · aria-expanded=${antes.expanded}`);

di('\n── ② SE TOCA EL ORBE ──────────────────────────────────────');
await orbe.click();
await page.waitForTimeout(1500);
const despues = await leer();
di(`   después · aria-label="${despues.nombre}" · aria-expanded=${despues.expanded}`);

const abrio = despues.expanded === 'true' || /Pregúntale/i.test(despues.nombre ?? '');
di(`\n⇒ ¿\`abierta\` LLEGÓ a la pieza? ${abrio ? 'SÍ' : 'NO'}`);
di(abrio
  ? '   ⇒ el montaje hizo su parte: `violeta = abierta || …` da true, así que si'
  : '   ⇒ el montaje NO encendió `abierta`: la causa es del cableado.');
if (abrio) di('      el orbe no se ve encendido, la causa está en el DIBUJO de la pieza.');

di('\n── ③ LA FILA «Pregúntale» ─────────────────────────────────');
const fila = page.getByRole('button', { name: /Pregúntale a /i });
di(`nodos con esa voz: ${await fila.count()} (esperado 2: la etiqueta y el orbe abierto)`);
const t2 = await texto();
di(`dedos a la vista: ${['Peso', 'Vacuna', 'Antiparasitario', 'Foto'].filter((d) => t2.includes(d)).join(' · ') || 'ninguno'}`);

di('\n── ④ SE TOCA LA ETIQUETA: ¿abre la Hoja? ──────────────────');
await fila.first().click();
await page.waitForTimeout(2500);
const t3 = await texto();
const hoja = ['¿Qué edad tiene?', '¿Cómo va su carnet?', '¿Qué actividad tiene?', 'Soy Nexo'].filter((f) => t3.includes(f));
di(`marcas de la Hoja del Coach: ${hoja.length > 0 ? hoja.join(' · ') : 'NINGUNA'}`);

di(`\nerrores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await browser.close();
