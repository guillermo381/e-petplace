/**
 * ⭐ **¿EL PRESTADOR PASA DEL ESQUELETO CON `duenovet`?** (S113-C, pedido de mesa).
 *
 * A lo vio trabado en el emulador y no pudo distinguir **defecto** de
 * **entorno**. Este arnés contesta la mitad que sí se puede contestar sin
 * aparato: en web, con sesión real, ¿el shell pasa de `verificando` y dibuja
 * el HOY? *No contesta por el emulador: contesta si la app puede.*
 *
 * Mide en el tiempo, no una foto: un esqueleto que se va a los 3 s y uno que
 * no se va nunca **se ven idénticos** si se mira una sola vez.
 */
import { chromium } from 'playwright-core';

const CORREO = process.env.PRESTADOR_EMAIL ?? 'guillo381+duenovet@gmail.com';
const CLAVE = process.env.PRESTADOR_PASSWORD ?? '';
const di = (s) => console.log(s);

const navegador = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
/* 🔴 **EL IDIOMA SE FIJA, y esto lo pario un rojo del arnes.** Chrome headless
   arranca en `en-US`, `expo-localization` lo obedece y la app se dibuja en
   INGLES — mi arnes buscaba «Contraseña» y timeouteo contra un campo que decia
   «Password». *El instrumento no media la app: media el locale de la maquina.* */
const page = await navegador.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errores = [];
page.on('pageerror', (e) => errores.push(String(e).slice(0, 200)));

const T = async () => await page.evaluate(() => document.body.innerText).catch(() => '');
const ruta = () => page.url().replace('http://localhost:8083', '');

await page.goto('http://localhost:8083/login', { waitUntil: 'networkidle', timeout: 240000 });
for (let i = 0; i < 200 && (await page.locator('input[type="password"]').count()) === 0; i++) await page.waitForTimeout(1000);

di(`cuenta: ${CORREO}`);
/* Los campos se toman por TIPO, no por su rotulo: el rotulo cambia con el
   idioma y el tipo no. */
await page.locator('input[type="email"]').fill(CORREO);
await page.locator('input[type="password"]').fill(CLAVE);
await page.getByText(/^(Entrar|Sign in|Log in)$/).first().click();

/* El reloj es el instrumento: se mira CADA segundo durante 25, para poder
   decir «tardó» en vez de «no entra» — son dos veredictos distintos. */
di('');
di('── EL RELOJ ───────────────────────────────────────────────');
let primeraVezConHoy = null;
for (let s = 1; s <= 25; s += 1) {
  await page.waitForTimeout(1000);
  const t = await T();
  const esqueleto = /Verificando|Cargando/i.test(t);
  const barra = ['Hoy', 'Mascotas', 'Negocio', 'Cuenta', 'Refugio'].filter((n) =>
    new RegExp(`(^|\\n)\\s*${n}\\s*(\\n|$)`).test(t),
  );
  const hoy = /Prepará tu espacio|Tu jornada|jornada de hoy|del día|Sin citas|Hoy no/i.test(t);
  if (hoy && primeraVezConHoy === null) primeraVezConHoy = s;
  if (s <= 6 || s % 5 === 0 || (hoy && primeraVezConHoy === s)) {
    di(
      `  +${String(s).padStart(2)}s  ruta ${ruta().padEnd(14)} ` +
        `${esqueleto ? 'ESQUELETO' : 'contenido '} · barra [${barra.join(' ')}] ` +
        `· HOY ${hoy ? 'DIBUJADO' : '—'}`,
    );
  }
}

const t = await T();
di('');
di('── EL VEREDICTO ───────────────────────────────────────────');
di(`pasa del esqueleto: ${/Verificando|Cargando/i.test(t) ? '🔴 NO' : 'sí ✓'}`);
di(`HOY dibujado: ${primeraVezConHoy !== null ? `sí ✓ (primera vez a los +${primeraVezConHoy}s)` : '🔴 NO'}`);
di(`primeras líneas: ${t.split('\n').filter((x) => x.trim()).slice(0, 8).join(' | ')}`);
di(`errores de página: ${errores.length}${errores.length ? ' → ' + errores.join(' ⁄ ') : ''}`);

await page.screenshot({ path: 'docs/loop/S113-C-duenovet.png', fullPage: false });
di('captura: docs/loop/S113-C-duenovet.png');
await navegador.close();
