/**
 * La regla que decide si hay abanico — fuera del componente A PROPÓSITO.
 *
 * 🔴 **Es la mitad del rojo que los tipos NO pueden ver.** Que el consumidor
 * no pueda forzar el abanico lo prueba el compilador (no hay prop `abierto`);
 * que `carrito: 3 · mensajes: 0` sea **una** clase y no dos es una decisión de
 * runtime, y sin extraerla habría que montar React para medirla.
 *
 * *Una clase en cero no es una clase.* Sin este filtro, el caso de arriba
 * abriría un abanico con una opción vacía — exactamente el rojo que el founder
 * nombró, entrando por la puerta de atrás.
 *
 * Vive en su propio módulo para que su gate pueda importarla **sin arrastrar
 * `react-native`** — la misma razón por la que `mismaFila` salió de
 * `SuperficieChat`.
 */
export function clasesVivas<T extends { cuenta: number }>(pendientes: readonly T[]): T[] {
  return pendientes.filter((p) => p.cuenta > 0)
}

/** ¿Se despliega? **Sólo con dos o más clases vivas.** */
export function hayAbanico(pendientes: readonly { cuenta: number }[]): boolean {
  return clasesVivas(pendientes).length >= 2
}
