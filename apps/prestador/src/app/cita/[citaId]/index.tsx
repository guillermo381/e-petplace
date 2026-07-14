// ─────────────────────────────────────────────────────────────────────
// Detalle/Preparar — /cita/[citaId] (S44-B4.2). Dosis baja.
//
// Principio 7.5: la URL rinde la verdad. Al montar se consulta el
// estado real (obtenerPaseoPorCita) y se redirige: en_curso → durante,
// terminada/cerrada → cierre. Deep-link y refresh caen bien parados.
//
// Datos: SOLO los contratos existentes (obtenerPaseoPorCita +
// obtenerCitasPaseoDelDia). Notas de la familia y raza/edad NO están
// en los contratos → secciones omitidas en esta pasada (reporte B4.2).
// La cita se resuelve contra la lista de HOY: un deep-link a una cita
// de otro día cae en "ya no disponible" (limitación F1 reportada).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { Linking, Platform, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
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
  iniciarAtencionPaseo,
  obtenerCitaPaseoPorId,
  obtenerPaseoPorCita,
  resolverUrlFoto,
  type CitaAgendaPaseo,
  type DireccionCitaPaseo,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'no_existe' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; cita: CitaAgendaPaseo };

function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// D-339 (S56-B TAREA 3): la URL del mapa del SISTEMA por plataforma.
// Con lat/lon apunta exacto; sin coordenadas, búsqueda por el texto.
function urlMapa(d: DireccionCitaPaseo): string {
  const consulta = [d.direccion, d.sector, d.ciudad]
    .filter((x): x is string => x !== null)
    .join(', ');
  const q = encodeURIComponent(consulta);
  if (Platform.OS === 'ios') {
    return d.lat !== null && d.lon !== null
      ? `http://maps.apple.com/?ll=${d.lat},${d.lon}&q=${q}`
      : `http://maps.apple.com/?q=${q}`;
  }
  if (Platform.OS === 'android') {
    return d.lat !== null && d.lon !== null
      ? `geo:${d.lat},${d.lon}?q=${d.lat},${d.lon}(${q})`
      : `geo:0,0?q=${q}`;
  }
  return d.lat !== null && d.lon !== null
    ? `https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/**
 * A dónde ir — D-339 (S56-B TAREA 3): pinta lo que la FILA de la cita trae
 * (snapshot congelado al pagar; contrato de la migración 20260712090000).
 * null honesto para citas sin dirección (históricas / hogar sin dirección
 * al reservar). Dosis baja: cero acento, acción terciaria en ghost.
 */
function SeccionDireccion({ direccion }: { direccion: DireccionCitaPaseo | null }) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const vozSecundaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: theme.text.secondary,
  };

  return (
    <Tarjeta elevacion="plana" relleno="amplio">
      <View style={{ gap: spacing[2] }}>
        <Text style={vozSecundaria}>{t('cita.direccionTitulo')}</Text>
        {direccion === null ? (
          <Text style={vozSecundaria}>{t('cita.direccionSinDato')}</Text>
        ) : (
          <>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.base,
                lineHeight: typography.size.base * 1.4,
                color: theme.text.primary,
              }}
            >
              {direccion.direccion}
            </Text>
            {direccion.sector !== null || direccion.ciudad !== null ? (
              <Text style={vozSecundaria}>
                {[direccion.sector, direccion.ciudad].filter((x): x is string => x !== null).join(' · ')}
              </Text>
            ) : null}
            {direccion.referencias !== null ? <Text style={vozSecundaria}>{direccion.referencias}</Text> : null}
            <View style={{ alignSelf: 'flex-start' }}>
              <Boton
                variante="ghost"
                tamaño="sm"
                etiqueta={t('cita.direccionAbrirMapa')}
                onPress={() => {
                  Linking.openURL(urlMapa(direccion)).catch(() => {
                    mostrar({ variante: 'error', texto: t('cita.direccionMapaError') });
                  });
                }}
              />
            </View>
          </>
        )}
      </View>
    </Tarjeta>
  );
}

export default function DetalleCita() {
  const { theme } = useTheme();
  const router = useRouter();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();

  // Estado de cita → Insignia. Voz de oficio por el riel (D-315p);
  // 'pendiente' queda por si un deep-link la trae — verdad firme igual.
  const INSIGNIA_POR_ESTADO: Record<string, { estado: InsigniaEstado; etiqueta: string }> = {
    pendiente:  { estado: 'proximo',  etiqueta: t('cita.estadoPorConfirmar') },
    confirmada: { estado: 'info',     etiqueta: t('agenda.estadoConfirmada') },
    completada: { estado: 'alDia',    etiqueta: t('agenda.estadoCompletada') },
    no_show:    { estado: 'atencion', etiqueta: t('agenda.estadoNoShow') },
  };

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  // foto_url guarda PATH (S47-B0.2): la firma se resuelve acá; sin
  // firma posible → huella digna.
  const [fotoFirmada, setFotoFirmada] = useState<string | undefined>(undefined);
  const [iniciando, setIniciando] = useState(false);
  const iniciandoRef = useRef(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setPantalla({ estado: 'cargando' });
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }

    // 1. La verdad del estado (7.5): redirect si la atención ya avanzó.
    const paseo = await obtenerPaseoPorCita(citaId);
    if (!paseo.ok) {
      if (paseo.codigo === 'cita_no_encontrada') setPantalla({ estado: 'no_existe' });
      else setPantalla({ estado: 'error', mensaje: paseo.mensaje });
      return;
    }
    if (paseo.data.estado === 'en_curso') {
      router.replace({ pathname: '/cita/[citaId]/durante', params: { citaId } });
      return;
    }
    if (paseo.data.estado === 'terminada' || paseo.data.estado === 'cerrada_con_calidad') {
      router.replace({ pathname: '/cita/[citaId]/cierre', params: { citaId } });
      return;
    }

    // 2. sin_iniciar: la cita POR SU ID (cura S60-C2.1 ampliada — la
    // lista del día dejaba fuera toda cita de otro día, y la SEMANA
    // del HOY las hace tapeables; la RLS es el guard).
    const rCita = await obtenerCitaPaseoPorId(citaId);
    if (!rCita.ok) {
      if (rCita.codigo === 'cita_no_encontrada') setPantalla({ estado: 'no_existe' });
      else setPantalla({ estado: 'error', mensaje: rCita.mensaje });
      return;
    }
    const cita = rCita.data;
    if (cita.mascota?.foto_url) {
      const url = await resolverUrlFoto(cita.mascota.foto_url);
      setFotoFirmada(url ?? undefined);
    } else {
      setFotoFirmada(undefined);
    }
    setPantalla({ estado: 'listo', cita });
  }, [citaId, router]);

  // Focus-back re-consulta (7.5 también al volver, no solo al montar).
  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  async function iniciar() {
    if (iniciandoRef.current) return;
    iniciandoRef.current = true;
    setIniciando(true);
    const r = await iniciarAtencionPaseo({ cita_id: citaId });
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      setIniciando(false);
      iniciandoRef.current = false;
      return;
    }
    router.replace({ pathname: '/cita/[citaId]/durante', params: { citaId } });
    // lock se queda: la pantalla se desmonta
  }

  const cita = pantalla.estado === 'listo' ? pantalla.cita : null;
  const nombre = cita?.mascota?.nombre ?? t('agenda.mascotaFallback');
  const insignia = cita?.estado ? INSIGNIA_POR_ESTADO[cita.estado] : undefined;
  const hora = cita?.hora ? cita.hora.slice(0, 5) : '—';
  const dur = cita?.tipo.duracion_default_minutos;
  // La cita de otro día se PREPARA pero no se EMPIEZA (S60-C2.1
  // ampliada): iniciar hoy el paseo de mañana abriría el devengo
  // anticipado al cerrarlo — el gate temporal del motor es pedido a la
  // A; este es el guard de producto, CON su voz (jamás mudo).
  const esDeHoy = cita?.fecha === hoyLocal();
  const conCta = cita?.estado === 'confirmada' && esDeHoy;
  const esFutura = cita?.estado === 'confirmada' && !esDeHoy;

  return (
    // S59-B1 (safe area): el Encabezado ya absorbe y PINTA el inset superior
    // — el SafeAreaView top lo duplicaba (doble banda de papel arriba).
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] }}>
        <Encabezado
          variante="navegacion"
          titulo={cita ? t('cita.tituloPaseoDe', { nombre }) : t('cita.tituloPaseo')}
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
            titulo={t('cita.noDisponible')}
            descripcion={t('cita.noDisponibleDetalle')}
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

        {cita && (
          <>
            {/* La mascota — voz humana */}
            <View style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[4] }}>
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
                {cita.mascota?.especie ? (
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {capitalizar(cita.mascota.especie)}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* La cita */}
            <Tarjeta elevacion="plana" relleno="amplio">
              <View style={{ gap: spacing[2] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.base,
                      color: theme.text.primary,
                    }}
                  >
                    {cita.tipo.nombre}
                  </Text>
                  {insignia ? <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" /> : null}
                </View>
                <Text
                  style={{
                    fontFamily: typography.family.mono.regular,
                    fontSize: typography.size.sm,
                    letterSpacing: typography.tracking.mono,
                    color: theme.text.secondary,
                  }}
                >
                  {`${t('cita.hoy')} · ${hora}${dur ? ` · ${dur} min` : ''}`}
                </Text>
                {/* La marca "parte del plan" (D-338, S56-B T7): habla solo si
                    la fila trae suscripcion_servicio_id — hoy siempre null
                    (0 suscripciones), ni un hueco reservado mientras tanto. */}
                {cita.suscripcion_servicio_id !== null ? (
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {t('cita.parteDelPlan', { nombre })}
                  </Text>
                ) : null}
              </View>
            </Tarjeta>

            {/* A dónde ir — D-339: lo que la fila trae, null honesto */}
            <SeccionDireccion direccion={cita.direccion} />

            {/* CTA único — solo confirmada Y del día (dosis baja: tinta).
                La futura dice su porqué — apagado jamás es mudo. */}
            {conCta && (
              <Boton
                variante="primario"
                etiqueta={t('cita.iniciarPaseo')}
                bloque
                cargando={iniciando}
                onPress={() => void iniciar()}
              />
            )}
            {esFutura && (
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.sm,
                  lineHeight: typography.size.sm * 1.4,
                  color: theme.text.secondary,
                  textAlign: 'center',
                }}
              >
                {t('cita.empiezaElDia')}
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
