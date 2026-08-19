/**
 * EN CAMINO — la moto va hacia tu casa (S100-D · L2 · receta ⑤ de B · N14).
 *
 * TESIS: *eso de la pantalla es TU pedido*, no un mapa genérico con un punto.
 *
 * ── LA COMPOSICIÓN ─────────────────────────────────────────────────────────
 * El mapa es EL FONDO —ocupa el lienzo entero—; **el rango FLOTA arriba** y la
 * **HOJA ARRASTRABLE** se apoya abajo con el código de la puerta a la vista.
 * *Los dos datos por los que la familia abre esta pantalla se ven sin mover
 * un dedo, y el mapa se queda con todo el medio.*
 *
 * 🔴 **S100c-D · LOS TRES CAMBIOS DE ESTA VUELTA, Y LOS TRES SALEN DE MEDIR
 * LA REFERENCIA EN VEZ DE DESCRIBIRLA** (la ley que S99 pagó con ocho gates):
 *
 * **① LA HOJA SE ARRASTRA.** Firma del founder: *«una pantalla desplegable que
 * yo pueda subir para ver todos los detalles del pedido o bajar para ver el
 * mapa — como lo tenemos en paseo»*. **Y «como en paseo» es literal:** la
 * física es la de `paseo/[atencionId].tsx:110-190`, calcada de `Hoja` —
 * `Gesture.Pan` + `withSpring {dampingRatio .85}`, **dos imanes**, **umbral de
 * velocidad 800**, `PEEK = 26` y el arrastre sobre el asa **y** la cabecera.
 * **Cero mecanismo nuevo**: se consume el de la casa, que ya pasó cinco
 * pasadas de gate en S81-B. *Inventar una segunda física de hoja es cómo dos
 * pantallas vecinas empiezan a moverse distinto.*
 *
 * ⚠️ **CON UNA EXCEPCIÓN, Y LA CAZÓ EL LINT:** copié también su
 * `motion.duration.legacy_normal` (250) y **R51 lo rebotó**. El vocabulario
 * firmado de N10 es `fast 150 · estandar 300 · grande 520`, y el token
 * asigna `estandar` a las Hojas POR NOMBRE. ⇒ va `estandar`. *La receta se
 * copia; la deuda del vecino no — y el que lo distinguió no fui yo, fue una
 * regla que existía justo para esto.*
 *
 * **② EL DESTINO SE DIBUJA — Y NO HUBO QUE CONSTRUIR NADA.** Founder: *«debería
 * ver dónde está el pedido y, si no, al menos ver dónde está la dirección de
 * entrega»*. Los tres cabos existían y **nadie los había unido**: el dato
 * (`destino_lat`/`destino_lon`, `despensa-seguimiento.ts:172`), la pieza
 * (`MapaRecorrido` `destino` + `marcadorDestino`, **implementados** en
 * `:172-179`, con el encuadre abarcando los dos extremos en `:113-127`) y esta
 * pantalla, que **no los pasaba**. *Una pieza entregada y sin consumidor muere
 * sin que nadie se entere* — y ésta la había pedido esta misma pista.
 *
 * ⏪ **Y LA CABECERA DE ESTE ARCHIVO AFIRMABA LO CONTRARIO.** Decía *«el pin de
 * DESTINO no se dibuja — `PinEnMapa` recibe píxeles y el mapa no expone
 * proyección»*. **Era cierto cuando se escribió y B lo resolvió después con
 * slots.** *La prosa del código envejece igual que la del canon, y con menos
 * testigos* — por eso se corrige acá y no se deja como nota vieja.
 *
 * **③ EL RANGO SUBE A UNA CARTA FLOTANTE.** Medido en
 * `referencia-rappi-mapa-rango-y-codigo.png`: **el rango no vive en la hoja —
 * flota arriba, sobre el mapa, en su propia carta.** Eso resuelve la tensión
 * que el gate anterior dejó abierta (*«¿el mapa preside o la hoja se lo
 * come?»*): con el rango arriba, **la hoja puede bajar sin esconder el dato
 * por el que la familia abre la pantalla.** Reversible en el gate.
 *
 * **④ N14 CIERRA — LA ENTREGA DEJA DE DIBUJARSE COMO UN PASEO.** Las dos
 * marcas del mapa son `MarcaDeMapa` (`moto` y `destino`), la pieza que B
 * separó de `PinEnMapa` para poder montarla **sin su posición** — adentro de
 * un `Marker` el «dónde» ya está resuelto.
 *
 * ⏪ **Y ACÁ ME EQUIVOQUÉ DOS VECES EN LA MISMA LÍNEA, y se cuenta:** frené el
 * glifo de la moto *«porque no existe»* —**existía**, con su silueta firmada
 * por el founder— y, mientras tanto, monté el destino con un `Icono` dentro de
 * un círculo hecho a mano: **un glifo de INTERFAZ haciendo de objeto del
 * MUNDO**, que es exactamente lo que `DIRECCION_ARTE` §6ter prohíbe (*«el mapa
 * no es interfaz, es MUNDO»*: masa y no trazo, con anillo, sin huella).
 * *El freno fue por la razón correcta y sobre una premisa falsa; y el error
 * que sí cometí lo cometí un renglón más abajo del que frené.*
 *
 * ── ⚠️ LO QUE SIGUE FALTANDO, DICHO ────────────────────────────────────────
 * **la INTERPOLACIÓN**: con fixes cada ~60 s el marcador salta. Su forma y su
 * costo están medidos en la cabecera de `MapaRecorrido.tipos.ts` — y ahora que
 * la marca se monta por slot, lo que falta es la proyección que la alimenta.
 *
 * ── LO QUE NO ENTRA, POR LETRA ─────────────────────────────────────────────
 * Publicidad sobre el mapa · **ETA al minuto** (*prometer un minuto que no
 * podemos cumplir es peor que no prometer*) · el pin de OTRO pedido (**dato de
 * otra persona en la pantalla de alguien**) · calificación del repartidor (no
 * la tenemos y no se inventa) · llamada directa en esta superficie.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Chevron,
  CodigoAEscala,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EscaleraEstados,
  FichaRepartidor as FichaRepartidorPieza,
  Icono,
  MapaRecorrido,
  MarcaDeMapa,
  Separador,
  Tarjeta,
  Texto,
  motion,
  radius,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerCodigoEntrega,
  obtenerDetallePedido,
  obtenerFichaRepartidor,
  type DetallePedido,
  type FichaRepartidor,
} from '@epetplace/api';
import { escaleraDePedido, type VocesEscalera } from '@/lib/despensa/escalera';
import { conIconos } from '@/lib/despensa/escalera-iconos';
import { useTraduccion } from '@/i18n';

type Fase<T> = T | 'cargando' | 'error';

/**
 * EL PISO DEL MAPA — la fracción del lienzo que la hoja **nunca** le quita.
 *
 * Ahora que la hoja se arrastra, este número es su TECHO: la hoja crece con su
 * contenido, el dedo la sube hasta acá y no más. *Se expresa como piso del
 * mapa y no como techo de la hoja porque lo que la tesis defiende es el mapa:
 * «eso de la pantalla es TU pedido».*
 *
 * ⚠️ **La FRACCIÓN es la firma; los dp son consecuencia.** Un mínimo en dp se
 * ve distinto en cada teléfono y es exactamente lo que produjo el defecto que
 * esta pantalla curó en S100b. El número exacto es del gate: una línea.
 */
