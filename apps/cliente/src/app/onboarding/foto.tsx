/**
 * Onboarding · paso foto (S45-B4) — SelectorAvatar (identidad, no
 * evidencia). "Por ahora no" (en la Hoja) y "Continuar" siguen al
 * cierre sin foto: la huella es cara válida.
 *
 * NOTA: la foto capturada viaja al cierre por params, pero su
 * persistencia (upload + mascotas.foto_url) espera el OK founder de
 * la propuesta S45-B4 (la RPC no tiene p_foto_url y el dueño no puede
 * UPDATE mascotas por RLS). El paso funciona completo; el destino
 * llega con esa migración.
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

export default function PasoFoto() {
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
        titulo={t('onboarding.tituloFoto', { nombre: params.nombre ?? t('onboarding.tuMascota') })}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingTop: spacing[8], paddingBottom: insets.bottom + spacing[6], gap: spacing[8] }}>
        <SelectorAvatar
          nombre={params.nombre ?? t('onboarding.tuMascota')}
          especie={esEspecieUi(params.especie) ? params.especie : undefined}
          foto={foto}
          onCambiar={setFoto}
        />
        <Boton
          etiqueta={t('onboarding.continuar')}
          bloque
          onPress={() =>
            router.push({
              pathname: '/onboarding/cierre',
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
