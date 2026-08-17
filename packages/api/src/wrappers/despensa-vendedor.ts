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
import type { Json } from '../database.types';
import type { ResultadoWrapper } from '../resultado';
import {
  falloDespensa,
  falloDespensaCodigo,
  esObjDespensa,
  esNarrativa,
  type CodigoErrorDespensa,
  type NarrativaPedido,
} from './_despensa-comun';
// S99-L5b (N18, una fuente): el guard de composición y la regla de portada
// son LOS DEL CLIENTE — importados, jamás re-derivados.
import { composicionEstado, fotosDeProducto, type ComposicionEstado } from './despensa-catalogo';

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
  /** S99-A · L3 — la hora de CONFIRMACIÓN DEL PAGO (el `cerrado_en` del
   *  intento aprobado, `pagos_intentos` — la fuente MEDIDA; jamás
   *  `pedidos.pagado_en`, heredada y 0/14). ES la llave del FIFO firmado
   *  en el Gate 1: sin pago confirmado, el pedido no entra a la cola.
   *  null = todavía no se confirmó ningún pago. */
  pago_confirmado_en: string | null;
  /** S99-L3 · «Poner primero» (diseño de C ratificado por mesa): marca
   *  manual del panel. null = orden natural. La regla de orden DENTRO de
   *  la banda: movidos primero (marca DESC), después FIFO por
   *  `pago_confirmado_en`. NO cruza bandas — ordena, jamás re-promete.
   *  El pedido movido LO DICE en la pieza («Movido a mano» + «Volver al
   *  orden»). ⚠️ L-247: quien lea este campo degrada por su cuenta. */
  movido_al_frente_en: string | null;
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
    .select('pedido_id, numero_orden, total, moneda, narrativa, narrativa_nombre, es_terminal, promesa_entrega_desde, promesa_entrega_hasta, created_at, pago_confirmado_en, movido_al_frente_en')
    .eq('cuenta_comercial_id', cuentaComercialId)
    // ⚠️ Este order es el FETCH («por llegada» — así se NOMBRA en pantalla
    // mientras el panel no ordene por pago); las bandas y el FIFO firmado
    // son de la PIEZA, sobre pago_confirmado_en + movido_al_frente_en.
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
      pago_confirmado_en:
        typeof f.pago_confirmado_en === 'string' ? f.pago_confirmado_en : null,
      movido_al_frente_en:
        typeof f.movido_al_frente_en === 'string' ? f.movido_al_frente_en : null,
    });
  }
  return { ok: true, data: salida };
}

export interface PedidoDelVendedorConDia extends PedidoDelVendedor {
  /** El día del pedido = `entrega_fecha_objetivo` ('yyyy-mm-dd'), LA MISMA
   *  columna que consume `cupo_reparto_del_dia` — una sola verdad del día.
   *  `null` = pedido sin día prometido todavía. */
  dia: string | null;
}

/** S99-L4 · Los pedidos de MI cuenta POR VENTANA DE FECHAS — el espejo de
 *  `obtenerCitas*DelDia({fecha, fecha_hasta})` para el dual del HOY.
 *
 *  Filtra EN EL SERVIDOR por `entrega_fecha_objetivo` (jamás en memoria por
 *  date-part de la promesa: la promesa es la VENTANA horaria; el día es la
 *  columna que el cupo ya usa). Sin techo por cantidad dentro del rango — un
 *  `limit` por cantidad hace que un día lleno se lea como día vacío.
 *
 *  🔴 LO SIN FECHA PRESIDE, NO DESAPARECE (precedente D-439/S71: la cita
 *  aprobada sin fecha era invisible por un `.gte`). Un pedido VIVO sin
 *  `entrega_fecha_objetivo` no pertenece a ningún día — viaja SIEMPRE en
 *  `sinFecha`, en el mismo viaje. Los terminales sin fecha no viajan: son
 *  historia sin día y viven en el panel.
 *
 *  🔴 D-828 · SI ESTÁS MIGRANDO UNA SUPERFICIE DEL PRESENTE A ESTE LECTOR:
 *  declarás qué hacés con `sinFecha` ANTES de mergear — los montás
 *  PRESIDIENDO la ventana (adjudicación de mesa 15-ago: presidir es lo
 *  único que sobrevive al cambio de fecha; adentro del día parpadean con
 *  cada cruce del selector) o nombrás quién los monta. Nunca ninguna de las
 *  dos. La única exclusión legítima conocida es el HISTÓRICO (un vivo sin
 *  día no es pasado — y lo declara). */
export async function listarPedidosDelVendedorEnRango(
  cuentaComercialId: string,
  fechaDesde: string, // 'yyyy-mm-dd'
  fechaHasta: string, // 'yyyy-mm-dd'
): Promise<
  ResultadoWrapper<
    { delRango: PedidoDelVendedorConDia[]; sinFecha: PedidoDelVendedorConDia[] },
    CodigoErrorDespensa
  >
> {
  const esFecha = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (!esFecha(fechaDesde) || !esFecha(fechaHasta)) {
    return falloDespensa('datos_inconsistentes');
  }
  const { data, error } = await getClient()
    .from('v_pedidos_narrativa')
    .select(
      'pedido_id, numero_orden, total, moneda, narrativa, narrativa_nombre, es_terminal, promesa_entrega_desde, promesa_entrega_hasta, created_at, entrega_fecha_objetivo, pago_confirmado_en, movido_al_frente_en',
    )
    .eq('cuenta_comercial_id', cuentaComercialId)
    .or(
      `and(entrega_fecha_objetivo.gte.${fechaDesde},entrega_fecha_objetivo.lte.${fechaHasta}),and(entrega_fecha_objetivo.is.null,es_terminal.eq.false)`,
    )
    .order('entrega_fecha_objetivo', { ascending: true, nullsFirst: true })
    .order('promesa_entrega_desde', { ascending: true });

  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const delRango: PedidoDelVendedorConDia[] = [];
  const sinFecha: PedidoDelVendedorConDia[] = [];
  for (const f of data) {
    if (!esObjDespensa(f) || typeof f.pedido_id !== 'string' || !esNarrativa(f.narrativa)) {
      return falloDespensa('datos_inconsistentes');
    }
    const fila: PedidoDelVendedorConDia = {
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
      pago_confirmado_en:
        typeof f.pago_confirmado_en === 'string' ? f.pago_confirmado_en : null,
      movido_al_frente_en:
        typeof f.movido_al_frente_en === 'string' ? f.movido_al_frente_en : null,
      dia: typeof f.entrega_fecha_objetivo === 'string' ? f.entrega_fecha_objetivo : null,
    };
    (fila.dia === null ? sinFecha : delRango).push(fila);
  }
  return { ok: true, data: { delRango, sinFecha } };
}

// ── S99-L3 · EL REORDEN — las dos puertas de «Poner primero» ────────────────

/** «Poner primero» (diseño de C, ratificado por mesa sin enmienda): vive en
 *  el DETALLE del pedido, jamás como arrastre. El motor guarda la marca; la
 *  banda y el orden son de la pieza. Rebotes tipados: `pedido_no_existe` ·
 *  `no_sos_el_vendedor` · `pedido_terminal` (la ventana ni lo ofrece en
 *  terminales — AUSENTE, Ley 23; el rebote es el respaldo). */
