/**
 * LIQUIDACIONES v1 — el desglose de lo que vas a cobrar (S55-B B1,
 * RUTA 3.1.D / B2.4, DISEÑO_EXPERIENCIA §13 Zona 4: "el que trabaja ve
 * lo que va a cobrar"). Todo por RLS relevada S55: eventos y
 * liquidaciones propios vía owner de la cuenta comercial; la vista
 * v_eventos_con_origen corre security_invoker.
 *
 * LA ESCALERA declarada (§4b):
 *   peldaño 0 — ledger vacío: invitación que EDUCA cómo llega la plata
 *     (servicio pagado → registrado al terminar la atención → la
 *     plataforma agrupa y transfiere). JAMÁS $0. Si la cuenta comercial
 *     no está activa, el primer paso real es esa y se dice.
 *   peldaño 1 — primeros eventos pendiente_liquidar: el total en display
 *     (MATIZ LEY 3: DM Sans light tabular-nums) + una fila por evento
 *     (servicio, fecha del devengo en mono, monto payout). Honestidad de
 *     densidad: 1 evento = 1 fila. "Esperando liquidación" — cero
 *     promesas de fecha que el motor no da. Pago simulado SE DECLARA
 *     por fila (regla de la tanda).
 *   peldaño 2 — liquidaciones emitidas: una fila por liquidación (estado
 *     honesto del enum, período, monto neto). Sube por DATOS: la RLS ya
 *     entrega las filas cuando existan, cero refactor. El detalle de una
 *     liquidación (sus eventos) es v2.
 *
 * Verdad firme (test 8): SOLO estado='pendiente_liquidar' en la espera;
 * las liquidaciones tal cual su estado real. Dosis baja (test 7): cero
 * acento de capa extra, CTA en tinta, sin gradiente.
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerDesglosePendienteLiquidar,
  obtenerMisLiquidaciones,
  obtenerMiCuentaComercial,
  type EventoPendienteLiquidar,
  type EstadoLiquidacion,
  type LiquidacionPropia,
} from '@epetplace/api';
import { fechaCortaMono } from '@epetplace/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      eventos: EventoPendienteLiquidar[];
      liquidaciones: LiquidacionPropia[];
      /** true = la cuenta comercial NO está activa (o no existe) — el peldaño 0 señala ese paso. */
      faltaCuentaActiva: boolean;
    };

// mismo formato que el checkout del dueño (S54-A): plata chica en mono
function monto(valor: number): string {
  return `$${valor.toFixed(2)}`;
}

function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: typography.size.md,
        color: theme.text.primary,
      }}
    >
      {texto}
    </Text>
  );
}

