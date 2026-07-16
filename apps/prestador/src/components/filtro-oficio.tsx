/**
 * FILTRO POR OFICIO del HOY (S61-B5; RE-VESTIDO S61-B12 con el pulgar
 * del mock B7): Todos·Paseos·Estética con el ícono b′ de cada oficio —
 * el ACTIVO porta la huella AA de su capa (tealDark paseo / ámbar AA
 * estética), los inactivos hablan en tinta. Segmento activo = superficie
 * apoyada con elevacion.reposo (la gramática de SelectorSegmentado).
 * Composición LOCAL del app (patrón techo-oficio/espejo-oferta): la
 * enmienda de SelectorSegmentado con ícono en packages/ui queda como
 * pedido a la A si el patrón se repite.
 */

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import { Icono, motion, radius, spacing, typography, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export type FiltroOficioValor = 'todos' | 'paseo' | 'grooming' | 'adiestramiento';

// D-401 (S62): el segmento responde al dedo — la MISMA receta de la
// casa (SelectorOpcion/Boton: scale 0.99, transición spring fast).
function Segmento({
  esActivo,
  onPress,
  accessibilityLabel,
  children,
}: {
  esActivo: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const [presionado, setPresionado] = useState(false);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: esActivo }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => setPresionado(true)}
      onPressOut={() => setPresionado(false)}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[1.5],
          paddingVertical: spacing[2],
          borderRadius: radius.suave - 3,
          backgroundColor: esActivo ? theme.bg.card : 'transparent',
          boxShadow: esActivo ? theme.elevacion.reposo : undefined,
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
  /** S63-B: solo los oficios con oferta ACTIVA ganan segmento. */
  oficios: { paseo: boolean; grooming: boolean; adiestramiento: boolean };
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const segmentos: { codigo: FiltroOficioValor; etiqueta: string; icono: 'paseo' | 'grooming' | 'training' | null }[] = [
    { codigo: 'todos', etiqueta: t('agenda.filtroTodos'), icono: null },
    ...(oficios.paseo ? [{ codigo: 'paseo' as const, etiqueta: t('agenda.filtroPaseos'), icono: 'paseo' as const }] : []),
    ...(oficios.grooming
      ? [{ codigo: 'grooming' as const, etiqueta: t('agenda.filtroEstetica'), icono: 'grooming' as const }]
      : []),
    ...(oficios.adiestramiento
      ? [{ codigo: 'adiestramiento' as const, etiqueta: t('agenda.filtroAdiestramiento'), icono: 'training' as const }]
      : []),
  ];
  // Con 4 segmentos el ancho no da para 4 labels: los oficios hablan por
  // su ícono b′ (el a11y label queda entero); 'Todos' conserva su voz.
  const soloIcono = segmentos.length >= 4;

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t('agenda.filtroEtiqueta')}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.bg.overlay,
        borderRadius: radius.suave,
        padding: 3,
      }}
    >
      {segmentos.map((s) => {
        const esActivo = s.codigo === activo;
        return (
          <Segmento
            key={s.codigo}
            esActivo={esActivo}
            onPress={() => onCambio(s.codigo)}
            accessibilityLabel={s.etiqueta}
          >
            {s.icono && <Icono nombre={s.icono} registro={esActivo ? 'aa' : 'tinta'} tamano={18} />}
            {(!soloIcono || s.icono === null) && (
              <Text
                style={{
                  fontFamily: typography.family.sans.medium,
                  fontSize: typography.size.sm,
                  color: esActivo ? theme.text.primary : theme.text.secondary,
                }}
              >
                {s.etiqueta}
              </Text>
            )}
          </Segmento>
        );
      })}
    </View>
  );
}
