/**
 * Alta de mascota adicional · paso foto (S55-A A2) — SelectorAvatar
 * (identidad, no evidencia; la huella es cara válida). Usa la infra
 * S45: capturaFoto con resize y la frontera %25 (L-137) al subir.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  SelectorAvatar,
  spacing,
  useTheme,
  type SelectorAvatarFoto,
} from '@epetplace/ui';

import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';

export default function AgregarPasoFoto() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    nombre: string;
    especie: string;
    fecha?: string;
    precision?: string;
    sexo?: string;
  }>();

  const [foto, setFoto] = useState<SelectorAvatarFoto | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('agregarMascota.tituloFoto', { nombre: params.nombre ?? '' })}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingTop: spacing[8], paddingBottom: insets.bottom + spacing[6], gap: spacing[8] }}>
        <SelectorAvatar
          nombre={params.nombre ?? ''}
          especie={esEspecieUi(params.especie) ? params.especie : undefined}
          foto={foto}
          onCambiar={setFoto}
        />
        <Boton
          etiqueta={t('agregarMascota.continuar')}
          bloque
          onPress={() =>
            router.push({
              pathname: '/hogar/agregar/cierre',
              params: {
                nombre: params.nombre ?? '',
                especie: params.especie ?? '',
                ...(params.fecha ? { fecha: params.fecha, precision: params.precision } : null),
                ...(params.sexo ? { sexo: params.sexo } : null),
                ...(foto && typeof foto.uri === 'string' ? { fotoUri: foto.uri } : null),
              },
            })
          }
        />
      </ScrollView>
    </View>
  );
}
