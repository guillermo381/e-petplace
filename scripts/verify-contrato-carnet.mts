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

function brazoEnums(): string[] {
  const fallas: string[] = [];
  const w = readFileSync('packages/api/src/wrappers/vacunas.ts', 'utf8');
  const e = readFileSync('supabase/functions/extract-vacuna/index.ts', 'utf8');

  const leer = (txt: string, nombre: string, pat: RegExp): string[] | null => {
    const m = pat.exec(txt);
    if (m === null) return null;
    return m[1].split(',').map((x) => x.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  };

  for (const nombre of ['EVIDENCIAS', 'CONFIANZAS']) {
    const lw = leer(w, nombre, new RegExp(`const ${nombre}[^=]*=\\s*\\[([^\\]]*)\\]`));
    const le = leer(e, nombre, new RegExp(`const ${nombre}\\s*=\\s*\\[([^\\]]*)\\]`));
    if (lw === null) { fallas.push(`no se pudo leer ${nombre} del wrapper`); continue; }
    if (le === null) { fallas.push(`no se pudo leer ${nombre} de la edge`); continue; }
    const soloW = lw.filter((x) => !le.includes(x));
    const soloE = le.filter((x) => !lw.includes(x));
    if (soloW.length > 0 || soloE.length > 0) {
      fallas.push(`${nombre} DIVERGE — sólo en el wrapper: [${soloW}] · sólo en la edge: [${soloE}]`);
    }
  }
  return fallas;
}

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
export const r: LecturaDeCarnet = { vacunas: [], plan_impreso: [], filas_descartadas: [] };`;

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

// ── brazo 4 ─────────────────────────────────────────────────────────────────
console.log('\n── ④ los enums se LEEN, no se copian ──');
const fallasEnums = brazoEnums();
if (fallasEnums.length === 0) {
  di(true, "EVIDENCIAS y CONFIANZAS", "wrapper y edge dicen lo mismo");
} else {
  for (const f of fallasEnums) di(false, "enums", f);
}

console.log(`\n${fallas === 0 ? '✅ CONTRATO EXIGIBLE' : `🔴 ${fallas} falla(s)`}`);
process.exit(fallas === 0 ? 0 : 1);

/**
 * ── BRAZO 4 · LOS ENUMS SE LEEN, NO SE COPIAN ──────────────────────────────
 *
 * 🔴 NACE DE UN DEFECTO VIVO, no de una precaución: el wrapper decía
 * `sticker_con_fecha` y la edge devuelve `sticker`. Como el wrapper **rechaza la
 * fila entera** cuando la evidencia no está en su lista, *toda vacuna leída de un
 * sticker se descartaba en silencio* — y en un carnet real los stickers son la
 * mayoría.
 *
 * ⚠️ Y el modo de falla es el peor: **no rompe nada**. El wrapper compila, la
 * edge responde 200, y lo único que pasa es que llegan menos filas de las que el
 * modelo leyó. *Nadie abre un ticket porque falten vacunas que nunca vio.*
 *
 * Por eso este brazo **lee las dos listas de sus archivos y las compara**. No
 * declara cuál es la buena —la buena es la de la edge, que es quien produce— sino
 * que **exige que sean la misma**.
 */
