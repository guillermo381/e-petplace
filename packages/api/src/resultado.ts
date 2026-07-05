// Patrón canónico de resultados de wrappers (heredado del repo prestadores, S29+).
// Regla del contrato: discriminated unions, sin string matching de mensajes (regla 35),
// sin fallbacks silenciosos (regla 36).

export type ResultadoWrapper<T, C extends string = string> =
  | { ok: true; data: T }
  | { ok: false; codigo: C | 'error_desconocido' | 'datos_inconsistentes'; mensaje: string };
