/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXPLORAR — **quiénes hay, sin pedir todavía un horario** (S116-C · lote 5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️⚠️ **ESTO LO ESCRIBE C EN TERRITORIO DE A, Y SE DECLARA EN VEZ DE
 * DISIMULARSE.** El buzón lleva el pedido (`S116-C-para-A-explorar-necesita-
 * saber-quien-hay.md`). Se escribió acá porque **sin esto el punto 1 del lote
 * no se puede construir**, y se escribió de la forma más chica posible:
 *
 *   · **archivo NUEVO** — no toca ninguno de A;
 *   · **devuelve SÓLO ids** — el mapeo de `PerfilPublico` sigue viviendo una
 *     sola vez, en `prestador.ts`. *Copiar ese `map` acá habría creado una
 *     segunda verdad sobre la misma vista, y dos mapeos de lo mismo divergen
 *     el día que la vista gane una columna.*
 *   · **misma puerta** — `v_prestadores_publicos`, la vista que los dos
 *     lectores de A ya leen. **No abre nada nuevo**: medido con sesión real de
 *     usuario, sin filtro, devuelve sus filas (11 hoy).
 *   · **descartable en una línea** — el día que A entregue un lector que
 *     devuelva perfil + distancia en UN viaje, esto se borra y la pantalla
 *     cambia el import.
 *
 * ── POR QUÉ HACÍA FALTA, medido ─────────────────────────────────────────────
 * **Los cinco lectores de «disponibles» exigen `fecha` + `hora`**
 * (`obtener_paseadores_disponibles` y sus cuatro hermanos), y Explorar tiene
 * que mostrar quién hay **antes** de que la familia elija cuándo. Y los dos
 * lectores públicos de A (`obtenerPerfilesPublicos`,
 * `…PorCuenta`) **piden los ids que justamente no se tienen**. *El dato existía
 * y la operación no.*
 *
 * ── EL COSTO, declarado ─────────────────────────────────────────────────────
 * Son **DOS viajes** —ids acá, perfiles con el lector de A— donde A podría
 * hacer uno. Se paga a propósito: *un viaje de más es más barato que un
 * segundo mapeo de la misma vista.* La cura de verdad es de A.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⊳ **REVISADO Y ADOPTADO POR A (S116-A, 15-sep-2026).** Se queda tal como C lo
 * escribió, **con una sola corrección**, y con dos cosas que se midieron y
 * resultaron estar bien:
 *
 * ✅ **La forma es la correcta y no se toca:** archivo propio, sólo ids, misma
 *   vista, techo con default, y la fila sin `id` omitida con su razón. *Escribir
 *   en territorio ajeno de la forma más chica posible y declararlo es
 *   exactamente cómo se hace.*
 *
 * ✅ **Lo que casi "corrijo" y estaba bien: NO lleva guard de sesión.** Iba a
 *   agregarle el `uidActual()` que llevan los demás wrappers, y la medición lo
 *   frenó: `has_table_privilege('anon', 'v_prestadores_publicos', 'SELECT')` es
 *   **true** — la vitrina es pública por diseño. *Un guard más estricto que el
 *   dato no protege nada: rechaza lo que la base concede, y encima haría creer
 *   que la vitrina exige sesión.*
 *
 * 🔴 **LO ÚNICO QUE SE CORRIGE: `.limit()` SIN `order` NO ES UNA LISTA, ES UNA
 *   MUESTRA.** Una vista no tiene orden garantizado (ésta no lleva `ORDER BY`:
 *   se leyó su definición), así que *cuáles* 40 vuelven lo decide el plan de
 *   ejecución y **puede cambiar entre dos llamadas iguales**. Con 4 filas no se
 *   nota; con 400 la familia ve un subconjunto distinto cada vez que entra, y
 *   **ningún error aparece jamás**.
 *   ⚠️ **Y no contradice a C**: su nota dice que *ordenar por `nombre` sería
 *   inventar un criterio*, y tiene razón —el orden SEMÁNTICO lo pone quien sabe
 *   la distancia—. Esto es otra cosa: **determinismo**. Se ordena por
 *   `id` —estable, y deliberadamente sin significado— y quien tiene la distancia
 *   sigue reordenando arriba.
 *   ⚠️ **Y el primer intento fue por `created_at`, que la vista NO EXPONE**
 *   (medido contra `information_schema` antes de commitear): habría devuelto 400
 *   en cada llamada y la pantalla habría dicho «no pudimos cargar los negocios»
 *   para siempre. *Una cura sin medir es un defecto con mejor prosa.*
 *
 * 📌 **El pedido de C sigue en pie y es de A:** un lector que devuelva perfil +
 *   distancia en UN viaje, con orden y filtro por oficio EN EL SERVIDOR. Hasta
 *   entonces los dos límites que él declaró son reales: no se puede acotar por
 *   distancia ni filtrar por oficio sin traer todo.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export type CodigoErrorExplorar = 'error_explorar' | 'datos_inconsistentes';

const MENSAJE = 'No pudimos cargar los negocios. Vuelve a intentarlo.';

/**
 * Los ids de los negocios con vitrina pública.
 *
 * ⚠️ **No ordena por distancia y no puede:** la vista no la calcula y el punto
 * de la familia vive en el cliente. **La distancia la computa la pantalla** con
 * `zona_lat`/`zona_lon`, que el perfil ya trae. *Ordenar acá por `nombre` sería
 * inventar un criterio; el orden SEMÁNTICO lo pone quien sabe la distancia.*
 *
 * 🔴 **Pero sí ordena por `created_at`, y eso NO es un criterio: es
 * determinismo.** `.limit()` sobre una vista sin `ORDER BY` devuelve **una
 * muestra arbitraria**, y cuáles vuelven lo decide el plan de ejecución: con más
 * filas que el techo, la familia vería un subconjunto distinto cada vez, **sin
 * que nada falle**. Se ordena por `id`: estable, y sin significado a propósito.
 *
 * ⚠️ **El techo es del llamador y tiene default**: una lista sin techo es una
 * lista que crece con el catálogo hasta que alguien la mire (regla del 6-sep).
 */
export async function listarIdsPrestadoresPublicos(
  limite = 40,
): Promise<ResultadoWrapper<string[], CodigoErrorExplorar>> {
  const { data, error } = await getClient()
    .from('v_prestadores_publicos')
    .select('id')
    /* El orden es por DETERMINISMO, no por criterio — ver la nota de arriba. */
    .order('id', { ascending: true })
    .limit(limite);

  if (error) return { ok: false, codigo: 'error_explorar', mensaje: MENSAJE };
  if (!Array.isArray(data)) return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJE };
  /* Una fila sin `id` se OMITE en vez de viajar como `''` — un id vacío
     resuelve a "ningún perfil" tres pantallas más adelante, donde ya no se
     puede saber de dónde salió (L-124). */
  return { ok: true, data: data.flatMap((f) => (typeof f.id === 'string' ? [f.id] : [])) };
}
