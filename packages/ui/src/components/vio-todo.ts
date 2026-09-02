/**
 * pudoVerTodo — LA PREGUNTA DE «VI TODO», COMO PREDICADO Y NO COMO EVENTO
 * (S112-B, B3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **UN DOCUMENTO QUE ENTRA SIN SCROLL NUNCA DISPARA UN EVENTO DE SCROLL.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El defecto que esta función existe para no tener es de los que dejan una
 * pantalla MUERTA sin ningún error: si «vi todo» se implementa como *«el
 * `onScroll` llegó al final»*, un texto corto —que entra entero en la
 * pantalla— **no produce ningún `onScroll`**, el botón nunca se enciende, y
 * nadie puede aceptar. Sin excepción, sin log, sin síntoma más que un botón
 * apagado para siempre.
 *
 * **Y no es hipotético: el caso está medido.** Las condiciones de adopción
 * son 1 711 caracteres — el tamaño exacto que entra sin scroll en un
 * teléfono grande y no entra en uno chico. *El mismo documento produce el
 * defecto en un aparato y no en el otro,* que es la forma más cara de
 * encontrarlo.
 *
 * ⇒ **La cura no es un caso especial: es cambiar la pregunta.** No «¿llegó
 * al final?» sino **«¿lo que falta por ver es cero?»** — una pregunta sobre
 * la GEOMETRÍA DE AHORA, que se puede contestar en el primer layout, con
 * desplazamiento 0, antes de que nadie toque nada. *El texto corto deja de
 * ser una excepción que hay que acordarse de manejar y pasa a ser el caso
 * trivial de la misma cuenta.*
 *
 * ── LA TOLERANCIA, y por qué no es cero ──────────────────────────────────
 * Los tres números vienen del sistema de layout en píxeles fraccionarios y
 * casi nunca cierran exactos; además la última línea suele quedar mordida
 * por un padding. Con tolerancia 0, un usuario que scrollea hasta el fondo
 * puede quedar a 0,5 px del final y el botón no enciende — el mismo defecto
 * con otra cara. **8 px es menos de media línea de texto: no alcanza para
 * saltearse nada legible, y absorbe el error de coma flotante.**
 */

/** Menos de media línea de texto. Ver la nota de arriba. */
export const TOLERANCIA_VIO_TODO = 8

/**
 * ¿La persona ya pudo ver el documento entero?
 *
 * @param altoVisible   alto del viewport (`layoutMeasurement.height`)
 * @param altoContenido alto total del contenido (`contentSize.height`)
 * @param desplazamiento cuánto scrolleó (`contentOffset.y`); 0 al montar
 *
 * **Con `altoContenido <= altoVisible` devuelve `true` con desplazamiento 0**
 * — no por una rama aparte, sino porque la cuenta da. Ése es todo el punto.
 */
export function pudoVerTodo(
  altoVisible: number,
  altoContenido: number,
  desplazamiento: number,
  tolerancia: number = TOLERANCIA_VIO_TODO,
): boolean {
  // Todavía no se midió nada: NO afirmamos que vio todo. De los dos errores
  // posibles se elige el que no da por leído algo que nadie vio.
  if (altoVisible <= 0 || altoContenido <= 0) return false
  return desplazamiento + altoVisible >= altoContenido - tolerancia
}
