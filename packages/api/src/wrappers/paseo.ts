// Wrappers del flujo de paseo (S44-B3). Patrón canónico del monorepo
// (ver atencion.ts): códigos tipados + normalizarCodigo por prefijo
// (L-115) + guards de shape contra el DDL REAL verificado con
// pg_get_functiondef en el MISMO bloque (L-124, 17/17 asserts contra
// DB viva) + ResultadoWrapper discriminated union.
//
// DECISIÓN B1/T4: pausar_atencion / reanudar_atencion NO se wrappean
// (fuera de F1; el wrapper nace con su disparo).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import type { Database } from '../database.types';

// ── Códigos de error (verificados contra los RAISE de cada body) ────────────

const CODIGOS_ERROR_PASEO = [
  'acceso_denegado',
  'cita_no_encontrada',
  'cita_no_es_paseo',
  'cita_estado_invalido_para_iniciar',
  'atencion_ya_iniciada',
  'atencion_no_existe',
  'atencion_no_en_curso',
  'atencion_estado_invalido',
  'atencion_sin_oficio_paseo',
  'puntos_invalidos',
  'track_excede_limite',
  'gps_motivo_innecesario',
  'gps_motivo_fallo_required',
  'falta_novedad_paseo',
  'novedad_codigo_invalido',
  'novedad_codigo_inactivo',
] as const;

export type CodigoErrorPaseo = (typeof CODIGOS_ERROR_PASEO)[number];

const MENSAJES_ERROR_PASEO: Record<
  CodigoErrorPaseo | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:                   'No tenés acceso a esta cita.',
  cita_no_encontrada:                'La cita no existe o ya no es accesible.',
  cita_no_es_paseo:                  'Esta cita no es de paseo.',
  cita_estado_invalido_para_iniciar: 'La cita no está confirmada: no se puede iniciar el paseo.',
  atencion_ya_iniciada:              'Este paseo ya fue iniciado.',
  atencion_no_existe:                'La atención no existe.',
  atencion_no_en_curso:              'El paseo no está en curso.',
  atencion_estado_invalido:          'El estado del paseo no permite esta acción.',
  atencion_sin_oficio_paseo:         'Esta atención no es un paseo.',
  puntos_invalidos:                  'Los puntos GPS no tienen la forma esperada.',
  track_excede_limite:               'La ruta alcanzó el máximo de puntos GPS.',
  gps_motivo_innecesario:            'Hay ruta registrada: no corresponde motivo de fallo.',
  gps_motivo_fallo_required:         'Sin ruta GPS, contanos qué pasó antes de terminar.',
  falta_novedad_paseo:               'Registrá el parte del perro para poder cerrar.',
  novedad_codigo_invalido:           'La novedad elegida no existe en el catálogo.',
  novedad_codigo_inactivo:           'La novedad elegida ya no está disponible.',
  datos_inconsistentes:              'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:                 'Ocurrió un error inesperado. Probá de nuevo.',
};

function normalizarCodigo(raw: string): CodigoErrorPaseo | 'error_desconocido' {
  if (raw === 'auth_required' || raw === 'no_access_to_prestador' || raw === 'no_access_to_mascota') {
    return 'acceso_denegado';
  }
  if (raw.startsWith('cita_no_existe'))                    return 'cita_no_encontrada';
  if (raw.startsWith('atencion_paseo_ya_existe_para_cita')) return 'atencion_ya_iniciada';
  // Códigos con sufijo ': <detalle>' — normalizar por prefijo (L-115).
  for (const codigo of CODIGOS_ERROR_PASEO) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function mapeoErrorAResultado<T>(mensajeOriginal: string): ResultadoWrapper<T, CodigoErrorPaseo> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES_ERROR_PASEO[codigo] };
}

type Obj = Record<string, unknown>;

function esObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null;
}

// ── Tipos del dominio (derivados del DDL real, no calcados) ──────────────────

export type EstadoAtencionPaseo = 'en_curso' | 'terminada' | 'cerrada_con_calidad';
export type GpsEstadoPaseo = 'registrado' | 'fallido';

/** type (no interface): la index signature implícita lo hace asignable a Json. */
export type PuntoGpsPaseo = {
  lat: number;
  lng: number;
  /** ISO timestamp de la lectura. */
  t: string;
};

