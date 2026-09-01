// El DURANTE de guardería — S110-A. La puerta de los cinco actos del día.
//
// Contrato: `docs/loop/S110-A-CENSO-Y-MAPA.md` (censo + mapa) · motor:
// `supabase/migrations/20260907420000_s110a_durante_guarderia.sql`.
//
// 🔴 LO QUE ESTE ARCHIVO EXISTE PARA CURAR, medido antes de escribirlo: de los
// SIETE estados del CHECK de `guarderia_estadias`, sólo `reservada` (un
// DEFAULT) y `cancelada` (el reverso de pago) tenían escritor. **Los CINCO del
// día no lo tenían**, y por eso `obtener_tramo_vivo_de_mi_mascota` y
// `obtener_punto_vivo` —que filtran por `recogida_en_curso` /
// `retorno_en_curso`— DESCARTABAN SIEMPRE. *No fallaban: omitían.*
//
// 🔴 LAS DOS HORAS, Y NO SON LA MISMA (enmienda de mesa, S110):
//   · `ocurridoEn` **la declara el aparato EN LA PUERTA** y viaja dentro del
//     payload encolado. Es la que el acta y la familia muestran.
//   · `registradoEn` la pone el servidor y **no se edita jamás**.
//   La auditoría conserva las dos y **su divergencia queda visible**.
//   > ### El porqué: con cola offline, el `now()` del servidor es la hora de la SEÑAL, no la del ACTO.
//   *La mesa había firmado antes «la hora la pone el servidor, siempre» y la
//   derogó sobre este dato. La trampa ya la había pagado
//   `levantar_acta_guarderia`: su cinturón tiene el brazo que lo dice.*
//
// 🔴 LA IDEMPOTENCIA ES DEL ACTO, NO DEL ACTA. Clave `(estadía, acto)`, con un
// índice único de piso. Repetir devuelve el resultado ORIGINAL con su hora
// original — **incluso si la estadía ya avanzó**: reintentar `marcarABordo`
// cuando el animal ya llegó devuelve lo de antes, no un error. *Con
// idempotencia por estado, la cola que reintenta tarde recibía un rebote sobre
// algo que ya había hecho bien.*

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import type { EstadoEstadia } from './guarderia-reserva';

