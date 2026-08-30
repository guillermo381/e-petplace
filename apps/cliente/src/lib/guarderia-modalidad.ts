/**
 * S107-C · **LA MODALIDAD DE GUARDERÍA** — el vocabulario y su compuerta, en
 * un solo lugar.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA FIRMA QUE LO ORDENA (founder, contrato `s107-contrato-filtro-por-modalidad` ⓪):
 *   **modalidad → día → ver quién puede → elegir lugar → pagar.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 POR QUÉ HAY UNA COMPUERTA, Y POR QUÉ NACE CON UNA SOLA ─────────────
 *
 * **Las tres modalidades están construidas enteras. Dos no se pueden vender**,
 * y no es una opinión — está medido contra el objeto el 29-ago-2026:
 *
 * · ☠️ **PAQUETE — ABIERTO el 29-ago** con el aviso literal de A: existe
 *   `comprarPaqueteGuarderia` y `reservarDiaDePaqueteGuarderia`, y **los
 *   presets salen de `guarderia_paquetes` del lugar**, no de un `5|10|15`
 *   cableado. *Su razón para estar cerrado —que la RPC del paseo cobraría
 *   contra una columna descartada— dejó de existir cuando nació la propia.*
 * · **MENSUAL** — `precio_mensual_plan` se configura y **nadie lo cobra**: no
 *   hay hermano de `contratar_plan_paseo`.
 *
 * *El propio contrato de paquetes lo dice en su ⑥: «consumir un día del
 * paquete al reservar llega con el arco de la reserva por paquete».*
 *
 * ── LA REGLA DE LA CASA QUE HACE QUE ESTO NO SEA UN CALLEJÓN ──────────────
 *
 * **N=1 COLAPSA.** Con una sola modalidad ofrecible **el selector no se
 * dibuja** y el flujo entra directo al camino del día — *«con un turno nadie
 * ve la palabra»* (S78). El precedente literal es de esta casa: la pantalla de
 * la serie recurrente se construyó entera y **no se le agregó la entrada**
 * hasta que existiera su lector, porque *«una fila que lleva a una pantalla
 * que no puede leer nada es un callejón con nombre bonito»*.
 *
 * ── ⚠️ LA TRAMPA, ESCRITA PARA QUIEN VENGA A ENCENDERLAS ──────────────────
 *
 * > ### **NO SE ENCIENDE UNA MODALIDAD PORQUE SU PANTALLA ESTÉ LISTA.**
 * > Se enciende cuando **el filtro del server acepta `p_modalidad`** y existe
 * > su RPC de cobro. Medido hoy: `obtener_guarderias_disponibles` **no tiene
 * > ese parámetro** y el wrapper devuelve **los tres precios**, no uno resuelto.
 *
 * *Encenderlas antes mostraría, bajo el rótulo «Paquete», la lista de lugares
 * que ofrecen **día** — que es la clase de defecto que no falla: omite.*
 */

export const MODALIDADES = ['dia', 'paquete', 'mensual'] as const;
export type ModalidadGuarderia = (typeof MODALIDADES)[number];

/**
 * 🔴 **LA COMPUERTA.** Cambiar esta línea es todo lo que hace falta el día que
 * A publique el filtro por modalidad y las dos RPC de cobro. Leé la trampa de
 * arriba antes de tocarla.
 */
export const MODALIDADES_ABIERTAS: readonly ModalidadGuarderia[] = ['dia', 'paquete'];

export function esModalidad(v: unknown): v is ModalidadGuarderia {
  return typeof v === 'string' && (MODALIDADES as readonly string[]).includes(v);
}

/**
 * Los tres tamaños firmados. **Espejo del `CHECK (tamano IN (5,10,15))`** de
 * `guarderia_paquetes` — mismo molde que `PRESETS_PAQUETE` del paseo, que vive
 * en el wrapper por la misma razón: *un techo que se lee y se amplía con una
 * decisión, no repartido en cinco funciones.*
 */
export const TAMANOS_PAQUETE = [5, 10, 15] as const;
export type TamanoPaqueteGuarderia = (typeof TAMANOS_PAQUETE)[number];
