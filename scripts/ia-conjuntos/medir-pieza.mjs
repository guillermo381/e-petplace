#!/usr/bin/env node
/**
 * S113-E · `medir-pieza` — EL ARNÉS QUE DECIDE MODELOS.
 *
 * Corre una pieza sobre su conjunto con un modelo dado y devuelve, POR CAMPO,
 * la exactitud; más el costo total y por ítem.
 *
 * ═══ CÓMO COMPARA — la normalización, declarada ════════════════════════════
 * Un campo acierta si, tras normalizar, los dos textos son iguales:
 *   minúsculas · acentos fuera · espacios colapsados · signos de puntuación
 *   fuera de los bordes.  «Rabia (antirrábica)» ≡ «rabia antirrabica».
 * Las **fechas se comparan por VALOR**, no por texto: `2024-03-05`,
 * `05/03/2024` y `5 de marzo de 2024` son el mismo día. *Comparar fechas como
 * cadenas mide el formato del modelo, no si acertó el día.*
 *
 * ═══ 🔴 EL COSTO, Y POR QUÉ HOY ES UNA ESTIMACIÓN ══════════════════════════
 * `ia_uso` **todavía no existe** (la migración va en este mismo lote, y la
 * aplica A). Y la edge `extract-vacuna` **no devuelve `usage`**: su respuesta
 * es `{ vacunas }` y nada más — medido en su fuente, no supuesto.
 * ⇒ Mientras eso siga así, el costo se **estima** con `packages/ia/precios.ts`
 * y sale rotulado `ESTIMADO`, con su método a la vista. En cuanto `ia_uso`
 * exista y la librería de D escriba ahí, el arnés lee el costo REAL de la
 * tabla y el rótulo pasa a `MEDIDO`. *Un número estimado que se presenta como
 * medido es peor que no tener número.*
 *
 * ═══ CONTROL (`--control`) ═════════════════════════════════════════════════
 * Un arnés que sólo sabe decir «100 %» no está midiendo. `--control` corre el
 * comparador contra el conjunto con **la verdad de un ítem cambiada a
 * propósito** y exige que la exactitud BAJE. Si no baja, el arnés miente y
 * sale en rojo sin gastar una sola llamada al modelo.
 *
 * Uso:
 *   node scripts/ia-conjuntos/medir-pieza.mjs --control
 *   node scripts/ia-conjuntos/medir-pieza.mjs --pieza carnet [--modelo claude-sonnet-5]
 *
 * ⚠️ Sin `--control`, ESTE SCRIPT GASTA PLATA REAL: una llamada al modelo por
 * caso del conjunto.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { claveServicio, bajarObjeto, consultar, DIR_CONJUNTOS, URL_BASE, PROJECT_REF, claveAnon } from './lib-conjuntos.mjs';
// La tabla de precios vive en la costura de D — `supabase/functions/_shared/ia/`
// —, no en `packages/`: es donde las edge functions la consumen, y tener dos
// copias sería tener dos precios.
import { costoEstimadoUsd, TOKENIZADOR, FECHA_PRECIOS } from '../../supabase/functions/_shared/ia/precios.ts';

const di = (s) => process.stdout.write(s + '\n');
const arg = (n, d = null) => {
  const i = process.argv.indexOf(n);
  return i === -1 ? d : process.argv[i + 1];
};

// ═══ NORMALIZACIÓN Y COMPARACIÓN ═══════════════════════════════════════════
export function normalizar(v) {
  if (v === null || v === undefined) return null;
  const s = String(v)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // acentos fuera
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')                          // puntuación a espacio
    .replace(/\s+/g, ' ')
    .trim();
  return s === '' ? null : s;
}

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

/** Fecha → `YYYY-MM-DD`, o null si no se puede leer como fecha. */
export function aFecha(v) {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);          // dd/mm/aaaa
  if (m) {
    const a = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${a}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  m = normalizar(s)?.match(/^(\d{1,2}) de ([a-z]+) de (\d{4})$/);      // 5 de marzo de 2024
  if (m) {
    const i = MESES.indexOf(m[2]);
    if (i >= 0) return `${m[3]}-${String(i + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return null;
}

const CAMPOS_FECHA = new Set(['fecha_aplicada', 'fecha_proxima']);

export function coincide(campo, esperado, obtenido) {
  if (CAMPOS_FECHA.has(campo)) {
    const a = aFecha(esperado), b = aFecha(obtenido);
    return a === b;                      // null === null cuenta como acierto
  }
  return normalizar(esperado) === normalizar(obtenido);
}

/**
 * Empareja las vacunas devueltas con las de la verdad. Un carnet devuelve una
 * LISTA y el orden no está garantizado ⇒ se empareja por el campo ancla
 * (`nombre` + `fecha_aplicada`), y lo que no encuentra pareja cuenta como
 * fallo. *Comparar por posición mediría el orden, no el contenido.*
 */
function emparejar(verdad, obtenidas) {
  const libres = [...obtenidas];
  const pares = [];
  for (const v of verdad) {
    let mejor = -1, mejorPuntaje = -1;
    libres.forEach((o, i) => {
      let p = 0;
      if (coincide('nombre_vacuna', v.nombre_vacuna, o.nombre)) p += 2;
      if (coincide('fecha_aplicada', v.fecha_aplicada, o.fecha_aplicada)) p += 1;
      if (p > mejorPuntaje) { mejorPuntaje = p; mejor = i; }
    });
    pares.push({ v, o: mejorPuntaje > 0 && mejor >= 0 ? libres.splice(mejor, 1)[0] : null });
  }
  return { pares, sobrantes: libres.length };
}

const CAMPOS = ['nombre_vacuna', 'fecha_aplicada', 'fecha_proxima', 'lote', 'veterinario_nombre_externo'];
/** Nombre del campo en la verdad → nombre en la respuesta de la edge. */
const EN_RESPUESTA = { nombre_vacuna: 'nombre' };

function evaluarCarnet(caso, vacunas) {
  const { pares, sobrantes } = emparejar(caso.verdad, vacunas ?? []);
  const porCampo = {};
  for (const c of CAMPOS) porCampo[c] = { aciertos: 0, evaluados: 0, sin_verdad: 0 };
  for (const { v, o } of pares) {
    for (const c of CAMPOS) {
      const esperado = v[c];
      if (esperado === null || esperado === undefined || esperado === '') {
        porCampo[c].sin_verdad += 1;      // no se puntúa lo que no tiene verdad
        continue;
      }
      porCampo[c].evaluados += 1;
      if (o && coincide(c, esperado, o[EN_RESPUESTA[c] ?? c])) porCampo[c].aciertos += 1;
    }
  }
  return { porCampo, encontradas: pares.filter((p) => p.o).length, esperadas: caso.verdad.length, sobrantes };
}

// ═══ CONTROL — el rojo del instrumento ════════════════════════════════════
if (process.argv.includes('--control')) {
  const conj = JSON.parse(readFileSync(join(DIR_CONJUNTOS, 'carnets.json'), 'utf8'));
  const caso = conj.casos.find((c) => c.n_vacunas >= 4) ?? conj.casos[0];

  // ① POSITIVO: si el modelo devolviera EXACTAMENTE la verdad, 100 % por campo.
  const perfecta = caso.verdad.map((v) => ({ ...v, nombre: v.nombre_vacuna }));
  const bien = evaluarCarnet(caso, perfecta);
  const pctBien = (c) => bien.porCampo[c].evaluados
    ? (bien.porCampo[c].aciertos / bien.porCampo[c].evaluados) * 100 : null;
  const todoCien = CAMPOS.every((c) => pctBien(c) === null || pctBien(c) === 100);
  di(`${todoCien ? '✅' : '🔴'} POSITIVO  respuesta = la verdad ⇒ ` +
     CAMPOS.map((c) => `${c.split('_')[0]}:${pctBien(c) ?? 's/m'}`).join(' '));

  // ② NEGATIVO: un ítem con la verdad cambiada a propósito. Tiene que BAJAR.
  const sucia = perfecta.map((v, i) => (i === 0
    ? { ...v, nombre: 'VACUNA QUE NO EXISTE', fecha_aplicada: '1999-01-01', lote: 'ZZZZ' }
    : v));
  const mal = evaluarCarnet(caso, sucia);
  const pctMal = (c) => mal.porCampo[c].evaluados
    ? (mal.porCampo[c].aciertos / mal.porCampo[c].evaluados) * 100 : null;
  const bajo = CAMPOS.some((c) => pctBien(c) !== null && pctMal(c) !== null && pctMal(c) < pctBien(c));
  di(`${bajo ? '✅' : '🔴'} NEGATIVO  un ítem con la verdad cambiada ⇒ ` +
     CAMPOS.map((c) => `${c.split('_')[0]}:${pctMal(c) ?? 's/m'}`).join(' '));

  // ③ La comparación de fechas por VALOR, no por texto.
  const fechasOk = coincide('fecha_aplicada', '2024-03-05', '05/03/2024')
                && coincide('fecha_aplicada', '2024-03-05', '5 de marzo de 2024')
                && !coincide('fecha_aplicada', '2024-03-05', '2024-03-06');
  di(`${fechasOk ? '✅' : '🔴'} FECHAS    05/03/2024 ≡ 2024-03-05 ≢ 2024-03-06`);

  // ④ La normalización de texto.
  const txtOk = coincide('nombre_vacuna', 'Rabia (antirrábica)', '  rabia ANTIRRABICA ')
             && !coincide('nombre_vacuna', 'Rabia', 'Moquillo');
  di(`${txtOk ? '✅' : '🔴'} TEXTO     acentos/mayúsculas/puntuación ≡ · distintos ≢`);

  const rojo = !todoCien || !bajo || !fechasOk || !txtOk;
  di(rojo ? '\n🔴 EL ARNÉS NO MIDE.' : '\n✅ el arnés mide: sabe decir 100 % y sabe bajar. Cero llamadas al modelo.');
  process.exit(rojo ? 1 : 0);
}

// ═══ CORRIDA REAL ═════════════════════════════════════════════════════════
const pieza = arg('--pieza', 'carnet');
const modelo = arg('--modelo', 'claude-sonnet-5');
if (pieza !== 'carnet') {
  di(`🔴 pieza "${pieza}" no implementada en este lote. Sólo "carnet" corre contra una edge viva.`);
  process.exit(2);
}

const conj = JSON.parse(readFileSync(join(DIR_CONJUNTOS, 'carnets.json'), 'utf8'));
const clave = claveServicio();

/** Sesión de persona: la edge exige `role: authenticated` (D-714). */
async function jwtDePersona() {
  const cl = spawnSync('security',
    ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'], { encoding: 'utf8' });
  const pass = cl.stdout.trim();
  if (!pass) throw new Error('sin clave de siembra en el keychain. El arnés PARA.');
  // D-1013: la `anon` sale del repo (es pública). La versión vieja de estas
  // líneas corría `projects api-keys` DOS VECES y ese comando volcaba también
  // la `service_role` por stdout.
  const anon = claveAnon();
  const r = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'guillo381+8@gmail.com', password: pass }),
  });
  if (!r.ok) throw new Error(`no pude abrir sesión de persona (${r.status}). El arnés PARA.`);
  const j = await r.json();
  const rol = JSON.parse(Buffer.from(j.access_token.split('.')[1], 'base64url').toString('utf8')).role;
  if (rol !== 'authenticated') throw new Error(`el token tiene role=${rol}, no authenticated. El arnés PARA.`);
  return j.access_token;
}

const jwt = await jwtDePersona();
di(`medir-pieza · pieza=${pieza} · modelo declarado en la edge=${modelo}`);
di(`conjunto: ${conj.n_casos} carnets · ${conj.n_filas_verdad} filas de verdad\n`);

const total = {};
for (const c of CAMPOS) total[c] = { aciertos: 0, evaluados: 0, sin_verdad: 0 };
const detalle = [];
let msTotal = 0, bytesTotal = 0, fallos = 0;

for (const caso of conj.casos) {
  const img = await bajarObjeto(caso.bucket, caso.path, clave);
  if (!img) { di(`🔴 ${caso.caso}: no se pudo bajar`); fallos += 1; continue; }
  bytesTotal += img.length;

  const t0 = Date.now();
  const r = await fetch(`${URL_BASE}/functions/v1/extract-vacuna`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: img.toString('base64'), mediaType: 'image/jpeg' }),
  });
  const ms = Date.now() - t0;
  msTotal += ms;

  if (!r.ok) {
    const txt = await r.text();
    di(`🔴 ${caso.caso}: HTTP ${r.status} ${txt.slice(0, 120)}  (${ms} ms)`);
    fallos += 1;
    continue;
  }
  const { vacunas } = await r.json();
  const ev = evaluarCarnet(caso, vacunas);
  for (const c of CAMPOS) {
    total[c].aciertos += ev.porCampo[c].aciertos;
    total[c].evaluados += ev.porCampo[c].evaluados;
    total[c].sin_verdad += ev.porCampo[c].sin_verdad;
  }
  detalle.push({ caso: caso.caso, ms, esperadas: ev.esperadas, devueltas: (vacunas ?? []).length, sobrantes: ev.sobrantes });
  di(`  ${caso.caso.padEnd(28)} ${String(ms).padStart(6)} ms · esperadas ${ev.esperadas} · devueltas ${(vacunas ?? []).length}` +
     `${ev.sobrantes ? ` · ${ev.sobrantes} de más` : ''}`);
}

// ── EXACTITUD POR CAMPO ────────────────────────────────────────────────────
di('\nexactitud por campo:');
const exactitud = {};
for (const c of CAMPOS) {
  const t = total[c];
  if (t.evaluados === 0) {
    exactitud[c] = null;
    di(`  ${c.padEnd(28)} 🔴 SIN MUESTRA (${t.sin_verdad} filas sin verdad para este campo)`);
    continue;
  }
  const pct = (t.aciertos / t.evaluados) * 100;
  exactitud[c] = Number(pct.toFixed(1));
  const nota = t.evaluados < 5 ? `  ⚠️ n=${t.evaluados}, muestra chica` : '';
  di(`  ${c.padEnd(28)} ${pct.toFixed(1).padStart(5)} %  (${t.aciertos}/${t.evaluados})${nota}`);
}

// ── COSTO ──────────────────────────────────────────────────────────────────
// Se intenta leer de `ia_uso` primero. Si la tabla no existe, se ESTIMA.
let costo = null, origenCosto = 'ESTIMADO';
try {
  const hay = consultar("select to_regclass('public.ia_uso') is not null as existe")[0]?.existe;
  if (hay) {
    const f = consultar(`select coalesce(sum(costo_estimado_usd),0) usd, count(*) n
                         from public.ia_uso where pieza='carnet'
                           and created_at > now() - interval '15 minutes'`)[0];
    if (f && Number(f.n) > 0) { costo = Number(f.usd); origenCosto = 'MEDIDO (ia_uso)'; }
  }
} catch { /* la tabla no existe todavía: se estima */ }

if (costo === null) {
  // Estimación declarada. Imagen: ~ancho×alto/750 tokens; sin las dimensiones,
  // se usa la aproximación por bytes de un JPEG. El prompt se cuenta del
  // archivo real. Salida: los caracteres del JSON devuelto.
  // ⚠️ Es una COTA, no una medición: por eso el rótulo dice ESTIMADO.
  const promptChars = readFileSync('supabase/functions/extract-vacuna/index.ts', 'utf8')
    .split('La imagen muestra un carnet')[1]?.split('`')[0]?.length ?? 1500;
  const factorTok = TOKENIZADOR[modelo] === 'nuevo' ? 1.3 : 1.0;
  const tokPrompt = Math.round((promptChars / 4) * factorTok);
  const tokImagen = Math.round((bytesTotal / conj.n_casos / 750) * 1.0); // por imagen
  // La firma de `costoEstimadoUsd` es la de D: los cuatro campos, `number|null`.
  const porLlamada = {
    tokens_entrada: tokPrompt + tokImagen,
    tokens_salida: Math.round((detalle.reduce((a, d) => a + d.esperadas, 0) / Math.max(1, detalle.length)) * 60 * factorTok),
    tokens_cache_lectura: null,
    tokens_cache_escritura: null,
  };
  const unit = costoEstimadoUsd(modelo, porLlamada);
  costo = unit === null ? null : unit * Math.max(1, detalle.length);
}

di('\ncosto:');
if (costo === null) {
  di(`  🔴 no calculable: el modelo "${modelo}" no está en la tabla de precios.`);
} else {
  di(`  ${origenCosto} · total $${costo.toFixed(6)} · por carnet $${(costo / Math.max(1, detalle.length)).toFixed(6)}`);
  if (origenCosto === 'ESTIMADO') {
    di('  ⚠️ ESTIMADO: la edge no devuelve `usage` y `ia_uso` no existe todavía.');
    di('     Tokens de entrada = prompt del repo + imagen (bytes/750); salida por filas.');
    di(`     Precios verificados el ${FECHA_PRECIOS}.`);
  }
}
di(`latencia: total ${msTotal} ms · promedio ${Math.round(msTotal / Math.max(1, detalle.length))} ms por carnet` +
   (fallos ? ` · 🔴 ${fallos} fallo(s)` : ''));

mkdirSync(DIR_CONJUNTOS, { recursive: true });
const salida = join(DIR_CONJUNTOS, `linea-base-${pieza}-${modelo}.json`);
writeFileSync(salida, JSON.stringify({
  pieza, modelo, corrida_el: new Date().toISOString(),
  n_casos: conj.n_casos, fallos, exactitud, total, detalle,
  costo_usd: costo, origen_costo: origenCosto,
  latencia_ms_total: msTotal,
}, null, 2));
di(`\n→ ${salida}`);
process.exit(fallos > 0 ? 1 : 0);
