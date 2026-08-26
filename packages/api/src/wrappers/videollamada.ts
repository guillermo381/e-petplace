/**
 * S106-A t2 · LA PUERTA DE LA VIDEOLLAMADA — el wrapper que le faltaba a C.
 *
 * **Motor sin puerta, otra vez.** `video-token` (autoría D) está desplegada y
 * alcanzable, y ninguna app podía llamarla: `packages/api` es la única puerta
 * de la casa a la DB y a las functions, y este archivo no existía. *Es la
 * tercera vez que el patrón cobra en este frente — por eso ahora el contrato
 * de una pieza de motor incluye su wrapper, y no se declara terminada sin él.*
 *
 * 🔴 **LOS CÓDIGOS SE EXTRAJERON DEL OBJETO, NO DE UN CONTRATO A MANO.**
 *    Se leyeron del cuerpo vivo de `video-token/index.ts` y del cuerpo vivo de
 *    `puede_entrar_a_videollamada` en la base. *La casa ya pagó lo contrario
 *    (`L-366`): un contrato escrito a mano declaraba 10 de los 12 códigos que
 *    su función emitía, y **siguió siendo cierto sobre todo lo que sí
 *    mencionaba** — que es exactamente lo que lo volvía invisible.*
 *
 * 🔴 **LA AUTORIZACIÓN ES LA SESIÓN.** `functions.invoke` la lleva sola. Ningún
 *    secreto compartido: una app publicada no los guarda.
 *
 * 🔴 **ESTE WRAPPER NO DECIDE SI SE PUEDE ENTRAR.** El veredicto es del
 *    servidor, íntegro. Acá no hay ni una condición de negocio — ni la ventana,
 *    ni el rol, ni el pago. *Una app que calcule su propia ventana termina
 *    ofreciendo un botón que el servidor va a rechazar, o —peor— escondiendo
 *    uno que habría funcionado.*
 */

import { getClient } from '../client';

/**
 * Los códigos, **medidos de las dos fuentes vivas**.
 *
 * Se agrupan por QUIÉN los emite porque la superficie los trata distinto: los
 * del veredicto describen **el estado de la cita** y merecen voz propia; los de
 * transporte describen **que algo falló en el camino** y son reintentables o
 * son defecto nuestro.
 */
export type CodigoVideollamada =
  /* ── El veredicto del servidor: los ocho motivos de la RPC. ────────────
     🔴 NO SE COLAPSAN en «no podés entrar». Cada uno tiene su voz, y
     `fuera_de_ventana` además dice CUÁNDO abre. *Decirle «no» a alguien que
     llegó veinte minutos antes lo manda a llamar por teléfono.* */
  | 'cita_inexistente'
  | 'ajeno_a_la_cita'
  | 'no_es_teleconsulta'
  | 'cita_cancelada'
  | 'cita_no_realizable'
  | 'cita_finalizada'
  | 'cita_no_pagada'
  | 'fuera_de_ventana'
  /* ── Transporte y sesión: los emite la edge, no el veredicto. ────────── */
  | 'sin_sesion'              // 401 · no hay sesión
  | 'sesion_no_verificable'   // 503 · NUESTRO: no pudimos verificarla ≠ no hay
  | 'veredicto_no_disponible' // 503 · la RPC no contestó
  | 'servidor_sin_configurar' // 500 · defecto de despliegue
  | 'video_sin_configurar'    // 500 · defecto de despliegue
  | 'cuerpo_invalido'         // 400 · defecto nuestro: este wrapper arma el cuerpo
  | 'cita_id_requerido'       // 400 · idem
  | 'metodo_no_permitido'     // 405 · idem
  | 'no_se_pudo_completar';   // el fallo que no se pudo leer

/** Lo que la puerta devuelve cuando SÍ se puede entrar. */
export interface TokenVideollamada {
  /** Credencial de vida corta. **No se persiste en ningún lado.** */
  token: string;
  /** El servidor de LiveKit. Viene del servidor: la app no lo conoce. */
  url: string;
  /** La sala. **La dice la RPC**, jamás el cliente. */
  sala: string;
  /** `dueno` | `profesional`. Lo resuelve el servidor. */
  rol: string;
  /** ISO. Cuándo muere el token — **no cuándo termina la consulta.** */
  expiraEn: string;
}

