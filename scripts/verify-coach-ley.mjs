#!/usr/bin/env node
/**
 * verify:coach-ley — S113-E, lote 2.0 · E6.
 *
 * **El system prompt de Nexo dice la ley, literal — y si alguien la reescribe, ROJO.**
 * Las cláusulas viven en `scripts/nexo/ley.json` con su fuente; el gate las busca en
 * el prompt de la edge.
 *
 * ── POR QUÉ LITERAL Y NO SEMÁNTICO ───────────────────────────────────────────
 * Un gate semántico sobre una ley se lo puede convencer: siempre hay una forma de
 * decir «bueno, esto también quiere decir que no diagnostica». Uno literal no
 * discute — y su falso rojo cuesta **una línea de JSON**, que es exactamente lo
 * que debería costar tocar una ley. *El gate no protege el texto: protege el acto
 * de volver a firmarlo.*
 *
 * ── CÓMO SE LEE EL PROMPT ────────────────────────────────────────────────────
 * Del ARCHIVO de la edge, no de una copia: si alguien edita el prompt, el gate lo
 * ve en el mismo commit. Cotejar contra una copia en el repo mediría mi copia.
 *
 * Salidas: 0 verde · 1 falta una cláusula · 2 NO CONCLUYENTE (la edge no existe).
 *
 *   node scripts/verify-coach-ley.mjs
 *   node scripts/verify-coach-ley.mjs --control
 */
import { readFileSync, existsSync } from 'node:fs';

const EDGE = process.env.COACH_EDGE ?? 'supabase/functions/coach/index.ts';
const LEY = process.env.COACH_LEY ?? 'scripts/nexo/ley.json';
const di = (s) => console.log(s);

/** Normaliza para comparar: minúsculas y sin tildes. La ley no cambia por una tilde. */
export const plano = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Una cláusula está PRESENTE si el prompt contiene **alguna** de sus formas.
 * `debe_decir` es una lista de alternativas a propósito: «no soy un veterinario» y
 * «no soy una veterinaria» son la misma cláusula, y obligar a una sola forma
 * convertiría el gate en un corrector de estilo.
 */
export function faltantes(prompt, clausulas) {
  const p = plano(prompt);
  return clausulas.filter((c) => !c.debe_decir.some((f) => p.includes(plano(f))));
}

/** El system prompt: todo literal de texto largo del archivo de la edge. */
export function promptDeLaEdge(ruta) {
  if (!existsSync(ruta)) return { existe: false, motivo: `no existe \`${ruta}\`` };
  const src = readFileSync(ruta, 'utf8');
  /* Los literales de plantilla y las cadenas largas. Se concatena TODO en vez de
     buscar una variable llamada `SISTEMA`: atarlo a un nombre mediría la
     convención y no el hecho — la casa ya pagó ese error (`verify:jornada-completa`). */
  const trozos = [
    ...src.matchAll(/`([\s\S]{80,}?)`/g),
    ...src.matchAll(/'([^'\n]{80,})'/g),
    ...src.matchAll(/"([^"\n]{80,})"/g),
  ].map((m) => m[1]);
  if (!trozos.length) return { existe: false, motivo: `\`${ruta}\` existe pero no tiene ningún texto largo que pueda ser un prompt` };
  return { existe: true, texto: trozos.join('\n'), trozos: trozos.length };
}

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et, d = '') => { di(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) fallos += 1; };
  const ley = JSON.parse(readFileSync(LEY, 'utf8')).clausulas;

  // Un prompt que dice TODO: cero faltantes.
  const completo = ley.map((c) => `— ${c.debe_decir[0]} —`).join('\n');
  ok(faltantes(completo, ley).length === 0, 'NEGATIVO  un prompt con las 8 cláusulas no tiene faltantes');

  // 🔴 EL POSITIVO, y es el que decide: quitar UNA tiene que salir roja Y NOMBRADA.
  for (const quitada of ['no-diagnostica', 'memorial']) {
    const mutilado = ley.filter((c) => c.id !== quitada).map((c) => `— ${c.debe_decir[0]} —`).join('\n');
    const f = faltantes(mutilado, ley);
    ok(f.length === 1 && f[0].id === quitada, `POSITIVO  sin «${quitada}» sale ROJO y la nombra`, `(${f.map((x) => x.id).join(', ') || 'ninguna'})`);
  }

  // La tilde no es la ley.
  ok(faltantes('NO DIAGNÓSTICA. telemedicina. inteligencia artificial. no soy. esta familia. memorial. menor. tuteo. no es una instrucción.', ley).length === 0,
    'CLASE     mayúsculas y tildes no cambian el veredicto');

  // Y el que impide el verde vacío.
  const r = promptDeLaEdge('supabase/functions/no_existe_s113e/index.ts');
  ok(!r.existe, 'POSITIVO  sin edge el gate NO puede dar verde', `(${r.motivo})`);

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di('✅ nombra la cláusula que falta, y sin objeto sale NO CONCLUYENTE.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
const ley = JSON.parse(readFileSync(LEY, 'utf8')).clausulas;
const p = promptDeLaEdge(EDGE);
if (!p.existe) {
  di(`⚠️ NO CONCLUYENTE — ${p.motivo}.`);
  di(`   La edge \`coach\` todavía no existe. El gate queda escrito y se pone en`);
  di(`   verde/rojo el día que exista. NO es verde: «la ley está» y «no hay prompt`);
  di(`   que mirar» son distintos, y confundirlos es cómo un gate deja de mirarse.`);
  process.exit(2);
}
const f = faltantes(p.texto, ley);
di(`verify:coach-ley · ${EDGE} · ${p.trozos} literal(es) · ${ley.length} cláusulas`);
if (f.length) {
  di(`\n🔴 ${f.length} cláusula(s) de la ley NO están en el system prompt:`);
  for (const c of f) di(`   ${c.id.padEnd(22)} debía decir: ${c.debe_decir.join(' | ')}\n${' '.repeat(25)}fuente: ${c.fuente}`);
  process.exit(1);
}
di('✅ las 8 cláusulas están, literales.');