/**
 * Contrato ESTABLE de obtener_paseo_por_cita: SIEMPRE las 11 claves.
 * Discriminado por `estado`: null = la cita no tiene paseo iniciado
 * (todo lo demás null / puntos 0); con estado, los ids están
 * garantizados por el DDL (la capa tiene iniciada_en NOT NULL).
 */
export type PaseoPorCita =
  | {
      estado: null;
      evento_atencion_id: null;
      paseo_id: null;
      iniciada_en: null;
      terminada_en: null;
      cerrada_en: null;
      mensaje_familia: null;
      gps_estado: null;
      gps_motivo_fallo: null;
      puntos_track: number;
      mascota_id: null;
    }
  | {
      estado: EstadoAtencionPaseo;
      evento_atencion_id: string;
      paseo_id: string;
      iniciada_en: string;
      terminada_en: string | null;
      cerrada_en: string | null;
      mensaje_familia: string | null;
      gps_estado: GpsEstadoPaseo | null;
      gps_motivo_fallo: string | null;
      puntos_track: number;
      mascota_id: string;
    };

export interface ResultadoIniciarPaseo {
  paseo_id: string;
  evento_atencion_id: string;
  evento_id: string;
  cita_id: string;
  estado: 'en_curso';
}

export interface ResultadoTrackPaseo {
  paseo_id: string;
  puntos_total: number;
}

export interface ResultadoNovedadPaseo {
  id: string;
  paseo_id: string;
}

export interface ResultadoTerminarPaseo {
  paseo_id: string;
  estado: 'terminada';
  terminada_en: string;
  /** Siempre resuelto por la RPC: registrado (hay track) o fallido (motivo). */
  gps_estado: GpsEstadoPaseo;
  pausa_abierta_cerrada_automaticamente: boolean;
}

export interface ResultadoCerrarPaseo {
  paseo_id: string;
  estado: 'cerrada_con_calidad';
  cerrada_en: string;
}

export interface NovedadRegistradaPaseo {
  id: string;
  codigo: string;
  nombre: string;
  grupo: string;
  detalle: string | null;
  created_at: string;
}

export interface ResumenCierrePaseo {
  evento_atencion_id: string;
  paseo_id: string;
  estado: Exclude<EstadoAtencionPaseo, 'en_curso'> | 'en_curso';
  iniciada_en: string;
  terminada_en: string | null;
  cerrada_en: string | null;
  mensaje_familia: string | null;
  tiempo_sesion_segundos: number;
  tiempo_trabajo_segundos: number;
  gps: {
    estado: GpsEstadoPaseo | null;
    motivo_fallo: string | null;
    puntos: number;
  };
  novedades: NovedadRegistradaPaseo[];
  conteos: {
    novedades: number;
    notas: number;
    incidencias: number;
    pausas: number;
    fotos: number;
  };
}

// ── Catálogos (lectura; .from() DENTRO de la puerta única — gate S44-B3) ─────
// Tipos derivados de los Rows generados (regla 34). Solo activos, en el
// orden del catálogo (orden_display).

export type NovedadCatalogoPaseo = Pick<
  Database['public']['Tables']['cat_novedades_paseo']['Row'],
  'codigo' | 'nombre' | 'descripcion' | 'grupo'
>;

export type IncidenciaCatalogoPaseo = Pick<
  Database['public']['Tables']['cat_incidencias_paseo']['Row'],
  'codigo' | 'nombre' | 'descripcion' | 'severidad_sugerida'
>;

/** Catálogo del parte del perro (cat_novedades_paseo, solo activas). */
export async function obtenerNovedadesPaseo(): Promise<
  ResultadoWrapper<NovedadCatalogoPaseo[], CodigoErrorPaseo>
> {
  const { data, error } = await getClient()
    .from('cat_novedades_paseo')
    .select('codigo, nombre, descripcion, grupo')
    .eq('activo', true)
    .order('orden_display', { ascending: true });

  if (error) return mapeoErrorAResultado(error.message);
  return { ok: true, data: data ?? [] };
}

/** Catálogo de incidencias de paseo (cat_incidencias_paseo, solo activas). */
export async function obtenerIncidenciasPaseo(): Promise<
  ResultadoWrapper<IncidenciaCatalogoPaseo[], CodigoErrorPaseo>
> {
  const { data, error } = await getClient()
    .from('cat_incidencias_paseo')
    .select('codigo, nombre, descripcion, severidad_sugerida')
    .eq('activo', true)
    .order('orden_display', { ascending: true });

  if (error) return mapeoErrorAResultado(error.message);
  return { ok: true, data: data ?? [] };
}

