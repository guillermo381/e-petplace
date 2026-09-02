// El motor de adopción — S111-A. La vidriera, la publicación y el traspaso.
//
// Motor: `supabase/migrations/20260907500000_s111a_motor_adopcion.sql`.
// Letra: `docs/LETRA_ADOPCION.md` — **§0: el expediente empieza en el rescate y
// se hereda.** Eso es lo que hace que el traspaso sea un ACTO y no un UPDATE.
//
// 🔴 LO QUE ESTE ARCHIVO EXISTE PARA CURAR, medido antes de escribirlo: **cero
// funciones de adopción sobre 369 migraciones con `CREATE FUNCTION`, cero
// wrappers.** Tres bloques de tres pistas distintas estaban parados por esto —
// `Convivencia` de B y `packages/mensajeria` de D existían y **no tenían de qué
// hablar**.
//
// 🔴 Y LO QUE **NO** HACE, para que nadie lo busque acá: no reusa ninguna de las
// cinco tablas legado (`solicitudes_adopcion`, `mascotas_adopcion`,
// `adopcion_seguimiento`, `refugios`, `donaciones`). No se construye sobre ellas
// **y no se borran** (`D-991`).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  /* 🔴 Hoy hay CERO cuentas con rol `refugio`: las crea el admin. Este rebote
     es el estado normal del sistema, no una falla — y por eso habla claro. */
  no_sos_cuenta_de_refugio: 'Esta cuenta todavía no está habilitada para publicar animales en adopción.',
  mascota_no_existe:        'No encontramos esa mascota.',
  /* Una mascota sin familia no se publica: el traspaso mueve DE una familia A
     otra, y §0 dice que el refugio ES la familia hasta la entrega. */
  mascota_sin_familia:      'Ese animal todavía no tiene familia asignada en el refugio.',
  publicacion_no_existe:    'No encontramos esa publicación.',
  sin_publicacion_viva:     'Ese animal no está publicado en adopción.',
  familia_destino_no_existe:'No encontramos la familia que va a recibirlo.',
  familia_destino_igual_al_origen: 'Ese animal ya está en esa familia.',
  /* 🔴 EL FAIL-CLOSED DEL ACTA, y su voz dice de qué lado está el problema:
     no falta que la persona haga algo — falta que la casa cargue el documento.
     *Pedirle a alguien que reintente algo que no depende de él es peor que
     decirle que no.* */
  acta_no_disponible:       'Todavía no podemos completar la adopción: falta cargar el acta. Es de nuestro lado.',
  sin_acceso:               'Esta publicación no es tuya.',
  /* ── La mensajería ─────────────────────────────────────────────────────── */
  publicacion_no_disponible:'Ese animal ya no está publicado en adopción.',
  /* 🔴 El motor manda el id de la solicitud que YA existe detrás del código:
     la pantalla LLEVA ahí en vez de decir que no (`L-424`). */
  solicitud_ya_viva:        'Ya postulaste por este animal.',
  solicitud_terminal:       'Esta conversación ya se cerró.',
  estado_final_invalido:    'Esa forma de cerrar no existe.',
  rol_no_puede:             'Sólo quien publicó al animal puede aceptar una solicitud.',
  mensaje_vacio:            'Escribe algo antes de enviar.',
  cuerpo_vacio:             'Escribe algo antes de enviar.',
  sin_sesion:               'No hay sesión activa.',
  datos_inconsistentes:     'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:        'Ocurrió un error inesperado. Prueba de nuevo.',
  /* ═══ S112-A · adenda 10 punto 3 — las tres voces de los documentos ═══════
     `condiciones_no_aceptadas` es la razón de la compuerta de postular, y su
     voz NO dice «error»: dice qué falta hacer. La pantalla lleva a la lectura,
     no muestra un rebote. */
  condiciones_no_aceptadas: 'Antes de postular hay que leer y aceptar las condiciones de adopción.',
  /* Fail-closed CON VOZ: el documento no está cargado. La familia no hizo nada
     mal — nombrar el código sirve para que la pantalla diga cuál falta. */
  documento_no_disponible: 'Ese documento todavía no está publicado.',
  /* El acta NO se acepta: se FIRMA. Son dos actos distintos y el motor los
     separa a propósito. */
  documento_no_aceptable: 'Ese documento no se acepta por esta vía.',
} as const;

