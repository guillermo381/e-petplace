import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AvisoProvider, ThemeProvider as EpetThemeProvider, epetplaceFonts } from '@epetplace/ui';

// Bootstrap de la puerta única (initApi + persistencia de sesión) —
// efecto de módulo, patrón S44-B4 de prestador. Auth REAL, sin atajo dev.
import '@/lib/api';

SplashScreen.preventAutoHideAsync();

// MARCADOR DE BUNDLE (L-138, práctica permanente): el gate en dispositivo
// EMPIEZA confirmando que Metro imprime la línea de la sesión vigente —
// sin ella, el teléfono corre un bundle fantasma y no se gatea.
// ACTUALIZAR el texto al arrancar cada sesión de trabajo.
console.log('[bundle] cliente S47');

export default function RootLayout() {
  // Infraestructura S43-B2: DM Sans + JetBrains Mono cargadas antes de
  // renderizar (los nombres coinciden con typography.family de @epetplace/ui)
  const [fontsLoaded, fontsError] = useFonts(epetplaceFonts);

  // BUG S45: preventAutoHideAsync sin hideAsync = splash infinito en
  // nativo (el template lo escondía en AnimatedSplashOverlay, que este
  // layout ya no usa). Se esconde apenas hay algo para dibujar — y
  // también si las fuentes FALLAN: una app con fuente de sistema es
  // mejor que un splash eterno (regla 36).
  useEffect(() => {
    if (fontsLoaded || fontsError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) return null;

  return (
    <EpetThemeProvider>
      <AvisoProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AvisoProvider>
    </EpetThemeProvider>
  );
}
