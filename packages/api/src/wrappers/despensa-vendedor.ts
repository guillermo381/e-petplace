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

/**
 * Botón 3 · DESPACHADO — S96: **el despacho ASIGNA al repartidor** (decisión
 * founder ① del arranque). Con un solo repartidor activo la pantalla lo
 * preselecciona; con varios, el vendedor elige. El motor congela el snapshot
 * del destino en el envío, genera el código que la familia dice en la puerta
 * y mueve `documentado → en_reparto` — el aviso «en ruta» sale solo.
 *
 * El mismo botón sirve para el REINTENTO tras una entrega fallida: reusa el
 * envío y CONSERVA el código que la familia ya tiene.
 *
 * ☠️ La versión vieja (`marcarPedidoDespachado` → `esperando_courier`) murió
 * con el estado: `esperando_courier` describía el tramo de un courier tercero
 * y quedó apagado en S96-M1 (el courier es v2, modelado y apagado).
 */
export async function despacharPedido(
  pedidoId: string,
  repartidorId: string,
): Promise<
  ResultadoWrapper<
    { envio_id: string; codigo_verificacion: string; reintento: boolean },
    CodigoErrorDespensa
  >
> {
  const { data, error } = await getClient().rpc('despachar_pedido', {
    p_pedido_id: pedidoId,
    p_repartidor_id: repartidorId,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true || typeof data.envio_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      envio_id: data.envio_id,
      codigo_verificacion:
        typeof data.codigo_verificacion === 'string' ? data.codigo_verificacion : '',
      reintento: data.reintento === true,
    },
  };
}

/** El cuarto escalón del RETIRO: en el mostrador, contra el código del
 *  cliente, sin foto (la persona está presente — no hay puerta que
 *  fotografiar). Para el despacho, el cuarto escalón es del repartidor
 *  (`despensa-repartidor.ts`). */
