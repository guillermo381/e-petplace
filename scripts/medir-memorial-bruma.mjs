/**
 * D-1021 · BRUMA — una mascota en memoria no se trata como viva.
 *
 * Sesión REAL con la cuenta demo (fixture de E). Se mide **qué le PIDE** cada
 * pantalla: los verbos son el síntoma —«registrar», «cargar», «resolver»— y
 * la presencia con Coach es el peor, porque sus cuatro atajos actúan.
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const QUIEN = process.env.MASCOTA ?? 'Bruma';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } })).newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(`${e.name}: ${e.message}`));
const T = async () => await page.evaluate(() => document.body.innerText).catch(() => '');
const di = (s) => console.log(s);
const botones = async () =>
  await page.evaluate(() => [...document.querySelectorAll('[role="button"]')].map((e) => (e.getAttribute('aria-label') ?? '').trim()).filter(Boolean));

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 240000 });
for (let i = 0; i < 60 && !(await T()).includes('Contraseña'); i++) await page.waitForTimeout(1000);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(16000);

di(`── EL HOGAR ───────────────────────────────────────────────`);
const tH = await T();
di(`mascotas a la vista: ${['Zeus', 'Kira', 'Bruma', 'Thor', 'Sombra'].filter((n) => tH.includes(n)).join(' · ')}`);
const chip = page.getByRole('button', { name: QUIEN, exact: true });
if ((await chip.count()) === 0) {
  di(`🔴 No encuentro a ${QUIEN} — no pude medir.`);
  di(tH.split('\n').filter((x) => x.trim()).slice(0, 10).join(' · '));
  await browser.close(); process.exit(2);
}

di(`\n── LA FICHA DE ${QUIEN} ───────────────────────────────────`);
await chip.first().click();
await page.waitForTimeout(7000);
const t = await T();
const b = await botones();
const PIDEN = ['Registrar', 'registrar', 'Cargar', 'cargar el carnet', 'Agendar', 'Reservar', 'Anotar', 'Actualizar', 'Declarar'];
di(`ruta: ${page.url().replace('http://localhost:8082','')}`);
di(`verbos que le PIDEN algo: ${[...new Set(PIDEN.filter((v) => t.includes(v)))].join(' · ') || 'NINGUNO ✓'}`);
di(`botones que le piden: ${b.filter((n) => PIDEN.some((v) => n.includes(v))).join(' · ') || 'ninguno ✓'}`);
di(`presencia CON Coach: ${b.filter((n) => /^Abrir a /i.test(n)).join(' · ') || 'no ✓'}`);
di(`presencia SIN Coach: ${b.filter((n) => /Lo que te espera/i.test(n)).join(' · ') || 'no'}`);
di(`dedos a la vista: ${b.filter((n) => /^(Peso|Vacuna|Antiparasitario|Foto)$/.test(n)).join(' · ') || 'ninguno ✓'}`);
di(`«por resolver» / pendientes: ${/por resolver|Ponte al día/i.test(t) ? 'SÍ 🔴' : 'no ✓'}`);
di(`\nerrores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await browser.close();