const MENSAJES = {
  /* ── Los rebotes del durante ─────────────────────────────────────────── */
  /* 🔴 Frena bien Y explica: una estadía cancelada por reverso de pago no
     vuelve al día, y quien lo intente no tiene que adivinar por qué. */
  estadia_cancelada:        'Esa reserva se canceló porque el pago se revirtió. Ya no forma parte del día.',
  estadia_en_estado_final:  'Esa estadía ya terminó. No se puede seguir moviendo.',
  /* El motor manda el estado actual en el mensaje; la pantalla lo usa para
     decir en qué punto está, no para adivinar. */
  transicion_ilegal:        'Ese paso no sigue al estado en que está la estadía.',
  sin_tramo_abierto:        'Primero hay que abrir el viaje del día.',
  /* 🔴 Un lote que no movió NADA no puede leerse como éxito. */
  ninguna_transicion_posible: 'Ninguna de esas estadías se pudo mover.',
  sin_estadias:             'No hay ninguna estadía seleccionada.',
  motivo_invalido:          'Ese motivo no está en la lista.',
  motivo_otro_exige_detalle:'Si el motivo es «otro», hay que contar qué pasó.',
  acto_invalido:            'Ese paso del día no existe.',
  falta_hora_de_la_puerta:  'Falta la hora en que ocurrió.',
  /* Un reloj adelantado no puede sellar un acto en el futuro. */
  hora_de_la_puerta_en_el_futuro: 'La hora que llegó es del futuro. Revisa la hora del teléfono.',

  /* ── Los de siempre ──────────────────────────────────────────────────── */
  estadia_no_existe:        'No encontramos esa estadía.',
  tramo_no_existe:          'No encontramos ese viaje.',
  direccion_invalida:       'Ese momento de la estadía no existe.',
  no_gestionas_este_prestador: 'No gestionas este negocio.',
  sin_sesion:               'No hay sesión activa.',
  datos_inconsistentes:     'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:        'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorGuarderiaDurante = keyof typeof MENSAJES;
const CODIGOS = Object.keys(MENSAJES) as CodigoErrorGuarderiaDurante[];

function fallaCodigo<T>(c: CodigoErrorGuarderiaDurante): ResultadoWrapper<T, CodigoErrorGuarderiaDurante> {
  return { ok: false, codigo: c, mensaje: MENSAJES[c] };
}
/* Regla 35: se discrimina por PREFIJO de código, jamás por prosa. El motor
   manda `transicion_ilegal: en_guarderia (esperaba …)` y el detalle viaja
   detrás del código sin cambiar cuál es. */
function fallo<T>(raw: string): ResultadoWrapper<T, CodigoErrorGuarderiaDurante> {
  if (raw === 'auth_required') return fallaCodigo('sin_sesion');
  for (const c of CODIGOS) if (raw.startsWith(c)) return fallaCodigo(c);
  return fallaCodigo('error_desconocido');
}

/* ═══════════════════════════════════════════════════════════════════════════
   ① LA MÁQUINA, COMO DATO
   🔴 La pantalla NO declara el vocabulario: lo LEE. El lector publica las
   MISMAS filas que el escritor obedece (`cat_guarderia_estados` y
   `cat_guarderia_transiciones`), así que no puede ofrecer una transición que
   el motor rechaza.
   ═══════════════════════════════════════════════════════════════════════════ */

/* 🔴 `EstadoEstadia` NO se redeclara acá: se IMPORTA de `guarderia-reserva`,
   donde ya vivía. *Escribir la misma unión dos veces es exactamente la
   duplicación que el catálogo del motor existe para no tener* — y con dos
   copias, el día que nazca un octavo estado una de las dos se olvida.
   Lo cazó el typecheck (`TS2300: Duplicate identifier`), no una relectura. */
export type { EstadoEstadia } from './guarderia-reserva';

export type ActoDelDurante =
  | 'a_bordo' | 'llegada' | 'retorno' | 'entregada' | 'no_recogida';

export type MotivoNoRecogida =
  | 'nadie_en_domicilio' | 'animal_no_entregado' | 'familia_cancelo_en_puerta' | 'otro';

export interface MaquinaEstadia {
  estados: {
    estado: EstadoEstadia;
    esTerminal: boolean;
    /** Quién lo escribe. `reservada` = el default de la columna;
     *  `cancelada` = `mover_sujeto_por_reverso`, **que no es un acto del
     *  durante** y por eso se declara en vez de omitirse. */
    escritor: string;
  }[];
  actos: {
    acto: ActoDelDurante;
    desde: EstadoEstadia;
    hasta: EstadoEstadia;
    exigeTramo: 'recogida' | 'devolucion' | null;
    esLote: boolean;
    levantaActa: 'recogida' | 'devolucion' | null;
  }[];
  motivosNoRecogida: MotivoNoRecogida[];
}

export async function obtenerMaquinaEstadia(): Promise<
  ResultadoWrapper<MaquinaEstadia, CodigoErrorGuarderiaDurante>
> {
  const { data, error } = await getClient().rpc('obtener_maquina_estadia_guarderia');
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (!Array.isArray(r.estados) || !Array.isArray(r.actos) || !Array.isArray(r.motivosNoRecogida)) {
    return fallaCodigo('datos_inconsistentes');
  }
  return { ok: true, data: data as unknown as MaquinaEstadia };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ② LOS DOS ACTOS ÚNICOS — acta y estado en LA MISMA transacción del servidor
   «Un solo toque, no son dos botones» (founder). Si el acta falla, el estado
   NO se mueve: es una transacción del motor, no dos llamadas que la pantalla
   coordina — *dos llamadas que la pantalla coordina se parten cuando el
   teléfono se queda sin señal en el medio.*
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ResultadoActoUnico {
  estadiaId: string;
  estado: EstadoEstadia;
  /** `true` = el acto YA se había registrado. **El reintento devuelve el
   *  resultado original con su hora original y no escribe nada** — se puede
   *  reproducir la cola sin miedo, aunque la estadía haya avanzado. */
  yaEstaba: boolean;
  /** LA HORA DE LA PUERTA, tal como la declaró el aparato. El servidor no la
   *  pisa. Es la que se muestra. */
  ocurridoEn: string;
  /** La hora del SERVIDOR. No se edita jamás. Con cola offline diverge de
   *  `ocurridoEn`, y esa divergencia es el dato. */
  registradoEn: string;
  actaId: string;
  /** `true` = el acta ya existía (la levantó un intento anterior). Es un hecho
   *  DISTINTO de `yaEstaba`: el acta puede existir sin que el estado se haya
   *  movido, y la pantalla necesita poder decirlo. */
  actaYaExistia: boolean;
}

export interface PayloadActa {
  carnetVerificado: boolean;
  objetos?: string;
  observaciones?: string;
  /** Identificador del envío, para que la cola pueda reintentar sin duplicar. */
  claveIdempotencia?: string;
  /** 🔴 LA HORA DE LA PUERTA (ISO) — la del ACTO, no la de la subida. Si el
   *  teléfono no tenía señal, va la hora real del momento. Sella el acta **y**
   *  el estado; el servidor guarda aparte cuándo lo recibió. */
  ocurridoEn: string;
}

function leerActoUnico(
  data: unknown,
): ResultadoWrapper<ResultadoActoUnico, CodigoErrorGuarderiaDurante> {
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.estadia_id !== 'string' || typeof r.estado !== 'string'
      || typeof r.acta_id !== 'string' || typeof r.ocurrido_en !== 'string') {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      estadiaId: r.estadia_id,
      estado: r.estado as EstadoEstadia,
      yaEstaba: r.ya_estaba === true,
      ocurridoEn: r.ocurrido_en,
      registradoEn: String(r.registrado_en),
      actaId: r.acta_id,
      actaYaExistia: r.acta_ya_existia === true,
    },
  };
}

