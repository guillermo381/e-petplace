/**
 * LA IDENTIFICACIÓN ECUATORIANA — los tres algoritmos, escritos una vez
 * (S115-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POR QUÉ VIVE EN UN `.ts` SIN COMPONENTE, como `chevron.tsx`,
 * `usePresionado` y `caja-de-campo.ts`: **no es una pieza, es aritmética.**
 * Y separarla de la UI no es prolijidad — es lo que la vuelve **probable sin
 * montar una pantalla**. Un validador que solo se puede ejercer tipeando en
 * un campo es un validador que nadie va a ejercer en sus casos de borde.
 *
 * 🔴 **Y LOS CASOS DE BORDE SON EL PUNTO:** un dígito verificador acierta
 * sobre casi cualquier número inventado si uno lo prueba con dos ejemplos.
 * Los tres algoritmos de acá vienen con **su control positivo Y su control
 * negativo** en `identificacion-ec.control.mjs` — *la primera prueba de un
 * validador nuevo no es que dé verde: es que dé ROJO sobre un número que
 * debe rechazar* (`L-459`).
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LO QUE ESTE ARCHIVO NO HACE, Y ES DELIBERADO ─────────────────────────
 * **No dice si la identificación EXISTE.** Un dígito verificador prueba que
 * el número está *bien formado*, jamás que corresponda a una persona real.
 * *Confundir las dos cosas es cómo una pantalla termina afirmando «cédula
 * válida» sobre alguien que no existe.* Por eso las voces de la casa dicen
 * **«no parece una cédula válida»** y no «esa cédula no existe»: lo primero
 * es lo que medimos, lo segundo no lo sabemos.
 *
 * **No sabe de negocio.** No decide cuándo se pide RUC, ni qué tope obliga a
 * facturar con datos. Eso es de `MODELO_FISCAL` y llega por props.
 */

/** Los tres tipos que el SRI reconoce. Espejo del vocabulario de
 *  `facturas.tipo_identificacion` en la base — **no un vocabulario nuevo**:
 *  la columna ya existe y este archivo obedece a lo que hay. */
export type TipoIdentificacion = 'cedula' | 'ruc' | 'pasaporte'

/** El largo EXACTO de cada tipo. `null` = sin largo fijo (el pasaporte
 *  ecuatoriano no lo tiene, y los extranjeros menos).
 *
 *  🔴 Es la fuente del **momento de validar**: la pieza valida cuando el
 *  valor LLEGA a su largo, jamás tecla por tecla. Un largo escrito en la
 *  pieza y otro acá serían dos respuestas a la misma pregunta. */
export const LARGO: Record<TipoIdentificacion, number | null> = {
  cedula: 10,
  ruc: 13,
  pasaporte: null,
}

/** El largo de la clave de acceso de un comprobante electrónico. */
export const LARGO_CLAVE_ACCESO = 49

/** Solo dígitos, cortado al largo. **El saneo es del valor CRUDO** — pegar
 *  «cédula: 1712345675» deposita 1712345675.
 *
 *  ⚠️ Y por eso `maxLength` del input NO se usa (precedente medido en
 *  `CampoCodigo`, cazado por su smoke): trunca el crudo ANTES de sanear, así
 *  que corta el prefijo pegado y se queda con basura. */
export function soloDigitos(crudo: string, largo: number): string {
  return crudo.replace(/\D/g, '').slice(0, largo)
}

/** Alfanumérico en mayúsculas — el saneo del pasaporte, que acepta letras.
 *  Tope generoso (20) porque **no hay un largo universal** y recortar de más
 *  rechazaría documentos legítimos de otros países. */
export function soloAlfanumerico(crudo: string, largo = 20): string {
  return crudo.replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, largo)
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ① CÉDULA — MÓDULO 10
 *
 * Coeficientes 2,1,2,1,2,1,2,1,2 sobre los nueve primeros dígitos; todo
 * producto mayor a 9 se le resta 9; el verificador es lo que falta para la
 * decena superior.
 *
 * La precondición que NO es aritmética y se verifica igual: **provincia 01–24,
 * o 30** (los emitidos en el exterior).
 *
 * ⏪☠️ **SE QUITÓ LA REGLA DEL TERCER DÍGITO (firma del founder, 11-sep-2026),
 * y la decidió un DATO DE PRODUCCIÓN, no una fuente.**
 *
 * Hasta hoy se exigía `valor[2] < 6`. Eso **rechazaba la cédula `1762613006`,
 * que es real y está impresa como identificación del comprador en SIETE
 * facturas electrónicas AUTORIZADAS por el SRI, de seis emisores distintos.**
 * *Si el SRI la acepta siete veces, nosotros no podemos rechazarla.*
 *
 * Su literal: *«el módulo 10 es la norma; el 0–5 es una convención heredada que
 * ninguna fuente oficial sostiene y que rechaza ciudadanos reales. El costo de
 * rechazar a un cliente que sí existe es mucho mayor que el de aceptar un
 * número malformado que el SRI va a rebotar igual.»*
 *
 * Medido antes de tocar: `1762613006` **cierra su módulo 10** (dv calculado 6,
 * impreso 6). ⇒ quedan **la provincia y el módulo 10**, que es el que de verdad
 * valida.
 *
 * 🔴 **Y EL RUC NO SE TOCÓ CON LA MISMA MANO.** Ahí el tercer dígito **SÍ**
 * discrimina —9 sociedades · 6 sector público— y esas familias usan **módulo
 * 11**, no 10. Su rama se elige ANTES de llamar acá, así que este cambio no la
 * alcanza; hay un control que lo prueba en `verify-identificacion-ec`.
 * ⚠️ *Pero el mismo defecto existe un piso más arriba y está medido y
 * reportado: el RUC de persona natural de esa misma cédula (`1762613006001`)
 * **también se rechaza**, porque su tercer dígito lo manda a sector público.
 * Es decisión del founder y no se ejecutó acá.*
 * ═══════════════════════════════════════════════════════════════════════════ */
