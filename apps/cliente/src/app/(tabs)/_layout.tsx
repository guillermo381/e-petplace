/**
 * Navegación raíz del dueño (S51-B2.1) — decisión founder S50: TRES
 * tabs, Hogar·Explorar·Cuenta. La agenda NO es tab (las citas son
 * estado del hogar). El 4º slot NO existe hoy — ciclo del trono (§3
 * de DISEÑO_EXPERIENCIA): la Despensa entra por configuración en A6
 * y cede a Comunidad en F3; este array es esa configuración.
 *
 * 🔴 **S100c-D · LA BARRA NO SE TOCÓ, Y ESO ES UNA DECISIÓN — NO UN
 * PENDIENTE.**
 *
 * El founder firmó *«Pedidos entra en el slot de Explorar»* con el número de
 * B (el hombro de la cresta **muerde el ícono vecino en 360 dp y libra por
 * 1,3 dp** en su teléfono; *un margen de 1,3 dp no es holgura, es azar*).
 * **Y minutos después la firma quedó EN SUSPENSO por un dato que da vuelta la
 * premisa: `e-PetPlace Negocios` —nuestra propia app del prestador— TIENE
 * CINCO TABS Y SE VEN BIEN, en el mismo teléfono.**
 *
 * ⇒ *Las dos mediciones pueden ser correctas sobre objetos distintos*: B midió
 * la caja del ícono **del cliente** (24,2 dp) y calculó contra **esa**
 * anatomía. Si el prestador resuelve algo que el cliente no, la conclusión
 * deja de ser *«cinco no caben»* y pasa a ser ***«cinco no caben con ESTA
 * anatomía»***, que es una conclusión distinta y **la que decide qué se
 * construye acá**. B está midiendo las dos barras lado a lado.
 *
 * **Por eso esta barra queda EXACTAMENTE como estaba** — `Hogar · Explorar ·
 * Despensa · Cuenta`. *Retirar una tab con su medición en vuelo es construir
 * sobre una premisa que se está midiendo, que es el modo de falla que esta
 * casa lleva ocho gates aprendiendo a no repetir.*
 *
 * ── LO QUE SÍ ENTRÓ, PORQUE NO DEPENDE DE ESA DECISIÓN ──────────────────
 * **Las tres rutas de Pedidos ya viven en su propio mundo** (`(tabs)/pedidos`,
 * registrado abajo **sin botón**) y se alcanzan desde Cuenta, desde «Ponte al
 * día» y desde el «listo» del checkout. *Una casa puede existir antes de tener
 * su puerta en la calle principal* — y así el postventa se puede mirar en el
 * gate sin comprometer la barra.
 *
 * ── EL CENSO DEL RETIRO, HECHO Y GUARDADO ───────────────────────────────
 * Por si la medición vuelve a favor del reemplazo, **el censo ya está** en
 * `docs/loop/S100c-D.md` §7: de los tres bloques de `explorar/index.tsx`, los
 * cuatro servicios duplican el rail del Hogar y la adopción está **mejor**
 * servida allá (`/adoptar` existe); lo único propio es el «Próximamente
 * honesto». **Y retirar la TAB nunca fue retirar el mundo:** `(tabs)/explorar`
 * contiene **16 rutas — el flujo de reserva entero de los cuatro oficios**,
 * al que empujan los cuatro `lib/reserva/*`.
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
    /* 🔴 EXPLORAR SE QUEDA, Y PEDIDOS TODAVÍA NO ENTRA — FRENO DEL FOUNDER
     * (18-ago-2026), sobre un dato que da vuelta la premisa: **la app del
     * PRESTADOR tiene CINCO tabs y se ven bien.** B está midiendo las dos
     * barras lado a lado (¿misma pieza? ¿mismo ancho de ícono, etiqueta y
     * relleno?) — *si la quinta cabe, Pedidos entra COMO QUINTA y Explorar
     * no se retira.*
     *
     * ⇒ **La barra queda EXACTAMENTE como estaba.** El censo del retiro de
     * Explorar está hecho y vive en `docs/loop/S100c-D.md`; **no se ejecuta
     * hasta que baje el número.** *Retirar una tab con la medición en vuelo
     * es la definición de construir sobre una premisa que se está midiendo.*
     *
     * Lo que SÍ entra hoy y no depende de esa decisión: **las tres rutas de
     * Pedidos ya viven en su propio mundo** (`<Tabs.Screen name="pedidos" />`
     * abajo, sin botón) y se alcanzan desde Cuenta, desde «Ponte al día» y
     * desde el «listo» del checkout. *Una casa puede existir antes de tener
     * su puerta en la calle principal.* */
    {
      key: 'explorar',
      etiqueta: t('tabs.explorar'),
      icono: ({ color, activa, colorHuella }) => (
        <Icono nombre="explorar" tinta={color} huella={colorHuella} activa={activa} />
      ),
    },
    {
      key: 'despensa',
      etiqueta: t('tabs.despensa'),
      icono: ({ color, activa, colorHuella }) => (
        <Icono nombre="despensa" tinta={color} huella={colorHuella} activa={activa} />
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

  /**
   * 🔴 QUÉ TAB SE MARCA CUANDO LA RUTA NO TIENE BOTÓN — DECIDIDO, NO HEREDADO.
   *
   * Hoy `pedidos` es una ruta registrada **sin tab**, así que estar en
   * `/pedidos` dejaría a `BarraTabs` buscando una `key` que no está en
   * `items`. Su `Math.max(0, findIndex())` **caería en 0 y marcaría Hogar
   * igual** — con el resultado correcto **por accidente**.
   *
   * *Un comportamiento correcto que sale de un fallback es un comportamiento
   * que nadie decidió, y que cambia el día que alguien reordene el array.*
   * Acá se dice: **mientras Pedidos no tenga botón, su casa se marca como
   * DESPENSA** — se llega desde la vitrina y desde el «listo» del checkout,
   * y ése es el mundo del que cuelga la compra.
   *
   * ⚠️ **Esta línea muere el día que Pedidos gane su tab**, en cualquiera de
   * las dos formas que la mesa está midiendo (quinta, o reemplazo).
   */
  const tabDeRuta = (nombre: string) => (nombre === 'pedidos' ? 'despensa' : nombre);

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
          activo={tabDeRuta(state.routes[state.index].name)}
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
      <Tabs.Screen name="pedidos" />
      {/* ⚠️ SE QUEDA SIN BOTÓN, A PROPÓSITO: acá viven las 16 rutas del
          flujo de reserva de los cuatro oficios. Sacarla habría roto las
          cuatro cadenas de `lib/reserva/*` sin que ningún typecheck lo
          viera — el modo de falla que esta casa llama silencioso. */}
      <Tabs.Screen name="explorar" />
      <Tabs.Screen name="despensa" />
      <Tabs.Screen name="cuenta" />
    </Tabs>
  );
}
