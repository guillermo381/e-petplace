/**
 * FORMATO DE LOS NÚMEROS DEL TECHO (S85-C23) — plata y duración.
 *
 * ⚠️ **NACE COMPARTIDO A PROPÓSITO.** El formateo de plata YA vivía en
 * `liquidaciones.tsx` como helper local, y el techo lo necesitaba: la
 * salida barata era copiarlo. **Dos copias de una misma regla se derogan
 * en una sola** —lo mismo que costó la abstención duplicada de C22, el
 * mismo día— así que la de liquidaciones se migra acá y queda UNA.
 */

/**
 * ⚠️ **LA MONEDA ESTÁ ASUMIDA, Y SE DICE EN VEZ DE FINGIRLA (D-448).**
 *
 * El `$` es literal, igual que en el helper de liquidaciones que este
 * archivo absorbe. **No es una decisión de esta pieza: es la deuda que
 * D-448 ya tiene abierta** — el riel SÍ sabe formatear con país
 * (`packages/i18n/moneda.ts` → `monto(valor, config, idioma)`), pero
 * exige una `ConfigMoneda` que **estos lectores no traen**.
 *
 * *Cablear una config acá sería INVENTAR la moneda* —el defecto exacto
 * que D-448 nombra— y hacerlo en el número más visible de la portada.
 * El desbloqueo es ensanchar los lectores con país; hasta entonces, la
 * casa entera dice `$` en un solo lugar en vez de en dos.
 *
 * Dos decimales SIEMPRE: la plata no se redondea a la vista. Un "$45"
 * donde hay $45.50 es medio dólar que el prestador no ve.
 */
export function montoCorto(valor: number): string {
  return `$${valor.toFixed(2)}`;
}

/**
 * La jornada en voz humana: `6h 15m` · `45m` · `3h`.
 *
 * **Las partes en cero NO se pintan** — "0h 45m" hace leer dos veces
 * para entender que son 45 minutos, y "6h 00m" agrega ruido donde el
 * dato es exacto. El techo se lee de un vistazo o no sirve.
 *
 * ⚠️ Distinto del helper de `cierre.tsx`, que muestra SIEMPRE las dos
 * partes (`0 h 20 min`) porque ahí el dato es la duración de UNA
 * atención y la simetría entre filas ayuda a compararlas. **Acá el dato
 * es un total y no se compara con nada.** No se unifican: se parecen y
 * no son lo mismo — la misma razón por la que `subir-clip-vitrina` no
 * ensanchó a `subir-clip`.
 *
 * `h`/`m` van sin traducir: coinciden en es y en, y son las abreviaturas
 * que §2.4bis usa en su propio ejemplo ("6h 15m en ruta"). La frase que
 * las envuelve SÍ vive en el riel.
 */
export function duracionCorta(minutos: number): string {
  const m = Math.max(0, Math.round(minutos));
  const h = Math.floor(m / 60);
  const resto = m % 60;
  if (h === 0) return `${resto}m`;
  if (resto === 0) return `${h}h`;
  return `${h}h ${resto}m`;
}
