// LA OFERTA DE VETERINARIA — el taller del oficio (S68-B, P0/P1).
// Contrato relevado contra DB VIVA (S68-B, solo lectura):
//   · tipos_servicio (fundación V0 20260717170000): los 11 tipos médicos
//     viven con es_medico=true, duracion_default_minutos (los DEFAULTS
//     del taller — regla 21: catálogo antes de hardcodear), orden_display
//     y especies_elegibles (el techo por tipo).
//   · prestador_servicios: una fila por servicio ofertado — el CHECK
//     tipo_servicio ya admite los códigos médicos Y 'otro'; el CHECK
//     chk_ps_alguna_modalidad exige atiende_local OR atiende_domicilio.
//     RLS prestador_servicios_own — el taller escribe DIRECTO (patrón
//     paseo/grooming/adiestramiento, cero RPC).
//   · El MENÚ del taller (orden firmado S68): Cita regular · Vacunación ·
//     Cita especializada · Urgencia en local · Urgencia a domicilio ·
//     Telemedicina. Mapeo a filas (ALINEADO al contrato de la migración
//     S68-A1 `20260717210000`, leída del árbol compartido — regla 76):
//       cita_regular        → tipo 'consulta_general'
//       vacunacion          → tipo 'vacunacion'
//       urgencia_local      → tipo NUEVO 'urgencia_local' (la migración A
//                             lo siembra con default 30' y solo-hoy;
//                             'emergencia' NO se reusa — queda no
//                             reservable, la promesa 24/7 que no hacemos)
//       urgencia_domicilio  → tipo NUEVO 'urgencia_domicilio' (45',
//                             atiende_domicilio=true)
//       telemedicina        → tipo 'telemedicina' (atiende_local=true SOLO
//                             por el CHECK de modalidad — es virtual; el
//                             switch de plataforma reservable=false lo
//                             gobierna la A: se configura hoy, se
//                             vitrinea cuando la videollamada esté lista)
//       cita_especializada  → tipo 'consulta_especializada' (S68-A6,
//                             45' default, migración 20260717230000 —
//                             una fila de catálogo no cambia los tipos
//                             generados: el código viaja como string
//                             del CHECK, declarado por la A). Los CHIPS
//                             van aparte a `prestador_especialidades`
//                             (catálogo de 6 + nombre_libre para
//                             "Otra", conectado S68-B5) con el XOR del
//                             puente respetado acá: una fila lleva
//                             especialidad_id O nombre_libre, jamás
//                             ambos ni ninguno (especialidad_invalida).
//   · Los tipos urgencia_* se detectan por presencia EN EL CATÁLOGO —
//     con la migración aplicada los dos toggles se encienden solos.
//   · PROCEDIMIENTOS (P2): filas tipo_servicio='otro' con nombre_custom
//     y precio — "se cotizan por presupuesto, no se reservan". El alta
//     escribe reservable=false (CONECTADO S68-B5); las filas
//     pre-conexión las cubrió la migración hermana 213000 (backfill
//     'otro' → false, probatorio 0→0).
//   · Verificación §14.2 (trigger de la A): activar una oferta de tipo
//     con requiere_validacion_admin SIN documento aprobado rebota
//     'verificacion_profesional_pendiente' (23514) — mapeado tipado acá
//     CON EL MISMO NOMBRE del motor (corrección S68-B5: el código
//     inventado 'verificacion_pendiente' murió).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// ── el menú del taller (orden firmado S68) ──
export const MENU_VETERINARIA = [
  'cita_regular',
  'vacunacion',
  'cita_especializada',
  'urgencia_local',
  'urgencia_domicilio',
  'telemedicina',
] as const;
export type ItemMenuVeterinaria = (typeof MENU_VETERINARIA)[number];

// tipos por ítem del menú (contratos S68-A1 + A6) — la UI gatea cada
// ítem por presencia de su tipo en el catálogo vivo
export const TIPO_POR_ITEM: Record<ItemMenuVeterinaria, string> = {
  cita_regular: 'consulta_general',
  vacunacion: 'vacunacion',
  cita_especializada: 'consulta_especializada',
  urgencia_local: 'urgencia_local',
  urgencia_domicilio: 'urgencia_domicilio',
  telemedicina: 'telemedicina',
};

export const TIPO_PROCEDIMIENTO = 'otro';

