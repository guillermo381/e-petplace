// S88-A · D-664 — LA POSICIÓN EN EL NEGOCIO, DICHA POR EL SERVIDOR.
//
// Reemplaza la derivación `esDueno = leí ≥1 fila de empleado_roles`, que medida
// da **TRUE PARA LOS CUATRO ROLES** (titular 13 filas · admin 2 · recepción 1 ·
// profesional 2). La causa: el lector pide los roles de TODOS los empleados del
// negocio y esa lista incluye la fila del propio lector — el primer brazo de la
// policy, *mis propias filas*, se la devuelve.
//
// Su JSDoc decía «la policy es dueño-only … quien lee ≥1 fila ES dueño»:
// describía UNO de los tres brazos y concluía sobre la policy entera. **Y era
// cierto cuando se escribió** — lo falseó la A2bis de S76, que empezó a
// conceder la fila `recepcion` A TODOS al entrar.
//
// > *Un rol que se deduce de «poder leer algo» es frágil por construcción.*
//
// ⚠️ TRES VERDADES, NO UNA — y el porqué importa para elegir bien:
//   las superficies que hoy gatean por `esDueno` **no quieren todas la misma
//   pregunta**. `equipo` la quiere de GESTIÓN (D-660 le dio al administrador
//   poder sobre el equipo, y el founder lo gateó verde); otras la quieren de
//   TITULARIDAD estricta. Darles una sola las obligaría a elegir entre
//   equivocarse y adivinar — *que es la clase de D-664 otra vez.*

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:           'No hay sesión activa.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoPosicion = keyof typeof MENSAJES;

export interface PosicionEnPrestador {
  /** **El dueño de la empresa.** Hecho de `prestadores.user_id`, no inferencia.
   *  Es el gate de lo que solo el titular puede: nombrar administradores,
   *  borrar el negocio. */
  esTitular: boolean;
  /** **Quien puede ESCRIBIR el negocio**: titular · administrador · admin de
   *  plataforma. Es la puerta de D-660 — y la que `equipo` necesita. */
  gestiona: boolean;
  /** **Quien ve la plata y reparte citas** (§4ter): gestión, o recepción
   *  derivada por AUSENCIA DE CHIPS. El profesional puro queda afuera. */
  esMostradorOGestion: boolean;
}

/**
 * Las tres posiciones del que mira, en UN viaje.
 *
 * ⚠️ **No es el gate** — los gates viven en el servidor, cada uno en su
 * función. Esto es para PINTAR: que la superficie no ofrezca lo que el
 * servidor va a rechazar (Ley 23).
 */
export async function obtenerMiPosicionEnPrestador(
  prestadorId: string,
): Promise<ResultadoWrapper<PosicionEnPrestador, CodigoPosicion>> {
  if ((await uidActual()) === null) {
    return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };
  }

  const { data, error } = await getClient().rpc('obtener_mi_posicion_en_prestador', {
    p_prestador_id: prestadorId,
  });

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: error.message };

  // Guard de shape contra el retorno REAL (jsonb ⇒ Json en los tipos, L-124).
  // ⚠️ Los tres se exigen `boolean` EXPLÍCITAMENTE en vez de coercionar: un
  // `undefined` coercionado a `false` diría «no sos titular» con cara de dato
  // — que es el modo de falla que esta deuda existe para matar.
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }
  const f = data as Record<string, unknown>;
  if (
    typeof f.es_titular !== 'boolean' ||
    typeof f.gestiona !== 'boolean' ||
    typeof f.es_mostrador_o_gestion !== 'boolean'
  ) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }

  return {
    ok: true,
    data: {
      esTitular: f.es_titular,
      gestiona: f.gestiona,
      esMostradorOGestion: f.es_mostrador_o_gestion,
    },
  };
}
