/**
 * verify-s98c-corte-dias.mjs — LOS DÍAS DEL CORTE, POR EL CAMINO REAL.
 *
 * Mide las DOS cosas que pueden salir mal y que ningún typecheck ve:
 *
 * BRAZO A · un set NO-default persiste. Se crea un corte de FIN DE SEMANA
 *           (sáb+dom) — a propósito el contrario del default L–V: si la
 *           pantalla ignorara los chips y mandara su default, este brazo lo
 *           canta. Un set igual al default no discriminaría NADA.
 *
 * BRAZO B · 🔴 EL QUE IMPORTA: se reabre y se cambia SOLO LA HORA. Los días
 *           tienen que SOBREVIVIR. Es el modo de falla que le advertí a A en
 *           el contrato —una puerta que trate los parámetros ausentes como
 *           «poné el default» le resetea los días al vendedor cada vez que
 *           corrige un horario— y también el mío: si la Hoja no PRECARGARA lo
 *           que la fila tiene, mandaría L–V y el daño sería idéntico. **Las
 *           dos mitades fallan igual y desde acá se ven igual: por eso se
 *           mide el RESULTADO y no cuál de las dos lo produjo.**
 *
 * ESCRIBE. Limpia por código y verifica residuo 0.
 */
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CODIGO = 's98c-verify-dias';
const EMAIL = process.env.CUENTA || 'guillo381+duenotodo@gmail.com';
const PASS =
  process.env.CLAVE ||
  execSync('security find-generic-password -a siembra -s epetplace-siembra-s97 -w', {
    encoding: 'utf8',
  }).trim();

const sql = (texto) => {
  const f = `/tmp/s98c-dias-${Date.now()}.sql`;
  writeFileSync(f, texto);
  const out = execSync(`npx supabase --experimental db query --linked --file ${f} 2>/dev/null`, {
    encoding: 'utf8',
    cwd: new URL('..', import.meta.url).pathname,
  });
  return JSON.parse(out.match(/(\[[\s\S]*\])/)[1]);
};
const leerFila = () =>
  sql(
    `SELECT dias_semana::text AS dias, incluye_festivos AS fest, corte::text AS corte
       FROM entrega_turnos WHERE codigo = '${CODIGO}';`,
  )[0] ?? null;

sql(`DELETE FROM entrega_turnos WHERE codigo = '${CODIGO}';`);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);

async function irAConfig() {
  await page.goto('http://localhost:8081/ventas/configuracion', {
    waitUntil: 'networkidle',
    timeout: 180000,
  });
  await page.waitForTimeout(6000);
}
async function abortar(porque) {
  console.error(`✗ ABORTA SIN VEREDICTO: ${porque}`);
  sql(`DELETE FROM entrega_turnos WHERE codigo = '${CODIGO}';`);
  await browser.close();
  process.exit(2);
}

await irAConfig();
if ((await page.getByText('Cortes horarios', { exact: false }).count()) === 0) {
  await abortar('no llegué a /ventas/configuracion');
}

// ── BRAZO A · crear con un set NO-default ────────────────────────────────
await page.getByText('Agregar corte', { exact: false }).first().click();
await page.waitForTimeout(2500);
if ((await page.getByPlaceholder('En la mañana').count()) === 0) {
  await abortar('la Hoja del corte no montó');
}
await page.getByPlaceholder('En la mañana').fill(CODIGO);
const horas = page.getByPlaceholder('14:00');
await horas.fill('11:00');
await page.getByPlaceholder('15:00').fill('16:00');
await page.getByPlaceholder('18:00').fill('20:00');

// De L–V a solo fin de semana: se apagan los cinco y se prenden S y D.
for (const d of ['L', 'M', 'X', 'J', 'V']) {
  await page.getByRole('checkbox', { name: d, exact: true }).click();
  await page.waitForTimeout(120);
}
for (const d of ['S', 'D']) {
  await page.getByRole('checkbox', { name: d, exact: true }).click();
  await page.waitForTimeout(120);
}
await page.getByText('Guardar', { exact: true }).last().click();
await page.waitForTimeout(6000);

const trasCrear = leerFila();
// {6,0} en cualquier orden — el motor guarda un conjunto, no una secuencia.
const setFinde = (v) =>
  v !== null &&
  [...v.matchAll(/\d+/g)].map((m) => Number(m[0])).sort().join(',') === '0,6';
const brazoA = setFinde(trasCrear?.dias ?? null);

// ── BRAZO B · reabrir y cambiar SOLO la hora ─────────────────────────────
let brazoB = false;
let trasEditar = null;
if (brazoA) {
  await irAConfig();
  await page.getByText(CODIGO, { exact: false }).first().click();
  await page.waitForTimeout(2500);
  await page.getByPlaceholder('14:00').fill('09:30');
  await page.waitForTimeout(400);
  await page.getByText('Guardar', { exact: true }).last().click();
  await page.waitForTimeout(6000);
  trasEditar = leerFila();
  brazoB = setFinde(trasEditar?.dias ?? null) && trasEditar?.corte?.startsWith('09:30');
}

sql(`DELETE FROM entrega_turnos WHERE codigo = '${CODIGO}';`);
const residuo = sql(
  `SELECT count(*)::int AS n FROM entrega_turnos WHERE codigo = '${CODIGO}';`,
)[0].n;
await browser.close();

console.log('── verify-s98c-corte-dias ──');
console.log(`A · set NO-default (sáb+dom) persiste ..: ${brazoA ? 'VERDE' : 'ROJO'}`);
console.log(`      fila tras crear: ${JSON.stringify(trasCrear)}`);
console.log(`B · editar SOLO la hora NO pisa días ...: ${brazoB ? 'VERDE' : 'ROJO'}`);
console.log(`      fila tras editar: ${JSON.stringify(trasEditar)}`);
console.log(`residuo: ${residuo} (debe ser 0)`);
console.log(`errores JS: ${errores.length}`);
for (const e of errores) console.log('  ' + e);

if (!brazoA || !brazoB || residuo !== 0) {
  console.error('ROJO');
  process.exit(1);
}
console.log('VERDE — los días son del vendedor y sobreviven a corregir la hora.');
