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
import { Boton, EstadoVacio, ThemeProvider, spacing, useTheme } from '@epetplace/ui';

import { prestadorEs } from '@/i18n/es';
import { useTraduccion } from '@/i18n';

/**
 * S79-B (voto de mesa, APP-WIDE): la frontera del RAÍZ. El root _layout
 * monta los providers (tema + i18n) DENTRO de su propio render — si el
 * árbol revienta, la frontera del raíz se dibuja SIN ellos (`useTheme`
 * TIRA sin provider; el init de i18n es de montaje del ProveedorI18n).
 * Por eso esta variante es AUTOSUFICIENTE: se envuelve en su propio
 * ThemeProvider (light default) y lee el diccionario `es` DIRECTO — los
 * strings viven en el riel, el idioma queda fijo en es para la
 * superficie de último recurso (declarado; las rutas con boundary
 * propio conservan la versión i18n completa de abajo).
 */
export function PantallaCaidaRaiz({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(`[caida] render roto (raíz): ${error.message}`, error);
  }, [error]);
  return (
    <ThemeProvider>
      <CuerpoCaida
        titulo={prestadorEs.caida.titulo}
        detalle={prestadorEs.caida.detalle}
        etiquetaReintentar={prestadorEs.caida.reintentar}
        onReintentar={() => void retry()}
      />
    </ThemeProvider>
  );
}

function CuerpoCaida({
  titulo,
  detalle,
  etiquetaReintentar,
  onReintentar,
}: {
  titulo: string;
  detalle: string;
  etiquetaReintentar: string;
  onReintentar: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
      <EstadoVacio
        titulo={titulo}
        descripcion={detalle}
        accion={<Boton variante="secundario" etiqueta={etiquetaReintentar} onPress={onReintentar} />}
      />
    </View>
  );
}

export function PantallaCaida({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTraduccion();

  useEffect(() => {
    // el forense: QUÉ reventó, literal, en logcat/Metro — la pantalla le
    // habla al prestador; el log le habla a la mesa.
    console.error(`[caida] render roto: ${error.message}`, error);
  }, [error]);

  return (
    <CuerpoCaida
      titulo={t('caida.titulo')}
      detalle={t('caida.detalle')}
      etiquetaReintentar={t('caida.reintentar')}
      onReintentar={() => void retry()}
    />
  );
}
