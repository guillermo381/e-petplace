// LA ATENCIÓN DE ADIESTRAMIENTO (S63-B, Bloque 3 experiencia) — el
// Durante/Cierre del adiestrador sobre el chasis de la A (migración
// 20260715220000, commit 4bc0d5d; contrato verificado contra el DDL
// REAL, regla 40 — jamás calcado del grooming a ciegas):
//   · iniciar_atencion_adiestramiento(cita, empleado?) → hito→capa→
//     oficio + cita en_curso; gate temporal cita_aun_no_ocurre VIVO.
//   · registrar_objetivo_adiestramiento — UPSERT (trabajado→ALCANZADO
//     sin fila nueva; la nota se conserva al promover, §6)
//   · quitar_objetivo_adiestramiento · registrar_nota_adiestramiento
//   · registrar_clip_adiestramiento (tope duro 1..3, §12.3 — la cola
//     local del Bloque 1 conecta acá cuando la config del bucket
//     adiestramiento-clips llegue reportada por la A)
//   · terminar_atencion_adiestramiento (SIN guard de captura — §12.6)
//   · cerrar_atencion_adiestramiento — piso §5 (≥1 objetivo trabajado
//     + ≥1 nota o clip) + instrucciones_familia + DEVENGO variante (b).
//     El guard duro de orden del programa (trigger en la fuente,
//     20260715180000) rebota 'sesion_anterior_abierta' en la promoción.
// El estado del Durante se lee DIRECTO con RLS (patrón grooming).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import type { CitaAgendaPaseo, InputCitasPaseoDelDia } from './paseo';

// ── Errores tipados (códigos REALES de los RAISE del chasis) ────────────────

const CODIGOS_ADIESTRAMIENTO_ATENCION = [
  'auth_required',
  'no_access_to_prestador',
  'no_access_to_mascota',
  'cita_no_existe',
  'cita_no_es_adiestramiento',
  'cita_estado_invalido_para_iniciar',
  'cita_aun_no_ocurre',
  'atencion_adiestramiento_ya_existe_para_cita',
  'atencion_adiestramiento_no_existe',
  'atencion_no_en_curso',
  'atencion_no_terminada',
  'objetivo_invalido',
  'objetivo_no_registrado',
  'texto_required',
  'clip_tope_superado',
  'clip_path_invalido',
  'calidad_falta_objetivo',
  'calidad_falta_nota_o_clip',
  'sesion_anterior_abierta',
  'cita_no_promovible',
  'cita_sin_precio',
  'prestador_sin_cuenta_comercial',
] as const;

export type CodigoErrorAdiestramientoAtencion =
  | (typeof CODIGOS_ADIESTRAMIENTO_ATENCION)[number]
  | 'error_desconocido'
  | 'datos_inconsistentes';

const MENSAJES: Record<CodigoErrorAdiestramientoAtencion, string> = {
  auth_required: 'No hay una sesión activa.',
  no_access_to_prestador: 'No tienes acceso a este prestador.',
  no_access_to_mascota: 'No tienes acceso a esta mascota.',
  cita_no_existe: 'Esa cita ya no existe.',
  cita_no_es_adiestramiento: 'Esa cita no es de adiestramiento.',
  cita_estado_invalido_para_iniciar: 'Esta cita no se puede iniciar en su estado actual.',
  cita_aun_no_ocurre: 'La sesión se inicia el día de la cita.',
  atencion_adiestramiento_ya_existe_para_cita: 'Esta sesión ya se inició.',
  atencion_adiestramiento_no_existe: 'Esa sesión no existe.',
  atencion_no_en_curso: 'La sesión ya no está en curso.',
  atencion_no_terminada: 'Primero termina la sesión.',
  objetivo_invalido: 'Ese objetivo no está en el vocabulario.',
  objetivo_no_registrado: 'Ese objetivo no estaba registrado.',
  texto_required: 'Escribe la nota antes de guardar.',
  clip_tope_superado: 'Ya registraste los 3 clips de esta sesión.',
  clip_path_invalido: 'El clip no pertenece a esta sesión.',
  calidad_falta_objetivo: 'Registra al menos un objetivo trabajado antes de cerrar.',
  calidad_falta_nota_o_clip: 'Registra al menos una nota conductual o un clip antes de cerrar.',
  // El guard duro de orden del programa — la voz honesta, jamás crudo.
  sesion_anterior_abierta: 'Primero cierra la sesión anterior de este programa.',
  cita_no_promovible: 'El turno de esta sesión no se pudo completar.',
  cita_sin_precio: 'La cita no tiene precio congelado — no se puede devengar.',
  prestador_sin_cuenta_comercial: 'Necesitas una cuenta de cobros activa para cerrar con devengo.',
  error_desconocido: 'Ocurrió un error. Intenta de nuevo.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
};

