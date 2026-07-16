// Smoke web S63-B — el taller del adiestrador: el paso de especies
// BLOQUEA de verdad (CTA apagado + porqué visible) y declarar lo
// libera. SOLO LECTURA + interacción local (no guarda nada).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PUERTO = process.env.PORT_PRESTADOR ?? '8085';
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
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1200 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);
const esperar = async (frase, veces) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};

// login demo (patrón S60)
await page.goto(`http://localhost:${PUERTO}/login`, { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Tu jornada de hoy', 60);

// T1 — la tab Negocio muestra el mundo Adiestramiento
await page.goto(`http://localhost:${PUERTO}/negocio`, { waitUntil: 'networkidle' });
let t = await esperar('Adiestramiento', 30);
check(t.includes('Adiestramiento'), 'T1 el mundo Adiestramiento vive en Negocio');

// T2 — el taller abre con el paso de especies SIN default
await page.goto(`http://localhost:${PUERTO}/adiestramiento/taller`, { waitUntil: 'networkidle' });
t = await esperar('Con quién trabajas', 30);
check(t.includes('Con quién trabajas'), 'T2 el paso de especies presente');
check(t.includes('Falta declarar con quién trabajas'), 'T3 el porqué del bloqueo visible');
// RN-web: el Boton deshabilitado expone aria-disabled en su nodo con
// role — se lee del ANCESTRO del texto (getByRole excluiría matices).
const estadoCta = async () =>
  await page.evaluate(() => {
    const nodo = [...document.querySelectorAll('[role="button"], button')].find((b) =>
      (b.textContent ?? '').includes('Guardar oferta'),
    );
    return nodo ? { existe: true, deshabilitado: nodo.getAttribute('aria-disabled') === 'true' || nodo.hasAttribute('disabled') } : { existe: false, deshabilitado: false };
  });
let cta = await estadoCta();
check(cta.existe && cta.deshabilitado, 'T4 CTA bloqueado sin especies');

// T5 — declarar libera (interacción local, sin guardar)
await page.getByText('Perros', { exact: true }).click();
await page.waitForTimeout(500);
t = await texto();
check(!t.includes('Falta declarar con quién trabajas'), 'T5 declarar retira el porqué');
cta = await estadoCta();
check(cta.existe && !cta.deshabilitado, 'T6 CTA habilitado con especies declaradas');

await browser.close();
console.log(fallos === 0 ? 'SMOKE TALLER ADIESTRAMIENTO: 0 fallos' : `SMOKE TALLER: ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
