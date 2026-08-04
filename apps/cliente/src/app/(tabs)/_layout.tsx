/**
 * Navegación raíz del dueño (S51-B2.1) — decisión founder S50: TRES
 * tabs, Hogar·Explorar·Cuenta. La agenda NO es tab (las citas son
 * estado del hogar). El 4º slot NO existe hoy — ciclo del trono (§3
 * de DISEÑO_EXPERIENCIA): la Despensa entra por configuración en A6
 * y cede a Comunidad en F3; este array es esa configuración.
 */

import { Tabs } from 'expo-router';
import { StackActions } from 'expo-router/react-navigation';
import { BarraTabs, Icono, type BarraTabsItem } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

/* ☠️ S86-B · `@/components/iconos-tabs` MURIÓ — LA BARRA CONSUME EL
 * REGISTRY (D-645 / D-546). Los tres glifos de esta barra vivían
 * copiados a mano, y **los tres habían divergido del set firmado**:
 * la casa (dos paths donde el registry tiene uno), la brújula (r 8.8
 * contra 8.4, huella en otra posición y escala) y la CHAPITA DE
 * COLLAR — que el registry había reemplazado por la persona
 * (cabeza + hombros) en S85-B23 por orden del founder, *"algo que
 * realmente parezca cuenta"*. **Esa firma nunca llegó al cliente**,
 * y nada falló: una copia no se entera de que la fuente cambió.
 * Ahora hay UNA fuente, y `Icono` resuelve la ley 6 adentro. */

export default function TabsLayout() {
  const { t } = useTraduccion();

  const items: BarraTabsItem[] = [
    {
      key: 'hogar',
      etiqueta: t('tabs.hogar'),
      icono: ({ color, activa, colorHuella }) => (
        <Icono nombre="hogar" tinta={color} huella={colorHuella} activa={activa} />
      ),
    },
    {
      key: 'explorar',
      etiqueta: t('tabs.explorar'),
      icono: ({ color, activa, colorHuella }) => (
        <Icono nombre="explorar" tinta={color} huella={colorHuella} activa={activa} />
      ),
    },
    {
      key: 'cuenta',
      etiqueta: t('tabs.cuenta'),
      icono: ({ color, activa, colorHuella }) => (
        <Icono nombre="cuenta" tinta={color} huella={colorHuella} activa={activa} />
      ),
    },
  ];

  return (
    <Tabs
      // D-402 (ENMENDADA S63, hallazgo founder): el reset a raíz se
      // dispara SOLO en el PRESS explícito del tab (abajo, en
      // onCambiar). El popToTopOnBlur anterior era el desvío: el blur
      // también dispara cuando una ruta de nivel raíz (el parte, el
      // detalle) se monta encima de los tabs o cuando un flujo cruza
      // de tab — vaciaba el stack A MITAD del flujo y la flecha de
      // atrás (goBack correcto) aterrizaba en la raíz del mundo
      // porque los pasos previos ya no existían.
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <BarraTabs
          items={items}
          activo={state.routes[state.index].name}
          onCambiar={(key) => {
            const activa = state.routes[state.index];
            // D-402: el PRESS del tab lleva SIEMPRE a la raíz de ese
            // mundo — sea re-toque del activo o entrada a otro tab
            // con un flujo pendiente. Primero el pop (por target key,
            // funciona sin foco), después el navigate: se aterriza en
            // la raíz sin flash del stack viejo.
            const destino = state.routes.find((r) => r.name === key) ?? activa;
            if (destino.state?.type === 'stack' && destino.state.key && (destino.state.index ?? 0) > 0) {
              navigation.dispatch({ ...StackActions.popToTop(), target: destino.state.key });
            }
            if (key !== activa.name) {
              navigation.navigate(key);
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
