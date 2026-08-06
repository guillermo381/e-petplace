#!/usr/bin/env node
/**
 * verify:censo — EL GUARD DE REGRESIÓN DE CENSO (S87-B → S88, D-651 ②).
 *
 * ┌───────────────────────────────────────────────────────────────────┐
 * │ LO QUE UN CENSO MIDIÓ UNA VEZ PUEDE DECAER EN SILENCIO.           │
 * │ SE RE-MIDE CONTRA SU FUENTE, NO SE DESCRIBE. SI DIVERGE, ROJO.    │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * ── LINAJE (renombrado por adjudicación de mesa, S88 — el invariante
 *    NO cambió): nació como «verify:premisas», el guard de las PREMISAS
 *    INERTES — ramas que el código declara inalcanzables (P1/P2). P3 (el
 *    contador del canon) y P4 (la línea base de chips) lo ensancharon a
 *    lo que siempre fue por debajo: **toda afirmación que la casa dio
 *    por medida y que puede divergir sin que nada se ponga rojo**. Los
 *    ids P1..Pn se CONSERVAN — son el linaje, y las actas ya los citan.
 *
 * El registro (qué se vigila, con su medición) vive en
 * `scripts/censo-regresion.mjs`. Acá vive el instrumento.
 *
 * ── LAS TRES DIRECCIONES EN LAS QUE ESTE GUARD PUEDE FALLAR, y qué hace
 *    con cada una (acta del método S86 §8 — un guard falla igual en las
 *    dos direcciones, y la tercera es fallar callado):
 *
 *   ① DECIR DE MENOS — vigilar 1 premisa cuando hay 9 escritas. Lo ataja
 *      el BRAZO ②: **toda** ocurrencia de `inerte` en el corpus tiene que
 *      estar clasificada (registrada o eximida con su razón). La que no
 *      esté sale ROJA. No depende de que mi vocabulario acierte: depende
 *      de que todo esté contado.
 *   ② DECIR DE MÁS — gritar sobre los «inerte» de la Ley 13 (sin
 *      movimiento), que no son premisas. Lo ataja la lista de EXENTAS,
 *      por sitio y con razón escrita — jamás una regex laxa. *Un guard
 *      que grita donde no pasa nada se desactiva solo.*
 *   ③ FALLAR CALLADO — «no pude medir» degradado a «todo bien». Por
 *      L-197 eso es ROJO, nunca verde: sin motor no hay veredicto. El
 *      escape existe, es explícito y RUIDOSO: `--sin-motor`.
 *      *Es exactamente el caso de `verify-fuentes-legibles`, que en S86
 *      dio VERDE sobre CERO archivos.*
 *
 * ── LA AUTO-PRUEBA (L-192 mecanizada, como el lint de la casa): los
 *    cuatro modos de falla se ejercitan con fixtures sintéticos ANTES de
 *    medir nada real. Si alguno NO puede producir rojo, el guard entero
 *    se declara DECORATIVO y falla. **El rojo se produce antes (L-199).**
 *
 * ── DÓNDE CORRE, y su límite declarado: este guard NECESITA LA DB, así
 *    que NO va en `.githooks/pre-commit` — un hook que exige red le
 *    niega el commit a quien esté sin conexión, y un gate así se saltea
 *    por costumbre. Su lugar es el paso ⓪ / el cierre de sesión, al lado
 *    de `verify-ota`. **Consecuencia honesta: una premisa escrita a las
 *    10 se descubre recién cuando alguien corre esto.** Mirror del brazo
 *    ② dentro de `verify:diseno` (que sí corre en cada commit) = decisión
 *    de mesa, no de este archivo: `verify:diseno` lee `.tsx` y uno de los
 *    sitios medidos es `.ts`, así que sería ensanchar su corpus.
 *
 * El exit se lee del COMANDO, jamás del pipe (L-191).
 *
 *   node scripts/verify-censo.mjs
 *   node scripts/verify-censo.mjs --sin-motor   (ruidoso, se declara)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { PREMISAS, EXENTAS, RAICES, PISO_OCURRENCIAS, extraerConsultasDeFuente } from './censo-regresion.mjs';
// El canal a la DB es el de la casa (`lib-db.mjs`, D-352): solo SELECT,
// CLI linkeado, cero secretos en el repo. Se IMPORTA, no se re-implementa
// —copiar el helper al lado es exactamente lo que L-175 prohíbe—.
import { dbQuery } from './lib-db.mjs';

const SIN_MOTOR = process.argv.includes('--sin-motor');

/* ── EL ANCLA — contra qué árbol se midió (patrón `verdicto.mjs`, S84-B12).
 *    Un veredicto sin ancla dice si el código pasa, no CUÁL código pasó. */
