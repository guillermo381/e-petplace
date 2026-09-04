/* Repro D-1017: la transición verificando → resuelta en el layout de tabs del
   prestador. Sesión REAL (las credenciales salen de .env.local, jamás del
   código). Sólo lectura: entra, mira y se va. */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

const errores = [];
page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
page.on('pageerror', (e) => errores.push(`PAGEERROR ${e.name}: ${e.message}\n${e.stack ?? ''}`));

const texto = async () => await page.evaluate(() => document.body.innerText).catch(() => '');
const esperar = async (frase, veces = 60) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) { await page.waitForTimeout(1000); t = await texto(); }
  return t;
};

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 240000 });
await esperar('Contraseña', 90);
/* La cuenta se puede sobreescribir por entorno: el demo es un PASEADOR y su
   burbuja está en cero por diseño; para verla dibujada hace falta el refugio.
   Las credenciales nunca viven en el código. */
const correo = process.env.REPRO_EMAIL ?? env.EXPO_PUBLIC_DEMO_EMAIL;
const clave = process.env.REPRO_PASSWORD ?? env.EXPO_PUBLIC_DEMO_PASSWORD;
console.log('cuenta:', correo);
await page.getByRole('textbox', { name: 'Email' }).fill(correo);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(clave);
await page.getByText('Entrar', { exact: true }).click();

/* La transición: el primer render es 'verificando' y sale por el return
   temprano; cuando la sesión resuelve, el componente llama dos hooks más. */
await page.waitForTimeout(20000);

const t = await texto();
console.log('── PANTALLA (primeras 8 líneas) ──');
console.log(t.split('\n').slice(0, 8).join('\n') || '(vacía)');

/* EL VERDE NO ES «no hubo error»: es que la pantalla que el crash se llevaba
   puesta esté dibujada. La frontera de caída pinta su propio texto, así que
   verla A ELLA sería un verde por la razón equivocada. */
const cayo = t.includes('Esta pantalla no se pudo mostrar');
console.log('\n¿la frontera de caída se comió el árbol?', cayo ? 'SÍ' : 'no');

/* Y la burbuja del refugio: se busca su nodo tocable por la voz de la casa,
   no por un píxel. Con dos clases vivas el disco lleva la voz del abanico;
   con una, la de esa clase. Cualquiera de las tres prueba que se dibujó. */
const vocesBurbuja = ['Lo que te espera', 'Ver las solicitudes por revisar', 'Ver tus conversaciones'];
let burbuja = null;
for (const v of vocesBurbuja) {
  if (await page.getByRole('button', { name: v }).count() > 0) { burbuja = v; break; }
}
console.log('burbuja del refugio:', burbuja !== null ? `dibujada («${burbuja}»)` : 'sin pendientes en esta cuenta (la pieza calla por diseño)');

/* 🔴 **LO QUE SÍ PRUEBA QUE LA BURBUJA PUEDE DIBUJARSE, con cualquier cuenta:**
   que el SUBÁRBOL DEL tabBar exista. `BurbujaDelShell` es hermano de
   `BarraTabs` adentro del mismo `tabBar`, y el crash se llevaba el árbol
   ENTERO — no había barra ni burbuja. Si la barra está, el montaje de la
   burbuja volvió a existir; que se dibuje o no, con eso, ya sólo depende del
   dato (`clasesVivas`, que su propio gate cubre). */
const tabs = [];
for (const nombre of ['Hoy', 'Datos', 'Atender', 'Negocio', 'Cuenta', 'Adopción', 'Ventas']) {
  if (t.includes(nombre)) tabs.push(nombre);
}
console.log('pie de la pantalla:', t.split('\n').slice(-6).join(' · '));
console.log('barra de tabs:', tabs.length > 0 ? `${tabs.length} pestañas — ${tabs.join(' · ')}` : 'NO se dibujó');
console.log('\n── ERRORES DE CONSOLA (', errores.length, ') ──');
const hooks = errores.filter((e) => /Hook|hooks/i.test(e));
for (const e of (hooks.length > 0 ? hooks : errores).slice(0, 4)) {
  console.log('\n' + e.split('\n').slice(0, 22).join('\n'));
}
await browser.close();
process.exit(hooks.length > 0 ? 1 : 0);
