/**
 * TU OFERTA DE PASEO — el resumen, LA PORTADA del mundo Paseo (S58-B
 * B1b, adenda FIRMADA del founder): entrar a Paseo aterriza acá.
 * Estado ("Visible para las familias" — verdad de DB, jamás afirmada
 * sin leerla), una fila por sección con entrada al taller ANCLADA a esa
 * sección, y el espejo "Así lo ve el dueño" al pie (verdad de DB; el
 * del taller responde al borrador — misma composición, EspejoOferta).
 *
 * TESIS: "Tu oferta está viva y sabes exactamente qué ven las familias."
 * FIRMA: el estado de visibilidad que dice la VERDAD del motor (7.13:
 * no se oferta quien no puede cobrar) con su camino cuando falta algo.
 *
 * El estándar es generalizable: grooming/vet heredan taller+resumen.
 * Verdad de pantalla: refetch en focus (volver del taller la refresca).
 * Dosis baja (test 7): cero acento de capa; los puntos de estado son
 * tokens semánticos (status), no acento.
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  CeldaNavegacion,
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
  BLOQUES_PASEO,
  obtenerBloqueosPrestador,
  obtenerFranjasHorario,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerOfertasPaseoPropias,
  obtenerZonasDePrestador,
  type BloqueoPrestador,
  type BloquePaseo,
  type FranjaHorario,
  type OfertaPaseoPropia,
  type ZonaCobertura,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { EspejoOferta } from '@/components/espejo-oferta';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      ofertas: OfertaPaseoPropia[];
      franjas: FranjaHorario[];
      bloqueos: BloqueoPrestador[];
      zonas: ZonaCobertura[];
      cuentaActiva: boolean | null;
    };

const ORDEN_DISPLAY = [1, 2, 3, 4, 5, 6, 0] as const;

function monto(valor: number): string {
  return `$${valor.toFixed(2)}`;
}

// hoy en ISO LOCAL (hallazgo harness S55: toISOString corre el día
// post-19:00 en UTC-5 — la fecha se arma con getFullYear/Month/Date)
function hoyISO(): string {
  const hoy = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${p(hoy.getMonth() + 1)}-${p(hoy.getDate())}`;
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

export default function OfertaPaseo() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const [rOfertas, rFranjas, rBloqueos, rZonas, rCuenta] = await Promise.all([
          obtenerOfertasPaseoPropias(prestador.data.id),
          obtenerFranjasHorario(prestador.data.id),
          obtenerBloqueosPrestador(prestador.data.id),
          obtenerZonasDePrestador(prestador.data.id),
          obtenerMiCuentaComercial(),
        ]);
        if (!vigente) return;
        if (!rOfertas.ok || !rFranjas.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({
          estado: 'listo',
          ofertas: rOfertas.data,
          franjas: rFranjas.data,
          bloqueos: rBloqueos.ok ? rBloqueos.data : [],
          zonas: rZonas.ok ? rZonas.data : [],
          cuentaActiva: rCuenta.ok ? rCuenta.data?.estado === 'activa' : null,
        });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  const etiquetaCorta = (b: BloquePaseo): string => t(`taller.d${b}` as const);
  const vozDia = (dia: number): string => t(`horarios.dia${dia as 0 | 1 | 2 | 3 | 4 | 5 | 6}` as const);

  const irAlTaller = (seccion?: string) =>
    router.push(seccion ? { pathname: '/paseo/taller', params: { seccion } } : '/paseo/taller');

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('ofertaPaseo.titulo')} atras onAtras={() => router.back()} />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="55%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={80} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={200} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ofertaPaseo.error')}
            descripcion={t('ofertaPaseo.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('ofertaPaseo.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && pantalla.ofertas.length === 0 && pantalla.franjas.length === 0 && (
        // peldaño 0 — la invitación que educa: el taller es el camino
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ofertaPaseo.vacioTitulo')}
            descripcion={t('ofertaPaseo.vacioCuerpo')}
            accion={
              // entrada por estado (v3): sin oferta = el WIZARD guía los 3 pasos
              <Boton
                variante="primario"
                etiqueta={t('ofertaPaseo.vacioCta')}
                onPress={() => router.push({ pathname: '/paseo/taller', params: { modo: 'wizard' } })}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && (pantalla.ofertas.length > 0 || pantalla.franjas.length > 0) && (() => {
        const { ofertas, franjas, bloqueos, zonas, cuentaActiva } = pantalla;
        const activas = ofertas.filter((o) => o.activo);
        const franjasActivas = franjas.filter((f) => f.activo);
        const visible = cuentaActiva === true && activas.length > 0 && franjasActivas.length > 0;
        const razon =
          cuentaActiva !== true
            ? t('ofertaPaseo.noVisibleCuenta')
            : activas.length === 0
              ? t('ofertaPaseo.noVisibleDuraciones')
              : t('ofertaPaseo.noVisibleHorarios');

        const desde = activas.length > 0 ? Math.min(...activas.map((o) => o.precio)) : null;
        const diasActivos = ORDEN_DISPLAY.filter((d) => franjasActivas.some((f) => f.diaSemana === d));
        const hayBloqueoVigente = bloqueos.some((b) => b.fechaFin >= hoyISO());

        const conPlan = activas.some((o) => o.precioPlan !== null);
        const conPaquete = activas.some((o) => o.precioPaquete !== null);
        // v3.2: la fila "Plan y paquete" MURIÓ (Chanel, mismo destino que
        // Duraciones) — su verdad vive en ESTE subtítulo vivo
        const sufijoPlanPaquete =
          conPlan && conPaquete
            ? ` · ${t('ofertaPaseo.sufijoConPlanYPaquete')}`
            : conPlan
              ? ` · ${t('ofertaPaseo.sufijoConPlan')}`
              : conPaquete
                ? ` · ${t('ofertaPaseo.sufijoConPaquete')}`
                : '';
        const detalleDuraciones =
          activas.length === 0
            ? t('ofertaPaseo.duracionesPausadas')
            : (activas.length === 1
                ? t('ofertaPaseo.duracionesDetalleUna', { precio: monto(desde as number) })
                : t('ofertaPaseo.duracionesDetalle', { n: activas.length, precio: monto(desde as number) })) +
              sufijoPlanPaquete;

        const detalleHorarios =
          franjasActivas.length === 0
            ? t('ofertaPaseo.sinHorarios')
            : `${
                diasActivos.length === 1 ? t('ofertaPaseo.diaUno') : t('ofertaPaseo.dias', { n: diasActivos.length })
              } · ${
                franjasActivas.length === 1
                  ? t('ofertaPaseo.franjaUna')
                  : t('ofertaPaseo.franjas', { n: franjasActivas.length })
              }`;

        return (
          <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[6] }}>
            {/* el estado — la verdad del motor, con camino cuando falta algo */}
            <Tarjeta>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    marginTop: 5,
                    backgroundColor: visible ? theme.status.success : theme.status.warning,
                  }}
                />
                <View style={{ flex: 1, gap: spacing[1] }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.base,
                      color: theme.text.primary,
                    }}
                  >
                    {visible ? t('ofertaPaseo.visibleTitulo') : t('ofertaPaseo.noVisibleTitulo')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      lineHeight: typography.size.sm * typography.leading.normal,
                      color: theme.text.secondary,
                    }}
                  >
                    {visible ? t('ofertaPaseo.visibleVoz') : razon}
                  </Text>
                </View>
              </View>
            </Tarjeta>

            {/* CURA DE GATE (founder): la entrada al taller es el CTA
                primario en tinta, ARRIBA — patrón del hub v2 */}
            <Boton variante="primario" etiqueta={t('ofertaPaseo.editarOferta')} bloque onPress={() => irAlTaller()} />

            {/* v3.2: CUATRO filas vestidas — CeldaNavegacion con su ícono
                del registry (letra 19.1, como sus hermanas de Cuenta).
                'hoy' hace de calendario para horarios: el glifo
                calendario no existe en el registry — pedido a la A. */}
            <Tarjeta relleno="ninguno">
              <CeldaNavegacion
                icono="paseo"
                registro="aa"
                titulo={t('ofertaPaseo.duraciones')}
                detalle={detalleDuraciones}
                onPress={() => irAlTaller('duraciones')}
              />
              <Separador />
              <CeldaNavegacion
                icono="hoy"
                registro="aa"
                titulo={t('ofertaPaseo.horarios')}
                detalle={detalleHorarios}
                onPress={() => irAlTaller('horarios')}
              />
              <Separador />
              <CeldaNavegacion
                icono="ubicacion"
                registro="aa"
                titulo={t('taller.zonasTitulo')}
                detalle={zonas.length > 0 ? zonas.map((z) => z.ciudad.nombre).join(' · ') : t('ofertaPaseo.zonasSin')}
                onPress={() => irAlTaller('zonas')}
              />
              <Separador />
              <CeldaNavegacion
                icono="vacaciones"
                registro="aa"
                titulo={t('negocio.vacaciones')}
                detalle={hayBloqueoVigente ? t('ofertaPaseo.vacacionesCon') : t('ofertaPaseo.vacacionesSin')}
                onPress={() => router.push('/vacaciones')}
              />
            </Tarjeta>

            {/* v3.1 cura 2(b): re-gatear la SECUENCIA del wizard sin
                fabricar prestadores cada vez — SOLO dev (__DEV__ no viaja
                a preview/producción, precedente S54 camino triste) */}
            {__DEV__ && (
              <Boton
                variante="ghost"
                etiqueta={t('ofertaPaseo.devWizard')}
                bloque
                onPress={() => router.push({ pathname: '/paseo/taller', params: { modo: 'wizard' } })}
              />
            )}

            {/* así lo ve el dueño — la MISMA composición que el taller,
                acá sobre la verdad de DB */}
            <EspejoOferta
              datos={{
                duraciones: BLOQUES_PASEO.filter((b) => activas.some((o) => o.duracionMinutos === b)).map(etiquetaCorta),
                desde,
                conPlan,
                conPaquete,
                dias: diasActivos.map(vozDia),
              }}
            />
          </ScrollView>
        );
      })()}
    </View>
  );
}
