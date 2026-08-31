// Patrón canónico de resultados de wrappers (heredado del repo prestadores, S29+).
// Regla del contrato: discriminated unions, sin string matching de mensajes (regla 35),
// sin fallbacks silenciosos (regla 36).

export type ResultadoWrapper<T, C extends string = string> =
  | { ok: true; data: T }
  | {
      ok: false;
      codigo: C | 'error_desconocido' | 'datos_inconsistentes';
      mensaje: string;
      /**
       * 🔴 EL DETALLE ES PARA MOSTRAR, JAMÁS PARA RAMIFICAR — y esa mitad de la
       * regla es la que hace que este campo sea seguro de tener.
       *
       * **Por qué nace (S109, pedido de S109-B a pedido de S109-C):** el motor
       * ya calculaba la *causa* de varios rechazos —cuál sesión no entra en la
       * vigencia, cuál mes no se puede comprometer— y **el wrapper la tiraba**:
       * construía `{ codigo, mensaje: codigo }` y descartaba el resto. *La
       * pantalla decía un genérico sobre un rechazo del que sabíamos el porqué.*
       *
       * ⚠️ **La regla 35 sigue viva y este campo NO la afloja:** las decisiones
       * se toman SIEMPRE sobre `codigo`. Hacer `if (detalle.includes(...))` es
       * exactamente el string matching que la casa prohíbe, y acá sería peor
       * que en `mensaje` porque este texto viene del motor y puede cambiar sin
       * que ningún typecheck lo vea.
       *
       * **Opcional a propósito:** ningún wrapper existente lo emite y ninguno
       * se rompe. El que quiera decir el porqué lo agrega; el que no, no cambia.
       */
      detalle?: string | null;
    };

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
