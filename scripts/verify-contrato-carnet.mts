/* ══ verify:contrato-carnet — S113-A · lote 1.0 ══════════════════════════════
 *
 * QUÉ VIGILA: que el contrato de la lectura de carnet que D publicó
 * (`docs/loop/S113-D.md`) **siga siendo exigible** — no que exista hoy.
 *
 * 🔴 POR QUÉ NACE, y no es teórico: la respuesta de `extract-vacuna` pasó de
 * ser un array a ser DOS canastos (`vacunas` + `plan_impreso`). Un consumidor
 * que construya la forma vieja tiene que **romper la compilación**, no llegar a
 * producción con `plan_impreso` en `undefined`. *Y si mañana alguien lo vuelve
 * opcional «para no romper nada», este gate es lo único que lo dice: ni el
 * typecheck ni el lint ven que un contrato se aflojó — ven que todo compila,
 * que es justamente el síntoma.*
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, readFileSync } from 'node:fs';

const API = `${process.cwd()}/packages/api`;
let fallas = 0;
const di = (ok: boolean, q: string, v: string) => {
  if (!ok) fallas++;
  console.log(`  ${ok ? 'ok  ' : '🔴  '}${q.padEnd(34)} ${v}`);
};

/* ── ① Los SIETE nombres salen por la puerta única ───────────────────────── */
console.log('── ① los siete nombres del contrato, exportados ──');
const idx = readFileSync(`${API}/src/index.ts`, 'utf8');
for (const t of ['ViaAdministracion', 'TipoVacuna', 'ConfianzaExtraccion',
                 'EvidenciaAplicacion', 'VacunaExtraida', 'FilaPlanImpreso',
                 'LecturaDeCarnet']) {
  di(new RegExp(`\\b${t}\\b`).test(idx), t, 'en index.ts');
}
/* CONTROL NEGATIVO: sin esto, un grep roto daría siete verdes seguidos. */
di(!/\bTipoQueJamasExistio\b/.test(idx), 'CONTROL− nombre inventado', 'ausente ⇒ el grep discrimina');

/* ── ② `plan_impreso` es OBLIGATORIO en el tipo ──────────────────────────── */
console.log('\n── ② el tipo exige plan_impreso ──');
const tsc = (cuerpo: string): string => {
  const f = `${API}/_contrato_tmp.ts`;
  writeFileSync(f, cuerpo);
  try {
    execFileSync('npx', ['tsc', '--noEmit', '--strict', '--skipLibCheck', f],
      { cwd: API, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return '';
  } catch (e) {
    return String((e as { stdout?: Buffer }).stdout ?? '');
  } finally { try { unlinkSync(f); } catch { /* ya no está */ } }
};
const SIN = `import type { LecturaDeCarnet } from './src/wrappers/vacunas';
export const r: LecturaDeCarnet = { vacunas: [] };`;
const CON = `import type { LecturaDeCarnet } from './src/wrappers/vacunas';
export const r: LecturaDeCarnet = { vacunas: [], plan_impreso: [] };`;

const salidaSin = tsc(SIN);
di(/TS2741|TS2739/.test(salidaSin) && /plan_impreso/.test(salidaSin),
   'SIN plan_impreso ⇒ NO compila',
   salidaSin.trim().split('\n')[0]?.slice(0, 76) || '🔴 compiló, y no debía');
/* 🔴 EL CONTROL POSITIVO ES LO QUE VUELVE VÁLIDO AL ROJO DE ARRIBA: sin él, un
   error de sintaxis en el fixture también daría «no compila» y el gate se
   pondría verde por la razón equivocada. *Un rojo por el motivo incorrecto está
   tan roto como un verde por el motivo incorrecto* (L-321). */
di(tsc(CON) === '', 'CON plan_impreso ⇒ SÍ compila', 'control positivo');

/* ── ③ El guard de RUNTIME también lo exige ──────────────────────────────── */
console.log('\n── ③ el guard de runtime ──');
const w = readFileSync(`${API}/src/wrappers/vacunas.ts`, 'utf8');
di(/Array\.isArray\(\s*data\.plan_impreso\s*\)/.test(w),
   'el wrapper lo exige al leer', 'Array.isArray(data.plan_impreso)');
/* ⚠️ LO QUE ESTA TERCERA PREGUNTA **NO** MIDE, dicho en vez de omitido: es
   estructural sobre el TEXTO del wrapper, no una ejecución. Prueba que la línea
   está; **no prueba que la función rebote** — para eso hay que invocarla, y eso
   cuesta una llamada real al proveedor. *Un gate que declara su límite se puede
   confiar; uno que no lo declara se lee como si midiera más de lo que mide.* */

console.log(`\n${fallas === 0 ? '✅ CONTRATO EXIGIBLE' : `🔴 ${fallas} falla(s)`}`);
process.exit(fallas === 0 ? 0 : 1);
