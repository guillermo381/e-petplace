// LA ATENCIÓN DE GROOMING (S60-B1) — el Antes/Durante/Después del
// groomer en móvil, sobre las RPCs de la era web relevadas VIVAS
// (L-140 curada S59-A3; devengo variante (b) injertado en
// cerrar_grooming_con_calidad, S59 §10.2). Contrato verificado con
// pg_get_functiondef contra la DB (regla 40) — jamás calcado del paseo:
//   · iniciar_atencion_grooming(cita) → hito→capa→oficio + cita en_curso
//   · agregar/quitar_servicio_grooming — los 9 REGISTRABLES de
//     cat_servicios_grooming (menú de dos capas §1: jamás se venden)
//   · registrar/quitar_estado_pelaje_grooming — recibir/entregar, UNO
//     por momento (el motor rebota el duplicado)
//   · registrar_archivo_grooming — tipos foto_recibir/foto_entregar/
//     foto_durante/foto_incidencia/otro (CHECK de DB)
//   · notas e incidencias: TRANSVERSALES por capa atención — los
//     wrappers agregarNotaAtencion/agregarIncidenciaAtencion (S44)
//     escriben a evento_grooming_notas/_incidencias por familia
//   · terminar_atencion_grooming — EXIGE foto_entregar (guard D-270 de
//     la era web, tensión con §8 DECLARADA al reporte, no parchada)
//   · cerrar_grooming_con_calidad — piso §8 (≥1 servicio + recibir Y
//     entregar + ≥1 nota o foto) + DEVENGO al cierre
//   · registrar_discrepancia_talla_grooming — patrón P19: registra y
//     corrige el PERFIL; la cita NO se recotiza (§2)
//   · obtener_resumen_cierre_grooming / obtener_resumen_dia_grooming
// El estado del Durante se lee DIRECTO con RLS (grooming_*_select
// authenticated) — no hay RPC de lectura intermedia y no hace falta.

import { getClient } from '../client';
import type { Database } from '../database.types';
import type { ResultadoWrapper } from '../resultado';
import { parseDireccionSnapshot, type CitaAgendaPaseo, type InputCitasPaseoDelDia } from './paseo';

// ── Errores tipados (códigos REALES de las RPCs relevadas) ──────────────────

const CODIGOS_GROOMING_ATENCION = [
  'acceso_denegado',
  'cita_no_encontrada',
  'cita_no_es_grooming',
  'cita_estado_invalido_para_iniciar',
  'atencion_grooming_ya_existe_para_cita',
  'atencion_grooming_no_existe',
  'atencion_no_en_curso',
  'atencion_no_terminada',
  'servicio_ya_aplicado',
  'estado_pelaje_momento_ya_registrado',
  'falta_foto_entregar',
  'calidad_falta_servicio',
  'calidad_falta_estado_recibir',
  'calidad_falta_estado_entregar',
  'calidad_falta_nota_o_foto',
  'talla_invalida',
  'talla_sin_discrepancia',
  'cita_sin_precio',
  'prestador_sin_cuenta_comercial',
] as const;

export type CodigoErrorGroomingAtencion = (typeof CODIGOS_GROOMING_ATENCION)[number];

const MENSAJES: Record<
  CodigoErrorGroomingAtencion | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:                        'No tienes acceso a esta atención.',
  cita_no_encontrada:                     'La cita no existe o ya no está disponible.',
  cita_no_es_grooming:                    'Esta cita no es de grooming.',
  cita_estado_invalido_para_iniciar:      'La cita no está lista para empezar.',
  atencion_grooming_ya_existe_para_cita:  'Esta cita ya tiene una atención en marcha.',
  atencion_grooming_no_existe:            'La atención no existe.',
  atencion_no_en_curso:                   'La atención no está en curso.',
  atencion_no_terminada:                  'La atención todavía no terminó.',
  servicio_ya_aplicado:                   'Ese servicio ya está registrado.',
  estado_pelaje_momento_ya_registrado:    'Ese momento ya tiene su estado registrado.',
  falta_foto_entregar:                    'Falta la foto de entrega: se toma con la mascota presente.',
  calidad_falta_servicio:                 'Registra al menos un servicio aplicado antes de cerrar.',
  calidad_falta_estado_recibir:           'Falta el estado del pelaje al recibir.',
  calidad_falta_estado_entregar:          'Falta el estado del pelaje al entregar.',
  calidad_falta_nota_o_foto:              'El cierre necesita al menos una nota o una foto.',
  talla_invalida:                         'La talla elegida no es válida.',
  talla_sin_discrepancia:                 'Esa es la talla que ya está declarada.',
  cita_sin_precio:                        'La cita no tiene precio registrado.',
  prestador_sin_cuenta_comercial:         'Falta la cuenta comercial para registrar el cobro.',
  datos_inconsistentes:                   'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:                      'Ocurrió un error inesperado. Prueba de nuevo.',
};

