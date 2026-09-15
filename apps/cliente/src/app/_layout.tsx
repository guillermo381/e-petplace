import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
// CURA S82-A r3 (espejo EXACTO de la cura S58 del prestador, misma clase):
// EncuadreFoto es el PRIMER GestureDetector en el CUERPO de una pantalla
// del CLIENTE — Hoja/VisorFoto traen su GestureHandlerRootView ADENTRO
// del Modal (por eso nunca dolió) y este raíz no tenía ninguno: el gesto
// sale MUDO al dispositivo sin avisar (L-192; la web no lo exige — el
// smoke fue verde). Guard mecánico: scripts/verify-gestos-cliente.mjs.
// S106 · parchea los globales de WebRTC ANTES de que monte cualquier
// pantalla de video. Import por efecto: no exporta nada que se use acá.
import '@/lib/livekit';
/* ⏪ ACÁ VIVIÓ EL CENSO DE AsyncStorage (`D-1074`). Se retira por orden del
   founder con el eje corregido: *la app está viva y sólo falla lo que viene
   de la base; el heap y el almacenamiento son CONSECUENCIA de reintentar
   contra algo que nunca responde.* El archivo queda por si el eje vuelve.
   El pulso que nombró la causa (`@/lib/pulso-almacenamiento`) también se
   retiró, en el mismo acto que la cura: los dos archivos siguen en el árbol
   por si el eje vuelve, pero ninguno viaja en el bundle. */
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router, Stack } from 'expo-router';
import { destinoDePushDeEstaApp } from '@/lib/destino-de-push';
import { escuchaDeToque } from '@/lib/toque-de-push';
import { useTokenDeAvisosAlDia } from '@/lib/token-avisos';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useFonts } from 'expo-font';
import { Atmosfera, AvisoProvider, ThemeProvider as EpetThemeProvider, epetplaceFonts, motion } from '@epetplace/ui';
import { ProveedorI18n } from '@epetplace/i18n';

// 🔴 `D-1098` — el polyfill VA ANTES que la puerta única, y el orden es la
// mitad de la cura: `initApi` crea el cliente de auth, y ese cliente usa
// `crypto.getRandomValues` para el verificador PKCE. Va como IMPORT por efecto
// —y arriba de éste— porque los imports se izan: una llamada escrita entre
// medio correría DESPUÉS, y no curaría nada.
import '@/lib/crypto-getrandomvalues';
// Bootstrap de la puerta única (initApi + persistencia de sesión) —
// efecto de módulo, patrón S44-B4 de prestador. Auth REAL, sin atajo dev.
import '@/lib/api';
// Riel i18n (S51-B1a): namespaces cliente + ui, keys tipadas exigibles.
import { recursos } from '@/i18n';
// S104-C · el candado biométrico sobre la sesión (§2.5): envuelve el Stack
// y baja la cortina al volver del segundo plano si está activo y hay sesión.
import { GateBiometrico } from '@/components/gate-biometrico';

SplashScreen.preventAutoHideAsync();

// S82-A r4 — LA FRONTERA DEL CRASH (espejo S79-B del prestador; voto de
// mesa "app-wide" que el cliente incumplía): sin esto, un crash de
// render pinta BLANCO mudo. Guard bilateral: verify-frontera-caida.mjs.
export { PantallaCaidaRaiz as ErrorBoundary } from '@/components/pantalla-caida';

