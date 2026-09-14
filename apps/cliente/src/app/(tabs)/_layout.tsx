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
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalSearchParams, Tabs, useRouter, useSegments } from 'expo-router';
import { StackActions } from 'expo-router/react-navigation';
import {
  ALTO_FILA_TABS,
  BarraTabs,
  BotonAsistente,
  type AtajoAsistente,
  Icono,
  type BarraTabsItem,
} from '@epetplace/ui';
import { nexoVisibleEn } from '@/lib/nexo/estado';
import { registrarProfundidad, registrarToqueDeTab } from '@/lib/medicion/montajes';
import { recargarHogar, useHogarVivo } from '@/lib/nexo/hogar-vivo';
import { focoNexo, ORDEN_DE_PATA } from '@/lib/nexo/atajos';
import { ElegirMascotaHoja } from '@/components/nexo/elegir-mascota-hoja';
import { RegistrarPesoHoja } from '@/components/registrar-peso-hoja';

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

/* ☠️ **`CLAVE_YA_COMPRO` MURIÓ (S116-C lote 3).** Era la marca que evitaba
 * que la barra saltara de cuatro a cinco tabs en el primer arranque. **Con la
 * quinta fija, el salto no puede ocurrir** ⇒ la marca dejó de tener objeto y
 * se retira en el mismo acto (`L-395`). *Lo que se retira no es la cura: es su
 * causa, y ésa es la forma buena de matar un puente.*
 * ⚠️ La clave `epp.cliente.tienePedidos.v1` queda escrita en los teléfonos que
 * ya la tengan. No se limpia: es un booleano inerte de 1 byte y un barrido
 * costaría más que dejarlo. */


/**
 * ⭐ **EL BOTÓN DEL ASISTENTE — S116-C lote 3, firma de la mesa.**
 *
 * ☠️ **ACÁ VIVÍAN `PresenciaSinCoach` Y `NexoDelShell`, Y MUEREN EN ESTE
 * COMMIT.** La revisión de mesa 1 (13-sep-2026) lo firmó así:
 * *«El orbe morado del coach que flota sobre el contenido (tapa "Ver cómo
 * va"). Lo reemplaza el botón del asistente en el lote 3»* — y el encargo del
 * lote lo repite: **no conviven**. El retiro y el montaje van en el mismo
 * commit (`L-395`: un puente que sobrevive a su río manda al próximo a
 * construir otro).
 *
 * ── 🔴 LO QUE SE VA CON EL ORBE, Y NO ES SÓLO UN DIBUJO ────────────────────
 *
 * El orbe **no era sólo el asistente**: era la única puerta flotante de tres
 * cosas más. Se declara entero porque **una pérdida que no se nombra se
 * descubre en producción**:
 *
 *   ① **el carrito flotante** (`ClasePastilla` = `pedidos`). 🔴 **Choca contra
 *      firma del founder S100d-bis**, literal: *«si salgo de Despensa, se
 *      pierde el carro; mientras tenga productos debe estar visible en TODA la
 *      app»*. **Hoy su puerta flotante deja de existir**; el carrito sigue
 *      alcanzable por la tab Despensa. *Son dos firmas que se contradicen y no
 *      se resuelve en silencio: la mesa decide dónde vuelve.*
 *   ② **los mensajes de adopción** (`chat`) y ③ **las solicitudes**: su badge
 *      flotante se retira. Siguen en `/adoptar/solicitudes`.
 *   ④ **los cuatro atajos del coach** (registrar peso, elegir mascota…) y con
 *      ellos `ElegirMascotaHoja` y `RegistrarPesoHoja` **en este shell** — las
 *      dos piezas siguen vivas y montadas donde ya estaban.
 *
 * ⚠️ **En memorial el orbe tenía una razón propia** —*«el carrito y los
 * mensajes conservan su única puerta también acá»*— que este retiro **no
 * reemplaza**. Queda declarado para la mesa.
 *
 * ── DÓNDE SE VE, Y POR QUÉ SON DOS CONDICIONES ────────────────────────────
 *
 * *«El botón del asistente flota en toda raíz»* ⇒ **raíz Y superficie
 * permitida**, que son dos preguntas distintas:
 *   · **raíz** — la profundidad del stack de la tab activa es 0. En una
 *     pantalla empujada lo único fijo abajo es el CTA (firma de la mesa).
 *   · **superficie** — `nexoVisibleEn()` ya lista las que lo excluyen con su
 *     razón (la cámara del carnet, las llamadas, los checkouts, el carrito).
 *     *Esa lista no se reescribe: sigue siendo cierta y sigue teniendo dueño.*
 */
