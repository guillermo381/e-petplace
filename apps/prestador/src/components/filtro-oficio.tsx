/**
 * FILTRO POR OFICIO del HOY (S61-B5 → S80-B15, LA LÍNEA VIAJERA —
 * firmada por el founder).
 *
 * LA ENMIENDA DE LEY (frontera, no debilitamiento): en TABS la huella
 * marca el estado (Ley 6 §2.6, intacta); en FILTROS la huella está
 * SIEMPRE (es identidad del glifo) y **el estado lo marca UNA LÍNEA
 * QUE VIAJA** entre opciones — no recuadro, no pill; una línea que
 * viaja cumple §9.6 por construcción (se ve de dónde viene y a dónde
 * llega). El porqué: el filtro tiene "todos" como estado legal y sus
 * opciones aparecen según la oferta — la posición es lo que el ojo
 * pide, y la huella sola no leía (veredicto founder en dispositivo).
 *
 * B14 ②: LAS CUATRO CON ETIQUETA — "Todos" era texto y los oficios
 * glifos sueltos: nada comparable. Ahora todos hablan igual (glifo con
 * huella + etiqueta; "Todos" sin glifo porque no es un oficio).
 *
 * Física: motion.duration.fast + bezier de la casa; memorial =
 * reemplazo directo, la línea no viaja (Ley 8).
 */

import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  cubicBezier,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion, radius, spacing, typography, useTheme } from '@epetplace/ui';

import { IconoOficio } from '@/components/iconos-oficio';
import { useTraduccion } from '@/i18n';

export type FiltroOficioValor = 'todos' | 'paseo' | 'grooming' | 'adiestramiento' | 'vet';

const FISICA = { duration: motion.duration.fast, easing: Easing.bezier(0.32, 0.72, 0, 1) };

function Segmento({
  esActivo,
  onPress,
  accessibilityLabel,
  onLayout,
  children,
}: {
  esActivo: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  onLayout: (x: number, ancho: number) => void;
  children: React.ReactNode;
}) {
  const [presionado, setPresionado] = useState(false);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: esActivo }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => setPresionado(true)}
      onPressOut={() => setPresionado(false)}
      onLayout={(e) => onLayout(e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[1.5],
          minHeight: 44,
          transform: [{ scale: presionado ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function FiltroOficio({
  activo,
  onCambio,
  oficios,
}: {
  activo: FiltroOficioValor;
  onCambio: (v: FiltroOficioValor) => void;
  /** S63-B: solo los oficios con oferta ACTIVA ganan segmento. S69-B: +vet. */
  oficios: { paseo: boolean; grooming: boolean; adiestramiento: boolean; vet: boolean };
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const esMemorial = theme.mode === 'memorial';
  // Guard espejo del registry de Icono: memorial no porta capaText.
  const aa = 'capaText' in theme ? theme.capaText : null;

  const segmentos: {
    codigo: FiltroOficioValor;
    etiqueta: string;
    oficio: 'paseo' | 'grooming' | 'adiestramiento' | 'veterinaria' | null;
    /** El AA de su capa — la huella (SIEMPRE) y la línea cuando preside. */
    capaAa: string;
  }[] = [
    { codigo: 'todos', etiqueta: t('agenda.filtroTodos'), oficio: null, capaAa: theme.text.primary },
    ...(oficios.paseo
      ? [{ codigo: 'paseo' as const, etiqueta: t('agenda.filtroPaseos'), oficio: 'paseo' as const, capaAa: aa !== null ? aa.cuidado : theme.text.secondary }]
      : []),
    ...(oficios.grooming
      ? [{ codigo: 'grooming' as const, etiqueta: t('agenda.filtroEstetica'), oficio: 'grooming' as const, capaAa: theme.status.warningText }]
      : []),
    ...(oficios.adiestramiento
      ? [{ codigo: 'adiestramiento' as const, etiqueta: t('agenda.filtroAdiestramiento'), oficio: 'adiestramiento' as const, capaAa: aa !== null ? aa.cuidado : theme.text.secondary }]
      : []),
    ...(oficios.vet
      ? [{ codigo: 'vet' as const, etiqueta: t('agenda.filtroVeterinaria'), oficio: 'veterinaria' as const, capaAa: aa !== null ? aa.identidad : theme.text.secondary }]
      : []),
  ];

  // LA LÍNEA VIAJERA — posición/ancho por onLayout de cada segmento;
  // el primer posicionamiento no viaja (no hay origen que mostrar).
  const [marcos, setMarcos] = useState<Record<string, { x: number; ancho: number }>>({});
  const lineaX = useSharedValue(0);
  const lineaAncho = useSharedValue(0);
  useEffect(() => {
    const marco = marcos[activo];
    if (!marco) return;
    if (lineaAncho.value === 0 || esMemorial) {
      // primer render o memorial: reemplazo directo, sin viaje
      lineaX.value = marco.x;
      lineaAncho.value = marco.ancho;
      return;
    }
    lineaX.value = withTiming(marco.x, FISICA);
    lineaAncho.value = withTiming(marco.ancho, FISICA);
  }, [activo, marcos, esMemorial, lineaX, lineaAncho]);
  const estiloLinea = useAnimatedStyle(() => ({
    transform: [{ translateX: lineaX.value }],
    width: lineaAncho.value,
  }));

  const colorLinea = segmentos.find((s) => s.codigo === activo)?.capaAa ?? theme.text.primary;

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t('agenda.filtroEtiqueta')}
      style={{ flexDirection: 'row', position: 'relative', paddingBottom: spacing[1] }}
    >
      {segmentos.map((s) => {
        const esActivo = s.codigo === activo;
        return (
          <Segmento
            key={s.codigo}
            esActivo={esActivo}
            onPress={() => onCambio(s.codigo)}
            accessibilityLabel={s.etiqueta}
            onLayout={(x, ancho) =>
              setMarcos((m) =>
                m[s.codigo]?.x === x && m[s.codigo]?.ancho === ancho ? m : { ...m, [s.codigo]: { x, ancho } },
              )
            }
          >
            {s.oficio !== null && (
              // B15: la huella SIEMPRE — es identidad del glifo, no estado.
              <IconoOficio oficio={s.oficio} tamano={21} color={esActivo ? theme.text.primary : theme.text.secondary} colorHuella={s.capaAa} />
            )}
            <Text
              numberOfLines={1}
              style={{
                fontFamily: esActivo ? typography.family.sans.medium : typography.family.sans.regular,
                fontSize: typography.size.sm,
                color: esActivo ? theme.text.primary : theme.text.secondary,
              }}
            >
              {s.etiqueta}
            </Text>
          </Segmento>
        );
      })}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 2,
            borderRadius: radius.full,
            backgroundColor: colorLinea,
          },
          estiloLinea,
        ]}
      />
    </View>
  );
}
