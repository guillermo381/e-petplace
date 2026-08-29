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
 * ── 🔴 EL CAMPO QUE HOY ES IMPOSIBLE, Y NO POR PERMISOS ──────────────────
 *
 * **`tramoActivoId`.** `obtenerPuntoVivo(tramoId)` y `registrarPuntoVivo`
 * existen y funcionan. Pero medido contra el esquema:
 *
 * · **`guarderia_tramos` NO EXISTE** — no hay tabla de tramos.
 * · `guarderia_tramo_punto.tramo_id` es un **uuid sin FK** (`Relationships: []`).
 * · `guarderia_estadias` **no tiene columna de tramo**.
 *
 * > ### **Nadie puede producir un `tramoId` y nadie puede obtenerlo.** El punto
 * > vivo es inalcanzable **por los dos lados**, y no por permisos: **por falta
 * > de la entidad que los une.**
 *
 * *Es `L-318` («motor sin puerta») un piso más adentro: la pieza existe, es
 * alcanzable desde afuera y pasa sus pruebas — **lo que no tiene productor es
 * el identificador con el que abre**. Y no da error: devuelve `null`, que la
 * pantalla lee como «todavía no salió».*
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
   * 🔴 **HOY SIEMPRE `null` — y no porque falte el dato, sino la ENTIDAD.**
   * Ver la cabecera. Con él, el mapa del tramo se enciende solo.
   */
  tramoActivoId: string | null;
  /**
   * El acta que espera la conformidad del dueño. `null` = ninguna pendiente.
   * `confirmarActaGuarderia(actaId)` **ya existe**: lo que falta es de dónde
   * sacar el `actaId`.
   */
  actaPendienteId: string | null;
};
