/**
 * MIS PASEOS — el HUB del servicio (S56-A, D-338; MODELO_PASEO v1.2
 * §6.1): el DOBLE CLIC del paseo, JAMÁS una tab. Se entra por la
 * tarjeta del Hogar y por Explorar→Paseo. Tres segmentos:
 *   · Próximos — lo que viene + el ESTADO del plan (renovación,
 *     pausa de un toque — P14d).
 *   · Agenda — las salidas del período: Mover (P14a, ≥24 h dentro del
 *     período con el mismo paseador; el server es el juez).
 *   · Historial — lo caminado (sedimento; peldaño por datos).
 *
 * ESCALERA (§4b): peldaño 0 = sin planes, invitación que educa (el
 * chip del CUÁNDO); peldaño 1 = un plan con sus salidas tal cual;
 * peldaño 2 = historial rico por DATOS (paseos cerrados), no por
 * versión.
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  Icono,
  Insignia,
  SelectorOpcion,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  configurarRenovacionPlan,
  obtenerCitasDePlan,
  obtenerMisPlanesPaseo,
  obtenerSlotsDisponibles,
  saltarCitaPlan,
  type CitaDePlan,
  type PlanPaseo,
} from '@epetplace/api';
import { fechaCortaMono, obtenerIdiomaActual } from '@epetplace/i18n';
import { useTraduccion } from '@/i18n';

type Segmento = 'proximos' | 'agenda' | 'historial';

function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

export default function MisPaseos() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const idioma = obtenerIdiomaActual();

  const [segmento, setSegmento] = useState<Segmento>('proximos');
  const [planes, setPlanes] = useState<PlanPaseo[] | 'cargando' | 'error'>('cargando');
  const [citas, setCitas] = useState<Record<string, CitaDePlan[]>>({});
  const [pausando, setPausando] = useState(false);
  // Mover (P14a): la salida elegida + su plan
  const [moviendo, setMoviendo] = useState<{ cita: CitaDePlan; plan: PlanPaseo } | null>(null);
  const [fechaNueva, setFechaNueva] = useState<string | null>(null);
  const [horasNuevas, setHorasNuevas] = useState<string[] | 'cargando' | null>(null);
  const [guardandoMovida, setGuardandoMovida] = useState(false);

  const cargar = useCallback(() => {
    setPlanes('cargando');
    void (async () => {
      const r = await obtenerMisPlanesPaseo();
      if (!r.ok) {
        setPlanes('error');
        return;
      }
      setPlanes(r.data);
      const porPlan: Record<string, CitaDePlan[]> = {};
      await Promise.all(
        r.data.map(async (p) => {
          const c = await obtenerCitasDePlan(p.id);
          if (c.ok) porPlan[p.id] = c.data;
        }),
      );
      setCitas(porPlan);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  async function alternarRenovacion(plan: PlanPaseo) {
    if (pausando) return;
    setPausando(true);
    const r = await configurarRenovacionPlan({ suscripcion_id: plan.id, auto_renovar: !plan.auto_renovar });
    setPausando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t(r.data.auto_renovar ? 'plan.reanudado' : 'plan.pausado'), variante: 'exito' });
    cargar();
  }

  async function elegirFechaMovida(fecha: string, plan: PlanPaseo) {
    setFechaNueva(fecha);
    setHorasNuevas('cargando');
    if (plan.prestador_servicio_id === null) {
      setHorasNuevas([]);
      return;
    }
    const r = await obtenerSlotsDisponibles({
      prestador_id: plan.prestador_id,
      prestador_servicio_id: plan.prestador_servicio_id,
      desde: fecha,
      hasta: fecha,
    });
    setHorasNuevas(r.ok ? r.data.map((s) => s.hora.slice(0, 5)) : []);
  }

  async function moverSalida(hora: string) {
    if (moviendo === null || fechaNueva === null || guardandoMovida) return;
    setGuardandoMovida(true);
    const r = await saltarCitaPlan({ cita_id: moviendo.cita.id, nueva_fecha: fechaNueva, nueva_hora: hora });
    setGuardandoMovida(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setMoviendo(null);
    setFechaNueva(null);
    setHorasNuevas(null);
    mostrar({ texto: t('plan.movida'), variante: 'exito' });
    cargar();
  }

  const hoy = hoyLocal();
  const listaPlanes = Array.isArray(planes) ? planes : [];
  const activos = listaPlanes.filter((p) => p.estado === 'activa');

  function vozEstado(p: PlanPaseo): { etiqueta: string; estado: 'alDia' | 'info' } {
    if (p.estado === 'activa' && p.auto_renovar) return { etiqueta: t('plan.estadoActiva'), estado: 'alDia' };
    if (p.estado === 'activa') return { etiqueta: t('plan.estadoPausada'), estado: 'info' };
    return { etiqueta: t('plan.estadoVencida'), estado: 'info' };
  }

  /** Fechas candidatas para Mover: los próximos 14 días DENTRO del período. */
  function fechasDelPeriodo(p: PlanPaseo): string[] {
    const fechas: string[] = [];
    const desde = new Date();
    desde.setDate(desde.getDate() + 1);
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(desde);
      d.setDate(desde.getDate() + i);
      const iso = new Intl.DateTimeFormat('en-CA').format(d);
      if (iso >= p.periodo_inicio && iso < p.periodo_fin) fechas.push(iso);
    }
    return fechas;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('plan.hubTitulo')} atras onAtras={() => router.back()} />

      {planes === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={44} />
              <Esqueleto forma="bloque" ancho="100%" alto={96} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        </View>
      ) : planes === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.errorCargar')}
            accion={<Boton variante="secundario" etiqueta={t('cuenta.reintentar')} onPress={cargar} />}
          />
        </View>
      ) : listaPlanes.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('plan.sinPlanesTitulo')}
            descripcion={t('plan.sinPlanesDetalle')}
            accion={<Boton variante="primario" etiqueta={t('tabs.explorar')} onPress={() => router.navigate('/explorar/paseo')} />}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[4] }}>
          <SelectorOpcion
            etiqueta={t('plan.hubTitulo')}
            opciones={[
              { codigo: 'proximos', etiqueta: t('plan.segProximos') },
              { codigo: 'agenda', etiqueta: t('plan.segAgenda') },
              { codigo: 'historial', etiqueta: t('plan.segHistorial') },
            ]}
            seleccionada={segmento}
            onSelect={(codigo) => setSegmento(codigo as Segmento)}
          />

          {segmento === 'proximos' ? (
            <View style={{ gap: spacing[4] }}>
              {listaPlanes.map((p) => {
                const estado = vozEstado(p);
                const proximas = (citas[p.id] ?? []).filter((c) => c.estado === 'confirmada' && c.fecha >= hoy).slice(0, 3);
                return (
                  <Tarjeta key={p.id} relleno="ninguno">
                    <Celda
                      titulo={`${t('explorar.paseoTitulo')} · ${p.duracion_minutos} min`}
                      subtitulo={t(p.auto_renovar && p.estado === 'activa' ? 'plan.renuevaEl' : 'plan.terminaEl', {
                        fecha: fechaCortaMono(p.periodo_fin, idioma),
                      })}
                      fin={<Insignia estado={estado.estado} etiqueta={estado.etiqueta} />}
                    />
                    {proximas.map((c) => (
                      <View key={c.id}>
                        <Separador />
                        <Celda titulo={fechaCortaMono(c.fecha, idioma)} metadataMono={`${c.hora.slice(0, 5)} · ${c.duracion_minutos} min`} />
                      </View>
                    ))}
                    {p.estado === 'activa' ? (
                      <>
                        <Separador />
                        <View style={{ padding: spacing[3] }}>
                          <Boton
                            variante="ghost"
                            tamaño="sm"
                            etiqueta={t(p.auto_renovar ? 'plan.pausar' : 'plan.reanudar')}
                            cargando={pausando}
                            onPress={() => void alternarRenovacion(p)}
                          />
                        </View>
                      </>
                    ) : null}
                  </Tarjeta>
                );
              })}
            </View>
          ) : segmento === 'agenda' ? (
            <View style={{ gap: spacing[4] }}>
              {activos.length === 0 ? (
                <EstadoVacio registro="seccion" titulo={t('plan.vacioSegmento')} />
              ) : (
                activos.map((p) => {
                  const delPeriodo = (citas[p.id] ?? []).filter((c) => c.estado === 'confirmada' && c.fecha >= hoy);
                  return (
                    <Tarjeta key={p.id} relleno="ninguno">
                      {delPeriodo.length === 0 ? (
                        <Celda titulo={t('plan.vacioSegmento')} />
                      ) : (
                        delPeriodo.map((c, i) => (
                          <View key={c.id}>
                            {i > 0 ? <Separador /> : null}
                            <Celda
                              titulo={fechaCortaMono(c.fecha, idioma)}
                              metadataMono={`${c.hora.slice(0, 5)} · ${c.duracion_minutos} min`}
                              fin={
                                <Boton
                                  variante="ghost"
                                  tamaño="sm"
                                  etiqueta={t('plan.mover')}
                                  onPress={() => {
                                    setMoviendo({ cita: c, plan: p });
                                    setFechaNueva(null);
                                    setHorasNuevas(null);
                                  }}
                                />
                              }
                            />
                          </View>
                        ))
                      )}
                    </Tarjeta>
                  );
                })
              )}
            </View>
          ) : (
            <View style={{ gap: spacing[4] }}>
              {listaPlanes.every((p) => (citas[p.id] ?? []).every((c) => c.estado === 'confirmada' && c.fecha >= hoy)) ? (
                <EstadoVacio registro="seccion" titulo={t('plan.vacioSegmento')} />
              ) : (
                listaPlanes.map((p) => {
                  const pasadas = (citas[p.id] ?? []).filter((c) => c.estado !== 'confirmada' || c.fecha < hoy);
                  if (pasadas.length === 0) return null;
                  return (
                    <Tarjeta key={p.id} relleno="ninguno">
                      {pasadas.map((c, i) => (
                        <View key={c.id}>
                          {i > 0 ? <Separador /> : null}
                          <Celda
                            titulo={fechaCortaMono(c.fecha, idioma)}
                            metadataMono={`${c.hora.slice(0, 5)} · ${c.duracion_minutos} min`}
                            fin={
                              // Ley 3: jamás el estado crudo del modelo
                              <Insignia
                                estado={c.estado === 'completada' ? 'alDia' : 'info'}
                                etiqueta={t(c.estado === 'completada' ? 'plan.salidaCompletada' : 'plan.salidaCancelada')}
                              />
                            }
                          />
                        </View>
                      ))}
                    </Tarjeta>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Mover una salida (P14a — el server valida ≥24 h, período y cupo) */}
      <Hoja
        visible={moviendo !== null}
        titulo={t('plan.moverTitulo')}
        onCerrar={() => {
          setMoviendo(null);
          setFechaNueva(null);
          setHorasNuevas(null);
        }}
        conCerrar
      >
        <HojaScroll>
          {moviendo !== null ? (
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
                {t('plan.moverVoz')}
              </Text>
              <SelectorOpcion
                disposicion="tira"
                etiqueta={t('plan.moverDia')}
                opciones={fechasDelPeriodo(moviendo.plan).map((f) => ({ codigo: f, etiqueta: fechaCortaMono(f, idioma) }))}
                seleccionada={fechaNueva ?? undefined}
                onSelect={(f) => void elegirFechaMovida(f, moviendo.plan)}
              />
              {horasNuevas === 'cargando' ? (
                <EsqueletoGrupo>
                  <Esqueleto forma="bloque" ancho="100%" alto={44} />
                </EsqueletoGrupo>
              ) : horasNuevas !== null && horasNuevas.length === 0 ? (
                <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                  {t('plan.moverSinHoras')}
                </Text>
              ) : horasNuevas !== null ? (
                <SelectorOpcion
                  disposicion="grilla"
                  etiqueta={t('plan.moverHora')}
                  opciones={horasNuevas.map((h) => ({ codigo: h, etiqueta: h }))}
                  seleccionada={undefined}
                  onSelect={(h) => void moverSalida(h)}
                />
              ) : null}
            </View>
          ) : null}
        </HojaScroll>
      </Hoja>
    </View>
  );
}
