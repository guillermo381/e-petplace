#!/usr/bin/env node
/**
 * razas-por-edge — S113-E · el mismo conjunto, ahora por la edge DESPLEGADA.
 *
 * La matriz del 1.2 corrió por API para poder variar el modelo con todo lo demás
 * igual. Esto es otra pregunta: **¿el número que da lo desplegado coincide con
 * el que medí?** Si no coincidiera, la diferencia sería del transporte o de la
 * configuración de la edge, no del modelo — y eso hay que saberlo antes de
 * firmar nada.
 *
 * Va con sesión de PERSONA a propósito: así el modelo lo elige la edge
 * (`MODELOS.raza`), que es lo que van a usar las familias. Fijarlo desde acá
 * exige `service_role` y mediría otra cosa.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { claveAnon, URL_BASE } from './lib-conjuntos.mjs';

const DIR = process.env.IA_CONJUNTOS_DIR ?? '.ia-conjuntos';
const di = (s) => console.log(s);

/**
 * La CUENTA DE PRUEBA entera — correo y clave — del llavero, servicio
 * `epetplace-cuenta-prueba` (orden del founder, 5-sep). Se lee al momento de
 * usarla y **nunca se imprime**.
 *
 * 🔴 EL CORREO TAMBIÉN SALE DE AHÍ, y eso me costó 146 llamadas fallidas: la
 * primera versión leía la clave nueva del llavero y la mandaba contra el correo
 * **cableado en el código**. La entrada trae la cuenta en su campo `acct`
 * (`demo-prestador@epetplace.dev`), que NO es la que yo tenía escrita.
 * *«La cuenta sale del llavero» incluye la cuenta, no sólo su clave — y una
 * credencial a medias falla como si la clave estuviera mal.*
 *
 * 🔴 Si no está, PARA — **no cae al servicio viejo**. Un respaldo silencioso
 * convertiría la orden en decoración: el día que el llavero no tenga la
 * entrada, el arnés seguiría usando la credencial anterior y nadie se
 * enteraría.
 */
function cuentaDePrueba() {
  const S = 'epetplace-cuenta-prueba';
  const clave = spawnSync('security', ['find-generic-password', '-s', S, '-w'], { encoding: 'utf8' }).stdout.trim();
  // `-g` escribe los metadatos por stderr; de ahí sale la cuenta, no del valor.
  const meta = spawnSync('security', ['find-generic-password', '-s', S], { encoding: 'utf8' }).stdout;
  const correo = meta.match(/"acct"<blob>="([^"]+)"/)?.[1] ?? '';
  if (!clave || !correo) {
    throw new Error(
      `sin \`${S}\` completo en el llavero (correo o clave). El arnés PARA — NO cae al servicio viejo.\n` +
      '  Guardala UNA vez, con la cuenta en -a:\n' +
      `    security add-generic-password -a '<correo>' -s ${S} -w '<clave>'`);
  }
  return { correo, clave };
}

const { correo: CORREO_PRUEBA, clave: pass } = cuentaDePrueba();
if (!pass) { di('🔴 sin clave de siembra. PARA.'); process.exit(2); }
const anon = claveAnon();
const rt = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: anon, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: CORREO_PRUEBA, password: pass }),
});
const { access_token } = await rt.json();

const conj = JSON.parse(readFileSync(join(DIR, 'razas.json'), 'utf8'));
const n = (s) => String(s).toLowerCase().replace(/_/g, '-').replace(/\s/g, '-');
let t1 = 0, t3 = 0, t1n = 0, t3n = 0, ev = 0, invalidos = 0, vacias = 0, fallos = 0;
const ms = [], detalle = [];
const arranque = new Date().toISOString();

