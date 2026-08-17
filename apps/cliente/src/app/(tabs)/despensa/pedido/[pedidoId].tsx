/**
 * EL PEDIDO — dónde está, el código de la puerta, y la salida honesta
 * (S96-D · D-B4 · `LETRA_RECORRIDO_DESPENSA_S96` §8).
 *
 * TESIS (Ley 14): *sabés dónde está, qué decir en la puerta, y a quién
 * hablarle si algo salió mal.*
 *
 * FIRMA (Ley 15): `EscaleraEstados` completa de B — el recorrido entero
 * de un vistazo, con el desvío DICHO cuando lo hubo (no llegó / cancelado).
 *
 * ── LAS TRES REGLAS DE LA LETRA QUE VIVEN ACÁ ───────────────────────────
 *  · CANCELAR HASTA "PREPARADO" (§8.3): el corte es un hecho operativo,
 *    no un reloj — cancelar es gratis mientras nadie trabajó. En cuanto
 *    la narrativa pasa a "Preparando", el botón CAMBIA a "Tengo un
 *    problema": alguien ya trabajó y eso se conversa, no se deshace solo.
 *  · TENGO UN PROBLEMA (§8.4): va al WhatsApp del equipo hasta que exista
 *    postventa (D-774) — y el botón DICE a dónde va y en qué horario
 *    contestan. 🔏 El horario está FIRMADO por el founder (12-ago-2026):
 *    8:00–21:00 — vive en el string del riel, no acá.
 *  · EL CÓDIGO DE LA PUERTA (§0.3 · regla 7 del contrato del motor): se
 *    LEE acá (`obtenerCodigoEntrega`), jamás viaja en una notificación
 *    (ley de la pantalla bloqueada). null = todavía no hay envío, y se
 *    dice — jamás un código inventado (L-139).
 *
 * ── EL DESTINO POR ÍTEM (§4), con puente declarado ──────────────────────
 * La regla general: la app nunca adivina de quién es una compra — ofrece
 * atarla. El lector de A (`destino` por línea) está en su tanda de hoy;
 * esta pantalla lo consume con un GUARD DE RUNTIME (`'destino' in linea`)
 * para que compile hoy y se encienda solo con el merge. Si el dato no
 * viene, NO se ofrece atar a ciegas (ofrecer sobre lo ya atado sería
 * mentir); se enciende cuando la fuente exista.
 *
 * ESCALERA (§4b): peldaño 0 = pedido cancelado, sin drama · peldaño 1 =
 * el recorrido vivo con su ventana · peldaño 2 = entregado con lote por
 * ítem (el día que un fabricante retire un lote, esto es lo que avisa) y
 * el ítem suelto atándose a su mascota.
 */

import { useCallback, useMemo, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  CodigoAEscala,
  Encabezado,
  EscaleraEstados,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  SelectorOpcion,
  Separador,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  atarItemAMascota,
  cancelarPedidoDespensa,
  getEstadoOnboardingDueno,
  mascotasElegibles,
  obtenerCodigoEntrega,
  obtenerDetallePedido,
  obtenerMascotasDeFamilia,
  type DetallePedido,
  type LineaDePedido,
  type MascotaResumen,
} from '@epetplace/api';
import { fechaLargaHumana } from '@epetplace/i18n';
import { FilaMonto } from '@/components/despensa-piezas';
import { escaleraDePedido, type VocesEscalera } from '@/lib/despensa/escalera';
import { conIconos } from '@/lib/despensa/escalera-iconos';
import { CelebracionEntrega } from '@/components/celebracion-entrega';
import { urlWhatsApp, WHATSAPP_EQUIPO_HUMANO } from '@/lib/contacto';
import { useTraduccion } from '@/i18n';

type Fase<T> = T | 'cargando' | 'error';

