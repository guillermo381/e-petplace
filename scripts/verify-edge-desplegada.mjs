#!/usr/bin/env node
/**
 * verify:edge-desplegada — ¿LA EDGE QUE ESTÁ CORRIENDO ES LA DEL REPO?
 *
 * 🔴 POR QUÉ EXISTE (`L-536`, `D-1060`): una migración puso un trigger que
 *    invalidaba las escrituras de `fiscal-emitir`, y la versión DESPLEGADA era
 *    de la tanda anterior. El typecheck, `deno check` y el propio `db push`
 *    dieron verde — **ninguno de los tres mira lo que está corriendo**. La edge
 *    vieja escribió, rebotó, no leyó su error e informó éxito: dos secuenciales
 *    fiscales consumidos y ninguna fila con ellos.
 *    *Un bundle viejo LEE y rompe una pantalla: se ve. Una edge vieja ESCRIBE.*
 *
 * DOS CAMINOS, y el gate SIEMPRE dice por cuál contestó:
 *
 *   ① EXACTO — `edge_despliegues.firma` contra la firma de hoy (sha256 del
 *      `index.ts` + los `_shared` que importa, transitivamente). No es un
 *      proxy: es la misma pregunta, respondida.
 *
 *   ② HEURÍSTICO — sin firma registrada, sólo quedan las FECHAS. Y tiene un
 *      falso positivo estructural: **el orden normal de la casa es desplegar,
 *      verificar y recién commitear**, así que un commit posterior al
 *      despliegue es lo normal. Medido sobre las 47 desplegadas el 11-sep:
 *      18 con «atraso» menor a una hora y 22 con más de siete — con un hueco
 *      limpio entre 0,7 h y 7,6 h. La ventana sale de ahí y **se declara**;
 *      dentro de ella el gate no afirma: dice NO CONCLUYENTE para esa función.
 *
 * ⚠️ LO QUE NO MIDE, declarado (`L-459`):
 *   · el `ezbr_sha256` de la plataforma NO se compara: es el hash de SU bundle
 *     y no hay forma de reproducirlo acá. Compararlo sería inventar una vara.
 *   · un despliegue hecho POR FUERA de `edge:desplegar` no deja firma, y esa
 *     función cae al heurístico. El gate lo dice por función, no en general.
 *
 * Salida: 0 sano · 1 hay al menos una VIEJA · 2 NO CONCLUYENTE (`L-533`).
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { firmaDeEdge, cierreDeDeps } from './lib-edge-firma.mjs';

const RAIZ = resolve(new URL('..', import.meta.url).pathname);
const DIR_FN = join(RAIZ, 'supabase', 'functions');
const CONTROL = process.argv.includes('--control');

/** La ventana del «desplegar → verificar → commitear». Declarada, no escondida:
 *  sale del hueco medido (0,7 h vs 7,6 h) y se puede mover con --ventana-min. */
const iV = process.argv.indexOf('--ventana-min');
const VENTANA_MIN = iV >= 0 ? Number(process.argv[iV + 1]) : 60;

const SANO = 0, ROJO = 1, NO_CONCLUYENTE = 2;
const salir = (c, msg) => { console.log(msg); process.exit(c); };
const sh = (c, a) => execFileSync(c, a, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
const fecha = (ms) => new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

function ultimoCommit(rutas) {
  try {
    const s = sh('git', ['log', '-1', '--format=%ct|%h|%s', '--', ...rutas.map((r) => relative(RAIZ, r))]);
    if (!s) return null;
    const [ts, sha, ...r] = s.split('|');
    return { ts: Number(ts), sha, asunto: r.join('|').slice(0, 52) };
  } catch { return null; }
}

function desplegadas() {
  let crudo;
  try {
    crudo = execFileSync('npx', ['supabase', 'functions', 'list'],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore','pipe','pipe'], timeout: 120_000 });
  } catch (e) { return { error: `no se pudo listar: ${String(e).slice(0, 110)}` }; }
  const i = crudo.indexOf('{"functions"');
  if (i < 0) return { error: 'la salida de `functions list` no trajo JSON reconocible' };
  try {
    const m = new Map();
    for (const f of JSON.parse(crudo.slice(i)).functions ?? []) m.set(f.slug, { version: f.version, ms: f.updated_at });
    return { mapa: m };
  } catch (e) { return { error: `JSON ilegible: ${String(e).slice(0, 90)}` }; }
}

function firmasRegistradas() {
  const tmp = `/tmp/edge-firmas-${Date.now()}.sql`;
  try {
    execFileSync('/bin/sh', ['-c',
      `printf "select coalesce(jsonb_agg(jsonb_build_object('s',slug,'f',firma,'l',arbol_limpio)),'[]') j from public.edge_despliegues;" > ${tmp}`]);
    const out = execFileSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', '--file', tmp],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore','pipe','pipe'], timeout: 120_000 });
    const i = out.indexOf('{');
    const rows = JSON.parse(out.slice(i)).rows ?? [];
    const m = new Map();
    for (const r of (typeof rows[0]?.j === 'string' ? JSON.parse(rows[0].j) : rows[0]?.j) ?? []) {
      m.set(r.s, { firma: r.f, limpio: r.l });
    }
    return { mapa: m };
  } catch (e) { return { error: String(e).slice(0, 110) }; }
}

