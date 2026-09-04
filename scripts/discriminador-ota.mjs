#!/usr/bin/env node
/**
 * S113-E · `D-1028` — EL DISCRIMINADOR DE OTA VE LA RAÍZ, Y NOMBRA LA DEPENDENCIA.
 *
 * ═══ EL DEFECTO QUE CURA ═══════════════════════════════════════════════════
 * La pregunta *«¿este candidato tocó dependencias?»* se contestaba a mano con:
 *
 *     git diff --name-only <ancla>..HEAD -- '**' + '/package.json' 'pnpm-lock.yaml'
 *
 * y **`**` + `/package.json` NO matchea `package.json` del tope** — matchea los
 * de `apps/*` y `packages/*` y nada más. Reproducido en este mismo repo sobre
 * `441015cc..f1ec3b9a`: el glob solo devuelve **1** archivo; agregando
 * `'package.json'` devuelve **2**. *La raíz era invisible.*
 *
 * 🔴 **Su modo de falla es un `0`, y un `0` se lee como «no tocó nada».** El día
 * que alguien agregue una dependencia en la raíz, el discriminador declara el
 * candidato OTA-elegible y **el bundle pide un módulo que el binario no tiene**
 * — que es exactamente `D-1017`, el crash del prestador.
 *
 * ═══ POR QUÉ ES UN SCRIPT Y NO UNA LÍNEA CORREGIDA ════════════════════════
 * La ficha dice que la cura es agregar `'package.json'` al pathspec, y es
 * cierto — pero deja el instrumento contestando **la pregunta equivocada**.
 * Contar archivos responde *«¿se tocó algún package.json?»*; lo que decide un
 * OTA es *«¿cambió alguna DEPENDENCIA?»*. En el lote que parió la ficha, el
 * único cambio del `package.json` raíz era la línea de un **script**, no una
 * dependencia — y el veredicto se sostuvo **porque alguien abrió el diff a
 * mano**, no porque el instrumento lo midiera.
 *
 * ⇒ Este script compara los **mapas de dependencias** de todos los
 * `package.json` entre el ancla y HEAD, y **nombra el paquete**. Un cambio de
 * `scripts`, de `name` o de cualquier otro campo se declara aparte, como lo
 * que es: un archivo tocado que no mueve el binario.
 *
 * ═══ RUNTIME vs DEV, que es lo que decide ══════════════════════════════════
 * · **runtime** (`dependencies`, `optionalDependencies`, `peerDependencies`) —
 *   viajan al grafo del bundler. Una alta acá puede exigir **build nativa**.
 * · **dev** (`devDependencies`) — no viajan. Se reportan, **no bloquean**.
 * *Tratarlas igual haría que agregar un linter pareciera exigir un binario.*
 *
 * ⚠️ **Lo que este script NO dice:** que la dependencia nueva tenga código
 * nativo. Dice que **cambió** y quién es, para que la pregunta siguiente —
 * ¿tiene módulo nativo?— la haga alguien mirando el paquete. *Un discriminador
 * que adivinara eso sería el que hoy miente en la otra dirección.*
 *
 * ═══ CONTROL (`--control`) ═════════════════════════════════════════════════
 *   POSITIVO  una dependencia plantada en el `package.json` de la RAÍZ ⇒ ROJO
 *             que la **nombra** (es el caso exacto que el glob no veía)
 *   NEGATIVO  se retira ⇒ vuelve el veredicto del árbol
 *   GLOB      deja escrito, medido, cuántos archivos ve el pathspec viejo y
 *             cuántos el corregido — el rojo del defecto original
 *
 * Uso:  node scripts/discriminador-ota.mjs <ancla> [--control]
 * Salida: 0 sin cambios de runtime · 1 los hay · 2 no concluyente.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const di = (s) => process.stdout.write(s + '\n');
const RUNTIME = ['dependencies', 'optionalDependencies', 'peerDependencies'];
const DEV = ['devDependencies'];

const git = (args) => execFileSync('git', args, { encoding: 'utf8' });

/** Todos los `package.json` versionados en una ref (sin node_modules). */
function listar(ref) {
  return git(['ls-tree', '-r', '--name-only', ref === WORKTREE ? 'HEAD' : ref])
    .split('\n')
    .filter((f) => f === 'package.json' || f.endsWith('/package.json'))
    .filter((f) => !f.includes('node_modules/'));
}