export async function entregarRetiroEnMostrador(
  pedidoId: string,
  codigo: string,
): Promise<ResultadoWrapper<{ eventos_expediente: number }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('entregar_pedido', {
    p_pedido_id: pedidoId,
    p_codigo: codigo.trim(),
    p_foto_path: undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return {
    ok: true,
    data: {
      eventos_expediente:
        typeof data.eventos_expediente === 'number' ? data.eventos_expediente : 0,
    },
  };
}

// ── EL EQUIPO DE REPARTO ────────────────────────────────────────────────────

export interface Repartidor {
  repartidor_id: string;
  nombre: string;
  documento: string;
  telefono: string | null;
  /** null = todavía no tiene cuenta: el vendedor opera por él y el cuarto
   *  escalón lo marca desde su propio teléfono. */
  user_id: string | null;
  activo: boolean;
}

export async function listarRepartidores(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<Repartidor[], CodigoErrorDespensa>> {
  const { data, error } = await getClient()
    .from('repartidores')
    .select('id, nombre, documento, telefono, user_id, activo')
    .eq('cuenta_comercial_id', cuentaComercialId)
    .order('nombre');
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida: Repartidor[] = [];
  for (const r of data) {
    if (!esObjDespensa(r) || typeof r.id !== 'string') return falloDespensa('datos_inconsistentes');
    salida.push({
      repartidor_id: r.id,
      nombre: typeof r.nombre === 'string' ? r.nombre : '',
      documento: typeof r.documento === 'string' ? r.documento : '',
      telefono: typeof r.telefono === 'string' ? r.telefono : null,
      user_id: typeof r.user_id === 'string' ? r.user_id : null,
      activo: r.activo === true,
    });
  }
  return { ok: true, data: salida };
}

/** Idempotente por (cuenta, documento): registrar dos veces devuelve el
 *  mismo repartidor con `ya_existia`. */
export async function registrarRepartidor(input: {
  cuenta_comercial_id: string;
  nombre: string;
  documento: string;
  telefono?: string;
  user_id?: string;
}): Promise<ResultadoWrapper<{ repartidor_id: string; ya_existia: boolean }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('registrar_repartidor', {
    p_cuenta_comercial_id: input.cuenta_comercial_id,
    p_nombre: input.nombre,
    p_documento: input.documento,
    p_telefono: input.telefono ?? undefined,
    p_user_id: input.user_id ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true || typeof data.repartidor_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: { repartidor_id: data.repartidor_id, ya_existia: data.ya_existia === true },
  };
}

export async function actualizarRepartidor(input: {
  repartidor_id: string;
  activo?: boolean;
  nombre?: string;
  telefono?: string;
  user_id?: string;
}): Promise<ResultadoWrapper<{ repartidor_id: string }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('actualizar_repartidor', {
    p_repartidor_id: input.repartidor_id,
    p_activo: input.activo ?? undefined,
    p_nombre: input.nombre ?? undefined,
    p_telefono: input.telefono ?? undefined,
    p_user_id: input.user_id ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { repartidor_id: input.repartidor_id } };
}

// ── EL CUPO Y LOS TURNOS (S96-M3) ───────────────────────────────────────────

/** La capacidad es DEL RECURSO, no de la casa: la moto lleva 20; el día del
 *  carro de 40 se edita la capacidad y nada más cambia. Upsert por nombre. */
export async function definirRecursoReparto(input: {
  cuenta_comercial_id: string;
  nombre: string;
  capacidad_por_dia: number;
  /** Convención de la casa (regla 32): 0=Domingo … 6=Sábado. */
  dias_operacion?: number[];
  activo?: boolean;
}): Promise<ResultadoWrapper<{ recurso_id: string }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('definir_recurso_reparto', {
    p_cuenta_comercial_id: input.cuenta_comercial_id,
    p_nombre: input.nombre,
    p_capacidad_por_dia: input.capacidad_por_dia,
    p_dias_operacion: input.dias_operacion ?? undefined,
    p_activo: input.activo ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true || typeof data.recurso_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return { ok: true, data: { recurso_id: data.recurso_id } };
}

/** "El segundo repartidor no puede venir el domingo": la excepción GANA al
 *  patrón semanal, en las dos direcciones. El sistema deja de prometer como
 *  si estuviera (L-139). */
export async function declararExcepcionRecurso(input: {
  recurso_id: string;
  fecha: string; // yyyy-mm-dd
  disponible: boolean;
  motivo?: string;
}): Promise<ResultadoWrapper<{ ok: true }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('declarar_excepcion_recurso', {
    p_recurso_id: input.recurso_id,
    p_fecha: input.fecha,
    p_disponible: input.disponible,
    p_motivo: input.motivo ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { ok: true } };
}

/** Los cortes como DATO: el founder cambia el corte sin que nadie toque una
 *  línea (LETRA_PANEL §7.1). Upsert por código. */
export async function definirTurnoEntrega(input: {
  cuenta_comercial_id: string;
  codigo: string;
  corte: string;          // 'HH:MM'
  entrega_desde: string;  // 'HH:MM'
  entrega_hasta: string;  // 'HH:MM'
  dia_offset?: 0 | 1;
  orden?: number;
}): Promise<ResultadoWrapper<{ turno_id: string }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('definir_turno_entrega', {
    p_cuenta_comercial_id: input.cuenta_comercial_id,
    p_codigo: input.codigo,
    p_corte: input.corte,
    p_entrega_desde: input.entrega_desde,
    p_entrega_hasta: input.entrega_hasta,
    p_dia_offset: input.dia_offset ?? undefined,
    p_orden: input.orden ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true || typeof data.turno_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return { ok: true, data: { turno_id: data.turno_id } };
}

/** La cifra honesta del techo del día: cuántos van sobre cuántos caben
 *  (LETRA_PANEL §2.1). */
export async function cupoRepartoDelDia(
  cuentaComercialId: string,
  fecha: string, // yyyy-mm-dd
): Promise<
  ResultadoWrapper<{ capacidad: number; consumido: number; disponible: number }, CodigoErrorDespensa>
> {
  const { data, error } = await getClient().rpc('cupo_reparto_del_dia', {
    p_cuenta_comercial_id: cuentaComercialId,
    p_fecha: fecha,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data)) return falloDespensa('datos_inconsistentes');
  const n = (v: unknown): number => (typeof v === 'number' ? v : 0);
  return {
    ok: true,
    data: { capacidad: n(data.capacidad), consumido: n(data.consumido), disponible: n(data.disponible) },
  };
}

// ── LA VENTA DE MOSTRADOR (S96-M6) ──────────────────────────────────────────

/**
 * 🔴 EL VENDEDOR JAMÁS ELIGE LA MASCOTA (LETRA_RECORRIDO §4). La venta se
 * registra CONTRA NADIE, descuenta el inventario por el ledger, y devuelve el
 * código que va en la factura — la factura es la invitación. En este archivo
 * no hay ninguna búsqueda de personas, y no puede haberla: la pantalla no
 * existe. El reclamo es del cliente (`despensa-pedido.ts`).
 */
export async function registrarVentaMostrador(input: {
  cuenta_comercial_id: string;
  items: { sku_id: string; cantidad: number; lote?: string; fecha_vencimiento?: string }[];
}): Promise<
  ResultadoWrapper<
    { venta_id: string; codigo_reclamo: string; total: number; expira_en: string },
    CodigoErrorDespensa
  >
> {
  if (input.items.length === 0) return falloDespensaCodigo('venta_sin_items');
  const { data, error } = await getClient().rpc('registrar_venta_mostrador', {
    p_cuenta_comercial_id: input.cuenta_comercial_id,
    p_items: input.items.map((i) => ({
      sku_id: i.sku_id,
      cantidad: i.cantidad,
      lote: i.lote ?? null,
      fecha_vencimiento: i.fecha_vencimiento ?? null,
    })),
  });
  if (error) return falloDespensa(error.message);
  if (
    !esObjDespensa(data) ||
    data.ok !== true ||
    typeof data.venta_id !== 'string' ||
    typeof data.codigo_reclamo !== 'string'
  ) {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      venta_id: data.venta_id,
      codigo_reclamo: data.codigo_reclamo,
      total: typeof data.total === 'number' ? data.total : 0,
      expira_en: typeof data.expira_en === 'string' ? data.expira_en : '',
    },
  };
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

/**
 * EL AJUSTE DE STOCK — la puerta que este archivo declaraba como hueco existe
 * desde S95-G2 (`ajustar_stock_vendedor`: DEFINER, gate `es_vendedor_de` en
 * el cuerpo, MOTIVO OBLIGATORIO, escribe el ledger y el trigger materializa).
 * El comentario que pedía construirla quedó viejo el mismo día que se
 * escribió — S96 lo cobra: este wrapper la llama.
 *
 * 🔴 El motivo es obligatorio Y VIVE EN EL SERVIDOR: el inventario es plata,
 * y un ajuste sin motivo es un descuadre que nadie explica en tres meses.
 */
export async function ajustarStockVendedor(
  skuId: string,
  cantidad: number,
  motivo: string,
): Promise<ResultadoWrapper<{ stock_disponible: number }, CodigoErrorDespensa>> {
  if (motivo.trim().length === 0) return falloDespensaCodigo('motivo_requerido');
  const { data, error } = await getClient().rpc('ajustar_stock_vendedor', {
    p_sku_id: skuId,
    p_cantidad: cantidad,
    p_motivo: motivo.trim(),
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return {
    ok: true,
    data: {
      stock_disponible: typeof data.stock_disponible === 'number' ? data.stock_disponible : 0,
    },
  };
}