// Alias de acceso (auth/RLS) → un solo código de superficie.
const CODIGOS_ACCESO = [
  'auth_required',
  'no_access_to_prestador',
  'no_access_to_mascota',
] as const;

// Códigos del motor que la superficie trata como cita_no_encontrada.
const CODIGOS_CITA_AUSENTE = ['cita_no_existe', 'cita_no_encontrada'] as const;

function normalizarCodigo(raw: string): CodigoErrorGroomingAtencion | 'error_desconocido' {
  for (const c of CODIGOS_ACCESO) if (raw.startsWith(c)) return 'acceso_denegado';
  for (const c of CODIGOS_CITA_AUSENTE) if (raw.startsWith(c)) return 'cita_no_encontrada';
  // Sufijo ': <detalle>' — prefijo, no igualdad (L-115).
  for (const codigo of CODIGOS_GROOMING_ATENCION) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function fallo<T>(mensajeOriginal: string): ResultadoWrapper<T, CodigoErrorGroomingAtencion> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// ── Catálogos del oficio (RLS select authenticated; es_seed_preliminar
// vigente §10.3 — la voz del catálogo es la de DB, es-only: misma
// realidad que cat_novedades_paseo, deuda de familia D-324) ─────────────────

export type ServicioGroomingCatalogo = Pick<
  Database['public']['Tables']['cat_servicios_grooming']['Row'],
  'codigo' | 'nombre' | 'descripcion'
>;

export type EstadoPelajeCatalogo = Pick<
  Database['public']['Tables']['cat_estados_pelaje']['Row'],
  'codigo' | 'nombre' | 'momento'
>;

export type IncidenciaGroomingCatalogo = Pick<
  Database['public']['Tables']['cat_incidencias_grooming']['Row'],
  'codigo' | 'nombre' | 'descripcion' | 'severidad_sugerida'
>;

/** Los 9 registrables del Durante (§1: vocabulario, jamás comprables). */
export async function obtenerServiciosGroomingCatalogo(): Promise<
  ResultadoWrapper<ServicioGroomingCatalogo[], CodigoErrorGroomingAtencion>
> {
  const { data, error } = await getClient()
    .from('cat_servicios_grooming')
    .select('codigo, nombre, descripcion')
    .eq('activo', true)
    .order('orden_display', { ascending: true });
  if (error) return fallo(error.message);
  return { ok: true, data: data ?? [] };
}

/** Estados de pelaje por momento (recibir_* / entregar_*). */
export async function obtenerEstadosPelajeCatalogo(): Promise<
  ResultadoWrapper<EstadoPelajeCatalogo[], CodigoErrorGroomingAtencion>
> {
  const { data, error } = await getClient()
    .from('cat_estados_pelaje')
    .select('codigo, nombre, momento')
    .eq('activo', true)
    .order('orden_display', { ascending: true });
  if (error) return fallo(error.message);
  return { ok: true, data: data ?? [] };
}

/** Catálogo de incidencias del oficio (para agregarIncidenciaAtencion). */
export async function obtenerIncidenciasGrooming(): Promise<
  ResultadoWrapper<IncidenciaGroomingCatalogo[], CodigoErrorGroomingAtencion>
> {
  const { data, error } = await getClient()
    .from('cat_incidencias_grooming')
    .select('codigo, nombre, descripcion, severidad_sugerida')
    .eq('activo', true)
    .order('orden_display', { ascending: true });
  if (error) return fallo(error.message);
  return { ok: true, data: data ?? [] };
}

// ── Agenda: las citas de grooming del día/rango (espejo del paseo) ──────────
// Mismo shape CitaAgendaPaseo para que el HOY componga UNA lista.
// direccion = null en la LISTA (el HOY no la pinta); el detalle por id
// trae modalidad + el snapshot D-339 (S61-B6 — la tanda domicilio llegó).

export async function obtenerCitasGroomingDelDia(
  input: InputCitasPaseoDelDia,
): Promise<ResultadoWrapper<CitaAgendaPaseo[], CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient()
    .from('evento_cita_servicio')
    .select(
      'id, fecha, hora, estado, tipo_servicio, suscripcion_servicio_id, duracion_minutos, mascota:mascotas(id, nombre, especie, foto_url), tipo:tipos_servicio!inner(nombre, duracion_default_minutos), atencion:evento_atencion(estado, iniciada_en)',
    )
    .eq('prestador_id', input.prestador_id)
    .gte('fecha', input.fecha)
    .lte('fecha', input.fecha_hasta ?? input.fecha)
    .eq('tipo.categoria', 'grooming')
    // VERDAD FIRME — misma lista positiva de la puerta del paseo.
    .in('estado', ['confirmada', 'en_curso', 'completada', 'no_show'])
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });

  if (error) return fallo(error.message);
  const citas: CitaAgendaPaseo[] = (data ?? []).map((c) => {
    const atenciones = (c.atencion ?? []) as { estado: string; iniciada_en: string }[];
    const atencion =
      atenciones.length === 0
        ? null
        : atenciones.reduce((a, b) => (b.iniciada_en > a.iniciada_en ? b : a));
    return { ...c, atencion, direccion: null };
  });
  return { ok: true, data: citas };
}

