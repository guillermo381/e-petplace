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
await esperar('Tus paseos de hoy', 60);

// ── T1: NEGOCIO — la tarjeta-mundo Grooming VIVA ──
await page.getByRole('tab', { name: /Negocio/ }).click();
let t = await esperar('Tu oferta', 20);
check(t.includes('Grooming'), 'T1 la tarjeta-mundo Grooming vive');
check(!t.includes('Se abre cuando el servicio llegue'), 'T1b el coming-soon MURIÓ');

// ── T2: la PORTADA del mundo — el demo está en PELDAÑO 0 (sin oferta
// grooming): la invitación que educa; la portada con datos la gatea el
// founder en dispositivo tras su primer guardado ──
await page.getByRole('button', { name: /Grooming/ }).first().click();
t = await esperar('Tu oferta de grooming', 30);
check(t.includes('Tu oferta de grooming'), 'T2 la portada del mundo');
t = await esperar('Tu servicio de grooming', 25);
check(t.includes('Tu servicio de grooming'), 'T2b peldaño 0: la invitación');
check(t.includes('En dos pasos eliges servicios'), 'T2c peldaño 0: educa (DOS pasos, enmienda 1)');
check(t.includes('Configurar tu oficio'), 'T2d peldaño 0: el CTA al wizard');

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
// BORRADOR (nada persiste sin Guardar): encender Baño → el bloque
// gobernado aparece y el espejo responde EN VIVO (la firma)
await page.getByRole('switch', { name: /Ofrecer este servicio · Baño$/ }).click();
t = await esperar('Pequeña', 15);
check(t.includes('Pequeña') && t.includes('Mediana') && t.includes('Grande'), 'T3g el chip de talla gobierna (draft)');
check(t.includes('Duración') && t.includes('60 min'), 'T3h duración por combinación (default 60 del Baño)');
check(t.includes('$5.00'), 'T3h2 SIN sugeridos: el slider arranca en el piso del riel (enmienda 4)');
check(/Baño · P \$5\.00 · M \$5\.00 · G \$5\.00/.test(t), 'T3i el espejo dice los 3 precios EN VIVO');
check(t.includes('60 · 60 · 60 min según talla'), 'T3i2 el espejo dice las duraciones');
// el extra en borrador
await page.getByRole('switch', { name: 'Cobrar extra por pelaje largo' }).click();
t = await esperar('El extra que se suma al precio', 10);
check(t.includes('El extra que se suma al precio'), 'T3j el extra enciende con su slider');
check(t.includes('Pelaje largo: +$0.25'), 'T3j2 el espejo dice el extra (piso del riel)');
check(t.includes('Guardar tu oferta'), 'T3k el guardado único (JAMÁS se toca)');

// ── T4: la sección horarios suelta (la COMPARTIDA) ──
await page.goto(`http://localhost:${PORT}/grooming/taller?seccion=horarios`, { waitUntil: 'networkidle' });
t = await esperar('Días y horarios', 40);
check(t.includes('Marca los días y agrega la franja'), 'T4 la sección compartida de horarios');
check(t.includes('Vacaciones'), 'T4b la celda-puente a vacaciones');

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
