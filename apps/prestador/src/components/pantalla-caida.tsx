/**
 * S79-B (cura de gate): PANTALLA CAÍDA — la frontera del crash de render.
 *
 * EL HALLAZGO: el app no tenía NINGUNA ErrorBoundary — un crash de render
 * en producción era pantalla BLANCA muda: peor que fabricar estado (Ley
 * 13/D-541), no fabrica nada y tampoco dice nada. El reporte del founder
 * ("la oferta queda en blanco al tocar reintentar") es esa clase: la
 * lectura reintentada llega, la rama `listo` revienta al dibujar, y no
 * había frontera que lo atrape. La CAUSA del dato la mide A — esto es el
 * CAMINO DE FALLO: reintentar termina SIEMPRE en una superficie que
 * habla, gane o pierda.
 *
 * Mecánica: export `ErrorBoundary` de expo-router por RUTA — se renderiza
 * DENTRO de los providers del layout (tema e i18n vivos). `retry`
 * re-monta la ruta (el camino de reintento completo, no un setState).
 * Forense L-138: el error queda LITERAL en el log antes de dibujar.
 */

import { useEffect } from 'react';
import { View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { Boton, EstadoVacio, spacing, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export function PantallaCaida({ error, retry }: ErrorBoundaryProps) {
  const { theme } = useTheme();
  const { t } = useTraduccion();

  useEffect(() => {
    // el forense: QUÉ reventó, literal, en logcat/Metro — la pantalla le
    // habla al prestador; el log le habla a la mesa.
    console.error(`[caida] render roto: ${error.message}`, error);
  }, [error]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
      <EstadoVacio
        titulo={t('caida.titulo')}
        descripcion={t('caida.detalle')}
        accion={
          <Boton
            variante="secundario"
            etiqueta={t('caida.reintentar')}
            onPress={() => void retry()}
          />
        }
      />
    </View>
  );
}
