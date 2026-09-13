/**
 * QUIÉN DECIDE LA HUELLA DE UN GLIFO — fuera del componente A PROPÓSITO.
 *
 * 🔴 **La Ley 6 vivía adentro de un `useAnimatedStyle`-de-ternarios y no tenía
 * gate.** Sacarla acá no cambia una coma de lo que hacía —el arnés lo prueba
 * caso por caso— y a cambio la vuelve medible sin montar React, que es la
 * única forma de que su próximo cambio no se verifique a ojo.
 *
 * Vive en su propio módulo para que su gate pueda importarla **sin arrastrar
 * `react-native`** — misma razón que `clasesVivas` y `coach-geometria`.
 */

/** Cómo está montado el glifo. Hoy sólo hay un valor, y **es una AFIRMACIÓN
 *  SOBRE EL CONTEXTO, no una preferencia de quien monta** — el mismo patrón
 *  que `activa`, que declara un hecho de la barra de tabs y deja que la ley
 *  decida qué hacer con él.
 *
 *  🔴 **Por eso no es un `sinHuella?: boolean`.** Un booleano diría *«apagale
 *  la huella»* y **cualquier pantalla podría apagar cualquier huella por
 *  gusto** — exactamente lo que la nota de `activa` prohíbe: *la ley 6 decide
 *  según el registry, no según quien monta.* `montaje="control"` dice otra
 *  cosa: *«este glifo está adentro de un botón»*, que es un hecho verificable,
 *  y la consecuencia la saca la pieza. */
export type MontajeIcono = 'control'

export interface EntornoHuella {
  /** Ver arriba. Ausente = el glifo vive donde vive todo el producto. */
  montaje?: MontajeIcono
  /** Estado de la barra de tabs. `undefined` ⇒ el glifo vive PRESENTE. */
  activa?: boolean
  /** Su huella ES el dibujo (`negocio`, `datos`, `ia`). */
  esEstructura: boolean
  /** 🔴 **S116-B lote 2b — ¿esta casa recibió el rediseño?** Es el mismo
   *  `theme.accent.formaV5` que gobierna la geometría y la tipografía v5:
   *  una sola bandera para una sola decisión de una sola letra.
   *
   *  **Lo que hace acá:** la letra §1.1 dice *«los glifos no llevan
   *  huella»* y deroga las leyes 1-3 de `DIRECCION_ARTE` **para el
   *  cliente**. ⇒ en la casa v5 la huella se apaga en TODO glifo.
   *
   *  ⚠️ **Y ES POR CASA PORQUE LA MEDICIÓN LO OBLIGÓ, no por prudencia.**
   *  La orden de la mesa nombró **doce** glifos con huella; el censo del
   *  registry dio **49**, y **24 de ellos los monta el prestador**, que la
   *  letra §5 deja sin cambios. *Apagarla a secas le habría sacado la
   *  huella a la barra del prestador entera — el mismo defecto que el
   *  décimo slot nació para evitar en el lote 2.* */
  casaV5: boolean
  colorHuella: string
  colorTinta: string
}

/**
 * El color con el que se pinta la huella — o `'none'`, que en SVG es no
 * pintarla.
 *
 * ── LA REGLA NUEVA (S113-B, orden de la mesa) ──────────────────────────
 * **`N27` es sobre el CONTEXTO, no sobre el glifo:** *«un glifo montado dentro
 * de un control no lleva huella»*. Hasta hoy eso se cumplía dibujando cada
 * glifo de control sin huella en su dibujante — que alcanza mientras el glifo
 * SÓLO viva en controles. **`vacuna` rompe ese supuesto: es un hecho del
 * expediente en toda la app y un ACTO adentro de un dedo del Coach.** El mismo
 * dibujo, dos roles según dónde esté.
 *
 * ⇒ La supresión pasa a ser del MONTAJE. *Y no se inventó un camino: `'none'`
 * ya era como la casa apaga una huella de marca en una tab en reposo* — se
 * ensancha, no se copia (`L-175`).
 *
 * ── 🔴 EL BORDE QUE ESTO ABRE, Y POR QUÉ NO SE DEJÓ ABIERTO ────────────
 * Para `negocio`, `datos` e `ia` **la huella ES el dibujo**. Un `'none'` ahí
 * no deja un glifo sin adorno: deja **un glifo vacío** — `ia` se borraría
 * entero, porque no tiene trazo debajo. *Y no daría error: daría un hueco.*
 * Por eso la estructura gana sobre el montaje, y el arnés lo prueba con el
 * caso real, no con uno inventado.
 */
export function resolverHuella({
  montaje,
  activa,
  esEstructura,
  casaV5,
  colorHuella,
  colorTinta,
}: EntornoHuella): string {
  /* 🔴 **LA CASA v5 MANDA PRIMERO, salvo donde la huella es el objeto.**
   * El orden importa y no es arbitrario: `esEstructura` gana sobre todo lo
   * demás —lo dice el bloque de arriba y sigue rigiendo— porque un `'none'`
   * sobre `ia` no deja un glifo sin adorno: **deja un glifo vacío, y no da
   * error: da un hueco**. *Los tres estructurales son de la barra del
   * prestador, así que en la práctica esta rama no se cruza con la de
   * arriba — pero se escribe en este orden para que siga siendo cierta el
   * día que un estructural aparezca en el cliente.* */
  if (casaV5 && !esEstructura) return 'none'
  /* El montaje manda… salvo donde la huella es el objeto (ver arriba). */
  if (montaje === 'control' && !esEstructura) return 'none'
  /* Desde acá, la Ley 6 tal como estaba escrita en `Icono` — sin un cambio. */
  if (activa === undefined) return colorHuella
  return esEstructura ? (activa ? colorHuella : colorTinta) : activa ? colorHuella : 'none'
}
