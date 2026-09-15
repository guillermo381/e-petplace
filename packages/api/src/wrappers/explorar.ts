/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LO PRESTADO DEL LOTE 5 — **dos lecturas en territorio de A** (S116-C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️⚠️ **ESTO LO ESCRIBE C EN TERRITORIO DE A, Y SE DECLARA EN VEZ DE
 * DISIMULARSE.** **Las dos viven en UN archivo a propósito**: así A tiene un
 * solo lugar que absorber o borrar, en vez de dos funciones sembradas entre las
 * suyas. El buzón lleva el pedido (`S116-C-para-A-explorar-necesita-
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


/* ══════════════════════════════════════════════════════════════════════════
 *  ② EL DESGLOSE FISCAL DE UNA CITA — lo que el checkout tiene que mostrar
 * ══════════════════════════════════════════════════════════════════════════
 *
 * `cita_desglose` es **la verdad congelada** de lo que se cobra: una fila por
 * cita, escrita cuando el precio se fija (`congelado_en`). Trae `subtotal`,
 * `impuesto`, `total`, `codigo_iva` y `tarifa_pct`.
 *
 * 🔴 **POR QUÉ HACE FALTA LEERLA Y NO CALCULARLA:** el checkout tiene el
 * `precio` y nada más. Partirlo en subtotal e IVA del lado del cliente sería
 * **re-implementar la aritmética fiscal en una pantalla** — y el día que la
 * tarifa cambie, o que un servicio tribute 0 %, la pantalla diría un número y
 * la factura otro. *El desglose que se muestra tiene que ser EL MISMO que se
 * cobra, y el único que lo es es el que el motor congeló.*
 *
 * ⚠️ **Medido con sesión real de usuario: la familia SÍ la lee** (RLS abierta
 * por la cita). Sin fila ⇒ `null`, y la pantalla cae al total pelado en vez de
 * inventar un desglose.
 */

export interface DesgloseDeCita {
  subtotal: number;
  impuesto: number;
  total: number;
  /** `EC_IVA_15`, `EC_IVA_0`… `null` si el motor no lo guardó. */
  codigoIva: string | null;
  /** El porcentaje con el que se calculó. `null` = no lo guardó. */
  tarifaPct: number | null;
}

export async function obtenerDesgloseDeCita(
  citaId: string,
): Promise<ResultadoWrapper<DesgloseDeCita | null, CodigoErrorExplorar>> {
  const { data, error } = await getClient()
    .from('cita_desglose')
    .select('subtotal, impuesto, total, codigo_iva, tarifa_pct')
    .eq('cita_id', citaId)
    .maybeSingle();

  if (error) return { ok: false, codigo: 'error_explorar', mensaje: MENSAJE };
  /* Sin fila **no es un error**: es una cita cuyo precio todavía no se congeló.
     La pantalla lo distingue de un fallo y muestra el total pelado. */
  if (data === null) return { ok: true, data: null };
  /* Los `numeric` de Postgres llegan como número por PostgREST, pero **se
     verifica en vez de suponerse**: un `string` acá se sumaría como texto y el
     total saldría concatenado. */
  const n = (v: unknown): number | null => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)) ? Number(v) : null);
  const subtotal = n(data.subtotal);
  const impuesto = n(data.impuesto);
  const total = n(data.total);
  if (subtotal === null || impuesto === null || total === null) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJE };
  }
  return {
    ok: true,
    data: {
      subtotal,
      impuesto,
      total,
      codigoIva: typeof data.codigo_iva === 'string' ? data.codigo_iva : null,
      tarifaPct: n(data.tarifa_pct),
    },
  };
}
