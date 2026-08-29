/**
 * S107-C · **EL CONTRATO DE LA ESTADÍA EN CURSO, DEL LADO DE LA SUPERFICIE.**
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ 🔴 ESTO NO ES UN CONTRATO INVENTADO: ES UN PEDIDO ESCRITO EN TIPOS.  │
 * │                                                                      │
 * │ Molde literal de `lib/serie/contrato.ts` (S103-C), que nació para    │
 * │ exactamente esta situación: *«C no inventa contratos: consume lo que │
 * │ A declare en la puerta. Mientras no exista, C trabaja contra el      │
 * │ contrato de la letra y marca el enchufe como pendiente con nombre.»* │
 * │                                                                      │
 * │ **Cuando A publique su lector, este archivo muere** y la pantalla    │
 * │ importa su tipo. Es una línea.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ── LO MEDIDO EL 29-AGO, que es lo que justifica cada campo ───────────────
 *
 * `obtenerEstadiasDelDia` **no sirve acá** y no es cuestión de permisos: es
 * **por prestador y por día**, y **filtra los holds a propósito** — correcto
 * para que el cuidador no salga a buscar un animal que nadie compró, e
 * inservible para una familia que necesita ver *su* reserva sin pagar.
 *
 * ── ⏪ CORRECCIÓN 29-ago · **`guarderia_tramos` SÍ EXISTE** ───────────────
 *
 * **Este archivo afirmaba que la tabla no existía y que el punto vivo era
 * inalcanzable. Estaba VENCIDO:** A la creó hace varias tandas y **en el mismo
 * acto curó una fuga que el hueco tapaba** — `obtener_punto_vivo` sólo pedía
 * `auth.uid()`, así que **cualquier logueado con un `tramo_id` obtenía la
 * ubicación en vivo de un vehículo.**
 *
 * ### 🔴 Y LA FORMA IMPORTA MÁS QUE LA EXISTENCIA, porque de acá sale un error caro
 *
 * **El tramo es del VIAJE, no de la estadía.** La tabla es
 * `(id, prestador_id, fecha, direccion, estado, …)` — **sin `estadia_id`** — y
 * **cada estadía apunta a los suyos** con `tramo_recogida_id` /
 * `tramo_devolucion_id`.
 *
 * > **Un tramo por estadía haría que el MISMO vehículo emitiera N puntos
 * > idénticos**, uno por animal a bordo. *No fallaría: multiplicaría la misma
 * > verdad y la volvería N verdades que hay que mantener de acuerdo.*
 *
 * ⇒ **la superficie NO crea tramos ni los infiere: los LEE de la estadía.**
 *
 * *Nota de método: este archivo decía lo contrario con total seguridad porque
 * su medición fue correcta el día que se hizo. **Un dato medido no es un dato
 * vigente** (`L-166`) — y una afirmación estructural vencida es peor que una
 * ausencia, porque el que la lee construye contra ella.*
 */

import type { EstadoEstadia } from '@epetplace/api';

export type EstadiaEnCurso = {
  estadiaId: string;
  citaId: string;
  /** 'YYYY-MM-DD' */
  fecha: string;
  estado: EstadoEstadia;
  prestadorNombre: string;
  mascotaId: string;
  mascotaNombre: string;
  /** Las dos ventanas del lugar ESE día. `null` = todavía no congeladas. */
  recogeDesde: string | null;
  recogeHasta: string | null;
  /**
   * El tramo EN CURSO, leído de la estadía (`tramo_recogida_id` o
   * `tramo_devolucion_id` según el estado). 🔴 **La pantalla no lo crea ni lo
   * deduce** — ver la cabecera: el tramo es del viaje y lo comparten todos los
   * animales que van a bordo.
   */
  tramoActivoId: string | null;
  /**
   * El acta que espera la conformidad del dueño. `null` = ninguna pendiente.
   * `confirmarActaGuarderia(actaId)` **ya existe**: lo que falta es de dónde
   * sacar el `actaId`.
   */
  actaPendienteId: string | null;
};
