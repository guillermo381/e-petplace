#!/usr/bin/env node
/**
 * S109-A · EL CENSO DE FRENOS POR SUJETO.
 *
 * ═══ POR QUÉ EXISTE — la misma clase CINCO veces en un día ═════════════════
 * Un freno que existe en una rama y falta en las otras. La quinta la produjo
 * quien acababa de curar la cuarta. **Eso no es descuido: es una forma que el
 * sistema deja escribir.**
 *
 * · la compuerta del programa: existía y la edge no la llamaba
 * · el `ELSE` del comprobante: con dos sujetos era un XOR, con tres capturó de más
 * · el `ELSE` de la pertenencia: idem
 * · el guard de intento-en-vuelo: vivía en UNA de SEIS ramas ⇒ **dos débitos reales**
 * · `iva`/`base`/`suscripcion_periodo`: campos que el camino común lee y **nada exige**
 *
 * ⇒ **DOS BRAZOS, y el segundo es el que las otras herramientas no ven:**
 *   ① el guard de intento-en-vuelo **resuelve la `columna_intento` del catálogo**
 *      para cada sujeto cobrable.
 *   ② cada rama satisface **los CHECK que su fila va a tocar** — leídos de
 *      `pg_constraint`, no de una lista a mano.
 *
 * 🔴 **EL BRAZO ① NO EXIGE SEIS GUARDS, Y ESO ES DELIBERADO** (aviso de S109-B):
 *    el guard vive UNA vez, en la puerta. Un censo que buscara «un guard por
 *    sujeto» daría **ROJO SOBRE CÓDIGO CORRECTO**, que es peor que no tenerlo.
 *    Lo que se exige es que **la columna de cada sujeto sea alcanzable** por la
 *    resolución del guard.
 *
 * 🔴 **EL BRAZO ② ES EL MECANIZABLE DE VERDAD** (hallazgo de S109-B): *un censo
 *    de ramas no ve un campo que falta; un censo de CONSTRAINTS sí.* Los CHECK
 *    de pareja —`(x IS NULL) = (x_periodo IS NULL)`— dicen exactamente qué
 *    columnas viajan juntas, y la base ya los tiene escritos.
 *
 * USO:  node scripts/verify-frenos-por-sujeto.mjs [--rev <sha>]
 *       `--rev` lee la edge de OTRA revisión — es cómo se prueba que discrimina.
 * L-197: si no puede medir contra la base, sale ROJO, jamás verde.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dbQuery } from './lib-db.mjs';

const EDGE = 'supabase/functions/pagos-cobro/index.ts';
const iRev = process.argv.indexOf('--rev');
const REV = iRev > -1 ? process.argv[iRev + 1] : null;
const di = (s) => process.stdout.write(s + '\n');
let rojo = false;

const fuente = REV
  ? execSync(`git show ${REV}:${EDGE}`, { encoding: 'utf8', maxBuffer: 20e6 })
  : readFileSync(EDGE, 'utf8');
di(REV ? `· midiendo la edge de ${REV}` : '· midiendo la edge de trabajo');

/* ── El catálogo manda: los sujetos NO se listan acá ───────────────────── */
let sujetos, checks;
try {
  sujetos = dbQuery(`
    select codigo, columna_intento, cobrable_por_checkout
      from cat_sujetos_de_pago order by codigo`);
  checks = dbQuery(`
    select conname, pg_get_constraintdef(oid) as def
      from pg_constraint
     where conrelid='public.pagos_intentos'::regclass and contype='c'`);
} catch (e) {
  di('🔴 NO SE PUDO MEDIR contra la base — ROJO, jamás verde (L-197).');
  di(`   ${e.message}`);
  process.exit(1);
}

