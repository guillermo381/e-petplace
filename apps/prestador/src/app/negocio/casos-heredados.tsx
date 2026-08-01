/**
 * S79-B (T2-B5): CASOS HEREDADOS (handshakes recibidos) — la sección deja de
 * ser MUDA (§2.6: la navegación muestra el módulo; al entrar, dice por qué
 * está silenciado y qué lo despierta). Patrón replicado de /liquidaciones
 * peldaño 0 (la vara interna que CUMPLE, audit s79b-audit-dia1 §2) — cero
 * patrón nuevo. Cuando el primer handshake real exista, esta pantalla gana
 * su contenido (y su momento narrativo §2.6 es de esa sesión, no de esta).
 */

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Encabezado, EstadoVacio, MarcaDeAgua, spacing, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export default function CasosHeredados() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('despierta.casosNav')} atras onAtras={() => router.back()} />
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio titulo={t('despierta.casosTitulo')} descripcion={t('despierta.casosCuerpo')} />
      </View>
    </View>
  );
}
