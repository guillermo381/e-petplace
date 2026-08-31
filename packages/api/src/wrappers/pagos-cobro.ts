/**
 * S101-B · FASE 3 · EL COBRO — puerta única.
 *
 * 🔴 **SOLO IDS VIAJAN.** El monto lo lee el servidor del desglose congelado.
 *    *Si el monto llegara de acá, la compuerta 2 estaría verificando un número
 *    contra sí mismo.*
 *
 * 🔴 La autorización es **la sesión de la familia** — `functions.invoke` la
 *    lleva sola. Ningún secreto compartido: una app publicada no los guarda.
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export type CodigoCobro =
  | 'sin_sesion' | 'sesion_no_verificable' | 'datos_invalidos'
  | 'monto_no_se_recibe' | 'compra_no_existe' | 'cita_no_existe' | 'token_ausente'
  | 'metodo_no_permitido'
  | 'desglose_incompleto' | 'rechazado' | 'defecto_nuestro' | 'sin_respuesta'
  | 'tarjeta_sin_uid' | 'iva_no_probado'
  | 'no_se_pudo_completar' | 'servidor_sin_configurar'
  /* Los de COMPUERTA: viajan tal cual desde el 409 del servidor. */
  | 'pago_en_proceso' | 'reserva_vencida' | 'vendedor_no_activo'
  | 'monto_divergente' | 'compra_sin_pedidos'
  /* ═══ S108-B · LOS DOS SUJETOS DE GUARDERÍA ════════════════════════════
     🔴 Cada uno con SU voz, y jamás reusando la del vecino: *un paquete que
     rebota diciendo `cita_no_existe` manda a la familia —y a quien lea el
     log— a mirar una cita que nunca hubo.* */
  | 'bono_no_existe' | 'bono_ya_pagado' | 'bono_vencido'
  | 'mensualidad_no_existe' | 'mensualidad_no_activa'
  | 'sin_periodo_por_cobrar' | 'periodo_ya_cobrado'
  /* La compuerta pre-cobro del mes: el mandato existe y el MES no se puede
     comprometer. Cada causa con su nombre — *«no se pudo» sobre un plan mensual
     manda a la familia a reintentar algo que va a fallar igual.* */
  | 'dia_ya_reservado' | 'sin_cupo_en_el_periodo' | 'mascota_no_determinada'
  | 'sin_medio_autorizado' | 'mes_no_comprometible'
  | 'programa_no_existe' | 'programa_ya_pagado' | 'programa_vencido'
  /* La compuerta del programa: existe y su mes de sesiones NO cabe. Con su
     nombre — *«no se pudo» sobre un programa manda a reintentar algo que va a
     fallar igual.* */
  | 'sesiones_no_agendables' | 'programa_no_cobrable';

/** 🔴 Lo que vuelve es **señal optimista**, jamás «pagado». */
export type SenalDeCobro = { senal: 'optimista'; estado: 'confirmando' };

/**
 * 🔴 EL SUJETO — **una casa, un motor, dos puertas** (S101-C).
 *
 * La compra de despensa y la cita de servicio se cobran **por la misma
 * función**, que ya exige *exactamente uno* de los dos en su puerta. Acá el
 * tipo hace lo mismo del lado del cliente: **no existe la forma de pedir un
 * cobro sin sujeto, ni con dos.**
 *
 * *Un segundo wrapper para el segundo sujeto sería el primer día de la
 * divergencia — y lo que el founder gatea es justamente que el paseo se
 * sienta igual que la despensa.*
 */
export type SujetoDeCobro =
  | { tipo: 'compra'; id: string }
  | { tipo: 'cita'; id: string }
  /* ═══ S108-B · GUARDERÍA — el paquete y la mensualidad ══════════════════
     Entran por la MISMA puerta que los otros dos, con el mismo contrato: la
     sesión es la autorización, el monto se lee del desglose congelado
     server-side, la pertenencia se verifica allá.

     🔴 **La mensualidad NO manda su período.** El servidor resuelve cuál está
     por cobrar. *Un período elegido por el cliente es un cliente eligiendo
     qué mes paga —y cuál se saltea—, que es la misma facultad que el monto:
     no se la damos por una columna distinta.* */
  | { tipo: 'bono'; id: string }
  | { tipo: 'mensualidad'; id: string }
  /* 🔴 EL PROGRAMA DE ADIESTRAMIENTO — S109-B, y entra por un hallazgo del
     CENSO DEL LADO CREADOR: su arco estaba entero —congelador, compuerta,
     confirmación, actuador, reverso— **y no había con qué crear su intento.**
     *Un sujeto que se aplica bien y no se puede crear es un sujeto que nunca va
     a cobrar, y hoy se lee como completo.* */
  | { tipo: 'programa'; id: string };

export async function cobrarCompra(
  compraId: string,
  tarjetaId: string,
): Promise<ResultadoWrapper<SenalDeCobro, CodigoCobro>> {
  return cobrarSujeto({ tipo: 'compra', id: compraId }, tarjetaId);
}

/** La cita de servicio — el mismo motor, la misma señal, la misma lectura. */
export async function cobrarCita(
  citaId: string,
  tarjetaId: string,
): Promise<ResultadoWrapper<SenalDeCobro, CodigoCobro>> {
  return cobrarSujeto({ tipo: 'cita', id: citaId }, tarjetaId);
}

/**
 * El cuerpo que viaja, por sujeto. **Sólo ids y el medio de pago.**
 *
 * 🔴 El `never` del `default` es el guard: si mañana la unión gana un sujeto y
 *    nadie agrega su rama, **no compila**. *La alternativa —un `else` -- es
 *    justo lo que hace que un sujeto nuevo viaje con el nombre del anterior.*
 */
