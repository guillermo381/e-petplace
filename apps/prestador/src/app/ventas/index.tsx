/**
 * HOY DE VENTAS — la lista de pedidos (S96-C · C-B1 · LETRA_PANEL §2.1).
 *
 * BOCETO M1 (la pantalla se aprueba en el dispositivo, esto garantiza que
 * lo construido sea lo que se quiso):
 *  · TESIS: «Abrís y ves TRABAJO: qué pedido agarrar y cuánto cabe hoy.»
 *  · FIRMA: el ORDEN — la lista se ordena por lo que falta hacer, no por
 *    hora. Lo que espera acción preside; lo entregado se apaga y baja.
 *    Firma de comportamiento, no de color (dosis prestador §2.7).
 *  · CHANEL: las filas activas NO llevan chip de narrativa (la escalera
 *    ya dice dónde está — un chip encima sería el mismo dato dos veces);
 *    los terminados no llevan escalera (cerró: nada que contar).
 *  · ESTADOS: cargando (esqueleto) · error (habla y reintenta) · sin
 *    cuenta vendedora (voz honesta, cero formulario muerto) · vacío
 *    (invitación) · listo.
 *  · La cifra del techo es el ÚNICO número: cuántos van sobre cuántos
 *    caben hoy (§7.3 — capacidad por recurso CONFIRMADO, del motor).
 *    Es el micro-dashboard legal del HOY (nota S72-P1(b)).
 *  · 🔴 CERO mascota en toda la superficie (§4) — y no puede haberla:
 *    ningún lector de este módulo la trae (L-222 en la capa de datos).
 *
 * Viajes (S94-PERF): contexto (cacheado) → [pedidos ‖ cupo] → extras.
 */

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaDato,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  TarjetaPedido,
  Texto,
  opacity,
  spacing,
  useTheme,
  type DesvioEscalera,
  type PasoEscalera,
} from '@epetplace/ui';
import { fechaCortaMono, monto, type IdiomaSoportado } from '@epetplace/i18n';
import {
  cupoRepartoDelDia,
  extrasPanelPedidos,
  listarPedidosDelVendedor,
  misEntregasAsignadas,
  type ExtraPanelPedido,
  type PedidoDelVendedor,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { contextoVentas, type ContextoVentas } from '@/lib/cuenta-ventas';
import { derivarEscalera, type ClaveEscalon } from '@/lib/escalera-pedido';
import { fechaLocalISO, horaCorta, hoyLocalISO } from '@/lib/ventas-formato';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'sinCuenta' }
  | {
      estado: 'listo';
      contexto: ContextoVentas;
      pedidos: PedidoDelVendedor[];
      extras: Record<string, ExtraPanelPedido>;
      cupo: { capacidad: number; consumido: number } | null;
      /** La persona además reparte: se le muestra su entrada (§9.1). */
      tieneEntregas: boolean;
    };

/** El orden del trabajo — la firma de la pantalla. Menor = más arriba. */
function prioridad(estadoInterno: string | undefined, narrativa: string): number {
  switch (estadoInterno) {
    case 'entrega_fallida':
      return 0; // algo salió mal y alguien tiene que hacer algo
    case 'pago_capturado':
    case 'stock_reservado':
    case 'vendedor_notificado':
    case 'liberado_preparacion':
      return 1; // por preparar — preside (§2.1)
    case 'picking':
      return 2;
    case 'empacado':
      return 3;
    case 'documentado':
      return 4;
    case 'en_reparto':
    case 'hacia_destino':
      return 5;
    default:
      return narrativa === 'pagando' ? 6 : 7;
  }
}