function normalizar(mensaje: string): CodigoErrorAdiestramientoAtencion {
  // L-115: los códigos viajan como PREFIJO del mensaje (algunos con ': detalle').
  return CODIGOS_ADIESTRAMIENTO_ATENCION.find((c) => mensaje.startsWith(c)) ?? 'error_desconocido';
}

function fallo<T>(mensajeOriginal: string): ResultadoWrapper<T, CodigoErrorAdiestramientoAtencion> {
  const codigo = normalizar(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// ── El vocabulario y el currículum (catálogos, voz de OFICIO) ───────────────

export interface ObjetivoAdiestramientoCatalogo {
  codigo: string;
  /** Voz del adiestrador — nombre_familia queda para el parte del dueño. */
  nombre: string;
  descripcion: string | null;
  orden_display: number;
}

export async function obtenerObjetivosAdiestramiento(): Promise<
  ResultadoWrapper<ObjetivoAdiestramientoCatalogo[], CodigoErrorAdiestramientoAtencion>
> {
  const { data, error } = await getClient()
    .from('cat_objetivos_adiestramiento')
    .select('codigo, nombre, descripcion, orden_display')
    .eq('activo', true)
    .order('orden_display', { ascending: true });
  if (error) return fallo(error.message);
  return { ok: true, data };
}

/** El currículum SUGERIDO del nivel (sugerencia, jamás límite): códigos
 *  ordenados por sesión sugerida. Vacío legal (especialidades). */
export async function obtenerCurriculumNivel(
  nivel: string,
): Promise<ResultadoWrapper<{ objetivo_codigo: string; sesion_sugerida: number }[], CodigoErrorAdiestramientoAtencion>> {
  const { data, error } = await getClient()
    .from('cat_curriculum_adiestramiento')
    .select('objetivo_codigo, sesion_sugerida')
    .eq('nivel', nivel)
    .eq('activo', true)
    .order('sesion_sugerida', { ascending: true });
  if (error) return fallo(error.message);
  return { ok: true, data };
}

// ── Las citas del día (gemela EXACTA de la de grooming — el HOY fusiona) ────

export async function obtenerCitasAdiestramientoDelDia(
  input: InputCitasPaseoDelDia,
): Promise<ResultadoWrapper<CitaAgendaPaseo[], CodigoErrorAdiestramientoAtencion>> {
  const { data, error } = await getClient()
    .from('evento_cita_servicio')
    .select(
      'id, fecha, hora, estado, tipo_servicio, suscripcion_servicio_id, duracion_minutos, mascota:mascotas(id, nombre, especie, foto_url), tipo:tipos_servicio!inner(nombre, duracion_default_minutos), atencion:evento_atencion(estado, iniciada_en)',
    )
    .eq('prestador_id', input.prestador_id)
    .gte('fecha', input.fecha)
    .lte('fecha', input.fecha_hasta ?? input.fecha)
    .eq('tipo.categoria', 'adiestramiento')
    // VERDAD FIRME — misma lista positiva de la puerta del paseo.
    .in('estado', ['confirmada', 'en_curso', 'completada', 'no_show'])
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });

  if (error) return fallo(error.message);
  const citas: CitaAgendaPaseo[] = (data ?? []).map((c) => {
    const atenciones = (c.atencion ?? []) as { estado: string; iniciada_en: string }[];
    const atencion =
      atenciones.length === 0 ? null : atenciones.reduce((a, b) => (b.iniciada_en > a.iniciada_en ? b : a));
    return { ...c, atencion, direccion: null };
  });
  return { ok: true, data: citas };
}

