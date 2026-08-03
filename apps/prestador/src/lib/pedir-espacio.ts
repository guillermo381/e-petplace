/**
 * PEDIR ESPACIO — el scroll relativo que trae a la vista lo que acaba de
 * aparecer (S84-C34 ⑤, la cura de 🔴 Places bajo el teclado).
 *
 * NACE COMO HOOK Y NO COPIADO EN CADA PANTALLA porque tiene **dos
 * consumidores desde el minuto uno** (`cuenta/perfil` y `sala-espera`,
 * las dos casas de `SeccionSede`) y la mecánica es idéntica: un ref al
 * ScrollView, el offset vivo, y un `scrollTo` relativo. Copiarla dos
 * veces es como empiezan los clones que L-175 persigue — y acá el clon
 * sería especialmente traicionero, porque un `onScroll` que se olvida en
 * una de las dos deja la cura muerta EN SILENCIO: la pantalla no falla,
 * simplemente no scrollea.
 *
 * POR QUÉ RELATIVO Y NO A UNA COORDENADA: quien pide el espacio está
 * anidado y no conoce su `y` dentro del scroll (el detalle vive en
 * `SeccionSede.onPedirEspacio`). Lo único que sabe es **cuánto ocupa**, y
 * con eso alcanza: subir el contenido exactamente ese alto pone lo nuevo
 * donde estaba el campo — arriba del teclado.
 *
 * `scrollEventThrottle` en 16 porque el offset tiene que estar FRESCO
 * cuando llega el pedido; con el default (0 en iOS) el evento llega una
 * sola vez y el cálculo saldría de un offset viejo.
 */

import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { ScrollView } from 'react-native';

export function usePedirEspacio() {
  const ref = useRef<ScrollView>(null);
  const offset = useRef(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
  }, []);

  /** Sube el contenido `alto` píxeles. Si abajo no queda tanto, RN
   *  clampea solo — y ahí la lista entra parcial, con su primera opción
   *  visible, que es el límite declarado de la cura. */
  const pedirEspacio = useCallback((alto: number) => {
    ref.current?.scrollTo({ y: offset.current + alto, animated: true });
  }, []);

  return { ref, onScroll, scrollEventThrottle: 16, pedirEspacio } as const;
}
