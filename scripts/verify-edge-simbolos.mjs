/**
 * ☠️ JUBILADO (S103-B, 22-ago-2026) — REEMPLAZADO POR `verify-edge-deno.mjs`
 *
 * Esto es una LÁPIDA, no un gate. No mide nada y no da verde nunca.
 *
 * ── POR QUÉ MURIÓ ──
 * **Daba VERDE con un defecto vivo de su propia clase.** `pagos-webhook-stg`
 * usaba `KEY_CLIENT` sin que nadie lo declarara jamás — `ReferenceError` en
 * runtime, que la plataforma devuelve como 500. **Costó 8 eventos del
 * proveedor sin validar durante un día entero**, con este gate en verde todo
 * ese tiempo. Las 8 filas del buzón lo dicen literal:
 *   `analisis_fallo: ReferenceError: KEY_CLIENT is not defined`.
 *
 * **No falló: contestó bien una pregunta más angosta que su propósito.**
 * Medía «símbolo de MÓDULO usado sin importar» contra una lista fija
 * (`createHmac`, `createClient`, …). `KEY_CLIENT` es un **identificador
 * libre**, así que la otra mitad de la clase «usar algo que no existe» le
 * quedaba afuera. *El gate que existe para que esto no pase, no lo vio.*
 *
 * ── POR QUÉ NO SE ENSANCHÓ ──
 * Porque ya se había intentado y **su propia cabecera lo documentaba como
 * fracaso**: la versión ancha daba *«20 rojos sobre 22 funciones y casi
 * todos falsos»*, con la conclusión *«un gate que grita siempre es un gate
 * que nadie mira — y eso es peor que no tenerlo, porque además da la
 * sensación de estar cubierto»*. Su angostura era una decisión medida.
 * ⇒ Se cambió el INSTRUMENTO, no el criterio: un typechecker de verdad
 *   (`deno check`) en vez de más regex.
 *
 * ── LA SUBSUNCIÓN, PROBADA ANTES DE JUBILARLO ──
 * No se retiró por confianza. Se rompió a propósito el import de
 * `createHmac` —**su** clase, el caso que lo parió— y se corrieron los dos:
 *   viejo  → 🔴 «1 de 22 funciones con símbolos de módulo sin importar»
 *   nuevo  → 🔴 `TS2552: Cannot find name 'createHmac'. Did you mean 'createHash'?`
 * El reemplazo cubre su clase **y** la que se le escapaba. Jubilarlo no
 * pierde cobertura: la amplía.
 *
 * ── EL REEMPLAZO ──
 *   node scripts/verify-edge-deno.mjs              → el gate
 *   node scripts/verify-edge-deno.mjs --autoprueba → se prueba a sí mismo
 *
 * ⚠️ Esta lápida sale con código 2 (**no concluyente**), jamás 0. Si algún
 * arnés, hook o runbook todavía lo invoca, tiene que ENTERARSE — un gate
 * jubilado que devuelve 0 en silencio es la misma clase de mentira que lo
 * mató. Y no sale con 1 porque 1 significa «encontré un defecto», y acá no
 * se midió ninguno.
 */
console.error('\n☠️  verify-edge-simbolos está JUBILADO (S103-B) y NO MIDIÓ NADA.\n')
console.error('   Daba verde con un defecto vivo de su propia clase: `KEY_CLIENT`')
console.error('   usado y nunca declarado — 8 eventos del proveedor sin validar.')
console.error('   Cubría media clase (símbolos de módulo, lista fija); la otra mitad')
console.error('   —globales no declaradas— le quedaba afuera.\n')
console.error('   Usá en su lugar:  node scripts/verify-edge-deno.mjs\n')
process.exit(2)