export type CodigoErrorAdopcion = keyof typeof MENSAJES;
const CODIGOS = Object.keys(MENSAJES) as CodigoErrorAdopcion[];

function fallaCodigo<T>(
  c: CodigoErrorAdopcion,
  detalle: string | null = null,
): ResultadoWrapper<T, CodigoErrorAdopcion> {
  return { ok: false, codigo: c, mensaje: MENSAJES[c], detalle };
}
/* Regla 35: se discrimina por PREFIJO de código, jamás por prosa. El motor manda
   `acta_no_disponible: acta_adopcion v1` y el detalle viaja detrás del código.
   ═══════════════════════════════════════════════════════════════════════════
   🔴 LO QUE ESTA FUNCIÓN TIRABA, Y POR QUÉ IMPORTA (S112-D)

   El comentario de arriba ya decía *«el detalle viaja detrás del código»* — y
   **esta función lo descartaba**: mapeaba por prefijo y devolvía el mensaje
   estático, sin el resto del crudo. ⇒ `crear_solicitud_adopcion` se toma el
   trabajo de mandar `solicitud_ya_viva: <uuid>` **para poder LLEVAR a esa
   solicitud** (`L-424`: *el índice sólo sabe negarse; el guard explica*), y el
   uuid **moría acá**.

   > ### `L-424` quedaba cumplida en el motor y deshecha en la puerta.

   Y su forma era la peor posible: **el JSDoc de `crearSolicitudAdopcion`
   afirmaba que el id viajaba en `mensaje`** (hoy corregido). *Un hueco callado
   deja a alguien buscando; un comentario que promete de más lo manda a
   construir contra algo que no existe.*

   ⚠️ **La regla 35 NO se afloja, y el campo nació justo para esto:** `detalle`
   se agregó a `ResultadoWrapper` en S109 porque *«el motor ya calculaba la
   causa y el wrapper la tiraba»*. Se **muestra** y se **navega** con él; se
   **ramifica** SIEMPRE por `codigo`. Lo vigila `scripts/verify-rebote-lleva-id.mjs`,
   que tiene un brazo en rojo si alguien mete el crudo en `mensaje`.
   ═══════════════════════════════════════════════════════════════════════════ */
function fallo<T>(raw: string): ResultadoWrapper<T, CodigoErrorAdopcion> {
  if (raw === 'auth_required') return fallaCodigo('sin_sesion');
  for (const c of CODIGOS) {
    if (!raw.startsWith(c)) continue;
    /* Lo que el motor dijo ADEMÁS del código. Vacío ⇒ `null`: un detalle
       inventado es peor que ninguno. */
    const resto = raw.slice(c.length).replace(/^:\s*/, '').trim();
    return fallaCodigo(c, resto || null);
  }
  /* Un crudo que no reconocemos se CONSERVA entero: es lo único que va a tener
     quien diagnostique el día que el motor agregue un código y esta lista no. */
  return fallaCodigo('error_desconocido', raw);
}

/* ═══════════════════════════════════════════════════════════════════════════
   ① LA VIDRIERA
   🔴 La pantalla NO enumera estados. El motor filtra por
   `cat_estados_adopcion.visible_en_vidriera`, así que el día que nazca un sexto
   estado la vidriera no se olvida de él.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Adoptable {
  publicacionId: string;
  mascotaId: string;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: string | null;
  /** `null` = no se sabe. **No se infiere una edad que nadie declaró.** */
  fechaNacimiento: string | null;
  fotoUrl: string | null;
  /** Quién lo publicó. El refugio es procedencia, no un adorno. */
  publicadorNombre: string | null;
  creadaEn: string;
}

