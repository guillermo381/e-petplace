/**
 * LA SALIDA — cerrar la cuenta y llevarse la copia.
 *
 * ── POR QUÉ VIVE EN `packages/api` Y NO EN UNA APP ────────────────────────
 * **LEY DE PARIDAD DE CUENTA** (firma founder, 23-ago-2026): toda pieza del
 * ciclo de cuenta nace en las DOS apps en la misma tanda. El cierre PERSONAL
 * —el de quien se va, sea familia o empleado— es de las dos.
 *
 * ⚠️ **EL CIERRE DEL NEGOCIO NO ESTÁ ACÁ, Y NO ES UNA DEUDA:** es la excepción
 * ② de esa misma ley. *Un negocio con citas pagadas de terceros, empleados con
 * acceso y eventos sin liquidar no se cierra con un botón — es trámite
 * asistido.* La app **lo dice y da el camino**; no lo construye.
 *
 * ── LA REGLA QUE GOBIERNA ESTE ARCHIVO ────────────────────────────────────
 * **Un defecto acá no se corrige con una OTA, porque los datos ya no están.**
 * De ahí que el motor sea `SECURITY DEFINER` con puerta única, que el reloj
 * del día 30 nazca inerte con llave del founder, y que estos wrappers no
 * tengan ni una decisión propia: **solo transportan.**
 *
 * ── LO QUE LA SUPERFICIE TIENE QUE DECIR, Y ESTÁ EN LA LETRA PUBLICADA ────
 * `POLITICA-PRIVACIDAD-APP §19.5`: **«no destruimos el registro»** — es
 * **seudonimización**, no anonimización, y la Política se compromete a no
 * decir ninguna de las dos palabras equivocadas. ⇒ **la pantalla no puede
 * decir «vamos a borrar todo»**, y P15 cl.4 lo exige literal: *«qué se va, qué
 * queda y por qué»*.
 */
import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

/** Lo que el cierre devuelve cuando salió bien. */
export type CierreSolicitado = {
  /** ISO. La fecha del día 30 — hasta cuándo se puede volver atrás. */
  programado_para: string;
  /**
   * `true` si ya estaba pedido.
   *
   * ⚠️ **No es un error y por eso viaja en el brazo `ok`.** *Pedir el cierre
   * cuando ya lo pediste no es un fallo: es la misma intención, ya cumplida.*
   * Modelarlo como rechazo obligaba a la pantalla a hablar de fracaso sobre
   * una operación que salió bien — **y le escondía la fecha, que es justo lo
   * que esa persona necesita ver.** (objeción de S104-C, tomada entera)
   */
  ya_estaba: boolean;
};

export type ErrorCierre =
  /**
   * El cierre dejaría un negocio o una familia **sin titular**.
   *
   * Es el **backstop del servidor**: la pantalla ya lo avisa antes de
   * confirmar, pero *un cliente no se cree* — y acá el error no tiene OTA que
   * lo arregle. Rutea al camino asistido, no a un mensaje de error.
   */
  | 'requiere_camino_asistido'
  | 'sin_sesion'
  | 'error_desconocido';

/**
 * P15 cl.4 · **cerrar la cuenta personal.**
 *
 * 🔴 **La sesión muere en este acto.** El acceso se pierde HOY (§19.3); la
 * seudonimización corre al día 30 (§19.2). ⇒ **la pantalla de confirmación es
 * lo último que esa persona ve**, y tiene que llevar la fecha límite **y** que
 * la vuelta es por `privacidad@epetplace.com` — *después ya no va a poder
 * entrar a leerlo.*
 *
 * ⚠️ Y el detalle de diseño que la letra obligó, por si alguien lo «optimiza»:
 * **las identidades externas NO se retiran hoy.** Retirarlas dejaría a quien
 * entra con Google **sin poder ejercer los 30 días que §19.2 le promete** — la
 * reversión existiría en la tabla y no en la vida. Se retiran al día 30.
 */
export async function solicitarCierreCuenta(): Promise<
  ResultadoWrapper<CierreSolicitado, ErrorCierre>
> {
  const { data, error } = await getClient().rpc('solicitar_cierre_cuenta');

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: error.message };

  const r = data as { ok: boolean; codigo?: string; programado_para?: string; ya_estaba?: boolean };

  if (!r?.ok) {
    const codigo = (r?.codigo ?? 'error_desconocido') as ErrorCierre;
    return { ok: false, codigo, mensaje: codigo };
  }

  return {
    ok: true,
    data: {
      programado_para: r.programado_para!,
      ya_estaba: r.ya_estaba ?? false,
    },
  };
}

export type CopiaSolicitada = {
  /** El correo al que va. La pantalla lo dice: «te la enviamos a …». */
  enviado_a: string;
  /** `true` si ya había una en curso. Mismo criterio que en el cierre. */
  ya_estaba: boolean;
};

/**
 * P15 cl.5 · **la copia de sus datos** (portabilidad, LOPDP).
 *
 * 🔴 **La URL NO vuelve acá, y es deliberado.** El archivo vive en bucket
 * privado y viaja **firmado y con vencimiento, por correo**. *Una URL firmada
 * a los datos personales completos de alguien es la clase de cosa que no se
 * manda a un lugar del que no la podés sacar* — quedaría en el estado de la
 * pantalla y en cualquier log.
 */
export async function exportarMisDatos(): Promise<
  ResultadoWrapper<CopiaSolicitada, 'sin_sesion' | 'error_desconocido'>
> {
  const { data, error } = await getClient().rpc('exportar_mis_datos');

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: error.message };

  const r = data as { ok: boolean; codigo?: string; enviado_a?: string; ya_estaba?: boolean };

  if (!r?.ok) {
    const codigo = (r?.codigo ?? 'error_desconocido') as 'sin_sesion' | 'error_desconocido';
    return { ok: false, codigo, mensaje: codigo };
  }

  return {
    ok: true,
    data: { enviado_a: r.enviado_a!, ya_estaba: r.ya_estaba ?? false },
  };
}
