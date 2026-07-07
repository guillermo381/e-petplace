// Stub P2 (S44-B4.1): verifica la navegación Agenda → cita. La pantalla
// real de la cita llega en B4.2.

import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Encabezado, spacing, typography, useTheme } from '@epetplace/ui';

export default function CitaStub() {
  const { theme } = useTheme();
  const router = useRouter();
  const { citaId } = useLocalSearchParams<{ citaId: string }>();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <View style={{ padding: spacing[4], gap: spacing[4] }}>
        <Encabezado variante="navegacion" titulo="Cita" atras onAtras={() => router.back()} />
        <Text
          style={{
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size.sm,
            letterSpacing: typography.tracking.mono,
            color: theme.text.secondary,
          }}
        >
          stub b4.2 · {citaId}
        </Text>
      </View>
    </SafeAreaView>
  );
}
