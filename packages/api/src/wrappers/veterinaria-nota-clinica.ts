// LA CONSTELACIÓN DE LA NOTA CLÍNICA (S70-A2) — wrappers de la puerta única.
//   estructurarNotaClinica  → Edge Function estructurar-nota-clinica (borrador IA)
//   sedimentarNotaClinica   → RPC sedimentar_nota_clinica (la nota CONFIRMADA)
//   abrirCasoClinico        → RPC abrir_caso_clinico
//   asociarACaso            → RPC asociar_a_caso
// Firmas verificadas con pg_get_functiondef (migración 20260719150000).

import { FunctionsHttpError } from '@supabase/supabase-js';

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

// ── Borrador IA (Edge Function) ──────────────────────────────────────────────

/** Un medicamento del borrador estructurado. dosis/frecuencia pueden venir
 *  null si la IA no pudo parsear la posología (el vet los completa). */
export interface ItemFormula {
  nombre: string;
  presentacion: string | null;
  cantidad: number | null;
  dosis: string | null;
  frecuencia: string | null;
  duracionDias: number | null;
  via: string | null;
  indicaciones: string | null;
}

/** Vitales SOLO medidos (con número dictado). Claves ausentes = no medido. */
export interface VitalesMedidos {
  pesoKg?: number;
  temperaturaC?: number;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  condicionCorporal?: number;
}

export interface NotaEstructurada {
  motivo: string | null;
  anamnesis: string | null;
  examen: string | null;
  diagnostico: string | null;
  planTerapeutico: string | null;
  planDiagnostico: string[];
  proximoControl: string | null;
  vitales: VitalesMedidos;
  formula: ItemFormula[];
}

const CODIGOS_ESTRUCTURAR = [
  'entrada_invalida',
  'configuracion_faltante',
  'error_modelo',
  'estructuracion_fallida',
] as const;
type CodigoEstructurar = (typeof CODIGOS_ESTRUCTURAR)[number];

const MENSAJES_ESTRUCTURAR: Record<CodigoEstructurar | 'error_desconocido' | 'datos_inconsistentes', string> = {
  entrada_invalida: 'No pudimos leer el dictado. Revisá el texto e intentá de nuevo.',
  configuracion_faltante: 'El asistente de notas no está disponible en este momento.',
  error_modelo: 'No pudimos estructurar la nota ahora. Probá de nuevo en un rato.',
  estructuracion_fallida: 'No pudimos estructurar el dictado. Revisalo y probá de nuevo.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido: 'Ocurrió un error inesperado. Probá de nuevo.',
};

function numOnull(v: unknown): number | null {
  return typeof v === 'number' ? v : null;
}

function mapItemFormula(v: Record<string, unknown>): ItemFormula {
  return {
    nombre: String(v['nombre'] ?? ''),
    presentacion: str(v['presentacion']),
    cantidad: numOnull(v['cantidad']),
    dosis: str(v['dosis']),
    frecuencia: str(v['frecuencia']),
    duracionDias: numOnull(v['duracion_dias']),
    via: str(v['via']),
    indicaciones: str(v['indicaciones']),
  };
}

function mapVitales(v: unknown): VitalesMedidos {
  const o = esObj(v) ? v : {};
  const out: VitalesMedidos = {};
  if (typeof o['peso_kg'] === 'number') out.pesoKg = o['peso_kg'];
  if (typeof o['temperatura_c'] === 'number') out.temperaturaC = o['temperatura_c'];
  if (typeof o['frecuencia_cardiaca'] === 'number') out.frecuenciaCardiaca = o['frecuencia_cardiaca'];
  if (typeof o['frecuencia_respiratoria'] === 'number') out.frecuenciaRespiratoria = o['frecuencia_respiratoria'];
  if (typeof o['condicion_corporal'] === 'number') out.condicionCorporal = o['condicion_corporal'];
  return out;
}

export interface EstructurarInput {
  texto: string;
  especie?: string;
  motivo?: string;
}

/** Estructura el dictado libre del vet en un BORRADOR de nota. La IA jamás
 *  agrega contenido no dictado (muro §8.3); el vet confirma antes de sedimentar. */
