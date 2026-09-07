#!/usr/bin/env node
/**
 * predisposiciones — S113-D, lote 2.1 · D4.
 *
 * De las fichas de raza YA generadas saca las predisposiciones **estructuradas**
 * contra la lista blanca de A (`cat_predisposiciones`, 10 códigos).
 *
 * ── POR QUÉ NO SE HACE CON UN `includes` ───────────────────────────────────
 * Las fichas dicen «displasia de cadera», «luxación de rótula», «problemas
 * articulares», «síndrome braquicefálico». Mapear eso a `cadera` o
 * `respiracion` es leer, no comparar cadenas — y un `includes('cadera')` se
 * pierde «articular» y se come «cadera» dentro de otra frase.
 *
 * ── LO QUE ESTE PASO NO HACE ───────────────────────────────────────────────
 * **No decide que una raza tiene una predisposición: dice que su ficha lo
 * dice.** Por eso cada fila lleva `confianza` y `evidencia` —el fragmento de la
 * ficha que la sostiene— y **A la carga para revisión, nunca activa**. La
 * cadena entera es: modelo → ficha → aviso a una familia, y en esa cadena
 * ningún eslabón puede ser una suposición sin su cita.
 *
 *   node scripts/ia/predisposiciones.mjs --construir | --enviar | --recoger ID
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const DIR = '.ia-conjuntos';
const MODELO = 'claude-sonnet-5';
const MAX_TOKENS = 400;
const tiene = (f) => process.argv.includes(f);

const PROMPT = (raza, especie, ficha, codigos) => `Leés la ficha de una raza y decís cuáles de estas
predisposiciones NOMBRA. No las inferís: las LEÉS.

═══ LOS ÚNICOS CÓDIGOS ═══
${codigos.map((c) => `  "${c.codigo}"  —  ${c.nombre}: ${c.descripcion_familia}`).join('\n')}

═══ LA FICHA ═══
Raza: ${raza} (${especie})
Predisposiciones que la ficha lista: ${ficha.predisposiciones?.length ? ficha.predisposiciones.join(' · ') : '(ninguna)'}
Cuidados: ${[ficha.cuidados_por_etapa?.adulto, ficha.cuidados_por_etapa?.senior].filter(Boolean).join(' ') || '(nada)'}

═══ CÓMO ═══
· Un código entra SÓLO si la ficha nombra algo que le corresponde. "Displasia de
  cadera" → "cadera". "Síndrome braquicefálico" → "respiracion". "Luxación de
  rótula" → NINGUNO de la lista (es rodilla, y rodilla no está).
· "evidencia" es el FRAGMENTO de la ficha que lo sostiene, copiado. Sin
  fragmento no hay código.
· "confianza": "alta" si la ficha lo nombra derecho; "media" si lo dice de
  costado; "baja" si estás estirando. **Si estarías estirando, mejor no lo
  pongas.**
· Si la ficha no nombra ninguna, devolvés la lista vacía. Es una respuesta
  correcta: hay razas sin predisposiciones conocidas.

Respondé SOLO {"predisposiciones":[{"codigo":"…","evidencia":"…","confianza":"…"}]}`;

const CONFIANZAS = ['alta', 'media', 'baja'];

/** Valida contra la lista blanca. Un código fuera se DESCARTA con su motivo:
 *  no se acerca al más parecido — acercar sería inventar la patología. */
export function validar(v, codigos) {
  if (typeof v !== 'object' || v === null) return { ok: false, motivo: 'no es objeto' };
  const cod = typeof v.codigo === 'string' ? v.codigo.trim() : '';
  if (!codigos.includes(cod)) return { ok: false, motivo: `código fuera de la lista: ${cod || '(vacío)'}` };
  const ev = typeof v.evidencia === 'string' ? v.evidencia.trim() : '';
  if (!ev) return { ok: false, motivo: 'sin evidencia: un código sin su fragmento es una suposición' };
  const cf = typeof v.confianza === 'string' && CONFIANZAS.includes(v.confianza) ? v.confianza : 'baja';
  return { ok: true, fila: { codigo: cod, evidencia: ev, confianza: cf } };
}

