/**
 * S113-D-2.1 · LA MATRIZ DEL CARNET — v1 × v2 × Sonnet × Haiku, contra el
 * modelo REAL.
 *
 * ── 🔴 QUÉ REPORTA Y QUÉ NO ────────────────────────────────────────────────
 * Reporta lo que NO necesita una referencia: **latencia, tokens, costo y
 * cuántas filas devuelve cada variante**. **NO reporta exactitud**, porque la
 * referencia todavía no está firmada — la vieja está contaminada (`D-1012`
 * enmendada) y la nueva espera la segunda mano de E y el arbitraje del founder.
 * *Un porcentaje de acierto contra una vara torcida es un número peor que
 * ningún número, porque parece que mide.*
 *
 * ── LA LLAVE ───────────────────────────────────────────────────────────────
 * Se lee del llavero EN EL MOMENTO y **no se escribe ni se imprime nunca**.
 * Ningún despliegue la usa: esto habla directo con la API.
 *
 * ── ⚠️ GASTA PLATA ─────────────────────────────────────────────────────────
 * Una llamada por celda. Sin `--simular` no se corre por accidente.
 *
 *   node scripts/ia/matriz-carnet.mjs --simular   (cuenta celdas y costo, 0 llamadas)
 *   node scripts/ia/matriz-carnet.mjs --correr
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const SALIDA = '.ia-conjuntos/matriz';
const CARNETS = '/tmp/carnets-d10';

/** Del llavero, al momento. Nunca a un archivo, nunca a un log. */
function llaveAnthropic() {
  const k = execFileSync('security',
    ['find-generic-password', '-a', 'medicion', '-s', 'anthropic-medicion', '-w'],
    { encoding: 'utf8' }).trim();
  if (!k.startsWith('sk-ant-')) throw new Error('la llave del llavero no tiene el prefijo esperado. PARA.');
  return k;
}

