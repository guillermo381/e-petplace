/**
 * Config dinámica sobre app.json (Expo la usa como base y aplica esto).
 * Mecánica CALCADA de apps/prestador (S44-B2.6 / D-289, ahora S45-B5.4):
 * inyecta la API key de Google Maps desde el entorno — la key JAMÁS en
 * el repo (env secret de EAS, environment "development"; L-130).
 * Sin la variable, la key queda vacía: Expo Go y web no la usan; una
 * dev build sin key muestra tiles vacíos.
 */

import type { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  /* ── S107 · B2: EL FLAG DEL MAPA SE DERIVA, NO SE AFIRMA ──────────────────
     Gemelo del prestador; ver allí la razón completa. En corto:
     `MAPA_NATIVO_DISPONIBLE` era `const false` (D-944) con la promesa de morir
     sola — **una constante no muere sola**. Y la key NO se puede leer del
     `app.config` embebido (medido en dos APK: Expo la borra), así que se expone
     el VEREDICTO como booleano, jamás la key. Lo computa la misma build que la
     hornea, así que no puede desincronizarse. */
  extra: {
    ...config.extra,
    mapasHorneados: Boolean(process.env.GOOGLE_MAPS_API_KEY),
  },
  android: {
    ...config.android,
    // S81 (el tren de notificaciones): google-services.json como env
    // var de ARCHIVO en EAS — condicional: sin la variable, nada cambia
    // (mecánica calcada del prestador; R4 §1.3).
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
