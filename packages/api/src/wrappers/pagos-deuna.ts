/**
 * S103-A · LA PUERTA DEL RIEL DEUNA — el wrapper que le faltaba a C.
 *
 * Contrato de origen: `docs/relevamientos/S103-D-CONTRATO-PUERTA-DEUNA-para-C.md`
 * (autoría D). **Este archivo lo escribe A porque `packages/api` es su
 * territorio, y porque la casa tiene UNA puerta a la DB y a las functions.**
 *
 * 🔴 **SOLO IDS VIAJAN — y acá el server no lo ignora: lo RECHAZA.**
 *    Si alguien mandara `monto`, la puerta contesta `monto_no_se_recibe` en vez
 *    de descartarlo. *Ignorarlo dejaría vivo un cliente que se cree con esa
 *    facultad, y el día que el server confíe cobra lo que el cliente diga.*
 *    El monto sale del **desglose congelado**. Por eso el tipo de entrada de
 *    este wrapper **no tiene dónde poner un monto**: el estado malo es
 *    inexpresable desde acá, no solo rechazado allá.
 *
 * 🔴 **LA AUTORIZACIÓN ES LA SESIÓN.** `functions.invoke` la lleva sola.
 *    Ningún secreto compartido: una app publicada no los guarda.
 *
 * 🔴 **`estado` JAMÁS dice «pagado».** Que exista un código no significa que
 *    alguien haya pagado — el código es una *invitación a pagar en otra app*.
 *    La transición a pagada **la dice el servidor**, por consulta activa
 *    (`LETRA_DEUNA` §7). *Una pantalla que celebre al recibir el código estaría
 *    celebrando que se imprimió un ticket, no que entró la plata.*
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

/**
 * Los códigos, **verbatim del contrato de D**. No se inventan ni se traducen
 * acá: viajan tal cual desde el servidor para que un tablero cuente lo mismo
 * que el motor dice.
 *
 * ⚠️ Los de COMPUERTA (`pago_en_proceso`, `reserva_vencida`, …) **llegan con la
 * causa REAL y el proveedor nunca se enteró** — que es la letra madre de §7:
 * *primero se verifica que se pueda entregar, después se pide la plata.*
 */
export type CodigoDeuna =
  | 'sin_sesion' | 'sesion_no_verificable' | 'datos_invalidos'
  | 'monto_no_se_recibe' | 'compra_no_existe' | 'cita_no_existe'
  | 'desglose_incompleto' | 'sin_respuesta'
  /* 🔴 LLEGARON TARDE, y la razón importa más que los dos códigos (S103-D):
     esta lista se escribió contra el CONTRATO A MANO de la puerta, y ese
     contrato declaraba 10 de los 12 que la función emite. **Un contrato escrito
     a mano diverge de la función que describe en el momento exacto en que
     alguien agrega un `return` — y nadie lo nota, porque el contrato sigue
     siendo cierto sobre todo lo que sí menciona.**
     Y el daño no era de runtime: el `as CodigoDeuna` de abajo los deja pasar
     igual. Era de TIPO — un `switch` exhaustivo habría compilado diciendo que
     cubrió todo, y `monto_invalido` habría quedado **sin voz**. */
  | 'monto_invalido'        // 409 · el desglose existe y su total no es > 0 ⇒ DEFECTO NUESTRO
  | 'metodo_no_permitido'   // 405 · improbable desde acá (siempre POST), pero la puerta lo emite
  | 'no_se_pudo_completar' | 'servidor_sin_configurar'
  /* Los de COMPUERTA: viajan tal cual desde el 409 del servidor. */
  | 'pago_en_proceso' | 'reserva_vencida' | 'vendedor_no_activo'
  | 'monto_divergente' | 'compra_sin_pedidos';

/**
 * 🔴 EL SUJETO — **una casa, un motor, dos puertas** (S101-C).
 *
 * Misma forma que `pagos-cobro`: la unión discriminada hace **inexpresable**
 * pedir sin sujeto o con los dos. *Un segundo wrapper para el segundo sujeto
 * sería el primer día de la divergencia, y lo que el founder gatea es
 * justamente que el paseo se sienta igual que la despensa.*
 */
export type SujetoDeuna =
  | { tipo: 'compra'; id: string }
  | { tipo: 'cita'; id: string };

/**
 * Lo que la puerta devuelve en el camino feliz.
 *
 * ⚠️ **`expira_en` es el reloj DEL CÓDIGO, jamás el del hold** — son dos y no
 * se mezclan nunca (contrato §2). El del código vence en ~3 min y su cura es
 * *«generá uno nuevo»*; el del hold gobierna la sesión de pago entera y su cura
 * es el **rearme** contra stock/agenda vigente. *Confundirlos haría que la
 * pantalla ofrezca un código nuevo cuando lo que se venció fue la reserva —
 * y el código nuevo tampoco va a servir.*
 */
