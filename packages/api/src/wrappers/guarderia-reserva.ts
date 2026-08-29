// La reserva de guardería — S107-A (el gate sanitario y el día).
//
// Contrato: `docs/contratos/s107-contrato-cupo-franja-estadia.md` §④ y §⑥.
//
// 🔴 EL ORDEN DEL COBRO NO SE NEGOCIA (`LETRA_PAGO_CITAS` §3): compuertas →
// cobro por el motor → **`confirmada` sólo cuando el motor confirma**. Estos
// wrappers son la PRIMERA mitad: la reserva nace `pendiente_pago` con hold de
// 15 minutos y su desglose se congela solo. **El cobro lo hace el motor de
// pagos por `cita_id`, que ya sabe hacerlo — acá no se reimplementa nada.**

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {

  /* ✏️ S107-A · CENSADOS CONTRA EL MOTOR, no agregados de a uno.
     C reportó que `fecha_no_ofertable` llegaba como `error_desconocido`; al
     medir **el motor de guardería lanza 37 códigos y 17 no estaban tipados en
     ningún wrapper** — casi la mitad.
     🔴 **Un código sin tipar no es un mensaje feo: es un HECHO que se vuelve
     indistinguible de una caída de red.** La víspera —la regla más normal del
     producto— se veía igual que un error inesperado, y la pantalla no podía
     ofrecer «elegí otro día» porque no sabía que ése era el problema. */
  reserva_mismo_dia:           'La guardería se reserva desde mañana en adelante.',
  dia_no_operativo:            'Ese lugar no abre ese día.',
  no_ofrece_dia_suelto:        'Este lugar no vende días sueltos. Mira sus paquetes o su mensualidad.',
  estadia_no_existe:           'No encontramos esa estadía.',
  acta_no_existe:              'No encontramos esa acta.',
  acta_cerrada_no_se_edita:    'Esta acta ya se cerró y no se puede cambiar.',
  conformidad_invalida:        'Esa respuesta no es válida.',
  direccion_invalida:          'Ese momento de la estadía no existe.',
  tramo_no_existe:             'No encontramos ese viaje.',
  mascota_sin_estadia_ese_dia: 'Esa mascota no tiene estadía ese día.',
  media_sin_etiquetas:         'Una foto tiene que decir de qué animal es.',
  clave_idempotencia_requerida: 'Falta el identificador del envío.',
  no_sos_de_esta_familia:      'Esto es de otra familia.',
  no_gestionas_este_prestador: 'No gestionas este negocio.',

  /* 🔴 Este código NO se traduce a «revisá los datos»: la pantalla tiene que
     nombrar QUÉ falta y llevar a resolverlo a un toque. El detalle viaja en
     `faltantes`, y el tipo de la pieza de B hace que un faltante sin camino
     ni siquiera compile. */
  requisitos_sanitarios:  'Faltan requisitos sanitarios para poder reservar.',
  sin_cupo:               'Ese día ya no tiene lugar.',
  guarderia_no_disponible:'Esta guardería no está recibiendo reservas.',
  fecha_pasada:           'Ese día ya pasó.',
  mascota_no_elegible:    'La guardería es solo para perros y gatos.',
  no_access_to_mascota:   'No tienes acceso a esa mascota.',
  sin_sesion:             'No hay sesión activa.',
  datos_inconsistentes:   'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:      'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorGuarderiaReserva = keyof typeof MENSAJES;
const CODIGOS = Object.keys(MENSAJES) as CodigoErrorGuarderiaReserva[];

function fallaCodigo<T>(c: CodigoErrorGuarderiaReserva): ResultadoWrapper<T, CodigoErrorGuarderiaReserva> {
  return { ok: false, codigo: c, mensaje: MENSAJES[c] };
}
function fallo<T>(raw: string): ResultadoWrapper<T, CodigoErrorGuarderiaReserva> {
  if (raw === 'auth_required') return fallaCodigo('sin_sesion');
  for (const c of CODIGOS) if (raw.startsWith(c)) return fallaCodigo(c);
  return fallaCodigo('error_desconocido');
}

/** El vocabulario del motor, tal cual. La VOZ de cada estado es de la casa que lo muestra. */
export type EstadoRequisito = 'nunca_aplicada' | 'sin_carnet' | 'sin_fecha' | 'vencida';

export interface RequisitoFaltante {
  codigo: string;
  nombre: string;
  estado: EstadoRequisito;
  /** 'YYYY-MM-DD' o null — la fecha que el dueño declaró al cargar el carnet. */
  vence: string | null;
}

export interface RequisitosGuarderia {
  alDia: boolean;
  faltantes: RequisitoFaltante[];
  /**
   * 🔴 **Si el gate FRENA o sólo INFORMA — y viaja EN LA MISMA respuesta.**
   *
   * *Con dos llamadas habría un instante en que la pantalla sabe QUÉ falta y
   * no sabe SI frena, y ahí tendría que decidirlo ella.* Con la perilla acá,
   * **la pantalla es la misma en los dos modos**: pinta el semáforo completo y
   * deja o no deja avanzar según este booleano.
   *
   * Hoy nace en `false` (pruebas del servicio). **Se enciende antes de la
   * salida real** — `D-968`, y está en el checklist de lanzamiento.
   */
  bloquea: boolean;
}

/**
 * Qué le falta a esta mascota para poder ir a la guardería.
 *
 * 🔴 **La lista de vacunas es DATO** (`cat_plan_vacunal.exigida_guarderia`),
 * jamás código: el día que el veterinario defina la lista completa por especie,
 * es un `UPDATE` — no una versión de la app.
 */
export async function evaluarRequisitosGuarderia(
  mascotaId: string,
): Promise<ResultadoWrapper<RequisitosGuarderia, CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('evaluar_requisitos_guarderia', {
    p_mascota_id: mascotaId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (r.estado !== 'al_dia' && r.estado !== 'faltan') return fallaCodigo('datos_inconsistentes');
  if (!Array.isArray(r.faltantes)) return fallaCodigo('datos_inconsistentes');
  const faltantes: RequisitoFaltante[] = [];
  for (const f of r.faltantes) {
    if (typeof f !== 'object' || f === null) return fallaCodigo('datos_inconsistentes');
    const x = f as Record<string, unknown>;
    if (typeof x.codigo !== 'string' || typeof x.estado !== 'string') {
      return fallaCodigo('datos_inconsistentes');
    }
    faltantes.push({
      codigo: x.codigo,
      nombre: typeof x.nombre === 'string' ? x.nombre : x.codigo,
      estado: x.estado as EstadoRequisito,
      vence: typeof x.vence === 'string' ? x.vence : null,
    });
  }
  return {
    ok: true,
    data: { alDia: r.estado === 'al_dia', faltantes, bloquea: r.bloquea === true },
  };
}

export interface ReservaGuarderia {
  citaId: string;
  estadiaId: string;
  precio: number;
  /** El hold vence acá. Si el pago no llega, el lugar se libera. */
  expiraEn: string;
}

/**
 * Reserva UN día. Nace `pendiente_pago` con hold de 15 minutos.
 *
 * 🔴 **El cupo se toma bajo candado**: dos familias que tocan «reservar» en el
 * mismo segundo no pueden leer las dos el mismo «queda 1».
 */
export async function reservarDiaGuarderia(params: {
  prestadorId: string;
  mascotaId: string;
  /** 'YYYY-MM-DD' */
  fecha: string;
}): Promise<ResultadoWrapper<ReservaGuarderia, CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('reservar_dia_guarderia', {
    p_prestador_id: params.prestadorId,
    p_mascota_id: params.mascotaId,
    p_fecha: params.fecha,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.cita_id !== 'string' || typeof r.estadia_id !== 'string') {
    return fallaCodigo('datos_inconsistentes');
  }
  if (typeof r.precio !== 'number' || typeof r.expira_en !== 'string') {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: { citaId: r.cita_id, estadiaId: r.estadia_id, precio: r.precio, expiraEn: r.expira_en },
  };
}

// ── LA JORNADA DEL PRESTADOR ────────────────────────────────────────────────

/** El vocabulario del motor. La VOZ de cada estado es de la casa que lo muestra. */
export type EstadoEstadia =
  | 'reservada' | 'recogida_en_curso' | 'en_guarderia'
  | 'retorno_en_curso' | 'entregada' | 'cancelada' | 'no_recogida';

export interface EstadiaDelDia {
  estadiaId: string;
  citaId: string;
  estado: EstadoEstadia;
  mascotaId: string;
  mascotaNombre: string;
  mascotaEspecie: string;
  mascotaFotoUrl: string | null;
  /** En qué sala quedó. null = todavía sin asignar. */
  espacioNombre: string | null;
  /** 🔴 Dónde hay que ir a buscarlo. Congelada al reservar (D-339). */
  direccion: unknown | null;
  aBordoEn: string | null;
  llegadaEn: string | null;
  entregadaEn: string | null;
}

/**
 * La lista de hoy del prestador.
 *
 * 🔴 **Es una VISTA sobre las estadías, jamás una entidad «jornada»**: un día
 * con seis animales son seis estadías. La pantalla compone; no hay un objeto
 * que pedir ni que mutar.
 *
 * 🔴 **Y sólo trae verdad firme.** Un hold sin pagar no es una estadía del día:
 * es alguien mirando. *Una lista que incluyera reservas que pueden evaporarse
 * en quince minutos haría salir al cuidador a buscar un animal que nadie
 * compró.*
 */
export async function obtenerEstadiasDelDia(
  prestadorId: string,
  /** 'YYYY-MM-DD' */
  fecha: string,
): Promise<ResultadoWrapper<EstadiaDelDia[], CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('obtener_estadias_del_dia', {
    p_prestador_id: prestadorId,
    p_fecha: fecha,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  const salida: EstadiaDelDia[] = [];
  for (const e of data) {
    if (typeof e !== 'object' || e === null) return fallaCodigo('datos_inconsistentes');
    const r = e as Record<string, unknown>;
    if (typeof r.estadia_id !== 'string' || typeof r.cita_id !== 'string') {
      return fallaCodigo('datos_inconsistentes');
    }
    if (typeof r.estado !== 'string' || typeof r.mascota_id !== 'string') {
      return fallaCodigo('datos_inconsistentes');
    }
    salida.push({
      estadiaId: r.estadia_id,
      citaId: r.cita_id,
      estado: r.estado as EstadoEstadia,
      mascotaId: r.mascota_id,
      mascotaNombre: typeof r.mascota_nombre === 'string' ? r.mascota_nombre : '',
      mascotaEspecie: typeof r.mascota_especie === 'string' ? r.mascota_especie : '',
      mascotaFotoUrl: typeof r.mascota_foto_url === 'string' ? r.mascota_foto_url : null,
      espacioNombre: typeof r.espacio_nombre === 'string' ? r.espacio_nombre : null,
      direccion: r.direccion_snapshot ?? null,
      aBordoEn: typeof r.a_bordo_en === 'string' ? r.a_bordo_en : null,
      llegadaEn: typeof r.llegada_en === 'string' ? r.llegada_en : null,
      entregadaEn: typeof r.entregada_en === 'string' ? r.entregada_en : null,
    });
  }
  return { ok: true, data: salida };
}

// ── ⑤ · LA MEDIA DEL DURANTE, EL PUNTO VIVO Y LAS ACTAS ─────────────────────

export interface MediaGuarderia {
  mediaId: string;
  tipo: 'foto' | 'clip';
  archivoUrl: string;
  /** null en fotos. En clips, ≤ 30 (con +0,9 s de tolerancia de contenedor). */
  duracionS: number | null;
  capturadaEn: string;
}

/**
 * Publica UNA media con N etiquetas.
 *
 * 🔴 **`claveIdempotencia` es OBLIGATORIA y la genera el cliente ANTES del
 * primer intento**, reusándola en cada reintento. *La cola reintenta por
 * diseño: un timeout ambiguo —la subida llegó, la respuesta no— registraría la
 * misma foto dos veces, y eso no aparece como un fallo sino como **eventos
 * duplicados en el expediente de un animal**, meses después.*
 *
 * **El segundo intento es un ÉXITO** (`yaExistia: true`), no un rebote: *un
 * rebote obligaría a la cola a distinguir «falló» de «ya estaba», que es justo
 * lo que no puede saber.*
 */
export async function publicarMediaGuarderia(params: {
  prestadorId: string;
  claveIdempotencia: string;
  tipo: 'foto' | 'clip';
  archivoUrl: string;
  duracionS?: number | null;
  /** 🔴 Mínimo una. Una media sin etiquetas es una foto que no llega a nadie. */
  mascotaIds: string[];
  capturadaEn: string;
}): Promise<ResultadoWrapper<{ mediaId: string; yaExistia: boolean }, CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('publicar_media_guarderia', {
    p_prestador_id: params.prestadorId,
    p_clave_idempotencia: params.claveIdempotencia,
    p_tipo: params.tipo,
    p_archivo_url: params.archivoUrl,
    p_duracion_s: params.duracionS ?? undefined,
    p_mascota_ids: params.mascotaIds,
    p_capturada_en: params.capturadaEn,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.media_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { mediaId: r.media_id, yaExistia: r.ya_existia === true } };
}

/** La media del día, para el prestador — con sus etiquetas completas. */
export async function obtenerMediaDelDia(
  prestadorId: string,
  fecha: string,
): Promise<ResultadoWrapper<(MediaGuarderia & { mascotaIds: string[] })[], CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('obtener_media_del_dia', {
    p_prestador_id: prestadorId,
    p_fecha: fecha,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: data.map((m) => {
      const r = m as Record<string, unknown>;
      return {
        mediaId: String(r.media_id),
        tipo: r.tipo as 'foto' | 'clip',
        archivoUrl: String(r.archivo_url),
        duracionS: typeof r.duracion_s === 'number' ? r.duracion_s : null,
        capturadaEn: String(r.capturada_en),
        mascotaIds: Array.isArray(r.mascota_ids) ? (r.mascota_ids as string[]) : [],
      };
    }),
  };
}

/**
 * La media de MI mascota.
 *
 * 🔴 **Los otros animales de la foto NO VIAJAN** — ni el id, ni el nombre, ni
 * el conteo. Se resuelve en el SELECT del server: *lo que no viaja no se
 * filtra mal.*
 */
export async function obtenerMediaDeMiMascota(
  mascotaId: string,
  fecha?: string,
): Promise<ResultadoWrapper<MediaGuarderia[], CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('obtener_media_de_mi_mascota', {
    p_mascota_id: mascotaId,
    p_fecha: fecha ?? undefined,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: data.map((m) => {
      const r = m as Record<string, unknown>;
      return {
        mediaId: String(r.media_id),
        tipo: r.tipo as 'foto' | 'clip',
        archivoUrl: String(r.archivo_url),
        duracionS: typeof r.duracion_s === 'number' ? r.duracion_s : null,
        capturadaEn: String(r.capturada_en),
      };
    }),
  };
}

export interface PuntoVivo { lat: number; lon: number; vistoEn: string }

/** Upsert por `tramo_id`. 🔴 **Nunca acumula**: una fila por tramo. */
export async function registrarPuntoVivo(params: {
  tramoId: string; lat: number; lon: number; vistoEn?: string;
}): Promise<ResultadoWrapper<true, CodigoErrorGuarderiaReserva>> {
  const { error } = await getClient().rpc('registrar_punto_vivo', {
    p_tramo_id: params.tramoId, p_lat: params.lat, p_lon: params.lon,
    p_visto_en: params.vistoEn ?? undefined,
  });
  if (error) return fallo(error.message);
  return { ok: true, data: true };
}

/** Un punto o `null`. 🔴 **Jamás una lista** — el recorte vive en el servidor. */
export async function obtenerPuntoVivo(
  tramoId: string,
): Promise<ResultadoWrapper<PuntoVivo | null, CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('obtener_punto_vivo', { p_tramo_id: tramoId });
  if (error) return fallo(error.message);
  if (data === null || typeof data !== 'object') return { ok: true, data: null };
  const r = data as Record<string, unknown>;
  if (typeof r.lat !== 'number' || typeof r.lon !== 'number') return { ok: true, data: null };
  return { ok: true, data: { lat: r.lat, lon: r.lon, vistoEn: String(r.vistoEn) } };
}

export type DireccionActa = 'recogida' | 'devolucion';
export type Conformidad = 'sin_conformidad' | 'conforme' | 'con_reserva';

/**
 * Levanta el acta. **Idempotente**: el segundo intento devuelve la que ya
 * existe (`yaExistia: true`) en vez de un `23505` pelado — *un guard que vive
 * en un índice sólo sabe negarse, y la cola leería ese rebote como fallo
 * dejando el acta correcta en error para siempre.*
 *
 * 🔴 **`cerradaEn` es LA HORA DE LA PUERTA**, no la de la subida. *En un
 * registro que existe para responder cuándo apareció una lesión, esa
 * diferencia es el registro entero.*
 */
export async function levantarActaGuarderia(params: {
  estadiaId: string;
  direccion: DireccionActa;
  carnetVerificado: boolean;
  objetos?: string;
  observaciones?: string;
  cerradaEn: string;
  claveIdempotencia?: string;
}): Promise<ResultadoWrapper<{ actaId: string; yaExistia: boolean }, CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('levantar_acta_guarderia', {
    p_estadia_id: params.estadiaId,
    p_direccion: params.direccion,
    p_carnet_verificado: params.carnetVerificado,
    p_objetos: params.objetos ?? undefined,
    p_observaciones: params.observaciones ?? undefined,
    p_cerrada_en: params.cerradaEn,
    p_clave_idempotencia: params.claveIdempotencia ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.acta_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { actaId: r.acta_id, yaExistia: r.ya_existia === true } };
}

/**
 * La conformidad, **desde la sesión del dueño** — firma simple (Ley 67).
 * 🔴 Nada de dibujar firmas en el teléfono del cuidador: cualquiera garabatea;
 * una sesión propia, no. Y **no confirmar no frena la recogida**.
 */
export async function confirmarActaGuarderia(params: {
  actaId: string;
  conformidad: 'conforme' | 'con_reserva';
  reservaTexto?: string;
}): Promise<ResultadoWrapper<true, CodigoErrorGuarderiaReserva>> {
  const { error } = await getClient().rpc('confirmar_acta_guarderia', {
    p_acta_id: params.actaId,
    p_conformidad: params.conformidad,
    p_reserva_texto: params.reservaTexto ?? undefined,
  });
  if (error) return fallo(error.message);
  return { ok: true, data: true };
}

/* ═══════════════════════════════════════════════════════════════════════════
   EL LOG DE LA FAMILIA — próximas e historial de estadías
   ═══════════════════════════════════════════════════════════════════════════
   Una sola lectura para TRES superficies de C: el **log** del hub, la entrada
   al **durante** y el **acta**. *Los tres pedían lo mismo con tres nombres.*

   🔴 **Se ancla en la CITA, no en la estadía.** La cita es lo que la familia
   COMPRÓ; la estadía es lo que el prestador EJECUTA. *El día que una estadía
   nazca por otro camino —un día de paquete, una mensualidad— la familia tiene
   que seguir viendo lo que pagó.* La estadía entra por LEFT JOIN: si no existe,
   `estadoEstadia` es `null`, que es la verdad y no un hueco.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ✏️ `EstadoEstadia` NO se redeclara: **ya estaba** en este mismo archivo.
   Lo escribí de nuevo y el compilador lo cazó — es el censo de criterios de la
   lección de B, cobrado sobre mí: *el trabajo era leer, no inventar.* */

export interface EstadiaDeMiMascota {
  citaId: string;
  /** `null` mientras la estadía no exista (ver la cabecera). */
  estadiaId: string | null;
  mascotaId: string;
  mascotaNombre: string;
  prestadorId: string;
  prestadorNombre: string;
  /** 'YYYY-MM-DD'. **Una estadía no tiene hora**: tiene día y franja. */
  fecha: string;
  precio: number | null;
  estadoCita: string;
  estadoReserva: string;
  estadoEstadia: EstadoEstadia | null;
  aBordoEn: string | null;
  llegadaEn: string | null;
  entregadaEn: string | null;
  /** Si hay id, hay acta: la pantalla del acta no vuelve a preguntar. */
  actaRecogidaId: string | null;
  actaDevolucionId: string | null;
  /**
   * 🔴 Los dos VIAJES. Con el tramo de la dirección en curso, el mapa del punto
   * vivo se enciende solo (`obtenerPuntoVivo`). *No faltaba entidad — faltaba
   * proyección: los dos campos ya vivían en la tabla.*
   */
  tramoRecogidaId: string | null;
  tramoDevolucionId: string | null;
  /** El server ya decidió de qué lado del hoy cae. La pantalla no compara fechas. */
  esProxima: boolean;
}

export async function obtenerMisEstadiasGuarderia(params?: {
  mascotaId?: string | null;
}): Promise<ResultadoWrapper<EstadiaDeMiMascota[], CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('obtener_mis_estadias_guarderia', {
    p_mascota_id: params?.mascotaId ?? undefined,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  const salida: EstadiaDeMiMascota[] = [];
  for (const e of data) {
    if (typeof e !== 'object' || e === null) return fallaCodigo('datos_inconsistentes');
    const r = e as Record<string, unknown>;
    if (typeof r.cita_id !== 'string' || typeof r.fecha !== 'string') {
      return fallaCodigo('datos_inconsistentes');
    }
    salida.push({
      citaId: r.cita_id,
      estadiaId: typeof r.estadia_id === 'string' ? r.estadia_id : null,
      mascotaId: typeof r.mascota_id === 'string' ? r.mascota_id : '',
      mascotaNombre: typeof r.mascota_nombre === 'string' ? r.mascota_nombre : '',
      prestadorId: typeof r.prestador_id === 'string' ? r.prestador_id : '',
      prestadorNombre: typeof r.prestador_nombre === 'string' ? r.prestador_nombre : '',
      fecha: r.fecha,
      /* `precio` nullable: el día suelto dejó de ser obligatorio, y un `0` acá
         se leería como GRATIS. Null honesto. */
      precio: typeof r.precio === 'number' ? r.precio : null,
      estadoCita: typeof r.estado_cita === 'string' ? r.estado_cita : '',
      estadoReserva: typeof r.estado_reserva === 'string' ? r.estado_reserva : '',
      estadoEstadia: esEstadoEstadia(r.estado_estadia) ? r.estado_estadia : null,
      aBordoEn: typeof r.a_bordo_en === 'string' ? r.a_bordo_en : null,
      llegadaEn: typeof r.llegada_en === 'string' ? r.llegada_en : null,
      entregadaEn: typeof r.entregada_en === 'string' ? r.entregada_en : null,
      actaRecogidaId: typeof r.acta_recogida_id === 'string' ? r.acta_recogida_id : null,
      actaDevolucionId: typeof r.acta_devolucion_id === 'string' ? r.acta_devolucion_id : null,
      tramoRecogidaId: typeof r.tramo_recogida_id === 'string' ? r.tramo_recogida_id : null,
      tramoDevolucionId: typeof r.tramo_devolucion_id === 'string' ? r.tramo_devolucion_id : null,
      esProxima: r.es_proxima === true,
    });
  }
  return { ok: true, data: salida };
}

function esEstadoEstadia(v: unknown): v is EstadoEstadia {
  return (
    v === 'reservada' || v === 'recogida_en_curso' || v === 'en_guarderia' ||
    v === 'retorno_en_curso' || v === 'entregada' || v === 'cancelada' || v === 'no_recogida'
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EL CONTENIDO DEL ACTA — para que la conformidad no se firme a ciegas
   ═══════════════════════════════════════════════════════════════════════════
   🔴 **Existía `confirmarActaGuarderia` y no existía con qué LEERLA.** C no
   montó el botón de conformar a propósito, y su razón es firma de la mesa:
   *la conformidad existe porque el dueño VIO lo que firma.* Un «conforme»
   sobre un acta ilegible **no prueba nada: prueba que alguien tocó un botón.**

   Devuelve **los hechos**, no la voz: `ActaDeEntrega` compone sus `items` con
   el idioma de la casa. *El motor dice el hecho; la voz es de la superficie.*
   ═══════════════════════════════════════════════════════════════════════════ */

export interface MediaDelActa {
  mediaId: string;
  tipo: 'foto' | 'clip';
  archivoUrl: string;
  miniaturaUrl: string | null;
  capturadaEn: string | null;
}

export interface ActaGuarderia {
  actaId: string;
  estadiaId: string;
  direccion: 'recogida' | 'devolucion';
  carnetVerificado: boolean;
  objetos: string | null;
  observaciones: string | null;
  /**
   * 🔴 **EL VOCABULARIO DEL MOTOR — NO SE PASA DIRECTO A `ActaDeEntrega`.**
   * `D-974`: los dos enums comparten la palabra `sin_conformidad` **con
   * sentidos opuestos** — acá es *«todavía no la miró»* (el estado inicial, el
   * más normal) y en la pieza es el **warning** *«aceptó señalando algo»*.
   *
   * *Mapear por identidad pinta el estado más normal como el más grave, y
   * ningún typecheck lo ve: los dos enums son válidos.*
   *
   * El mapeo correcto: `sin_conformidad` → `pendiente` · `conforme` →
   * `conforme` · `con_reserva` → `sin_conformidad`. **Ninguno es la identidad.**
   */
  conformidad: 'sin_conformidad' | 'conforme' | 'con_reserva';
  conformidadEn: string | null;
  reservaTexto: string | null;
  /**
   * 🔴 **La hora de la PUERTA** — la pone el cliente al cerrar el acta en la
   * casa. `recibidaEn` es cuándo llegó al servidor. *Son dos hechos distintos
   * y se muestran los dos: la diferencia entre ellos es la cola offline.*
   */
  cerradaEn: string | null;
  recibidaEn: string | null;
  mascotaNombre: string;
  prestadorNombre: string;
  media: MediaDelActa[];
}

export async function obtenerActaGuarderia(
  actaId: string,
): Promise<ResultadoWrapper<ActaGuarderia, CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('obtener_acta_guarderia', { p_acta_id: actaId });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.actaId !== 'string' || typeof r.estadiaId !== 'string') {
    return fallaCodigo('datos_inconsistentes');
  }
  const dir = r.direccion;
  if (dir !== 'recogida' && dir !== 'devolucion') return fallaCodigo('datos_inconsistentes');
  const conf = r.conformidad;
  if (conf !== 'sin_conformidad' && conf !== 'conforme' && conf !== 'con_reserva') {
    return fallaCodigo('datos_inconsistentes');
  }
  const media: MediaDelActa[] = [];
  if (Array.isArray(r.media)) {
    for (const m of r.media) {
      if (typeof m !== 'object' || m === null) continue;
      const x = m as Record<string, unknown>;
      if (typeof x.mediaId !== 'string' || typeof x.archivoUrl !== 'string') continue;
      media.push({
        mediaId: x.mediaId,
        tipo: x.tipo === 'clip' ? 'clip' : 'foto',
        archivoUrl: x.archivoUrl,
        miniaturaUrl: typeof x.miniaturaUrl === 'string' ? x.miniaturaUrl : null,
        capturadaEn: typeof x.capturadaEn === 'string' ? x.capturadaEn : null,
      });
    }
  }
  return {
    ok: true,
    data: {
      actaId: r.actaId,
      estadiaId: r.estadiaId,
      direccion: dir,
      carnetVerificado: r.carnetVerificado === true,
      objetos: typeof r.objetos === 'string' ? r.objetos : null,
      observaciones: typeof r.observaciones === 'string' ? r.observaciones : null,
      conformidad: conf,
      conformidadEn: typeof r.conformidadEn === 'string' ? r.conformidadEn : null,
      reservaTexto: typeof r.reservaTexto === 'string' ? r.reservaTexto : null,
      cerradaEn: typeof r.cerradaEn === 'string' ? r.cerradaEn : null,
      recibidaEn: typeof r.recibidaEn === 'string' ? r.recibidaEn : null,
      mascotaNombre: typeof r.mascotaNombre === 'string' ? r.mascotaNombre : '',
      prestadorNombre: typeof r.prestadorNombre === 'string' ? r.prestadorNombre : '',
      media,
    },
  };
}
