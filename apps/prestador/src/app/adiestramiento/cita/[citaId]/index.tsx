// ─────────────────────────────────────────────────────────────────────
// EL ANTES de la sesión de adiestramiento — /adiestramiento/cita/[citaId]
// (S63-B, MODELO_ADIESTRAMIENTO §5). Dosis baja.
//
// TESIS: en 30 segundos sabes a quién recibes, en qué punto del
// programa está, y arrancas.
// FIRMA: el punto del programa como CONTEXTO ("Sesión 3 de 8") — la
// sesión no es un turno suelto, es un capítulo. Jamás score.
//
// 7.5: la URL rinde la verdad — estados ajenos redirigen (en_curso →
// durante, terminada/cerrada → cierre). El gate temporal
// cita_aun_no_ocurre del motor se RESPETA: el CTA vive solo el día de
// la cita, con su porqué (patrón S60-C2.1); si igual rebota, la voz
// tipada lo dice.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
  type AvatarMascotaEspecie,
  type InsigniaEstado,
} from '@epetplace/ui';
import {
  iniciarAtencionAdiestramiento,
  obtenerAdiestramientoPorCita,
  obtenerCitaAdiestramientoPorId,
  obtenerFichaAntesAdiestramiento,
  resolverUrlFoto,
  type CitaAdiestramientoDetalle,
  type FichaAntesAdiestramiento,
} from '@epetplace/api';
import { fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'no_existe' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; cita: CitaAdiestramientoDetalle; ficha: FichaAntesAdiestramiento | null };

function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

