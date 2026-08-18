/**
 * Navegación raíz del dueño (S51-B2.1) — decisión founder S50: TRES
 * tabs, Hogar·Explorar·Cuenta. La agenda NO es tab (las citas son
 * estado del hogar). El 4º slot NO existe hoy — ciclo del trono (§3
 * de DISEÑO_EXPERIENCIA): la Despensa entra por configuración en A6
 * y cede a Comunidad en F3; este array es esa configuración.
 *
 * 🔴 **S100c-D · PEDIDOS ENTRA COMO QUINTA TAB — FIRMA DEL FOUNDER, Y EL
 * NÚMERO QUE LA DECIDIÓ NO ES EL QUE LA MESA CREÍA.**
 *
 * `Hogar · Explorar · Despensa · Pedidos · Cuenta`. **Explorar NO se retira.**
 *
 * ── CÓMO SE LLEGÓ ACÁ, PORQUE LA HISTORIA ES LA LECCIÓN ─────────────────
 * ① Se firmó *«la barra queda en cuatro ⇒ Pedidos reemplaza a Explorar»*,
 * apoyado en que **el hombro de la cresta libraba por 1,3 dp** en el teléfono
 * del founder — *un margen de 1,3 dp no es holgura, es azar*. · ② **El
 * founder aportó el dato que dio vuelta la premisa: `e-PetPlace Negocios`
 * —nuestra propia app— TIENE CINCO TABS Y SE VEN BIEN, en el mismo
 * teléfono.** · ③ B midió **las dos barras lado a lado** y su propia
 * restricción resultó falsa.
 *
 * **Lo medido, que es lo que rige:**
 *   · **es LA MISMA PIEZA** (`BarraTabs` de `packages/ui` en las dos apps),
 *     **mismo ícono de 24,2 dp** y mismo largo de etiqueta ⇒ *el largo del
 *     texto no era la variable, aunque parecía.*
 *   · lo que difiere es **dónde cae el disco**: el prestador lo tiene **al
 *     borde y vive con 20,7 dp de hueco**; el cliente con cinco tendría
 *     **28,8 dp** — **MÁS AIRE QUE EL CASO QUE EL FOUNDER YA APRUEBA.**
 *
 * ⇒ **entra**, y con eso **`H-116` se disuelve sin necesidad de firma**: el
 * descubrimiento de los servicios se conserva porque Explorar se queda.
 *
 * 🔴 **LA LECCIÓN, Y NOS ALCANZA A LOS DOS:** yo medí el valle, B midió el
 * ícono — **dos mediciones buenas, ninguna mirada en pantalla.** Lo que
 * faltaba no era un tercer número: era **comparar con la otra barra**, que
 * vivía en el mismo teléfono desde antes de empezar. *Cuando dos pistas se
 * pasan números y la pregunta no cierra, lo que falta suele no ser otro
 * número — es el objeto que nadie miró.*
 *
 * ── EL ORDEN NO ES LIBRE: LO RESTRINGE UNA LETRA FIRMADA ────────────────
 * `DISEÑO_EXPERIENCIA` §7 (**ciclo del trono**): la Despensa ocupa el trono
 * y *«cuando llegue Comunidad, Comunidad va al CENTRO»*. **Con cinco tabs el
 * centro es la posición 3 exacta** —con cuatro no existía centro verdadero—,
 * así que **Pedidos va CUARTO** y la Despensa queda centrada. Meterlo segundo
 * la empujaría a la 4ª y **rompería el trono en la única barra que el dueño
 * ve todos los días**. Cuenta sigue cerrando, que es la convención medida en
 * las dos apps.
 *
 * ⚠️ **LO QUE EL NÚMERO NO RESUELVE Y VA AL OJO DEL FOUNDER:** el prestador
 * tiene **UN** hueco angosto; el cliente con cinco tiene **DOS** (los dos
 * lados del disco). **28,8 > 20,7 en cada uno, pero si dos huecos angostos se
 * leen peor que uno, eso es ojo y no número.** Declarado, no dado por bueno.
 */

import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { StackActions } from 'expo-router/react-navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarraTabs, Icono, type BarraTabsItem } from '@epetplace/ui';
import { listarMisPedidos } from '@epetplace/api';

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

/**
 * 🔴 LA MARCA DE «ESTA CASA YA COMPRÓ» — y no es caché, es ANTI-SALTO.
 *
 * La firma dice que Pedidos **aparece con el primer pedido**, y eso exige
 * saber si hay pedidos **antes de dibujar la barra**. La lectura tarda.
 *
 * **Sin la marca, cada arranque en frío dibujaría CUATRO tabs y saltaría a
 * CINCO cuando llegara la respuesta** — y como el ancho de cada pestaña es
 * `ancho / cantidad`, ese salto **re-acomoda la barra entera**, disco y valle
 * incluidos, en la superficie que el dueño toca todos los días. *No es un
 * parpadeo de contenido: es la barra cambiando de forma bajo el pulgar.*
 *
 * La marca es **monótona a propósito**: un pedido no se borra, así que «esta
 * casa ya compró» **no vuelve a ser falso**. Por eso se persiste y jamás se
 * limpia — *una marca que puede volver atrás reintroduce el salto que vino a
 * evitar.*
 *
 * ⚠️ **El salto ocurre UNA vez y es el bueno:** el día de la primera compra,
 * la barra gana su casa de postventa. Eso no se esconde.
 */
const CLAVE_YA_COMPRO = 'epp.cliente.tienePedidos.v1';

