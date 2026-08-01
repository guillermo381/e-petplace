/**
 * S79-B (T2-B5): ESTADÍSTICAS DEL NEGOCIO — la sección deja de ser MUDA
 * (§2.6). Patrón /liquidaciones peldaño 0. La letra manda el tono: jamás
 * "atendiste 0 mascotas" — el vacío educa qué va a contar y qué lo despierta,
 * y §2.7 fija el alma: sin compararse con nadie.
 */

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Encabezado, EstadoVacio, MarcaDeAgua, spacing, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export default function Estadisticas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('despierta.estadisticasNav')} atras onAtras={() => router.back()} />
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio titulo={t('despierta.estadisticasTitulo')} descripcion={t('despierta.estadisticasCuerpo')} />
      </View>
    </View>
  );
}
