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
import { Atmosfera, AvisoProvider, ThemeProvider as EpetThemeProvider, epetplaceFonts, useTheme } from '@epetplace/ui';
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
console.log('[bundle] prestador S79-B');

// S79-B (voto de mesa, APP-WIDE): todo crash de render sin frontera más
// cercana termina en una superficie que habla — jamás en blanco. La
// variante RAÍZ es autosuficiente (providers propios): ver pantalla-caida.
export { PantallaCaidaRaiz as ErrorBoundary } from '@/components/pantalla-caida';
console.log(
  `[update] id=${Updates.updateId ?? 'ninguno (embedded/dev)'} · ` +
    `embedded=${Updates.isEmbeddedLaunch} · canal=${Updates.channel ?? 'ninguno'}`,
);

/**
 * S83-C28 ① — LA ATMOSFERA DEL OFICIO, con su gate de tema.
 *
 * ⚠️ EL GATE ES DE ACÁ Y NO DE LA PIEZA, y el porqué está medido: la
 * pieza degrada SOLA en memorial (`return null`) pero **NO se apaga en
 * claro** — y el founder la firmó EN OSCURO. Las tres montas de la
 * galería viven dentro de `<ThemeProvider defaultMode="dark">`: lo que
 * firmó fue la luz sobre negro, no sobre papel. Montarla sin gate sería
 * publicar un estado que nunca vio.
 * Vive en el LAYOUT (mi territorio) y no en `packages/ui`: si la mesa
 * decide que el apagado en claro es de la FUENTE —como el de memorial—
 * es una línea de B y esta se retira sola.
 *
 * EL COLOR ES `accent.primary`, y la elección la corrigió el lint: el
 * JSDoc de la pieza sugiere `accent.cta`, pero **R5 lo prohíbe en apps**
 * (ese slot lo resuelve `Boton`, nadie más) — y al medir los dos, R5
 * además tenía razón de FONDO: en oscuro `cta` da #0A7268, que es el
 * color del MURO, mientras `primary` da #28E8DA, que es el `palette.teal`
 * con el que la galería montó lo que el founder firmó. El token legal y
 * el token correcto resultaron el mismo. En claro los dos coinciden.
 */
function AtmosferaDelOficio() {
  const { theme, mode } = useTheme();
  if (mode !== 'dark') return null;
  return <Atmosfera color={theme.accent.primary} origen="arriba-derecha" />;
}

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
        {/* S83-C28 ② — EL AGUA, ENCENDIDA. La prop existía desde S82-B r10
            con default false y NADIE la prendía del lado prestador: la
            pieza estaba construida y su superficie no existía. Acá el agua
            queda detrás de TODO el árbol en UN solo lugar — cero pantalla
            tocada, cero copia que se desincronice (el modo de falla que
            ese mismo commit declara: 0.06 vs 0.04).
            ⚠️ NOTA A B — PROSA VENCIDA, no la toco por territorio: el
            JSDoc de `marcaDeAgua` sigue diciendo "el prestador no la
            recibe (su fondo se queda en papel algodón)". Eso era S82; el
            founder firmó el agua en la casa verde en S83 (B9). La línea
            manda lo contrario de lo que hoy rige. */}
        <EpetThemeProvider mode={colorScheme === 'dark' ? 'dark' : 'light'} cta="oficio" marcaDeAgua>
          <AvisoProvider>
            {/* S83-C28 ① — LA ATMOSFERA, en el LAYOUT y no por pantalla:
                es la misma casa que el AmbientGlow del portal viejo
                (Layout.tsx:148, `top-right`), y una atmósfera montada
                pantalla por pantalla sería N copias de una dosis que la
                Ley 5/7 define POR VISTA — una sola expresión la garantiza.
                Va DESPUÉS del agua (textura al fondo, luz encima) y ANTES
                del Stack (es fondo: pointerEvents none, aria-hidden). */}
            <AtmosferaDelOficio />
            {/* S59-B1 (safe area): el DEFAULT de los íconos de la barra de
                estado — 'auto' = oscuros sobre papel en claro, claros en
                dark. Las pantallas con techo de tinta fuerzan 'light' con
                foco (ver techo-oficio.tsx); nadie más lo toca. */}
            <StatusBar style="auto" />
            <AnimatedSplashOverlay />
            {/* S80-B12 cura 3 — LA CONTINUIDAD DEL NAVEGADOR (§9.6 a
                nivel pantalla): lo que entra viene de la derecha, lo que
                sale cede a la izquierda, volver invierte — el preset
                DIRECCIONAL del stack nativo lo garantiza en ambas
                plataformas (Android por default usa fade/plataforma).
                MEDIDO contra el stack INSTALADO (react-native-screens
                types): los presets son el techo — NO exponen duración ni
                curva (`animationDuration` no existe en los tipos
                instalados), así que los 340ms/bezier de la casa NO son
                configurables acá; la física la pone la plataforma. Si la
                mesa exige la curva exacta, es JS-stack (otro navegador,
                decisión aparte). Cero API experimental. */}
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="(tabs)" />
            </Stack>
          </AvisoProvider>
        </EpetThemeProvider>
      </ProveedorI18n>
    </GestureHandlerRootView>
  );
}