/** El detalle por id suma la MODALIDAD de la cita (S61-B6, D-392): el
 *  Antes pinta "A dónde ir" solo con 'domicilio'; 'local' y el legacy
 *  'presencial' no cambian nada. */
export type CitaGroomingDetalle = CitaAgendaPaseo & { modalidad: string | null };

/**
 * UNA cita de grooming por su id (S60-C2.1). La cura de raíz del
 * "ya no disponible": el Antes resolvía la cita contra la lista del
 * DÍA local — una cita de mañana (tapeable desde la SEMANA del HOY)
 * jamás aparecía. La RLS (cita_select_prestador) es el guard; misma
 * verdad firme y mismo shape que la lista (+modalidad y el snapshot
 * D-339 congelado por el motor de D-392, S61-B6).
 */
export async function obtenerCitaGroomingPorId(
  citaId: string,
): Promise<ResultadoWrapper<CitaGroomingDetalle, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient()
    .from('evento_cita_servicio')
    .select(
      'id, fecha, hora, estado, tipo_servicio, suscripcion_servicio_id, duracion_minutos, modalidad, direccion_snapshot, mascota:mascotas(id, nombre, especie, foto_url), tipo:tipos_servicio!inner(nombre, duracion_default_minutos), atencion:evento_atencion(estado, iniciada_en)',
    )
    .eq('id', citaId)
    .eq('tipo.categoria', 'grooming')
    .in('estado', ['confirmada', 'en_curso', 'completada', 'no_show'])
    .maybeSingle();

  if (error) return fallo(error.message);
  if (data === null) return fallo('cita_no_encontrada');
  const atenciones = (data.atencion ?? []) as { estado: string; iniciada_en: string }[];
  const atencion =
    atenciones.length === 0
      ? null
      : atenciones.reduce((a, b) => (b.iniciada_en > a.iniciada_en ? b : a));
  const { direccion_snapshot, ...resto } = data;
  return {
    ok: true,
    data: { ...resto, atencion, direccion: parseDireccionSnapshot(direccion_snapshot) },
  };
}

// ── 7.5: la verdad del estado por cita ──────────────────────────────────────

export interface GroomingDeCita {
  /** null = la cita aún no tiene atención (el Antes). */
  grooming_id: string | null;
  estado: string | null;
}

export async function obtenerGroomingPorCita(
  citaId: string,
): Promise<ResultadoWrapper<GroomingDeCita, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('obtener_grooming_por_cita', {
    p_cita_id: citaId,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true || !esObj(data.data)) return fallo('datos_inconsistentes');
  const d = data.data;
  return {
    ok: true,
    data: {
      grooming_id: typeof d.grooming_id === 'string' ? d.grooming_id : null,
      estado: typeof d.estado === 'string' ? d.estado : null,
    },
  };
}

