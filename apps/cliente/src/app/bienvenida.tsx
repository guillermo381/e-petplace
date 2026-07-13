/**
 * Bienvenida (S45-B4, flujo firmado B1) — el ÚNICO lugar del gradiente
 * en el onboarding (dosis alta con cabeza): HeroMarca alto. Los CTAs
 * viven AFUERA del hero (marca sobre marca prohibido).
 */

import { useCallback } from 'react';
import { StatusBar, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, HeroMarca, spacing, typography, useTheme } from '@epetplace/ui';

// Riel i18n (S51-B1a; hero migrado al riel con el lote aprobado en el
// gate del cierre S51).
import { useTraduccion } from '@/i18n';

export default function Bienvenida() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const esMemorial = theme.mode === 'memorial';

  // S59 — el hero absorbe la safe area (HeroMarca): el gradiente pinta
  // bajo la barra de estado → íconos claros mientras la pantalla tiene
  // el foco (memorial: bg.card claro, no se toca).
  useFocusEffect(
    useCallback(() => {
      if (esMemorial) return;
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle(theme.mode === 'dark' ? 'light-content' : 'dark-content');
    }, [esMemorial, theme.mode]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <HeroMarca titulo={t('bienvenida.heroTitulo')} variante="alto">
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.base,
            lineHeight: Math.round(typography.size.base * typography.leading.normal),
            color: esMemorial ? theme.text.secondary : theme.text.onGradient,
            marginTop: spacing[2],
          }}
        >
          {t('bienvenida.heroSubtitulo')}
        </Text>
      </HeroMarca>

      <View style={{ flex: 1, justifyContent: 'flex-end', padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[2] }}>
        <Boton etiqueta={t('bienvenida.crearCuenta')} bloque onPress={() => router.push('/registro')} />
        <Boton variante="ghost" etiqueta={t('bienvenida.yaTengoCuenta')} bloque onPress={() => router.push('/login')} />
      </View>
    </View>
  );
}