function ancla() {
  const git = (c) => { try { return execSync(c, { stdio: 'pipe' }).toString().trim(); } catch { return '?'; } };
  const sucio = git('git status --porcelain');
  console.log(
    `ancla · rama ${git('git rev-parse --abbrev-ref HEAD')} · HEAD ${git('git rev-parse --short HEAD')} · ` +
      (sucio === '' ? 'árbol limpio' : `⚠️ ${sucio.split('\n').length} archivo(s) sin commitear`),
  );
}

/* ── EL CORPUS ─────────────────────────────────────────────────────── */

function archivosDe(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...archivosDe(p));
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

/** Toda ocurrencia de la palabra en el corpus, con su archivo y línea.
 *  A propósito NO clasifica: clasificar es del brazo ②, y mezclarlo acá
 *  volvería a meter vocabulario en la detección. */
function ocurrenciasDeInerte(archivos, leer) {
  const out = [];
  for (const p of archivos) {
    leer(p).split('\n').forEach((linea, i) => {
      if (/\binertes?\b/i.test(linea)) out.push({ archivo: p, linea: i + 1, texto: linea.trim() });
    });
  }
  return out;
}

/* ── BRAZO ① · LOS SITIOS SIGUEN AHÍ ───────────────────────────────────
 *  El ancla de cada premisa es el LITERAL que ya está escrito en el
 *  código (el porqué, en el header del registro). Si el literal
 *  desapareció, este guard estaba midiendo el aire: se dice, en rojo.
 *  «Se curó» y «se movió» se ven igual desde acá — y por eso NO se
 *  adivina cuál fue: se pide que alguien mire. */
export function verificarSitios(premisas, leer) {
  const fallos = [];
  for (const pr of premisas) {
    for (const s of pr.sitios) {
      let src;
      try { src = leer(s.archivo); } catch {
        fallos.push(`${pr.id} · el archivo ${s.archivo} NO EXISTE — el ancla de esta premisa se perdió.`);
        continue;
      }
      if (!src.includes(s.literal)) {
        fallos.push(
          `${pr.id} · el literal «${s.literal}» ya no está en ${s.archivo} — o la premisa se curó, ` +
            `o se movió. El guard estaba vigilando un texto que no existe: vení a mirar y actualizá el registro.`,
        );
      }
    }
  }
  return fallos;
}

/* ── BRAZO ② · TODO «INERTE» ESTÁ CLASIFICADO ──────────────────────────
 *  La cura de la dirección A: no alcanza con vigilar las premisas que
 *  alguien se acordó de registrar. Toda ocurrencia tiene que estar
 *  contada — registrada (premisa) o eximida (otra acepción, con razón).
 *  La que no esté en ninguna de las dos es la próxima D-651. */
export function verificarClasificacion(ocurrencias, premisas, exentas) {
  const conocidos = [
    ...premisas.flatMap((p) => p.sitios.map((s) => ({ ...s, clase: p.id }))),
    ...exentas.map((e) => ({ ...e, clase: 'exenta' })),
  ];
  const fallos = [];
  const clasificadas = [];
  for (const o of ocurrencias) {
    const m = conocidos.find((c) => c.archivo === o.archivo && o.texto.includes(c.literal));
    if (m) clasificadas.push({ ...o, clase: m.clase });
    else
      fallos.push(
        `SIN CLASIFICAR · ${o.archivo}:${o.linea} — «${o.texto.slice(0, 72)}»\n` +
          `      Si es una PREMISA (una rama que hoy no se ejecuta), va al registro CON SU CONSULTA.\n` +
          `      Si es la otra acepción (Ley 13 sin movimiento, sin interacción), va a EXENTAS con su razón.`,
      );
  }
  return { fallos, clasificadas };
}

