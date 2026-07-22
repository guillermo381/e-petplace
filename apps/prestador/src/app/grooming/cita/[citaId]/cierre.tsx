// ─────────────────────────────────────────────────────────────────────
// EL DESPUÉS del grooming — /grooming/cita/[citaId]/cierre (S60-B1,
// §8: cierre rápido con piso de calidad). Dosis baja. ÚLTIMA pantalla
// del E2E del groomer: cerrar con calidad DEVENGA (variante (b)).
//
// TESIS: el trabajo queda contado con verdad — lo que hiciste, cómo
// llegó y cómo se fue, y la familia lo recibe.
// FIRMA: el parte se arma solo de lo REGISTRADO — la pantalla solo
// pide lo que falta del piso (estado de pelaje reparable en cierre) y
// el mensaje humano.
//
// 7.5: terminada → modo edición · cerrada_con_calidad → modo lectura ·
// otros estados redirigen. Datos server-side (obtener_resumen_cierre).
//
// S61-B3.0 — las DOS piezas de S60-A3 cableadas:
//   · PRÓXIMA SESIÓN SUGERIDA (§8: fecha, JAMÁS cita — no toca la
//     agenda): Hoja con selector simple de horizontes (el groomer
//     piensa en semanas); viaja con el cierre (p_proxima_sesion) y en
//     lectura se muestra el eco de la RPC.
//   · REPARACIÓN DE SERVICIOS post-terminar: agregar el servicio que
//     faltó (agregar_servicio_grooming_en_cierre) — el guard de UI del
//     Durante queda de cinturón; quitar sigue siendo del Durante.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  Hoja,
  Insignia,
  SelectorOpcion,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  agregarServicioGroomingEnCierre,
  cerrarGroomingConCalidad,
  obtenerEstadosPelajeCatalogo,
  obtenerGroomingPorCita,
  obtenerResumenCierreGrooming,
  obtenerServiciosGroomingCatalogo,
  registrarEstadoPelajeEnCierre,
  type EstadoPelajeCatalogo,
  type ResumenCierreGrooming,
  type ServicioGroomingCatalogo,
} from '@epetplace/api';
import { fechaCortaMono, type IdiomaSoportado } from '@epetplace/i18n';

import { verificarSesion } from '@/lib/api';
import { EvitaTeclado } from '@/components/evita-teclado';
import { useTraduccion } from '@/i18n';

type Momento = 'recibir' | 'entregar';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | {
      estado: 'listo';
      modo: 'edicion' | 'lectura';
      groomingId: string;
      resumen: ResumenCierreGrooming;
      estadosCatalogo: EstadoPelajeCatalogo[];
      serviciosCatalogo: ServicioGroomingCatalogo[];
    };

// Los horizontes del selector simple (§8, "v1 usa selector simple"):
// el groomer piensa en semanas; el resultado es una FECHA.
const HORIZONTES_SEMANAS = [2, 4, 6, 8] as const;

// Fecha local + n días, por partes literales (jamás toISOString — el
// hallazgo S55/D-312: corre el día en UTC-5).
function fechaLocalEnDias(dias: number): string {
  const hoy = new Date();
  return new Intl.DateTimeFormat('en-CA').format(
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + dias),
  );
}

