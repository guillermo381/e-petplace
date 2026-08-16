/**
 * verify-s99d-olas-hoy.mjs — EL CENSO DE OLAS DEL HOY, TRES POBLACIONES.
 *
 * Pedido de mesa para el **lote #0**: el HOY pasó de 2,0–2,5 s a 3,8–4,0 s en
 * frío y A discriminó que son **VIAJES, no pintado**. El lote cierra en
 * **<2 s en frío** —no en volver al baseline, que ya fallaba la vara— y
 * **tres instrumentos tienen que decir lo mismo**: este cuenta OLAS, el
 * aparato de C cuenta SEGUNDOS, el founder mide con el dedo.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 **QUÉ ES UNA OLA, PORQUE UN NÚMERO SIN SU DEFINICIÓN NO SE PUEDE
 * REPRODUCIR NI DISCUTIR.** Una ola es un grupo de peticiones que **pudieron
 * salir juntas**. Se agrupa por tiempo real, no por código:
 *
 *   > una petición abre OLA NUEVA si arrancó **después de que ya volvió
 *   > alguna** de la ola en curso — porque entonces no pudo haberse pedido
 *   > antes: dependía de esa respuesta.
 *
 * Lo que se paga en reloj es **la cantidad de olas**, no la de peticiones
 * (L-223 · D-738): cinco peticiones en paralelo cuestan un peaje; cinco
 * encadenadas cuestan cinco. *Por eso una cura que borra una petición que
 * viajaba EN PARALELO con otras no mejora el reloj ni un milisegundo — y
 * este instrumento es el único que puede decir cuál de las dos cosas pasó.*
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── LO QUE ESTE NÚMERO **NO** ES, declarado antes de que alguien lo use ─
 * **No son los segundos del founder.** Esto es **RN-web** (L-153), en una
 * máquina de escritorio con red de escritorio: el peaje por petición es
 * distinto al del teléfono. **Sirve para contar VIAJES y ver la forma de la
 * cadena; jamás para declarar que la vara de N16 se cumplió.** Esa la firma
 * el aparato.
 *
 * ── LAS TRES POBLACIONES, y por qué las tres ───────────────────────────
 * Criterio de la casa (ratificado por mesa al recibir L4): **un guard que
 * solo mide las poblaciones que la cura beneficia da verde flojo — se mide
 * también la que podría romperse.** Acá: `duenovet` y `duenotodo` son las
 * que la lápida abarata; `duenodes` es la que podría haber perdido su día.
 *
 * Uso:  node scripts/verify-s99d-olas-hoy.mjs [--puerto 8082] [--etiqueta X]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const BASE = `http://localhost:${arg('puerto', '8082')}`;
const ETIQUETA = arg('etiqueta', 'estado actual');
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
  { cuenta: 'duenovet', quien: 'prestador sin tienda' },
  { cuenta: 'duenotodo', quien: 'el dual' },
  { cuenta: 'duenodes', quien: 'vendedor puro' },
];

/** Nombre corto: la tabla/vista de REST, la función de RPC, o el acto de auth. */
function etiqueta(url) {
  const r = url.match(/\/rest\/v1\/(rpc\/)?([a-z0-9_]+)/i);
  if (r) return r[1] ? `rpc:${r[2]}` : r[2];
  const a = url.match(/\/auth\/v1\/([a-z0-9_]+)/i);
  return a ? `auth:${a[1]}` : null;
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const filas = [];

for (const caso of CASOS) {
  const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  const eventos = [];
  let contando = false;

  page.on('request', (r) => {
    const e = etiqueta(r.url());
    if (contando && e !== null) eventos.push({ nombre: e, inicio: Date.now(), fin: null });
  });
  page.on('requestfinished', (r) => {
    const e = etiqueta(r.url());
    if (e === null) return;
    // el más viejo sin cerrar con ese nombre
    const ev = eventos.find((x) => x.nombre === e && x.fin === null);
    if (ev) ev.fin = Date.now();
  });

  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.getByPlaceholder('ej: ana@correo.com').fill(`guillo381+${caso.cuenta}@gmail.com`);
    await page.locator('input[type="password"]').fill(CLAVE);
    contando = true; // desde el toque: el prólogo entero entra a la cuenta
    await page.getByText('Entrar', { exact: true }).click();
    await page.waitForTimeout(15000);
    contando = false;

    const cerrados = eventos.filter((e) => e.fin !== null).sort((a, b) => a.inicio - b.inicio);
    if (cerrados.length === 0) {
      filas.push({ ...caso, peticiones: 0, olas: 0, ms: 0, repetidas: [], detalle: [] });
      continue;
    }

    // ── EL AGRUPAMIENTO EN OLAS (ver la definición en la cabecera) ──
    const olas = [];
    let actual = [cerrados[0]];
    let minFinActual = cerrados[0].fin;
    for (const ev of cerrados.slice(1)) {
      if (ev.inicio >= minFinActual) {
        olas.push(actual);
        actual = [ev];
        minFinActual = ev.fin;
      } else {
        actual.push(ev);
        minFinActual = Math.min(minFinActual, ev.fin);
      }
    }
    olas.push(actual);

    const t0 = cerrados[0].inicio;
    const t1 = Math.max(...cerrados.map((e) => e.fin));
    const conteo = new Map();
    for (const e of cerrados) conteo.set(e.nombre, (conteo.get(e.nombre) ?? 0) + 1);

    filas.push({
      ...caso,
      peticiones: cerrados.length,
      olas: olas.length,
      ms: t1 - t0,
      repetidas: [...conteo.entries()].filter(([, n]) => n > 1),
      detalle: olas.map((o) => o.map((e) => e.nombre)),
    });
  } catch (e) {
    filas.push({ ...caso, error: e instanceof Error ? e.message : String(e) });
  } finally {
    await ctx.close();
  }
}
await browser.close();

console.log(`\n═══ CENSO DE OLAS DEL HOY · ${ETIQUETA} · RN-web (NO aparato, L-153) ═══\n`);
console.log(`| cuenta      | quién                 | peticiones | OLAS | red (ms) |`);
console.log(`|-------------|-----------------------|-----------:|-----:|---------:|`);
for (const f of filas) {
  if (f.error) {
    console.log(`| ${f.cuenta.padEnd(11)} | ${f.quien.padEnd(21)} |      EXCEPCIÓN: ${f.error.slice(0, 40)} |`);
    continue;
  }
  console.log(
    `| ${f.cuenta.padEnd(11)} | ${f.quien.padEnd(21)} | ${String(f.peticiones).padStart(10)} | ${String(f.olas).padStart(4)} | ${String(f.ms).padStart(8)} |`,
  );
}

for (const f of filas) {
  if (f.error) continue;
  console.log(`\n── ${f.cuenta} · la cadena, ola por ola:`);
  f.detalle.forEach((o, i) => console.log(`   ${String(i + 1).padStart(2)}. ${o.join(' ‖ ')}`));
  if (f.repetidas.length > 0) {
    console.log(`   🔁 repetidas: ${f.repetidas.map(([n, c]) => `${n}×${c}`).join(' · ')}`);
  }
}

console.log(
  `\n⚠️ OLAS, no segundos. La vara de N16 (<2 s EN FRÍO) la firma el aparato:\n` +
    `   este instrumento y el de C tienen que apuntar al mismo lado, no dar el\n` +
    `   mismo número. Un verde acá NO cierra el lote #0.\n`,
);