if (tiene('--control')) {
  const C = ['cadera', 'corazon'];
  const casos = [
    ['código válido con evidencia', { codigo: 'cadera', evidencia: 'displasia de cadera', confianza: 'alta' }, true],
    ['código fuera de la lista', { codigo: 'rodilla', evidencia: 'luxación', confianza: 'alta' }, false],
    ['🔴 sin evidencia → descarta', { codigo: 'cadera', confianza: 'alta' }, false],
    ['evidencia vacía → descarta', { codigo: 'cadera', evidencia: '   ', confianza: 'alta' }, false],
    ['confianza inventada → cae a baja', { codigo: 'corazon', evidencia: 'soplo', confianza: 'segurisima' }, true],
    ['no es objeto', 'cadera', false],
  ];
  let v = 0, r = 0;
  for (const [n, x, esperado] of casos) {
    const got = validar(x, C).ok === esperado;
    if (got) { v++; console.log(`  OK   ${n}`); } else { r++; console.log(`  ROJO ${n}`); }
  }
  const baja = validar({ codigo: 'corazon', evidencia: 'soplo', confianza: 'segurisima' }, C);
  if (baja.ok && baja.fila.confianza === 'baja') { v++; console.log('  OK   ...y la confianza inventada queda en `baja`'); }
  else { r++; console.log('  ROJO la confianza inventada no cayó a `baja`'); }
  console.log(`\n${r === 0 ? 'OK' : 'ROJO'} control predisposiciones — ${v} verdes · ${r} rojos\n`);
  process.exit(r === 0 ? 0 : 1);
}

const llave = () => execFileSync('security', ['find-generic-password', '-a', 'medicion', '-s', 'anthropic-medicion', '-w']).toString().trim();
const RUTA = join(DIR, 'batch-predisposiciones.jsonl');

if (tiene('--construir')) {
  const { claveServicio, URL_BASE } = await import('../ia-conjuntos/lib-conjuntos.mjs');
  const k = claveServicio();
  const cat = await (await fetch(`${URL_BASE}/rest/v1/cat_predisposiciones?select=codigo,nombre,descripcion_familia&activo=is.true&order=codigo`,
    { headers: { Authorization: `Bearer ${k}`, apikey: k } })).json();
  const fichas = [];
  for (const f of ['contenido-razas.json', 'contenido-razas-s113.json']) {
    const ruta = join(DIR, f);
    if (existsSync(ruta)) fichas.push(...JSON.parse(readFileSync(ruta, 'utf8')).fichas);
  }
  // Sólo las que la ficha reconoce: una vacía no tiene de dónde leer nada.
  const utiles = fichas.filter((f) => f.conocida && f.raza_codigo);
  const peticiones = utiles.map((f) => ({
    custom_id: `${f.especie}__${f.raza_codigo}`,
    params: {
      model: MODELO, max_tokens: MAX_TOKENS, thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT(f.raza_codigo, f.especie, f, cat) }] }],
    },
  }));
  mkdirSync(DIR, { recursive: true });
  writeFileSync(RUTA, peticiones.map((p) => JSON.stringify(p)).join('\n') + '\n');
  const entrada = peticiones.reduce((a, p) => a + Math.ceil(p.params.messages[0].content[0].text.length / 3), 0);
  console.log(`\n${utiles.length} fichas (de ${fichas.length}; ${fichas.length - utiles.length} vacías) → ${RUTA}`);
  console.log(`  ${cat.length} códigos en la lista blanca`);
  console.log(`  entrada ≈ ${entrada} tok · costo estimado (batch) ~$${((entrada / 1e6) * 2 * 0.5 + (utiles.length * 120 / 1e6) * 10 * 0.5).toFixed(3)}`);
  console.log('\n  para mandarlo:  node scripts/ia/predisposiciones.mjs --enviar\n');
  process.exit(0);
}

