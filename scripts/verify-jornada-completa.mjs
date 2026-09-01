#!/usr/bin/env node
/**
 * verify-jornada-completa.mjs — LA SUPERFICIE QUE ENUMERA LA JORNADA LA ENUMERA ENTERA
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ EXISTE — TRES VECES EL MISMO DEFECTO EN UN DÍA (S109-D, 31-ago-2026)
 *
 * La guardería existía —motor, wrapper, pantalla propia, cinco estadías vivas en
 * la base— y aun así **no aparecía en tres superficies del prestador**, por tres
 * mecanismos distintos y con la misma forma:
 *
 *   ① `obtenerOficiosNegocio` tiraba `categoria='hospedaje'` con un `continue`
 *      explícito  ⇒ la baldosa de ATENDER nunca se dibujaba.
 *   ② `KEY_CITAS_DEL_DIA` (atender.tsx) era un mapa cerrado de cuatro claves.
 *   ③ el HOY (`(tabs)/index.tsx`) pedía **cuatro lectores escritos a mano**, y
 *      sus propios comentarios lo cantaban: *«tercera pata de la MISMA jornada»*,
 *      *«CUARTA pata»*. La quinta nunca se agregó.
 *
 * > **Ninguno falla. Los tres OMITEN — y una omisión no tiene síntoma:**
 * > el prestador leyó *«hoy no tienes citas»* con dos animales a bordo.
 *
 * El discriminador que lo cerró fue del founder y vale conservarlo: el header
 * del mismo día mostraba **$12** mientras la lista decía «no tienes citas». El
 * header sale de `obtenerPlataDelDia`, que suma **por fecha** y es agnóstico al
 * oficio; la lista preguntaba por cuatro oficios. *Dos números del mismo día que
 * no cierran señalan el mapa cerrado con una precisión que ningún log alcanza.*
 *
 * ── EL UNIVERSO SALE DEL OBJETO, JAMÁS DE UNA LISTA ──────────────────────
 * Si este gate llevara adentro su propia lista de cinco oficios, sería **el
 * sexto mapa cerrado** — y el sexto oficio lo dejaría afuera igual que los otros
 * cinco. El universo se deriva de los `export async function obtener…DelDia` de
 * `packages/api`. Un lector nuevo sin clasificar **detiene el gate** (salida 2):
 * la decisión de si pertenece a la jornada es de la mesa, no de un regex.
 *
 * ── REFERENCIA, NO LLAMADA (L-451 aplicada al revés) ─────────────────────
 * `index.tsx` los **llama** (`obtenerCitasVetDelDia({…})`); `atender.tsx` los
 * pone como **valor de un mapa**, sin paréntesis. Un gate que buscara `nombre(`
 * vería UNA sola referencia en atender —la de guardería, que sí es lambda— y la
 * superficie caería bajo el umbral: **ciego justo donde nació el defecto ②**.
 * Se cuenta la referencia al identificador con los `import` removidos del texto.
 *
 * ── EL CONTROL POSITIVO ES UN MUTANTE, NO UN COMMIT ──────────────────────
 * El founder pidió *rojo sobre `index.tsx` pre-cura, verde después*. En vez de
 * leerlo del historial —que un rebase mueve—, el control **fabrica** el estado
 * pre-cura: toma el archivo vivo y le borra las referencias al lector de
 * guardería. Si sobre ese mutante la regla no da rojo, el instrumento está
 * ciego y el gate sale **NO CONCLUYENTE, jamás verde**. Con el archivo real
 * exige verde. *Un control que no puede rotar es mejor que uno fiel al pasado.*
 *
 * ── 🔴 LO QUE ESTE GATE **NO** VE (se declara acá, no en un doc aparte) ───
 *  (a) **Un `continue` por categoría** — el defecto ①. Una pantalla puede
 *      enumerar los cinco lectores y perder un oficio un piso más abajo, dentro
 *      del lector, porque el que arma la lista de oficios filtró por categoría.
 *      *Un censo por referencia mira la puerta, no el pasillo.*
 *  (b) **Los mapas que no son llamadas** — `KEY_DATO`, `GLIFO_OFICIO`,
 *      `KEY_VOZ_SERVICIO`. Ésos los vigila `verify-voz-por-tipo.mjs`, y por el
 *      DATO (qué ve una familia), no por el código.
 *  (c) **Que el resultado se PINTE.** La quinta pata se llamó y aun así hubo que
 *      renderizarla aparte: un merge que descarta o un `.map` que no incluye no
 *      dejan rastro acá.
 *  (d) **Un oficio sin lector de día.** Si nace uno y nadie escribe su
 *      `obtener…DelDia`, este gate no tiene de dónde verlo.
 *
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE (control caído o lector nuevo).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname;

/** Lectores de día que NO son de jornada, con su razón citada. Sacarlos de acá
 *  es una decisión de mesa: cada uno explica por qué no cuenta. */
const EXENTOS = {
  obtenerPlataDelDia:
    'suma por FECHA y es agnóstico al oficio — es justo el que SÍ veía la estadía cuando la lista no',
  obtenerMediaDelDia: 'media de guardería (fotos/clip del día), no la jornada del prestador',
};

/** Superficies rojas conocidas, con su bloqueante. NO son exenciones: son deuda
 *  con nombre. El gate también se pone rojo si una de éstas queda CURADA y sigue
 *  en la lista — un baseline que sólo baja tiene que poder notar que bajó. */
