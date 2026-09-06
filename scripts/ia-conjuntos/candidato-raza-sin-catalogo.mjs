#!/usr/bin/env node
/**
 * candidato-raza-sin-catalogo — S113-E · MEDIR ANTES DE PROPONER.
 *
 * La idea: **no mandarle el catálogo al modelo.** Que devuelva hasta tres
 * nombres de raza en español, y que la edge los case por `nombre_norm` contra
 * `cat_razas`; lo que no casa se descarta.
 *
 * ── QUÉ SE MANTIENE IGUAL, PARA QUE LA COMPARACIÓN VALGA ──────────────────
 * Mismo conjunto (las mismas 146 fotos y la misma verdad), mismo modelo
 * (Sonnet 5), `max_tokens` 1000, razonamiento apagado, y **el mismo prompt de
 * D salvo la sección del catálogo y la forma de la salida**. Cambia UNA cosa a
 * la vez; si cambiaran dos, la diferencia no sería atribuible.
 *
 * ── LA PRECONDICIÓN, MEDIDA ANTES DE ESCRIBIR UNA LÍNEA ───────────────────
 * Casar por nombre sólo sirve si los nombres son únicos: **cero colisiones de
 * `nombre_norm` en las 137 razas de perro y gato.** Si hubiera dos razas con el
 * mismo nombre normalizado, una quedaría inalcanzable y el experimento estaría
 * midiendo un empate arbitrario.
 *
 * ── Y UN BORDE QUE SE MIDE EN VEZ DE DECIDIRSE ────────────────────────────
 * Tres nombres del catálogo llevan paréntesis: «Sphynx (Esfinge)», «Birmano
 * (Birman)», «Turkish Angora (Angora Turco)». Un modelo que conteste «Sphynx»
 * NO casa con `sphynx esfinge` en exacto. Se reporta **el estricto** (lo que el
 * founder describió) **y aparte** cuánto recuperaría aceptar el nombre de
 * antes del paréntesis — *la decisión es de producto; el número, mío.*
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const DIR = process.env.IA_CONJUNTOS_DIR ?? '.ia-conjuntos';
const MAX_TOKENS = 1000;
const MODELO = process.argv.find((a) => a.startsWith('--modelo='))?.slice(9) ?? 'claude-sonnet-5';
const PRECIO = { 'claude-sonnet-5': { e: 2, s: 10 }, 'claude-haiku-4-5': { e: 1, s: 5 } }[MODELO];
const di = (s) => console.log(s);
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
/** El nombre de antes del paréntesis: «Sphynx (Esfinge)» → «sphynx». */
const sinParentesis = (s) => norm(String(s).replace(/\(.*$/, ''));

function llave() {
  const k = spawnSync('security', ['find-generic-password', '-a', 'medicion', '-s', 'anthropic-medicion', '-w'], { encoding: 'utf8' }).stdout.trim();
  if (!k.startsWith('sk-ant-')) throw new Error('sin llave de medición. PARA.');
  return k;
}

/** El prompt de D **sin la sección del catálogo**, pidiendo NOMBRES. */
function construirPrompt(especie) {
  const src = spawnSync('git', ['show', 'origin/pista/s113-d-1.2:supabase/functions/sugerir-raza/index.ts'], { encoding: 'utf8', maxBuffer: 1 << 24 }).stdout;
  const m = src.match(/function construirPrompt\([^)]*\): string \{\s*return `([\s\S]*?)`\n\}/);
  if (!m) throw new Error('no pude extraer el prompt de D. PARA.');
  let t = m[1].replace(/\$\{especie\}/g, especie);
  // Fuera la lista cerrada y su instrucción de copiar el código.
  t = t.replace(/═══ LOS ÚNICOS CÓDIGOS[\s\S]*?═══ LAS TRES PREGUNTAS/, '═══ LAS TRES PREGUNTAS');
  // Y la salida pasa a ser el NOMBRE en español, no un código.
  t = t.replace(/Respondé SOLO con este JSON[\s\S]*$/,
    `Respondé SOLO con este JSON, sin texto adicional y sin backticks:
{"candidatas":[{"raza":"","confianza":"alta"}],"mestizo":false,"sin_animal":false}

En "raza" va el NOMBRE de la raza en español, como se dice en Latinoamérica
(por ejemplo: "Pastor alemán", "Husky Siberiano", "Bulldog francés"). No hay
lista de la que elegir: escribí el nombre que corresponda. Si no reconocés la
raza, dejá "candidatas" vacío — es una respuesta correcta, no una falla.`);
  if (/\$\{/.test(t) || t.includes('LOS ÚNICOS CÓDIGOS')) throw new Error('el prompt no quedó bien armado. PARA.');
  return t;
}

const cat = JSON.parse(readFileSync(join(DIR, 'cat_razas_slugs.json'), 'utf8'));
const porNombre = new Map(cat.map((r) => [`${r.especie}|${norm(r.nombre)}`, r.slug]));
const porNombreCorto = new Map(cat.map((r) => [`${r.especie}|${sinParentesis(r.nombre)}`, r.slug]));
const conj = JSON.parse(readFileSync(join(DIR, 'razas.json'), 'utf8'));
const clave = llave();

di(`candidato: sugerir-raza SIN catálogo · ${conj.n_casos} fotos · ${MODELO}`);
di(`  el modelo devuelve NOMBRES; la edge los casaría por nombre_norm contra cat_razas\n`);

let t1 = 0, t3 = 0, ev = 0, sinCasar = 0, devueltas = 0, vacias = 0, costo = 0;
let t1Alias = 0, t3Alias = 0, recuperadasPorAlias = 0;
const ms = [], noCasaron = new Map(), detalle = [];

for (const [i, c] of conj.casos.entries()) {
  const b64 = readFileSync(c.ruta).toString('base64');
  const t0 = Date.now();
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': clave, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODELO, max_tokens: MAX_TOKENS, thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }, { type: 'text', text: construirPrompt(c.especie) }] }] }),
  });
  if (!r.ok) { di(`   🔴 ${c.caso}: HTTP ${r.status}`); continue; }
  const j = await r.json();
  const u = j.usage ?? {};
  costo += (u.input_tokens ?? 0) / 1e6 * PRECIO.e + (u.output_tokens ?? 0) / 1e6 * PRECIO.s;
  ms.push(Date.now() - t0);
  let d = null;
  try { d = JSON.parse((j.content ?? []).filter((x) => x.type === 'text').map((x) => x.text).join('').replace(/^```(?:json)?\s*|\s*```$/g, '').trim()); } catch { /* abajo */ }
  if (!d) { di(`   🔴 ${c.caso}: JSON ilegible`); continue; }
  ev += 1;

  const nombres = (d.candidatas ?? []).map((x) => x.raza).filter(Boolean);
  devueltas += nombres.length;
  if (!nombres.length) vacias += 1;

  // ESTRICTO: nombre_norm exacto. Lo que no casa, se descarta.
  const slugs = nombres.map((n) => porNombre.get(`${c.especie}|${norm(n)}`)).filter(Boolean);
  // ALIAS: además el nombre de antes del paréntesis.
  const slugsAlias = nombres.map((n) => porNombre.get(`${c.especie}|${norm(n)}`) ?? porNombreCorto.get(`${c.especie}|${norm(n)}`)).filter(Boolean);
  for (const n of nombres) {
    if (!porNombre.has(`${c.especie}|${norm(n)}`)) {
      sinCasar += 1;
      noCasaron.set(n, (noCasaron.get(n) ?? 0) + 1);
      if (porNombreCorto.has(`${c.especie}|${norm(n)}`)) recuperadasPorAlias += 1;
    }
  }
  if (slugs[0] === c.raza_slug) t1 += 1;
  if (slugs.includes(c.raza_slug)) t3 += 1;
  if (slugsAlias[0] === c.raza_slug) t1Alias += 1;
  if (slugsAlias.includes(c.raza_slug)) t3Alias += 1;
  detalle.push({ caso: c.caso, esperada: c.raza_slug, nombres, slugs });
  if ((i + 1) % 30 === 0) di(`   ${i + 1}/${conj.n_casos}…`);
}