export async function estructurarNotaClinica(
  input: EstructurarInput,
): Promise<ResultadoWrapper<NotaEstructurada, CodigoEstructurar>> {
  const { data, error } = await getClient().functions.invoke('estructurar-nota-clinica', {
    body: { texto: input.texto, especie: input.especie, motivo: input.motivo },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const cuerpo: unknown = await error.context.json();
        const codigo = esObj(cuerpo) ? cuerpo['codigo'] : null;
        if (typeof codigo === 'string' && (CODIGOS_ESTRUCTURAR as readonly string[]).includes(codigo)) {
          const c = codigo as CodigoEstructurar;
          return { ok: false, codigo: c, mensaje: MENSAJES_ESTRUCTURAR[c] };
        }
      } catch {
        /* body no-JSON */
      }
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_ESTRUCTURAR.error_desconocido };
  }

  const nota = esObj(data) ? data['nota'] : null;
  if (!esObj(nota)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ESTRUCTURAR.datos_inconsistentes };
  }
  const formulaRaw = Array.isArray(nota['formula']) ? nota['formula'] : [];
  const planRaw = Array.isArray(nota['plan_diagnostico']) ? nota['plan_diagnostico'] : [];
  return {
    ok: true,
    data: {
      motivo: str(nota['motivo']),
      anamnesis: str(nota['anamnesis']),
      examen: str(nota['examen']),
      diagnostico: str(nota['diagnostico']),
      planTerapeutico: str(nota['plan_terapeutico']),
      planDiagnostico: planRaw.filter((x): x is string => typeof x === 'string'),
      proximoControl: str(nota['proximo_control']),
      vitales: mapVitales(nota['vitales']),
      formula: formulaRaw.filter(esObj).map(mapItemFormula),
    },
  };
}

// ── Sedimento + caso (RPCs) ──────────────────────────────────────────────────

const CODIGOS_SEDIMENTO = [
  'acceso_denegado',
  'no_opera_cuenta',
  'sin_acceso_mascota',
  'cita_requerida',
  'hc_ya_existe',
  'nota_sin_motivo',
  'nota_sin_diagnostico',
  'cuenta_sin_prestador',
  'posologia_incompleta',
  'medicamento_sin_nombre',
  'condicion_sin_nombre',
  'alergia_sin_alergeno',
  'alergia_sin_severidad',
  'condicion_requerida',
  'no_es_tratante',
  'datos_invalidos',
] as const;
export type CodigoErrorSedimento = (typeof CODIGOS_SEDIMENTO)[number];

const MENSAJES_SEDIMENTO: Record<CodigoErrorSedimento, string> = {
  acceso_denegado: 'Tu sesión no está activa. Iniciá sesión de nuevo.',
  no_opera_cuenta: 'No operás este negocio.',
  sin_acceso_mascota: 'No tenés acceso a esta mascota.',
  cita_requerida: 'Falta la cita de la consulta.',
  hc_ya_existe: 'Esta consulta ya tiene una historia clínica registrada.',
  nota_sin_motivo: 'La nota necesita un motivo de consulta.',
  nota_sin_diagnostico: 'La nota necesita un diagnóstico.',
  cuenta_sin_prestador: 'El negocio no tiene un profesional configurado.',
  posologia_incompleta: 'Una medicación no tiene dosis o frecuencia. Completala antes de guardar.',
  medicamento_sin_nombre: 'Una medicación no tiene nombre.',
  condicion_sin_nombre: 'Una condición crónica no tiene nombre.',
  alergia_sin_alergeno: 'Una alergia no tiene alérgeno.',
  alergia_sin_severidad: 'Una alergia no tiene severidad.',
  condicion_requerida: 'El caso necesita una condición.',
  no_es_tratante: 'No sos la clínica tratante de este caso.',
  datos_invalidos: 'Revisá los datos de la nota.',
};

function falloSedimento<T>(error: { code?: string; message: string }): ResultadoWrapper<T, CodigoErrorSedimento> {
  if (error.code === '23514' || error.code === '23503') return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES_SEDIMENTO.datos_invalidos };
  const raw = error.message;
  if (raw.startsWith('auth_required')) return { ok: false, codigo: 'acceso_denegado', mensaje: MENSAJES_SEDIMENTO.acceso_denegado };
  for (const c of CODIGOS_SEDIMENTO) if (raw.startsWith(c)) return { ok: false, codigo: c, mensaje: MENSAJES_SEDIMENTO[c] };
  return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES_SEDIMENTO.datos_invalidos };
}

