/**
 * S101-B · FASE 4 · LEER SI LA COMPRA YA SE CONFIRMÓ.
 *
 * 🔴 **LA FUENTE ES EL SERVIDOR, SIEMPRE.** La respuesta síncrona del débito
 *    fue **señal optimista**; el hecho está acá. *Nadie declara «pagado» desde
 *    la pantalla — lo dice la fila, movida por el webhook o por el barrido.*
 *
 * Lee por RLS (`compras_select`, de la persona): **no hace falta DEFINER** —
 * la familia tiene derecho a mirar su propia compra.
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

/** Los cinco del CHECK de `compras`, medidos de la migración de S100. */
export type EstadoCompra =
  | 'creada' | 'esperando_pago' | 'pagada' | 'fallida' | 'cancelada';

export type EsperaCompra = {
  estado: EstadoCompra;
  /** `true` cuando ya no tiene sentido seguir mirando. */
  resuelta: boolean;
};

export async function leerEstadoCompra(
  compraId: string,
): Promise<ResultadoWrapper<EsperaCompra, 'compra_no_visible'>> {
  const { data, error } = await getClient()
    .from('compras').select('estado').eq('id', compraId).maybeSingle();

  if (error) return { ok: false, codigo: 'compra_no_visible', mensaje: error.message };
  if (!data) return { ok: false, codigo: 'compra_no_visible', mensaje: 'compra_no_visible' };

  const estado = data.estado as EstadoCompra;
  return {
    ok: true,
    data: {
      estado,
      /* 🔴 `esperando_pago` NO es resuelta: es exactamente el estado en el que
         la espera vive. *Tratarla como final haría que la pantalla dejara de
         mirar justo cuando importa.* */
      resuelta: estado === 'pagada' || estado === 'fallida' || estado === 'cancelada',
    },
  };
}

/**
 * ═══ LA CITA — el mismo contrato, su propio vocabulario ════════════════════
 *
 * 🔴 **Los cuatro del CHECK de `evento_cita_servicio.estado_reserva`, medidos
 *    de la base** (`pendiente_pago · pagada · expirada · cancelada`) — **no se
 *    traducen a los de la compra**. *Mapear «expirada» a «fallida» para reusar
 *    un tipo sería inventar un desenlace que el motor no dijo: una reserva que
 *    venció no es un pago que falló.*
 *
 * 🔴 `null` = **el ciclo de pago no aplica** (legacy / walk-in / plan). Y acá
 *    **no es resuelta**: la espera sigue mirando y el tope habla. *Declarar un
 *    final porque el dato está ausente es exactamente la clase de mentira que
 *    esta pantalla existe para no decir.*
 */
export type EstadoCita = 'pendiente_pago' | 'pagada' | 'expirada' | 'cancelada';

export type EsperaCita = { estado: EstadoCita | null; resuelta: boolean };

export async function leerEstadoCita(
  citaId: string,
): Promise<ResultadoWrapper<EsperaCita, 'cita_no_visible'>> {
  /* Lee por RLS (`cita_select_due`): la familia tiene derecho a mirar su
     propia cita. **Sin DEFINER** — igual que la compra. */
  const { data, error } = await getClient()
    .from('evento_cita_servicio').select('estado_reserva').eq('id', citaId).maybeSingle();

  if (error) return { ok: false, codigo: 'cita_no_visible', mensaje: error.message };
  if (!data) return { ok: false, codigo: 'cita_no_visible', mensaje: 'cita_no_visible' };

  const estado = data.estado_reserva as EstadoCita | null;
  return {
    ok: true,
    data: {
      estado,
      resuelta: estado === 'pagada' || estado === 'expirada' || estado === 'cancelada',
    },
  };
}

/**
 * ═══ EL PAQUETE DE GUARDERÍA (bono) — S108-A ═══════════════════════════════
 *
 * 🔴 **EL VOCABULARIO DE ACÁ ES DERIVADO, Y SE DICE.** La base NO guarda
 *    `pendiente_pago`: `bonos_estado_pago_valido` admite
 *    `pendiente | pagado | reembolsado`, y el desenlace del hold vive en OTRA
 *    columna (`estado`, que pasa a `cancelado` cuando la ventana vence).
 *    *Son dos columnas y una sola pregunta: «¿ya se resolvió el pago?».* Este
 *    lector la responde; lo que NO hace es renombrar un valor de la base y
 *    hacerlo pasar por dato — el crudo viaja al lado, en `estadoPago`.
 *
 * Lee por RLS (`bonos_pet_parent_own`): la familia mira su propio paquete.
 */
export type EstadoPagoBono = 'pendiente' | 'pagado' | 'reembolsado';
export type EsperaBonoEstado = 'pendiente_pago' | 'pagado' | 'vencido' | 'cancelado';

