/**
 * ⭐ **¿QUÉ PROP SE ESTÁ CAYENDO AL DOM?** (S113-C · 1.0.1).
 *
 * E vio en web un toast *«React does not recognize the `t…` prop»*. Ese aviso
 * dice **exactamente** cuál es la prop y en qué elemento, así que no hace falta
 * adivinar: se recorre la pantalla donde vive la pieza sospechosa y se capturan
 * los avisos de consola tal como salen.
 *
 * ⚠️ **Sólo pasa en web y sólo en dev**: RN-web reenvía al DOM las props que no
 * reconoce, y React avisa. En el aparato no hay DOM y el aviso no existe — por
 * eso lo vio E en web y nadie lo vio en el teléfono. *Que no se vea en el
 * aparato no lo hace inofensivo: es una prop que el componente ignora.*
 */
import { chromium } from 'playwright-core';

const CORREO = process.env.CLIENTE_EMAIL ?? '';
const CLAVE = process.env.CLIENTE_PASSWORD ?? '';
const CARNET = process.env.CARNET ?? '';
const MASCOTA_ID = process.env.MASCOTA_ID ?? '';
const di = (s) => console.log(s);

const navegador = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await navegador.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });

const avisos = new Set();
page.on('console', (m) => {
  const t = m.text();
  if (/does not recognize|Unknown prop|Invalid DOM property|non-boolean attribute/i.test(t)) {
    avisos.add(t.replace(/\s+/g, ' ').slice(0, 300));
  }
});

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

/* ① la pantalla de vacunas: ahí viven `ListaPlanVacunal` y el detalle fino. */
await page.goto(`http://localhost:8082/hogar/vacunas/${MASCOTA_ID}`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(9000);
di(`① pantalla de vacunas · avisos hasta acá: ${avisos.size}`);

/* ② el carnet en revisión: ahí vive `FilaConfirmacionVacuna`. */
await page.goto(`http://localhost:8082/carnet?mascotaId=${MASCOTA_ID}&nombre=Prueba`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(5000);
await page.getByText(/Más opciones|More options/i).first().click().catch(() => {});
await page.waitForTimeout(2500);
const [chooser] = await Promise.all([
  page.waitForEvent('filechooser', { timeout: 30000 }).catch(() => null),
  page.getByText(/galer|gallery/i).first().click().catch(() => {}),
]);
if (chooser !== null) {
  await chooser.setFiles(CARNET);
  for (let i = 0; i < 40 && !/Es correcta|Looks right/.test(await T()); i += 1) await page.waitForTimeout(1000);
  await page.waitForTimeout(2500);
}
di(`② carnet en revisión · avisos totales: ${avisos.size}`);

/* 🔴 **¿ES SÓLO RUIDO O CAMBIA EL DIBUJO?** React descarta la prop que no
   reconoce, así que en web el desplazamiento **no se aplica**. Se mira el
   `<path>` de la barra: si no lleva ni `translatey` ni un `transform` con
   translate, el valle se dibuja sin su corrimiento — y eso ya no es un toast,
   es una divergencia entre web y el aparato. */
await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(7000);
const paths = await page.evaluate(() =>
  [...document.querySelectorAll('svg path')].slice(0, 4).map((e) => ({
    translatey: e.getAttribute('translatey'),
    translateY: e.getAttribute('translateY'),
    transform: e.getAttribute('transform'),
    d: (e.getAttribute('d') ?? '').slice(0, 24),
  })),
);
di('');
di('── EL PATH DE LA BARRA, EN EL DOM ─────────────────────────');
for (const x of paths) di(`  d="${x.d}…" · translatey=${x.translatey} · transform=${x.transform}`);

di('');
di('── LOS AVISOS, LITERALES ──────────────────────────────────');
if (avisos.size === 0) di('  (ninguno)');
for (const a of avisos) di(`  ${a}`);
await navegador.close();