const PISO_DEL_MAPA = 0.4;

/**
 * EL ASOMO DE LA HOJA — cuánto se ve de lo plegado cuando está abajo.
 *
 * **26 no es un número nuevo: es el de `paseo/[atencionId].tsx`**, con su
 * porqué medido en cinco pasadas de S81-B — *el corte ES la señal*: un
 * elemento interrumpido por el canto dice «hay más» quieto y siempre, mientras
 * que un asomo animado fue MUDO. Se reusa en vez de re-calibrarse: **dos
 * hojas de la misma casa que asoman distinto son dos casas.**
 */
const PEEK = 26;

/**
 * 🔴 S100d · LA MANIJA — lo único que queda a la vista con la hoja ABAJO DEL
 * TODO. Firma del founder: *«debo poder bajarla TODA, por si quiero ver el
 * mapa completo»*.
 *
 * **44 y no menos, y no es estético: es el mínimo tocable de la casa.** Si la
 * hoja se fuera del todo, volver a subirla exigiría adivinar dónde agarrarla.
 * *Una hoja que desaparece sin puerta no es un mapa a pantalla completa: es
 * contenido perdido* — y el código de la puerta vive adentro.
 */
const MANIJA = 44;

/** Las TRES posiciones de la hoja (mecanismo de Uber completo):
 *  `abajo` = el mapa es el lienzo entero · `reposo` = rango + código sin mover
 *  un dedo · `arriba` = la ficha y los detalles. */
type PosicionHoja = 'abajo' | 'reposo' | 'arriba';

