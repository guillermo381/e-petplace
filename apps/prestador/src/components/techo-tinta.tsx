/**
 * TECHO DE TINTA — el header de la dosis del prestador (S58-B B2,
 * letra §15b.2 FIRMADA): bg.tinta #221E19 (token CONSTANTE en los 3
 * temas — la tinta no celebra ni se apaga), la MISMA curva orgánica
 * del techo vivo del cliente (44/26 — calibración fina en gate), texto
 * en PAPEL (palette.light0), la Huella en TEAL PURO #28E8DA (sobre
 * tinta manda el hex puro — §15b.2, par 10.76:1; el tealDark NO pasa),
 * subtítulo con DATO real de trabajo. SIN buscador (slot futuro sobre
 * la costura, Ley 13 — el techo v1 cierra en su curva). Cero gradiente
 * en toda la app del prestador.
 *
 * Composición local de tokens + primitiva Huella (patrón espejo-oferta);
 * su promoción a packages/ui como variante sistémica = pedido a la A
 * anotado (HeroMarca es del dueño — la tinta es OTRO material).
 */

import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { Isotipo, palette, spacing, typography } from '@epetplace/ui';

const CURVA = { izquierda: 44, derecha: 26 }; // la del techo vivo (patrón Hogar v2)

/**
 * S59-B1 (safe area): sobre la TINTA los íconos de la barra de estado son
 * CLAROS — la tinta es constante en los 3 temas. Con foco se fuerza
 * 'light'; al perderlo vuelve 'auto' (el default del raíz: oscuros sobre
 * papel en claro, claros en dark). Mismo patrón que la A firmó para el
 * techo del cliente (wiring por pantalla con useFocusEffect); acá vive en
 * TechoTinta porque el componente es LOCAL del app — no es packages/ui.
 */
function useBarraEstadoClara() {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('auto');
    }, []),
  );
}

/**
 * S59-B1: el VELO de la barra de estado — la zona del inset superior se
 * pinta de tinta SIEMPRE, también cuando el techo (que viaja dentro del
 * ScrollView) ya scrolleó: el contenido pasa por debajo del velo, jamás
 * pisa los íconos. Va como ÚLTIMO hijo del contenedor raíz de la pantalla.
 */
export function VeloBarraEstadoTinta() {
  const insets = useSafeAreaInsets();
  if (insets.top === 0) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: palette.tinta,
      }}
    />
  );
}

export function TechoTinta({ titulo, dato }: { titulo: string; dato: string }) {
  const insets = useSafeAreaInsets();
  useBarraEstadoClara();

  return (
    <View
      style={{
        backgroundColor: palette.tinta,
        paddingTop: insets.top + spacing[4],
        paddingBottom: spacing[5],
        paddingHorizontal: spacing[5],
        borderBottomLeftRadius: CURVA.izquierda,
        borderBottomRightRadius: CURVA.derecha,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        {/* enmienda §15b.2 FIRMADA en gate: la huella SALE, entra el
            ISOTIPO en blanco sobre tinta (identidad, fuera de la
            contabilidad de dosis — UNO por pantalla, Ley 4) */}
        <Isotipo size={26} variant="blanco" />
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.xl,
              color: palette.light0,
            }}
          >
            {titulo}
          </Text>
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              color: palette.light0,
              opacity: 0.78,
            }}
          >
            {dato}
          </Text>
        </View>
      </View>
    </View>
  );
}