/* ── BRAZO ③ · LA CONSULTA ─────────────────────────────────────────────
 *  Es el brazo por el que existe todo esto: la premisa se MIDE.
 *  Tres salidas, y ninguna es «probablemente bien»:
 *    inerte    → la premisa se sostiene (n = 0)
 *    caducada  → ROJO, y nombra qué se volvió alcanzable
 *    sin-medir → ROJO por L-197 (jamás verde) */
export function evaluarPremisa(premisa, { correr, leer, exec }) {
  const { sql, medir } = premisa.inerteMientras;
  let n, detalle = null;

  // ── EL ALCANCE SE MIDE ANTES QUE NADA (orden de mesa, S88).
  //    Y si NO SE PUEDE MEDIR, la premisa entera sale «sin-medir» — no es
  //    exceso de celo: si no puedo decir cuántas filas dejé afuera, el
  //    número que reporte es un número que no puedo defender, y ése es
  //    exactamente el que alguien va a copiar al acta.
  let excluidas = null;
  if (premisa.alcance?.sql) {
    try {
      excluidas = correr(premisa.alcance.sql)?.[0]?.n;
    } catch (e) {
      return { estado: 'sin-medir', porque: `no se pudo medir el ALCANCE: ${String(e.message ?? e).slice(0, 140)}` };
    }
    if (typeof excluidas !== 'number')
      return { estado: 'sin-medir', porque: 'la consulta de ALCANCE no devolvió una columna «n» numérica' };
  }
  const con = (r) => ({ ...r, excluidas });

  // DOS FUENTES, UN INVARIANTE (el porqué, en el header del registro):
  // `sql` mide el MOTOR · `medir` mide EL OBJETO. Las dos devuelven un
  // `n`, y en las dos `inerte ⟺ n === 0`.
  if (medir) {
    try {
      const r = medir({ dbQuery: correr, leer, exec });
      n = r?.n;
      detalle = r?.detalle ?? null;
    } catch (e) {
      return { estado: 'sin-medir', porque: String(e.message ?? e).slice(0, 220) };
    }
    if (typeof n !== 'number')
      return { estado: 'sin-medir', porque: `«medir» no devolvió un «n» numérico (devolvió ${JSON.stringify(n)?.slice(0, 120)})` };
    return n === 0 ? con({ estado: 'inerte', n }) : con({ estado: 'caducada', n, detalle });
  }

  let filas;
  try { filas = correr(sql); } catch (e) {
    return { estado: 'sin-medir', porque: String(e.message ?? e).slice(0, 180) };
  }
  n = filas?.[0]?.n;
  if (typeof n !== 'number')
    return { estado: 'sin-medir', porque: `la consulta no devolvió una columna «n» numérica (devolvió ${JSON.stringify(filas)?.slice(0, 120)})` };
  if (n === 0) return con({ estado: 'inerte', n });
  if (premisa.inerteMientras.detalle) {
    try { detalle = correr(premisa.inerteMientras.detalle); } catch { detalle = null; }
  }
  return con({ estado: 'caducada', n, detalle });
}

/* ── LA AUTO-PRUEBA (L-192 · L-199) ────────────────────────────────────
 *  Cada modo de falla recibe su fixture sintético y TIENE que salir rojo.
 *  Si alguno no puede, el guard entero se declara decorativo y falla —
 *  antes de mirar una sola línea real. */
