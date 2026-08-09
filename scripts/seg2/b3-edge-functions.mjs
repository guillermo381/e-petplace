/**
 * S92-BIS · B3 — EDGE FUNCTIONS: quién entra sin JWT, y quién gasta dinero.
 *
 * **«Una función de IA abierta a anónimos es una factura abierta»** (arranque).
 * Así que se separan dos preguntas que se confunden fácil:
 *   ① ¿exige JWT? — `verify_jwt` del despliegue
 *   ② si NO lo exige, ¿tiene su propio guard adentro? — **camino real**
 *
 * `verify_jwt: false` no es un defecto por sí solo: los papeles se sirven por
 * un token propio en la URL (como un enlace firmado) y los despachadores los
 * llama el cron. **Lo que sería un defecto es que además no tuvieran guard.**
 * Por eso cada una se llama de verdad, sin credencial, y se lee el rebote.
 */
import { rest, tokenDe, guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';
import { readFileSync } from 'node:fs';

const SIN_JWT = [
  ['documento-carnet', 'papel clínico (PDF)'],
  ['documento-historia-clinica', 'papel clínico (PDF)'],
  ['documento-receta', 'papel clínico (PDF)'],
  ['documento-ficha-identidad', 'papel clínico (PDF)'],
  ['documento-certificado', 'papel clínico (PDF)'],
  ['despachar-push', 'despachador (lo llama el cron)'],
  ['despachar-whatsapp', 'despachador (lo llama el cron)'],
];
const CON_JWT = [
  ['extract-vacuna', '💸 IA — Claude Sonnet'],
  ['estructurar-nota-clinica', '💸 IA — Claude Sonnet'],
  ['chat-ayuda', '💸 IA'],
  ['escribir-presencia', '💸 IA — el escriba'],
  ['lugares', '💸 Google Places (facturable)'],
  ['crear_cliente_walkin', 'alta de cliente'],
];

const filas = [];
const anotar = (fn, id, obtenido, ok) => {
  filas.push({ fn, id, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(46)} ${obtenido}`);
};

async function llamar(slug, opciones = {}) {
  const { token, cuerpo } = opciones;
  const headers = { 'Content-Type': 'application/json' };
  if (token !== null) headers.Authorization = `Bearer ${token ?? ANON}`;
  if (token !== null) headers.apikey = ANON;
  const r = await fetch(`${URL}/functions/v1/${slug}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(cuerpo ?? {}),
  });
  return { status: r.status, cuerpo: (await r.text()).slice(0, 180) };
}

linea('\n══ B3 · ① LAS 7 CON `verify_jwt: false` — ¿tienen guard propio? ══\n');
for (const [slug, que] of SIN_JWT) {
  // sin NINGUNA credencial: ni apikey ni Authorization
  const r = await llamar(slug, { token: null });
  const rebota = r.status >= 400;
  anotar(slug, `${slug} (${que})`, `HTTP ${r.status} ${rebota ? 'rebota' : '⚠️ RESPONDE'} · ${r.cuerpo.slice(0, 70)}`, rebota);
}

linea('\n══ ② LAS QUE GASTAN DINERO — ¿exigen JWT de verdad? ══\n');
for (const [slug, que] of CON_JWT) {
  const r = await llamar(slug, { token: null });
  const rebota = r.status === 401 || r.status === 403;
  anotar(slug, `${slug} ${que}`, `sin credencial → HTTP ${r.status} ${rebota ? 'REBOTA' : '⚠️'}`, rebota);
}

linea('\n══ ③ ¿Y CON LA ANON KEY DEL BUNDLE? (la que cualquiera tiene) ══\n');
for (const [slug, que] of CON_JWT.filter((x) => x[1].startsWith('💸'))) {
  const r = await llamar(slug, {});
  // 401 = el gate cortó · otra cosa = entró al cuerpo (y ahí puede gastar)
  const cortó = r.status === 401 || r.status === 403;
  anotar(slug, `${slug} con anon key`, `HTTP ${r.status} ${cortó ? 'REBOTA' : '⚠️ ENTRÓ AL CUERPO'} · ${r.cuerpo.slice(0, 60)}`, cortó);
}

// ── ④ EL MURO DEL ESCRIBA sigue en el prompt de SISTEMA ────────────────────
linea('\n══ ④ EL MURO DEL ESCRIBA (§8.3) — ¿sigue en el prompt de SISTEMA? ══\n');
{
  const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
  for (const [archivo, rotulo] of [
    ['supabase/functions/escribir-presencia/index.ts', 'el escriba'],
    ['supabase/functions/estructurar-nota-clinica/index.ts', 'la nota clínica'],
  ]) {
    try {
      const txt = readFileSync(`${RAIZ}/${archivo}`, 'utf8');
      const tieneSystem = /system\s*:/.test(txt);
      // el muro: la IA no agrega contenido que no fue dictado
      const muro = /jam[áa]s|nunca|no invent|no agregu|solo con lo que|null si no/i.test(txt);
      const enSystem = (() => {
        const i = txt.search(/system\s*:/);
        if (i === -1) return false;
        const bloque = txt.slice(i, i + 3000);
        return /jam[áa]s|nunca|no invent|no agregu|null/i.test(bloque);
      })();
      anotar(archivo, `${rotulo}: muro en el prompt de SISTEMA`, `system: ${tieneSystem} · muro en el archivo: ${muro} · muro DENTRO del system: ${enSystem}`, tieneSystem && enSystem);
    } catch {
      anotar(archivo, `${rotulo}`, 'no se pudo leer el archivo', false);
    }
  }
}

guardarSeg2('b3-edge-functions.json', filas);
const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} a mirar ──`);
if (rojos.length) for (const r of rojos) linea(`   🔴 ${r.id}: ${r.obtenido}`);
linea('');
