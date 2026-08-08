/**
 * LA FLECHA QUE FLOTA SOBRE LA PORTADA (S91-C).
 *
 * Va acá y no en la pieza porque `FichaPrestador` lo dice en la letra de
 * su propia prop: *«una flecha de volver es NAVEGACIÓN, y esta pieza no
 * sabe de dónde la abrieron»*. La pieza da el LUGAR (`sobrePortada`,
 * posicionado respetando la safe area); el consumidor pone el destino.
 *
 * ── NO SE INVENTÓ: SE COPIÓ AL VECINO ───────────────────────────────────
 * La casa ya resolvió «control sobre una imagen» en el perfil de mascota
 * —círculo de `rgba(255,255,255,0.15)` de 38, glifo blanco de 20— y ése es
 * el patrón que se reusa verbatim. Un segundo dibujo para el mismo trabajo
 * diverge el mes que viene.
 *
 * Por qué el vidrio y no el glifo pelado: sobre una foto cualquiera un
 * trazo blanco puede caer sobre cielo blanco. El disco translúcido es lo
 * que garantiza que se lea con CUALQUIER portada — que es la misma razón
 * por la que B le puso degradado a la variante `sobrePortada` del nombre.
 */

import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@epetplace/ui';

export function FlechaVolver({ onPress, etiqueta }: { onPress: () => void; etiqueta: string }) {
  // TOKEN, no `#FFFFFF` (Ley 1 — el lint me lo cazó y tenía razón):
  // `onGradient` es exactamente «lo que se lee sobre la marca», y de paso
  // hace lo correcto en MEMORIAL, donde es crema y no blanco puro.
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      // target 44 con disco de 38: el hitSlop compensa los 3 de cada lado.
      hitSlop={3}
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path
          d="m14 5-7 7 7 7"
          stroke={theme.text.onGradient}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}