/**
 * `ref` puede ser un commit o el centinela `WORKTREE`, que lee del disco. Sin
 * eso, el control tendría que hacer su propia cuenta a mano — y un control que
 * no usa el mismo comparador que el gate no controla al gate.
 */
const WORKTREE = 'WORKTREE';
function leer(ref, archivo) {
  try {
    return JSON.parse(ref === WORKTREE ? readFileSync(archivo, 'utf8') : git(['show', `${ref}:${archivo}`]));
  } catch { return null; }
}

/** Compara los mapas de dependencias de dos refs. */
function comparar(ancla, cabeza) {
  const archivos = new Set([...listar(ancla), ...listar(cabeza)]);
  const runtime = [];
  const dev = [];
  const otros = [];

  for (const f of archivos) {
    const a = leer(ancla, f);
    const b = leer(cabeza, f);
    if (a === null && b === null) continue;

    for (const [grupos, bolsa] of [[RUNTIME, runtime], [DEV, dev]]) {
      for (const g of grupos) {
        const ma = (a?.[g]) ?? {};
        const mb = (b?.[g]) ?? {};
        for (const k of new Set([...Object.keys(ma), ...Object.keys(mb)])) {
          if (ma[k] === mb[k]) continue;
          bolsa.push({
            archivo: f, grupo: g, paquete: k,
            antes: ma[k] ?? null, ahora: mb[k] ?? null,
            que: ma[k] === undefined ? 'ALTA' : mb[k] === undefined ? 'BAJA' : 'CAMBIO',
          });
        }
      }
    }

    // El archivo cambió pero ningún mapa de dependencias se movió.
    const soloDeps = (o) => JSON.stringify([...RUNTIME, ...DEV].map((g) => o?.[g] ?? null));
    const cambioArchivo = JSON.stringify(a) !== JSON.stringify(b);
    const cambioDeps = soloDeps(a) !== soloDeps(b);
    if (cambioArchivo && !cambioDeps) otros.push(f);
  }
  return { runtime, dev, otros, archivos: archivos.size };
}

function fila(c) {
  const v = c.que === 'ALTA' ? `→ ${c.ahora}`
    : c.que === 'BAJA' ? `${c.antes} →`
    : `${c.antes} → ${c.ahora}`;
  return `   ${c.que.padEnd(6)} ${c.paquete.padEnd(34)} ${v.padEnd(28)} ${c.archivo} · ${c.grupo}`;
}

