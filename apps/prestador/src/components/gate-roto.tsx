/**
 * S79-B (cura del blanco): GATE ROTO — la superficie que habla cuando el
 * gate de rol NO puede decidir (rol=false + titular=null: datos que se
 * contradicen, el motor que A está midiendo).
 *
 * Ley 13/D-541 en su forma final: un dato envenenado no fabrica NI
 * denegación NI vacío NI nada — dice la verdad con camino (reintentar +
 * volver, cero callejón). Patrón peldaño-0, como las tres pantallas de
 * "se despierta con el uso".
 */

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, EstadoVacio, spacing, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export function GateRoto({ onReintentar }: { onReintentar: () => void }) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
      <EstadoVacio
        titulo={t('gateRoto.titulo')}
        descripcion={t('gateRoto.detalle')}
        accion={
          <View style={{ gap: spacing[3], alignItems: 'center' }}>
            <Boton variante="secundario" etiqueta={t('gateRoto.reintentar')} onPress={onReintentar} />
            <Boton
              variante="ghost"
              etiqueta={t('gateRoto.volver')}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            />
          </View>
        }
      />
    </View>
  );
}
