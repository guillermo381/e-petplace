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
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    },
  },
})