const DEUDA_CONOCIDA = {
  'apps/prestador/src/app/historico.tsx':
    'S109-D · «Tu histórico» enumera cuatro y una estadía es trabajo hecho. NO se cura hoy: ' +
    'sus cuatro lectores toman RANGO y `obtenerEstadiasDelDia` toma UNA fecha. Se destraba con ' +
    'el lector por rango pedido a A — curarlo hoy sería llamarlo una vez por día (D-738).',
};

// ── 1 · el universo, del objeto ──────────────────────────────────────────
const apiSrc = [];
(function barrer(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) barrer(p);
    else if (p.endsWith('.ts')) apiSrc.push(p);
  }
})(join(RAIZ, 'packages/api/src'));

const lectores = new Set();
for (const f of apiSrc)
  for (const m of readFileSync(f, 'utf8').matchAll(/export\s+async\s+function\s+(obtener\w*DelDia)\b/g))
    lectores.add(m[1]);

const JORNADA = [...lectores].filter((l) => !(l in EXENTOS)).sort();
const sinClasificar = [...lectores].filter((l) => !(l in EXENTOS) && !JORNADA.includes(l));

console.log(`verify:jornada-completa — ${lectores.size} lector(es) de día en packages/api`);
for (const [l, r] of Object.entries(EXENTOS))
  console.log(lectores.has(l) ? `  ⏸  ${l} — EXENTO: ${r}` : `  ⚠️  ${l} — exento declarado que YA NO EXISTE (limpiar)`);
console.log(`  jornada = ${JORNADA.join(', ')}`);

if (JORNADA.length < 2) {
  console.error('\n⚠️  NO CONCLUYENTE — menos de dos lectores de jornada: el parser no está viendo el objeto.');
  process.exit(2);
}
if (sinClasificar.length) {
  console.error(`\n⚠️  NO CONCLUYENTE — lector(es) nuevo(s) sin clasificar: ${sinClasificar.join(', ')}`);
  process.exit(2);
}

// ── 2 · la regla ─────────────────────────────────────────────────────────
const sinImports = (txt) => txt.replace(/^\s*import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
const refiere = (cuerpo, nombre) => new RegExp(`\\b${nombre}\\b`).test(cuerpo);

/** Devuelve null si la superficie no enumera; si enumera, los que le faltan. */
function evaluar(txt) {
  const cuerpo = sinImports(txt);
  const usa = JORNADA.filter((l) => refiere(cuerpo, l));
  if (usa.length < 2) return null; // superficie de UN oficio: no enumera
  const exentosInline = [...txt.matchAll(/jornada-completa:\s*exento\s+(\w+)/g)].map((m) => m[1]);
  return JORNADA.filter((l) => !usa.includes(l) && !exentosInline.includes(l));
}

// ── 3 · control positivo (mutante) y negativo, sobre el HOY ──────────────
const HOY = 'apps/prestador/src/app/(tabs)/index.tsx';
const txtHoy = readFileSync(join(RAIZ, HOY), 'utf8');
const GUARDERIA = 'obtenerEstadiasDelDia';
const mutante = txtHoy.split(GUARDERIA).join('__lector_borrado_por_el_control__');
const faltaEnMutante = evaluar(mutante);
const faltaEnReal = evaluar(txtHoy);

if (!faltaEnMutante?.includes(GUARDERIA)) {
  console.error(
    `\n⚠️  NO CONCLUYENTE — el control positivo NO dio rojo: con ${GUARDERIA} borrado del HOY, la regla ` +
      `no lo acusó. El instrumento no está midiendo lo que dice medir.`,
  );
  process.exit(2);
}
if (faltaEnReal?.length) {
  console.log(`  control: rojo sobre el mutante ✓ · el HOY real todavía en rojo (se reporta abajo)`);
} else {
  console.log(`  control: rojo sobre el mutante ✓ · verde sobre el HOY real ✓`);
}

// ── 4 · el censo ─────────────────────────────────────────────────────────
const pantallas = [];
for (const app of ['apps/prestador/src', 'apps/cliente/src'])
  (function barrer(d) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) barrer(p);
      else if (/\.tsx?$/.test(p)) pantallas.push(p);
    }
  })(join(RAIZ, app));

const rojas = [];
const enumeran = [];
for (const p of pantallas) {
  const falta = evaluar(readFileSync(p, 'utf8'));
  if (falta === null) continue;
  const rel = p.slice(RAIZ.length);
  enumeran.push(rel);
  if (falta.length) rojas.push({ rel, falta });
}

console.log(`\n  ${enumeran.length} superficie(s) enumeran la jornada:`);
for (const s of enumeran) console.log(`     · ${s}`);

const inesperadas = rojas.filter((r) => !(r.rel in DEUDA_CONOCIDA));
const curadas = Object.keys(DEUDA_CONOCIDA).filter((k) => !rojas.some((r) => r.rel === k));

for (const r of rojas) {
  const conocida = r.rel in DEUDA_CONOCIDA;
  console.log(`  ${conocida ? '🟡' : '🔴'} ${r.rel} — enumera y le falta: ${r.falta.join(', ')}`);
  if (conocida) console.log(`       deuda declarada: ${DEUDA_CONOCIDA[r.rel]}`);
}
for (const c of curadas) console.log(`  ✅ ${c} — YA NO le falta nada: sacala de DEUDA_CONOCIDA`);

if (inesperadas.length || curadas.length) {
  console.error(
    `\n❌ ROJO — ${inesperadas.length} superficie(s) enumeran de menos sin declararlo` +
      `${curadas.length ? ` y ${curadas.length} deuda(s) ya curada(s) siguen listada(s)` : ''}.`,
  );
  process.exit(1);
}
console.log(`\n✅ VERDE — toda superficie que enumera la jornada la enumera entera (${rojas.length} deuda(s) declarada(s)).`);
