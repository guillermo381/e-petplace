// ─────────────────────────────────────────────────────────────────────
// El Cierre/parte — /cita/[citaId]/cierre (S44-B4.4). Dosis baja.
// ÚLTIMA pantalla del E2E del paseo.
//
// 7.5: terminada → modo edición · cerrada_con_calidad → modo lectura ·
// otros estados redirigen. Datos server-side (obtenerResumenCierrePaseo)
// + track real (obtenerTrackPaseo) para el mapa modo recorrido.
//
// Fotos: el contrato de lectura de adjuntos no existe — se muestra el
// CONTEO (D-291 ampliada); los thumbnails llegan con ese contrato.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Insignia,
  MapaRecorrido,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  agregarNovedadPaseo,
  cerrarPaseoConCalidad,
  obtenerNovedadesPaseo,
  obtenerPaseoPorCita,
  obtenerResumenCierrePaseo,
  obtenerTrackPaseo,
  type NovedadCatalogoPaseo,
  type PuntoGpsPaseo,
  type ResumenCierrePaseo,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'no_existe' }
  | { estado: 'error'; mensaje: string }
  | {
      estado: 'listo';
      modo: 'edicion' | 'lectura';
      resumen: ResumenCierrePaseo;
      track: PuntoGpsPaseo[];
    };

