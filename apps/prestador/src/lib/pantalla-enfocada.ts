/**
 * ¿Esta pantalla está a la vista? — el booleano que `EntradaDeCruce` pide.
 *
 * B documenta la integración con `useIsFocused()` de `@react-navigation/
 * native`, **que esta app no tiene como dependencia directa** (medido: no
 * está en `node_modules` del prestador). Antes que agregar un paquete para
 * un booleano, se deriva del `useFocusEffect` que expo-router ya expone y
 * que estas pantallas **ya usan** para cargar sus datos.
 *
 * ⚠️ Vive acá y no copiado en cada ventana **porque el par tiene que
 * responder igual**: si una calculara su foco distinto de la otra, el cruce
 * animaría de un lado y del otro no — y eso se ve como un defecto de la
 * animación cuando en realidad sería una discrepancia de la señal.
 *
 * `false` inicial a propósito: la primera pasada a `true` es el montaje, y
 * la pieza **ya trata ese flanco** guardando el valor de arranque — la
 * ventana que ya estaba visible al abrir la app no se anima.
 */
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function usePantallaEnfocada(): boolean {
  const [enfocada, setEnfocada] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setEnfocada(true);
      return () => setEnfocada(false);
    }, []),
  );
  return enfocada;
}
