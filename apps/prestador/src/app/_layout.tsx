import { useColorScheme } from 'react-native';
// CURA S58 (causa raíz del crash del taller en NATIVO): SliderPrecio fue
// el PRIMER GestureDetector en el CUERPO de una pantalla — Hoja/VisorFoto
// traen su GestureHandlerRootView ADENTRO del Modal (por eso nunca dolió)
// y el raíz no tenía ninguno: gesture-handler TIRA en Android/iOS y la
// web no lo exige (el smoke fue verde — Ley 9 confirmada por el camino).
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// S85-C3: `DefaultTheme` y `ThemeProvider` salieron con el experimento del
// fondo transparente — eran sus dos únicos consumidores (Ley 37: lo que sale
// de la UI sale del código, imports incluidos). Su lápida está abajo.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useFonts } from 'expo-font';
import { Atmosfera, AvisoProvider, ThemeProvider as EpetThemeProvider, epetplaceFonts, useTheme } from '@epetplace/ui';
import { ProveedorI18n } from '@epetplace/i18n';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DiaEnVistaProvider } from '@/lib/dia-en-vista';
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
/* ☠️ S86-C · MURIÓ `console.log('[bundle] prestador S79-B')` (Ley 37,
   firmado). **Medido hoy en el emulador: con el OTA de S86 ya aplicado,
   el log seguía diciendo `S79-B`** — la línea no se toca desde esa
   sesión, SIETE atrás. Dejó de rotular y pasó a DESINFORMAR, que es
   peor que no estar: quien lo leyera creería estar corriendo un bundle
   de hace siete sesiones.
   Lo reemplaza el marcador de RUNTIME de acá abajo, que dice más, mejor
   y **se actualiza solo** — nadie tiene que acordarse de editarlo.
   ⚠️ Hallazgo que NO es mío y va a la mesa: `apps/cliente` tiene el
   mismo defecto con `[bundle] cliente S73` (TRECE sesiones) y esa app
   no tiene dueño declarado en S86. */

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
        {/* ⑦ S83-C33 — EL AGUA SE VA DE ACÁ, Y EL PORQUÉ ESTÁ MEDIDO.
            En C28 la encendí en el provider: es el diseño de la pieza
            (UN mount, cero copia que se desincronice). NO SE VEÍA, y B
            midió la primera causa —73 superficies del prestador pintan su
            propio `bg.base` y la tapan—. Al medir la cura aparecieron DOS
            hechos que descartan las dos salidas obvias:

            ① QUITAR ESOS 73 FONDOS NO DESCUBRE EL AGUA: DESCUBRE GRIS. El
               navegador pinta `colors.background` en DOS capas propias
               —`contentStyle` por escena y `nativeContainerStyle` del
               ScreenStack (NativeStackView.native.js:221 y :252)— y el
               tema por default de expo-router lo tiene en
               `rgb(242, 242, 242)`. Esas capas viven ENTRE el provider y
               las pantallas: el agua queda debajo igual.
            ② HACERLAS TRANSPARENTES SE PUEDE (expo-router exporta su
               `ThemeProvider`) PERO ROMPE LA TRANSICIÓN FIRMADA: con las
               escenas transparentes, el `slide_from_right` de S80-B12
               deja ver la pantalla de abajo a través de la que entra.
               Cambiar craft firmado para descubrir una textura es mal
               negocio.
            Y subir el agua de plano —la otra opción de la mesa— la pone
            SOBRE el contenido: contradice el contrato de la propia pieza
            ("es FONDO, no contenido") y tiñe texto y Hojas.

            ⇒ RIGE LA ANATOMÍA QUE EL FOUNDER YA FIRMÓ: el agua DENTRO de
            la pantalla, encima de su fondo y debajo del contenido —
            exactamente como corre en el Hogar del cliente, que es lo que
            él miró cuando dijo "allí quedó bien". Son 61 montas en 54
            archivos; el precio es real y se declara: la pieza vuelve a
            tener N consumidores, que es lo que su JSDoc quería evitar.
            ☠️ MUERTE DE ESTA NOTA: el día que las pantallas dejen de
            pintar su propio fondo Y el navegador deje de pintar el suyo
            sin costo de transición, la prop vuelve acá y las 61 montas
            mueren de una. */}
        {/* ⑦ EL AGUA VUELVE AL PROVIDER **SOLO PARA EL EXPERIMENTO**: es
            la mitad que hay que medir — si desde UNA monta se ve, las 65
            inline sobran. Mientras dura la prueba conviven: sobre las
            pantallas que conservan su fondo esta agua queda tapada (no se
            duplica con la de ellas, porque nunca se ven las dos), y la
            única que la deja pasar es la que viaja sin fondo. */}
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
            {/* ☠️ S85-C3 — AQUÍ VIVÍA EL EXPERIMENTO DEL FONDO
                TRANSPARENTE (S83-C38). **REVERTIDO, con lápida** (orden de
                la mesa; Ley 37).

                QUÉ ERA: `TemaNavegador` pisaba `colors.background` a
                `'transparent'` para medir si, con las escenas del
                navegador sin fondo propio, el agua y el glow del provider
                se veían **desde una sola monta** — la pregunta que decidía
                si se barrían **71 pantallas** y morían **65 montas** del
                agua.

                POR QUÉ SE REVIERTE Y NO SE MUDA: el experimento tenía
                **UNA sola pantalla de prueba, `cuenta/identidad`**, que
                era la única que viajaba sin fondo propio. Esa pantalla
                **murió** en S85-C2 (su contenido vive en
                `cuenta/seguridad`, con su fondo). ⇒ **quedaba un pisado de
                tema global sin nada que midiera nada**: cero pantallas
                transparentes, cero veredicto posible, y un `transparent`
                vivo en el tema del navegador de toda la app. *Un
                experimento que no puede producir su veredicto no es una
                medición pendiente: es código muerto con nombre de
                medición* — y ésa es exactamente la clase que la Ley 37
                manda retirar.

                ⚠️ **LA MEDICIÓN NO SE TIRA, y por eso esto es lápida y no
                borrado mudo.** Lo aprendido queda escrito y es lo único
                que hacía falta guardar:
                 · el navegador pinta `colors.background` en **DOS** capas
                   propias (`contentStyle` por escena y
                   `nativeContainerStyle` del ScreenStack), con default
                   `rgb(242,242,242)`;
                 · esas capas viven **ENTRE** el provider —donde están el
                   agua y la Atmosfera— y las pantallas, así que mientras
                   pinten, **quitarle el fondo a una pantalla descubre
                   GRIS, no agua**;
                 · el riesgo que el experimento existía para medir sigue
                   **SIN MEDIR**: la fuente instalada aplica el fondo opaco
                   salvo en `transparentModal`, o sea que para el navegador
                   la opacidad por escena **es la definición de `card`** —
                   y si eso hace que el `slide_from_right` firmado en
                   S80-B12 deje ver la pantalla de abajo mientras entra,
                   la cura de las 71 pantallas **no va**.

                ☠️ **CUÁNDO SE RE-CORRE:** cuando **una pantalla lo pida**
                — es decir, cuando exista una que necesite viajar sin fondo
                propio y sirva de sujeto. Ahí se vuelve a poner el
                `transparent`, se mira el slide, y **recién entonces** se
                decide el barrido. **No se re-corre por calendario ni
                "cuando alguien tenga tiempo"**: sin sujeto, volvería a ser
                esto mismo. */}
            {/* ⭐ S99-D · L4 — EL DÍA EN VISTA ENVUELVE A LAS DOS VENTANAS
                HERMANAS, y por eso vive acá y no en ninguna de las dos: si
                colgara de una, la otra leería una copia. Es lo que vuelve
                literal la firma «UN día en DOS ventanas» — y lo que permite
                que la puerta de vuelta sea un `router.back()` de verdad, o
                sea que la transición de regreso **se derive del gesto** en
                lugar de configurarse (dictado del founder, 16-ago).
                Ver `@/lib/dia-en-vista`. */}
            <DiaEnVistaProvider>
              <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                <Stack.Screen name="(tabs)" />
              </Stack>
            </DiaEnVistaProvider>
          </AvisoProvider>
        </EpetThemeProvider>
      </ProveedorI18n>
    </GestureHandlerRootView>
  );
}
