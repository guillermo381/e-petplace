// Verificación runtime web S58-B B1b: EL ARTE DEL PASEO + RESUMEN.
// El mundo Paseo reemplaza a /servicios y /horarios en Negocio; el
// resumen es la portada (estado + filas por sección + espejo); el
// taller abre con sus secciones (duraciones con slider, plan/paquete,
// días/horarios, zonas D-331, vacaciones puente) y el CTA único.
// SOLO LECTURA: jamás se toca "Guardar tu oferta". Dev server: PORT
// (default 8086) — servidor propio, no se pisa un Metro ajeno (S57).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = process.env.PORT ?? '8086';
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

// ── login real (sesión demo) ──
await page.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Tus paseos de hoy', 60);

// ── T0 (B4+B2 en Hoy): segmentado + techo de tinta montados ──
// (el techo pinta al instante; el segmento espera la pantalla 'listo')
let t = await esperar('Semana', 20);
check(t.includes('Semana'), 'T0 el segmento Hoy/Semana vive (SelectorSegmentado)');

// ── T1: NEGOCIO COMO MUNDOS (B1a); las entradas viejas murieron ──
await page.getByRole('tab', { name: /Negocio/ }).click();
t = await esperar('Tu oferta', 20);
check(t.includes('Paseo'), 'T1 la tarjeta-mundo Paseo vive en Tu oferta');
check(!t.includes('Servicios y precios'), 'T1b "Servicios y precios" murió de Negocio');
check(t.includes('Grooming'), 'T1c la puerta honesta del mundo Grooming');
check(!t.includes('Marca los días en que no paseas'), 'T1d la celda Vacaciones de Negocio murió (vive en el mundo)');

// ── T2: el RESUMEN es la portada del mundo ──
await page.getByRole('button', { name: 'Paseo' }).first().click();
t = await esperar('Tu oferta de paseo', 30);
const enResumen = t.includes('Tu oferta de paseo');
check(enResumen, 'T2 entrar a Paseo aterriza en el resumen');
// el título pinta antes que los datos (esqueleto): esperar el PIE de la
// pantalla lista (espejo en peldaño 1 · invitación en peldaño 0)
t = await esperar('Así lo ve el dueño', 25);
if (!t.includes('Así lo ve el dueño')) t = await esperar('Tu servicio de paseo', 10);
if (enResumen && !t.includes('Tu servicio de paseo')) {
  // peldaño 1+: el estado + las filas + el espejo
  check(t.includes('Visible para las familias') || t.includes('Todavía no visible'), 'T2b el estado dice su verdad');
  check(t.includes('Duraciones y precios'), 'T2c fila Duraciones y precios');
  check(t.includes('Plan y paquete'), 'T2d fila Plan y paquete');
  check(t.includes('Días y horarios'), 'T2e fila Días y horarios');
  check(t.includes('Zonas de cobertura'), 'T2f fila Zonas de cobertura (D-331 viva)');
  check(t.includes('Así lo ve el dueño'), 'T2g el espejo al pie');
  check(t.includes('Editar tu oferta'), 'T2h el CTA primario ARRIBA (cura de gate)');
  await page.getByText('Editar tu oferta', { exact: true }).click();
} else {
  // peldaño 0 — la invitación educa y el CTA abre el taller
  check(t.includes('Abrir el taller'), 'T2b peldaño 0 con camino al taller');
  await page.getByText('Abrir el taller', { exact: true }).click();
}

// ── T3: EL ARTE DEL PASEO — una pantalla, todo el oficio ──
t = await esperar('El arte del paseo', 30);
check(t.includes('El arte del paseo'), 'T3 el taller abre con su título canónico');
t = await esperar('Duraciones y precios', 20);
check(t.includes('Duraciones y precios'), 'T3b sección duraciones');
check(t.includes('30 min') && t.includes('5 horas'), 'T3c el menú canónico entero a la vista (30…300)');
check(t.includes('Plan y paquete'), 'T3d sección plan y paquete');
check(t.includes('Días y horarios'), 'T3e sección días y horarios');
check(t.includes('Lunes'), 'T3f la tira de días (lunes primero)');
check(t.includes('Zonas de cobertura'), 'T3g sección zonas (contrato D-331)');
check(t.includes('Quito'), 'T3g2 las ciudades del PAÍS como chips (Ley 22 + filtro país)');
check(!t.includes('Bogotá') || t.includes('Otra ciudad'), 'T3g3 lo de otro país entra por su puerta');
check(t.includes('Otra ciudad'), 'T3g4 la puerta "Otra ciudad" existe (cura de gate)');
check(t.includes('Vacaciones'), 'T3h la celda-puente a vacaciones');
check(t.includes('Así lo ve el dueño'), 'T3i el espejo del artesano al pie');
check(t.includes('Guardar tu oferta'), 'T3j el CTA único en tinta');
// el precio se DESLIZA: el control adjustable existe (regla del teclado)
const sliders = await page.locator('[role="adjustable"], [aria-valuenow]').count();
check(sliders >= 1 || t.includes('e-PetPlace retiene'), 'T3k slider de precio + neto de fee_configs presentes');
// Ley 22: el binario es un Interruptor (switch), no un botón
const switches = await page.getByRole('switch').count();
check(switches >= 1, `T3l "Ofrecer esta duración" es Interruptor (switches: ${switches})`);

// ── T4: la Hoja de plan/paquete dice los presets EN LETRA (D-354) ──
const filaPlan = page.getByText(/Sin plan ni paquete|Plan \$|Paquete \$/).first();
if (await filaPlan.isVisible().catch(() => false)) {
  await filaPlan.click();
  t = await esperar('por adelantado', 10);
  check(t.includes('5, 10 o 15'), 'T4 presets 5/10/15 en letra en la Hoja');
  check(t.includes('plan mensual'), 'T4b campo del plan presente');
} else {
  check(t.includes('Primero ofrece una duración'), 'T4 sin duraciones: voz honesta con camino');
}

await browser.close();
console.log(fallos === 0 ? `\nSMOKE S58 TALLER: TODO VERDE` : `\nSMOKE S58 TALLER: ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
