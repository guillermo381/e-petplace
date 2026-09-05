#!/usr/bin/env node
/**
 * verify:cotejo — S113-E · las DOS MANOS sobre un documento, cotejadas.
 *
 * ── DÓNDE VIVEN LAS MANOS, Y POR QUÉ NO EN EL REPO ─────────────────────────
 * `~/.epetplace/ia-conjuntos/manos/` (o `EPETPLACE_IA_DIR`). Fuera del repo por
 * DOS razones distintas, y las dos importan:
 *  ① **Ninguna pista ve la rama de la otra hasta que alguien mergea.** Con las
 *    manos en el árbol de cada uno, el cotejo sólo corre después de un merge —
 *    o sea justo cuando ya no sirve para nada.
 *  ② Llevan **lotes y fechas de animales reales**, y la ley de la casa dice que
 *    eso no baja a un archivo del repo.
 *
 * ── LA FIRMA ES EL ROJO DE ESTE GATE ───────────────────────────────────────
 * `FIRMAS.json` guarda el sha256 de cada mano al depositarla. El gate lo
 * re-calcula: **una mano editada después de firmarse deja de ser la mano que se
 * comparó**, y sin esto el cotejo diría exactamente lo mismo sobre otro
 * contenido. *Es la única forma de que «coincidimos» signifique algo mañana.*
 *
 * ── LO QUE ESTE COTEJO NO DICE ─────────────────────────────────────────────
 * Que lo coincidente sea VERDAD. Dice que **dos lectores leyeron igual**, que
 * no es lo mismo: dos lectores pueden equivocarse de la misma manera, sobre
 * todo si el error es verosímil. Por eso lo que coincide se declara «coincide»,
 * no «es verdad».
 *
 * ── POR QUÉ EMPAREJA POR NÚMERO DE FILA ────────────────────────────────────
 * El cotejo por NOMBRE (`scripts/ia/cotejar-verdad.mjs`, de D) produce ruido
 * sobre estas manos por dos causas medidas: **alias de campo** (D escribe
 * `lote_visible`, E escribe `lote` ⇒ todos los lotes de D salían `null`) y
 * **granularidad del nombre** («Peek'o» vs «Peek» ⇒ los lee como filas
 * distintas). Acá se empareja por número de fila —los dos leímos en el mismo
 * orden— y los alias se resuelven.
 *
 *   node scripts/verify-cotejo.mjs --doc A
 *   node scripts/verify-cotejo.mjs --control
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const RAIZ = process.env.EPETPLACE_IA_DIR ?? join(process.env.HOME, '.epetplace', 'ia-conjuntos');
const MANOS = join(RAIZ, 'manos');
const ALIAS = { lote: ['lote', 'lote_visible'], vencimiento_biologico: ['vencimiento_biologico', 'vencimiento', 'venc_visible'] };
const CAMPOS = ['vacuna', 'fecha_aplicada', 'fecha_proxima', 'lote', 'vencimiento_biologico', 'veterinario', 'evidencia'];
const di = (s) => console.log(s);
const val = (f, c) => { for (const k of (ALIAS[c] ?? [c])) if (f?.[k] != null) return f[k]; return null; };
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

/* ── LAS FECHAS SE COMPARAN POR VALOR, NO POR CADENA ───────────────────────
 * `2024-04-25` y `25APR24` son la MISMA fecha; contarlas como desacuerdo le
 * mete al founder tres decisiones que no son decisiones. Pero `05-2024` y
 * `2024-05-31` NO son lo mismo: el sticker imprime sólo mes-año y la otra mano
 * completó un día que no está escrito — **eso sí es del founder**. Por eso el
 * comparador devuelve la precisión además del valor: dos fechas iguales con
 * precisión distinta son un desacuerdo REAL. */
