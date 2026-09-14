/**
 * LA RUEDA DE CARAS — el reloj de la rotación, escrito UNA vez.
 *
 * ── POR QUÉ EXISTE ───────────────────────────────────────────────────────
 * Tres superficies rotan caras con el mismo reloj: **00** (el splash), la
 * **`OndaAcceso`** de B, y ahora **02**. La casa ya escribió la doctrina al
 * construir la onda: *«tiene estado propio que corre solo… dos pantallas que
 * la dibujen son dos ruedas que se desincronizan — y peor, dos lugares donde
 * alguien tiene que acordarse de apagarla con `useReducedMotion`»*.
 *
 * ⇒ acá vive **el reloj**, no el dibujo. Cada pantalla monta `Personaje` como
 * quiera —círculo grande en 02, fila de seis en 00— y recibe de acá **qué cara
 * toca y cuánta opacidad tiene**.
 *
 * ⚠️ **NO es una pieza y no pretende serlo.** `packages/ui` no expone la rueda
 * (medido: cero exports de `Rueda*`), y una pieza que dibuja es de B. *Esto es
 * un `.ts` que cuenta el tiempo; si algún día una pista fuera del cliente la
 * necesita, el pedido a B es una pieza y este hook muere.*
 *
 * ── LAS DOS CADENCIAS, Y POR QUÉ SON DOS RELOJES ────────────────────────
 * **La primera cara dura 1 s; las siguientes 3 s** (firma del founder). Por eso
 * es un `setTimeout` que arma un `setInterval` y **no un intervalo más corto**:
 * *un intervalo de 1 s rotaría las seis caras en seis segundos y volvería el
 * carrusel una ansiedad.*
 *
 * ⚠️ **`useReducedMotion` NO la acelera: la apaga.** Queda la primera cara,
 * quieta y a opacidad plena. *Quien pidió menos movimiento no quiere uno más
 * rápido, quiere ninguno* — misma ley que `Entrada` y que el splash.
 */

import { useEffect, useState } from 'react';
import { useReducedMotion, useSharedValue, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { motion } from '@epetplace/ui';

/** Cuánto dura la PRIMERA cara. */
export const MS_PRIMERA_CARA = 1000;
/** Cuánto duran las demás — «cada tres segundos», textual del encargo. */
export const MS_POR_CARA = 3000;
/** El fundido cruzado. El token `grande` de la casa es 520: la letra pide
 *  medio segundo y el vocabulario ya tiene ese medio segundo con nombre. */
const MS_FUNDIDO = motion.duration.grande;

export interface RuedaDeCaras<T> {
  /** La cara que toca ahora. */
  actual: T;
  /** El índice, para que la pantalla pueda marcar cuál es (00 lo usa). */
  indice: number;
  /** Va al `useAnimatedStyle` de quien dibuja: `opacity: opacidad.value`. */
  opacidad: ReturnType<typeof useSharedValue<number>>;
}

export function useRuedaDeCaras<T>(caras: readonly T[]): RuedaDeCaras<T> {
  const quieto = useReducedMotion();
  const [indice, setIndice] = useState(0);
  const opacidad = useSharedValue(1);

  useEffect(() => {
    /* Con una sola cara la rueda no arranca: no hay a dónde ir. */
    if (quieto || caras.length < 2) return;
    let intervalo: ReturnType<typeof setInterval> | undefined;
    const avanzar = () => {
      opacidad.value = withSequence(
        withTiming(0, { duration: MS_FUNDIDO / 2, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: MS_FUNDIDO / 2, easing: Easing.inOut(Easing.quad) }),
      );
      /* El cambio de cara va en la MITAD del fundido —cuando la opacidad es
         0— o el cambio se vería como un salto en vez de un cruce. */
      setTimeout(() => setIndice((i) => (i + 1) % caras.length), MS_FUNDIDO / 2);
    };
    const primera = setTimeout(() => {
      avanzar();
      intervalo = setInterval(avanzar, MS_POR_CARA);
    }, MS_PRIMERA_CARA);
    return () => {
      clearTimeout(primera);
      if (intervalo !== undefined) clearInterval(intervalo);
    };
  }, [quieto, caras.length, opacidad]);

  return { actual: caras[indice] as T, indice, opacidad };
}