export default function HoyVentas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const ctx = await contextoVentas();
        if (!vigente) return;
        if (!ctx.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        if (ctx.data === null || !ctx.data.esVendedora) {
          setPantalla({ estado: 'sinCuenta' });
          return;
        }
        const cuentaId = ctx.data.cuentaComercialId;
        const [pedidos, cupo, entregas] = await Promise.all([
          listarPedidosDelVendedor(cuentaId),
          cupoRepartoDelDia(cuentaId, hoyLocalISO()),
          misEntregasAsignadas(),
        ]);
        if (!vigente) return;
        if (!pedidos.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const extras = await extrasPanelPedidos(pedidos.data.map((p) => p.pedido_id));
        if (!vigente) return;
        setPantalla({
          estado: 'listo',
          contexto: ctx.data,
          pedidos: pedidos.data,
          extras: extras.ok ? extras.data : {},
          cupo: cupo.ok ? { capacidad: cupo.data.capacidad, consumido: cupo.data.consumido } : null,
          tieneEntregas: entregas.ok && entregas.data.length > 0,
        });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

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

  const vozVentana = useCallback(
    (p: PedidoDelVendedor, extra: ExtraPanelPedido | undefined): string => {
      if (extra?.metodo_entrega === 'retiro') return t('ventas.hoy.retiro');
      if (p.promesa_desde === null || p.promesa_hasta === null) {
        return t('ventas.ventana.sinVentana');
      }
      const desde = horaCorta(p.promesa_desde);
      const hasta = horaCorta(p.promesa_hasta);
      if (fechaLocalISO(p.promesa_desde) === hoyLocalISO()) {
        return t('ventas.ventana.hoyDesdeHasta', { desde, hasta });
      }
      return t('ventas.ventana.fechaDesdeHasta', {
        fecha: fechaCortaMono(fechaLocalISO(p.promesa_desde), idioma as IdiomaSoportado),
        desde,
        hasta,
      });
    },
    [t, idioma],
  );

  function filaDe(p: PedidoDelVendedor, dimmed: boolean) {
    if (pantalla.estado !== 'listo') return null;
    const extra: ExtraPanelPedido | undefined = pantalla.extras[p.pedido_id];
    const escalera = extra ? derivarEscalera(extra.estado, extra.metodo_entrega) : null;

    const itemsVoz =
      extra === undefined
        ? undefined
        : extra.items_cantidad === 1
          ? t('ventas.hoy.unProducto')
          : t('ventas.hoy.productos', { n: extra.items_cantidad });

    const detalle = dimmed
      ? p.narrativa_nombre
      : [vozVentana(p, extra), itemsVoz].filter((s) => s !== undefined).join(' · ');

    const pasos: PasoEscalera[] =
      dimmed || escalera === null
        ? []
        : escalera.pasos.map((paso) => ({
            clave: paso.clave,
            etiqueta: vozEscalon[paso.clave],
            estado: paso.estado,
          }));

    const desvio: DesvioEscalera | undefined =
      escalera?.desvio === 'noLlego'
        ? {
            etiqueta: t('ventas.desvios.noLlego'),
            detalle: t('ventas.desvios.noLlegoDetalle'),
            tono: 'alerta',
          }
        : escalera?.desvio === 'cancelado'
          ? { etiqueta: t('ventas.desvios.cancelado'), tono: 'neutro' }
          : undefined;

    const tarjeta = (
      <TarjetaPedido
        titulo={
          extra?.nombre_receptor ?? t('ventas.hoy.pedidoSinNombre', { numero: p.numero_orden })
        }
        detalle={detalle}
        monto={monto(p.total, pantalla.contexto.moneda, idioma as IdiomaSoportado)}
        pasos={pasos}
        desvio={desvio}
        acento="oficio"
        etiqueta={t('ventas.hoy.verPedido', { numero: p.numero_orden })}
        onPress={() => router.push(`/ventas/pedido/${p.pedido_id}`)}
      />
    );
    // Lo entregado se APAGA y baja (§2.1) — atenuación por token, no color nuevo.
    return (
      <View key={p.pedido_id} style={dimmed ? { opacity: opacity.disabled } : undefined}>
        {tarjeta}
      </View>
    );
  }

  const { activos, terminados } = useMemo(() => {
    if (pantalla.estado !== 'listo') return { activos: [], terminados: [] };
    const activos = pantalla.pedidos.filter((p) => !p.es_terminal);
    const terminados = pantalla.pedidos.filter((p) => p.es_terminal);
    activos.sort((a, b) => {
      const pa = prioridad(pantalla.extras[a.pedido_id]?.estado, a.narrativa);
      const pb = prioridad(pantalla.extras[b.pedido_id]?.estado, b.narrativa);
      if (pa !== pb) return pa - pb;
      const ta = a.promesa_desde ?? a.creado_en;
      const tb = b.promesa_desde ?? b.creado_en;
      return ta < tb ? -1 : 1;
    });
    return { activos, terminados };
  }, [pantalla]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('ventas.hoy.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="60%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={110} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={110} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ventas.comunes.errorTitulo')}
            descripcion={t('ventas.comunes.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('ventas.comunes.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'sinCuenta' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ventas.comunes.sinCuentaTitulo')}
            descripcion={t('ventas.comunes.sinCuentaDetalle')}
          />
        </View>
      )}

      {pantalla.estado === 'listo' && (
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: insets.bottom + spacing[8],
            gap: spacing[4],
          }}
        >
          {/* la cifra honesta del techo (§7.3) — capacidad 0 se DICE */}
          {pantalla.cupo !== null &&
            (pantalla.cupo.capacidad > 0 ? (
              <FilaDato
                etiqueta={t('ventas.hoy.titulo')}
                valor={t('ventas.hoy.cupo', {
                  consumido: pantalla.cupo.consumido,
                  capacidad: pantalla.cupo.capacidad,
                })}
                mono
              />
            ) : (
              <Texto variante="apoyo">{t('ventas.hoy.cupoCero')}</Texto>
            ))}

          {activos.length === 0 && terminados.length === 0 ? (
            <EstadoVacio
              registro="seccion"
              titulo={t('ventas.hoy.vacioTitulo')}
              descripcion={t('ventas.hoy.vacioDetalle')}
            />
          ) : (
            <View style={{ gap: spacing[3] }}>
              {activos.map((p) => filaDe(p, false))}
              {terminados.length > 0 && (
                <View style={{ gap: spacing[3], marginTop: spacing[3] }}>
                  <Texto variante="seccion">{t('ventas.hoy.terminadosTitulo')}</Texto>
                  {terminados.map((p) => filaDe(p, true))}
                </View>
              )}
            </View>
          )}

          {/* el resto del módulo — grupo de celdas al pie (el trabajo preside) */}
          <Tarjeta relleno="ninguno">
            <CeldaNavegacion
              registro="tinta"
              titulo={t('ventas.hoy.stock')}
              onPress={() => router.push('/ventas/stock')}
            />
            <Separador />
            <CeldaNavegacion
              registro="tinta"
              titulo={t('ventas.hoy.mostrador')}
              onPress={() => router.push('/ventas/mostrador')}
            />
            {pantalla.tieneEntregas && (
              <>
                <Separador />
                <CeldaNavegacion
                  registro="tinta"
                  titulo={t('ventas.hoy.entregas')}
                  detalle={t('ventas.hoy.entregasDetalle')}
                  onPress={() => router.push('/ventas/entregas')}
                />
              </>
            )}
            <Separador />
            <CeldaNavegacion
              registro="tinta"
              titulo={t('ventas.hoy.configuracion')}
              onPress={() => router.push('/ventas/configuracion')}
            />
          </Tarjeta>
        </ScrollView>
      )}
    </View>
  );
}