// MARCADOR DE BUNDLE (L-138, práctica permanente): el gate en dispositivo
// EMPIEZA confirmando que Metro imprime la línea de la sesión vigente —
// sin ella, el teléfono corre un bundle fantasma y no se gatea.
// ACTUALIZAR el texto al arrancar cada sesión de trabajo.
//
// S72-A (patrón de B, `168b6aa` — L-155): el marcador de SESIÓN no
// discrimina entre publicaciones (esta cadena decía "S71" tras una sesión
// entera de curas). La identidad del update la da el RUNTIME — `updateId`
// es ÚNICO por publicación y se auto-actualiza (no hay que editar nada al
// republicar); `isEmbeddedLaunch` distingue el OTA aplicado del bundle
// embebido del APK (el punto exacto de L-138). En dev/Expo Go/web
// `updateId` es null — el marcador lo dice honesto, no miente.
// ☠️ S86 — EL MARCADOR ESTÁTICO `[bundle] cliente S<n>` MURIÓ (Ley 37).
// Decía `S73` — TRECE sesiones sin tocarse— y por eso rotulaba como S73
// bundles de S86. Ya no informaba: DESINFORMABA. Su gemelo del prestador
// se midió en dispositivo el 4-ago: con el OTA de S86 aplicado seguía
// diciendo `S79-B`. La línea de abajo dice lo mismo mejor y SE ACTUALIZA
// SOLA — que es exactamente lo que a ésta le faltaba (L-160).
console.log(
  `[update] id=${Updates.updateId ?? 'ninguno (embedded/dev)'} · ` +
    `embedded=${Updates.isEmbeddedLaunch} · canal=${Updates.channel ?? 'ninguno'}`,
);

