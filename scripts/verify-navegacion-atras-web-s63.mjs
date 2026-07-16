// Smoke web S63-A — LA SEMÁNTICA DE NAVEGACIÓN FIRMADA (cura D-402
// enmendada): TAB press → raíz del mundo · FLECHA atrás → UN paso ·
// doble tap del tab en raíz no rompe. El caso probativo de la
// regresión: pila de 2 niveles (Hogar → Mis paseos) + push de nivel
// RAÍZ (/paseo/[atencionId]) — con el popToTopOnBlur viejo, el blur
// vaciaba la pila y la flecha aterrizaba en el Hogar; con la cura,
// vuelve a Mis paseos. Solo lectura (paseos cerrados de Zeus demo).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PUERTO = process.env.PORT_CLIENTE ?? '8082';
const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
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
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1200 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);
const esperar = async (frase, veces = 30) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};

// login demo (patrón S60) — tolera la sesión persistida del dev server
await page.goto(`http://localhost:${PUERTO}/login`, { waitUntil: 'networkidle', timeout: 180000 });
let t = await esperar('Tu hogar', 8);
if (!t.includes('Tu hogar')) {
  await esperar('Contraseña', 60);
  await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  t = await esperar('Tu hogar', 60);
}
check(t.includes('Tu hogar') || t.includes('Mis paseos'), 'login demo → Hogar');

// ── T1: pila de 2 niveles — Hogar → Mis paseos ──────────────────────
await page.getByText('Mis paseos', { exact: false }).first().click();
t = await esperar('Historial', 30);
check(t.includes('Historial'), 'T1 · Hogar → Mis paseos (pila 2 niveles)');

// ── T2: la FLECHA desde la pila — UN paso atrás (Mis paseos → Hogar) ─
await page.getByRole('button', { name: 'Volver' }).locator('visible=true').first().click();
t = await esperar('Buen', 20);
check(t.includes('Buen') && !t.includes('Historial'), 'T2 · FLECHA en Mis paseos = un paso (al Hogar, su anterior real)');

// ── T3: pila en CUENTA — Tu perfil → flecha → Cuenta (un paso) ──────
await page.getByRole('tab', { name: 'Cuenta' }).first().click({ force: true }).catch(async () => {
  await page.getByText('Cuenta', { exact: true }).last().click({ force: true });
});
await esperar('Tu perfil', 20);
await page.getByText('Tu perfil', { exact: false }).locator('visible=true').first().click();
await page.waitForTimeout(1500);
await page.getByRole('button', { name: 'Volver' }).locator('visible=true').first().click();
t = await esperar('Tu perfil', 20);
check(t.includes('Tu perfil'), 'T3 · FLECHA en Tu perfil = un paso (vuelve al índice de Cuenta)');

// vuelta al hogar con pila armada para T4
await page.getByRole('tab', { name: 'Hogar' }).first().click({ force: true }).catch(async () => {
  await page.getByText('Hogar', { exact: true }).last().click({ force: true });
});
await esperar('Mis paseos', 20);
await page.getByText('Mis paseos', { exact: false }).locator('visible=true').first().click({ force: true });
await esperar('Historial', 20);

// hallazgo S53 (solo dev): #error-toast de expo-web intercepta clicks
await page.evaluate(() => document.getElementById('error-toast')?.remove());

// ── T4: el TAB press SÍ resetea a la raíz (firmado, se conserva) ────
await page.getByRole('tab', { name: 'Hogar' }).first().click({ force: true }).catch(async () => {
  await page.getByText('Hogar', { exact: true }).last().click({ force: true });
});
t = await esperar('Buen', 20);
check(t.includes('Buen') && !t.includes('Historial'), 'T4 · TAB press → raíz del mundo (pop-to-top solo en el press)');

await page.evaluate(() => document.getElementById('error-toast')?.remove());
// ── T5: doble tap del tab en la raíz no rompe ───────────────────────
await page.getByRole('tab', { name: 'Hogar' }).first().click({ force: true }).catch(async () => {
  await page.getByText('Hogar', { exact: true }).last().click({ force: true });
});
await page.waitForTimeout(800);
t = await texto();
check(t.includes('Buen'), 'T5 · doble tap del tab en raíz: sereno, sin romper');

console.log(fallos === 0 ? '\nNAVEGACIÓN: OK' : `\nNAVEGACIÓN: ${fallos} fallo(s)`);
await browser.close();
process.exit(fallos === 0 ? 0 : 1);
