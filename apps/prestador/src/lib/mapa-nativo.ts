import Constants from 'expo-constants';

/**
 * S80-B19 — EL GUARD DEL MAPA NATIVO (🔴 crash confirmado por logcat:
 * `IllegalStateException: API key not found` en com.rnmaps.maps.MapView
 * .onCreate, hilo androidmapsapi-ula-1 — FUERA de React: ninguna
 * ErrorBoundary lo atrapa; si el MapView no se monta, el hilo nativo
 * no arranca).
 *
 * LA CAUSA (medida en el manifest del APK 1.0.3, build local S78): el
 * `build --local` corrió sin GOOGLE_MAPS_API_KEY en el entorno y el
 * config plugin OMITIÓ la meta-data `com.google.android.geo.API_KEY`.
 *
 * EL GUARD QUEDA VIVO PARA SIEMPRE (mandato B19-①): un secret faltante
 * debe costar EL MAPA, jamás la app. La estructura (render condicional
 * + voz honesta) no se retira nunca; lo único que cambia es este flag.
 *
 * DISPARO DEL FLIP a `true` — LAS DOS CONDICIONES, ninguna de memoria:
 *  1. La build nueva verificada POR MANIFEST (B19-②: decodificar el
 *     AndroidManifest del artefacto y confirmar la meta-data de la key
 *     — el paso que ahora es obligatorio antes de entregar una build).
 *  2. El APK viejo (1785163333370, sin key) FUERA del dispositivo del
 *     founder — el flip via OTA le llega también al APK roto (mismo
 *     runtime 1.0.3): flipear antes de reinstalar re-abre el crash.
 * Precedente del mecanismo: VITRINA_GATE_ABIERTO (S78-B, constante con
 * disparo declarado).
 */

/**
 * FLIP a true (S80-B19, 28-jul-2026) — LAS DOS CONDICIONES CUMPLIDAS:
 *  1. build-s80-b19.apk verificado POR MANIFEST antes de instalar
 *     (meta-data geo.API_KEY presente, key AIza adentro, 1.0.3).
 *  2. El APK roto (1785163333370) REEMPLAZADO por `adb install -r`
 *     en el dispositivo del founder (R5CY201ZDVL) — Success.
 * El guard NO se retira: si una build futura sale sin el secret, este
 * flag vuelve a false y cuesta el mapa, jamás la app.
 */
/* 🔴 S106-A · VUELVE A `false`, Y ES LA PROPIA LEY DE ESTE ARCHIVO CUMPLIDA:
 * *«si una build futura sale sin el secret, este flag vuelve a false y cuesta
 * el mapa, jamás la app.»*
 *
 * **Medido sobre el ARTEFACTO, no sobre el prebuild** (`verify-manifest-apk`):
 * el APK del prestador de S106 t2 **NO tiene `geo.API_KEY`**, y el de este
 * cierre tampoco. `D-944`: los dos son secrets de EAS y **una build local no
 * puede tenerlos**.
 *
 * ⚠️ **Y corrige una medición mía que estaba mal:** al diagnosticar el crash
 * del cliente leí `android/app/src/main/AndroidManifest.xml` —el del
 * **prebuild**— y concluí que el prestador estaba sano. *Ese archivo no es el
 * manifiesto del APK.* Con el flag en `true` sobre un APK sin key, «Cómo te
 * ven» montaba un mapa y **moría en hilo nativo**: un crash latente que nadie
 * había disparado sólo porque nadie abrió esa pantalla.
 *
 * *Leer el insumo de un artefacto y llamarlo el artefacto es la misma clase de
 * error que medir una rama en vez del objeto desplegado.* */
/* ── S107 · B2 (firma del founder, 27-ago-2026) ────────────────────────────
   ⏪ ACA HABIA UNA CONSTANTE EN `false`, y arriba la promesa de que «muere
   sola» cuando llegara una build con la key. **No murio sola: era un `const`.**
   El 27-ago se compilo un APK local CON la key —verificado por manifiesto,
   `✓ meta-data geo.API_KEY`— y esta linea lo habria hecho decir «sin mapas»
   sobre una app que si los tiene.

   🔴 Y de paso cae la premisa que sostenia el `false`, que decia:
   *«una build LOCAL nunca puede tener esa key»*. **Falso, y falsado con un
   APK**: la key es inaccesible para el builder de EAS en la nube, no para una
   build local, que corre en la maquina donde la key vive. Lo que la condicion
   ① queria de verdad no era «en la nube»: era **verificada por manifiesto**.

   AHORA SE DERIVA: `app.config.ts` calcula el veredicto en build-time desde la
   presencia real de `GOOGLE_MAPS_API_KEY` y lo expone como booleano en `extra`
   (nunca la key — medido: Expo la borra del config embebido, asi que leerla
   desde aca era imposible).

   🔑 Lo computa **la misma build que la hornea**: no hay dos fuentes que puedan
   divergir, y por eso esto no vuelve a caducar en silencio.

   ⚠️ FAIL-CLOSED: `!== true` — si `extra` no llega, si el campo falta, o si
   viene con cualquier otra cosa, el flag queda en `false` y **se pierde el
   mapa, jamas la app**. Es la ley original de este archivo, intacta. */
/* 🔴 S107 · **C PROVISORIO, CON SU MUERTE ESCRITA** (firma del founder, 27-ago).
   ⏪ Acá estuvo, por unas horas, la derivación de B2:
   `Constants.expoConfig?.extra?.mapasHorneados === true`. **Se retira porque
   estaba rota por diseño**, y la razón vale más que el código:

   > **La premisa era «una sola build». Hay DOS actos de compilación de config
   > —el APK y CADA OTA— y el segundo nunca puede saber.** `GOOGLE_MAPS_API_KEY`
   > es un secret que **solo el builder de EAS puede leer**, así que todo
   > `eas update` recomputa `extra` sin la key y publica `false`, **pisando el
   > `true` que el APK traía bien**. Medido el 27-ago: el APK decía `True`, el
   > OTA `01a0462c` lo puso en `False`, y el mapa se apagó en una app que lo
   > tiene horneado.

   ✅ HOY ESTA CONSTANTE ES VERDADERA, y por eso se puede usar: el APK instalado
   pasó `verify-manifest-apk.mjs` en VERDE con `✓ meta-data geo.API_KEY`, y la
   condición ② del flip de `D-944` —el APK sin key fuera del dispositivo del
   founder— **se cumplió cuando lo desinstaló**.

   ☠️ **CONDICIÓN DE MUERTE, y no es «cuando alguien se acuerde»:**
   **esta línea muere cuando entre B1** — la sonda nativa
   `SondaManifest.leerMetaData('com.google.android.geo.API_KEY')`, que **ya
   existe en `apps/prestador/modules/sonda-manifest`** y hay que portar al
   cliente. *Lee el manifiesto REAL en runtime: inmune a OTA e inmune a env
   vars, que es lo único que no depende de que alguien recuerde algo.* */
export const MAPA_NATIVO_DISPONIBLE = true;
