/**
 * NarizNotificacion — LA SILUETA DE LA MARCA PARA EL AVISO DE ANDROID.
 *
 * 🔴 **NO ES UN RECORTE DEL ISOTIPO, Y ESO LO DECIDIÓ UNA MEDICIÓN.** El
 * lote 1 midió la silueta blanca del isotipo a 24 px y **no se lee**: sus
 * dos huecos interiores —lo único que la distingue de una mancha— se
 * cierran a esa escala, porque en el path oficial miden ~4,5 % del alto
 * del viewBox. Recortar el isotipo habría entregado un borrón que igual
 * habría pasado cualquier gate de código. *Por eso se dibuja.*
 *
 * ⚠️ **UN ÍCONO DE NOTIFICACIÓN DE ANDROID ES UNA MÁSCARA ALFA**: el
 * sistema descarta TODO el color y usa solo el canal alfa, tiñéndolo con
 * el color del canal (Android 5+). ⇒ esta pieza es `fill` sólido y NO
 * trazo, que es la única excepción del set b′ a la Ley del trazo 1.9 —
 * declarada acá y no en la ley: la ley gobierna glifos de interfaz, y esto
 * no se dibuja para una interfaz nuestra sino para la bandeja del sistema.
 *
 * 🔴 **LA PRIMERA VERSIÓN ERA OTRA FORMA, Y LA CORRIGIÓ UNA MEDICIÓN, NO
 * UNA REVISIÓN.** Se dibujó de memoria como *«dos lóbulos con hueco»* — o
 * sea un corazón con dos agujeros — y al rasterizarla al lado del isotipo
 * real quedó a la vista que **el isotipo no es eso**: es **un ANILLO
 * ABIERTO ABAJO con dos volutas colgando de su borde superior interno**.
 * *La forma que yo recordaba era plausible y estaba equivocada, y ningún
 * gate de código la habría frenado: compilaba, se veía limpia, y decía la
 * marca de otro.* El rasterizador apareció el mismo día (ver
 * `scripts/hoja-de-contacto-glifos.mjs`).
 *
 * LA SIMPLIFICACIÓN, y qué conserva de la marca:
 *  · **El anillo abierto** — la silueta madre. Pared de ~3,1 en la grilla
 *    24, que a 24 px son ~3 px reales: el mínimo que no se cierra.
 *  · **Las dos volutas, VUELTAS SÓLIDAS y SOBRESALIENDO del borde
 *    superior del anillo** — que es como el isotipo las tiene. La primera
 *    versión las puso adentro y chicas, y al montarlas contra el isotipo
 *    real quedó claro que el rasgo es justamente que ASOMAN. Se probaron
 *    **tres radios en hoja de contacto a 24/48/96** (3,0 · 3,3 · 2,7) y
 *    ganó **3,3**, por el único criterio que decide acá: **a 24 px es el
 *    que más aguanta**. *§6b pide 2-3 variantes con su riesgo; ésta es la
 *    primera pieza de esta tanda que las tuvo de verdad.*
 *  · **(la nota vieja, que sigue valiendo)** — en el isotipo son anillos con
 *    su propio hueco, y ese hueco mide ~4,5 % del alto: **a 24 px se
 *    cierra y deja una mancha** (medido rasterizando el isotipo real a
 *    24 px, que es de dónde salió el encargo). Rellenarlas es lo único
 *    que las conserva.
 *  · **La abertura inferior** — abierta a 6,1 de ancho. La primera
 *    versión la cortaba en el punto más bajo de la elipse y salía una
 *    ranura de 1,6: *cortar en el fondo de una elipse chata no deja
 *    abertura, deja una hendidura.* El corte subió a y = 20,9.
 *
 * ⚠️ **RIESGO DECLARADO, y la medición lo cambió de lo que yo creía: a
 * 24 px se lee como una CARA (dos ojos dentro de un óvalo).** No es culpa
 * de la simplificación — **el isotipo real rasterizado a 96 px se lee
 * igual**, porque sus dos volutas ocupan el lugar donde el ojo espera
 * ojos. *El riesgo es de la marca, no del recorte, y por eso no se cura
 * acá: se declara.* Si en la bandeja real molesta, la salida es achicar
 * las volutas y bajarlas, no sacarlas — sin ellas queda un anillo, que no
 * es nada.
 *
 * ⚠️ **ESTA PIEZA NO ES LO QUE ANDROID MONTA.** Existe para poder VER y
 * gatear la silueta dentro del producto. Lo que Android usa es
 * `assets/marca/nariz-notificacion.svg`, que A/C convierten a vector
 * drawable y cablean en el plugin de `expo-notifications` (`icon`). El
 * SVG y este path son el MISMO `d` — si uno cambia, el otro también, o la
 * bandeja va a mostrar algo que nadie miró.
 */

import Svg, { Path } from 'react-native-svg'

/** El path canónico. **Se exporta para que nadie lo copie**: es el mismo
 *  `d` que vive en `assets/marca/nariz-notificacion.svg`. */
export const NARIZ_NOTIFICACION_PATH =
  'M8.96 20.9A10.2 8.8 0 1 1 15.04 20.9L15.04 17.65A7.1 5.7 0 1 0 8.96 17.65Z M8.1 4.9a3.3 3.3 0 1 0 0 6.6a3.3 3.3 0 1 0 0-6.6Z M15.9 4.9a3.3 3.3 0 1 0 0 6.6a3.3 3.3 0 1 0 0-6.6Z'

export function NarizNotificacion({
  tamano = 24,
  color = '#FFFFFF',
}: {
  /** Se gatea a 24 **y** a 48 (§2.9 lleva a 21; acá los tamaños los fija
   *  Android: 24 dp es el ícono de la barra y 48 el de la notificación
   *  expandida). */
  tamano?: number
  /** En la bandeja lo pone el sistema; acá se pasa para poder verlo sobre
   *  un fondo que no sea blanco. */
  color?: string
}) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      <Path d={NARIZ_NOTIFICACION_PATH} fill={color} fillRule="evenodd" />
    </Svg>
  )
}
