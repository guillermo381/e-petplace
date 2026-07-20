// ─────────────────────────────────────────────────────────────────────
// El CIERRE del adiestramiento — /adiestramiento/cita/[citaId]/cierre
// (S63-B, MODELO_ADIESTRAMIENTO §5: el parte que enseña). Dosis baja.
//
// TESIS: el parte se arma solo de lo que ya registraste — acá solo le
// pones la voz a la familia.
// FIRMA: las INSTRUCCIONES PARA LA FAMILIA (§5, founder S62) — el
// refuerzo entre sesiones como sección propia, con plantillas del
// vocabulario como ayuda de redacción (un toque suma una práctica).
//
// El piso de calidad ya quedó garantizado ANTES de terminar (Hoja del
// Durante) — si igual el motor rebotara, la voz tipada dirige. El
// guard duro de orden del programa (sesion_anterior_abierta) se
// traduce a voz honesta: "Primero cierra la sesión anterior…".
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  ClipSesion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  Insignia,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  cerrarAtencionAdiestramiento,
  obtenerAdiestramientoPorCita,
  obtenerCitaAdiestramientoPorId,
  obtenerClipsAdiestramiento,
  obtenerEstadoDuranteAdiestramiento,
  obtenerObjetivosAdiestramiento,
  resolverUrlsClips,
  type ClipAdiestramientoRegistrado,
  type EstadoDuranteAdiestramiento,
  type ObjetivoAdiestramientoCatalogo,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { clipsDeSesion } from '@/lib/clips-sesion';
import { useTraduccion } from '@/i18n';

type DatosListos = {
  adiestramientoId: string;
  cerrada: boolean;
  registro: EstadoDuranteAdiestramiento;
  vocabulario: ObjetivoAdiestramientoCatalogo[];
  sesionKN: { k: number; n: number } | null;
  /** S65 (hallazgo founder): los clips REGISTRADOS con su URL firmada —
   *  "1 clip" dejó de ser texto muerto: ClipSesion los reproduce acá
   *  (segundo consumidor del componente 34, como lo declaró su espec). */
  clips: ClipAdiestramientoRegistrado[];
  clipUrls: Record<string, string>;
};

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | ({ estado: 'listo' } & DatosListos);

