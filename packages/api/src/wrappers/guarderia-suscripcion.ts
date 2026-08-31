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
  plan_no_existe: 'No encontramos ese plan.',
  /* 🔴 **NO ES UN ERROR: ES OTRO CAMINO.** Fuera del período pagado no hay
     reactivación que hacer — *lo que la familia quiere existe, pero se llama
     contratar de nuevo, con cobro y ancla nuevos.* La superficie lleva ahí. */
  periodo_vencido_contratar_de_nuevo: 'Ese plan ya terminó su período. Para volver a tenerlo hay que contratarlo de nuevo.',
  /* 🔴 Trae el id del plan vivo en el mensaje, y por eso la superficie puede
     LLEVAR en vez de decir que no (`L-424`). */
  ya_tienes_plan_activo: 'Ya tienes un plan activo en esa guardería.',
  plan_no_cancelado: 'Ese plan no está cancelado.',
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
/**
 * ⭐ **REACTIVAR — dentro del período pagado, es CANCELAR LA CANCELACIÓN.**
 *
 * Firma del founder (31-ago, confirmada directo): *no cobra de nuevo, no
 * re-ancla, la renovación vuelve.* **Fuera del período no es reactivación: es
 * contratar de nuevo**, con cobro y ancla nuevos — y eso tiene su propio código
 * para que la pantalla pueda llevar ahí en vez de rebotar.
 *
 * 🔴 **El caso intermedio es inexpresable en el MOTOR, no acá.** Un trigger
 * acotado a la transición `cancelada → activa` impide escribir `activa` sobre un
 * período vencido **ni por SQL directo**; esta RPC es la capa que además
 * explica. *Un guard que sólo sabe negarse te deja sin frase; uno que sólo
 * explica se puede saltear.*
 */
export interface ReactivacionMensualidad {
  /** Idempotente: dos toques del mismo botón no son un error. */
  yaEstaba: boolean;
  /** El `periodo_hasta` **sin tocar** — no re-ancla. */
  correHasta: string | null;
  /**
   * El motor lo devuelve explícito para que la pantalla pueda **afirmar** que no
   * se cobra de nuevo en vez de deducirlo de que no falló.
   */
  cobradaDeNuevo: boolean;
}

export async function reactivarMensualidadGuarderia(
  suscripcionId: string,
): Promise<ResultadoWrapper<ReactivacionMensualidad, CodigoErrorGuarderiaSuscripcion>> {
  const { data, error } = await getClient().rpc('reactivar_mensualidad_guarderia', {
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
      cobradaDeNuevo: r.cobrada_de_nuevo === true,
    },
  };
}

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

// ═══ ⭐ S109-C · EL MES PENDIENTE — LA PUERTA QUE FALTABA ══════════════════
//
// `obtener_mes_pendiente_guarderia` está creada y grantada, y **no tenía
// wrapper**: `L-318` por tercera vez en este frente. *Un lector sin puerta no
// falla — no existe, y su ausencia se lee igual que «todavía no se construyó».*
//
// 🔴 **POR QUÉ ESTO NO ES «UNA COMPRA MÁS»:** el mandato por DeUna no se cobra
// solo. Cada mes se emite un link, y **si nadie lo paga, el plan no se
// renueva.** Esta tarjeta es el único lugar del producto donde ese mes aparece
// antes de vencerse. *Sin ella, la familia se entera de que perdió el plan por
// el silencio.*

/** Un mes emitido y todavía sin pagar. */
export interface MesPendienteGuarderia {
  linkId: string;
  suscripcionId: string;
  prestadorNombre: string;
  /** 'YYYY-MM-DD' — el primer día del período que se está pagando. */
  periodo: string;
  monto: number;
  moneda: string;
  /**
   * 🔴 **EL RELOJ DEL MES** — instante ISO. Es el fin del período **ya pagado**:
   * hasta ese día la familia puede pagar el siguiente.
   *
   * ⚠️ **NO es el reloj del código.** Van separados y con nombres distintos a
   * propósito: *si una tarjeta los junta en un contador, va a decir que se
   * acabó algo que no se acabó* — uno dura días y el otro minutos.
   */
  mesVenceEn: string | null;
  /** El intento vivo, si lo hay. */
  intentoId: string | null;
  /** Los seis dígitos, si el intento sigue en pie. */
  codigo: string | null;
  /**
   * 🔴 **EL RELOJ DEL CÓDIGO** — instante ISO, de DeUna, en minutos.
   * `null` con `codigo` presente significa que el proveedor no lo declaró: la
   * superficie **no inventa un plazo**.
   */
  codigoExpiraEn: string | null;
}

/**
 * Los meses emitidos y sin pagar de esta persona.
 *
 * 🔴 **El servidor manda INSTANTES, no veredictos** — no compara contra `now()`
 * y esta puerta tampoco. *El «ya se venció» lo dice la pantalla, que es la que
 * tiene el reloj del dispositivo delante y la que puede volver a mirarlo un
 * minuto después.* Un booleano calculado en el servidor nace viejo.
 *
 * Lista vacía = **no hay nada que pagar**, y eso NO es un error: es el estado
 * normal de un plan por tarjeta y de uno por DeUna al día.
 */
export async function obtenerMesPendienteGuarderia(): Promise<
  ResultadoWrapper<MesPendienteGuarderia[], CodigoErrorGuarderiaSuscripcion>
> {
  const { data, error } = await getClient().rpc('obtener_mes_pendiente_guarderia');
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (!Array.isArray(r.meses)) return fallaCodigo('datos_inconsistentes');

  const meses: MesPendienteGuarderia[] = [];
  for (const cru of r.meses) {
    if (typeof cru !== 'object' || cru === null) continue;
    const m = cru as Record<string, unknown>;
    /* Sin `link_id` no hay a qué llevar: **se descarta la fila, no la lista.**
       *Devolver una tarjeta que no puede navegar a ningún lado es peor que no
       devolverla.* */
    if (typeof m.link_id !== 'string' || typeof m.suscripcion_id !== 'string') continue;
    meses.push({
      linkId: m.link_id,
      suscripcionId: m.suscripcion_id,
      prestadorNombre: typeof m.prestador_nombre === 'string' ? m.prestador_nombre : '',
      periodo: typeof m.periodo === 'string' ? m.periodo : '',
      monto: typeof m.monto === 'number' ? m.monto : 0,
      moneda: typeof m.moneda === 'string' ? m.moneda : 'USD',
      mesVenceEn: typeof m.mes_vence_en === 'string' ? m.mes_vence_en : null,
      intentoId: typeof m.intento_id === 'string' ? m.intento_id : null,
      codigo: typeof m.codigo === 'string' ? m.codigo : null,
      codigoExpiraEn: typeof m.codigo_expira_en === 'string' ? m.codigo_expira_en : null,
    });
  }
  return { ok: true, data: meses };
}
