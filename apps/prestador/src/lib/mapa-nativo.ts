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
export const MAPA_NATIVO_DISPONIBLE = true;
