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
  /* 🔴 S105-A · La persona YA tiene una invitación viva a esta familia.
     Antes esto lo rechazaba el índice `ux_familia_inv_pendiente` con un `23505`
     pelado ⇒ caía en `error_desconocido` ⇒ «probá de nuevo» **sobre algo que
     iba a fallar durante cuatro semanas**. *Un guard que vive en un índice no
     puede explicarse: sólo puede negarse.* */
  'ya_invitada',
  'invitacion_inexistente',
  'invitacion_ya_aceptada',
  'invitacion_no_vigente',
  'invitacion_expirada',
  'email_no_coincide',
  'error_desconocido',
] as const;
export type CodigoInvitacionFamilia = (typeof CODIGOS)[number];

const VOZ: Record<CodigoInvitacionFamilia, string> = {
  auth_required:          'Necesitas iniciar sesión.',
  solo_titular_invita:    'Solo quien creó la familia puede invitar.',
  solo_titular_revoca:    'Solo quien creó la familia puede cancelar una invitación.',
  email_invalido:         'Ese correo no parece válido.',
  ya_es_miembro:          'Esa persona ya es parte de la familia.',
  /* 🔴 LA VOZ NO ALCANZA SOLA: el caller tiene la fecha y el id en
     `yaInvitada` para poder decir «ya la invitaste el 23 de agosto» y ofrecer
     cancelar aquella. *Un código sin su dato es el mismo callejón con mejor
     etiqueta.* */
  ya_invitada:            'Ya invitaste a esa persona y su invitación sigue abierta.',
  invitacion_inexistente: 'No encontramos esa invitación.',
  invitacion_ya_aceptada: 'Esa invitación ya fue aceptada.',
  invitacion_no_vigente:  'Esa invitación ya no está vigente.',
  invitacion_expirada:    'La invitación venció. Pedile a quien te invitó que te mande una nueva.',
  /* La voz dice el hecho SIN regalar información: no confirma a qué correo fue
     dirigida (MODELO_LOGIN §1.3 — los errores no enumeran cuentas). */
  email_no_coincide:      'Esta invitación es para otra dirección de correo.',
  error_desconocido:      'No pudimos completar la invitación. Prueba de nuevo.',
};

/**
 * Datos que acompañan a `ya_invitada`. **Sin esto la pantalla sólo podría
 * repetir la voz genérica con otro nombre** — con esto puede decir la fecha y
 * ofrecer cancelar la invitación previa.
 */
export interface YaInvitada {
  /** `YYYY-MM-DD`, en hora de Guayaquil. */
  fecha: string;
  /** La invitación que sigue abierta — para poder ofrecer cancelarla. */
  invitacionId: string;
  /**
   * 🔴 EL ENLACE. Sin esto sólo se podía ofrecer «cancelá la anterior», y el
   * founder dictó **las dos salidas**: *«compartile el enlace o cancelá esa
   * invitación»*.
   *
   * ⚠️ **ES UNA CREDENCIAL**: quien la tiene puede aceptar la invitación. El
   * motor sólo se la devuelve a quien invitó —que ya la tenía cuando la creó—,
   * así que no revela nada nuevo. **No la loguees ni la muestres suelta:** va
   * adentro del enlace que se comparte, igual que en el alta.
   */
  token: string;
}

