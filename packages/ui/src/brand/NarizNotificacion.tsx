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
 * 🔴 **TERCER DIBUJO, Y LOS TRES TIENEN SU PORQUÉ ESCRITO — se conservan
 * porque cada uno murió por una razón distinta y ninguna era tonta.**
 *
 *  · **① dos lóbulos con hueco** (un corazón agujereado). Dibujado de
 *    memoria. **Murió al montarlo contra el isotipo real**: el isotipo no
 *    es eso — es un anillo abierto abajo con dos volutas.
 *  · **② el anillo con volutas.** Fiel al isotipo, con tres radios de
 *    voluta probados a 24/48/96. **Murió por FIRMA DE LA MESA**, no por
 *    medición: *«solo el corazón-nariz relleno con las dos fosas como
 *    hueco, sin bigotes ni comisuras»*. ⇒ lo que la marca usa como
 *    ISOTIPO y lo que la bandeja usa como SILUETA **dejan de ser el mismo
 *    objeto, y es deliberado**: el isotipo es una composición de dos
 *    volutas; la silueta es la NARIZ, que es de lo que la composición
 *    habla. *Ser fiel al isotipo era una premisa mía, no una orden.*
 *  · **③ el corazón-nariz con las dos fosas** — éste. Tres tamaños de
 *    fosa probados sobre **los dos fondos reales** (ciruela noche y el
 *    gris de la barra de Android); ganó **2,3 × 3,0**, por el único
 *    criterio que decide acá: **a 24 px es el que más aguanta**.
 *
 * ⚠️ **RIESGO DECLARADO, y lo hereda de la ①: a 24 px las dos fosas se
 * leen como OJOS.** No se cura y no es un descuido — es la consecuencia
 * directa de la firma: *una nariz frontal con dos fosas simétricas ocupa
 * el lugar donde el ojo espera ojos, y cualquier dibujo fiel a esa
 * descripción lo va a hacer.* Si en la bandeja real molesta, la salida es
 * inclinar las fosas (candidato `c` de la hoja, ya dibujado y medido), no
 * achicarlas: achicadas se cierran antes de dejar de parecer ojos.
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
  'M12 21.8C8.3 19.7 2.8 15.7 2.8 10.8 2.8 6.8 5.8 4.1 9.2 4.1 10.6 4.1 11.5 4.8 12 5.7 12.5 4.8 13.4 4.1 14.8 4.1 18.2 4.1 21.2 6.8 21.2 10.8 21.2 15.7 15.7 19.7 12 21.8Z M8.2 6.6a2.3 3 0 1 0 0 6 2.3 3 0 1 0 0-6Z M15.8 6.6a2.3 3 0 1 0 0 6 2.3 3 0 1 0 0-6Z'

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
