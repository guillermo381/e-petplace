/**
 * TU OFERTA DE ADIESTRAMIENTO — la portada del mundo (S65-B2 Pieza 1,
 * hallazgo founder del recorrido de campo: paseo y grooming abren con
 * portada; adiestramiento entraba DIRECTO al taller). Espejo del
 * estándar paseo/index (S58-B B1b) heredado por grooming/index (S59-B5).
 *
 * TESIS: "Tu oferta está viva y sabes exactamente qué ven las familias."
 * FIRMA: el estado de visibilidad que dice la VERDAD del motor
 * (_adiestramiento_ofertas_cobrables: cuenta activa 7.13 · oferta activa
 * con precio · especies declaradas · y la grilla vive de las franjas).
 *
 * Las filas dicen QUÉ SE VENDE (§1 del modelo: la sesión suelta y el
 * programa) y anclan al taller. Restos declarados en el reporte S65-B2:
 * sin espejo "así lo ve el dueño" (el componente espejo del oficio no
 * existe) y sin fila de horarios (el taller de adiestramiento no porta
 * la sección compartida — el prestador multi-oficio hereda las franjas
 * universales; la voz del estado lo dice honesto).
 * Safe-area (requisito duro S65): el cierre del scroll suma
 * insets.bottom — el CTA jamás queda bajo la barra de navegación.
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
  obtenerBloqueosPrestador,
  obtenerFranjasHorario,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerOfertaAdiestramientoPropia,
  type BloqueoPrestador,
  type FranjaHorario,
  type MundoAdiestramientoPropio,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      mundo: MundoAdiestramientoPropio;
      franjas: FranjaHorario[];
      bloqueos: BloqueoPrestador[];
      cuentaActiva: boolean | null;
    };

// hoy en ISO LOCAL (hallazgo harness S55: toISOString corre el día)
function hoyISO(): string {
  const hoy = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${p(hoy.getMonth() + 1)}-${p(hoy.getDate())}`;
}

export default function OfertaAdiestramiento() {
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
        const [rMundo, rFranjas, rBloqueos, rCuenta] = await Promise.all([
          obtenerOfertaAdiestramientoPropia(prestador.data.id),
          obtenerFranjasHorario(prestador.data.id),
          obtenerBloqueosPrestador(prestador.data.id),
          obtenerMiCuentaComercial(),
        ]);
        if (!vigente) return;
        if (!rMundo.ok || !rFranjas.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({
          estado: 'listo',
          mundo: rMundo.data,
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

  const irAlTaller = () => router.push('/adiestramiento/taller');

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('ofertaAdiestramiento.titulo')}
        atras
        onAtras={() => router.back()}
      />

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

      {pantalla.estado === 'listo' && pantalla.mundo.oferta === null && (
        // peldaño 0 — la invitación que educa: qué se vende (§1)
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ofertaAdiestramiento.vacioTitulo')}
            descripcion={t('ofertaAdiestramiento.vacioCuerpo')}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('ofertaAdiestramiento.vacioCta')}
                onPress={irAlTaller}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && pantalla.mundo.oferta !== null && (() => {
        const { mundo, franjas, bloqueos, cuentaActiva } = pantalla;
        const oferta = mundo.oferta as NonNullable<MundoAdiestramientoPropio['oferta']>;

        const ofertaViva = oferta.activo && oferta.precio !== null;
        const especiesDeclaradas = oferta.especies.length > 0;
        const franjasActivas = franjas.filter((f) => f.activo);
        // la verdad del resolutor: cuenta 7.13 + oferta activa con precio
        // + especies declaradas (el guard del fantasma) + franjas para la
        // grilla (_inicios_disponibles_prestador)
        const visible =
          cuentaActiva === true && ofertaViva && especiesDeclaradas && franjasActivas.length > 0;
        const razon =
          cuentaActiva !== true
            ? t('ofertaAdiestramiento.noVisibleCuenta')
            : !ofertaViva
              ? t('ofertaAdiestramiento.noVisibleOferta')
              : !especiesDeclaradas
                ? t('ofertaAdiestramiento.noVisibleEspecies')
                : t('ofertaAdiestramiento.noVisibleHorarios');

        const detalleSesion = ofertaViva
          ? [
              `$${(oferta.precio as number).toFixed(2)}`,
              oferta.duracionMinutos !== null ? `${oferta.duracionMinutos} min` : null,
            ]
              .filter((v): v is string => v !== null)
              .join(' · ')
          : t('ofertaAdiestramiento.sesionPausada');

        const programasActivos = mundo.programas.filter((p) => p.activo);
        const detalleProgramas =
          programasActivos.length === 0
            ? t('ofertaAdiestramiento.programasSin')
            : programasActivos.length === 1
              ? t('ofertaAdiestramiento.programasUno')
              : t('ofertaAdiestramiento.programasN', { n: programasActivos.length });

        const hayBloqueoVigente = bloqueos.some((b) => b.fechaFin >= hoyISO());

        return (
          <ScrollView
            contentContainerStyle={{
              padding: spacing[4],
              paddingBottom: spacing[10] + insets.bottom,
              gap: spacing[6],
            }}
          >
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
                    {visible
                      ? t('ofertaAdiestramiento.visibleTitulo')
                      : t('ofertaAdiestramiento.noVisibleTitulo')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      lineHeight: typography.size.sm * typography.leading.normal,
                      color: theme.text.secondary,
                    }}
                  >
                    {visible ? t('ofertaAdiestramiento.visibleVoz') : razon}
                  </Text>
                </View>
              </View>
            </Tarjeta>

            {/* la entrada al taller: CTA primario (patrón hub v2) */}
            <Boton
              variante="primario"
              etiqueta={t('ofertaAdiestramiento.editarOferta')}
              bloque
              onPress={irAlTaller}
            />

            {/* filas-lápiz — QUÉ SE VENDE (§1) ancladas al taller.
                'hoy' hace de stand-in para Programas: el glifo
                programa/escalera no existe en el registry — pedido a
                la A (precedente del calendario de horarios). */}
            <Tarjeta relleno="ninguno">
              <CeldaNavegacion
                icono="training"
                registro="aa"
                titulo={t('ofertaAdiestramiento.sesionFila')}
                detalle={detalleSesion}
                onPress={irAlTaller}
              />
              <Separador />
              <CeldaNavegacion
                icono="hoy"
                registro="aa"
                titulo={t('ofertaAdiestramiento.programasFila')}
                detalle={detalleProgramas}
                onPress={irAlTaller}
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
          </ScrollView>
        );
      })()}
    </View>
  );
}
