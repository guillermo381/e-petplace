import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AvisoProvider, ThemeProvider as EpetThemeProvider, epetplaceFonts } from '@epetplace/ui';
import { ProveedorI18n } from '@epetplace/i18n';

// Bootstrap de la puerta única (initApi + persistencia de sesión) —
// efecto de módulo, patrón S44-B4 de prestador. Auth REAL, sin atajo dev.
import '@/lib/api';
// Riel i18n (S51-B1a): namespaces cliente + ui, keys tipadas exigibles.
import { recursos } from '@/i18n';

SplashScreen.preventAutoHideAsync();

// MARCADOR DE BUNDLE (L-138, práctica permanente): el gate en dispositivo
// EMPIEZA confirmando que Metro imprime la línea de la sesión vigente —
// sin ella, el teléfono corre un bundle fantasma y no se gatea.
// ACTUALIZAR el texto al arrancar cada sesión de trabajo.
console.log('[bundle] cliente S71');

export default function RootLayout() {
  // D-305 (S48): el tema lo decide el SISTEMA — el app lo resuelve acá
  // y lo pasa controlado al provider (packages/ui no importa Appearance).
  // useColorScheme re-renderiza al cambiar el tema con la app abierta.
  // El override memorial queda ENCIMA (subtree <ThemeProvider memorial>).
  const colorScheme = useColorScheme();

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
    <ProveedorI18n recursos={recursos}>
      <EpetThemeProvider mode={colorScheme === 'dark' ? 'dark' : 'light'}>
        <AvisoProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AvisoProvider>
      </EpetThemeProvider>
    </ProveedorI18n>
  );
}