function autoPrueba() {
  const rotos = [];
  const debeFallar = (que, cond) => { if (!cond) rotos.push(que); };

  const premisaFalsa = {
    id: 'FIXTURE', sitios: [{ archivo: '(fixture)/X.tsx', literal: 'INERTE hoy: solo el titular llega' }],
    inerteMientras: { sql: 'select 1', detalle: null },
  };

  // ① el literal desapareció del archivo
  debeFallar('①·literal ausente', verificarSitios([premisaFalsa], () => 'archivo sin el texto').length > 0);
  // ① el archivo entero desapareció
  debeFallar('①·archivo ausente', verificarSitios([premisaFalsa], () => { throw new Error('ENOENT'); }).length > 0);
  // ② una ocurrencia que no está ni registrada ni eximida
  debeFallar(
    '②·sin clasificar',
    verificarClasificacion([{ archivo: 'a.tsx', linea: 1, texto: '// esta rama es inerte' }], [], []).fallos.length > 0,
  );
  // ② y su contra-caso: lo clasificado NO debe gritar (dirección B —
  //    un guard que grita donde no pasa nada se desactiva solo)
  debeFallar(
    '②·contra-caso: lo eximido no grita',
    verificarClasificacion(
      [{ archivo: 'a.tsx', linea: 1, texto: '* Completamente INERTE (Ley 13)' }],
      [], [{ archivo: 'a.tsx', literal: 'Completamente INERTE', razon: 'movimiento' }],
    ).fallos.length === 0,
  );
  const conSql = (correr) => evaluarPremisa(premisaFalsa, { correr, leer: () => '' });
  // ③ la premisa caducó
  debeFallar('③·premisa caducada', conSql(() => [{ n: 3 }]).estado === 'caducada');
  // ③ la consulta explota → sin-medir, JAMÁS inerte (L-197)
  debeFallar('③·error → sin-medir', conSql(() => { throw new Error('sin red'); }).estado === 'sin-medir');
  // ③ la consulta devuelve basura → sin-medir, JAMÁS inerte
  debeFallar('③·forma inesperada → sin-medir', conSql(() => [{ otra: 0 }]).estado === 'sin-medir');
  // ③ contra-caso: n=0 es inerte de verdad (si esto fallara, el guard
  //    sería rojo permanente, que es la otra forma de ser decorativo)
  debeFallar('③·contra-caso: n=0 es inerte', conSql(() => [{ n: 0 }]).estado === 'inerte');

  // ③bis LA RAMA `medir` (S88 — el ensanche de P3). Mismos cuatro modos:
  //      si esta rama no se auto-probara, el ensanche habría entrado sin
  //      la red que el resto del guard sí tiene.
  const conMedir = (fn) => evaluarPremisa(
    { ...premisaFalsa, inerteMientras: { medir: fn } },
    { correr: () => [{ n: 0 }], leer: () => 'texto cualquiera' },
  );
  debeFallar('③bis·medir caducada', conMedir(() => ({ n: 19 })).estado === 'caducada');
  debeFallar('③bis·medir lanza → sin-medir', conMedir(() => { throw new Error('no pude leer el canon'); }).estado === 'sin-medir');
  debeFallar('③bis·medir sin n → sin-medir', conMedir(() => ({ detalle: [] })).estado === 'sin-medir');
  debeFallar('③bis·contra-caso: n=0 es inerte', conMedir(() => ({ n: 0 })).estado === 'inerte');

  // ③ter EL ALCANCE (S88): si no se puede medir QUÉ SE DEJÓ AFUERA, el
  //      número reportado no se puede defender ⇒ sin-medir, jamás un
  //      verde ni un rojo con un alcance inventado.
  // ③quater EL EXTRACTOR DE P5 (S88) — cada brazo con su fixture, y las
  //         dos direcciones: que ENCUENTRE lo que consulta (A) y que NO
  //         invente pares desde strings dinámicos (B).
  {
    const src = `
      const r = await cliente.from('user_notificacion_prefs').select('tipo, habilitada').eq('user_id', uid);
      await cliente.from('user_notificacion_prefs').upsert(x, { onConflict: 'user_id,tipo' });
      await cliente.rpc('registrar_primer_ingreso');
      const s = await cliente.from('otra_tabla').select(\`\${cols}\`).select('*');
      await cliente.from('familia_miembro').select('id, familia_id, familia:familia_id (id, nombre, tipo)').eq('user_id', uid);
    `;
    const ex = extraerConsultasDeFuente(src);
    const prefs = ex.pares.find((p2) => p2.tabla === 'user_notificacion_prefs');
    debeFallar('③quater·extrae el caso fundante', !!prefs && ['tipo', 'habilitada', 'user_id'].every((c) => prefs.cols.includes(c)));
    debeFallar('③quater·extrae la rpc', ex.rpcs.includes('registrar_primer_ingreso'));
    const otra = ex.pares.find((p2) => p2.tabla === 'otra_tabla');
    debeFallar('③quater·contra-caso B: * y dinámicos no fabrican pares', !!otra && otra.cols.length === 0 && ex.dinamicas >= 1);
    // EL CASO ASESINO de la primera corrida real: el embed multi-columna.
    // `nombre`/`tipo` viven DENTRO de `familia:familia_id (…)` y NO son
    // columnas de familia_miembro — atribuirlas fue la dirección B viva.
    const fm = ex.pares.find((p2) => p2.tabla === 'familia_miembro');
    debeFallar(
      '③quater·contra-caso B: columnas de un embed no se atribuyen a la tabla externa',
      !!fm && fm.cols.includes('id') && fm.cols.includes('user_id') && !fm.cols.includes('nombre') && !fm.cols.includes('tipo') && ex.embedsFuera >= 1,
    );
  }
  // ③quater·exec — un medir cuyo exec lanza sale sin-medir, jamás verde
  debeFallar(
    '③quater·exec lanza → sin-medir',
    evaluarPremisa(
      { ...premisaFalsa, inerteMientras: { medir: ({ exec }) => ({ n: JSON.parse(exec('eas whoami')).n }) } },
      { correr: () => [{ n: 0 }], leer: () => '', exec: () => { throw new Error('EAS caído'); } },
    ).estado === 'sin-medir',
  );

  //     ⚠️ EL FIXTURE DISCRIMINA POR CONSULTA, y hay que hacerlo así: si
  //     el `correr` fallara para TODAS, la premisa saldría «sin-medir»
  //     por el camino del `sql` y el fixture pasaría verde sin haber
  //     probado NADA del alcance. Acá solo revienta la del alcance, y
  //     la principal contesta bien — así el rojo solo puede venir del
  //     brazo que se está probando.
  const conAlcance = {
    ...premisaFalsa,
    inerteMientras: { sql: 'SQL_PRINCIPAL', detalle: null },
    alcance: { texto: 'fixture', sql: 'SQL_ALCANCE' },
  };
  const salvoAlcance = (respuestaAlcance) => (q) => {
    if (q === 'SQL_ALCANCE') return respuestaAlcance();
    return [{ n: 0 }]; // la principal SIEMPRE contesta bien
  };
  debeFallar(
    '③ter·alcance no medible → sin-medir',
    evaluarPremisa(conAlcance, { correr: salvoAlcance(() => { throw new Error('sin red'); }), leer: () => '' }).estado === 'sin-medir',
  );
  debeFallar(
    '③ter·alcance sin n → sin-medir',
    evaluarPremisa(conAlcance, { correr: salvoAlcance(() => [{ otra: 1 }]), leer: () => '' }).estado === 'sin-medir',
  );
  // contra-caso: con alcance medible, la premisa se evalúa normal Y lo
  // reporta (si esto fallara, el alcance sería un freno permanente)
  {
    const r = evaluarPremisa(conAlcance, { correr: salvoAlcance(() => [{ n: 2 }]), leer: () => '' });
    debeFallar('③ter·contra-caso: alcance medido no frena', r.estado === 'inerte' && r.excluidas === 2);
  }

  return rotos;
}