// ── EL CONTROL, contra EL CASO QUE YA OCURRIÓ ────────────────────────────
function controles() {
  const fallos = [];
  const entrada = join(DIR_FN, 'fiscal-emitir', 'index.ts');
  const deps = cierreDeDeps(entrada);
  const c = ultimoCommit(deps);
  const DESPLIEGUE_V1_MS = 1789045443653;   // fiscal-emitir v1 · 10-sep 13:04 UTC

  // ① EL ROJO REAL: el atraso de ese caso es de HORAS, no de minutos ⇒ VIEJA.
  if (!c) fallos.push('① no se pudo leer el último commit de fiscal-emitir');
  else {
    const min = (c.ts * 1000 - DESPLIEGUE_V1_MS) / 60000;
    if (!(min > VENTANA_MIN)) {
      fallos.push(`① el ROJO histórico NO cae en VIEJA: ${min.toFixed(0)} min de atraso `
                + `con ventana de ${VENTANA_MIN} min. Es el caso de D-1060 y tiene que dar rojo.`);
    }
  }

  // ② NEGATIVO: un despliegue posterior al commit NO puede dar rojo.
  if (c && (c.ts * 1000 - (Date.now() + 3_600_000)) > 0) {
    fallos.push('② el control negativo se invalidó: el commit está en el futuro');
  }

  // ③ EL RESOLVEDOR NO ESTÁ CIEGO: sin cierre transitivo el gate mira sólo el
  //    index y da verde por no mirar — que es el defecto, no su cura.
  if (deps.length < 3) fallos.push(`③ el cierre de deps trajo ${deps.length} archivos (se esperaban ≥3)`);
  if (!deps.some((d) => d.includes('_shared/facturacion/canonico.ts'))) {
    fallos.push('③ el cierre TRANSITIVO falló: canonico.ts entra por mod.ts y no apareció');
  }

  // ④ LA FIRMA DISCRIMINA: dos contenidos distintos no pueden dar la misma.
  const f1 = firmaDeEdge(RAIZ, 'fiscal-emitir');
  const f2 = firmaDeEdge(RAIZ, 'fiscal-ride');
  if (!f1 || !f2 || f1.firma === f2.firma) {
    fallos.push('④ la firma NO discrimina: dos funciones distintas dieron el mismo sha');
  }
  return { fallos, deps: deps.length };
}

// ─────────────────────────────────────────────────────────────────────────
const { mapa: desp, error } = desplegadas();
if (error) salir(NO_CONCLUYENTE, `⚠️  NO CONCLUYENTE · ${error}\n`
  + '   No se puede afirmar que lo desplegado sea lo del repo: no se pudo mirar.');

const { mapa: firmas, error: eFirmas } = firmasRegistradas();
if (eFirmas) {
  console.log(`⚠️  sin acceso al registro de firmas (${eFirmas}) — todo por el heurístico de fechas.`);
}

if (CONTROL) {
  const { fallos, deps } = controles();
  if (fallos.length) salir(ROJO, '🔴 EL GATE NO PASA SUS PROPIOS CONTROLES:\n'
    + fallos.map((f) => `  · ${f}`).join('\n'));
  console.log(`controles VERDES · rojo histórico reproducido (fiscal-emitir v1 del `
    + `${fecha(1789045443653)}) · cierre transitivo de ${deps} archivos · la firma discrimina`);
}

