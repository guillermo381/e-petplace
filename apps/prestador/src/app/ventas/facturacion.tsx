/**
 * TU FACTURACIÓN — la vista del vendedor (S96-C · C-B6 · LETRA_RECORRIDO
 * §2.2: «la vista de su facturación entra a v1; la liquidación se
 * difiere al motor de pagos»).
 *
 * BOCETO M1:
 *  · TESIS: «Lo que vendiste y se entregó, con su desglose adentro.»
 *  · FIRMA: la NOTA DE LA LIQUIDACIÓN — decir sin rodeos que cuánto te
 *    toca y cuándo llega todavía no existe (L-139: no se promete lo que
 *    no se puede cumplir). La honestidad es la pieza.
 *  · CHANEL: sin sumas totales del período (una suma sin el desglose de
 *    comisión REAL sería un número que promete de más — la comisión es
 *    parámetro del motor de pagos, jamás una constante acá).
 *  · ESTADOS: cargando · error · vacío honesto · listo.
 *
 * El desglose por venta vive en el DETALLE del pedido (tap) — subtotal,
 * impuesto, envío, total. Acá la lista, del más nuevo al más viejo.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { fechaCortaMono, monto, type IdiomaSoportado } from '@epetplace/i18n';
import { listarPedidosDelVendedor, type PedidoDelVendedor } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { contextoVentas, type ContextoVentas } from '@/lib/cuenta-ventas';
import { fechaLocalISO } from '@/lib/ventas-formato';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; contexto: ContextoVentas; entregados: PedidoDelVendedor[] };

export default function FacturacionVentas() {
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
        if (!ctx.ok || ctx.data === null) {
          setPantalla({ estado: 'error' });
          return;
        }
        const pedidos = await listarPedidosDelVendedor(ctx.data.cuentaComercialId, 100);
        if (!vigente) return;
        if (!pedidos.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({
          estado: 'listo',
          contexto: ctx.data,
          entregados: pedidos.data.filter((p) => p.narrativa === 'entregado'),
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
      <Encabezado
        variante="navegacion"
        titulo={t('ventas.facturacion.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
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

      {pantalla.estado === 'listo' && (
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: insets.bottom + spacing[8],
            gap: spacing[4],
          }}
        >
          {/* la liquidación NO se promete — la nota es la firma */}
          <Texto variante="apoyo">{t('ventas.config.liquidacionNota')}</Texto>

          {pantalla.entregados.length === 0 ? (
            <EstadoVacio registro="seccion" titulo={t('ventas.config.facturacionVacio')} />
          ) : (
            <Tarjeta relleno="ninguno">
              {pantalla.entregados.map((p, i) => (
                <View key={p.pedido_id}>
                  {i > 0 && <Separador />}
                  <Celda
                    titulo={p.numero_orden}
                    metadataMono={`${fechaCortaMono(fechaLocalISO(p.creado_en), idioma as IdiomaSoportado)} · ${monto(p.total, pantalla.contexto.moneda, idioma as IdiomaSoportado)}`}
                    interactiva
                    accessibilityRole="button"
                    onPress={() => router.push(`/ventas/pedido/${p.pedido_id}`)}
                  />
                </View>
              ))}
            </Tarjeta>
          )}
        </ScrollView>
      )}
    </View>
  );
}
