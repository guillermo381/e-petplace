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
  /* 🔴 Firma de la mesa (29-ago): el día dejó de ser obligatorio. Lo
     obligatorio es AL MENOS UNA modalidad con precio — día, algún paquete, o
     mensual. Las cuatro se pueden apagar; las cuatro no. */
  sin_precios_configurados:    'Para publicar, pon al menos un precio: por día, por paquete o mensual.',
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

/** Por qué NO se publicó. `null` cuando sí se publicó. */
export type MotivoNoPublicada = 'sin_precio' | 'apagada_por_el_prestador';

/** El estado de la guardería del prestador, en UN viaje. */
export type EstadoGuarderia =
  | 'sin_empezar' | 'sin_franjas' | 'sin_capacidad'
  /** configurada y guardada, pero **no publicada por falta de precio** */
  | 'sin_precio'
  | 'apagada' | 'publicada';

export interface EstadoGuarderiaCompleto {
  estado: EstadoGuarderia;
  tieneFranjas: boolean;
  capacidadDia: number;
  /** `null` = no ofrece esa modalidad. **Jamás 0: 0 sería «gratis».** */
  precioDia: number | null;
  precioMensual: number | null;
  paquetesActivos: number;
  especies: string[];
  publicada: boolean;
}

export interface OfertaGuarderiaPublicada {
  prestadorServicioId: string;
  /** 🔴 Guardar sin precio **NO es un error**: guarda y no publica. */
  publicada: boolean;
  motivoNoPublicada: MotivoNoPublicada | null;
  /** Derivada de las franjas: del inicio de la recogida al fin de la devolución. */
  jornadaMinutos: number;
  /** La suma de los espacios activos del lugar. */
  capacidadDia: number;
}

/**
 * Las tres formas de contratar guardería. **Vocabulario cerrado y compartido**
 * con el motor (`obtener_guarderias_disponibles` rebota `modalidad_invalida`).
 *
 * 🔴 **`hotel` NO está y no se agrega de paso:** la noche es otro servicio con
 * su propia letra (`LETRA_GUARDERIA` §5). *Meterla acá convertiría una custodia
 * diurna en una pernoctación sin que nadie lo decidiera.*
 */
export type ModalidadGuarderia = 'dia' | 'paquete' | 'mensual';

/** Guard de forma: el server manda texto, y un texto no es una unión. */
function esModalidad(v: unknown): v is ModalidadGuarderia {
  return v === 'dia' || v === 'paquete' || v === 'mensual';
}

export interface GuarderiaDisponible {
  prestadorId: string;
  prestadorServicioId: string;
  prestadorNombre: string;
  /**
   * El precio del DÍA SUELTO.
   * 🔴 **`null` desde S107: el día dejó de ser obligatorio** (firma de la mesa,
   * `chk_precio_obligatorio_salvo_guarderia`). Un lugar puede vender **sólo
   * paquete** o **sólo mensualidad**.
   *
   * ⏪ Acá decía `number`, y el lector de abajo rebotaba la lista ENTERA con
   * `datos_inconsistentes` si un solo lugar no tenía precio de día. *El motor
   * se curó y el wrapper lo habría rechazado un piso más arriba* — el mismo
   * defecto, en la otra punta del cable.
   */
  precio: number | null;
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
  /** La modalidad con la que se preguntó. `null` = se preguntó sin filtrar. */
  modalidad: ModalidadGuarderia | null;
  /**
   * 🔴 **El precio DE ESA MODALIDAD, ya resuelto por el server.**
   * La pantalla NO elige entre los tres: si eligiera, podría mostrar uno y
   * cobrar otro. `null` cuando se preguntó sin modalidad.
   */
  precioModalidad: number | null;
}

export async function definirOfertaGuarderia(params: {
  prestadorId: string;
  /** `null`/omitido = **no ofrece día suelto**. Ya no es obligatorio. */
  precioDia?: number | null;
  precioMensual?: number | null;
  activo?: boolean;
  /** Las que atiende. Se **recortan contra {perro, gato}** en el server. */
  especies?: string[];
}): Promise<ResultadoWrapper<OfertaGuarderiaPublicada, CodigoErrorGuarderiaOferta>> {
  const { data, error } = await getClient().rpc('definir_oferta_guarderia', {
    p_prestador_id: params.prestadorId,
    p_precio_dia: params.precioDia ?? undefined,
    p_precio_mensual: params.precioMensual ?? undefined,
    p_activo: params.activo ?? true,
    p_especies: params.especies ?? undefined,
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
      publicada: r.publicada === true,
      motivoNoPublicada:
        typeof r.motivo_no_publicada === 'string'
          ? (r.motivo_no_publicada as MotivoNoPublicada)
          : null,
    },
  };
}

/**
 * El estado completo, en UN viaje. 🔴 **La pantalla lo PINTA, no lo deduce** —
 * y no lo arma con cuatro consultas: *«configurado, no publicado, por falta de
 * precio»* es un estado del motor, no una inferencia de la superficie.
 */
export async function obtenerEstadoGuarderia(
  prestadorId: string,
): Promise<ResultadoWrapper<EstadoGuarderiaCompleto, CodigoErrorGuarderiaOferta>> {
  const { data, error } = await getClient().rpc('obtener_estado_guarderia', {
    p_prestador_id: prestadorId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.estado !== 'string' || typeof r.capacidad_dia !== 'number') {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      estado: r.estado as EstadoGuarderia,
      tieneFranjas: r.tiene_franjas === true,
      capacidadDia: r.capacidad_dia,
      precioDia: typeof r.precio_dia === 'number' ? r.precio_dia : null,
      precioMensual: typeof r.precio_mensual === 'number' ? r.precio_mensual : null,
      paquetesActivos: typeof r.paquetes_activos === 'number' ? r.paquetes_activos : 0,
      especies: Array.isArray(r.especies) ? (r.especies as string[]) : [],
      publicada: r.publicada === true,
    },
  };
}

