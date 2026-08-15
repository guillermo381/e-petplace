/**
 * EL CHEVRON — la tabla ÚNICA de los tres estados del mismo glifo
 * (S83-B12). No es un ícono nuevo: es geometría compartida, y por eso
 * vive en un `.ts` sin componente, como `usePresionado`.
 *
 * POR QUÉ NACE: el mapa ya existía dentro de `FilaCita`, y su propio
 * JSDoc declaraba la intención — *"si algún día el trazo cambia, cambia
 * en un lugar"*. No estaba ocurriendo: el mismo trazo vivía en CUATRO
 * sitios (`CeldaNavegacion`, `FichaMascotaHogar`, el mapa de `FilaCita`
 * y `PieRevelar`), byte por byte iguales y sin nada que los atara. Al
 * ensanchar `CeldaNavegacion` con el vocabulario direccional, copiar el
 * mapa habría sido la QUINTA copia — exactamente lo que **L-175**
 * prohíbe (*se lee el registry y se ENSANCHA; jamás se copia*). Es el
 * mismo argumento con el que `DIRECCION_ARTE` §3 hizo canónica la
 * primitiva `Huella`: *nadie la redibuja*.
 *
 * EL CRITERIO DE CUÁL USAR ES **E14, YA FIRMADO**: información
 * DESPLIEGA (⌄ revela · ⌃ pliega, en el lugar) · acción LLEVA (› navega
 * a otra pantalla, o abre el formulario que la resuelve). La dirección
 * codifica una verdad del contenido (Ley 18) y por eso no tiene default
 * en las piezas de dominio: ahí se declara.
 *
 * ⚠️ NO SE EXPORTA desde `index.ts` a propósito: es geometría interna de
 * la casa, no API de las apps. Una pantalla que necesite un chevron usa
 * la PIEZA que lo porta (`CeldaNavegacion`, `PieRevelar`, `FilaCita`),
 * jamás el path suelto — que es el defecto que este archivo cierra.
 */

/** ⌄ y ⌃ despliegan en el lugar · › ‹ llevan a otro lado (E14).
 *
 *  ➕ S99-B · `izquierda` ENSANCHA la tabla, no la copia — que es lo que
 *  este archivo existe para que pase (L-175). Nace para la puerta
 *  hermana de las dos ventanas del HOY: **el espejo tiene que ser el
 *  MISMO trazo reflejado**, y si el de vuelta se dibujara aparte, el día
 *  que alguien afine el chevron afinaría medio espejo. Su `d` es el
 *  reflejo exacto de `derecha` sobre el eje vertical del viewBox de 24
 *  (x → 24−x), no un trazo nuevo a ojo. */
export type DireccionChevron = 'derecha' | 'izquierda' | 'abajo' | 'arriba'

export const CHEVRON: Record<DireccionChevron, string> = {
  derecha: 'M9 18l6-6-6-6',
  izquierda: 'M15 18l-6-6 6-6',
  abajo: 'M6 9l6 6 6-6',
  arriba: 'M6 15l6-6 6 6',
}