/** El animal sube al vehículo, en la puerta de su casa. Levanta el acta de
 *  RECOGIDA y mueve `reservada → recogida_en_curso` en el mismo acto.
 *  🔴 Exige un tramo de recogida ABIERTO y con la estadía atada
 *  (`abrirTramoGuarderia` con sus estadías); si no, rebota `sin_tramo_abierto`. */
export async function marcarABordo(
  estadiaId: string, acta: PayloadActa,
): Promise<ResultadoWrapper<ResultadoActoUnico, CodigoErrorGuarderiaDurante>> {
  const { data, error } = await getClient().rpc('marcar_a_bordo_guarderia', {
    p_estadia_id: estadiaId,
    p_carnet_verificado: acta.carnetVerificado,
    p_ocurrido_en: acta.ocurridoEn,
    p_objetos: acta.objetos ?? undefined,
    p_observaciones: acta.observaciones ?? undefined,
    p_clave_idempotencia: acta.claveIdempotencia ?? undefined,
  });
  if (error) return fallo(error.message);
  return leerActoUnico(data);
}

/** El animal vuelve a su casa. Levanta el acta ESPEJO de devolución y mueve
 *  `retorno_en_curso → entregada`. */
export async function marcarEntregada(
  estadiaId: string, acta: PayloadActa,
): Promise<ResultadoWrapper<ResultadoActoUnico, CodigoErrorGuarderiaDurante>> {
  const { data, error } = await getClient().rpc('marcar_entregada_guarderia', {
    p_estadia_id: estadiaId,
    p_carnet_verificado: acta.carnetVerificado,
    p_ocurrido_en: acta.ocurridoEn,
    p_objetos: acta.objetos ?? undefined,
    p_observaciones: acta.observaciones ?? undefined,
    p_clave_idempotencia: acta.claveIdempotencia ?? undefined,
  });
  if (error) return fallo(error.message);
  return leerActoUnico(data);
}

/* ═══════════════════════════════════════════════════════════════════════════
   ③ LOS DOS ACTOS DE LOTE — la camioneta llega con todos
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ResultadoLote {
  movidas: number;
  yaEstaban: number;
  /** 🔴 POR ÍTEM: el lote NO aborta por uno. *Negarse a registrar ocho
   *  llegadas porque una estadía estaba cancelada es peor que el problema que
   *  evita.* La pantalla dice cuál no se movió y por qué. */
  rechazadas: { estadiaId: string; motivo: string }[];
}

function leerLote(data: unknown): ResultadoWrapper<ResultadoLote, CodigoErrorGuarderiaDurante> {
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.movidas !== 'number' || typeof r.ya_estaban !== 'number' || !Array.isArray(r.rechazadas)) {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      movidas: r.movidas,
      yaEstaban: r.ya_estaban,
      rechazadas: (r.rechazadas as Record<string, unknown>[]).map((x) => ({
        estadiaId: String(x.estadiaId),
        motivo: String(x.motivo),
      })),
    },
  };
}

/** «Llegamos.» Mueve `recogida_en_curso → en_guarderia` para todo el lote, en
 *  UNA transacción. Si NINGUNA se movió ni estaba ya movida, rebota
 *  `ninguna_transicion_posible` — *un contador en cero leído como éxito es el
 *  modo de falla silencioso que este frente vino a curar.* */
export async function marcarLlegada(
  estadiaIds: string[], ocurridoEn: string,
): Promise<ResultadoWrapper<ResultadoLote, CodigoErrorGuarderiaDurante>> {
  const { data, error } = await getClient().rpc('marcar_llegada_guarderia',
    { p_estadias: estadiaIds, p_ocurrido_en: ocurridoEn });
  if (error) return fallo(error.message);
  return leerLote(data);
}

