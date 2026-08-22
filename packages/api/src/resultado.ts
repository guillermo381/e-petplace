// Patrón canónico de resultados de wrappers (heredado del repo prestadores, S29+).
// Regla del contrato: discriminated unions, sin string matching de mensajes (regla 35),
// sin fallbacks silenciosos (regla 36).

export type ResultadoWrapper<T, C extends string = string> =
  | { ok: true; data: T }
  | { ok: false; codigo: C | 'error_desconocido' | 'datos_inconsistentes'; mensaje: string };

/**
 * 🔴 EL CÓDIGO REAL DE UN FALLO, EXTRAÍDO DEL TIPO — no mantenido al lado.
 *
 * **El defecto que cierra, hallado por S103-C enchufando DeUna:** un consumidor
 * que escribe `Record<CodigoDeuna, string>` cree que cubrió todo **y el
 * compilador se lo confirma** — pero `ResultadoWrapper` agrega dos códigos que
 * `CodigoDeuna` no lista, así que en runtime esas dos claves dan `undefined`
 * **y la pantalla queda MUDA justo en el fallo que menos sabemos explicar.**
 *
 * *No es de DeUna: `ResultadoWrapper<T, C>` los agrega a **todo wrapper de la
 * casa**. Cualquier mapa exhaustivo escrito contra el tipo BASE tiene el mismo
 * hueco.*
 *
 * **Es la tercera forma del mismo patrón en un solo día** (`L-366`): el
 * contrato a mano que declaraba 10 de 12 códigos · el diff conceptual que
 * tocaba 1 de 5 campos · y ahora el tipo envolvente que agrega dos que el base
 * no lista. > **Una lista que un consumidor cree exhaustiva casi nunca lo es,
 * y el compilador confirma la creencia en vez de corregirla.**
 *
 * **El remedio, que es el mismo de las tres: se EXTRAE del código.**
 *
 * ```ts
 * type Codigo = CodigoDeFallo<typeof pedirCodigoDeuna>;
 * const VOZ: Record<Codigo, string> = { … };  // ← exhaustivo POR CONSTRUCCIÓN
 * ```
 *
 * *Si mañana el wrapper gana un código, este `Record` **deja de compilar** —
 * que es exactamente lo que no pasaba antes.*
 */
export type CodigoDeFallo<F> =
  F extends (...args: never[]) => Promise<infer R>
    ? (R extends { ok: false; codigo: infer C } ? C : never)
    : (F extends { ok: false; codigo: infer C } ? C : never);
