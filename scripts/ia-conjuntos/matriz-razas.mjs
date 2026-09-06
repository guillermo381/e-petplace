#!/usr/bin/env node
/**
 * matriz-razas — S113-E, lote 1.2 · `sugerir-raza` con Haiku 4.5 y Sonnet 5.
 *
 * `sugerir-raza` **NO está desplegada** (medido: 404 en la edge). El prompt vive
 * en `origin/pista/s113-d-1.2` y se lee de ahí en cada corrida — copiarlo lo
 * dejaría envejecer en silencio el día que D lo toque. La llamada va a la API
 * con la llave de MEDICIÓN, que es lo único que permite variar el modelo con
 * todo lo demás igual.
 *
 * ── LOS TRES CASOS SIN ANIMAL SALEN DE OTRO CONJUNTO, Y SON GRATIS ─────────
 * El conjunto de razas son fotos de mascotas: **no puede medir qué hace el
 * modelo cuando NO hay un animal**, que es la primera de las tres preguntas del
 * prompt. Los tomo del conjunto de carnets, donde ya hay una **captura de
 * pantalla de la app** y **carnets de papel**. *Un guard que nunca ve su caso no
 * está medido.*
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const DIR = process.env.IA_CONJUNTOS_DIR ?? '.ia-conjuntos';
const MAX_TOKENS = 1000;
const PRECIOS = { 'claude-sonnet-5': { e: 2, s: 10 }, 'claude-haiku-4-5': { e: 1, s: 5 } };
const di = (s) => console.log(s);
const argT = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };

function llave() {
  const k = spawnSync('security', ['find-generic-password', '-a', 'medicion', '-s', 'anthropic-medicion', '-w'], { encoding: 'utf8' }).stdout.trim();
  if (!k.startsWith('sk-ant-')) throw new Error('sin llave de medición en el llavero. PARA.');
  return k;
}
/** El prompt de D, leído de su rama. Si no se puede leer, PARA. */
function construirPrompt(especie, razas) {
  const src = spawnSync('git', ['show', 'origin/pista/s113-d-1.2:supabase/functions/sugerir-raza/index.ts'], { encoding: 'utf8', maxBuffer: 1 << 24 }).stdout;
  const m = src.match(/function construirPrompt\([^)]*\): string \{\s*return `([\s\S]*?)`\n\}/);
  if (!m) throw new Error('no pude extraer construirPrompt de la rama de D. PARA.');
  /* 🔴 EL PROMPT CAMBIÓ ENTRE MI PRIMERA CORRIDA Y EL DESPLIEGUE, y no lo vi
     porque mi reemplazo sólo conocía la forma vieja. La vieja listaba los
     códigos con `codigos.join(' · ')`; la desplegada lista PARES
     `"slug"  —  Nombre`, uno por línea — más del doble de tokens de entrada.
     *Leer el prompt de la rama en cada corrida no alcanza si el reemplazo está
     atado a UNA forma del template: el gate se vuelve mudo justo cuando el
     template cambia, que es cuando más falta hace.* Por eso ahora se prueban
     las dos formas y **si ninguna coincide, PARA** en vez de mandar un prompt
     con `${...}` sin reemplazar. */
  const cat = razas.map((r) => `  "${r.slug}"  —  ${r.nombre}`).join('\n');
  let t = m[1].replace(/\$\{especie\}/g, especie);
  const antes = t;
  t = t.replace(/\$\{catalogo\.map\(\(r\) => `  "\$\{r\.slug\}"  —  \$\{r\.nombre\}`\)\.join\('\\n'\)\}/g, cat)
       .replace(/\$\{codigos\.join\(' · '\)\}/g, razas.map((r) => r.slug).join(' · '));
  if (t === antes || /\$\{/.test(t)) {
    throw new Error('el template del prompt cambió de forma y mi reemplazo no lo cubre. PARA — mandar un prompt sin reemplazar mediría otra cosa.');
  }
  return t;
}

const cat = JSON.parse(readFileSync(join(DIR, 'cat_razas_slugs.json'), 'utf8'));
const razasDe = { perro: cat.filter((r) => r.especie === 'perro'), gato: cat.filter((r) => r.especie === 'gato') };
const codigos = { perro: razasDe.perro.map((r) => r.slug), gato: razasDe.gato.map((r) => r.slug) };
const conj = JSON.parse(readFileSync(join(DIR, 'razas.json'), 'utf8'));

/** Casos SIN ANIMAL, prestados del conjunto de carnets. */
const SIN_ANIMAL = [
  { caso: 'captura-de-la-app.jpg', ruta: join(DIR, 'imagenes-carnets-reales', 'carnet-1788568358368.jpg'), especie: 'perro', esperado: 'sin_animal' },
  { caso: 'carnet-de-papel.jpg', ruta: join(DIR, 'imagenes-carnets-reales', 'carnet-1788570154927.jpg'), especie: 'perro', esperado: 'sin_animal' },
].filter((c) => existsSync(c.ruta));