export default function Liquidaciones() {
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
        const [rEventos, rLiquidaciones, rCuenta] = await Promise.all([
          obtenerDesglosePendienteLiquidar(),
          obtenerMisLiquidaciones(),
          obtenerMiCuentaComercial(),
        ]);
        if (!vigente) return;
        if (!rEventos.ok || !rLiquidaciones.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        // si la lectura de la cuenta falla, no se afirma nada sobre ella
        const faltaCuentaActiva = rCuenta.ok ? rCuenta.data === null || rCuenta.data.estado !== 'activa' : false;
        setPantalla({
          estado: 'listo',
          eventos: rEventos.data,
          liquidaciones: rLiquidaciones.data,
          faltaCuentaActiva,
        });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  const vozServicio = (e: EventoPendienteLiquidar): string =>
    e.tipoServicio?.startsWith('paseo') ? t('cobros.servicioPaseo') : t('cobros.servicioGenerico');

  const vozEstadoLiquidacion = (estado: EstadoLiquidacion): string => {
    switch (estado) {
      case 'borrador':
      case 'calculado':
        return t('cobros.estadoEnPreparacion');
      case 'aprobado':
        return t('cobros.estadoAprobada');
      case 'pagado':
        return t('cobros.estadoPagada');
      case 'en_disputa':
        return t('cobros.estadoEnRevision');
      case 'anulada':
        return t('cobros.estadoAnulada');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('cobros.titulo')} atras onAtras={() => router.back()} />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="45%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={88} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cobros.error')}
            descripcion={t('cobros.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('cobros.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && pantalla.eventos.length === 0 && pantalla.liquidaciones.length === 0 && (
        // peldaño 0 — la invitación que educa
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cobros.vacioTitulo')}
            descripcion={t('cobros.vacioCuerpo')}
            accion={
              pantalla.faltaCuentaActiva ? (
                // el paso real hacia cobrar, con su porqué arriba del CTA
                // (la descripcion de EstadoVacio trunca a 3 líneas — acá no)
                <View style={{ gap: spacing[3], alignItems: 'center' }}>
                  <Text
                    style={{
                      textAlign: 'center',
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      lineHeight: typography.size.sm * typography.leading.normal,
                      color: theme.text.secondary,
                    }}
                  >
                    {t('cobros.vacioSinCuentaActiva')}
                  </Text>
                  <Boton
                    variante="primario"
                    etiqueta={t('cobros.vacioCta')}
                    onPress={() => router.push('/cuenta-comercial')}
                  />
                </View>
              ) : undefined
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && (pantalla.eventos.length > 0 || pantalla.liquidaciones.length > 0) && (
        <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[6] }}>
          {pantalla.eventos.length > 0 && (
            // peldaño 1 — la espera, con el total en display
            <View style={{ gap: spacing[3] }}>
              <TituloBloque texto={t('cobros.esperandoTitulo')} />
              <Tarjeta relleno="amplio">
                <View style={{ gap: 2 }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.light,
                      fontSize: typography.size['3xl'] ?? 34,
                      fontVariant: ['tabular-nums'],
                      color: theme.text.primary,
                    }}
                  >
                    {monto(pantalla.eventos.reduce((s, e) => s + (e.montoPayout ?? 0), 0))}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {pantalla.eventos.length === 1
                      ? t('cobros.esperandoUno')
                      : t('cobros.esperandoVarios', { cantidad: pantalla.eventos.length })}
                  </Text>
                </View>
              </Tarjeta>
              <Tarjeta relleno="ninguno">
                {pantalla.eventos.map((e, i) => (
                  <View key={e.id}>
                    {i > 0 && <Separador />}
                    <Celda
                      titulo={vozServicio(e)}
                      subtitulo={e.pagoSimulado ? t('cobros.pagoSimulado') : undefined}
                      metadataMono={fechaCortaMono(e.fechaDevengo.slice(0, 10), idioma)}
                      fin={
                        e.montoPayout !== null ? (
                          <Text
                            style={{
                              fontFamily: typography.family.mono.regular,
                              fontSize: typography.size.sm,
                              letterSpacing: typography.tracking.mono,
                              color: theme.text.primary,
                            }}
                          >
                            {monto(e.montoPayout)}
                          </Text>
                        ) : undefined
                      }
                    />
                  </View>
                ))}
              </Tarjeta>
              {pantalla.liquidaciones.length === 0 && (
                // educa UNA vez cómo sigue; cuando existan liquidaciones, se ven solas
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.xs,
                    lineHeight: typography.size.xs * typography.leading.normal,
                    color: theme.text.tertiary,
                  }}
                >
                  {t('cobros.esperandoEducacion')}
                </Text>
              )}
            </View>
          )}

          {pantalla.liquidaciones.length > 0 && (
            // peldaño 2 — las liquidaciones tal cual su estado
            <View style={{ gap: spacing[3] }}>
              <TituloBloque texto={t('cobros.liquidacionesTitulo')} />
              <Tarjeta relleno="ninguno">
                {pantalla.liquidaciones.map((l, i) => (
                  <View key={l.id}>
                    {i > 0 && <Separador />}
                    <Celda
                      titulo={vozEstadoLiquidacion(l.estado)}
                      subtitulo={
                        l.eventosCount === 1
                          ? t('cobros.esperandoUno')
                          : t('cobros.esperandoVarios', { cantidad: l.eventosCount })
                      }
                      metadataMono={fechaCortaMono(l.periodoFin.slice(0, 10), idioma)}
                      fin={
                        <Text
                          style={{
                            fontFamily: typography.family.mono.regular,
                            fontSize: typography.size.sm,
                            letterSpacing: typography.tracking.mono,
                            color: theme.text.primary,
                          }}
                        >
                          {monto(l.montoNetoAPagar)}
                        </Text>
                      }
                    />
                  </View>
                ))}
              </Tarjeta>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