const TIPOS_SERVICIO_VET = [
  'consulta_general',
  'vacunacion',
  'consulta_especializada',
  'telemedicina',
  'urgencia_local',
  'urgencia_domicilio',
] as const;

const CODIGOS = ['sin_datos', 'no_encontrada', 'verificacion_profesional_pendiente', 'especialidad_invalida'] as const;
export type CodigoErrorVeterinaria = (typeof CODIGOS)[number];

const MENSAJES: Record<CodigoErrorVeterinaria | 'error_desconocido' | 'datos_inconsistentes', string> = {
  sin_datos: 'No pudimos leer tu oferta de veterinaria.',
  no_encontrada: 'Ese servicio ya no existe.',
  verificacion_profesional_pendiente:
    'Tu verificación profesional todavía no está aprobada — el servicio queda guardado y podrás publicarlo al aprobarse.',
  especialidad_invalida: 'Una especialidad lleva su fila del catálogo o un nombre propio — nunca ambos ni ninguno.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido: 'Ocurrió un error inesperado. Prueba de nuevo.',
};

// §14.2 (trigger de la A): el rebote tipado de activar sin verificación —
// mismo nombre que emite el motor (L-115: por prefijo del mensaje real)
function normalizarErrorEscritura(error: { code?: string; message: string }): {
  codigo: CodigoErrorVeterinaria | 'error_desconocido';
  mensaje: string;
} {
  if (error.code === '23514' && error.message.includes('verificacion_profesional_pendiente')) {
    return { codigo: 'verificacion_profesional_pendiente', mensaje: MENSAJES.verificacion_profesional_pendiente };
  }
  return { codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
}

// ── el catálogo del oficio (defaults de DB, regla 21) ──

export interface TipoVeterinariaCatalogo {
  codigo: string;
  nombre: string;
  duracionDefaultMinutos: number | null;
  ordenDisplay: number | null;
  /** El techo de especies del tipo (especies_elegibles; null = todas). */
  especies: string[] | null;
}

/** Los tipos médicos del catálogo vivo — la fuente de los defaults de
 *  duración del taller y de la voz de las especialidades. */
export async function obtenerCatalogoVeterinaria(): Promise<
  ResultadoWrapper<TipoVeterinariaCatalogo[], CodigoErrorVeterinaria>
> {
  const { data, error } = await getClient()
    .from('tipos_servicio')
    .select('codigo, nombre, duracion_default_minutos, orden_display, especies_elegibles')
    .eq('es_medico', true)
    .eq('activo', true)
    .order('orden_display', { ascending: true });

  if (error) return { ok: false, codigo: 'sin_datos', mensaje: MENSAJES.sin_datos };
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }
  return {
    ok: true,
    data: data.map((f) => ({
      codigo: f.codigo,
      nombre: f.nombre,
      duracionDefaultMinutos: f.duracion_default_minutos,
      ordenDisplay: f.orden_display,
      especies: Array.isArray(f.especies_elegibles)
        ? f.especies_elegibles.filter((e): e is string => typeof e === 'string')
        : null,
    })),
  };
}

// ── el mundo propio (lo guardado del prestador) ──

export interface OfertaVeterinariaPropia {
  id: string;
  tipoServicio: string;
  activo: boolean;
  precio: number;
  duracionMinutos: number | null;
  atiendeLocal: boolean;
  atiendeDomicilio: boolean;
}

export interface ProcedimientoVeterinaria {
  id: string;
  nombre: string;
  precio: number;
  activo: boolean;
}

export interface MundoVeterinariaPropio {
  /** Las filas de servicios del menú (consulta/vacunación/urgencias/tele). */
  servicios: OfertaVeterinariaPropia[];
  /** Las filas tipo 'otro' — los procedimientos por presupuesto. */
  procedimientos: ProcedimientoVeterinaria[];
}

const SELECT_FILA = 'id, tipo_servicio, activo, precio, duracion_minutos, atiende_local, atiende_domicilio, nombre_custom';

interface FilaCruda {
  id: string;
  tipo_servicio: string;
  activo: boolean;
  precio: number;
  duracion_minutos: number | null;
  atiende_local: boolean;
  atiende_domicilio: boolean;
  nombre_custom: string | null;
}

