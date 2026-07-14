// Verificación runtime web S60-B2 — la sección de la ENTIDAD en
// Cuenta·Tu perfil (P17 v1.1, visto del arquitecto). SOLO LECTURA:
// "Guardar cambios" JAMÁS se toca (la edición la ejercita el gate en
// dispositivo). Dev server: PORT (default 8086).
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
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1400 } });
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

// ── login demo ──
await page.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Tus paseos de hoy', 60);

// ── T1: la pantalla con las DOS mitades ──
await page.goto(`http://localhost:${PORT}/cuenta/perfil`, { waitUntil: 'networkidle' });
let t = await esperar('Tu negocio', 40);
check(t.includes('Tu nombre') && t.includes('Email'), 'T1 la mitad del user intacta (regresión S57)');
check(t.includes('Tu negocio'), 'T1b la sección de la entidad vive');

// ── T2: solo-lectura DIGNO con su porqué ──
check(t.includes('Nombre público'), 'T2 nombre público visible');
check(t.includes('llega pronto'), 'T2b su porqué en voz humana (perfil público)');
check(t.includes('Tu sede'), 'T2c la sede visible');
check(t.includes('se cambia con el equipo'), 'T2d el porqué de la sede');
check(t.includes('Oficio'), 'T2e el oficio con voz (jamás slug)');
check(!t.includes('paseador\n') && !t.includes('clinica_veterinaria'), 'T2f cero slug del motor pintado');

// ── T3: lo editable + el estado 7.13 ──
check(t.includes('Descripción'), 'T3 descripción editable');
check(t.includes('Contacto del negocio') && t.includes('WhatsApp') && t.includes('Sitio web'), 'T3b contacto del negocio');
check(
  t.includes('Visible para las familias') || t.includes('Todavía no visible'),
  'T3c el estado habla con la voz 7.13 de las portadas',
);
check(t.includes('Guardar cambios'), 'T3d un solo Guardar (no se toca)');

// ── T4: cero campos prohibidos ──
check(!t.includes('calificacion') && !t.includes('RUC') && !t.includes('aprobado'), 'T4 sin métricas/admin/fiscal');

await browser.close();
console.log(fallos === 0 ? '\nTODO VERDE' : `\nFALLOS: ${fallos}`);
process.exit(fallos === 0 ? 0 : 1);