/** «Salimos a devolver.» `en_guarderia → retorno_en_curso`, por lote.
 *  Exige el tramo de DEVOLUCIÓN abierto. */
export async function marcarRetorno(
  estadiaIds: string[], ocurridoEn: string,
): Promise<ResultadoWrapper<ResultadoLote, CodigoErrorGuarderiaDurante>> {
  const { data, error } = await getClient().rpc('marcar_retorno_guarderia',
    { p_estadias: estadiaIds, p_ocurrido_en: ocurridoEn });
  if (error) return fallo(error.message);
  return leerLote(data);
}

/* ═══════════════════════════════════════════════════════════════════════════
   ④ NO-RECOGIDA — y de acá NO CUELGA NADA
   🔴 `motivo` es **por qué cerró la franja sin el animal a bordo**, NO el día 1
   de una mora. Sin conteo de días, sin aviso, sin camino a refugio: §6 de
   `LETRA_GUARDERIA` está frenado y este wrapper no lo toca ni de costado.
   **Ningún reloj escribe esto**: lo declara una persona, en la app, ahí mismo.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ResultadoNoRecogida {
  estadiaId: string;
  estado: EstadoEstadia;
  yaEstaba: boolean;
  /** La hora de la PUERTA. */
  ocurridoEn: string;
  /** La del servidor. */
  registradoEn: string;
  motivo: MotivoNoRecogida;
}

export async function marcarNoRecogida(params: {
  estadiaId: string;
  motivo: MotivoNoRecogida;
  /** LA HORA DE LA PUERTA — cuándo se constató, no cuándo subió el dato. */
  ocurridoEn: string;
  /** Obligatorio cuando el motivo es `otro` — y lo es **en la tabla**, no en
   *  un `if`: *un atajo que puede producir un valor equivocado no se declara,
   *  se hace inexpresable.* */
  detalle?: string;
}): Promise<ResultadoWrapper<ResultadoNoRecogida, CodigoErrorGuarderiaDurante>> {
  const { data, error } = await getClient().rpc('marcar_no_recogida_guarderia', {
    p_estadia_id: params.estadiaId,
    p_motivo: params.motivo,
    p_ocurrido_en: params.ocurridoEn,
    p_detalle: params.detalle ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.estadia_id !== 'string' || typeof r.estado !== 'string') {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      estadiaId: r.estadia_id,
      estado: r.estado as EstadoEstadia,
      yaEstaba: r.ya_estaba === true,
      ocurridoEn: String(r.ocurrido_en),
      registradoEn: String(r.registrado_en),
      motivo: r.motivo as MotivoNoRecogida,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ⑤ EL VIAJE — las dos RPC que vivían SIN PUERTA desde S107
   Medido: `abrir_tramo_guarderia` y `cerrar_tramo_guarderia` existen, están
   gateadas y **no tenían un solo consumidor en TypeScript**. *El contrato de
   una pieza de motor incluye su wrapper.*
   ═══════════════════════════════════════════════════════════════════════════ */

export async function abrirTramoGuarderia(params: {
  prestadorId: string;
  fecha: string;
  direccion: 'recogida' | 'devolucion';
  /** Las estadías que salen en este viaje. Sólo se atan las de ESE lugar y ESA
   *  fecha: un id ajeno se ignora en vez de mover la estadía de otro negocio. */
  estadias?: string[];
}): Promise<ResultadoWrapper<
  { tramoId: string; yaExistia: boolean; estadiasAtadas: number },
  CodigoErrorGuarderiaDurante
>> {
  const { data, error } = await getClient().rpc('abrir_tramo_guarderia', {
    p_prestador_id: params.prestadorId,
    p_fecha: params.fecha,
    p_direccion: params.direccion,
    p_estadias: params.estadias ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.tramo_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: {
      tramoId: r.tramo_id,
      yaExistia: r.ya_existia === true,
      estadiasAtadas: typeof r.estadias_atadas === 'number' ? r.estadias_atadas : 0,
    },
  };
}

/** Cierra el viaje. 🔴 **Borra el punto vivo**: lo que ya no se mueve no se
 *  sigue mostrando — *un punto viejo pintado como vivo es peor que ningún
 *  punto.* */
export async function cerrarTramoGuarderia(
  tramoId: string,
): Promise<ResultadoWrapper<{ tramoId: string; yaEstaba: boolean }, CodigoErrorGuarderiaDurante>> {
  const { data, error } = await getClient().rpc('cerrar_tramo_guarderia', { p_tramo_id: tramoId });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.tramo_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { tramoId: r.tramo_id, yaEstaba: r.ya_estaba === true } };
}
