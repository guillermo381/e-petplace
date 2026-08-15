// LO QUE EL PANEL DEL VENDEDOR NECESITA Y EL CONTRATO S96 NO TRAÍA —
// ARCHIVO ADITIVO DE LA PISTA C (S96), por 76(c)/(d): `packages/api` se
// comparte por ARCHIVOS NUEVOS + hunks aditivos. **A lo firma o lo muda**;
// hasta entonces es el pedido autocontenido hecho código, con cada hueco
// medido contra la fuente antes de escribirse (12-ago-2026):
//
//  ① `registrar_factura_pedido` EXISTE en la base (medido:
//     `pg_get_function_arguments` — p_numero obligatorio, clave/archivo/total
//     opcionales, p_estado_sri DEFAULT 'autorizada') y el recorrido §0 del
//     contrato la nombra… pero ningún wrapper la envolvía. Sin ella el
//     escalón «Despachado» no puede pedir adelante lo que necesita
//     (LETRA_PANEL §3: en Ecuador la factura electrónica falla y un pedido
//     empacado sin factura NO SALE).
//  ② El panel necesita el ESCALÓN INTERNO (picking · empacado · documentado)
//     para saber qué pedir adelante, y los lectores publicados solo dan la
//     narrativa de familia («preparando» tapa tres escalones distintos).
//     El vendedor SÍ puede leer `pedidos.estado` — su RLS ya lo deja
//     (`es_vendedor_de`), y las siete narrativas protegen a la FAMILIA, no
//     al que trabaja: los cuatro escalones SON su vocabulario
//     (LETRA_PANEL §3). Cero columnas de la mascota acá, y no puede
//     haberlas (§4).
//  ③ La fila del HOY exige «quién, cuántos ítems» (LETRA_PANEL §2.1) y
//     `PedidoDelVendedor` no los trae. Se leen de `pedidos` /
//     `pedido_items` bajo la MISMA RLS, en un solo viaje por tabla
//     (S94-PERF: el costo está en la petición, no en las filas).
//  ④ La puerta de oficio (LETRA_RECORRIDO §3) necesita saber si la cuenta
//     tiene la naturaleza de venta. `cuenta_roles` es legible por su dueño
//     (policy `owner_select_own_cuenta_roles`, medida) y no había lector.
//
// Los códigos de error son los de `_despensa-comun` — misma maquinaria,
// cero lista nueva.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import {
  falloDespensa,
  falloDespensaCodigo,
  esObjDespensa,
  type CodigoErrorDespensa,
} from './_despensa-comun';

// ── ② El escalón interno ────────────────────────────────────────────────────

/** Los estados VIVOS del recorrido, leídos de `cat_estados_pedido` (medido
 *  12-ago-2026, no supuesto). Cualquier otro código llega como string y la
 *  pantalla lo trata como «sin acción ofrecible» — jamás inventa un botón. */
export const ESCALONES_VIVOS = [
  'creado',
  'esperando_pago',
  'pago_capturado',
  'stock_reservado',
  'vendedor_notificado',
  'liberado_preparacion',
  'picking',
  'empacado',
  'documentado',
  'en_reparto',
  'hacia_destino',
  'entregado',
  'entrega_fallida',
  'cancelado_cliente',
  'cancelado_vendedor',
  'cancelado_sistema',
] as const;

export async function obtenerEscalonPedido(
  pedidoId: string,
): Promise<ResultadoWrapper<{ estado: string }, CodigoErrorDespensa>> {
  const { data, error } = await getClient()
    .from('pedidos')
    .select('estado')
    .eq('id', pedidoId)
    .maybeSingle();
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || typeof data.estado !== 'string') {
    return falloDespensaCodigo('pedido_no_existe');
  }
  return { ok: true, data: { estado: data.estado } };
}

// ── ③ Lo que le falta a la fila del HOY ─────────────────────────────────────

export interface ExtraPanelPedido {
  pedido_id: string;
  /** El escalón interno — el vocabulario del que trabaja, no el de la familia. */
  estado: string;
  /** Quién. Snapshot del pedido; null = pedido sin dirección (retiro/mostrador). */
  nombre_receptor: string | null;
  items_cantidad: number;
  metodo_entrega: string | null;
}

