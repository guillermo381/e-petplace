/**
 * Navegación raíz del dueño (S51-B2.1) — decisión founder S50: TRES
 * tabs, Hogar·Explorar·Cuenta. La agenda NO es tab (las citas son
 * estado del hogar). El 4º slot NO existe hoy — ciclo del trono (§3
 * de DISEÑO_EXPERIENCIA): la Despensa entra por configuración en A6
 * y cede a Comunidad en F3; este array es esa configuración.
 */

import { Tabs } from 'expo-router';
import { StackActions } from 'expo-router/react-navigation';
import { BarraTabs, type BarraTabsItem } from '@epetplace/ui';

import { IconoCuenta, IconoExplorar, IconoHogar } from '@/components/iconos-tabs';
import { useTraduccion } from '@/i18n';

export default function TabsLayout() {
  const { t } = useTraduccion();

  const items: BarraTabsItem[] = [
    { key: 'hogar', etiqueta: t('tabs.hogar'), icono: IconoHogar },
    { key: 'explorar', etiqueta: t('tabs.explorar'), icono: IconoExplorar },
    { key: 'cuenta', etiqueta: t('tabs.cuenta'), icono: IconoCuenta },
  ];

  return (
    <Tabs
      // D-402: tocar un tab lleva SIEMPRE a la raíz de ese tab —
      // popToTopOnBlur vacía el stack interno al salir del tab, así
      // volver a él jamás encuentra una pantalla pegada.
      screenOptions={{ headerShown: false, popToTopOnBlur: true }}
      tabBar={({ state, navigation }) => (
        <BarraTabs
          items={items}
          activo={state.routes[state.index].name}
          onCambiar={(key) => {
            const activa = state.routes[state.index];
            if (key !== activa.name) {
              navigation.navigate(key);
              return;
            }
            // D-402, la otra mitad: re-tocar el tab activo también
            // vuelve a la raíz (popToTopOnBlur solo actúa al salir).
            if (activa.state?.type === 'stack' && activa.state.key && (activa.state.index ?? 0) > 0) {
              navigation.dispatch({ ...StackActions.popToTop(), target: activa.state.key });
            }
          }}
          // S53 (§2.6): el set b′ marca la tab activa con la HUELLA —
          // el pill muere; la huella hereda el rol de accent.active.
          estadoPorHuella
        />
      )}
    >
      <Tabs.Screen name="hogar" />
      <Tabs.Screen name="explorar" />
      <Tabs.Screen name="cuenta" />
    </Tabs>
  );
}
