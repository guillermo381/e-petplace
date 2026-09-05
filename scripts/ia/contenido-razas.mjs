/**
 * S113-D · CONTENIDO POR RAZA — se genera UNA VEZ, por Batch, y lo revisa un humano.
 *
 * ── POR QUÉ BATCH Y NO UNA EDGE ─────────────────────────────────────────────
 * Esto no es una pieza de producto: es una CARGA. 105 razas, una sola vez, sin
 * nadie esperando del otro lado. El Batch cuesta **la mitad** y no tiene prisa.
 * *Una edge existe para responderle a alguien que está mirando la pantalla; acá
 *  no hay nadie mirando.*
 *
 * ── 🔴 LO QUE ESTE CONTENIDO NO ES ──────────────────────────────────────────
 * **No es consejo médico y el prompt lo prohíbe explícitamente.** Las
 * predisposiciones se escriben como *lo que se asocia a la raza y conviene
 * conversar con el veterinario*, jamás como un diagnóstico ni como una
 * indicación. Un texto generado que le diga a alguien qué hacer con la salud de
 * su animal es exactamente lo que esta casa no publica.
 *
 * ── 🔴 Y LO QUE PASA CON LO QUE EL MODELO NO SABE ───────────────────────────
 * Una raza que el modelo no reconoce devuelve `conocida:false` y **todo en
 * null**. No hay texto de relleno. *Un párrafo plausible sobre una raza que no
 * existe es peor que ningún párrafo: nadie lo va a poder corregir porque suena
 * bien* (L-139).
 * Consecuencia medida y esperada: **`criollo` va a volver vacío**, y está bien
 * — no se puede decir la «talla adulta» de un mestizo.
 *
 * ── LO QUE HACE Y LO QUE NO ─────────────────────────────────────────────────
 *   --control    valida el arnés SIN gastar una llamada. Incluye el rojo
 *                pedido: una raza inventada tiene que volver vacía.
 *   --construir  lee `cat_razas` y escribe el .jsonl del Batch. Cero llamadas.
 *   --enviar     LO MANDA. Gasta plata. Exige ANTHROPIC_API_KEY.
 *   --recoger ID baja los resultados, los VALIDA y escribe el archivo que A
 *                carga. **A lo guarda con `activo=false` hasta revisión.**
 *
 * Cada fila de salida declara `modelo` y `generado_el` — un texto de IA sin su
 * modelo y su fecha es un texto del que nadie puede decir de dónde salió.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
// Import PEREZOSO a propósito: `lib-conjuntos.mjs` lee `supabase/.temp/project-ref`
// al cargarse, y `--control` NO debe depender de tener el proyecto linkeado.
// *Un control que necesita credenciales para correr es un control que no se corre.*

const DIR = '.ia-conjuntos';
const MODELO = 'claude-sonnet-5';
const MAX_TOKENS = 1500;

// ── EL ESQUEMA CERRADO ──────────────────────────────────────────────────────
const ETAPAS = ['cachorro', 'adulto', 'senior'];

const PROMPT = (nombre, especie) => `Escribís la ficha de una raza para la app de una familia que tiene una mascota.

Raza: "${nombre}" · Especie: ${especie}

═══ ANTES QUE NADA ═══
¿Conocés esta raza con certeza, como una raza definida y reconocida?
Si NO —porque no existe, porque es un nombre genérico (criollo, mestizo, común)
o porque no estás seguro— devolvés "conocida": false y TODOS los demás campos
en null y las listas vacías. **No escribís nada.**
Un párrafo plausible sobre una raza que no conocés es peor que ningún párrafo:
suena bien, así que nadie lo va a corregir.

═══ SI LA CONOCÉS ═══
- origen: de dónde viene y para qué se la criaba. Dos o tres oraciones.
- temperamento: cómo suele ser para convivir. Dos o tres oraciones. Sin
  absolutos: las razas tienen tendencias, los animales tienen carácter.
- talla_adulta: rango de peso y altura típicos, en una línea.
- esperanza_vida: el rango típico, en una línea.
- predisposiciones: hasta cinco condiciones que se ASOCIAN a la raza.
  🔴 CADA UNA SE ESCRIBE COMO ALGO PARA CONVERSAR CON EL VETERINARIO, NUNCA
  COMO UN DIAGNÓSTICO NI COMO UNA INDICACIÓN. No digas qué hacer, no sugieras
  tratamientos, no menciones medicamentos ni dosis. Que la raza tenga una
  predisposición no significa que ESTE animal la tenga.
  Lista vacía si no hay ninguna clara.
- cuidados_por_etapa: qué necesita en cada momento de su vida.
  cachorro / adulto / senior. Dos o tres oraciones cada uno. Cuidados
  GENERALES —ejercicio, pelaje, alimentación, socialización— y donde el tema
  roce la salud, decí que lo vea el veterinario.

═══ LA VOZ ═══
Tuteo neutro, cálido y concreto. Le hablás a una familia, no a un criador ni a
un colega. Sin signos de admiración, sin marketing, sin superlativos, sin
listas dentro de los textos. Frases cortas.

═══ LA SALIDA ═══
Respondé SOLO con este JSON, sin texto adicional y sin backticks:
{"conocida":true,"origen":null,"temperamento":null,"talla_adulta":null,"esperanza_vida":null,"predisposiciones":[],"cuidados_por_etapa":{"cachorro":null,"adulto":null,"senior":null}}`;

// ── EL VALIDADOR ────────────────────────────────────────────────────────────
const txtOnull = (v) => v === null || (typeof v === 'string' && v.trim().length > 0);

export function validarFicha(v) {
  if (typeof v !== 'object' || v === null) return 'no es objeto';
  if (typeof v.conocida !== 'boolean') return 'conocida no es booleano';
  for (const k of ['origen', 'temperamento', 'talla_adulta', 'esperanza_vida']) {
    if (!txtOnull(v[k])) return `${k} inválido`;
  }
  if (!Array.isArray(v.predisposiciones) ||
      !v.predisposiciones.every((x) => typeof x === 'string' && x.trim().length > 0)) {
    return 'predisposiciones inválidas';
  }
  if (v.predisposiciones.length > 5) return 'más de 5 predisposiciones';
  if (typeof v.cuidados_por_etapa !== 'object' || v.cuidados_por_etapa === null) {
    return 'cuidados_por_etapa inválido';
  }
  for (const e of ETAPAS) if (!txtOnull(v.cuidados_por_etapa[e])) return `cuidados.${e} inválido`;
  for (const k of Object.keys(v.cuidados_por_etapa)) {
    if (!ETAPAS.includes(k)) return `etapa desconocida: ${k}`;
  }
  // 🔴 LA REGLA QUE HACE QUE «VACÍO» SIGNIFIQUE ALGO: si no la conoce, no
  // escribe. Un `conocida:false` con texto adentro es la contradicción exacta
  // que el prompt existe para evitar, y pasa de largo si nadie la exige acá.
  if (!v.conocida) {
    const conTexto = ['origen', 'temperamento', 'talla_adulta', 'esperanza_vida']
      .some((k) => v[k] !== null) ||
      v.predisposiciones.length > 0 ||
      ETAPAS.some((e) => v.cuidados_por_etapa[e] !== null);
    if (conTexto) return 'conocida:false PERO trae texto';
  }
  return null;
}

const limpiar = (t) => t.replace(/```json|```/g, '').trim();

// ── MODOS ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const tiene = (f) => args.includes(f);

if (tiene('--control')) {
  console.log('\ncontrol de `contenido-razas` — cero llamadas al modelo\n');
  const base = {
    conocida: true, origen: 'x', temperamento: 'x', talla_adulta: 'x',
    esperanza_vida: 'x', predisposiciones: ['y'],
    cuidados_por_etapa: { cachorro: 'a', adulto: 'b', senior: 'c' },
  };
  const vacia = {
    conocida: false, origen: null, temperamento: null, talla_adulta: null,
    esperanza_vida: null, predisposiciones: [],
    cuidados_por_etapa: { cachorro: null, adulto: null, senior: null },
  };
  const casos = [
    ['ficha completa pasa', base, null],
    ['LA RAZA INVENTADA vuelve VACÍA y pasa', vacia, null],
    ['conocida:false CON texto → rojo', { ...vacia, origen: 'Viene de los Alpes.' }, 'conocida:false PERO trae texto'],
    ['conocida:false con predisposiciones → rojo', { ...vacia, predisposiciones: ['displasia'] }, 'conocida:false PERO trae texto'],
    ['conocida:false con cuidados → rojo', { ...vacia, cuidados_por_etapa: { cachorro: 'x', adulto: null, senior: null } }, 'conocida:false PERO trae texto'],
    ['6 predisposiciones → rojo', { ...base, predisposiciones: ['a', 'b', 'c', 'd', 'e', 'f'] }, 'más de 5 predisposiciones'],
    ['etapa inventada → rojo', { ...base, cuidados_por_etapa: { cachorro: 'a', adulto: 'b', senior: 'c', bebe: 'z' } }, 'etapa desconocida: bebe'],
    ['cadena vacía → rojo', { ...base, origen: '' }, 'origen inválido'],
    ['sin conocida → rojo', { ...base, conocida: undefined }, 'conocida no es booleano'],
  ];
  let v = 0, r = 0;
  for (const [nombre, ficha, esperado] of casos) {
    const got = validarFicha(ficha);
    if (got === esperado) { v++; console.log(`  OK   ${nombre}`); }
    else { r++; console.log(`  ROJO ${nombre} — esperaba ${JSON.stringify(esperado)}, dio ${JSON.stringify(got)}`); }
  }
  console.log(`\n${r === 0 ? 'OK' : 'ROJO'} control contenido-razas — ${v} verdes · ${r} rojos\n`);
  process.exit(r === 0 ? 0 : 1);
}

if (tiene('--construir')) {
  const { claveServicio, URL_BASE } = await import('../ia-conjuntos/lib-conjuntos.mjs');
  const k = claveServicio();
  const res = await fetch(`${URL_BASE}/rest/v1/cat_razas?select=slug,nombre,especie&activo=eq.true&order=especie,slug`,
    { headers: { Authorization: `Bearer ${k}`, apikey: k } });
  if (!res.ok) throw new Error(`cat_razas ${res.status}`);
  const razas = await res.json();

  const peticiones = razas.map((r) => ({
    custom_id: `${r.especie}__${r.slug}`,
    params: {
      model: MODELO,
      max_tokens: MAX_TOKENS,
      // Sin razonamiento: la ficha es redacción con esquema, no atribución
      // espacial. Y en Sonnet 5 omitirlo NO lo apaga (ver _shared/ia/modelos.ts).
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT(r.nombre, r.especie) }] }],
    },
  }));

  mkdirSync(DIR, { recursive: true });
  const ruta = join(DIR, 'batch-razas.jsonl');
  writeFileSync(ruta, peticiones.map((p) => JSON.stringify(p)).join('\n') + '\n');

  const entrada = peticiones.reduce((a, p) => a + Math.ceil(p.params.messages[0].content[0].text.length / 4), 0);
  const salidaEst = razas.length * 600;
  console.log(`\n${razas.length} razas → ${ruta}`);
  console.log(`  entrada ≈ ${entrada} tokens · salida estimada ≈ ${salidaEst} tokens`);
  console.log(`  costo estimado con Batch (mitad): ~$${((entrada / 1e6) * 2 * 0.5 + (salidaEst / 1e6) * 10 * 0.5).toFixed(3)}`);
  console.log('  ⚠️ la salida es ESTIMADA (600 tok/ficha). El costo real sale del `usage` del batch.');
  console.log('\n  para mandarlo:  node scripts/ia/contenido-razas.mjs --enviar\n');
  process.exit(0);
}

/** La llave de medición, del llavero, al momento. Nunca a un archivo ni a un log. */
function llaveAnthropic() {
  try {
    const k = execFileSync('security',
      ['find-generic-password', '-a', 'medicion', '-s', 'anthropic-medicion', '-w'],
      { encoding: 'utf8' }).trim();
    if (k.startsWith('sk-ant-')) return k;
  } catch { /* cae al env */ }
  const e = process.env.ANTHROPIC_API_KEY;
  if (e && e.startsWith('sk-ant-')) return e;
  return null;
}

