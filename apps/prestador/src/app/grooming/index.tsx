/**
 * TU OFERTA DE GROOMING — el resumen, LA PORTADA del mundo (S59-B5,
 * FASE 2 sobre el mapa aprobado): el estándar del paseo HEREDADO
 * (paseo/index.tsx:13 lo declaraba: "grooming/vet heredan taller+resumen").
 *
 * TESIS: "Tu oferta está viva y sabes exactamente qué ven las familias."
 * FIRMA: el estado de visibilidad que dice la VERDAD del motor (7.13)
 * con su camino cuando falta algo.
 *
 * Filas-lápiz ancladas al taller + EL DÓNDE como FILA INFORMATIVA
 * (enmienda 1 del gate del mapa: local v1 en solo lectura + la puerta
 * honesta del domicilio "llega pronto", SIN control muerto — asciende a
 * sección cuando D-380 dispare). S59-B6 cura 4: la fila 'A quién
 * atiendes' MURIÓ fusionada — su verdad vive en el subtítulo VIVO de
 * Servicios y precios (v3.2, mismo destino que Plan y paquete; el
 * stand-in 'familia' murió con ella). Íconos: grooming · hoy (stand-in
 * vigente) · vacaciones. Dosis baja: estados semánticos, cero acento.
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
  SERVICIOS_GROOMING,
  TALLAS_GROOMING,
  obtenerBloqueosPrestador,
  obtenerFranjasHorario,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerOfertasGroomingPropias,
  type BloqueoPrestador,
  type FranjaHorario,
  type MiPrestador,
  type OfertaGroomingPropia,
  type ServicioGrooming,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { EspejoGrooming, type ServicioEspejoGrooming } from '@/components/espejo-grooming';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      prestador: MiPrestador;
      ofertas: OfertaGroomingPropia[];
      franjas: FranjaHorario[];
      bloqueos: BloqueoPrestador[];
      cuentaActiva: boolean | null;
    };

const ORDEN_DISPLAY = [1, 2, 3, 4, 5, 6, 0] as const;

function monto(valor: number): string {
  return `$${valor.toFixed(2)}`;
}

// hoy en ISO LOCAL (hallazgo harness S55: toISOString corre el día)
function hoyISO(): string {
  const hoy = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${p(hoy.getMonth() + 1)}-${p(hoy.getDate())}`;
}

export default function OfertaGrooming() {
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
        const [rOfertas, rFranjas, rBloqueos, rCuenta] = await Promise.all([
          obtenerOfertasGroomingPropias(prestador.data.id),
          obtenerFranjasHorario(prestador.data.id),
          obtenerBloqueosPrestador(prestador.data.id),
          obtenerMiCuentaComercial(),
        ]);
        if (!vigente) return;
        if (!rOfertas.ok || !rFranjas.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({
          estado: 'listo',
          prestador: prestador.data,
          ofertas: rOfertas.data,
          franjas: rFranjas.data,
          bloqueos: rBloqueos.ok ? rBloqueos.data : [],
          cuentaActiva: rCuenta.ok ? rCuenta.data?.estado === 'activa' : null,
        });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  const vozServicio = (s: ServicioGrooming): string =>
    s === 'grooming' ? t('tallerGrooming.servicioBano') : t('tallerGrooming.servicioBanoCorte');
  const tallaCorta = (talla: 'S' | 'M' | 'L'): string => t(`tallerGrooming.tallaCorta${talla}` as const);
  const vozDia = (dia: number): string => t(`horarios.dia${dia as 0 | 1 | 2 | 3 | 4 | 5 | 6}` as const);

  const irAlTaller = (seccion?: string) =>
    router.push(seccion ? { pathname: '/grooming/taller', params: { seccion } } : '/grooming/taller');

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('ofertaGrooming.titulo')} atras onAtras={() => router.back()} />

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

      {pantalla.estado === 'listo' && pantalla.ofertas.length === 0 && (
        // peldaño 0 — la invitación que educa: el wizard de DOS pasos
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ofertaGrooming.vacioTitulo')}
            descripcion={t('ofertaGrooming.vacioCuerpo')}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('ofertaGrooming.vacioCta')}
                onPress={() => router.push({ pathname: '/grooming/taller', params: { modo: 'wizard' } })}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && pantalla.ofertas.length > 0 && (() => {
        const { prestador, ofertas, franjas, bloqueos, cuentaActiva } = pantalla;
        const activas = ofertas.filter((o) => o.activo);
        const franjasActivas = franjas.filter((f) => f.activo);
        const visible = cuentaActiva === true && activas.length > 0 && franjasActivas.length > 0;
        const razon =
          cuentaActiva !== true
            ? t('ofertaGrooming.noVisibleCuenta')
            : activas.length === 0
              ? t('ofertaGrooming.noVisibleServicios')
              : t('ofertaGrooming.noVisibleHorarios');

        const precios = activas.flatMap((o) => TALLAS_GROOMING.map((tl) => o.tallas[tl]?.precio).filter((p): p is number => p !== undefined));
        const desde = precios.length > 0 ? Math.min(...precios) : null;
        const extra = prestador.grooming_extra_pelaje_largo;
        // S59-B6 cura 4: la fila 'A quién atiendes' MURIÓ fusionada — las
        // especies viven en ESTE subtítulo vivo (v3.2, mismo destino que
        // la fila Plan y paquete del paseo)
        const especies = [...new Set(activas.flatMap((o) => o.especies))];
        const sufijoEspecies =
          especies.includes('perro') && especies.includes('gato')
            ? t('ofertaGrooming.sufijoEspeciesAmbas')
            : especies.includes('gato')
              ? t('ofertaGrooming.sufijoEspeciesGato')
              : t('ofertaGrooming.sufijoEspeciesPerro');
        const detalleServicios =
          activas.length === 0 || desde === null
            ? t('ofertaGrooming.serviciosPausados')
            : t('ofertaGrooming.serviciosDetalle', {
                lista: SERVICIOS_GROOMING.filter((s) => activas.some((o) => o.tipoServicio === s))
                  .map(vozServicio)
                  .join(' · '),
                precio: monto(desde),
              }) +
              ` · ${sufijoEspecies}` +
              (extra !== null ? ` · ${t('ofertaGrooming.sufijoExtra')}` : '');

        // EL DÓNDE (S61-B2): la unión de lo declarado por servicio +
        // el recargo del prestador — la fila informativa ASCENDIÓ a
        // fila-lápiz (la cláusula del mapa S59-B5 se cumplió: D-380/
        // domicilio disparó)
        const atiendeLocalOferta = ofertas.some((o) => o.atiendeLocal);
        const atiendeDomicilioOferta = ofertas.some((o) => o.atiendeDomicilio);
        const recargoDomicilio = prestador.grooming_recargo_domicilio;
        const detalleDonde = [
          atiendeLocalOferta ? t('ofertaGrooming.dondeLocal') : null,
          atiendeDomicilioOferta
            ? `${t('ofertaGrooming.dondeDomicilioVivo')}${recargoDomicilio !== null ? ` +${monto(recargoDomicilio)}` : ''}`
            : null,
        ]
          .filter((v): v is string => v !== null)
          .join(' · ');

        const diasActivos = ORDEN_DISPLAY.filter((d) => franjasActivas.some((f) => f.diaSemana === d));
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
        const hayBloqueoVigente = bloqueos.some((b) => b.fechaFin >= hoyISO());

        const serviciosEspejo: ServicioEspejoGrooming[] = activas.map((o) => ({
          nombre: vozServicio(o.tipoServicio),
          tallas: TALLAS_GROOMING.map((tl) => `${tallaCorta(tl)} ${monto(o.tallas[tl]?.precio ?? 0)}`).join(' · '),
          duraciones: TALLAS_GROOMING.map((tl) => o.tallas[tl]?.duracionMinutos ?? 0).join(' · '),
        }));

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
                    {visible ? t('ofertaGrooming.visibleTitulo') : t('ofertaGrooming.noVisibleTitulo')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      lineHeight: typography.size.sm * typography.leading.normal,
                      color: theme.text.secondary,
                    }}
                  >
                    {visible ? t('ofertaGrooming.visibleVoz') : razon}
                  </Text>
                </View>
              </View>
            </Tarjeta>

            {/* la entrada al taller: CTA primario en tinta (patrón hub v2) */}
            <Boton variante="primario" etiqueta={t('ofertaGrooming.editarOferta')} bloque onPress={() => irAlTaller()} />

            {/* filas-lápiz ancladas al taller (letra 19.1) */}
            <Tarjeta relleno="ninguno">
              <CeldaNavegacion
                icono="grooming"
                registro="aa"
                titulo={t('ofertaGrooming.servicios')}
                detalle={detalleServicios}
                onPress={() => irAlTaller('servicios')}
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
                titulo={t('ofertaGrooming.dondeFila')}
                detalle={detalleDonde}
                onPress={() => irAlTaller('servicios')}
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

            {/* re-gatear la SECUENCIA del wizard — SOLO dev (precedente S58) */}
            {__DEV__ && (
              <Boton
                variante="ghost"
                etiqueta={t('ofertaPaseo.devWizard')}
                bloque
                onPress={() => router.push({ pathname: '/grooming/taller', params: { modo: 'wizard' } })}
              />
            )}

            {/* así lo ve el dueño — la MISMA composición que el taller,
                acá sobre la verdad de DB */}
            <EspejoGrooming
              datos={{
                servicios: serviciosEspejo,
                extra: serviciosEspejo.length > 0 && extra !== null ? monto(extra) : null,
                // S61-B6: la verdad de DB — flags de la oferta + el
                // recargo de obtenerMiPrestador (jamás calculado acá)
                domicilio:
                  serviciosEspejo.length > 0 && atiendeDomicilioOferta
                    ? { recargo: recargoDomicilio !== null ? monto(recargoDomicilio) : null }
                    : null,
                dias: diasActivos.map(vozDia),
              }}
            />
          </ScrollView>
        );
      })()}
    </View>
  );
}
