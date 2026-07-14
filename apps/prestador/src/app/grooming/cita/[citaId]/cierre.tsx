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
// Próxima sesión SUGERIDA (§8): SIN slot en DB hoy — pedido SQL a la A
// emitido en el reporte S60-B1; nada se dibuja apagado.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
  cerrarGroomingConCalidad,
  obtenerEstadosPelajeCatalogo,
  obtenerGroomingPorCita,
  obtenerResumenCierreGrooming,
  registrarEstadoPelajeEnCierre,
  type EstadoPelajeCatalogo,
  type ResumenCierreGrooming,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
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
    };

export default function CierreGrooming() {
  const { theme } = useTheme();
  const router = useRouter();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [mensaje, setMensaje] = useState('');
  const [cerrando, setCerrando] = useState(false);
  const cerrandoRef = useRef(false);
  // reparar el estado de pelaje que faltó (única escritura post-terminar)
  const [hojaMomento, setHojaMomento] = useState<Momento | null>(null);
  const [estadoSel, setEstadoSel] = useState<string | null>(null);
  const [guardandoEstado, setGuardandoEstado] = useState(false);

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
      const [resumen, estados] = await Promise.all([
        obtenerResumenCierreGrooming(g.data.grooming_id),
        obtenerEstadosPelajeCatalogo(),
      ]);
      if (!resumen.ok) {
        setPantalla({ estado: 'error', mensaje: resumen.mensaje });
        return;
      }
      if (!estados.ok) {
        setPantalla({ estado: 'error', mensaje: estados.mensaje });
        return;
      }
      if (resumen.data.mensaje_familia !== null) setMensaje(resumen.data.mensaje_familia);
      setPantalla({
        estado: 'listo',
        modo: resumen.data.estado === 'terminada' ? 'edicion' : 'lectura',
        groomingId: g.data.grooming_id,
        resumen: resumen.data,
        estadosCatalogo: estados.data,
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
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] }}>
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
                </View>
                {resumen.fotos_total > 0 && (
                  <Text style={mono}>{t('citaGrooming.fotosSufijo', { n: resumen.fotos_total })}</Text>
                )}
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
    </View>
  );
}
