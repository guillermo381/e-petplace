// Verificación runtime web S56-B (T7): la marca "parte del plan" habla SOLO
// si la fila trae suscripcion_servicio_id. MOCK EN LA FRONTERA HTTP: se
// intercepta PostgREST y se sirve una fila SINTÉTICA del día en dos fases
// (suscripcion null → ni marca ni hueco; con uuid → la marca en agenda y
// detalle). CERO dato persistido — la DB no se toca; ninguna cita real se
// pisa (el id es sintético). Dev server prestador :8081.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const CITA_MOCK = '00000000-0000-4000-8000-0000000000c1';
const PLAN_MOCK = '00000000-0000-4000-8000-00000000d338';

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
const esperar = async (frase, veces = 30) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};

// ── login real (D-290) ──
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Hoy', 30);

// ── el mock: una cita sintética de HOY, en dos fases ──
let suscripcionMock = null; // fase 1: null → fase 2: PLAN_MOCK
const filaSintetica = () => ({
  id: CITA_MOCK,
  fecha: new Intl.DateTimeFormat('en-CA').format(new Date()),
  hora: '15:00:00',
  estado: 'confirmada',
  tipo_servicio: 'paseo',
  suscripcion_servicio_id: suscripcionMock,
  direccion_snapshot: null,
  mascota: { id: '00000000-0000-4000-8000-0000000000a1', nombre: 'Thor', especie: 'perro', foto_url: null },
  tipo: { nombre: 'Paseo', duracion_default_minutos: 30 },
  atencion: [],
});
await page.route('**/rest/v1/evento_cita_servicio*', async (route) => {
  await route.fulfill({ json: [filaSintetica()] });
});
// El detalle pre-consulta el estado real de la atención por RPC — para la
// cita sintética se sirve la rama "sin iniciar" del contrato.
await page.route('**/rest/v1/rpc/obtener_paseo_por_cita*', async (route) => {
  await route.fulfill({ json: { ok: true, data: { estado: null, puntos_track: 0 } } });
});

// ── FASE 1: suscripcion null → ni marca ni hueco ──
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 60000 });
let t = await esperar('Thor', 30);
check(t.includes('Thor'), 'T1 la fila sintética del día se pinta');
check(!t.includes('Parte del plan'), 'T1b suscripcion null: la marca NO existe (ni hueco reservado)');

// ── FASE 2: con uuid → la marca habla ──
suscripcionMock = PLAN_MOCK;
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 60000 });
t = await esperar('Parte del plan', 30);
check(t.includes('Paseo · Parte del plan'), 'T2 agenda: el sufijo "· Parte del plan" en la fila');

await page.goto(`http://localhost:8081/cita/${CITA_MOCK}`, { waitUntil: 'networkidle', timeout: 60000 });
t = await esperar('Parte del plan de', 30);
check(t.includes('Parte del plan de Thor'), 'T3 detalle: "Parte del plan de Thor"');
check(t.includes('Iniciar paseo'), 'T4 el flujo del detalle sigue entero (CTA presente, jamás tocado)');

await browser.close();
console.log(fallos === 0 ? '\nTODO VERDE (5/5) — mock solo en HTTP, cero dato persistido' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
