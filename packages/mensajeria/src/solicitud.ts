/**
 * LOS ESTADOS DE LA SOLICITUD, y las transiciones que existen.
 *
 * Fuente: `LETRA_ADOPCION` §5 (firma ⑧ del founder, 31-ago-2026) — *«La
 * conversación vive en la app, con estados: recibida · en conversación ·
 * aceptada · declinada»*.
 *
 * Cuatro estados, ni uno más. `aceptada` dispara el final natural de §5 (acta →
 * transferencia del expediente → hito); ese arco es del motor, no de acá.
 *
 * Este módulo NO habla: devuelve códigos. La voz es de la superficie.
 */

export type EstadoSolicitud =
  | 'recibida'
  | 'en_conversacion'
  | 'aceptada'
  | 'declinada';

/** Terminales: se leen siempre, no se escriben más. */
export const ESTADOS_TERMINALES = ['aceptada', 'declinada'] as const satisfies
  readonly EstadoSolicitud[];

export type RolEnHilo = 'publicador' | 'solicitante';

/** Las transiciones que EXISTEN, como dato. Lo que no está acá no se puede
 *  hacer — y el rechazo dice cuál era el estado, no «error». */
const TRANSICIONES: ReadonlyArray<{
  readonly desde: EstadoSolicitud;
  readonly hacia: EstadoSolicitud;
  readonly porRol: RolEnHilo;
}> = [
  // El primer mensaje del publicador mueve el estado. No es un botón: es una
  // consecuencia. Un estado que alguien tiene que acordarse de mover va a
  // estar mal.
  { desde: 'recibida', hacia: 'en_conversacion', porRol: 'publicador' },
  { desde: 'recibida', hacia: 'aceptada', porRol: 'publicador' },
  { desde: 'recibida', hacia: 'declinada', porRol: 'publicador' },
  { desde: 'en_conversacion', hacia: 'aceptada', porRol: 'publicador' },
  { desde: 'en_conversacion', hacia: 'declinada', porRol: 'publicador' },
  // El solicitante puede retirarse: es su solicitud.
  { desde: 'recibida', hacia: 'declinada', porRol: 'solicitante' },
  { desde: 'en_conversacion', hacia: 'declinada', porRol: 'solicitante' },
];

export type CodigoRechazoTransicion =
  | 'estado_desconocido'
  | 'estado_terminal'
  | 'transicion_inexistente'
  | 'rol_no_puede';

export type ResultadoTransicion =
  | { readonly ok: true; readonly estado: EstadoSolicitud }
  | {
      readonly ok: false;
      readonly codigo: CodigoRechazoTransicion;
      readonly desde: string;
      readonly hacia: string;
    };

const ESTADOS: readonly string[] = [
  'recibida',
  'en_conversacion',
  'aceptada',
  'declinada',
];

export function esEstadoTerminal(e: EstadoSolicitud): boolean {
  return (ESTADOS_TERMINALES as readonly string[]).includes(e);
}

/**
 * ¿Se puede mover la solicitud de `desde` a `hacia`, ejercido por `rol`?
 *
 * Fail-closed y HABLADO: distingue «ese estado no existe» de «es terminal» de
 * «ese rol no puede», porque un guard que sólo sabe negarse manda a reintentar
 * algo que nunca va a funcionar.
 */
export function puedeTransicionar(
  desde: string,
  hacia: string,
  rol: RolEnHilo,
): ResultadoTransicion {
  if (!ESTADOS.includes(desde) || !ESTADOS.includes(hacia)) {
    return { ok: false, codigo: 'estado_desconocido', desde, hacia };
  }
  if (esEstadoTerminal(desde as EstadoSolicitud)) {
    return { ok: false, codigo: 'estado_terminal', desde, hacia };
  }
  const existe = TRANSICIONES.some((t) => t.desde === desde && t.hacia === hacia);
  if (!existe) {
    return { ok: false, codigo: 'transicion_inexistente', desde, hacia };
  }
  const puedeEseRol = TRANSICIONES.some(
    (t) => t.desde === desde && t.hacia === hacia && t.porRol === rol,
  );
  if (!puedeEseRol) {
    return { ok: false, codigo: 'rol_no_puede', desde, hacia };
  }
  return { ok: true, estado: hacia as EstadoSolicitud };
}

/** Escribir en el hilo sólo mientras no sea terminal. Leer, siempre. */
export function puedeEscribirEnHilo(estado: EstadoSolicitud): boolean {
  return !esEstadoTerminal(estado);
}