/** Un medicamento confirmado (dosis/frecuencia ya NOT NULL). */
export type FormulaConfirmada = {
  nombre: string;
  principio_activo?: string | null;
  concentracion?: string | null;
  presentacion?: string | null;
  cantidad?: number | string | null;
  dosis: string;
  frecuencia: string;
  duracion_dias?: number | string | null;
  via?: string | null;
  indicaciones?: string | null;
}
export type CondicionConfirmada = {
  condicion: string;
  cie_codigo?: string | null;
  fecha_diagnostico?: string | null;
  diagnostico_descripcion?: string | null;
  manejo_actual?: string | null;
  seguimiento_recomendado?: string | null;
  estado?: string | null;
}
export type AlergiaConfirmada = {
  alergeno: string;
  severidad: string;
  categoria_alergeno?: string | null;
  reaccion_descripcion?: string | null;
  fecha_diagnostico?: string | null;
  metodo_diagnostico?: string | null;
  manejo_recomendado?: string | null;
  estado?: string | null;
}
export type VitalesConfirmados = {
  peso_kg?: number | string | null;
  temperatura_c?: number | string | null;
  frecuencia_cardiaca?: number | string | null;
  frecuencia_respiratoria?: number | string | null;
  condicion_corporal?: number | string | null;
  peso_metodo?: string | null;
}

/** La nota CONFIRMADA por el vet (post-edición), lista para sedimentar. Las
 *  claves espejan el contrato del RPC (snake_case en el jsonb). */
export type NotaConfirmada = {
  motivo: string;
  diagnostico: string;
  anamnesis?: string | null;
  examen?: string | null;
  cie_codigo?: string | null;
  plan_terapeutico?: string | null;
  indicaciones?: string | null;
  diagnosticos_secundarios?: string[];
  proximo_control?: string | null;
  requiere_hospitalizacion?: boolean;
  requiere_cirugia?: boolean;
  vitales?: VitalesConfirmados;
  formula?: FormulaConfirmada[];
  plan_diagnostico?: string[];
  condiciones_cronicas?: CondicionConfirmada[];
  alergias?: AlergiaConfirmada[];
}

/** Referencia al caso: nuevo (con condición) | existente (por id) | null. */
export type CasoRef =
  | { modo: 'nuevo'; condicion: string; horizonte?: string | null }
  | { modo: 'existente'; caso_id: string }
  | null;

export interface SedimentarInput {
  citaId: string;
  cuentaComercialId: string;
  empleadoId: string;
  mascotaId: string;
  nota: NotaConfirmada;
  caso?: CasoRef;
  countryCode?: string;
}

export interface ResultadoSedimento {
  eventoHcId: string;
  casoId: string | null;
  medicaciones: number;
  examenes: number;
  pesoMedido: boolean;
  condiciones: number;
  alergias: number;
  colgadoDeCitaEvento: boolean;
}

/** Escribe la constelación confirmada en UNA transacción. La medicación
 *  propaga sola a medicacion_actual del perfil (trigger existente). */
export async function sedimentarNotaClinica(
  input: SedimentarInput,
): Promise<ResultadoWrapper<ResultadoSedimento, CodigoErrorSedimento>> {
  const { data, error } = await getClient().rpc('sedimentar_nota_clinica', {
    p_cita_id: input.citaId,
    p_cuenta_comercial_id: input.cuentaComercialId,
    p_empleado_id: input.empleadoId,
    p_mascota_id: input.mascotaId,
    p_nota: input.nota,
    p_caso: input.caso ?? undefined,
    p_country_code: input.countryCode ?? 'EC',
  });
  if (error) return falloSedimento(error);
  if (!esObj(data) || data['ok'] !== true) {
    return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES_SEDIMENTO.datos_invalidos };
  }
  return {
    ok: true,
    data: {
      eventoHcId: String(data['evento_hc_id']),
      casoId: str(data['caso_id']),
      medicaciones: Number(data['medicaciones'] ?? 0),
      examenes: Number(data['examenes'] ?? 0),
      pesoMedido: data['peso_medido'] === true,
      condiciones: Number(data['condiciones'] ?? 0),
      alergias: Number(data['alergias'] ?? 0),
      colgadoDeCitaEvento: data['colgado_de_cita_evento'] === true,
    },
  };
}