/* ── BRAZO ① · el guard alcanza la columna de cada sujeto cobrable ─────── */
const enVuelo = /in\(\s*['"]estado['"]\s*,\s*\[[^\]]*['"](iniciado|pendiente)['"]/.test(fuente);
if (!enVuelo) {
  rojo = true;
  di('🔴 ① NO HAY GUARD DE INTENTO-EN-VUELO en la puerta.');
  di('   Sin él, dos toques simultáneos en «Pagar» son DOS DÉBITOS REALES.');
} else {
  const faltan = sujetos
    .filter((s) => s.cobrable_por_checkout)
    .filter((s) => !new RegExp(`['"]${s.columna_intento}['"]`).test(fuente));
  if (faltan.length) {
    rojo = true;
    di(`🔴 ① ${faltan.length} sujeto(s) cobrable(s) cuya columna el guard NO alcanza:`);
    for (const s of faltan) di(`   · ${s.codigo} → ${s.columna_intento}`);
    di('   El guard vive UNA vez en la puerta; lo que falta es que RESUELVA su columna.');
  } else {
    const n = sujetos.filter((s) => s.cobrable_por_checkout).length;
    const fuera = sujetos.length - n;
    di(`✅ ① el guard de intento-en-vuelo alcanza los ${n} sujetos cobrables del catálogo`);
    /* 🔴 LO QUE NO MIDIÓ, DICHO — `L-459`: un guard que sólo suma verdes
       esconde cuánto no midió, y ese silencio es indistinguible de la salud. */
    if (fuera) di(`   ⚠️  ${fuera} sujeto(s) del catálogo NO cobrables por checkout quedaron FUERA de esta medición`);
  }
}

/* ── BRAZO ② · los CHECK de pareja: si va el id, va su compañera ───────── */
const pares = [];
for (const c of checks) {
  /* `(a IS NULL) = (b IS NULL)` — la forma que la casa usa para «viajan juntas». */
  const m = c.def.match(/\((\w+) IS NULL\)\s*=\s*\((\w+) IS NULL\)/);
  if (m) pares.push({ conname: c.conname, a: m[1], b: m[2] });
}
if (!pares.length) {
  rojo = true;
  di('🔴 ② no se encontró NINGÚN CHECK de pareja — o el patrón cambió, o la');
  di('   consulta mide otra cosa. Un censo que no encuentra su objeto no mide.');
} else {
  const rotos = [];
  for (const p of pares) {
    const ponA = new RegExp(`\\b${p.a}\\s*:`).test(fuente);
    const ponB = new RegExp(`\\b${p.b}\\s*:`).test(fuente);
    if (ponA && !ponB) rotos.push({ ...p, falta: p.b });
    if (ponB && !ponA) rotos.push({ ...p, falta: p.a });
  }
  if (rotos.length) {
    rojo = true;
    di(`🔴 ② ${rotos.length} rama(s) escriben media pareja — la fila va a rebotar 23514:`);
    for (const r of rotos) di(`   · ${r.conname}: pone «${r.a === r.falta ? r.b : r.a}» y NO pone «${r.falta}»`);
    di('   La base ya lo exigía. Lo que faltó no fue la regla: fue leerla.');
  } else {
    di(`✅ ② las ${pares.length} parejas de CHECK viajan completas en la edge`);
    /* 🔴 EL ALCANCE DEL BRAZO ②, DICHO EN VEZ DE SUPUESTO. Detecta SÓLO la
       forma `(a IS NULL) = (b IS NULL)`. Los demás CHECK de la tabla —rangos,
       vocabularios, XOR de sujeto— **no los mira**, y su verde no dice nada de
       ellos. *Un gate que no declara su recorte se lee como si cubriera todo.* */
    const otros = checks.length - pares.length;
    if (otros) di(`   ⚠️  ${otros} CHECK más en la tabla NO se miden acá: sólo se evalúa la forma de PAREJA`);
  }
}

if (!rojo) {
  di('');
  di('   Su verde dice «lo que mide, está» — jamás «no hay nada más que mirar».');
}
di(rojo ? '\n🔴 verify:frenos-por-sujeto — ROJO' : '\n✅ verify:frenos-por-sujeto — VERDE');
process.exit(rojo ? 1 : 0);
