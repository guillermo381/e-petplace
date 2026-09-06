/**
 * ☠️ **SIN CONSUMIDOR DESDE EL MERGE DE `f7405832` — Y LA MESA DECIDE, NO YO.**
 *
 * D resolvió el MISMO bloqueante en `main` (`05172ae9`, carnet v2.3) y su regla
 * es **más ancha que ésta**: dudosa = sin fecha **o** sin nombre **o** fecha
 * parcial (`FEB 2023` no es un día). La probó con el carnet real del founder y
 * midió lo que la mía no vio: *con la ley vieja ese carnet perdía DOS filas en
 * silencio.* Al mergear tomé su `carnet.tsx`, así que esta función quedó sin
 * llamador.
 *
 * **No la borro y no la cableo**: dos implementaciones del mismo guard es
 * exactamente el defecto que diagnostiqué en el 1.1.2 —*dos cuentas sobre lo
 * mismo terminan discrepando*— y elegir cuál vive es de la mesa. Lo que sí es
 * mío es declararlo: `verify:confirmable` sigue en verde **midiendo una regla
 * que ya no rige en ninguna pantalla**, y un gate verde sobre código muerto se
 * lee igual que uno que protege algo.
 */
/**
 * ⭐ **¿ESTA FILA SE PUEDE DAR POR REVISADA?** (S113-C · 1.1.2).
 *
 * Nace del bloqueante que el founder vio en su teléfono con su carnet real:
 * *«hay 4 vacunas por completar», ninguna fila marcada, el botón encendido y al
 * tocarlo no pasa nada.* La cadena, medida en el código:
 *
 *   ① `esDudosa` era **`!fecha_aplicada`**, y vivía sólo en la pantalla;
 *   ② la fila no podía pintarlo: la pieza **no recibe ninguna prop de
 *      «incompleta»**, así que la pantalla contaba algo que la fila no sabía;
 *   ③ el pie se enciende con `resumenDeLaTanda`, que sólo mira `tocada` y
 *      `descartada` ⇒ **encendido**, mientras `guardar()` cortaba aparte por
 *      `dudosas` **en silencio**. Dos cuentas — y la segunda la puse yo al
 *      montar el pie.
 *
 * La regla vive acá, pura, **porque el caso no se puede producir desde la UI**:
 * la extracción no devuelve filas sin fecha con los carnets de prueba (medido:
 * de uno con 4 filas, 2 sin fecha, devolvió 2) y la Hoja de edición **exige**
 * fecha, así que tampoco se puede vaciar. *Una regla que no se puede ejercer
 * desde la pantalla se prueba donde sí se puede.*
 */

export interface FilaConfirmable {
  fecha_aplicada: string | null;
  nombre: string | null;
}

/**
 * `null` = se puede confirmar. Si no, **el código de lo que falta** — la
 * pantalla pone la voz (Ley 3).
 *
 * 🔴 El orden importa: primero el nombre, que es lo que identifica la vacuna.
 * *Pedir la fecha de algo que todavía no sabemos qué es pone los pasos al
 * revés.*
 */
export function faltaParaConfirmar(f: FilaConfirmable): 'nombre' | 'fecha' | null {
  if (f.nombre === null || f.nombre.trim() === '') return 'nombre';
  if (f.fecha_aplicada === null || f.fecha_aplicada.trim() === '') return 'fecha';
  return null;
}