export async function obtenerAdoptables(params?: {
  especie?: string;
  countryCode?: string;
  limite?: number;
}): Promise<ResultadoWrapper<Adoptable[], CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('obtener_adoptables', {
    p_especie: params?.especie ?? undefined,
    p_country_code: params?.countryCode ?? undefined,
    p_limite: params?.limite ?? undefined,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  const salida: Adoptable[] = [];
  for (const fila of data as Record<string, unknown>[]) {
    if (typeof fila.publicacion_id !== 'string' || typeof fila.mascota_id !== 'string') {
      return fallaCodigo('datos_inconsistentes');
    }
    salida.push({
      publicacionId: fila.publicacion_id,
      mascotaId: fila.mascota_id,
      nombre: typeof fila.nombre === 'string' ? fila.nombre : '',
      especie: typeof fila.especie === 'string' ? fila.especie : '',
      raza: typeof fila.raza === 'string' ? fila.raza : null,
      sexo: typeof fila.sexo === 'string' ? fila.sexo : null,
      fechaNacimiento: typeof fila.fecha_nacimiento === 'string' ? fila.fecha_nacimiento : null,
      fotoUrl: typeof fila.foto_url === 'string' ? fila.foto_url : null,
      publicadorNombre: typeof fila.publicador_nombre === 'string' ? fila.publicador_nombre : null,
      creadaEn: String(fila.creada_en),
    });
  }
  return { ok: true, data: salida };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ② PUBLICAR Y RETIRAR — del lado del refugio
   ═══════════════════════════════════════════════════════════════════════════ */

/** Publica al animal en la vidriera. **Idempotente y hablada**: si ya estaba
 *  publicado devuelve la publicación que existe, con `yaExistia: true` — *un
 *  guard que vive en un índice sólo sabe negarse* (`L-424`). */
export async function publicarAdoptable(params: {
  mascotaId: string;
  cuentaComercialId: string;
}): Promise<ResultadoWrapper<{ publicacionId: string; yaExistia: boolean }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('publicar_adoptable', {
    p_mascota_id: params.mascotaId,
    p_cuenta_comercial_id: params.cuentaComercialId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.publicacion_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { publicacionId: r.publicacion_id, yaExistia: r.ya_existia === true } };
}

/** Retira la publicación. 🔴 **Retirar NO es rechazar**: la mascota queda en
 *  `pausada`, no en `no_aplica` — *el día que el refugio la vuelva a publicar,
 *  su historia sigue.* */
export async function despublicarAdoptable(params: {
  publicacionId: string;
  motivo?: string;
}): Promise<ResultadoWrapper<{ yaEstaba: boolean }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('despublicar_adoptable', {
    p_publicacion_id: params.publicacionId,
    p_motivo: params.motivo ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { yaEstaba: (data as Record<string, unknown>).ya_estaba === true } };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ③ EL TRASPASO — un ACTO, no un UPDATE
   🔴 En una sola transacción del motor: la mascota cambia de familia · el
   acceso viejo se CIERRA con `hasta` (no se borra: *borrarlo diría que esa
   familia nunca lo tuvo*) · nace el evento `transferencia_familia` con **el
   refugio como procedencia permanente** · la publicación se cierra.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ResultadoTraspaso {
  mascotaId: string;
  familiaOrigen: string | null;
  familiaDestino: string;
  /** El rastro. **Es lo único que justifica que esto sea una RPC y no un
   *  `UPDATE`** — sin él, el expediente diría que el animal siempre estuvo ahí. */
  eventoId: string;
  accesosCerrados: number;
  publicacionId: string;
}

/**
 * 🔴 **FAIL-CLOSED, Y HOY NO ABRE.** Exige un acta versionada cargada en
 * `adopcion_documentos`, que **nace vacía a propósito**: el texto es del paquete
 * del abogado y está estacionado. Hoy esto rebota `acta_no_disponible` siempre,
 * y **el día que la mesa cargue el texto la puerta se abre sola, sin tocar una
 * línea de código.**
 *
 * *La regla del loop al pie: sin documento cargado, la puerta no se abre.*
 */
export async function traspasarMascotaAFamilia(params: {
  mascotaId: string;
  familiaDestinoId: string;
  actaVersion: number;
  /** Por defecto `acta_adopcion`. Se expone porque el código del documento es
   *  del dominio de la mesa, no de esta capa. */
  actaCodigo?: string;
}): Promise<ResultadoWrapper<ResultadoTraspaso, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('traspasar_mascota_a_familia', {
    p_mascota_id: params.mascotaId,
    p_familia_destino_id: params.familiaDestinoId,
    p_acta_version: params.actaVersion,
    p_acta_codigo: params.actaCodigo ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.mascota_id !== 'string' || typeof r.evento_id !== 'string') {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      mascotaId: r.mascota_id,
      familiaOrigen: typeof r.familia_origen === 'string' ? r.familia_origen : null,
      familiaDestino: String(r.familia_destino),
      eventoId: r.evento_id,
      accesosCerrados: typeof r.accesos_cerrados === 'number' ? r.accesos_cerrados : 0,
      publicacionId: String(r.publicacion_id),
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ④ LA MENSAJERÍA — la solicitud, el hilo y su desenlace
   🔴 ESTOS WRAPPERS EXISTEN PORQUE FALTABAN, y la falta la midió C: las cuatro
   RPC del motor estaban vivas y **sin una sola puerta** — desde `apps/` no se
   llama `rpc()` directo. *El contrato de una pieza de motor incluye su wrapper*,
   y esta vez el que lo olvidó fui yo.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ `EstadoSolicitudAdopcion`, NO `EstadoSolicitudAdopcion`: ese nombre ya lo usa
   `veterinaria-mostrador` para OTRA cosa —la autorización del mostrador
   (`pendiente | autorizada | rechazada | expirada`)—. *Dos uniones distintas
   con el mismo nombre no chocan por casualidad: chocan porque el nombre no
   decía de qué dominio era.* Lo cazó el typecheck, no una relectura. */
export type EstadoSolicitudAdopcion = 'recibida' | 'en_conversacion' | 'aceptada' | 'declinada';

export interface MensajeDelHilo {
  mensajeId: string;
  autorUserId: string;
  cuerpo: string;
  /** 🔴 `true` = la respuesta automática del publicador. **No cuenta como
   *  respuesta**: si contara, el reloj de los 5 días no sonaría nunca. La
   *  pantalla puede mostrarla distinta; el reloj la ignora. */
  automatica: boolean;
  creadoEn: string;
}

/** El hilo como lo ve LA FAMILIA. */
export interface MiSolicitud {
  solicitudId: string;
  publicacionId: string;
  estado: EstadoSolicitudAdopcion;
  creadaEn: string;
  cerradaEn: string | null;
  mascotaId: string;
  mascotaNombre: string;
  mascotaEspecie: string;
  mascotaFotoUrl: string | null;
  publicadorNombre: string | null;
  /** Vienen CON el hilo, no en otro viaje. */
  mensajes: MensajeDelHilo[];
}

/** El hilo como lo ve EL PUBLICADOR. Es otro tipo a propósito: **ve al
 *  solicitante y no ve al publicador**, porque es él. */
export interface SolicitudRecibida {
  solicitudId: string;
  publicacionId: string;
  estado: EstadoSolicitudAdopcion;
  creadaEn: string;
  cerradaEn: string | null;
  solicitanteUserId: string;
  solicitanteNombre: string | null;
  mascotaId: string;
  mascotaNombre: string;
  mascotaFotoUrl: string | null;
  mensajes: MensajeDelHilo[];
}

function leerMensajes(v: unknown): MensajeDelHilo[] {
  if (!Array.isArray(v)) return [];
  return (v as Record<string, unknown>[]).map((m) => ({
    mensajeId: String(m.mensajeId),
    autorUserId: String(m.autorUserId),
    cuerpo: typeof m.cuerpo === 'string' ? m.cuerpo : '',
    automatica: m.automatica === true,
    creadoEn: String(m.creadoEn),
  }));
}

/**
 * Postula para adoptar. 🔴 **Si ya tenías una solicitud viva sobre ese animal,
 * el rebote `solicitud_ya_viva` trae SU ID en `detalle`** — la pantalla lleva
 * ahí en vez de decir que no (`L-424`).
 *
 * ⚠️ **Decía `mensaje` y era falso** (curado S112-D): `mensaje` es la frase
 * humana y jamás lleva el uuid. Se ramifica por `codigo`, se navega con
 * `detalle`.
 */
export async function crearSolicitudAdopcion(params: {
  publicacionId: string;
  mensajeInicial?: string;
}): Promise<ResultadoWrapper<{ solicitudId: string; estado: EstadoSolicitudAdopcion }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('crear_solicitud_adopcion', {
    p_publicacion_id: params.publicacionId,
    p_mensaje_inicial: params.mensajeInicial ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.solicitud_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { solicitudId: r.solicitud_id, estado: r.estado as EstadoSolicitudAdopcion } };
}

/** Escribe en el hilo. 🔑 **Si el que responde es el publicador y la solicitud
 *  estaba `recibida`, el estado se mueve EN EL MISMO ACTO** — la pantalla no
 *  tiene que acordarse: *un estado que alguien tiene que acordarse de mover es
 *  un estado que va a estar mal.* */
export async function responderSolicitudAdopcion(params: {
  solicitudId: string;
  cuerpo: string;
}): Promise<ResultadoWrapper<{ mensajeId: string; estado: EstadoSolicitudAdopcion }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('responder_solicitud_adopcion', {
    p_solicitud_id: params.solicitudId,
    p_cuerpo: params.cuerpo,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.mensaje_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { mensajeId: r.mensaje_id, estado: r.estado as EstadoSolicitudAdopcion } };
}

/** Cierra la solicitud. **Sólo el publicador ACEPTA; declinar pueden los dos.**
 *  ⚠️ `aceptada` **no** dispara el acta ni la transferencia del expediente: ese
 *  arco vive en `traspasarMascotaAFamilia`, con su propio fail-closed. */
export async function cerrarSolicitudAdopcion(params: {
  solicitudId: string;
  estadoFinal: 'aceptada' | 'declinada';
}): Promise<ResultadoWrapper<{ estado: EstadoSolicitudAdopcion }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('cerrar_solicitud_adopcion', {
    p_solicitud_id: params.solicitudId,
    p_estado_final: params.estadoFinal,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { estado: (data as Record<string, unknown>).estado as EstadoSolicitudAdopcion } };
}

/** Mis solicitudes, con sus hilos. Lado FAMILIA. */
export async function obtenerMisSolicitudesAdopcion(): Promise<
  ResultadoWrapper<MiSolicitud[], CodigoErrorAdopcion>
> {
  const { data, error } = await getClient().rpc('obtener_mis_solicitudes_adopcion');
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: (data as Record<string, unknown>[]).map((f) => ({
      solicitudId: String(f.solicitud_id),
      publicacionId: String(f.publicacion_id),
      estado: f.estado as EstadoSolicitudAdopcion,
      creadaEn: String(f.creada_en),
      cerradaEn: typeof f.cerrada_en === 'string' ? f.cerrada_en : null,
      mascotaId: String(f.mascota_id),
      mascotaNombre: typeof f.mascota_nombre === 'string' ? f.mascota_nombre : '',
      mascotaEspecie: typeof f.mascota_especie === 'string' ? f.mascota_especie : '',
      mascotaFotoUrl: typeof f.mascota_foto_url === 'string' ? f.mascota_foto_url : null,
      publicadorNombre: typeof f.publicador_nombre === 'string' ? f.publicador_nombre : null,
      mensajes: leerMensajes(f.mensajes),
    })),
  };
}

/** Las solicitudes de MIS publicaciones. Lado PUBLICADOR.
 *  🔴 El gate es **la publicación, no el refugio**: dos personas del mismo
 *  refugio no ven solicitudes de animales que no publicaron. */
export async function obtenerSolicitudesDeMisPublicaciones(
  soloPorRevisar = false,
): Promise<ResultadoWrapper<SolicitudRecibida[], CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('obtener_solicitudes_de_mis_publicaciones', {
    p_solo_por_revisar: soloPorRevisar,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: (data as Record<string, unknown>[]).map((f) => ({
      solicitudId: String(f.solicitud_id),
      publicacionId: String(f.publicacion_id),
      estado: f.estado as EstadoSolicitudAdopcion,
      creadaEn: String(f.creada_en),
      cerradaEn: typeof f.cerrada_en === 'string' ? f.cerrada_en : null,
      solicitanteUserId: String(f.solicitante_user_id),
      solicitanteNombre: typeof f.solicitante_nombre === 'string' ? f.solicitante_nombre : null,
      mascotaId: String(f.mascota_id),
      mascotaNombre: typeof f.mascota_nombre === 'string' ? f.mascota_nombre : '',
      mascotaFotoUrl: typeof f.mascota_foto_url === 'string' ? f.mascota_foto_url : null,
      mensajes: leerMensajes(f.mensajes),
    })),
  };
}

/**
 * Cuántas solicitudes tengo por revisar. 🔴 **Se cuenta en el SERVIDOR, a
 * propósito.** Derivarlo contando lo que trajo la pantalla haría que el número
 * dependa de cuántas páginas se pidieron — *y un contador que miente hacia
 * abajo es peor que no tenerlo: dice que no hay trabajo pendiente.*
 * **Puede llegar a cero**, que es lo que §9 pide de un contador.
 */
export async function contarSolicitudesPorRevisar(): Promise<
  ResultadoWrapper<number, CodigoErrorAdopcion>
> {
  const { data, error } = await getClient().rpc('contar_solicitudes_por_revisar');
  if (error) return fallo(error.message);
  if (typeof data !== 'number') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data };
}


/* ═══════════════════════════════════════════════════════════════════════════
 * S112-A · LOS DOCUMENTOS DE ADOPCIÓN — entrega para C (adenda 10 punto 3).
 *
 * 🔴 **LA VERSIÓN VIAJA CON EL CUERPO, Y ESO NO ES COMODIDAD.** Es para que la
 * app NUNCA elija una versión: versión y texto son el mismo dato y viven juntos
 * (`L-166`, el precedente de `URL_LEGAL`/`VERSION_LEGAL` de S104). Si la
 * pantalla hardcodeara la versión, el día que se publique la v2 seguiría
 * mostrando y aceptando la v1 **y todo compilaría** — ni el typecheck ni ningún
 * gate lo verían.
 *
 * Por la misma razón `aceptar` **no recibe versión**: la resuelve el servidor.
 * Y **el hash tampoco viene del cliente**: si la app lo mandara, la evidencia
 * diría lo que el cliente quiso decir.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface DocumentoVigente {
  codigo: string;
  /** Se pasa de vuelta tal cual al aceptar o al firmar. La app no la elige. */
  version: number;
  contenido: string;
  sha256: string;
  esPlantilla: boolean;
  vigenteDesde: string;
}

export async function obtenerDocumentoVigente(
  codigo: 'terminos_refugio' | 'condiciones_adopcion' | 'acta_adopcion',
): Promise<ResultadoWrapper<DocumentoVigente, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('obtener_documento_vigente', { p_codigo: codigo });
  if (error) return fallo(error.message);
  const r = data as Record<string, unknown> | null;
  if (r === null || typeof r.contenido !== 'string') return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: {
      codigo: String(r.codigo),
      version: Number(r.version),
      contenido: r.contenido,
      sha256: String(r.sha256),
      esPlantilla: r.es_plantilla === true,
      vigenteDesde: String(r.vigente_desde),
    },
  };
}