function normalizarServicio(f: FilaCruda): OfertaVeterinariaPropia {
  return {
    id: f.id,
    tipoServicio: f.tipo_servicio,
    activo: f.activo,
    precio: f.precio,
    duracionMinutos: f.duracion_minutos,
    atiendeLocal: f.atiende_local,
    atiendeDomicilio: f.atiende_domicilio,
  };
}

/** Todo lo guardado del oficio: servicios del menú + procedimientos
 *  (las filas 'otro' SON los procedimientos — la "Otra" especialidad
 *  vive en prestador_especialidades.nombre_libre, contrato A). */
export async function obtenerMundoVeterinariaPropio(
  prestadorId: string,
): Promise<ResultadoWrapper<MundoVeterinariaPropio, CodigoErrorVeterinaria>> {
  const { data, error } = await getClient()
    .from('prestador_servicios')
    .select(SELECT_FILA)
    .eq('prestador_id', prestadorId)
    .in('tipo_servicio', [...TIPOS_SERVICIO_VET, TIPO_PROCEDIMIENTO]);

  if (error) return { ok: false, codigo: 'sin_datos', mensaje: MENSAJES.sin_datos };
  const filas = (data ?? []) as FilaCruda[];
  return {
    ok: true,
    data: {
      servicios: filas.filter((f) => f.tipo_servicio !== TIPO_PROCEDIMIENTO).map(normalizarServicio),
      procedimientos: filas
        .filter((f) => f.tipo_servicio === TIPO_PROCEDIMIENTO)
        .map((f) => ({
          id: f.id,
          // nombre_custom NOT NULL por contrato del alta; el degradado
          // dice la verdad sin romper la lista
          nombre: f.nombre_custom ?? '',
          precio: f.precio,
          activo: f.activo,
        })),
    },
  };
}

// ── guardado de un servicio del menú ──

export interface GuardarServicioVeterinariaInput {
  prestadorId: string;
  /** La fila existente (id) o null si jamás se guardó. */
  ofertaId: string | null;
  /** El código de tipos_servicio (TIPO_POR_ITEM del menú). */
  tipoServicio: string;
  activo: boolean;
  precio: number;
  duracionMinutos: number;
  atiendeLocal: boolean;
  atiendeDomicilio: boolean;
  /** El techo de especies del tipo (especies_elegibles del catálogo). */
  especies: string[];
}

/** Insert/update de UNA fila del menú (patrón paseo/grooming: escritura
 *  directa por RLS; el CHECK de modalidad y el de tipo son de DB). */
export async function guardarServicioVeterinaria(
  input: GuardarServicioVeterinariaInput,
): Promise<ResultadoWrapper<OfertaVeterinariaPropia, CodigoErrorVeterinaria>> {
  const client = getClient();
  if (input.ofertaId === null) {
    const { data, error } = await client
      .from('prestador_servicios')
      .insert({
        prestador_id: input.prestadorId,
        tipo_servicio: input.tipoServicio,
        activo: input.activo,
        precio: input.precio,
        duracion_minutos: input.duracionMinutos,
        atiende_local: input.atiendeLocal,
        atiende_domicilio: input.atiendeDomicilio,
        especies_compatibles: input.especies,
      })
      .select(SELECT_FILA)
      .single();
    if (error || data === null) {
      const e = normalizarErrorEscritura(error ?? { message: '' });
      return { ok: false, codigo: e.codigo, mensaje: e.mensaje };
    }
    return { ok: true, data: normalizarServicio(data as FilaCruda) };
  }

  const { data, error } = await client
    .from('prestador_servicios')
    .update({
      activo: input.activo,
      precio: input.precio,
      duracion_minutos: input.duracionMinutos,
      atiende_local: input.atiendeLocal,
      atiende_domicilio: input.atiendeDomicilio,
      especies_compatibles: input.especies,
    })
    .eq('id', input.ofertaId)
    .select(SELECT_FILA)
    .maybeSingle();
  if (error) {
    const e = normalizarErrorEscritura(error);
    return { ok: false, codigo: e.codigo, mensaje: e.mensaje };
  }
  if (data === null) return { ok: false, codigo: 'no_encontrada', mensaje: MENSAJES.no_encontrada };
  return { ok: true, data: normalizarServicio(data as FilaCruda) };
}

// ── especialidades (S68-B5: catálogo + puente, XOR del contrato A) ──