/** Un viaje por tabla para TODA la lista (S94-PERF), bajo la misma RLS que
 *  ya decide qué pedidos existen para esta sesión. */
export async function extrasPanelPedidos(
  pedidoIds: string[],
): Promise<ResultadoWrapper<Record<string, ExtraPanelPedido>, CodigoErrorDespensa>> {
  if (pedidoIds.length === 0) return { ok: true, data: {} };
  const cliente = getClient();
  const [cab, items] = await Promise.all([
    cliente
      .from('pedidos')
      .select('id, estado, entrega_nombre_receptor, metodo_entrega')
      .in('id', pedidoIds),
    cliente.from('pedido_items').select('pedido_id').in('pedido_id', pedidoIds),
  ]);
  if (cab.error) return falloDespensa(cab.error.message);
  if (items.error) return falloDespensa(items.error.message);

  const conteo: Record<string, number> = {};
  for (const i of items.data ?? []) {
    if (esObjDespensa(i) && typeof i.pedido_id === 'string') {
      conteo[i.pedido_id] = (conteo[i.pedido_id] ?? 0) + 1;
    }
  }
  const salida: Record<string, ExtraPanelPedido> = {};
  for (const f of cab.data ?? []) {
    if (!esObjDespensa(f) || typeof f.id !== 'string' || typeof f.estado !== 'string') {
      return falloDespensa('datos_inconsistentes');
    }
    salida[f.id] = {
      pedido_id: f.id,
      estado: f.estado,
      nombre_receptor:
        typeof f.entrega_nombre_receptor === 'string' ? f.entrega_nombre_receptor : null,
      items_cantidad: conteo[f.id] ?? 0,
      metodo_entrega: typeof f.metodo_entrega === 'string' ? f.metodo_entrega : null,
    };
  }
  return { ok: true, data: salida };
}

// ── ① La factura — el requisito del despacho ────────────────────────────────

/**
 * «La factura se registra, no se emite» (LETRA_PANEL §3). El número es
 * obligatorio; la clave de acceso, el archivo y el total son opcionales
 * (los DEFAULT de la RPC, medidos). Mueve `empacado → documentado`; si la
 * transición rebota, el rebote viaja tipado y la pantalla dice la verdad.
 */