export default function CierreAdiestramiento() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [mensaje, setMensaje] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [cerrando, setCerrando] = useState(false);
  const cerrandoRef = useRef(false);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setPantalla({ estado: 'cargando' });
      const sesion = await verificarSesion();
      if (!sesion.ok) return setPantalla({ estado: 'error', mensaje: sesion.mensaje });

      const atencion = await obtenerAdiestramientoPorCita(citaId);
      if (!atencion.ok) return setPantalla({ estado: 'error', mensaje: atencion.mensaje });
      // 7.5 — estados ajenos redirigen:
      if (atencion.data.estado === null) {
        router.replace({ pathname: '/adiestramiento/cita/[citaId]', params: { citaId } });
        return;
      }
      if (atencion.data.estado === 'en_curso') {
        router.replace({ pathname: '/adiestramiento/cita/[citaId]/durante', params: { citaId } });
        return;
      }

      const [registro, vocabulario, cita] = await Promise.all([
        obtenerEstadoDuranteAdiestramiento(atencion.data.adiestramiento_id),
        obtenerObjetivosAdiestramiento(),
        obtenerCitaAdiestramientoPorId(citaId),
      ]);
      if (!registro.ok) return setPantalla({ estado: 'error', mensaje: registro.mensaje });
      if (!vocabulario.ok) return setPantalla({ estado: 'error', mensaje: vocabulario.mensaje });

      // Los clips registrados, con URL firmada (bucket privado). Un
      // fallo acá no rompe el parte: el conteo del registro sigue
      // hablando y la UI muestra los que puede (patrón del dueño).
      let clips: ClipAdiestramientoRegistrado[] = [];
      let clipUrls: Record<string, string> = {};
      if (registro.data.clips_total > 0) {
        const rClips = await obtenerClipsAdiestramiento(atencion.data.adiestramiento_id);
        if (rClips.ok && rClips.data.length > 0) {
          clips = rClips.data;
          clipUrls = await resolverUrlsClips(rClips.data.map((c) => c.storage_path));
        }
      }

      setPantalla({
        estado: 'listo',
        adiestramientoId: atencion.data.adiestramiento_id,
        cerrada: atencion.data.estado === 'cerrada_con_calidad',
        registro: registro.data,
        vocabulario: vocabulario.data,
        sesionKN:
          cita.ok && cita.data.programa !== null && cita.data.sesion_numero !== null
            ? { k: cita.data.sesion_numero, n: cita.data.programa.n_sesiones }
            : null,
        clips,
        clipUrls,
      });
    },
    [citaId, router],
  );

  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  const datos = pantalla.estado === 'listo' ? pantalla : null;
  const vozDe = new Map(datos?.vocabulario.map((o) => [o.codigo, o.nombre]) ?? []);

  async function cerrar() {
    if (datos === null || cerrandoRef.current) return;
    cerrandoRef.current = true;
    setCerrando(true);
    const r = await cerrarAtencionAdiestramiento({
      adiestramiento_id: datos.adiestramientoId,
      mensaje_familia: mensaje.trim() || undefined,
      instrucciones_familia: instrucciones.trim() || undefined,
    });
    if (r.ok) {
      mostrar({ variante: 'exito', texto: t('citaAdiestramiento.cerrado') });
      router.replace('/(tabs)');
      return;
    }
    // Los errores DIRIGEN (Ley 17.4): sesion_anterior_abierta y los del
    // piso llegan con su voz tipada del wrapper.
    mostrar({ variante: 'error', texto: r.mensaje });
    setCerrando(false);
    cerrandoRef.current = false;
  }

  /** Plantilla de práctica: un toque suma una frase editable. */
  function sugerirPractica(codigo: string) {
    const voz = vozDe.get(codigo) ?? codigo;
    setInstrucciones((prev) =>
      `${prev}${prev.trim().length > 0 ? '\n' : ''}${t('citaAdiestramiento.plantillaPractica', { objetivo: voz })}`,
    );
  }

  const vozSecundaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: theme.text.secondary,
  } as const;
  const tituloSeccion = {
    fontFamily: typography.family.sans.medium,
    fontSize: typography.size.sm,
    color: theme.text.secondary,
  } as const;

  const clipsLocales = datos !== null ? clipsDeSesion(datos.adiestramientoId).length : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[2] }}>
        <Encabezado
          variante="navegacion"
          titulo={t('citaAdiestramiento.cierreTitulo')}
          atras
          onAtras={() => router.back()}
        />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[5] }}>
        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" alto={140} />
              <Esqueleto forma="bloque" alto={96} />
              <Esqueleto forma="bloque" alto={48} />
            </View>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'error' && (
          <Tarjeta tinte="danger" relleno="amplio">
            <View style={{ gap: spacing[3] }}>
              <Text style={{ ...vozSecundaria, fontSize: typography.size.base, color: theme.status.dangerText }}>
                {pantalla.mensaje}
              </Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Boton variante="secundario" tamaño="sm" etiqueta={t('agenda.reintentar')} onPress={() => void cargar()} />
              </View>
            </View>
          </Tarjeta>
        )}

        {datos !== null && (
          <>
            {datos.sesionKN !== null && (
              <Text
                style={{
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.sm,
                  letterSpacing: typography.tracking.mono,
                  color: theme.text.secondary,
                  textAlign: 'center',
                }}
              >
                {t('citaAdiestramiento.sesionKN', { k: datos.sesionKN.k, n: datos.sesionKN.n })}
              </Text>
            )}

            {/* Lo registrado — el parte se arma de esto */}
            <View style={{ gap: spacing[2] }}>
              <Text style={tituloSeccion}>{t('citaAdiestramiento.resumenTitulo')}</Text>
              <Tarjeta>
                {datos.registro.objetivos.map((o, i) => (
                  <View key={o.objetivo_codigo}>
                    {i > 0 && <Separador />}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: spacing[4],
                        paddingVertical: spacing[3],
                        gap: spacing[3],
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: typography.family.sans.regular,
                          fontSize: typography.size.base,
                          color: theme.text.primary,
                        }}
                      >
                        {vozDe.get(o.objetivo_codigo) ?? o.objetivo_codigo}
                      </Text>
                      <Insignia
                        estado={o.alcanzado ? 'alDia' : 'info'}
                        etiqueta={o.alcanzado ? t('citaAdiestramiento.alcanzado') : t('citaAdiestramiento.trabajado')}
                        tamaño="sm"
                      />
                    </View>
                  </View>
                ))}
              </Tarjeta>
              <Text style={vozSecundaria}>
                {`${
                  datos.registro.notas_total === 1
                    ? t('citaAdiestramiento.unaNota')
                    : t('citaAdiestramiento.notasN', { n: datos.registro.notas_total })
                } · ${
                  datos.registro.clips_total === 1
                    ? t('citaAdiestramiento.unClip')
                    : t('citaAdiestramiento.clipsN', { n: datos.registro.clips_total })
                }`}
              </Text>
              {clipsLocales > 0 && datos.registro.clips_total === 0 && (
                <Text style={vozSecundaria}>{t('clips.envioPendiente')}</Text>
              )}

              {/* S65 (hallazgo founder): el clip se VE donde el conteo
                  lo nombra — ClipSesion (34), su segundo consumidor
                  declarado. Escalera: 0 clips = no se monta; un path
                  que no firmó se omite sin romper el parte. */}
              {datos.clips.length > 0 && (
                <View style={{ gap: spacing[3] }}>
                  {datos.clips.map((c) => {
                    const url = datos.clipUrls[c.storage_path];
                    return url !== undefined ? (
                      <ClipSesion
                        key={c.id}
                        uri={url}
                        duracionSegundos={c.duracion_segundos}
                        descripcion={c.descripcion}
                      />
                    ) : null;
                  })}
                </View>
              )}
            </View>

            {datos.cerrada ? (
              // Ya cerrada por otra vía: estado sereno, cero formulario.
              <Text style={vozSecundaria}>{t('citaAdiestramiento.yaCerrada')}</Text>
            ) : (
              <>
                {/* Mensaje a la familia */}
                <Campo
                  label={t('citaAdiestramiento.mensajeFamilia')}
                  value={mensaje}
                  onChangeText={setMensaje}
                  multilinea={3}
                  placeholder={t('citaAdiestramiento.mensajePlaceholder')}
                />

                {/* LA FIRMA — instrucciones para la familia (§5) */}
                <View style={{ gap: spacing[2] }}>
                  <Campo
                    label={t('citaAdiestramiento.instrucciones')}
                    value={instrucciones}
                    onChangeText={setInstrucciones}
                    multilinea={4}
                    placeholder={t('citaAdiestramiento.instruccionesPlaceholder')}
                  />
                  <Text style={vozSecundaria}>{t('citaAdiestramiento.instruccionesExplica')}</Text>
                  {datos.registro.objetivos.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                      {datos.registro.objetivos.map((o) => (
                        <Boton
                          key={o.objetivo_codigo}
                          variante="secundario"
                          tamaño="sm"
                          etiqueta={`+ ${vozDe.get(o.objetivo_codigo) ?? o.objetivo_codigo}`}
                          onPress={() => sugerirPractica(o.objetivo_codigo)}
                        />
                      ))}
                    </View>
                  )}
                </View>

                <Boton
                  variante="primario"
                  bloque
                  etiqueta={t('citaAdiestramiento.cerrarCta')}
                  cargando={cerrando}
                  onPress={() => void cerrar()}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
