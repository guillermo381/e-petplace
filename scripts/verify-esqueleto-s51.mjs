// Verificación runtime S51-B2 (regla 13): esqueleto cliente completo
// con sesión demo real contra la DB viva — Hogar (voces reales), Perfil
// (pila), Explorar (country_config EC), Cuenta (idioma VIVO + persistencia).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { dbQuery } from './lib-db.mjs';

// credenciales demo: .env.local del prestador (D-290) — jamás en el repo
const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const EMAIL = env.EXPO_PUBLIC_DEMO_EMAIL;
const PASSWORD = env.EXPO_PUBLIC_DEMO_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.log('SIN CREDENCIALES DEMO en apps/prestador/.env.local — no se puede correr');
  process.exit(1);
}

const S = process.env.SCRATCH ?? '/tmp';
let fallos = 0;
const check = (cond, nombre) => {
  console.log(`${cond ? '✓' : '✗ FALTA'} ${nombre}`);
  if (!cond) fallos++;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);

// ── login demo por la UI real ──
await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
// el campo de contraseña es el segundo input
await page.locator('input[type="password"]').fill(PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(6000);

// ── HOGAR ──
let t = await texto();
for (let i = 0; i < 20 && !t.includes('Tu hogar'); i++) {
  await page.waitForTimeout(1000);
  t = await texto();
}
check(t.includes('Tu hogar'), 'Hogar: portada "Tu hogar"');
check(t.includes('Zeus'), 'Hogar: ficha de Zeus (Zona 1)');
// D-352: la voz esperada de Zeus se deriva de la DB (criterio (b) del
// gate founder: "al día" SE GANA con actividad de cuidado ≤12 meses) —
// antes el assert asumía la atención del 2026-07-07 fresca para siempre.
const [{ ultima }] = dbQuery(
  `WITH zeus AS (
     SELECT m.id FROM mascotas m
       JOIN familia_miembro fm ON fm.familia_id = m.familia_id
       JOIN auth.users u ON u.id = fm.user_id
      WHERE m.nombre='Zeus' AND u.email='${EMAIL}'
      LIMIT 1)
   SELECT greatest(
     (SELECT max(a.cerrada_en)::date FROM evento_atencion a
       WHERE a.mascota_id=(SELECT id FROM zeus) AND a.estado='cerrada_con_calidad'),
     (SELECT max(v.fecha_aplicada) FROM evento_vacuna_aplicada v
       WHERE v.mascota_id=(SELECT id FROM zeus))
   )::text AS ultima`,
);
const alDiaEsperado = ultima != null && Date.now() - new Date(`${ultima}T12:00:00`).getTime() < 365 * 24 * 3600 * 1000;
if (alDiaEsperado) {
  check(t.includes('está al día'), `Hogar: VOZ REAL "al día" GANADA (última actividad ${ultima}, leída de DB)`);
} else {
  check(!t.includes('está al día'), `Hogar: "al día" NO se regala (última actividad ${ultima ?? 'ninguna'} >12 meses, leída de DB)`);
}
check(t.includes('Carnet de vacunas'), 'Hogar: acción de aporte (Zona 4)');
await page.screenshot({ path: `${S}/esq-hogar.png` });

// ── PERFIL (tap en Zeus) ──
await page.getByText('Zeus', { exact: true }).first().click();
await page.waitForTimeout(5000);
t = await texto();
check(t.includes('SALUD') || t.includes('Salud'), 'Perfil: módulo Salud');
check(t.includes('BIENESTAR') || t.includes('Bienestar'), 'Perfil: módulo Bienestar');
check(t.includes('IDENTIDAD') || t.includes('Identidad'), 'Perfil: módulo Identidad');
check(/paseos guardados|paseo guardado/.test(t), 'Perfil: paseos reales en Bienestar');
await page.screenshot({ path: `${S}/esq-perfil.png`, fullPage: true });
await page.goBack();
await page.waitForTimeout(2000);

// ── EXPLORAR ──
await page.getByText('Explorar', { exact: true }).last().click();
await page.waitForTimeout(4000);
t = await texto();
check(t.includes('Paseo'), 'Explorar: servicio Paseo (walking EC)');
check(t.includes('Veterinaria'), 'Explorar: servicio Veterinaria');
check(t.includes('Adiestramiento'), 'Explorar: servicio Adiestramiento (training EC)');
check(t.includes('Todavía no hay refugios publicados'), 'Explorar: refugios vacío digno (0 en DB)');
check(t.includes('ePetPlace Prime'), 'Explorar: Prime en próximamente (apagado)');
check(!t.includes('Hotel\n✓'), 'Explorar: hotel NO activo');
await page.screenshot({ path: `${S}/esq-explorar.png`, fullPage: true });

// ── CUENTA: idioma VIVO ──
await page.getByText('Cuenta', { exact: true }).last().click();
await page.waitForTimeout(2000);
t = await texto();
check(t.includes('Tu cuenta'), 'Cuenta: portada');
check(t.includes('En preparación'), 'Cuenta: lugares B1 honestos');
await page.screenshot({ path: `${S}/esq-cuenta-es.png` });
// cambiar a English → la app entera al toque
await page.getByText('English', { exact: true }).click();
await page.waitForTimeout(1500);
t = await texto();
check(t.includes('Your account'), 'Cuenta: cambio VIVO a English');
check(t.includes('Home') && t.includes('Explore'), 'Tabs re-etiquetadas en English');
await page.screenshot({ path: `${S}/esq-cuenta-en.png` });
// persistencia: reload → sigue en English
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
t = await texto();
check(t.includes('Your account'), 'Idioma persistido tras reload');
// volver a español (dejar el estado limpio)
await page.getByText('Español', { exact: true }).click();
await page.waitForTimeout(1500);

await ctx.close();
await browser.close();
console.log(`\n${fallos === 0 ? 'ESQUELETO VERIFICADO: 0 fallos' : `FALLOS: ${fallos}`}`);
process.exit(fallos === 0 ? 0 : 1);