export default function RootLayout() {
  /* 🔴 **RESOLUCIÓN DEL MERGE (S116-C lote 3b): UNA SOLA LLAVE, Y ES LA DE
     ABAJO.** `D-1123` llegó escrita DOS VECES — A la puso acá arriba con un
     `FORZAR_CLARO` que alimentá al provider, y B la puso en el provider con
     `mode="light"` fijo. **Las dos son correctas por separado; juntas dejan un
     interruptor muerto**: el `FORZAR_CLARO` de A calcularía un valor que el
     provider ya no lee. *Un control que no controla nada es peor que ninguno:
     el próximo que lo vea va a moverlo y no va a pasar nada.*

     Gana la de B porque es la que el merge ya dejó viva en el provider, y
     porque su lápida dice **la línea exacta** que hay que restaurar. */
  // D-305 (S48): el tema lo decide el SISTEMA — el app lo resuelve acá
  // y lo pasa controlado al provider (packages/ui no importa Appearance).
  // useColorScheme re-renderiza al cambiar el tema con la app abierta.
  // El override memorial queda ENCIMA (subtree <ThemeProvider memorial>).
  /* ⚠️ **QUEDA DECLARADO A PROPÓSITO aunque hoy nadie lo lea** (ver la lápida
     del provider, más abajo): es **la mitad que hay que volver a enchufar**
     cuando el oscuro se calibre. *Borrarlo convertiría el regreso de una línea
     en dos, y la segunda es la que alguien va a olvidar.* */
  const colorScheme = useColorScheme();
  void colorScheme;

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


  /* ⭐ `D-1056` · EL TOKEN DEL APARATO, AL DÍA. Va acá arriba y **no dentro de
     una pantalla**: el token no es de una pantalla, es del aparato — y su
     dueño natural es el único lugar que vive lo que dura la app.
     🔴 Su motor ya existía y **su propio JSDoc decía que se llama «en cada
     arranque»**; medido, sus únicos llamadores eran los dos caminos de
     conceder. *Un comentario que describe el cableado que falta se lee como
     cableado* — y el modo de falla no tiene síntoma: el token rota, el motor
     despacha «bien» a una dirección muerta, y el aparato se vuelve fantasma. */
  useTokenDeAvisosAlDia();

  /* ⏳ SONDA TEMPORAL `D-1074` — corre una vez, no bloquea, y se retira. */

  /**
   * ① · EL TOQUE DE LA PUSH — a dónde lleva (S111-C).
   *
   * 🔴 **Los tres estados, y el tercero no lo cubre un listener:** abierta y en
   * fondo las atiende `alTocar`; **con la app CERRADA el toque ocurrió antes de
   * que existiera el proceso**, así que además se pregunta por el toque que la
   * ARRANCÓ (`destinoInicial`). *Un listener solo anda en dos de los tres casos
   * y se ve como si anduviera — el que falta es justo el de la push que
   * despierta al teléfono.*
   *
   * ⚠️ **Se navega DESPUÉS de que hay a dónde.** Este efecto corre en el layout
   * raíz con el `Stack` ya montado. *Navegar antes de que el router exista se
   * pierde en silencio, y es la clase de defecto que sólo aparece en aparato*
   * (la advertencia es de A).
   *
   * **Sin nativo (Expo Go, web) `escuchaDeToque()` es `null` y esto no corre.**
   */
  useEffect(() => {
    const escucha = escuchaDeToque();
    if (escucha === null) return;
    let vivo = true;
    /* 🔴 **SÓLO RUTAS DE ESTA APP.** ⏪ Acá se hacía `router.push(ruta as never)`
       sin filtro alguno: una ruta del portal del prestador —que las dos apps
       pueden recibir el mismo día, porque el aviso del acta va a los dos lados
       con su ruta propia— habría abierto **una pantalla en blanco**, que es el
       modo de falla peor: no tira error, no deja rastro y se ve como si la app
       se hubiera colgado. El porqué del filtro y por qué no alcanza con mirar
       el primer segmento están en `lib/destino-de-push`. */
    const irSiEsMia = (ruta: string) => {
      if (!vivo) return;
      const mia = destinoDePushDeEstaApp(ruta);
      if (mia === null) {
        console.warn(`[toque-de-push] ruta que esta app no atiende, no se navega · ${ruta}`);
        return;
      }
      router.push(mia as never);
    };
    void (async () => {
      const inicial = await escucha.destinoInicial();
      /* El guard de vida importa acá y no sólo en el listener: entre pedir el
         destino inicial y recibirlo, el layout puede haberse desmontado. */
      if (inicial !== null) irSiEsMia(inicial);
    })();
    const retirar = escucha.alTocar(irSiEsMia);
    return () => {
      vivo = false;
      retirar();
    };
  }, []);

  if (!fontsLoaded && !fontsError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProveedorI18n recursos={recursos}>
        {/* ═══════════════════════════════════════════════════════════════
            ☠️ **EL CLIENTE VA EN CLARO SIEMPRE — LÁPIDA CON FECHA.**
            **Firma del founder, 14-sep-2026 · REVISAR DESPUÉS DE F&F.**

            ⏪ La línea era:
                `mode={colorScheme === 'dark' ? 'dark' : 'light'}`
            y leía el tema del sistema desde S48 (`D-305`).

            **Por qué se apaga, con su medición:** el recorrido 5 del founder
            fue con el teléfono en oscuro y el censo del lote 15 encontró que
            **el oscuro del cliente nunca se calibró** — el titular de la
            bienvenida y el de la cabecera salían ilegibles, y el acento
            resuelve a `magentaLuz` (rosa pálido) en superficies pensadas para
            magenta. *No es una lista de bugs: es que nadie recorrió esas
            pantallas en oscuro.*

            🔴 **EL TEMA OSCURO SIGUE EXISTIENDO Y SIGUE SIENDO ISOMORFO.** Lo
            que se apaga es **quién lo elige**, no el tema: los tres temas
            siguen portando los mismos slots, la galería lo sigue montando con
            su selector, y `verify:contrast` sigue midiendo los tres. *Apagar
            un tema borrándolo sería perder el trabajo; apagar su elección es
            una línea.*

            ⇒ **PARA VOLVER ATRÁS ALCANZA CON RESTAURAR LA LÍNEA DE ARRIBA.**
            Eso es todo lo que hay que deshacer, y por eso vive acá —donde el
            tema se resuelve— y no repartido por las pantallas: *un forzado
            hecho pantalla por pantalla no se puede quitar, se tiene que
            cazar.*
            ═══════════════════════════════════════════════════════════════ */}
        <EpetThemeProvider mode="light">
          {/* S83-B34 — LA ATMOSFERA DEL CLIENTE (firma founder: el glow es
              de las DOS casas). Va en el RAÍZ, misma casa que en el
              prestador y el mismo lugar que el AmbientGlow del portal
              viejo (Layout.tsx:148) — es fondo compartido, no override
              por pantalla.
              SIN PROP `color`: lo toma de `accent.atmosfera` (el octavo
              slot, S83-B34), que resuelve MAGENTA acá y el verde del
              oficio del otro lado. Pasarle `accent.primary` —como se
              montó en el prestador antes de que el slot existiera— daría
              TEAL en el cliente: ese token es el mismo en las dos casas.
              DARK-ONLY y memorial apagado: los dos viven EN LA PIEZA
              (S83-B29/B16), no acá. */}
          <Atmosfera origen="arriba-derecha" />
          <AvisoProvider>
            <GateBiometrico>
              {/* ⭐ **LA NAVEGACIÓN SE DECLARA UNA VEZ, ACÁ — S116-C lote 3,
                  firma de la mesa.** *«La navegación se declara UNA vez, en el
                  router, no por pantalla»*.

                  **Por qué acá y no en cada pantalla:** una transición es una
                  propiedad del SISTEMA, no de un destino. Si cada pantalla la
                  trae, la que nadie toque va a moverse distinto y **nadie lo
                  va a notar mirando esa pantalla sola** — sólo se nota al
                  recorrer, que es exactamente cuando ya es tarde. Escrita una
                  vez, las 106 rutas se mueven igual por construcción.

                  **Las cuatro reglas, con su token:**
                   · **empuje desde la derecha** (`slide_from_right`) —
                     el gesto estándar de un stack.
                   · **modal desde abajo**: lo resuelve `presentation: 'modal'`
                     en la ruta que lo pida; el default de arriba no lo pisa.
                   · **cambio de tab sin transición**: no se declara acá — lo
                     resuelve el `Tabs` del shell, donde *lo único que se mueve
                     es el círculo del activo*.
                   · **gesto de volver siempre disponible** (`gestureEnabled`),
                     y en Android **también** — RN lo trae apagado ahí por
                     default, así que «siempre» hay que decirlo.
                   · **tiempo por token**: `motion.duration.estandar` (300), el
                     techo de Ley 6. *No hay un número tecleado acá.* */}
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  animationDuration: motion.duration.estandar,
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              >
                {/* 🔴 **LA ÚNICA EXCEPCIÓN AL DESLIZADO, declarada acá porque
                    la navegación se declara UNA vez.**

                    00 → 01 va en FUNDIDO. El deslizado horizontal **tapaba el
                    viaje de la nariz**: medido en el emulador fotograma a
                    fotograma —la marca del splash se iba por la izquierda
                    mientras 01 entraba por la derecha—, así que el gesto de
                    continuidad *no se podía leer aunque estuviera construido*.

                    Y el deslizado además **mentía**: dice «avanzaste un paso»,
                    y 00 no es un paso del que se vuelva — es la marca mientras
                    se resuelve la sesión.

                    ⚠️ **Va en `bienvenida` y no en `index`** porque lo que se
                    anima es la pantalla que ENTRA.

                    ⚠️ **Y se midió que declarar un hijo acá NO deja fuera al
                    resto de las rutas** — lo sospeché y lo probé quitándolo:
                    el síntoma que me hizo dudar era el teclado comiéndose los
                    toques, no el router. *Casi le echo la culpa a la cura.* */}
                <Stack.Screen name="bienvenida" options={{ animation: 'fade' }} />
              </Stack>
            </GateBiometrico>
          </AvisoProvider>
        </EpetThemeProvider>
      </ProveedorI18n>
    </GestureHandlerRootView>
  );
}
