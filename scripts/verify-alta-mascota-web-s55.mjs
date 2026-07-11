// Smoke runtime RN-web S55-A A2 — la entrada del Hogar y los pasos del
// alta adicional renderizan con sesión demo (login por UI, patrón S54).
// El gate E2E de cierre es del founder en dispositivo; esto verifica que
// el flujo VIVE en runtime (regla 13: build verde ≠ funciona).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

let fallos = 0;
function check(cond, nombre) {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}`);
  if (!cond) fallos += 1;
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
// el campo de contraseña es el único input type=password de la pantalla
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();

// Hogar con la entrada del alta
let texto = '';
for (let i = 0; i < 30; i++) {
  texto = await page.evaluate(() => document.body.innerText);
  if (texto.includes('Agregar mascota')) break;
  await page.waitForTimeout(1000);
}
check(texto.includes('Agregar mascota'), 'Hogar: la entrada "Agregar mascota" vive en Zona 1');
check(texto.includes('Cada quien con su propia historia.'), 'Hogar: el detalle sereno de la entrada');

// Paso 1
await page.getByText('Agregar mascota', { exact: true }).first().click();
for (let i = 0; i < 20; i++) {
  texto = await page.evaluate(() => document.body.innerText);
  if (texto.includes('¿Quién más vive contigo?')) break;
  await page.waitForTimeout(500);
}
check(texto.includes('¿Quién más vive contigo?'), 'Paso 1: título tuteo por el riel');
check(texto.includes('Su nombre'), 'Paso 1: campo nombre');
for (let i = 0; i < 20; i++) {
  texto = await page.evaluate(() => document.body.innerText);
  if (texto.includes('¿Qué especie es?')) break;
  await page.waitForTimeout(500);
}
check(texto.includes('¿Qué especie es?'), 'Paso 1: catálogo de especies REAL cargado');

// Nombre + especie → fecha
await page.getByPlaceholder('ej: Zeus').fill('Prueba Web');
await page.getByText('Perro', { exact: true }).first().click();
await page.getByText('Continuar', { exact: true }).click();
for (let i = 0; i < 20; i++) {
  texto = await page.evaluate(() => document.body.innerText);
  if (texto.includes('¿Cuándo nació?')) break;
  await page.waitForTimeout(500);
}
check(texto.includes('Sobre Prueba Web'), 'Paso 2: título con el nombre');
check(texto.includes('¿Cuándo nació?'), 'Paso 2: CampoFecha presente');
check(texto.includes('¿Es macho o hembra?'), 'Paso 2: selector de sexo');

// → foto (sin cerrar: el alta real es del gate founder en dispositivo)
// .last(): la pantalla anterior del stack sigue montada en RN-web
await page.getByText('Continuar', { exact: true }).last().click();
for (let i = 0; i < 20; i++) {
  texto = await page.evaluate(() => document.body.innerText);
  if (texto.includes('La cara de Prueba Web')) break;
  await page.waitForTimeout(500);
}
check(texto.includes('La cara de Prueba Web'), 'Paso 3: SelectorAvatar con el nombre');

await browser.close();
console.log(fallos === 0 ? 'TODOS LOS ASSERTS PASARON' : `${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
