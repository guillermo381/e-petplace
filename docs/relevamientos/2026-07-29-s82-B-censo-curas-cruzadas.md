# S82-B r3 · CENSO DE CURAS CRUZADAS — plataforma aplicada en UNA sola app

**Sesión B · 29-jul-2026 · CERO CURA — el censo primero (orden founder).**
Archivo declarado (76h): solo este documento. Método: lectura literal de
las dos raíces (`_layout.tsx`), los dos `app.json`/`app.config.ts`, los
dos `package.json` (diff de deps), `eas.json` ×2, `lib/api.ts` ×2, los
guards de `scripts/`, y `modules/` del prestador. Cero patches de
librería en el monorepo (sin `patches/`, sin `patchedDependencies`,
medido). `apps/prestador/android/` está GITIGNORADO (artefacto local de
prebuild — no es superficie de repo; lo nativo viaja por config plugins
y por la sonda).

## LA TABLA — curas de plataforma con UN solo lado

| # | Cura (origen) | Cliente | Prestador | El síntoma que la taparía |
|---|---|---|---|---|
| 1 | **ErrorBoundary de RAÍZ** — `PantallaCaidaRaiz` exportado del `_layout` (S79-B, voto de mesa **"APP-WIDE"**: todo crash termina en superficie que habla) | **✗ CERO** (`grep ErrorBoundary\|PantallaCaida` = 0 en todo `apps/cliente/src`) | ✓ (`_layout.tsx:46`) | El crash del cliente pinta **BLANCO**: el usuario reabre la app y lo lee como "se colgó" — jamás llega como reporte de frontera faltante. El camino feliz de los gates no crashea, así que nada la delata. **El voto de mesa decía app-wide y quedó de un lado** — la anatomía vive LOCAL en prestador (promoción declarada S79, patrón L-175: se coordina, no se copia). |
| 2 | **El brazo `fontsError` del splash** (BUG S45: `preventAutoHideAsync` sin `hideAsync` = splash infinito; la cura del cliente esconde el splash TAMBIÉN si las fuentes fallan — "una app con fuente de sistema es mejor que un splash eterno", regla 36) | ✓ (`_layout.tsx`: `fontsLoaded \|\| fontsError`) | **✗** — `const [fontsLoaded] = useFonts(...)` SIN brazo de error; si las fuentes fallan, `return null` para siempre y el `AnimatedSplashOverlay` (que es quien llama `hideAsync`) **nunca monta** → splash eterno | Las fuentes son assets locales del bundle: prácticamente nunca fallan. **El modo de fallo es el silencio total** (la app no abre; se culpa al teléfono) — exactamente la clase L-192. Nota: prestador además conserva el overlay del TEMPLATE que el cliente ya mató en S45 — dos mecanismos distintos para el mismo trabajo. |
| 3 | **StatusBar con default de RAÍZ** (S59-B1: `<StatusBar style="auto">` en el raíz; las pantallas con techo fuerzan y RESTAURAN a 'auto') | **✗ sin default de raíz** — y el único wiring (Hogar `index.tsx:704`) usa la API **imperativa de react-native** con restauración re-derivada a mano del `theme.mode`, mecanismo DISTINTO al del prestador (`expo-status-bar` + `setStatusBarStyle('auto')`) | ✓ (raíz `style="auto"` + `techo-oficio.tsx:59-60`) | En CLARO el default del sistema coincide y no se nota. El hueco aparece en **DARK antes de pasar por el Hogar** (íconos oscuros sobre fondo oscuro = barra invisible) — y el dark del cliente casi no se gatea. La restauración manual del Hogar puede divergir del resto de la app sin que ningún smoke lo vea (la web no tiene barra de estado). |
| 4 | **Continuidad direccional del stack** (S80-B12 cura 3: `animation: 'slide_from_right'` — §9.6 a nivel PLATAFORMA: el navegador, no una pantalla) | **✗** (`<Stack screenOptions={{ headerShown: false }}>` pelado) | ✓ (`_layout.tsx`, con el registro medido contra react-native-screens) | Android por default hace fade: **no "rompe", solo empobrece** — se nota únicamente en comparación lado a lado, y el founder gatea cada app por separado. El rediseño C7 del cliente podría absorberla, pero la cura es del NAVEGADOR: si se espera al rediseño, cada pantalla nueva del cliente nace sin dirección. |
| 5 | **Plugin `expo-video` en el manifest** (prestador lo declara en `plugins`; el cliente tiene la DEP `~57.0.1` pero NO el plugin — y el cliente SÍ reproduce clips: `ClipSesion` en el parte del dueño, S63) | **✗ plugin ausente** (dep ✓) | ✓ (plugins) | La reproducción inline funciona sin plugin — lo que el plugin configura (flags nativos de background/PiP) **no se ejercita en ningún gate**. Si algún día un clip del parte necesita eso, es BUILD no OTA (L-134), y el fallo va a aparecer como "el video se corta al salir" sin que nadie mire el manifest. |
| 6 | **La sonda del manifest** (D-579, `modules/sonda-manifest` — preparada-apagada, patrón D-456; el guard estático `verify-manifest-apk.mjs` SÍ está parametrizado `--app cliente\|prestador` ✓) | **✗ sin módulo** | ✓ (módulo Kotlin inerte) | Hoy no duele: la sonda está APAGADA hasta el tren FCM. El día del tren se re-hornean **LOS DOS** APKs — el del prestador podrá auto-verificarse en runtime y el del cliente no; la diferencia solo se nota si el APK del cliente sale con el manifest roto, que es justo el caso que la sonda existe para atrapar. |
| 7 | **`expo-dev-client`** (dep) — y `verificarSesion` pre-flight de pantallas hondas (menores, misma fila para no inflar) | **✗ ambas** (la dev build del cliente existió en S45 — la dep no está HOY, medido) | ✓ | Dev-client: el cliente no puede producir dev builds hasta re-agregarla — invisible mientras preview+Expo Go cubran el flujo; se nota el día que alguien necesite mapas/nativo en dev del cliente. Pre-flight: los flujos del cliente viven detrás del routing por estado real — un deep link hondo sin sesión cae al error del wrapper en vez de a una voz de pre-flight. |

