import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AvisoProvider, ThemeProvider as EpetThemeProvider, epetplaceFonts } from '@epetplace/ui';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
// Bootstrap de la puerta única (initApi) — efecto de módulo, S44-B4.
import '@/lib/api';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // D-305 (S48): el tema lo decide el SISTEMA — el app lo resuelve acá
  // y lo pasa controlado al provider (packages/ui no importa Appearance).
  // useColorScheme re-renderiza al cambiar el tema con la app abierta.
  const colorScheme = useColorScheme();

  // Infraestructura S43-B2: DM Sans + JetBrains Mono cargadas antes de
  // renderizar (los nombres coinciden con typography.family de @epetplace/ui)
  const [fontsLoaded] = useFonts(epetplaceFonts);
  if (!fontsLoaded) return null;

  return (
    <EpetThemeProvider mode={colorScheme === 'dark' ? 'dark' : 'light'}>
      <AvisoProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AvisoProvider>
    </EpetThemeProvider>
  );
}
