// Verificación runtime S51-B3 (regla 13 + test 8): esqueleto prestador
// — tabs, HOY 4 zonas con verdad firme, Mascotas con datos reales,
// detalle icónico, Negocio con idioma vivo. Sesión dev demo (D-290).
import { chromium } from 'playwright-core';

const S = process.env.SCRATCH ?? '/tmp';
let fallos = 0;
const check = (cond, nombre) => {
  console.log(`${cond ? '✓' : '✗ FALTA'} ${nombre}`);
  if (!cond) fallos++;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);

// ── HOY (la sesión dev se firma sola) ──
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 180000 });
let t = await texto();
for (let i = 0; i < 30 && !t.includes('Tus paseos de hoy'); i++) {
  await page.waitForTimeout(1000);
  t = await texto();
}
check(t.includes('Tus paseos de hoy'), 'HOY: portada');
check(t.includes('Hoy') && t.includes('Mascotas') && t.includes('Negocio'), 'BarraTabs: 3 tabs');
// las citas del demo son del 2026-07-07: HOY (sin citas) el estado
// correcto es el vacío digno — la verdad firme del wrapper se prueba
// aparte contra ese día (scripts/verify-verdad-firme.mjs: 3 en DB → 2).
check(t.includes('Hoy no tienes paseos'), 'HOY: vacío digno (0 citas hoy — verdad)');
check(!t.includes('Por confirmar'), 'HOY: nada tentativo pintado');
await page.screenshot({ path: `${S}/prest-hoy.png`, fullPage: true });

// ── MASCOTAS ──
await page.getByText('Mascotas', { exact: true }).last().click();
await page.waitForTimeout(4000);
t = await texto();
check(t.includes('Zeus'), 'Mascotas: Zeus (2 atenciones reales de S44)');
check(t.includes('2 atenciones'), 'Mascotas: conteo real de atenciones');
await page.screenshot({ path: `${S}/prest-mascotas.png` });

// ── DETALLE ICÓNICO ──
await page.getByText('Zeus', { exact: true }).first().click();
await page.waitForTimeout(5000);
t = await texto();
check(t.includes('Zeus'), 'Detalle: cabecera con presencia');
check(/vacunas registradas|vacuna registrada/.test(t), 'Detalle: carnet real (señal)');
check(t.includes('TU HISTORIAL CON ZEUS') || /historial con Zeus/i.test(t), 'Detalle: historial con ESTE prestador');
check(t.includes('Paseo cerrado'), 'Detalle: atenciones cerradas reales');
check(!t.includes('@') && !/\+593|09\d{8}/.test(t), 'Detalle: SIN contacto de la familia (RLS/§6.4.5)');
await page.screenshot({ path: `${S}/prest-detalle.png`, fullPage: true });
await page.goBack();
await page.waitForTimeout(2000);

// ── NEGOCIO + idioma vivo ──
await page.getByText('Negocio', { exact: true }).last().click();
await page.waitForTimeout(2500);
t = await texto();
check(t.includes('Tu negocio'), 'Negocio: portada');
check(t.includes('En preparación'), 'Negocio: lugares honestos');
check(t.includes('cuando empieces a cobrar por la app') || t.includes('Se despierta'), 'Negocio: liquidaciones en hitos, JAMÁS $0');
check(!t.includes('$0') && !t.includes('$ 0'), 'Negocio: cero métricas en cero');
await page.screenshot({ path: `${S}/prest-negocio.png`, fullPage: true });
await page.getByText('English', { exact: true }).click();
await page.waitForTimeout(1500);
t = await texto();
check(t.includes('Your business'), 'Negocio: idioma VIVO → English');
check(t.includes('Today') && t.includes('Pets'), 'Tabs re-etiquetadas en English');
await page.getByText('Español', { exact: true }).click();
await page.waitForTimeout(1000);

await ctx.close();
await browser.close();
console.log(`\n${fallos === 0 ? 'PRESTADOR VERIFICADO: 0 fallos' : `FALLOS: ${fallos}`}`);
process.exit(fallos === 0 ? 0 : 1);
