import { useColorScheme } from 'react-native';
// CURA S58 (causa raíz del crash del taller en NATIVO): SliderPrecio fue
// el PRIMER GestureDetector en el CUERPO de una pantalla — Hoja/VisorFoto
// traen su GestureHandlerRootView ADENTRO del Modal (por eso nunca dolió)
// y el raíz no tenía ninguno: gesture-handler TIRA en Android/iOS y la
// web no lo exige (el smoke fue verde — Ley 9 confirmada por el camino).
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AvisoProvider, ThemeProvider as EpetThemeProvider, epetplaceFonts } from '@epetplace/ui';
import { ProveedorI18n } from '@epetplace/i18n';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
// Bootstrap de la puerta única (initApi) — efecto de módulo, S44-B4.
import '@/lib/api';
// Riel i18n (S51-B1a): namespaces prestador + ui, keys tipadas exigibles.
import { recursos } from '@/i18n';

SplashScreen.preventAutoHideAsync();

// MARCADOR DE BUNDLE (L-138, práctica permanente — llega al prestador en
// S51): el gate en dispositivo EMPIEZA confirmando que Metro imprime la
// línea de la sesión vigente. ACTUALIZAR al arrancar cada sesión.
console.log('[bundle] prestador S58');

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProveedorI18n recursos={recursos}>
        <EpetThemeProvider mode={colorScheme === 'dark' ? 'dark' : 'light'}>
          <AvisoProvider>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
            </Stack>
          </AvisoProvider>
        </EpetThemeProvider>
      </ProveedorI18n>
    </GestureHandlerRootView>
  );
}
