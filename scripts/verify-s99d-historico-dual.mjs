/**
 * verify-s99d-historico-dual.mjs — EL ARCHIVO TIENE DOS NATURALEZAS (L4).
 *
 * `PLAN_S99` L4 pide «histórico en Cuenta» y la firma del 15-ago hizo
 * hermanas a citas y pedidos. Acá esa ley se aplica al pasado: **una sola
 * pantalla, dos naturalezas, filtros por naturaleza.**
 *
 * 🔴 **MIDE LAS TRES POBLACIONES, y ésa es la mitad que importa.** Un guard
 * que solo probara la cuenta dual daría verde sin ver lo más caro: que la
 * pantalla **no cambió** para quien ya la tenía. `/historico` pasó gate del
 * founder el 8-ago; **la regresión silenciosa acá no es que el segmento no
 * aparezca — es que aparezca donde no corresponde**, o que el mundo de
 * citas pierda algo al hacerle lugar al otro.
 *
 * | cuenta      | naturalezas | qué exige |
 * |-------------|-------------|-----------|
 * | `duenotodo` | citas+pedidos | el segmento SE MONTA · cruzar CONSERVA el rango |
 * | `duenovet`  | citas         | el segmento NO se monta · el tipeo de mascota sigue |
 * | `duenodes`  | pedidos       | el segmento NO se monta · arranca en pedidos · CERO tipeo de mascota |
 *
 * ⚠️ RN-web, no dispositivo (L-153).
 *
 * Uso:  node scripts/verify-s99d-historico-dual.mjs [--puerto 8082]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const BASE = `http://localhost:${arg('puerto', '8082')}`;
const CLAVE = execFileSync('security', [
  'find-generic-password',
  '-a',
  'siembra',
  '-s',
  'epetplace-siembra-s97',
  '-w',
])
  .toString()
  .trim();

const CASOS = [
  { cuenta: 'duenotodo', dual: true, arranca: 'Servicios' },
  { cuenta: 'duenovet', dual: false, arranca: 'Servicios' },
  { cuenta: 'duenodes', dual: false, arranca: 'Pedidos' },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const fallos = [];

for (const caso of CASOS) {
  const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  const email = `guillo381+${caso.cuenta}@gmail.com`;
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.getByPlaceholder('ej: ana@correo.com').fill(email);
    await page.locator('input[type="password"]').fill(CLAVE);
    await page.getByText('Entrar', { exact: true }).click();
    await page.waitForTimeout(11000);
    await page.goto(`${BASE}/historico`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.waitForTimeout(9000);

    const seg = await page.getByRole('tab', { name: 'Servicios', exact: true }).count();
    const segP = await page.getByRole('tab', { name: 'Pedidos', exact: true }).count();
    const montado = seg > 0 && segP > 0;
    // El tipeo de mascota es del mundo CITAS y nada más: si aparece del
    // lado pedidos, la pantalla le está ofreciendo al vendedor un eje que
    // §7.4 le prohíbe (y que su lector no puede llenar).
    const tipeo = await page.getByPlaceholder('Empieza a escribir su nombre').count();
    console.log(
      `${caso.cuenta.padEnd(10)} · segmento=${montado ? 'sí' : 'no'} · tipeo-mascota=${tipeo > 0 ? 'sí' : 'no'}`,
    );

    if (montado !== caso.dual) {
      fallos.push(`${caso.cuenta}: el segmento ${montado ? 'SE MONTÓ' : 'NO se montó'} y debía ser al revés`);
    }
    // Con una sola naturaleza, el tipeo tiene que seguir la naturaleza:
    // presente en citas, ausente en pedidos.
    if (!caso.dual) {
      const esperaTipeo = caso.arranca === 'Servicios';
      if (tipeo > 0 !== esperaTipeo) {
        fallos.push(
          `${caso.cuenta}: tipeo de mascota ${tipeo > 0 ? 'presente' : 'ausente'} — se esperaba ${esperaTipeo ? 'presente' : 'ausente'}`,
        );
      }
    }

    // EL CRUCE CONSERVA EL RANGO — el eco del selector compartido del dual.
    if (caso.dual) {
      await page.getByText('90 días', { exact: true }).click();
      await page.waitForTimeout(5000);
      const antes = await page.locator('body').innerText();
      await page.getByRole('tab', { name: 'Pedidos', exact: true }).click();
      await page.waitForTimeout(7000);
      const despues = await page.locator('body').innerText();
      // El renglón de estado dice «N en el período · desde a hasta». El
      // período tiene que ser EL MISMO a los dos lados: se compara la
      // cola del renglón, no el N (que sí cambia — son otros datos).
      const periodo = (s) => (s.match(/en el período · ([^\n]+)/) ?? [])[1] ?? null;
      const pa = periodo(antes);
      const pd = periodo(despues);
      console.log(`${' '.repeat(10)}   cruce: «${pa}» → «${pd}»`);
      if (pa === null || pd === null) {
        fallos.push(`duenotodo: no se pudo leer el período a los dos lados (antes=${pa} · después=${pd})`);
      } else if (pa !== pd) {
        fallos.push(`duenotodo: el cruce PERDIÓ el período (${pa} → ${pd})`);
      }
    }
  } catch (e) {
    fallos.push(`${caso.cuenta}: EXCEPCIÓN — ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    await ctx.close();
  }
}
await browser.close();

if (fallos.length > 0) {
  console.error(`\n🔴 ROJO — ${fallos.length} fallo(s):`);
  for (const f of fallos) console.error(`   · ${f}`);
  process.exit(1);
}
console.log('\n✅ VERDE — dos naturalezas, cada población ve la suya, y el cruce conserva el período.');