export async function ponerPedidoPrimero(
  pedidoId: string,
): Promise<ResultadoWrapper<{ movido: true }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('poner_pedido_primero', {
    p_pedido_id: pedidoId,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { movido: true } };
}

/** «Volver al orden»: limpia la marca. Idempotente y siempre legal sobre lo
 *  propio (quitar una marca jamás miente) — por eso NO gatea terminal. */
export async function volverPedidoAlOrden(
  pedidoId: string,
): Promise<ResultadoWrapper<{ restaurado: true }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('volver_pedido_al_orden', {
    p_pedido_id: pedidoId,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { restaurado: true } };
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

/** Un vehículo del repartidor. **Hasta DOS** — el techo no lo vigila la
 *  pantalla: `UNIQUE(repartidor_id, orden)` con `orden ∈ {1,2}` lo vuelve
 *  inexpresable en la fuente. */
export interface VehiculoRepartidor {
  vehiculo_id: string;
  tipo: 'moto' | 'carro';
  /** Guardada en MAYÚSCULAS, con el guion tal como se tipeó: Ecuador tiene
   *  formatos vivos con y sin él, y deformar lo que la persona leyó de la
   *  placa la deja sin poder comparar. */
  placa: string;
}

export interface Repartidor {
  repartidor_id: string;
  nombre: string;
  documento: string;
  /** Código de `cat_tipos_documento_titular` (`CEDULA` · `RUC` · `PASAPORTE`).
   *  `null` en los repartidores anteriores a S98 — y eso no es un error de
   *  dato: es un dato que todavía nadie declaró. */
  tipo_documento: string | null;
  telefono: string | null;
  /** E.164 con `+`, la MISMA convención que `telefono` en esta tabla.
   *  🔴 D-823: en la casa hay 9 columnas que prohíben el `+` y 4 que lo
   *  exigen — **la convención es POR TABLA**, y `repartidores` está del lado
   *  que lo exige. La superficie compone el E.164 con su selector de país;
   *  el motor **valida y rebota, jamás deduce el país** (P21). */
  whatsapp: string | null;
  /** S99 (pedido de C, mesa 17-ago): el correo del vínculo — SIN él la
   *  pantalla de edición no puede pre-llenar, y como `actualizar_repartidor`
   *  pisa lo que recibe, mandar vacío lo BORRARÍA: el lector que no trae el
   *  campo convierte la edición en un borrado silencioso. null honesto =
   *  registrado sin correo (los anteriores a S98). */
  correo: string | null;
  /** S99/D-837 (dictado founder ③): LA CAPACIDAD ES DEL REPARTIDOR —
   *  «Moto Demo, 20 por día» es de UNA persona, no un recurso suelto.
   *  null = todavía sin capacidad declarada (el suelto legacy de la
   *  cuenta, si existe, lo ADOPTA `configurarCapacidadRepartidor` al
   *  primer uso — jamás se duplica). El cupo del día sigue sumando por
   *  cuenta en el motor: esto es la cara por-persona del MISMO dato. */
  capacidad: { recurso_id: string; capacidad_por_dia: number; dias_operacion: number[] } | null;
  /** PATH del bucket privado `cuenta-documentos`, **jamás URL**: una URL
   *  firmada guardada vence y la foto se pierde sin error (S47). */
  documento_foto_path: string | null;
  foto_path: string | null;
  /** null = todavía no tiene cuenta: el vendedor opera por él y el cuarto
   *  escalón lo marca desde su propio teléfono. */
  user_id: string | null;
  activo: boolean;
  vehiculos: VehiculoRepartidor[];
}

export async function listarRepartidores(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<Repartidor[], CodigoErrorDespensa>> {
  /* Los vehículos viajan EN LA MISMA consulta por embed. El repartidor sin su
     vehículo no sirve para el trabajo que la pantalla tiene que hacer —
     «¿en qué sale?» es parte de quién es—, y traerlos aparte serían N+1
     viajes para pintar una lista de tres filas. */
  const { data, error } = await getClient()
    .from('repartidores')
    .select(
      'id, nombre, documento, tipo_documento, telefono, whatsapp, correo, ' +
        'documento_foto_path, foto_path, user_id, activo, ' +
        'repartidor_vehiculos(id, tipo, placa, orden), ' +
        'recursos_reparto(id, capacidad_por_dia, dias_operacion, activo)',
    )
    .eq('cuenta_comercial_id', cuentaComercialId)
    .order('nombre');
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida: Repartidor[] = [];
  for (const r of data) {
    if (!esObjDespensa(r) || typeof r.id !== 'string') return falloDespensa('datos_inconsistentes');

    /* Angostado verificando (regla 34): un vehículo con tipo fuera del
       vocabulario se DESCARTA en vez de viajar como string suelto. El CHECK
       de la fuente ya lo impide, así que si aparece uno es que el CHECK
       cambió — y en ese caso la pantalla no debe pintarlo a ciegas. */
    const crudos = Array.isArray(r.repartidor_vehiculos) ? r.repartidor_vehiculos : [];
    /* `orden` se carga solo para ordenar y se descarta: es cómo la puerta
       administra el techo de 2, no algo que la pantalla deba conocer ni
       mucho menos mandar de vuelta. */
    const conOrden: (VehiculoRepartidor & { orden: number })[] = [];
    for (const v of crudos) {
      if (!esObjDespensa(v) || typeof v.id !== 'string') continue;
      if (v.tipo !== 'moto' && v.tipo !== 'carro') continue;
      conOrden.push({
        vehiculo_id: v.id,
        tipo: v.tipo,
        placa: typeof v.placa === 'string' ? v.placa : '',
        orden: typeof v.orden === 'number' ? v.orden : 0,
      });
    }
    /* Sin este orden el primero y el segundo se intercambian entre cargas
       y la lista «se mueve sola» a los ojos del vendedor. */
    conOrden.sort((a, b) => a.orden - b.orden);
    const vehiculos: VehiculoRepartidor[] = conOrden.map(({ orden: _orden, ...v }) => v);

    salida.push({
      repartidor_id: r.id,
      nombre: typeof r.nombre === 'string' ? r.nombre : '',
      documento: typeof r.documento === 'string' ? r.documento : '',
      tipo_documento: typeof r.tipo_documento === 'string' ? r.tipo_documento : null,
      telefono: typeof r.telefono === 'string' ? r.telefono : null,
      whatsapp: typeof r.whatsapp === 'string' ? r.whatsapp : null,
      correo: typeof r.correo === 'string' ? r.correo : null,
      capacidad: (() => {
        // El embed trae los recursos ATADOS a este repartidor (FK nueva);
        // el activo más reciente es SU capacidad. [] = sin declarar (L-247:
        // motor viejo sin la FK también cae acá — degrada, no rompe).
        const rec = (Array.isArray(r.recursos_reparto) ? r.recursos_reparto : [])
          .filter(esObjDespensa)
          .find((x) => x.activo === true);
        return rec !== undefined && typeof rec.id === 'string' && typeof rec.capacidad_por_dia === 'number'
          ? {
              recurso_id: rec.id,
              capacidad_por_dia: rec.capacidad_por_dia,
              dias_operacion: Array.isArray(rec.dias_operacion)
                ? rec.dias_operacion.filter((d): d is number => typeof d === 'number')
                : [],
            }
          : null;
      })(),
      documento_foto_path:
        typeof r.documento_foto_path === 'string' ? r.documento_foto_path : null,
      foto_path: typeof r.foto_path === 'string' ? r.foto_path : null,
      user_id: typeof r.user_id === 'string' ? r.user_id : null,
      activo: r.activo === true,
      vehiculos,
    });
  }
  return { ok: true, data: salida };
}

/** S99/D-837 · LA CAPACIDAD DEL REPARTIDOR — la puerta que implementa la
 *  firma S96 «el cupo no se rompe: se suma otro repartidor»: ① edita el
 *  recurso propio · ② si no tiene, ADOPTA el suelto único de la cuenta
 *  (jamás duplica capacidad) · ③ si no hay, crea el suyo (capacidad que
 *  SE SUMA, por acto del vendedor). Con esto «agregar recurso» muere como
 *  acción de pantalla: el recurso nace y vive con el repartidor. */
export async function configurarCapacidadRepartidor(input: {
  repartidor_id: string;
  capacidad_por_dia: number;
  /** 0=domingo…6=sábado. Omitido: conserva los días vigentes (o L-V+S al crear). */
  dias_operacion?: number[];
}): Promise<
  ResultadoWrapper<{ recurso_id: string; via: 'propio' | 'adoptado' | 'creado' }, CodigoErrorDespensa>
> {
  const { data, error } = await getClient().rpc('configurar_capacidad_repartidor', {
    p_repartidor_id: input.repartidor_id,
    p_capacidad_por_dia: input.capacidad_por_dia,
    p_dias_operacion: input.dias_operacion ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true || typeof data.recurso_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  const via = data.via === 'adoptado' || data.via === 'creado' ? data.via : 'propio';
  return { ok: true, data: { recurso_id: data.recurso_id, via } };
}

/** S99 (dictado founder ④) · «Atiendo en mi local» para VENTA DE PRODUCTOS
 *  — la perilla de la cuenta. Prendida, la baldosa de mostrador se compone
 *  en ATENDER; apagada, NO existe (jamás en gris). El contexto de arranque
 *  la lee FRESCA en el mismo viaje (`ventaMostradorActiva`). Para
 *  SERVICIOS el toggle es POR SERVICIO (`prestador_servicios.atiende_local`),
 *  nunca éste. */
export async function configurarVentaMostrador(
  cuentaComercialId: string,
  activa: boolean,
): Promise<ResultadoWrapper<{ ventaMostradorActiva: boolean }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('configurar_venta_mostrador', {
    p_cuenta_comercial_id: cuentaComercialId,
    p_activa: activa,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { ventaMostradorActiva: data.venta_mostrador_activa === true } };
}

/** S99 (pedido de C) · Los VIAJES por repartidor de una cuenta — el ⑤ de la
 *  ficha del repartidor. El HECHO, no el vocabulario: «entregó» =
 *  `entregado_en IS NOT NULL` (el vocabulario de estado puede crecer sin
 *  romper el conteo). Un repartidor sin envíos viene con ceros REALES del
 *  motor — jamás un cero fijo de la pantalla, que mentiría idéntico para
 *  quien nunca salió y para quien entregó cuarenta. */
export async function viajesPorRepartidor(
  cuentaComercialId: string,
): Promise<
  ResultadoWrapper<{ repartidor_id: string; entregados: number; en_curso: number }[], CodigoErrorDespensa>
> {
  const { data, error } = await getClient().rpc('viajes_por_repartidor', {
    p_cuenta_comercial_id: cuentaComercialId,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  // L-247: degradación propia — motor viejo sin la clave devuelve [].
  const filas = (Array.isArray(data.viajes) ? data.viajes : []).flatMap((v) => {
    const o = v as { repartidor_id?: unknown; entregados?: unknown; en_curso?: unknown };
    return typeof o.repartidor_id === 'string'
      ? [{
          repartidor_id: o.repartidor_id,
          entregados: typeof o.entregados === 'number' ? o.entregados : 0,
          en_curso: typeof o.en_curso === 'number' ? o.en_curso : 0,
        }]
      : [];
  });
  return { ok: true, data: filas };
}

/** S99-L5a · LA CARGA DETERMINISTA (el reencuadre de mesa: lo que hace que
 *  la vitrina exista más allá de seis). Cada fila entra por la MISMA puerta
 *  1 a 1 (`proponer_sku_vendedor` — M21 intacta: el canónico se RESUELVE,
 *  jamás se crea; el SKU nace `propuesto` y e-PetPlace publica).
 *
 *  POR-FILA, jamás todo-o-nada: una fila mala no mata 49 buenas — cada una
 *  responde con su índice, y **lo que no entra SE DICE** (el criterio de la
 *  mitad determinista). Techo 500 que rebota HABLANDO, jamás trunca.
 *  §14 de MODELO_DESPENSA no aplica acá: no hay IA — el parseo del archivo
 *  (CSV/XLSX → filas) es de la pantalla; este wrapper recibe filas ya
 *  estructuradas. */
export interface FilaLoteSku {
  producto: { familia_codigo: string; nombre: string; marca?: string | null };
  variante: { codigo: string };
  sku: {
    sku_vendedor: string;
    precio_propuesto?: number;
    country_code?: string;
    /** Solo se aplica al SKU NUEVO (entra por el ledger); el re-propose
     *  jamás toca stock — la diferencia va por `ajustarStockVendedor`. */
    stock_disponible?: number;
  };
}

export interface ResultadoFilaLote {
  indice: number;
  ok: boolean;
  /** El error del motor, con su causa (`campo_requerido: …` ·
   *  `producto_no_canonico: …` · `variante_no_canonica: …` ·
   *  `sku_vendedor_duplicado: …`). La pantalla lo muestra POR LÍNEA del
   *  archivo — lo que no entró se dice, jamás desaparece. */
  error?: string;
}

export async function proponerSkusVendedorLote(
  cuentaComercialId: string,
  filas: FilaLoteSku[],
): Promise<
  ResultadoWrapper<
    { propuestos: number; rechazados: number; resultados: ResultadoFilaLote[] },
    CodigoErrorDespensa
  >
> {
  const { data, error } = await getClient().rpc('proponer_skus_vendedor_lote', {
    p_cuenta_comercial_id: cuentaComercialId,
    p_filas: filas as unknown as Json,
    p_origen_carga: 'vendedor',
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  const resultados: ResultadoFilaLote[] = (Array.isArray(data.resultados) ? data.resultados : [])
    .flatMap((v) => {
      const o = v as { indice?: unknown; ok?: unknown; error?: unknown };
      return typeof o.indice === 'number'
        ? [{
            indice: o.indice,
            ok: o.ok === true,
            ...(typeof o.error === 'string' ? { error: o.error } : {}),
          }]
        : [];
    });
  return {
    ok: true,
    data: {
      propuestos: typeof data.propuestos === 'number' ? data.propuestos : 0,
      rechazados: typeof data.rechazados === 'number' ? data.rechazados : 0,
      resultados,
    },
  };
}

/** Registra un vehículo del repartidor. **Idempotente por (repartidor, placa)**:
 *  repetir la misma placa devuelve el mismo vehículo con `ya_existia` y **no
 *  consume el segundo hueco**.
 *
 *  El `orden` NO se pasa: lo asigna la puerta tomando el primer hueco libre.
 *  *Un parámetro de posición que el llamador administra es uno que va a
 *  administrar mal, y acá administrarlo mal se ve como «se me borró la moto».*
 *
 *  Rebota `vehiculo_tope_alcanzado` con dos ya registrados. */
export async function registrarVehiculoRepartidor(input: {
  repartidor_id: string;
  tipo: 'moto' | 'carro';
  placa: string;
}): Promise<ResultadoWrapper<{ vehiculo_id: string; ya_existia: boolean }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('registrar_vehiculo_repartidor', {
    p_repartidor_id: input.repartidor_id,
    p_tipo: input.tipo,
    p_placa: input.placa,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true || typeof data.vehiculo_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: { vehiculo_id: data.vehiculo_id, ya_existia: data.ya_existia === true },
  };
}

export async function eliminarVehiculoRepartidor(
  vehiculoId: string,
): Promise<ResultadoWrapper<{ ok: true }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('eliminar_vehiculo_repartidor', {
    p_vehiculo_id: vehiculoId,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { ok: true } };
}

/** Idempotente por (cuenta, documento): registrar dos veces devuelve el
 *  mismo repartidor con `ya_existia`. */
export async function registrarRepartidor(input: {
  cuenta_comercial_id: string;
  nombre: string;
  documento: string;
  telefono?: string;
  user_id?: string;
  /** Código de `cat_tipos_documento_titular`: `CEDULA` · `RUC` · `PASAPORTE`.
   *
   *  🔴 **Declararlo activa la validación del número contra la máscara del
   *  catálogo** (`CEDULA` ⇒ 10 dígitos · `RUC` ⇒ 13 · `PASAPORTE` ⇒ 6-12
   *  alfanuméricos). Un número que no cumple rebota
   *  `documento_no_coincide_con_tipo`. *El tipo dejó de ser una etiqueta:
   *  es una regla.* Omitirlo no valida nada — que es lo que mantiene legales
   *  a los repartidores anteriores a S98. */
  tipo_documento?: 'CEDULA' | 'RUC' | 'PASAPORTE';
  /** PATH del bucket privado `cuenta-documentos`, bajo `<cuenta_comercial_id>/`.
   *  **Jamás una URL firmada**: el motor la rebota por CHECK. */
  documento_foto_path?: string;
  foto_path?: string;
  /** **E.164 con `+`** — la pantalla lo compone con su selector de país.
   *  El motor **valida y rebota `whatsapp_invalido`; no normaliza**, porque
   *  normalizar exigiría DEDUCIR el país de un número sin prefijo y P21 lo
   *  prohíbe. *El que tiene el dato compone; el que no lo tiene valida.* */
  whatsapp?: string;
  /** S99 (adj. #2) · LA LLAVE DE RECLAMO: la persona crea su cuenta con este
   *  correo y ACEPTA el vínculo al primer ingreso — jamás una cuenta
   *  paralela, jamás auto-atado. Se normaliza a minúsculas en el motor.
   *  🔴 Hoy OPCIONAL en la puerta (compatible con el bundle vivo, D-662);
   *  la pantalla de L2 lo EXIGE, y recién con su OTA aplicado el motor
   *  enciende `correo_requerido` (orden S98: pantalla → merge → OTA → guard). */
  correo?: string;
}): Promise<
  ResultadoWrapper<
    { repartidor_id: string; ya_existia: boolean; pendienteDeReclamo: boolean },
    CodigoErrorDespensa
  >
> {
  const { data, error } = await getClient().rpc('registrar_repartidor', {
    p_cuenta_comercial_id: input.cuenta_comercial_id,
    p_nombre: input.nombre,
    p_documento: input.documento,
    p_telefono: input.telefono ?? undefined,
    p_user_id: input.user_id ?? undefined,
    p_tipo_documento: input.tipo_documento ?? undefined,
    p_documento_foto_path: input.documento_foto_path ?? undefined,
    p_foto_path: input.foto_path ?? undefined,
    p_whatsapp: input.whatsapp ?? undefined,
    p_correo: input.correo ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true || typeof data.repartidor_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      repartidor_id: data.repartidor_id,
      ya_existia: data.ya_existia === true,
      pendienteDeReclamo: data.pendiente_de_reclamo === true,
    },
  };
}

export async function actualizarRepartidor(input: {
  repartidor_id: string;
  activo?: boolean;
  nombre?: string;
  telefono?: string;
  user_id?: string;
  /** D-791 (S97): la IDENTIDAD también se corrige — un documento mal
   *  tipeado no queda mal para siempre. El motor rebota `documento_en_uso`
   *  si colisiona con otro repartidor de la misma casa: corregir jamás
   *  fusiona dos personas en silencio. */
  documento?: string;
  /** 🔴 En los CUATRO campos de identidad, **ausente = NO TOCA**, jamás
   *  «poné el default». Es el mismo contrato que la puerta de los cortes, y
   *  por el mismo modo de falla medido: *si un campo ausente vaciara, corregir
   *  el nombre le borraría la foto del documento al repartidor y nadie se
   *  enteraría hasta necesitarla.*
   *
   *  Cambiar SOLO el tipo valida contra el documento **ya guardado** — poner
   *  `CEDULA` sobre un número de 4 dígitos rebota, en vez de dejar una fila
   *  internamente falsa. */
  tipo_documento?: 'CEDULA' | 'RUC' | 'PASAPORTE';
  documento_foto_path?: string;
  foto_path?: string;
  /** E.164 con `+`. Rebota `whatsapp_invalido`; no normaliza (P21). */
  whatsapp?: string;
  /** S99 · la llave de reclamo se CORRIGE (ausente = no toca). Cambiarla con
   *  el vínculo ya aceptado no des-reclama: la llave ya hizo su trabajo. */
  correo?: string;
}): Promise<ResultadoWrapper<{ repartidor_id: string }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('actualizar_repartidor', {
    p_repartidor_id: input.repartidor_id,
    p_activo: input.activo ?? undefined,
    p_nombre: input.nombre ?? undefined,
    p_telefono: input.telefono ?? undefined,
    p_user_id: input.user_id ?? undefined,
    p_documento: input.documento ?? undefined,
    p_tipo_documento: input.tipo_documento ?? undefined,
    p_documento_foto_path: input.documento_foto_path ?? undefined,
    p_foto_path: input.foto_path ?? undefined,
    p_whatsapp: input.whatsapp ?? undefined,
    p_correo: input.correo ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { repartidor_id: input.repartidor_id } };
}

/** S99 (adj. #2) · EL ACTO DE UN TOQUE: la persona logueada reclama TODOS los
 *  vínculos de repartidor registrados con SU correo. Sin parámetros a
 *  propósito — el correo sale del profile de la sesión, así que nadie puede
 *  reclamar el vínculo de otro por construcción. Idempotente: sin pendientes
 *  devuelve `aceptados: 0` y NO es error (la pantalla decide la voz —
 *  «ya estabas vinculado» ≠ «nadie te registró»). */
export async function aceptarVinculoRepartidor(): Promise<
  ResultadoWrapper<{ aceptados: number; cuentas: string[] }, CodigoErrorDespensa>
> {
  const { data, error } = await getClient().rpc('aceptar_vinculo_repartidor');
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  const cuentas = Array.isArray(data.cuentas)
    ? data.cuentas.filter((c): c is string => typeof c === 'string')
    : [];
  return {
    ok: true,
    data: { aceptados: typeof data.aceptados === 'number' ? data.aceptados : 0, cuentas },
  };
}

/** S99 (adj. #2) · ¿Quién me registró como repartidor? El lector de la
 *  pantalla de aceptación del primer ingreso (C). Vacío = nadie, honesto. */
export async function misVinculosRepartidorPendientes(): Promise<
  ResultadoWrapper<
    { repartidor_id: string; negocio: string; nombre_registrado: string }[],
    CodigoErrorDespensa
  >
> {
  const { data, error } = await getClient().rpc('mis_vinculos_repartidor_pendientes');
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida: { repartidor_id: string; negocio: string; nombre_registrado: string }[] = [];
  for (const f of data) {
    if (!esObjDespensa(f) || typeof f.repartidor_id !== 'string') {
      return falloDespensa('datos_inconsistentes');
    }
    salida.push({
      repartidor_id: f.repartidor_id,
      negocio: typeof f.negocio === 'string' ? f.negocio : '',
      nombre_registrado: typeof f.nombre_registrado === 'string' ? f.nombre_registrado : '',
    });
  }
  return { ok: true, data: salida };
}

/** D-791 · el LECTOR del prefill de la regla de envío — `definir_regla_envio_vendedor`
 *  YA corrige por re-invocación (desactiva la activa e inserta: «redefinir no
 *  apila»); lo que faltaba era poder LEER la vigente para reabrirla en el
 *  mismo formulario. La RLS (`reglas_envio_select`, es_vendedor_de) decide
 *  qué filas existen para esta sesión. `null` = sin regla definida, honesto. */
export interface ReglaEnvioActiva {
  id: string;
  tipo: string;
  parametros: Record<string, unknown>;
  prioridad: number;
}

export async function obtenerReglaEnvioActiva(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<ReglaEnvioActiva | null, CodigoErrorDespensa>> {
  const { data, error } = await getClient()
    .from('reglas_envio')
    .select('id, tipo, parametros, prioridad')
    .eq('cuenta_comercial_id', cuentaComercialId)
    .eq('activo', true)
    .order('prioridad', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) return falloDespensa(error.message);
  if (data === null) return { ok: true, data: null };
  if (!esObjDespensa(data) || typeof data.id !== 'string' || typeof data.tipo !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      id: data.id,
      tipo: data.tipo,
      parametros: esObjDespensa(data.parametros) ? (data.parametros as Record<string, unknown>) : {},
      prioridad: typeof data.prioridad === 'number' ? data.prioridad : 100,
    },
  };
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
}): Promise<
  ResultadoWrapper<
    {
      recurso_id: string;
      /** D-791 · la ley del cambio: la puerta DICE si creó o corrigió. */
      accion: 'creado' | 'actualizado';
      /** Días (hoy..+13) donde lo YA prometido excede la capacidad nueva.
       *  Lo comprometido SE CUMPLE igual — esto avisa, no cancela. */
      diasSobrecomprometidos: Array<{ fecha: string; capacidad: number; comprometido: number }>;
      nota: string;
    },
    CodigoErrorDespensa
  >
> {
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
  const sobre: Array<{ fecha: string; capacidad: number; comprometido: number }> = [];
  if (Array.isArray(data.dias_sobrecomprometidos)) {
    for (const d of data.dias_sobrecomprometidos) {
      if (
        esObjDespensa(d) &&
        typeof d.fecha === 'string' &&
        typeof d.capacidad === 'number' &&
        typeof d.comprometido === 'number'
      ) {
        sobre.push({ fecha: d.fecha, capacidad: d.capacidad, comprometido: d.comprometido });
      }
    }
  }
  return {
    ok: true,
    data: {
      recurso_id: data.recurso_id,
      accion: data.accion === 'actualizado' ? 'actualizado' : 'creado',
      diasSobrecomprometidos: sobre,
      nota: typeof data.nota === 'string' ? data.nota : '',
    },
  };
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
  /** Días en que rige el corte. **0=domingo … 6=sábado** (la convención de la
   *  casa, medida contra `EXTRACT(DOW)`).
   *
   *  🔴 **OMITIRLO NO LOS APAGA: LOS DEJA COMO ESTÁN.** La puerta upsertea
   *  por `(cuenta, código)`, así que si esto viajara con un default, *cada
   *  corrección de HORA borraría el «sábados no» del vendedor sin que él se
   *  entere*. `undefined` ⇒ `NULL` ⇒ la RPC hace `COALESCE` contra la fila.
   *  **Al CREAR, ausente = L–D** (el default de la columna). */
  dias_semana?: number[];
  /** Mismo contrato: omitirlo NO lo apaga, lo conserva. Ausente al crear = `false`. */
  incluye_festivos?: boolean;
}): Promise<
  ResultadoWrapper<
    {
      turno_id: string;
      /** D-791 · la ley del cambio: la puerta DICE si creó o corrigió. */
      accion: 'creado' | 'actualizado';
      /** Pedidos vivos cuya promesa congelada nombra este turno — el cambio
       *  no los toca, y el número existe para DECIRLO en pantalla. */
      comprometidos: number;
      nota: string;
    },
    CodigoErrorDespensa
  >
> {
  const { data, error } = await getClient().rpc('definir_turno_entrega', {
    p_cuenta_comercial_id: input.cuenta_comercial_id,
    p_codigo: input.codigo,
    p_corte: input.corte,
    p_entrega_desde: input.entrega_desde,
    p_entrega_hasta: input.entrega_hasta,
    p_dia_offset: input.dia_offset ?? undefined,
    p_orden: input.orden ?? undefined,
    p_dias_semana: input.dias_semana ?? undefined,
    p_incluye_festivos: input.incluye_festivos ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true || typeof data.turno_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      turno_id: data.turno_id,
      accion: data.accion === 'actualizado' ? 'actualizado' : 'creado',
      comprometidos: typeof data.comprometidos === 'number' ? data.comprometidos : 0,
      nota: typeof data.nota === 'string' ? data.nota : '',
    },
  };
}

/** D-791 · el ESCRITOR de la regla de envío — la puerta existía en el motor
 *  desde S95-G2 y ningún wrapper la llamaba (motor sin puerta). Redefinir NO
 *  apila: el motor archiva la vigente y crea la nueva, y la respuesta DICE
 *  qué hizo y cuántos pedidos vivos conservan su cotización congelada. */
export async function definirReglaEnvioVendedor(input: {
  cuenta_comercial_id: string;
  /** Código de `cat_tipos_regla_envio` (vivos hoy: `flota_propia` ·
   *  `gratis_sobre_umbral` · `plana`). Un tipo apagado rebota hablado. */
  tipo: string;
  parametros: { [key: string]: Json | undefined };
  pagado_por?: 'vendedor' | 'cliente' | 'plataforma';
  ciudades_cubiertas?: string[];
  prioridad?: number;
}): Promise<
  ResultadoWrapper<
    {
      regla_id: string;
      accion: 'creada' | 'reemplazada';
      reglasArchivadas: number;
      /** Pedidos vivos con cotización congelada — la regla nueva no los alcanza. */
      comprometidos: number;
      nota: string;
    },
    CodigoErrorDespensa
  >
> {
  const { data, error } = await getClient().rpc('definir_regla_envio_vendedor', {
    p_cuenta_comercial_id: input.cuenta_comercial_id,
    p_tipo: input.tipo,
    p_parametros: input.parametros,
    p_pagado_por: input.pagado_por ?? undefined,
    p_ciudades_cubiertas: input.ciudades_cubiertas ?? undefined,
    p_prioridad: input.prioridad ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true || typeof data.regla_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      regla_id: data.regla_id,
      accion: data.accion === 'reemplazada' ? 'reemplazada' : 'creada',
      reglasArchivadas: typeof data.reglas_archivadas === 'number' ? data.reglas_archivadas : 0,
      comprometidos: typeof data.comprometidos === 'number' ? data.comprometidos : 0,
      nota: typeof data.nota === 'string' ? data.nota : '',
    },
  };
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
  /** S99-L5b (pedido de C, mesa 17-ago): LA PUERTA DE LA FICHA — desde
   *  «Administrar» el vendedor abre `obtenerFichaProducto(producto_id)`.
   *  Sin esto el espejo listaba sin poder entrar a ningún producto. */
  producto_id: string;
  /** El producto con nombre — hueco medido por la pista C (S96): una pantalla
   *  de stock o de mostrador que lista `sku_vendedor` pelado no le dice nada
   *  a quien atiende. El catálogo canónico es de lectura pública. */
  producto_nombre: string;
  producto_marca: string | null;
  presentacion: string;
  /** Materializado por trigger desde `inventario_movimientos`. El ledger es
   *  la verdad; esto es lectura rápida (patrón `mascota_perfil_vigente`). */
  stock_disponible: number;
  stock_reservado: number;
  estado: string;
  /** S99-L5b (voz del borde N17+N18): el PORQUÉ de un rechazo — el CHECK de
   *  la tabla garantiza que `rechazado` ⇒ motivo NOT NULL; en cualquier otro
   *  estado es null. *Un vendedor jamás cree que publicó algo que no
   *  publicó* — y tampoco adivina por qué se lo rebotaron.
   *  ⚖️ RECETA 7 (mesa 18-ago): la superficie lo muestra LITERAL —
   *  parafrasear un rechazo es reescribir lo que decidió otro y le saca al
   *  vendedor la única información con la que puede arreglarlo. Es el
   *  ÚNICO danger de la ficha. */
  motivo_rechazo: string | null;
  /** El precio de la oferta PUBLICADA de este SKU. `null` HONESTO = sin
   *  oferta publicada hoy — la pantalla lo dice, no se inventa un precio.
   *  Es lo que el mostrador cobra (S96, hueco declarado por C). */
  precio_publicado: number | null;
  /** S99-L5b: el estado de la oferta más avanzada de este SKU —
   *  `publicada` > cualquier otra (`borrador`/`pausada`/`retirada`) > null
   *  (ninguna oferta). El espejo lo DICE en las dos caras. */
  oferta_estado: string | null;
  /** ── Campos CANÓNICOS del producto (M21: los escribe e-PetPlace, el
   *  vendedor los VE) — viajan para que `razonesDeAlcance` derive de la
   *  MISMA fuente que el cliente, jamás de un cómputo paralelo. ── */
  /** Mismo vocabulario y mismo guard que el catálogo del cliente. `null` =
   *  valor desconocido en la base (no se inventa). */
  composicion_estado: ComposicionEstado | null;
  /** El eje etario de N20 — vacío = invisible al segundo toque. */
  momentos_aplicables: string[];
  /** La MISMA portada que dibuja la vitrina (`fotosDeProducto`). */
  foto_portada: string | null;
  /** El precio de referencia de e-PetPlace para esta presentación, y la banda
   *  en la que el vendedor se mueve SIN pedir permiso. **`null` en los tres
   *  ⟺ el equipo todavía no cargó la referencia** ⇒ fail-closed: todo cambio
   *  va a aprobación. **Y la superficie LO DICE** — *es la trampa exacta de
   *  `AvisoAlergia`: el silencio se lee como permiso.* */
  /** Las especies del producto. **Sin esto el filtro por especie de
   *  «Administrar» no se puede DIBUJAR** —la pantalla no sabe qué chips
   *  ofrecer— aunque el servidor ya sepa filtrar por él (pedido de C, S99). */
  especies_aplicables: string[];
  precio_referencia: number | null;
  banda_min: number | null;
  banda_max: number | null;
  /** 🔴 EL PRECIO QUE EL VENDEDOR PIDIÓ. Cuando el cambio cae fuera de banda
   *  —o no hay referencia— la puerta **guarda la propuesta** y rebota, para
   *  no perderle el trabajo. Sin este dato la pantalla vuelve a mostrar el
   *  precio viejo y **no queda rastro de que hay algo esperando**.
   *  Literal de C, que es el porqué: *«un cambio que se acepta y desaparece
   *  se lee como que se perdió, y la segunda vez el vendedor deja de pedir».* */
  precio_propuesto: number | null;
  /** ¿HAY ALGO ESPERANDO APROBACIÓN? **Lo emite el servidor**, mismo corte
   *  que las razones: es un HECHO, no una presentación. *Comparar en el
   *  cliente parece trivial hasta que dos superficies lo comparan distinto —
   *  una olvida el caso NULL y otra no— y el vendedor ve «pendiente» en una
   *  pantalla y nada en la otra.*
   *  **Se apaga cuando la propuesta ya coincide con lo publicado**: una marca
   *  que no se apaga al cumplirse deja de significar algo en dos días. */
  propuesta_pendiente: boolean;
  /** 🔴 LAS RAZONES POR LAS QUE NO ALCANZA TODO LO QUE PODRÍA — **las emite
   *  el SERVIDOR** (`v_skus_vendedor.razones`), no las deriva esta capa.
   *  Firma de C, ratificada por mesa: *filtrar por razón en SQL y derivarla
   *  en TS deja DOS implementaciones de la misma verdad, y van a divergir.*
   *  El corte: **el servidor decide QUÉ ES VERDAD; el cliente decide DE QUIÉN
   *  ES y CÓMO SE DICE** — el dueño de una razón es letra de producto y puede
   *  cambiar sin que cambie una columna; los códigos son lo contrario. */
  razones: string[];
}

export async function listarSkusDelVendedor(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<SkuDelVendedor[], CodigoErrorDespensa>> {
  // 🔴 DELEGA, NO REPITE (S99): antes armaba la lista por su cuenta desde la
  // tabla con embeds. Hoy hay UNA sola implementación —la paginada sobre
  // `v_skus_vendedor`— y ésta es su caso «todo de una».
  // *Dos lectores del mismo conjunto son dos órdenes, dos formas y dos
  // verdades de las razones; el espejo se rompe en el detalle más chico, que
  // es justo el que nadie va a ir a comparar.*
  // ⚠️ El techo de 1000 es HONESTO y declarado: hoy el máximo real es 722, y
  // quien necesite más ya tiene el lector paginado con su total.
  const r = await listarSkusDelVendedorPagina(cuentaComercialId, { limite: 1000 });
  return r.ok ? { ok: true, data: r.data.items } : r;
}

/**
 * EL VENDEDOR MUEVE EL PRECIO DE SU PROPIA MERCADERÍA — dentro de la banda.
 *
 * **Decisión de mesa (S99), delegada por el founder y reversible por su
 * palabra:** e-PetPlace fija una referencia por presentación; el vendedor se
 * mueve **libre dentro de ±15 %**; fuera, propone y e-PetPlace aprueba.
 * *La firma ⑩ de S95 protege la CURADURÍA —qué entra a la vitrina—, no el
 * precio de lo ya curado; pero un precio sin límite deja de proteger que la
 * familia no pague de más, y eso también es curaduría.*
 *
 * **El argumento que la funda: un vendedor que no puede BAJAR el precio de su
 * mercadería no puede liquidar lo que se le está por vencer.**
 *
 * Los dos rebotes hablan y son de la pantalla:
 * · `sin_referencia_de_precio` — el equipo no cargó la referencia; **la
 *   propuesta QUEDA GUARDADA** y el vendedor no pierde su trabajo.
 * · `fuera_de_banda` — **el mensaje trae la referencia y los dos extremos**:
 *   *un rechazo que no dice la banda obliga a adivinar por tanteo.*
 */
export async function actualizarPrecioOferta(
  ofertaId: string,
  precio: number,
): Promise<ResultadoWrapper<{ precio: number; referencia: number; banda_min: number; banda_max: number }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('actualizar_precio_oferta', {
    p_oferta_id: ofertaId,
    p_precio: precio,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  if (typeof data.precio !== 'number' || typeof data.referencia !== 'number') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      precio: data.precio,
      referencia: data.referencia,
      banda_min: typeof data.banda_min === 'number' ? data.banda_min : data.referencia,
      banda_max: typeof data.banda_max === 'number' ? data.banda_max : data.referencia,
    },
  };
}

// ── S99 · LA LISTA LARGA — paginación por cursor sobre `v_skus_vendedor` ────

export interface PaginaSkus {
  items: SkuDelVendedor[];
  /** CUÁNTOS HAY DE VERDAD bajo los mismos filtros. Sin esto, la superficie
   *  no puede decir «30 de 722» y una lista truncada se ve completa (L-268). */
  total: number;
  /** Cursor OPACO de la página siguiente (`nombre|id`). **`null` significa
   *  QUE NO HAY MÁS**, y eso es un dato positivo: la superficie lo DICE.
   *  ⚠️ *«El final se dice, si no el vendedor no distingue terminó de
   *  falló»* — y el otro lado de esa moneda ya lo da el tipo de retorno:
   *  **un fallo llega como `{ ok: false, codigo }`, jamás como una página
   *  vacía.** La superficie no puede colapsar los dos en «no hay más». */
  siguiente_cursor: string | null;
}

/** Los filtros del lado SERVIDOR, en UN solo lugar — el conteo y la página
 *  tienen que aplicar exactamente los mismos o el total miente sobre otro
 *  conjunto (la clase que L-268 cura). */
function aplicarFiltrosSku<T extends {
  eq: (c: string, v: string) => T;
  contains: (c: string, v: string[]) => T;
  or: (f: string) => T;
}>(q: T, o?: { estado?: string; especie?: string; texto?: string; razon?: string }): T {
  let r = q;
  if (o?.estado !== undefined) r = r.eq('estado', o.estado);
  if (o?.especie !== undefined) r = r.contains('especies_aplicables', [o.especie]);
  if (o?.razon !== undefined) r = r.contains('razones', [o.razon]);
  if (o?.texto !== undefined && o.texto.trim().length > 0) {
    // Escapa lo que PostgREST usa de separador; el `%` del patrón es nuestro.
    const t = o.texto.trim().replace(/[,()]/g, ' ');
    r = r.or(`producto_nombre.ilike.*${t}*,producto_marca.ilike.*${t}*`);
  }
  return r;
}

/**
 * LOS SKU DEL VENDEDOR, DE A PÁGINAS.
 *
 * **CURSOR Y NO OFFSET — decisión de B, con su razón: *«offset asume una
 * lista quieta, y acá el que la lee es el que la mueve»*.** El vendedor
 * publica, despublica y ajusta stock MIENTRAS recorre; con 722 filas son ~24
 * páginas, así que **la ventana para que la lista se mueva no es el borde: es
 * el caso normal**. Y el defecto que produce el offset es silencioso —*nadie
 * ve un error: ve un producto repetido, o no ve uno que existe, y le echa la
 * culpa al catálogo*.
 *
 * **ORDEN: `producto_nombre ASC, id ASC`** — el nombre porque es como el
 * vendedor busca; el `id` porque **medido, 80 de 532 SKU comparten nombre**
 * (variantes del mismo producto): sin desempate el cursor salta filas.
 * *Un orden que empata no ordena* (L-271).
 *
 * Lee `v_skus_vendedor` y no la tabla **porque PostgREST no ordena las filas
 * de arriba por una columna embebida —lo acepta y lo ignora, medido— y el
 * nombre vive dos embeds abajo.** La vista es `security_invoker`: la RLS
 * sigue decidiendo.
 */
export async function listarSkusDelVendedorPagina(
  cuentaComercialId: string,
  opciones?: {
    limite?: number;
    cursor?: string;
    /** Estado del SKU (`propuesto` · `aceptado` · `rechazado`…). */
    estado?: string;
    /** Especie del producto — el filtro de «Tu tienda». */
    especie?: string;
    /** Búsqueda por nombre o marca. 🔴 VA AL SERVIDOR y no al cliente:
     *  con una página de 30 sobre 722, buscar en memoria devolvería «no hay»
     *  sobre un producto que SÍ existe (medición de C). */
    texto?: string;
    /** Filtra por una razón de alcance (`sin_stock`, `sin_foto`, …). El
     *  servidor filtra por el MISMO array que emite — jamás por un predicado
     *  paralelo. */
    razon?: string;
  },
): Promise<ResultadoWrapper<PaginaSkus, CodigoErrorDespensa>> {
  const limite = opciones?.limite ?? 30;

  // EL TOTAL, con LOS MISMOS filtros que la página — un total de otro conjunto
  // es el mismo defecto con el número al revés.
  let qc = getClient()
    .from('v_skus_vendedor')
    .select('id', { count: 'exact', head: true })
    .eq('cuenta_comercial_id', cuentaComercialId);
  qc = aplicarFiltrosSku(qc, opciones);
  const { count, error: errorConteo } = await qc;
  if (errorConteo) return falloDespensa(errorConteo.message);
  // FAIL-CLOSED (L-247): un conteo que no llegó NO es cero.
  if (typeof count !== 'number') return falloDespensa('datos_inconsistentes');

  let q = getClient()
    .from('v_skus_vendedor')
    .select('*')
    .eq('cuenta_comercial_id', cuentaComercialId)
    .order('producto_nombre', { ascending: true })
    .order('id', { ascending: true })
    .limit(limite);
  q = aplicarFiltrosSku(q, opciones);
  if (opciones?.cursor !== undefined) {
    const corte = opciones.cursor.indexOf('|');
    if (corte !== -1) {
      const n = opciones.cursor.slice(0, corte);
      const i = opciones.cursor.slice(corte + 1);
      q = q.or(`producto_nombre.gt.${n},and(producto_nombre.eq.${n},id.gt.${i})`);
    }
  }

  const { data, error } = await q;
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');

  const items: SkuDelVendedor[] = [];
  for (const f of data) {
    if (!esObjDespensa(f) || typeof f.id !== 'string') return falloDespensa('datos_inconsistentes');
    items.push({
      sku_id: f.id,
      sku_vendedor: typeof f.sku_vendedor === 'string' ? f.sku_vendedor : '',
      variante_id: typeof f.variante_id === 'string' ? f.variante_id : '',
      producto_id: typeof f.producto_id === 'string' ? f.producto_id : '',
      producto_nombre: typeof f.producto_nombre === 'string' ? f.producto_nombre : '',
      producto_marca: typeof f.producto_marca === 'string' ? f.producto_marca : null,
      presentacion: typeof f.presentacion === 'string' ? f.presentacion : '',
      stock_disponible: typeof f.stock_disponible === 'number' ? f.stock_disponible : 0,
      stock_reservado: typeof f.stock_reservado === 'number' ? f.stock_reservado : 0,
      estado: typeof f.estado === 'string' ? f.estado : '',
      motivo_rechazo: typeof f.motivo_rechazo === 'string' ? f.motivo_rechazo : null,
      precio_publicado: typeof f.oferta_precio === 'number' ? f.oferta_precio : null,
      oferta_estado: typeof f.oferta_estado === 'string' ? f.oferta_estado : null,
      composicion_estado: composicionEstado(f.composicion_estado),
      momentos_aplicables: Array.isArray(f.momentos_aplicables)
        ? f.momentos_aplicables.filter((m): m is string => typeof m === 'string')
        : [],
      foto_portada: fotosDeProducto(f).portada,
      especies_aplicables: Array.isArray(f.especies_aplicables)
        ? f.especies_aplicables.filter((e): e is string => typeof e === 'string')
        : [],
      precio_referencia: typeof f.precio_referencia === 'number' ? f.precio_referencia : null,
      precio_propuesto: typeof f.precio_propuesto === 'number' ? f.precio_propuesto : null,
      // FAIL-CLOSED (L-247): sin `true` explícito, NO hay nada pendiente —
      // inventar un «pendiente» que no existe manda al vendedor a esperar
      // una aprobación que nadie pidió.
      propuesta_pendiente: f.propuesta_pendiente === true,
      banda_min: typeof f.banda_min === 'number' ? f.banda_min : null,
      banda_max: typeof f.banda_max === 'number' ? f.banda_max : null,
      razones: Array.isArray(f.razones)
        ? f.razones.filter((r): r is string => typeof r === 'string')
        : [],
    });
  }

  const ultimo = data[data.length - 1];
  return {
    ok: true,
    data: {
      items,
      total: count,
      siguiente_cursor:
        data.length === limite && esObjDespensa(ultimo)
          ? `${String(ultimo.producto_nombre)}|${String(ultimo.id)}`
          : null,
    },
  };
}

// ── S99-L5b · N18 — LA COMPLETITUD QUE GANA ALCANCE (mitad vendedor) ────────

/** Una razón por la que un SKU no alcanza todo lo que podría. `dueno` decide
 *  si entra al contador: SOLO lo que el vendedor puede arreglar cuenta. */
export interface RazonAlcance {
  codigo:
    | 'sku_rechazado'        // vendedor — corregir según `motivo_rechazo` y re-proponer
    | 'sin_stock'            // vendedor — la vitrina NO lo esconde (medido): la compra rebota en la reserva
    | 'sin_precio_propuesto' // vendedor — el SKU no tiene NINGUNA oferta
    | 'sku_en_revision'      // e-PetPlace — propuesto/en_revision: la revisión es suya
    | 'oferta_no_publicada'  // e-PetPlace — hay oferta y la publicación es acto suyo (M21)
    | 'composicion_ausente'  // e-PetPlace — catálogo canónico: la app ADVIERTE y sale de recomendación para familias con alergia
    | 'sin_momento_etario'   // e-PetPlace — invisible al eje etapa (N20 y filtro de recomendación)
    | 'sin_foto';            // e-PetPlace — la vitrina dibuja marcador: pierde cara, no existencia
  dueno: 'vendedor' | 'epetplace';
}

/**
 * N18, LA LEY ENTERA (firmas S96/S99 — el cómputo que la receta 4 de B espera):
 * **lo incompleto no se esconde, pierde ALCANCE** · el vendedor ve **cuál
 * campo** lo dejó afuera · **el número puede llegar a cero** (todas las
 * razones `vendedor` son arreglables por él) · **lo que depende de e-PetPlace
 * NO entra al contador** (viaja como información, con su dueño dicho) · y
 * **jamás posición, percentil ni comparación entre vendedores** — esta
 * función es PURA y por-SKU: no conoce a otro vendedor ni puede.
 *
 * UNA FUENTE, JAMÁS CÓMPUTO PARALELO: `composicion_estado` llega por el MISMO
 * guard del catálogo del cliente · `foto_portada` por `fotosDeProducto` (la
 * misma regla de portada de la vitrina) · `momentos_aplicables` es la MISMA
 * columna que filtra la recomendación por etapa. Si el cliente cambia su
 * regla, este contador cambia con él — no hay segunda verdad que divierja.
 *
 * El contador de la pieza: `razones.filter((r) => r.dueno === 'vendedor').length`.
 */
export function razonesDeAlcance(sku: SkuDelVendedor): RazonAlcance[] {
  // 🔴 YA NO DERIVA: MAPEA. El servidor emite los códigos
  // (`v_skus_vendedor.razones`) y esta capa les pone **dueño** — que es lo
  // único que es letra de producto y puede cambiar sin tocar una columna.
  // *Antes esta función repetía los ocho predicados en TS: dos
  // implementaciones de la misma verdad, condenadas a divergir el día que
  // alguien tocara una sola.*
  // Un código desconocido se ignora en vez de romper: un bundle viejo contra
  // un servidor nuevo no puede quedarse sin pantalla por una razón que
  // todavía no sabe nombrar.
  return sku.razones
    .map((codigo) => {
      const dueno = DUENO_DE_RAZON[codigo as RazonAlcance['codigo']];
      return dueno === undefined ? null : { codigo: codigo as RazonAlcance['codigo'], dueno };
    })
    .filter((r): r is RazonAlcance => r !== null);
}

/** DE QUIÉN es cada razón. **Esto sí vive acá**: es la letra de producto que
 *  decide qué entra al contador del vendedor (solo lo que él puede arreglar). */
const DUENO_DE_RAZON: Record<RazonAlcance['codigo'], RazonAlcance['dueno']> = {
  sku_rechazado:        'vendedor',
  sku_en_revision:      'epetplace',
  sin_precio_propuesto: 'vendedor',
  oferta_no_publicada:  'epetplace',
  sin_stock:            'vendedor',
  composicion_ausente:  'epetplace',
  sin_momento_etario:   'epetplace',
  sin_foto:             'epetplace',
};

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
