// S88-A — LA PUERTA DEL VERBO ASIGNAR (motor: migración 20260805240000).
//
// Cierra el «MOTOR SIN PUERTA» que S77 dejó declarado: el tercer brazo de
// `cita_update_prestador` existe desde entonces y NINGÚN wrapper escribía
// `evento_cita_servicio.empleado_id` (medido al abrir: 0 escrituras en todo
// packages/api). El despegue de `dar_de_baja_empleado` PRODUCE citas sin
// persona; esta es la única vía de producto para volver a ruteárselas a
// alguien.
//
// ⚠️ QUIÉN PUEDE, Y POR QUÉ NO SE LEE LA FILA `recepcion`:
//   La fila `recepcion` es MEMBRESÍA, JAMÁS IDENTIDAD (ley madre S76): se
//   concede al entrar y la tienen TODOS. Medido: de las 9 filas vivas, TRES
//   son de veterinarios con chips. Recepción se DERIVA por ausencia de chips
//   —igual que la app ya lo computa (D-521)— y el gate vive en el SERVIDOR
//   (`empleado_puede_asignar_citas`). Acá no se decide nada: se traduce.
//
// ⚠️ NO REASIGNA. Mover una cita que YA tiene persona exige avisarle a la
//   familia, y `notificar_reasignacion_cita` no existe (medido; es el mismo
//   artefacto que gatea la vitrina desde S78). El motor rebota
//   `cita_ya_asignada` y esta voz lo dice sin culpar al usuario.

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:               'No hay sesión activa.',
  rol_sin_asignacion:       'No puedes asignar citas en este negocio.',
  cita_no_existe:           'No encontramos esa cita.',
  /* La voz NO dice "no se puede reasignar" a secas: dice qué falta. El día
     que el aviso a la familia exista, cambia el motor y esta voz con él. */
  cita_ya_asignada:         'Esa cita ya tiene a alguien asignado.',
  cita_no_asignable:        'Esa cita ya no se puede asignar.',
  cita_sin_tipo_servicio:   'Esa cita todavía no tiene servicio definido.',
  persona_no_es_del_negocio:'Esa persona no trabaja en tu negocio.',
  persona_sin_oficio:       'Esa persona no atiende este servicio.',
  datos_inconsistentes:     'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:        'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoAsignacionCita = keyof typeof MENSAJES;

type Falla = { ok: false; codigo: CodigoAsignacionCita; mensaje: string };
function falla(codigo: CodigoAsignacionCita): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

/** Los rebotes del motor viajan con `RAISE EXCEPTION '<codigo>: <detalle>'`
 *  — se normalizan por startsWith (L-115), jamás por el texto completo. */
const CODIGOS_MOTOR: [prefijo: string, codigo: CodigoAsignacionCita][] = [
  ['auth_required',             'sin_sesion'],
  ['rol_sin_asignacion',        'rol_sin_asignacion'],
  ['cita_no_existe',            'cita_no_existe'],
  ['cita_ya_asignada',          'cita_ya_asignada'],
  ['cita_no_asignable',         'cita_no_asignable'],
  ['cita_sin_tipo_servicio',    'cita_sin_tipo_servicio'],
  ['persona_no_es_del_negocio', 'persona_no_es_del_negocio'],
  ['persona_sin_oficio',        'persona_sin_oficio'],
];

function normalizarError(mensaje: string): Falla {
  for (const [prefijo, codigo] of CODIGOS_MOTOR) {
    if (mensaje.startsWith(prefijo)) return falla(codigo);
  }
  return falla('error_desconocido');
}

/**
 * ¿El que mira puede RUTEAR citas de este negocio? Espejo EXACTO del
 * predicado del motor — su única razón de existir es que la superficie
 * no ofrezca un botón que el servidor va a rebotar (Ley 23: la puerta no
 * ofrece lo que va a rechazar).
 *
 * ⚠️ **No es el gate.** El gate vive en `asignar_cita_a_persona`. Éste es
 * para PINTAR; una autorización que decide el cliente es decorativa.
 */
