/**
 * LA GOTA — el pin de la casa, en UN solo dibujo (S100d-B · F-PIN).
 *
 * ═══════════════════════════════════════════════════════════════════
 * **FIRMA DEL FOUNDER, pedida TRES veces** (puntos 16, 23 y 26 del gate):
 * *«sigue sin pin, pone un punto: **quiero un pin como el de Uber**»*.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ VIVE EN UN `.ts` Y NO EN UNA PIEZA ─────────────────────────
 * Como `chevron.ts`, `grilla-de-dos.ts` y `caja-de-campo.ts`: **no es un
 * componente, es geometría compartida.** La gota se dibuja en DOS físicas
 * distintas y con eso alcanza para que se desincronicen:
 *   · en `Icono` `ubicacion` → **trazo** (un glifo de la grilla 24).
 *   · en `PinMovible` sobre el mapa → **relleno con halo blanco**, que es
 *     lo que la vuelve legible sobre cualquier lienzo.
 * *Dos dibujos de la misma silueta no divergen algún día: divergen la
 * primera vez que alguien cura uno* — la advertencia de `Baldosa`, literal.
 *
 * ── LO QUE SE MIDIÓ DE LA REFERENCIA, Y LO QUE NO ──────────────────────
 * Medido sobre `docs/diseno/referencias/referencia-uber-mapa-en-camino-pin.jpeg`
 * (la marca de lugar guardado, arriba a la izquierda; muestreada píxel a
 * píxel):
 *   ✅ **la ANATOMÍA:** cuerpo circular que se **afina hacia una punta
 *      abajo** · **halo blanco** rodeando toda la silueta · **ojo blanco**
 *      circular en el centro del cuerpo. Los tres están en la referencia.
 *   🔴 **la PROPORCIÓN: NO se midió de la referencia y se dice.** El pin
 *      real ocupa ~42 px en una captura de 738 y el JPEG lo empasta contra
 *      el mapa: cada bbox que intenté salió contaminada por los íconos
 *      vecinos. **Se toma la construcción canónica** (círculo de radio r,
 *      alto ≈ 2,6 r ⇒ **ancho/alto ≈ 0,78**) y **su juez es el ojo en
 *      aparato.**
 *
 * > *Se declara en vez de darse por medido. La casa acaba de pagar ocho
 * > gates por traducir una referencia en prosa (L-283): decir «medí la
 * > anatomía y NO la proporción» es lo que evita el noveno.*
 *
 * ── 🔴 EL ANCLA — LO QUE DICE LA GOTA ES SU PUNTA, NO SU CENTRO ────────
 * **Hallazgo de la pista A, y es el que salva la pieza:** el punto viejo era
 * un disco centrado, así que *«lo que el ojo lee»* y *«el centro geométrico
 * que el mapa reporta»* eran el mismo píxel. **Con una gota dejan de serlo:
 * el ojo lee la PUNTA.** Dibujarla centrada haría que cada persona marcara
 * ~medio glifo más arriba de lo que cree ⇒ **un sesgo sistemático en cada
 * dirección guardada de la base.**
 *
 * ⇒ `DESPLAZAMIENTO_PUNTA` existe para eso: sube la gota hasta que **la
 * punta cae exactamente en el centro** del contenedor. *No es un ajuste
 * óptico: es la diferencia entre marcar la puerta y marcar el techo.*
 */

/** La silueta, en la grilla 24 de la casa. **Es literalmente el mismo `d`
 *  que dibuja el glifo `ubicacion`** — si alguien cambia uno, cambia el
 *  otro, que es el punto. Punta en `(12, 21)`; cuerpo circular centrado en
 *  `(12, 10)` con radio 7 ⇒ ancho 14 · alto 18 ⇒ **0,78**. */
export const GOTA_D = 'M12 21s-7-5.3-7-11a7 7 0 1 1 14 0c0 5.7-7 11-7 11Z'

/** Dónde cae la punta dentro de la caja de 24. */
export const GOTA_PUNTA_Y = 21
/** El centro del ojo y su radio, en la misma grilla. */
export const GOTA_OJO = { cx: 12, cy: 10, r: 2.7 } as const

/**
 * Cuánto hay que SUBIR la gota para que su punta caiga en el centro del
 * contenedor, dado el lado renderizado. **Derivado, jamás tecleado** (ver el
 * ancla en la cabecera): si la silueta cambia, esto la sigue sola.
 *
 * `(21/24 − 1/2) · lado` = `0,375 · lado`.
 */
export function desplazamientoDePunta(lado: number): number {
  return lado * (GOTA_PUNTA_Y / 24 - 0.5)
}
