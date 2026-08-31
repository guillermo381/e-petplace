// LA CANCELACIÓN DE LA MENSUALIDAD DE GUARDERÍA — S108-C · T5.
//
// ═══ 🔴 POR QUÉ ESTE ARCHIVO NACE, Y POR QUÉ NACE APARTE ═══════════════════
//
// **La RPC existía desde S107 y no tenía puerta.** `cancelar_mensualidad_
// guarderia` está creada y grantada a `authenticated` (`20260831000000:167,208`),
// y **no había wrapper ni pantalla**: el hogar lo declaraba en un comentario
// —*«Informa, NO navega: no hay pantalla de plan»*— mientras dos textos
// publicados prometían cancelar («Puedes cancelarlo cuando quieras», «Se cobra
// solo hasta que lo canceles»).
//
// *Es `L-318` —motor sin puerta— en su forma más cara: hoy es una promesa sin
// daño porque no se cobra; el día que el cobro se encienda pasa a ser una
// promesa de plata sin salida.*
//
// **Vive en su propio archivo a propósito (76f):** S108-A está tocando
// `guarderia-reserva.ts` para el riel del cobro. *Dos pistas editando el mismo
// archivo en la misma tanda es un conflicto que se puede no tener.*

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  suscripcion_no_existe: 'No encontramos ese plan.',
  no_sos_de_esta_familia: 'Ese plan no es de tu familia.',
  sin_sesion: 'Necesitas iniciar sesión.',
  datos_inconsistentes: 'No pudimos leer la respuesta. Prueba de nuevo.',
  error_desconocido: 'No pudimos completar la acción. Prueba de nuevo.',
} as const;

export type CodigoErrorGuarderiaSuscripcion = keyof typeof MENSAJES;
const CODIGOS = Object.keys(MENSAJES) as CodigoErrorGuarderiaSuscripcion[];

function fallaCodigo<T>(c: CodigoErrorGuarderiaSuscripcion): ResultadoWrapper<T, CodigoErrorGuarderiaSuscripcion> {
  return { ok: false, codigo: c, mensaje: MENSAJES[c] };
}
function fallo<T>(raw: string): ResultadoWrapper<T, CodigoErrorGuarderiaSuscripcion> {
  if (raw === 'auth_required') return fallaCodigo('sin_sesion');
  for (const c of CODIGOS) if (raw.startsWith(c)) return fallaCodigo(c);
  return fallaCodigo('error_desconocido');
}

/**
 * 🔴 **LO QUE LA CANCELACIÓN HACE, Y LO QUE NO** — leído del cuerpo de la RPC,
 * no supuesto:
 *
 * > *«Las estadías del período pagado NO SE TOCAN (`P24`): corre hasta el fin
 * > del período pagado, sin reintegro. Lo que muere es la SERIE.»*
 *
 * ⇒ **El interruptor detiene la RENOVACIÓN, jamás el servicio ya pagado.** Por
 * eso estos tres campos no son decorativos y la pantalla los tiene que decir:
 * *una pantalla que sugiere que el servicio se cortó hoy promete lo que el
 * motor no hace* — y la familia deja de llevar al animal a días que pagó.
 */
export interface CancelacionMensualidad {
  /** Ya estaba cancelada: la acción es idempotente y **no es un error**. */
  yaEstaba: boolean;
  /**
   * Hasta qué día sigue cubierto — el fin del período pagado.
   *
   * ⚠️ **`null` es legal y hay que decirlo, no rellenarlo.** `periodo_hasta` es
   * NULL mientras no hubo ningún cobro (letra de la tabla), así que un plan
   * firmado y todavía no cobrado se cancela **sin período que conservar**.
   * *Pintar una fecha ahí sería inventarle a la familia días que no tiene.*
   */
  correHasta: string | null;
  /** Estadías ya agendadas que **conserva**. */
  diasQueConserva: number;
  /** El motor lo dice explícito, y la pantalla también debe decirlo. */
  reintegro: boolean;
}

/**
 * Cancela la mensualidad. **Idempotente**: cancelar dos veces devuelve `ok`
 * con `yaEstaba: true` — *un segundo toque no es un error de la familia.*
 *
 * ☠️ **NO EXISTE EL CAMINO DE VUELTA, y por eso no se ofrece.** Medido contra
 * `supabase/migrations`: no hay ninguna función que devuelva la suscripción a
 * `activa`, ni `reactivar_*` ni equivalente. *Un interruptor que se puede
 * volver a encender sin motor que lo encienda es una promesa que la pantalla no
 * puede cumplir* — la superficie lo dice en vez de simularlo.
 */
export async function cancelarMensualidadGuarderia(
  suscripcionId: string,
): Promise<ResultadoWrapper<CancelacionMensualidad, CodigoErrorGuarderiaSuscripcion>> {
  const { data, error } = await getClient().rpc('cancelar_mensualidad_guarderia', {
    p_suscripcion_id: suscripcionId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (r.ok !== true) return fallaCodigo('error_desconocido');
  return {
    ok: true,
    data: {
      yaEstaba: r.ya_estaba === true,
      correHasta: typeof r.corre_hasta === 'string' ? r.corre_hasta : null,
      diasQueConserva: typeof r.dias_que_conserva === 'number' ? r.dias_que_conserva : 0,
      reintegro: r.reintegro === true,
    },
  };
}
