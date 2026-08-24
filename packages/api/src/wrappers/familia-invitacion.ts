/**
 * LA INVITACIÓN DE FAMILIA (S104-A, tanda 2) — puerta única.
 *
 * ── LO QUE ESTE WRAPPER **NO** HACE, y cada «no» tiene su porqué ──────────
 *   · **No escribe tablas.** Las tres puertas son RPC. La app nunca inserta en
 *     `familia_invitaciones`, `familia_miembro` ni `mascota_familiar_autorizado`.
 *   · **No decide el escalón.** Lo fija el motor: `adulto_autorizado` (firma
 *     5.1). Co-dueño es v2 y **no es un alta: es una transición** — el trigger
 *     `trg_codueño_es_titular` exige `adulto_titular`, y otros dos triggers
 *     prohíben ser familiar y co-dueño a la vez, desde los dos lados.
 *   · **No manda el correo.** Devuelve el token; el correo es de D y el enlace
 *     copiable es de la pantalla. *Quien invita comparte el enlace; la casa no
 *     manda WhatsApp.*
 *   · **No invita menores.** `familia_miembro` no tiene `fecha_nacimiento` ⇒ no
 *     hay forma de sostener P5, y un rol que no se puede verificar no se ofrece.
 */

import { getClient } from '../client';
import { normalizarEmail } from './_email';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS = [
  'auth_required',
  'solo_titular_invita',
  'solo_titular_revoca',
  'email_invalido',
  'ya_es_miembro',
  'invitacion_inexistente',
  'invitacion_ya_aceptada',
  'invitacion_no_vigente',
  'invitacion_expirada',
  'email_no_coincide',
  'error_desconocido',
] as const;
export type CodigoInvitacionFamilia = (typeof CODIGOS)[number];

const VOZ: Record<CodigoInvitacionFamilia, string> = {
  auth_required:          'Necesitás iniciar sesión.',
  solo_titular_invita:    'Solo quien creó la familia puede invitar.',
  solo_titular_revoca:    'Solo quien creó la familia puede cancelar una invitación.',
  email_invalido:         'Ese correo no parece válido.',
  ya_es_miembro:          'Esa persona ya es parte de la familia.',
  invitacion_inexistente: 'No encontramos esa invitación.',
  invitacion_ya_aceptada: 'Esa invitación ya fue aceptada.',
  invitacion_no_vigente:  'Esa invitación ya no está vigente.',
  invitacion_expirada:    'La invitación venció. Pedile a quien te invitó que te mande una nueva.',
  /* La voz dice el hecho SIN regalar información: no confirma a qué correo fue
     dirigida (MODELO_LOGIN §1.3 — los errores no enumeran cuentas). */
  email_no_coincide:      'Esta invitación es para otra dirección de correo.',
  error_desconocido:      'No pudimos completar la invitación. Probá de nuevo.',
};

/** El motor habla por `message`; acá se traduce a código de la casa (regla 35). */
function mapear<T>(mensaje: string): ResultadoWrapper<T, CodigoInvitacionFamilia> {
  const hit = CODIGOS.find((c) => c !== 'error_desconocido' && mensaje.includes(c));
  const codigo: CodigoInvitacionFamilia = hit ?? 'error_desconocido';
  return { ok: false, codigo, mensaje: VOZ[codigo] };
}

export interface InvitacionCreada {
  id: string;
  /** La credencial. Se comparte en el enlace; no se muestra suelto. */
  token: string;
  expira_en: string;
  /** `false` ⇒ no va a salir ningún correo y la única vía es el enlace
   *  copiable. **La pantalla lo dice; no lo adivina.** */
  avisoPorCorreo?: boolean;
  /** 🔴 `true` ⇒ esa dirección **pidió no recibir más correo**. La invitación
   *  existe y el enlace sirve, pero **la casa no le escribe**. La pantalla
   *  tiene que decirlo: *«ya no le enviamos correos; compartile el enlace vos»*.
   *  *Callarlo dejaría a quien invita esperando un correo que nunca sale.* */
  correoSuprimido?: boolean;
}