// ── A · Iniciar ──────────────────────────────────────────────────────────────

export interface ResultadoIniciarGrooming {
  grooming_id: string;
  evento_atencion_id: string;
  cita_id: string;
}

/** Inicia el grooming de una cita confirmada (hito→capa→oficio + en_curso). */
export async function iniciarAtencionGrooming(
  citaId: string,
): Promise<ResultadoWrapper<ResultadoIniciarGrooming, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('iniciar_atencion_grooming', {
    p_cita_id: citaId,
  });
  if (error) return fallo(error.message);
  if (
    !esObj(data) ||
    data.ok !== true ||
    typeof data.grooming_id !== 'string' ||
    typeof data.evento_atencion_id !== 'string'
  ) {
    return fallo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      grooming_id: data.grooming_id,
      evento_atencion_id: data.evento_atencion_id,
      cita_id: citaId,
    },
  };
}

// ── La ficha de 30 segundos (§8 ANTES) — vista FILTRADA, jamás la HC ────────
// Lectura directa con RLS (el acceso del prestador nace con la cita
// confirmada, L-133). Solo lo pertinente al oficio: talla y pelaje del
// perfil (§3) + señales como FLAGS (misma altitud que el detalle
// prestador S51 — el detalle fino vive en "Conocer a {mascota}").

export interface FichaAntesGrooming {
  mascota_id: string;
  nombre: string;
  especie: string | null;
  raza: string | null;
  foto_url: string | null;
  /** null honesto: el dueño aún no declaró (§3). */
  talla: 'S' | 'M' | 'L' | null;
  pelaje: 'normal' | 'largo' | null;
  tiene_alergias: boolean;
  tiene_condicion_cronica: boolean;
  tiene_emergencia_activa: boolean;
}

function esTallaPerfil(v: unknown): v is 'S' | 'M' | 'L' {
  return v === 'S' || v === 'M' || v === 'L';
}

function esPelajePerfil(v: unknown): v is 'normal' | 'largo' {
  return v === 'normal' || v === 'largo';
}

export async function obtenerFichaAntesGrooming(
  mascotaId: string,
): Promise<ResultadoWrapper<FichaAntesGrooming, CodigoErrorGroomingAtencion>> {
  const cliente = getClient();
  const mascota = await cliente
    .from('mascotas')
    .select('id, nombre, especie, raza, foto_url, talla, pelaje')
    .eq('id', mascotaId)
    .maybeSingle();
  if (mascota.error) return fallo(mascota.error.message);
  // RLS: sin acceso vigente la fila no existe para este user.
  if (mascota.data === null) return fallo('no_access_to_mascota');

  const perfil = await cliente
    .from('mascota_perfil_vigente')
    .select('alergias, condiciones_cronicas, tiene_emergencia_activa')
    .eq('mascota_id', mascotaId)
    .maybeSingle();
  if (perfil.error) return fallo(perfil.error.message);

  const alergias = perfil.data?.alergias;
  const condiciones = perfil.data?.condiciones_cronicas;
  return {
    ok: true,
    data: {
      mascota_id: mascota.data.id,
      nombre: mascota.data.nombre,
      especie: mascota.data.especie,
      raza: mascota.data.raza,
      foto_url: mascota.data.foto_url,
      talla: esTallaPerfil(mascota.data.talla) ? mascota.data.talla : null,
      pelaje: esPelajePerfil(mascota.data.pelaje) ? mascota.data.pelaje : null,
      tiene_alergias: Array.isArray(alergias) && alergias.length > 0,
      tiene_condicion_cronica: Array.isArray(condiciones) && condiciones.length > 0,
      tiene_emergencia_activa: perfil.data?.tiene_emergencia_activa ?? false,
    },
  };
}

// ── Discrepancia de talla (§2, patrón P19) ──────────────────────────────────

export interface ResultadoDiscrepanciaTalla {
  talla_declarada: 'S' | 'M' | 'L' | null;
  talla_observada: 'S' | 'M' | 'L';
}

/**
 * Registra la discrepancia y CORRIGE el perfil para las próximas.
 * Esta cita NO se recotiza — el snapshot congelado manda (§2).
 */
