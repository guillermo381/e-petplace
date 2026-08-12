// SEGUIR EL PEDIDO — la lista, el detalle y el envío
// (S95-E · Bloque 5 · MODELO_DESPENSA v2.0 §8).
//
// 🔴 LOS SIETE ESTADOS, Y SOLO LOS SIETE. El motor mueve 29 estados internos;
// la familia ve SIETE narrativas. El mapeo **no se escribe acá**: vive en
// `cat_estados_pedido.narrativa`, que es DATO, y estos lectores consumen
// `v_pedidos_narrativa`, que resuelve el JOIN y **no expone ni una columna de
// estado crudo** (medido: sus 15 columnas de salida, no el texto de su
// definición — el invariante 16 del juez salió rojo por la razón equivocada
// una vez y se corrigió el instrumento).
//
// Los cuatro internos que jamás salen y su porqué están escritos al pie de
// `_despensa-comun.ts`, al lado del mecanismo que los tapa. El más importante:
// **`revision_riesgo` no sale porque decirle a alguien que está bajo sospecha
// de fraude es maltrato.**

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import {
  falloDespensa,
  esObjDespensa,
  esNarrativa,
  type CodigoErrorDespensa,
  type NarrativaPedido,
} from './_despensa-comun';

export interface PedidoEnLista {
  pedido_id: string;
  numero_orden: string;
  total: number;
  moneda: string;
  metodo_entrega: string | null;
  /** UNA de las siete. Nunca un estado interno. */
  narrativa: NarrativaPedido;
  /** La voz de la familia, del catálogo — no de un `switch` en la pantalla. */
  narrativa_nombre: string;
  narrativa_orden: number;
  es_terminal: boolean;
  /** 🔴 LA PROMESA SE LEE DE LO GUARDADO, JAMÁS SE CALCULA ACÁ. Si el pedido
   *  no la tiene guardada, esto es `null` y la superficie dice que no hay
   *  fecha — L-139 prohíbe el dato verosímil-falso, y una fecha de entrega
   *  inventada es el verosímil-falso más caro que existe en comercio. */
  promesa_desde: string | null;
  promesa_hasta: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface LineaDePedido {
  item_id: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  impuesto_monto: number;
  /** El lote, si ya se empacó. Es lo que convierte un retiro de fabricante
   *  en un aviso a las familias correctas. */
  lote: string | null;
  fecha_vencimiento: string | null;
}

export interface SeguimientoEnvio {
  envio_id: string;
  /** Los nombres salen MEDIDOS de la tabla, no supuestos: `transportista` y
   *  `tracking_code` (la primera versión de este archivo decía
   *  `transportista_codigo` y `guia`, y el gate E2E lo cazó). */
  transportista: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  /** 🔴 QUIÉN PAGÓ EL ENVÍO, en la fila del envío. Es la contrapartida de
   *  `parametros.pagado_por` de la regla: «gratis» no es «nadie paga», y el
   *  día que e-PetPlace subsidie uno, la diferencia tiene que ser legible en
   *  la liquidación. */
  pagado_por: string | null;
  /** Los eventos del courier, del más nuevo al más viejo. */
  eventos: { ocurrido_en: string; descripcion: string | null }[];
}

export interface DetallePedido {
  pedido: PedidoEnLista;
  items: LineaDePedido[];
  /** Congelados en la fila del pedido — snapshot, jamás FK viva (D-339). */
  entrega: {
    nombre_receptor: string | null;
    telefono: string | null;
    direccion: string | null;
    ciudad: string | null;
    sector: string | null;
    referencias: string | null;
  };
  subtotal: number;
  impuesto_total: number;
  costo_envio: number;
  descuento_monto: number;
  /** null = todavía no hay envío creado. Vacío honesto. */
  envio: SeguimientoEnvio | null;
}

function mapearPedido(f: unknown): PedidoEnLista | null {
  if (!esObjDespensa(f) || typeof f.pedido_id !== 'string') return null;
  if (!esNarrativa(f.narrativa)) return null;
  return {
    pedido_id: f.pedido_id,
    numero_orden: typeof f.numero_orden === 'string' ? f.numero_orden : '',
    total: typeof f.total === 'number' ? f.total : 0,
    moneda: typeof f.moneda === 'string' ? f.moneda : 'USD',
    metodo_entrega: typeof f.metodo_entrega === 'string' ? f.metodo_entrega : null,
    narrativa: f.narrativa,
    narrativa_nombre: typeof f.narrativa_nombre === 'string' ? f.narrativa_nombre : '',
    narrativa_orden: typeof f.narrativa_orden === 'number' ? f.narrativa_orden : 0,
    es_terminal: f.es_terminal === true,
    promesa_desde: typeof f.promesa_entrega_desde === 'string' ? f.promesa_entrega_desde : null,
    promesa_hasta: typeof f.promesa_entrega_hasta === 'string' ? f.promesa_entrega_hasta : null,
    creado_en: typeof f.created_at === 'string' ? f.created_at : '',
    actualizado_en: typeof f.updated_at === 'string' ? f.updated_at : '',
  };
}

/**
 * Mis pedidos. La RLS de `pedidos` (`user_id = auth.uid() OR
 * es_vendedor_de(...) OR is_admin()`) es la que decide qué se ve — este
 * wrapper no filtra por dueño, porque un filtro en el cliente sobre datos que
 * el server ya entregó no protege nada.
 */
export async function listarMisPedidos(
  limite = 30,
): Promise<ResultadoWrapper<PedidoEnLista[], CodigoErrorDespensa>> {
  const { data, error } = await getClient()
    .from('v_pedidos_narrativa')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida: PedidoEnLista[] = [];
  for (const f of data) {
    const p = mapearPedido(f);
    // 🔴 Una fila cuya narrativa no es una de las siete es un estado interno
    // filtrándose. No se ignora la fila (eso escondería la fuga): se rechaza
    // la respuesta entera y el juez tiene un invariante para lo mismo.
    if (p === null) return falloDespensa('datos_inconsistentes');
    salida.push(p);
  }
  return { ok: true, data: salida };
}

export async function obtenerDetallePedido(
  pedidoId: string,
): Promise<ResultadoWrapper<DetallePedido, CodigoErrorDespensa>> {
  const cliente = getClient();
  const [vista, cab, items, env] = await Promise.all([
    cliente.from('v_pedidos_narrativa').select('*').eq('pedido_id', pedidoId).maybeSingle(),
    cliente
      .from('pedidos')
      .select('subtotal, impuesto_total, costo_envio, descuento_monto, entrega_nombre_receptor, entrega_telefono, entrega_direccion, entrega_ciudad, entrega_sector, entrega_referencias')
      .eq('id', pedidoId)
      .maybeSingle(),
    cliente
      .from('pedido_items')
      .select('id, nombre_producto, cantidad, precio_unitario, subtotal, impuesto_monto, lote, fecha_vencimiento')
      .eq('pedido_id', pedidoId),
    cliente
      .from('envios')
      .select('id, transportista, tracking_code, tracking_url, pagado_por, envio_eventos(ocurrido_en, descripcion)')
      .eq('pedido_id', pedidoId)
      .maybeSingle(),
  ]);

  if (vista.error) return falloDespensa(vista.error.message);
  if (cab.error) return falloDespensa(cab.error.message);
  if (items.error) return falloDespensa(items.error.message);
  if (env.error) return falloDespensa(env.error.message);
  if (vista.data === null || cab.data === null) return falloDespensa('pedido_no_existe');

  const pedido = mapearPedido(vista.data);
  if (pedido === null) return falloDespensa('datos_inconsistentes');

  const lineas: LineaDePedido[] = [];
  for (const i of items.data ?? []) {
    if (!esObjDespensa(i) || typeof i.id !== 'string') return falloDespensa('datos_inconsistentes');
    lineas.push({
      item_id: i.id,
      nombre_producto: typeof i.nombre_producto === 'string' ? i.nombre_producto : '',
      cantidad: typeof i.cantidad === 'number' ? i.cantidad : 0,
      precio_unitario: typeof i.precio_unitario === 'number' ? i.precio_unitario : 0,
      subtotal: typeof i.subtotal === 'number' ? i.subtotal : 0,
      impuesto_monto: typeof i.impuesto_monto === 'number' ? i.impuesto_monto : 0,
      lote: typeof i.lote === 'string' ? i.lote : null,
      fecha_vencimiento: typeof i.fecha_vencimiento === 'string' ? i.fecha_vencimiento : null,
    });
  }

  let envio: SeguimientoEnvio | null = null;
  if (esObjDespensa(env.data) && typeof env.data.id === 'string') {
    const evs = Array.isArray(env.data.envio_eventos) ? env.data.envio_eventos : [];
    envio = {
      envio_id: env.data.id,
      transportista: typeof env.data.transportista === 'string' ? env.data.transportista : null,
      tracking_code: typeof env.data.tracking_code === 'string' ? env.data.tracking_code : null,
      tracking_url: typeof env.data.tracking_url === 'string' ? env.data.tracking_url : null,
      pagado_por: typeof env.data.pagado_por === 'string' ? env.data.pagado_por : null,
      eventos: evs
        .filter((e): e is { ocurrido_en: string; descripcion: string | null } =>
          esObjDespensa(e) && typeof e.ocurrido_en === 'string',
        )
        .map((e) => ({ ocurrido_en: e.ocurrido_en, descripcion: e.descripcion ?? null }))
        .sort((a, b) => (a.ocurrido_en < b.ocurrido_en ? 1 : -1)),
    };
  }

  const c = cab.data;
  const n = (v: unknown): number => (typeof v === 'number' ? v : 0);
  const s = (v: unknown): string | null => (typeof v === 'string' ? v : null);
  return {
    ok: true,
    data: {
      pedido,
      items: lineas,
      entrega: {
        nombre_receptor: s(c.entrega_nombre_receptor),
        telefono: s(c.entrega_telefono),
        direccion: s(c.entrega_direccion),
        ciudad: s(c.entrega_ciudad),
        sector: s(c.entrega_sector),
        referencias: s(c.entrega_referencias),
      },
      // Transportados del motor, no sumados acá.
      subtotal: n(c.subtotal),
      impuesto_total: n(c.impuesto_total),
      costo_envio: n(c.costo_envio),
      descuento_monto: n(c.descuento_monto),
      envio,
    },
  };
}
