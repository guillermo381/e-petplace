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
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Separador,
  TarjetaPedido,
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
import { useTraduccion } from '@/i18n';

type Fase<T> = T | 'cargando' | 'error';

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
      <Encabezado
        variante="navegacion"
        titulo={t('despensa.tusPedidos')}
        atras
        onAtras={() => router.back()}
      />

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
                  onPress={() => router.back()}
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
          <View style={{ paddingHorizontal: spacing[5], gap: spacing[4] }}>
            {pedidos.map((p) => {
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
                  titulo={queTrae ?? t('despensa.pedidoDel', { dia: diaHumano(p.creado_en) })}
                  detalle={
                    queTrae === null
                      ? detalleDe(p, portador)
                      : // Con el producto arriba, la fecha vuelve como apoyo —
                        // y si además hay algo que decir del estado, van las
                        // dos separadas por el punto medio de la casa.
                        [t('despensa.pedidoDel', { dia: diaHumano(p.creado_en) }), detalleDe(p, portador)]
                          .filter((x): x is string => x !== undefined)
                          .join(' · ')
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
                  estado={
                    portador === 'estado'
                      ? { etiqueta: p.narrativa_nombre, tono: 'info' }
                      : undefined
                  }
                  monto={`$ ${p.total.toFixed(2)}`}
                  pasos={conIconos(pasos)}
                  desvio={desvio}
                  acento="control"
                  etiqueta={t('despensa.verPedido')}
                  onPress={() =>
                    router.push({
                      pathname: '/despensa/pedido/[pedidoId]',
                      params: { pedidoId: p.pedido_id },
                    })
                  }
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