export async function registrarDiscrepanciaTallaGrooming(input: {
  cita_id: string;
  talla_observada: 'S' | 'M' | 'L';
}): Promise<ResultadoWrapper<ResultadoDiscrepanciaTalla, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('registrar_discrepancia_talla_grooming', {
    p_cita_id: input.cita_id,
    p_talla_observada: input.talla_observada,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true || !esTallaPerfil(data.talla_observada)) {
    return fallo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      talla_declarada: esTallaPerfil(data.talla_declarada) ? data.talla_declarada : null,
      talla_observada: data.talla_observada,
    },
  };
}

// ── El estado del Durante (lectura directa, RLS es el guard) ────────────────

export interface EstadoDuranteGrooming {
  evento_atencion_id: string;
  estado: string;
  iniciada_en: string | null;
  mascota_id: string;
  prestador_id: string;
  /** Códigos de servicios ya aplicados (cat_servicios_grooming). */
  servicios_aplicados: string[];
  /** momento → codigo del estado registrado (ausente = sin registrar). */
  estados_pelaje: Partial<Record<'recibir' | 'entregar', string>>;
  fotos_por_tipo: Record<string, number>;
  notas_total: number;
  incidencias_total: number;
}

export async function obtenerEstadoDuranteGrooming(
  groomingId: string,
): Promise<ResultadoWrapper<EstadoDuranteGrooming, CodigoErrorGroomingAtencion>> {
  const cliente = getClient();
  const base = await cliente
    .from('eventos_mascota_grooming')
    .select('id, evento_atencion_id, mascota_id, prestador_id, atencion:evento_atencion(estado, iniciada_en)')
    .eq('id', groomingId)
    .maybeSingle();
  if (base.error) return fallo(base.error.message);
  if (base.data === null || base.data.evento_atencion_id === null) {
    return fallo('atencion_grooming_no_existe');
  }
  const atencionId = base.data.evento_atencion_id;

  const [servicios, estados, archivos, notas, incidencias] = await Promise.all([
    cliente
      .from('evento_grooming_servicios_aplicados')
      .select('servicio_codigo')
      .eq('grooming_id', groomingId),
    cliente
      .from('evento_grooming_estados_pelaje')
      .select('momento, estado_codigo')
      .eq('grooming_id', groomingId),
    cliente.from('evento_grooming_archivos').select('tipo').eq('grooming_id', groomingId),
    cliente
      .from('evento_grooming_notas')
      .select('id', { count: 'exact', head: true })
      .eq('evento_atencion_id', atencionId),
    cliente
      .from('evento_grooming_incidencias')
      .select('id', { count: 'exact', head: true })
      .eq('evento_atencion_id', atencionId),
  ]);
  if (servicios.error || estados.error || archivos.error || notas.error || incidencias.error) {
    return fallo('error_desconocido');
  }

  const estadosPelaje: Partial<Record<'recibir' | 'entregar', string>> = {};
  for (const e of estados.data ?? []) {
    if (e.momento === 'recibir' || e.momento === 'entregar') {
      estadosPelaje[e.momento] = e.estado_codigo;
    }
  }
  const fotosPorTipo: Record<string, number> = {};
  for (const a of archivos.data ?? []) {
    fotosPorTipo[a.tipo] = (fotosPorTipo[a.tipo] ?? 0) + 1;
  }
  const atencion = base.data.atencion;
  return {
    ok: true,
    data: {
      evento_atencion_id: atencionId,
      estado: atencion?.estado ?? '',
      iniciada_en: atencion?.iniciada_en ?? null,
      mascota_id: base.data.mascota_id,
      prestador_id: base.data.prestador_id,
      servicios_aplicados: (servicios.data ?? []).map((s) => s.servicio_codigo),
      estados_pelaje: estadosPelaje,
      fotos_por_tipo: fotosPorTipo,
      notas_total: notas.count ?? 0,
      incidencias_total: incidencias.count ?? 0,
    },
  };
}

// ── B · Registrar (DURANTE §8: sin fricción, jamás exigido en caliente) ─────