function AsistenteDelShell({ raiz }: { raiz: boolean }) {
  const { t } = useTraduccion();
  const router = useRouter();
  const segmentos = useSegments() as string[];
  const params = useGlobalSearchParams<{ mascotaId?: string }>();
  const mascotas = useHogarVivo();

  const [eligiendoPeso, setEligiendoPeso] = useState(false);
  const [pesoDe, setPesoDe] = useState<{ id: string; nombre: string } | null>(null);

  /* ⭐ **S116-C lote 7 · EL BOTÓN ABRE UNA HOJA, NO LA PANTALLA.**
   *
   * ⏪ Empujaba directo a `/nexo`. **La hoja de B es del SHELL y la usa toda
   * raíz** (firma de la mesa), así que el toque abre los cuatro dedos y el
   * campo de preguntar; `/nexo` sigue existiendo y se llega desde el campo.
   *
   * **Los cuatro atajos salen de `lib/nexo/atajos.ts`, del objeto y no de una
   * lista escrita acá** — `ORDEN_DE_PATA` ya fija cuáles y en qué orden
   * (`peso → vacuna → antiparasitario → foto`). *Dos listas de lo mismo
   * divergen, y ésta ya existía.*
   *
   * **A dónde va cada uno, con el mapeo que la mesa dictó:**
   *   · `vacuna` → **el carné** (*«carné es vacuna»*)
   *   · `foto`   → **el recuerdo** (*«recuerdo es foto»*)
   *   · `antiparasitario` → su pantalla propia
   *   · `peso`   → **no tiene pantalla**: vive en una Hoja del perfil. Se monta
   *     acá, que es donde vivía con el orbe.
   *
   * 🔴 **Las tres rutas NO reciben `mascotaId` a propósito.** Medido: las tres
   * lo declaran opcional y **resuelven la mascota ellas mismas**. *Pasárselo
   * desde acá sería una segunda resolución del mismo dato, y el día que una
   * cambie de criterio las dos dejarían de coincidir sin que nada falle.* El
   * peso sí lo necesita —la Hoja pide `mascotaId`— y por eso es el único que
   * usa `focoNexo`.
   *
   * ⚠️ **`razonDeApagado` NO se consume todavía**: hoy la hoja de B no tiene
   * estado apagado por atajo. El único caso vivo es el acuario, y se declara
   * en vez de dibujar un atajo que rebota. Pedido a B junto con la captura. */
  const abrirConFoco = (accion: (m: { id: string; nombre: string }) => void) => {
    const foco = focoNexo({ mascotaIdEnRuta: params.mascotaId, mascotas });
    if (foco.modo === 'directa') { accion({ id: foco.mascota.id, nombre: foco.mascota.nombre }); return; }
    if (foco.modo === 'elegir') { setEligiendoPeso(true); return; }
    /* `cargando`, `memorial` y `ninguna`: no hay sobre quién actuar y no se
       inventa uno. La hoja se cierra y no pasa nada — *actuar sobre otra
       mascota «porque había una» es el defecto que `focoNexo` existe para
       impedir.* */
  };

  const atajos: AtajoAsistente[] = ORDEN_DE_PATA.map((a) => ({
    glifo: a,
    texto: t(`nexo.atajo_${a}` as 'nexo.atajo_peso'),
    onPress: () => {
      if (a === 'vacuna') { router.push('/carnet'); return; }
      if (a === 'antiparasitario') { router.push('/antiparasitario'); return; }
      if (a === 'foto') { router.push('/recuerdo'); return; }
      abrirConFoco((m) => setPesoDe(m));
    },
  }));

  if (!raiz || !nexoVisibleEn(segmentos)) return null;

  return (
    <>
      {/* ⭐ **S116-C lote 9 · EL ABANICO, CON SUS CUATRO ATAJOS CABLEADOS.**
          ☠️ **Muere `HojaAsistente`** —B la retiró en su lote 11 con su lápida—
          y con ella mi `setHoja`. **La razón es de contexto, no de estilo:** una
          hoja modal tapa la pantalla desde la que se la abrió, *y el contexto
          de lo que se va a preguntar ES esa pantalla*. Preguntar sobre algo no
          puede empezar por esconderlo.

          🔴 **Y lo que había acá era la variante SIN atajos.** `BotonAsistente`
          es una UNIÓN: o recibe `vozPreguntar`+`onPreguntar`+`atajos` —y monta
          el abanico él mismo—, o recibe `onPress` y hace otra cosa. Yo estaba
          en la segunda: **el botón abría, y el abanico nunca veía un atajo.**
          *No faltaba la pieza: faltaba estar del lado correcto de su unión.*

          Los cuatro salen de `ORDEN_DE_PATA`, del objeto, y **el abanico no
          trae la lista adentro a propósito** —lo dice su entrada del catálogo:
          *un atajo a «peso» en una pantalla de pago no es un atajo, es ruido*—
          así que quién los monta y cuáles es decisión de esta casa. */}
      <BotonAsistente
        etiqueta={t('nexo.etiqueta', { nombre: t('coach.nombre') })}
        atajos={atajos}
        vozPreguntar={t('nexo.placeholder')}
        /* La pieza **no pregunta**: abre la pantalla que sí sabe. */
        onPreguntar={() => router.push('/nexo')}
      />
      <ElegirMascotaHoja
        visible={eligiendoPeso}
        titulo={t('nexo.elegirMascota')}
        mascotas={mascotas ?? []}
        onElegir={(m) => { setEligiendoPeso(false); setPesoDe({ id: m.id, nombre: m.nombre }); }}
        onCerrar={() => setEligiendoPeso(false)}
      />
      {pesoDe === null ? null : (
        <RegistrarPesoHoja
          visible
          nombre={pesoDe.nombre}
          mascotaId={pesoDe.id}
          onCerrar={() => setPesoDe(null)}
          onRegistrado={() => setPesoDe(null)}
        />
      )}
    </>
  );
}

