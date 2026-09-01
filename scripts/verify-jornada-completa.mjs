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
 * ── 🔴 ENMIENDA ③ — LA MISMA LECCIÓN, EN OTRA PARTE DEL NOMBRE ───────────
 * Al publicar A `obtenerCitasGuarderiaDelDia`, el gate se puso **ROJO sobre dos
 * superficies que YA muestran guardería** — con el otro lector. Rojo falso.
 *
 * La causa **no** es que midiera «por lector y no por oficio»: agrupaba por
 * oficio, pero **derivaba el oficio del NOMBRE** (`obtenerCitasXDelDia` → `X`).
 * Y un mismo oficio tiene **dos raíces distintas**: `Estadias` y `Guarderia`.
 * ⇒ dos grupos para un solo oficio, y las superficies que lo cubrían por la
 * primera puerta quedaron acusadas de no cubrir la segunda.
 *
 * > **Es la enmienda ① otra vez, corrida de lugar:** primero fue el SUFIJO
 * > (`…DelDia` vs `…PorRango`), ahora la RAÍZ. *Un gate atado a cómo se escribe
 * > un nombre mide la convención, no el hecho — y la convención se rompe en
 * > cada pieza del nombre, una por vez.* Mientras hubo **un lector por oficio**
 * > la derivación y la verdad coincidían; **la coincidencia era del dato, no
 * > del diseño**, y se cayó el día que un oficio tuvo dos puertas.
 *
 * **Cura: el oficio se DECLARA por lector, y no se adivina.** Y eso no
 * contradice el «el universo sale del objeto»: la lista de abajo **no es una
 * lista de oficios** —ésa sí sería el sexto mapa cerrado— sino la
 * **clasificación de lo que el objeto ya contiene**. El universo lo sigue
 * poniendo `packages/api`; esta tabla sólo dice qué es cada cosa, y
 * **nada puede faltar**: un lector sin clasificar **detiene el gate** y una
 * entrada cuyo lector desapareció, también. *Un oficio no puede perder su
 * requisito en silencio porque su última puerta se haya renombrado.*
 *
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE (control caído · lector sin
 * clasificar · clasificación con un lector que ya no existe).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname;

/** QUÉ OFICIO CONTESTA CADA LECTOR. `null` = no es de jornada, con su razón.
 *
 *  🔴 NO ES UNA LISTA DE OFICIOS —eso sería el sexto mapa cerrado— sino la
 *  CLASIFICACIÓN de lo que el objeto ya contiene: el universo lo sigue
 *  poniendo `packages/api`, y todo lector que aparezca ahí tiene que estar
 *  acá o el gate se detiene. Nada puede faltar por olvido; sí puede faltar
 *  una DECISIÓN, y para eso está la salida 2. */
const CLASIFICACION = {
  obtenerCitasPaseoDelDia: 'paseo',
  obtenerCitasGroomingDelDia: 'grooming',
  obtenerCitasAdiestramientoDelDia: 'adiestramiento',
  obtenerCitasVetDelDia: 'veterinaria',
  /* Las TRES puertas de guardería, y por eso la derivación por nombre no
     podía funcionar: dos raíces (`Estadias`, `Guarderia`) para un oficio. */
  obtenerCitasGuarderiaDelDia: 'guarderia',
  obtenerEstadiasDelDia: 'guarderia',
  obtenerEstadiasPorRango: 'guarderia',
  obtenerPlataDelDia: null,
  obtenerMediaDelDia: null,
};

/** Por qué los `null` no cuentan. Se escribe aparte para que un exento sin
 *  razón sea imposible de agregar distraídamente. */
const RAZON_EXENTO = {
  obtenerPlataDelDia: 'suma por FECHA y es agnóstico al oficio — es justo el que SÍ veía la estadía cuando la lista no',
  obtenerMediaDelDia: 'media de guardería (fotos/clip del día), no la jornada del prestador',
};

/** Superficies rojas conocidas, con su bloqueante. NO son exenciones: son deuda
 *  con nombre. El gate también se pone rojo si una de éstas queda CURADA y sigue
 *  en la lista — un baseline que sólo baja tiene que poder notar que bajó. */
