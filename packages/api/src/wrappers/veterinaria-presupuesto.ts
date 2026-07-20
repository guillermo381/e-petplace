// EL PRESUPUESTO CLÍNICO (S69-B, B3) — la primitiva grande del vet
// (VETERINARIA §8). Wrappers de las 5 RPCs del contrato A1 (migración
// 20260718170000, commit 4d40275). Lane CEDIDA por la A (no tocó
// index.ts). Firmas vivas verificadas con pg_get_functiondef (regla 40):
//   crear_presupuesto_borrador(...) → uuid
//   enviar_presupuesto(id, vence_en) → void  (exige borrador + ≥1 ítem + futura)
//   aprobar_presupuesto_familia(id) → {cita_id, estado, aprobado_via:'familia_en_app'}
//   registrar_aprobacion_presencial(id) → {cita_id, estado, aprobado_via:'presencial_registrado'}
//   rechazar_presupuesto(id, motivo?) → void
// Item jsonb: tipo_servicio_codigo XOR descripcion_libre · precio · cantidad(=1).
// El '' se normaliza a NULL en la fuente (NULLIF). VENCIDO es PEREZOSO:
// un presupuesto enviado con vence_en < now() se LEE vencido (el lector
// lo resuelve en el shape — cero estado extra en DB).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// ── Item del presupuesto (XOR catálogo|libre, validado server-side) ─────────
export interface PresupuestoItemInput {
  /** Código de tipo_servicio (procedimiento reservable=false). XOR con descripcionLibre. */
  tipoServicioCodigo?: string | null;
  /** Línea de texto libre con su precio. XOR con tipoServicioCodigo. */
  descripcionLibre?: string | null;
  precio: number;
  /** Default 1 en la fuente. */
  cantidad?: number;
}

export interface CrearPresupuestoInput {
  cuentaComercialId: string;
  mascotaId: string;
  items: PresupuestoItemInput[];
  familiaId?: string | null;
  casoClinicoId?: string | null;
  eventoCitaServicioId?: string | null;
  eventoAtencionId?: string | null;
  empleadoId?: string | null;
  countryCode?: string;
}

export interface AprobacionPresupuesto {
  citaId: string;
  estado: string;
  aprobadoVia: string;
}

// ── Errores tipados (startsWith de los RAISE del contrato A1) ────────────────
const CODIGOS_PRESUPUESTO = [
  'acceso_denegado',
  'no_opera_cuenta',
  'sin_acceso_mascota',
  'country_invalido',
  'presupuesto_no_existe',
  'presupuesto_no_es_borrador',
  'vence_en_requerido',
  'vence_en_pasada',
  'presupuesto_sin_items',
  'no_es_familia',
  'presupuesto_no_enviado',
  'presupuesto_vencido',
  'presupuesto_no_editable',
  // D-439 (coordinación de la fecha del procedimiento):
  'cita_no_encontrada',
  'cita_no_es_de_presupuesto',
  'cita_ya_fijada',
  'presupuesto_no_aprobado',
  'empleado_no_es_de_cuenta',
  'slot_invalido',
  'slot_en_pasado',
  'slot_ocupado',
  'datos_invalidos',
] as const;
export type CodigoErrorPresupuesto = (typeof CODIGOS_PRESUPUESTO)[number];

const MENSAJES: Record<CodigoErrorPresupuesto, string> = {
  acceso_denegado: 'No tenés permiso para esta acción.',
  no_opera_cuenta: 'No operás este negocio.',
  sin_acceso_mascota: 'No tenés acceso a esta mascota.',
  country_invalido: 'El país no es válido.',
  presupuesto_no_existe: 'Ese presupuesto ya no existe.',
  presupuesto_no_es_borrador: 'El presupuesto ya no es un borrador — no se puede editar.',
  vence_en_requerido: 'Poné hasta cuándo vale el presupuesto.',
  vence_en_pasada: 'La fecha de vencimiento tiene que ser futura.',
  presupuesto_sin_items: 'Agregá al menos un ítem antes de enviar.',
  no_es_familia: 'Solo la familia puede aprobar desde la app.',
  presupuesto_no_enviado: 'El presupuesto todavía no fue enviado.',
  presupuesto_vencido: 'El presupuesto venció.',
  presupuesto_no_editable: 'El presupuesto ya no se puede modificar.',
  cita_no_encontrada: 'Esa cita ya no existe.',
  cita_no_es_de_presupuesto: 'Esta cita no salió de un presupuesto.',
  cita_ya_fijada: 'Esta cita ya tiene fecha coordinada.',
  presupuesto_no_aprobado: 'El presupuesto de esta cita todavía no está aprobado.',
  empleado_no_es_de_cuenta: 'Esa persona no pertenece a este negocio.',
  slot_invalido: 'Elegí fecha, hora y profesional.',
  slot_en_pasado: 'La fecha coordinada tiene que ser futura.',
  slot_ocupado: 'Ese horario ya está ocupado para esa persona.',
  datos_invalidos: 'Revisá los datos del presupuesto.',
};

