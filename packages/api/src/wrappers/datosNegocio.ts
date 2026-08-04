// DATOS · el negocio en números (S86 — pedido de C, corazón del dashboard).
//
// ⚠️ PROCEDENCIA DE ESTOS NOMBRES, declarada porque cambia quién los
// puede corregir: SALEN DEL MOTOR, no de la spec de C. La interfaz que
// C especificó del body vivo NO viajó a A (dos veces anunciada, dos
// veces sin adjuntar), así que A leyó la fuente de verdad con
// `pg_get_functiondef` y tipó CONTRA ELLA (regla 40 de la skill: el
// body se confirma, no se supone).
//   ⇒ C: cotejá estos nombres contra tu spec. Si difieren, GANA EL
//     MOTOR y se corrige acá — jamás se clona una segunda forma.
//
// LAS CUATRO REGLAS DE DISEÑO (firma de mesa, S86). No son tipado:
// son decisiones, y aplanarlas borra información.
//
//  ① `mix` sirve CUENTAS y TOTAL, jamás porcentajes. El % es
//     presentación: si el motor lo reparte hecho, dos superficies
//     redondean distinto sobre el mismo dato.
//  ② `plata` es UNIÓN DISCRIMINADA. Con `visible:false` NO existen las
//     otras claves — y NO se normalizan a 0. Un 0 fabricado borra la
//     diferencia entre «no te toca verlo» y «cero» (L-197: un dato que
//     falta degrada a AUSENCIA, nunca a un valor que el consumidor lea
//     como cierto). Por eso el tipo lo hace INEXPRESABLE, no opcional.
//  ③ `servicioVoz` es nullable y ESE NULL SOBREVIVE. null = «servicio
//     sin voz»; NO es una invitación a pintar el código crudo (Ley 3 —
//     el diccionario vive en el componente, y un código de motor en
//     pantalla es la falla que esa ley existe para evitar).
//  ④ Los DOS `RAISE` del motor son AMBOS `ERRCODE 42501` y se
//     distinguen POR MENSAJE (`auth_required` · `no_access_to_prestador`).
//     Mapear por ERRCODE los COLAPSA en un solo error y el consumidor
//     pierde la diferencia entre «entrá» y «no es tuyo».

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion: 'No hay sesión activa.',
  sin_acceso: 'No tienes acceso a este negocio.',
  error_desconocido: 'No pudimos leer los datos de tu negocio.',
} as const;

export type CodigoErrorDatosNegocio = keyof typeof MENSAJES;

/** Una fila del día-por-día. El motor NO emite días vacíos: un cero
 *  fabricado no se distingue de un dato real, así que la semana la
 *  completa la superficie. */
export interface DatosNegocioDia {
  /** `YYYY-MM-DD`. */
  fecha: string;
  /** Código de motor — NO se pinta (③). */
  servicio: string;
  /** `null` = servicio sin voz. Ver ③. */
  servicioVoz: string | null;
  atenciones: number;
}

export interface DatosNegocioMixItem {
  servicio: string;
  /** `null` = servicio sin voz. Ver ③. */
  servicioVoz: string | null;
  atenciones: number;
}

export interface DatosNegocioSemana {
  desde: string;
  hasta: string;
  /** La porción transcurrida — contra qué se comparó `atencionesPrevias`. */
  diasTranscurridos: number;
  atenciones: number;
  /** MISMA porción de la semana anterior, no la semana entera. */
  atencionesPrevias: number;
  delta: number;
  vidasNuevas: number;
  familiasNuevas: number;
}

export interface DatosNegocioMix {
  desde: string;
  /** Ver ①: el denominador viaja para que el % lo haga UNA superficie. */
  total: number;
  items: DatosNegocioMixItem[];
}

export interface DatosNegocioTrayectoria {
  /** `null` HONESTO: nunca atendió. No es una fecha cero. */
  desde: string | null;
  atenciones: number;
  familiasServidas: number;
}

/** Ver ②: con `visible:false` las otras claves NO EXISTEN. El tipo hace
 *  inexpresable el 0 fabricado — no es una preferencia de estilo. */
export type DatosNegocioPlata =
  | { visible: false }
  | {
      visible: true;
      semana: number;
      mes: number;
      /** El asterisco de S85: cuántas de las CONTADAS no tenían precio. */
      sinPrecioSemana: number;
      sinPrecioMes: number;
    };

export interface DatosNegocio {
  /** El día del negocio (zona Guayaquil), resuelto por el MOTOR — jamás
   *  por el dispositivo (D-648: `current_date` es UTC y adelanta el día). */
  hasta: string;
  semana: DatosNegocioSemana;
  diaPorDia: DatosNegocioDia[];
  mix: DatosNegocioMix;
  trayectoria: DatosNegocioTrayectoria;
  plata: DatosNegocioPlata;
}

/** ④ — los dos rebotes comparten ERRCODE y se separan por el mensaje.
 *  `startsWith` y no igualdad: PostgREST antepone/anexa contexto (L-115). */
function codigoDeError(raw: string): CodigoErrorDatosNegocio {
  if (raw.startsWith('auth_required')) return 'sin_sesion';
  if (raw.startsWith('no_access_to_prestador')) return 'sin_acceso';
  return 'error_desconocido';
}

/**
 * @param prestadorId  el negocio a leer.
 * @param hasta        `YYYY-MM-DD` opcional. Omitido, lo resuelve el
 *                     motor en zona del negocio (ver `DatosNegocio.hasta`).
 */
export async function obtenerDatosNegocio(
  prestadorId: string,
  hasta?: string,
): Promise<ResultadoWrapper<DatosNegocio, CodigoErrorDatosNegocio>> {
  const cliente = getClient();

  const { data, error } = await cliente.rpc('obtener_datos_negocio', {
    p_prestador_id: prestadorId,
    ...(hasta !== undefined ? { p_hasta: hasta } : null),
  });

  if (error) {
    const codigo = codigoDeError(error.message ?? '');
    return { ok: false, codigo, mensaje: MENSAJES[codigo] };
  }

  // L-124 / L-197: sin dato no se opina. Un retorno inesperado NO se
  // completa con ceros — degrada a error, que es lo único honesto.
  if (data === null || typeof data !== 'object') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  // El motor construye el jsonb entero; acá NO se re-arma ni se
  // normaliza — se tipa. Aplanar `plata` o rellenar `servicioVoz`
  // sería exactamente lo que ② y ③ prohíben.
  return { ok: true, data: data as unknown as DatosNegocio };
}
