/**
 * LA COLA DE ENVÍO DEL HILO — reductor PURO.
 *
 * Por qué existe y por qué es pura: mandar un mensaje falla de maneras que la
 * pantalla no puede resolver sola (se cortó la red a mitad, la persona tocó dos
 * veces, la app se fue a segundo plano). **Esa mecánica no es de la pantalla ni
 * del motor: es de acá.** C la cablea a su estado, A pone el `enviar` real.
 *
 * No importa Supabase ni React a propósito: el envío entra **inyectado**, así
 * que esto se ejerce sin levantar app, sin sesión y sin red.
 *
 * ── LAS TRES COSAS QUE TIENE QUE GARANTIZAR ────────────────────────────────
 * ① **El doble toque NO duplica.** La clave de idempotencia la pone el
 *    llamador y la cola la respeta: encolar dos veces la misma clave es un
 *    no-op, no un segundo mensaje. *La casa ya se cobró esta: seis comprables
 *    tuvieron que probar «el doble toque no duplica» uno por uno.*
 * ② **El fallo se DICE.** Un envío que falla queda `fallido` con su causa
 *    visible y reintentable — jamás desaparece ni se disfraza de enviado
 *    (regla 36: nada de fallback silencioso).
 * ③ **El reintento no crea un mensaje nuevo:** reusa la misma clave.
 */

export type EstadoEnvio = 'pendiente' | 'enviando' | 'enviado' | 'fallido';

export interface MensajeEnCola {
  /** La pone el llamador y es la identidad del intento. Dos encolados con la
   *  misma clave son EL MISMO mensaje. */
  readonly claveIdempotencia: string;
  readonly cuerpo: string;
  readonly estado: EstadoEnvio;
  readonly intentos: number;
  /** Código de la causa cuando `fallido`. Código, no frase: la voz es de la UI. */
  readonly causaFallo?: string;
  /** Lo devuelve el motor al confirmar. Hasta entonces, el mensaje es local. */
  readonly idServidor?: string;
}

export type Cola = readonly MensajeEnCola[];

export type AccionCola =
  | { readonly tipo: 'encolar'; readonly claveIdempotencia: string; readonly cuerpo: string }
  | { readonly tipo: 'marcar_enviando'; readonly claveIdempotencia: string }
  | { readonly tipo: 'confirmar'; readonly claveIdempotencia: string; readonly idServidor: string }
  | { readonly tipo: 'fallar'; readonly claveIdempotencia: string; readonly causa: string }
  | { readonly tipo: 'reintentar'; readonly claveIdempotencia: string }
  /** Al confirmarse contra el servidor, el mensaje sale de la cola: ya vive en
   *  el hilo. Se llama aparte para que la pantalla pueda mostrar el "enviado"
   *  un instante antes de que desaparezca. */
  | { readonly tipo: 'purgar_enviados' };

/** Techo de reintentos. Un mensaje que falló 5 veces no se sigue reintentando
 *  solo: la persona decide. */
export const MAX_INTENTOS = 5;

function reemplazar(
  cola: Cola,
  clave: string,
  f: (m: MensajeEnCola) => MensajeEnCola,
): Cola {
  return cola.map((m) => (m.claveIdempotencia === clave ? f(m) : m));
}

/**
 * El reductor. Puro: misma cola + misma acción = misma salida, siempre.
 *
 * **Toda acción sobre una clave que no está en la cola es un no-op**, jamás una
 * excepción: una respuesta del servidor puede llegar después de que la persona
 * cerró la pantalla, y eso no es un error.
 */
export function reducirCola(cola: Cola, accion: AccionCola): Cola {
  switch (accion.tipo) {
    case 'encolar': {
      // ① El doble toque no duplica.
      if (cola.some((m) => m.claveIdempotencia === accion.claveIdempotencia)) {
        return cola;
      }
      return [
        ...cola,
        {
          claveIdempotencia: accion.claveIdempotencia,
          cuerpo: accion.cuerpo,
          estado: 'pendiente',
          intentos: 0,
        },
      ];
    }
    case 'marcar_enviando':
      return reemplazar(cola, accion.claveIdempotencia, (m) =>
        // No se re-envía lo ya enviado ni lo que está en vuelo.
        m.estado === 'pendiente' || m.estado === 'fallido'
          ? { ...m, estado: 'enviando', intentos: m.intentos + 1, causaFallo: undefined }
          : m,
      );
    case 'confirmar':
      return reemplazar(cola, accion.claveIdempotencia, (m) => ({
        ...m,
        estado: 'enviado',
        idServidor: accion.idServidor,
        causaFallo: undefined,
      }));
    case 'fallar':
      // ② El fallo se dice, con su causa, y queda reintentable.
      return reemplazar(cola, accion.claveIdempotencia, (m) =>
        m.estado === 'enviado' ? m : { ...m, estado: 'fallido', causaFallo: accion.causa },
      );
    case 'reintentar':
      // ③ Misma clave: el reintento NO crea un mensaje nuevo.
      return reemplazar(cola, accion.claveIdempotencia, (m) =>
        m.estado === 'fallido' && m.intentos < MAX_INTENTOS
          ? { ...m, estado: 'pendiente', causaFallo: undefined }
          : m,
      );
    case 'purgar_enviados':
      return cola.filter((m) => m.estado !== 'enviado');
  }
}

/** Lo que la pantalla tiene que mandar ahora. Orden de llegada. */
export function proximoAEnviar(cola: Cola): MensajeEnCola | null {
  return cola.find((m) => m.estado === 'pendiente') ?? null;
}

/** ¿Se puede reintentar a mano? Falso si agotó el techo — y ahí la UI tiene que
 *  ofrecer otra cosa, no un botón que no va a funcionar. */
export function puedeReintentar(m: MensajeEnCola): boolean {
  return m.estado === 'fallido' && m.intentos < MAX_INTENTOS;
}

export function hayFallidos(cola: Cola): boolean {
  return cola.some((m) => m.estado === 'fallido');
}
