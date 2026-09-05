#!/usr/bin/env node
/**
 * matriz-v2 — S113-E · LA TABLA QUE EL FOUNDER FIRMA.
 *
 * Corre el **prompt v2 de D** contra **Haiku 4.5 y Sonnet 5**, con los
 * parámetros que la mesa fijó: **sin razonamiento** y **max_tokens 4000**.
 * Llama a la API con la llave de MEDICIÓN del llavero — **ningún despliegue la
 * usa, y no se escribe a ningún lado**.
 *
 * ── POR QUÉ NO PASA POR LA EDGE ────────────────────────────────────────────
 * La edge desplegada es la v1. Llamar a la API directo es lo único que permite
 * variar prompt y modelo **con todo lo demás igual** — que es la condición para
 * que la diferencia medida sea del modelo y no del transporte. Además saca la
 * red y el base64 del reloj: acá la latencia es la del modelo.
 *
 * ── EL PROMPT SE LEE DE LA RAMA DE D, NO SE COPIA ──────────────────────────
 * Copiarlo lo dejaría envejecer en silencio el día que D lo toque. Se extrae de
 * `origin/pista/s113-d-1.0` en cada corrida, y si no se puede, PARA.
 *
 *   node scripts/ia-conjuntos/matriz-v2.mjs --conjunto=carnets-sinteticos
 *   node scripts/ia-conjuntos/matriz-v2.mjs --conjunto=carnets-reales --modelos=claude-haiku-4-5
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { puntuarCaso, CAMPOS, percentil, normalizarRespuesta, repartoEvidencia, repartoConfianza } from './puntuar-carnet.mjs';

const DIR = process.env.IA_CONJUNTOS_DIR ?? '.ia-conjuntos';
const MAX_TOKENS = 4000;                 // firmado por la mesa
const MODELOS_POR_DEFECTO = ['claude-sonnet-5', 'claude-haiku-4-5'];
const PRECIOS = {                        // USD por millón de tokens
  'claude-sonnet-5': { entrada: 2, salida: 10 },
  'claude-haiku-4-5': { entrada: 1, salida: 5 },
};
const di = (s) => console.log(s);
const argT = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };

/** La llave de MEDICIÓN, al momento de usarla. Se devuelve, jamás se imprime. */
function llaveAnthropic() {
  const k = spawnSync('security', ['find-generic-password', '-a', 'medicion', '-s', 'anthropic-medicion', '-w'],
    { encoding: 'utf8' }).stdout.trim();
  if (!k) throw new Error('sin `anthropic-medicion` en el llavero. La matriz PARA.');
  if (!k.startsWith('sk-ant-')) throw new Error('la clave guardada no tiene forma de llave de Anthropic. PARA.');
  return k;
}

/** El prompt v2, extraído de la rama de D. No se copia: se lee. */
function promptV2() {
  const src = spawnSync('git', ['show', 'origin/pista/s113-d-1.0:supabase/functions/extract-vacuna/index.ts'],
    { encoding: 'utf8', maxBuffer: 1 << 24 }).stdout;
  const m = src.match(/const PROMPT = `([\s\S]*?)`\n/);
  if (!m) throw new Error('no pude extraer el PROMPT v2 de la rama de D. La matriz PARA.');
  return m[1];
}

async function unaLlamada(clave, modelo, prompt, b64) {
  const t0 = Date.now();
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': clave, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: modelo,
      max_tokens: MAX_TOKENS,
      /* 🔴 «SIN razonamiento» hay que APAGARLO, no omitirlo — medido, y la
         primera version de este arnes se equivoco justo aca. Sin el campo,
         Sonnet 5 razona por su cuenta en las tareas duras: sobre un carnet
         real abrio UN bloque de thinking, quemo los 4000 tokens enteros y
         devolvio CERO caracteres de texto ⇒ 5 de 5 truncados, que yo casi
         reporto como «Sonnet no puede con 4000». Con el campo puesto: 1083
         tokens, cero bloques de razonamiento, respuesta completa.
         ⚠️ Vale para quien configure la edge: max_tokens 4000 sin apagar el
         razonamiento es 100% de fallas en produccion. La v1 desplegada no lo
         sufre porque usa 16000. */
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
        { type: 'text', text: prompt },
      ] }],
    }),
  });
  const ms = Date.now() - t0;
  if (!r.ok) return { ms, fallo: `HTTP ${r.status} ${(await r.text()).slice(0, 140)}` };
  const j = await r.json();
  const texto = (j.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  const u = j.usage ?? {};
  const p = PRECIOS[modelo];
  const costo = (u.input_tokens ?? 0) / 1e6 * p.entrada + (u.output_tokens ?? 0) / 1e6 * p.salida;
  let datos = null;
  try { datos = JSON.parse(texto.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()); } catch { /* lo dice el llamador */ }
  return { ms, datos, texto, costo, entrada: u.input_tokens ?? 0, salida: u.output_tokens ?? 0, truncado: j.stop_reason === 'max_tokens' };
}

const conjNombre = argT('conjunto', 'carnets-sinteticos');
const modelos = (argT('modelos', MODELOS_POR_DEFECTO.join(','))).split(',');
const conj = JSON.parse(readFileSync(join(DIR, `${conjNombre}.json`), 'utf8'));
const clave = llaveAnthropic();
const prompt = promptV2();

