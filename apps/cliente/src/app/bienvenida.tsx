/**
 * Bienvenida (S45-B4, flujo firmado B1) — el ÚNICO lugar del gradiente
 * en el onboarding (dosis alta con cabeza): HeroMarca alto. Los CTAs
 * viven AFUERA del hero (marca sobre marca prohibido).
 */

import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, HeroMarca, spacing, typography, useTheme } from '@epetplace/ui';

export default function Bienvenida() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const esMemorial = theme.mode === 'memorial';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <View style={{ paddingTop: insets.top, backgroundColor: esMemorial ? theme.bg.card : undefined }}>
        <HeroMarca titulo="La vida de tu mascota, en un solo lugar." variante="alto">
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.base,
              lineHeight: Math.round(typography.size.base * typography.leading.normal),
              color: esMemorial ? theme.text.secondary : theme.text.onGradient,
              marginTop: spacing[2],
            }}
          >
            Cada paseo, cada visita al vet, cada momento — guardado y a mano.
          </Text>
        </HeroMarca>
      </View>

      <View style={{ flex: 1, justifyContent: 'flex-end', padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[2] }}>
        <Boton etiqueta="Crear cuenta" bloque onPress={() => router.push('/registro')} />
        <Boton variante="ghost" etiqueta="Ya tengo cuenta" bloque onPress={() => router.push('/login')} />
      </View>
    </View>
  );
}
