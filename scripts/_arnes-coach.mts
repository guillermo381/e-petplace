/* Arnés de la PRESENCIA DEL COACH — la fila, los estados y el movimiento.
   Importa sólo módulos puros: `coach-geometria` no arrastra `react-native`,
   que es la razón por la que ese archivo existe.

   ⏪ **ACÁ SE MEDÍA UNA HUELLA Y MURIÓ CON ELLA (lote 0.1).** Los tests de
   las cuatro posiciones de pata, del viaje al centro y del ascenso se fueron
   enteros: *un gate que sobrevive a la forma que medía no queda verde por
   casualidad — queda verde midiendo algo que ya no existe*, y eso es peor
   que no tenerlo (Ley 37 aplicada a los instrumentos). */
import {
  AIRE_BORDE, ARCO_GRADOS, ARCO_SEPARACION, BRASA, DEDO, ORBE, ORBE_ABIERTO,
  BRASA, BRASA_ALFA, BRASA_MUERE, LIENZO, PASTILLA, SEPARACION, alturasDeLaFila, anclaOrbe, arcosDe, clasesConAlgo,
  ORBE_MINI, ejeDeLaFila, sePinta, violetaEncendido, vozDelOrbe, movimientoCoach, nodosDeLaFila, pastillasDe,
} from '../packages/ui/src/components/coach-geometria.ts';
import { readFileSync } from 'node:fs';

let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); } else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
/** Tolerancia de 1 px, como pide el encargo. */
const cerca = (n: string, real: number, esp: number) => {
  if (Math.abs(real - esp) <= 1) { ok++; console.log(`  ✓ ${n}`); }
  else { mal++; console.log(`  ✗ ${n}\n     esperado ${esp} ±1\n     real     ${real}`); }
};
const p = (chat: number, pedidos: number, avisos: number | null) => ({ chat, pedidos, avisos });
/* 412 es un teléfono corriente; 320 el más angosto que sigue vivo. */
const ANCHOS = [320, 412, 480];

console.log('\n── ① EL ORBE NO SE MUEVE, SÓLO CRECE ──');
t('en reposo mide 48', ORBE, 48);
t('abierto mide 52 — cuatro más, ni un píxel de viaje', ORBE_ABIERTO, 52);
for (const w of ANCHOS) {
  const a = anclaOrbe(w), e = ejeDeLaFila(w);
  cerca(`ancho ${w} · queda a ${AIRE_BORDE} del borde derecho`, w - (a.izquierda + ORBE), AIRE_BORDE);
  cerca(`ancho ${w} · el eje de la fila ES el centro del orbe`, e.x, a.izquierda + ORBE / 2);
}
t('el eje no depende del aire inferior en X',
  ejeDeLaFila(412, 0).x === ejeDeLaFila(412, 96).x, true);
cerca('pero SÍ sube con la barra de tabs', ejeDeLaFila(412, 96).abajo - ejeDeLaFila(412, 0).abajo, 96);

console.log('\n── ② LA FILA · orden de abajo hacia arriba ──');
/* ⏪ **Estos tests se reescribieron en el lote 0.2.** «Preguntale» dejó de ser
   el toque del orbe abierto y bajó a la lista como PRIMER nodo. Los del orden
   viejo no se conservan «por las dudas»: *un gate que sobrevive a la forma que
   medía queda verde midiendo algo que ya no existe.* */
t('sin pendientes ⇒ preguntar + los cuatro dedos',
  nodosDeLaFila(p(0, 0, null)).map((n) => n.tipo), ['preguntar', 'dedo', 'dedo', 'dedo', 'dedo']);
t('🔴 «Preguntale» es SIEMPRE el primero, pegado al orbe',
  nodosDeLaFila(p(9, 9, 9))[0].tipo, 'preguntar');
t('los dedos salen en el orden en que se pasan',
  nodosDeLaFila(p(0, 0, null)).filter((n) => n.tipo === 'dedo').map((n: any) => n.indice), [0, 1, 2, 3]);
