/**
 * Alta de mascota adicional · paso fecha y sexo (S55-A A2) — espejo del
 * onboarding S45: CampoFecha con precisión honesta + SelectorOpcion.
 * Ambos OPCIONALES (la RPC acepta null). Voz por el riel (tuteo).
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

export default function AgregarPasoFecha() {
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
        titulo={t('agregarMascota.tituloSobre', { nombre: nombre ?? '' })}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[2] }}>
        <CampoFecha
          label={t('agregarMascota.fechaLabel')}
          valor={valor}
          onChange={setValor}
          ayuda={t('agregarMascota.fechaAyuda')}
        />
        <SelectorOpcion
          acento="control"
          etiqueta={t('agregarMascota.sexoEtiqueta')}
          opciones={[
            { codigo: 'macho', etiqueta: t('agregarMascota.sexoMacho') },
            { codigo: 'hembra', etiqueta: t('agregarMascota.sexoHembra') },
            { codigo: 'desconocido', etiqueta: t('agregarMascota.sexoNoSe') },
          ]}
          seleccionada={sexo}
          onSelect={setSexo}
        />
        <View style={{ height: spacing[2] }} />
        <Boton
          etiqueta={t('agregarMascota.continuar')}
          bloque
          onPress={() =>
            router.push({
              pathname: '/hogar/agregar/foto',
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
