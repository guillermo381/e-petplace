/**
 * FILTRO POR OFICIO del HOY (S61-B5; re-vestido S61-B12; **RE-HECHO
 * S80-B12 cura 4 — Ley 6 §2.6, veredicto founder en dispositivo**).
 *
 * LA LEY: el estado activo se marca porque su HUELLA APARECE — sin
 * recuadros ni pills (la firma de BarraTabs desde S53, ley firmada).
 * MURIERON (Chanel): el riel `bg.overlay`, la superficie apoyada con
 * elevación del segmento activo y su borderRadius — el recuadro que el
 * founder señaló. Quedan los glifos: **inactivo = trazo en secundaria
 * SIN huella · activo = la huella aparece en el AA de su capa** (la
 * pieza es `IconoOficio`, trazo y huella independientes — D-546). Los
 * glifos suben a 21px (§2.9: el gate ES a 21 — los 18 violaban Ley 9,
 * hallazgo del censo B12). "Todos" no es un oficio y no lleva glifo:
 * habla por peso y color (activo = primaria+medium).
 *
 * Boceto M2 en la auditoría B12. A11y intacta (tablist/tab/selected);
 * press = la receta de la casa (0.99 spring fast, D-401).
 */

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import { motion, spacing, typography, useTheme } from '@epetplace/ui';

import { IconoOficio } from '@/components/iconos-oficio';
import { useTraduccion } from '@/i18n';

export type FiltroOficioValor = 'todos' | 'paseo' | 'grooming' | 'adiestramiento' | 'vet';

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
  // Guard espejo del registry de Icono: memorial NO porta capaText —
  // ahí la huella activa habla en secundaria (nada celebra, Ley 8).
  const aa = 'capaText' in theme ? theme.capaText : null;
  const segmentos: {
    codigo: FiltroOficioValor;
    etiqueta: string;
    oficio: 'paseo' | 'grooming' | 'adiestramiento' | 'veterinaria' | null;
    /** El AA de su capa — el tono en que la huella APARECE (Ley 6). */
    huellaActiva: string | null;
  }[] = [
    { codigo: 'todos', etiqueta: t('agenda.filtroTodos'), oficio: null, huellaActiva: null },
    ...(oficios.paseo
      ? [{ codigo: 'paseo' as const, etiqueta: t('agenda.filtroPaseos'), oficio: 'paseo' as const, huellaActiva: aa !== null ? aa.cuidado : theme.text.secondary }]
      : []),
    ...(oficios.grooming
      ? [{ codigo: 'grooming' as const, etiqueta: t('agenda.filtroEstetica'), oficio: 'grooming' as const, huellaActiva: theme.status.warningText }]
      : []),
    ...(oficios.adiestramiento
      ? [{ codigo: 'adiestramiento' as const, etiqueta: t('agenda.filtroAdiestramiento'), oficio: 'adiestramiento' as const, huellaActiva: aa !== null ? aa.cuidado : theme.text.secondary }]
      : []),
    ...(oficios.vet
      ? [{ codigo: 'vet' as const, etiqueta: t('agenda.filtroVeterinaria'), oficio: 'veterinaria' as const, huellaActiva: aa !== null ? aa.identidad : theme.text.secondary }]
      : []),
  ];
  // Con 4 segmentos el ancho no da para 4 labels: los oficios hablan por
  // su glifo (el a11y label queda entero); 'Todos' conserva su voz.
  const soloIcono = segmentos.length >= 4;

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t('agenda.filtroEtiqueta')}
      style={{ flexDirection: 'row' }}
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
            {s.oficio !== null && (
              <IconoOficio
                oficio={s.oficio}
                tamano={21}
                color={esActivo ? theme.text.primary : theme.text.secondary}
                // Ley 6: la huella APARECE al activarse — 'transparent'
                // no es un color inventado: es la AUSENCIA (§2.6).
                colorHuella={esActivo && s.huellaActiva !== null ? s.huellaActiva : 'transparent'}
              />
            )}
            {(!soloIcono || s.oficio === null) && (
              <Text
                style={{
                  fontFamily: esActivo ? typography.family.sans.medium : typography.family.sans.regular,
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
