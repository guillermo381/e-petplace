// Verificación runtime del riel i18n (S51-B1a) — regla 13.
// Tres escenarios por app: locale es → español · locale en → inglés ·
// locale es + override persistido 'en' → inglés (el override gana).
import { tmpdir } from 'node:os';
import { chromium } from 'playwright-core';

// D-351: sin SCRATCH las capturas iban a la carpeta literal `undefined/`
// en la raíz del repo — el default es el scratch del sistema.
const S = process.env.SCRATCH ?? tmpdir();

const OBJETIVOS = [
  {
    app: 'cliente',
    url: 'http://localhost:8082/bienvenida',
    es: ['Crear cuenta', 'Ya tengo cuenta'],
    en: ['Create account', 'I already have an account'],
  },
  {
    // S55-A: post-D-290 (auth real) el raíz sin sesión muestra el
    // sin-sesión digno — el saludo de HOY ya no es alcanzable sin login.
    app: 'prestador',
    url: 'http://localhost:8081/',
    es: ['No hay una sesión activa', 'Inicia sesión para ver tu jornada.'],
    en: ['No active session', 'Sign in to see your day.'],
  },
];

const ESCENARIOS = [
  { nombre: 'locale es-EC → español', locale: 'es-EC', override: null, espera: 'es' },
  { nombre: 'locale en-US → inglés', locale: 'en-US', override: null, espera: 'en' },
  { nombre: 'locale es-EC + override "en" → inglés', locale: 'es-EC', override: 'en', espera: 'en' },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
let fallos = 0;

for (const t of OBJETIVOS) {
  console.log(`\n== ${t.app} (${t.url}) ==`);
  for (const esc of ESCENARIOS) {
    const ctx = await browser.newContext({
      locale: esc.locale,
      viewport: { width: 420, height: 900 },
    });
    const page = await ctx.newPage();
    if (esc.override) {
      // async-storage web = localStorage con la key cruda
      await page.addInitScript((v) => localStorage.setItem('epetplace.idioma', v), esc.override);
    } else {
      await page.addInitScript(() => localStorage.removeItem('epetplace.idioma'));
    }
    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 180000 });
    // el prestador firma sesión demo + fetch de agenda: esperar al texto
    const esperados = t[esc.espera];
    const prohibidos = t[esc.espera === 'es' ? 'en' : 'es'];
    let texto = '';
    for (let i = 0; i < 30; i++) {
      texto = await page.evaluate(() => document.body.innerText);
      if (esperados.every((s) => texto.includes(s))) break;
      await page.waitForTimeout(1000);
    }
    for (const s of esperados) {
      const ok = texto.includes(s);
      if (!ok) fallos++;
      console.log(`  [${esc.nombre}] ${ok ? '✓' : '✗ FALTA'} "${s}"`);
    }
    for (const s of prohibidos) {
      const mal = texto.includes(s);
      if (mal) fallos++;
      if (mal) console.log(`  [${esc.nombre}] ✗ NO DEBÍA aparecer "${s}"`);
    }
    await page.screenshot({
      path: `${S}/i18n-${t.app}-${esc.locale}${esc.override ? '-override' : ''}.png`,
    });
    await ctx.close();
  }
}

await browser.close();
console.log(`\n${fallos === 0 ? 'VERIFICACIÓN COMPLETA: 0 fallos' : `FALLOS: ${fallos}`}`);
process.exit(fallos === 0 ? 0 : 1);