export default function CierreGrooming() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mostrar } = useAviso();
  const { t, idioma } = useTraduccion();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [mensaje, setMensaje] = useState('');
  const [cerrando, setCerrando] = useState(false);
  const cerrandoRef = useRef(false);
  // reparar el estado de pelaje que faltó (única escritura post-terminar)
  const [hojaMomento, setHojaMomento] = useState<Momento | null>(null);
  const [estadoSel, setEstadoSel] = useState<string | null>(null);
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  // reparar el servicio que faltó (S60-A3 pieza 2)
  const [hojaServicio, setHojaServicio] = useState(false);
  const [servicioSel, setServicioSel] = useState<string | null>(null);
  const [agregandoServicio, setAgregandoServicio] = useState(false);
  // la fecha sugerida §8 (S60-A3 pieza 1) — viaja con el cierre
  const [hojaFecha, setHojaFecha] = useState(false);
  const [fechaSel, setFechaSel] = useState<string | null>(null);
  const [fechaBorrador, setFechaBorrador] = useState<string | null>(null);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setPantalla({ estado: 'cargando' });
      const sesion = await verificarSesion();
      if (!sesion.ok) {
        setPantalla({ estado: 'error', mensaje: sesion.mensaje });
        return;
      }
      const g = await obtenerGroomingPorCita(citaId);
      if (!g.ok) {
        setPantalla({ estado: 'error', mensaje: g.mensaje });
        return;
      }
      if (g.data.grooming_id === null) {
        router.replace({ pathname: '/grooming/cita/[citaId]', params: { citaId } });
        return;
      }
      if (g.data.estado === 'en_curso') {
        router.replace({ pathname: '/grooming/cita/[citaId]/durante', params: { citaId } });
        return;
      }
      const [resumen, estados, servicios] = await Promise.all([
        obtenerResumenCierreGrooming(g.data.grooming_id),
        obtenerEstadosPelajeCatalogo(),
        obtenerServiciosGroomingCatalogo(),
      ]);
      if (!resumen.ok) {
        setPantalla({ estado: 'error', mensaje: resumen.mensaje });
        return;
      }
      if (!estados.ok) {
        setPantalla({ estado: 'error', mensaje: estados.mensaje });
        return;
      }
      if (!servicios.ok) {
        setPantalla({ estado: 'error', mensaje: servicios.mensaje });
        return;
      }
      if (resumen.data.mensaje_familia !== null) setMensaje(resumen.data.mensaje_familia);
      setPantalla({
        estado: 'listo',
        modo: resumen.data.estado === 'terminada' ? 'edicion' : 'lectura',
        groomingId: g.data.grooming_id,
        resumen: resumen.data,
        estadosCatalogo: estados.data,
        serviciosCatalogo: servicios.data,
      });
    },
    [citaId, router],
  );

  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  async function cerrar() {
    if (cerrandoRef.current || pantalla.estado !== 'listo') return;
    cerrandoRef.current = true;
    setCerrando(true);
    const cuerpo = mensaje.trim();
    const r = await cerrarGroomingConCalidad({
      grooming_id: pantalla.groomingId,
      mensaje_familia: cuerpo.length > 0 ? cuerpo : undefined,
      proxima_sesion: fechaSel ?? undefined,
    });
    setCerrando(false);
    cerrandoRef.current = false;
    if (!r.ok) {
      // Los errores del piso DIRIGEN (Ley 17.4): la voz tipada dice qué
      // falta; el estado de pelaje reparable se resuelve acá mismo.
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    mostrar({ variante: 'exito', texto: t('cita.parteEnviado') });
    void cargar(true);
  }

  async function agregarServicio() {
    if (servicioSel === null || agregandoServicio || pantalla.estado !== 'listo') return;
    setAgregandoServicio(true);
    const r = await agregarServicioGroomingEnCierre({
      grooming_id: pantalla.groomingId,
      servicio_codigo: servicioSel,
    });
    setAgregandoServicio(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setHojaServicio(false);
    setServicioSel(null);
    void cargar(true);
  }

  async function repararEstado() {
    if (hojaMomento === null || estadoSel === null || guardandoEstado || pantalla.estado !== 'listo') return;
    setGuardandoEstado(true);
    const r = await registrarEstadoPelajeEnCierre({
      grooming_id: pantalla.groomingId,
      momento: hojaMomento,
      estado_codigo: estadoSel,
    });
    setGuardandoEstado(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setHojaMomento(null);
    setEstadoSel(null);
    void cargar(true);
  }

  const listo = pantalla.estado === 'listo' ? pantalla : null;
  const resumen = listo?.resumen ?? null;
  const nombreEstado = (codigo: string | undefined): string | null => {
    if (!codigo || !listo) return null;
    return listo.estadosCatalogo.find((e) => e.codigo === codigo)?.nombre ?? codigo;
  };

  const vozSecundaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: theme.text.secondary,
  } as const;
  const vozPrimaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.base,
    lineHeight: typography.size.base * 1.4,
    color: theme.text.primary,
  } as const;
  const mono = {
    fontFamily: typography.family.mono.regular,
    fontSize: typography.size.sm,
    letterSpacing: typography.tracking.mono,
    color: theme.text.secondary,
  } as const;

  // Fila del estado por momento: registrado = dato; faltante en edición =
  // celda que repara (en_cierre); faltante en lectura no existe (el piso
  // ya se cumplió por foto).
  function FilaMomento({ momento }: { momento: Momento }) {
    if (!listo || !resumen) return null;
    const codigo = resumen.estados_pelaje[momento];
    const rotulo = momento === 'recibir' ? t('citaGrooming.recibiste') : t('citaGrooming.entregaste');
    if (codigo) {
      return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] }}>
          <Text style={vozSecundaria}>{rotulo}</Text>
          <Text style={vozPrimaria}>{nombreEstado(codigo)}</Text>
        </View>
      );
    }
    if (listo.modo === 'lectura') return null;
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing[3] }}>
        <Text style={vozSecundaria}>{rotulo}</Text>
        <Boton
          variante="ghost"
          tamaño="sm"
          etiqueta={t('citaGrooming.estadoPelajeElegir')}
          onPress={() => {
            setEstadoSel(null);
            setHojaMomento(momento);
          }}
        />
      </View>
    );
  }

  const minutosTrabajo = resumen ? Math.round(resumen.tiempo_trabajo_segundos / 60) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* S74-B D-498: propagación del patrón EvitaTeclado (gateado en el
          path vet) — nota al fondo + CTA + ScrollView pelado. */}
      <EvitaTeclado>
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[4] }}>
        <Encabezado
          variante="navegacion"
          titulo={t('citaGrooming.cierreTitulo')}
          atras
          onAtras={() => router.back()}
        />

        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" alto={120} />
              <Esqueleto forma="bloque" alto={96} />
              <Esqueleto forma="bloque" alto={48} />
            </View>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'error' && (
          <Tarjeta tinte="danger" relleno="amplio">
            <View style={{ gap: spacing[3] }}>
              <Text style={{ ...vozPrimaria, color: theme.status.dangerText }}>{pantalla.mensaje}</Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Boton variante="secundario" tamaño="sm" etiqueta={t('agenda.reintentar')} onPress={() => void cargar()} />
              </View>
            </View>
          </Tarjeta>
        )}

        {listo && resumen && (
          <>
            {listo.modo === 'lectura' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                <Insignia estado="alDia" etiqueta={t('agenda.estadoCerrado')} tamaño="sm" />
                <Text style={mono}>{t('citaGrooming.cerradoMono')}</Text>
              </View>
            )}

            {/* El trabajo, contado: servicios + estados + conteos */}
            <Tarjeta relleno="amplio">
              <View style={{ gap: spacing[3] }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] }}>
                  <Text style={vozSecundaria}>{t('citaGrooming.tiempoTrabajo')}</Text>
                  <Text
                    style={{
                      fontFamily: typography.family.mono.regular,
                      fontSize: typography.size.sm,
                      letterSpacing: typography.tracking.mono,
                      color: theme.text.primary,
                    }}
                  >
                    {t('citaGrooming.minutosSufijo', { n: minutosTrabajo })}
                  </Text>
                </View>
                <FilaMomento momento="recibir" />
                <FilaMomento momento="entregar" />
                <View style={{ gap: spacing[1.5] }}>
                  <Text style={vozSecundaria}>{t('citaGrooming.serviciosAplicados')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1.5] }}>
                    {resumen.servicios_aplicados.map((s) => (
                      <Insignia key={s.codigo} estado="alDia" etiqueta={s.nombre} tamaño="sm" />
                    ))}
                  </View>
                  {/* la reparación (S60-A3 pieza 2): el servicio que faltó
                      se agrega ACÁ — sin volver al Durante ni reabrir */}
                  {listo.modo === 'edicion' && (
                    <View style={{ alignSelf: 'flex-start' }}>
                      <Boton
                        variante="ghost"
                        tamaño="sm"
                        etiqueta={t('citaGrooming.servicioAgregar')}
                        onPress={() => {
                          setServicioSel(null);
                          setHojaServicio(true);
                        }}
                      />
                    </View>
                  )}
                </View>
                {resumen.fotos_total > 0 && (
                  <Text style={mono}>{t('citaGrooming.fotosSufijo', { n: resumen.fotos_total })}</Text>
                )}
                {/* la fecha sugerida §8 (S60-A3 pieza 1): fecha, jamás
                    cita — en edición se elige (Hoja), en lectura es dato */}
                {listo.modo === 'edicion' ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: spacing[3],
                    }}
                  >
                    <Text style={vozSecundaria}>{t('citaGrooming.proximaSesion')}</Text>
                    <Boton
                      variante="ghost"
                      tamaño="sm"
                      etiqueta={
                        fechaSel !== null
                          ? fechaCortaMono(fechaSel, idioma as IdiomaSoportado)
                          : t('citaGrooming.proximaSesionSugerir')
                      }
                      onPress={() => {
                        setFechaBorrador(fechaSel);
                        setHojaFecha(true);
                      }}
                    />
                  </View>
                ) : resumen.proxima_sesion_sugerida !== null ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] }}>
                    <Text style={vozSecundaria}>{t('citaGrooming.proximaSesion')}</Text>
                    <Text style={{ ...mono, color: theme.text.primary }}>
                      {fechaCortaMono(resumen.proxima_sesion_sugerida, idioma as IdiomaSoportado)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Tarjeta>

            {/* Notas e incidencias registradas — solo si existen */}
            {resumen.notas.length > 0 && (
              <Tarjeta relleno="amplio">
                <View style={{ gap: spacing[2] }}>
                  <Text style={vozSecundaria}>{t('citaGrooming.notasTitulo')}</Text>
                  {resumen.notas.map((n) => (
                    <Text key={n.id} style={vozPrimaria}>
                      {n.texto}
                    </Text>
                  ))}
                </View>
              </Tarjeta>
            )}
            {resumen.incidencias.length > 0 && (
              <Tarjeta tinte="warning" relleno="amplio">
                <View style={{ gap: spacing[2] }}>
                  <Text style={vozSecundaria}>{t('citaGrooming.incidenciasTitulo')}</Text>
                  {resumen.incidencias.map((i) => (
                    <View key={i.id} style={{ gap: spacing[1] }}>
                      <Text style={vozPrimaria}>{i.nombre}</Text>
                      {i.descripcion !== null && <Text style={vozSecundaria}>{i.descripcion}</Text>}
                    </View>
                  ))}
                </View>
              </Tarjeta>
            )}

            {/* El mensaje humano — la familia lo recibe con el parte */}
            {listo.modo === 'edicion' ? (
              <>
                <Campo
                  label={t('cita.mensajeFamilia')}
                  value={mensaje}
                  onChangeText={setMensaje}
                  multilinea={3}
                  ayuda={t('cita.mensajeFamiliaAyuda')}
                />
                <Boton
                  variante="primario"
                  bloque
                  etiqueta={t('cita.enviarParte')}
                  cargando={cerrando}
                  onPress={() => void cerrar()}
                />
              </>
            ) : (
              <>
                {resumen.mensaje_familia !== null && (
                  <Tarjeta relleno="amplio">
                    <View style={{ gap: spacing[2] }}>
                      <Text style={vozSecundaria}>{t('cita.mensajeFamilia')}</Text>
                      <Text style={vozPrimaria}>{resumen.mensaje_familia}</Text>
                    </View>
                  </Tarjeta>
                )}
                {/* La vista del día (§8): a dónde sigue el groomer */}
                <Tarjeta relleno="ninguno">
                  <CeldaNavegacion
                    icono="hoy"
                    registro="aa"
                    titulo={t('citaGrooming.verTuDia')}
                    onPress={() => router.push('/grooming/dia')}
                  />
                </Tarjeta>
              </>
            )}
          </>
        )}
      </ScrollView>
      </EvitaTeclado>

      {/* Hoja: reparar el estado de pelaje que faltó (en_cierre) */}
      <Hoja
        visible={hojaMomento !== null}
        onCerrar={() => {
          if (!guardandoEstado) {
            setHojaMomento(null);
            setEstadoSel(null);
          }
        }}
        titulo={hojaMomento === 'entregar' ? t('citaGrooming.alEntregar') : t('citaGrooming.alRecibir')}
      >
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          <SelectorOpcion
            acento="oficio"
            etiqueta={t('citaGrooming.estadoPelajeElegir')}
            opciones={
              listo === null || hojaMomento === null
                ? []
                : listo.estadosCatalogo
                    .filter((e) => e.momento === hojaMomento)
                    .map((e) => ({ codigo: e.codigo, etiqueta: e.nombre }))
            }
            seleccionada={estadoSel ?? undefined}
            onSelect={(codigo) => setEstadoSel(codigo)}
            disposicion="grilla"
          />
          <Boton
            variante="primario"
            bloque
            etiqueta={t('citaGrooming.estadoPelajeElegir')}
            deshabilitado={estadoSel === null}
            cargando={guardandoEstado}
            onPress={() => void repararEstado()}
          />
        </View>
      </Hoja>

      {/* Hoja: agregar el servicio que faltó (S60-A3 pieza 2 — solo los
          NO aplicados; el motor rebota el duplicado de todas formas) */}
      <Hoja
        visible={hojaServicio}
        onCerrar={() => {
          if (!agregandoServicio) {
            setHojaServicio(false);
            setServicioSel(null);
          }
        }}
        titulo={t('citaGrooming.servicioAgregar')}
      >
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          <SelectorOpcion
            acento="oficio"
            etiqueta={t('citaGrooming.serviciosAplicados')}
            disposicion="grilla"
            opciones={
              listo === null
                ? []
                : listo.serviciosCatalogo
                    .filter((s) => !listo.resumen.servicios_aplicados.some((a) => a.codigo === s.codigo))
                    .map((s) => ({ codigo: s.codigo, etiqueta: s.nombre }))
            }
            seleccionada={servicioSel ?? undefined}
            onSelect={(codigo) => setServicioSel(codigo)}
          />
          <Boton
            variante="primario"
            bloque
            etiqueta={t('citaGrooming.servicioAgregar')}
            deshabilitado={servicioSel === null}
            cargando={agregandoServicio}
            onPress={() => void agregarServicio()}
          />
        </View>
      </Hoja>

      {/* Hoja: la fecha sugerida §8 — selector simple de horizontes; el
          resultado es una FECHA que viaja con el cierre, jamás una cita */}
      <Hoja visible={hojaFecha} onCerrar={() => setHojaFecha(false)} titulo={t('citaGrooming.proximaSesion')}>
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          <Text style={vozSecundaria}>{t('citaGrooming.proximaSesionAyuda')}</Text>
          <SelectorOpcion
            acento="oficio"
            etiqueta={t('citaGrooming.proximaSesionSugerir')}
            disposicion="grilla"
            opciones={HORIZONTES_SEMANAS.map((n) => {
              const iso = fechaLocalEnDias(n * 7);
              return {
                codigo: iso,
                etiqueta: `${t('citaGrooming.proximaSesionEnSemanas', { n })} · ${fechaCortaMono(iso, idioma as IdiomaSoportado)}`,
              };
            })}
            seleccionada={fechaBorrador ?? undefined}
            onSelect={(codigo) => setFechaBorrador(codigo)}
          />
          <Boton
            variante="primario"
            bloque
            etiqueta={t('citaGrooming.proximaSesionSugerir')}
            deshabilitado={fechaBorrador === null}
            onPress={() => {
              setFechaSel(fechaBorrador);
              setHojaFecha(false);
            }}
          />
          {fechaSel !== null && (
            <Boton
              variante="ghost"
              bloque
              etiqueta={t('citaGrooming.proximaSesionQuitar')}
              onPress={() => {
                setFechaSel(null);
                setFechaBorrador(null);
                setHojaFecha(false);
              }}
            />
          )}
        </View>
      </Hoja>
    </View>
  );
}
