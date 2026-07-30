/**
 * S82-A r4 · PANTALLA CAÍDA del CLIENTE — espejo EXACTO de la cura S79-B
 * del prestador (fila 1 del censo de B; voto de mesa FIRMADO "app-wide"
 * que este lado INCUMPLÍA): el app del dueño no tenía NINGUNA
 * ErrorBoundary — un crash de render pintaba BLANCO mudo y el usuario lo
 * lee como "se colgó". La peor clase de máscara: no fabrica nada y
 * tampoco dice nada.
 *
 * Mecánica (la del prestador, verbatim): export `ErrorBoundary` de
 * expo-router en el _layout raíz; `retry` re-monta la ruta. La variante
 * RAÍZ es AUTOSUFICIENTE — se envuelve en su propio ThemeProvider (light
 * default) y lee el diccionario `es` DIRECTO, porque si el árbol del
 * raíz revienta, los providers (tema + i18n) pueden no existir
 * (`useTheme` TIRA sin provider). Idioma fijo es para la superficie de
 * último recurso: declarado, mismo criterio S79-B.
 *
 * Forense L-138: el error queda LITERAL en el log ANTES de dibujar.
 * Guard mecánico bilateral: scripts/verify-frontera-caida.mjs.
 */

import { useEffect } from 'react';
import { View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { Boton, EstadoVacio, ThemeProvider, spacing, useTheme } from '@epetplace/ui';

import { clienteEs } from '@/i18n/es';
import { useTraduccion } from '@/i18n';

export function PantallaCaidaRaiz({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(`[caida] render roto (raíz cliente): ${error.message}`, error);
  }, [error]);
  return (
    <ThemeProvider>
      <CuerpoCaida
        titulo={clienteEs.caida.titulo}
        detalle={clienteEs.caida.detalle}
        etiquetaReintentar={clienteEs.caida.reintentar}
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

/** La variante con i18n completo — para rutas que declaren boundary
 *  propio DENTRO de los providers (espejo del prestador). */
export function PantallaCaida({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTraduccion();

  useEffect(() => {
    // el forense: QUÉ reventó, literal — la pantalla le habla al dueño;
    // el log le habla a la mesa.
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
