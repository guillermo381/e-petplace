/**
 * EN CAMINO — la moto va hacia tu casa (S100-D · L2 · receta ⑤ de B · N14).
 *
 * TESIS: *eso de la pantalla es TU pedido*, no un mapa genérico con un punto.
 *
 * ── LA COMPOSICIÓN (receta ⑤) ──────────────────────────────────────────────
 * El mapa PRESIDE y es FONDO (`aSangre`); debajo, una banda fija con estado ·
 * ventana prometida · quién lo trae · el código de la puerta.
 *
 * 🔴 **LA BANDA NO ES UNA `Hoja`, Y ES DECISIÓN DE FORMA, NO ATAJO.** La
 * receta dice «Hoja inferior», y en esta casa `Hoja` **monta un `Modal`
 * nativo**: sirve para una DECISIÓN que se toma y se cierra. Acá la banda es
 * el estado permanente de la pantalla —se mira, no se decide— y un modal
 * sobre un mapa se lleva el foco, se puede cerrar y deja al dueño mirando un
 * mapa mudo. *La intención de la receta es «el mapa es fondo, la información
 * vive abajo», y eso se cumple con layout; montarla en Modal cumpliría la
 * palabra y rompería la intención.*
 *
 * ── ⚠️ DOS COSAS DEL MAPA ESTÁN PEDIDAS A B Y NO ESTÁN ACÁ ────────────────
 * ① **el marcador vivo es el del PASEO, no la moto** — `MapaRecorrido` en
 * modo `vivo` dibuja su propio indicador y no expone identidad; N14 pide
 * *paseo = la cara de la mascota · entrega = la moto*.
 * ② **el pin de DESTINO no se dibuja** — `PinEnMapa` recibe píxeles y el mapa
 * no expone proyección, así que desde afuera no se puede colocar.
 * ③ y con ellas, **la INTERPOLACIÓN**: con fixes cada ~60 s el marcador salta.
 *
 * **Se monta igual, y la distinción importa: la TRAYECTORIA que se dibuja es
 * verdadera.** Lo que falta es identidad visual en una pieza ajena — eso no
 * miente, está sin terminar. *Lo que no se monta es lo que mentiría.*
 *
 * ── LO QUE NO ENTRA, POR LETRA ─────────────────────────────────────────────
 * Publicidad sobre el mapa · **ETA al minuto** (*prometer un minuto que no
 * podemos cumplir es peor que no prometer*) · el pin de OTRO pedido (**dato de
 * otra persona en la pantalla de alguien**) · calificación del repartidor (no
 * la tenemos y no se inventa) · llamada directa en esta superficie.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  CodigoAEscala,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EscaleraEstados,
  MapaRecorrido,
  Separador,
  Texto,
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
import { fechaLargaHumana } from '@epetplace/i18n';
import { escaleraDePedido, type VocesEscalera } from '@/lib/despensa/escalera';
import { conIconos } from '@/lib/despensa/escalera-iconos';
import { useTraduccion } from '@/i18n';

type Fase<T> = T | 'cargando' | 'error';

/** Alto del mapa: preside sin comerse la banda. */
const ALTO_MAPA = 380;

