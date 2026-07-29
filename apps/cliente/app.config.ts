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
