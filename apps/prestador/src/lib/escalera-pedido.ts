/**
 * EL MAPEO ESCALÓN INTERNO → ESCALERA — una sola verdad para el módulo.
 *
 * El motor mueve estados internos (`cat_estados_pedido`, medidos
 * 12-ago-2026); el panel dibuja CUATRO escalones (LETRA_PANEL §3) y
 * decide QUÉ ACCIÓN pedir adelante. Cuatro pantallas leyendo el estado
 * crudo serían cuatro respuestas distintas a la misma pregunta — el
 * corte vive acá, como `corte-agenda.ts` en el cliente (Ley 19.9).
 *
 * Este archivo NO trae voz: devuelve CLAVES, y cada pantalla las lleva a
 * su diccionario (la voz es de la casa, la forma es compartida — método
 * §6). Y no inventa botones: un estado que no conoce devuelve
 * `accion: 'ninguna'` y pasos vacíos — jamás un CTA sobre un estado que
 * el motor va a rebotar (Ley 23: la puerta no ofrece lo que van a
 * rechazar).
 *
 * DOS RECORRIDOS, no uno (recorrido §0 del contrato):
 *   despacho: preparado · empacado · despachado · entregado
 *   retiro:   preparado · empacado · facturado · retirado
 * En despacho la factura es el REQUISITO del escalón «Despachado», no un
 * escalón propio; en retiro no hay despacho y la factura sí se ve como
 * paso — es lo que el vendedor de mostrador tiene que hacer.
 */

export type ClaveEscalon =
  | 'preparado'
  | 'empacado'
  | 'facturado'
  | 'despachado'
  | 'entregado'
  | 'retirado';

export type AccionPedido =
  | 'preparar'
  | 'empacar'
  | 'facturar'
  | 'despachar'
  | 'reintentar'
  | 'entregarRetiro'
  | 'enManosRepartidor'
  | 'ninguna';

export type EstadoPasoDerivado = 'hecho' | 'actual' | 'pendiente';

export interface EscaleraDerivada {
  pasos: { clave: ClaveEscalon; estado: EstadoPasoDerivado }[];
  /** El camino se interrumpió — banda, no escalón (decisión ① de la pieza). */
  desvio: 'noLlego' | 'cancelado' | null;
  accion: AccionPedido;
}

const PASOS_DESPACHO: ClaveEscalon[] = ['preparado', 'empacado', 'despachado', 'entregado'];
const PASOS_RETIRO: ClaveEscalon[] = ['preparado', 'empacado', 'facturado', 'retirado'];

/** Cuántos escalones están HECHOS y cuál es la acción, por estado interno. */
function situar(
  estadoInterno: string,
  esRetiro: boolean,
): { hechos: number; accion: AccionPedido; desvio: 'noLlego' | 'cancelado' | null } | null {
  switch (estadoInterno) {
    case 'pago_capturado':
    case 'stock_reservado':
    case 'vendedor_notificado':
    case 'liberado_preparacion':
      return { hechos: 0, accion: 'preparar', desvio: null };
    case 'picking':
      return { hechos: 1, accion: 'empacar', desvio: null };
    case 'empacado':
      return { hechos: 2, accion: 'facturar', desvio: null };
    case 'documentado':
      return esRetiro
        ? { hechos: 3, accion: 'entregarRetiro', desvio: null }
        : { hechos: 2, accion: 'despachar', desvio: null };
    case 'en_reparto':
    case 'hacia_destino':
      return { hechos: 3, accion: 'enManosRepartidor', desvio: null };
    case 'entregado':
      return { hechos: 4, accion: 'ninguna', desvio: null };
    case 'entrega_fallida':
      return { hechos: 3, accion: 'reintentar', desvio: 'noLlego' };
    case 'cancelado_cliente':
    case 'cancelado_vendedor':
    case 'cancelado_sistema':
      return { hechos: 0, accion: 'ninguna', desvio: 'cancelado' };
    default:
      // creado / esperando_pago / estados apagados / lo que no conocemos:
      // sin escalera y sin botón — la fila habla con la narrativa del
      // catálogo y nada más.
      return null;
  }
}

export function derivarEscalera(
  estadoInterno: string,
  metodoEntrega: string | null,
): EscaleraDerivada {
  const esRetiro = metodoEntrega === 'retiro';
  const situacion = situar(estadoInterno, esRetiro);
  if (situacion === null) return { pasos: [], desvio: null, accion: 'ninguna' };

  const base = esRetiro ? PASOS_RETIRO : PASOS_DESPACHO;
  const pasos = base.map((clave, i) => ({
    clave,
    estado:
      i < situacion.hechos
        ? ('hecho' as const)
        : i === situacion.hechos && situacion.desvio === null && situacion.accion !== 'ninguna'
          ? ('actual' as const)
          : ('pendiente' as const),
  }));
  // Entregado del todo: el último paso también está hecho, sin «actual».
  if (situacion.hechos >= base.length) {
    for (const p of pasos) p.estado = 'hecho';
  }
  return { pasos, desvio: situacion.desvio, accion: situacion.accion };
}
