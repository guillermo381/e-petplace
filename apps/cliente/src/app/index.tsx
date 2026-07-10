/**
 * Entrada del app del dueño (S45-B4 → fix S45-splash) — routing por
 * estado real:
 *   sin sesión → /bienvenida
 *   sesión sin familia → /onboarding/mascota
 *   sesión con familia → /home
 * URL-reconstruible: esta ruta no guarda nada, decide y redirige.
 * Regla 36: si el estado no llega (red muerta, backend caído), esto
 * NO se queda mudo — a los 8s muestra un estado digno con reintento.
 */

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, EstadoVacio, spacing, useTheme } from '@epetplace/ui';
import { getEstadoOnboardingDueno, obtenerSesion } from '@epetplace/api';

const UMBRAL_COLGADO_MS = 8000;

export default function Entrada() {
  const router = useRouter();
  const { theme } = useTheme();
  const [colgado, setColgado] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    const timer = setTimeout(() => {
      if (vigente) setColgado(true);
    }, UMBRAL_COLGADO_MS);

    void (async () => {
      const sesion = await obtenerSesion();
      if (!vigente) return;
      if (!sesion.ok || sesion.data === null) {
        clearTimeout(timer);
        router.replace('/bienvenida');
        return;
      }
      const estado = await getEstadoOnboardingDueno();
      if (!vigente) return;
      clearTimeout(timer);
      if (!estado.ok) {
        // Sesión con backend inaccesible: estado digno con reintento.
        setColgado(true);
        return;
      }
      router.replace(estado.data.tiene_familia ? '/hogar' : '/onboarding/mascota');
    })();

    return () => {
      vigente = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  if (colgado) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio
          titulo="Esto está tardando más de lo normal"
          descripcion="Revisá tu conexión y probá de nuevo."
          accion={
            <Boton
              etiqueta="Probar de nuevo"
              onPress={() => {
                setColgado(false);
                setIntento((n) => n + 1);
              }}
            />
          }
        />
      </View>
    );
  }

  // Decisión en curso: superficie base quieta (Ley 13 — nada parpadea).
  return <View style={{ flex: 1, backgroundColor: theme.bg.base }} />;
}