export default function TabsLayout() {
  const { t } = useTraduccion();
  /** `null` = todavía no sabemos (primer arranque, sin marca): la tab NO se
   *  dibuja. *Ante la duda no se ofrece una casa vacía* — el acceso vive en
   *  Cuenta, que es exactamente lo que la firma dice. */
  const [tienePedidos, setTienePedidos] = useState<boolean | null>(null);

  useEffect(() => {
    let vive = true;
    void (async () => {
      // La marca primero: si ya compró, la barra nace con sus cinco tabs y la
      // red ni siquiera decide el primer frame.
      try {
        const marca = await AsyncStorage.getItem(CLAVE_YA_COMPRO);
        if (vive && marca === '1') setTienePedidos(true);
      } catch {
        /* la marca no bloquea — se cae a la lectura */
      }
      const r = await listarMisPedidos();
      if (!vive) return;
      // 🔴 UN FALLO DE LECTURA NO APAGA LA TAB. `r.ok === false` significa
      // «no pude preguntar», jamás «no tenés pedidos» — y apagar una tab por
      // un error de red la haría desaparecer bajo el dedo de alguien que sí
      // compró. *El silencio no es un no* (L-139).
      if (!r.ok) return;
      if (r.data.length > 0) {
        setTienePedidos(true);
        try {
          await AsyncStorage.setItem(CLAVE_YA_COMPRO, '1');
        } catch {
          /* sin marca, el próximo arranque paga el salto una vez más */
        }
      } else {
        setTienePedidos((previo) => previo ?? false);
      }
    })();
    return () => {
      vive = false;
    };
  }, []);

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
      key: 'despensa',
      etiqueta: t('tabs.despensa'),
      icono: ({ color, activa, colorHuella }) => (
        <Icono nombre="despensa" tinta={color} huella={colorHuella} activa={activa} />
      ),
    },
    /* 🔴 PEDIDOS — LA CASA DEL POSTVENTA, CUARTA POR EL CICLO DEL TRONO.
     * *En curso arriba, historial abajo, y los accesos adentro: ahí crece sin
     * límite y sin esconder nada.* El founder evaluó un menú plegable y la
     * mesa lo desaconsejó — **esconde lo que contiene, que es la misma cura
     * que ya falló cuando «Tus pedidos» quedó enterrado al fondo de la
     * vitrina** (G-15).
     *
     * **Aparece con el primer pedido** (firma del founder): mientras no haya,
     * el acceso vive en Cuenta — donde ya está. */
    ...(tienePedidos === true
      ? [
          {
            key: 'pedidos',
            etiqueta: t('tabs.pedidos'),
            /* ✅ GLIFO PROPIO — el préstamo duró un commit. Yo había montado
             * `despensa` **declarando su costo** (dos tabs vecinas con el
             * mismo dibujo) en vez de inventar una forma, porque *un glifo se
             * firma por gate* (§2.9); **B lo construyó con el pedido en la
             * mano y su discriminador es LA TAPA** — una costura horizontal de
             * lado a lado que ni la bolsa (`despensa`) ni el carro (`carrito`)
             * tienen, y que **sobrevive a 21 px porque es una recta**, no un
             * detalle de trazo.
             *
             * Con esto los tres momentos de la compra se distinguen en la
             * misma barra: **bolsa = la sección · carro = lo que llevás sin
             * comprar · caja = lo que ya compraste y viene en camino.** Hereda
             * el ocre de `despensa`: misma familia, otro momento.
             *
             * ⚠️ **SIN GATE DE ÍCONO todavía** — B declaró que no hay
             * rasterizador SVG en su entorno, así que **nadie lo vio a 21 px**.
             * Va al ojo del founder junto con `carrito` y `papelera`. */
            icono: ({ color, activa, colorHuella }) => (
              <Icono nombre="pedido" tinta={color} huella={colorHuella} activa={activa} />
            ),
          } satisfies BarraTabsItem,
        ]
      : []),
    {
      key: 'cuenta',
      etiqueta: t('tabs.cuenta'),
      icono: ({ color, activa, colorHuella }) => (
        <Icono nombre="cuenta" tinta={color} huella={colorHuella} activa={activa} />
      ),
    },
  ];

  /* ☠️ MURIÓ `tabDeRuta` — mapeaba `pedidos` → `despensa` mientras Pedidos
   * era una ruta sin botón. **Con su tab propia, el mapeo mentiría.** Ley 37:
   * el puente muere con la orilla que lo justificaba. */

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
      {/* ⚠️ EL MISMO ORDEN QUE `items`, Y NO POR PROLIJIDAD: son **dos listas
          que describen la misma barra**, y cuando dos listas de lo mismo
          divergen, el día que alguien lea una y edite la otra el defecto no
          tiene forma. *Acá el desorden no rompía nada hoy —la barra se dibuja
          de `items` y el activo sale de la ruta— y por eso es peor: una
          divergencia inofensiva es la que nadie corrige.* */}
      <Tabs.Screen name="hogar" />
      {/* ⚠️ EXPLORAR NO SE RETIRÓ, y de paso: acá viven **16 rutas — el flujo
          de reserva entero de los cuatro oficios**, al que empujan los cuatro
          `lib/reserva/*`. **Sacarla de esta lista habría roto las cuatro
          cadenas de reserva sin que ningún typecheck lo viera** — el modo de
          falla que esta casa llama silencioso. *Se deja escrito aunque el
          retiro ya no vaya a pasar: el próximo que quiera mover una tab tiene
          que leer que el botón y la ruta son dos cosas.* */}
      <Tabs.Screen name="explorar" />
      <Tabs.Screen name="despensa" />
      <Tabs.Screen name="pedidos" />
      <Tabs.Screen name="cuenta" />
    </Tabs>
  );
}