const clave = llave();
const modelos = argT('modelos', 'claude-sonnet-5,claude-haiku-4-5').split(',');
const casos = [...conj.casos, ...SIN_ANIMAL];
di(`matriz-razas · ${conj.n_casos} fotos de ${conj.n_razas_medibles} razas + ${SIN_ANIMAL.length} sin animal\n`);

const salida = {};
for (const modelo of modelos) {
  di(`── ${modelo} ──────────────────────`);
  let top1 = 0, top3 = 0, evaluados = 0, invalidos = 0, vacias = 0, mestizos = 0;
  let aciertoSinAnimal = 0, falsoAnimal = 0, costo = 0;
  const ms = [], detalle = [];
  for (const [i, c] of casos.entries()) {
    const prompt = construirPrompt(c.especie, razasDe[c.especie]);
    const b64 = readFileSync(c.ruta).toString('base64');
    const t0 = Date.now();
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': clave, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: modelo, max_tokens: MAX_TOKENS, thinking: { type: 'disabled' },
        messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }, { type: 'text', text: prompt }] }] }),
    });
    const t = Date.now() - t0;
    if (!r.ok) { di(`   🔴 ${c.caso}: HTTP ${r.status}`); continue; }
    const j = await r.json();
    const u = j.usage ?? {}; const p = PRECIOS[modelo];
    costo += (u.input_tokens ?? 0) / 1e6 * p.e + (u.output_tokens ?? 0) / 1e6 * p.s;
    ms.push(t);
    let d = null;
    try { d = JSON.parse((j.content ?? []).filter((x) => x.type === 'text').map((x) => x.text).join('').replace(/^```(?:json)?\s*|\s*```$/g, '').trim()); } catch { /* abajo */ }
    if (!d) { di(`   🔴 ${c.caso}: JSON ilegible`); continue; }
    const cands = (d.candidatas ?? []).map((x) => x.raza_codigo);
    const fuera = cands.filter((x) => !codigos[c.especie].includes(x));
    invalidos += fuera.length;

    if (c.esperado === 'sin_animal') {
      if (d.sin_animal === true) aciertoSinAnimal += 1; else falsoAnimal += 1;
      detalle.push({ caso: c.caso, sin_animal: d.sin_animal, candidatas: cands });
      continue;
    }
    evaluados += 1;
    if (!cands.length) vacias += 1;
    if (d.mestizo) mestizos += 1;
    if (cands[0] === c.raza_slug) top1 += 1;
    if (cands.includes(c.raza_slug)) top3 += 1;
    detalle.push({ caso: c.caso, esperada: c.raza_slug, devueltas: cands, mestizo: !!d.mestizo, ok1: cands[0] === c.raza_slug, ok3: cands.includes(c.raza_slug) });
    if ((i + 1) % 25 === 0) di(`   ${i + 1}/${casos.length}…`);
  }
  const pct = (a, b) => b ? +(a / b * 100).toFixed(1) : null;
  const perc = (xs, q) => { const s = [...xs].sort((a, b) => a - b); const i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return lo === hi ? s[lo] : Math.round(s[lo] + (s[hi] - s[lo]) * (i - lo)); };
  salida[modelo] = { evaluados, top1_pct: pct(top1, evaluados), top3_pct: pct(top3, evaluados),
    codigos_invalidos: invalidos, respuestas_vacias: vacias, marcadas_mestizo: mestizos,
    sin_animal: { acierto: aciertoSinAnimal, de: SIN_ANIMAL.length, falso_animal: falsoAnimal },
    p50_ms: perc(ms, 0.5), p95_ms: perc(ms, 0.95), costo_usd: +costo.toFixed(5), costo_por_foto_usd: +(costo / ms.length).toFixed(6), detalle };
  di('');
}
mkdirSync(DIR, { recursive: true });
const ruta = join(DIR, `matriz-razas-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
writeFileSync(ruta, JSON.stringify({ conjunto: conj.nombre, max_tokens: MAX_TOKENS, razonamiento: false, modelos: salida }, null, 2));

di('══ TABLA ' + '═'.repeat(50));
const fila = (et, f) => di(`  ${et.padEnd(26)} ${modelos.map((m) => String(f(salida[m])).padStart(14)).join(' ')}`);
di(`  ${'métrica'.padEnd(26)} ${modelos.map((m) => m.replace('claude-', '').padStart(14)).join(' ')}`);
fila('acierto TOP-1', (s) => s.top1_pct + '%');
fila('acierto TOP-3', (s) => s.top3_pct + '%');
fila('códigos inválidos', (s) => s.codigos_invalidos);
fila('respuestas vacías', (s) => s.respuestas_vacias);
fila('marcadas mestizo', (s) => s.marcadas_mestizo);
fila('sin animal (acierto)', (s) => `${s.sin_animal.acierto}/${s.sin_animal.de}`);
fila('p95 (ms)', (s) => s.p95_ms);
fila('costo por foto', (s) => '$' + s.costo_por_foto_usd);
fila('costo total', (s) => '$' + s.costo_usd);
di(`\n  → ${ruta}`);
