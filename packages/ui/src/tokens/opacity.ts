/**
 * e-PetPlace — Design Tokens v4 · OPACIDAD
 * Nace en B3.1 con el estado disabled del Botón: atenuación sin cambio
 * de hue (el color deshabilitado sigue siendo SU color, más callado).
 */

export const opacity = {
  disabled: 0.45,
  /** S82-B r10 (orden founder) — LA MARCA DE AGUA del fondo del cliente.
   *  **0.06 y no 0.05: el Hogar está FIRMADO en 0.06** y lo firmado no se
   *  mueve para promediar (corrección del founder a mi recomendación de
   *  r8) — el perfil, que vivía en 0.04 por copia, SUBE. UN número, una
   *  vez: mientras el agua viva copiada por pantalla se va a volver a
   *  separar (ya lo hizo). */
  marcaDeAgua: 0.06,
} as const