/** El motor habla por `message`; acá se traduce a código de la casa (regla 35). */
function mapear<T>(
  mensaje: string,
): ResultadoWrapper<T, CodigoInvitacionFamilia> & { yaInvitada?: YaInvitada } {
  const hit = CODIGOS.find((c) => c !== 'error_desconocido' && mensaje.includes(c));
  const codigo: CodigoInvitacionFamilia = hit ?? 'error_desconocido';
  const base = { ok: false as const, codigo, mensaje: VOZ[codigo] };

  /* 🔴 EL DATO SE EXTRAE DEL MENSAJE, que es donde el motor puede ponerlo: un
     `RAISE` no devuelve jsonb. Formato: `ya_invitada|YYYY-MM-DD|<uuid>`.
     *Si el formato cambiara, esto degrada a la voz sin dato en vez de romper —
     una pantalla sin fecha es peor que ésta, pero mucho mejor que un crash.* */
  if (codigo === 'ya_invitada') {
    const m = /ya_invitada\|([0-9]{4}-[0-9]{2}-[0-9]{2})\|([0-9a-f-]{36})\|([0-9a-f]{32,})/
      .exec(mensaje);
    if (m) {
      return { ...base, yaInvitada: { fecha: m[1], invitacionId: m[2], token: m[3] } };
    }
  }
  return base;
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
}): Promise<
  /* 🔴 EL TIPO DECLARA LO QUE YA VIAJA EN RUNTIME. `mapear` adjunta
     `yaInvitada` desde S105-A y el tipo público no lo decía ⇒ la pantalla
     tenía el dato y **el compilador se lo negaba**. La pista C frenó ahí en vez
     de castear, y tuvo razón: *un `as` sobre nuestro propio wrapper es peor
     que sobre un borde ajeno, porque acá el tipo se puede arreglar y castear
     taparía la única señal de que estaba mal.* */
  ResultadoWrapper<InvitacionCreada, CodigoInvitacionFamilia> & { yaInvitada?: YaInvitada }
> {
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
    return { ok: false, codigo: 'error_desconocido', mensaje: 'No pudimos completar la baja. Prueba de nuevo.' };
  }
  return { ok: true, data: null };
}

/**
 * 🔴 EL ESTADO DEL CORREO — la otra mitad de la cura del 25-ago.
 *
 * **El defecto que cierra:** una invitación con un email malo (`karina
 * charry@satorilatam.com`, con un espacio) se aceptaba, la persona veía
 * «enviada», y el correo moría **20 minutos después** con un 422 del proveedor
 * **en una fila que ninguna pantalla leía**. *Validar mejor achica el problema
 * pero no lo cierra: una dirección puede ser válida y rebotar igual —buzón
 * lleno, dominio caído—. Lo que no puede seguir pasando es que nadie se entere.*
 *
 * ⚠️ `estado: 'sin_cola'` **NO es un fallo**: si el invitado tiene cuenta, el
 * aviso va por el motor de notificaciones y nunca pasa por esta tabla. *Pintar
 * «no se envió» ahí inventaría un fallo donde hubo otro camino.* Por eso el
 * booleano se llama `falloVisible` y no `enviado`.
 */
export async function estadoCorreoInvitacion(
  invitacionId: string,
): Promise<ResultadoWrapper<EstadoCorreoInvitacion, CodigoInvitacionFamilia>> {
  const { data, error } = await getClient().rpc('estado_correo_invitacion', {
    p_invitacion_id: invitacionId,
  });
  if (error) return mapear(error.message);
  if (typeof data !== 'object' || data === null) return mapear('error_desconocido');
  const d = data as Record<string, unknown>;
  if (d.ok !== true) return mapear(typeof d.codigo === 'string' ? d.codigo : 'error_desconocido');
  return {
    ok: true,
    data: {
      estado: String(d.estado ?? 'sin_cola') as EstadoCorreoInvitacion['estado'],
      falloVisible: d.fallo_visible === true,
      intentos: typeof d.intentos === 'number' ? d.intentos : 0,
      enviadoEn: typeof d.enviado_en === 'string' ? d.enviado_en : null,
      /* 🔴 CRUDO DEL PROVEEDOR — para diagnóstico, **jamás para pintar**:
         `resend_422: {"statusCode":422,…}` no es una frase que una familia deba
         leer. La pantalla dice lo suyo; esto explica el porqué a quien tenga
         que arreglarlo. */
      motivoCrudo: typeof d.motivo === 'string' ? d.motivo : null,
    },
  };
}

export interface EstadoCorreoInvitacion {
  /** `sin_cola` = fue por el motor de avisos, no por esta cola. No es un fallo. */
  estado: 'pendiente' | 'enviado' | 'fallido' | 'sin_cola';
  /** El único booleano que significa «hay que decirle algo a quien invitó». */
  falloVisible: boolean;
  intentos: number;
  enviadoEn: string | null;
  motivoCrudo: string | null;
}
