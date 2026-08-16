/**
 * VENTA DE MOSTRADOR (S96-C · C-B5 · LETRA_RECORRIDO §4).
 *
 * BOCETO M1:
 *  · TESIS: «Vendés una bolsa a quien entró caminando — sin buscar a
 *    nadie, sin ver a nadie. El código hace el resto.»
 *  · FIRMA: el CÓDIGO A ESCALA DE MOSTRADOR (decisión ③ del arranque:
 *    se muestra acá y el vendedor lo escribe en su factura). Pieza
 *    `CodigoAEscala` de B — mono legible a través de un mostrador.
 *  · CHANEL: el precio POR ÍTEM viene del lector (`precio_publicado`,
 *    ensanche de A tras el hueco que esta pantalla declaró; null honesto
 *    = sin oferta publicada, y SE DICE) — pero el TOTAL sigue siendo del
 *    MOTOR: acá no se suma un centavo.
 *
 * ⚠️ **ESTA CABECERA DECÍA «sin buscador (seis productos)» Y ESA PREMISA
 * MURIÓ.** Con la siembra del 16-ago el vendedor de pruebas pasó a **532
 * SKUs** y el founder lo encontró de frente: *«me sale una lista desde una
 * pantalla desplegable con todos los productos»*. **No estaba mal razonada:
 * estaba bien razonada sobre una cardinalidad que ya no existe** — y por eso
 * la línea se ENMIENDA acá, donde se lee, en vez de borrarse.
 *  · ESTADOS: armar (cargando/error/vacío/listo) · vendida (el código).
 *
 * 🔴 EL VENDEDOR JAMÁS ELIGE LA MASCOTA (§4): la venta se registra
 * CONTRA NADIE, descuenta stock por el ledger y devuelve el código que
 * va en la factura. En este archivo no hay búsqueda de personas — la
 * pantalla no existe, y no puede existir. El reclamo es del cliente.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  CodigoAEscala,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  MarcaDeAgua,
  Separador,
  StepperCantidad,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { fechaLargaHumana, monto, type IdiomaSoportado } from '@epetplace/i18n';
import {
  listarSkusDelVendedor,
  registrarVentaMostrador,
  type SkuDelVendedor,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { contextoVentas, type ContextoVentas } from '@/lib/cuenta-ventas';
import { fechaLocalISO } from '@/lib/ventas-formato';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; contexto: ContextoVentas; skus: SkuDelVendedor[] }
  | {
      estado: 'vendida';
      contexto: ContextoVentas;
      codigo: string;
      total: number;
      expira: string;
    };

export default function VentaMostrador() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [seleccion, setSeleccion] = useState<Record<string, number>>({});
  const [eligiendo, setEligiendo] = useState(false);
  /* El buscador de la Hoja: MISMO criterio que el de la vitrina (nombre y
     marca), porque es el MISMO objeto. Si el mostrador buscara distinto, el
     vendedor encontraría un producto en una pantalla y no en la otra. */
  const [buscaSku, setBuscaSku] = useState('');
  const [registrando, setRegistrando] = useState(false);

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
        const skus = await listarSkusDelVendedor(ctx.data.cuentaComercialId);
        if (!vigente) return;
        if (!skus.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({ estado: 'listo', contexto: ctx.data, skus: skus.data });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  async function registrar() {
    if (registrando || pantalla.estado !== 'listo') return;
    const items = Object.entries(seleccion)
      .filter(([, cantidad]) => cantidad > 0)
      .map(([sku_id, cantidad]) => ({ sku_id, cantidad }));
    if (items.length === 0) return;
    setRegistrando(true);
    const r = await registrarVentaMostrador({
      cuenta_comercial_id: pantalla.contexto.cuentaComercialId,
      items,
    });
    setRegistrando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setSeleccion({});
    setPantalla({
      estado: 'vendida',
      contexto: pantalla.contexto,
      codigo: r.data.codigo_reclamo,
      total: r.data.total,
      expira: r.data.expira_en,
    });
  }

  const elegidos =
    pantalla.estado === 'listo'
      ? pantalla.skus.filter((s) => (seleccion[s.sku_id] ?? 0) > 0)
      : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('ventas.mostrador.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="90%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={96} />
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

      {pantalla.estado === 'listo' && pantalla.skus.length === 0 && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ventas.mostrador.vacioTitulo')}
            descripcion={t('ventas.mostrador.vacioDetalle')}
          />
        </View>
      )}

      {pantalla.estado === 'listo' && pantalla.skus.length > 0 && (
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: insets.bottom + spacing[10],
            gap: spacing[4],
          }}
        >
          <Texto variante="apoyo">{t('ventas.mostrador.detalle')}</Texto>

          {elegidos.length > 0 && (
            <Tarjeta relleno="ninguno">
              {elegidos.map((sku, i) => (
                <View key={sku.sku_id}>
                  {i > 0 && <Separador />}
                  <Celda
                    titulo={sku.producto_nombre}
                    tituloEntero
                    subtitulo={sku.presentacion}
                    metadataMono={
                      sku.precio_publicado !== null
                        ? monto(sku.precio_publicado, pantalla.contexto.moneda, idioma as IdiomaSoportado)
                        : undefined
                    }
                    fin={
                      <StepperCantidad
                        valor={seleccion[sku.sku_id] ?? 0}
                        min={0}
                        max={sku.stock_disponible}
                        onCambio={(v) =>
                          setSeleccion((prev) => ({ ...prev, [sku.sku_id]: v }))
                        }
                        etiqueta={t('ventas.mostrador.cantidad')}
                        registro="oficio"
                      />
                    }
                  />
                </View>
              ))}
            </Tarjeta>
          )}

          <Boton
            variante="secundario"
            bloque
            etiqueta={t('ventas.mostrador.agregarProducto')}
            onPress={() => setEligiendo(true)}
          />

          <Boton
            variante="primario"
            bloque
            cargando={registrando}
            deshabilitado={elegidos.length === 0}
            etiqueta={t('ventas.mostrador.registrarCta')}
            onPress={() => void registrar()}
          />
        </ScrollView>
      )}

      {/* ── la venta cerró: el código preside ── */}
      {pantalla.estado === 'vendida' && (
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: insets.bottom + spacing[10],
            gap: spacing[4],
            flexGrow: 1,
            justifyContent: 'center',
          }}
        >
          <Tarjeta>
            <View style={{ gap: spacing[4] }}>
              <CodigoAEscala
                codigo={pantalla.codigo}
                etiqueta={t('ventas.mostrador.codigoTitulo')}
                expira={t('ventas.mostrador.codigoExpira', {
                  fecha: fechaLargaHumana(
                    fechaLocalISO(pantalla.expira),
                    idioma as IdiomaSoportado,
                  ),
                })}
              />
              <Texto variante="apoyo">{t('ventas.mostrador.codigoDetalle')}</Texto>
              <Texto variante="dato">
                {t('ventas.mostrador.total', {
                  monto: monto(pantalla.total, pantalla.contexto.moneda, idioma as IdiomaSoportado),
                })}
              </Texto>
            </View>
          </Tarjeta>
          <Boton
            variante="secundario"
            bloque
            etiqueta={t('ventas.mostrador.nuevaVentaCta')}
            onPress={() => {
              setPantalla({ estado: 'cargando' });
              setIntento((n) => n + 1);
            }}
          />
        </ScrollView>
      )}

      {/* la Hoja de elección — el catálogo propio, nada más */}
      <Hoja
        visible={eligiendo}
        onCerrar={() => setEligiendo(false)}
        titulo={t('ventas.mostrador.agregarProducto')}
        altura="media"
      >
        <HojaScroll>
          <View style={{ paddingBottom: spacing[2], gap: spacing[3] }}>
            {/* EL BUSCADOR — nace con la cardinalidad real. Un desplegable
                de cientos sin dónde escribir obliga a recorrerlos, y el
                mostrador es justo donde hay alguien esperando enfrente. */}
            <Campo
              label={t('ventas.vitrina.buscar')}
              value={buscaSku}
              onChangeText={setBuscaSku}
              autoCapitalize="none"
            />
            {pantalla.estado === 'listo' &&
              pantalla.skus
                .filter((sku) => {
                  const q = buscaSku.trim().toLowerCase();
                  if (q.length === 0) return true;
                  return (
                    sku.producto_nombre.toLowerCase().includes(q) ||
                    (sku.producto_marca ?? '').toLowerCase().includes(q)
                  );
                })
                .map((sku, i) => (
                <View key={sku.sku_id}>
                  {i > 0 && <Separador />}
                  <Celda
                    titulo={sku.producto_nombre}
                    tituloEntero
                    subtitulo={
                      sku.precio_publicado === null
                        ? `${sku.presentacion} · ${t('ventas.mostrador.sinPrecio')}`
                        : sku.presentacion
                    }
                    metadataMono={
                      sku.precio_publicado !== null
                        ? `${monto(sku.precio_publicado, pantalla.contexto.moneda, idioma as IdiomaSoportado)} · ${t('ventas.stock.disponibles', { n: sku.stock_disponible })}`
                        : t('ventas.stock.disponibles', { n: sku.stock_disponible })
                    }
                    interactiva
                    accessibilityRole="button"
                    onPress={() => {
                      setSeleccion((prev) => ({
                        ...prev,
                        [sku.sku_id]: Math.max(prev[sku.sku_id] ?? 0, 1),
                      }));
                      setEligiendo(false);
                    }}
                  />
                </View>
              ))}
          </View>
        </HojaScroll>
      </Hoja>
    </View>
  );
}
