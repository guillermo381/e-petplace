/**
 * S103-C · **EL CONTRATO DE LA SERIE RECURRENTE, DEL LADO DE LA SUPERFICIE.**
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ 🔴 ESTO NO ES UN CONTRATO INVENTADO: ES UN PEDIDO ESCRITO EN TIPOS.  │
 * │                                                                      │
 * │ `PLAN_MESA_104` §1: *«C no inventa contratos: consume lo que A y D   │
 * │ declaren en la puerta. **Mientras no exista, C trabaja contra el     │
 * │ contrato de la letra y marca el enchufe como pendiente con nombre**»*│
 * │                                                                      │
 * │ Medido el 22-ago: `packages/api` exporta `configurarRecurrencia` y   │
 * │ `alternarRecurrencia`, **y ningún lector**. Cero consumidores de     │
 * │ `pedidos_recurrencias` fuera del alta.                               │
 * │                                                                      │
 * │ **Cuando A publique su lector, este archivo muere** y la pantalla    │
 * │ importa su tipo. Es una línea.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ── 🔴 DOS CAMPOS QUE LA BASE HOY **NO TIENE**, y no es un hueco de pantalla ──
 *
 * El censo de A (S103-A ①.7) los midió como divergencias contra la letra:
 *
 * · **`medio`** (#3) — `LETRA_COBRO_RECURRENTE` §2 exige que la autorización
 *   *«nombre un medio de pago concreto (el token guardado)»*. La tabla no tiene
 *   la columna ⇒ **§6 («si ese medio muere, la serie no salta a otro») es
 *   inexpresable: no hay «otro» del cual no saltar.**
 * · **`montoEsperado`** (#4) — §2 exige guardar *«qué monto esperado»* y §5
 *   firma que *«el monto del aviso ES el monto del cobro»*.
 *
 * ⇒ Los dos entran como **`| null`, y la pantalla tiene VOZ DE AUSENCIA para
 *   cada uno.** *Un `0` o un guion mudo en el lugar de una plata que no
 *   conocemos es peor que decir que no la mostramos: el guion se lee como
 *   «gratis» y el cero como «no te cobran».*
 *
 * ── Y EL TERCERO, que decide DOS pantallas distintas ──────────────────────
 *
 * **`estado`** (#5) — §6 firma **pausa ≠ cancelación** (tres días de reintento
 * y después pausa, que el cliente reanuda actualizando su medio). La tabla
 * tiene **un solo `activo boolean`** ⇒ hoy **no se puede distinguir «la casa la
 * pausó por fallo» de «el cliente la apagó»**. Se pide como enum: *derivarlo
 * del booleano acá sería fabricar en la pantalla un dato que el motor no tiene.*
 */

/** Un ítem de la serie, en voz de la familia (jamás el slug del motor). */
export type ItemDeSerie = {
  nombre: string;
  cantidad: number;
};

export type EstadoDeSerie =
  /** corre normal */
  | 'activa'
  /** 🔴 la casa la pausó tras los tres reintentos de §6 — reanudable */
  | 'pausada'
  /** el cliente la cortó */
  | 'cancelada';

export type SerieRecurrente = {
  id: string;
  items: ItemDeSerie[];
  /** XOR con `diaDelMes`, como el CHECK de la tabla. */
  frecuenciaDias: number | null;
  diaDelMes: number | null;
  /** `date` ISO — la fecha del próximo pedido. */
  proximoPedidoFecha: string;
  /** La dirección ya resuelta a una línea legible. */
  entregaEtiqueta: string | null;
  estado: EstadoDeSerie;
  /** 🔴 PEDIDO A A — la columna no existe (censo A ①.7 #4). */
  montoEsperado: number | null;
  /** 🔴 PEDIDO A A — la columna no existe (censo A ①.7 #3). */
  medio: { marca: string | null; ultimos4: string | null } | null;
  /** El producto que no se pudo enviar, si la última entrega se saltó (§7). */
  saltadaProducto: string | null;
};