/**
 * 🔴 `fuera_de_ventana` LLEVA SU HORA **POR TIPO**, no por convención.
 *
 * Se midió el cuerpo de la RPC: ese brazo devuelve `abre_en` de forma
 * **incondicional**. Por eso acá es obligatorio y no opcional — **«fuera de
 * ventana sin decir cuándo abre» es inexpresable desde este wrapper.**
 *
 * *Si fuera opcional, la pantalla tendría que decidir qué hacer con el caso sin
 * hora, y el camino barato es un «todavía no» mudo: exactamente el botón
 * apagado sin explicación que la Ley 23 prohíbe.*
 */
export type ResultadoVideollamada =
  | { ok: true; data: TokenVideollamada }
  | { ok: false; codigo: 'fuera_de_ventana'; mensaje: string; abreEn: string }
  | {
      ok: false;
      codigo: Exclude<CodigoVideollamada, 'fuera_de_ventana'> | 'error_desconocido' | 'datos_inconsistentes';
      mensaje: string;
    };

/** Arma el fallo leyendo el código y, si vino, la hora de apertura. */
function fallo(codigo: string, abreEn?: unknown): ResultadoVideollamada {
  if (codigo === 'fuera_de_ventana' && typeof abreEn === 'string') {
    return { ok: false, codigo: 'fuera_de_ventana', mensaje: codigo, abreEn };
  }
  /* 🔴 `fuera_de_ventana` SIN hora no se deja pasar como tal. La RPC la manda
     siempre; si no llegó, lo que hay es un desajuste entre la puerta y el
     motor, y **eso no se disfraza del estado normal de una cita futura**:
     `datos_inconsistentes` es la verdad y manda a mirar el servidor. */
  if (codigo === 'fuera_de_ventana') {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: 'fuera_de_ventana_sin_hora' };
  }
  return {
    ok: false,
    codigo: codigo as Exclude<CodigoVideollamada, 'fuera_de_ventana'>,
    mensaje: codigo,
  };
}

/**
 * Pide el token para entrar a la videollamada de una cita.
 *
 * **Se llama en el momento de entrar, jamás antes para «ver si se puede».** El
 * token es de vida corta a propósito: uno pedido con media hora de anticipación
 * ya no sirve cuando la persona toca el botón. Para saber si mostrar el botón,
 * la superficie llama a esto **cuando el usuario abre el detalle de la cita** y
 * usa el código del fallo — que es el veredicto — para decidir qué dibujar.
 */
export async function pedirTokenVideollamada(
  citaId: string,
): Promise<ResultadoVideollamada> {
  const { data, error } = await getClient().functions.invoke('video-token', {
    body: { cita_id: citaId },
  });

  if (error) {
    /* 🔴 `functions.invoke` marca `error` para TODO status no-2xx —incluidos
       los 403/409 que traen el veredicto tipado en el cuerpo— y en ese caso
       **`data` viene vacío**. Leerlo sólo de `data` pierde la causa y deja
       todo hablando con la voz genérica. El cuerpo viaja en `error.context`,
       que es la Response. *Medido en S101-B: el pago dijo «no pudimos
       completar» cuando el motor sabía perfectamente qué había pasado.* */
    let codigo = 'no_se_pudo_completar';
    let abreEn: unknown;
    const ctx = (error as { context?: unknown }).context;
    if (ctx && typeof (ctx as Response).text === 'function') {
      try {
        const j = JSON.parse(await (ctx as Response).clone().text()) as Record<string, unknown>;
        if (typeof j.codigo === 'string') codigo = j.codigo;
        abreEn = j.abre_en;
      } catch { /* si no se puede leer, queda la voz genérica */ }
    }
    const d = (data ?? {}) as Record<string, unknown>;
    if (codigo === 'no_se_pudo_completar' && typeof d.codigo === 'string') codigo = d.codigo;
    if (abreEn === undefined) abreEn = d.abre_en;
    return fallo(codigo, abreEn);
  }

  const d = (data ?? {}) as Record<string, unknown>;
  if (d.ok !== true) return fallo(typeof d.codigo === 'string' ? d.codigo : 'no_se_pudo_completar', d.abre_en);

  /* 🔴 SE VERIFICA LA FORMA ANTES DE DEVOLVERLA. *Un `ok:true` sin token es un
     `ok:true` que hace fallar a la pantalla dos pasos más adelante, donde ya
     nadie sabe que el problema fue la respuesta del servidor.* */
  if (
    typeof d.token !== 'string' || typeof d.url !== 'string' ||
    typeof d.sala !== 'string' || typeof d.rol !== 'string' ||
    typeof d.expira_en !== 'string'
  ) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: 'respuesta_incompleta' };
  }

  return {
    ok: true,
    data: {
      token: d.token,
      url: d.url,
      sala: d.sala,
      rol: d.rol,
      expiraEn: d.expira_en,
    },
  };
}
