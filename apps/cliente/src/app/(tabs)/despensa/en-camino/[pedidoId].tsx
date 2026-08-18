/**
 * EN CAMINO — la moto va hacia tu casa (S100-D · L2 · receta ⑤ de B · N14).
 *
 * TESIS: *eso de la pantalla es TU pedido*, no un mapa genérico con un punto.
 *
 * ── LA COMPOSICIÓN (receta ⑤) ──────────────────────────────────────────────
 * El mapa es EL FONDO —ocupa el lienzo entero— y la HOJA se apoya ENCIMA,
 * anclada abajo: **rango · código de la puerta · escalera · quién lo trae**.
 * *El código va segundo y no cuarto: es el único dato que se usa EN LA PUERTA,
 * con el repartidor delante — todo lo demás se consulta desde el sillón.*
 *
 * 🔴 **S100b-D · ESTO ERA UNA BANDA Y AHORA ES UN FONDO, Y ES CAMBIO DE
 * MECANISMO, NO DE ESTILO.** La cabecera de S100 ya decía «el mapa preside y
 * es FONDO», y **no era cierto**: `aSangre` solo mata la caja de la pieza; el
 * mapa seguía siendo **un bloque de 380 dp adentro de un ScrollView**, o sea
 * una banda que scrollea. *Un comentario que declara la intención no la
 * implementa.*
 *
 * **Lo que costaba, medido, y por eso el gate lo vio:**
 *   status ~48 + Encabezado ~56 + mapa 380 + 20 + escalera vertical ~176
 *     ≈ **680 dp**, contra el filo de la barra de tabs en **699 dp** (B, con
 *     aparato) ⇒ **«LLEGA ENTRE» arrancaba a ~19 dp del borde.**
 * **El mapa solo se comía el 54 % del alto**, y lo que quedaba abajo era
 * justo el dato por el que la familia abre esta pantalla.
 *
 * ⚠️ **Y la palabra que la mesa usó para mandar la cura era la equivocada.**
 * El encargo decía *«el pie se pinta encima»* y la cura era `PantallaConPie`.
 * Medido: **esta pantalla no tiene pie fijo** (cero `position:'absolute'`; su
 * único `Boton` vive adentro del `EstadoVacio` de error) ⇒ montar esa pieza
 * habría sido **un no-op que da verde y deja el defecto vivo**. *La captura
 * de B se llamaba `…-eta-CORTADO.png`, no «tapado»: el nombre ya traía el
 * diagnóstico correcto y la cura mandada era la del otro defecto.*
 *
 * 🔴 **LA HOJA NO ES UNA `Hoja`, Y ES DECISIÓN DE FORMA, NO ATAJO.** En esta
 * casa `Hoja` **monta un `Modal` nativo**: sirve para una DECISIÓN que se toma
 * y se cierra. Acá es el estado permanente de la pantalla —se mira, no se
 * decide— y un modal sobre un mapa se lleva el foco, se puede cerrar y deja al
 * dueño mirando un mapa mudo. *La intención de la receta es «el mapa es fondo,
 * la información vive abajo», y eso se cumple con layout; montarla en Modal
 * cumpliría la palabra y rompería la intención.*
 *
 * **El alto de la hoja se DERIVA del lienzo medido, jamás se teclea** (L-284,
 * y el mismo movimiento que `PantallaConPie` hizo con su pie): la hoja crece
 * con su contenido y **el mapa nunca baja del 40 % del lienzo**. En un
 * teléfono chico la hoja se achica sola y scrollea adentro; en uno grande el
 * mapa gana el aire. *Un `alto` fijo es el número que produjo este defecto.*
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
import { fechaLargaHumana } from '@epetplace/i18n';
import { escaleraDePedido, type VocesEscalera } from '@/lib/despensa/escalera';
import { conIconos } from '@/lib/despensa/escalera-iconos';
import { useTraduccion } from '@/i18n';

type Fase<T> = T | 'cargando' | 'error';

/**
 * EL PISO DEL MAPA — la fracción del lienzo que la hoja **nunca** le quita.
 *
 * No es «el alto del mapa»: es su MÍNIMO. La hoja se dimensiona por su
 * contenido y solo topa acá; el mapa se queda con el resto, que en una hoja
 * corta es mucho más que esto. *Se expresa como piso del mapa y no como techo
 * de la hoja porque lo que la tesis defiende es el mapa: «eso de la pantalla
 * es TU pedido».*
 *
 * ⚠️ **La FRACCIÓN es la firma; los dp son consecuencia.** Un mínimo en dp se
 * ve distinto en cada teléfono y es exactamente lo que produjo el defecto que
 * esta pantalla acaba de curar. El número exacto es del gate: si el founder
 * quiere más mapa o más hoja, se mueve esta línea y nada más.
 */
const PISO_DEL_MAPA = 0.4;