export async function puedoAsignarCitas(
  prestadorId: string,
): Promise<ResultadoWrapper<boolean, CodigoAsignacionCita>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient().rpc('empleado_puede_asignar_citas', {
    p_prestador_id: prestadorId,
  });

  if (error) return normalizarError(error.message);
  if (typeof data !== 'boolean') return falla('datos_inconsistentes');
  return { ok: true, data };
}

export interface PersonaParaAsignar {
  empleadoId: string;
  /** `null` honesto: la persona no tiene perfil con nombre cargado. */
  nombre: string | null;
  /** **Informa, NO filtra.** Una persona con chip y sin horario puede recibir
   *  una cita YA PACTADA — la jornada gobierna la OFERTA a la familia (S78),
   *  no el ruteo de lo que ya existe. La Hoja lo muestra para que quien
   *  reparte decida sabiendo. */
  tieneJornada: boolean;
}

/**
 * Quiénes pueden TOMAR esta cita — el pre-filtro de la Hoja de asignar.
 *
 * ⚠️ **Espeja los gates ④ y ⑤ de la puerta byte a byte**, así que la lista que
 * la Hoja ofrece es, por construcción, la que el servidor acepta (Ley 23).
 *
 * ⚠️ **NO es `obtener_personas_que_atienden`** — ése es el lector de la
 * VITRINA: se llavea por la OFERTA y **acepta al titular POR ROL** (el eje
 * legacy de D-486) aunque no tenga el chip. Alimentar la Hoja con él ofrecería
 * al titular sin chip y la puerta lo rebotaría con `persona_sin_oficio`:
 * *exactamente el botón que rebota que este lector existe para evitar.*
 */
export async function obtenerPersonasParaAsignar(
  citaId: string,
): Promise<ResultadoWrapper<PersonaParaAsignar[], CodigoAsignacionCita>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient().rpc('obtener_personas_para_asignar', {
    p_cita_id: citaId,
  });

  if (error) return normalizarError(error.message);
  if (!Array.isArray(data)) return falla('datos_inconsistentes');
  return {
    ok: true,
    data: data.map((f) => ({
      empleadoId: f.empleado_id,
      nombre: f.nombre,
      tieneJornada: f.tiene_jornada,
    })),
  };
}

export interface CitaAsignada {
  citaId: string;
  empleadoId: string;
}

/**
 * Rutea una cita SIN PERSONA a alguien del negocio.
 *
 * Los cinco frenos del motor, en orden, para que la superficie sepa qué
 * puede prometer: ① el rol (el profesional puro rebota) · ② la cita no
 * tiene persona (reasignar es otro verbo) · ③ la cita es ruteable —
 * pendiente/confirmada y futura, el MISMO conjunto que `_cita_despegable`
 * produce · ④ la persona es del negocio y está activa · ⑤ la persona
 * tiene el chip de ese oficio.
 */
export async function asignarCitaAPersona(
  citaId: string,
  empleadoId: string,
): Promise<ResultadoWrapper<CitaAsignada, CodigoAsignacionCita>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient().rpc('asignar_cita_a_persona', {
    p_cita_id: citaId,
    p_empleado_id: empleadoId,
  });

  if (error) return normalizarError(error.message);

  // Guard de shape contra el retorno REAL (jsonb ⇒ Json en los tipos, L-124):
  // si el motor cambiara su forma, no se cuela un undefined con cara de dato.
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return falla('datos_inconsistentes');
  }
  const forma = data as Record<string, unknown>;
  if (forma.ok !== true || typeof forma.cita_id !== 'string' || typeof forma.empleado_id !== 'string') {
    return falla('datos_inconsistentes');
  }
  return { ok: true, data: { citaId: forma.cita_id, empleadoId: forma.empleado_id } };
}
