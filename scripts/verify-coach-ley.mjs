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
import { readFileSync, existsSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { exigirArgumentos } from './lib-argumentos.mjs';

/* Un instrumento tiene que poder decir «no»: cualquier argumento que no entienda
   corta en 2 en vez de correr midiendo otra cosa. */
exigirArgumentos(['--control'], 0);

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

/**
 * 🔴 CADA CLÁUSULA SE BUSCA DONDE DEBE VIVIR, y para algunas el otro lugar es PEOR.
 * `memorial` en el prompt sería una PROMESA del modelo; en la puerta es un HECHO
 * (LOYALTY §8.1 pide apagado estructural). Un gate que sólo pregunta «¿está la ley?»
 * se conforma con la promesa.
 * `solo_en_rama` marca las condicionales: se exigen en la rama que las enciende.
 */
export function repartir(clausulas, { system, fuente }) {
  const falta = [];
  const avisos = [];
  const dice = (texto, c) => texto != null && c.debe_decir.some((f) => plano(texto).includes(plano(f)));

  for (const c of clausulas) {
    const enSystem = dice(system, c);
    const enPuerta = dice(fuente, c);

    if (c.vive_en !== 'puerta') {
      if (system != null && !enSystem) falta.push(c);
      continue;
    }

    /* 🔴 LOS TRES ESTADOS DE UNA CLÁUSULA DE PUERTA — el corolario lo trajo D y
       lo vuelve exigible saber en cuál está:
         · sólo en la puerta      → correcto. Es un HECHO.
         · en las dos             → AVISO. *Una regla en el prompt que el código ya
           hace cumplir no es redundancia inofensiva: invita a que alguien la borre
           del código creyendo que el prompt la sostiene.*
         · sólo en el prompt      → ROJO, y es el peor. **La promesa reemplazó al
           hecho**, y una promesa el modelo la puede incumplir. */
    if (!enPuerta && enSystem) { falta.push({ ...c, promesa: true }); continue; }
    if (!enPuerta) { falta.push(c); continue; }
    if (enSystem) avisos.push(c);
  }
  falta.avisos = avisos;
  return falta;
}

/**
 * ⚠️ EL CAMINO APROXIMADO, y ahora está declarado como tal.
 * Junta los literales de **80 chars o más** — o sea que **descarta en silencio los
 * cortos**: hoy ninguna cláusula vive sólo en uno (medido: 36 literales cortos en la
 * edge, cero cláusulas exclusivas), pero *el día que alguien escriba una ley en una
 * línea de 60 caracteres, este gate le va a dar verde por no haberla visto.* Es la
 * misma clase que me hizo perder el 17 % de un prompt en S113 y retirar un número.
 * Por eso se usa **sólo como respaldo**, y la salida lo DICE.
 */
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

/* Corre sólo si lo invocan a él: importarlo no puede disparar un process.exit()
   por la espalda. Ya me pasó con el juez de los rojos. */
const ESTE = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

/** ¿La edge existe en el servidor aunque no esté en este árbol? Son dos mundos
    distintos y el segundo es el que le llega a la familia: decir sólo «no existe»
    cuando está corriendo en producción es la mitad de la verdad. */
function desplegada(nombre) {
  try {
    const ref = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
    const r = spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', '-m', '8',
      '-X', 'POST', `https://${ref}.supabase.co/functions/v1/${nombre}`,
      '-H', 'content-type: application/json', '-d', '{}'], { encoding: 'utf8' });
    const c = Number((r.stdout || '').trim());
    return c && c !== 404 ? c : null;
  } catch { return null; }
}

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (ESTE && process.argv.includes('--control')) {
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

  // 🔴 LOS TRES ESTADOS DE UNA CLÁUSULA DE PUERTA (corolario de D).
  const puerta = [{ id: 'memorial', vive_en: 'puerta', debe_decir: ['memorial'], fuente: 'x' }];
  const r1 = repartir(puerta, { system: 'sin la palabra', fuente: 'if (memorial) return 404' });
  ok(r1.length === 0 && (r1.avisos ?? []).length === 0, 'NEGATIVO  sólo en la puerta: correcto, es un HECHO');
  const r2 = repartir(puerta, { system: 'en memorial no hablás', fuente: 'if (memorial) return 404' });
  ok(r2.length === 0 && r2.avisos.length === 1, 'CLASE     en las DOS: aviso, no rojo — es una invitación a borrarla del código');
  const r3 = repartir(puerta, { system: 'en memorial no hablás', fuente: 'no la hace cumplir' });
  ok(r3.length === 1 && r3[0].promesa === true,
    'POSITIVO  sólo en el PROMPT: ROJO — la promesa reemplazó al hecho');

  // Y el que impide el verde vacío.
  const r = promptDeLaEdge('supabase/functions/no_existe_s113e/index.ts');
  ok(!r.existe, 'POSITIVO  sin edge el gate NO puede dar verde', `(${r.motivo})`);

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di('✅ nombra la cláusula que falta, y sin objeto sale NO CONCLUYENTE.');
  process.exit(0);
}