/* ── CORRIDA ───────────────────────────────────────────────────────── */

ancla();

const rotos = autoPrueba();
if (rotos.length > 0) {
  console.error('\n✗ AUTO-PRUEBA ROTA — el guard no puede producir rojo en:');
  for (const r of rotos) console.error(`   · ${r}`);
  console.error('\n  Un guard que no falla cuando debe es decorativo (L-192). Se declara inválido.');
  console.error('\nVERDICTO CENSO: INVÁLIDO');
  process.exit(1);
}

const archivos = RAICES.flatMap(archivosDe);
const leer = (p) => readFileSync(p, 'utf8');
const ocurrencias = ocurrenciasDeInerte(archivos, leer);

// EL ANCLA DEL CORPUS — el silencio de un guard de ausencia significa «no
// hay violaciones» SOLO si hubo algo que mirar (L-192, tercera capa).
console.log(
  `alcance · ${archivos.length} archivo(s) .ts/.tsx en ${RAICES.join(' · ')} · ` +
    `${ocurrencias.length} ocurrencia(s) de «inerte» · ${PREMISAS.length} premisa(s) registrada(s) · ` +
    `${PREMISAS.reduce((a, p) => a + p.sitios.length, 0)} sitio(s) anclado(s)\n`,
);
if (ocurrencias.length < PISO_OCURRENCIAS) {
  console.error(
    `✗ CORPUS: ${ocurrencias.length} ocurrencia(s) contra un piso de ${PISO_OCURRENCIAS}. ` +
      `El barrido se derrumbó — el verde de este guard significaría «no miré», no «no hay».`,
  );
  console.error('\nVERDICTO CENSO: INVÁLIDO');
  process.exit(1);
}