export async function agregarServicioGrooming(input: {
  grooming_id: string;
  servicio_codigo: string;
  nota?: string;
}): Promise<ResultadoWrapper<{ id: string }, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('agregar_servicio_grooming', {
    p_grooming_id: input.grooming_id,
    p_servicio_codigo: input.servicio_codigo,
    p_nota: input.nota ?? undefined,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true || typeof data.id !== 'string') {
    return fallo('datos_inconsistentes');
  }
  return { ok: true, data: { id: data.id } };
}

export async function quitarServicioGrooming(input: {
  grooming_id: string;
  servicio_codigo: string;
}): Promise<ResultadoWrapper<null, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('quitar_servicio_grooming', {
    p_grooming_id: input.grooming_id,
    p_servicio_codigo: input.servicio_codigo,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true) return fallo('datos_inconsistentes');
  return { ok: true, data: null };
}

export async function registrarEstadoPelajeGrooming(input: {
  grooming_id: string;
  momento: 'recibir' | 'entregar';
  estado_codigo: string;
  nota?: string;
}): Promise<ResultadoWrapper<{ id: string }, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('registrar_estado_pelaje_grooming', {
    p_grooming_id: input.grooming_id,
    p_momento: input.momento,
    p_estado_codigo: input.estado_codigo,
    p_nota: input.nota ?? undefined,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true || typeof data.id !== 'string') {
    return fallo('datos_inconsistentes');
  }
  return { ok: true, data: { id: data.id } };
}

/**
 * El servicio que faltó registrar, agregado EN EL CIERRE (S60-A3 pieza
 * 2 — vía de reparación sobre el patrón de registrar_estado_pelaje_
 * en_cierre): el groomer que terminó sin marcar servicios ya no queda
 * bloqueado del cierre con calidad. Solo AGREGAR — quitar sigue siendo
 * del Durante.
 */
export async function agregarServicioGroomingEnCierre(input: {
  grooming_id: string;
  servicio_codigo: string;
  nota?: string;
}): Promise<ResultadoWrapper<{ id: string }, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('agregar_servicio_grooming_en_cierre', {
    p_grooming_id: input.grooming_id,
    p_servicio_codigo: input.servicio_codigo,
    p_nota: input.nota ?? undefined,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true || typeof data.id !== 'string') {
    return fallo('datos_inconsistentes');
  }
  return { ok: true, data: { id: data.id } };
}

/**
 * El estado de pelaje que faltó, registrado EN EL CIERRE (atención ya
 * 'terminada' — la única escritura que el motor permite post-terminar;
 * repara el piso §8 sin reabrir la sesión).
 */
export async function registrarEstadoPelajeEnCierre(input: {
  grooming_id: string;
  momento: 'recibir' | 'entregar';
  estado_codigo: string;
}): Promise<ResultadoWrapper<{ id: string }, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('registrar_estado_pelaje_en_cierre', {
    p_grooming_id: input.grooming_id,
    p_momento: input.momento,
    p_estado_codigo: input.estado_codigo,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true || typeof data.id !== 'string') {
    return fallo('datos_inconsistentes');
  }
  return { ok: true, data: { id: data.id } };
}

export async function quitarEstadoPelajeGrooming(input: {
  grooming_id: string;
  momento: 'recibir' | 'entregar';
}): Promise<ResultadoWrapper<null, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('quitar_estado_pelaje_grooming', {
    p_grooming_id: input.grooming_id,
    p_momento: input.momento,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true) return fallo('datos_inconsistentes');
  return { ok: true, data: null };
}

export type TipoArchivoGrooming =
  | 'foto_recibir'
  | 'foto_entregar'
  | 'foto_durante'
  | 'foto_incidencia'
  | 'otro';

/** Registra un archivo YA subido al bucket (la subida es de la pantalla). */
export async function registrarArchivoGrooming(input: {
  grooming_id: string;
  storage_path: string;
  tipo: TipoArchivoGrooming;
  descripcion?: string;
}): Promise<ResultadoWrapper<{ id: string }, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('registrar_archivo_grooming', {
    p_grooming_id: input.grooming_id,
    p_storage_path: input.storage_path,
    p_tipo: input.tipo,
    p_descripcion: input.descripcion ?? undefined,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true || typeof data.id !== 'string') {
    return fallo('datos_inconsistentes');
  }
  return { ok: true, data: { id: data.id } };
}

// ── C · Terminar y cerrar (DESPUÉS §8: piso de calidad + devengo) ───────────

