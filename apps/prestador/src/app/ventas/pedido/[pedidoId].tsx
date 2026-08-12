/**
 * EL PEDIDO — donde se avanza (S96-C · C-B2 · LETRA_PANEL §2.2 + §3).
 *
 * BOCETO M1:
 *  · TESIS: «Abrís un pedido y sabés a dónde va y qué le falta — sin que
 *    nadie te explique nada.»
 *  · FIRMA: CADA PASO PIDE ADELANTE LO QUE NECESITA (§3) — el campo está
 *    a la vista ANTES de tocar: empacar muestra los lotes, despachar
 *    muestra la factura y el repartidor. Nada de «error, faltan datos».
 *  · CHANEL: el total vive UNA vez (en el desglose, no en el techo);
 *    el estado vive UNA vez (la escalera — sin chip que lo repita).
 *  · ESTADOS: cargando · error/no existe · listo (con la acción que
 *    corresponde al escalón, y solo ésa).
 *  · Preside la PERSONA y su DIRECCIÓN (§2.2: la pregunta del vendedor
 *    es siempre «a dónde va esto») + llamar y abrir el mapa.
 *  · Si una transición rebota, la pantalla DICE LA VERDAD del motor —
 *    jamás la fuerza por otra puerta (§3 regla 2): el rebote tipado de
 *    `_despensa-comun` viaja al aviso tal cual.
 *  · 🔴 CERO mascota (§4). El reclamo del destino es del CLIENTE.
 *
 * El escalón se deriva en `lib/escalera-pedido.ts` (una sola verdad);
 * las transiciones son DATO del motor — acá no hay ningún switch que
 * autorice nada, solo la elección de QUÉ formulario mostrar.
 */

import { useCallback, useMemo, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  EscaleraEstados,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EvitaTeclado,
  FilaDato,
  MarcaDeAgua,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
  type DesvioEscalera,
  type PasoEscalera,
} from '@epetplace/ui';
import { monto, type IdiomaSoportado } from '@epetplace/i18n';
import {
  despacharPedido,
  empacarPedido,
  entregarRetiroEnMostrador,
  listarRepartidores,
  marcarPedidoEnPreparacion,
  obtenerDetallePedido,
  obtenerEscalonPedido,
  registrarFacturaPedido,
  type DetallePedido,
  type Repartidor,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { contextoVentas, type ContextoVentas } from '@/lib/cuenta-ventas';
import { derivarEscalera, type ClaveEscalon } from '@/lib/escalera-pedido';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      contexto: ContextoVentas;
      detalle: DetallePedido;
      estadoInterno: string;
      repartidores: Repartidor[];
    };

