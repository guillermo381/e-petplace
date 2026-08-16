/**
 * STOCK — el ajuste (S96-C · C-B3 · LETRA_PANEL §2.3).
 *
 * BOCETO M1:
 *  · TESIS: «El inventario es plata: se ve lo que hay y todo movimiento
 *    deja su porqué.»
 *  · FIRMA: el MOTIVO como campo de primera clase — sin motivo el botón
 *    no se enciende, y el porqué se dice («el inventario es plata»).
 *  · CHANEL: sin buscador ni filtros (catálogo v1 = seis productos; un
 *    buscador acá sería un accesorio) · sin precio (no es su trabajo).
 *  · ESTADOS: cargando · error · vacío (catálogo sin publicar) · listo.
 *
 * El ajuste es un DELTA sobre el ledger (`inventario_movimientos` — el
 * saldo lo materializa un trigger), medido del cuerpo de
 * `ajustar_stock_vendedor`: positivo = entraron, negativo = salieron,
 * cero rebota. La pantalla pregunta QUÉ PASÓ (entraron/salieron) en vez
 * de pedir un número con signo — nadie piensa en deltas con signo
 * mientras cuenta bolsas.
 *
 * ✅ EL DESVÍO DEL NOMBRE SE PAGÓ: A ensanchó `SkuDelVendedor` con
 * `producto_nombre`/`presentacion` (merge `f3029182`) y esta pantalla
 * migró EN EL ACTO, como estaba declarado. El código de SKU queda como
 * dato de máquina en la Hoja del ajuste — es la referencia del vendedor,
 * no el título de la fila.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  MarcaDeAgua,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { ajustarStockVendedor, listarSkusDelVendedor, type SkuDelVendedor } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { contextoVentas } from '@/lib/cuenta-ventas';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; skus: SkuDelVendedor[] };

export default function StockVentas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  const [ajustando, setAjustando] = useState<SkuDelVendedor | null>(null);
  const [direccion, setDireccion] = useState<'entraron' | 'salieron' | null>(null);
  const [cantidadTexto, setCantidadTexto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);

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
        setPantalla({ estado: 'listo', skus: skus.data });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  function abrirAjuste(sku: SkuDelVendedor) {
    setDireccion(null);
    setCantidadTexto('');
    setMotivo('');
    setAjustando(sku);
  }

  const cantidad = Number(cantidadTexto);
  const cantidadValida = Number.isInteger(cantidad) && cantidad > 0;
  const listoParaGuardar = direccion !== null && cantidadValida && motivo.trim().length > 0;

  async function guardar() {
    if (guardando || ajustando === null || direccion === null || !listoParaGuardar) return;
    setGuardando(true);
    const delta = direccion === 'entraron' ? cantidad : -cantidad;
    const r = await ajustarStockVendedor(ajustando.sku_id, delta, motivo);
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('ventas.stock.exito'), variante: 'exito' });
    setAjustando(null);
    setIntento((n) => n + 1);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('ventas.stock.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
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

      {pantalla.estado === 'listo' && pantalla.skus.length === 0 && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ventas.stock.vacioTitulo')}
            descripcion={t('ventas.stock.vacioDetalle')}
          />
        </View>
      )}

      {pantalla.estado === 'listo' && pantalla.skus.length > 0 && (
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: insets.bottom + spacing[8],
          }}
        >
          <Tarjeta relleno="ninguno">
            {pantalla.skus.map((sku, i) => (
              <View key={sku.sku_id}>
                {i > 0 && <Separador />}
                <Celda
                  titulo={sku.producto_nombre}
                  tituloEntero
                  subtitulo={[
                    sku.presentacion,
                    sku.stock_reservado > 0
                      ? t('ventas.stock.reservadas', { n: sku.stock_reservado })
                      : null,
                  ]
                    .filter((s): s is string => s !== null && s.length > 0)
                    .join(' · ')}
                  metadataMono={t('ventas.stock.disponibles', { n: sku.stock_disponible })}
                  fin={
                    <Boton
                      variante="ghost"
                      tamaño="sm"
                      etiqueta={t('ventas.stock.ajustarCta')}
                      onPress={() => abrirAjuste(sku)}
                    />
                  }
                />
              </View>
            ))}
          </Tarjeta>
        </ScrollView>
      )}

      {/* la Hoja del ajuste — el motivo manda */}
      <Hoja
        visible={ajustando !== null}
        onCerrar={() => {
          if (!guardando) setAjustando(null);
        }}
        titulo={t('ventas.stock.ajusteTitulo')}
        altura="media"
        /* 🔴 S99-C · EL CTA VIVE EN EL PIE, FUERA DEL SCROLL (pieza de B,
           pedido de C con medición). La caminata en aparato lo midió: la
           Hoja abría mostrando dos campos y una frase, y **«Guardar el
           ajuste» quedaba fuera de pantalla** — había que scrollear para
           ver la acción de la Hoja. Ahora el contenido corre por debajo y
           el compromiso no se mueve. La línea de la ayuda sube con él
           porque el CTA apagado tiene que decir QUÉ FALTA a la vista
           (precedente S73): un botón gris cuya razón no se ve manda a
           adivinar. */
        pie={
          <>
            <Texto variante="apoyo">{t('ventas.stock.motivoAyuda')}</Texto>
            <Boton
              variante="primario"
              bloque
              cargando={guardando}
              deshabilitado={!listoParaGuardar}
              etiqueta={t('ventas.stock.guardarCta')}
              onPress={() => void guardar()}
            />
          </>
        }
      >
        <HojaScroll>
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            {ajustando !== null && <Texto variante="dato">{ajustando.sku_vendedor}</Texto>}
            <SelectorOpcion
              acento="oficio"
              etiqueta={t('ventas.stock.direccion')}
              opciones={[
                { codigo: 'entraron', etiqueta: t('ventas.stock.entraron') },
                { codigo: 'salieron', etiqueta: t('ventas.stock.salieron') },
              ]}
              seleccionada={direccion ?? undefined}
              onSelect={(codigo) => setDireccion(codigo === 'entraron' ? 'entraron' : 'salieron')}
            />
            <Campo
              label={t('ventas.stock.cantidad')}
              value={cantidadTexto}
              onChangeText={setCantidadTexto}
              keyboardType="number-pad"
              deshabilitado={guardando}
            />
            <Campo
              label={t('ventas.stock.motivo')}
              value={motivo}
              onChangeText={setMotivo}
              deshabilitado={guardando}
            />
          </View>
        </HojaScroll>
      </Hoja>
    </View>
  );
}