const pct = (a) => ev ? +(a / ev * 100).toFixed(1) : null;
const perc = (xs, q) => { const s = [...xs].sort((a, b) => a - b); const i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return lo === hi ? s[lo] : Math.round(s[lo] + (s[hi] - s[lo]) * (i - lo)); };
const res = { candidato: 'sin catálogo en el prompt', modelo: MODELO, n: ev,
  top1_pct: pct(t1), top3_pct: pct(t3), top1_con_alias_pct: pct(t1Alias), top3_con_alias_pct: pct(t3Alias),
  nombres_devueltos: devueltas, sin_casar: sinCasar, recuperadas_por_alias: recuperadasPorAlias,
  respuestas_vacias: vacias, p50_ms: perc(ms, 0.5), p95_ms: perc(ms, 0.95),
  costo_usd: +costo.toFixed(5), costo_por_foto_usd: +(costo / ev).toFixed(6),
  los_que_no_casaron: [...noCasaron].sort((a, b) => b[1] - a[1]).slice(0, 20), detalle };
writeFileSync(join(DIR, `candidato-sin-catalogo-${new Date().toISOString().replace(/[:.]/g, '-')}.json`), JSON.stringify(res, null, 2));

di('\n══ CANDIDATO · sin catálogo ' + '═'.repeat(30));
di(`  top-1 (nombre_norm estricto)   ${res.top1_pct}%`);
di(`  top-3 (nombre_norm estricto)   ${res.top3_pct}%`);
di(`  top-1 aceptando el alias       ${res.top1_con_alias_pct}%`);
di(`  nombres devueltos              ${devueltas}`);
di(`  🔴 no casaron con el catálogo   ${sinCasar}  (de esos, ${recuperadasPorAlias} los recuperaría el alias)`);
di(`  respuestas vacías              ${vacias}`);
di(`  p50 / p95                      ${res.p50_ms} / ${res.p95_ms} ms`);
di(`  costo por foto                 $${res.costo_por_foto_usd}`);
di(`\n  contra HOY (con catálogo): top-1 82,9 % · $0,0072 · p95 2.656 ms`);
di(`\n  los nombres que MÁS se descartaron:`);
for (const [n, k] of res.los_que_no_casaron.slice(0, 10)) di(`     ${String(k).padStart(3)}×  ${n}`);
