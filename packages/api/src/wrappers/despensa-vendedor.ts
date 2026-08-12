// EL PANEL MÍNIMO DEL VENDEDOR (S95-E · Bloque 6 · D-755).
// Lista de pedidos · tres botones —preparado, empacado, despachado— · ajuste
// de stock. Nada más: D-755 nació porque el panel **no estaba en el alcance v1
// de S94**, y que siempre se haya querido hacer no lo vuelve gratis.
//
// 🔴 EL ROL VENDEDOR NO VE EL EXPEDIENTE. NUNCA. POR NINGUNA VÍA.
// En este archivo no hay una sola lectura de `mascotas`, `eventos_mascota` ni
// `mascota_perfil_vigente`, y no puede haberla: `es_vendedor_de()` —el helper
// que gatea todo lo de acá— **jamás aparece en una policy del expediente**
// (MODELO_DESPENSA §7.4), y el juez lo verifica como invariante 4. *Un
// vendedor puro tiene cero acceso al expediente: el seller no hereda nada del
// rol prestador.*
//
// LO QUE ESTE ARCHIVO NO DECIDE: si una transición es válida. Eso vive en
// `cat_transiciones_pedido`, que es DATO, y lo resuelve `mover_estado_pedido`.
// Acá no hay un `switch` de estados ni un `if` que autorice a nadie.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import {
  falloDespensa,
  falloDespensaCodigo,
  esObjDespensa,
  esNarrativa,
  type CodigoErrorDespensa,
  type NarrativaPedido,
} from './_despensa-comun';

export interface PedidoDelVendedor {
  pedido_id: string;
  numero_orden: string;
  total: number;
  moneda: string;
  narrativa: NarrativaPedido;
  narrativa_nombre: string;
  es_terminal: boolean;
  promesa_desde: string | null;
  promesa_hasta: string | null;
  creado_en: string;
}

/** Los pedidos de MI cuenta comercial. La RLS ya restringe por
 *  `es_vendedor_de(cuenta_comercial_id)`; el filtro explícito acota a UNA
 *  cuenta cuando la persona tiene más de una. */
export async function listarPedidosDelVendedor(
  cuentaComercialId: string,
  limite = 50,
): Promise<ResultadoWrapper<PedidoDelVendedor[], CodigoErrorDespensa>> {
  const { data, error } = await getClient()
    .from('v_pedidos_narrativa')
    .select('pedido_id, numero_orden, total, moneda, narrativa, narrativa_nombre, es_terminal, promesa_entrega_desde, promesa_entrega_hasta, created_at')
    .eq('cuenta_comercial_id', cuentaComercialId)
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida: PedidoDelVendedor[] = [];
  for (const f of data) {
    if (!esObjDespensa(f) || typeof f.pedido_id !== 'string' || !esNarrativa(f.narrativa)) {
      return falloDespensa('datos_inconsistentes');
    }
    salida.push({
      pedido_id: f.pedido_id,
      numero_orden: typeof f.numero_orden === 'string' ? f.numero_orden : '',
      total: typeof f.total === 'number' ? f.total : 0,
      moneda: typeof f.moneda === 'string' ? f.moneda : 'USD',
      narrativa: f.narrativa,
      narrativa_nombre: typeof f.narrativa_nombre === 'string' ? f.narrativa_nombre : '',
      es_terminal: f.es_terminal === true,
      promesa_desde:
        typeof f.promesa_entrega_desde === 'string' ? f.promesa_entrega_desde : null,
      promesa_hasta:
        typeof f.promesa_entrega_hasta === 'string' ? f.promesa_entrega_hasta : null,
      creado_en: typeof f.created_at === 'string' ? f.created_at : '',
    });
  }
  return { ok: true, data: salida };
}

/** Las líneas a empacar, con su lote si ya se registró. Sin esto el vendedor
 *  no sabe qué `item_id` mandar a `empacarPedido`. */
export async function obtenerLineasParaEmpaque(
  pedidoId: string,
): Promise<
  ResultadoWrapper<
    { item_id: string; nombre_producto: string; cantidad: number; lote: string | null }[],
    CodigoErrorDespensa
  >