export default function TabsLayout() {
  const { t } = useTraduccion();

  /* 🔴 EL ALTO DE LA BARRA — **SE MIDE, Y ARRANCA EN EL VALOR DERIVADO.**
   *
   * Las dos mitades importan y la segunda es la lección de esta vuelta:
   *
   * ① **se mide** (`onLayout` sobre la barra real) porque su alto cambia con el
   *    inset del aparato, con el idioma de las etiquetas y con cuántas tabs
   *    hay —cuatro o cinco según haya pedidos—. *Un número tecleado acá miente
   *    en el primer teléfono distinto, y ya mintió en éste.*
   *
   * ② **arranca en `ALTO_FILA_TABS + insets.bottom`, que es la fórmula propia
   *    de `BarraTabs`** (`altoTotal = ALTO_FILA + insets.bottom`, leída de su
   *    fuente). ⚠️ **Y esto no es cinturón de más: es lo que separa esta
   *    medición de la que HOY está fallando en `Encabezado`.**
   *
   * *Medido en este mismo bundle: el techo deriva su inset con
   * `measureInWindow` y, contra un padre que aplica su padding del lado nativo,
   * **pierde la carrera y se queda con su valor de arranque — que ahí es el
   * EQUIVOCADO**, y por eso el defecto es invisible y lleva dos vueltas vivo.*
   *
   * ⇒ **la regla que dejo escrita: una medición asincrónica solo es segura si
   * su valor de arranque ya es correcto.** Con el arranque bueno, perder la
   * carrera no cuesta nada; con el arranque malo, perderla es el defecto. */
  const insets = useSafeAreaInsets();
  const [altoBarra, setAltoBarra] = useState(ALTO_FILA_TABS + insets.bottom);

  /* ⭐ EL HOGAR — **una lectura por SESIÓN**, acá y no por pantalla. Su
     condición de existencia es un dato (¿hay mascotas activas?), no una ruta.
     ⚠️ **SE CONSERVA aunque el orbe se haya ido**, y no por inercia: medido,
     `buscar.tsx` consume `useHogarVivo` y sin esta carga se quedaría vacío.
     *El orbe era un lector de este dato, no su dueño.*

     ☠️ **`escucharPendientes()` SE RETIRA CON EL ORBE.** Medido: fuera de este
     shell no tenía ningún consumidor (`usePendientesAdopcion` sólo se importaba
     acá), así que sin el orbe alimentaba a nadie. *Una suscripción viva que
     nadie lee es trabajo y batería para nada.* El dato sigue disponible en su
     lib el día que otra superficie lo monte. */
  useEffect(() => {
    void recargarHogar();
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
    /* ⭐ **ACTIVIDAD — CUARTA, Y AHORA FIJA.** Letra §1.5: *«Cinco tabs:
     * Hogar · Explorar · Despensa · Actividad · Cuenta»*, y
     * *«Actividad = citas + pedidos + postventa, en curso / historial»*.
     *
     * 🔴 **ERA CONDICIONAL Y DEJA DE SERLO — el choque se declara, no se
     * resuelve callado.** La firma S100c-D decía *«aparece con el primer
     * pedido»*, con esta razón: *«mientras no haya, el acceso vive en Cuenta»*
     * más el anti-salto (una barra que pasa de 4 a 5 tabs **re-acomoda disco y
     * valle bajo el pulgar**, porque el ancho de cada pestaña es
     * `ancho / cantidad`).
     *
     * **Por qué la letra nueva gana, y no es sólo que sea más nueva:**
     *   ① **la premisa de aquella firma era una tab VACÍA sin pedidos.** Con
     *      Actividad = citas + pedidos + postventa, *toda familia con una
     *      mascota tiene actividad* — el caso que la firma evitaba deja de
     *      existir.
     *   ② **el salto que la marca `CLAVE_YA_COMPRO` evitaba desaparece solo**:
     *      con cinco tabs fijas la barra nunca cambia de forma. *La cura vieja
     *      se vuelve innecesaria porque su causa se fue, que es mejor que
     *      mantenerla.* ⇒ ☠️ la marca muere en este commit.
     *
     * ⚠️ **HOY ABRE LA PANTALLA DE PEDIDOS, que ya existe** (encargo del lote:
     * *«su pantalla propia llega en el lote 6 — no montes un "próximamente"»*).
     * ⇒ **Sin pedidos, hoy se ve una lista de pedidos vacía.** Se declara
     * porque es exactamente lo que la firma vieja evitaba, y vive hasta el
     * lote 6. La ruta sigue llamándose `pedidos`; lo que cambia es su nombre
     * en la barra.
     *
     * **El glifo sigue siendo `pedido` y NO se inventó uno nuevo:** un glifo
     * se firma por gate del founder a 21 px (§2.9), y el de Actividad no
     * existe todavía. El de `pedido` tiene su discriminador medido por B —la
     * tapa, *una recta que sobrevive a 21 px*—. Entra a la cola del lote 6,
     * que es cuando la pantalla propia le va a dar su significado. */
    {
      key: 'pedidos',
      etiqueta: t('tabs.actividad'),
      icono: ({ color, activa, colorHuella }) => (
        <Icono nombre="pedido" tinta={color} huella={colorHuella} activa={activa} />
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
      tabBar={({ state, navigation }) => {
        /* ⭐ **LA MEDICIÓN, DERIVADA DEL ESTADO QUE YA EXISTE.** Cada ruta de
           tab lleva su propio stack; su `index` ES la profundidad. Leerla acá
           mide las cinco tabs sin tocar ninguna de las 106 pantallas — y sin
           depender de que alguien se acuerde de instrumentar la suya.
           `registrarProfundidad` es idempotente, así que llamarla en cada
           render no infla el número (su cabecera lo explica). */
        for (const r of state.routes) {
          registrarProfundidad(r.name, r.state?.index ?? 0);
        }
        /* **Raíz = el stack de la tab activa está en su fondo.** Es la
           condición que la mesa firmó para el botón del asistente y para la
           barra: *en una pantalla empujada lo único fijo abajo es el CTA*. */
        const enRaiz = (state.routes[state.index]?.state?.index ?? 0) === 0;

        /* ⭐ **LAS PANTALLAS EMPUJADAS NO LLEVAN BARRA — firma de la mesa,
         * 13-sep-2026:** *«En el sketch, detalle, agendar y pago no la tienen:
         * el CTA fijo abajo es lo único. C lo aplica en el lote 3 para todo el
         * cliente»*.
         *
         * **Se resuelve acá, en el shell, y no pantalla por pantalla.** Es una
         * regla de estructura: escrita una vez alcanza a las 106 rutas y no
         * puede divergir. *Si cada pantalla decidiera, la que nadie tocara
         * seguiría mostrándola y nadie lo notaría.*
         *
         * ⚠️ **Lo que esto cambia y hay que mirar en el recorrido:** una
         * empujada gana ~85 dp de alto. Las que fijan su CTA contra el borde
         * inferior con el inset lo siguen haciendo bien (ese cálculo no
         * dependía de la barra); las que reservaban aire con el alto de la
         * barra van a tener aire de más abajo. **No se corrigen a ciegas desde
         * acá** — se ven en el recorrido y se curan en el lote de su pantalla.
         *
         * ⚠️ **Y una consecuencia que NO es un defecto: sin barra, la única
         * salida de una empujada es su flecha** (o el gesto de atrás). Es
         * justamente lo que la firma quiere: *el CTA fijo abajo es lo único.* */
        if (!enRaiz) return null;

        return (
        <>
          {/* 🔴 EL CARRITO FLOTANTE VIVE EN EL SHELL — S100d·bis, firma del
              founder: *«si salgo de Despensa, se pierde el carro; mientras
              tenga productos debe estar visible en TODA la app, y desaparece
              cuando no tiene productos»*.

              ⏪ **Vivía por PANTALLA** (vitrina y ficha), así que salir de la
              Despensa lo perdía. **Su condición de existencia es el CARRITO,
              no la ruta** — y por eso se monta acá, una vez, sobre las cinco
              tabs.

              **Dónde se CALLA, con su razón:** `carrito` y `checkout`. *Ahí el
              carrito no es un destino: es la pantalla en la que ya estás, y
              una puerta al cuarto donde estás parado es ruido con forma de
              atajo.* **La lista es por SUPERFICIE; la existencia, por dato.**

              **El aire lo MIDE la barra**, no lo teclea nadie: su alto cambia
              con el inset del aparato y con el idioma de las etiquetas. *Un
              número acá miente en el primer teléfono distinto.*

              ⚠️ **CRUCE DE TERRITORIO DECLARADO:** este archivo es del shell
              del cliente y la pieza es de `packages/ui`. Se toca acá porque el
              montaje ES la firma —el flotante deja de ser de una pantalla— y
              se declara en vez de hacerse callado. */}
          <AsistenteDelShell raiz={enRaiz} />
          <View
            onLayout={(e) => {
              const alto = e.nativeEvent.layout.height;
              // Se ignora el 0 del primer paso: un cero mediría "no hay barra"
              // y bajaría el flotante justo donde lo tapa. El umbral evita
              // re-render por ruido de sub-píxel.
              setAltoBarra((previo) => (alto > 0 && Math.abs(previo - alto) > 0.5 ? alto : previo));
            }}
          >
          <BarraTabs
          items={items}
          activo={state.routes[state.index].name}
            onCambiar={(key) => {
            /* El OTRO número: toques de la barra. Se cuenta acá, en el mismo
               acto, y no en un efecto — un efecto contaría también los deep
               links, que no son «el dedo cambió de mundo». */
            registrarToqueDeTab(key);
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
          </View>
        </>
        );
      }}
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