// ── Agenda del día (lectura; gate S44-B4.0.a) ────────────────────────────────
// La RLS es el guard (cita_select_prestador + mascotas por acceso): no hay
// RPC de listado y no hace falta. Si el acceso a la mascota caducó, el join
// devuelve mascota null — el consumidor cae a la huella digna.

export type MascotaAgenda = Pick<
  Database['public']['Tables']['mascotas']['Row'],
  'id' | 'nombre' | 'especie' | 'foto_url'
>;

export type CitaAgendaPaseo = Pick<
  Database['public']['Tables']['evento_cita_servicio']['Row'],
  'id' | 'fecha' | 'hora' | 'estado' | 'tipo_servicio'
> & {
  mascota: MascotaAgenda | null;
  tipo: Pick<
    Database['public']['Tables']['tipos_servicio']['Row'],
    'nombre' | 'duracion_default_minutos'
  >;
  /**
   * Estado de la atención por el UNIQUE(cita_id, mascota_id) — B4.1-fix.
   * null = la cita aún no tiene atención (sin_iniciar). La agenda decide
   * el tratamiento visual con esto, no con cita.estado.
   */
  atencion: Pick<Database['public']['Tables']['evento_atencion']['Row'], 'estado' | 'iniciada_en'> | null;
};

export interface InputCitasPaseoDelDia {
  prestador_id: string;
  /** 'YYYY-MM-DD' (fecha local del dispositivo — la resuelve la pantalla). */
  fecha: string;
}

/** Citas de paseo del día del prestador (excluye canceladas/rechazadas), por hora. */
export async function obtenerCitasPaseoDelDia(
  input: InputCitasPaseoDelDia,
): Promise<ResultadoWrapper<CitaAgendaPaseo[], CodigoErrorPaseo>> {
  const { data, error } = await getClient()
    .from('evento_cita_servicio')
    .select(
      'id, fecha, hora, estado, tipo_servicio, mascota:mascotas(id, nombre, especie, foto_url), tipo:tipos_servicio!inner(nombre, duracion_default_minutos), atencion:evento_atencion(estado, iniciada_en)',
    )
    .eq('prestador_id', input.prestador_id)
    .eq('fecha', input.fecha)
    .eq('tipo.categoria', 'paseo')
    // ═══ VERDAD FIRME (S51-B3.2, DISEÑO_EXPERIENCIA §13 / test 8) ═══
    // La agenda del prestador SOLO contiene citas firmes: lista POSITIVA
    // explícita. 'pendiente' es tentativa y NO se pinta — cuando B2 cree
    // el bloqueo temporal pre-pago vivirá en ese estado y jamás será
    // visible acá (la cita aparece cuando el pago la confirma).
    // Relevado S51: estados del CHECK = pendiente · confirmada · en_curso
    // · completada · cancelada · no_show · rechazada.
    .in('estado', ['confirmada', 'en_curso', 'completada', 'no_show'])
    .order('hora', { ascending: true });

  if (error) return mapeoErrorAResultado(error.message);
  // PostgREST embebe `atencion` como array (la FK cita→atención es to-many).
  // El UNIQUE(cita_id, mascota_id) + una mascota por cita → 0 o 1 fila; si
  // hubiera más, nos quedamos con la de iniciada_en más reciente (Ley 7).
  const citas: CitaAgendaPaseo[] = (data ?? []).map((c) => {
    const atenciones = (c.atencion ?? []) as { estado: string; iniciada_en: string }[];
    const atencion =
      atenciones.length === 0
        ? null
        : atenciones.reduce((a, b) => (b.iniciada_en > a.iniciada_en ? b : a));
    return { ...c, atencion };
  });
  return { ok: true, data: citas };
}

// ── Track para el mapa del Cierre (lectura; decisión técnica B4.4:
// el resumen server-side trae solo el conteo — los puntos viven en
// eventos_mascota_paseo.track_gps y la RLS por mascota es el guard) ─────────

