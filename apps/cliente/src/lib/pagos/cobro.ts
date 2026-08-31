/**
 * S101-C · EL COBRO DE LA CASA — **una casa, un motor, dos puertas**.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 🔴 POR QUÉ ESTE ARCHIVO EXISTE, y no dos.                               │
 * │                                                                         │
 * │ La despensa y los servicios se cobran por **la misma función**, con las │
 * │ mismas compuertas y la misma señal optimista. Lo único que las separaba │
 * │ era **quién traduce el código a una frase** — y eso vivía dentro del    │
 * │ andamio de la despensa, con sus voces bajo `despensa.*`.                │
 * │                                                                         │
 * │ *Copiar esa traducción al checkout de la cita habría funcionado hoy y   │
 * │ divergido en tres meses: alguien afina una voz de un lado, nadie mira   │
 * │ el otro, y el founder —que gatea que el paseo se sienta IGUAL que la    │
 * │ despensa— encuentra dos productos donde hay uno.*                       │
 * │                                                                         │
 * │ ⇒ La clasificación vive UNA vez. Las voces viven bajo `pago.*`, que es  │
 * │   su casa real: **«el banco no autorizó» no es una frase de despensa**. │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * 🔴 **NADA ACÁ NACE POR ABRIRSE.** Se llama al TOCAR pagar. *La lección del
 *    andamio del alta —una pantalla que fabricaba estado por abrirse volvió
 *    inobservable un vencimiento— rige por construcción, no por cuidado.*
 *
 * 🔴 **SOLO IDS VIAJAN.** El monto lo lee el servidor del desglose congelado.
 *    *Si el monto llegara de acá, la compuerta 2 estaría verificando un número
 *    contra sí mismo.*
 */

import { cobrarSujeto as cobrarEnElMotor, type SujetoDeCobro } from '@epetplace/api';

export type { SujetoDeCobro };

/**
 * Las voces que el cobro puede pedir. **Cerradas a propósito**: si mañana el
 * motor devolviera un código nuevo, el typecheck obliga a darle su frase acá —
 * no a caer en el cajón de «desconocido» sin que nadie se entere.
 */
export type VozDeCobro =
  | 'pago.cobroDesconocido'
  | 'pago.cobroPagoEnProceso'
  | 'pago.cobroReservaVencida'
  | 'pago.cobroVendedorNoActivo'
  | 'pago.cobroCompraNoExiste'
  | 'pago.cobroCitaNoExiste'
  | 'pago.cobroDefectoNuestro'
  | 'pago.cobroElegiMedio'
  | 'pago.cobroRechazado'
  | 'pago.cobroConfirmando'
  /* ⭐ S109-C · Las voces que faltaban, y las destapó el cinturón de abajo.
     Eran QUINCE códigos —los de guardería, paquete, mensualidad y programa—
     cayendo todos en «no pudimos completar, escribinos». */
  | 'pago.cobroYaPagado'
  | 'pago.cobroNoExiste'
  | 'pago.cobroVentanaVencida'
  | 'pago.cobroPlanNoActivo'
  | 'pago.cobroDiaTomado'
  | 'pago.cobroQueMascota'
  | 'pago.cobroSinCupoEnElPeriodo'
  | 'pago.cobroSinPeriodo'
  /* ⭐ S109-C · Las dos que el guard exigió en su PRIMERA integración real.
     Sin él habrían caído en «no pudimos completar, escribinos» —compilando en
     verde— llevándose puesta la causa que la compuerta se toma el trabajo de
     medir ANTES de mover plata. */
  | 'pago.cobroSesionesNoEntran'
  | 'pago.cobroProgramaNoCobrable';

export type ResultadoCobro = { ok: true } | { ok: false; voz: VozDeCobro };

/**
 * Dispara el débito contra **sandbox**.
 *
 * La respuesta se lee como **SEÑAL, no como hecho**: un `ok` acá significa «el
 * proveedor contestó», y el llamador pasa a `confirmando` — **jamás a `exito`**.
 * Confirma el webhook, o el barrido mismo-día.
 */
