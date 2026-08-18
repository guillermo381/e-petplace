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

import { useCallback, useMemo, useRef, useState } from 'react';
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
  CodigoAEscala,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EscaleraEstados,
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
  const [reintento, setReintento] = useState(0);

  // ── LA FÍSICA DE LA HOJA — calcada de `paseo/[atencionId]`, que a su vez la
  //    calcó de `Hoja`. El contenedor TRASLADA (translateY), jamás
  //    teletransporta: la hoja que sube MUESTRA que hay más abajo.
  const extendidaRef = useRef(false);
  const [, setExtendida] = useState(false);
  const despl = useSharedValue(altoPantalla); // entra deslizando desde abajo
  const extAlto = useSharedValue(0); // alto medido del bloque plegable
  const desplBase = useSharedValue(0); // ancla del arrastre en curso
  const estiloHoja = useAnimatedStyle(() => ({ transform: [{ translateY: despl.value }] }));

  const fijarExtendida = useCallback((v: boolean) => {
    extendidaRef.current = v;
    setExtendida(v);
  }, []);

  const irA = useCallback(
    (abierta: boolean) => {
      despl.value = withSpring(abierta ? 0 : Math.max(extAlto.value - PEEK, 0), {
        duration: motion.duration.estandar,
        dampingRatio: 0.85,
      });
      fijarExtendida(abierta);
    },
    [despl, extAlto, fijarExtendida],
  );

  /** El bloque plegable se mide al layout: fija el imán «asomada» con su PEEK
   *  y re-ancla si el contenido cambió (la ficha del repartidor llega
   *  después que el resto — su id sale del envío). */
  const medirPlegable = useCallback(
    (e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      if (h === extAlto.value) return;
      extAlto.value = h;
      if (!extendidaRef.current) {
        despl.value = withSpring(Math.max(h - PEEK, 0), {
          duration: motion.duration.estandar,
          dampingRatio: 0.85,
        });
      }
    },
    [despl, extAlto],
  );

  /** Arrastre sobre el asa Y la cabecera; las dos posiciones son imanes y la
   *  velocidad de salida decide (receta `Hoja`: 800). El clic sigue vivo. */
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          desplBase.value = despl.value;
        })
        .onChange((e) => {
          const v = desplBase.value + e.translationY;
          despl.value = Math.min(Math.max(v, 0), Math.max(extAlto.value - PEEK, 0));
        })
        .onEnd((e) => {
          const asomada = Math.max(extAlto.value - PEEK, 0);
          const abrir = e.velocityY < -800 ? true : e.velocityY > 800 ? false : despl.value < asomada / 2;
          despl.value = withSpring(abrir ? 0 : asomada, {
            duration: motion.duration.estandar,
            dampingRatio: 0.85,
          });
          scheduleOnRN(fijarExtendida, abrir);
        }),
    [despl, desplBase, extAlto, fijarExtendida],
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
                backgroundColor: theme.bg.base,
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
                boxShadow: theme.elevacion.elevada,
              },
              estiloHoja,
            ]}
          >
            <GestureHandlerRootView>
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
                <View>
                  <Pressable
                    onPress={() => irA(!extendidaRef.current)}
                    accessibilityRole="button"
                    accessibilityLabel={t('despensa.enCaminoHojaVerMas')}
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
                    <View
                      style={{
                        paddingHorizontal: spacing[5],
                        paddingBottom: spacing[3],
                        gap: spacing[1],
                      }}
                    >
                      <CodigoAEscala codigo={codigo} etiqueta={t('despensa.codigoPuerta')} />
                      <Texto variante="apoyo">{t('despensa.codigoPuertaDetalle')}</Texto>
                    </View>
                  )}
                </View>
              </GestureDetector>

              {/* PLEGABLE — lo que cuenta el resto del pedido. SIEMPRE montado
                  (la hoja lo revela trasladándose); su alto medido fija el
                  imán. `flexShrink` es lo que hace que el `maxHeight` de la
                  hoja lo ACOTE, y un `ScrollView` sin altura acotada no
                  scrollea: se recorta — y en pantalla eso se ve idéntico a
                  una zona muerta de gesto. */}
              <View onLayout={medirPlegable} style={{ flexShrink: 1 }}>
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

                  <Separador />

                  {/* ④ QUIÉN LO TRAE — la ficha, sobre la anatomía MEDIDA de
                      `referencia-uber-tarjeta-del-conductor.jpeg`: la ficha es
                      **una carta**, la **placa manda arriba**, el vehículo va
                      debajo en apoyo, el nombre abajo, y **la foto es un
                      círculo a la izquierda**.

                      🔴 `null` NO se dibuja con guiones: el lector tapa DOS
                      casos a propósito (el envío no es tuyo · todavía no tiene
                      repartidor) para no confirmarle a un curioso que el envío
                      existe. *Una ficha con tres rayas afirma «este repartidor
                      no tiene nombre»; la ausencia no afirma nada.* */}
                  {ficha === null ? null : (
                    <Tarjeta relleno="amplio">
                      <View style={{ gap: spacing[2] }}>
                        <Texto variante="apoyo">{t('despensa.enCaminoQuienTrae')}</Texto>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                          {/* 🔴 EL HUECO DE LA FOTO, MARCADO Y DIGNO — DEUDA
                              FIRMADA, NO UN OLVIDO. `repartidores.foto_path`
                              vive en `cuenta-documentos`, **el bucket de los
                              documentos de identidad**; la salida correcta no
                              es una policy fina sobre un bucket sensible, es
                              que la foto de perfil viva en SU bucket con su
                              carga y su consentimiento (fuera de S100).
                              **Se dibuja el LUGAR, no la cara.** Un avatar
                              genérico con rostro sería el verosímil-falso más
                              caro que existe acá: *quien espera en la puerta
                              compararía una cara que nadie eligió.* El día que
                              la foto llegue, entra en este círculo y nada más
                              se mueve. */}
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: radius.full,
                              backgroundColor: theme.bg.hundido,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            accessible
                            accessibilityLabel={t('despensa.repartidorSinFoto')}
                          >
                            <Icono
                              nombre="cuenta"
                              tamano={22}
                              registro="tinta"
                              tinta={theme.text.tertiary}
                            />
                          </View>
                          <View style={{ flex: 1, gap: spacing[0.5] }}>
                            {/* 🔴 LA PLACA MANDA. Medido por B en aparato antes
                                de esta vuelta: el nombre salía en 24.2 dp y la
                                placa en 18.8 dp gris — el elemento más chico y
                                más apagado de la ficha. La referencia de Uber
                                la pone **arriba y en el cuerpo más grande de la
                                tarjeta**, y el porqué está en nuestro propio
                                README: *«la placa es lo que se verifica en la
                                calle, no la cara»* — y encima **nuestra ficha
                                no tiene foto**, así que el nombre no alcanza ni
                                para reconocer a nadie.

                                ⚠️ **Y NO SUBE A `CodigoAEscala`, A PROPÓSITO.**
                                En esta misma hoja vive el CÓDIGO DE LA PUERTA
                                en esa escala, y dos números mono grandes donde
                                **uno se DICE y el otro se VERIFICA** es cómo
                                alguien le dice la placa al repartidor. *Una
                                jerarquía que se arregla creando una confusión
                                peor no está arreglada.* */}
                            {ficha.vehiculo_placa === null ? (
                              <Texto variante="cuerpo">{ficha.nombre}</Texto>
                            ) : (
                              <>
                                <Texto variante="datoMd">{ficha.vehiculo_placa}</Texto>
                                <Texto variante="apoyo">
                                  {t(
                                    ficha.vehiculo_tipo === 'carro'
                                      ? 'despensa.vehiculoCarro'
                                      : 'despensa.vehiculoMoto',
                                  )}
                                </Texto>
                                {ficha.nombre === null ? null : (
                                  <Texto variante="apoyo">{ficha.nombre}</Texto>
                                )}
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                    </Tarjeta>
                  )}
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
