// Stub B4.3: el Durante del paseo. Verifica el redirect por estado (7.5).

import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Encabezado, spacing, typography, useTheme } from '@epetplace/ui';

export default function CierreStub() {
  const { theme } = useTheme();
  const router = useRouter();
  const { citaId } = useLocalSearchParams<{ citaId: string }>();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <View style={{ padding: spacing[4], gap: spacing[4] }}>
        <Encabezado variante="navegacion" titulo="Cierre del paseo" atras onAtras={() => router.back()} />
        <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
          stub cierre b4.4 · {citaId}
        </Text>
      </View>
    </SafeAreaView>
  );
}