export interface AbrirCasoInput {
  mascotaId: string;
  condicion: string;
  cuentaComercialId: string;
  empleadoId?: string | null;
  horizonte?: string | null;
  eventoOrigen?: string | null;
  countryCode?: string;
}

/** Abre un caso clínico (agrupa, nunca exige) + su productor de evento. */
export async function abrirCasoClinico(
  input: AbrirCasoInput,
): Promise<ResultadoWrapper<string, CodigoErrorSedimento>> {
  const { data, error } = await getClient().rpc('abrir_caso_clinico', {
    p_mascota_id: input.mascotaId,
    p_condicion: input.condicion,
    p_cuenta_comercial_id: input.cuentaComercialId,
    p_empleado_id: input.empleadoId ?? undefined,
    p_horizonte: input.horizonte ?? undefined,
    p_evento_origen: input.eventoOrigen ?? undefined,
    p_country_code: input.countryCode ?? 'EC',
  });
  if (error) return falloSedimento(error);
  const id = str(data);
  if (id === null) return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES_SEDIMENTO.datos_invalidos };
  return { ok: true, data: id };
}

/** Asocia una cita (y sus tipadas por cita_id) a un caso existente. */
export async function asociarACaso(
  casoId: string,
  citaId: string,
): Promise<ResultadoWrapper<true, CodigoErrorSedimento>> {
  const { error } = await getClient().rpc('asociar_a_caso', { p_caso_id: casoId, p_cita_id: citaId });
  if (error) return falloSedimento(error);
  return { ok: true, data: true };
}

// ── EL PARTE del dueño (cara cliente, S70-A4) ────────────────────────────────

/** Un medicamento tal cual salió de la consulta (original clínico preservado). */
export interface ItemFormulaParte {
  nombre: string;
  presentacion: string | null;
  cantidad: number | null;
  dosis: string | null;
  frecuencia: string | null;
  duracionDias: number | null;
  via: string | null;
  indicaciones: string | null;
  principioActivo: string | null;
}

export interface ParteConsulta {
  eventoId: string;
  mascotaId: string;
  fecha: string;
  negocioNombre: string | null;
  consulta: {
    motivo: string | null;
    diagnostico: string | null;
    anamnesis: string | null;
    examen: string | null;
    planTerapeutico: string | null;
    indicaciones: string | null;
  };
  vitales: VitalesMedidos;
  formula: ItemFormulaParte[];
  examenes: Array<{ tipoExamen: string; estado: string }>;
  proximoControl: string | null;
  casoCondicion: string | null;
}

function mapExamenParte(e: Record<string, unknown>): { tipoExamen: string; estado: string } {
  return { tipoExamen: String(e['tipo_examen'] ?? ''), estado: String(e['estado'] ?? '') };
}

function mapItemParte(v: Record<string, unknown>): ItemFormulaParte {
  return {
    nombre: String(v['nombre'] ?? ''),
    presentacion: str(v['presentacion']),
    cantidad: numOnull(v['cantidad']),
    dosis: str(v['dosis']),
    frecuencia: str(v['frecuencia']),
    duracionDias: numOnull(v['duracion_dias']),
    via: str(v['via']),
    indicaciones: str(v['indicaciones']),
    principioActivo: str(v['principio_activo']),
  };
}