/** El detalle por id suma el CONTEXTO DE PROGRAMA (k/N + nivel para el
 *  currículum): sesion_numero de la cita + n_sesiones/nivel de la
 *  matrícula. Cita suelta = programa null. */
export type CitaAdiestramientoDetalle = CitaAgendaPaseo & {
  sesion_numero: number | null;
  programa: { n_sesiones: number; nombre: string; nivel: string } | null;
};

export async function obtenerCitaAdiestramientoPorId(
  citaId: string,
): Promise<ResultadoWrapper<CitaAdiestramientoDetalle, CodigoErrorAdiestramientoAtencion>> {
  const { data, error } = await getClient()
    .from('evento_cita_servicio')
    .select(
      'id, fecha, hora, estado, tipo_servicio, suscripcion_servicio_id, duracion_minutos, sesion_numero, mascota:mascotas(id, nombre, especie, foto_url), tipo:tipos_servicio!inner(nombre, duracion_default_minutos), atencion:evento_atencion(estado, iniciada_en), matricula:programas_contratados(n_sesiones, programa:prestador_programas(nombre, nivel))',
    )
    .eq('id', citaId)
    .eq('tipo.categoria', 'adiestramiento')
    .in('estado', ['confirmada', 'en_curso', 'completada', 'no_show'])
    .maybeSingle();

  if (error) return fallo(error.message);
  if (data === null) return fallo('cita_no_existe');
  const atenciones = (data.atencion ?? []) as { estado: string; iniciada_en: string }[];
  const atencion =
    atenciones.length === 0 ? null : atenciones.reduce((a, b) => (b.iniciada_en > a.iniciada_en ? b : a));
  const { matricula, ...cita } = data;
  return {
    ok: true,
    data: {
      ...cita,
      atencion,
      direccion: null,
      sesion_numero: data.sesion_numero,
      programa:
        matricula !== null && matricula.programa !== null
          ? { n_sesiones: matricula.n_sesiones, nombre: matricula.programa.nombre, nivel: matricula.programa.nivel }
          : null,
    },
  };
}

// ── La reconstrucción 7.5: el estado real por cita ──────────────────────────

export interface AdiestramientoDeCita {
  adiestramiento_id: string;
  evento_atencion_id: string;
  /** null = sin iniciar. */
  estado: string | null;
  iniciada_en: string | null;
}

export async function obtenerAdiestramientoPorCita(
  citaId: string,
): Promise<ResultadoWrapper<AdiestramientoDeCita, CodigoErrorAdiestramientoAtencion>> {
  const { data, error } = await getClient()
    .from('eventos_mascota_adiestramiento')
    .select('id, evento_atencion_id, atencion:evento_atencion!inner(estado, iniciada_en, cita_id)')
    .eq('atencion.cita_id', citaId)
    .maybeSingle();
  if (error) return fallo(error.message);
  if (data === null) {
    // Sin iniciar: shape uniforme con estado null (L-124).
    return {
      ok: true,
      data: { adiestramiento_id: '', evento_atencion_id: '', estado: null, iniciada_en: null },
    };
  }
  return {
    ok: true,
    data: {
      adiestramiento_id: data.id,
      evento_atencion_id: data.evento_atencion_id,
      estado: data.atencion.estado,
      iniciada_en: data.atencion.iniciada_en,
    },
  };
}