if (tiene('--enviar')) {
  const key = llaveAnthropic();
  if (!key) {
    console.error('\nPARA: no encontre la llave (llavero `medicion` ni ANTHROPIC_API_KEY).');
    console.error('  Este modo GASTA PLATA y no corre a ciegas.\n');
    process.exit(2);
  }
  const ruta = join(DIR, 'batch-razas.jsonl');
  if (!existsSync(ruta)) { console.error(`\nPARA: no existe ${ruta}. Corré --construir primero.\n`); process.exit(2); }
  const requests = readFileSync(ruta, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const r = await fetch('https://api.anthropic.com/v1/messages/batches', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ requests }),
  });
  const j = await r.json();
  if (!r.ok) { console.error(`\nPARA: el batch rebotó ${r.status}: ${JSON.stringify(j).slice(0, 400)}\n`); process.exit(1); }
  console.log(`\nbatch creado: ${j.id} · ${requests.length} peticiones`);
  console.log(`  seguí con:  node scripts/ia/contenido-razas.mjs --recoger ${j.id}\n`);
  process.exit(0);
}

const iRec = args.indexOf('--recoger');
if (iRec !== -1) {
  const key = llaveAnthropic();
  const id = args[iRec + 1];
  if (!key || !id) { console.error('\nUso: --recoger <batch_id> (la llave sale del llavero)\n'); process.exit(2); }
  const cab = { 'x-api-key': key, 'anthropic-version': '2023-06-01' };
  const est = await (await fetch(`https://api.anthropic.com/v1/messages/batches/${id}`, { headers: cab })).json();
  if (est.processing_status !== 'ended') {
    console.log(`\nel batch todavía corre: ${est.processing_status}. Volvé más tarde.\n`);
    process.exit(0);
  }
  const crudo = await (await fetch(est.results_url, { headers: cab })).text();
  const fichas = [];
  const rechazadas = [];
  const generado_el = new Date().toISOString();
  for (const linea of crudo.trim().split('\n')) {
    const res = JSON.parse(linea);
    const [especie, slug] = res.custom_id.split('__');
    if (res.result?.type !== 'succeeded') { rechazadas.push({ slug, motivo: res.result?.type ?? 'sin resultado' }); continue; }
    const texto = res.result.message.content.find((b) => b.type === 'text')?.text ?? '';
    let ficha;
    try { ficha = JSON.parse(limpiar(texto)); } catch { rechazadas.push({ slug, motivo: 'no parsea' }); continue; }
    const mal = validarFicha(ficha);
    if (mal) { rechazadas.push({ slug, motivo: mal }); continue; }
    // Cada texto declara de dónde salió. Sin esto, dentro de seis meses nadie
    // puede decir con qué modelo se escribió ni cuándo.
    fichas.push({ especie, raza_codigo: slug, ...ficha, modelo: est.model ?? MODELO, generado_el });
  }
  // ── ia_uso: lo que este batch COSTÓ, en el mismo ledger que todo lo demás ──
  // 🔴 Este script NO pasa por `llamarModelo` —habla directo con la API de
  // Batches, que la puerta no cubre— así que si no escribe acá, **el gasto no
  // existe para la casa**. Una carga de 100 llamadas que no queda en el ledger
  // es justo el agujero que `ia_uso` vino a tapar.
  //
  // ⚠️ El costo va a la MITAD: la tabla de precios de E es de precio estándar y
  // el Batch cuesta la mitad. Se declara acá porque un costo de batch cargado a
  // precio de lista infla el ledger al doble.
  const { claveServicio, URL_BASE } = await import('../ia-conjuntos/lib-conjuntos.mjs');
  const clave = claveServicio();
  // Los precios salen de la tabla de E, no de una copia mia. Si el modelo no
  // esta en su tabla, el costo va NULL -- no se estima con un numero de memoria.
  const mP = readFileSync('supabase/functions/_shared/ia/precios.ts', 'utf8')
    .match(new RegExp(`'${MODELO}':\\s*\\{ entrada: ([0-9.]+), salida: ([0-9.]+)`));
  if (!mP) console.error(`  ADVERTENCIA: ${MODELO} no esta en la tabla de precios; el costo va NULL.`);
  const pEntrada = mP ? Number(mP[1]) : null, pSalida = mP ? Number(mP[2]) : null;

  const filasUso = [];
  for (const linea of crudo.trim().split('\n')) {
    const res = JSON.parse(linea);
    const ok = res.result?.type === 'succeeded';
    const u = ok ? (res.result.message.usage ?? {}) : {};
    const entrada = u.input_tokens ?? null, salidaTok = u.output_tokens ?? null;
    filasUso.push({
      pieza: 'contenido_raza',
      modelo: MODELO,
      // No es una edge: es una carga por Batch. Se dice lo que es.
      edge: 'batch:contenido-razas',
      resultado: ok ? 'ok' : 'error_proveedor',
      tokens_entrada: entrada,
      tokens_salida: salidaTok,
      tokens_cache_lectura: u.cache_read_input_tokens ?? null,
      tokens_cache_escritura: u.cache_creation_input_tokens ?? null,
      // NULL a propósito: un batch no tiene latencia por petición, y poner la
      // del lote entero en cada fila mentiría 100 veces.
      latencia_ms: null,
      costo_estimado_usd: entrada === null || pEntrada === null ? null
        : Math.round(((entrada / 1e6) * pEntrada + ((salidaTok ?? 0) / 1e6) * pSalida) * 0.5 * 1e6) / 1e6,
    });
  }
  const resUso = await fetch(`${URL_BASE}/rest/v1/ia_uso`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clave}`, apikey: clave, 'content-type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(filasUso),
  });
  const costoReal = filasUso.reduce((a, f) => a + (f.costo_estimado_usd ?? 0), 0);
  console.log(`\nia_uso: ${resUso.ok ? filasUso.length + ' filas escritas' : 'NO se pudo escribir (' + resUso.status + ')'}`);
  console.log(`  tokens: ${filasUso.reduce((a, f) => a + (f.tokens_entrada ?? 0), 0)} entrada · ${filasUso.reduce((a, f) => a + (f.tokens_salida ?? 0), 0)} salida`);
  console.log(`  COSTO REAL (batch, mitad de precio): $${costoReal.toFixed(4)}`);

  mkdirSync(DIR, { recursive: true });
  const salida = join(DIR, 'contenido-razas.json');
  writeFileSync(salida, JSON.stringify({ generado_el, modelo: MODELO, fichas, rechazadas }, null, 2));
  const vacias = fichas.filter((f) => !f.conocida).length;
  console.log(`\n${fichas.length} fichas válidas (${vacias} vacías por raza no reconocida) · ${rechazadas.length} rechazadas`);
  if (rechazadas.length) console.log('  rechazadas: ' + rechazadas.map((x) => `${x.slug} (${x.motivo})`).join(' · '));
  console.log(`  → ${salida}`);
  console.log('  🔴 A lo carga con activo=false. NADA de esto se publica sin revisión humana.\n');
  process.exit(0);
}

console.log(`
uso:
  --control          valida el arnés, cero llamadas
  --construir        lee cat_razas y escribe el .jsonl del batch
  --enviar           MANDA el batch (gasta plata, exige ANTHROPIC_API_KEY)
  --recoger <id>     baja, VALIDA y escribe el archivo para A
`);
