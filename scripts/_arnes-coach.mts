/* Arnés de NEXO — la geometría, los estados y el movimiento (S113-B · lote 0).
   Importa SÓLO módulos puros: `coach-geometria` no arrastra `react-native`, que
   es la razón por la que vive fuera del componente. */
import {
  ALMOHADILLA, ALTO_VOZ, AIRE_BORDE, ARCO_GRADOS, ARCO_SEPARACION, DEDO, HALO, ORBE,
  POSICIONES_DEDOS, anclaOrbe, arcosDe, ascensoAlDespertar, centroAlmohadilla, centroDedo,
  clasesConAlgo, desplazamientoAlCentro, movimientoCoach, pastillasDe,
} from '../packages/ui/src/components/coach-geometria.ts';
import { readFileSync } from 'node:fs';

let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); }
  else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
/** Tolerancia de 1 px, como pide el encargo. */
const cerca = (n: string, real: number, esp: number) => {
  if (Math.abs(real - esp) <= 1) { ok++; console.log(`  ✓ ${n}`); }
  else { mal++; console.log(`  ✗ ${n}\n     esperado ${esp} ±1\n     real     ${real}`); }
};

console.log('\n── ① GEOMETRÍA (§2.1 · §2.3), contra los números del encargo ──');
t('el orbe dormido mide 48', ORBE, 48);
t('el halo mide 66', HALO, 66);
t('la almohadilla mide 58', ALMOHADILLA, 58);
t('el dedo mide 48', DEDO, 48);
t('todo objetivo táctil ≥ 44 (Ley 8)', [ORBE >= 44, DEDO >= 44, ALMOHADILLA >= 44], [true, true, true]);
t('las cuatro posiciones de pata, literales', POSICIONES_DEDOS.map((p) => [p.dx, p.dy]),
  [[-62, 58], [-24, 96], [24, 96], [62, 58]]);
t('son EXACTAMENTE cuatro dedos', POSICIONES_DEDOS.length, 4);
t('las patas son simétricas respecto del eje', POSICIONES_DEDOS.map((p) => p.dx).reduce((a, b) => a + b, 0), 0);

console.log('\n── ② EL ANCLAJE se DERIVA del ancho, jamás se teclea ──');
/* 412 es el ancho de un teléfono corriente; 320 el más angosto que sigue vivo. */
for (const ancho of [320, 412, 480]) {
  const a = anclaOrbe(ancho);
  cerca(`ancho ${ancho} · el orbe queda a ${AIRE_BORDE} del borde derecho`, ancho - (a.izquierda + ORBE), AIRE_BORDE);
  cerca(`ancho ${ancho} · al viajar, su centro cae en el medio`, a.izquierda + ORBE / 2 - desplazamientoAlCentro(ancho), ancho / 2);
}
const c = centroAlmohadilla(412, 56);
cerca('la almohadilla se centra horizontalmente', c.x, 206);
cerca('y deja lugar a su voz debajo (no toca el piso)', c.abajo - ALMOHADILLA / 2 - 56 - AIRE_BORDE, ALTO_VOZ);
cerca('el ascenso al despertar es la diferencia de alturas', ascensoAlDespertar(56), ALTO_VOZ + (ALMOHADILLA - ORBE) / 2);
t('el dedo 0 sube y va a la izquierda', [centroDedo(0, 412, 0).x < c.x, centroDedo(0, 412, 0).abajo > centroAlmohadilla(412, 0).abajo], [true, true]);
cerca('el dedo 3 espeja al 0', centroDedo(3, 412, 0).x - c.x, c.x - centroDedo(0, 412, 0).x);

/* El halo desborda al orbe: quien monte tiene que compensar esa diferencia o
   el cuerpo queda corrido. Se mide acá para que el número exista. */
cerca('el halo desborda 9 px por lado', (HALO - ORBE) / 2, 9);
t('la caja táctil es el HALO (≥44 con holgura)', HALO >= 44, true);

console.log('\n── ③ ESTADOS · los arcos (§2.2) ──');
const p = (chat: number, pedidos: number, avisos: number | null) => ({ chat, pedidos, avisos });
t('sin nada ⇒ SIN arcos (el halo dormido queda entero)', arcosDe(p(0, 0, 0)), []);
t('sólo chat ⇒ UN arco, y es de chat', arcosDe(p(2, 0, 0)).map((a) => a.clase), ['chat']);
t('un arco solo va centrado arriba', arcosDe(p(2, 0, 0)).map((a) => [a.desde, a.hasta]), [[-30, 30]]);
t('chat + pedidos ⇒ DOS arcos en orden', arcosDe(p(2, 1, 0)).map((a) => a.clase), ['chat', 'pedidos']);
t('dos arcos: 60° cada uno y 12° de separación',
  (() => { const [a, b] = arcosDe(p(2, 1, 0)); return [a.hasta - a.desde, b.hasta - b.desde, b.desde - a.hasta]; })(),
  [ARCO_GRADOS, ARCO_GRADOS, ARCO_SEPARACION]);