// ── El estado del Durante (lectura directa, RLS es el guard) ────────────────

export interface ObjetivoRegistrado {
  objetivo_codigo: string;
  alcanzado: boolean;
}

export interface EstadoDuranteAdiestramiento {
  objetivos: ObjetivoRegistrado[];
  notas_total: number;
  clips_total: number;
  instrucciones_familia: string | null;
}

export async function obtenerEstadoDuranteAdiestramiento(
  adiestramientoId: string,
): Promise<ResultadoWrapper<EstadoDuranteAdiestramiento, CodigoErrorAdiestramientoAtencion>> {
  const cliente = getClient();
  const [head, objetivos, notas, clips] = await Promise.all([
    cliente
      .from('eventos_mascota_adiestramiento')
      .select('instrucciones_familia')
      .eq('id', adiestramientoId)
      .maybeSingle(),
    cliente
      .from('evento_adiestramiento_objetivos')
      .select('objetivo_codigo, alcanzado')
      .eq('adiestramiento_id', adiestramientoId)
      .order('created_at', { ascending: true }),
    cliente
      .from('evento_adiestramiento_notas')
      .select('id', { count: 'exact', head: true })
      .eq('adiestramiento_id', adiestramientoId),
    cliente
      .from('evento_adiestramiento_clips')
      .select('id', { count: 'exact', head: true })
      .eq('adiestramiento_id', adiestramientoId),
  ]);
  if (head.error) return fallo(head.error.message);
  if (head.data === null) return fallo('atencion_adiestramiento_no_existe');
  if (objetivos.error) return fallo(objetivos.error.message);
  if (notas.error) return fallo(notas.error.message);
  if (clips.error) return fallo(clips.error.message);
  return {
    ok: true,
    data: {
      objetivos: objetivos.data,
      notas_total: notas.count ?? 0,
      clips_total: clips.count ?? 0,
      instrucciones_familia: head.data.instrucciones_familia,
    },
  };
}

/** Un clip REGISTRADO de la sesión (S65: el parte del prestador los
 *  reproduce con ClipSesion — hasta acá el cierre solo decía "1 clip").
 *  Las URLs se firman aparte con resolverUrlsClips (bucket privado). */
export interface ClipAdiestramientoRegistrado {
  id: string;
  storage_path: string;
  duracion_segundos: number | null;
  descripcion: string | null;
}

export async function obtenerClipsAdiestramiento(
  adiestramientoId: string,
): Promise<ResultadoWrapper<ClipAdiestramientoRegistrado[], CodigoErrorAdiestramientoAtencion>> {
  const { data, error } = await getClient()
    .from('evento_adiestramiento_clips')
    .select('id, storage_path, duracion_segundos, descripcion')
    .eq('adiestramiento_id', adiestramientoId)
    .order('orden', { ascending: true });
  if (error) return fallo(error.message);
  return { ok: true, data };
}

// ── Las RPCs del ciclo ──────────────────────────────────────────────────────

export interface ResultadoIniciarAdiestramiento {
  adiestramiento_id: string;
  evento_atencion_id: string;
  cita_id: string;
}

export async function iniciarAtencionAdiestramiento(
  citaId: string,
): Promise<ResultadoWrapper<ResultadoIniciarAdiestramiento, CodigoErrorAdiestramientoAtencion>> {
  const { data, error } = await getClient().rpc('iniciar_atencion_adiestramiento', { p_cita_id: citaId });
  if (error) return fallo(error.message);
  if (
    !esObj(data) ||
    data.ok !== true ||
    typeof data.adiestramiento_id !== 'string' ||
    typeof data.evento_atencion_id !== 'string'
  ) {
    return fallo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      adiestramiento_id: data.adiestramiento_id,
      evento_atencion_id: data.evento_atencion_id,
      cita_id: citaId,
    },
  };
}

