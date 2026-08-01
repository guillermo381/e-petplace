/**
 * S79-B (T2-B5): RESEÑAS Y REPUTACIÓN — la sección deja de ser MUDA (§2.6:
 * oculta hasta la primera reseña real; el lugar existe y dice qué lo
 * despierta). Patrón /liquidaciones peldaño 0.
 */

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Encabezado, EstadoVacio, MarcaDeAgua, spacing, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export default function Resenas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('despierta.resenasNav')} atras onAtras={() => router.back()} />
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio titulo={t('despierta.resenasTitulo')} descripcion={t('despierta.resenasCuerpo')} />
      </View>
    </View>
  );
}
