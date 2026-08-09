/**
 * S91-D · EL REBOTE DE GROOMING, POR EL CAMINO DE LA APP.
 *
 * ── POR QUÉ EXISTE ESTE SCRIPT Y NO ALCANZABA EL SQL ───────────────────────
 * Medí los seis lectores del hub con `set_config('role','authenticated')` y los
 * seis dieron VERDE — y el founder lo seguía viendo rebotar. La mesa lo nombró:
 * *alguien está midiendo un lector distinto del que la pantalla llama*.
 *
 * Y hay una razón concreta para desconfiar de aquella medición: corrió DENTRO
 * de una función que yo creé, y una consulta por PostgREST no es la misma
 * consulta — pasa por otro rol, otro pool y, sobre todo, **necesita GRANT de
 * EXECUTE sobre las RPC**, que un `perform` directo puede no ejercer igual.
 * *Un lector medido en otro transporte no es el lector.*
 *
 * Así que esto abre la pantalla DE VERDAD, con una sesión real creada por la
 * app, y escucha lo que sale por el cable: **cada request a Supabase con su
 * status y su cuerpo**, más los errores de consola. No interpreta: transcribe.
 *
 * Uso: `npx expo start --web --port 8082` en apps/cliente, y después
 * `npx tsx scripts/sonda-grooming-camino-real-s91.mjs`.
 */

import { chromium } from 'playwright-core';

const P = 'http://localhost:8082';
const CLAVE = 'Sonda-2026!';
const correo = `s91d-groom-${Date.now()}@epetplace.dev`;

const esperarMs = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1000 } });
const page = await ctx.newPage();

/** LO QUE SALE POR EL CABLE — sin filtrar por lo que yo espere encontrar. */
const llamadas = [];
page.on('response', async (res) => {
  const url = res.url();
  if (!url.includes('supabase') && !url.includes('/rest/v1') && !url.includes('/rpc/')) return;
  let cuerpo = '';
  try {
    if (res.status() >= 400) cuerpo = (await res.text()).slice(0, 300);
  } catch {
    cuerpo = '(cuerpo ilegible)';
  }
  llamadas.push({ status: res.status(), url: url.replace(/^https?:\/\/[^/]+/, ''), cuerpo });
});
const consola = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') consola.push(`[${m.type()}] ${m.text().slice(0, 200)}`);
});

const tocar = async (txt) => {
  const ok = await page.evaluate((t) => {
    const els = Array.from(document.querySelectorAll('*')).filter(
      (e) => (e.textContent ?? '').trim() === t && e.children.length === 0,
    );
    for (const el of els.reverse()) {
      const r = el.getBoundingClientRect();
      const px = r.left + r.width / 2;
      const py = r.top + r.height / 2;
      const d = document.elementFromPoint(px, py);
      if (d && (d === el || el.contains(d) || d.contains(el))) {
        for (const k of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
          d.dispatchEvent(new MouseEvent(k, { bubbles: true, cancelable: true, clientX: px, clientY: py }));
        return true;
      }
    }
    return false;
  }, txt);
  if (!ok) throw new Error(`no se pudo tocar «${txt}»`);
  await esperarMs(700);
};

// ── una sesión REAL, creada por la app ──────────────────────────────────────
await page.goto(`${P}/registro`, { waitUntil: 'networkidle', timeout: 180000 });
await esperarMs(2200);
await page.locator('input').nth(0).fill('Sonda Grooming');
await page.locator('input').nth(1).fill(correo);
await page.locator('input[type="password"]').first().fill(CLAVE);
await tocar('Crear mi cuenta');
await esperarMs(3000);

// un PERRO — el grooming es perro+gato, así que este hogar SÍ tiene elegible
await page.goto(
  `${P}/onboarding/cierre?nombre=SondaPerro&especie=perro&raza=Mestizo&fecha=2021-03-14&precision=estimada`,
  { waitUntil: 'networkidle', timeout: 120000 },
);
await esperarMs(6000);

/**
 * ── Y AHORA SU HOGAR EXACTO ────────────────────────────────────────────────
 * Con UN perro la pantalla carga. La diferencia con el founder no es el código:
 * es el HOGAR. Él tiene cinco —dos perros, un gato, un ACUARIO y un conejo—, o
 * sea DOS especies que el grooming no sirve y un sujeto que no es un individuo.
 * Si algo del hub tropieza con una fila que no le corresponde, aparece acá.
 */
for (const q of [
  'nombre=SondaGato&especie=gato&raza=Mestizo',
  'nombre=SondaAcuario&especie=pez&raza=dulce',
  'nombre=SondaConejo&especie=conejo',
]) {
  await page.goto(`${P}/hogar/agregar/cierre?${q}&fecha=2021-03-14&precision=estimada`, {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await esperarMs(5000);
}

// ── LA PANTALLA, de verdad ─────────────────────────────────────────────────
llamadas.length = 0;
consola.length = 0;
await page.goto(`${P}/explorar/grooming`, { waitUntil: 'networkidle', timeout: 120000 });
await esperarMs(9000);

/**
 * ⚠️ EL HUECO DE MI PROPIA SONDA, cerrado.
 *
 * La primera versión abría el hub y declaraba «carga» — pero SIN ELEGIR
 * MASCOTA, y con dos elegibles la pantalla no elige sola. O sea que las dos
 * ramas de error que quedaban sospechadas (`oferta` e `inicios`) NUNCA
 * CORRIERON: medí la mitad del hub y reporté sobre el hub entero.
 *
 * Es exactamente el defecto que vengo persiguiendo toda la sesión —un verde
 * que responde otra pregunta— y esta vez lo escribí yo. Ahora se elige la
 * mascota, se declara su talla (el hub la exige para dar precio) y recién ahí
 * se lee lo que sale por el cable.
 */
await tocar('SondaPerro').catch(() => {});
await esperarMs(3000);
// la talla es la puerta del precio: sin ella el hub no pide la oferta
for (const paso of ['Pequeño', 'Normal', 'Guardar', 'Declarar talla y pelaje']) {
  await tocar(paso).catch(() => {});
  await esperarMs(1200);
}
await esperarMs(8000);

const texto = await page.evaluate(() => document.body.innerText);
const rebota = texto.includes('No pudimos cargar el grooming');

console.log(`\n  PANTALLA: ${rebota ? '🔴 REBOTA' : '✅ carga'}`);
console.log(`  (cuenta ${correo})\n`);
console.log('  ── LO QUE SALIÓ POR EL CABLE, en orden ──');
for (const l of llamadas) {
  const marca = l.status >= 400 ? '🔴' : '  ';
  console.log(`  ${marca} ${l.status} ${l.url}`);
  if (l.cuerpo) console.log(`       ${l.cuerpo}`);
}
if (llamadas.length === 0) console.log('  (ninguna — y eso ya sería la respuesta)');
console.log('\n  ── CONSOLA ──');
console.log(consola.length > 0 ? consola.map((c) => `  ${c}`).join('\n') : '  (limpia)');
console.log(`\n  ── PANTALLA (primeras líneas) ──\n${texto.split('\n').slice(0, 12).map((l) => '  ' + l).join('\n')}`);

await browser.close();