let fallos = 0;
const rojo = (t) => { console.error(`✗ ${t}`); fallos++; };

// ① sitios
const fallosSitio = verificarSitios(PREMISAS, leer);
if (fallosSitio.length === 0) console.log('✓ ① los sitios anclados siguen donde el registro dice');
else for (const f of fallosSitio) rojo(`① ${f}`);

// ② clasificación
const { fallos: fallosClase, clasificadas } = verificarClasificacion(ocurrencias, PREMISAS, EXENTAS);
if (fallosClase.length === 0)
  console.log(`✓ ② las ${clasificadas.length} ocurrencias están clasificadas (${PREMISAS.map((p) => p.id).join(' · ')} · exentas)`);
else for (const f of fallosClase) rojo(`② ${f}`);

// ③ el motor
console.log('');
if (SIN_MOTOR) {
  console.log('⚠️  --sin-motor: LAS PREMISAS NO SE MIDIERON. Este guard existe para medirlas;');
  console.log('    sin el brazo ③ no dice nada sobre si caducaron. Quien lo use, lo declara');
  console.log('    en el mismo mensaje del ancla.');
} else {
  for (const p of PREMISAS) {
    const r = evaluarPremisa(p, {
      correr: (sql) => dbQuery(sql),
      leer,
      // El ensanche S88 (aprobado por mesa, para P5): git y eas-cli.
      // ⚠️ eas-cli SIEMPRE con cwd en apps/<app>/ — desde la raíz
      // scaffoldea un app.json stub (repro S74/S85, CLAUDE.md raíz).
      exec: (cmd, opts = {}) => execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...opts }),
    });
    const cabecera = `${p.id} (${p.ficha}) «${p.titulo}»`;
    // EL ALCANCE SE IMPRIME EN VERDE Y EN ROJO. Un guard declara qué dejó
    // afuera SIEMPRE — si solo lo dijera al fallar, el verde seguiría
    // siendo un número sin defensa.
    const lineaAlcance = p.alcance
      ? `\n      alcance · ${p.alcance.texto}${typeof r.excluidas === 'number' ? ` — HOY excluye ${r.excluidas} fila(s)` : ''}`
      : '';
    if (r.estado === 'inerte') {
      console.log(`✓ ③ ${cabecera} — SIGUE INERTE (${p.inerteMientras.explicacion}: 0)${lineaAlcance}`);
    } else if (r.estado === 'sin-medir') {
      rojo(
        `③ ${cabecera} — NO SE PUDO MEDIR: ${r.porque}\n` +
          `      Por L-197 esto es ROJO, jamás verde: un fallo degrada a AUSENCIA, nunca a un\n` +
          `      valor que alguien vaya a usar como cierto. Si el motor está caído y hay que\n` +
          `      seguir: --sin-motor, y se declara.`,
      );
    } else {
      rojo(
        `③ ${cabecera} — LA PREMISA CADUCÓ: ${r.n} (${p.inerteMientras.explicacion})${lineaAlcance}\n` +
          `      QUÉ SE VOLVIÓ ALCANZABLE: ${p.siCaduca}` +
          (r.detalle ? `\n      dónde: ${r.detalle.map((d) => JSON.stringify(d)).join('  ')}` : '') +
          `\n      LOS SITIOS QUE LO DECLARABAN IMPOSIBLE:\n` +
          p.sitios.map((s) => `        · ${s.archivo} «${s.literal}» → ${s.consecuencia}`).join('\n'),
      );
    }
  }
}

console.log(fallos === 0 ? '\nVERDICTO CENSO: TODO VERDE' : `\nVERDICTO CENSO: ${fallos} EN ROJO`);
process.exit(fallos === 0 ? 0 : 1);
