// Verificación runtime web S54-B: Negocio con Cobros vivos + módulo
// Cuenta comercial (peldaño real de la cuenta demo — activa desde que
// la Sesión A la activó el 10-Jul) + formulario de bancarios + registro.
// Sesión dev demo (D-290). Dev server prestador en :8081.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const S = process.env.SCRATCH ?? '/tmp';
const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
let fallos = 0;
const check = (cond, nombre) => {
  console.log(`${cond ? '✓' : '✗ FALTA'} ${nombre}`);
  if (!cond) fallos++;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);

// ── login real (D-290, S54-B: el auto-firmado dev murió) ──
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
let t = await texto();
for (let i = 0; i < 30 && !t.includes('Contraseña'); i++) {
  await page.waitForTimeout(1000);
  t = await texto();
}
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
for (let i = 0; i < 30 && !t.includes('Tu jornada de hoy'); i++) {
  await page.waitForTimeout(1000);
  t = await texto();
}

// ── NEGOCIO: sección Cobros con el estado real ──
await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 60000 });
t = await texto();
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
// patrón, no valor: los bancarios del demo son estado COMPARTIDO con la
// Sesión A (lección del 11-jul: el número cambió bajo el check literal)
check(/••••\s+\S{1,4}/.test(t), 'Cuenta: número SIEMPRE enmascarado (patrón)');
check(!/\d{6,}/.test(t.split('Datos bancarios')[1] ?? ''), 'Cuenta: nada con pinta de número completo tras la máscara');
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
