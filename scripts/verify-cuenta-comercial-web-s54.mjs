// Verificación runtime web S54-B: Negocio con Cobros vivos + módulo
// Cuenta comercial (peldaño real de la cuenta demo — activa desde que
// la Sesión A la activó el 10-Jul) + formulario de bancarios + registro.
// Sesión dev demo (D-290). Dev server prestador en :8081.
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

// ── NEGOCIO: sección Cobros con el estado real ──
await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 180000 });
let t = await texto();
for (let i = 0; i < 30 && !t.includes('Cobros'); i++) {
  await page.waitForTimeout(1000);
  t = await texto();
}
check(t.includes('Cobros'), 'Negocio: sección Cobros');
check(t.includes('Cuenta comercial'), 'Negocio: Celda cuenta comercial');
check(t.includes('Activa'), 'Negocio: estado real de la cuenta demo (activa)');
check(t.includes('Se despierta cuando empieces a cobrar por la app.'), 'Negocio: liquidaciones peldaño 0 (ledger vacío — hito conservado)');
check(!t.includes('$0') && !t.includes('0 servicios'), 'Negocio: JAMÁS $0 ni ceros');
check(t.includes('En preparación'), 'Negocio: lo dormido sigue sereno');
await page.screenshot({ path: `${S}/s54-negocio.png`, fullPage: true });

// ── CUENTA COMERCIAL: peldaño 2 (activa) ──
await page.goto('http://localhost:8081/cuenta-comercial', { waitUntil: 'networkidle', timeout: 60000 });
t = await texto();
for (let i = 0; i < 20 && !t.includes('Datos fiscales'); i++) {
  await page.waitForTimeout(1000);
  t = await texto();
}
check(t.includes('Activa'), 'Cuenta: insignia Activa');
check(t.includes('puedes cobrar por la app'), 'Cuenta: voz del estado activa (tuteo)');
check(t.includes('Datos fiscales'), 'Cuenta: módulo fiscal');
check(t.includes('[DEMO S44] Paseos Andres'), 'Cuenta: nombre comercial REAL de la DB');
check(t.includes('Banco Pichincha'), 'Cuenta: banco visible');
check(t.includes('•••• 4567'), 'Cuenta: número SIEMPRE enmascarado');
check(!t.includes('2201234567'), 'Cuenta: el número completo JAMÁS se pinta');
check(t.includes('Actualizar datos bancarios'), 'Cuenta: acción de actualizar (ghost)');
await page.screenshot({ path: `${S}/s54-cuenta.png`, fullPage: true });

// ── BANCARIOS: formulario con catálogos vivos ──
await page.goto('http://localhost:8081/cuenta-comercial/bancarios', { waitUntil: 'networkidle', timeout: 60000 });
t = await texto();
for (let i = 0; i < 20 && !t.includes('Tipo de cuenta'); i++) {
  await page.waitForTimeout(1000);
  t = await texto();
}
check(t.includes('una sola transferencia'), 'Bancarios: educación §4.1 presente');
check(t.includes('Elige tu banco'), 'Bancarios: selector de banco');
check(t.includes('Corriente') && t.includes('Ahorros'), 'Bancarios: tipos de cuenta');
check(t.includes('Cédula de identidad') && t.includes('RUC') && t.includes('Pasaporte'), 'Bancarios: 3 tipos de documento del catálogo VIVO');
check(t.includes('Número de cuenta') && t.includes('Titular de la cuenta'), 'Bancarios: campos del esquema §7.12');
await page.screenshot({ path: `${S}/s54-bancarios.png`, fullPage: true });

// abrir la Hoja del banco: los 17 del catálogo con scroll propio
await page.getByText('Elige tu banco', { exact: true }).first().click();
await page.waitForTimeout(1500);
t = await texto();
check(t.includes('Banco Pichincha') && t.includes('Banco del Pacífico'), 'Bancarios: Hoja con bancos reales de cat_bancos');
await page.screenshot({ path: `${S}/s54-bancos-hoja.png` });

// ── REGISTRO (peldaño 0): la pantalla existe y respeta el orden §6.5 ──
await page.goto('http://localhost:8081/cuenta-comercial/nueva', { waitUntil: 'networkidle', timeout: 60000 });
t = await texto();
for (let i = 0; i < 20 && !t.includes('Registrar cuenta'); i++) {
  await page.waitForTimeout(1000);
  t = await texto();
}
check(t.includes('identificación fiscal'), 'Nueva: la identificación abre el flujo (§6.5)');
check(t.includes('Ecuador'), 'Nueva: país activo del catálogo (EC)');
check(t.includes('Tipo de contribuyente'), 'Nueva: tipo fiscal por catálogo');
check(t.includes('Continuar'), 'Nueva: CTA de detección antes de pedir el resto');
check(!t.includes('Razón social'), 'Nueva: los datos fiscales NO se piden antes de verificar');
await page.screenshot({ path: `${S}/s54-nueva.png`, fullPage: true });

await browser.close();
console.log(fallos === 0 ? '\nRUNTIME WEB OK' : `\n${fallos} CHECK(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
