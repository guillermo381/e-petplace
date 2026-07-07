import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AvisoProvider, ThemeProvider as EpetThemeProvider, epetplaceFonts } from '@epetplace/ui';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
// Bootstrap de la puerta única (initApi) — efecto de módulo, S44-B4.
import '@/lib/api';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Infraestructura S43-B2: DM Sans + JetBrains Mono cargadas antes de
  // renderizar (los nombres coinciden con typography.family de @epetplace/ui)
  const [fontsLoaded] = useFonts(epetplaceFonts);
  if (!fontsLoaded) return null;

  return (
    <EpetThemeProvider>
      <AvisoProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AvisoProvider>
    </EpetThemeProvider>
  );
}
