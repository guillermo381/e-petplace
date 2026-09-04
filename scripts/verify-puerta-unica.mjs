#!/usr/bin/env node
/**
 * S113-E · EL GATE DE LA PUERTA ÚNICA.
 *
 * ═══ POR QUÉ EXISTE ════════════════════════════════════════════════════════
 * La casa tiene una ley desde S43: **las apps jamás llaman a la base directo —
 * todo pasa por los wrappers de `@epetplace/api`**. Medido por A en S113
 * (`S113-RELEVAMIENTO.md` §3.4): la ley **se cumple hoy en cero**, y **ningún
 * gate la vigila**. Los 23 `verify:*` del `package.json` miden otras clases.
 *
 * *Una ley que sólo sostiene la disciplina se cumple hasta el día que alguien
 * con prisa necesita un dato y escribe la línea de una.* Este gate la mide.
 *
 * ═══ QUÉ CENSA ═════════════════════════════════════════════════════════════
 * En `apps/<app>/src`, todo archivo `.ts`/`.tsx`/`.js`/`.jsx`:
 *   · `<algo>.from(`  — el acceso a tabla de PostgREST
 *   · `.rpc(`         — la llamada a función
 *   · `createClient`  — fabricar un cliente propio, salteando `getClient()`
 *
 * ═══ QUÉ NO ES HALLAZGO, y por qué cada excepción ═════════════════════════
 * ① **Comentarios.** El código comentado y la prosa que NOMBRA el patrón no
 *    son el patrón. Hoy hay un caso real y vivo: un comentario de C que
 *    escribe `supabase.from('pedidos_recurrencias')` para explicar por qué NO
 *    lo hace. Un gate que lo marca rojo enseña a apagar el gate.
 * ② **`.storage.from(`** — Storage NO tiene wrapper: la casa accede por
 *    `getClient().storage`, y eso ES la puerta única (§3.4 del relevamiento).
 *    ⚠️ Se exige que la cadena arranque en `getClient()`: un `.storage.from(`
 *    colgado de un cliente fabricado a mano sigue siendo un hallazgo.
 *
 *    🔴 **Y ESTA EXCEPCIÓN SE MIDE SOBRE LA SENTENCIA, NO SOBRE LA LÍNEA.**
 *    La primera versión de este gate miraba línea por línea y marcó **10
 *    hallazgos, los 10 falsos**: el formateador parte `await getClient()` y
 *    `.storage.from(BUCKET)` en dos líneas, así que la excepción nunca podía
 *    verse. *El código estaba bien; la unidad de medida estaba mal.* Ahora se
 *    mira hacia atrás desde el `.storage`, salteando espacios y saltos, y se
 *    exige `getClient()` inmediatamente antes. El caso partido en dos líneas
 *    es un control declarado abajo, para que la cura no se pierda.
 * ③ **LISTA BLANCA de `.from(` que no son de Supabase** (abajo). Es una lista
 *    CERRADA y declarada: cualquier prefijo que no esté en ella sale **rojo**.
 *
 * 🔴 **La lista blanca se eligió CERRADA a propósito.** Una lista abierta
 * («ignorá lo que no parezca Supabase») convierte al gate en algo que aprueba
 * lo que no entiende. Acá, un prefijo nuevo obliga a que un humano decida y lo
 * agregue — cuesta una línea, y es la única forma de que el silencio del gate
 * signifique algo. *Prefiero un rojo que se explica a un verde que no se sabe.*
 *
 * ═══ CONTROLES (`--control`) ══════════════════════════════════════════════
 * Un gate que nunca produjo su rojo no está midiendo. `--control` corre cinco:
 *   POSITIVO   planta `supabase.from('x')` en un archivo temporal → ROJO con path:línea
 *   NEGATIVO 1 sin la línea plantada                              → VERDE
 *   NEGATIVO 2 planta la MISMA línea DENTRO de un comentario      → VERDE
 *   NEGATIVO 3 `getClient()` y `.storage.from(` en DOS líneas      → VERDE
 *   POSITIVO 2 `.storage.from(` colgado de un cliente ajeno        → ROJO
 * El negativo 2 existe porque sin él la excepción ① sería una fe: prueba que el
 * filtro de comentarios discrimina en vez de tragarse todo.
 *
 * Salida: 0 verde · 1 hallazgos · 2 no concluyente (nada que medir).
 */
