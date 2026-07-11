// Verificación runtime D-315 pata prestador (S54-B): el flujo de
// atención habla por el riel — cierre en modo lectura con DATOS REALES
// (cita demo cerrada de S44), estado no-disponible, y cambio de idioma
// EN VIVO mostrando las voces funcionales en en (la voz emocional
// pendiente de gate queda en español a propósito — mezcla honesta).
// Dev server prestador en :8081. Comportamiento cero: mismas pantallas.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const S = process.env.SCRATCH ?? '/tmp';
const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const CITA_CERRADA = 'de300000-0000-4000-8000-00000000c001'; // paseo Zeus S44, cerrada_con_calidad
const CITA_INEXISTENTE = 'de300000-0000-4000-8000-00000000dead';
let fallos = 0;
const check = (cond, nombre) => {
  console.log(`${cond ? '✓' : '✗ FALTA'} ${nombre}`);
  if (!cond) fallos++;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);
const esperar = async (frag, intentos = 30) => {
  let t = await texto();
  for (let i = 0; i < intentos && !t.includes(frag); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};

// ── login real (D-290, S54-B: el auto-firmado dev murió) ──
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña');
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Tus paseos de hoy');

// ── ES: cierre en modo lectura con datos reales ──
await page.goto(`http://localhost:8081/cita/${CITA_CERRADA}/cierre`, { waitUntil: 'networkidle', timeout: 180000 });
let t = await esperar('Parte del paseo');
check(t.includes('Parte del paseo'), 'es · cierre: título por el riel');
check(t.includes('puntos gps'), 'es · cierre: conteos mono por el riel');
check(t.includes('Parte del perro'), 'es · cierre: sección del parte');
check(t.includes('parte enviado'), 'es · cierre: pie de lectura');
await page.screenshot({ path: `${S}/d315-cierre-es.png`, fullPage: true });

// ── ES: cita inexistente → estado no-disponible (tuteo: "Vuelve") ──
await page.goto(`http://localhost:8081/cita/${CITA_INEXISTENTE}`, { waitUntil: 'networkidle', timeout: 60000 });
t = await esperar('ya no está disponible');
check(t.includes('Esta cita ya no está disponible'), 'es · detalle: no-disponible por el riel');
check(t.includes('Vuelve a la agenda'), 'es · detalle: voseo→tuteo ("Vuelve", no "Volvé")');
check(t.includes('Volver a la agenda'), 'es · detalle: CTA volver');

// ── cambio de idioma EN VIVO (el selector real de Negocio) ──
await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 60000 });
await esperar('Idioma');
await page.getByText('English', { exact: true }).first().click();
await page.waitForTimeout(1500);

// ── EN: HOY con voces funcionales en inglés ──
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 60000 });
t = await esperar('Your walks for today');
check(t.includes('Your walks for today'), 'en · HOY: saludo en inglés (idioma vivo)');

// ── EN: cierre — funcional en inglés, emocional honesta en español ──
await page.goto(`http://localhost:8081/cita/${CITA_CERRADA}/cierre`, { waitUntil: 'networkidle', timeout: 60000 });
t = await esperar('Walk report');
check(t.includes('Walk report'), 'en · cierre: título');
check(t.includes('gps points'), 'en · cierre: conteos mono');
check(t.includes("Dog's report"), 'en · cierre: sección del parte');
check(t.includes('report sent'), 'en · cierre: pie de lectura');
await page.screenshot({ path: `${S}/d315-cierre-en.png`, fullPage: true });

// ── EN: no-disponible ──
await page.goto(`http://localhost:8081/cita/${CITA_INEXISTENTE}`, { waitUntil: 'networkidle', timeout: 60000 });
t = await esperar('no longer available');
check(t.includes('This appointment is no longer available'), 'en · detalle: no-disponible');

// ── volver a español (el override persiste — no dejar el estado sucio) ──
await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 60000 });
await esperar('Language');
await page.getByText('Español', { exact: true }).first().click();
await page.waitForTimeout(1500);
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 60000 });
t = await esperar('Tus paseos de hoy');
check(t.includes('Tus paseos de hoy'), 'es · vuelta a español verificada');

await browser.close();
console.log(fallos === 0 ? '\nRUNTIME D-315p OK' : `\n${fallos} CHECK(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
