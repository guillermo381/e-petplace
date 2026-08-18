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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { listarMisPedidos, type PedidoEnLista } from '@epetplace/api';
import { fechaLargaHumana } from '@epetplace/i18n';
import { escaleraDePedido, portadorDeEstado, type VocesEscalera } from '@/lib/despensa/escalera';
import { conIconos } from '@/lib/despensa/escalera-iconos';
import { useTraduccion } from '@/i18n';

type Fase<T> = T | 'cargando' | 'error';

export default function DespensaPedidos() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [pedidos, setPedidos] = useState<Fase<PedidoEnLista[]>>('cargando');
  const [reintento, setReintento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setPedidos('cargando');
      void listarMisPedidos().then((r) => {
        if (vigente) setPedidos(r.ok ? r.data : 'error');
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
  function detalleDe(p: PedidoEnLista): string | undefined {
    const desde = p.promesa_desde;
    const hasta = p.promesa_hasta;
    const portador = portadorDeEstado({
      narrativa: p.narrativa,
      metodoEntrega: p.metodo_entrega,
      tienePromesa: desde !== null && hasta !== null,
    });
    switch (portador) {
      case 'nada':
        return undefined;
      // El NOMBRE del estado sale del catálogo —dato, no un `switch` de
      // voces acá—; el `case` solo elige QUIÉN habla.
      case 'estado':
        return p.narrativa_nombre;
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
          paddingBottom: insets.bottom + spacing[8],
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
              return (
                <TarjetaPedido
                  key={p.pedido_id}
                  titulo={t('despensa.pedidoDel', { dia: diaHumano(p.creado_en) })}
                  detalle={detalleDe(p)}
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
