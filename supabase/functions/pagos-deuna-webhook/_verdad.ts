// ═══════════════════════════════════════════════════════════════════════════
// S103-D · EL PREDICADO DE LA VERDAD VERIFICADA — en su propio archivo
//
// 🔴 POR QUÉ VIVE ACÁ Y NO EN `index.ts`: el índice crea el cliente de Supabase
//    **a nivel de módulo**, así que importarlo exige `SUPABASE_URL` y termina
//    montando medio entorno. *Un archivo que no se puede importar sin
//    entorno no se puede testear* — y ésta es justo la línea que decide si un
//    cobro se da por bueno.
//
//    Medido: el test falló dos veces al importar el índice (primero por
//    `--allow-env`, después por `supabaseUrl is required`) **antes de llegar a
//    ejecutar un solo assert**. La cura no fue darle permisos al test: fue
//    sacar de en medio lo que no tenía por qué estar.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ¿La respuesta de `payment/info` confirma que esto se cobró?
 *
 * 🔴 LA REGLA, CON SU PORQUÉ MEDIDO (S103-D §2quater): consultar una
 * transacción **inexistente** devuelve `HTTP 200` con `status: "PENDING"` y
 * `amount: 0` — **jamás `NOT_FOUND`**, que es lo que la letra §2 daba por
 * hecho. Así que un 200 no alcanza para verificar nada.
 *
 * Se exige `APPROVED` **con monto**. *El `amount > 0` no es celo: es el candado
 * contra el fantasma. Ya vimos su forma; si algún día el proveedor cambiara la
 * palabra a APPROVED sobre un registro vacío, sin esta condición lo daríamos
 * por cobrado.*
 */
export function esVerdadVerificada(httpOk: boolean, cuerpo: unknown): boolean {
  const c = (cuerpo ?? {}) as Record<string, unknown>;
  return httpOk
    && String(c.status ?? '').toUpperCase() === 'APPROVED'
    && Number(c.amount ?? 0) > 0;
}

/**
 * Con qué llave se le pregunta a `payment/info`.
 *
 * 🔴 **SE PREFIERE `idType "1"` — NUESTRA REFERENCIA** *(dictamen de mesa,
 * 22-ago; antes era al revés)*. La razón está **medida**: la respuesta real de
 * QA por `idType "0"` trae **`internalTransactionReference` vacío**, y el
 * actuador resuelve el sujeto **sólo** por ese campo ⇒ con `"0"`, una consulta
 * perfecta puede volver sin la llave para saber a quién aplicarle el pago.
 * Por `"1"` la respuesta **devuelve la referencia por eco** — medido.
 *
 * *La cura vive de este lado y no en el actuador porque parchear el actuador
 * para tolerar una referencia vacía agregaría tolerancia justo donde la casa
 * acaba de decidir fail-closed.*
 *
 * 🔑 Dos formas del proveedor que nadie adivinaría: `idType` es **texto**
 * `"0"`/`"1"` (un `0` numérico rebota) y el campo se llama
 * **`idTransacionReference`** — con el typo del proveedor. **No se "corrige".**
 *
 * @returns el cuerpo del POST, o `null` si no hay ninguna llave — *y `null` no
 * es un cuerpo vacío: es «no hay a quién preguntarle», que el llamador tiene
 * que tratar distinto de una consulta que falló.*
 */
export function cuerpoDeConsulta(
  txId: string, refCorta: string,
): { idType: '0' | '1'; idTransacionReference: string } | null {
  if (refCorta) return { idType: '1', idTransacionReference: refCorta };
  if (txId) return { idType: '0', idTransacionReference: txId };
  return null;
}