export async function registrarFacturaPedido(input: {
  pedido_id: string;
  numero: string;
  clave_acceso?: string;
  archivo_url?: string;
  total?: number;
}): Promise<ResultadoWrapper<{ pedido_id: string }, CodigoErrorDespensa>> {
  if (input.numero.trim().length === 0) return falloDespensaCodigo('motivo_requerido');
  const { data, error } = await getClient().rpc('registrar_factura_pedido', {
    p_pedido_id: input.pedido_id,
    p_numero: input.numero.trim(),
    p_clave_acceso: input.clave_acceso ?? undefined,
    p_archivo_url: input.archivo_url ?? undefined,
    p_total: input.total ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { pedido_id: input.pedido_id } };
}

// ── ④ La naturaleza de la cuenta — la llave de la puerta ────────────────────

// ── ⑤ Lo configurado se puede VER ───────────────────────────────────────────
// `definir_recurso_reparto` / `definir_turno_entrega` ESCRIBEN y nada leía
// `recursos_reparto` / `entrega_turnos` — una configuración que escribe sin
// poder mostrar lo configurado no pasa la vara del panel («¿puede el vendedor
// verlo sin que nadie le explique nada?»). RLS medida: `recursos_select` /
// `turnos_select` = `es_vendedor_de(cuenta_comercial_id) OR is_admin()`.

export interface RecursoReparto {
  recurso_id: string;
  nombre: string;
  capacidad_por_dia: number;
  /** Convención de la casa (regla 32): 0=Domingo … 6=Sábado. */
  dias_operacion: number[];
  activo: boolean;
}

export async function listarRecursosReparto(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<RecursoReparto[], CodigoErrorDespensa>> {
  const { data, error } = await getClient()
    .from('recursos_reparto')
    .select('id, nombre, capacidad_por_dia, dias_operacion, activo')
    .eq('cuenta_comercial_id', cuentaComercialId)
    .order('nombre');
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida: RecursoReparto[] = [];
  for (const r of data) {
    if (!esObjDespensa(r) || typeof r.id !== 'string') return falloDespensa('datos_inconsistentes');
    salida.push({
      recurso_id: r.id,
      nombre: typeof r.nombre === 'string' ? r.nombre : '',
      capacidad_por_dia: typeof r.capacidad_por_dia === 'number' ? r.capacidad_por_dia : 0,
      dias_operacion: Array.isArray(r.dias_operacion)
        ? r.dias_operacion.filter((d): d is number => typeof d === 'number')
        : [],
      activo: r.activo === true,
    });
  }
  return { ok: true, data: salida };
}

export interface TurnoEntrega {
  turno_id: string;
  codigo: string;
  /** Horas `'HH:MM:SS'` tal como las guarda Postgres — la pantalla recorta. */
  corte: string;
  entrega_desde: string;
  entrega_hasta: string;
  /** 0 = mismo día · 1 = día siguiente. */
  dia_offset: number;
  /** Días en que RIGE el corte. **0=domingo … 6=sábado**, la convención de la
   *  casa (medida contra `EXTRACT(DOW)`, no supuesta).
   *
   *  🔴 **Viaja porque sin él la Hoja no PRECARGA al reabrir** — y sin
   *  precarga, editar la hora de un corte le mostraría al vendedor días que
   *  no son los suyos. *La firma distingue CREAR de EDITAR, y esa distinción
   *  necesita el dato.* */
  dias_semana: number[];
  /** Si el corte rige también en feriado. */
  incluye_festivos: boolean;
  activo: boolean;
}

export async function listarTurnosEntrega(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<TurnoEntrega[], CodigoErrorDespensa>> {
  const { data, error } = await getClient()
    .from('entrega_turnos')
    .select('id, codigo, corte, entrega_desde, entrega_hasta, dia_offset, dias_semana, incluye_festivos, activo')
    .eq('cuenta_comercial_id', cuentaComercialId)
    .order('orden');
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida: TurnoEntrega[] = [];
  for (const t of data) {
    if (!esObjDespensa(t) || typeof t.id !== 'string') return falloDespensa('datos_inconsistentes');
    salida.push({
      turno_id: t.id,
      codigo: typeof t.codigo === 'string' ? t.codigo : '',
      corte: typeof t.corte === 'string' ? t.corte : '',
      entrega_desde: typeof t.entrega_desde === 'string' ? t.entrega_desde : '',
      entrega_hasta: typeof t.entrega_hasta === 'string' ? t.entrega_hasta : '',
      dia_offset: typeof t.dia_offset === 'number' ? t.dia_offset : 0,
      /* Angostado verificando (regla 34): lo que no es un array de números
         cae al set completo — **el mismo valor que la columna tiene por
         default**, así que un dato ilegible degrada al estado que la tabla
         ya garantizaba, no a un vacío que la pantalla leería como «ningún
         día». *Un fallback que apaga todos los días sería peor que el dato
         crudo.* */
      dias_semana: Array.isArray(t.dias_semana) && t.dias_semana.every((d) => typeof d === 'number')
        ? (t.dias_semana as number[])
        : [0, 1, 2, 3, 4, 5, 6],
      incluye_festivos: t.incluye_festivos === true,
      activo: t.activo === true,
    });
  }
  return { ok: true, data: salida };
}

// ── ④ La naturaleza de la cuenta — la llave de la puerta ────────────────────

/** Los roles ACTIVOS de una cuenta comercial propia. La RLS
 *  (`owner_select_own_cuenta_roles`) decide qué filas existen: para una
 *  cuenta ajena esto devuelve `[]`, no un error — y la puerta no se dibuja. */
export async function rolesActivosDeMiCuenta(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<string[], CodigoErrorDespensa>> {
  const { data, error } = await getClient()
    .from('cuenta_roles')
    .select('tipo_actor, estado')
    .eq('cuenta_comercial_id', cuentaComercialId)
    .eq('estado', 'activo');
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const roles: string[] = [];
  for (const r of data) {
    if (esObjDespensa(r) && typeof r.tipo_actor === 'string') roles.push(r.tipo_actor);
  }
  return { ok: true, data: roles };
}