// ═══ CONTROL ══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  const ancla = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'HEAD~1';
  let rojo = false;

  // ── El rojo del defecto ORIGINAL, medido y dejado por escrito ───────────
  const viejo = git(['diff', '--name-only', `${ancla}..HEAD`, '--', '**/package.json'])
    .split('\n').filter(Boolean).length;
  const nuevo = git(['diff', '--name-only', `${ancla}..HEAD`, '--', '**/package.json', 'package.json'])
    .split('\n').filter(Boolean).length;
  di(`   GLOB      pathspec viejo ve ${viejo} archivo(s) · con 'package.json' ve ${nuevo}` +
     (nuevo > viejo ? '  ← la raíz era invisible' : '  ← este ancla no toca la raíz'));

  const original = readFileSync('package.json', 'utf8');
  try {
    // ① NEGATIVO primero acá, y a propósito: HEAD contra el árbol SIN tocar
    //    tiene que dar cero. Sin esto, el positivo podría estar saliendo rojo
    //    por cambios que ya estaban.
    const base = comparar('HEAD', WORKTREE);
    const cero = base.runtime.length === 0 && base.dev.length === 0;
    di(`${cero ? '✅' : '🔴'} NEGATIVO  árbol sin tocar ⇒ ${base.runtime.length} runtime · ${base.dev.length} dev`);
    if (!cero) rojo = true;

    // ② POSITIVO — una dependencia de RUNTIME plantada en la RAÍZ: el caso
    //    exacto que el glob no veía.
    const j = JSON.parse(original);
    j.dependencies = { ...(j.dependencies ?? {}), 'sonda-nativa-s113e': '^1.0.0' };
    writeFileSync('package.json', JSON.stringify(j, null, 2) + '\n');

    const r = comparar('HEAD', WORKTREE);
    const c = r.runtime.find((x) => x.paquete === 'sonda-nativa-s113e');
    const bien = c && c.archivo === 'package.json' && c.que === 'ALTA';
    di(`${bien ? '✅' : '🔴'} POSITIVO  dependencia plantada en la RAÍZ ⇒ ` +
       (c ? `la nombra: ${c.paquete} (${c.que}, ${c.archivo}, ${c.grupo})` : 'NO LA VIO'));
    if (!bien) rojo = true;

    // ③ Y no la confunde con una devDependency: la clase importa, porque una
    //    dev no bloquea el OTA y una de runtime sí.
    const j2 = JSON.parse(original);
    j2.devDependencies = { ...(j2.devDependencies ?? {}), 'sonda-dev-s113e': '^1.0.0' };
    writeFileSync('package.json', JSON.stringify(j2, null, 2) + '\n');
    const r2 = comparar('HEAD', WORKTREE);
    const enDev = r2.dev.some((x) => x.paquete === 'sonda-dev-s113e');
    const noEnRuntime = !r2.runtime.some((x) => x.paquete === 'sonda-dev-s113e');
    di(`${enDev && noEnRuntime ? '✅' : '🔴'} CLASE     una devDependency plantada ⇒ ` +
       `${enDev ? 'va a dev' : 'NO la vio'}${noEnRuntime ? ' y no a runtime' : ' pero la contó como RUNTIME'}`);
    if (!enDev || !noEnRuntime) rojo = true;
  } finally {
    writeFileSync('package.json', original);
  }

  // ④ El árbol vuelve como estaba.
  const fin = comparar('HEAD', WORKTREE);
  const limpio = fin.runtime.length === 0 && fin.dev.length === 0;
  di(`${limpio ? '✅' : '🔴'} LIMPIEZA  se retiran las sondas ⇒ ${limpio ? 'el árbol quedó como estaba' : 'QUEDÓ RESIDUO'}`);
  if (!limpio) rojo = true;

  di(rojo ? '\n🔴 EL DISCRIMINADOR NO MIDE.' : '\n✅ ve la raíz, nombra el paquete y distingue runtime de dev.');
  process.exit(rojo ? 1 : 0);
}

// ═══ CORRIDA NORMAL ═══════════════════════════════════════════════════════
const ancla = process.argv[2];
if (!ancla) {
  di('🔴 NO CONCLUYENTE: falta el ancla.  uso: node scripts/discriminador-ota.mjs <ancla>');
  process.exit(2);
}
try { git(['rev-parse', '--verify', `${ancla}^{commit}`]); }
catch { di(`🔴 NO CONCLUYENTE: "${ancla}" no es un commit de este repo.`); process.exit(2); }

const { runtime, dev, otros, archivos } = comparar(ancla, 'HEAD');
di(`discriminador OTA · ${ancla}..HEAD · ${archivos} package.json comparados (raíz incluida)`);

if (otros.length) {
  di(`\n·  tocados SIN mover dependencias (${otros.length}): ${otros.join(' · ')}`);
  di('   (scripts, comentarios, name/version — no mueven el binario)');
}
if (dev.length) {
  di(`\n⚠️  devDependencies (${dev.length}) — NO viajan al bundle, no bloquean:`);
  for (const c of dev) di(fila(c));
}
if (runtime.length === 0) {
  di('\n✅ CERO cambios de dependencia de runtime ⇒ por esta pregunta, candidato a OTA.');
  di('   (no dice que nada más lo impida: app config y runtimeVersion se miden aparte)');
  process.exit(0);
}
di(`\n🔴 ${runtime.length} cambio(s) de dependencia de RUNTIME:`);
for (const c of runtime) di(fila(c));
di('\n   ⇒ NO se publica como OTA sin responder, paquete por paquete, si trae');
di('     código nativo. Un módulo nativo nuevo exige BUILD (L-134 · D-1017).');
process.exit(1);