export async function obtenerTrackPaseo(
  eventoAtencionId: string,
): Promise<ResultadoWrapper<PuntoGpsPaseo[], CodigoErrorPaseo>> {
  const { data, error } = await getClient()
    .from('eventos_mascota_paseo')
    .select('track_gps')
    .eq('evento_atencion_id', eventoAtencionId)
    .maybeSingle();

  if (error) return mapeoErrorAResultado(error.message);
  if (data === null) return { ok: false, codigo: 'atencion_sin_oficio_paseo', mensaje: MENSAJES_ERROR_PASEO.atencion_sin_oficio_paseo };

  const crudo = data.track_gps;
  if (crudo === null) return { ok: true, data: [] };
  if (!Array.isArray(crudo)) return mapeoErrorAResultado('datos_inconsistentes');
  const puntos: PuntoGpsPaseo[] = [];
  for (const item of crudo) {
    if (typeof item !== 'object' || item === null) return mapeoErrorAResultado('datos_inconsistentes');
    const o = item as Record<string, unknown>;
    if (typeof o.lat !== 'number' || typeof o.lng !== 'number' || typeof o.t !== 'string') {
      return mapeoErrorAResultado('datos_inconsistentes');
    }
    puntos.push({ lat: o.lat, lng: o.lng, t: o.t });
  }
  return { ok: true, data: puntos };
}

// ── A · Iniciar ───────────────────────────────────────────────────────────────

export interface InputIniciarPaseo {
  cita_id: string;
  empleado_id?: string;
}

/** Inicia el paseo de una cita confirmada. 3 INSERTs (hito→capa→oficio) + cita→en_curso. */
export async function iniciarAtencionPaseo(
  input: InputIniciarPaseo,
): Promise<ResultadoWrapper<ResultadoIniciarPaseo, CodigoErrorPaseo>> {
  const { data, error } = await getClient().rpc('iniciar_atencion_paseo', {
    p_cita_id:     input.cita_id,
    p_empleado_id: input.empleado_id ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);
  if (!esObj(data)) return mapeoErrorAResultado('datos_inconsistentes');
  const o = data;
  if (
    o.ok !== true ||
    typeof o.paseo_id !== 'string' ||
    typeof o.evento_atencion_id !== 'string' ||
    typeof o.evento_id !== 'string' ||
    typeof o.cita_id !== 'string' ||
    o.estado !== 'en_curso'
  ) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      paseo_id:           o.paseo_id,
      evento_atencion_id: o.evento_atencion_id,
      evento_id:          o.evento_id,
      cita_id:            o.cita_id,
      estado:             'en_curso',
    },
  };
}

// ── B · Track GPS ─────────────────────────────────────────────────────────────

export interface InputRegistrarTrack {
  evento_atencion_id: string;
  puntos: PuntoGpsPaseo[];
  /** default true (append). false reemplaza el track completo. */
  append?: boolean;
}