export interface EspecialidadCatalogo {
  id: string;
  codigo: string;
  /** Bilingüe de nacimiento (contrato A): la UI elige por idioma. */
  nombre: string;
  nombreEn: string;
  ordenDisplay: number;
}

/** El catálogo vivo de especialidades vet (6 seeds preliminares §10.3). */
export async function obtenerCatalogoEspecialidadesVet(): Promise<
  ResultadoWrapper<EspecialidadCatalogo[], CodigoErrorVeterinaria>
> {
  const { data, error } = await getClient()
    .from('cat_especialidades_vet')
    .select('id, codigo, nombre, nombre_en, orden_display')
    .eq('activo', true)
    .order('orden_display', { ascending: true });
  if (error) return { ok: false, codigo: 'sin_datos', mensaje: MENSAJES.sin_datos };
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }
  return {
    ok: true,
    data: data.map((f) => ({
      id: f.id,
      codigo: f.codigo,
      nombre: f.nombre,
      nombreEn: f.nombre_en,
      ordenDisplay: f.orden_display,
    })),
  };
}

export interface EspecialidadDeclarada {
  id: string;
  /** Fila del catálogo (XOR con nombreLibre — el CHECK de DB lo firma). */
  especialidadId: string | null;
  /** "Otra": dato del prestador (D-388), jamás se promociona sola. */
  nombreLibre: string | null;
}

/** Las especialidades declaradas del prestador (filas del puente). */
export async function obtenerEspecialidadesPrestador(
  prestadorId: string,
): Promise<ResultadoWrapper<EspecialidadDeclarada[], CodigoErrorVeterinaria>> {
  const { data, error } = await getClient()
    .from('prestador_especialidades')
    .select('id, especialidad_id, nombre_libre')
    .eq('prestador_id', prestadorId);
  if (error) return { ok: false, codigo: 'sin_datos', mensaje: MENSAJES.sin_datos };
  return {
    ok: true,
    data: (data ?? []).map((f) => ({ id: f.id, especialidadId: f.especialidad_id, nombreLibre: f.nombre_libre })),
  };
}

// el XOR del contrato en el wrapper: una fila lleva especialidad_id O
// nombre_libre — ambos o ninguno rebota tipado ANTES de tocar la DB
function filaEspecialidad(
  prestadorId: string,
  fila: { especialidadId?: string | null; nombreLibre?: string | null },
): { prestador_id: string; especialidad_id: string | null; nombre_libre: string | null } | null {
  const id = fila.especialidadId ?? null;
  const libre = fila.nombreLibre?.trim() || null;
  if ((id !== null) === (libre !== null)) return null; // ambos o ninguno
  return { prestador_id: prestadorId, especialidad_id: id, nombre_libre: libre };
}

export interface GuardarEspecialidadesInput {
  prestadorId: string;
  /** Los ids del catálogo marcados (los chips). */
  especialidadIds: string[];
  /** Los nombres libres vigentes ("Otra"). */
  nombresLibres: string[];
}

/** El diff del puente: borra lo desmarcado, inserta lo nuevo — el
 *  estado final ES la selección que llega (UNIQUE del puente de red). */