/** El parte de una consulta clínica en la cara del dueño. RLS por familia. */
export async function obtenerParteConsulta(
  eventoId: string,
): Promise<ResultadoWrapper<ParteConsulta, 'parte_no_encontrado' | 'sin_acceso' | 'datos_invalidos'>> {
  const { data, error } = await getClient().rpc('obtener_parte_consulta', { p_evento_id: eventoId });
  if (error) {
    if (error.message.startsWith('parte_no_encontrado')) return { ok: false, codigo: 'parte_no_encontrado', mensaje: 'Este parte ya no está disponible.' };
    if (error.message.startsWith('sin_acceso')) return { ok: false, codigo: 'sin_acceso', mensaje: 'No tenés acceso a este parte.' };
    return { ok: false, codigo: 'datos_invalidos', mensaje: 'No pudimos cargar el parte.' };
  }
  if (!esObj(data)) return { ok: false, codigo: 'datos_invalidos', mensaje: 'No pudimos cargar el parte.' };
  const consulta = esObj(data['consulta']) ? data['consulta'] : {};
  const formulaRaw: unknown[] = Array.isArray(data['formula']) ? data['formula'] : [];
  const examenesRaw: unknown[] = Array.isArray(data['examenes']) ? data['examenes'] : [];
  return {
    ok: true,
    data: {
      eventoId: String(data['evento_id']),
      mascotaId: String(data['mascota_id']),
      fecha: String(data['fecha'] ?? ''),
      negocioNombre: str(data['negocio_nombre']),
      consulta: {
        motivo: str(consulta['motivo']),
        diagnostico: str(consulta['diagnostico']),
        anamnesis: str(consulta['anamnesis']),
        examen: str(consulta['examen']),
        planTerapeutico: str(consulta['plan_terapeutico']),
        indicaciones: str(consulta['indicaciones']),
      },
      vitales: mapVitales(data['vitales']),
      formula: formulaRaw.filter(esObj).map(mapItemParte),
      examenes: examenesRaw.filter(esObj).map(mapExamenParte),
      proximoControl: str(data['proximo_control']),
      casoCondicion: str(data['caso_condicion']),
    },
  };
}

// ── S70-A10: casos activos de la mascota (camino prestador) ──────────────────

export interface CasoActivo {
  casoId: string;
  condicion: string;
  fechaApertura: string;
  horizonteProximoEvento: string | null;
  empleadoTratanteId: string | null;
  /** true si la cuenta consultante es la tratante (da la voz de la Confirmación). */
  esTratante: boolean;
}

export type CodigoErrorCasos = 'acceso_denegado' | 'no_opera_cuenta' | 'sin_acceso_mascota' | 'datos_invalidos';

const MENSAJES_CASOS: Record<CodigoErrorCasos, string> = {
  acceso_denegado: 'Tu sesión no está activa. Iniciá sesión de nuevo.',
  no_opera_cuenta: 'No operás este negocio.',
  sin_acceso_mascota: 'No tenés acceso a esta mascota.',
  datos_invalidos: 'No pudimos cargar los casos.',
};

/** Los casos clínicos activos de la mascota, legibles por la cuenta que
 *  atiende (acceso vigente). Consumidores: el Antes + el bloque caso. */
export async function obtenerCasosActivosMascota(
  mascotaId: string,
  cuentaComercialId: string,
): Promise<ResultadoWrapper<CasoActivo[], CodigoErrorCasos>> {
  const { data, error } = await getClient()
    .rpc('obtener_casos_activos_mascota', { p_mascota_id: mascotaId, p_cuenta_comercial_id: cuentaComercialId })
    .returns<Record<string, unknown>[]>();
  if (error) {
    const raw = error.message;
    if (raw.startsWith('auth_required')) return { ok: false, codigo: 'acceso_denegado', mensaje: MENSAJES_CASOS.acceso_denegado };
    for (const c of ['no_opera_cuenta', 'sin_acceso_mascota'] as const) {
      if (raw.startsWith(c)) return { ok: false, codigo: c, mensaje: MENSAJES_CASOS[c] };
    }
    return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES_CASOS.datos_invalidos };
  }
  const filas = Array.isArray(data) ? data : [];
  return {
    ok: true,
    data: filas.filter(esObj).map((f) => ({
      casoId: String(f['caso_id']),
      condicion: String(f['condicion'] ?? ''),
      fechaApertura: String(f['fecha_apertura'] ?? ''),
      horizonteProximoEvento: str(f['horizonte_proximo_evento']),
      empleadoTratanteId: str(f['empleado_tratante_id']),
      esTratante: f['es_tratante'] === true,
    })),
  };
}