/** Suma puntos al track (cap 10000). Retorno REAL: {ok, paseo_id, puntos_total}. */
export async function registrarTrackPaseo(
  input: InputRegistrarTrack,
): Promise<ResultadoWrapper<ResultadoTrackPaseo, CodigoErrorPaseo>> {
  const { data, error } = await getClient().rpc('registrar_track_paseo', {
    p_atencion_id: input.evento_atencion_id,
    p_puntos:      input.puntos,
    p_append:      input.append ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);
  if (!esObj(data)) return mapeoErrorAResultado('datos_inconsistentes');
  const o = data;
  if (o.ok !== true || typeof o.paseo_id !== 'string' || typeof o.puntos_total !== 'number') {
    return mapeoErrorAResultado('datos_inconsistentes');
  }
  return { ok: true, data: { paseo_id: o.paseo_id, puntos_total: o.puntos_total } };
}

// ── C · Novedad (el parte del perro) ─────────────────────────────────────────

export interface InputAgregarNovedad {
  evento_atencion_id: string;
  novedad_codigo: string;
  detalle?: string;
}

/** Registra una novedad del catálogo (acepta en_curso Y terminada — el parte se hace al entregar). */
export async function agregarNovedadPaseo(
  input: InputAgregarNovedad,
): Promise<ResultadoWrapper<ResultadoNovedadPaseo, CodigoErrorPaseo>> {
  const { data, error } = await getClient().rpc('agregar_novedad_paseo', {
    p_atencion_id:    input.evento_atencion_id,
    p_novedad_codigo: input.novedad_codigo,
    p_detalle:        input.detalle ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);
  if (!esObj(data)) return mapeoErrorAResultado('datos_inconsistentes');
  const o = data;
  if (o.ok !== true || typeof o.id !== 'string' || typeof o.paseo_id !== 'string') {
    return mapeoErrorAResultado('datos_inconsistentes');
  }
  return { ok: true, data: { id: o.id, paseo_id: o.paseo_id } };
}

// ── D · Terminar ──────────────────────────────────────────────────────────────

export interface InputTerminarPaseo {
  evento_atencion_id: string;
  /** Obligatorio si NO hay track (simetría estricta de la RPC). */
  gps_motivo_fallo?: string;
}

export async function terminarAtencionPaseo(
  input: InputTerminarPaseo,
): Promise<ResultadoWrapper<ResultadoTerminarPaseo, CodigoErrorPaseo>> {
  const { data, error } = await getClient().rpc('terminar_atencion_paseo', {
    p_atencion_id:      input.evento_atencion_id,
    p_gps_motivo_fallo: input.gps_motivo_fallo ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);
  if (!esObj(data)) return mapeoErrorAResultado('datos_inconsistentes');
  const o = data;
  if (
    o.ok !== true ||
    typeof o.paseo_id !== 'string' ||
    o.estado !== 'terminada' ||
    typeof o.terminada_en !== 'string' ||
    (o.gps_estado !== 'registrado' && o.gps_estado !== 'fallido') ||
    typeof o.pausa_abierta_cerrada_automaticamente !== 'boolean'
  ) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      paseo_id:     o.paseo_id,
      estado:       'terminada',
      terminada_en: o.terminada_en,
      gps_estado:   o.gps_estado,
      pausa_abierta_cerrada_automaticamente: o.pausa_abierta_cerrada_automaticamente,
    },
  };
}

// ── E · Cerrar con calidad ────────────────────────────────────────────────────

export interface InputCerrarPaseo {
  evento_atencion_id: string;
  mensaje_familia?: string;
}

/** Cierre único (DM-S40.1): exige el parte (falta_novedad_paseo) y completa el turno. */
export async function cerrarPaseoConCalidad(
  input: InputCerrarPaseo,
): Promise<ResultadoWrapper<ResultadoCerrarPaseo, CodigoErrorPaseo>> {
  const { data, error } = await getClient().rpc('cerrar_paseo_con_calidad', {
    p_atencion_id:     input.evento_atencion_id,
    p_mensaje_familia: input.mensaje_familia ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);
  if (!esObj(data)) return mapeoErrorAResultado('datos_inconsistentes');
  const o = data;
  if (
    o.ok !== true ||
    typeof o.paseo_id !== 'string' ||
    o.estado !== 'cerrada_con_calidad' ||
    typeof o.cerrada_en !== 'string'
  ) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }
  return { ok: true, data: { paseo_id: o.paseo_id, estado: 'cerrada_con_calidad', cerrada_en: o.cerrada_en } };
}

// ── F · Lookup por cita (la columna de estado de las 4 pantallas de B4) ─────

function esEstadoAtencion(v: unknown): v is EstadoAtencionPaseo {
  return v === 'en_curso' || v === 'terminada' || v === 'cerrada_con_calidad';
}

function esGpsEstado(v: unknown): v is GpsEstadoPaseo {
  return v === 'registrado' || v === 'fallido';
}

export async function obtenerPaseoPorCita(
  citaId: string,
): Promise<ResultadoWrapper<PaseoPorCita, CodigoErrorPaseo>> {
  const { data, error } = await getClient().rpc('obtener_paseo_por_cita', {
    p_cita_id: citaId,
  });

  if (error) return mapeoErrorAResultado(error.message);
  if (!esObj(data) || data.ok !== true || !esObj(data.data)) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }
  const p = data.data;

  // Rama sin iniciar: el contrato garantiza el resto null / puntos 0.
  if (p.estado === null) {
    return {
      ok: true,
      data: {
        estado: null,
        evento_atencion_id: null,
        paseo_id: null,
        iniciada_en: null,
        terminada_en: null,
        cerrada_en: null,
        mensaje_familia: null,
        gps_estado: null,
        gps_motivo_fallo: null,
        puntos_track: typeof p.puntos_track === 'number' ? p.puntos_track : 0,
        mascota_id: null,
      },
    };
  }

  if (
    !esEstadoAtencion(p.estado) ||
    typeof p.evento_atencion_id !== 'string' ||
    typeof p.paseo_id !== 'string' ||
    typeof p.iniciada_en !== 'string' ||
    typeof p.mascota_id !== 'string' ||
    typeof p.puntos_track !== 'number' ||
    (p.terminada_en !== null && typeof p.terminada_en !== 'string') ||
    (p.cerrada_en !== null && typeof p.cerrada_en !== 'string') ||
    (p.mensaje_familia !== null && typeof p.mensaje_familia !== 'string') ||
    (p.gps_estado !== null && !esGpsEstado(p.gps_estado)) ||
    (p.gps_motivo_fallo !== null && typeof p.gps_motivo_fallo !== 'string')
  ) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      estado:             p.estado,
      evento_atencion_id: p.evento_atencion_id,
      paseo_id:           p.paseo_id,
      iniciada_en:        p.iniciada_en,
      terminada_en:       p.terminada_en as string | null,
      cerrada_en:         p.cerrada_en as string | null,
      mensaje_familia:    p.mensaje_familia as string | null,
      gps_estado:         p.gps_estado as GpsEstadoPaseo | null,
      gps_motivo_fallo:   p.gps_motivo_fallo as string | null,
      puntos_track:       p.puntos_track,
      mascota_id:         p.mascota_id,
    },
  };
}

