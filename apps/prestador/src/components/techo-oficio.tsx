/**
 * TECHO DEL OFICIO — el header de la dosis del prestador (S58-B
 * §15b.2; RE-FIRMADO S61-B11/B12 sobre píxeles: el founder cuestionó
 * la tinta y GANÓ EL MURO tealDark). Nace TechoOficio (ex TechoTinta):
 * bg tealDark #0A7268 (constante en los 3 temas — el muro del oficio
 * no celebra ni se apaga), la MISMA curva orgánica 44/26, ISOTIPO en
 * blanco (identidad, fuera de la contabilidad de dosis).
 *
 * REGLAS NUEVAS DE LA ENMIENDA (verify-contrast S61):
 *   · sobre el muro, el acento funcional es PAPEL — el teal puro cae a
 *     3.77 sobre tealDark y queda PROHIBIDO ahí;
 *   · TODO texto sobre el muro va papel PLENO (la opacidad .78 caía a
 *     4.01 — la jerarquía la da el tamaño, jamás la transparencia);
 *   · el VIDRIO sobre el muro es OSCURO (negro .18 → papel 7.37; el
 *     claro .14 caía a 4.15).
 *
 * `pie` (S61-B12): el slot del toggle compacto (Hoy/Semana del HOY) —
 * el segmentado gemelo apilado MURIÓ; ToggleTecho es el control
 * canónico sobre el muro (activo = superficie PAPEL con texto del
 * muro, 5.51 ✓). Composición local del app (patrón espejo-oferta); su
 * promoción a packages/ui sigue anotada como pedido a la A.
 */

import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { Isotipo, motion, palette, radius, spacing, typography, useTheme } from '@epetplace/ui';

/** La curva orgánica del techo (patrón Hogar v2) — una sola verdad. */
export const CURVA_OFICIO = { izquierda: 44, derecha: 26 };
const CURVA = CURVA_OFICIO;

/**
 * El muro del oficio (§15b.2 S61) — una sola verdad para techo y velo.
 * S63 (D-407 pagada): el muro gana su PAR OSCURO — en dark resuelve a
 * tealDarkNoche #0A4A44 (papel 9.61 · textDark0 8.81 · teal puro 6.57,
 * mediciones S63-B); light y memorial siguen en tealDark #0A7268. La
 * const de módulo murió (Ley 37): el muro ahora escucha el tema.
 */
export function useMuroOficio(): string {
  const { mode } = useTheme();
  return mode === 'dark' ? palette.tealDarkNoche : palette.tealDark;
}
/** El vidrio OSCURO sobre el muro (AA verificado: papel 7.37 — sobre
 *  el par noche el contraste solo SUBE). */
export const VIDRIO_OFICIO = 'rgba(0,0,0,0.18)';

/**
 * Sobre el MURO los íconos de la barra de estado son CLAROS — el muro
 * es constante en los 3 temas. Con foco se fuerza 'light'; al perderlo
 * vuelve 'auto'. (Patrón BarraTabs, wiring por pantalla.)
 */
export function useBarraEstadoClara() {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('auto');
    }, []),
  );
}

/**
 * El VELO de la barra de estado — la zona del inset superior se pinta
 * del muro SIEMPRE, también cuando el techo (dentro del ScrollView) ya
 * scrolleó. Último hijo del contenedor raíz de la pantalla.
 */
export function VeloBarraEstadoOficio() {
  const insets = useSafeAreaInsets();
  const muro = useMuroOficio();
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
        backgroundColor: muro,
      }}
    />
  );
}

// D-401 (S62): el segmento del toggle responde al dedo — la receta de
// la casa (SelectorOpcion/Boton: scale 0.99, transición spring fast).
function SegmentoTecho({
  esActivo,
  etiqueta,
  onPress,
}: {
  esActivo: boolean;
  etiqueta: string;
  onPress: () => void;
}) {
  const muro = useMuroOficio();
  const [presionado, setPresionado] = useState(false);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: esActivo }}
      onPress={onPress}
      onPressIn={() => setPresionado(true)}
      onPressOut={() => setPresionado(false)}
    >
      <Animated.View
        style={{
          paddingVertical: spacing[1.5],
          paddingHorizontal: spacing[4],
          borderRadius: radius.suave - 3,
          backgroundColor: esActivo ? palette.light0 : 'transparent',
          transform: [{ scale: presionado ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        <Text
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.sm,
            color: esActivo ? muro : palette.light0,
          }}
        >
          {etiqueta}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** El toggle compacto SOBRE el muro (S61-B12): activo = superficie
 *  PAPEL apoyada con texto del muro; riel = vidrio oscuro. */
export function ToggleTecho<C extends string>({
  etiqueta,
  opciones,
  activo,
  onCambio,
}: {
  etiqueta: string;
  opciones: { codigo: C; etiqueta: string }[];
  activo: C;
  onCambio: (codigo: C) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={etiqueta}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        backgroundColor: VIDRIO_OFICIO,
        borderRadius: radius.suave,
        padding: 3,
      }}
    >
      {opciones.map((o) => {
        const esActivo = o.codigo === activo;
        return (
          <SegmentoTecho
            key={o.codigo}
            esActivo={esActivo}
            etiqueta={o.etiqueta}
            onPress={() => onCambio(o.codigo)}
          />
        );
      })}
    </View>
  );
}

export function TechoOficio({ titulo, dato, pie }: { titulo: string; dato: string; pie?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const muro = useMuroOficio();
  useBarraEstadoClara();

  return (
    <View
      style={{
        backgroundColor: muro,
        paddingTop: insets.top + spacing[4],
        paddingBottom: spacing[5],
        paddingHorizontal: spacing[5],
        borderBottomLeftRadius: CURVA.izquierda,
        borderBottomRightRadius: CURVA.derecha,
        overflow: 'hidden',
        gap: spacing[4],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        {/* enmienda §15b.2 FIRMADA en gate S58: el isotipo en blanco —
            identidad, UNO por pantalla, fuera de la contabilidad */}
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
          {/* papel PLENO (regla S61): sobre el muro la opacidad muere */}
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              color: palette.light0,
            }}
          >
            {dato}
          </Text>
        </View>
      </View>
      {pie}
    </View>
  );
}