export async function guardarEspecialidadesVeterinaria(
  input: GuardarEspecialidadesInput,
): Promise<ResultadoWrapper<EspecialidadDeclarada[], CodigoErrorVeterinaria>> {
  const client = getClient();
  const actuales = await obtenerEspecialidadesPrestador(input.prestadorId);
  if (!actuales.ok) return actuales;

  const libresNuevos = input.nombresLibres.map((n) => n.trim()).filter((n) => n !== '');
  const sobran = actuales.data.filter(
    (f) =>
      (f.especialidadId !== null && !input.especialidadIds.includes(f.especialidadId)) ||
      (f.nombreLibre !== null && !libresNuevos.includes(f.nombreLibre)),
  );
  const faltanIds = input.especialidadIds.filter((id) => !actuales.data.some((f) => f.especialidadId === id));
  const faltanLibres = libresNuevos.filter((n) => !actuales.data.some((f) => f.nombreLibre === n));

  const inserciones: { prestador_id: string; especialidad_id: string | null; nombre_libre: string | null }[] = [];
  for (const id of faltanIds) {
    const fila = filaEspecialidad(input.prestadorId, { especialidadId: id });
    if (fila === null) return { ok: false, codigo: 'especialidad_invalida', mensaje: MENSAJES.especialidad_invalida };
    inserciones.push(fila);
  }
  for (const nombre of faltanLibres) {
    const fila = filaEspecialidad(input.prestadorId, { nombreLibre: nombre });
    if (fila === null) return { ok: false, codigo: 'especialidad_invalida', mensaje: MENSAJES.especialidad_invalida };
    inserciones.push(fila);
  }

  if (sobran.length > 0) {
    const { error } = await client
      .from('prestador_especialidades')
      .delete()
      .in('id', sobran.map((f) => f.id));
    if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  if (inserciones.length > 0) {
    const { error } = await client.from('prestador_especialidades').insert(inserciones);
    if (error) {
      // 23514 = el CHECK exactamente-una de DB (no debería alcanzarse:
      // el guard de arriba lo dice antes)
      const esXor = error.code === '23514';
      return {
        ok: false,
        codigo: esXor ? 'especialidad_invalida' : 'error_desconocido',
        mensaje: esXor ? MENSAJES.especialidad_invalida : MENSAJES.error_desconocido,
      };
    }
  }
  return obtenerEspecialidadesPrestador(input.prestadorId);
}

// ── procedimientos (P2: nombre + precio, por presupuesto) ──

export interface GuardarProcedimientoInput {
  prestadorId: string;
  /** null = alta; id = edición. */
  procedimientoId: string | null;
  nombre: string;
  precio: number;
  activo: boolean;
}

/** Alta/edición de un procedimiento — fila tipo 'otro' con nombre_custom.
 *  Nace reservable=false (contrato A, conectado S68-B5); las filas
 *  pre-conexión las cubrió la migración hermana 213000. */
export async function guardarProcedimientoVeterinaria(
  input: GuardarProcedimientoInput,
): Promise<ResultadoWrapper<ProcedimientoVeterinaria, CodigoErrorVeterinaria>> {
  const client = getClient();
  const nombre = input.nombre.trim();
  if (nombre === '') {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }
  if (input.procedimientoId === null) {
    const { data, error } = await client
      .from('prestador_servicios')
      .insert({
        prestador_id: input.prestadorId,
        tipo_servicio: TIPO_PROCEDIMIENTO,
        nombre_custom: nombre,
        precio: input.precio,
        activo: input.activo,
        // el procedimiento NO se reserva (contrato A, S68-B5): fuera de
        // vitrina/slots/hold — catálogo informativo con precio
        reservable: false,
        // el CHECK de modalidad exige una; el flag es formal
        atiende_local: true,
        atiende_domicilio: false,
      })
      .select(SELECT_FILA)
      .single();
    if (error || data === null) {
      return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
    }
    const f = data as FilaCruda;
    return { ok: true, data: { id: f.id, nombre: f.nombre_custom ?? '', precio: f.precio, activo: f.activo } };
  }

  const { data, error } = await client
    .from('prestador_servicios')
    .update({ nombre_custom: nombre, precio: input.precio, activo: input.activo })
    .eq('id', input.procedimientoId)
    .eq('tipo_servicio', TIPO_PROCEDIMIENTO)
    .select(SELECT_FILA)
    .maybeSingle();
  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  if (data === null) return { ok: false, codigo: 'no_encontrada', mensaje: MENSAJES.no_encontrada };
  const f = data as FilaCruda;
  return { ok: true, data: { id: f.id, nombre: f.nombre_custom ?? '', precio: f.precio, activo: f.activo } };
}

/** Baja de un procedimiento — DELETE de la fila 'otro' propia (RLS).
 *  El .select() delata el no-op: 0 filas = no_encontrada, jamás
 *  silencio. */
export async function eliminarProcedimientoVeterinaria(
  procedimientoId: string,
): Promise<ResultadoWrapper<{ id: string }, CodigoErrorVeterinaria>> {
  const { data, error } = await getClient()
    .from('prestador_servicios')
    .delete()
    .eq('id', procedimientoId)
    .eq('tipo_servicio', TIPO_PROCEDIMIENTO)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  if (data === null) return { ok: false, codigo: 'no_encontrada', mensaje: MENSAJES.no_encontrada };
  return { ok: true, data: { id: data.id } };
}
