// La oferta de guardería — S107-A (precio y visibilidad).
//
// Contrato: `docs/contratos/s107-contrato-cupo-franja-estadia.md`.
//
// 🔴 LA OFERTA NO ES UNA TABLA NUEVA: vive en `prestador_servicios` con
// `tipo_servicio = 'guarderia_dia'`, y sus tres precios ya tienen columna
// propia (`precio` · `precio_paquete` · `precio_mensual_plan`).
//
// 🔴 PUBLICAR EXIGE FRANJAS Y CAPACIDAD, y el rebote lo DICE. *Una guardería
// en la vitrina sin ventana de recogida es una guardería que nadie puede usar:
// la familia elegiría el día y no habría a qué hora pasar a buscar al animal.*
//
// La JORNADA no se teclea: la deriva el server de las franjas del propio
// prestador (del inicio de la recogida al fin de la devolución).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  no_gestionas_este_prestador: 'No administras este negocio.',
  precio_invalido:             'El precio por día tiene que ser mayor a cero.',
  precio_paquete_invalido:     'El precio del paquete tiene que ser mayor a cero. Déjalo vacío si no ofreces paquete.',
  precio_mensual_invalido:     'El precio mensual tiene que ser mayor a cero. Déjalo vacío si no ofreces mensualidad.',
  /* 🔴 Los dos rebotes que hacen honesta la palabra «visible»: dicen QUÉ falta
     y por eso el prestador sabe adónde ir, en vez de leer «revisá los datos». */
  franjas_no_configuradas:     'Antes de publicar, define tu franja de recogida y la de devolución.',
  sin_espacios_configurados:   'Antes de publicar, define cuántos animales recibes por día.',
  franjas_se_cruzan:           'La devolución no puede empezar antes de que termine la recogida.',
  ventana_invalida:            'Falta la fecha o la mascota.',
  no_access_to_mascota:        'No tienes acceso a esa mascota.',
  mascota_no_elegible:         'La guardería es solo para perros y gatos.',
  sin_sesion:                  'No hay sesión activa.',
  datos_inconsistentes:        'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:           'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorGuarderiaOferta = keyof typeof MENSAJES;
const CODIGOS = Object.keys(MENSAJES) as CodigoErrorGuarderiaOferta[];

function fallaCodigo<T>(codigo: CodigoErrorGuarderiaOferta): ResultadoWrapper<T, CodigoErrorGuarderiaOferta> {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}
/** L-115: el motor levanta `codigo: detalle` ⇒ se normaliza por prefijo. */
function fallo<T>(raw: string): ResultadoWrapper<T, CodigoErrorGuarderiaOferta> {
  if (raw === 'auth_required') return fallaCodigo('sin_sesion');
  for (const codigo of CODIGOS) if (raw.startsWith(codigo)) return fallaCodigo(codigo);
  return fallaCodigo('error_desconocido');
}

export interface OfertaGuarderiaPublicada {
  prestadorServicioId: string;
  /** Derivada de las franjas: del inicio de la recogida al fin de la devolución. */
  jornadaMinutos: number;
  /** La suma de los espacios activos del lugar. */
  capacidadDia: number;
}

export interface GuarderiaDisponible {
  prestadorId: string;
  prestadorServicioId: string;
  prestadorNombre: string;
  precio: number;
  /** null = este lugar no ofrece paquete. **Jamás cae al precio del día.** */
  precioPaquete: number | null;
  /** null = este lugar no ofrece mensualidad. */
  precioMensual: number | null;
  jornadaMinutos: number;
  direccion: string | null;
  ciudad: string | null;
  /** Lugares libres ESE día. El lector ya excluye los llenos. */
  disponible: number;
  /** El lugar bajó su capacidad por debajo de lo prometido — lo declara, no cancela. */
  sobrevendido: boolean;
}

export async function definirOfertaGuarderia(params: {
  prestadorId: string;
  precioDia: number;
  precioPaquete?: number | null;
  precioMensual?: number | null;
  activo?: boolean;
}): Promise<ResultadoWrapper<OfertaGuarderiaPublicada, CodigoErrorGuarderiaOferta>> {
  const { data, error } = await getClient().rpc('definir_oferta_guarderia', {
    p_prestador_id: params.prestadorId,
    p_precio_dia: params.precioDia,
    p_precio_paquete: params.precioPaquete ?? undefined,
    p_precio_mensual: params.precioMensual ?? undefined,
    p_activo: params.activo ?? true,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.prestador_servicio_id !== 'string') return fallaCodigo('datos_inconsistentes');
  if (typeof r.jornada_minutos !== 'number' || typeof r.capacidad_dia !== 'number') {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      prestadorServicioId: r.prestador_servicio_id,
      jornadaMinutos: r.jornada_minutos,
      capacidadDia: r.capacidad_dia,
    },
  };
}