function cuerpoDelSujeto(
  sujeto: SujetoDeCobro,
  tarjetaId: string,
): Record<string, string> {
  switch (sujeto.tipo) {
    case 'compra': return { compra_id: sujeto.id, tarjeta_id: tarjetaId };
    case 'cita': return { cita_id: sujeto.id, tarjeta_id: tarjetaId };
    case 'bono': return { bono_id: sujeto.id, tarjeta_id: tarjetaId };
    case 'mensualidad':
      return { guarderia_suscripcion_id: sujeto.id, tarjeta_id: tarjetaId };
    case 'programa':
      return { programa_contratado_id: sujeto.id, tarjeta_id: tarjetaId };
    default: {
      const _exhaustivo: never = sujeto;
      return _exhaustivo;
    }
  }
}

/**
 * S108-B · EL PAQUETE DE DÍAS DE GUARDERÍA.
 *
 * 🔴 El bono nace `pendiente` y **no da un solo día de saldo** hasta que la
 *    plata entra (firma ① del plan). Esto es lo que la hace entrar.
 */
export async function cobrarPaqueteGuarderia(
  bonoId: string,
  tarjetaId: string,
): Promise<ResultadoWrapper<SenalDeCobro, CodigoCobro>> {
  return cobrarSujeto({ tipo: 'bono', id: bonoId }, tarjetaId);
}

/**
 * S108-B · LA MENSUALIDAD DE GUARDERÍA — el período que esté por cobrar.
 *
 * 🔴 **No recibe período.** Lo resuelve el servidor contra el mandato. Ver la
 *    nota de `SujetoDeCobro`.
 */
export async function cobrarMensualidadGuarderia(
  suscripcionId: string,
  tarjetaId: string,
): Promise<ResultadoWrapper<SenalDeCobro, CodigoCobro>> {
  return cobrarSujeto({ tipo: 'mensualidad', id: suscripcionId }, tarjetaId);
}

/**
 * S109-B · EL PROGRAMA DE ADIESTRAMIENTO — su puerta de entrada.
 */
export async function cobrarProgramaAdiestramiento(
  programaContratadoId: string,
  tarjetaId: string,
): Promise<ResultadoWrapper<SenalDeCobro, CodigoCobro>> {
  return cobrarSujeto({ tipo: 'programa', id: programaContratadoId }, tarjetaId);
}

export async function cobrarSujeto(
  sujeto: SujetoDeCobro,
  tarjetaId: string,
): Promise<ResultadoWrapper<SenalDeCobro, CodigoCobro>> {
  const { data, error } = await getClient().functions.invoke('pagos-cobro', {
    /* 🔴 UN MAPA EXHAUSTIVO, jamás un ternario encadenado. Con dos sujetos
       `a ? x : y` era legible; con cuatro, **el `else` se vuelve el sujeto por
       defecto** y el día que entre el quinto se cobra disfrazado del último de
       la cadena. *Es la misma dicotomía que el actuador tuvo que desarmar
       cuando pasó de dos sujetos a cuatro.* Acá el `switch` sobre la unión
       hace que TypeScript exija la rama nueva. */
    body: cuerpoDelSujeto(sujeto, tarjetaId),
  });

  if (error) {
    /* 🔴 `functions.invoke` marca `error` para TODO status no-2xx —incluidos
       nuestros 409, que traen el código tipado en el cuerpo— y en ese caso
       **`data` viene vacío**. Leerlo solo de `data` perdía la causa y dejaba
       todo hablando con la voz genérica.
       *Medido en el aparato: el cobro dijo «no pudimos completar» cuando el
       motor sabía perfectamente qué había pasado. Un error que llega con su
       causa y se dibuja sin ella es peor que uno sin causa: hace creer que no
       la hay.*
       El cuerpo viaja en `error.context`, que es la Response. */
    let codigo = 'no_se_pudo_completar';
    const ctx = (error as { context?: unknown }).context;
    if (ctx && typeof (ctx as Response).text === 'function') {
      try {
        const cuerpo = await (ctx as Response).clone().text();
        const j = JSON.parse(cuerpo) as Record<string, unknown>;
        if (typeof j.codigo === 'string') codigo = j.codigo;
      } catch { /* si no se puede leer, queda la voz genérica */ }
    }
    const d = (data ?? {}) as Record<string, unknown>;
    if (codigo === 'no_se_pudo_completar' && typeof d.codigo === 'string') codigo = d.codigo;
    /* 🔴 INSTRUMENTO — patrón `stoken_de` de S101-A: que el PRÓXIMO intento
       PRODUZCA el dato en vez de dejarnos hipotetizando. Sin logs de Edge
       Function por CLI, esta línea es la única forma de saber en qué punto
       cortó. **Solo el código y el status: ningún dato de la compra ni de la
       tarjeta.** Se retira cuando la causa esté identificada. */
    const st = (ctx as Response | undefined)?.status ?? '-';
    console.log(`[cobro] codigo=${codigo} http=${st} msg=${(error as Error).message ?? '-'}`);
    return { ok: false, codigo: codigo as CodigoCobro, mensaje: codigo };
  }
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.ok !== true) {
    const codigo = typeof d.codigo === 'string' ? d.codigo : 'no_se_pudo_completar';
    return { ok: false, codigo: codigo as CodigoCobro, mensaje: codigo };
  }
  return { ok: true, data: { senal: 'optimista', estado: 'confirmando' } };
}