/**
 * EL CAMINO EXACTO: le pide el system a la edge llamando a su propio constructor.
 * ⚠️ `deno` corre sobre una copia **fuera del repo** — adentro escribe `workspaces`
 * en `package.json` (canon de la casa).
 */
export function promptExacto(origen) {
  if (spawnSync('which', ['deno']).status !== 0) return null;
  const raiz = fileURLToPath(new URL('..', import.meta.url));
  const helper = join(raiz, 'scripts/nexo/system-exacto.ts');
  if (!existsSync(helper)) return null;
  const dir = mkdtempSync(join(tmpdir(), 'coachley-'));
  try {
    const tar = spawnSync('sh', ['-c', `git -C '${raiz}' archive ${origen} supabase/functions | tar -x -C '${dir}'`]);
    if (tar.status !== 0 || !existsSync(join(dir, 'supabase/functions/coach/index.ts'))) return null;
    copyFileSync(helper, join(dir, 'system-exacto.ts'));
    /* Las dos ramas del condicional se concatenan: la ley tiene que estar en AMBAS. */
    const partes = [[], ['--telemedicina']].map((f) =>
      spawnSync('deno', ['run', '-A', '--quiet', 'system-exacto.ts', 'supabase/functions/coach/index.ts', ...f],
        { cwd: dir, encoding: 'utf8', maxBuffer: 1 << 24 }));
    if (partes.some((r) => r.status !== 0 || !r.stdout.trim())) return null;
    return partes.map((r) => r.stdout).join('\n');
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
const ley = JSON.parse(readFileSync(LEY, 'utf8')).clausulas;
const ORIGEN = process.env.COACH_ORIGEN ?? null;
const exacto = ORIGEN ? promptExacto(ORIGEN) : null;
if (!ESTE) { /* importado: no se corre el gate */ }
const p = ESTE ? (exacto
  ? { existe: true, texto: exacto, trozos: 'EXACTO (las dos ramas)' }
  : promptDeLaEdge(EDGE)) : { existe: true, texto: '', trozos: 0 };
if (ESTE && !exacto && ORIGEN) di('⚠️ pedí el system EXACTO y no pude — caigo al aproximado, que descarta literales de <80 chars.');
if (ESTE && !p.existe) {
  const cod = desplegada('coach');
  di(`⚠️ NO CONCLUYENTE — ${p.motivo}.`);
  if (cod) {
    di(`   🔴 PERO LA EDGE ESTÁ DESPLEGADA (HTTP ${cod}) — su fuente vive en otra rama.`);
    di('   *«No está acá» y «no existe» son distintos, y el segundo es falso.*');
    di('   Medila donde vive:  COACH_ORIGEN=<rama> node scripts/verify-coach-ley.mjs');
  }
  di('   NO es verde: «la ley está» y «no hay prompt que mirar» son distintos, y');
  di('   confundirlos es cómo un gate deja de mirarse.');
  process.exit(2);
}
/* La fuente de la edge se lee aparte: ahí viven las cláusulas de PUERTA. */
const fuenteEdge = ORIGEN
  ? (spawnSync('git', ['show', `${ORIGEN}:supabase/functions/coach/index.ts`], { encoding: 'utf8', cwd: fileURLToPath(new URL('..', import.meta.url)) }).stdout ?? '')
  : (existsSync(EDGE) ? readFileSync(EDGE, 'utf8') : '');
const f = !ESTE ? [] : exacto ? repartir(ley, { system: p.texto, fuente: fuenteEdge }) : faltantes(p.texto, ley);
if (ESTE) di(`verify:coach-ley · ${exacto ? ORIGEN : EDGE} · ${exacto ? p.trozos : `${p.trozos} literal(es) — APROXIMADO`} · ${ley.length} cláusulas`);
if (ESTE && f.length) {
  di(`\n🔴 ${f.length} cláusula(s) de la ley NO están donde deben:`);
  for (const c of f) {
    di(`   ${c.id.padEnd(22)} en el ${c.vive_en ?? 'system'} · debía decir: ${c.debe_decir.join(' | ')}`);
    di(`${' '.repeat(25)}fuente: ${c.fuente}`);
    if (c.promesa) {
      di(`${' '.repeat(25)}☠️ ESTÁ EN EL PROMPT Y NO EN LA PUERTA: la promesa reemplazó al hecho.`);
      di(`${' '.repeat(25)}   Una promesa el modelo la puede incumplir; la puerta no.`);
    } else if (c.por_que_ahi) di(`${' '.repeat(25)}⚠️ ${c.por_que_ahi.split('. ')[0]}.`);
  }
  process.exit(1);
}
if (ESTE) {
  for (const c of (f.avisos ?? [])) {
    di(`⚠️ «${c.id}» vive en la puerta Y está en el prompt.`);
    di('   No es un defecto hoy — es una invitación: alguien puede borrarla del código');
    di('   creyendo que el prompt la sostiene, y quedarse con la promesa sin el hecho.');
  }
  di(`✅ las ${ley.length} cláusulas están, literales y cada una donde debe vivir.`);
}
