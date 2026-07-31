/**
 * @override-s82c — EL CORTE PRÓXIMOS / HISTORIAL, UNA SOLA VEZ.
 *
 * POR QUÉ EXISTE (gate del founder, S82-C r39): el filtro no cortaba en
 * grooming, veterinaria ni adiestramiento — y al medir los cuatro, el
 * defecto resultó ser UNO SOLO y no tres:
 *
 *   paseo          estado === 'confirmada' && fecha >= hoy   ← estado Y TIEMPO
 *   grooming       estado === 'confirmada'                   ← solo estado
 *   veterinaria    estado !== 'completada' && sin atención   ← solo estado
 *   adiestramiento estado confirmada | en_curso              ← solo estado
 *
 * A los otros tres LES FALTABA EL EJE TIEMPO. Cada pantalla escribió su
 * corte a mano y tres se olvidaron la mitad — la misma clase que el pie
 * de reserva: cuatro copias de una regla, tres divergen. Lo que se copia,
 * diverge.
 *
 * ⚠️ Y LA TRAMPA QUE ESTA FRONTERA EXISTE PARA NO REPETIR (D-439, el bug
 * de S71 de vuelta): **una cita FIRME PUEDE NO TENER FECHA**. El
 * presupuesto vet aprobado agenda cita firme SIN fecha —la coordinación
 * es un paso posterior— y si el corte es `fecha >= hoy`, con `fecha`
 * null la comparación da FALSO y la cita DESAPARECE de las dos listas.
 * El dueño aprueba y su procedimiento no existe en ninguna superficie
 * suya. Acá lo firme sin fecha es PRÓXIMO por definición: todavía no
 * ocurrió.
 *
 * LO QUE **NO** UNIFICA, a propósito: la señal de CERRADA. Cada oficio
 * la dice distinto (atención cerrada, parte emitido, estado del motor) y
 * forzarla a una sola forma sería inventar una semántica que los motores
 * no comparten. El eje TIEMPO es común; el de CIERRE lo declara cada
 * pantalla y lo pasa.
 */

/** El día de hoy en local, en el mismo formato que las fechas del motor. */
export function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

/**
 * ¿La cita va a PRÓXIMOS?
 *
 * @param fecha   'YYYY-MM-DD' o **null** (firme sin coordinar — D-439).
 * @param cerrada la señal de cierre DEL OFICIO (la declara la pantalla:
 *                atención cerrada, parte emitido, estado terminal).
 */
export function esProxima(fecha: string | null, cerrada: boolean, hoy = hoyLocal()): boolean {
  // lo que ya ocurrió no vuelve a "próximos", tenga la fecha que tenga
  if (cerrada) return false;
  // D-439: firme SIN FECHA es futuro — todavía no pasó nada
  if (fecha === null || fecha.length === 0) return true;
  return fecha >= hoy;
}

/** El complemento exacto: lo que NO es próxima es historial. Existe para
 *  que ninguna pantalla escriba la negación a mano y se le escape un
 *  caso — una cita tiene que estar en UNA de las dos listas, siempre. */
export function esHistorial(fecha: string | null, cerrada: boolean, hoy = hoyLocal()): boolean {
  return !esProxima(fecha, cerrada, hoy);
}