di(`razas-por-edge · ${conj.n_casos} fotos · el modelo lo decide la edge\n`);
for (const [i, c] of conj.casos.entries()) {
  const b64 = readFileSync(c.ruta).toString('base64');
  const t0 = Date.now();
  const r = await fetch(`${URL_BASE}/functions/v1/sugerir-raza`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    /* 🔴 `imagenBase64`, en ESPAÑOL — y `extract-vacuna` lo llama `imageBase64`,
       en inglés. Dos edges de la misma casa con dos grafías del mismo campo:
       el rebote es limpio (`cuerpo_invalido`) pero se lo come quien escribe el
       segundo cliente, no quien escribió la inconsistencia. Anotado para D. */
    body: JSON.stringify({ imagenBase64: b64, mediaType: 'image/jpeg', especie: c.especie }),
  });
  const t = Date.now() - t0;
  if (!r.ok) { di(`   🔴 ${c.caso}: HTTP ${r.status} ${(await r.text()).slice(0, 90)}`); fallos += 1; continue; }
  const j = await r.json();
  ms.push(t); ev += 1;
  const cands = (j.candidatas ?? []).map((x) => x.raza_codigo);
  if (!cands.length) vacias += 1;
  // La edge YA valida contra la lista blanca, así que un código inválido no
  // debería salir: si sale, es que la validación no está haciendo su trabajo.
  const catSlugs = conj.casos.filter((x) => x.especie === c.especie).map((x) => x.raza_slug);
  invalidos += cands.filter((x) => !catSlugs.includes(x) && !x.includes('-')).length;
  if (cands[0] === c.raza_slug) t1 += 1;
  if (cands.includes(c.raza_slug)) t3 += 1;
  const csn = cands.map(n);
  if (csn[0] === n(c.raza_slug)) t1n += 1;
  if (csn.includes(n(c.raza_slug))) t3n += 1;
  detalle.push({ caso: c.caso, esperada: c.raza_slug, devueltas: cands, ms: t });
  if ((i + 1) % 30 === 0) di(`   ${i + 1}/${conj.n_casos}…`);
}
const perc = (xs, q) => { const s = [...xs].sort((a, b) => a - b); const i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return lo === hi ? s[lo] : Math.round(s[lo] + (s[hi] - s[lo]) * (i - lo)); };
const pct = (a) => +(a / ev * 100).toFixed(1);

// El costo REAL, de `ia_uso`, emparejado por latencia — otra pista puede estar
// pegando a la misma edge dentro de mi ventana (me pasó en el 1.0).
const sql = `select latencia_ms, costo_estimado_usd from ia_uso where pieza='raza' and created_at >= '${arranque}'::timestamptz`;
const rr = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', sql], { encoding: 'utf8', maxBuffer: 1 << 24 });
let costo = null, filas = 0;
try { const rows = JSON.parse(rr.stdout.slice(rr.stdout.indexOf('{'))).rows; filas = rows.length; costo = +rows.reduce((s, x) => s + Number(x.costo_estimado_usd ?? 0), 0).toFixed(5); } catch { /* lo dice abajo */ }

const res = { corrida_el: arranque, via: 'edge desplegada', n: ev, fallos,
  top1_pct: pct(t1), top3_pct: pct(t3), top1_sin_separador_pct: pct(t1n), top3_sin_separador_pct: pct(t3n),
  codigos_invalidos: invalidos, respuestas_vacias: vacias, p50_ms: perc(ms, 0.5), p95_ms: perc(ms, 0.95),
  costo_usd: costo, filas_ia_uso: filas, detalle };
writeFileSync(join(DIR, `razas-por-edge-${arranque.replace(/[:.]/g, '-')}.json`), JSON.stringify(res, null, 2));

di('\n══ POR LA EDGE ' + '═'.repeat(40));
di(`  top-1 (código exacto)        ${res.top1_pct}%`);
di(`  top-3 (código exacto)        ${res.top3_pct}%`);
di(`  top-1 normalizando separador ${res.top1_sin_separador_pct}%`);
di(`  códigos inválidos            ${res.codigos_invalidos}`);
di(`  respuestas vacías            ${res.respuestas_vacias}`);
di(`  p50 / p95                    ${res.p50_ms} / ${res.p95_ms} ms`);
di(`  costo (ia_uso, ${filas} filas)      $${costo}`);
di(`  fallos                       ${fallos}`);
