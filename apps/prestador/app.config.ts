/**
 * Config dinámica sobre app.json (Expo la usa como base y aplica esto).
 *
 * ÚNICO propósito: inyectar la API key de Google Maps desde el entorno
 * (S44-B2.6 / D-289). La key JAMÁS se commitea en texto plano:
 *   - build EAS: variable de entorno del proyecto con visibilidad
 *     secret (`eas env:create`), environment "development" (eas.json).
 *   - prebuild/local: exportar GOOGLE_MAPS_API_KEY en la shell.
 * Sin la variable, la key queda vacía: Expo Go y web no la usan; una
 * dev build sin key muestra tiles vacíos (mismo síntoma que motivó esto).
 */

import type { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  /* ── S107 · B2: EL FLAG DEL MAPA SE DERIVA, NO SE AFIRMA ──────────────────
     `MAPA_NATIVO_DISPONIBLE` era una CONSTANTE en `false` (D-944), y su propio
     comentario prometía que «muere sola: una build de la nube trae las dos
     cosas y el flag vuelve a true». **No muere sola: es un `const false`.**
     Nadie lo iba a flipear, y el día que la build SÍ tuviera la key el pie
     diría «sin mapas» sobre una app que los tiene.

     🔴 POR QUÉ UN BOOLEANO Y NO LA KEY: medido el 27-ago sobre dos APK reales
     —uno con key y otro sin— **el `app.config` embebido NO lleva `apiKey` en
     ninguno de los dos**: Expo la borra del config legible por el cliente. Así
     que `Constants.expoConfig` no puede distinguirlos leyendo la key. Lo que sí
     viaja es `extra`. ⇒ **se calcula acá el veredicto y se expone SOLO el
     booleano** — nunca la key.

     🔑 Y lo que lo hace incapaz de desincronizarse: **lo computa la MISMA build
     que hornea (o no) la key.** No hay dos fuentes que puedan divergir.

     ⚠️ Existe una vía más pura —`SondaManifest.leerMetaData(...)`, el módulo
     nativo de `D-579` que YA vive en esta app— y queda fichada sin usar: exige
     portarla al cliente, o sea abrir un frente nativo que hoy no hace falta. */
  extra: {
    ...config.extra,
    mapasHorneados: Boolean(process.env.GOOGLE_MAPS_API_KEY),
  },
  android: {
    ...config.android,
    // S81 (el tren de notificaciones): google-services.json viaja como
    // env var de ARCHIVO en EAS (GOOGLE_SERVICES_JSON → path en el
    // build). CONDICIONAL a propósito: sin la variable (hoy, y en todo
    // flujo OTA/dev) la config queda EXACTAMENTE como era — el tren no
    // descarrila nada hasta que el founder suba el archivo (R4 §1.3).
    ...(process.env.GOOGLE_SERVICES_JSON
      ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON }
      : null),
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    },
  },
})
