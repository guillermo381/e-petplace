/**
 * FIXTURE DEL TIPEO PREDICTIVO (S91-B) — `packages/ui/src/components/sugerencias.ts`.
 *
 * POR QUÉ EXISTE, y es lo que R17 no puede cubrir: esta pieza NO TIENE
 * PÍXELES. La galería verifica lo que un ojo puede firmar; un matcher se
 * verifica corriéndolo. Está declarada exenta de R17 con esa razón, y
 * este archivo es lo que se pone en su lugar — no menos gate, otro gate.
 *
 * ── LOS DOS BRAZOS, Y EL QUE IMPORTA ES EL PRIMERO ───────────────────
 * ① REGRESIÓN — la bitácora tiene que dar EXACTAMENTE lo mismo que daba
 *    con su código inline. Se implementa acá la versión VIEJA verbatim
 *    (copiada de `hogar/bitacora.tsx` antes de migrar) y se comparan las
 *    dos salidas sobre el vocabulario VIVO. Si divergen, la
 *    generalización rompió a su primer consumidor y no es generalización.
 * ② DISCRIMINACIÓN — con las perillas de D («lab» → «Labrador»), el
 *    default NO lo encuentra y la configuración SÍ. Sin este brazo, las
 *    perillas podrían no hacer nada y el brazo ① seguiría verde.
 *
 * ── LOS DATOS SON REALES, Y ESO ES PARTE DEL FIXTURE ─────────────────
 * · Las 33 voces son las VIVAS de la DB (10 `cat_conductas_bitacora` +
 *   23 `cat_objetivos_adiestramiento`, leídas el 7-ago-2026).
 * · Las razas salen de `supabase/dev/mapeo-razas-especies.json` — el
 *   archivo rescatado en S90. **No se inventa un nombre con acento para
 *   probar que los acentos funcionan**: ése es justo el dato que el
 *   rescate existía para no fabricar.
 *
 * Correr: `npx tsx scripts/verify-sugerencias.ts`
 */

import { readFileSync } from 'node:fs';
import {
  sugerir,
  coincidenciasPrimero,
  normalizarVoz,
  palabrasDeBusqueda,
} from '../packages/ui/src/components/sugerencias';

// ── LA VERSIÓN VIEJA, VERBATIM de bitacora.tsx (S65→S81) ────────────
// No se "adapta" ni se limpia: si se la toca, deja de ser el testigo.
const vNormalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
const vPalabras = (s: string) =>
  vNormalizar(s)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 4);
const vSugerencias = (texto: string, vocabulario: string[]) => {
  const palabras = vPalabras(texto);
  if (palabras.length === 0) return [];
  return vocabulario
    .map((v) => {
      const voz = vNormalizar(v);
      return { v, puntaje: palabras.filter((p) => voz.includes(p)).length };
    })
    .filter((s) => s.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, 4)
    .map((s) => s.v);
};
const vFiltro = (filtro: string, items: string[]) => {
  const palabrasFiltro = vPalabras(filtro);
  if (palabrasFiltro.length === 0) return items;
  const con = items.filter((v) => {
    const voz = vNormalizar(v);
    return palabrasFiltro.some((p) => voz.includes(p));
  });
  if (con.length === 0) return items;
  return [...con, ...items.filter((v) => !con.includes(v))];
};

// ── EL VOCABULARIO VIVO (DB, 7-ago-2026) ────────────────────────────
const CONDUCTAS = [
  'Comió normal',
  'Durmió tranquilo',
  'Estuvo inquieto en casa',
  'Estuvo más cariñoso',
  'Hizo sus necesidades adentro',
  'Jugó bien con otros perros',
  'Ladró más de lo normal',
  'Lloró cuando salimos',
  'Rompió algo en casa',
  'Se asustó con ruidos fuertes',
];
const OBJETIVOS = [
  'Camina pegado a tu paso',
  'Da la pata',
  'Encadena varias órdenes seguidas',
  'Espera antes de cruzar la puerta',
  'Espera con calma su turno',
  'Pasea sin tirar de la correa',
  'Responde aunque estés lejos',
  'Rueda cuando se lo pides',
  'Saluda sin saltar encima',
  'Se cruza con otros perros con calma',
  'Se echa cuando se lo pides',
  'Se queda quieto aunque no te vea',
  'Se queda quieto aunque pase de todo',
  'Se queda quieto donde le pides',
  'Se queda quieto largo rato',
  'Se queda tranquilo cuando no estás',
  'Se sienta cuando se lo pides',
  'Suelta lo que tiene al pedírselo',
  'Te mira cuando le hablas',
  'Va a su lugar cuando se lo pides',
  'Viene aunque haya distracciones',
  'Viene cuando lo llamas',
  'Viene incluso en espacios abiertos',
];
const VOCABULARIO = [...CONDUCTAS, ...OBJETIVOS];