export default function DespensaEnCamino() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();

  const [detalle, setDetalle] = useState<Fase<DetallePedido>>('cargando');
  const [ficha, setFicha] = useState<FichaRepartidor | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  /** El alto REAL del lienzo, medido. De acá salen el mapa y el techo de la
   *  hoja: una sola cuenta, jamás dos que deban coincidir (L-284). */
  const [altoLienzo, setAltoLienzo] = useState(0);
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
        // `flex: 1` es lo que hace que el mapa sea FONDO: ocupa lo que
        // queda bajo el encabezado, sin que nadie teclee cuánto es.
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
            if (track === null) {
              // Vacío HONESTO: no hay track todavía. No se dibuja un mapa
              // centrado en ninguna parte con un punto inventado — *un mapa
              // sin datos que igual se pinta se lee como «no se mueve»*.
              // Va arriba del todo: sin mapa, el fondo no existe y la hoja
              // se apoya sobre la pantalla.
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

          {/* ② LA HOJA — ENCIMA del mapa, anclada abajo. Su alto lo pone su
              contenido y solo topa contra el piso del mapa (`PISO_DEL_MAPA`).
              El scroll vive ADENTRO: si el contenido no entra, se desliza la
              hoja, jamás la pantalla. */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: altoLienzo * (1 - PISO_DEL_MAPA),
              backgroundColor: theme.bg.base,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              boxShadow: theme.elevacion.elevada,
            }}
          >
            {/* ⏪ **ACÁ VIVÍA UN RIESGO DECLARADO QUE LA MEDICIÓN MATÓ, y
                se cuenta en vez de borrarse.** A calculó por aritmética sobre
                la fuente que a toda pantalla de tab le faltaban **53 dp** de
                reserva (`BarraTabs` dibuja `ALTO_FILA 85 + insets.bottom` y las
                pantallas reservan `insets.bottom + spacing[8] 32`, con los
                insets cancelándose). Yo lo dejé escrito como rojo abierto
                porque, de ser cierto, **lo tapado en esta hoja era el CÓDIGO DE
                LA PUERTA**.

                **B lo midió en el aparato y son CERO:** el `ScrollView` de una
                pantalla de tab tiene bounds `y=[254, 1966]` ⇒ **su viewport
                termina en 699.0 dp, exactamente el filo de la barra.** *El
                navegador ya reserva ese alto.* La aritmética era correcta y la
                premisa no — que es lo que A había advertido de su propio
                número.

                ⇒ **Y de ahí sale esta línea:** si la barra ya absorbió el
                `insets.bottom`, sumarlo acá lo cuenta **dos veces** — el pie de
                esta hoja vive *arriba* de la barra, no contra el filo de la
                pantalla. Es la cara «sobra» del mismo malentendido, y es el
                aire muerto que el founder ve en G-12. **Se saca.** */}
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: spacing[5],
                paddingTop: spacing[5],
                paddingBottom: spacing[6],
                gap: spacing[5],
              }}
            >
              {/* 🔴 EL RANGO VA PRIMERO, Y ESE ES EL CAMBIO DE ORDEN.
                  Antes cerraba la banda detrás de la escalera y quedaba
                  fuera de pantalla. **Es el dato por el que la familia abre
                  esta pantalla** —quedarse en casa o no—, así que preside la
                  hoja y se ve sin deslizar nada.
                  RANGO, jamás el minuto (N14). Y con desvío NO se muestra:
                  prometer una entrega que ya no va a pasar es peor que no
                  prometer. */}
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

              {/* 🔴 ② EL CÓDIGO DE LA PUERTA (F2) — SUBIÓ DE CUARTO A
                  SEGUNDO, y la razón es de uso, no de estética.
                  **Es el único dato de esta pantalla que se usa EN LA PUERTA**
                  —con el repartidor delante y el teléfono en la mano—; todo lo
                  demás se consulta antes y desde el sillón. *Lo que se necesita
                  bajo presión no puede estar al final de una hoja que hay que
                  desplegar.* La vara de Rappi lo pone arriba con su regla
                  pegada, y ésa es la referencia declarada.
                  `[IMPRESIÓN]` de B, tomada por mí y **reversible en el gate**:
                  es un reordenamiento, no una pieza.
                  La regla de CUÁNDO darlo viaja pegada abajo — separadas, la
                  regla no se lee. */}
              {codigo === null ? null : (
                <View style={{ gap: spacing[1] }}>
                  <CodigoAEscala codigo={codigo} etiqueta={t('despensa.codigoPuerta')} />
                  <Texto variante="apoyo">{t('despensa.codigoPuertaDetalle')}</Texto>
                </View>
              )}

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
                  <Texto variante="apoyo">{t('despensa.enCaminoQuienTrae')}</Texto>
                  {/* 🔴 S100b-D · LA PLACA MANDA, Y LA JERARQUÍA ESTABA
                      INVERTIDA. Medido por B en aparato: el nombre salía en
                      **24.2 dp** y la placa en **18.8 dp gris** — el elemento
                      más chico y más apagado de la ficha.
                      Nuestro propio README de referencias dice de Uber: *«la
                      ficha de quien llega, con LA PLACA MANDANDO … porque la
                      placa es lo que se verifica en la calle, no la cara»*.
                      **Quien espera en la puerta no compara caras: compara
                      placas** — y encima nuestra ficha **no tiene foto** (la
                      del repartidor vive en el bucket de las cédulas), así que
                      el nombre no alcanza ni para reconocer a nadie.
                      ⇒ la placa sube a `datoMd` y el nombre baja a `apoyo`.

                      ⚠️ **Y NO SUBE MÁS QUE ESO, A PROPÓSITO.** La tentación
                      era `CodigoAEscala` (mono a `2xl`), que es lo que manda
                      de verdad. **Pero en esta misma hoja vive el CÓDIGO DE LA
                      PUERTA en esa escala**, y dos números mono grandes en una
                      pantalla donde uno se DICE y el otro se VERIFICA es cómo
                      alguien le dice la placa al repartidor. *Una jerarquía
                      que se arregla creando una confusión peor no está
                      arreglada.* La placa manda dentro de su ficha; el código
                      sigue mandando en la pantalla. */}
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
                        {' · '}
                        {ficha.nombre}
                      </Texto>
                    </>
                  )}
                </View>
              )}

            </ScrollView>
          </View>
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