const COEF_CEDULA = [2, 1, 2, 1, 2, 1, 2, 1, 2] as const

export function esCedulaValida(valor: string): boolean {
  if (!/^\d{10}$/.test(valor)) return false

  const provincia = Number(valor.slice(0, 2))
  if ((provincia < 1 || provincia > 24) && provincia !== 30) return false
  /* ⏪☠️ Acá vivía `if (Number(valor[2]) >= 6) return false`. Lo quitó la firma
     del 11-sep sobre un dato de producción: siete facturas autorizadas por el
     SRI con una cédula de tercer dígito 6. Ver la cabecera. */

  let suma = 0
  for (let i = 0; i < 9; i += 1) {
    const producto = Number(valor[i]) * COEF_CEDULA[i]
    suma += producto > 9 ? producto - 9 : producto
  }
  const verificador = (10 - (suma % 10)) % 10
  return verificador === Number(valor[9])
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ② RUC — TRES FAMILIAS, TRES ALGORITMOS DISTINTOS
 *
 * 🔴 **Y ésta es la parte donde un validador ingenuo se equivoca callado:**
 * «RUC = 13 dígitos» es falso como regla, porque el tercer dígito decide
 * QUÉ algoritmo corre. Tratar los tres casos con uno solo acepta números
 * mal formados de dos de las tres familias.
 *
 *   · **0–5 · persona natural** — los diez primeros son una cédula válida.
 *   · **6 · sector público** — módulo 11 sobre los OCHO primeros, el noveno
 *     es el verificador, y el establecimiento son cuatro dígitos («0001»).
 *   · **9 · sociedad privada** — módulo 11 sobre los NUEVE primeros, el
 *     décimo es el verificador, establecimiento de tres («001»).
 *
 * El 7 y el 8 no existen: un tercer dígito ahí no pertenece a ninguna
 * familia y se rechaza.
 * ═══════════════════════════════════════════════════════════════════════════ */
const COEF_PUBLICO = [3, 2, 7, 6, 5, 4, 3, 2] as const
const COEF_PRIVADO = [4, 3, 2, 7, 6, 5, 4, 3, 2] as const

/** El módulo 11 del SRI. Su particularidad —y el detalle que se copia mal—
 *  es que **11 se lee como 0 y 10 como 1**: sin eso, un dígito legítimo
 *  queda fuera del rango 0-9 y el número se rechaza sin motivo.
 *
 *  🔴 **Y ESA MISMA CONVENCIÓN DEJA UN HUECO QUE NO ES NUESTRO: los restos 1
 *  y 10 producen EL MISMO dígito verificador.** Un resto de 1 da `11 − 1 =
 *  10`, que se lee 1; y un resto de 10 da `11 − 10 = 1`. ⇒ **hay errores de un
 *  solo dígito que este algoritmo no puede detectar.** Medido:
 *    · `179000001` → suma 45 → resto **1**  → dv 1
 *    · `179600001` → suma 87 → resto **10** → dv 1
 *
 *  Lo encontró el control al ampliarse (`scripts/verify-identificacion-ec.mjs`
 *  lo cuenta y lo declara). *Es el techo de lo que un módulo 11 con esta
 *  convención puede prometer* — y es la razón de fondo por la que la voz de
 *  la casa dice **«no parece válida»** y jamás «es válida». */
function modulo11(digitos: string, coeficientes: readonly number[]): number {
  let suma = 0
  for (let i = 0; i < coeficientes.length; i += 1) suma += Number(digitos[i]) * coeficientes[i]
  const resto = suma % 11
  if (resto === 0) return 0
  return 11 - resto === 10 ? 1 : 11 - resto
}

/** Persona natural: los diez primeros son una cédula válida y el
 *  establecimiento no puede ser `000`. **El establecimiento son los TRES
 *  últimos** — `slice(10)` —, que es lo que da «001» y no «6001». */
function esRucDePersonaNatural(valor: string): boolean {
  return esCedulaValida(valor.slice(0, 10)) && valor.slice(10) !== '000'
}

/** Sector público: módulo 11 sobre los OCHO primeros, verificador en el noveno
 *  y establecimiento de CUATRO dígitos. */
function esRucDeSectorPublico(valor: string): boolean {
  return modulo11(valor, COEF_PUBLICO) === Number(valor[8]) && valor.slice(9) !== '0000'
}

/** Sociedad privada: módulo 11 sobre los NUEVE primeros, verificador en el
 *  décimo y establecimiento de tres. */
function esRucDeSociedadPrivada(valor: string): boolean {
  return modulo11(valor, COEF_PRIVADO) === Number(valor[9]) && valor.slice(10) !== '000'
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ⏪☠️ **LA RAMA YA NO SE ELIGE POR EL TERCER DÍGITO: SE PRUEBAN LAS TRES Y
 *    ALCANZA CON QUE UNA CIERRE** (firma del founder, 11-sep-2026).
 *
 * Su razón: *«es exactamente lo que acabamos de retirar de la cédula. Una
 * convención que decide QUÉ algoritmo aplicar es más frágil que la aritmética
 * que valida — y ya demostró estar vencida.»*
 *
 * **El caso:** `1762613006001` es un RUC activo de persona natural, derivado de
 * una cédula impresa en siete facturas autorizadas. Su tercer dígito es 6, así
 * que la convención lo mandaba a **sector público** y lo rechazaba —por módulo
 * 11 (dv 7 contra el 0 impreso) y de paso por establecimiento («6001» en vez de
 * «001»)—. Con las tres ramas **cierra por persona natural**, y el
 * establecimiento sale **«001»** ✓.
 *
 * ── EL COSTO DEL ENSANCHE, MEDIDO Y NO ESTIMADO ─────────────────────────
 * Sobre 585 mutaciones de un dígito de cinco RUC reales: **de 104 aceptadas a
 * 192 · factor 1,85×.** *Probar tres puertas en vez de una casi duplica lo que
 * pasa, y se dice en vez de descubrirse después.* Se acepta porque **el costo
 * de rechazar a un contribuyente real es mayor que el de aceptar un número
 * malformado que el SRI va a rebotar igual** — la misma razón con la que cayó
 * la regla del tercer dígito de la cédula.
 * ⚠️ Y buena parte de ese 1,85× **ya existía**: el establecimiento (los tres
 * últimos) **no lo protege ningún verificador**, así que sus mutaciones pasaban
 * antes y siguen pasando.
 * ═══════════════════════════════════════════════════════════════════════════ */
export function esRucValido(valor: string): boolean {
  if (!/^\d{13}$/.test(valor)) return false

  const provincia = Number(valor.slice(0, 2))
  if ((provincia < 1 || provincia > 24) && provincia !== 30) return false

  return (
    esRucDePersonaNatural(valor) ||
    esRucDeSectorPublico(valor) ||
    esRucDeSociedadPrivada(valor)
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ③ CLAVE DE ACCESO — 49 DÍGITOS, MÓDULO 11 CON COEFICIENTES CÍCLICOS
 *
 * Los coeficientes 2..7 se aplican **de derecha a izquierda** sobre los 48
 * primeros; el dígito 49 es el verificador. Es el mismo módulo 11 de arriba
 * con otra ronda de coeficientes, así que reusa la misma función: *dos
 * implementaciones del mismo módulo son dos oportunidades de que una quede
 * distinta.*
 * ═══════════════════════════════════════════════════════════════════════════ */
export function esClaveAccesoValida(valor: string): boolean {
  if (!new RegExp(`^\\d{${LARGO_CLAVE_ACCESO}}$`).test(valor)) return false

  const cuerpo = valor.slice(0, LARGO_CLAVE_ACCESO - 1)
  // Cíclicos 2..7 desde la DERECHA — se arman una vez y se reusa `modulo11`.
  const coeficientes = Array.from({ length: cuerpo.length }, (_, i) => 2 + ((cuerpo.length - 1 - i) % 6))
  return modulo11(cuerpo, coeficientes) === Number(valor[LARGO_CLAVE_ACCESO - 1])
}

/** La puerta única: qué validador corre para qué tipo.
 *
 *  🔴 **El pasaporte NO se valida y eso es una decisión, no un hueco.** No
 *  existe un dígito verificador universal de pasaportes, y **fabricar una
 *  regla de largo mínimo rechazaría documentos legítimos de países que no
 *  conocemos**. Devolver `true` acá es honesto: *lo que no podemos medir no
 *  lo afirmamos ni lo negamos* — dice «no tengo con qué objetar», que es
 *  exactamente el estado real. */
export function esIdentificacionValida(tipo: TipoIdentificacion, valor: string): boolean {
  if (tipo === 'cedula') return esCedulaValida(valor)
  if (tipo === 'ruc') return esRucValido(valor)
  return valor.trim().length > 0
}

/** Agrupa de a `tamano` para que un número largo se pueda LEER y comparar
 *  contra un papel. Presentación pura: **el valor nunca se guarda agrupado**
 *  — quien lo guarde con espacios rompe el `^\d{49}$` de su propio
 *  validador. */
export function agrupar(valor: string, tamano = 4): string {
  return valor.replace(new RegExp(`(.{${tamano}})`, 'g'), '$1 ').trim()
}