t('dos arcos quedan centrados arriba',
  (() => { const a = arcosDe(p(2, 1, 0)); return a[0].desde + a[a.length - 1].hasta; })(), 0);
t('los tres ⇒ TRES arcos, y el bloque sigue centrado',
  (() => { const a = arcosDe(p(1, 1, 1)); return [a.length, a[0].desde + a[2].hasta]; })(), [3, 0]);

console.log('\n── ④ `null` NO ES CERO — el control que el encargo pidió ──');
t('avisos null ⇒ SIN arco violeta', arcosDe(p(1, 0, null)).map((a) => a.clase), ['chat']);
t('CONTROL NEGATIVO · avisos 0 tampoco dibuja', arcosDe(p(1, 0, 0)).map((a) => a.clase), ['chat']);
t('CONTROL POSITIVO · avisos 1 SÍ dibuja', arcosDe(p(1, 0, 1)).map((a) => a.clase), ['chat', 'avisos']);
t('sólo avisos null ⇒ nada, sin romperse', arcosDe(p(0, 0, null)), []);
t('un negativo no cuenta como algo', clasesConAlgo(p(-3, 0, null)), []);

console.log('\n── ⑤ PASTILLAS: sólo las que tengan algo ──');
t('nada ⇒ ninguna pastilla', pastillasDe(p(0, 0, 5)), []);
t('chat a la izquierda', pastillasDe(p(2, 0, null)), [{ clase: 'chat', cuenta: 2, lado: 'izquierda' }]);
t('pedidos a la derecha', pastillasDe(p(0, 1, null)), [{ clase: 'pedidos', cuenta: 1, lado: 'derecha' }]);
t('las dos, cada una en su lado', pastillasDe(p(2, 1, 9)).map((x) => [x.clase, x.lado]),
  [['chat', 'izquierda'], ['pedidos', 'derecha']]);

console.log('\n── ⑥ REDUCE-MOTION · medido, no supuesto ──');
t('dormida y con movimiento ⇒ respira y barre', movimientoCoach({ quieta: false, abierta: false }),
  { respira: true, barre: true, escalona: true });
t('🔴 quieta ⇒ NADA se monta', movimientoCoach({ quieta: true, abierta: false }),
  { respira: false, barre: false, escalona: false });
t('quieta Y abierta ⇒ tampoco', movimientoCoach({ quieta: true, abierta: true }),
  { respira: false, barre: false, escalona: false });
t('abierta sin reduce-motion ⇒ no respira, pero SÍ escalona', movimientoCoach({ quieta: false, abierta: true }),
  { respira: false, barre: false, escalona: true });

console.log('\n── ⑦ LA PIEZA CONSUME LA DECISIÓN (si no, ⑥ mide una función huérfana) ──');
/* 🔴 **SE MIDE EL CÓDIGO, NO LA PROSA (`L-170`).** La primera versión leía el
   archivo entero y **se cazó a sí misma dos veces**: la cabecera dice «cero
   `useState`» y el encargo se nombra en un comentario ⇒ dos rojos sobre una
   pieza que estaba bien. *Un censo que lee comentarios mide lo que alguien
   escribió sobre el código, no el código.* */
const sinComentarios = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
const fuente = sinComentarios(
  readFileSync(new URL('../packages/ui/src/components/PresenciaCoach.tsx', import.meta.url), 'utf8'),
);
t('`PresenciaCoach` llama a `movimientoCoach`', /movimientoCoach\(\{/.test(fuente), true);
t('🔴 y NO re-deriva el guard a mano', /!quieta\s*&&/.test(fuente), false);
t('cero `setInterval` / `setTimeout` (§2.8: nada despierta al hilo de JS)',
  /set(Interval|Timeout)\(/.test(fuente), false);
t('cero `useState` (§2.8: no re-renderiza mientras respira)', /useState/.test(fuente), false);
t('la pieza no teclea el nombre del Coach', /Nexo/i.test(fuente), false);

console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
