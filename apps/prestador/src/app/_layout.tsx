import { useColorScheme } from 'react-native';
// CURA S58 (causa raíz del crash del taller en NATIVO): SliderPrecio fue
// el PRIMER GestureDetector en el CUERPO de una pantalla — Hoja/VisorFoto
// traen su GestureHandlerRootView ADENTRO del Modal (por eso nunca dolió)
// y el raíz no tenía ninguno: gesture-handler TIRA en Android/iOS y la
// web no lo exige (el smoke fue verde — Ley 9 confirmada por el camino).
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useFonts } from 'expo-font';
import { AvisoProvider, ThemeProvider as EpetThemeProvider, epetplaceFonts } from '@epetplace/ui';
import { ProveedorI18n } from '@epetplace/i18n';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
// Bootstrap de la puerta única (initApi) — efecto de módulo, S44-B4.
import '@/lib/api';
// D-292 (S63-B): la tarea de track background tiene que estar DEFINIDA
// en global scope en todo arranque del proceso — incluido el
// relanzamiento headless del servicio de ubicación.
import '@/lib/track-gps-fondo';
// Riel i18n (S51-B1a): namespaces prestador + ui, keys tipadas exigibles.
import { recursos } from '@/i18n';

SplashScreen.preventAutoHideAsync();

// MARCADOR DE BUNDLE (L-138, práctica permanente — llega al prestador en
// S51): el gate en dispositivo EMPIEZA confirmando que Metro imprime la
// línea de la sesión vigente. ACTUALIZAR al arrancar cada sesión.
//
// S72-B: el marcador de sesión NO discriminaba entre publicaciones (los 4
// bundles de S72 compartían "prestador S72"). La identidad del update la
// da el runtime — `Updates.updateId` es ÚNICO por publicación y se
// auto-actualiza; no hay que editar nada al republicar. `isEmbeddedLaunch`
// distingue el OTA aplicado del bundle embebido del APK (el punto exacto
// de L-138: confirmar que NO corre el embedded viejo). Guardado: en dev/
// Expo Go / web `updateId` es null — el marcador lo dice honesto.
console.log('[bundle] prestador S72');
console.log(
  `[update] id=${Updates.updateId ?? 'ninguno (embedded/dev)'} · ` +
    `embedded=${Updates.isEmbeddedLaunch} · canal=${Updates.channel ?? 'ninguno'}`,
);

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
        {/* S63 arte — enmienda Ley 21 FIRMADA: el CTA del prestador ancla
            al oficio (accent.cta = tealDark en light Y dark; memorial
            SIEMPRE tinta, resuelto en getTheme — imposible de saltear). */}
        <EpetThemeProvider mode={colorScheme === 'dark' ? 'dark' : 'light'} cta="oficio">
          <AvisoProvider>
            {/* S59-B1 (safe area): el DEFAULT de los íconos de la barra de
                estado — 'auto' = oscuros sobre papel en claro, claros en
                dark. Las pantallas con techo de tinta fuerzan 'light' con
                foco (ver techo-oficio.tsx); nadie más lo toca. */}
            <StatusBar style="auto" />
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