t('el orden completo: orbe · preguntar · pendientes · los cuatro',
  nodosDeLaFila(p(2, 1, null)).map((n) => n.tipo),
  ['preguntar', 'pastilla', 'pastilla', 'dedo', 'dedo', 'dedo', 'dedo']);
t('y las pastillas en el orden estable chat → pedidos',
  nodosDeLaFila(p(2, 1, null)).filter((n) => n.tipo === 'pastilla').map((n: any) => n.clase),
  ['chat', 'pedidos']);
t('una clase en cero no ocupa lugar en la fila',
  nodosDeLaFila(p(0, 1, null)).map((n) => n.tipo), ['preguntar', 'pastilla', 'dedo', 'dedo', 'dedo', 'dedo']);
t('el orbe chico de «Preguntale» mide 36', ORBE_MINI, 36);

console.log('\n── ③ LOS NÚMEROS DICTADOS, contra el LITERAL del encargo ──');
/* 🔴 **ESTE BLOQUE NACIÓ DE UN ROJO QUE NO SALIÓ.** El control negativo movió
   `SEPARACION` de 12 a 16 y **el arnés siguió verde**: todo el bloque de
   geometría comparaba contra la propia constante, así que cambiarla movía la
   vara junto con el objeto. *Un gate que se adapta a lo que mide no mide
   nada.* Las relaciones prueban la FÓRMULA; esto ancla los VALORES. */
t('la separación es 12', SEPARACION, 12);
t('el dedo mide 48', DEDO, 48);
t('la pastilla mide 44', PASTILLA, 44);
t('el aire desde el borde es 20', AIRE_BORDE, 20);
t('el arco son 60° con 12° de separación', [ARCO_GRADOS, ARCO_SEPARACION], [60, 12]);
t('el orbe abierto crece a 52 y NO viaja', ORBE_ABIERTO, 52);

console.log('\n── ③bis GEOMETRÍA DE LA FILA · la fórmula (±1 px) ──');
{
  const alturas = alturasDeLaFila(p(0, 0, null), 412);
  const nodos = nodosDeLaFila(p(0, 0, null));
  const eje = ejeDeLaFila(412);
  cerca('el primer nodo queda a 12 del borde del orbe ABIERTO',
    alturas[0] - nodos[0].alto / 2 - (eje.abajo + ORBE_ABIERTO / 2), SEPARACION);
  for (let i = 1; i < alturas.length; i++)
    cerca(`nodo ${i - 1}→${i} separados 12`,
      alturas[i] - nodos[i].alto / 2 - (alturas[i - 1] + nodos[i - 1].alto / 2), SEPARACION);
}
{
  /* 🔴 EL CASO QUE UNA FÓRMULA POR ÍNDICE ROMPERÍA: acá conviven TRES altos
     distintos —36 el orbe chico, 44 la pastilla, 48 el dedo—. Con `i * paso`
     aparecen solapes que no se leen como error: se leen como un espaciado
     descuidado. */
  const alturas = alturasDeLaFila(p(2, 1, null), 412);
  const nodos = nodosDeLaFila(p(2, 1, null));
  t('la fila mezcla TRES altos distintos', [...new Set(nodos.map((n) => n.alto))].sort(), [36, 44, 48]);
  for (let i = 1; i < alturas.length; i++)
    cerca(`🔴 nodo(${nodos[i - 1].alto}) → nodo(${nodos[i].alto}), TAMBIÉN 12`,
      alturas[i] - nodos[i].alto / 2 - (alturas[i - 1] + nodos[i - 1].alto / 2), SEPARACION);
}
t('la fila sube: cada nodo por encima del anterior',
  alturasDeLaFila(p(2, 1, null), 412).every((h, i, a) => i === 0 || h > a[i - 1]), true);
t('el ancho de pantalla no mueve las alturas',
  alturasDeLaFila(p(1, 0, null), 320).join() === alturasDeLaFila(p(1, 0, null), 480).join(), true);

console.log('\n── ④ ESTADOS · los arcos ──');
t('sin nada ⇒ SIN arcos (en reposo no hay línea)', arcosDe(p(0, 0, 0)), []);
t('sólo chat ⇒ UN arco centrado arriba',
  arcosDe(p(2, 0, 0)).map((a) => [a.clase, a.desde, a.hasta]), [['chat', -30, 30]]);
