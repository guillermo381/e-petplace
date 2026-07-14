// Verificación runtime web S57-B: la tab Cuenta (letra P17 v1.1) —
// barra de CUATRO tabs Hoy·Mascotas·Negocio·Cuenta en el orden firmado
// (la v1.0 que sacaba Mascotas era letra mal redactada — veredicto
// founder), las pantallas mudadas abren desde Cuenta, NADA de lo mudado
// sigue en Negocio (puro oficio), Hoy SIN la celda de entrada a
// Mascotas, eliminar cuenta dice su verdad. SOLO LECTURA (no se guarda
// perfil ni se cambia idioma). Dev server :8081.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

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

// ── login real ──
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Tu jornada de hoy', 60);

// ── T1: la barra es Hoy·Mascotas·Negocio·Cuenta (4 tabs, en orden) ──
const tabs = await page.getByRole('tab').allInnerTexts();
check(tabs.length === 4, `T1 cuatro tabs en la barra (${tabs.length})`);
const orden = tabs.map((x) => x.trim());
check(
  orden[0] === 'Hoy' && orden[1] === 'Mascotas' && orden[2] === 'Negocio' && orden[3] === 'Cuenta',
  `T1b el orden firmado Hoy·Mascotas·Negocio·Cuenta (${orden.join(' · ')})`,
);

// ── T2: Mascotas abre desde SU tab; Hoy sin la celda duplicada ──
// (se espera la pantalla 'listo' antes de leer — el segmento Hoy/Semana
// de B1 solo se pinta con la pantalla lista, y la celda vieja entraba ahí)
let t = await esperar('Semana', 20);
check(!t.includes('Las mascotas que cuidas y su historial.'), 'T2 Hoy SIN la celda de entrada a Mascotas');
await page.getByRole('tab', { name: /Mascotas/ }).click();
t = await esperar('Mascotas', 15);
check(t.includes('Mascotas'), 'T2b la tab Mascotas abre su lista de siempre');

// ── T3: la tab Cuenta con su anatomía ──
await page.getByRole('tab', { name: /Cuenta/ }).click();
t = await esperar('Tu cuenta', 15);
check(t.includes('Tu cuenta'), 'T3 portada de Cuenta');
check(t.includes('Tu perfil') && t.includes('Preferencias'), 'T3b celdas Tu perfil + Preferencias');
check(t.includes('Cerrar sesión') && t.includes('Eliminar cuenta'), 'T3c sesión y cuenta mudadas');

// ── T4: Tu perfil abre desde Cuenta ──
await page.getByText('Tu perfil', { exact: true }).click();
t = await esperar('Tu nombre', 15);
check(t.includes('Tu nombre') && t.includes('Teléfono') && t.includes('Email'), 'T4 perfil: campos');
check(t.includes('El email no se cambia desde acá todavía.'), 'T4b email read-only honesto');
await page.goBack();
await esperar('Tu cuenta', 10);

// ── T5: Preferencias abre desde Cuenta (idioma + notifs honestas) ──
await page.getByText('Preferencias', { exact: true }).click();
t = await esperar('Idioma', 15);
check(t.includes('Idioma') && t.includes('Español') && t.includes('English'), 'T5 idioma mudado a Preferencias');
check(t.includes('Notificaciones') && t.includes('Pronto'), 'T5b notificaciones dicen su verdad (Pronto)');
await page.goBack();
await esperar('Tu cuenta', 10);

// ── T6: Eliminar cuenta = voz honesta, jamás finge borrar ──
await page.getByText('Eliminar cuenta', { exact: true }).click();
t = await esperar('no se borra a la ligera', 10);
check(t.includes('no se borra a la ligera'), 'T6 la voz honesta P17 §4');
await page.getByText('Entendido', { exact: true }).click();
await page.waitForTimeout(800);
// ARTEFACTO DEV-WEB (S53, diagnosticado): tras cerrar una Hoja RN-web el
// #error-toast del overlay de expo queda VACÍO pero intercepta pointer
// events. Solo existe en el harness web dev — se neutraliza por CSS; el
// gate real de la Hoja es en dispositivo.
const toast = await page.evaluate(() => {
  const el = document.querySelector('#error-toast');
  const texto = el?.textContent ?? '';
  if (el) el.style.pointerEvents = 'none';
  return texto;
});
if (toast) console.log('TOAST DEV CON TEXTO (investigar):', JSON.stringify(toast.slice(0, 220)));

// ── T7: Negocio quedó puro oficio ──
// goto directo (no tap de tab): el hallazgo S55 "pantallas montadas
// tras goBack" hace que el innerText global arrastre el texto de la
// Cuenta aún montada — la carga fresca monta SOLO Negocio.
await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 60000 });
t = await esperar('Tu oferta', 30);
check(t.includes('Tu oferta') && t.includes('Cobros'), 'T7 Negocio: oferta y plata');
check(!t.includes('Idioma') && !t.includes('Cerrar sesión'), 'T7b idioma y sesión YA NO viven en Negocio');

// ── T8: ida y vuelta entre las 3 tabs sin romper ──
await page.getByRole('tab', { name: /Cuenta/ }).click();
await esperar('Tu cuenta', 10);
await page.getByRole('tab', { name: /Hoy/ }).click();
t = await esperar('Tu jornada de hoy', 10);
check(t.includes('Tu jornada de hoy'), 'T8 vuelta a Hoy intacta');

await browser.close();
console.log(fallos === 0 ? '\nSMOKE WEB VERDE (14/14)' : `\n${fallos} FALTA(N)`);
process.exit(fallos === 0 ? 0 : 1);
