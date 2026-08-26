/**
 * TUS PEDIDOS — del más reciente al más viejo, con el seguimiento adentro
 * (S96-D · D-B4 · `LETRA_RECORRIDO_DESPENSA_S96` §8.1).
 *
 * TESIS (Ley 14): *dónde está y cuánto falta, sin abrir nada.*
 *
 * FIRMA (Ley 15): `TarjetaPedido` de B con su `EscaleraEstados` compacta —
 * la fila YA dice el estado del recorrido; abrir es para el detalle, no
 * para enterarse.
 *
 * CHANEL (Ley 16): la fila no dice el número de orden (dato de máquina —
 * vive en el detalle, donde se copia); no dice narrativa como texto suelto
 * (la escalera la DIBUJA); cero acciones en la fila (cancelar y "tengo un
 * problema" son del detalle, con su contexto).
 *
 * Las SIETE narrativas y solo las siete (el mapeo interno→familia es DATO
 * del catálogo; `revision_riesgo` se ve "Pagando" porque decirle a alguien
 * que está bajo sospecha de fraude es maltrato — `_despensa-comun.ts`).
 *
 * ESCALERA (§4b): peldaño 0 = sin pedidos, con camino a la despensa y al
 * reclamo del local · peldaño 1 = pedidos vivos con su escalera · peldaño
 * 2 = el desvío dicho (no llegó / cancelado) sin drama ni error falso.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  CeldaNavegacion,
  FiltroPills,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  PieRevelar,
  Separador,
  TarjetaPedido,
  radius,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  listarMisPedidos,
  resumenDeItemsDePedidos,
  type PedidoEnLista,
  type ResumenItemsPedido,
} from '@epetplace/api';
import { fechaLargaHumana } from '@epetplace/i18n';
import {
  escaleraDePedido,
  portadorDeEstado,
  type PortadorDeEstado,
  type VocesEscalera,
} from '@/lib/despensa/escalera';
import { conIconos } from '@/lib/despensa/escalera-iconos';
import { ventanaVencida } from '@/lib/despensa/ventana';
import { useTraduccion } from '@/i18n';

type Fase<T> = T | 'cargando' | 'error';

/** Cuántos pedidos en vuelo se muestran sin pedirlo. **Dos**, y sale de la
 *  firma: *«uno normalmente; dos si hay dos; más de dos, un "ver más"»*. */
const TOPE_VIVOS = 2;