const MES = { ene:1, jan:1, feb:2, mar:3, abr:4, apr:4, may:5, jun:6, jul:7, ago:8, aug:8, sep:9, sept:9, oct:10, nov:11, dic:12, dec:12 };
export function aFechaFlexible(x) {
  if (x == null) return null;
  const t = String(x).trim();
  let m;
  if ((m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return { y:+m[1], m:+m[2], d:+m[3], prec:'dia' };
  if ((m = t.match(/^(\d{1,2})[\/.\s-]([A-Za-z]{3,4})[\/.\s-](\d{2,4})$/))) {
    const mm = MES[m[2].toLowerCase().slice(0,4)] ?? MES[m[2].toLowerCase().slice(0,3)];
    if (mm) return { y: +m[3] < 100 ? 2000 + +m[3] : +m[3], m: mm, d: +m[1], prec:'dia' };
  }
  if ((m = t.match(/^(\d{1,2})([A-Za-z]{3})(\d{2})$/))) {           // 25APR24
    const mm = MES[m[2].toLowerCase()];
    if (mm) return { y: 2000 + +m[3], m: mm, d: +m[1], prec:'dia' };
  }
  if ((m = t.match(/^(\d{1,2})[-\/](\d{4})$/))) return { y:+m[2], m:+m[1], prec:'mes' };   // 05-2024
  if ((m = t.match(/^([A-Za-z]{3})\s*(\d{2,4})$/))) {                                       // FEB 25
    const mm = MES[m[1].toLowerCase()];
    if (mm) return { y: +m[2] < 100 ? 2000 + +m[2] : +m[2], m: mm, prec:'mes' };
  }
  return null;
}
/** null = no son fechas comparables · true/false = mismo valor Y misma precisión */
function mismaFecha(a, b) {
  const fa = aFechaFlexible(a), fb = aFechaFlexible(b);
  if (!fa || !fb) return null;
  return fa.y === fb.y && fa.m === fb.m && fa.prec === fb.prec && (fa.prec === 'mes' || fa.d === fb.d);
}

/** Devuelve {ok, motivo} — la firma es lo que hace auditable al cotejo. */
export function verificarFirmas(dir) {
  const rutaF = join(dir, 'FIRMAS.json');
  if (!existsSync(rutaF)) return { ok: false, fatal: true, motivo: `falta ${rutaF}: sin firmas, el cotejo no se puede auditar` };
  const { firmas } = JSON.parse(readFileSync(rutaF, 'utf8'));
  const rotas = [];
  for (const [archivo, f] of Object.entries(firmas)) {
    const p = join(dir, archivo);
    if (!existsSync(p)) { rotas.push(`${archivo}: FALTA el archivo que la firma nombra`); continue; }
    const sha = createHash('sha256').update(readFileSync(p)).digest('hex');
    if (sha !== f.sha256) rotas.push(`${archivo}: la mano CAMBIÓ desde que se firmó (${f.sha256.slice(0, 12)} → ${sha.slice(0, 12)})`);
  }
  return rotas.length ? { ok: false, motivo: rotas } : { ok: true, n: Object.keys(firmas).length };
}

/** Cotejo por número de fila, con los alias resueltos. */
export function cotejar(D, E) {
  const contra = [], soloD = [], soloE = [], nombre = [], coinciden = [];
  const n = Math.max(D.filas.length, E.filas.length);
  for (let i = 0; i < n; i++) {
    const d = D.filas[i], e = E.filas[i];
    let iguales = 0;
    for (const c of CAMPOS) {
      const vd = val(d, c), ve = val(e, c);
      if (norm(vd) === norm(ve)) { if (vd != null) iguales += 1; continue; }
      if (mismaFecha(vd, ve) === true) { iguales += 1; continue; }   // mismo valor, otro formato
      if (c === 'vacuna' && vd && ve && (norm(vd).includes(norm(ve)) || norm(ve).includes(norm(vd)))) { iguales += 1; continue; }
      if (c === 'vacuna') {
        /* Dos nombres distintos NO son lo mismo entre si. Si comparten alguna
           palabra de producto ("Recombitek (Diluente…)" vs "Recombitek
           (moquillo…)") es el MISMO producto escrito con mas o menos detalle y
           no hace falta arbitrarlo. Si no comparten ninguna —"Recombitek
           (sticker beige)" vs "(sticker no identificable)"— uno pudo leerlo y
           el otro no, y eso SI es del ojo del founder. La primera version los
           metia a todos en la misma bolsa y decia «esperan: 0» sobre una
           diferencia real. */
        const pal = (x) => new Set(String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .split(/[^a-z0-9]+/).filter((w) => w.length > 3));
        const comun = [...pal(vd)].some((w) => pal(ve).has(w));
        /* 🔴 Y el discriminador que de verdad decide: **si una mano DECLARA que
           no pudo leerlo**, no es «el mismo nombre con otro detalle» — es que
           uno leyó y el otro no, y eso siempre va al founder. La version por
           palabra comun sola no lo veia: «Recombitek (sticker beige)» y
           «(sticker no identificable)» comparten «sticker», que es una palabra
           DESCRIPTIVA y no un producto. */
        const declaraIlegible = (x) => /no identificable|ilegible|no se lee|no legible|no pude/i.test(String(x));
        nombre.push({ fila: i + 1, D: vd, E: ve, arbitrar: !comun || declaraIlegible(vd) || declaraIlegible(ve) });
        continue;
      }
      if (vd != null && ve != null) contra.push({ fila: i + 1, campo: c, D: vd, E: ve });
      else if (vd != null) soloD.push({ fila: i + 1, campo: c, valor: vd });
      else soloE.push({ fila: i + 1, campo: c, valor: ve });
    }
    if (iguales) coinciden.push(i + 1);
  }
  return { contra, soloD, soloE, nombre, coinciden, nD: D.filas.length, nE: E.filas.length };
}

// ═══ CONTROL ══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  const tmp = '.control-verify-cotejo-s113e';
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  let fallos = 0;
  const ok = (b, et, d = '') => { di(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) fallos += 1; };

  const mano = (filas) => JSON.stringify({ filas }, null, 2);
  const A = mano([{ vacuna: 'Rabimune', fecha_aplicada: '2020-08-29', lote_visible: '46559A', veterinario: 'MVZ X', evidencia: 'sticker_con_fecha' }]);
  const B = mano([{ vacuna: 'Rabimune', fecha_aplicada: '2020-08-29', lote: '46559A', veterinario: 'MVZ X', evidencia: 'sticker_con_fecha' }]);
  writeFileSync(join(tmp, 'documento-Z--D.json'), A);
  writeFileSync(join(tmp, 'documento-Z--E.json'), B);
  const firmar = () => {
    const firmas = {};
    for (const f of ['documento-Z--D.json', 'documento-Z--E.json'])
      firmas[f] = { sha256: createHash('sha256').update(readFileSync(join(tmp, f))).digest('hex') };
    writeFileSync(join(tmp, 'FIRMAS.json'), JSON.stringify({ firmas }, null, 2));
  };
  firmar();

  ok(verificarFirmas(tmp).ok, 'NEGATIVO  con las manos intactas, las firmas verifican');

  // CLASE · el alias: `lote_visible` de D vale como `lote`. Sin esto, el cotejo
  // reportaría un desacuerdo de lote en CADA fila que D haya leído.
  const c1 = cotejar(JSON.parse(A), JSON.parse(B));
  ok(c1.contra.length === 0 && c1.soloD.length === 0 && c1.soloE.length === 0,
    'CLASE     `lote_visible` (D) y `lote` (E) son el MISMO campo',
    `(contra ${c1.contra.length} · soloD ${c1.soloD.length} · soloE ${c1.soloE.length})`);

  // POSITIVO 1 · una mano editada después de firmarse ⇒ ROJO que la NOMBRA.
  writeFileSync(join(tmp, 'documento-Z--E.json'), mano([{ vacuna: 'Rabimune', fecha_aplicada: '2021-01-01', lote: '46559A' }]));
  const v = verificarFirmas(tmp);
  ok(!v.ok && String(v.motivo).includes('documento-Z--E.json') && String(v.motivo).includes('CAMBIÓ'),
    'POSITIVO  una mano editada tras firmarse sale ROJO y se la nombra',
    Array.isArray(v.motivo) ? `(${v.motivo[0].slice(0, 70)}…)` : '');

  // POSITIVO 2 · una contradicción real se ve.
  const c2 = cotejar(JSON.parse(A), JSON.parse(mano([{ vacuna: 'Rabimune', fecha_aplicada: '2021-01-01', lote: '46559A' }])));
  ok(c2.contra.some((x) => x.campo === 'fecha_aplicada'),
    'POSITIVO  dos manos que leen distinto producen una CONTRADICCIÓN');

  // POSITIVO 3 · falta una mano ⇒ NO CONCLUYENTE, jamás verde.
  rmSync(join(tmp, 'documento-Z--E.json'));
  ok(!verificarFirmas(tmp).ok, 'POSITIVO  si falta una mano el gate NO da verde');

  rmSync(tmp, { recursive: true, force: true });
  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo. Lo que diga este cotejo NO se usa.`); process.exit(1); }
  di('✅ verifica las firmas, resuelve los alias, y ve la contradicción cuando la hay.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
/* Acepta las DOS formas: `--doc A` y `--doc=A`. La primera version solo leia
   la del `=` y con la otra imprimia el uso — o sea que el gate «no fallaba»,
   simplemente no medía, que es peor. */
const av = process.argv.slice(2);
const doc = (av.find((a) => a.startsWith('--doc='))?.slice(6)
  ?? (av.includes('--doc') ? av[av.indexOf('--doc') + 1] : '') ?? '').toUpperCase();
if (!doc) { di('uso: node scripts/verify-cotejo.mjs --doc A   ·   --control'); process.exit(2); }
if (!existsSync(MANOS)) { di(`🔴 NO CONCLUYENTE: no existe ${MANOS}`); process.exit(2); }

const f = verificarFirmas(MANOS);
if (!f.ok) {
  di('🔴 FIRMAS:'); for (const m of [].concat(f.motivo)) di(`   ${m}`);
  di('   Una mano que cambió después de firmarse ya no es la que se comparó.');
  process.exit(f.fatal ? 2 : 1);
}
di(`verify:cotejo · ${MANOS}\n  ✅ ${f.n} firma(s) verificadas por sha256\n`);

for (const m of ['D', 'E']) {
  const p = join(MANOS, `documento-${doc}--${m}.json`);
  if (!existsSync(p)) { di(`🔴 NO CONCLUYENTE: falta la mano de ${m} para el documento ${doc}.`); process.exit(2); }
}
const D = JSON.parse(readFileSync(join(MANOS, `documento-${doc}--D.json`), 'utf8'));
const E = JSON.parse(readFileSync(join(MANOS, `documento-${doc}--E.json`), 'utf8'));
const r = cotejar(D, E);

di(`═══ DOCUMENTO ${doc} · D=${r.nD} filas · E=${r.nE} filas ═══`);
di(r.nD === r.nE ? `  ✅ el CONTEO coincide (${r.nD}) — es el número que más pesa`
                 : `  🔴 el CONTEO NO coincide: ${r.nD} vs ${r.nE}. Se arbitra ANTES que cualquier campo.`);
di(`  filas con al menos un campo coincidente: ${r.coinciden.length}`);
di('  ⚠️ coincidir NO es ser verdad: dos lectores pueden equivocarse igual.\n');

di(`── CONTRADICCIONES · los dos leyeron y dicen distinto: ${r.contra.length}`);
for (const x of r.contra) di(`     fila ${String(x.fila).padStart(2)}  ${x.campo.padEnd(22)} D: ${JSON.stringify(x.D)}   E: ${JSON.stringify(x.E)}`);
di(`\n── SÓLO UNA MANO LO LEYÓ (no es desacuerdo): D ${r.soloD.length} · E ${r.soloE.length}`);
for (const x of r.soloD) di(`     fila ${String(x.fila).padStart(2)}  ${x.campo.padEnd(22)} sólo D: ${JSON.stringify(x.valor)}`);
for (const x of r.soloE) di(`     fila ${String(x.fila).padStart(2)}  ${x.campo.padEnd(22)} sólo E: ${JSON.stringify(x.valor)}`);
if (r.nombre.length) {
  di(`\n── EL MISMO PRODUCTO ESCRITO DISTINTO (tampoco es desacuerdo): ${r.nombre.length}`);
  for (const x of r.nombre) di(`     fila ${String(x.fila).padStart(2)}${x.arbitrar ? ' 🔴' : '   '} D: ${JSON.stringify(String(x.D).slice(0, 44))}  E: ${JSON.stringify(String(x.E).slice(0, 44))}`);
}

const nombresAArbitrar = r.nombre.filter((x) => x.arbitrar);
const esperan = r.contra.length + nombresAArbitrar.length + (r.nD === r.nE ? 0 : 1);
di(`\n══ ESPERAN AL FOUNDER: ${esperan}`);
if (r.nD !== r.nE) di(`   · el CONTEO del documento ${doc} (${r.nD} vs ${r.nE})`);
for (const x of r.contra) di(`   · fila ${x.fila} · ${x.campo}`);
for (const x of nombresAArbitrar) di(`   · fila ${x.fila} · el NOMBRE: uno lo pudo leer y el otro no — D: ${JSON.stringify(String(x.D).slice(0, 40))} · E: ${JSON.stringify(String(x.E).slice(0, 40))}`);
di(esperan ? '\n   Hasta que firme, esos campos NO se puntúan y la tabla que salga es un PISO.'
           : '\n   ✅ nada espera arbitraje en este documento.');
