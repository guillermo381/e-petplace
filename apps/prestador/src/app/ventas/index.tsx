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

import { useCallback, useState } from 'react';
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
  MarcaDeAgua,
  Separador,
  Tarjeta,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  cupoRepartoDelDia,
  extrasPanelPedidos,
  listarPedidosDelVendedor,
  misEntregasAsignadas,
  type ExtraPanelPedido,
  type PedidoDelVendedor,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { VentanaPedidos } from '@/components/ventana-pedidos';
import { contextoVentas, type ContextoVentas } from '@/lib/cuenta-ventas';
import { hoyLocalISO } from '@/lib/ventas-formato';

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      {/* S96-C: para el VENDEDOR PURO esta pantalla es la CASA (llega por
          Redirect, sin pila) — un chevron de atrás que no va a ningún
          lado es un control muerto. Con pila (la puerta desde Negocio),
          vuelve como siempre. */}
      {router.canGoBack() ? (
        <Encabezado
          variante="navegacion"
          titulo={t('ventas.hoy.titulo')}
          atras
          onAtras={() => router.back()}
        />
      ) : (
        <Encabezado variante="navegacion" titulo={t('ventas.hoy.titulo')} />
      )}

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
          {/* ⭐ S99-C · LA LISTA ES PIEZA (`components/ventana-pedidos`).
              Esta ruta la monta SIN `dia` porque su lector es el que NO
              filtra por fecha: sus `pedidos` ya traen todo, incluidos los
              que no tienen entrega comprometida. El día que esta pantalla
              migre al lector por rango, el tipo de la pieza va a exigir
              `sinFecha` — y no compila hasta que alguien decida dónde van
              (D-828). *La invisibilidad no tiene stack trace.* */}
          <VentanaPedidos
            pedidos={pantalla.pedidos}
            extras={pantalla.extras}
            cupo={pantalla.cupo}
            moneda={pantalla.contexto.moneda}
            onAbrir={(id) => router.push(`/ventas/pedido/${id}`)}
          />

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