/** ¿Este usuario ya aceptó la versión VIGENTE? Aceptar la v1 no vale si rige la v2. */
export async function tengoAceptadoDocumento(
  codigo: 'terminos_refugio' | 'condiciones_adopcion',
): Promise<ResultadoWrapper<boolean, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('tengo_aceptado_documento', { p_codigo: codigo });
  if (error) return fallo(error.message);
  if (typeof data !== 'boolean') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data };
}

export interface AceptacionRegistrada {
  yaEstaba: boolean;
  consentimientoId: string;
  codigo: string;
  version: number;
}

/**
 * Registra la aceptación con su evidencia: usuario · documento · versión ·
 * hash · sello de tiempo · IP · dispositivo. **Idempotente**: dos toques del
 * mismo botón no son dos consentimientos.
 *
 * `ipHash` y `dispositivo` son lo único que la app aporta, y son datos DE LA
 * APP —no del documento—: por eso sí pueden venir de acá.
 */
export async function aceptarDocumentoAdopcion(input: {
  codigo: 'terminos_refugio' | 'condiciones_adopcion';
  ipHash?: string;
  dispositivo?: string;
}): Promise<ResultadoWrapper<AceptacionRegistrada, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('aceptar_documento_adopcion', {
    p_codigo: input.codigo,
    p_ip_hash: input.ipHash,
    p_dispositivo: input.dispositivo,
  });
  if (error) return fallo(error.message);
  const r = data as Record<string, unknown> | null;
  if (r === null || typeof r.consentimiento_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: {
      yaEstaba: r.ya_estaba === true,
      consentimientoId: r.consentimiento_id,
      codigo: String(r.codigo),
      version: Number(r.version),
    },
  };
}