// Lo que una familia teclea de verdad, con sus bordes.
const TECLEOS = [
  '',
  '   ',
  'cuando salimos lloró', // el ejemplo de la letra §7
  'CUANDO SALIMOS LLORÓ', // mayúsculas
  'cuando salimos lloro', // sin tilde
  'ladro mucho de noche',
  'se quedó quieto un rato largo',
  'no me hizo caso',
  'de la a el', // todas por debajo del mínimo
  'perros',
  'comió',
  'ruidos fuertes lo asustaron',
  'jugó, corrió; y  durmió!!', // puntuación
  'ñoño',
  'xyzzy sin coincidencia alguna',
  'viene cuando lo llamo aunque haya distracciones y ruidos',
];

let fallos = 0;
const check = (cond: boolean, nombre: string, detalle = '') => {
  console.log(`${cond ? '✓' : '✗ FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos++;
};

console.log('── BRAZO ① REGRESIÓN: la bitácora no cambia ──');
let divergenciasSug = 0;
let divergenciasFil = 0;
for (const texto of TECLEOS) {
  const viejo = vSugerencias(texto, VOCABULARIO);
  const nuevo = sugerir(VOCABULARIO, { texto, vozDe: (v) => v });
  if (JSON.stringify(viejo) !== JSON.stringify(nuevo)) {
    divergenciasSug++;
    console.log(`   ✗ sugerir("${texto}") viejo=${JSON.stringify(viejo)} nuevo=${JSON.stringify(nuevo)}`);
  }
  // el filtro corre POR GRUPO, igual que la pantalla
  for (const grupo of [CONDUCTAS, OBJETIVOS]) {
    const fv = vFiltro(texto, grupo);
    const fn = coincidenciasPrimero(grupo, { texto, vozDe: (v) => v });
    if (JSON.stringify(fv) !== JSON.stringify(fn)) {
      divergenciasFil++;
      console.log(`   ✗ filtro("${texto}") divergió en un grupo`);
    }
  }
}
check(divergenciasSug === 0, `sugerencias idénticas en ${TECLEOS.length} tecleos`, `divergencias=${divergenciasSug}`);
check(divergenciasFil === 0, `filtro idéntico en ${TECLEOS.length}×2 grupos`, `divergencias=${divergenciasFil}`);

// El fixture tiene que poder salir ROJO (L-192): si el testigo viejo y la
// pieza fueran la MISMA función, los dos brazos de arriba pasarían sin
// verificar nada — darían igual porque son lo mismo, no porque coincidan.
//
// La sonda correcta NO es "¿dan distinto con la misma entrada?" (con los
// defaults TIENEN que dar igual: eso es el brazo ①). Es "¿la pieza puede
// hacer algo que el testigo NO PUEDE EXPRESAR?" — el testigo tiene el 4
// hardcodeado, así que un tecleo de 2 letras los separa por construcción.
const testigoDiscrimina =
  vSugerencias('da', VOCABULARIO).length === 0 &&
  sugerir(VOCABULARIO, { texto: 'da', vozDe: (v) => v, minimoDeLetras: 2, modo: 'empieza' }).length > 0;
check(testigoDiscrimina, 'el testigo NO es la pieza (el fixture puede salir rojo)');

console.log('\n── BRAZO ② DISCRIMINACIÓN: las perillas de D ──');
type FilaMapeo = { carpeta: string; especie: string };
// El archivo es `{ filas: [...], colisiones: {...} }` — se lee `filas`
// POR NOMBRE. La primera versión de este fixture hacía
// `Object.values(mapeo).flat()` y pasaba DE CASUALIDAD: el objeto
// `colisiones` entraba al array y lo descartaba el filtro de especie.
// Un corpus que se arma por accidente no es un corpus (L-192).
const mapeo = JSON.parse(readFileSync('supabase/dev/mapeo-razas-especies.json', 'utf8')) as {
  filas: FilaMapeo[];
};
const TODAS: string[] = mapeo.filas.map((f) => f.carpeta);
const RAZAS: string[] = mapeo.filas.filter((f) => f.especie === 'perro').map((f) => f.carpeta);
check(mapeo.filas.length === 105, `el mapeo rescatado tiene sus 105 filas`, `${mapeo.filas.length}`);
check(RAZAS.length > 10, `corpus de razas de perro`, `${RAZAS.length}`);

const conDefault = sugerir(RAZAS, { texto: 'lab', vozDe: (r) => r });
const conPerillas = sugerir(RAZAS, {
  texto: 'lab',
  vozDe: (r) => r,
  minimoDeLetras: 2,
  modo: 'empieza',
});
check(conDefault.length === 0, '«lab» con el DEFAULT no encuentra nada (mínimo 4)', 'el caso que bloqueaba a D');
check(
  conPerillas.some((r) => r.toLowerCase().startsWith('lab')),
  '«lab» con minimo:2 + empieza SÍ encuentra',
  JSON.stringify(conPerillas),
);

// 'empieza' no es sólo "mínimo más bajo": tiene que RECHAZAR el medio.
const soloBajarMinimo = sugerir(RAZAS, { texto: 'ador', vozDe: (r) => r, minimoDeLetras: 2 });
const conEmpieza = sugerir(RAZAS, { texto: 'ador', vozDe: (r) => r, minimoDeLetras: 2, modo: 'empieza' });
check(
  soloBajarMinimo.length > 0 && conEmpieza.length === 0,
  '«ador» matchea en el MEDIO con contiene y NO con empieza',
  `contiene=${soloBajarMinimo.length} · empieza=${conEmpieza.length}`,
);

// El acento del rescate: se teclea sin tilde y se encuentra el nombre con tilde.
// Se compara contra la MINÚSCULA, no contra el original: `normalizarVoz`
// también baja la caja, así que `r !== normalizarVoz(r)` daría verdadero
// para toda raza con mayúscula inicial — un guard que dice «tiene acento»
// midiendo otra cosa (el mensaje de un guard es parte del guard, S84).
//
// ⚠️ HALLAZGO PARA D, medido acá y por eso el corpus es `TODAS` y no
// `RAZAS`: los 14 acentos del mapeo son de ave·gato·pez·reptil·roedor —
// **PERRO tiene CERO**. Con `RAZAS` este check daba 0 y el brazo del
// acento no probaba nada. (Y el segundo hallazgo, que no es de esta
// pieza pero sale del mismo dato: 7 razas de perro traen GUION BAJO en
// `carpeta` —`Pastor_Aleman`, `Labrador_Retriever`, `Jack_Rusell`—, así
// que sembrar D-379 desde este campo no da un nombre presentable. El
// «Pastor alemán» que el brief cita como el dato que el rescate salvaba
// NO está en el archivo con esa forma.)
const conTilde = TODAS.filter((r) => r.toLowerCase() !== normalizarVoz(r));
check(conTilde.length === 14, 'el corpus real tiene sus 14 nombres con acento/ñ', `${conTilde.length}: ${conTilde.slice(0, 3).join(' · ')}`);
if (conTilde.length > 0) {
  const objetivo = conTilde[0];
  const primera = normalizarVoz(objetivo).split(/[^a-z0-9]+/)[0];
  const hallado = sugerir(TODAS, { texto: primera, vozDe: (r) => r, minimoDeLetras: 2, modo: 'empieza' });
  check(hallado.includes(objetivo), `«${primera}» sin tilde encuentra «${objetivo}»`);
}

console.log('\n── BORDES ──');
check(palabrasDeBusqueda('de la a el').length === 0, 'palabras cortas se descartan con el default');
check(palabrasDeBusqueda('de la a el', { minimoDeLetras: 2 }).length === 3, 'con minimo 2 entran las de 2+');
check(sugerir([], { texto: 'lloró', vozDe: (v) => v }).length === 0, 'corpus vacío no explota');
check(
  JSON.stringify(coincidenciasPrimero(CONDUCTAS, { texto: 'xyzzy', vozDe: (v) => v })) ===
    JSON.stringify(CONDUCTAS),
  'sin coincidencias el filtro NO vacía la pantalla',
);

console.log(`\n${fallos === 0 ? '✅ VERDE' : `❌ ${fallos} FALLA(S)`}`);
process.exit(fallos === 0 ? 0 : 1);
