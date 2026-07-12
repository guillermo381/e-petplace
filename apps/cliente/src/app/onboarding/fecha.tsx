/**
 * Onboarding · paso fecha y sexo (S45-B4/B4.1) — CampoFecha con
 * precisión honesta (espejo del CHECK de DB) + SelectorOpcion para
 * el sexo (macho/hembra/no sé — 'desconocido' en el vocabulario DB).
 * Ambos OPCIONALES: se puede continuar sin ellos (la RPC acepta null).
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  CampoFecha,
  Encabezado,
  SelectorOpcion,
  spacing,
  useTheme,
  type CampoFechaValor,
} from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export default function PasoFecha() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { nombre, especie } = useLocalSearchParams<{ nombre: string; especie: string }>();

  const [valor, setValor] = useState<CampoFechaValor | undefined>(undefined);
  const [sexo, setSexo] = useState<string | undefined>(undefined);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('onboarding.tituloSobre', { nombre: nombre ?? t('onboarding.tuMascota') })}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[2] }}>
        <CampoFecha
          label={t('onboarding.fechaLabel')}
          valor={valor}
          onChange={setValor}
          ayuda={t('onboarding.fechaAyuda')}
        />
        <SelectorOpcion
          etiqueta={t('onboarding.sexoEtiqueta')}
          opciones={[
            { codigo: 'macho', etiqueta: t('onboarding.sexoMacho') },
            { codigo: 'hembra', etiqueta: t('onboarding.sexoHembra') },
            { codigo: 'desconocido', etiqueta: t('onboarding.sexoNoSe') },
          ]}
          seleccionada={sexo}
          onSelect={setSexo}
        />
        <View style={{ height: spacing[2] }} />
        <Boton
          etiqueta={t('onboarding.continuar')}
          bloque
          onPress={() =>
            router.push({
              pathname: '/onboarding/foto',
              params: {
                nombre: nombre ?? '',
                especie: especie ?? '',
                ...(valor ? { fecha: valor.fecha, precision: valor.precision } : null),
                ...(sexo !== undefined ? { sexo } : null),
              },
            })
          }
        />
      </ScrollView>
    </View>
  );
}