export default function AntesAdiestramientoCita() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mostrar } = useAviso();
  const { t, idioma } = useTraduccion();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [fotoFirmada, setFotoFirmada] = useState<string | undefined>(undefined);
  const [iniciando, setIniciando] = useState(false);
  const iniciandoRef = useRef(false);

  const INSIGNIA_POR_ESTADO: Record<string, { estado: InsigniaEstado; etiqueta: string }> = {
    confirmada: { estado: 'info', etiqueta: t('agenda.estadoConfirmada') },
    completada: { estado: 'alDia', etiqueta: t('agenda.estadoCompletada') },
    no_show: { estado: 'atencion', etiqueta: t('agenda.estadoNoShow') },
  };

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setPantalla({ estado: 'cargando' });
      const sesion = await verificarSesion();
      if (!sesion.ok) return setPantalla({ estado: 'error', mensaje: sesion.mensaje });

      const [rCita, rAtencion] = await Promise.all([
        obtenerCitaAdiestramientoPorId(citaId),
        obtenerAdiestramientoPorCita(citaId),
      ]);
      if (!rCita.ok) {
        if (rCita.codigo === 'cita_no_existe') return setPantalla({ estado: 'no_existe' });
        return setPantalla({ estado: 'error', mensaje: rCita.mensaje });
      }
      // 7.5 — estados ajenos redirigen:
      if (rAtencion.ok && rAtencion.data.estado === 'en_curso') {
        router.replace({ pathname: '/adiestramiento/cita/[citaId]/durante', params: { citaId } });
        return;
      }
      if (rAtencion.ok && rAtencion.data.estado !== null) {
        router.replace({ pathname: '/adiestramiento/cita/[citaId]/cierre', params: { citaId } });
        return;
      }

      const mascotaId = rCita.data.mascota?.id;
      const rFicha = mascotaId ? await obtenerFichaAntesAdiestramiento(mascotaId) : null;
      setPantalla({ estado: 'listo', cita: rCita.data, ficha: rFicha?.ok ? rFicha.data : null });
      const path = rCita.data.mascota?.foto_url;
      if (path) {
        const firmada = await resolverUrlFoto(path);
        setFotoFirmada(firmada ?? undefined);
      }
    },
    [citaId, router],
  );

  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  async function empezar() {
    if (iniciandoRef.current) return;
    iniciandoRef.current = true;
    setIniciando(true);
    const r = await iniciarAtencionAdiestramiento(citaId);
    if (r.ok || r.codigo === 'atencion_adiestramiento_ya_existe_para_cita') {
      router.replace({ pathname: '/adiestramiento/cita/[citaId]/durante', params: { citaId } });
      return;
    }
    mostrar({ variante: 'error', texto: r.mensaje });
    setIniciando(false);
    iniciandoRef.current = false;
  }

  const cita = pantalla.estado === 'listo' ? pantalla.cita : null;
  const ficha = pantalla.estado === 'listo' ? pantalla.ficha : null;
  const nombre = cita?.mascota?.nombre ?? t('agenda.mascotaFallback');
  const insignia = cita?.estado ? INSIGNIA_POR_ESTADO[cita.estado] : undefined;
  const hora = cita?.hora ? cita.hora.slice(0, 5) : '—';
  const esDeHoy = cita?.fecha === hoyLocal();
  const conCta = cita?.estado === 'confirmada' && esDeHoy;

  // Las señales del expediente que ajustan la SESIÓN (misma altitud que
  // la hermana de grooming): flags + las conductuales top del oficio.
  const flags: { voz: string; insignia: InsigniaEstado }[] = [];
  if (ficha?.tiene_emergencia_activa) flags.push({ voz: t('detalleMascota.emergenciaActiva'), insignia: 'atencion' });
  if (ficha?.tiene_condicion_cronica) flags.push({ voz: t('detalleMascota.condicionCronica'), insignia: 'atencion' });
  if (ficha?.tiene_alergias) flags.push({ voz: t('detalleMascota.alergias'), insignia: 'atencion' });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[4] }}>
        <Encabezado
          variante="navegacion"
          titulo={cita ? t('citaAdiestramiento.tituloDe', { nombre }) : t('citaAdiestramiento.titulo')}
          atras
          onAtras={() => router.back()}
        />

        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <View style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[4] }}>
                <Esqueleto forma="circulo" alto={96} />
                <Esqueleto forma="linea" ancho="40%" />
              </View>
              <Esqueleto forma="bloque" alto={96} />
              <Esqueleto forma="bloque" alto={48} />
            </View>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'no_existe' && (
          <EstadoVacio
            titulo={t('citaAdiestramiento.noDisponible')}
            descripcion={t('citaAdiestramiento.noDisponibleDetalle')}
            accion={
              <Boton variante="secundario" etiqueta={t('citaAdiestramiento.volverHoy')} onPress={() => router.back()} />
            }
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

        {cita && (
          <>
            {/* La mascota preside — quién llega, a qué hora, y EN QUÉ
                CAPÍTULO del programa va (la firma) */}
            <View style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] }}>
              <AvatarMascota
                nombre={nombre}
                fotoUrl={fotoFirmada}
                especie={cita.mascota && esEspecie(cita.mascota.especie) ? cita.mascota.especie : undefined}
                tamano="lg"
              />
              <View style={{ alignItems: 'center', gap: spacing[1] }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.light,
                    fontSize: typography.size.xl,
                    color: theme.text.primary,
                  }}
                >
                  {nombre}
                </Text>
                <Text
                  style={{
                    fontFamily: typography.family.mono.regular,
                    fontSize: typography.size.sm,
                    letterSpacing: typography.tracking.mono,
                    color: theme.text.secondary,
                  }}
                >
                  {`${
                    esDeHoy || cita.fecha === null
                      ? ''
                      : `${fechaDiaSemanaHumana(cita.fecha, idioma as IdiomaSoportado)} · `
                  }${hora}${cita.duracion_minutos ? ` · ${cita.duracion_minutos} min` : ''}`}
                </Text>
                {cita.programa !== null && cita.sesion_numero !== null && (
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.base,
                      color: theme.text.primary,
                    }}
                  >
                    {t('citaAdiestramiento.sesionKN', { k: cita.sesion_numero, n: cita.programa.n_sesiones })}
                    {` · ${cita.programa.nombre}`}
                  </Text>
                )}
                {insignia && <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" />}
              </View>
              {flags.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing[1.5] }}>
                  {flags.map((s) => (
                    <Insignia key={s.voz} estado={s.insignia} etiqueta={s.voz} tamaño="sm" />
                  ))}
                </View>
              )}
            </View>

            {/* La ficha conductual completa, a un tap (Ley 19.1) */}
            {cita.mascota && (
              <Tarjeta relleno="ninguno">
                <CeldaNavegacion
                  registro="aa"
                  icono="training"
                  titulo={t('citaAdiestramiento.verFicha', { nombre })}
                  detalle={t('citaAdiestramiento.verFichaDetalle')}
                  onPress={() =>
                    router.push({
                      pathname: '/adiestramiento/antes/[mascotaId]',
                      params: { mascotaId: cita.mascota?.id ?? '' },
                    })
                  }
                />
              </Tarjeta>
            )}

            {conCta ? (
              <Boton
                variante="primario"
                bloque
                etiqueta={t('citaAdiestramiento.empezar')}
                cargando={iniciando}
                onPress={() => void empezar()}
              />
            ) : (
              cita.estado === 'confirmada' && (
                // La cita futura se PREPARA, no se empieza (S60-C2.1) —
                // el gate temporal del motor respalda esta voz.
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.sm,
                    lineHeight: typography.size.sm * 1.4,
                    color: theme.text.secondary,
                    textAlign: 'center',
                  }}
                >
                  {t('citaAdiestramiento.empiezaElDia')}
                </Text>
              )
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