t('dos arcos: 60° cada uno y 12° de separación',
  (() => { const [a, b] = arcosDe(p(2, 1, 0)); return [a.hasta - a.desde, b.hasta - b.desde, b.desde - a.hasta]; })(),
  [ARCO_GRADOS, ARCO_GRADOS, ARCO_SEPARACION]);
t('los tres ⇒ tres arcos, y el bloque sigue centrado',
  (() => { const a = arcosDe(p(1, 1, 1)); return [a.length, a[0].desde + a[2].hasta]; })(), [3, 0]);

console.log('\n── ⑤ `null` NO ES CERO — el control que el encargo pidió ──');
t('avisos null ⇒ SIN arco violeta', arcosDe(p(1, 0, null)).map((a) => a.clase), ['chat']);
t('CONTROL NEGATIVO · avisos 0 tampoco dibuja', arcosDe(p(1, 0, 0)).map((a) => a.clase), ['chat']);
t('CONTROL POSITIVO · avisos 1 SÍ dibuja', arcosDe(p(1, 0, 1)).map((a) => a.clase), ['chat', 'avisos']);
t('un negativo no cuenta como algo', clasesConAlgo(p(-3, 0, null)), []);
t('los avisos NO tienen pastilla: se dicen en el halo', pastillasDe(p(0, 0, 9)), []);

console.log('\n── ⑥ REDUCE-MOTION · medido, no supuesto ──');
t('dormida y con movimiento ⇒ respira y barre', movimientoCoach({ quieta: false, abierta: false }),
  { respira: true, barre: true, escalona: true });
t('🔴 quieta ⇒ NADA se monta', movimientoCoach({ quieta: true, abierta: false }),
  { respira: false, barre: false, escalona: false });
t('quieta Y abierta ⇒ tampoco', movimientoCoach({ quieta: true, abierta: true }),
  { respira: false, barre: false, escalona: false });
t('abierta sin reduce-motion ⇒ no respira, pero SÍ escalona',
  movimientoCoach({ quieta: false, abierta: true }), { respira: false, barre: false, escalona: true });

const FUENTE = readFileSync(new URL('../packages/ui/src/components/PresenciaCoach.tsx', import.meta.url), 'utf8');
/* 🔴 **SE MIDE EL CÓDIGO, NO LA PROSA (`L-170`).** La primera versión leía el
   archivo entero y se cazó a sí misma con su propia cabecera. */
const CODIGO = FUENTE.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
/** Saca los comentarios: **se mide el CÓDIGO, no la prosa** (`L-170`). Una
 *  versión vieja de este arnés leía el archivo entero y se cazó a sí misma
 *  con su propia cabecera. */
const sinComentarios = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1')

/* ⚠️ **LAS TRES FUENTES SE LEEN JUNTAS, ACÁ.** La primera versión declaraba
   dos de ellas más abajo, donde se usaban, y el bloque nuevo las llamaba
   antes ⇒ `Cannot access before initialization`. *Es el mismo defecto que
   `verify:ref-antes-de-uso` vigila en la casa, cometido por quien escribe su
   gate.* */
const ORBE_SRC = sinComentarios(
  readFileSync(new URL('../packages/ui/src/components/OrbeCoach.tsx', import.meta.url), 'utf8'),
);
const CAB_SRC = sinComentarios(
  readFileSync(new URL('../packages/ui/src/components/CabeceraCoach.tsx', import.meta.url), 'utf8'),
);