/** Los precios salen de la tabla de E, no de una copia mía. */
function precios() {
  const s = readFileSync('supabase/functions/_shared/ia/precios.ts', 'utf8');
  const fecha = (s.match(/FECHA_PRECIOS: string \| null = '([^']+)'/) ?? [])[1] ?? null;
  const tabla = {};
  for (const m of s.matchAll(/'([a-z0-9-]+)':\s*\{ entrada: ([\d.]+), salida: ([\d.]+)/g)) {
    tabla[m[1]] = { entrada: +m[2], salida: +m[3] };
  }
  return { tabla, fecha };
}

const DOCS = [
  { doc: 'A', archivo: 'carnet-1783564367515.jpg', mime: 'image/jpeg', filas_vistas: 15 },
  { doc: 'B', archivo: 'carnet-1783633828265.jpg', mime: 'image/jpeg', filas_vistas: 8 },
];

/**
 * Las variantes son PIPELINES COMPLETOS, no prompts sueltos — y eso se declara:
 * v1 y v2 difieren en TRES cosas a la vez (prompt, `max_tokens` y razonamiento).
 * Comparar v1 con v2 responde «¿el pipeline nuevo es mejor?», NO «¿el prompt
 * nuevo es mejor?». La tercera fila es la que aísla el razonamiento
 * (hipótesis (a) del mandato): mismo prompt v2, misma salida, thinking ENCENDIDO.
 */
const VARIANTES = [
  { id: 'v1',      prompt: '/tmp/prompt-v1.txt', max_tokens: 16000, pensar: null,   modelos: ['claude-sonnet-5', 'claude-haiku-4-5'] },
  { id: 'v2',      prompt: '/tmp/prompt-v2.txt', max_tokens: 4000,  pensar: false,  modelos: ['claude-sonnet-5', 'claude-haiku-4-5'] },
  { id: 'v2-razon',prompt: '/tmp/prompt-v2.txt', max_tokens: 4000,  pensar: true,   modelos: ['claude-sonnet-5'] },
  // 🔴 La celda de arriba salio TRUNCADA en las dos: con razonamiento
  // encendido, 4000 tokens se los come el pensamiento y no queda JSON. Una
  // hipotesis medida sobre una celda truncada no esta medida. Esta le da el
  // mismo techo que v1 (16000) para que (a) tenga su medicion limpia: mismo
  // prompt v2, misma imagen, UNA sola variable moviendose -- el razonamiento.
  { id: 'v2-razon16k',prompt: '/tmp/prompt-v2.txt', max_tokens: 16000, pensar: true, modelos: ['claude-sonnet-5'] },
];

const celdas = [];
for (const v of VARIANTES) for (const m of v.modelos) for (const d of DOCS) celdas.push({ ...v, modelo: m, ...d });

const args = process.argv.slice(2);
const { tabla, fecha } = precios();

if (args.includes('--simular') || !args.includes('--correr')) {
  console.log(`\nmatriz del carnet · ${celdas.length} celdas · CERO llamadas en este modo\n`);
  for (const c of celdas) console.log(`  ${c.id.padEnd(9)} ${c.modelo.padEnd(18)} doc ${c.doc}  max_tokens ${String(c.max_tokens).padEnd(6)} razonamiento ${c.pensar === null ? 'default(sonnet=sí)' : c.pensar ? 'SÍ' : 'no'}`);
  console.log(`\n  precios de E, vigencia ${fecha}: ` + Object.entries(tabla).map(([k, p]) => `${k} $${p.entrada}/$${p.salida}`).join(' · '));
  console.log('\n  para correrla de verdad:  node scripts/ia/matriz-carnet.mjs --correr\n');
  process.exit(0);
}

const key = llaveAnthropic();
mkdirSync(SALIDA, { recursive: true });
const filas = [];

for (const c of celdas) {
  const ruta = `${CARNETS}/${c.archivo}`;
  if (!existsSync(ruta)) { console.error(`falta ${ruta} — bajá los carnets primero`); process.exit(2); }
  const b64 = readFileSync(ruta).toString('base64');
  const cuerpo = {
    model: c.modelo,
    max_tokens: c.max_tokens,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: c.mime, data: b64 } },
      { type: 'text', text: readFileSync(c.prompt, 'utf8') },
    ] }],
  };
  // `thinking: disabled` sólo a los modelos que piensan si no se les dice nada.
  if (c.pensar === false && c.modelo === 'claude-sonnet-5') cuerpo.thinking = { type: 'disabled' };
  if (c.pensar === true) cuerpo.thinking = { type: 'adaptive' };

  const t0 = Date.now();
  let r, texto = '', err = null;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(cuerpo),
    });
    texto = await r.text();
  } catch (e) { err = String(e); }
  const ms = Date.now() - t0;

  let usage = {}, salida = '', stop = null, nVac = null, nPlan = null, parsea = false;
  if (!err && r.ok) {
    const j = JSON.parse(texto);
    usage = j.usage ?? {}; stop = j.stop_reason ?? null;
    salida = (j.content ?? []).find((b) => b.type === 'text')?.text ?? '';
    try {
      const p = JSON.parse(salida.replace(/```json|```/g, '').trim());
      parsea = true;
      nVac = Array.isArray(p.vacunas) ? p.vacunas.length : null;
      nPlan = Array.isArray(p.plan_impreso) ? p.plan_impreso.length : null;
    } catch { /* no parsea: queda declarado */ }
  }
  const pr = tabla[c.modelo];
  const costo = pr && usage.input_tokens != null
    ? (usage.input_tokens / 1e6) * pr.entrada + ((usage.output_tokens ?? 0) / 1e6) * pr.salida : null;

  const fila = {
    variante: c.id, modelo: c.modelo, doc: c.doc, filas_vistas_a_ojo: c.filas_vistas,
    http: err ? 0 : r.status, stop_reason: stop, latencia_ms: ms,
    tok_entrada: usage.input_tokens ?? null, tok_salida: usage.output_tokens ?? null,
    costo_usd: costo == null ? null : Math.round(costo * 1e6) / 1e6,
    parsea, n_vacunas: nVac, n_plan_impreso: nPlan, error: err,
  };
  filas.push(fila);
  writeFileSync(`${SALIDA}/${c.id}--${c.modelo}--doc${c.doc}.json`,
    JSON.stringify({ ...fila, salida_cruda: salida }, null, 2));
  console.log(`  ${c.id.padEnd(9)} ${c.modelo.padEnd(18)} doc ${c.doc}  ${String(ms).padStart(6)} ms  in ${String(fila.tok_entrada).padStart(5)}  out ${String(fila.tok_salida).padStart(5)}  $${fila.costo_usd}  vac=${nVac} plan=${nPlan}${parsea ? '' : '  🔴 NO PARSEA'}${stop === 'max_tokens' ? '  🔴 TRUNCADO' : ''}`);
}

writeFileSync(`${SALIDA}/resumen.json`, JSON.stringify({ corrida_el: new Date().toISOString(), precios_vigencia: fecha, filas }, null, 2));
console.log(`\ntotal gastado: $${filas.reduce((a, f) => a + (f.costo_usd ?? 0), 0).toFixed(4)}`);
console.log(`crudos en ${SALIDA}/`);
console.log('\n🔴 SIN EXACTITUD: la referencia no está firmada todavía. Los números de');
console.log('   arriba son latencia, costo y CUÁNTAS filas devuelve cada variante.\n');