/** Termina la sesión. El motor EXIGE foto_entregar (guard web D-270). */
export async function terminarAtencionGrooming(
  groomingId: string,
): Promise<ResultadoWrapper<null, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('terminar_atencion_grooming', {
    p_grooming_id: groomingId,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true) return fallo('datos_inconsistentes');
  return { ok: true, data: null };
}

/**
 * Cierra con calidad: guards del piso §8 + devengo variante (b).
 * `proxima_sesion` (S60-A3 pieza 1): la fecha SUGERIDA §8 — jamás cita,
 * no toca la agenda; viaja con el cierre (ISO YYYY-MM-DD).
 */
export async function cerrarGroomingConCalidad(input: {
  grooming_id: string;
  mensaje_familia?: string;
  proxima_sesion?: string;
}): Promise<ResultadoWrapper<null, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('cerrar_grooming_con_calidad', {
    p_grooming_id: input.grooming_id,
    p_mensaje_familia: input.mensaje_familia ?? undefined,
    p_proxima_sesion: input.proxima_sesion ?? undefined,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true) return fallo('datos_inconsistentes');
  return { ok: true, data: null };
}

// ── El resumen del cierre (reader L-124 contra el shape REAL de la RPC) ─────

export interface FotoResumenGrooming {
  id: string;
  storage_path: string;
  descripcion: string | null;
}

export interface ResumenCierreGrooming {
  grooming_id: string;
  estado: 'terminada' | 'cerrada_con_calidad';
  iniciada_en: string | null;
  terminada_en: string | null;
  cerrada_en: string | null;
  mensaje_familia: string | null;
  tiempo_trabajo_segundos: number;
  servicios_aplicados: { codigo: string; nombre: string }[];
  estados_pelaje: Partial<Record<'recibir' | 'entregar', string>>;
  notas: { id: string; texto: string }[];
  incidencias: { id: string; codigo: string; nombre: string; descripcion: string | null; severidad: string | null }[];
  fotos_por_tipo: Record<string, FotoResumenGrooming[]>;
  fotos_total: number;
  /** S60-A3 pieza 1: la fecha sugerida §8 (eco de la RPC) — NULL honesto. */
  proxima_sesion_sugerida: string | null;
}

function leerTexto(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

export async function obtenerResumenCierreGrooming(
  groomingId: string,
): Promise<ResultadoWrapper<ResumenCierreGrooming, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('obtener_resumen_cierre_grooming', {
    p_grooming_id: groomingId,
  });
  if (error) return fallo(error.message);
  if (
    !esObj(data) ||
    data.ok !== true ||
    typeof data.grooming_id !== 'string' ||
    (data.estado !== 'terminada' && data.estado !== 'cerrada_con_calidad')
  ) {
    return fallo('datos_inconsistentes');
  }

  const servicios: { codigo: string; nombre: string }[] = [];
  if (Array.isArray(data.servicios_aplicados)) {
    for (const s of data.servicios_aplicados) {
      if (esObj(s) && typeof s.codigo === 'string' && typeof s.nombre === 'string') {
        servicios.push({ codigo: s.codigo, nombre: s.nombre });
      }
    }
  }
  const notas: { id: string; texto: string }[] = [];
  if (Array.isArray(data.notas_capturadas)) {
    for (const n of data.notas_capturadas) {
      if (esObj(n) && typeof n.id === 'string' && typeof n.texto === 'string') {
        notas.push({ id: n.id, texto: n.texto });
      }
    }
  }
  const incidencias: ResumenCierreGrooming['incidencias'] = [];
  if (Array.isArray(data.incidencias_capturadas)) {
    for (const i of data.incidencias_capturadas) {
      if (esObj(i) && typeof i.id === 'string' && typeof i.codigo === 'string' && typeof i.nombre === 'string') {
        incidencias.push({
          id: i.id,
          codigo: i.codigo,
          nombre: i.nombre,
          descripcion: leerTexto(i.descripcion),
          severidad: leerTexto(i.severidad),
        });
      }
    }
  }
  const fotosPorTipo: Record<string, FotoResumenGrooming[]> = {};
  let fotosTotal = 0;
  if (esObj(data.fotos_por_tipo)) {
    for (const [tipo, lista] of Object.entries(data.fotos_por_tipo)) {
      if (!Array.isArray(lista)) continue;
      const fotos: FotoResumenGrooming[] = [];
      for (const f of lista) {
        if (esObj(f) && typeof f.id === 'string' && typeof f.storage_path === 'string') {
          fotos.push({ id: f.id, storage_path: f.storage_path, descripcion: leerTexto(f.descripcion) });
        }
      }
      fotosPorTipo[tipo] = fotos;
      fotosTotal += fotos.length;
    }
  }
  // La RPC del cierre no trae los estados de pelaje — se leen directo
  // (RLS): mismo guard que el resto de la lectura del Durante.
  const estados = await getClient()
    .from('evento_grooming_estados_pelaje')
    .select('momento, estado_codigo')
    .eq('grooming_id', groomingId);
  const estadosPelaje: Partial<Record<'recibir' | 'entregar', string>> = {};
  if (!estados.error) {
    for (const e of estados.data ?? []) {
      if (e.momento === 'recibir' || e.momento === 'entregar') {
        estadosPelaje[e.momento] = e.estado_codigo;
      }
    }
  }

  return {
    ok: true,
    data: {
      grooming_id: data.grooming_id,
      estado: data.estado,
      iniciada_en: leerTexto(data.iniciada_en),
      terminada_en: leerTexto(data.terminada_en),
      cerrada_en: leerTexto(data.cerrada_en),
      mensaje_familia: leerTexto(data.mensaje_familia),
      tiempo_trabajo_segundos:
        typeof data.tiempo_trabajo_segundos === 'number' ? data.tiempo_trabajo_segundos : 0,
      servicios_aplicados: servicios,
      estados_pelaje: estadosPelaje,
      notas,
      incidencias,
      fotos_por_tipo: fotosPorTipo,
      fotos_total: fotosTotal,
      proxima_sesion_sugerida: leerTexto(data.proxima_sesion_sugerida),
    },
  };
}

