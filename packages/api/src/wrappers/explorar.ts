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
 * inventar un criterio; se devuelve el orden de la vista y quien sabe la
 * distancia ordena.*
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
    .limit(limite);

  if (error) return { ok: false, codigo: 'error_explorar', mensaje: MENSAJE };
  if (!Array.isArray(data)) return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJE };
  /* Una fila sin `id` se OMITE en vez de viajar como `''` — un id vacío
     resuelve a "ningún perfil" tres pantallas más adelante, donde ya no se
     puede saber de dónde salió (L-124). */
  return { ok: true, data: data.flatMap((f) => (typeof f.id === 'string' ? [f.id] : [])) };
}