console.log('\n── ⑦ LA PIEZA CONSUME LAS DECISIONES (si no, ⑥ mide funciones huérfanas) ──');
t('llama a `movimientoCoach`', /movimientoCoach\(\{/.test(CODIGO), true);
t('🔴 y NO re-deriva el guard a mano', /!quieta\s*&&/.test(CODIGO), false);
t('las alturas salen de `alturasDeLaFila`', /alturasDeLaFila\(/.test(CODIGO), true);
t('el eje sale de `ejeDeLaFila`', /ejeDeLaFila\(/.test(CODIGO), true);
t('cero `setInterval` / `setTimeout`', /set(Interval|Timeout)\(/.test(CODIGO), false);
t('cero `useState` (no re-renderiza mientras respira)', /useState/.test(CODIGO), false);
t('no teclea el nombre del Coach', /Nexo/i.test(CODIGO), false);

console.log('\n── ⑧ EL MATERIAL DEL ORBE, LEÍDO DEL SVG ──');
/* La brasa se declara en el SVG como `r` = MITAD de su diámetro. */
const rBrasa = ORBE_SRC.match(/r=\{`\$\{\(BRASA\.diametro \/ 2\) \* 100\}%`\}/);
t('la brasa toma su radio de `BRASA.diametro / 2`', rBrasa !== null, true);
t('🔴 y ese diámetro es ≤ 40 % del cuerpo', BRASA.diametro <= 0.4, true);
cerca('está corrida a 56/62 %, no centrada', BRASA.cx * 100, 56);
cerca('…y en el eje vertical', BRASA.cy * 100, 62);
t('CONTROL NEGATIVO · no está centrada (si lo estuviera, no sería una brasa)',
  BRASA.cx === 0.5 && BRASA.cy === 0.5, false);
t('el cuerpo en reposo va de la perla a un borde de identidad, no a un ocre',
  /coachPerla\b[\s\S]{0,240}vivo[^\n]*LILA_ALFA/.test(ORBE_SRC), true);
t('…y ese borde es el violeta SÓLO si nadie pasa otro color',
  /const vivo = color \?\? palette\.coachMedio/.test(ORBE_SRC), true);
t('🔴 y el token con alpha embebido murió', /coachPerlaBorde/.test(ORBE_SRC), false);
t('el cuerpo despierto tiene sus tres paradas',
  /coachClaro[\s\S]{0,200}coachMedio[\s\S]{0,200}coachProfundo/.test(ORBE_SRC), true);
t('el cuerpo se dibuja en SVG, no con un color de fondo',
  /<RadialGradient/.test(ORBE_SRC) && /backgroundColor:\s*palette\.coachPerla/.test(ORBE_SRC) === false, true);

console.log('\n── ⑨ EN REPOSO NO HAY LÍNEA BASE (§3) ──');
t('🔴 el aro sólo se monta con arcos', /arcos\.length > 0 \? \(/.test(CODIGO), true);
t('y no quedó ningún `<Circle` de halo con stroke',
  /<Circle[^>]*stroke=\{palette\.coachHalo\}/.test(CODIGO), false);
t('el token del halo ya no lo usa la pieza', /coachHalo/.test(CODIGO), false);

console.log('\n── ⑩ LAS ETIQUETAS (§4) ──');
t('fuente de CONTROLES de la casa (la de la barra de pestañas)',
  /typography\.family\.sans\.medium/.test(CODIGO), true);
t('tamaño de control (13), no un número tecleado',
  /typography\.size\.control/.test(CODIGO) && /fontSize:\s*13\b/.test(CODIGO) === false, true);
t('🔴 NUNCA se truncan: sin `numberOfLines` ni `ellipsizeMode`',
  /numberOfLines|ellipsizeMode/.test(CODIGO), false);
/* ⚠️ **ACOTADO AL COMPONENTE, y la primera versión no lo estaba.** Medía
   `flex: 1` en TODO el archivo y daba rojo por el velo —que ocupa la pantalla
   entera y es exactamente lo que tiene que hacer—. *Un gate que dice medir la
   etiqueta y mide el archivo no está sobre-protegiendo: está midiendo otra
   cosa y llamándola por el nombre de ésta.* */
const ETIQUETA = (CODIGO.match(/function Etiqueta\([\s\S]*?\n\}/) ?? [''])[0];
t('el gate encontró el componente que dice medir', ETIQUETA.length > 0, true);
t('…y sin `flex` que las comprima', /flex:\s*1/.test(ETIQUETA), false);
t('su caja se abraza al texto (sin ancho fijo)', /width:\s*\d/.test(ETIQUETA), false);
t('nada de mono: la mono es para metadatos', /family\.mono/.test(CODIGO), false);
/* Cuánto lugar tiene una etiqueta antes de tocar el borde izquierdo.
   ⚠️ SUPUESTO DECLARADO: DM Sans medium promedia ~0,55 em de avance por
   carácter. Es una estimación, y se dice que lo es — el ancho exacto lo mide
   el aparato. Lo que esto prueba es que **el espacio disponible no es el
   problema**, ni siquiera en el teléfono más angosto. */
const anchoEtiqueta = (n: number) => n * 13 * 0.55 + 24;
for (const w of ANCHOS) {
  const disponible = w - (AIRE_BORDE + ORBE + SEPARACION) - AIRE_BORDE;
  t(`ancho ${w} · una etiqueta de 20 caracteres entra (${Math.round(anchoEtiqueta(20))} de ${disponible})`,
    anchoEtiqueta(20) <= disponible, true);
}

console.log('\n── ⑪ EL ORBE ABRE Y CIERRA (decisión del founder, lote 0.2) ──');
/* ⏪ Acá se medía lo contrario: *«abierta ⇒ su toque llama a onPreguntar»*.
   El founder lo cambió y la mesa lo hizo suyo: **el orbe cambia de cara
   —perla cerrado, violeta abierto— y ese cambio es lo que enseña a tocarlo.** */
t('🔴 abierta ⇒ su toque CIERRA', /abierta \? onCerrar : onAbrir/.test(CODIGO), true);
t('y `onPreguntar` ya NO vive en el orbe', /abierta \? onPreguntar/.test(CODIGO), false);
t('vive en la fila «Preguntale»', /onPreguntar\?\.\(\)/.test(CODIGO), true);

console.log('\n── ⑫ D-1019 · LA ETIQUETA DEL ORBE DICE EL ESTADO ──');
/* 🔴 **En web `accessibilityState` no llega ⇒ la ETIQUETA es el mecanismo.**
   Por eso esto se asierta y no se confía al `expanded`. */
{
  const voz = { abrir: 'Abrir a X', cerrar: 'Cerrar' };
  t('cerrado ⇒ dice cómo ABRIR', vozDelOrbe(false, voz), 'Abrir a X');
  t('🔴 abierto ⇒ dice CERRAR', vozDelOrbe(true, voz), 'Cerrar');
  t('🔴 y las dos son DISTINTAS (el rojo de D-1019)',
    vozDelOrbe(false, voz) !== vozDelOrbe(true, voz), true);
}
t('la pieza la consume (si no, esto mide una función huérfana)',
  /vozDelOrbe\(abierta, voz\)/.test(CODIGO), true);
t('🔴 y NO quedó una etiqueta fija en el orbe',
  /accessibilityLabel=\{voz\.orbe\}/.test(CODIGO), false);
t('el velo comparte la voz de cerrar: es el mismo acto',
  (CODIGO.match(/voz\.cerrar/g) ?? []).length >= 1, true);

console.log('\n── ⑬ UN SOLO DIBUJO DEL ORBE (lote 0.3) ──');
t('la pieza única existe', ORBE_SRC.length > 0, true);
t('🔴 `PresenciaCoach` no dibuja su propio orbe', /<RadialGradient/.test(CODIGO), false);
t('🔴 `CabeceraCoach` tampoco — era la copia que quedó rota',
  /<RadialGradient/.test(CAB_SRC), false);
t('las tres apariciones montan `OrbeCoach`',
  (CODIGO.match(/<OrbeCoach/g) ?? []).length === 2 && /<OrbeCoach/.test(CAB_SRC), true);
t('sólo el grande lleva resplandor',
  (CODIGO.match(/conResplandor/g) ?? []).length === 1 && /conResplandor/.test(CAB_SRC) === false, true);
t('cada instancia deriva sus `id` (son globales en react-native-svg)',
  /useId\(\)/.test(ORBE_SRC), true);

console.log('\n── ⑭ LA BRASA ES CALOR, NO UN PUNTO ──');
/* ⏪ Con dos paradas se leía «un punto con borde»: una caída lineal termina
   en un anillo donde el degradé se corta, y el ojo lee ese corte. */
t('🔴 su opacidad tope es ≤ 0,70', BRASA_ALFA <= 0.7, true);
t('🔴 muere ANTES del final del gradiente (sin corte visible)', BRASA_MUERE <= 0.6, true);
t('el calor visible no pasa del 40 % del diámetro',
  BRASA.diametro * BRASA_MUERE <= 0.4, true);
t('tiene paradas INTERMEDIAS: sin ellas la caída es lineal y hace borde',
  (ORBE_SRC.match(/offset/g) ?? []).length >= 5, true);
t('ninguna parada usa rgba en el color', /stopColor=\{[^}]*rgba/.test(ORBE_SRC), false);

console.log('\n── ⑮ LA CAPA VIOLETA · 0 en reposo, 1 despierta (asertado) ──');
t('🔴 dormida ⇒ 0', violetaEncendido({ abierta: false, estado: 'dormida' }), 0);
t('atenta y cerrada ⇒ 0 (tener pendientes no es estar despierto)',
  violetaEncendido({ abierta: false, estado: 'atenta' }), 0);
t('🔴 abierta ⇒ 1', violetaEncendido({ abierta: true, estado: 'dormida' }), 1);
t('hablando, aunque la fila esté cerrada ⇒ 1',
  violetaEncendido({ abierta: false, estado: 'hablando' }), 1);
t('despierta ⇒ 1', violetaEncendido({ abierta: false, estado: 'despierta' }), 1);
t('la pieza la consume (si no, esto mide una función huérfana)',
  /violetaEncendido\(\{/.test(CODIGO), true);
t('…y el fundido es el de 250 ms de la casa', /motion\.coach\.fundidoMs/.test(CODIGO), true);

console.log('\n── ⑮ D-1025 · UN DISCO NO ABRE SOBRE EL VACÍO ──');
/* 🔴 **Esta regla ya existía en `BurbujaPendientes` y se perdió al absorberla:
   vino la forma y no vino la prosa.** Por eso ahora es una FUNCIÓN — lo que
   vive en un comentario no lo hereda nadie. */
t('🔴 sin Coach y sin nada ⇒ NO se dibuja',
  sePinta({ coach: false, pendientes: p(0, 0, null) }), false);
t('sin Coach y sin nada, con avisos en 0 ⇒ tampoco',
  sePinta({ coach: false, pendientes: p(0, 0, 0) }), false);
t('CONTROL POSITIVO · sin Coach pero CON un pendiente ⇒ sí',
  sePinta({ coach: false, pendientes: p(1, 0, null) }), true);
t('…y alcanza con las solicitudes del refugio',
  sePinta({ coach: false, pendientes: { chat: 0, pedidos: 0, avisos: null, solicitudes: 2 } }), true);
t('🔴 CON Coach se dibuja SIEMPRE, aunque no haya nada',
  sePinta({ coach: true, pendientes: p(0, 0, null) }), true);
t('un negativo no cuenta como pendiente',
  sePinta({ coach: false, pendientes: p(-2, 0, null) }), false);
t('la pieza la consume y sale por `null`',
  /if \(!sePinta\(\{ coach, pendientes \}\)\) return null/.test(CODIGO), true);
/* ⚠️ **ACOTADO AL CUERPO DE `PresenciaCoach`, y la primera versión no lo
   estaba.** Comparaba posiciones en el ARCHIVO ENTERO, y `useAnimatedStyle`
   aparece en `Orbe` y `NodoDeFila`, que viven más arriba ⇒ **el test daba
   verde aunque el guard estuviera en la primera línea de la función.** Lo
   destapó intentar el rojo: subí el guard antes de todos los hooks y el
   arnés no se movió. *Es el mismo defecto de alcance que ya me cobró una vez
   en este arnés — un gate que mide el archivo con el nombre de la función
   mide otra cosa.* */
{
  const i = CODIGO.indexOf('export function PresenciaCoach');
  const cuerpo = CODIGO.slice(i);
  t('el gate encontró el cuerpo que dice medir', i > 0, true);
  t('🔴 y el guard va DESPUÉS de los hooks (si no, cambia su orden entre renders)',
    cuerpo.indexOf('useReducedMotion()') < cuerpo.indexOf('!sePinta'), true);
}

console.log('\n── ⑮bis LA PRESENCIA SIN COACH (lote 0.3) ──');
/* 🔴 **Es la MISMA pieza haciendo el otro trabajo**, y así es como el
   prestador y el cliente en memorial tienen su puerta sin que exista una
   segunda. `BurbujaPendientes` queda derogada por esto. */
t('🔴 sin Coach NO hay dedos', nodosDeLaFila(p(2, 1, null), 4, false).some((n) => n.tipo === 'dedo'), false);
t('🔴 sin Coach NO hay «Preguntale»',
  nodosDeLaFila(p(2, 1, null), 4, false).some((n) => n.tipo === 'preguntar'), false);
t('la fila son SÓLO los pendientes',
  nodosDeLaFila(p(2, 1, null), 4, false).map((n) => n.tipo), ['pastilla', 'pastilla']);
t('CONTROL POSITIVO · con Coach sí están los dos',
  nodosDeLaFila(p(2, 1, null), 4, true).filter((n) => n.tipo !== 'pastilla').map((n) => n.tipo),
  ['preguntar', 'dedo', 'dedo', 'dedo', 'dedo']);
t('sin pendientes y sin Coach ⇒ la fila está vacía', nodosDeLaFila(p(0, 0, null), 4, false), []);
t('las alturas respetan el modo',
  alturasDeLaFila(p(2, 1, null), 412, 0, 4, false).length, 2);
t('las solicitudes del refugio son una clase más',
  nodosDeLaFila({ chat: 0, pedidos: 0, avisos: null, solicitudes: 4 }, 4, false).map((n: any) => n.clase),
  ['solicitudes']);
t('y también tienen su arco', arcosDe({ chat: 0, pedidos: 0, avisos: null, solicitudes: 4 }).map((a) => a.clase), ['solicitudes']);
t('🔴 el color de la presencia SIN Coach sale de `accent.cta`, no del violeta',
  /const identidad = coach \? palette\.coachMedio : theme\.accent\.cta/.test(CODIGO), true);
t('…y el orbe recibe ese color en vez del suyo',
  /color=\{coach \? undefined : identidad\}/.test(CODIGO), true);
t('🔴 en memorial la PUERTA sobrevive, el Coach no',
  /if \(esMemorial && coach\) return null/.test(CODIGO), true);
t('cada pastilla sin Coach lleva su círculo con glifo',
  /coach \? null : \(/.test(CODIGO) && /pastilla\(n\.clase\)\.glifo/.test(CODIGO), true);

console.log('\n── ⑯ EL MATERIAL, contra lo que Android SÍ dibuja ──');
/* ⏪ Estos cinco medían sobre `PresenciaCoach`; el dibujo se mudó a
   `OrbeCoach` en el lote 0.3 y **el gate lo dijo con cuatro rojos** en vez de
   quedarse verde sobre un archivo que ya no dibuja nada. Se reapuntan, no se
   relajan. */
/* 🔴 Los dos defectos que sólo el emulador dijo, hechos gate. */
t('🔴 ningún `stopColor` con rgba: Android le come el alpha',
  /stopColor=\{[^}]*rgba/.test(ORBE_SRC), false);
t('las paradas translúcidas usan `stopOpacity`', /stopOpacity=/.test(ORBE_SRC), true);
t('🔴 el resplandor NO es una sombra de RN (no existe en Android)',
  /shadowColor|shadowRadius|shadowOpacity/.test(CODIGO + ORBE_SRC + CAB_SRC), false);
t('…es un círculo con su propio radial', /glow/.test(ORBE_SRC), true);
t('el barrido tampoco es una capa de RN encimada',
  /expo-linear-gradient/.test(CODIGO), false);
t('el lienzo le da lugar al resplandor', LIENZO >= 2, true);

console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