export default function DespensaEnCamino() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const { height: altoPantalla } = useWindowDimensions();

  const [detalle, setDetalle] = useState<Fase<DetallePedido>>('cargando');
  const [ficha, setFicha] = useState<FichaRepartidor | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  /** El alto REAL del lienzo, medido. De acá salen el mapa y el techo de la
   *  hoja: una sola cuenta, jamás dos que deban coincidir (L-284). */
  const [altoLienzo, setAltoLienzo] = useState(0);
  /** El alto de la CABECERA de la hoja —lo que queda a la vista con la hoja
   *  abajo—, MEDIDO. Alimenta el `aireInferior` del recentrar de B: *quien
   *  monta sabe qué tapa su mapa; la pieza no.*
   *  Se mide en vez de teclearse por la misma razón que `altoLienzo`: esa
   *  cabecera crece o se achica con el código, con la voz de la regla y con
   *  el idioma, y **un número tecleado acá volvería a mentir en el primer
   *  teléfono distinto** (es el defecto que esta pantalla ya curó en S100b). */
  const [altoCabecera, setAltoCabecera] = useState(0);
  /**
   * 🔴 EL ALTO DE LA HOJA, MEDIDO EN LA HOJA — y no compuesto de partes.
   *
   * ⏪ Antes esto se armaba sumando la cabecera + el alto del plegable, y
   * **esa composición fue el defecto**: los dos insumos llegan en pasadas
   * distintas, así que hubo corridas donde los topes se calcularon con el
   * plegable todavía en cero y la hoja quedó anclada a un número que ya no
   * era. *Dos medidas que hay que sumar para obtener una tercera son dos
   * oportunidades de que la tercera esté vieja* — la familia de L-281.
   * ⇒ se mide **lo que se quiere saber**, en un solo `onLayout`.
   */
  const [altoHoja, setAltoHoja] = useState(0);
  const [reintento, setReintento] = useState(0);

  // ── LA FÍSICA DE LA HOJA — calcada de `paseo/[atencionId]`, que a su vez la
  //    calcó de `Hoja`. El contenedor TRASLADA (translateY), jamás
  //    teletransporta: la hoja que sube MUESTRA que hay más abajo.
  const posicionRef = useRef<PosicionHoja>('reposo');
  /* 🔴 S100d · EL ESTADO DEJA DE SER MUDO. Acá decía `const [, setExtendida]`
     —se escribía y no se leía— porque nada de la pantalla cambiaba al abrir.
     Ahora sí: **la señal de arrastre gira** (⌃ cuando hay más arriba, ⌄
     cuando ya está abierta) y su voz cambia con ella. *Una flecha que apunta
     siempre para el mismo lado deja de ser una señal y pasa a ser un adorno.*
     El `ref` se conserva porque el gesto lo lee desde el hilo de UI. */
  const [posicion, setPosicion] = useState<PosicionHoja>('reposo');
  const despl = useSharedValue(altoPantalla); // entra deslizando desde abajo
  /**
   * 🔴 S100d · EL IMÁN «ASOMADA», TOPADO — Y ES LA CURA DEL DEFECTO QUE DEJÓ
   * A ESTA PANTALLA SIN HOJA EN EL GATE.
   *
   * ── EL DEFECTO, con sus números medidos en aparato ─────────────────────
   * Acá el imán se calculaba `extAlto - PEEK`, o sea **sobre el alto del
   * CONTENIDO del plegable**. Pero la hoja está topada por `maxHeight`
   * (`PISO_DEL_MAPA`), y el contenido NO lo está ⇒ **cuando el contenido pasa
   * el hueco disponible, la hoja se traslada MÁS DE LO QUE MIDE y se va
   * entera abajo.** Medido en el bundle del gate: tope de la hoja **342 dp**,
   * cabecera **198**, hueco **144**; con un contenido de ~400 el traslado
   * daba **374 sobre una hoja de 342** ⇒ la hoja quedaba **por debajo del
   * borde**: invisible para el ojo y ausente para el dedo.
   *
   * ── 🔴 POR QUÉ NO ES «SE ROMPIÓ HOY» — la condición que el founder puso
   * para dejarme curar: *un mecanismo que explica el defecto de hoy tiene que
   * explicar también el ayer.* **Éste lo explica: el defecto es LATENTE desde
   * que la hoja nació** y solo se manifiesta pasado un umbral de contenido.
   * Ayer el plegable traía menos (la escalera y una ficha chica); hoy le
   * entraron **la carta de la dirección** y **la ficha de B**, y cruzó.
   * ⇒ *ni la carta ni la ficha rompieron nada: **un cambio que destapa un
   * defecto latente se lleva la culpa del defecto** (L-284).*
   *
   * ── LA CUENTA, Y CONTRA QUÉ MAGNITUD ──────────────────────────────────
   * El imán se topa contra **lo que la hoja REALMENTE mide después del
   * tope**, jamás contra el contenido:
   *     hueco   = tope de la hoja − cabecera medida
   *     asomada = min(contenido, hueco) − PEEK
   * *Topar contra el contenido sería la cuenta correcta sobre la magnitud
   * equivocada, y el mismo defecto volvería con el próximo contenido que
   * crezca* (aviso de A, adoptado).
   *
   * ── SU DISCRIMINADOR, que es lo que lo separa de curar por suerte ──────
   * El defecto **solo existe cuando `contenido > hueco`**. ⇒ el caso que
   * prueba la cura no es «la hoja se ve»: es **un plegable MÁS ALTO que el
   * hueco y la hoja igual vuelve a su lugar**. Se verifica con los tres
   * números a la vista (contenido · hueco · traslado) sobre el pedido de
   * plegable más alto — con ficha, dirección y escalera montadas.
   */
  const topeReposo = useSharedValue(0);
  const topeAbajo = useSharedValue(0);
  const desplBase = useSharedValue(0); // ancla del arrastre en curso
  const estiloHoja = useAnimatedStyle(() => ({ transform: [{ translateY: despl.value }] }));

  const fijarPosicion = useCallback((v: PosicionHoja) => {
    posicionRef.current = v;
    setPosicion(v);
  }, []);

  /** El tope de la hoja, derivado del lienzo MEDIDO — la misma cuenta que su
   *  `maxHeight`, en un solo lugar: *dos números que deben coincidir saliendo
   *  de dos cuentas distintas es la deuda que L-281 cobró cuatro veces.* */
  const topeHoja = altoLienzo * (1 - PISO_DEL_MAPA);

  /** Recalcula el imán con lo medido y re-ancla la hoja si está plegada.
   *  Se llama desde el layout del plegable Y desde el efecto de abajo: los
   *  tres insumos (lienzo, cabecera, contenido) llegan en pasadas distintas
   *  y **el último en llegar tiene que corregir a los anteriores.** */
  /** El HUECO que le queda al plegable: lo que la hoja puede darle sin pasar
   *  su tope. **También acota su altura** (ver el `maxHeight` del bloque):
   *  sin eso el scroller mide lo que mide su contenido y **no scrollea, se
   *  desborda** — medido en aparato: 475 dp de contenido en una hoja de 365,
   *  con ~330 dp inalcanzables. */
  const hueco = Math.max(topeHoja - altoCabecera, 0);

  /**
   * Recalcula LOS DOS TOPES con lo medido y re-ancla la hoja donde esté.
   *
   * **Los tres estados, con su número** (mecanismo de Uber completo):
   *  · `arriba` = **0** — la hoja entera; la ficha y los detalles.
   *  · `reposo` = **alto de la hoja − (cabecera + PEEK)** — rango y código a
   *    la vista sin mover un dedo.
   *  · `abajo`  = **alto de la hoja − MANIJA** — el mapa es el lienzo entero
   *    y queda **el asa** para volver.
   *
   * *Los tres salen de lo MEDIDO: si mañana la cabecera crece porque cambió
   * una voz, los tres se corren solos. Un tope tecleado es el que miente en
   * el primer teléfono distinto.*
   */
  const fijarTopes = useCallback(() => {
    if (altoHoja <= 0 || altoCabecera <= 0) return;
    const reposo = Math.max(altoHoja - (altoCabecera + PEEK), 0);
    const abajo = Math.max(altoHoja - MANIJA, 0);
    topeReposo.value = reposo;
    topeAbajo.value = abajo;
    // Re-ancla SIN cambiar de estado: la hoja se queda donde el dueño la
    // dejó y solo corrige su número. *Mover la hoja porque llegó un dato
    // sería la pantalla decidiendo por el dedo.*
    const destino = posicionRef.current === 'arriba' ? 0 : posicionRef.current === 'abajo' ? abajo : reposo;
    despl.value = withSpring(destino, {
      duration: motion.duration.estandar,
      dampingRatio: 0.85,
    });
  }, [altoHoja, altoCabecera, topeReposo, topeAbajo, despl]);

  /** Los dos insumos llegan por estado de React y en pasadas distintas: el
   *  último en llegar corrige al anterior. */
  useEffect(() => {
    fijarTopes();
  }, [fijarTopes]);

  /** El toque del asa CICLA hacia arriba y vuelve: abajo → reposo → arriba →
   *  reposo. *Un toque que desde arriba saltara hasta abajo del todo haría
   *  desaparecer la hoja de un golpe, y el dueño no pidió eso: pidió poder
   *  bajarla.* Bajar del todo es del ARRASTRE, que es un gesto deliberado. */
  const irAlSiguiente = useCallback(() => {
    const actual = posicionRef.current;
    // Desde `abajo` y desde `arriba` el toque va a `reposo`; desde `reposo`
    // sube. **`abajo` no es alcanzable por toque a propósito** —lo dice el
    // tipo, y el typecheck lo confirmó rebotando la rama muerta que escribí:
    // *bajar del todo es un gesto deliberado, no el efecto de un toque.*
    const destino: PosicionHoja = actual === 'reposo' ? 'arriba' : 'reposo';
    despl.value = withSpring(destino === 'arriba' ? 0 : topeReposo.value, {
      duration: motion.duration.estandar,
      dampingRatio: 0.85,
    });
    fijarPosicion(destino);
  }, [despl, topeReposo, fijarPosicion]);

  /** Arrastre sobre el asa Y la cabecera; las dos posiciones son imanes y la
   *  velocidad de salida decide (receta `Hoja`: 800). El clic sigue vivo. */
  /** Arrastre sobre el asa Y la cabecera. **TRES imanes**: el gesto decide
   *  por velocidad si la hay, y si no por cercanía. *Con tres posiciones, un
   *  umbral de "mitad" ya no alcanza: hay dos mitades.* */
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          desplBase.value = despl.value;
        })
        .onChange((e) => {
          const v = desplBase.value + e.translationY;
          // El recorrido va de ARRIBA (0) a ABAJO DEL TODO — el mismo tope
          // que el resorte, jamás un número aparte.
          despl.value = Math.min(Math.max(v, 0), topeAbajo.value);
        })
        .onEnd((e) => {
          const arriba = 0;
          const reposo = topeReposo.value;
          const abajo = topeAbajo.value;
          const actual = despl.value;
          let destino: PosicionHoja;
          if (e.velocityY < -800) {
            // Impulso hacia arriba: sube UN escalón, no salta hasta el techo.
            destino = actual > reposo ? 'reposo' : 'arriba';
          } else if (e.velocityY > 800) {
            destino = actual < reposo ? 'reposo' : 'abajo';
          } else {
            // Sin impulso manda la cercanía, con los TRES en la cuenta.
            const d = [
              { p: 'arriba' as const, v: Math.abs(actual - arriba) },
              { p: 'reposo' as const, v: Math.abs(actual - reposo) },
              { p: 'abajo' as const, v: Math.abs(actual - abajo) },
            ].sort((x, y) => x.v - y.v);
            destino = d[0].p;
          }
          despl.value = withSpring(
            destino === 'arriba' ? arriba : destino === 'reposo' ? reposo : abajo,
            { duration: motion.duration.estandar, dampingRatio: 0.85 },
          );
          scheduleOnRN(fijarPosicion, destino);
        }),
    [despl, desplBase, topeReposo, topeAbajo, fijarPosicion],
  );

  useFocusEffect(
    useCallback(() => {
      let vive = true;
      setDetalle('cargando');
      // Las lecturas van en PARALELO, jamás encadenadas (N16.1): el peaje por
      // petición es fijo y no depende de cuánto traiga, así que encadenarlas
      // paga tres peajes para pintar una sola pantalla.
      void Promise.all([obtenerDetallePedido(pedidoId), obtenerCodigoEntrega(pedidoId)]).then(
        async ([d, c]) => {
          if (!vive) return;
          setDetalle(d.ok ? d.data : 'error');
          setCodigo(c.ok ? c.data.codigo : null);
          // La ficha cuelga del ENVÍO, así que su id sale del detalle.
          if (d.ok && d.data.envio !== null) {
            const f = await obtenerFichaRepartidor(d.data.envio.envio_id);
            if (vive) setFicha(f.ok ? f.data : null);
          }
        },
      );
      return () => {
        vive = false;
      };
    }, [pedidoId, reintento]),
  );

  const horaLocal = (iso: string) =>
    new Date(iso).toLocaleTimeString(idioma === 'en' ? 'en-US' : 'es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const voces: VocesEscalera = {
    confirmado: t('despensa.pasoConfirmado'),
    preparando: t('despensa.pasoPreparando'),
    enCamino: t('despensa.pasoEnCamino'),
    entregado: t('despensa.pasoEntregado'),
    noLlego: t('despensa.desvioNoLlego'),
    noLlegoDetalle: t('despensa.desvioNoLlegoDetalle'),
    cancelado: t('despensa.desvioCancelado'),
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('despensa.enCaminoTitulo')}
        atras
        onAtras={() => router.back()}
      />

      {detalle === 'cargando' ? (
        <EsqueletoGrupo>
          <View style={{ gap: spacing[3], paddingHorizontal: spacing[5] }}>
            <Esqueleto forma="bloque" ancho="100%" alto={240} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
          </View>
        </EsqueletoGrupo>
      ) : detalle === 'error' ? (
        <EstadoVacio
          titulo={t('despensa.errorPedidoTitulo')}
          descripcion={t('despensa.errorVitrinaDetalle')}
          accion={
            <Boton
              variante="secundario"
              etiqueta={t('hogar.reintentar')}
              onPress={() => setReintento((n) => n + 1)}
            />
          }
        />
      ) : (
        // EL LIENZO — se mide a sí mismo y de ahí sale todo lo demás. El
        // `flex: 1` es lo que hace que el mapa sea FONDO: ocupa lo que queda
        // bajo el encabezado, sin que nadie teclee cuánto es.
        <View
          style={{ flex: 1 }}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            setAltoLienzo((previo) => (Math.abs(previo - h) < 0.5 ? previo : h));
          }}
        >
          {/* ① EL MAPA — FONDO A SANGRE, el lienzo entero. */}
          {(() => {
            const track = detalle.envio?.track ?? null;
            const lat = detalle.envio?.destino_lat ?? null;
            const lon = detalle.envio?.destino_lon ?? null;
            const destino = lat !== null && lon !== null ? { lat, lng: lon } : undefined;

            /* 🔴 SIN TRACK **Y** SIN DESTINO NO HAY MAPA — pero con destino sí,
               aunque la moto todavía no se mueva. Es la mitad del pedido del
               founder que la pantalla no cumplía: *«y si no, al menos ver
               dónde está la dirección de entrega, para confirmarlo antes de
               que salga»*. **Confirmar la dirección ANTES de que salga es un
               acto distinto de seguir la moto**, y no necesita track: necesita
               el punto, que ya viajaba en el lector.
               Lo que NO se dibuja sigue sin dibujarse: un mapa centrado en
               ninguna parte con un punto inventado (L-139). */
            if (track === null && destino === undefined) {
              return (
                <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
                  <Texto variante="apoyo">{t('despensa.enCaminoSinTrack')}</Texto>
                </View>
              );
            }
            // El alto sale del lienzo MEDIDO. Mientras vale 0 (el primer
            // frame, antes del layout) el mapa no se dibuja: pintarlo con
            // alto 0 y después saltar a pantalla completa es un parpadeo.
            if (altoLienzo === 0) return null;
            return (
              <MapaRecorrido
                modo="vivo"
                /* ✅ S100d · PUNTO 24① — *«el mapa NO es navegable»*.
                   **La causa no era esta pantalla y lo medí antes de pedir:**
                   `MapaRecorrido` apagaba pan y zoom en `modo="vivo"`
                   (`scrollEnabled={!esVivo}` / `zoomEnabled={!esVivo}`), y esa
                   decisión **se tomó para el PASEO** —*«el paseador no navega
                   el mapa, camina»*, dice su propia cabecera— **y la ENTREGA
                   la heredó sin que nadie volviera a hacer la pregunta**.

                   🔴 **Y la forma que volvió de B es mejor que la que pedí:**
                   yo pedí una prop de gestos; ella nombró **el eje — QUIÉN
                   MIRA**. *Una prop llamada `gestos` habría descrito el
                   síntoma; `mirada` describe la razón, y por eso la próxima
                   herencia va a ser explícita en vez de silenciosa.*
                   Con `'espectador'` entran las tres juntas y **ninguna sirve
                   sola**: pan+zoom · **el gesto suspende el auto-encuadre**
                   (sin eso, el próximo fix del GPS le arranca el mapa de la
                   mano) · **recentrar**, que es el camino de vuelta.
                   El default sigue siendo `'operador'` ⇒ **el paseo no cambia
                   una línea.**

                   ⚠️ **Solo se gatea en APARATO:** `MapaRecorrido.web.tsx` no
                   implementa nada de esto. */
                mirada="espectador"
                /* El aire del recentrar sale de la cabecera MEDIDA + el asomo,
                   que es exactamente lo que la hoja tapa cuando está abajo.
                   ⚠️ **Con la hoja ARRIBA el control puede quedar detrás de
                   ella, y se acepta declarado:** con la hoja arriba lo que se
                   está mirando es la hoja, no el mapa. *Seguir el borde de la
                   hoja mientras se arrastra pediría atar la prop al valor
                   animado — un mecanismo nuevo para un control que en ese
                   estado nadie está buscando.* */
                aireInferior={altoCabecera + PEEK}
                etiquetaRecentrar={t('despensa.enCaminoRecentrar')}
                aSangre
                alto={altoLienzo}
                // Sin destino la pieza se comporta como antes (sigue al
                // último punto); CON destino el encuadre abarca los dos
                // extremos, que es lo que convierte el movimiento en una
                // distancia que se acorta.
                destino={destino}
                // El centro cuando todavía no hay puntos: la casa. Sin esto
                // un pedido sin track abriría el mapa en el default de Quito
                // — un mapa correcto de un lugar que no es el tuyo.
                centroInicial={destino}
                /* 🔴 LAS DOS MARCAS SON `MarcaDeMapa`, Y LA PRIMERA VERSIÓN
                   DE ESTA LÍNEA ERA EL DEFECTO QUE §6ter PROHÍBE.
                   Yo había montado acá un `Icono` («hogar») dentro de un
                   círculo hecho a mano — o sea **un glifo de INTERFAZ
                   haciendo de objeto del MUNDO**, que es exactamente lo que
                   `DIRECCION_ARTE` §6ter existe para impedir: *«el mapa no
                   es interfaz, es MUNDO»* — masa y no trazo, con anillo de
                   separación y sin huella.
                   *Frené el glifo de la moto por la razón correcta y me
                   fabriqué el mismo error un renglón más abajo con la casa.*
                   Lo cazó B al contestar el pedido. Ahora las dos salen de
                   la pieza firmada, con UN solo dibujo. */
                marcadorDestino={
                  destino === undefined ? undefined : <MarcaDeMapa variante="destino" />
                }
                /* ✅ N14 CIERRA: *«paseo = la cara de la mascota · entrega =
                   la moto»*. Hasta hoy una entrega se dibujaba con el punto
                   de color del PASEO. **Mi premisa para no montarla era
                   falsa** —creí que el glifo no existía; existe, con su
                   silueta firmada por el founder, y lo que faltaba era poder
                   montarla sin su posición (`MarcaDeMapa` nació de ahí).
                   *El freno estuvo bien y la razón estaba equivocada: no
                   inventé una forma, pero tampoco fui a buscar la que había.* */
                marcadorVivo={<MarcaDeMapa variante="moto" />}
                // 🔴 LA ÚNICA CONVERSIÓN DE `t`, Y VIVE ACÁ POR CONTRATO. El
                // motor guarda **epoch ms** y la pieza pide **ISO**. A dejó el
                // lector sin convertir A PROPÓSITO —*un campo que cambia de
                // unidad al cruzar la frontera y conserva el nombre es el
                // defecto que el rename `ts`→`t` del paseo dejó como
                // lección*— y su condición fue: si hace falta ISO, la
                // conversión vive en UN lugar y se declara. Este es ese lugar.
                puntos={(track ?? []).map((p) => ({
                  lat: p.lat,
                  lng: p.lng,
                  t: new Date(p.t).toISOString(),
                }))}
              />
            );
          })()}

          {/* ② EL RANGO — CARTA FLOTANTE ARRIBA, sobre el mapa.
              Medido en `referencia-rappi-mapa-rango-y-codigo.png`: ahí el
              rango **no vive en la hoja de abajo**, flota arriba en su propia
              carta. *Es el dato por el que la familia decide quedarse en casa
              o no, y así se ve con la hoja abajo del todo.*
              RANGO, jamás el minuto (N14). Y con desvío NO se muestra:
              prometer una entrega que ya no va a pasar es peor que no
              prometer. */}
          {desvioVivo(detalle) ||
          detalle.pedido.promesa_desde === null ||
          detalle.pedido.promesa_hasta === null ? null : (
            <View
              style={{
                position: 'absolute',
                top: spacing[4],
                left: spacing[4],
                right: spacing[4],
              }}
              // El mapa vive debajo: la carta no puede comerse el gesto de
              // la zona que no ocupa (misma cura que B midió para el pie).
              pointerEvents="box-none"
            >
              <Tarjeta relleno="amplio" elevacion="elevada">
                <View style={{ gap: spacing[0.5] }}>
                  <Texto variante="apoyo">{t('despensa.enCaminoVentana')}</Texto>
                  <Texto variante="datoMd">
                    {t('despensa.promesaRango', {
                      desde: horaLocal(detalle.pedido.promesa_desde),
                      hasta: horaLocal(detalle.pedido.promesa_hasta),
                    })}
                  </Texto>
                </View>
              </Tarjeta>
            </View>
          )}

          {/* ③ LA HOJA ARRASTRABLE — el asa y el código quedan a la vista; el
              resto se sube con el dedo. Su techo se DERIVA del lienzo medido
              (`PISO_DEL_MAPA`), jamás se teclea.

              R53-DECLARADO: esto no es un pie sobre el contenido — ES el
              contenido. La hoja se dimensiona por lo que trae y topa contra un
              `maxHeight` derivado del lienzo, y **su scroll vive adentro de
              ella**. Debajo hay un MAPA de alto fijo: **fondo, no contenido que
              scrollea** ⇒ no hay dos cosas que reservar una para la otra, y el
              defecto que R53 persigue —*un pie cuyo alto el consumidor tiene
              que ESTIMAR*— es **inexpresable acá**: nadie estima nada.

              🔴 **Y montar `PantallaConPie` sería una REGRESIÓN, no un
              cumplimiento:** esa pieza mete a sus hijos en un `ScrollView` ⇒
              devolvería el mapa a ser una banda que scrollea, que es
              exactamente el defecto que S100b curó.

              ⚠️ La declaración es POR PIE, no por archivo: hoy este archivo
              tiene UN pie y UNA razón. *Si mañana alguien agrega acá un pie de
              verdad, la regla vuelve a morder, y tiene que morder.* */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                maxHeight: altoLienzo * (1 - PISO_DEL_MAPA),
                /* 🔴 S100d · PUNTO 24④ DEL GATE — firma del founder: *«fondo
                   de la hoja BLANCO, no magenta claro»*.
                   Acá decía `bg.base`, que **es** el magenta claro:
                   `papelTapiz` = pink puro al 3 % sobre el papel algodón
                   (`palette.ts:228`, S82-B r10). Sobre el mapa —que es una
                   foto del mundo, clara y neutra— ese tinte se lee como una
                   mancha, no como una superficie.
                   ⇒ va `bg.card`, que en claro **es blanco** (`light1`).
                   **Y se arregla con el TOKEN, no con un `#FFFFFF`:** la
                   hoja es una SUPERFICIE de la casa, y en oscuro y en
                   memorial tiene que seguir siendo la superficie de su tema.
                   *Teclear blanco acá curaría el tema claro y rompería los
                   otros dos, que es la clase de cura que se ve bien en la
                   captura del gate y mal en el teléfono de otro.*
                   ⚠️ Esta cura NO es QF-01. QF-01 —*«no me gusta cómo se ven
                   las cosas sobre nuestro fondo»*— sigue abierta y es de
                   vuelta propia por decisión del founder; ésta es el pedido
                   puntual que él firmó aparte, sobre ESTA hoja. */
                backgroundColor: theme.bg.card,
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
                boxShadow: theme.elevacion.elevada,
              },
              estiloHoja,
            ]}
          >
            <GestureHandlerRootView
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                setAltoHoja((previo) => (Math.abs(previo - h) < 0.5 ? previo : h));
              }}
            >
              {/* CABECERA ARRASTRABLE: asa + el código. El pan vive acá y no
                  en el scroll de abajo — *el gesto no pelea con la lista*.

                  🔴 EL CÓDIGO ES LO QUE QUEDA A LA VISTA, y la razón es de
                  uso: **es el único dato de esta pantalla que se usa EN LA
                  PUERTA**, con el repartidor delante y el teléfono en la mano;
                  todo lo demás se consulta desde el sillón. *Lo que se
                  necesita bajo presión no puede estar detrás de un gesto.*
                  La regla de CUÁNDO darlo viaja pegada abajo — separadas, la
                  regla no se lee. */}
              <GestureDetector gesture={pan}>
                <View
                  onLayout={(e) => {
                    const h = e.nativeEvent.layout.height;
                    setAltoCabecera((previo) => (Math.abs(previo - h) < 0.5 ? previo : h));
                  }}
                >
                  {/* 🔴 S100d · EL ASA SALE DEL ÁRBOL DE ACCESIBILIDAD, y no
                      es un descuido: **ahora hay DOS controles que hacen lo
                      MISMO** (el asa y la señal de arrastre de abajo), y
                      anunciar los dos le pone al lector de pantalla dos
                      botones idénticos seguidos. *Dos voces para una acción
                      no es el doble de accesible: es una lista más larga
                      donde hay que adivinar si son la misma cosa.*
                      ⇒ el asa queda como lo que es —**un tirador**, para el
                      dedo— y **el control que se anuncia es la señal, que
                      además lleva su estado** (`expanded`), cosa que el asa
                      nunca dijo. El toque del asa sigue vivo para todos. */}
                  <Pressable
                    onPress={irAlSiguiente}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{ alignItems: 'center', paddingVertical: spacing[2], minHeight: 24 }}
                  >
                    {/* El asa — anatomía CANÓNICA de `Hoja` (36×4, bg.border). */}
                    <View
                      style={{
                        width: 36,
                        height: 4,
                        borderRadius: radius.full,
                        backgroundColor: theme.bg.border,
                      }}
                    />
                  </Pressable>
                  {codigo === null ? null : (
                    /* 🔴 S100d · PUNTO 24③ — firma del founder: *«resaltar el
                       título "El código de tu entrega" para que se note que
                       se puede subir»*. Son DOS cosas en una frase y se
                       curan por separado, porque son dos defectos:

                       **(a) EL TÍTULO NO RESALTABA.** Venía como `etiqueta`
                       de `CodigoAEscala`, que lo pinta en `apoyo` — la voz
                       más chica y más apagada de la casa. ⇒ el título sale
                       de la pieza y se monta acá en `seccion`, y el bloque
                       entero pasa a una **superficie hundida**: sobre la
                       hoja blanca de 24④ el código deja de flotar sobre la
                       nada y se lee como una cosa sola. *Es la anatomía
                       medida de las dos referencias: Uber le da al PIN una
                       carta tintada propia dentro de la hoja
                       (`referencia-uber-tarjeta-del-conductor.jpeg`) y Rappi
                       le da al código su carta con la regla adentro
                       (`referencia-rappi-mapa-rango-y-codigo.png`).*
                       ⚠️ La escala del número NO se toca: sigue mono 2xl por
                       la excepción firmada de `CodigoAEscala` — este dato se
                       DICTA en una puerta, y el mono es la herramienta.

                       **(b) NO SE NOTABA QUE SUBE**, que es lo que el
                       founder está diciendo de verdad. El asa canónica es
                       36×4 en `bg.border`, y sobre blanco eso es casi nada;
                       y la única voz que decía «hay más» vivía en un
                       `accessibilityLabel` — **invisible para quien ve**.
                       *Un affordance que solo existe para el lector de
                       pantalla no es un affordance: es una nota al pie.*
                       ⇒ la voz se DIBUJA, con su chevron, y **el chevron
                       gira** con el estado (⌃ sube · ⌄ baja). */
                    <View
                      style={{
                        paddingHorizontal: spacing[5],
                        paddingBottom: spacing[2],
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: theme.bg.hundido,
                          borderRadius: radius.md,
                          padding: spacing[4],
                          gap: spacing[1],
                        }}
                      >
                        <Texto variante="seccion">{t('despensa.codigoPuerta')}</Texto>
                        <CodigoAEscala codigo={codigo} />
                        <Texto variante="apoyo">{t('despensa.codigoPuertaDetalle')}</Texto>
                      </View>
                    </View>
                  )}

                  {/* LA SEÑAL DE ARRASTRE — el mismo `onPress` que el asa, y
                      adentro del `GestureDetector`, así que también se puede
                      arrastrar desde acá. Va CENTRADA porque acompaña al asa,
                      que está centrada: dos señales del mismo gesto alineadas
                      se leen como una. `Chevron` es la pieza de la casa para
                      slots que no son una fila entera (S99-B) — el path crudo
                      está prohibido por la cabecera de `chevron.tsx`.

                      🔴 **Y VIVE AFUERA DEL `if` DEL CÓDIGO A PROPÓSITO.**
                      La primera versión la puse adentro, y eso dejaba **la
                      hoja sin una sola señal de que sube justo cuando menos
                      tiene a la vista**: sin código, lo único visible sería
                      el asa de 4 px. *El caso raro es exactamente donde el
                      affordance hace más falta, y meterlo adentro de la rama
                      del caso común es cómo un defecto se esconde de su
                      propia cura.* */}
                  <Pressable
                    onPress={irAlSiguiente}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: posicion === 'arriba' }}
                    accessibilityLabel={
                      posicion === 'arriba'
                        ? t('despensa.enCaminoHojaVerMenos')
                        : t('despensa.enCaminoHojaVerMas')
                    }
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: spacing[1],
                      paddingVertical: spacing[1],
                      paddingBottom: spacing[2],
                    }}
                  >
                    <Chevron direccion={posicion === 'arriba' ? 'abajo' : 'arriba'} lado={16} />
                    <Texto variante="apoyo">
                      {posicion === 'arriba'
                        ? t('despensa.enCaminoHojaVerMenos')
                        : t('despensa.enCaminoHojaVerMas')}
                    </Texto>
                  </Pressable>
                </View>
              </GestureDetector>

              {/* PLEGABLE — lo que cuenta el resto del pedido. SIEMPRE montado
                  (la hoja lo revela trasladándose); su alto medido fija el
                  imán. `flexShrink` es lo que hace que el `maxHeight` de la
                  hoja lo ACOTE, y un `ScrollView` sin altura acotada no
                  scrollea: se recorta — y en pantalla eso se ve idéntico a
                  una zona muerta de gesto. */}
              {/* 🔴 S100d · `maxHeight` — LA CURA DEL SCROLL, MEDIDA.
                  El `flexShrink` solo NO acotaba: medido en aparato, este
                  bloque medía **475 dp dentro de una hoja topada en 365** ⇒
                  el `ScrollView` era tan alto como su contenido, así que
                  **no tenía nada que desplazar** y ~330 dp quedaban
                  inalcanzables (la dirección y la escalera).
                  *No era arbitraje de gestos —el pan vive en la cabecera—:
                  era un scroller que nunca se acotó. Dos síntomas parecidos,
                  dos causas distintas.*
                  El tope sale del MISMO `hueco` que alimenta los imanes: una
                  sola cuenta, jamás dos que deban coincidir (L-281). */}
              <View style={{ flexShrink: 1, maxHeight: hueco > 0 ? hueco : undefined }}>
                <ScrollView
                  contentContainerStyle={{
                    paddingHorizontal: spacing[5],
                    paddingTop: spacing[2],
                    // SIN `insets.bottom`: la barra de tabs ya lo pintó y
                    // sumarlo acá lo cuenta dos veces (medido por B: el
                    // visor de una pantalla de tab termina en el filo).
                    paddingBottom: spacing[6],
                    gap: spacing[5],
                  }}
                >
                  {/* 🔴 S100d · PUNTO 24② — EL ORDEN CAMBIA, Y ESO ES LA CURA.
                      Firma del founder: *«al arrastrar no sale la ficha del
                      conductor como en Uber»* — **hoja abajo = mapa + rango ·
                      hoja arriba = la ficha completa + detalles**.

                      **Y la ficha SÍ estaba montada. Lo que fallaba era el
                      orden.** Iba última, debajo de la escalera completa y de
                      un separador, adentro de un `ScrollView` cuyo alto está
                      acotado por el techo de la hoja (`PISO_DEL_MAPA`) ⇒ **el
                      dedo abría la hoja y lo que aparecía era la escalera; la
                      ficha quedaba debajo del pliegue, detrás de un SEGUNDO
                      gesto** (el scroll interno) que nadie anuncia.
                      *Un elemento que existe pero que exige dos gestos para
                      aparecer es, para quien mira, un elemento que no está —
                      y el founder lo reportó exactamente así, con esas
                      palabras, en el punto 25.*

                      Y el orden nuevo no es gusto: es la anatomía medida de
                      `referencia-uber-tarjeta-del-conductor.jpeg` leída con
                      la firma encima. Uber ordena código → detalles → ficha;
                      **el founder pidió ficha → detalles y manda la firma**,
                      que además es lo que la espera en la puerta necesita
                      primero: *quién viene, y recién después en qué anda.*

                      ⏳ **CUANDO LLEGUE `FichaRepartidor` DE B** (punto 25,
                      contrato acordado: `nombre` · `placa` · `vehiculo` ·
                      `fotoUrl` · `etiquetaFoto` · `acciones`), esta
                      composición se reemplaza por la pieza y **el orden se
                      queda**: lo que se cura acá es la POSICIÓN, y esa no la
                      trae ninguna pieza. */}
                  {ficha === null || ficha.nombre === null ? null : (
                    <View style={{ gap: spacing[2] }}>
                      <Texto variante="apoyo">{t('despensa.enCaminoQuienTrae')}</Texto>
                      {/* ✅ S100d · LA PIEZA DE B REEMPLAZA MI COMPOSICIÓN — y
                          lo que se reemplaza es SOLO la composición: **la
                          POSICIÓN ya estaba curada** y por eso la pieza nace
                          donde se la ve. *Si hubiera llegado antes de mover el
                          orden, habría vuelto a desaparecer detrás del segundo
                          gesto, montada y todo.*

                          Mis cuatro condiciones viven adentro de la pieza como
                          ley suya —la placa manda, la placa jamás sube a
                          `CodigoAEscala`, el hueco de la foto se dibuja y
                          jamás es una cara genérica, y `placa === null` es
                          primera clase—, así que **esta pantalla dejó de ser
                          el lugar donde se sostienen**: pasaron de comentario
                          mío a regla de la casa.

                          🔴 **`nombre === null` NO DIBUJA, y es una rama que
                          hoy NO SE ALCANZA.** Medido: `repartidores.nombre` es
                          **NOT NULL** en la base ⇒ el `null` del tipo solo
                          puede venir del lector, que mapea cadena vacía a
                          `null`. *Se escribe igual porque el tipo lo admite y
                          la pieza pide `string`: dejar que TypeScript decida
                          esto con un `?? ''` pondría una ficha con el nombre
                          en blanco, que afirma «este repartidor no tiene
                          nombre».* Si algún día se alcanza, **el costo es
                          perder la placa** —el dato que se verifica en la
                          calle— y ahí la pieza necesita admitir nombre nulo:
                          queda dicho, no descubierto. */}
                      <FichaRepartidorPieza
                        nombre={ficha.nombre}
                        placa={ficha.vehiculo_placa}
                        vehiculo={
                          ficha.vehiculo_placa === null
                            ? null
                            : t(
                                ficha.vehiculo_tipo === 'carro'
                                  ? 'despensa.vehiculoCarro'
                                  : 'despensa.vehiculoMoto',
                              )
                        }
                        etiquetaFoto={t('despensa.repartidorSinFoto')}
                      />
                    </View>
                  )}

                  {/* 🔴 S100d · PUNTO 23 — A DÓNDE VA, CON SU GLIFO DE
                      UBICACIÓN. Firma del founder: *«falta en la ESCALERA y en
                      SEGUIR EL PEDIDO el glifo de ubicación»* — y «Seguir el
                      pedido» es LITERALMENTE la puerta a esta pantalla
                      (`despensa.enCaminoEntrada`).

                      **Y acá había un hueco de verdad, no solo un glifo que
                      falta: la pantalla del seguimiento NO decía a dónde va el
                      pedido.** Lo dibujaba —el punto en el mapa— y no lo
                      DECÍA. *Un punto en un mapa se parece a todas las
                      direcciones de la cuadra; el texto es lo que deja
                      confirmar que la dirección es la tuya, que es exactamente
                      lo que el founder pidió poder hacer antes de que la moto
                      salga.* La referencia lo trae en la misma posición:
                      Uber pone «Meet at your pickup spot on Avenida Amazonas»
                      como carta de la hoja, debajo del código.

                      El glifo es `ubicacion` —la GOTA— por la dosis que B fijó
                      con F-PIN: **gota donde una ubicación se MUESTRA COMO
                      DATO; objeto del mundo (la casita, la moto) adentro del
                      mapa** (`DIRECCION_ARTE` §6ter: *el mapa no es interfaz,
                      es MUNDO*). Por eso el marcador del mapa de arriba NO
                      cambia y este sí. */}
                  {detalle.entrega.direccion === null ? null : (
                    <Tarjeta relleno="amplio">
                      <View style={{ gap: spacing[1] }}>
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}
                        >
                          <Icono nombre="ubicacion" tamano={18} />
                          <Texto variante="seccion">{t('despensa.aDonde')}</Texto>
                        </View>
                        <Texto variante="cuerpo">{detalle.entrega.direccion}</Texto>
                        {detalle.entrega.referencias === null ? null : (
                          <Texto variante="apoyo">{detalle.entrega.referencias}</Texto>
                        )}
                      </View>
                    </Tarjeta>
                  )}

                  <Separador />

                  {(() => {
                    const { pasos, desvio } = escaleraDePedido(detalle.pedido.narrativa, voces);
                    return (
                      <EscaleraEstados
                        pasos={conIconos(pasos)}
                        desvio={desvio}
                        registro="completa"
                        acento="control"
                      />
                    );
                  })()}
                </ScrollView>
              </View>
            </GestureHandlerRootView>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

/** Hay desvío ⟺ el camino se interrumpió. Se calcula con la MISMA función que
 *  dibuja la escalera: dos criterios para lo mismo divergen. */
function desvioVivo(d: DetallePedido): boolean {
  return d.pedido.narrativa === 'no_llego' || d.pedido.narrativa === 'cancelado';
}