/** La oferta propia del prestador — lectura directa por RLS (`prestador_servicios_own`). */
/**
 * 🔴 DOS HUECOS QUE C MIDIÓ Y ESTA FORMA CIERRA — *el escritor avanzó y el
 * lector no*, que es el modo de falla más caro de una migración de columna:
 *
 * ① **`precio` es NULLABLE desde el 29-ago** (el día dejó de ser obligatorio).
 *    El lector exigía `typeof precio === 'number'` ⇒ **una oferta guardada sin
 *    precio de día NO SE PODÍA VOLVER A LEER**: el prestador guardaba bien y
 *    **la próxima vez su taller abría roto**. *Hoy no se veía porque C tapaba
 *    el caso por accidente — y un defecto tapado por accidente es uno que
 *    aparece el día que alguien destapa otra cosa.*
 *
 * ② **No devolvía `especies`.** Si el selector se montara contra este lector,
 *    cargaría el default y **un prestador que guardó «solo perros» vería
 *    perro+gato y al guardar sobrescribiría su elección — en silencio.**
 *    *Un lector que omite un campo editable no muestra menos: hace que la
 *    pantalla escriba de más.*
 */
export interface OfertaGuarderiaPropia {
  prestadorServicioId: string;
  /** `null` = **no ofrece día suelto**. Jamás 0: 0 sería «gratis». */
  precio: number | null;
  precioMensual: number | null;
  jornadaMinutos: number;
  activo: boolean;
  /** Las que el prestador eligió, ya recortadas contra `{perro, gato}`. */
  especies: string[];
}

export async function obtenerOfertaGuarderiaPropia(
  prestadorId: string,
): Promise<ResultadoWrapper<
  OfertaGuarderiaPropia | null,
  CodigoErrorGuarderiaOferta
>> {
  const { data, error } = await getClient()
    .from('prestador_servicios')
    .select('id, precio, precio_mensual_plan, duracion_minutos, activo, especies_compatibles')
    .eq('prestador_id', prestadorId)
    .eq('tipo_servicio', 'guarderia_dia')
    .maybeSingle();
  if (error) return fallo(error.message);
  /* null NO es un error: es «todavía no publicaste». La pantalla del prestador
     necesita distinguirlo de un fallo para poder ofrecer el camino de alta. */
  if (data === null) return { ok: true, data: null };
  if (typeof data.duracion_minutos !== 'number') return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: {
      prestadorServicioId: data.id,
      precio: typeof data.precio === 'number' ? data.precio : null,
      precioMensual: data.precio_mensual_plan,
      jornadaMinutos: data.duracion_minutos,
      activo: data.activo,
      especies: Array.isArray(data.especies_compatibles)
        ? (data.especies_compatibles as string[])
        : [],
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
  /**
   * 🔴 **LA MODALIDAD ES UN FILTRO** (firma del founder, S107): la familia
   * elige Día · Paquete · Mensual **antes** de ver lugares, y esto devuelve
   * los que ofrecen ESA modalidad, con su precio ya resuelto.
   *
   * **Qué significa `fecha` según la modalidad:** para `dia` y `paquete` es el
   * PRIMER día a agendar; para `mensual`, el día de INICIO del período.
   *
   * Omitirla = *«el lugar ofrece algo»* — el comportamiento anterior, para que
   * ninguna pantalla se rompa por este cambio. *Un contrato que obliga a mover
   * dos piezas a la vez es cómo se rompe una pantalla en producción.*
   */
  modalidad?: ModalidadGuarderia | null;
}): Promise<ResultadoWrapper<GuarderiaDisponible[], CodigoErrorGuarderiaOferta>> {
  const { data, error } = await getClient().rpc('obtener_guarderias_disponibles', {
    p_fecha: params.fecha,
    p_mascota_id: params.mascotaId,
    p_lat: params.lat ?? undefined,
    p_lon: params.lon ?? undefined,
    p_modalidad: params.modalidad ?? undefined,
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
    /* 🔴 `precio` YA NO SE EXIGE: puede ser `null` (solo-paquete / solo-mensual).
       Lo que sí se exige es que, si viene, sea un número — un string acá sería
       un dato roto, y eso sigue siendo `datos_inconsistentes`. */
    if (r.precio !== null && typeof r.precio !== 'number') {
      return fallaCodigo('datos_inconsistentes');
    }
    if (typeof r.jornada_minutos !== 'number') {
      return fallaCodigo('datos_inconsistentes');
    }
    if (typeof r.disponible !== 'number' || typeof r.sobrevendido !== 'boolean') {
      return fallaCodigo('datos_inconsistentes');
    }
    salida.push({
      prestadorId: r.prestador_id,
      prestadorServicioId: r.prestador_servicio_id,
      prestadorNombre: typeof r.prestador_nombre === 'string' ? r.prestador_nombre : '',
      precio: typeof r.precio === 'number' ? r.precio : null,
      precioPaquete: typeof r.precio_paquete === 'number' ? r.precio_paquete : null,
      precioMensual: typeof r.precio_mensual === 'number' ? r.precio_mensual : null,
      jornadaMinutos: r.jornada_minutos,
      direccion: typeof r.direccion === 'string' ? r.direccion : null,
      ciudad: typeof r.ciudad === 'string' ? r.ciudad : null,
      disponible: r.disponible,
      sobrevendido: r.sobrevendido,
      modalidad: esModalidad(r.modalidad) ? r.modalidad : null,
      precioModalidad: typeof r.precio_modalidad === 'number' ? r.precio_modalidad : null,
    });
  }
  return { ok: true, data: salida };
}