export default function DespensaPedido() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();

  const [detalle, setDetalle] = useState<Fase<DetallePedido>>('cargando');
  const [codigo, setCodigo] = useState<string | null>(null);
  const [mascotas, setMascotas] = useState<Fase<MascotaResumen[]>>('cargando');
  const [reintento, setReintento] = useState(0);
  const [trabajando, setTrabajando] = useState(false);
  const [hojaCancelar, setHojaCancelar] = useState(false);
  /** El ítem que se está atando (Hoja del selector de mascota). */
  const [atandoItem, setAtandoItem] = useState<string | null>(null);
  const [mascotaElegida, setMascotaElegida] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void obtenerDetallePedido(pedidoId).then((r) => {
        if (vigente) setDetalle(r.ok ? r.data : 'error');
      });
      void obtenerCodigoEntrega(pedidoId).then((r) => {
        if (vigente && r.ok) setCodigo(r.data.codigo);
      });
      void (async () => {
        const estado = await getEstadoOnboardingDueno();
        if (!vigente) return;
        if (!estado.ok || !estado.data.familia_id) {
          setMascotas('error');
          return;
        }
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (vigente) setMascotas(r.ok ? r.data : 'error');
      })();
      return () => {
        vigente = false;
      };
    }, [pedidoId, reintento]),
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

  // Las fechas hablan el idioma de la APP (vara de C ⑥). Los timestamps
  // van por `fechaLargaHumana` (su rama >10 resuelve el día LOCAL — un
  // slice de la parte UTC correría el día a la noche en UTC-5).
  const horaLocal = (iso: string) =>
    new Date(iso).toLocaleTimeString(idioma === 'en' ? 'en-US' : 'es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    });
  const diaHumano = (iso: string) => fechaLargaHumana(iso, idioma);

  const elegibles = useMemo(
    () => mascotasElegibles(Array.isArray(mascotas) ? mascotas : [], null),
    [mascotas],
  );
  const nombrePorId = useMemo(() => {
    const mapa: Record<string, string> = {};
    for (const m of Array.isArray(mascotas) ? mascotas : []) mapa[m.id] = m.nombre;
    return mapa;
  }, [mascotas]);

  async function cancelar() {
    if (trabajando) return;
    setTrabajando(true);
    const r = await cancelarPedidoDespensa(pedidoId, 'cancelado_por_el_cliente');
    setTrabajando(false);
    setHojaCancelar(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('despensa.canceladoOk'), variante: 'exito' });
    setReintento((n) => n + 1);
  }

  async function atar() {
    if (trabajando || atandoItem === null || mascotaElegida === null) return;
    setTrabajando(true);
    const r = await atarItemAMascota(atandoItem, mascotaElegida);
    setTrabajando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setAtandoItem(null);
    setMascotaElegida(null);
    mostrar({
      texto: r.data.evento_depositado
        ? t('despensa.atadoConEvento')
        : t('despensa.atadoOk'),
      variante: 'exito',
    });
    setReintento((n) => n + 1);
  }

  async function abrirWhatsApp(numeroOrden: string) {
    const url = urlWhatsApp(t('despensa.problemaMensaje', { numero: numeroOrden }));
    try {
      await Linking.openURL(url);
    } catch {
      mostrar({
        texto: t('despensa.problemaFallback', { numero: WHATSAPP_EQUIPO_HUMANO }),
        variante: 'error',
      });
    }
  }

  /** El destino de una línea — REAL desde el cableo del 12-ago (el
   *  puente de runtime murió con el merge de A). */
  function destinoDe(linea: LineaDePedido) {
    return linea.destino;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('despensa.pedidoTitulo')}
        atras
        onAtras={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
          gap: spacing[5],
        }}
      >
        {detalle === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3], paddingHorizontal: spacing[5] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={160} />
              <Esqueleto forma="bloque" ancho="100%" alto={96} />
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
          <>
            {/* 0 · LA CELEBRACIÓN — solo con el pedido ENTREGADO, y una
                sola vez por pedido (la pieza lo recuerda).

                🔴 EL TERCER ACTO VA VACÍO, Y ES LA DECISIÓN MÁS IMPORTANTE
                DE ESTE LOTE. La letra dice que si «¿para quién fue?» está
                respondido, la compra deposita un evento en el expediente de
                esa mascota — y eso es cierto, pero NO para todo ítem: el
                motor gatea el depósito por `f.entra_al_expediente`, o sea
                que **la familia del producto decide** (alimento sí, juguete
                no — BIO_EXPEDIENTE E2bis).

                ⇒ Decir «quedó en el expediente de Thor» por cada ítem con
                destino sería FALSO para un juguete, y falso de la peor
                manera: **verosímil** (L-139). El lector de la familia
                (`LineaDePedido`) no trae hoy ni la familia del producto ni
                si el evento se depositó, así que la pantalla **no puede
                saberlo** — y lo que no se sabe no se afirma.

                El slot existe y espera su dato (H-07, dueño A). *Un acto
                que no tiene nada verdadero que decir no se llena con algo
                lindo: se deja callado.* */}
            {detalle.pedido.narrativa === 'entregado' ? (
              <CelebracionEntrega
                pedidoId={detalle.pedido.pedido_id}
                titulo={t('despensa.celebracionLlego')}
                cierre={(() => {
                  // ⏪ EL TERCER ACTO YA NO VA VACÍO: `sedimentado` llegó.
                  //
                  // 🔴 SE LEE `sedimentado`, JAMÁS `destino`. Un ítem con
                  // destino NO garantiza depósito —el motor lo gatea por
                  // `f.entra_al_expediente`, la familia del producto decide—
                  // así que contar destinos habría dicho «quedó en la
                  // historia de Thor» de un juguete. Este booleano lo dice
                  // el servidor por la EXISTENCIA de la fila.
                  //
                  // Y su contrato se respeta entero: **`true` habilita a
                  // decirlo; `false` habilita a CALLAR.** Sin ninguno en
                  // `true` el acto no existe — no se dice «no quedó en el
                  // expediente», porque ese `false` tapa tres causas
                  // distintas (familia que no entra · sin destino · mascota
                  // no legible por quien mira) y no las distingue.
                  const sedimentados = detalle.items.filter((i) => i.sedimentado);
                  if (sedimentados.length === 0) return undefined;
                  // Los nombres que SÍ podemos nombrar. Si el destino no es
                  // legible, la mascota no se nombra — pero el hecho sí se
                  // cuenta: sedimentó igual.
                  const nombres = [
                    ...new Set(
                      sedimentados
                        .map((i) => i.destino?.mascota_id)
                        .filter((id): id is string => typeof id === 'string')
                        .map((id) => nombrePorId[id])
                        .filter((n): n is string => typeof n === 'string' && n !== ''),
                    ),
                  ];
                  return nombres.length === 1
                    ? t('despensa.celebracionSedimento', { nombre: nombres[0] })
                    : t('despensa.celebracionSedimentoVarias');
                })()}
              />
            ) : null}

            {/* 1 · EL RECORRIDO — la escalera completa con su desvío.
                🔴 S100-D · ACÁ ARRIBA IBA EL NÚMERO DE ORDEN, Y SE FUE.
                `P-20260816-3f6580` es un identificador de máquina: lo
                necesita SOPORTE, no la familia. Presidiendo la pantalla
                le pedía al dueño que se hiciera cargo de un dato que no
                puede usar, y encima en el lugar donde debía estar lo
                único que le importa (dónde está su pedido).
                **No se pierde: viaja entero adentro del enlace de
                soporte** (`abrirWhatsApp`), que es donde sirve — el mismo
                criterio de la lista, que ya lo excluía por Chanel («la
                fila no dice el número de orden — dato de máquina»). El
                pedido se nombra por su FECHA, que es como lo nombra
                quien lo hizo. */}
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              {(() => {
                const detalleActual =
                  detalle.pedido.promesa_desde !== null && detalle.pedido.promesa_hasta !== null
                    ? t('despensa.promesaCorta', {
                        dia: diaHumano(detalle.pedido.promesa_desde),
                        desde: horaLocal(detalle.pedido.promesa_desde),
                        hasta: horaLocal(detalle.pedido.promesa_hasta),
                      })
                    : undefined;
                const { pasos, desvio } = escaleraDePedido(
                  detalle.pedido.narrativa,
                  voces,
                  detalleActual,
                );
                return (
                  <EscaleraEstados
                    pasos={conIconos(pasos)}
                    desvio={desvio}
                    registro="completa"
                    acento="control"
                  />
                );
              })()}
            </View>

            {/* 1bis · LA PUERTA A EN CAMINO — solo mientras la moto va.
                Navega ⇒ chevron y sin caja (19.7: el contorno transparente
                murió como acción de fila). Y solo con `en_camino`: antes no
                hay a quién seguir, y un mapa quieto en el local durante media
                hora se lee como que algo se colgó. */}
            {detalle.pedido.narrativa === 'en_camino' ? (
              <CeldaNavegacion
                titulo={t('despensa.enCaminoEntrada')}
                detalle={t('despensa.enCaminoEntradaDetalle')}
                onPress={() =>
                  router.push({
                    pathname: '/despensa/en-camino/[pedidoId]',
                    params: { pedidoId: detalle.pedido.pedido_id },
                  })
                }
              />
            ) : null}

            {/* 2 · EL CÓDIGO — lo que la familia dice en la puerta (o
                muestra en el mostrador). Se LEE, jamás llega por push. */}
            {codigo !== null ? (
              <View style={{ paddingHorizontal: spacing[5], gap: spacing[1] }}>
                <CodigoAEscala
                  codigo={codigo}
                  etiqueta={
                    detalle.pedido.metodo_entrega === 'retiro'
                      ? t('despensa.codigoMostrador')
                      : t('despensa.codigoPuerta')
                  }
                />
                <Texto variante="apoyo">
                  {detalle.pedido.metodo_entrega === 'retiro'
                    ? t('despensa.codigoMostradorDetalle')
                    : t('despensa.codigoPuertaDetalle')}
                </Texto>
              </View>
            ) : null}

            {/* 3 · QUÉ PEDISTE — con lote cuando ya se empacó y el destino
                de cada ítem cuando la fuente lo dice. */}
            <View style={{ gap: spacing[2] }}>
              <View style={{ paddingHorizontal: spacing[5] }}>
                <Texto variante="seccion">{t('despensa.quePediste')}</Texto>
              </View>
              {detalle.items.map((linea, i) => {
                const destino = destinoDe(linea);
                return (
                  <View key={linea.item_id}>
                    {i > 0 ? <Separador /> : null}
                    <Celda
                      titulo={linea.nombre_producto}
                      subtitulo={[
                        t('despensa.lineaCantidad', { n: linea.cantidad }),
                        linea.lote !== null ? t('despensa.lineaLote', { lote: linea.lote }) : null,
                        destino !== null
                          ? destino.donacion
                            ? t('despensa.lineaDonacion')
                            : destino.mascota_id !== null && nombrePorId[destino.mascota_id]
                              ? t('despensa.lineaPara', { nombre: nombrePorId[destino.mascota_id] })
                              : null
                          : null,
                      ]
                        .filter((x): x is string => x !== null)
                        .join(' · ')}
                      metadataMono={`$ ${linea.subtotal.toFixed(2)}`}
                    />
                    {/* §4 — el ítem sin destino se ata cuando el dueño quiera. */}
                    {destino === null && elegibles.length > 0 ? (
                      <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[2] }}>
                        <Boton
                          variante="secundario"
                          etiqueta={t('despensa.paraQuienFue')}
                          onPress={() => {
                            setMascotaElegida(null);
                            setAtandoItem(linea.item_id);
                          }}
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {/* 4 · A DÓNDE VA (despacho) — el snapshot congelado. */}
            {detalle.pedido.metodo_entrega !== 'retiro' && detalle.entrega.direccion !== null ? (
              <View style={{ paddingHorizontal: spacing[5], gap: spacing[1] }}>
                <Texto variante="seccion">{t('despensa.aDonde')}</Texto>
                <Texto variante="cuerpo">{detalle.entrega.direccion}</Texto>
                {detalle.entrega.referencias !== null ? (
                  <Texto variante="apoyo">{detalle.entrega.referencias}</Texto>
                ) : null}
                {/* La instrucción que decide la entrega fallida (§9.3) —
                    de vuelta al leer desde el cableo del 12-ago. */}
                {detalle.entrega.instrucciones !== null ? (
                  <Texto variante="apoyo">
                    {t('despensa.instruccionDicha', { texto: detalle.entrega.instrucciones })}
                  </Texto>
                ) : null}
              </View>
            ) : null}

            {/* 5 · LA PLATA — transportada del motor, jamás sumada acá. */}
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              <Texto variante="seccion">{t('despensa.resumen')}</Texto>
              <FilaMonto etiqueta={t('despensa.subtotal')} monto={`$ ${detalle.subtotal.toFixed(2)}`} />
              <FilaMonto etiqueta={t('despensa.impuesto')} monto={`$ ${detalle.impuesto_total.toFixed(2)}`} />
              <FilaMonto
                etiqueta={
                  detalle.pedido.metodo_entrega === 'retiro'
                    ? t('despensa.envioRetiro')
                    : t('despensa.envio')
                }
                monto={`$ ${detalle.costo_envio.toFixed(2)}`}
              />
              <Separador />
              <FilaMonto etiqueta={t('despensa.total')} monto={`$ ${detalle.pedido.total.toFixed(2)}`} destacada />
            </View>

            {/* 6 · LA SALIDA — cancelar HASTA preparado; después, hablar.
                El corte es un hecho operativo, no un reloj (§8.3). */}
            {!detalle.pedido.es_terminal &&
            (detalle.pedido.narrativa === 'pagando' || detalle.pedido.narrativa === 'confirmado') ? (
              <View style={{ paddingHorizontal: spacing[5] }}>
                <Boton
                  variante="secundario"
                  bloque
                  etiqueta={t('despensa.cancelarPedido')}
                  onPress={() => setHojaCancelar(true)}
                />
              </View>
            ) : detalle.pedido.narrativa !== 'cancelado' ? (
              <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
                <Boton
                  variante="secundario"
                  bloque
                  etiqueta={t('despensa.tengoUnProblema')}
                  onPress={() => void abrirWhatsApp(detalle.pedido.numero_orden)}
                />
                {/* §8.4 — el botón dice A DÓNDE va y EN QUÉ HORARIO. */}
                <Texto variante="apoyo">{t('despensa.problemaDetalle')}</Texto>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* La confirmación de cancelar — una decisión con consecuencias
          viste de Hoja, no de toque accidental. */}
      <Hoja
        visible={hojaCancelar}
        onCerrar={() => setHojaCancelar(false)}
        titulo={t('despensa.cancelarPedido')}
      >
        <View style={{ gap: spacing[3] }}>
          <Texto variante="cuerpo">{t('despensa.cancelarDetalle')}</Texto>
          <Boton
            etiqueta={t('despensa.cancelarConfirmar')}
            bloque
            cargando={trabajando}
            onPress={() => void cancelar()}
          />
          <Boton
            variante="secundario"
            bloque
            etiqueta={t('despensa.cancelarNo')}
            onPress={() => setHojaCancelar(false)}
          />
        </View>
      </Hoja>

      {/* ¿Para quién fue? — el reclamo del destino, la regla general §4. */}
      <Hoja
        visible={atandoItem !== null}
        onCerrar={() => setAtandoItem(null)}
        titulo={t('despensa.paraQuienFue')}
      >
        <View style={{ gap: spacing[3] }}>
          <SelectorOpcion
            etiqueta={t('despensa.paraQuien')}
            entidad
            disposicion="columnas"
            acento="control"
            opciones={elegibles.map((m) => ({
              codigo: m.id,
              etiqueta: m.nombre,
              avatar: { nombre: m.nombre },
            }))}
            seleccionada={mascotaElegida ?? undefined}
            onSelect={setMascotaElegida}
          />
          <Boton
            etiqueta={t('despensa.atarConfirmar')}
            bloque
            cargando={trabajando}
            deshabilitado={mascotaElegida === null}
            onPress={() => void atar()}
          />
        </View>
      </Hoja>
    </View>
  );
}