export default function DespensaPedidos() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();

  const [pedidos, setPedidos] = useState<Fase<PedidoEnLista[]>>('cargando');
  /**
   * 🔴 S100c-D · QUÉ TRAE CADA PEDIDO — el dato que faltaba para que la lista
   * DISTINGA (D-03, firma del founder: *«dice pedido 17 de agosto, pedido 17
   * de agosto»*).
   *
   * **Medido en la cuenta del gate:** 23 pedidos en 5 días locales, **nueve
   * el 17-ago y nueve el 12-ago** ⇒ nueve tarjetas con el mismo título, dos
   * veces. Con solo el día, **1 de esas 9 es distinta**; con el nombre del
   * producto, 4.
   *
   * Va en una **segunda ola y no encadenada**: los ids salen de la primera,
   * así que no hay forma de pedirlo antes — pero el mapa se pinta igual si
   * esto falla o tarda (`{}` vacío ⇒ la tarjeta cae a su título de fecha).
   * *Una lista que no se dibuja hasta saber qué trae es peor que una que no
   * lo dice.*
   */
  const [resumen, setResumen] = useState<Record<string, ResumenItemsPedido>>({});
  const [reintento, setReintento] = useState(0);
  /** El chip de estado del HISTÓRICO. `null` = todos. */
  const [filtro, setFiltro] = useState<'entregado' | 'cancelado' | null>(null);
  /** El "ver más" de la zona viva. Arranca plegada: *dos pedidos en vuelo es
   *  lo que cabe sin que la zona deje de ser un vistazo.* */
  const [vivosRevelados, setVivosRevelados] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setPedidos('cargando');
      setResumen({});
      void listarMisPedidos().then((r) => {
        if (!vigente) return;
        setPedidos(r.ok ? r.data : 'error');
        if (!r.ok || r.data.length === 0) return;
        void resumenDeItemsDePedidos(r.data.map((p) => p.pedido_id)).then((s) => {
          if (!vigente || !s.ok) return;
          const mapa: Record<string, ResumenItemsPedido> = {};
          for (const x of s.data) mapa[x.pedido_id] = x;
          setResumen(mapa);
        });
      });
      return () => {
        vigente = false;
      };
    }, [reintento]),
  );

  const voces: VocesEscalera = {
    confirmado: t('despensa.pasoConfirmado'),
    preparando: t('despensa.pasoPreparando'),
    enCamino: t('despensa.pasoEnCamino'),
    entregado: t('despensa.pasoEntregado'),
    noLlego: t('despensa.desvioNoLlego'),
    noLlegoDetalle: t('despensa.desvioNoLlegoDetalle'),
    cancelado: t('despensa.desvioCancelado'),
  };

  /**
   * UNA TARJETA DE PEDIDO — extraída porque ahora tiene DOS consumidores:
   * la zona viva de arriba y el histórico de abajo. *Copiarla en los dos
   * lugares es cómo dos listas de la misma casa empiezan a divergir* — y la
   * de arriba y la de abajo tienen que ser reconocibles como lo mismo.
   */
  const tarjetaDe = (p: PedidoEnLista) => {
    const escalera = escaleraDePedido(p.narrativa, voces);
    const { pasos, desvio } = escalera;
    const portador = portadorDeEstado({
      narrativa: p.narrativa,
      metodoEntrega: p.metodo_entrega,
      tienePromesa: p.promesa_desde !== null && p.promesa_hasta !== null,
    });
    /* 🔴 EL TÍTULO PASA A SER **QUÉ TRAE**, Y LA FECHA BAJA A LA
       LÍNEA DE APOYO. Es el pedido literal del founder —*«necesita
       miniatura del primer producto y qué trae»*— y lo que la
       medición dice que hace falta: **la fecha no nombra nada
       cuando hay nueve el mismo día.**

       ⚠️ **Y ES REVERSIBLE EN UNA LÍNEA, declarado:** S100-D había
       decidido que *«el pedido se nombra por su FECHA, que es como
       lo nombra quien lo hizo»*. **Esa decisión seguía siendo
       buena contra el `numero_orden`** —dato de máquina, y la ley
       Chanel de la cabecera de esta pantalla lo sigue excluyendo,
       intacta— **pero no contra el producto**, que es humano y es
       lo que la familia recuerda de su compra. *Lo que cambió no
       es el criterio: es que ahora hay nueve pedidos donde antes
       la mesa imaginaba uno.*

       **La fecha NO se pierde**: viaja en la línea de apoyo junto
       a la promesa. Y si el resumen no llegó —falla o todavía
       carga— la tarjeta **cae a su título de fecha** y no queda
       nunca sin nombre. */
    const res = resumen[p.pedido_id];
    const queTrae =
      res === undefined || res.primer_item === null
        ? null
        : res.cuantos_items > 1
          ? t('despensa.pedidoTraeVarios', {
              producto: res.primer_item,
              n: res.cuantos_items - 1,
            })
          : res.primer_item;
    return (
      <TarjetaPedido
        key={p.pedido_id}
        /* 🔴 LA MINIATURA — el pedido literal del founder, y **el
           dato que de verdad separa una tarjeta de su vecina**: con
           nueve títulos iguales el mismo día, la foto es lo primero
           que el ojo distingue.

           **Se monta con `Image` y NO con `LienzoProducto`, y es
           decisión medida:** esa pieza pinta su fondo **también
           detrás de la foto** —el «marco lila» que el founder
           reportó en el carrito (H-115, cura de A)—, y acá habría
           **muchas más miniaturas juntas que en el carrito**, así
           que se vería peor. *Evitar la pieza que tiene el defecto
           es más barato que depender de que su cura viaje.*

           **`contain` y no `cover`**, copiado del criterio ya
           firmado en la vitrina: *un envase alto y una bolsa ancha
           entran enteros; `cover` recortaría justo la etiqueta, que
           es lo único que la familia usa para reconocer el
           producto.* Y `transition={0}` — Ley 13: nada se anima al
           llegar el dato.

           🔴 **SIN FOTO NO SE DIBUJA NADA**, y eso es contrato de la
           pieza: *«ausente NO reserva lugar — el hueco honesto es
           que no esté»*. Medido: **5 de 23 pedidos del gate no
           tienen foto** (161 de 470 en el catálogo) ⇒ **un cuadrado
           vacío en 1 de cada 5 filas se lee como caja rota**, y una
           caja rota es peor que no tener miniatura. */
        miniatura={
          res?.portada == null ? undefined : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.sm,
                overflow: 'hidden',
                backgroundColor: theme.bg.card,
              }}
            >
              <Image
                source={{ uri: res.portada }}
                contentFit="contain"
                style={{ width: 44, height: 44 }}
                transition={0}
                accessibilityRole="image"
              />
            </View>
          )
        }
        titulo={queTrae ?? t('despensa.pedidoDel', { dia: diaHumano(p.creado_en) })}
        detalle={
          /* Con el producto arriba, la fecha vuelve como apoyo — y si además
             hay algo que decir del estado, van separadas por el punto medio
             de la casa.
             🔴 S100d · **LA VENTANA QUE YA PASÓ** (firma del founder): la
             ventana **se conserva y se le AGREGA la voz** —es el dato contra
             el que se mide el atraso— y la voz **no atribuye culpa**: la app
             sabe que la hora pasó, no sabe por qué. */
          [
            queTrae === null ? undefined : t('despensa.pedidoDel', { dia: diaHumano(p.creado_en) }),
            detalleDe(p, portador),
            ventanaVencida(p.promesa_hasta, p.narrativa) ? t('despensa.ventanaTardando') : undefined,
          ]
            .filter((x): x is string => x !== undefined)
            .join(' · ') || undefined
        }
        /* 🔴 LA INSIGNIA — el pedido sin recorrido gana FIGURA.
           Diagnóstico de B con aparato: esas tarjetas eran «título
           + fecha + precio y nada más» al lado de vecinas con una
           escalera de cuatro nodos, y **un `apoyo` gris no alcanza
           ahí — no por tipografía, por CONTRASTE DE FORMA**: la
           vecina tiene una figura y ésta no, así que se lee como
           «le falta algo» en vez de «está en otro estado».
           *Un pedido sin recorrido no tiene una escalera vacía:
           tiene un estado.*
           El invariante que B pide —«si hay `pasos`, no pases
           `estado`»— se cumple **por construcción**: `portador`
           vale `'estado'` exactamente cuando la escalera no
           dibuja, y eso lo vigila el guard. */
        /* 🔴 S105-C · `pagando` GANA VOZ PROPIA, Y SU AUSENCIA ERA EL DEFECTO.
           ⏪ Acá iba `p.narrativa_nombre` a secas para todo portador de
           estado. **Medido: `pagando` era la ÚNICA de las siete narrativas sin
           voz de pantalla** —las otras seis ya viven en `voces`, arriba— así
           que caía a la palabra del MOTOR: «Pagando».

           **Y el catálogo dice de sí mismo que eso está mal:** su `COMMENT`
           declara que el `nombre` es *«descripción de referencia, no el copy
           final»* y que *«la voz definitiva la escribe la pantalla»* (Ley 3
           extendida). *Estábamos mostrando el vocabulario del motor justo en
           la única fila donde la persona tiene algo que hacer.*

           🔴 **Por qué importa la palabra:** «Pagando» es presente progresivo
           —dice que algo está pasando ahora—. Sobre un intento que falló hace
           días **no está pasando nada**, y la fila quedaba **indistinguible de
           un pedido comprado**. *Es la misma familia que la cita cancelada que
           parecía cumplida: una fila que se lee como algo que sí ocurrió.*

           **`atencion` y no `info`**, y es lo único que separa esta fila de
           las otras seis: las demás informan; **ésta pide algo.** *El default
           `info` de la pieza existe porque «todavía no pasó nada» no es una
           alerta — cierto para un pago en vuelo de tres segundos, falso para
           uno que quedó sin completar.*

           ⚠️ **Sin botón para completar, y NO es olvido** — ver el reporte:
           medido, **no existe camino** (el checkout no acepta una compra por
           parámetro y el detalle no ofrece pagar) **y `D-913` lo rebotaría**
           igual. *Ofrecerlo sería la Ley 23 con dos causas a la vez.* */
        estado={
          portador === 'estado'
            ? p.narrativa === 'pagando'
              ? { etiqueta: t('despensa.estadoPendientePago'), tono: 'atencion' as const }
              : { etiqueta: p.narrativa_nombre, tono: 'info' as const }
            : undefined
        }
        monto={`$ ${p.total.toFixed(2)}`}
        pasos={conIconos(pasos)}
        desvio={desvio}
        acento="control"
        etiqueta={t('despensa.verPedido')}
        onPress={() =>
          router.push({
            pathname: '/pedidos/pedido/[pedidoId]',
            params: { pedidoId: p.pedido_id },
          })
        }
      />
    );
  };


  // Las fechas hablan el idioma de la APP (vara de C ⑥): el día por el
  // riel; la hora con locale explícito — el mismo par de fechas.ts.
  const diaHumano = (iso: string) => fechaLargaHumana(iso, idioma);
  const horaLocal = (iso: string) =>
    new Date(iso).toLocaleTimeString(idioma === 'en' ? 'en-US' : 'es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    });

  /** La línea de apoyo de la fila. **La DECISIÓN no vive acá: vive en
   *  `portadorDeEstado`** — esta función solo le pone voz a lo que aquélla
   *  eligió (Ley 3: el riel habla, la lib decide).
   *
   *  🔴 **S100b-D · POR QUÉ SE MUDÓ, y es el hallazgo del gate.** El founder
   *  vio *«cuatro de seis pedidos no dicen en qué estado están»*. Acá vivían
   *  cuatro `if` en un orden, y **el orden era el defecto**: el brazo que
   *  cubría al pedido sin escalera estaba ÚLTIMO, detrás del de la promesa —
   *  y la promesa **nace con el pedido, antes del pago** (censo: 4 de 4
   *  `pagando` la tienen). ⇒ el pedido no solo quedaba mudo: **prometía una
   *  entrega sin tener el pago confirmado.**
   *
   *  Es la MISMA clase que S100 ya curó para el desvío —*prometer una entrega
   *  que ya no va a pasar*— y que llegó por el otro lado: *prometer una que
   *  todavía no está comprada.* Curar una y dejar viva la otra es lo que pasa
   *  cuando la regla es un orden de `if` y no un objeto que se pueda medir.
   *  **Por eso ahora se puede medir: `verify-s100b-d-el-estado-se-dice.ts`
   *  corre la función real y su discriminador reproduce este orden viejo y
   *  exige que falle.** */
  function detalleDe(p: PedidoEnLista, portador: PortadorDeEstado): string | undefined {
    const desde = p.promesa_desde;
    const hasta = p.promesa_hasta;
    switch (portador) {
      case 'nada':
        return undefined;
      // 🔴 EL ESTADO YA NO VIAJA POR ACÁ — lo lleva la INSIGNIA de la
      // tarjeta (ver abajo). Esta línea devuelve vacío para no decir dos
      // veces lo mismo (Chanel).
      case 'estado':
        return undefined;
      case 'retiro':
        return t('despensa.metodoRetiro');
      case 'promesa':
        // Se re-pregunta por los nulos en vez de castear: la implicación
        // «portador = promesa ⇒ las dos existen» vive en la lib y el
        // compilador no la ve. Es un ESTRECHAMIENTO, jamás un segundo
        // criterio — un `as string` acá compilaría y pintaría
        // «Invalid Date» el día que la implicación deje de valer.
        return desde === null || hasta === null
          ? undefined
          : t('despensa.promesaCorta', {
              dia: diaHumano(desde),
              desde: horaLocal(desde),
              hasta: horaLocal(hasta),
            });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* 🔴 PORTADA, NO NAVEGACIÓN — Pedidos es una CASA desde S100c, y una
          casa no tiene flecha de atrás. *Un «atrás» en la raíz de un tab
          ofrece un camino que no existe* (Ley 23), y encima `router.back()`
          desde acá saltaría a cualquier pantalla anterior. */}
      <Encabezado variante="portada" saludo={t('despensa.tusPedidos')} />

      <ScrollView
        contentContainerStyle={{
          paddingTop: spacing[4],
          // 🔴 SIN `insets.bottom`, y es CONCESIÓN MEDIDA, no gusto.
          // B midió que **el navegador ya acota**: el `ScrollView` de una
          // pantalla de tab termina en `y = 699.0 dp`, el filo exacto de la
          // barra —que a su vez ya pintó el inset del sistema—. Sumarlo acá
          // lo cuenta DOS VECES. `spacing[8]` es el aire de cola; el inset
          // era la cara «sobra» del malentendido de los 53 dp.
          // *Yo lo había defendido como «aire de cola» y C tenía razón: era
          // una línea vieja, no una posición.* Se unifica en las tres
          // pantallas — dos reglas para lo mismo divergen.
          paddingBottom: spacing[8],
          gap: spacing[4],
        }}
      >
        {pedidos === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3], paddingHorizontal: spacing[5] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={120} />
              <Esqueleto forma="bloque" ancho="100%" alto={120} />
            </View>
          </EsqueletoGrupo>
        ) : pedidos === 'error' ? (
          <EstadoVacio
            titulo={t('despensa.errorPedidosTitulo')}
            descripcion={t('despensa.errorVitrinaDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('hogar.reintentar')}
                onPress={() => setReintento((n) => n + 1)}
              />
            }
          />
        ) : pedidos.length === 0 ? (
          <>
            <EstadoVacio
              titulo={t('despensa.sinPedidosTitulo')}
              descripcion={t('despensa.sinPedidosDetalle')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('despensa.carritoVacioIr')}
                  onPress={() => router.push('/despensa')}
                />
              }
            />
            <Separador />
            <CeldaNavegacion
              titulo={t('despensa.reclamoEntrada')}
              detalle={t('despensa.reclamoEntradaDetalle')}
              onPress={() => router.push('/despensa/reclamo')}
            />
          </>
        ) : (
          /* 🔴 LA CASA: EN CURSO ARRIBA, HISTORIAL ABAJO (firma del founder,
             S100c). *Lo que todavía puede pasar algo preside; lo que ya
             terminó se consulta.* El corte es `es_terminal`, que lo dice el
             CATÁLOGO —dato del motor, no un `switch` acá—, así que el día
             que nazca una narrativa nueva cae del lado correcto sola.

             **Los dos rótulos aparecen SOLO si existen las dos secciones**:
             con una sola, rotular anuncia una división que no está (Chanel). */
          <>
            {(() => {
              /* 🔴 S100d · LA CASA SE REESTRUCTURA (firma del founder).
                 **Arriba el SEGUIMIENTO VIVO; abajo el histórico con sus
                 chips.** Y la regla que ordena el resto: *lo vivo desaparece
                 cuando no existe* — la zona de arriba **no deja hueco ni
                 estado vacío**, igual que «Ponte al día» en el Hogar.

                 **Sin duplicación, por firma:** el pedido en curso vive
                 arriba **y no se repite abajo** ⇒ los chips son
                 «Entregados · Cancelados», no «En curso». *Un pedido que
                 aparece dos veces en la misma pantalla le pide al dueño que
                 descubra que son el mismo.*

                 **El corte sigue siendo `es_terminal`** —dato del catálogo,
                 no un `switch` acá—, así que una narrativa nueva cae del
                 lado correcto sola. */
              const vivos = pedidos.filter((p) => !p.es_terminal);
              const historial = pedidos.filter((p) => p.es_terminal);
              const visiblesVivos = vivosRevelados ? vivos : vivos.slice(0, TOPE_VIVOS);
              /* Los chips salen de lo que EXISTE, jamás de un catálogo fijo:
                 *un filtro que no filtra nada es un filtro inalcanzable con
                 otro nombre* — y encima enseña que los controles de esta
                 pantalla no hacen nada (19.9, el nulo no se pinta). */
              const chips = (
                [
                  { codigo: 'entregado' as const, etiqueta: t('despensa.chipEntregados'), icono: null },
                  { codigo: 'cancelado' as const, etiqueta: t('despensa.chipCancelados'), icono: null },
                ]
              ).filter((c) => historial.some((p) => p.narrativa === c.codigo));
              const historialVisible =
                filtro === null ? historial : historial.filter((p) => p.narrativa === filtro);
              return (
                <>
                  {vivos.length === 0 ? null : (
                    <View style={{ paddingHorizontal: spacing[5], gap: spacing[4] }}>
                      {visiblesVivos.map((p) => tarjetaDe(p))}
                      {vivos.length > TOPE_VIVOS && !vivosRevelados ? (
                        <PieRevelar
                          n={vivos.length - TOPE_VIVOS}
                          onPress={() => setVivosRevelados(true)}
                        />
                      ) : null}
                    </View>
                  )}

                  {historial.length === 0 ? null : (
                    <View style={{ gap: spacing[4] }}>
                      <View style={{ paddingHorizontal: spacing[5] }}>
                        <Texto variante="seccion">{t('despensa.pedidosHistorial')}</Texto>
                      </View>
                      {chips.length === 0 ? null : (
                        /* 🔴 `envuelve` Y NO `tira`, con el número de C al
                           lado. En su tira horizontal midió **5 opciones y 4
                           alcanzables**, y una que salía con **ancho CERO**:
                           *un filtro inalcanzable es peor que uno ausente —
                           ocupa lugar y promete.* Con dos chips **no hay nada
                           que scrollear**, así que ese modo de falla queda
                           **inexpresable**, no evitado. *Elegir la
                           disposición que no puede fallar es más barato que
                           depender de que la cura del arrastre viaje.* */
                        <FiltroPills
                          opciones={chips}
                          activo={filtro}
                          onCambio={(c: 'entregado' | 'cancelado') => setFiltro(c === filtro ? null : c)}
                          disposicion="envuelve"
                        />
                      )}
                      <View style={{ paddingHorizontal: spacing[5], gap: spacing[4] }}>
                        {historialVisible.map((p) => (
                          <View key={p.pedido_id} style={{ gap: spacing[2] }}>
                            {tarjetaDe(p)}
                            {/* 🔴 S100d · PEDIR DE NUEVO — **la palanca
                                comercial de esta pantalla**, firmada por el
                                founder: *en comida de mascota la compra es
                                CÍCLICA — la bolsa se acaba cada 30-45 días.*
                                Solo en ENTREGADOS: *ofrecer repetir un pedido
                                cancelado sería ofrecer repetir algo que no
                                pasó.*

                                ⚠️ **HOY LLEVA A LA DESPENSA, NO AL PRODUCTO, y
                                se declara en vez de disimularse.** Para
                                re-armar el pedido haría falta resolver la
                                OFERTA VIGENTE de cada ítem —precio y stock de
                                HOY, no los de la compra vieja— y el lector de
                                esta lista **no trae `producto_id`**: devuelve
                                nombre, conteo y portada. *Mandar al carrito
                                con el precio de un pedido viejo sería prometer
                                una plata que el motor va a desmentir en el
                                checkout.*
                                ⇒ pedido a A: **`producto_id` en el resumen**
                                —un campo en un lector suyo que ya existe— y
                                esto pasa a llevar a la ficha en una línea. */}
                            {/* ✅ S100d · YA LLEVA A LA FICHA. A ensanchó su
                                lector con `producto_id` —**de la MISMA fila**
                                que el nombre y la portada, cero viajes
                                nuevos— y esto pasó de media palanca a
                                entera: se vuelve a comprar **al precio y con
                                el stock de HOY**.

                                🔴 **SIN `producto_id` NO SE OFRECE EL CAMINO,
                                y es contrato de A**: `null` significa que el
                                producto **ya no está publicado** ⇒ el botón
                                llevaría a una ficha que no existe. *Una
                                puerta que rebota es peor que ninguna puerta*
                                (Ley 23) — y acá rebotaría justo cuando la
                                familia quiso repetir su compra.

                                **Solo en ENTREGADOS**: ofrecer repetir un
                                pedido cancelado sería ofrecer repetir algo
                                que no pasó. */}
                            {p.narrativa === 'entregado' && resumen[p.pedido_id]?.producto_id ? (
                              <Boton
                                variante="secundario"
                                etiqueta={t('despensa.pedirDeNuevo')}
                                onPress={() =>
                                  router.push({
                                    pathname: '/despensa/producto/[productoId]',
                                    params: { productoId: resumen[p.pedido_id]!.producto_id! },
                                  })
                                }
                              />
                            ) : null}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              );
            })()}
            {/* EL ACCESO DEL LOCAL — el founder lo pidió adentro de esta casa,
                y hasta hoy vivía SOLO en el estado vacío. *Una entrada que
                existe solo cuando no tenés nada es una entrada que nadie
                encuentra el día que la necesita.* */}
            <View style={{ paddingTop: spacing[2] }}>
              <Separador />
              <CeldaNavegacion
                titulo={t('despensa.reclamoEntrada')}
                detalle={t('despensa.reclamoEntradaDetalle')}
                onPress={() => router.push('/despensa/reclamo')}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
