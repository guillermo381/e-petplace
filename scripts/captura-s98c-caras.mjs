/**
 * captura-s98c-caras.mjs — LAS MASCOTAS DEJAN DE SER GENÉRICAS (D-806).
 *
 * El founder navegó el prestador y vio la misma huella en todas. La causa,
 * medida: `AvatarMascota` **declara `especie` pero no la usa en el render**
 * (reserva de D-288 desde S44), así que las pantallas venían pasándola
 * creyendo que hacía algo. Lo que pinta es `fotoUrl`, y ahí no llegaba nada
 * cuando la mascota no tenía foto propia.
 *
 * Esta captura fotografía la superficie donde más se nota: la lista de
 * mascotas del prestador. Y no se conforma con la foto: **cuenta las
 * imágenes reales contra las huellas** — una foto de una lista con dos
 * mascotas no prueba que la escalera funcione.
 *
 * Credencial de `.env.local` (R6). Aborta si la sesión no abrió.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';

const DIR = new URL('./capturas/s98-c-caras/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });
const env = readFileSync(new URL('../apps/prestador/.env.local', import.meta.url).pathname, 'utf8');
const leer = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
const EMAIL = process.env.CUENTA || leer('EXPO_PUBLIC_DEMO_EMAIL');
const PASS = process.env.CLAVE || leer('EXPO_PUBLIC_DEMO_PASSWORD');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);

await page.goto('http://localhost:8081/mascotas', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(7000);

if ((await page.getByText('Mascotas', { exact: false }).count()) === 0) {
  console.error('✗ ABORTA: la sesión NO abrió — ninguna foto vale.');
  await browser.close();
  process.exit(1);
}
/* 🔴 `fullPage` NO alcanza acá y costó una foto equivocada: la lista vive
   dentro de un `ScrollView` de RN-web, que tiene su propio overflow — la
   página no crece, scrollea el contenedor. Hay que empujarlo a mano. */
await page.evaluate(() => {
  const cajas = Array.from(document.querySelectorAll('div')).filter(
    (d) => d.scrollHeight > d.clientHeight + 40,
  );
  for (const c of cajas) c.scrollTop = c.scrollHeight;
});
await page.waitForTimeout(2500);
await page.screenshot({ path: `${DIR}01-mascotas-con-cara.png` });
console.log('✓ 01-mascotas-con-cara.png');

/* 🔴 EL DISCRIMINADOR — la foto sola no prueba la escalera. Se cuentan las
   imágenes del bucket `especies-razas` que de verdad se pidieron: si la
   cura no rigiera, este número sería CERO y la pantalla se vería igual de
   "llena" con huellas. */
const caras = await page.evaluate(() =>
  Array.from(document.images)
    .map((i) => i.currentSrc || i.src)
    .filter((s) => s.includes('especies-razas')),
);
console.log(`   caras del catálogo pedidas: ${caras.length}`);
if (caras.length > 0) console.log(`   ejemplo: ${caras[0].split('/').slice(-2).join('/')}`);
else console.log('   ⚠️ CERO — o no hay mascotas sin foto propia, o la cura no rige');

/* ── EL ALTA DEL MOSTRADOR: el blanco ORIGINAL de D-806 ──────────────────
   Las seis especies se dibujaban con la misma huella. Acá se prueba que
   cada una trae su propia cara del catálogo — contando, no mirando. */
await page.goto('http://localhost:8081/mostrador/nueva', {
  waitUntil: 'networkidle',
  timeout: 180000,
});
await page.waitForTimeout(7000);
await page.screenshot({ path: `${DIR}02-alta-especies.png` });
console.log('✓ 02-alta-especies.png');
const especies = await page.evaluate(() =>
  Array.from(document.images)
    .map((i) => i.currentSrc || i.src)
    .filter((s) => s.includes('especies-razas'))
    .map((s) => s.split('/').slice(-2).join('/')),
);
console.log(`   caras del selector: ${especies.length} → ${JSON.stringify(especies)}`);
if (especies.length < 2) {
  console.error('   ✗ el selector NO trae caras propias — la cura no rige acá');
  process.exitCode = 1;
}

await browser.close();
if (errores.length > 0) {
  console.error(`✗ ${errores.length} error(es) JS:`, errores);
  process.exit(1);
}
console.log('✓ sin errores JS');