export type EsperaBono = {
  estado: EsperaBonoEstado;
  /** El valor CRUDO de la base, sin traducir. */
  estadoPago: EstadoPagoBono;
  resuelta: boolean;
};

export async function leerEstadoBono(
  bonoId: string,
): Promise<ResultadoWrapper<EsperaBono, 'bono_no_visible'>> {
  const { data, error } = await getClient()
    .from('bonos').select('estado, estado_pago').eq('id', bonoId).maybeSingle();

  if (error) return { ok: false, codigo: 'bono_no_visible', mensaje: error.message };
  if (!data) return { ok: false, codigo: 'bono_no_visible', mensaje: 'bono_no_visible' };

  const estadoPago = data.estado_pago as EstadoPagoBono;
  const ciclo = data.estado as 'activo' | 'agotado' | 'vencido' | 'cancelado';

  /* 🔴 EL ORDEN IMPORTA. Un bono `reembolsado` está además `cancelado`: si se
     preguntara primero por el ciclo, un reverso se leería como «venció la
     ventana». *Dos finales distintos que la familia vive distinto — le
     devolvieron la plata, o nunca llegó a pagar.* */
  const estado: EsperaBonoEstado =
    estadoPago === 'pagado' ? 'pagado'
    : estadoPago === 'reembolsado' ? 'cancelado'
    : ciclo === 'cancelado' ? 'cancelado'
    : ciclo === 'vencido' ? 'vencido'
    : 'pendiente_pago';

  return { ok: true, data: { estado, estadoPago, resuelta: estado !== 'pendiente_pago' } };
}

/**
 * ═══ LA MENSUALIDAD DE GUARDERÍA — S108-A ══════════════════════════════════
 *
 * 🔴 **EL VEREDICTO SALE DEL PAGO, JAMÁS DEL CICLO DE VIDA.** Aviso de S108-C,
 *    verificado acá: `guarderia_suscripciones.estado` **nace `'activa'` por
 *    DEFAULT de tabla**, o sea que ya está `activa` antes de que exista un
 *    cobro. *Sondear esa columna declararía éxito en el primer tick sin que la
 *    plata se haya movido* — exactamente el defecto que esta espera cierra.
 *
 * Las dos fuentes que sí lo dicen:
 *  · `periodo_desde` — sólo lo escribe `cobrar_periodo_mensualidad_guarderia`,
 *    y ésa sólo corre desde el actuador con un intento aprobado. **NULL =
 *    autorizado y todavía sin cobrar.**
 *  · el intento — la familia puede leerlo por RLS (`pagos_select` gatea por
 *    `pagador_user_id`), así que un cobro RECHAZADO se puede distinguir de uno
 *    que todavía viaja. *Sin eso, «esperando» y «falló» se ven igual y la
 *    espera sólo termina por el tope.*
 */
export type EstadoMensualidad = 'esperando_pago' | 'activa' | 'fallida' | 'cancelada';

export type EsperaMensualidad = { estado: EstadoMensualidad; resuelta: boolean };

export async function leerEstadoMensualidad(
  suscripcionId: string,
): Promise<ResultadoWrapper<EsperaMensualidad, 'mensualidad_no_visible'>> {
  const cli = getClient();
  const { data, error } = await cli
    .from('guarderia_suscripciones')
    .select('estado, periodo_desde').eq('id', suscripcionId).maybeSingle();

  if (error) return { ok: false, codigo: 'mensualidad_no_visible', mensaje: error.message };
  if (!data) return { ok: false, codigo: 'mensualidad_no_visible', mensaje: 'mensualidad_no_visible' };

  if (data.estado === 'cancelada') {
    return { ok: true, data: { estado: 'cancelada', resuelta: true } };
  }
  if (data.periodo_desde !== null) {
    return { ok: true, data: { estado: 'activa', resuelta: true } };
  }

  /* Todavía sin período ⇒ el cobro no llegó. ¿Está viajando, o murió? */
  const { data: intento } = await cli
    .from('pagos_intentos')
    .select('estado')
    .eq('guarderia_suscripcion_id', suscripcionId)
    .order('creado_en', { ascending: false })
    .limit(1)
    .maybeSingle();

  const muerto = intento
    && ['rechazado', 'expirado', 'reversado', 'reverso_fallido'].includes(String(intento.estado));

  /* 🔴 Sin intento visible NO se declara fallida: puede no haberse creado
     todavía, o la RLS puede no dejar verlo. *Un «falló» inventado sobre la
     ausencia de un dato manda a la familia a reintentar un cobro que quizá ya
     salió.* Sigue esperando y el tope habla — mismo criterio que el `null` de
     la cita. */
  return muerto
    ? { ok: true, data: { estado: 'fallida', resuelta: true } }
    : { ok: true, data: { estado: 'esperando_pago', resuelta: false } };
}
