/**
 * S103-C · **LA COSTURA ÚNICA DE DEUNA** — el único lugar donde entra la
 * fuente real.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ 🔴 ESTE ARCHIVO EXISTE PARA QUE EL LUNES SEA CONECTAR, NO CONSTRUIR. │
 * │                                                                      │
 * │ La pantalla (`components/espera-deuna.tsx`) **no sabe de dónde salen │
 * │ sus datos**: consume `EstadoDeUna` y nada más. Cuando D entregue su  │
 * │ puerta, **se cambia el cuerpo de `useEstadoDeUna` y CERO líneas de   │
 * │ la pantalla.**                                                       │
 * │                                                                      │
 * │ *Una costura declarada en un solo lugar es la diferencia entre       │
 * │ enchufar y reescribir.*                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ── QUÉ VA A REEMPLAZAR A QUÉ, exactamente ───────────────────────────────
 *
 * `ENSAYO` muere entero. `useEstadoDeUna` conserva **su firma y su tipo de
 * retorno**, y su cuerpo pasa a:
 *   ① crear/leer el intento por la puerta de D (`pagos-deuna-solicitud`),
 *   ② mapear la respuesta del proveedor a `EstadoDeUna` con la tabla §6,
 *   ③ sondear —o suscribirse— hasta que el actuador diga `pagada`.
 *
 * **El mapeo de estados NO se decide acá**: sale de `LETRA_DEUNA` §6, que ya
 * lo fija fila por fila. *Lo que este archivo aporta es la FORMA; el
 * contenido es de la letra y del contrato de D.*
 *
 * ── ⚠️ LO QUE ESTE ARCHIVO **NO** HACE, y es deliberado ──────────────────
 *
 * **No inventa el contrato de D.** No hay tipos de request, ni nombres de
 * endpoint, ni forma de payload: solo **lo que la PANTALLA necesita saber**,
 * que es lo que la letra ya firmó. *`PLAN_MESA_104` §1: «C no inventa
 * contratos». Un tipo con la forma adivinada del proveedor sería justo eso.*
 *
 * **Y no persiste nada.** El ensayo vive en memoria: cero escrituras a la
 * base, cero llamadas a QA. *Compatible con la veda 76(g) de A.*
 */

import { useMemo, useState } from 'react';

/**
 * Los estados que la PANTALLA distingue, derivados de la tabla §6 de
 * `LETRA_DEUNA`. **Es una unión discriminada a propósito**: cada fase trae
 * exactamente los datos que su dibujo necesita y ninguno más — *una fase que
 * puede leer un campo que no le corresponde es una fase que un día lo dibuja.*
 */
export type EstadoDeUna =
  /** `PENDING` con código vivo · y `PENDING` con código vencido y hold vivo:
   *  **son la misma fase**, y la pantalla las separa mirando el reloj. *Que el
   *  código venció es una consecuencia del tiempo, no un estado del servidor
   *  — pedirle al servidor que lo diga sería preguntar dos veces lo mismo.* */
  | {
      fase: 'esperando';
      /** Los 6 dígitos (`numericCode`). */
      codigo: string;
      /** 🔴 INSTANTE ISO del vencimiento del código — **del servidor**. */
      venceEn: string;
      /** INSTANTE ISO del hold del sujeto (stock o agenda). */
      holdVenceEn: string;
    }
  /** `APPROVED` / webhook `SUCCESS` **verificado por consulta activa**. */
  | { fase: 'aprobada' }
  /** 🔴 `NOT_FOUND` dentro de ventana · `REVERSED_FAILED`.
   *  §6: *hallazgo con nombre — jamás voz de éxito ni silencio*, y
   *  `REVERSED_FAILED` **jamás se resuelve solo**. */
  | { fase: 'hallazgo'; nombre: string };

