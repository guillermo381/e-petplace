// Smoke web S65-B2 — las dos piezas del taller del adiestrador:
// P1 la PORTADA del mundo (/adiestramiento: estado + qué se vende +
// CTA al taller; Negocio entra por la portada, ya no directo al taller)
// y P2 las TARJETAS FIJAS de la escalera troncal (Básico/Medio/Experto
// con toggle que abre el editor + Personalizado hacia la Hoja).
// SOLO LECTURA + interacción local (no guarda nada).
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
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1400 } });
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

// ── P1 — LA PORTADA ──
// T1: /adiestramiento existe y es la portada (no el taller)
await page.goto(`http://localhost:${PUERTO}/adiestramiento`, { waitUntil: 'networkidle' });
let t = await esperar('Tu oferta de adiestramiento', 30);
check(t.includes('Tu oferta de adiestramiento'), 'T1 la portada del mundo vive en /adiestramiento');

// T2: dice QUÉ SE VENDE (§1) — la sesión suelta y los programas —
// o, sin oferta, el peldaño 0 que lo educa
const conOferta = t.includes('La sesión suelta');
check(
  (t.includes('La sesión suelta') && t.includes('Tus programas')) ||
    t.includes('Vendes dos cosas'),
  'T2 la portada dice qué se vende (sesión suelta + programas)',
);

// T3: el estado dice la verdad del motor (visible o su porqué)
check(
  !conOferta || t.includes('Visible para las familias') || t.includes('Todavía no visible'),
  'T3 el estado de visibilidad presente (o peldaño 0)',
);

// T4: el CTA lleva al taller de configuración existente
const cta = conOferta ? 'Editar tu oferta' : 'Configurar tu oficio';
await page.getByText(cta, { exact: true }).first().click();
t = await esperar('Con quién trabajas', 30);
check(t.includes('Con quién trabajas'), 'T4 el CTA de la portada aterriza en el taller');

// ── P2 — LAS TARJETAS FIJAS ──
// T5: las tres tarjetas de la escalera troncal + Personalizado
t = await texto();
check(
  t.includes('Básico') && t.includes('Medio') && t.includes('Experto'),
  'T5 las tres tarjetas fijas de la escalera troncal',
);
check(t.includes('Personalizado'), 'T6 la cuarta opción Personalizado presente');

// T7: activar una tarjeta abre el editor (N + precio + descripción) —
// interacción local; el guardado exige toque explícito, así que nada
// persiste. Se toca el switch de "Básico" solo si está apagado.
const switches = await page.evaluate(() => {
  const nodos = [...document.querySelectorAll('[role="switch"]')];
  return nodos.map((n) => ({
    etiqueta: n.getAttribute('aria-label') ?? '',
    encendido: n.getAttribute('aria-checked') === 'true',
  }));
});
const basico = switches.find((s) => s.etiqueta === 'Básico');
check(basico !== undefined, 'T7 la tarjeta Básico porta su toggle');
if (basico && !basico.encendido) {
  await page.locator('[role="switch"][aria-label="Básico"]').click();
  await page.waitForTimeout(500);
}
t = await texto();
check(
  t.includes('Sugerido para este nivel: 6 a 8 sesiones'),
  'T8 el rango sugerido del nivel (§12.4) visible',
);
check(
  t.includes('Precio del programa') && t.includes('Qué incluye'),
  'T9 el editor de la tarjeta: precio propio + descripción',
);
check(t.includes('Vigencia de'), 'T10 las condiciones derivadas DICHAS en la tarjeta');

// T11: Personalizado abre la Hoja existente del programa libre
await page.getByText('Crear programa personalizado', { exact: true }).click();
t = await esperar('Nombre del programa', 15);
check(
  t.includes('Programa personalizado') && t.includes('Nombre del programa'),
  'T11 Personalizado abre la Hoja del programa libre',
);

await browser.close();
console.log(fallos === 0 ? 'SMOKE OFICIO ADIESTRAMIENTO S65: 0 fallos' : `SMOKE S65: ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
