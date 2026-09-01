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
 * ── 🔴 DOS ENMIENDAS DEL MISMO DÍA, Y LAS DOS LAS COBRÓ EL PROPIO GATE ───
 * Horas después de nacer, A publicó `obtenerEstadiasPorRango` y el HOY se
 * plegó a él. El gate **siguió dando VERDE**, y por dos razones distintas que
 * conviene no confundir:
 *
 *  ① **El universo estaba atado a un SUFIJO de nombre** (`…DelDia`). El lector
 *     nuevo termina en `…PorRango` ⇒ era invisible, y la superficie que lo usa
 *     habría quedado acusada de no llamar a nadie. *Un gate atado a cómo se
 *     escribe un nombre mide la convención, no el hecho.* Ahora el universo se
 *     agrupa **por OFICIO** y un oficio se satisface con CUALQUIERA de sus
 *     lectores —`DelDia` o `PorRango`—, que es lo que de verdad importa: que la
 *     superficie pregunte por ese oficio, no con qué firma.
 *
 *  ② 🔴 **Y el verde venía de un COMENTARIO.** Al plegar la quinta pata quedó
 *     una lápida que NOMBRA al lector viejo (*«`obtenerEstadiasDelDia` tomaba
 *     UNA fecha»*), y el regex la contó como referencia viva. **El HOY pasó el
 *     gate citando en prosa a un lector que ya no llama.**
 *     > *Esta casa escribe lápidas que nombran el artefacto muerto —es su
 *     > disciplina, y es buena—, así que todo gate por texto tiene que quitar
 *     > los comentarios ANTES de medir: si no, la prosa que documenta una
 *     > muerte se lee como prueba de vida.*
 *     El control positivo no lo cazó porque el mutante borra **todas** las
 *     apariciones, comentario incluido: *un control que muta de más da verde
 *     donde el real da verde falso.* Hoy el mutante borra sólo el código.
 *
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE (control caído o lector nuevo).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname;

/** Lectores de día que NO son de jornada, con su razón citada. Sacarlos de acá
 *  es una decisión de mesa: cada uno explica por qué no cuenta. */
const EXENTOS = {
  Plata: 'suma por FECHA y es agnóstico al oficio — es justo el que SÍ veía la estadía cuando la lista no',
  Media: 'media de guardería (fotos/clip del día), no la jornada del prestador',
};

/** Superficies rojas conocidas, con su bloqueante. NO son exenciones: son deuda
 *  con nombre. El gate también se pone rojo si una de éstas queda CURADA y sigue
 *  en la lista — un baseline que sólo baja tiene que poder notar que bajó. */
const DEUDA_CONOCIDA = {
  'apps/prestador/src/app/historico.tsx':
    'S109-D · «Tu histórico» enumera cuatro y una estadía es trabajo hecho. NO se cura con el lector ' +
    'por rango, y la razón se midió al intentarlo: (1) TECHO — el histórico ofrece «90 días» y un ' +
    '«ver más» de 30 en 30 SIN TOPE, y `obtenerEstadiasPorRango` rebota sobre 62 días; (2) FORMA — ' +
    'su lista es de `CitaAgendaPaseo` y una estadía no trae hora, tipo_servicio, duración, precio, ' +
    'empleado ni atención: montarla ahí obliga a FABRICAR nueve campos, que es la fila verosímil-falsa ' +
    'de L-139. Lo que la destraba es UNA cosa: que A publique la proyección de guardería con la MISMA ' +
    'forma que sus cuatro hermanas (la cita existe — la estadía carga su `cita_id`). Con eso el ' +
    'histórico es una línea y el techo desaparece con el contrato de las hermanas.',
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

/** oficio ← nombre del lector: `obtenerCitasPaseoDelDia` → `Paseo`,
 *  `obtenerEstadiasPorRango` → `Estadias`. El sufijo (día o rango) se descarta
 *  A PROPÓSITO: es la FIRMA del lector, no el oficio que contesta. */
const oficioDe = (n) => n.replace(/^obtener(Citas)?/, '').replace(/(DelDia|PorRango)$/, '');

/** oficio → lectores que lo contestan. Cualquiera de ellos lo satisface. */
const porOficio = new Map();
for (const f of apiSrc)
  for (const m of readFileSync(f, 'utf8').matchAll(/export\s+async\s+function\s+(obtener\w*(?:DelDia|PorRango))\b/g)) {
    const o = oficioDe(m[1]);
    porOficio.set(o, [...(porOficio.get(o) ?? []), m[1]]);
  }

const lectores = new Set([...porOficio.values()].flat());
const JORNADA = [...porOficio.keys()].filter((o) => !(o in EXENTOS)).sort();

console.log(`verify:jornada-completa — ${lectores.size} lector(es) de jornada en packages/api`);
for (const [o, r] of Object.entries(EXENTOS))
  console.log(porOficio.has(o) ? `  ⏸  ${o} — EXENTO: ${r}` : `  ⚠️  ${o} — exento declarado que YA NO EXISTE (limpiar)`);
for (const o of JORNADA) console.log(`  · ${o} ← ${porOficio.get(o).join(' | ')}`);

if (JORNADA.length < 2) {
  console.error('\n⚠️  NO CONCLUYENTE — menos de dos lectores de jornada: el parser no está viendo el objeto.');
  process.exit(2);
}

// ── 2 · la regla ─────────────────────────────────────────────────────────
/** 🔴 Los COMENTARIOS salen antes de medir — enmienda ②: una lápida que nombra
 *  al lector muerto contaba como referencia viva. Y los `import`, porque
 *  importar no es usar (L-451). */
const codigoDe = (txt) =>
  txt
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^\s*import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');

/** Devuelve null si la superficie no enumera; si enumera, los oficios que le faltan. */
function evaluar(txt) {
  const cod = codigoDe(txt);
  const usa = JORNADA.filter((o) => porOficio.get(o).some((l) => new RegExp(`\\b${l}\\b`).test(cod)));
  if (usa.length < 2) return null; // superficie de UN oficio: no enumera
  const exentosInline = [...txt.matchAll(/jornada-completa:\s*exento\s+(\w+)/g)].map((m) => m[1]);
  return JORNADA.filter((o) => !usa.includes(o) && !exentosInline.includes(o));
}

// ── 3 · control positivo (mutante) y negativo, sobre el HOY ──────────────
const HOY = 'apps/prestador/src/app/(tabs)/index.tsx';
const txtHoy = readFileSync(join(RAIZ, HOY), 'utf8');
const GUARDERIA = 'Estadias';
/* 🔴 El mutante borra el lector SÓLO DEL CÓDIGO y deja los comentarios
   intactos: si además borrara la prosa, un gate que cuenta comentarios daría
   rojo igual y el control lo absolvería. *Un control que muta de más no
   discrimina.* Fue exactamente lo que pasó con la enmienda ②. */
const mutante = codigoDe(txtHoy).replace(/\bobtenerEstadias(DelDia|PorRango)\b/g, '__borrado_por_el_control__');
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