// ── La vista del día del groomer (§8 DESPUÉS, RPC existente) ────────────────

export interface AtencionDiaGrooming {
  grooming_id: string;
  cita_id: string | null;
  mascota_id: string | null;
  estado: 'terminada' | 'cerrada_con_calidad';
  terminada_en: string | null;
  duracion_minutos: number;
}

export interface ResumenDiaGrooming {
  total_atenciones: number;
  cerradas_con_calidad: number;
  terminadas_sin_cerrar: number;
  tiempo_total_minutos: number;
  atenciones: AtencionDiaGrooming[];
}

export async function obtenerResumenDiaGrooming(input: {
  prestador_id: string;
  /** 'YYYY-MM-DD' local. */
  fecha: string;
}): Promise<ResultadoWrapper<ResumenDiaGrooming, CodigoErrorGroomingAtencion>> {
  const { data, error } = await getClient().rpc('obtener_resumen_dia_grooming', {
    p_prestador_id: input.prestador_id,
    p_fecha: input.fecha,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true || !esObj(data.resumen)) return fallo('datos_inconsistentes');
  const r = data.resumen;
  const atenciones: AtencionDiaGrooming[] = [];
  if (Array.isArray(data.atenciones)) {
    for (const a of data.atenciones) {
      if (
        esObj(a) &&
        typeof a.grooming_id === 'string' &&
        (a.estado === 'terminada' || a.estado === 'cerrada_con_calidad')
      ) {
        atenciones.push({
          grooming_id: a.grooming_id,
          cita_id: leerTexto(a.cita_id),
          mascota_id: leerTexto(a.mascota_id),
          estado: a.estado,
          terminada_en: leerTexto(a.terminada_en),
          duracion_minutos: typeof a.duracion_minutos === 'number' ? a.duracion_minutos : 0,
        });
      }
    }
  }
  return {
    ok: true,
    data: {
      total_atenciones: typeof r.total_atenciones === 'number' ? r.total_atenciones : 0,
      cerradas_con_calidad: typeof r.cerradas_con_calidad === 'number' ? r.cerradas_con_calidad : 0,
      terminadas_sin_cerrar:
        typeof r.terminadas_sin_cerrar === 'number' ? r.terminadas_sin_cerrar : 0,
      tiempo_total_minutos:
        typeof r.tiempo_total_minutos === 'number' ? r.tiempo_total_minutos : 0,
      atenciones,
    },
  };
}
