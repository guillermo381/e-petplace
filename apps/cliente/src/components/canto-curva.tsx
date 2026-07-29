/**
 * @override-s82c — EL CANTO QUE PINTA LA CURVA (lámina posición
 * consolidada, ítem 2; extraído de hogar/index cuando el perfil lo
 * necesitó — regla 37: cero clones). El principio resuelto del lado
 * prestador (FilaCita S80-B15): el color vive en el ELEMENTO PORTADOR
 * DEL RADIO — jamás un View absoluto recortado (la mordida medida en
 * B13). Anatomía: el color ES el fondo de la tarjeta exterior
 * (radius.lg, elevacion.reposo) y la superficie entra 6px desde la
 * izquierda con RADIO MENOR (radius.md) — la curva queda pintada por
 * construcción. SÓLIDO por firma B15 (el degradado de la lámina da
 * serrucho en lista contigua — gana la firma, declarado).
 *
 * OVERRIDE LOCAL del cliente: NO se generaliza — la promoción a
 * packages/ui es de B después del gate (guard R10 vigila el marcador;
 * casas declaradas: hogar/index · mascota/[mascotaId] · este archivo).
 */

import { View } from 'react-native';
import type { ReactNode } from 'react';
import { radius, useTheme } from '@epetplace/ui';

export function CantoCurva({ color, children }: { color: string | null; children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: color ?? theme.bg.card,
        borderRadius: radius.lg,
        boxShadow: theme.elevacion.reposo,
      }}
    >
      <View
        style={{
          marginLeft: color !== null ? 6 : 0,
          backgroundColor: theme.bg.card,
          borderRadius: radius.md,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}
