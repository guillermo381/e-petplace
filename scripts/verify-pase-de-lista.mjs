#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * verify:pase-de-lista — S114-E · un gate que no pudo mirar no está en verde
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **EL DEFECTO QUE CURA.** Un gate del pre-commit que sale **2** («no pude
 * medir») imprime una línea, **no frena**, y el commit sigue. Esa línea aparece
 * en la terminal de quien commiteó — *una pista cualquiera* — y de ahí, si
 * llega a algún lado, llega **al parte de otra pista**. ⇒ **el estado «mudo»
 * no tiene superficie ni dueño**, y un gate mudo que corre en cada commit
 * **tiene exactamente el mismo aspecto que uno sano**: silencio.
 *
 * *Un gate que no pudo mirar no es un gate en verde.* Este pase de lista le da
 * a ese estado un lugar donde verse y un nombre que responda.
 *
 * ── DOS ESTADOS DISTINTOS, Y EL SEGUNDO ES PEOR ──────────────────────────
 * · **MUDO** — corrió y no pudo medir (exit 2). Se lee como salud.
 * · **AUSENTE DEL HOOK** — el canon dice que está cableado y **el hook vivo no
 *   lo tiene**. *Peor que mudo: no corre, y todos creen que sí.*
 *
 * ── DE DÓNDE SALE CADA COSA (y qué se deriva vs qué se declara) ──────────
 * · **El conjunto se MIDE del hook VIVO**, resuelto por `git config
 *   core.hooksPath` — **no del `.githooks` de este worktree**. `L-490`: esa
 *   ruta es ABSOLUTA al árbol principal y no obedece a ninguna rama, así que
 *   el hook que corre para todos es el que tenga en disco quien conduce `main`.
 *   *Leer la copia versionada mediría otra cosa.*
 * · **El dueño se DERIVA donde el hook lo declara** (`── verify:x ── S112-D,
 *   cableado por A`) y **se declara en `DUENOS` donde el hook no lo dice**. La
 *   salida marca cuál es cuál: *un dueño derivado envejece con el objeto; uno
 *   escrito a mano envejece solo.*
 *
 * ── ANTI-ROT: LA TABLA NO PUEDE QUEDARSE ATRÁS DEL HOOK ─────────────────
 * Si el hook corre un gate que este archivo no conoce, **sale 2**. *Una lista
 * de control que no cubre todo lo que hay no es un control: es una muestra.*
 *
 * ── ¿PERDONA ALGO QUE EL PRODUCTO NO PERDONA? ────────────────────────────
 * **Sí, dos cosas:** ① corre cada gate **una vez y desde este árbol** — un gate
 * que sea mudo sólo en OTRO worktree (por una fuente que allá falta) sale verde
 * acá. *Ésa es justamente la clase que originó este arnés*, así que se dice
 * fuerte: **este pase de lista prueba que el gate PUEDE medir, no que mida en
 * la máquina de todos.** ② No mide el hook `prepare-commit-msg`.
 *
 * ⚠️ **No va al hook**: corre otros gates, y un pase de lista adentro del
 * pre-commit sería recursivo y caro. Va al paso ⓪ y al cierre.
 *
 * Salidas: 0 verde · 1 hay mudos o ausentes · 2 no concluyente.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Dueño declarado, SÓLO para los gates cuyo hook no lo dice. */
const DUENOS = {
  'verify-diseno.mjs':           { dueno: 'B', nota: 'design system' },
  'verify-jornada-completa.mjs': { dueno: 'A', nota: 'S109, al pre-commit' },
  'verify-sin-byte-nul.mjs':     { dueno: 'A', nota: 'higiene de árbol' },
};

/** Lo que el canon afirma cableado en el hook. Si el hook no lo tiene: ROJO. */
const CANON_DICE_CABLEADO = [
  { script: '_censo-hoisting-nativo.mjs', gate: 'verify:hoisting-nativo', dueno: 'A' },
  { script: 'verify-ref-antes-de-uso.mjs', gate: 'verify:ref-antes-de-uso', dueno: 'A' },
  { script: 'verify-rutas-de-aviso.mjs',  gate: 'verify:rutas-de-aviso',  dueno: 'D' },
  { script: 'verify-vio-todo.mjs',        gate: 'verify:vio-todo',        dueno: 'B' },
  { script: 'verify-fila-memoizada.mjs',  gate: 'verify:fila-memoizada',  dueno: 'B' },
];

// ── ① EL HOOK VIVO ───────────────────────────────────────────────────────
let hookTexto, hookRuta;
try {
  const base = execFileSync('git', ['config', 'core.hooksPath'], { encoding: 'utf8' }).trim();
  hookRuta = join(base, 'pre-commit');
  if (!existsSync(hookRuta)) throw new Error(`no existe ${hookRuta}`);
  hookTexto = readFileSync(hookRuta, 'utf8');
} catch (e) {
  console.error('🟠 NO CONCLUYENTE · no se pudo leer el hook vivo.');
  console.error(`   ${String(e.message).slice(0, 200)}`);
  console.error('   Sin el hook no hay conjunto que pasar lista: el gate NO dice verde.');
  process.exit(2);
}