export default function DespensaEnCamino() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();

  const [detalle, setDetalle] = useState<Fase<DetallePedido>>('cargando');
  const [ficha, setFicha] = useState<FichaRepartidor | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vive = true;
      setDetalle('cargando');
      // Las tres lecturas van en PARALELO, jamás encadenadas (N16.1): el
      // peaje por petición es fijo y no depende de cuánto traiga, así que
      // encadenarlas paga tres peajes para pintar una sola pantalla.
      void Promise.all([
        obtenerDetallePedido(pedidoId),
        obtenerCodigoEntrega(pedidoId),
      ]).then(async ([d, c]) => {
        if (!vive) return;
        setDetalle(d.ok ? d.data : 'error');
        setCodigo(c.ok ? c.data.codigo : null);
        // La ficha cuelga del ENVÍO, así que su id sale del detalle.
        if (d.ok && d.data.envio !== null) {
          const f = await obtenerFichaRepartidor(d.data.envio.envio_id);
          if (vive) setFicha(f.ok ? f.data : null);
        }
      });
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
            <Esqueleto forma="bloque" ancho="100%" alto={ALTO_MAPA} />
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
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}>
          {/* ① EL MAPA — preside y es fondo. */}
          {(() => {
            const track = detalle.envio?.track ?? null;
            if (track === null) {
              // Vacío HONESTO: no hay track todavía. No se dibuja un mapa
              // centrado en ninguna parte con un punto inventado — *un mapa
              // sin datos que igual se pinta se lee como «no se mueve»*.
              return (
                <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
                  <Texto variante="apoyo">{t('despensa.enCaminoSinTrack')}</Texto>
                </View>
              );
            }
            return (
              <MapaRecorrido
                modo="vivo"
                aSangre
                alto={ALTO_MAPA}
                // 🔴 LA ÚNICA CONVERSIÓN DE `t`, Y VIVE ACÁ POR CONTRATO.
                // El motor guarda **epoch ms** y la pieza del mapa pide
                // **ISO** (`PuntoTrackMapa.t: string`). A dejó el lector sin
                // convertir A PROPÓSITO —*un campo que cambia de unidad al
                // cruzar la frontera y conserva el nombre es el defecto que
                // el rename `ts`→`t` del paseo dejó como lección*— y su
                // condición fue: **si hace falta ISO, la conversión vive en
                // UN lugar y se declara.** Este es ese lugar.
                puntos={track.map((p) => ({
                  lat: p.lat,
                  lng: p.lng,
                  t: new Date(p.t).toISOString(),
                }))}
              />
            );
          })()}

          {/* ② LA BANDA — estado, ventana, quién lo trae, el código. */}
          <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[5], gap: spacing[5] }}>
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

            {/* LA VENTANA PROMETIDA — RANGO, jamás el minuto (N14). Y con
                desvío NO se muestra: prometer una entrega que ya no va a
                pasar es peor que no prometer. */}
            {desvioVivo(detalle) ? null : detalle.pedido.promesa_desde !== null &&
              detalle.pedido.promesa_hasta !== null ? (
              <View style={{ gap: spacing[1] }}>
                <Texto variante="seccion">{t('despensa.enCaminoVentana')}</Texto>
                <Texto variante="dato">
                  {t('despensa.promesaRango', {
                    desde: horaLocal(detalle.pedido.promesa_desde),
                    hasta: horaLocal(detalle.pedido.promesa_hasta),
                  })}
                </Texto>
                <Texto variante="apoyo">{t('despensa.enCaminoVentanaDetalle')}</Texto>
              </View>
            ) : null}

            <Separador />

            {/* ③ QUIÉN LO TRAE — F3, con TRES de cuatro.
                🔴 `null` NO se dibuja con guiones: el lector tapa DOS casos a
                propósito (el envío no es tuyo · todavía no tiene repartidor)
                para no confirmarle a un curioso que el envío existe. *Una
                ficha con tres rayas afirma «este repartidor no tiene
                nombre»; la ausencia no afirma nada.*
                Y la FOTO no está por letra: vive en `cuenta-documentos`, el
                bucket de las cédulas — es deuda con dueño, no un permiso que
                falta. **No se pone un avatar genérico con cara: eso sería el
                verosímil-falso con rostro.** */}
            {ficha === null ? null : (
              <View style={{ gap: spacing[1] }}>
                <Texto variante="seccion">{t('despensa.enCaminoQuienTrae')}</Texto>
                <Texto variante="cuerpo">{ficha.nombre}</Texto>
                {ficha.vehiculo_placa === null ? null : (
                  <Texto variante="dato">
                    {t(
                      ficha.vehiculo_tipo === 'carro'
                        ? 'despensa.vehiculoCarro'
                        : 'despensa.vehiculoMoto',
                    )}
                    {' · '}
                    {ficha.vehiculo_placa}
                  </Texto>
                )}
              </View>
            )}

            {/* ④ EL CÓDIGO DE LA PUERTA (F2) — con su voz de CUÁNDO darlo. */}
            {codigo === null ? null : (
              <View style={{ gap: spacing[1] }}>
                <CodigoAEscala codigo={codigo} etiqueta={t('despensa.codigoPuerta')} />
                <Texto variante="apoyo">{t('despensa.codigoPuertaDetalle')}</Texto>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/** Hay desvío ⟺ el camino se interrumpió. Se calcula con la MISMA función que
 *  dibuja la escalera: dos criterios para lo mismo divergen. */
function desvioVivo(d: DetallePedido): boolean {
  return d.pedido.narrativa === 'no_llego' || d.pedido.narrativa === 'cancelado';
}
