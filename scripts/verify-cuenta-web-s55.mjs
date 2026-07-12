// Smoke runtime RN-web S55-B3 — Cuenta v1: el índice y sus 5 pantallas
// renderizan con sesión demo; el toggle de notificaciones persiste
// (verificado contra DB vía wrapper: RN-web no emite aria-checked en
// el radio — probado S55, el atributo no es señal).
// Correr con: npx tsx scripts/verify-cuenta-web-s55.mjs (dev server 8082).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { initApi, iniciarSesion, obtenerPreferencias } from '../packages/api/src/index.ts';

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

// sesión API paralela (mismo user demo) para leer la VERDAD de DB
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const loginApi = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!loginApi.ok) {
  console.log('✗ sin sesión demo (api):', loginApi.mensaje);
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

async function esperarTexto(needle, timeoutIter = 20) {
  let texto = '';
  for (let i = 0; i < timeoutIter; i++) {
    texto = await page.evaluate(() => document.body.innerText);
    if (texto.includes(needle)) return texto;
    await page.waitForTimeout(500);
  }
  return texto;
}

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForURL(/hogar/, { timeout: 60000 });

// índice
await page.goto('http://localhost:8082/cuenta', { waitUntil: 'networkidle', timeout: 60000 });
let texto = await esperarTexto('Ayuda y legales');
check(texto.includes('Tu perfil') && texto.includes('Tu familia') && texto.includes('Preferencias') && texto.includes('Pagos'), 'índice: los 5 lugares viven');
check(texto.includes('Sesión y cuenta') && texto.includes('Eliminar cuenta'), 'índice: sesión y eliminar visibles');

// eliminar cuenta — letra (a): la voz honesta abre y cierra
await page.getByText('Eliminar cuenta', { exact: true }).click();
texto = await esperarTexto('una vida documentada');
check(texto.includes('una vida documentada no se borra a la ligera'), 'eliminar (a): la voz honesta habla');
await page.getByText('Entendido', { exact: true }).click();
await page.waitForTimeout(600);

// Sub-pantallas por URL directa (tras goBack RN-web deja pantallas
// montadas y el click puede caer en un nodo oculto — patrón del smoke
// del alta; la navegación por Celda queda cubierta por el gate founder)
await page.goto('http://localhost:8082/cuenta/perfil', { waitUntil: 'networkidle', timeout: 60000 });
texto = await esperarTexto('El email no se cambia desde acá todavía.');
// el value de un input NO vive en innerText: se lee de los inputs
const valores = await page.locator('input').evaluateAll((els) => els.map((e) => e.value).join('|'));
check(valores.includes(env.EXPO_PUBLIC_DEMO_EMAIL), 'perfil: email read-only presente');
check(texto.includes('Guardar cambios'), 'perfil: guardar presente');

// Tu familia
await page.goto('http://localhost:8082/cuenta/familia', { waitUntil: 'networkidle', timeout: 60000 });
texto = await esperarTexto('Miembros');
check(texto.includes('Nombre de la familia'), 'familia: campo nombre');
check(texto.includes('(tú)'), 'familia: el propio miembro marcado');
check(texto.includes('Invitar a alguien de tu familia') && texto.includes('Pronto'), 'familia: hueco invitar declarado');

// Preferencias — toggle persiste
await page.goto('http://localhost:8082/cuenta/preferencias', { waitUntil: 'networkidle', timeout: 60000 });
texto = await esperarTexto('Cuando las notificaciones lleguen al teléfono');
check(texto.includes('Idioma') && texto.includes('Tus citas') && texto.includes('Novedades y promociones'), 'preferencias: idioma + grupos');
const grupoNovedades = page.getByRole('radiogroup', { name: 'Novedades y promociones' });
await grupoNovedades.getByText('Silenciadas', { exact: true }).click();
await page.waitForTimeout(1500);
const prOff = await obtenerPreferencias();
check(prOff.ok && prOff.data.notificaciones.promocion === false, 'preferencias: el tap Silenciadas PERSISTIÓ en DB');
await grupoNovedades.getByText('Activadas', { exact: true }).click();
await page.waitForTimeout(1500);
const prOn = await obtenerPreferencias();
check(prOn.ok && prOn.data.notificaciones.promocion === true, 'preferencias: el tap Activadas re-encendió en DB');

// Pagos — vacío honesto (el demo dueño no tiene pagos vivos)
await page.goto('http://localhost:8082/cuenta/pagos', { waitUntil: 'networkidle', timeout: 60000 });
texto = await esperarTexto('Métodos de pago');
check(texto.includes('pago es simulado'), 'pagos: métodos en preparación con voz honesta');

// Ayuda y legales
await page.goto('http://localhost:8082/cuenta/ayuda', { waitUntil: 'networkidle', timeout: 60000 });
texto = await esperarTexto('Términos y condiciones');
check(texto.includes('fase de pruebas') && texto.includes('Política de privacidad'), 'ayuda: placeholder legal DECLARADO');

await browser.close();
console.log(fallos === 0 ? 'TODOS LOS ASSERTS PASARON' : `${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