/** Superficies rojas conocidas, con su bloqueante. NO son exenciones: son deuda
 *  con nombre. El gate también se pone rojo si una de éstas queda CURADA y sigue
 *  en la lista — un baseline que sólo baja tiene que poder notar que bajó.
 *
 *  ☠️ S109-D · VACÍA, y su única habitante murió por la puerta correcta:
 *  `historico.tsx` entró acá porque su cura exigía FABRICAR nueve campos
 *  (`L-139`), no porque nadie hubiera querido hacerla. A publicó la proyección
 *  de guardería con la forma de sus hermanas y la deuda se pagó en una línea.
 *  *Una deuda declarada con su bloqueante nombrado es una deuda que alguien
 *  puede destrabar; una declarada como «pendiente» espera para siempre.* */
const DEUDA_CONOCIDA = {};

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
  for (const m of readFileSync(f, 'utf8').matchAll(/export\s+async\s+function\s+(obtener\w*(?:DelDia|PorRango))\b/g))
    lectores.add(m[1]);

const sinClasificar = [...lectores].filter((l) => !(l in CLASIFICACION));
const fantasmas = Object.keys(CLASIFICACION).filter((l) => !lectores.has(l));

/** oficio → lectores que lo contestan. CUALQUIERA de ellos lo satisface: lo que
 *  se exige es que la superficie pregunte por el oficio, no con qué firma. */
const porOficio = new Map();
for (const l of lectores) {
  const o = CLASIFICACION[l];
  if (o) porOficio.set(o, [...(porOficio.get(o) ?? []), l]);
}
const JORNADA = [...porOficio.keys()].sort();

console.log(`verify:jornada-completa — ${lectores.size} lector(es) de día en packages/api`);
for (const [l, r] of Object.entries(RAZON_EXENTO)) if (lectores.has(l)) console.log(`  ⏸  ${l} — NO es de jornada: ${r}`);
for (const o of JORNADA) console.log(`  · ${o} ← ${porOficio.get(o).join(' | ')}`);

if (JORNADA.length < 2) {
  console.error('\n⚠️  NO CONCLUYENTE — menos de dos oficios: el parser no está viendo el objeto.');
  process.exit(2);
}
if (sinClasificar.length) {
  console.error(
    `\n⚠️  NO CONCLUYENTE — lector(es) de día SIN CLASIFICAR: ${sinClasificar.join(', ')}.\n` +
      `    Decidí y agregalo a CLASIFICACION: ¿es un OFICIO NUEVO, otra PUERTA de uno que ya está,\n` +
      `    o no es de jornada (\`null\` + su razón)? El gate no lo adivina — adivinarlo fue el defecto\n` +
      `    que la enmienda ③ vino a curar.`,
  );
  process.exit(2);
}
if (fantasmas.length) {
  console.error(
    `\n⚠️  NO CONCLUYENTE — clasificación con lector(es) que YA NO EXISTEN: ${fantasmas.join(', ')}.\n` +
      `    Se detiene y no se limpia solo: si ése era la ÚLTIMA puerta de su oficio, el oficio\n` +
      `    desaparecería del universo y NADIE volvería a exigirlo. Un requisito no se pierde en silencio.`,
  );
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
const GUARDERIA = 'guarderia';
/* 🔴 El mutante borra el lector SÓLO DEL CÓDIGO y deja los comentarios
   intactos: si además borrara la prosa, un gate que cuenta comentarios daría
   rojo igual y el control lo absolvería. *Un control que muta de más no
   discrimina.* Fue exactamente lo que pasó con la enmienda ②. */
const puertasGuarderia = Object.keys(CLASIFICACION).filter((l) => CLASIFICACION[l] === GUARDERIA);
const mutante = puertasGuarderia.reduce(
  (t, l) => t.replace(new RegExp(`\\b${l}\\b`, 'g'), '__borrado_por_el_control__'),
  codigoDe(txtHoy),
);
const faltaEnMutante = evaluar(mutante);
const faltaEnReal = evaluar(txtHoy);

if (!faltaEnMutante?.includes(GUARDERIA)) {
  console.error(
    `\n⚠️  NO CONCLUYENTE — el control positivo NO dio rojo: con las ${puertasGuarderia.length} puertas de ` +
      `«${GUARDERIA}» borradas del HOY, la regla no lo acusó. El instrumento no está midiendo lo que dice medir.`,
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
