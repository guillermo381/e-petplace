/**
 * EL ALTO DE LA CABECERA — el arranque de la hoja, medido una vez.
 *
 * `HojaContenido` pide `arranque`: dónde se apoya la hoja cuando nadie
 * scrolleó. Ese número **es el alto real de la cabecera**, y la cabecera no
 * tiene uno fijo — lo dice su propia nota: *«mide `insets.top` + padding +
 * CONTENIDO + padding, y el contenido es variable por diseño»*.
 *
 * ⇒ se mide con `onLayout`. Y esto vive acá y no copiado en cada pantalla
 * porque **son ocho**, y *una regla que hay que aplicar ocho veces se aplica
 * siete*.
 *
 * 🔴 **POR QUÉ ARRANCA EN LA PARTE FIJA Y NO EN CERO.** `onLayout` es
 * asincrónico: llega en el segundo cuadro. Con `0` de arranque, la hoja se
 * dibuja **tapando la cabecera** y salta a su sitio — un parpadeo en cada
 * apertura. `ALTO_CABECERA_*_FIJO` es exactamente el valor que B exportó para
 * esto: la parte que **es de la pieza**. Lo que falta —el inset y el
 * contenido— se suma acá y se corrige con la medición.
 *
 * ⚠️ **Es un `.ts` y no un `.tsx` a propósito**: no dibuja nada, cablea una
 * medición. *Un componente local para esto sumaría una pieza local al conteo
 * por hacer de puente entre dos piezas de la casa.*
 */

import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALTO_CABECERA_EMPUJADA_FIJO, ALTO_CABECERA_RAIZ_FIJO } from '@epetplace/ui';

export interface AltoDeCabecera {
  /** Va derecho a `HojaContenido.arranque`. */
  arranque: number;
  /** Va en el `onLayout` del nodo que envuelve a la `Cabecera`. */
  alMedir: (e: LayoutChangeEvent) => void;
}

export function useAltoDeCabecera(variante: 'raiz' | 'empujada'): AltoDeCabecera {
  const insets = useSafeAreaInsets();
  const piso =
    insets.top +
    (variante === 'raiz' ? ALTO_CABECERA_RAIZ_FIJO : ALTO_CABECERA_EMPUJADA_FIJO);
  const [arranque, setArranque] = useState(piso);

  const alMedir = useCallback((e: LayoutChangeEvent) => {
    const alto = e.nativeEvent.layout.height;
    /* Sólo se corrige si cambió de verdad: `onLayout` se dispara también al
       rotar o al aparecer el teclado, y un `setState` con el mismo número
       re-renderiza la pantalla entera por nada. */
    setArranque((previo) => (Math.abs(previo - alto) < 1 ? previo : alto));
  }, []);

  return { arranque, alMedir };
}