> {
  const { data, error } = await getClient()
    .from('pedido_items')
    .select('id, nombre_producto, cantidad, lote')
    .eq('pedido_id', pedidoId);
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida = [];
  for (const i of data) {
    if (!esObjDespensa(i) || typeof i.id !== 'string') return falloDespensa('datos_inconsistentes');
    salida.push({
      item_id: i.id,
      nombre_producto: typeof i.nombre_producto === 'string' ? i.nombre_producto : '',
      cantidad: typeof i.cantidad === 'number' ? i.cantidad : 0,
      lote: typeof i.lote === 'string' ? i.lote : null,
    });
  }
  return { ok: true, data: salida };
}

// ── LOS TRES BOTONES ────────────────────────────────────────────────────────

/** Botón 1 · PREPARADO — el vendedor empezó a armarlo (`picking`). */
export async function marcarPedidoEnPreparacion(
  pedidoId: string,
): Promise<ResultadoWrapper<{ narrativa: NarrativaPedido }, CodigoErrorDespensa>> {
  return moverComoVendedor(pedidoId, 'picking');
}

export interface LoteDeItem {
  item_id: string;
  /** 🔴 OBLIGATORIO. Sin lote no se puede empacar — ver `empacarPedido`. */
  lote: string;
  fecha_vencimiento?: string;
}

/**
 * Botón 2 · EMPACADO. 🔴 **EXIGE LOTE. SIN LOTE NO AVANZA.**
 *
 * El que rebota es el motor (`lote_requerido`), no este archivo — pero el
 * wrapper lo chequea ANTES de viajar para que el vendedor vea el pedido sin
 * pagar un round-trip, y **jamás lo rellena con un valor por defecto**: un
 * lote inventado es peor que ningún lote, porque el día del retiro se le
 * avisaría a las familias equivocadas y no a las correctas.
 *
 * *Los retiros de alimento para mascotas son reales, recurrentes y matan
 * animales. Esta columna es la diferencia entre poder avisar y no poder.*
 */
