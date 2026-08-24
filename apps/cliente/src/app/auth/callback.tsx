/**
 * /auth/callback — el destino del redirect de «Entrar con Google» (S104-C).
 *
 * ── EN EL CAMINO FELIZ, ESTA RUTA NO SE RENDERIZA ─────────────────────────
 * `WebBrowser.openAuthSessionAsync` intercepta el `cliente://auth/callback?code=…`
 * y lo devuelve al login, que canjea el código con el wrapper. La sesión de
 * autenticación se cierra en el navegador, no navegando la app.
 *
 * ── ENTONCES ¿PARA QUÉ EXISTE? ────────────────────────────────────────────
 * Por dos razones, y las dos importan:
 *   ① **R63·B la exige**: un deep link que la app promete (`redirectTo`) tiene
 *      que tener quién lo sirva — si no, es una ruta prometida que nadie
 *      atiende, el defecto exacto que esa regla caza.
 *   ② **Respaldo en frío**: si el SO llegara a entregar el enlace directamente
 *      a la app (sesión ya cerrada, arranque en frío sobre el deep link), esta
 *      pantalla manda a la raíz y el guard del raíz decide con la sesión que el
 *      flujo ya haya dejado persistida — jamás un callejón.
 */

import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@epetplace/ui';

export default function AuthCallback() {
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  // Fondo neutro mientras se re-decide (no llega a verse en el camino feliz).
  return <View style={{ flex: 1, backgroundColor: theme.bg.base }} />;
}