## LO SIMÉTRICO, verificado (para que nadie lo re-censa)

- **GestureHandlerRootView de raíz: LAS DOS ✓** — el cliente la ganó en
  S82-A r3 como espejo declarado de la cura S58 del prestador, **con
  guard que vigila AMBOS layouts** (`verify-gestos-cliente.mjs:28`
  incluye el path del prestador). **Es el modelo de cómo se cierra una
  cura cruzada: espejo + guard bilateral.**
- `app.config.ts` (key de Maps por env + `googleServicesFile`
  condicional): calcados ✓ · `google-services.json` ×2 commiteados y
  verificados (S81-A27) ✓ · `eas.json`: byte-idénticos ✓ ·
  `predictiveBackGestureEnabled: false`: ambas ✓ · marcador `[update]`
  de RUNTIME (L-160): ambas ✓ · `lib/api.ts` bootstrap auth real +
  AsyncStorage-solo-nativo + auto-refresh por AppState: espejados ✓
  (el pre-flight extra del prestador va en la fila 7) · cero polyfills
  en las dos (medido) · `EvitaTeclado`/`leer-archivo`/frontera de
  wrappers: viven en packages compartidos — fuera de esta clase.
- **Per-oficio LEGÍTIMAS (no son curas cruzadas):** expo-location +
  task-manager (GPS background D-292), expo-speech-recognition (el
  dictado), expo-camera con audio (clips) — del prestador por diseño.
- Los marcadores de SESIÓN estáticos están viejos en ambas (`cliente
  S73` · `prestador S79-B`) — parejo, y el runtime id lo suple (L-160);
  se anota, no es cura cruzada.

## La lectura (sin curar — el orden si la mesa dispara)

**La fila 1 es la grave**: es la única con voto de mesa "app-wide" ya
firmado y sin espejo — y su máscara es un crash en blanco. La 2 es la
más barata (un brazo de error, espejo literal de la cura S45). La 3
exige decisión chica (unificar mecanismo al de expo-status-bar, no solo
copiar el default). La 4 es una línea pero es CRAFT visible → regla 80
(pantalla real + gate). La 5/6/7 esperan su disparo natural (el tren
FCM · la próxima dev build del cliente) — se declaran para que el
disparo las encuentre censadas y no por síntoma.
