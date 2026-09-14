/**
 * CONFIG DEL ARRANQUE — los valores que gobiernan 00, en un solo lugar.
 *
 * 🔴 **POR QUÉ NO VAN TECLEADOS EN LA PANTALLA** (firma del founder: *«los
 * tiempos por token»*, y este lote: *«el valor viene de config»*): un número
 * escrito adentro del componente es un número que **sólo puede cambiar quien
 * abra ese archivo**, y que nadie encuentra buscando. Acá se lee de una,
 * con su porqué al lado.
 *
 * ⚠️ **Y POR QUÉ NO SALE DE `app_config`, que es la otra «config» de la casa:**
 * está medido en `packages/api/src/client.ts` — **`authenticated` ve las filas
 * de `app_config` y `anon` ve CERO**. El piso del splash rige exactamente en el
 * momento en que **todavía no hay sesión**, así que leerlo de ahí devolvería
 * nada en el único caso donde importa. *Una perilla que no se puede leer cuando
 * hace falta no es una perilla: es una que siempre está en su default.*
 *
 * ⇒ si algún día la mesa lo quiere movible sin publicar, su lugar es el
 * mecanismo de techos de red (`cargarTechosDeRed`, `packages/api`) **y con una
 * fila legible por `anon`** — es cambio de motor, de A, no de esta pantalla.
 */

/**
 * Cuánto se queda 00 como MÍNIMO en la primera apertura del aparato.
 *
 * **Dos segundos**, firma del founder (14-sep-2026). No es un número redondo
 * por gusto: la coreografía necesita ~0,34 s de respiro de la nariz, ~0,52 s de
 * halo y seis entradas escalonadas encima — bajo dos segundos vuelve a quedar
 * a medias, que es el defecto que este piso viene a curar.
 */
export const PISO_SPLASH_PRIMERA_APERTURA_MS = 2000;