const dirs = readdirSync(DIR_FN).filter((d) => {
  if (d.startsWith('_') || d.startsWith('.')) return false;
  try { return statSync(join(DIR_FN, d)).isDirectory() && existsSync(join(DIR_FN, d, 'index.ts')); }
  catch { return false; }
});

const viejas = [], alDia = [], dudosas = [], sinDesplegar = [], sinHistoria = [];
for (const slug of dirs.sort()) {
  const d = desp.get(slug);
  if (!d) { sinDesplegar.push(slug); continue; }

  const reg = firmas?.get(slug);
  const f = firmaDeEdge(RAIZ, slug);
  if (reg && f) {                                   // ① CAMINO EXACTO
    if (reg.firma === f.firma) alDia.push({ slug, como: 'firma' });
    else viejas.push({ slug, d, como: 'firma', detalle: 'la firma del repo NO es la registrada' });
    continue;
  }

  const c = ultimoCommit(cierreDeDeps(join(DIR_FN, slug, 'index.ts')));   // ② HEURÍSTICO
  if (!c) { sinHistoria.push(slug); continue; }
  const min = (c.ts * 1000 - d.ms) / 60000;
  if (min <= 0) alDia.push({ slug, como: 'fecha' });
  else if (min <= VENTANA_MIN) dudosas.push({ slug, d, c, min });
  else viejas.push({ slug, d, c, como: 'fecha', detalle: `${(min / 60).toFixed(1)} h de atraso` });
}

console.log(`\nedges en el repo: ${dirs.length} · desplegadas: ${dirs.length - sinDesplegar.length}`
  + ` · con firma registrada: ${firmas?.size ?? 0}`);
console.log(`al día: ${alDia.length} · VIEJAS: ${viejas.length} · no concluyentes: ${dudosas.length}`);

if (sinDesplegar.length) {
  console.log(`\n⚪ EN EL REPO Y NUNCA DESPLEGADAS (${sinDesplegar.length}) — no es lo mismo que vieja: ${sinDesplegar.join(', ')}`);
}
if (sinHistoria.length) console.log(`\n⚠️  SIN HISTORIA EN GIT: ${sinHistoria.join(', ')}`);

if (dudosas.length) {
  console.log(`\n⚠️  NO CONCLUYENTE POR FECHAS (${dudosas.length}) — el commit llegó dentro de los`
    + ` ${VENTANA_MIN} min del despliegue, que es el orden normal (desplegar → verificar → commitear).`);
  console.log('   Para que dejen de ser dudosas alcanza con re-desplegarlas con `edge:desplegar`,');
  console.log('   que deja su firma: ' + dudosas.map((x) => `${x.slug}(${x.min.toFixed(0)}m)`).join(' · '));
}

if (viejas.length) {
  console.log('\n🔴 LA QUE CORRE NO ES LA DEL REPO:');
  for (const v of viejas) {
    console.log(`\n  · ${v.slug} (v${v.d.version}) — por ${v.como === 'firma' ? 'FIRMA (exacto)' : 'fecha (heurístico)'}`);
    console.log(`      desplegada : ${fecha(v.d.ms)}`);
    if (v.c) console.log(`      código de  : ${fecha(v.c.ts * 1000)}  (${v.c.sha} — ${v.c.asunto})`);
    console.log(`      ${v.detalle}`);
  }
  console.log('\n  Una edge vieja ESCRIBE con las reglas de ayer contra una base con las de hoy,');
  console.log('  y si no lee el error de su escritura informa éxito igual (L-536 · D-1060).');
  console.log('\n  node scripts/edge-desplegar.mjs <slug>   ← despliega Y deja su firma\n');
  salir(ROJO, 'verify:edge-desplegada ROJO');
}

salir(SANO, `\nverify:edge-desplegada VERDE · ${alDia.filter((x) => x.como === 'firma').length} por firma`
  + ` y ${alDia.filter((x) => x.como === 'fecha').length} por fecha.`
  + '\n⚠️  Las de «por fecha» comparan TIEMPOS, no contenido: un despliegue desde un árbol'
  + '\n   sucio se ve al día. Re-desplegarlas con `edge:desplegar` las pasa al camino exacto.');