export interface SolicitudDeuna {
  intentoId: string;
  /** Los seis dígitos que la persona teclea **en la app de DeUna**. */
  codigo: string;
  /** ISO. El reloj **del código**. */
  expiraEn: string;
  monto: number;
  moneda: string;
  /** Siempre `esperando_pago`. Se expone para que la pantalla no lo suponga. */
  estado: 'esperando_pago';
}

/**
 * Pide un código de pago DeUna para un sujeto.
 *
 * **Devuelve una INVITACIÓN A PAGAR, no un pago.** Quien la consuma tiene que
 * quedarse esperando y **preguntarle al servidor**; el reloj del código no
 * decide nada sobre si entró la plata.
 */
export async function pedirCodigoDeuna(
  sujeto: SujetoDeuna,
): Promise<ResultadoWrapper<SolicitudDeuna, CodigoDeuna>> {
  const { data, error } = await getClient().functions.invoke('pagos-deuna-solicitud', {
    body: sujeto.tipo === 'compra' ? { compra_id: sujeto.id } : { cita_id: sujeto.id },
  });

  if (error) {
    /* 🔴 `functions.invoke` marca `error` para TODO status no-2xx —incluidos
       nuestros 409, que traen el código tipado en el cuerpo— y en ese caso
       **`data` viene vacío**. Leerlo solo de `data` pierde la causa y deja
       todo hablando con la voz genérica.
       *Medido en S101-B sobre el cobro con tarjeta: el pago dijo «no pudimos
       completar» cuando el motor sabía perfectamente qué había pasado. Un
       error que llega con su causa y se dibuja sin ella es PEOR que uno sin
       causa: hace creer que no la hay.*
       El cuerpo viaja en `error.context`, que es la Response. */
    let codigo = 'no_se_pudo_completar';
    const ctx = (error as { context?: unknown }).context;
    if (ctx && typeof (ctx as Response).text === 'function') {
      try {
        const j = JSON.parse(await (ctx as Response).clone().text()) as Record<string, unknown>;
        if (typeof j.codigo === 'string') codigo = j.codigo;
      } catch { /* si no se puede leer, queda la voz genérica */ }
    }
    const d = (data ?? {}) as Record<string, unknown>;
    if (codigo === 'no_se_pudo_completar' && typeof d.codigo === 'string') codigo = d.codigo;

    /* 🔴 `sin_respuesta` NO ES UN RECHAZO — es un 504, y significa que DeUna no
       contestó. *Dibujarlo como rechazo mandaría a la persona a soporte por
       algo que se cura reintentando.* Se conserva su código tipado justamente
       para que la superficie pueda distinguirlo; el wrapper no lo colapsa. */
    return { ok: false, codigo: codigo as CodigoDeuna, mensaje: codigo };
  }

  const d = (data ?? {}) as Record<string, unknown>;
  if (d.ok !== true) {
    const codigo = typeof d.codigo === 'string' ? d.codigo : 'no_se_pudo_completar';
    return { ok: false, codigo: codigo as CodigoDeuna, mensaje: codigo };
  }

  /* 🔴 SE VERIFICA LA FORMA ANTES DE DEVOLVERLA. *Un `ok:true` con el código
     ausente pintaría una pantalla de pago sin código que teclear — y eso se
     ve como un defecto del proveedor cuando es nuestro.* Fail-closed: si la
     forma no está completa, es `no_se_pudo_completar`, jamás media pantalla. */
  if (typeof d.codigo !== 'string' || d.codigo === ''
      || typeof d.expira_en !== 'string'
      || typeof d.intento_id !== 'string'
      || typeof d.monto !== 'number') {
    return { ok: false, codigo: 'no_se_pudo_completar', mensaje: 'respuesta_incompleta' };
  }

  return {
    ok: true,
    data: {
      intentoId: d.intento_id,
      codigo: d.codigo,
      expiraEn: d.expira_en,
      monto: d.monto,
      moneda: typeof d.moneda === 'string' ? d.moneda : 'USD',
      estado: 'esperando_pago',
    },
  };
}

/**
 * Azúcar por sujeto, espejo exacto de `cobrarCompra` / `cobrarCita`.
 * *La casa ya eligió esta forma; una puerta nueva que se llame distinto obliga
 * a leer dos veces lo mismo.*
 */
export const pedirCodigoDeunaCompra = (compraId: string) =>
  pedirCodigoDeuna({ tipo: 'compra', id: compraId });

export const pedirCodigoDeunaCita = (citaId: string) =>
  pedirCodigoDeuna({ tipo: 'cita', id: citaId });
