// Verificación runtime web S59-B5 — EL ARTE DEL GROOMING (FASE 2).
// Negocio (tarjeta-mundo VIVA) → portada del mundo → taller por secciones
// + el WIZARD de DOS pasos por URL. SOLO LECTURA: "Guardar tu oferta"
// JAMÁS se toca (el borrador no persiste sin él). Dev server: PORT
// (default 8086), sesión demo (la oferta grooming demo backfilleada
// S59-A3: 3 tallas flat $15/60').
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
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1200 } });
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
await esperar('Tu jornada de hoy', 60);

// ── T1: NEGOCIO — la tarjeta-mundo Grooming VIVA ──
await page.getByRole('tab', { name: /Negocio/ }).click();
let t = await esperar('Tu oferta', 20);
check(t.includes('Grooming'), 'T1 la tarjeta-mundo Grooming vive');
check(!t.includes('Se abre cuando el servicio llegue'), 'T1b el coming-soon MURIÓ');

// ── T2: la PORTADA del mundo — robusta al ESTADO del demo (peldaño 0
// o con datos: el founder guardó una oferta real en su gate S59.3) ──
await page.getByRole('button', { name: /Grooming/ }).first().click();
t = await esperar('Tu oferta de grooming', 30);
check(t.includes('Tu oferta de grooming'), 'T2 la portada del mundo');
t = await esperar('tu oficio', 25).then(() => texto());
t = await texto();
const peldano0 = t.includes('Configurar tu oficio');
check(peldano0 || t.includes('Editar tu oferta'), 'T2b peldaño 0 honesto O portada con datos');
if (!peldano0) {
  check(t.includes('Visible para las familias') || t.includes('Todavía no visible'), 'T2c el estado dice su verdad');
  check(!t.includes('A quién atiendes'), 'T2d cura 4: la fila especies MURIÓ fusionada');
  check(/perros y gatos|solo perros|solo gatos/.test(t) || t.includes('Todos pausados'), 'T2e las especies viven en el subtítulo vivo');
  check(t.includes('Dónde atiendes') && t.includes('En tu local'), 'T2f el Dónde informativo');
} else {
  check(t.includes('En dos pasos eliges servicios'), 'T2c peldaño 0: educa (DOS pasos)');
}

// ── T3: la sección servicios suelta ──
await page.goto(`http://localhost:${PORT}/grooming/taller?seccion=servicios`, { waitUntil: 'networkidle' });
t = await esperar('Servicios y precios', 40);
check(t.includes('El arte del grooming'), 'T3 el taller abre');
check(t.includes('Enciende los servicios que ofreces y ponles precio por talla.'), 'T3b la intro de la sección');
check(t.includes('¿A quién atiendes?') && t.includes('Perros') && t.includes('Gatos'), 'T3c especies sobre el techo (enmienda 3)');
check(t.includes('Baño') && t.includes('Baño y corte'), 'T3d los dos servicios');
const switches = await page.getByRole('switch').count();
check(switches === 3, `T3e tres interruptores: 2 servicios + extra (${switches})`);
check(t.includes('Cobrar extra por pelaje largo'), 'T3f el extra global (enmienda 2)');
// BORRADOR (nada persiste sin Guardar), robusto al estado guardado:
// asegurar Baño ENCENDIDO — el Interruptor web no expone aria-checked,
// el estado se lee por su EFECTO (el bloque gobernado visible)
if (!(await texto()).includes('Pequeña')) {
  await page.getByRole('switch', { name: /Ofrecer este servicio · Baño$/ }).click();
}
t = await esperar('Pequeña', 15);
check(t.includes('Pequeña') && t.includes('Mediana') && t.includes('Grande'), 'T3g el chip de talla gobierna (draft)');
check(t.includes('Duración') && / min/.test(t), 'T3h duración por combinación visible');
check(/Baño · P \$\d/.test(t), 'T3i el espejo dice los precios EN VIVO');
check(/\d+ · \d+ · \d+ min según talla/.test(t), 'T3i2 el espejo dice las duraciones');
// el extra en borrador: asegurar ENCENDIDO (estado por efecto visible)
if (!(await texto()).includes('El extra que se suma al precio')) {
  await page.getByRole('switch', { name: 'Cobrar extra por pelaje largo' }).click();
}
t = await esperar('El extra que se suma al precio', 10);
check(t.includes('El extra que se suma al precio'), 'T3j el extra enciende con su slider');
check(/Pelaje largo: \+\$\d/.test(t), 'T3j2 el espejo dice el extra');
check(t.includes('Guardar tu oferta'), 'T3k el guardado único (JAMÁS se toca)');
// S59-B6 curas 1-3 en el taller: rieles y voces
check(!t.includes('Paseos simultáneos'), 'T3l cura 2: la voz genérica no vive en grooming');

// ── T4: la sección horarios suelta (la COMPARTIDA) ──
await page.goto(`http://localhost:${PORT}/grooming/taller?seccion=horarios`, { waitUntil: 'networkidle' });
t = await esperar('Días y horarios', 40);
check(t.includes('Marca los días y agrega la franja'), 'T4 la sección compartida de horarios');
check(t.includes('Vacaciones'), 'T4b la celda-puente a vacaciones');
check(t.includes('Tu agenda es una sola para todos tus servicios.'), 'T4c cura 3(a): la agenda única declarada');

// ── T5: el WIZARD de DOS pasos por URL ──
await page.goto(`http://localhost:${PORT}/grooming/taller?modo=wizard`, { waitUntil: 'networkidle' });
t = await esperar('Paso 1 de 2', 40);
check(t.includes('Paso 1 de 2') && t.includes('Servicios y precios'), 'T5 wizard paso 1');
check(t.includes('Continuar'), 'T5b el CTA Continuar');
await page.getByText('Continuar', { exact: true }).click();
t = await esperar('Paso 2 de 2', 20);
check(t.includes('Paso 2 de 2') && t.includes('Días y horarios'), 'T5c wizard paso 2');
check(t.includes('Guardar tu oferta'), 'T5d el guardado cierra el wizard (no se toca)');

console.log(fallos === 0 ? '\nSMOKE S59 GROOMING: TODO VERDE' : `\nSMOKE S59 GROOMING: ${fallos} FALLOS`);
await browser.close();
process.exit(fallos === 0 ? 0 : 1);