di(`matriz-v2 · conjunto ${conj.nombre} (${conj.n_casos} casos) · prompt v2 de D (${prompt.length} car.)`);
di(`  max_tokens ${MAX_TOKENS} · SIN razonamiento · llamada directa a la API con la llave de medición\n`);

const salida = {};
for (const modelo of modelos) {
  di(`── ${modelo} ─────────────────────────────`);
  const detalle = [];
  for (const [i, caso] of conj.casos.entries()) {
    const b64 = readFileSync(caso.ruta).toString('base64');
    const r = await unaLlamada(clave, modelo, prompt, b64);
    if (r.fallo || !r.datos) {
      di(`   ${i + 1}/${conj.n_casos} ${caso.caso.padEnd(38)} 🔴 ${r.fallo ?? (r.truncado ? 'TRUNCADO a max_tokens' : 'JSON ilegible')}`);
      detalle.push({ caso: caso.caso, fallo: r.fallo ?? (r.truncado ? 'truncado' : 'json_ilegible'), ms: r.ms, costo: r.costo ?? 0 });
      continue;
    }
    const { vacunas, plan_impreso } = normalizarRespuesta('v2', r.datos);
    const p = puntuarCaso(caso, vacunas);
    detalle.push({ caso: caso.caso, plantilla: caso.plantilla, condicion: caso.condicion_captura,
      ms: r.ms, costo: r.costo, entrada: r.entrada, salida: r.salida,
      n_plan_impreso: plan_impreso.length, evidencia: repartoEvidencia(vacunas), confianza: repartoConfianza(vacunas), ...p });
    di(`   ${i + 1}/${conj.n_casos} ${caso.caso.padEnd(38)} vis=${p.n_visibles} dev=${p.n_devueltas} emp=${p.n_emparejadas} inv=${p.n_inventadas} plan=${plan_impreso.length} · ${(r.ms / 1000).toFixed(1)}s`);
  }

  const vivos = detalle.filter((d) => !d.fallo);
  const total = {}; for (const c of CAMPOS) total[c] = { aciertos: 0, evaluados: 0 };
  let dev = 0, inv = 0, emp = 0, vis = 0, plan = 0;
  for (const d of vivos) {
    for (const c of CAMPOS) { total[c].aciertos += d.campos[c].aciertos; total[c].evaluados += d.campos[c].evaluados; }
    dev += d.n_devueltas; inv += d.n_inventadas; emp += d.n_emparejadas; vis += d.n_visibles; plan += d.n_plan_impreso;
  }
  const ex = {}; for (const c of CAMPOS) ex[c] = total[c].evaluados ? +(total[c].aciertos / total[c].evaluados * 100).toFixed(1) : null;
  const ms = vivos.map((d) => d.ms);
  const costo = detalle.reduce((s, d) => s + (d.costo ?? 0), 0);
  salida[modelo] = { exactitud_pct: ex, detalle_campos: total,
    filas: { visibles: vis, devueltas: dev, emparejadas: emp, inventadas: inv, plan_impreso: plan },
    invencion_pct: dev ? +(inv / dev * 100).toFixed(1) : null,
    recall_pct: vis ? +(emp / vis * 100).toFixed(1) : null,
    latencia_ms: { p50: percentil(ms, 0.5), p95: percentil(ms, 0.95) },
    costo_usd: +costo.toFixed(5), costo_por_carnet_usd: vivos.length ? +(costo / vivos.length).toFixed(5) : null,
    fallos: detalle.length - vivos.length, detalle };
  di('');
}

mkdirSync(DIR, { recursive: true });
const ruta = join(DIR, `matriz-v2-${conjNombre}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
writeFileSync(ruta, JSON.stringify({ conjunto: conj.nombre, prompt: 'v2 de D', max_tokens: MAX_TOKENS, razonamiento: false, modelos: salida }, null, 2));

di('══ TABLA ' + '═'.repeat(58));
di(`  ${'campo'.padEnd(28)} ${modelos.map((m) => m.replace('claude-', '').padStart(14)).join(' ')}`);
for (const c of CAMPOS) di(`  ${c.padEnd(28)} ${modelos.map((m) => (salida[m].exactitud_pct[c] ?? '—') + '%').map((s) => s.padStart(14)).join(' ')}`);
for (const [et, k] of [['INVENCIÓN', 'invencion_pct'], ['recall de filas', 'recall_pct']])
  di(`  ${et.padEnd(28)} ${modelos.map((m) => salida[m][k] + '%').map((s) => s.padStart(14)).join(' ')}`);
di(`  ${'plan impreso (filas)'.padEnd(28)} ${modelos.map((m) => String(salida[m].filas.plan_impreso)).map((s) => s.padStart(14)).join(' ')}`);
di(`  ${'latencia p95 (ms)'.padEnd(28)} ${modelos.map((m) => String(salida[m].latencia_ms.p95)).map((s) => s.padStart(14)).join(' ')}`);
di(`  ${'costo por carnet (USD)'.padEnd(28)} ${modelos.map((m) => '$' + salida[m].costo_por_carnet_usd).map((s) => s.padStart(14)).join(' ')}`);
di(`  ${'fallos'.padEnd(28)} ${modelos.map((m) => String(salida[m].fallos)).map((s) => s.padStart(14)).join(' ')}`);
di(`\n  → ${ruta}`);