function normalizar(error: { code?: string; message: string }): CodigoErrorPresupuesto {
  if (error.code === '23514') return 'datos_invalidos'; // check_violation (item XOR, precio, etc.)
  const raw = error.message;
  if (raw.startsWith('auth_required')) return 'acceso_denegado';
  for (const c of CODIGOS_PRESUPUESTO) if (raw.startsWith(c)) return c;
  return 'datos_invalidos';
}
function fallo<T>(error: { code?: string; message: string }): ResultadoWrapper<T, CodigoErrorPresupuesto> {
  const codigo = normalizar(error);
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

// ── (1) crear borrador ──────────────────────────────────────────────────────
export async function crearPresupuestoBorrador(
  input: CrearPresupuestoInput,
): Promise<ResultadoWrapper<string, CodigoErrorPresupuesto>> {
  const items = input.items.map((i) => ({
    tipo_servicio_codigo: i.tipoServicioCodigo ?? null,
    descripcion_libre: i.descripcionLibre ?? null,
    precio: i.precio,
    cantidad: i.cantidad ?? 1,
  }));
  const { data, error } = await getClient().rpc('crear_presupuesto_borrador', {
    p_cuenta_comercial_id: input.cuentaComercialId,
    p_mascota_id: input.mascotaId,
    p_items: items,
    p_familia_id: input.familiaId ?? undefined,
    p_caso_clinico_id: input.casoClinicoId ?? undefined,
    p_evento_cita_servicio_id: input.eventoCitaServicioId ?? undefined,
    p_evento_atencion_id: input.eventoAtencionId ?? undefined,
    p_empleado_id: input.empleadoId ?? undefined,
    p_country_code: input.countryCode ?? 'EC',
  });
  if (error) return fallo(error);
  const id = str(data);
  if (id === null) return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES.datos_invalidos };
  return { ok: true, data: id };
}

// ── (2) enviar ──────────────────────────────────────────────────────────────
export async function enviarPresupuesto(
  presupuestoId: string,
  venceEn: string,
): Promise<ResultadoWrapper<true, CodigoErrorPresupuesto>> {
  const { error } = await getClient().rpc('enviar_presupuesto', {
    p_presupuesto_id: presupuestoId,
    p_vence_en: venceEn,
  });
  if (error) return fallo(error);
  return { ok: true, data: true };
}

// ── (3) aprobar (familia en la app) ─────────────────────────────────────────
export async function aprobarPresupuestoFamilia(
  presupuestoId: string,
): Promise<ResultadoWrapper<AprobacionPresupuesto, CodigoErrorPresupuesto>> {
  const { data, error } = await getClient().rpc('aprobar_presupuesto_familia', { p_presupuesto_id: presupuestoId });
  if (error) return fallo(error);
  return parseAprobacion(data);
}

// ── (4) registrar aprobación presencial (cuenta emisora) ────────────────────
export async function registrarAprobacionPresencial(
  presupuestoId: string,
): Promise<ResultadoWrapper<AprobacionPresupuesto, CodigoErrorPresupuesto>> {
  const { data, error } = await getClient().rpc('registrar_aprobacion_presencial', { p_presupuesto_id: presupuestoId });
  if (error) return fallo(error);
  return parseAprobacion(data);
}

function parseAprobacion(data: unknown): ResultadoWrapper<AprobacionPresupuesto, CodigoErrorPresupuesto> {
  if (!esObj(data)) return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES.datos_invalidos };
  const citaId = str(data['cita_id']);
  const estado = str(data['estado']);
  const aprobadoVia = str(data['aprobado_via']);
  if (citaId === null || estado === null || aprobadoVia === null) {
    return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES.datos_invalidos };
  }
  return { ok: true, data: { citaId, estado, aprobadoVia } };
}

// ── (5) rechazar ────────────────────────────────────────────────────────────
export async function rechazarPresupuesto(
  presupuestoId: string,
  motivo?: string | null,
): Promise<ResultadoWrapper<true, CodigoErrorPresupuesto>> {
  const { error } = await getClient().rpc('rechazar_presupuesto', {
    p_presupuesto_id: presupuestoId,
    p_motivo: motivo ?? undefined,
  });
  if (error) return fallo(error);
  return { ok: true, data: true };
}

// ── LECTOR del prestador (S69-B, cura de gate) ──────────────────────────────
// El armado (B3) persiste pero no había superficie para RELEERLO. RLS
// `presupuesto_select_cuenta` deja al prestador ver los suyos. TODOS los
// estados (¿qué pasó con lo que armé?). VENCIDO perezoso: enviado +
// vence_en < now() se lee 'vencido' en el shape (cero estado extra).