import { readdirSync, statSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const di = (s) => process.stdout.write(s + '\n');

/** Prefijos de `.from(` que NO son acceso a la base. Lista CERRADA. */
const PREFIJOS_NO_SUPABASE = new Set([
  'Array',    // Array.from(...)
  'Buffer',   // Buffer.from(...)
  'Object',   // Object.from no existe, pero el prefijo es inequívoco si aparece
]);

/**
 * `.html` entra porque `apps/pagos-web/src` es UN index.html con JS inline —
 * medido. Sin él el gate reportaba «3 directorios revisados» y era **ciego a
 * uno entero**: hoy da 0 hits ahí, pero un 0 que nadie puede producir no es
 * una medición. (El parser de comentarios es de JS; un `<!-- -->` con `.from(`
 * adentro daría falso rojo. Se acepta: prefiero el rojo que se explica.)
 */
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.html']);
const SALTAR = new Set(['node_modules', '.expo', 'dist', 'build', '.next', 'ios', 'android']);

function archivos(dir) {
  const out = [];
  let entradas;
  try { entradas = readdirSync(dir); } catch { return out; }
  for (const e of entradas) {
    if (SALTAR.has(e)) continue;
    const p = join(dir, e);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) out.push(...archivos(p));
    else if (EXT.has(e.slice(e.lastIndexOf('.')))) out.push(p);
  }
  return out;
}

/**
 * Devuelve el texto sin comentarios, conservando los saltos de línea para que
 * el número de línea del hallazgo siga siendo el del archivo real.
 *
 * Máquina de estados chica: código · cadena · plantilla · `//` · bloque.
 * Las cadenas se conservan (una tabla se nombra dentro de comillas), pero se
 * recorren para no confundir un `//` dentro de una URL con un comentario.
 */
function sinComentarios(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let estado = 'codigo';
  let comilla = '';
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (estado === 'codigo') {
      if (c === '/' && d === '/') { estado = 'linea'; i += 2; continue; }
      if (c === '/' && d === '*') { estado = 'bloque'; i += 2; continue; }
      if (c === '"' || c === "'" || c === '`') { estado = 'cadena'; comilla = c; out += c; i += 1; continue; }
      out += c; i += 1; continue;
    }
    if (estado === 'cadena') {
      if (c === '\\') { out += c + (d ?? ''); i += 2; continue; }
      if (c === comilla) { estado = 'codigo'; }
      out += c; i += 1; continue;
    }
    if (estado === 'linea') {
      if (c === '\n') { estado = 'codigo'; out += '\n'; }
      i += 1; continue;
    }
    // bloque
    if (c === '*' && d === '/') { estado = 'codigo'; i += 2; continue; }
    if (c === '\n') out += '\n';
    i += 1;
  }
  return out;
}

/** offset → nº de línea (1-based), contando saltos hasta el offset. */
function lineaDe(texto, offset) {
  let n = 1;
  for (let i = 0; i < offset; i += 1) if (texto[i] === '\n') n += 1;
  return n;
}

/**
 * ¿El `.storage` que arranca en `offset` cuelga de un `getClient()`?
 * Mira hacia atrás salteando espacios y saltos de línea — por eso ve el caso
 * real `await getClient()\n  .storage.from(BUCKET)`, que la versión por línea
 * no podía ver.
 */
function cuelgaDeGetClient(texto, offset) {
  let i = offset - 1;
  while (i >= 0 && /\s/.test(texto[i])) i -= 1;      // espacios y saltos
  if (texto[i] !== '.') return false;                 // el punto de `.storage`
  i -= 1;
  while (i >= 0 && /\s/.test(texto[i])) i -= 1;
  return /getClient\s*\(\s*\)$/.test(texto.slice(Math.max(0, i - 40), i + 1));
}

