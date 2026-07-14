// D-329 (S55): el CTA "Ir al Hogar" del éxito del checkout NAVEGA de
// verdad. Crea un hold real por wrapper, entra al checkout por deep
// link con sesión demo, paga (simulado, RPC real) y verifica que el
// botón aterriza en el Hogar. Correr con: npx tsx scripts/verify-d329-checkout-cta.mjs
// Imprime el cita_id para la limpieza quirúrgica server-side por id.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import {
  initApi,
  iniciarSesion,
  obtenerSlotsDisponibles,
  crearBloqueoAgenda,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

let fallos = 0;
function check(cond, nombre, detalle = '') {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
}

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ sin sesión demo:', login.mensaje);
  process.exit(1);
}

const PREST = 'de300000-0000-4000-8000-0000000000e5';
const SRV   = 'de300000-0000-4000-8000-00000000a5e0';
const MASC  = 'de300000-0000-4000-8000-000000000a5c';

// próximo sábado en fecha LOCAL (fix S55)
const hoy = new Date();
const sabado = new Date(hoy);
sabado.setDate(hoy.getDate() + ((6 - hoy.getDay() + 7) % 7 || 7));
const FECHA = new Intl.DateTimeFormat('en-CA').format(sabado);

const slots = await obtenerSlotsDisponibles({ prestador_id: PREST, prestador_servicio_id: SRV, desde: FECHA, hasta: FECHA });
if (!slots.ok || slots.data.length === 0) {
  console.log('✗ sin slots para el ensayo');
  process.exit(1);
}
const hora = slots.data[0].hora.slice(0, 5);
const hold = await crearBloqueoAgenda({ prestador_id: PREST, prestador_servicio_id: SRV, mascota_id: MASC, fecha: FECHA, hora });
check(hold.ok, 'hold creado por wrapper', hold.ok ? hold.data.cita_id : hold.codigo);
if (!hold.ok) process.exit(1);

const qs = new URLSearchParams({
  citaId: hold.data.cita_id,
  expiraEn: hold.data.expira_en,
  precio: String(hold.data.precio),
  prestadorNombre: 'Demo',
  servicioNombre: 'Paseo 30 min',
  fecha: FECHA,
  hora,
  duracion: String(hold.data.duracion_minutos),
}).toString();

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

// sesión demo en el browser (login por UI, patrón S54)
await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
// S60: el login pasó a router.replace('/') (raíz decide por estado de
// sesión) — el matcher acepta la raíz además de los destinos viejos.
await page.waitForURL(/hogar|onboarding|localhost:8082\/(\?|$)/, { timeout: 60000 });

// deep link al checkout con el hold vivo
await page.goto(`http://localhost:8082/explorar/paseo/checkout?${qs}`, { waitUntil: 'networkidle', timeout: 120000 });
let texto = '';
for (let i = 0; i < 20; i++) {
  texto = await page.evaluate(() => document.body.innerText);
  if (texto.includes('Pagar (simulado)')) break;
  await page.waitForTimeout(500);
}
check(texto.includes('Pagar (simulado)'), 'checkout renderiza con el hold');

await page.getByText('Pagar (simulado)', { exact: true }).click();
for (let i = 0; i < 30; i++) {
  texto = await page.evaluate(() => document.body.innerText);
  if (texto.includes('Paseo confirmado')) break;
  await page.waitForTimeout(500);
}
check(texto.includes('Paseo confirmado'), 'pago simulado → éxito');

// D-329: el CTA navega al Hogar de verdad
await page.getByText('Ir al Hogar', { exact: true }).click();
let enHogar = false;
for (let i = 0; i < 20; i++) {
  const url = page.url();
  texto = await page.evaluate(() => document.body.innerText);
  if (url.includes('/hogar') && texto.includes('Agregar mascota')) {
    enHogar = true;
    break;
  }
  await page.waitForTimeout(500);
}
check(enHogar, 'D-329: "Ir al Hogar" aterriza en el Hogar (url + Zona 1 viva)', page.url());

await browser.close();
console.log(`\nCITA_TEST_ID=${hold.data.cita_id} (pagada — limpieza quirúrgica server-side por id)`);
console.log(fallos === 0 ? 'TODOS LOS ASSERTS PASARON' : `${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