export async function invitarAFamilia(input: {
  familiaId: string;
  email: string;
  nombre?: string;
}): Promise<ResultadoWrapper<InvitacionCreada, CodigoInvitacionFamilia>> {
  const { data, error } = await getClient().rpc('invitar_a_familia', {
    p_familia_id: input.familiaId,
    p_email: normalizarEmail(input.email),
    p_nombre: input.nombre ?? undefined,
  });
  if (error) return mapear(error.message);
  const fila = Array.isArray(data) ? data[0] : data;
  if (!fila) return mapear('error_desconocido');

  /* LA PUERTA DEL TOKEN — sin esto, `invitar_a_familia` devolvía `ok` y nada
     entregaba nada (motor sin puerta). Best-effort: si el aviso falla, la
     invitación YA existe y el enlace copiable sigue sirviendo. */
  const aviso = await getClient().rpc('avisar_invitacion_familia', {
    p_invitacion_id: (fila as InvitacionCreada).id,
  });

  return {
    ok: true,
    data: {
      ...(fila as InvitacionCreada),
      /* 🔴 LO QUE LA PANTALLA NECESITA PARA NO MENTIR: si el invitado no tiene
         cuenta, el motor de notificaciones no puede alcanzarlo (exige user_id)
         ⇒ NO va a salir ningún correo, y la pantalla tiene que decir «compartí
         el enlace» en vez de «le mandamos un correo». */
      /* Tres respuestas posibles del productor, y la pantalla necesita las
         tres distinguidas — no un booleano:
           intencion_registrada     → tiene cuenta, va por el motor de avisos
           encolado_sin_cuenta      → no tiene cuenta, va por la cola propia
           suprimido_no_se_escribe  → pidió no recibir más: NO se le escribe */
      avisoPorCorreo:
        aviso.data === 'intencion_registrada' || aviso.data === 'encolado_sin_cuenta',
      correoSuprimido: aviso.data === 'suprimido_no_se_escribe',
    },
  };
}

export interface InvitacionAceptada {
  familia_id: string;
  /** Cuántas mascotas de esa familia quedaron vinculadas en el acto. */
  mascotas_vinculadas: number;
}

export async function aceptarInvitacionFamilia(
  token: string,
): Promise<ResultadoWrapper<InvitacionAceptada, CodigoInvitacionFamilia>> {
  const { data, error } = await getClient().rpc('aceptar_invitacion_familia', { p_token: token });
  if (error) return mapear(error.message);
  const fila = Array.isArray(data) ? data[0] : data;
  if (!fila) return mapear('error_desconocido');
  return { ok: true, data: fila as InvitacionAceptada };
}

export async function revocarInvitacionFamilia(
  id: string,
): Promise<ResultadoWrapper<null, CodigoInvitacionFamilia>> {
  const { error } = await getClient().rpc('revocar_invitacion_familia', { p_id: id });
  if (error) return mapear(error.message);
  return { ok: true, data: null };
}

/**
 * LA BAJA EN UN CLIC — se ejerce **sin cuenta** (firma del founder, ④).
 *
 * El token de la invitación es la credencial: solo lo tiene quien recibió el
 * correo. *No se pide cuenta para ejercer un derecho que se ejerce justamente
 * porque no se quiere tener cuenta.*
 *
 * **Contesta lo mismo siempre**, exista o no el token: distinguir convertiría
 * la baja en un oráculo de tokens válidos.
 */
export async function darDeBajaCorreo(token: string): Promise<ResultadoWrapper<null, 'error_desconocido'>> {
  const { error } = await getClient().rpc('dar_de_baja_correo', { p_token: token });
  if (error) {
    return { ok: false, codigo: 'error_desconocido', mensaje: 'No pudimos completar la baja. Probá de nuevo.' };
  }
  return { ok: true, data: null };
}