const enElHook = [...new Set(
  (hookTexto.match(/scripts\/(?:verify-|_censo-)[a-z0-9-]+\.mjs/g) ?? []).map((m) => m.split('/')[1]),
)].sort();

if (enElHook.length === 0) {
  console.error('🟠 NO CONCLUYENTE · el hook vivo no invoca ningún gate reconocible.');
  console.error(`   ${hookRuta}`);
  process.exit(2);
}

// Dueño derivado de las cabeceras del hook: "── verify:x ── S112-D, cableado por A"
const derivado = new Map();
for (const l of hookTexto.split('\n')) {
  const m = l.match(/──\s*(verify:[a-z0-9-]+|[a-z0-9-]+)\s*[─(]+.*?S\d+-([A-Z])/);
  if (m) derivado.set(m[1].replace(/^verify:/, ''), m[2]);
}
const duenoDe = (script) => {
  const corto = script.replace(/^(verify-|_censo-)/, '').replace(/\.mjs$/, '');
  if (derivado.has(corto)) return { dueno: derivado.get(corto), fuente: 'derivado del hook' };
  if (DUENOS[script]) return { dueno: DUENOS[script].dueno, fuente: `declarado · ${DUENOS[script].nota}` };
  return null;
};

// ── ② ANTI-ROT ───────────────────────────────────────────────────────────
const sinDueno = enElHook.filter((s) => !duenoDe(s));
if (sinDueno.length) {
  console.error('🟠 NO CONCLUYENTE · el hook corre gates que este pase de lista no conoce:');
  for (const s of sinDueno) console.error(`   · ${s}`);
  console.error('   Una lista de control que no cubre todo lo que hay no es un control:');
  console.error('   es una muestra. Agregalos a DUENOS y volvé a correr.');
  process.exit(2);
}

// ── ③ PASE DE LISTA ──────────────────────────────────────────────────────
console.log('verify:pase-de-lista · los gates del hook, uno por uno');
console.log(`  hook vivo: ${hookRuta}`);
console.log(`  (L-490: ruta ABSOLUTA al árbol principal — no es el .githooks de este worktree)\n`);

const mudos = [], rojos = [];
console.log('  estado   gate                             dueño   fuente del dueño');
for (const script of enElHook) {
  const d = duenoDe(script);
  const r = spawnSync('node', [`scripts/${script}`], { encoding: 'utf8' });
  const cod = r.status;
  const est = cod === 0 ? '🟢 verde ' : cod === 1 ? '🔴 ROJO  ' : `🟠 MUDO(${cod})`;
  console.log(`  ${est} ${script.replace(/\.mjs$/, '').padEnd(32)} ${d.dueno.padEnd(7)} ${d.fuente}`);
  if (cod === 2) {
    const razon = `${r.stdout}${r.stderr}`.split('\n')
      .find((l) => /NO CONCLUYENTE|no se pudo|falta|ausente/i.test(l))?.trim().slice(0, 150) ?? '(sin razón impresa)';
    mudos.push({ script, dueno: d.dueno, razon });
  } else if (cod !== 0) {
    rojos.push({ script, dueno: d.dueno });
  }
}

// ── ④ LO QUE EL CANON DICE CABLEADO Y EL HOOK NO TIENE ───────────────────
const ausentes = CANON_DICE_CABLEADO.filter((c) => !enElHook.includes(c.script));
if (ausentes.length) {
  console.log('\n  ── EL CANON LOS DA POR CABLEADOS Y EL HOOK VIVO NO LOS TIENE ──');
  for (const a of ausentes) {
    const hay = existsSync(`scripts/${a.script}`);
    console.log(`   🔴 ${a.gate.padEnd(30)} dueño ${a.dueno} · el script ${hay ? 'EXISTE' : 'no existe'} y no corre en ningún commit`);
  }
}

// ── VEREDICTO ────────────────────────────────────────────────────────────
console.log('');
if (mudos.length) {
  console.error('🟠 GATES MUDOS — corrieron y NO pudieron medir:');
  for (const m of mudos) {
    console.error(`   · ${m.script}  ·  DUEÑO: ${m.dueno}`);
    console.error(`     ${m.razon}`);
  }
  console.error('   Un gate mudo en el hook se ve igual que uno sano: silencio.');
}
if (ausentes.length) {
  console.error(`\n🔴 ${ausentes.length} gate(s) que el canon da por cableados NO están en el hook vivo:`);
  for (const a of ausentes) console.error(`   · ${a.gate} · DUEÑO: ${a.dueno}`);
  console.error('   Peor que mudo: no corren, y todos creen que sí.');
}
if (rojos.length) {
  console.error(`\n🔴 ${rojos.length} gate(s) en rojo (eso SÍ frena commits, y está bien):`);
  for (const r of rojos) console.error(`   · ${r.script} · dueño ${r.dueno}`);
}
if (mudos.length || ausentes.length) process.exit(1);
if (rojos.length) {
  console.log('🟢 ningún gate mudo ni ausente. Los rojos de arriba son gates funcionando.');
  process.exit(0);
}
console.log(`🟢 VERDE · los ${enElHook.length} gates del hook corrieron y pudieron medir.`);
