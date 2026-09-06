/**
 * LA FECHA DE UNA DESPEDIDA — aparte de la pantalla A PROPÓSITO.
 *
 * ⏪ **Nació dentro de `PantallaDespedida.tsx` y hubo que sacarla**: su arnés
 * no podía importarla sin arrastrar JSX y `react-native`. *La regla de la casa
 * ya lo decía —`coach-geometria`, `vacunas-estado`, `perfil-seguridad` viven
 * fuera por lo mismo— y aun así la escribí adentro.* Queda anotado porque el
 * error no fue de criterio: fue de no aplicar el criterio que ya tenía.
 */

/**
 * 🔴 **NUNCA FUTURA.** Una despedida con fecha de mañana no es un dato raro:
 * es un registro imposible que después nadie sabe corregir — y que además
 * dejaría a la mascota en memorial antes de tiempo.
 *
 * Compara `YYYY-MM-DD` como texto, que para ese formato es orden cronológico
 * exacto: **sin `Date`, sin husos, sin medianoche.**
 */
export function fechaDespedidaValida(fecha: string, hoy: string): boolean {
  return fecha <= hoy
}