function hhmm(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function duracion(segundos: number): string {
  const min = Math.round(segundos / 60);
  if (min < 1) return '<1 min';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}

export default function Cierre() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [mensaje, setMensaje] = useState('');
  const [cerrando, setCerrando] = useState(false);
  const cerrandoRef = useRef(false);

  // Hoja para registrar el parte desde acá (guard visible, punto 3)
  const [hojaParte, setHojaParte] = useState(false);
  const [catalogo, setCatalogo] = useState<NovedadCatalogoPaseo[]>([]);
  const [novedadEnviando, setNovedadEnviando] = useState<string | null>(null);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setPantalla({ estado: 'cargando' });
      const sesion = await verificarSesion();
      if (!sesion.ok) return setPantalla({ estado: 'error', mensaje: sesion.mensaje });

      const paseo = await obtenerPaseoPorCita(citaId);
      if (!paseo.ok) {
        if (paseo.codigo === 'cita_no_encontrada') return setPantalla({ estado: 'no_existe' });
        return setPantalla({ estado: 'error', mensaje: paseo.mensaje });
      }
      // 7.5 — estados ajenos redirigen:
      if (paseo.data.estado === null) {
        router.replace({ pathname: '/cita/[citaId]', params: { citaId } });
        return;
      }
      if (paseo.data.estado === 'en_curso') {
        router.replace({ pathname: '/cita/[citaId]/durante', params: { citaId } });
        return;
      }

      const [resumen, track] = await Promise.all([
        obtenerResumenCierrePaseo(paseo.data.evento_atencion_id),
        obtenerTrackPaseo(paseo.data.evento_atencion_id),
      ]);
      if (!resumen.ok) return setPantalla({ estado: 'error', mensaje: resumen.mensaje });
      if (!track.ok) return setPantalla({ estado: 'error', mensaje: track.mensaje });

      if (!silencioso) setMensaje(resumen.data.mensaje_familia ?? '');
      setPantalla({
        estado: 'listo',
        modo: paseo.data.estado === 'terminada' ? 'edicion' : 'lectura',
        resumen: resumen.data,
        track: track.data,
      });
    },
    [citaId, router],
  );

  // Focus-back re-consulta (7.5 también al volver, no solo al montar).
  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  async function abrirParte() {
    if (catalogo.length === 0) {
      const r = await obtenerNovedadesPaseo();
      if (!r.ok) {
        mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      setCatalogo(r.data);
    }
    setHojaParte(true);
  }

  async function tocarNovedad(n: NovedadCatalogoPaseo) {
    if (pantalla.estado !== 'listo' || novedadEnviando) return;
    setNovedadEnviando(n.codigo);
    const r = await agregarNovedadPaseo({
      evento_atencion_id: pantalla.resumen.evento_atencion_id,
      novedad_codigo: n.codigo,
    });
    setNovedadEnviando(null);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    mostrar({ variante: 'exito', texto: t('cita.parteRegistrado') });
    void cargar(true);
  }

  async function cerrar() {
    if (pantalla.estado !== 'listo' || cerrandoRef.current) return;
    cerrandoRef.current = true;
    setCerrando(true);
    const m = mensaje.trim();
    const r = await cerrarPaseoConCalidad({
      evento_atencion_id: pantalla.resumen.evento_atencion_id,
      mensaje_familia: m.length > 0 ? m : undefined,
    });
    if (r.ok || r.codigo === 'atencion_estado_invalido') {
      // Ya cerrada por otra vía = mismo destino (patrón S38-fix7).
      mostrar({ variante: 'exito', texto: t('cita.parteEnviado') });
      router.dismissTo('/');
      return;
    }
    if (r.codigo === 'falta_novedad_paseo') {
      // Carrera: el guard visible pensaba otra cosa — recargar el conteo real.
      mostrar({ variante: 'error', texto: r.mensaje });
      void cargar(true);
    } else {
      mostrar({ variante: 'error', texto: r.mensaje });
    }
    setCerrando(false);
    cerrandoRef.current = false;
  }

  const listo = pantalla.estado === 'listo' ? pantalla : null;
  const resumen = listo?.resumen ?? null;
  const edicion = listo?.modo === 'edicion';
  const sinParte = (resumen?.conteos.novedades ?? 0) === 0;

  return (
    // S59-B1 (safe area): el Encabezado ya absorbe y PINTA el inset superior
    // — el SafeAreaView top lo duplicaba (doble banda de papel arriba).
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[4] }}>
        <Encabezado variante="navegacion" titulo={t('cita.cierreTitulo')} atras onAtras={() => router.back()} />

        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" alto={88} />
              <Esqueleto forma="bloque" alto={200} />
              <Esqueleto forma="linea" ancho="50%" />
              <Esqueleto forma="bloque" alto={96} />
            </View>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'no_existe' && (
          <EstadoVacio
            titulo={t('cita.noDisponible')}
            descripcion={t('cita.noDisponibleDetalleCorto')}
            accion={<Boton variante="secundario" etiqueta={t('cita.volverAgenda')} onPress={() => router.back()} />}
          />
        )}

        {pantalla.estado === 'error' && (
          <Tarjeta tinte="danger" relleno="amplio">
            <View style={{ gap: spacing[3] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.status.dangerText,
                }}
              >
                {pantalla.mensaje}
              </Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Boton variante="secundario" tamaño="sm" etiqueta={t('agenda.reintentar')} onPress={() => void cargar()} />
              </View>
            </View>
          </Tarjeta>
        )}

        {listo && resumen && (
          <>
            {/* Resumen — ventana/duración en voz de máquina + conteos */}
            <Tarjeta elevacion="plana" relleno="amplio">
              <View style={{ gap: spacing[2] }}>
                <Text
                  style={{
                    fontFamily: typography.family.mono.regular,
                    fontSize: typography.size.md,
                    letterSpacing: typography.tracking.mono,
                    color: theme.text.primary,
                  }}
                >
                  {`${hhmm(resumen.iniciada_en)} → ${hhmm(resumen.terminada_en)} · ${duracion(resumen.tiempo_sesion_segundos)}`}
                </Text>
                <Text
                  style={{
                    fontFamily: typography.family.mono.regular,
                    fontSize: typography.size.sm,
                    letterSpacing: typography.tracking.mono,
                    color: theme.text.secondary,
                  }}
                >
                  {t('cita.resumenConteos', { puntos: resumen.gps.puntos, fotos: resumen.conteos.fotos, notas: resumen.conteos.notas })}
                </Text>
              </View>
            </Tarjeta>

            {/* Recorrido real, o la verdad si no lo hay — S62 (cura 2):
                el hueco del mapa JAMÁS calla (Ley 13): con motivo lo
                dice; con 1 punto lo dice; con 0 sin motivo lo dice. */}
            {listo.track.length > 1 ? (
              <MapaRecorrido puntos={listo.track} modo="recorrido" capa="cuidado" alto={200} />
            ) : (
              <Tarjeta relleno="amplio">
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.sm,
                    lineHeight: typography.size.sm * 1.4,
                    color: theme.text.secondary,
                  }}
                >
                  {resumen.gps.motivo_fallo
                    ? t('cita.sinRutaGps', { motivo: resumen.gps.motivo_fallo })
                    : listo.track.length === 1
                      ? t('cita.sinRutaSoloPartida')
                      : t('cita.sinRutaNoRegistrada')}
                </Text>
              </Tarjeta>
            )}

            {/* Lo registrado */}
            <View style={{ gap: spacing[2] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.medium,
                  fontSize: typography.size.sm,
                  color: theme.text.secondary,
                }}
              >
                {`${t('cita.parteDelPerro')}${resumen.conteos.novedades > 0 ? ` · ${resumen.conteos.novedades}` : ''}`}
              </Text>
              {resumen.novedades.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1.5] }}>
                  {resumen.novedades.map((n) => (
                    <Insignia key={n.id} estado="alDia" etiqueta={n.nombre} tamaño="sm" />
                  ))}
                </View>
              ) : (
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.sm,
                    lineHeight: typography.size.sm * 1.4,
                    color: theme.text.secondary,
                  }}
                >
                  {t('cita.faltaNovedad')}
                </Text>
              )}
              {edicion && (
                <View style={{ alignSelf: 'flex-start' }}>
                  <Boton
                    variante={sinParte ? 'secundario' : 'ghost'}
                    tamaño="sm"
                    etiqueta={t('cita.registrarNovedad')}
                    onPress={() => void abrirParte()}
                  />
                </View>
              )}
            </View>

            {/* Mensaje a la familia */}
            {edicion ? (
              <Campo
                label={t('cita.mensajeFamilia')}
                ayuda={t('cita.mensajeFamiliaAyuda')}
                value={mensaje}
                onChangeText={setMensaje}
                multilinea={3}
                // VOZ EMOCIONAL — patrón D-300: hardcodeada es hasta el
                // lote de gate del founder (mezcla honesta en modo en).
                placeholder="Contale a la familia cómo la pasó en el paseo…"
              />
            ) : resumen.mensaje_familia ? (
              <Tarjeta relleno="amplio">
                <View style={{ gap: spacing[1] }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {t('cita.mensajeFamilia')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.base,
                      lineHeight: typography.size.base * 1.4,
                      color: theme.text.primary,
                    }}
                  >
                    {resumen.mensaje_familia}
                  </Text>
                </View>
              </Tarjeta>
            ) : null}

            {edicion ? (
              <Boton
                variante="primario"
                bloque
                etiqueta={t('cita.enviarParte')}
                cargando={cerrando}
                deshabilitado={sinParte}
                onPress={() => void cerrar()}
              />
            ) : (
              <Text
                style={{
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.xs,
                  letterSpacing: typography.tracking.mono,
                  color: theme.text.tertiary,
                  textAlign: 'center',
                }}
              >
                {`${t('cita.parteEnviadoMono')} · ${hhmm(resumen.cerrada_en)}`}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Hoja: registrar el parte desde el cierre (mismo patrón del Durante) */}
      <Hoja visible={hojaParte} onCerrar={() => setHojaParte(false)} titulo={t('cita.parteDelPerro')}>
        <View style={{ padding: spacing[4], gap: spacing[2] }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {catalogo.map((n) => (
              <Boton
                key={n.codigo}
                variante="secundario"
                tamaño="sm"
                etiqueta={n.nombre}
                cargando={novedadEnviando === n.codigo}
                onPress={() => void tocarNovedad(n)}
              />
            ))}
          </View>
        </View>
      </Hoja>
    </View>
  );
}