export type EstadoPresupuesto = 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'vencido';

export interface PresupuestoPrestadorItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface PresupuestoPrestador {
  id: string;
  mascotaId: string;
  total: number;
  venceEn: string | null;
  creadoEn: string;
  /** Estado real, con 'vencido' resuelto perezoso sobre 'enviado'. */
  estado: EstadoPresupuesto;
  items: PresupuestoPrestadorItem[];
}

function mapFilaPrestador(f: Record<string, unknown>): PresupuestoPrestador {
  const venceEn = typeof f['vence_en'] === 'string' ? (f['vence_en'] as string) : null;
  const estadoReal = typeof f['estado'] === 'string' ? (f['estado'] as string) : 'borrador';
  const vencido = estadoReal === 'enviado' && venceEn !== null && new Date(venceEn).getTime() < Date.now();
  const estado: EstadoPresupuesto = (vencido
    ? 'vencido'
    : (['borrador', 'enviado', 'aprobado', 'rechazado'].includes(estadoReal) ? estadoReal : 'borrador')) as EstadoPresupuesto;
  const itemsRaw = Array.isArray(f['items']) ? f['items'] : [];
  const items: PresupuestoPrestadorItem[] = itemsRaw.filter(esObj).map((i) => {
    const tipo = esObj(i['tipo']) ? i['tipo'] : null;
    const nombreTipo = tipo && typeof tipo['nombre'] === 'string' ? (tipo['nombre'] as string) : null;
    const libre = typeof i['descripcion_libre'] === 'string' ? (i['descripcion_libre'] as string) : null;
    return {
      id: String(i['id']),
      nombre: nombreTipo ?? libre ?? '',
      precio: Number(i['precio'] ?? 0),
      cantidad: Number(i['cantidad'] ?? 1),
    };
  });
  return {
    id: String(f['id']),
    mascotaId: String(f['mascota_id']),
    total: Number(f['total'] ?? 0),
    venceEn,
    creadoEn: String(f['created_at'] ?? ''),
    estado,
    items,
  };
}

/** Presupuestos del negocio (todos los estados), opcionalmente por mascota.
 *  Ordenados por creación descendente (lo último armado, arriba). */
export async function obtenerPresupuestosPrestador(
  cuentaComercialId: string,
  opciones?: { mascotaId?: string },
): Promise<ResultadoWrapper<PresupuestoPrestador[], CodigoErrorPresupuesto>> {
  let q = getClient()
    .from('presupuesto')
    .select(
      'id, mascota_id, total, vence_en, created_at, estado, ' +
        'items:presupuesto_item(id, descripcion_libre, precio, cantidad, tipo:tipos_servicio(nombre))',
    )
    .eq('cuenta_comercial_id', cuentaComercialId);
  if (opciones?.mascotaId) q = q.eq('mascota_id', opciones.mascotaId);
  const { data, error } = await q.order('created_at', { ascending: false }).returns<Record<string, unknown>[]>();
  if (error) return fallo(error);
  const filas = Array.isArray(data) ? data : [];
  return { ok: true, data: filas.filter(esObj).map(mapFilaPrestador) };
}

// ── D-439: COORDINACIÓN DE LA FECHA DEL PROCEDIMIENTO ───────────────────────
// El presupuesto aprobado agenda una cita FIRME con precio congelado y SIN
// fecha (S69-A1). Estas dos puertas la coordinan:
//   obtener_citas_por_coordinar(cuenta) → bandeja (la todo-libre ENTRA)
//   fijar_fecha_procedimiento(cita, fecha, hora, empleado) → jsonb
// Firmas verificadas con pg_get_functiondef (migración 20260719120000).

/** Un ítem del presupuesto tal cual lo devuelve el lector (jsonb). */
export interface CitaPorCoordinarItem {
  descripcionLibre: string | null;
  tipoServicioCodigo: string | null;
  precio: number;
  cantidad: number;
}

export interface CitaPorCoordinar {
  citaId: string;
  presupuestoId: string;
  casoClinicoId: string | null;
  /** Condición del caso si la cita está atada a uno; null si no. */
  casoCondicion: string | null;
  mascotaId: string;
  mascotaNombre: string;
  mascotaEspecie: string;
  /** null cuando el presupuesto es todo-libre (sin código de catálogo). */
  tipoServicio: string | null;
  /** Nombre del tipo de servicio, null para todo-libre. */
  servicioNombre: string | null;
  duracionMinutos: number;
  /** Precio congelado (snapshot en la cita). */
  totalCongelado: number;
  /** Persona provisional asignada al aprobar (puede reasignarse al fijar). */
  empleadoId: string | null;
  items: CitaPorCoordinarItem[];
  creadaEn: string;
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v ?? 0);
}

