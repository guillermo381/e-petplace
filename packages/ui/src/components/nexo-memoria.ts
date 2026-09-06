/**
 * LO QUE NEXO SABE DE UNA MASCOTA — la lógica, aparte de la pieza
 * (S113-B · 2.0 · B3).
 *
 * Su gate la mide **sin montar React**, que es la única forma de probar que
 * *nada entra a la memoria sin que la familia lo confirme* sin mirar una
 * pantalla.
 *
 * ── 🔴 LA LEY QUE ORDENA ESTE ARCHIVO ───────────────────────────────────
 * **Toda IA lleva procedencia y confirmación humana.** Acá deja de ser una
 * consigna y pasa a ser una forma: **en el panel no hay hechos sin confirmar.**
 * Lo que Nexo cree haber entendido se pregunta EN EL HILO —*«¿Guardo que le
 * tiene miedo a los truenos?»*— y recién con el sí de la familia llega hasta
 * acá. *Un modelo que archiva sus propias lecturas no tiene memoria: tiene un
 * expediente que nadie firmó.*
 *
 * ⇒ Por eso `HechoDeMemoria` **no tiene estado «propuesto»**: ese estado vive
 * en la respuesta (`RespuestaNexo.propuesta`) y muere ahí. *Un tipo que puede
 * expresar lo que no debería existir hace falta vigilarlo; uno que no, no.*
 */

/**
 * Cómo llegó el hecho. **Se dice siempre**, y las dos formas no valen igual:
 * *«lo contaste vos» es un hecho de la familia; «lo confirmaste» es una
 * lectura de Nexo que alguien revisó.* La segunda puede estar mal aunque
 * tenga el sí.
 */
export type OrigenMemoria = 'contado' | 'confirmado'

export interface HechoDeMemoria {
  id: string
  /** *«Le tiene miedo a los truenos»* — la frase entera, ya redactada
   *  (Ley 3). La pieza la dibuja; no la compone ni la recorta. */
  texto: string
  origen: OrigenMemoria
  /** *«lo contaste vos»* · *«lo confirmaste el 2 de septiembre»* — ya
   *  compuesta. **Obligatoria**: un hecho sin procedencia es un hecho del que
   *  nadie se hace cargo. */
  vozOrigen: string
  /**
   * 🔴 **LOS DOS SON OBLIGATORIOS, y eso es la promesa del panel.** «Editable»
   * no es una función de más: *una memoria que la familia no puede corregir
   * ni borrar dejó de ser suya y pasó a ser un archivo sobre ella.*
   */
  onEditar: (texto: string) => void
  onBorrar: () => void
}

/**
 * 🔴 **CON MEMORIA VACÍA EL PANEL SE DIBUJA IGUAL**, y es lo contrario de
 * `haySeguridad`. La diferencia no es de gusto: *la franja de seguridad
 * aparece sola y una vacía enseña a ignorarla; este panel lo ABRE la familia,
 * y no encontrar nada es la respuesta a lo que fue a preguntar.*
 *
 * Por eso la pieza exige `vozVacia` en vez de devolver `null`: **se dice
 * dónde no sabemos**, que es la tercera cláusula de la ley del founder.
 */
export function memoriaVacia(hechos: readonly HechoDeMemoria[]): boolean {
  return hechos.length === 0
}

/**
 * Lo que se guarda al editar. **El recorte vive acá y no en cada pantalla**:
 * si cada consumidor decidiera qué es «vacío», bastaría uno que no recorte
 * para que un hecho quede en un espacio en blanco.
 *
 * 🔴 Devuelve `null` cuando no queda nada, y **la pieza no llama a `onEditar`
 * con `null`**: *guardar un hecho vacío es borrarlo sin decirlo, y borrar
 * tiene su propio botón.*
 */
export function saneadoParaGuardar(texto: string): string | null {
  const s = texto.trim()
  return s.length > 0 ? s : null
}