export async function empacarPedido(
  pedidoId: string,
  lotes: LoteDeItem[],
  pesoRealKg?: number,
): Promise<ResultadoWrapper<{ items_con_lote: number }, CodigoErrorDespensa>> {
  if (lotes.length === 0 || lotes.some((l) => l.lote.trim().length === 0)) {
    return falloDespensaCodigo('lote_requerido');
  }
  const { data, error } = await getClient().rpc('empacar_pedido', {
    p_pedido_id: pedidoId,
    p_lotes: lotes.map((l) => ({
      item_id: l.item_id,
      lote: l.lote.trim(),
      fecha_vencimiento: l.fecha_vencimiento ?? null,
    })),
    p_peso_real_kg: pesoRealKg ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return {
    ok: true,
    data: { items_con_lote: typeof data.items_con_lote === 'number' ? data.items_con_lote : 0 },
  };
}

/** Botón 3 · DESPACHADO — el paquete salió hacia el courier. */
export async function marcarPedidoDespachado(
  pedidoId: string,
): Promise<ResultadoWrapper<{ narrativa: NarrativaPedido }, CodigoErrorDespensa>> {
  return moverComoVendedor(pedidoId, 'esperando_courier');
}

/**
 * La puerta única del panel: TODO movimiento del vendedor pasa por
 * `mover_estado_pedido` con `actor='vendedor'`.
 *
 * 🔴 Un estado apagado rebota con error explícito. `estado_inactivo` no es un
 * error del vendedor: es la ley de S95-D —el camino está modelado y CERRADO en
 * la operación— y el mensaje lo dice sin culparlo.
 */
async function moverComoVendedor(
  pedidoId: string,
  hasta: string,
): Promise<ResultadoWrapper<{ narrativa: NarrativaPedido }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('mover_estado_pedido', {
    p_pedido_id: pedidoId,
    p_hasta: hasta,
    p_actor: 'vendedor',
    p_motivo: undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  // `sin_cambio: true` (idempotencia del motor) no trae narrativa: se relee.
  if (data.sin_cambio === true) {
    const rel = await getClient()
      .from('v_pedidos_narrativa')
      .select('narrativa')
      .eq('pedido_id', pedidoId)
      .maybeSingle();
    if (rel.error) return falloDespensa(rel.error.message);
    if (!esObjDespensa(rel.data) || !esNarrativa(rel.data.narrativa)) {
      return falloDespensa('datos_inconsistentes');
    }
    return { ok: true, data: { narrativa: rel.data.narrativa } };
  }
  if (!esNarrativa(data.narrativa)) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { narrativa: data.narrativa } };
}

// ── AJUSTE DE STOCK ─────────────────────────────────────────────────────────

export interface SkuDelVendedor {
  sku_id: string;
  sku_vendedor: string;
  variante_id: string;
  /** Materializado por trigger desde `inventario_movimientos`. El ledger es
   *  la verdad; esto es lectura rápida (patrón `mascota_perfil_vigente`). */
  stock_disponible: number;
  stock_reservado: number;
  estado: string;
}

export async function listarSkusDelVendedor(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<SkuDelVendedor[], CodigoErrorDespensa>> {
  const { data, error } = await getClient()
    .from('vendedor_skus')
    .select('id, sku_vendedor, variante_id, stock_disponible, stock_reservado, estado')
    .eq('cuenta_comercial_id', cuentaComercialId)
    .eq('activo', true);
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida: SkuDelVendedor[] = [];
  for (const s of data) {
    if (!esObjDespensa(s) || typeof s.id !== 'string') return falloDespensa('datos_inconsistentes');
    salida.push({
      sku_id: s.id,
      sku_vendedor: typeof s.sku_vendedor === 'string' ? s.sku_vendedor : '',
      variante_id: typeof s.variante_id === 'string' ? s.variante_id : '',
      stock_disponible: typeof s.stock_disponible === 'number' ? s.stock_disponible : 0,
      stock_reservado: typeof s.stock_reservado === 'number' ? s.stock_reservado : 0,
      estado: typeof s.estado === 'string' ? s.estado : '',
    });
  }
  return { ok: true, data: salida };
}

// 🔴 EL AJUSTE DE STOCK NO SE CONSTRUYÓ, Y ESTE HUECO ES DELIBERADO.
//
// D-755 pide "ajuste de stock" y la LECTURA está arriba (`listarSkusDelVendedor`).
// La ESCRITURA no, y por una razón que se prefiere declarada antes que
// resuelta a la mala: **`inventario_movimientos` no tiene función de puerta en
// el motor.** S95-D construyó solo los caminos que el pedido recorre —reserva,
// consumo, liberación— y el ajuste manual del vendedor no es uno de ellos.
//
// LAS DOS SALIDAS QUE SE DESCARTARON, con su porqué:
//
//  ✗ INSERT directo a `inventario_movimientos` desde acá. Es lo más corto y
//    la policy de la M3 lo permitiría (ya exige `es_vendedor_de`). **Rompe la
//    puerta única**, y no es formalismo: un ajuste de inventario que solo
//    existe adentro de una pantalla es un ajuste que ninguna automatización
//    futura —una importación de un ERP, una corrección masiva, un cron de
//    conciliación— va a poder ejecutar. *Además el inventario es plata: la
//    autorización y el motivo obligatorio pertenecen al servidor, no a un
//    `if` del cliente que alguien puede saltear con la anon key.*
//
//  ✗ Escribir `vendedor_skus.stock_disponible`. Peor todavía: esa columna la
//    materializa un trigger desde el ledger. Escribirla a mano descuadraría el
//    saldo contra su propia historia y nadie podría explicar la diferencia
//    tres meses después.
//
// LO QUE FALTA, para que se firme y se construya en una tanda que tenga
// `supabase/migrations` en su territorio: `ajustar_stock_vendedor(p_sku_id,
// p_cantidad, p_motivo)` — DEFINER, gate `es_vendedor_de()` en el cuerpo,
// motivo obligatorio, e INSERT en el ledger dejando que el trigger materialice.
// Cuando exista, este archivo la llama y su firma pública no cambia.