export default function PedidoVentas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  // los formularios que cada escalón pide ADELANTE
  const [lotes, setLotes] = useState<Record<string, string>>({});
  const [pesoTexto, setPesoTexto] = useState('');
  const [facturaNumero, setFacturaNumero] = useState('');
  const [facturaClave, setFacturaClave] = useState('');
  const [repartidorId, setRepartidorId] = useState<string | null>(null);
  const [codigoRetiro, setCodigoRetiro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (typeof pedidoId !== 'string') return;
      let vigente = true;
      void (async () => {
        const ctx = await contextoVentas();
        if (!vigente) return;
        if (!ctx.ok || ctx.data === null) {
          setPantalla({ estado: 'error' });
          return;
        }
        const [detalle, escalon, reps] = await Promise.all([
          obtenerDetallePedido(pedidoId),
          obtenerEscalonPedido(pedidoId),
          listarRepartidores(ctx.data.cuentaComercialId),
        ]);
        if (!vigente) return;
        if (!detalle.ok || !escalon.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const activos = reps.ok ? reps.data.filter((r) => r.activo) : [];
        setPantalla({
          estado: 'listo',
          contexto: ctx.data,
          detalle: detalle.data,
          estadoInterno: escalon.data.estado,
          repartidores: activos,
        });
        // los lotes ya registrados se pre-cargan; los vacíos se piden
        const precarga: Record<string, string> = {};
        for (const item of detalle.data.items) precarga[item.item_id] = item.lote ?? '';
        setLotes(precarga);
        // decisión ①: con UN solo repartidor activo, preseleccionado
        if (activos.length === 1) setRepartidorId(activos[0].repartidor_id);
      })();
      return () => {
        vigente = false;
      };
    }, [pedidoId, intento]),
  );

  const recargar = () => setIntento((n) => n + 1);

  const vozEscalon: Record<ClaveEscalon, string> = useMemo(
    () => ({
      preparado: t('ventas.escalones.preparado'),
      empacado: t('ventas.escalones.empacado'),
      facturado: t('ventas.escalones.facturado'),
      despachado: t('ventas.escalones.despachado'),
      entregado: t('ventas.escalones.entregado'),
      retirado: t('ventas.escalones.retirado'),
    }),
    [t],
  );

  async function accionMotor(fn: () => Promise<{ ok: true } | { ok: false; mensaje: string }>, exito: string) {
    if (enviando) return;
    setEnviando(true);
    const r = await fn();
    setEnviando(false);
    if (!r.ok) {
      // la verdad del motor, tal cual — jamás «intentá de nuevo» (§10)
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: exito, variante: 'exito' });
    recargar();
  }

  if (pantalla.estado === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <MarcaDeAgua />
        <Encabezado variante="navegacion" titulo={t('ventas.pedido.titulo')} atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="70%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={180} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (pantalla.estado === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <MarcaDeAgua />
        <Encabezado variante="navegacion" titulo={t('ventas.pedido.titulo')} atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ventas.pedido.errorTitulo')}
            descripcion={t('ventas.comunes.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('ventas.comunes.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  recargar();
                }}
              />
            }
          />
        </View>
      </View>
    );
  }

  const { detalle, estadoInterno, contexto, repartidores } = pantalla;
  const esRetiro = detalle.pedido.metodo_entrega === 'retiro';
  const escalera = derivarEscalera(estadoInterno, detalle.pedido.metodo_entrega);
  const dinero = (v: number) => monto(v, contexto.moneda, idioma as IdiomaSoportado);

  const pasos: PasoEscalera[] = escalera.pasos.map((p) => ({
    clave: p.clave,
    etiqueta: vozEscalon[p.clave],
    estado: p.estado,
  }));
  const desvio: DesvioEscalera | undefined =
    escalera.desvio === 'noLlego'
      ? { etiqueta: t('ventas.desvios.noLlego'), detalle: t('ventas.desvios.noLlegoDetalle'), tono: 'alerta' }
      : escalera.desvio === 'cancelado'
        ? { etiqueta: t('ventas.desvios.cancelado'), tono: 'neutro' }
        : undefined;

  const direccionCompleta = [detalle.entrega.direccion, detalle.entrega.sector, detalle.entrega.ciudad]
    .filter((s): s is string => s !== null && s.length > 0)
    .join(', ');

  const lotesCompletos = detalle.items.every((i) => (lotes[i.item_id] ?? '').trim().length > 0);
  const puedeDespachar = repartidorId !== null && repartidores.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('ventas.pedido.titulo')}
        atras
        onAtras={() => router.back()}
      />
      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: insets.bottom + spacing[10],
            gap: spacing[4],
          }}
        >
          {/* ── preside la persona y su dirección (§2.2) ── */}
          <View style={{ gap: spacing[1] }}>
            {detalle.entrega.nombre_receptor !== null && (
              <Texto variante="titulo">{detalle.entrega.nombre_receptor}</Texto>
            )}
            <Texto variante="dato">{detalle.pedido.numero_orden}</Texto>
            {esRetiro ? (
              <Texto variante="cuerpo">{t('ventas.hoy.retiro')}</Texto>
            ) : (
              <>
                {direccionCompleta.length > 0 && <Texto variante="cuerpo">{direccionCompleta}</Texto>}
                {detalle.entrega.referencias !== null && (
                  <Texto variante="apoyo">{detalle.entrega.referencias}</Texto>
                )}
              </>
            )}
          </View>

          {/* las dos acciones que resuelven el mundo real (§2.2) */}
          {(detalle.entrega.telefono !== null || (!esRetiro && direccionCompleta.length > 0)) && (
            <View style={{ flexDirection: 'row', gap: spacing[3] }}>
              {detalle.entrega.telefono !== null && (
                <View style={{ flex: 1 }}>
                  <Boton
                    variante="secundario"
                    bloque
                    etiqueta={t('ventas.pedido.llamar')}
                    onPress={() => void Linking.openURL(`tel:${detalle.entrega.telefono}`)}
                  />
                </View>
              )}
              {!esRetiro && direccionCompleta.length > 0 && (
                <View style={{ flex: 1 }}>
                  <Boton
                    variante="secundario"
                    bloque
                    etiqueta={t('ventas.pedido.abrirMapa')}
                    onPress={() =>
                      void Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta)}`,
                      )
                    }
                  />
                </View>
              )}
            </View>
          )}

          {/* ── la escalera a la vista: dónde está y cuánto falta ── */}
          {pasos.length > 0 && (
            <Tarjeta>
              <EscaleraEstados registro="completa" pasos={pasos} desvio={desvio} acento="oficio" />
            </Tarjeta>
          )}

          {/* ── LA ACCIÓN DEL ESCALÓN — cada paso pide adelante lo suyo ── */}
          {escalera.accion === 'preparar' && (
            <Boton
              variante="primario"
              bloque
              cargando={enviando}
              etiqueta={t('ventas.pedido.prepararCta')}
              onPress={() =>
                void accionMotor(
                  () => marcarPedidoEnPreparacion(detalle.pedido.pedido_id),
                  t('ventas.pedido.exitoPreparado'),
                )
              }
            />
          )}

          {escalera.accion === 'empacar' && (
            <Tarjeta>
              <View style={{ gap: spacing[4] }}>
                <View style={{ gap: spacing[1] }}>
                  <Texto variante="seccion">{t('ventas.pedido.empacarTitulo')}</Texto>
                  <Texto variante="apoyo">{t('ventas.pedido.empacarDetalle')}</Texto>
                </View>
                {detalle.items.map((item) => (
                  <Campo
                    key={item.item_id}
                    label={t('ventas.pedido.loteDe', { producto: item.nombre_producto })}
                    value={lotes[item.item_id] ?? ''}
                    onChangeText={(v) => setLotes((prev) => ({ ...prev, [item.item_id]: v }))}
                    deshabilitado={enviando}
                  />
                ))}
                <Campo
                  label={t('ventas.pedido.pesoReal')}
                  value={pesoTexto}
                  onChangeText={setPesoTexto}
                  keyboardType="decimal-pad"
                  deshabilitado={enviando}
                />
                <Boton
                  variante="primario"
                  bloque
                  cargando={enviando}
                  deshabilitado={!lotesCompletos}
                  etiqueta={t('ventas.pedido.empacarCta')}
                  onPress={() => {
                    const peso = Number(pesoTexto.replace(',', '.'));
                    void accionMotor(
                      () =>
                        empacarPedido(
                          detalle.pedido.pedido_id,
                          detalle.items.map((i) => ({ item_id: i.item_id, lote: lotes[i.item_id] ?? '' })),
                          pesoTexto.trim().length > 0 && !Number.isNaN(peso) ? peso : undefined,
                        ),
                      t('ventas.pedido.exitoEmpacado'),
                    );
                  }}
                />
              </View>
            </Tarjeta>
          )}

          {escalera.accion === 'facturar' && (
            <Tarjeta>
              <View style={{ gap: spacing[4] }}>
                <View style={{ gap: spacing[1] }}>
                  <Texto variante="seccion">
                    {esRetiro ? t('ventas.pedido.facturaTituloRetiro') : t('ventas.pedido.facturaTitulo')}
                  </Texto>
                  <Texto variante="apoyo">{t('ventas.pedido.facturaDetalle')}</Texto>
                </View>
                <Campo
                  label={t('ventas.pedido.facturaNumero')}
                  value={facturaNumero}
                  onChangeText={setFacturaNumero}
                  deshabilitado={enviando}
                />
                <Campo
                  label={t('ventas.pedido.facturaClave')}
                  value={facturaClave}
                  onChangeText={setFacturaClave}
                  deshabilitado={enviando}
                />
                <Boton
                  variante="primario"
                  bloque
                  cargando={enviando}
                  deshabilitado={facturaNumero.trim().length === 0}
                  etiqueta={t('ventas.pedido.facturaCta')}
                  onPress={() =>
                    void accionMotor(
                      () =>
                        registrarFacturaPedido({
                          pedido_id: detalle.pedido.pedido_id,
                          numero: facturaNumero,
                          clave_acceso: facturaClave.trim().length > 0 ? facturaClave.trim() : undefined,
                          total: detalle.pedido.total,
                        }),
                      t('ventas.pedido.exitoFactura'),
                    )
                  }
                />
              </View>
            </Tarjeta>
          )}

          {(escalera.accion === 'despachar' || escalera.accion === 'reintentar') && (
            <Tarjeta>
              <View style={{ gap: spacing[4] }}>
                {escalera.accion === 'reintentar' && (
                  <Texto variante="apoyo">{t('ventas.pedido.reintentoDetalle')}</Texto>
                )}
                {repartidores.length === 0 ? (
                  <View style={{ gap: spacing[3] }}>
                    <Texto variante="apoyo">{t('ventas.pedido.sinRepartidores')}</Texto>
                    <Boton
                      variante="secundario"
                      bloque
                      etiqueta={t('ventas.pedido.irConfiguracion')}
                      onPress={() => router.push('/ventas/configuracion')}
                    />
                  </View>
                ) : (
                  <>
                    <SelectorOpcion
                      acento="oficio"
                      etiqueta={t('ventas.pedido.quienLoLleva')}
                      opciones={repartidores.map((r) => ({ codigo: r.repartidor_id, etiqueta: r.nombre }))}
                      seleccionada={repartidorId ?? undefined}
                      onSelect={(codigo) => setRepartidorId(codigo)}
                    />
                    <Boton
                      variante="primario"
                      bloque
                      cargando={enviando}
                      deshabilitado={!puedeDespachar}
                      etiqueta={
                        escalera.accion === 'reintentar'
                          ? t('ventas.pedido.reintentarCta')
                          : t('ventas.pedido.despacharCta')
                      }
                      onPress={() => {
                        if (repartidorId === null) return;
                        void accionMotor(
                          () => despacharPedido(detalle.pedido.pedido_id, repartidorId),
                          t('ventas.pedido.exitoDespachado'),
                        );
                      }}
                    />
                  </>
                )}
              </View>
            </Tarjeta>
          )}

          {escalera.accion === 'entregarRetiro' && (
            <Tarjeta>
              <View style={{ gap: spacing[4] }}>
                <View style={{ gap: spacing[1] }}>
                  <Texto variante="seccion">{t('ventas.pedido.retiroTitulo')}</Texto>
                  <Texto variante="apoyo">{t('ventas.pedido.retiroDetalle')}</Texto>
                </View>
                <Campo
                  label={t('ventas.pedido.retiroCodigo')}
                  value={codigoRetiro}
                  onChangeText={setCodigoRetiro}
                  autoCapitalize="characters"
                  deshabilitado={enviando}
                />
                <Boton
                  variante="primario"
                  bloque
                  cargando={enviando}
                  deshabilitado={codigoRetiro.trim().length === 0}
                  etiqueta={t('ventas.pedido.retiroCta')}
                  onPress={() =>
                    void accionMotor(
                      () => entregarRetiroEnMostrador(detalle.pedido.pedido_id, codigoRetiro),
                      t('ventas.pedido.exitoEntregado'),
                    )
                  }
                />
              </View>
            </Tarjeta>
          )}

          {escalera.accion === 'enManosRepartidor' && (
            <Texto variante="apoyo">{t('ventas.pedido.enReparto')}</Texto>
          )}

          {/* ── los productos ── */}
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">{t('ventas.pedido.productosTitulo')}</Texto>
            <Tarjeta relleno="ninguno">
              {detalle.items.map((item, i) => (
                <View key={item.item_id}>
                  {i > 0 && <Separador />}
                  <Celda
                    titulo={item.nombre_producto}
                    subtitulo={item.lote !== null ? t('ventas.pedido.lote', { lote: item.lote }) : undefined}
                    metadataMono={`${item.cantidad} × ${dinero(item.precio_unitario)}`}
                  />
                </View>
              ))}
            </Tarjeta>
          </View>

          {/* ── el desglose — la plata vive UNA vez ── */}
          <Tarjeta>
            <View style={{ gap: spacing[3] }}>
              <FilaDato etiqueta={t('ventas.pedido.desgloseSubtotal')} valor={dinero(detalle.subtotal)} mono />
              <FilaDato etiqueta={t('ventas.pedido.desgloseImpuesto')} valor={dinero(detalle.impuesto_total)} mono />
              {!esRetiro && (
                <FilaDato etiqueta={t('ventas.pedido.desgloseEnvio')} valor={dinero(detalle.costo_envio)} mono />
              )}
              {detalle.descuento_monto > 0 && (
                <FilaDato
                  etiqueta={t('ventas.pedido.desgloseDescuento')}
                  valor={`−${dinero(detalle.descuento_monto)}`}
                  mono
                />
              )}
              <Separador />
              <FilaDato etiqueta={t('ventas.pedido.desgloseTotal')} valor={dinero(detalle.pedido.total)} mono />
            </View>
          </Tarjeta>
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