if (tiene('--enviar')) {
  const requests = readFileSync(RUTA, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const r = await fetch('https://api.anthropic.com/v1/messages/batches', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': llave(), 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ requests }),
  });
  const j = await r.json();
  if (!r.ok) { console.error(JSON.stringify(j).slice(0, 300)); process.exit(1); }
  console.log(`batch creado: ${j.id} · ${requests.length} peticiones`);
  console.log(`  seguí con:  node scripts/ia/predisposiciones.mjs --recoger ${j.id}\n`);
  process.exit(0);
}

const idx = process.argv.indexOf('--recoger');
if (idx >= 0) {
  const id = process.argv[idx + 1];
  const key = llave();
  const b = await (await fetch(`https://api.anthropic.com/v1/messages/batches/${id}`,
    { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } })).json();
  if (b.processing_status !== 'ended') { console.log(`todavía ${b.processing_status}`); process.exit(1); }
  const txt = await (await fetch(b.results_url, { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } })).text();
  const { claveServicio, URL_BASE } = await import('../ia-conjuntos/lib-conjuntos.mjs');
  const k = claveServicio();
  const codigos = (await (await fetch(`${URL_BASE}/rest/v1/cat_predisposiciones?select=codigo&activo=is.true`,
    { headers: { Authorization: `Bearer ${k}`, apikey: k } })).json()).map((c) => c.codigo);

  const filas = [], descartadas = [];
  let inTot = 0, outTot = 0, sinNinguna = 0;
  for (const linea of txt.trim().split('\n')) {
    const res = JSON.parse(linea);
    const [especie, raza_codigo] = res.custom_id.split('__');
    const m = res.result?.message;
    if (!m) { descartadas.push({ raza_codigo, motivo: 'sin respuesta' }); continue; }
    inTot += m.usage.input_tokens; outTot += m.usage.output_tokens;
    let d;
    try { d = JSON.parse(m.content[0].text.replace(/```json|```/g, '').trim()); } catch {
      descartadas.push({ raza_codigo, motivo: 'no parsea' }); continue;
    }
    const lista = Array.isArray(d.predisposiciones) ? d.predisposiciones : [];
    if (!lista.length) sinNinguna++;
    for (const p of lista) {
      const v = validar(p, codigos);
      if (v.ok) filas.push({ especie, raza_codigo, ...v.fila, fuente: 'ficha', modelo: MODELO });
      else descartadas.push({ raza_codigo, motivo: v.motivo });
    }
  }
  const costo = (inTot * 2) / 1e6 * 0.5 + (outTot * 10) / 1e6 * 0.5;
  const salida = join(DIR, 'predisposiciones-por-raza.json');
  writeFileSync(salida, JSON.stringify({ generado_el: new Date().toISOString(), modelo: MODELO, filas, descartadas }, null, 2));
  console.log(`\ntokens: ${inTot} entrada · ${outTot} salida · COSTO REAL (batch) $${costo.toFixed(4)}`);
  console.log(`${filas.length} filas válidas sobre ${new Set(filas.map((f) => f.raza_codigo)).size} razas · ${sinNinguna} razas sin ninguna (correcto)`);
  console.log(`${descartadas.length} descartadas`);
  const porCodigo = {};
  for (const f of filas) porCodigo[f.codigo] = (porCodigo[f.codigo] ?? 0) + 1;
  console.log('  ' + Object.entries(porCodigo).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}=${n}`).join(' · '));
  console.log(`  → ${salida}`);
  console.log('  🔴 A las carga PARA REVISIÓN. Esto NO decide que una raza tenga una');
  console.log('     predisposición: dice que su ficha lo dice, y guarda el fragmento.');
}