function censar(dirs) {
  const hallazgos = [];
  const revisados = [];
  for (const raiz of dirs) {
    for (const archivo of archivos(raiz)) {
      revisados.push(archivo);
      const t = sinComentarios(readFileSync(archivo, 'utf8'));
      const anota = (offset, motivo) => {
        const nro = lineaDe(t, offset);
        const linea = t.split('\n')[nro - 1] ?? '';
        hallazgos.push({ archivo, nro, motivo, texto: linea.trim().slice(0, 120) });
      };

      // ── createClient ────────────────────────────────────────────────────
      for (const m of t.matchAll(/\bcreateClient\b/g)) {
        anota(m.index, 'createClient: fabrica un cliente fuera de getClient()');
      }

      // ── .rpc( ───────────────────────────────────────────────────────────
      for (const m of t.matchAll(/\.\s*rpc\s*\(/g)) {
        anota(m.index, '.rpc(: llamada a función fuera de @epetplace/api');
      }

      // ── <algo>.from( ────────────────────────────────────────────────────
      for (const m of t.matchAll(/([A-Za-z_$][A-Za-z0-9_$]*)\s*\.\s*from\s*\(/g)) {
        const prefijo = m[1];
        if (PREFIJOS_NO_SUPABASE.has(prefijo)) continue;
        if (prefijo === 'storage') {
          // Excepción ②, medida sobre la SENTENCIA: ¿cuelga de getClient()?
          if (cuelgaDeGetClient(t, m.index)) continue;
          anota(m.index, '.storage.from( que NO cuelga de getClient() — cliente fabricado fuera de la puerta');
          continue;
        }
        anota(m.index, `${prefijo}.from(: acceso a tabla fuera de @epetplace/api`);
      }
    }
  }
  return { hallazgos, revisados };
}

// ═══ CONTROL ══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  const tmp = mkdtempSync(join(tmpdir(), 'puerta-unica-'));
  const f = join(tmp, 'sonda.ts');
  let rojo = false;

  // ① POSITIVO primero: con la línea plantada tiene que dar ROJO.
  writeFileSync(f, 'const a = 1;\nconst r = await supabase.from("x").select();\n');
  let r = censar([tmp]);
  const cazo = r.hallazgos.length === 1 && r.hallazgos[0].nro === 2;
  di(`${cazo ? '✅' : '🔴'} POSITIVO   línea plantada ⇒ ${r.hallazgos.length} hallazgo(s)` +
     (r.hallazgos[0] ? ` en ${r.hallazgos[0].archivo}:${r.hallazgos[0].nro}` : ''));
  if (!cazo) rojo = true;

  // ② NEGATIVO: sin la línea, verde.
  writeFileSync(f, 'const a = 1;\nconst b = Array.from([1,2]);\n');
  r = censar([tmp]);
  const limpio = r.hallazgos.length === 0;
  di(`${limpio ? '✅' : '🔴'} NEGATIVO 1 sin la línea ⇒ ${r.hallazgos.length} hallazgo(s)`);
  if (!limpio) rojo = true;

  // ③ NEGATIVO 2: la misma línea, pero comentada. Prueba que el filtro de
  //    comentarios DISCRIMINA — sin esto, la excepción ① sería una creencia.
  writeFileSync(f, 'const a = 1;\n// const r = await supabase.from("x").select();\n/* supabase.from("y") */\n');
  r = censar([tmp]);
  const comentado = r.hallazgos.length === 0;
  di(`${comentado ? '✅' : '🔴'} NEGATIVO 2 la misma línea COMENTADA ⇒ ${r.hallazgos.length} hallazgo(s)`);
  if (!comentado) rojo = true;

  // ④ NEGATIVO 3 — EL CASO QUE ROMPIÓ LA v1: `getClient()` y `.storage.from(`
  //    partidos en dos líneas por el formateador. Es la forma REAL en la que
  //    aparece 10 veces en el repo. Tiene que dar VERDE.
  writeFileSync(f, 'const { error } = await getClient()\n  .storage.from(BUCKET)\n  .upload(path, bytes);\n');
  r = censar([tmp]);
  const partido = r.hallazgos.length === 0;
  di(`${partido ? '✅' : '🔴'} NEGATIVO 3 getClient() y .storage.from( en dos líneas ⇒ ${r.hallazgos.length} hallazgo(s)`);
  if (!partido) rojo = true;

  // ⑤ POSITIVO 2 — la contracara: un `.storage.from(` que NO cuelga de
  //    getClient(). Sin este control, el negativo 3 podría estar pasando
  //    porque el gate dejó de mirar `.storage` del todo.
  writeFileSync(f, 'const cli = misupabase;\nconst { error } = await cli\n  .storage.from(BUCKET)\n  .upload(p, b);\n');
  r = censar([tmp]);
  const colgado = r.hallazgos.length === 1;
  di(`${colgado ? '✅' : '🔴'} POSITIVO 2 .storage.from( de un cliente ajeno ⇒ ${r.hallazgos.length} hallazgo(s)` +
     (r.hallazgos[0] ? ` en línea ${r.hallazgos[0].nro}` : ''));
  if (!colgado) rojo = true;

  rmSync(tmp, { recursive: true, force: true });
  di(rojo ? '\n🔴 EL GATE NO MIDE: algún control falló.' : '\n✅ los cinco controles pasan — el gate puede producir su rojo.');
  process.exit(rojo ? 1 : 0);
}

// ═══ CORRIDA NORMAL ═══════════════════════════════════════════════════════
const dirs = readdirSync('apps')
  .map((a) => join('apps', a, 'src'))
  .filter((d) => { try { return statSync(d).isDirectory(); } catch { return false; } });

if (dirs.length === 0) {
  di('🔴 NO CONCLUYENTE: no encontré ningún apps/*/src que medir.');
  process.exit(2);
}

const { hallazgos, revisados } = censar(dirs);

if (revisados.length === 0) {
  di('🔴 NO CONCLUYENTE: 0 archivos revisados. El corpus está vacío — eso no es un verde.');
  process.exit(2);
}

di(`puerta única · ${revisados.length} archivos revisados en: ${dirs.join(' · ')}`);

if (hallazgos.length > 0) {
  di('');
  for (const h of hallazgos) di(`🔴 ${h.archivo}:${h.nro}  ${h.motivo}\n     ${h.texto}`);
  di(`\n🔴 ${hallazgos.length} hallazgo(s). Las apps van a la base por @epetplace/api.`);
  process.exit(1);
}

// El verde lleva su lista, como pide el encargo: por app, cuántos archivos.
const porApp = new Map();
for (const a of revisados) {
  const app = a.split('/')[1];
  porApp.set(app, (porApp.get(app) ?? 0) + 1);
}
for (const [app, n] of [...porApp].sort()) di(`   ${app.padEnd(12)} ${n} archivos`);
di('\n✅ VERDE · cero accesos directos a la base fuera de @epetplace/api.');
process.exit(0);
