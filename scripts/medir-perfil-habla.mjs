/**
 * ⭐ **LOS TRES ROJOS DEL 1.1** (S113-C · C8): Thor con su franja, Zeus sin
 * ella, Sombra sin nada que le pida algo.
 *
 * Los tres son el mismo assert visto desde tres lados: **la franja existe si y
 * sólo si hay algo que decir**. Con un solo caso no se prueba —una franja que
 * se dibuja siempre pasa el de Thor—, así que Zeus es el control negativo y
 * Sombra el borde.
 */
import { chromium } from 'playwright-core';

const CORREO = process.env.CLIENTE_EMAIL ?? '';
const CLAVE = process.env.CLIENTE_PASSWORD ?? '';
const di = (s) => console.log(s);

const CASOS = [
  { quien: 'Thor', id: 'd2e31d70-54fc-4d47-b425-1617239257eb', espera: 'CON franja (alergias + medicación)' },
  { quien: 'Zeus', id: 'a3332037-c487-45c1-875f-83caf342f59e', espera: 'SIN franja' },
  { quien: 'Sombra', id: '93553b79-8b8b-4f66-821c-124244f1a2b9', espera: 'sin celdas de acción (memorial)' },
];

const navegador = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await navegador.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errores = [];
page.on('pageerror', (e) => errores.push(String(e).slice(0, 160)));
const T = async () => await page.evaluate(() => document.body.innerText).catch(() => '');

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 240000 });
for (let i = 0; i < 200 && (await page.locator('input[type="password"]').count()) === 0; i += 1) {
  await page.waitForTimeout(1000);
}
await page.locator('input[type="email"]').fill(CORREO);
await page.locator('input[type="password"]').fill(CLAVE);
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(14000);
di(`cuenta: ${CORREO}`);

/* C7 primero: la tira del Hogar. */
await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(8000);
const tHogar = await T();
di('');
di('── C7 · LA TIRA DEL HOGAR ─────────────────────────────────');
const conVacuna = tHogar.split('\n').map((x) => x.trim()).filter((x) => / · \d{1,2} [a-z]{3} \d{4}$/.test(x));
di(`  tarjetas con «vacuna · fecha»: ${conVacuna.length ? conVacuna.join(' | ') : 'ninguna'}`);

for (const c of CASOS) {
  await page.goto(`http://localhost:8082/hogar/mascota/${c.id}`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(8000);
  const t = await T();
  const b = await page.evaluate(() =>
    [...document.querySelectorAll('[role="button"]')].map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').trim()),
  );
  di('');
  di(`── ${c.quien} — se espera: ${c.espera}`);
  di(`  ruta: ${page.url().replace('http://localhost:8082', '')}`);
  di(`  ¿franja?: ${/Alérgico a|Toma |No puede /.test(t) ? 'SÍ' : 'no'}`);
  di(`  alergias con NOMBRE: ${(t.match(/Alérgico a [^\n·]+/g) ?? []).join(' · ') || 'ninguna'}`);
  di(`  medicación con NOMBRE: ${(t.match(/Toma [^\n·]+/g) ?? []).join(' · ') || 'ninguna'}`);
  di(`  verbos que le PIDEN algo: ${['Registrar', 'Cargar', 'Reservar', 'Agendar', 'Cuéntanos'].filter((v) => new RegExp(`(^|\\W)${v}`).test(t)).join(' · ') || 'NINGUNO'}`);
  di(`  botones que le piden: ${b.filter((x) => /^(Registrar|Cargar|Reservar|Cuéntanos)/.test(x)).join(' · ') || 'ninguno'}`);
  di(`  fila de ausencias: ${(t.match(/^.*(desparasitación|alergias).*$/im) ?? ['(no aparece)'])[0].slice(0, 90)}`);
  await page.screenshot({ path: `docs/loop/S113-C-perfil-${c.quien}.png` });
}

di('');
di(`errores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await navegador.close();
