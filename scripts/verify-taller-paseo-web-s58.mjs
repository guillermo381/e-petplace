// Verificación runtime web S58-B — EL ARTE v3 (wizard de secciones).
// Negocio como mundos → resumen-portada → secciones SUELTAS desde los
// lápices (duraciones apiladas / horarios multi-día / zonas por país)
// + el WIZARD por URL directa (Paso 1→2→3, solo lectura: Guardar JAMÁS
// se toca). Dev server: PORT (default 8086), sesión demo.
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

// ── T0 (B4+B2 en Hoy): segmentado + techo montados ──
let t = await esperar('Semana', 20);
check(t.includes('Semana'), 'T0 el segmento Hoy/Semana vive (SelectorSegmentado)');

// ── T1: NEGOCIO COMO MUNDOS ──
await page.getByRole('tab', { name: /Negocio/ }).click();
t = await esperar('Tu oferta', 20);
check(t.includes('Paseo'), 'T1 la tarjeta-mundo Paseo');
check(!t.includes('Servicios y precios'), 'T1b las entradas viejas siguen muertas');
check(t.includes('Grooming'), 'T1c la puerta honesta Grooming');

// ── T2: el RESUMEN-PORTADA ──
await page.getByRole('button', { name: 'Paseo' }).first().click();
t = await esperar('Tu oferta de paseo', 30);
check(t.includes('Tu oferta de paseo'), 'T2 la portada del mundo');
t = await esperar('Así lo ve el dueño', 25);
check(t.includes('Visible para las familias') || t.includes('Todavía no visible'), 'T2b el estado dice su verdad');
check(t.includes('Editar tu oferta'), 'T2c el CTA primario arriba');
check(t.includes('Duraciones y precios') && t.includes('Días y horarios') && t.includes('Zonas de cobertura'), 'T2d las filas-lápiz por sección');
check(t.includes('Así lo ve el dueño'), 'T2e el espejo al pie');

// ── T3: sección DURACIONES (tarjetas apiladas, v3) ──
await page.getByText('Editar tu oferta', { exact: true }).click();
t = await esperar('El arte del paseo', 30);
t = await esperar('Duraciones y precios', 20);
check(t.includes('Duraciones y precios'), 'T3 la sección duraciones abre suelta');
// v3.1: EL CHIP GOBIERNA — chips de duraciones ofrecidas + UN solo bloque
const radios = await page.getByRole('radio').count();
const switches = await page.getByRole('switch').count();
check(radios >= 2, `T3a chips de duraciones arriba (${radios})`);
check(switches === 1, `T3b UN bloque gobernado con su Interruptor (${switches})`);
check(t.includes('plan mensual'), 'T3c plan por salida EN la tarjeta');
check(t.includes('paquete') || t.includes('Paquete'), 'T3d paquete por salida EN la tarjeta');
check(t.includes('5, 10 o 15'), 'T3e presets del paquete EN LETRA (D-354)');
check(!t.includes('Nombre (opcional)'), 'T3f nombre/descripción MURIERON de la UI (L-144)');
check(t.includes('e-PetPlace retiene'), 'T3g neto vivo de fee_configs');
check(t.includes('Así lo ve el dueño'), 'T3h el espejo en la sección');
check(t.includes('Guardar tu oferta'), 'T3i el guardado único');

// ── T4: sección HORARIOS (multi-día, letra sola) ──
await page.goBack();
await esperar('Tu oferta de paseo', 20);
await page.getByText('Días y horarios').first().click();
t = await esperar('Días y horarios', 20);
check(t.includes('aplica a todos los marcados'), 'T4 la voz del multi-día');
check(t.includes('Toda la semana'), 'T4b el atajo toda la semana');
check(t.includes('Agregar franja'), 'T4c agregar franja para los días marcados');
check(t.includes('Vacaciones'), 'T4d la celda-puente a vacaciones vive acá');

// ── T5: sección ZONAS ──
await page.goBack();
await esperar('Tu oferta de paseo', 20);
await page.getByText('Zonas de cobertura').first().click();
t = await esperar('Zonas de cobertura', 20);
check(t.includes('Quito'), 'T5 las ciudades del país como chips');
check(t.includes('Otra ciudad'), 'T5b la puerta Otra ciudad');

// ── T6: el WIZARD (URL directa; solo lectura — Guardar jamás se toca) ──
await page.goto(`http://localhost:${PORT}/paseo/taller?modo=wizard`, { waitUntil: 'networkidle' });
t = await esperar('Paso 1 de 3', 30);
check(t.includes('Paso 1 de 3') && t.includes('Duraciones y precios'), 'T6 wizard paso 1');
check(t.includes('Continuar'), 'T6b el CTA Continuar');
await page.getByText('Continuar', { exact: true }).click();
t = await esperar('Paso 2 de 3', 15);
check(t.includes('Paso 2 de 3') && t.includes('Días y horarios'), 'T6c wizard paso 2');
await page.getByText('Continuar', { exact: true }).click();
t = await esperar('Paso 3 de 3', 15);
check(t.includes('Paso 3 de 3') && t.includes('Zonas de cobertura'), 'T6d wizard paso 3');
check(t.includes('Guardar tu oferta'), 'T6e el guardado único cierra el wizard');

await browser.close();
console.log(fallos === 0 ? `\nSMOKE S58 v3: TODO VERDE` : `\nSMOKE S58 v3: ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