export async function registrarObjetivoAdiestramiento(input: {
  adiestramiento_id: string;
  objetivo_codigo: string;
  alcanzado: boolean;
}): Promise<ResultadoWrapper<{ alcanzado: boolean }, CodigoErrorAdiestramientoAtencion>> {
  const { data, error } = await getClient().rpc('registrar_objetivo_adiestramiento', {
    p_adiestramiento_id: input.adiestramiento_id,
    p_objetivo_codigo: input.objetivo_codigo,
    p_alcanzado: input.alcanzado,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true) return fallo('datos_inconsistentes');
  return { ok: true, data: { alcanzado: data.alcanzado === true } };
}

export async function quitarObjetivoAdiestramiento(input: {
  adiestramiento_id: string;
  objetivo_codigo: string;
}): Promise<ResultadoWrapper<null, CodigoErrorAdiestramientoAtencion>> {
  const { data, error } = await getClient().rpc('quitar_objetivo_adiestramiento', {
    p_adiestramiento_id: input.adiestramiento_id,
    p_objetivo_codigo: input.objetivo_codigo,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true) return fallo('datos_inconsistentes');
  return { ok: true, data: null };
}

export async function registrarNotaAdiestramiento(input: {
  adiestramiento_id: string;
  texto: string;
}): Promise<ResultadoWrapper<null, CodigoErrorAdiestramientoAtencion>> {
  const { data, error } = await getClient().rpc('registrar_nota_adiestramiento', {
    p_adiestramiento_id: input.adiestramiento_id,
    p_texto: input.texto,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true) return fallo('datos_inconsistentes');
  return { ok: true, data: null };
}

/** El paso 2 de la cola de clips (tanda corta S63-B): registra el clip
 *  YA SUBIDO al bucket adiestramiento-clips. Un clip subido pero NO
 *  registrado es invisible para el dueño (la policy de lectura de
 *  familia pasa por este registro) — si esto falla tras una subida
 *  exitosa, se reintenta SOLO el registro, jamás re-subir. */
export async function registrarClipAdiestramiento(input: {
  adiestramiento_id: string;
  storage_path: string;
  /** 1..3 — tope DURO del motor (§12.3). */
  orden: number;
  duracion_segundos?: number;
  descripcion?: string;
}): Promise<ResultadoWrapper<{ orden: number }, CodigoErrorAdiestramientoAtencion>> {
  const { data, error } = await getClient().rpc('registrar_clip_adiestramiento', {
    p_adiestramiento_id: input.adiestramiento_id,
    p_storage_path: input.storage_path,
    p_orden: input.orden,
    p_duracion_segundos: input.duracion_segundos,
    p_descripcion: input.descripcion,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true || typeof data.orden !== 'number') return fallo('datos_inconsistentes');
  return { ok: true, data: { orden: data.orden } };
}

export async function terminarAtencionAdiestramiento(
  adiestramientoId: string,
): Promise<ResultadoWrapper<null, CodigoErrorAdiestramientoAtencion>> {
  const { data, error } = await getClient().rpc('terminar_atencion_adiestramiento', {
    p_adiestramiento_id: adiestramientoId,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true) return fallo('datos_inconsistentes');
  return { ok: true, data: null };
}

export async function cerrarAtencionAdiestramiento(input: {
  adiestramiento_id: string;
  mensaje_familia?: string;
  instrucciones_familia?: string;
}): Promise<ResultadoWrapper<null, CodigoErrorAdiestramientoAtencion>> {
  const { data, error } = await getClient().rpc('cerrar_atencion_adiestramiento', {
    p_adiestramiento_id: input.adiestramiento_id,
    p_mensaje_familia: input.mensaje_familia,
    p_instrucciones_familia: input.instrucciones_familia,
  });
  if (error) return fallo(error.message);
  if (!esObj(data) || data.ok !== true) return fallo('datos_inconsistentes');
  return { ok: true, data: null };
}