export async function cobrar(
  sujeto: SujetoDeCobro,
  tarjetaId: string | null,
): Promise<ResultadoCobro> {
  /* 🔴 Sin medio elegido **no se toca nada**. Y la voz **pide elegir**, no
     reporta un error: *no es un fallo de la familia, es un paso que falta.* */
  if (!tarjetaId) return { ok: false, voz: 'pago.cobroElegiMedio' };

  try {
    const r = await cobrarEnElMotor(sujeto, tarjetaId);
    if (r.ok) return { ok: true };

    switch (r.codigo) {
      /* Falta el medio, o el que hay no sirve para cobrar. */
      case 'token_ausente':
        return { ok: false, voz: 'pago.cobroElegiMedio' };

      /* ── Las COMPUERTAS: cada fallo con su voz ANTES de tocar la tarjeta.
            La regla madre: *la familia jamás descubre un problema de su pedido
            —o de su reserva— a través del cobro.* ────────────────────────── */
      case 'pago_en_proceso':    return { ok: false, voz: 'pago.cobroPagoEnProceso' };
      case 'reserva_vencida':    return { ok: false, voz: 'pago.cobroReservaVencida' };
      case 'vendedor_no_activo': return { ok: false, voz: 'pago.cobroVendedorNoActivo' };
      case 'compra_no_existe':   return { ok: false, voz: 'pago.cobroCompraNoExiste' };
      case 'cita_no_existe':     return { ok: false, voz: 'pago.cobroCitaNoExiste' };

      /* ── ⭐ S109-C · LOS SUJETOS NUEVOS, cada uno con SU frase ────────────
         🔴 **«Ya está pagado» NO es un error y no puede hablar como uno.** *Un
         segundo toque sobre algo que ya se cobró es lo más común del mundo, y
         mandarlo a soporte le enseña a la familia a desconfiar de una compra
         que salió bien.* */
      case 'bono_ya_pagado':
      case 'programa_ya_pagado':
      case 'periodo_ya_cobrado':
        return { ok: false, voz: 'pago.cobroYaPagado' };

      /* La ventana de pago se venció: **no se cobró nada**, y eso se dice. */
      case 'bono_vencido':
      case 'programa_vencido':
        return { ok: false, voz: 'pago.cobroVentanaVencida' };

      case 'bono_no_existe':
      case 'programa_no_existe':
      case 'mensualidad_no_existe':
        return { ok: false, voz: 'pago.cobroNoExiste' };

      case 'mensualidad_no_activa':   return { ok: false, voz: 'pago.cobroPlanNoActivo' };
      case 'dia_ya_reservado':        return { ok: false, voz: 'pago.cobroDiaTomado' };
      case 'mascota_no_determinada':  return { ok: false, voz: 'pago.cobroQueMascota' };
      /* 🔴 La compuerta habló ANTES de mover plata: no se pudo comprometer el
         período. *Es la razón por la que el cobro no salió, y la familia puede
         hacer algo con ella — elegir otras fechas.* */
      case 'mes_no_comprometible':
      case 'sin_cupo_en_el_periodo':
        return { ok: false, voz: 'pago.cobroSinCupoEnElPeriodo' };
      case 'sin_periodo_por_cobrar':  return { ok: false, voz: 'pago.cobroSinPeriodo' };

      /* 🔴 **LA COMPUERTA HABLÓ ANTES DE MOVER PLATA, y eso cambia la frase.**
         El motor ensayó el acto real —generar las N sesiones— en una
         subtransacción que se deshizo, y midió que **no entran en la vigencia
         del programa**. *No se cobró nada, y la familia puede hacer algo con
         esto: empezar antes.* Decirle «no pudimos completar, escribinos» sería
         tirar la única parte accionable de un rebote que el motor calculó bien.
         ⚠️ **Sin nombrar CUÁL sesión**: la `causa` viaja en el 409 y hoy el
         wrapper la aplana (medido por S109-B). *Prometer un detalle que no
         tengo sería inventarlo* — cuando `detalle` viaje, es una línea. */
      case 'sesiones_no_agendables':
        return { ok: false, voz: 'pago.cobroSesionesNoEntran' };
      case 'programa_no_cobrable':
        return { ok: false, voz: 'pago.cobroProgramaNoCobrable' };
      case 'sin_medio_autorizado':    return { ok: false, voz: 'pago.cobroElegiMedio' };

      /* 🔴 EL VEREDICTO DEL EMISOR, y **solo** el veredicto del emisor. No se
         dibuja como error de datos: *pedirle a la familia que revise algo que
         puede estar perfecto es la clase de error que la hace pagar dos veces
         lo que ya pagó.* */
      case 'rechazado':          return { ok: false, voz: 'pago.cobroRechazado' };

      /* 🔴 TODO LO QUE ES NUESTRO habla hacia soporte y **no le pide nada a la
         familia**. *Contarle la causa fina sería darle un problema que no
         puede resolver; pedirle que pruebe otra tarjeta, mandarla a arreglar
         algo que no está roto de su lado.* */
      case 'monto_divergente':
      case 'desglose_incompleto':
      case 'defecto_nuestro':
      case 'compra_sin_pedidos':
      case 'tarjeta_sin_uid':
      case 'iva_no_probado':
      case 'monto_no_se_recibe':
      case 'datos_invalidos':
      case 'metodo_no_permitido':
      case 'servidor_sin_configurar':
      case 'sesion_no_verificable':
      case 'sin_sesion':
      /* Una respuesta que no pudimos leer es nuestra, no de la familia. */
      case 'datos_inconsistentes':
        return { ok: false, voz: 'pago.cobroDefectoNuestro' };

      /* El motor dice explícitamente que no sabe: se habla genérico y va a
         soporte — **jamás se disfraza de rechazo del banco.** */
      case 'error_desconocido':
        return { ok: false, voz: 'pago.cobroDesconocido' };

      /* 🔴 `sin_respuesta` **NO es un desenlace**: el débito puede haber salido.
         La voz honesta es la de espera — *decir «no pasó» acá es lo que hace
         que alguien pague dos veces.* */
      case 'sin_respuesta':
        return { ok: false, voz: 'pago.cobroConfirmando' };

      /* 🔴 Y este NO se manda a la espera, aunque se le parezca: es el código
         de «no pude leer la causa». *«Estamos confirmando» afirma que el
         débito salió, y acá no sabemos si salió: la voz honesta es que no
         pudimos, y que lo miramos nosotros.* */
      case 'no_se_pudo_completar':
        return { ok: false, voz: 'pago.cobroDesconocido' };
    }
    /* ═══ 🔴 S109-C · EL CINTURÓN QUE ESTE ARCHIVO YA PROMETÍA Y NO TENÍA ═════
       El encabezado de `VozDeCobro` dice, desde S101: *«si mañana el motor
       devolviera un código nuevo, **el typecheck obliga a darle su frase acá**
       — no a caer en el cajón de "desconocido" sin que nadie se entere»*.

       **Medido: no obligaba nada.** El `switch` no tenía `default` ni chequeo de
       exhaustividad, así que un código nuevo caía por este `return` **en
       silencio** — compilando en verde. *Una garantía declarada en prosa y no
       mecanizada es peor que no tenerla: se confía en ella.* (L-192: una
       verificación cuyo modo de falla es el silencio no es una verificación.)

       Y estaba a punto de cobrarse: S109-B agrega `sesiones_no_agendables` y
       `programa_no_cobrable` — **los dos con su causa adentro** — y habrían
       aterrizado como «no pudimos completar, escribinos», *tirando justo la
       causa que la otra pista se tomó el trabajo de propagar.*

       Con esta línea, el código nuevo **rompe el build** y obliga a la frase. */
    const _codigoSinVoz: never = r.codigo;
    void _codigoSinVoz;
    /* Un código que el motor inventó y este archivo no conoce. Habla genérico
       y va a soporte — jamás se disfraza de rechazo del banco. */
    return { ok: false, voz: 'pago.cobroDesconocido' };
  } catch {
    /* Red caída ≠ rechazo del banco. **No es un desenlace**: el servidor tiene
       la verdad y la espera es la voz honesta. */
    return { ok: false, voz: 'pago.cobroConfirmando' };
  }
}