/* ════════════════════════════════════════════════════════════════════════
   ☠️ ANDAMIO DE ENSAYO — muere entero cuando llegue el `pointOfSale`.

   **Por qué existe:** el riel está bloqueado por un dato del comercio que no
   expone ningún endpoint (D midió 16 sondeos → 404 en los 16), así que **no
   se puede crear ni una transacción**. Sin esto, la pantalla del código no se
   podría mirar hasta que ese dato llegue — y mirarla es justamente lo que
   permite corregirla antes.

   **Su condición de muerte, escrita para que no sobreviva:** el día que
   `useEstadoDeUna` llame a la puerta de D, `ENSAYO` y todo este bloque se
   borran. *Un andamio sin condición de muerte escrita es una pieza de
   producción que nadie se anima a tocar.*
   ════════════════════════════════════════════════════════════════════════ */

/** Los guiones de ensayo. **El código es un literal de prueba evidente.** */
export const ENSAYO = {
  /** El camino normal: código vivo, 3 min por delante, hold largo. */
  esperando: () => ({
    fase: 'esperando' as const,
    codigo: '123456',
    venceEn: new Date(Date.now() + 3 * 60_000).toISOString(),
    holdVenceEn: new Date(Date.now() + 12 * 60_000).toISOString(),
  }),
  /** Código a punto de vencer — para VER la regeneración sin esperar 3 min. */
  porVencer: () => ({
    fase: 'esperando' as const,
    codigo: '654321',
    venceEn: new Date(Date.now() + 10_000).toISOString(),
    holdVenceEn: new Date(Date.now() + 12 * 60_000).toISOString(),
  }),
  /** Hold a punto de morir: manda sobre el código (§5, compuerta 1). */
  holdPorVencer: () => ({
    fase: 'esperando' as const,
    codigo: '111222',
    venceEn: new Date(Date.now() + 3 * 60_000).toISOString(),
    holdVenceEn: new Date(Date.now() + 8_000).toISOString(),
  }),
  aprobada: () => ({ fase: 'aprobada' as const }),
  /** El nombre viaja del servidor; acá se ensaya el de la letra §3.5. */
  hallazgo: () => ({ fase: 'hallazgo' as const, nombre: 'huerfano_deuna_vencido' }),
} satisfies Record<string, () => EstadoDeUna>;

export type GuionDeEnsayo = keyof typeof ENSAYO;

/**
 * 🔴 **LA COSTURA.** Hoy resuelve contra `ENSAYO`; mañana contra la puerta de D.
 *
 * @param guion **solo del andamio** — desaparece con él. La firma real va a
 *        recibir el sujeto (`{tipo:'compra'|'cita', id}`), como `cobrar()`.
 */
export function useEstadoDeUna(guion: GuionDeEnsayo): {
  estado: EstadoDeUna;
  /** Pide un código nuevo (§5). En el ensayo, renueva el reloj en memoria. */
  regenerar: () => void;
} {
  const [semilla, setSemilla] = useState(0);

  /* El estado se re-deriva al regenerar. `useMemo` y no `useState` porque
     **el instante de vencimiento se calcula UNA vez por código** — recalcularlo
     en cada render movería el reloj hacia adelante para siempre y la cuenta
     regresiva nunca bajaría. */
  const estado = useMemo<EstadoDeUna>(() => ENSAYO[guion](), [guion, semilla]);

  return { estado, regenerar: () => setSemilla((s) => s + 1) };
}

/**
 * El sondeo que la fase `aprobada` va a necesitar. **Hoy no existe y se
 * declara**: en el ensayo el estado no cambia solo.
 *
 * *Se deja nombrado para que quien conecte la fuente real sepa que le falta —
 * `LETRA_DEUNA` §3.4 dice que la confirmación llega por webhook **y/o**
 * consulta activa, «la que llegue primero», y que **la pantalla pasa sola a
 * pagada, jamás declara**.* La casa ya tiene la pieza que hace esto para
 * tarjeta: `useEsperaDeConfirmacion`.
 */
export function pendienteDeConectar_sondeo(): void {
  /* intencionalmente vacío — ver el comentario de arriba */
}
