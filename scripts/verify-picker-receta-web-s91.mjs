// Smoke runtime RN-web S91-C — EL PICKER DE LA RECETA monta y decide.
//
// Qué prueba y qué NO (regla 77 — el alcance se declara, no se insinúa):
//  ✓ las DOS superficies que bajan papeles MONTAN con el cableado nuevo
//    (tsc no caza JSX cruzado — L-192, cobrada en S81);
//  ✓ la rama «ninguna consulta» habla en voz NEUTRA en vez de rebotar con
//    «falta indicar cuál» — que es EL muro que el founder chocó;
//  ✗ la rama «elegir» (2+) NO se alcanza acá: su único fixture vivo es
//    Thor `d2e31d70`, de la familia `guillo381+8` (cuenta real del
//    founder). Esa rama es SU gate en dispositivo, y se declara abierta.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

let fallos = 0;
const check = (cond, nombre) => {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}`);
  if (!cond) fallos += 1;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

// Un error de runtime en el bundle NO se ve en el texto de la página: se
// escucha. Si el mount revienta, esto lo dice con nombre.
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

const leer = () => page.evaluate(() => document.body.innerText);
async function esperar(frag, vueltas = 30) {
  let texto = '';
  for (let i = 0; i < vueltas; i++) {
    texto = await leer();
    if (texto.includes(frag)) return texto;
    await page.waitForTimeout(1000);
  }
  return texto;
}

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(5000);

// EL BLOQUEO SE NOMBRA, NO SE SUFRE (L-197: un guard que no puede medir va
// ROJO, jamás verde — y si va rojo, dice POR QUÉ o hace perder una tarde).
// Medido S91-C: `demo-prestador@epetplace.dev` EXISTE en auth con 1 familia
// y 1 mascota; lo que no sirve es la CONTRASEÑA de `apps/cliente/.env.local`.
// Esto no bloquea solo a este smoke: bloquea a TODO smoke web de la casa
// que entre por la UI.
if ((await leer()).includes('El email o la contraseña no coinciden')) {
  console.log('✗ BLOQUEADO · la credencial demo del cliente no entra.');
  console.log('  El usuario EXISTE en auth (1 familia · 1 mascota) — lo vencido');
  console.log('  es EXPO_PUBLIC_DEMO_PASSWORD en apps/cliente/.env.local.');
  console.log('  Sin eso, ninguna rama del picker se puede medir acá.');
  await browser.close();
  process.exit(1);
}

// ── ① Cuenta → Documentos del hogar (la casa de TODOS los papeles) ──
await page.goto('http://localhost:8082/cuenta/documentos', { waitUntil: 'networkidle' });
let texto = await esperar('Receta');
check(texto.includes('Receta'), 'Documentos del hogar: la fila «Receta» monta');
check(texto.includes('Carnet de vacunas'), 'Documentos del hogar: los otros papeles siguen vivos');

await page.getByText('Receta', { exact: true }).first().click();
texto = await esperar('Todavía no hay ninguna receta', 12);
check(
  texto.includes('Todavía no hay ninguna receta'),
  'Documentos: sin recetas habla la VOZ, ya no rebota «falta indicar cuál»',
);
check(
  !texto.includes('falta indicar cuál'),
  'Documentos: el muro de `ref_requerida` NO aparece (es el que se cura)',
);

// ── ② El perfil de la mascota (la otra superficie que baja papeles) ──
await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
texto = await leer();
const nombre = (texto.match(/^(Zeus|Thor)$/m) ?? [])[0];
check(nombre !== undefined, `Hogar: hay una mascota para abrir (${nombre ?? 'ninguna'})`);
if (nombre !== undefined) {
  await page.getByText(nombre, { exact: true }).first().click();
  await page.waitForTimeout(3000);
  texto = await esperar('Documentos', 20);
  check(texto.includes('Documentos'), 'Perfil: la sección de papeles monta (plegada)');
  await page.getByText('Documentos', { exact: true }).first().click();
  texto = await esperar('Receta', 12);
  check(texto.includes('Receta'), 'Perfil: desplegada, la fila «Receta» está');
  await page.getByText('Receta', { exact: true }).first().click();
  texto = await esperar('Todavía no hay ninguna receta', 12);
  check(
    texto.includes('Todavía no hay ninguna receta'),
    'Perfil: sin recetas habla la VOZ (y no la línea roja de fallo)',
  );
}

check(errores.length === 0, `sin errores de runtime (${errores.length}): ${errores.slice(0, 2).join(' | ')}`);

await browser.close();
console.log(fallos === 0 ? '\nSMOKE PICKER RECETA — VERDE' : `\nSMOKE — ${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
