// S73-B M3 — capturas de las pantallas tocadas (render web 420×900,
// sesión demo-vet por login de UI, patrón captura-hogar-v2-s71). Uso:
//   node scripts/captura-s73b.mjs
// SOLO lectura de UI: no registra atenciones ni escribe DB (la captura
// de la atención del mostrador se toma ANTES de tocar "Registrar").
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:8082';
const CITA_VET = '8c320667-197e-471a-9e44-833f539a6da1'; // Thor · consulta_general · 21-jul 19:00 · Aurora
const MASCOTA_THOR = 'd2e31d70-54fc-4d47-b425-1617239257eb'; // con foto, acceso vigente de Aurora
const EMAIL_REGISTRADO = 'demo-prestador@epetplace.dev'; // cuenta real registrada (titular familia Zeus demo)

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

// login demo-vet
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill('demo-vet@epetplace.dev');
await page.locator('input[type="password"]').fill(process.env.DEMO_VET_PASSWORD ?? '');
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(6000); // HOY carga

async function cap(nombre) {
  const ruta = `scripts/capturas/${nombre}.png`;
  await page.screenshot({ path: ruta, fullPage: false });
  console.log(`captura → ${ruta}`);
}

// ── (1) mostrador idle: botón "Registrar mascota nueva" VISIBLE ──
await page.goto(`${BASE}/veterinaria/mostrador`, { waitUntil: 'networkidle', timeout: 120000 });
await page.getByText('Registrar mascota nueva', { exact: true }).waitFor({ timeout: 60000 });
await cap('s73-b-mostrador-idle');

// ── (2) mostrador con cuenta RECONOCIDA: el botón NO se dibuja (Ley 23) ──
await page.getByPlaceholder(/nombre|correo|tel/i).first().fill(EMAIL_REGISTRADO).catch(async () => {
  // fallback: primer input de la pantalla
  await page.locator('input').first().fill(EMAIL_REGISTRADO);
});
await page.getByText('Ya en e-PetPlace', { exact: false }).waitFor({ timeout: 60000 });
await page.waitForTimeout(800);
await cap('s73-b-mostrador-registrado-sin-boton');

// ── (3) atención del mostrador: la CARA de la mascota (foto + nombre) ──
await page.goto(
  `${BASE}/veterinaria/mostrador/atencion?mascotaId=${MASCOTA_THOR}&nombre=Thor`,
  { waitUntil: 'networkidle', timeout: 120000 },
);
await page.getByText('Thor', { exact: true }).first().waitFor({ timeout: 60000 });
await page.waitForTimeout(4000); // foto firmada + servicios
await cap('s73-b-atencion-mostrador-cara');

// ── (4) consulta: fase DICTADO — hint del mic JUNTO al campo ──
// OJO (hallazgo S73-B, anotado sin ejecutar): la consulta EXIGE
// mascotaId/mascotaNombre por params — con solo citaId muere con error
// (tensión con el principio 7.5: reconstruible desde URL). Se navega
// como el caller real (cita/[citaId].tsx:229-232).
await page.goto(
  `${BASE}/veterinaria/consulta/${CITA_VET}?mascotaId=${MASCOTA_THOR}&mascotaNombre=Thor`,
  { waitUntil: 'networkidle', timeout: 120000 },
);
await page.getByText('Empezar la consulta', { exact: true }).waitFor({ timeout: 90000 });
await page.getByText('Empezar la consulta', { exact: true }).click();
await page.getByText('Para dictar, toca el micrófono de tu teclado.', { exact: true }).waitFor({ timeout: 30000 });
await page.waitForTimeout(500);
await cap('s73-b-consulta-dictado-hint');

await browser.close();
