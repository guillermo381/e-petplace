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
  PASTILLA, SEPARACION, alturasDeLaFila, anclaOrbe, arcosDe, clasesConAlgo,
  ejeDeLaFila, movimientoCoach, nodosDeLaFila, pastillasDe,
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
t('sin pendientes ⇒ sólo los cuatro dedos',
  nodosDeLaFila(p(0, 0, null)).map((n) => n.tipo), ['dedo', 'dedo', 'dedo', 'dedo']);
t('los dedos salen en el orden en que se pasan',
  nodosDeLaFila(p(0, 0, null)).map((n) => (n.tipo === 'dedo' ? n.indice : -1)), [0, 1, 2, 3]);
t('con pendientes, las pastillas van PRIMERO (pegadas al orbe)',
  nodosDeLaFila(p(2, 1, null)).map((n) => n.tipo),
  ['pastilla', 'pastilla', 'dedo', 'dedo', 'dedo', 'dedo']);
t('y en el orden estable chat → pedidos',
  nodosDeLaFila(p(2, 1, null)).filter((n) => n.tipo === 'pastilla').map((n: any) => n.clase),
  ['chat', 'pedidos']);
t('una clase en cero no ocupa lugar en la fila',
  nodosDeLaFila(p(0, 1, null)).map((n) => n.tipo), ['pastilla', 'dedo', 'dedo', 'dedo', 'dedo']);

console.log('\n── ③ LOS NÚMEROS DICTADOS, contra el LITERAL del encargo ──');
/* 🔴 **ESTE BLOQUE NACIÓ DE UN ROJO QUE NO SALIÓ.** El control negativo movió
   `SEPARACION` de 12 a 16 y **el arnés siguió verde**: todo el bloque de
   geometría comparaba contra la propia constante, así que cambiarla cambiaba
   la vara junto con el objeto. *Un gate que se adapta a lo que mide no mide
   nada* — es el discriminador tautológico, y sólo lo destapó intentar el rojo.
   Las relaciones siguen usando las constantes (eso está bien: prueban la
   FÓRMULA); esto ancla los VALORES al literal que dictó el founder. */
t('la separación es 12', SEPARACION, 12);
t('el dedo mide 48', DEDO, 48);
t('la pastilla mide 44', PASTILLA, 44);
t('el aire desde el borde es 20', AIRE_BORDE, 20);
t('el arco son 60° con 12° de separación', [ARCO_GRADOS, ARCO_SEPARACION], [60, 12]);

console.log('\n── ③bis GEOMETRÍA DE LA FILA · la fórmula (±1 px) ──');
{
  const sinP = alturasDeLaFila(p(0, 0, null), 412);
  const eje = ejeDeLaFila(412);
  cerca('el primer dedo queda a 12 del borde del orbe ABIERTO',
    sinP[0] - DEDO / 2 - (eje.abajo + ORBE_ABIERTO / 2), SEPARACION);
  for (let i = 1; i < sinP.length; i++)
    cerca(`dedo ${i - 1}→${i} separados 12`, sinP[i] - DEDO / 2 - (sinP[i - 1] + DEDO / 2), SEPARACION);
  cerca('centro a centro entre dedos = 48 + 12', sinP[1] - sinP[0], DEDO + SEPARACION);
}
{
  /* 🔴 EL CASO QUE UNA FÓRMULA POR ÍNDICE ROMPERÍA: la pastilla mide 44 y el
     dedo 48. Si las alturas se calcularan como `i * paso`, acá aparecerían
     solapes de 4 px — y un solape de 4 px no se lee como error, se lee como
     un espaciado descuidado. */
  const conP = alturasDeLaFila(p(2, 1, null), 412);
  const eje = ejeDeLaFila(412);
  cerca('la primera pastilla queda a 12 del orbe abierto',
    conP[0] - PASTILLA / 2 - (eje.abajo + ORBE_ABIERTO / 2), SEPARACION);
  cerca('pastilla → pastilla, 12', conP[1] - PASTILLA / 2 - (conP[0] + PASTILLA / 2), SEPARACION);
  cerca('🔴 pastilla(44) → dedo(48), TAMBIÉN 12',
    conP[2] - DEDO / 2 - (conP[1] + PASTILLA / 2), SEPARACION);
  cerca('dedo → dedo, 12', conP[3] - DEDO / 2 - (conP[2] + DEDO / 2), SEPARACION);
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
const rBrasa = CODIGO.match(/r=\{`\$\{\(BRASA\.diametro \/ 2\) \* 100\}%`\}/);
t('la brasa toma su radio de `BRASA.diametro / 2`', rBrasa !== null, true);
t('🔴 y ese diámetro es ≤ 40 % del cuerpo', BRASA.diametro <= 0.4, true);
cerca('está corrida a 56/62 %, no centrada', BRASA.cx * 100, 56);
cerca('…y en el eje vertical', BRASA.cy * 100, 62);
t('CONTROL NEGATIVO · no está centrada (si lo estuviera, no sería una brasa)',
  BRASA.cx === 0.5 && BRASA.cy === 0.5, false);
t('el cuerpo en reposo va de la perla al borde LILA, no a un ocre',
  /coachPerla\b[\s\S]{0,200}coachPerlaBorde/.test(CODIGO), true);
t('el cuerpo despierto tiene sus tres paradas',
  /coachClaro[\s\S]{0,200}coachMedio[\s\S]{0,200}coachProfundo/.test(CODIGO), true);
t('el cuerpo se dibuja en SVG, no con un color de fondo',
  /<RadialGradient/.test(CODIGO) && /backgroundColor:\s*palette\.coachPerla/.test(CODIGO) === false, true);

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

console.log('\n── ⑪ EL ORBE ABIERTO ABRE LA HOJA, no cierra la fila ──');
t('abierta ⇒ su toque llama a `onPreguntar`', /abierta \? onPreguntar : onAbrir/.test(CODIGO), true);
t('y cerrar sigue siendo el velo', /onPress=\{onCerrar\}/.test(CODIGO), true);

console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
