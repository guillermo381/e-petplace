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
import { BarraTabs, Boton, EstadoVacio, spacing, useTheme, type BarraTabsItem } from '@epetplace/ui';

import { asegurarSesionDev } from '@/lib/api';
import { IconoHoy, IconoMascotas, IconoNegocio } from '@/components/iconos-tabs';
import { useTraduccion } from '@/i18n';

type EstadoSesionRaiz = 'verificando' | 'ok' | 'sin_sesion';

export default function TabsLayout() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const [sesion, setSesion] = useState<EstadoSesionRaiz>('verificando');
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void asegurarSesionDev().then((r) => {
        if (vigente) setSesion(r.ok ? 'ok' : 'sin_sesion');
      });
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  if (sesion === 'verificando') {
    // decisión en curso: superficie quieta (Ley 13 — nada parpadea)
    return <View style={{ flex: 1, backgroundColor: theme.bg.base }} />;
  }

  if (sesion === 'sin_sesion') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio
          titulo={t('sesion.sinSesion')}
          descripcion={t('sesion.sinSesionDetalle')}
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
