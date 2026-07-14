// Verificación runtime D-290 (S54-B): auth REAL del prestador en web.
// Flujos: raíz sin sesión → invitación · login con credenciales malas
// → error inline · login real (demo prestador) → HOY vivo · sesión
// PERSISTE tras reload · logout desde Negocio → aterriza en login y
// el raíz queda sin sesión. El caso "user sin negocio" no se ejercita
// acá (no hay credenciales de un user sin fila en prestadores y crear
// uno en la DB viva es huella) — va al gate founder con su cuenta de
// dueño. Dev server prestador en :8081.
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
const esperar = async (frag, intentos = 40) => {
  let t = await texto();
  for (let i = 0; i < intentos && !t.includes(frag); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};

// ── 1. contexto FRESCO (cero sesión): la invitación digna ──
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 180000 });
let t = await esperar('No hay una sesión activa');
check(t.includes('No hay una sesión activa'), '1 · raíz sin sesión: estado digno');
check(t.includes('Inicia sesión para ver tu jornada.'), '1b · la invitación (voz nueva)');
check(t.includes('Iniciar sesión'), '1c · CTA de login presente');
check(!t.includes('sesión de prueba del equipo'), '1d · la voz del bootstrap dev MURIÓ');
await page.screenshot({ path: `${S}/d290-sin-sesion.png` });

// ── 2. login con contraseña mala → error inline, seguimos en login ──
await page.getByText('Iniciar sesión', { exact: true }).last().click();
await esperar('Contraseña');
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill('contraseña-equivocada');
await page.getByText('Entrar', { exact: true }).click();
t = await esperar('no coinciden');
check(t.includes('El email o la contraseña no coinciden.'), '2 · credenciales malas: error inline del wrapper');
await page.screenshot({ path: `${S}/d290-login-error.png` });

// ── 3. login REAL (user demo, prestador vivo) → HOY ──
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
t = await esperar('Tu jornada de hoy');
check(t.includes('Tu jornada de hoy'), '3 · login real → HOY vivo (routing por estado real)');
check(t.includes('Hoy') && t.includes('Mascotas') && t.includes('Negocio'), '3b · tabs presentes');
await page.screenshot({ path: `${S}/d290-hoy.png` });

// ── 4. la sesión PERSISTE tras reload ──
await page.reload({ waitUntil: 'networkidle' });
t = await esperar('Tu jornada de hoy');
check(t.includes('Tu jornada de hoy'), '4 · reload: sesión persistida (sin re-login)');

// ── 5. logout desde Negocio → login → raíz sin sesión ──
await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 60000 });
await esperar('Cerrar sesión');
await page.getByText('Cerrar sesión', { exact: true }).first().click();
await page.waitForTimeout(800);
// la Hoja de confirmación: el botón destructivo repite la etiqueta
await page.getByText('Cerrar sesión', { exact: true }).last().click();
t = await esperar('Iniciar sesión');
check(t.includes('Iniciar sesión'), '5 · logout aterriza en el login');
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 60000 });
t = await esperar('No hay una sesión activa');
check(t.includes('No hay una sesión activa'), '5b · el raíz quedó sin sesión (guard re-decidió)');
await page.screenshot({ path: `${S}/d290-post-logout.png` });

await browser.close();
console.log(fallos === 0 ? '\nRUNTIME D-290 OK' : `\n${fallos} CHECK(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
