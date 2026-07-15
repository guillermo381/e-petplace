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

import { Pressable, Text, View } from 'react-native';
import { Icono, radius, spacing, typography, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export type FiltroOficioValor = 'todos' | 'paseo' | 'grooming';

export function FiltroOficio({
  activo,
  onCambio,
}: {
  activo: FiltroOficioValor;
  onCambio: (v: FiltroOficioValor) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const segmentos: { codigo: FiltroOficioValor; etiqueta: string; icono: 'paseo' | 'grooming' | null }[] = [
    { codigo: 'todos', etiqueta: t('agenda.filtroTodos'), icono: null },
    { codigo: 'paseo', etiqueta: t('agenda.filtroPaseos'), icono: 'paseo' },
    { codigo: 'grooming', etiqueta: t('agenda.filtroEstetica'), icono: 'grooming' },
  ];

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
          <Pressable
            key={s.codigo}
            accessibilityRole="tab"
            accessibilityState={{ selected: esActivo }}
            onPress={() => onCambio(s.codigo)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[1.5],
              paddingVertical: spacing[2],
              borderRadius: radius.suave - 3,
              backgroundColor: esActivo ? theme.bg.card : 'transparent',
              boxShadow: esActivo ? theme.elevacion.reposo : undefined,
            }}
          >
            {s.icono && <Icono nombre={s.icono} registro={esActivo ? 'aa' : 'tinta'} tamano={18} />}
            <Text
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.sm,
                color: esActivo ? theme.text.primary : theme.text.secondary,
              }}
            >
              {s.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
