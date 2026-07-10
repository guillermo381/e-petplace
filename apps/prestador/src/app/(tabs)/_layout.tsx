/**
 * Navegación raíz del prestador (S51-B3.1) — decisión founder S50:
 * TRES tabs, Hoy·Mascotas·Negocio (§14). Migrada de las NativeTabs
 * del template a la BarraTabs del design system (deuda anotada en B2).
 *
 * SIN-SESIÓN DIGNO EN EL RAÍZ (hallazgo del blanco-100% de S51): en
 * una build sin Metro y sin sesión, la app lo DICE apenas abre — el
 * error jamás se disfraza (Ley 13) ni depende de que Agenda lo ataje.
 * El login real es D-290/B1; hoy la sesión es la dev/demo (S44-B4).
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Tabs, useFocusEffect } from 'expo-router';
import {
  BarraTabs,
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  spacing,
  useTheme,
  type BarraTabsItem,
} from '@epetplace/ui';

import { asegurarSesionDev } from '@/lib/api';
import { IconoHoy, IconoMascotas, IconoNegocio } from '@/components/iconos-tabs';
import { useTraduccion } from '@/i18n';

// TRES estados (cura S51 post-gate): cargando (Esqueleto ESTÁTICO,
// Ley 13 — jamás el vacío como estado de carga) → sesión → sin-sesión
// SOLO confirmado (el bootstrap dev de asegurarSesionDev ya corrió y
// dijo que no). `detalle` conserva el mensaje específico del bootstrap
// (regla 36: "faltan credenciales en .env.local" no es lo mismo que
// "no hay sesión" — cero causas tragadas).
type EstadoSesionRaiz = 'verificando' | 'ok' | { sin_sesion: true; detalle: string };

export default function TabsLayout() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const [sesion, setSesion] = useState<EstadoSesionRaiz>('verificando');
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void asegurarSesionDev().then((r) => {
        // Forense L-138: el resultado del guard raíz queda LITERAL en
        // el log de Metro/logcat — el gate empieza confirmándolo.
        console.log(`[sesion] raíz prestador: ${r.ok ? 'ok' : `sin sesión — ${r.mensaje}`}`);
        if (vigente) setSesion(r.ok ? 'ok' : { sin_sesion: true, detalle: r.mensaje });
      });
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  if (sesion === 'verificando') {
    // Esqueleto estático de la jornada (Ley 13): la verificación firma
    // sesión dev en frío — puede tardar; el vacío jamás es carga.
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, padding: spacing[5], paddingTop: spacing[10] }}>
        <EsqueletoGrupo>
          <View style={{ gap: spacing[4] }}>
            <Esqueleto forma="linea" ancho="55%" />
            <Esqueleto forma="bloque" ancho="100%" alto={88} />
            <Esqueleto forma="bloque" ancho="100%" alto={220} />
          </View>
        </EsqueletoGrupo>
      </View>
    );
  }

  if (sesion !== 'ok') {
    // sin-sesión CONFIRMADO — el estado digno de la preview, intacto.
    // El detalle específico solo se muestra si difiere del genérico
    // (en preview es "No hay sesión activa." y el título ya lo dice).
    const detalleEspecifico = sesion.detalle !== 'No hay sesión activa.' ? sesion.detalle : t('sesion.sinSesionDetalle');
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio
          titulo={t('sesion.sinSesion')}
          descripcion={detalleEspecifico}
          accion={
            <Boton
              variante="secundario"
              etiqueta={t('sesion.reintentar')}
              onPress={() => {
                setSesion('verificando');
                setIntento((n) => n + 1);
              }}
            />
          }
        />
      </View>
    );
  }

  const items: BarraTabsItem[] = [
    { key: 'index', etiqueta: t('tabs.hoy'), icono: IconoHoy },
    { key: 'mascotas', etiqueta: t('tabs.mascotas'), icono: IconoMascotas },
    { key: 'negocio', etiqueta: t('tabs.negocio'), icono: IconoNegocio },
  ];

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <BarraTabs
          items={items}
          activo={state.routes[state.index].name}
          onCambiar={(key) => navigation.navigate(key)}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="mascotas" />
      <Tabs.Screen name="negocio" />
      {/* galería de tokens: fuera de la barra, viva por URL (/gallery) */}
      <Tabs.Screen name="gallery" />
    </Tabs>
  );
}