/** La oferta propia del prestador — lectura directa por RLS (`prestador_servicios_own`). */
export async function obtenerOfertaGuarderiaPropia(
  prestadorId: string,
): Promise<ResultadoWrapper<
  { prestadorServicioId: string; precio: number; precioPaquete: number | null;
    precioMensual: number | null; jornadaMinutos: number; activo: boolean } | null,
  CodigoErrorGuarderiaOferta
>> {
  const { data, error } = await getClient()
    .from('prestador_servicios')
    .select('id, precio, precio_paquete, precio_mensual_plan, duracion_minutos, activo')
    .eq('prestador_id', prestadorId)
    .eq('tipo_servicio', 'guarderia_dia')
    .maybeSingle();
  if (error) return fallo(error.message);
  /* null NO es un error: es «todavía no publicaste». La pantalla del prestador
     necesita distinguirlo de un fallo para poder ofrecer el camino de alta. */
  if (data === null) return { ok: true, data: null };
  if (typeof data.precio !== 'number' || typeof data.duracion_minutos !== 'number') {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      prestadorServicioId: data.id,
      precio: data.precio,
      precioPaquete: data.precio_paquete,
      precioMensual: data.precio_mensual_plan,
      jornadaMinutos: data.duracion_minutos,
      activo: data.activo,
    },
  };
}

/**
 * Las guarderías que PUEDEN recibir a esta mascota ese día.
 *
 * 🔴 Este lector ya excluye los días llenos — pero **el calendario de la
 * familia NO se arma con esto**: ahí el día lleno **se ve lleno y lo dice**
 * (`obtenerCupoGuarderia`). Son dos preguntas distintas, y la Ley 23 se aplica
 * distinto a cada una: *un jueves que desaparece de la lista se lee como «el
 * jueves no existe»; un prestador que no puede ese día simplemente no está.*
 */
export async function obtenerGuarderiasDisponibles(params: {
  /** 'YYYY-MM-DD' */
  fecha: string;
  mascotaId: string;
  lat?: number | null;
  lon?: number | null;
}): Promise<ResultadoWrapper<GuarderiaDisponible[], CodigoErrorGuarderiaOferta>> {
  const { data, error } = await getClient().rpc('obtener_guarderias_disponibles', {
    p_fecha: params.fecha,
    p_mascota_id: params.mascotaId,
    p_lat: params.lat ?? undefined,
    p_lon: params.lon ?? undefined,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  const salida: GuarderiaDisponible[] = [];
  for (const g of data) {
    if (typeof g !== 'object' || g === null) return fallaCodigo('datos_inconsistentes');
    const r = g as Record<string, unknown>;
    if (typeof r.prestador_id !== 'string' || typeof r.prestador_servicio_id !== 'string') {
      return fallaCodigo('datos_inconsistentes');
    }
    if (typeof r.precio !== 'number' || typeof r.jornada_minutos !== 'number') {
      return fallaCodigo('datos_inconsistentes');
    }
    if (typeof r.disponible !== 'number' || typeof r.sobrevendido !== 'boolean') {
      return fallaCodigo('datos_inconsistentes');
    }
    salida.push({
      prestadorId: r.prestador_id,
      prestadorServicioId: r.prestador_servicio_id,
      prestadorNombre: typeof r.prestador_nombre === 'string' ? r.prestador_nombre : '',
      precio: r.precio,
      precioPaquete: typeof r.precio_paquete === 'number' ? r.precio_paquete : null,
      precioMensual: typeof r.precio_mensual === 'number' ? r.precio_mensual : null,
      jornadaMinutos: r.jornada_minutos,
      direccion: typeof r.direccion === 'string' ? r.direccion : null,
      ciudad: typeof r.ciudad === 'string' ? r.ciudad : null,
      disponible: r.disponible,
      sobrevendido: r.sobrevendido,
    });
  }
  return { ok: true, data: salida };
}