function mapCitaPorCoordinar(f: Record<string, unknown>): CitaPorCoordinar {
  const itemsRaw = Array.isArray(f['items']) ? f['items'] : [];
  const items: CitaPorCoordinarItem[] = itemsRaw.filter(esObj).map((i) => ({
    descripcionLibre: str(i['descripcion_libre']),
    tipoServicioCodigo: str(i['tipo_servicio_codigo']),
    precio: num(i['precio']),
    cantidad: num(i['cantidad']),
  }));
  return {
    citaId: String(f['cita_id']),
    presupuestoId: String(f['presupuesto_id']),
    casoClinicoId: str(f['caso_clinico_id']),
    casoCondicion: str(f['caso_condicion']),
    mascotaId: String(f['mascota_id']),
    mascotaNombre: String(f['mascota_nombre'] ?? ''),
    mascotaEspecie: String(f['mascota_especie'] ?? ''),
    tipoServicio: str(f['tipo_servicio']),
    servicioNombre: str(f['servicio_nombre']),
    duracionMinutos: num(f['duracion_minutos']),
    totalCongelado: num(f['total_congelado']),
    empleadoId: str(f['empleado_id']),
    items,
    creadaEn: String(f['creada_en'] ?? ''),
  };
}

/** Bandeja "por coordinar" del negocio: citas firmes de presupuesto sin
 *  fecha. La cita todo-libre (tipo_servicio NULL) ENTRA. */
export async function obtenerCitasPorCoordinar(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<CitaPorCoordinar[], CodigoErrorPresupuesto>> {
  const { data, error } = await getClient()
    .rpc('obtener_citas_por_coordinar', { p_cuenta: cuentaComercialId })
    .returns<Record<string, unknown>[]>();
  if (error) return fallo(error);
  const filas = Array.isArray(data) ? data : [];
  return { ok: true, data: filas.filter(esObj).map(mapCitaPorCoordinar) };
}

export interface FijarFechaInput {
  citaId: string;
  /** YYYY-MM-DD. */
  fecha: string;
  /** HH:MM (24h). */
  hora: string;
  /** prestador_empleados.id de la persona que atenderá (reasignación §2). */
  empleadoId: string;
}

export interface FechaFijada {
  citaId: string;
  fecha: string;
  hora: string;
  empleadoId: string;
  prestadorId: string;
  duenoNotificado: boolean;
}

/** Coordina la fecha de un procedimiento. Precio congelado INTACTO.
 *  Notifica al dueño (si hay user en app). */
export async function fijarFechaProcedimiento(
  input: FijarFechaInput,
): Promise<ResultadoWrapper<FechaFijada, CodigoErrorPresupuesto>> {
  const { data, error } = await getClient().rpc('fijar_fecha_procedimiento', {
    p_cita: input.citaId,
    p_fecha: input.fecha,
    p_hora: input.hora,
    p_empleado: input.empleadoId,
  });
  if (error) return fallo(error);
  if (!esObj(data) || data['ok'] !== true) {
    return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES.datos_invalidos };
  }
  const citaId = str(data['cita_id']);
  const fecha = str(data['fecha']);
  const hora = str(data['hora']);
  const empleadoId = str(data['empleado_id']);
  const prestadorId = str(data['prestador_id']);
  if (citaId === null || fecha === null || hora === null || empleadoId === null || prestadorId === null) {
    return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES.datos_invalidos };
  }
  return {
    ok: true,
    data: {
      citaId,
      fecha,
      hora,
      empleadoId,
      prestadorId,
      duenoNotificado: data['dueno_notificado'] === true,
    },
  };
}

// ── S70-A10: personas de la cuenta (selector de "Fijar fecha") ───────────────

export interface EmpleadoCuenta {
  empleadoId: string;
  nombre: string;
  activo: boolean;
}

/** Personas de la cuenta (titular incluido), activas primero. El selector de
 *  "Fijar fecha" filtra activo=true. */
export async function obtenerEmpleadosCuenta(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<EmpleadoCuenta[], CodigoErrorPresupuesto>> {
  const { data, error } = await getClient()
    .rpc('obtener_empleados_cuenta', { p_cuenta_comercial_id: cuentaComercialId })
    .returns<Record<string, unknown>[]>();
  if (error) return fallo(error);
  const filas = Array.isArray(data) ? data : [];
  return {
    ok: true,
    data: filas.filter(esObj).map((f) => ({
      empleadoId: String(f['empleado_id']),
      nombre: String(f['nombre'] ?? ''),
      activo: f['activo'] === true,
    })),
  };
}