// ── G · Resumen de cierre (un solo round-trip) ───────────────────────────────

export async function obtenerResumenCierrePaseo(
  eventoAtencionId: string,
): Promise<ResultadoWrapper<ResumenCierrePaseo, CodigoErrorPaseo>> {
  const { data, error } = await getClient().rpc('obtener_resumen_cierre_paseo', {
    p_atencion_id: eventoAtencionId,
  });

  if (error) return mapeoErrorAResultado(error.message);
  if (!esObj(data) || data.ok !== true || !esObj(data.data)) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }
  const p = data.data;

  if (
    typeof p.evento_atencion_id !== 'string' ||
    typeof p.paseo_id !== 'string' ||
    !esEstadoAtencion(p.estado) ||
    typeof p.iniciada_en !== 'string' ||
    (p.terminada_en !== null && typeof p.terminada_en !== 'string') ||
    (p.cerrada_en !== null && typeof p.cerrada_en !== 'string') ||
    (p.mensaje_familia !== null && typeof p.mensaje_familia !== 'string') ||
    typeof p.tiempo_sesion_segundos !== 'number' ||
    typeof p.tiempo_trabajo_segundos !== 'number' ||
    !esObj(p.gps) ||
    !Array.isArray(p.novedades) ||
    !esObj(p.conteos)
  ) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }

  const g = p.gps;
  if (
    (g.estado !== null && !esGpsEstado(g.estado)) ||
    (g.motivo_fallo !== null && typeof g.motivo_fallo !== 'string') ||
    typeof g.puntos !== 'number'
  ) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }

  const novedades: NovedadRegistradaPaseo[] = [];
  for (const item of p.novedades) {
    if (!esObj(item)) return mapeoErrorAResultado('datos_inconsistentes');
    if (
      typeof item.id !== 'string' ||
      typeof item.codigo !== 'string' ||
      typeof item.nombre !== 'string' ||
      typeof item.grupo !== 'string' ||
      (item.detalle !== null && typeof item.detalle !== 'string') ||
      typeof item.created_at !== 'string'
    ) {
      return mapeoErrorAResultado('datos_inconsistentes');
    }
    novedades.push({
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      grupo: item.grupo,
      detalle: item.detalle as string | null,
      created_at: item.created_at,
    });
  }

  const c = p.conteos;
  if (
    typeof c.novedades !== 'number' ||
    typeof c.notas !== 'number' ||
    typeof c.incidencias !== 'number' ||
    typeof c.pausas !== 'number' ||
    typeof c.fotos !== 'number'
  ) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }

  return {
    ok: true,
    data: {
      evento_atencion_id:      p.evento_atencion_id,
      paseo_id:                p.paseo_id,
      estado:                  p.estado,
      iniciada_en:             p.iniciada_en,
      terminada_en:            p.terminada_en as string | null,
      cerrada_en:              p.cerrada_en as string | null,
      mensaje_familia:         p.mensaje_familia as string | null,
      tiempo_sesion_segundos:  p.tiempo_sesion_segundos,
      tiempo_trabajo_segundos: p.tiempo_trabajo_segundos,
      gps: {
        estado:       g.estado as GpsEstadoPaseo | null,
        motivo_fallo: g.motivo_fallo as string | null,
        puntos:       g.puntos,
      },
      novedades,
      conteos: {
        novedades:   c.novedades,
        notas:       c.notas,
        incidencias: c.incidencias,
        pausas:      c.pausas,
        fotos:       c.fotos,
      },
    },
  };
}
