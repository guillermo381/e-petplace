// ─────────────────────────────────────────────────────────────────────
// HOY — la jornada (S51-B3.2, DISEÑO_EXPERIENCIA §13, sobre la Agenda
// E2E de S44 que se RECOLOCA sin reescribirse). Dosis BAJA (Ley 4/test
// 7): un acento de capa, CTA en tinta, cero gradiente.
//
// Las 4 zonas:
//   Zona 1 — ahora / lo siguiente: la atención en_curso (CitaEnVivo,
//     Ley 7) o la PRÓXIMA cita, presidiendo, con su "Antes" a un tap
//     (Conocer a {mascota} → vista prestador del expediente) y la
//     señal "Primera vez" cuando es real.
//   Zona 2 — el día: el resto de la agenda compacta. El toggle a
//     semana NO existe todavía — lugar hecho, deuda D-317.
//   Zona 3 — novedades que piden algo: cancelaciones/reagendas del
//     dueño son B5 y los mensajes bidireccionales no existen → HUECO
//     estructural (tipo + comentario), null honesto, cero card.
//   Zona 4 — tu trabajo con dignidad: liquidaciones son B2 y el motor
//     de hitos de trayectoria no existe (nace con el motor B4) → la
//     zona NO existe. JAMÁS métricas en cero (§2.6 del alma).
//
// VERDAD FIRME (test 8): el filtro positivo vive en la puerta única
// (obtenerCitasPaseoDelDia — solo confirmada/en_curso/completada/
// no_show; 'pendiente' y el futuro bloqueo temporal jamás se pintan).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  CitaEnVivo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
  type AvatarMascotaEspecie,
  type InsigniaEstado,
} from '@epetplace/ui';
import {
  obtenerCitasPaseoDelDia,
  obtenerMascotasAtendidas,
  obtenerMiPrestador,
  resolverUrlsFotos,
  type CitaAgendaPaseo,
} from '@epetplace/api';

import { asegurarSesionDev } from '@/lib/api';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; citas: CitaAgendaPaseo[]; atendidas: Set<string> };

// ═══════════ ZONA 3 — NOVEDADES (hueco estructural) ═══════════
// Cancelaciones/reagendas del dueño llegan con B5; los mensajes de
// familia, con el canal interno. Cuando existan, esta pantalla recibe
// valores de este tipo y la zona se renderiza entre Zona 2 y el pie.
// Hasta entonces: null honesto — cero card, cero relleno.
type NovedadZona3 = { tipo: 'cancelacion' | 'reagenda' | 'mensaje'; citaId: string } | null;
const novedadesZona3: NovedadZona3 = null;
// ═══════════════════════════════════════════════════════════════

// Fecha local del dispositivo, YYYY-MM-DD (en-CA da ese formato).
function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function fechaHumana(): string {
  const s = new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// El "estado efectivo" de la fila: prioridad a la atención (en_curso lo
// maneja aparte con CitaEnVivo; el resto va a Insignia).
function estadoEfectivo(cita: CitaAgendaPaseo): string | null {
  return cita.atencion?.estado ?? cita.estado;
}

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

function FilaCita({ cita, enVivo, fotoUrl }: { cita: CitaAgendaPaseo; enVivo: boolean; fotoUrl?: string }) {
  const router = useRouter();
  const { t } = useTraduccion();
  const hora = cita.hora ? cita.hora.slice(0, 5) : '—';
  const dur = cita.tipo.duracion_default_minutos;

  // Estado de cita → Insignia (en_curso no lleva: CitaEnVivo porta el
  // canal). Voz de oficio por el riel — verdad firme: solo estados
  // que el filtro de la puerta única deja pasar.
  const INSIGNIA_POR_ESTADO: Record<string, { estado: InsigniaEstado; etiqueta: string }> = {
    terminada: { estado: 'proximo', etiqueta: t('agenda.estadoPorCerrar') },
    cerrada_con_calidad: { estado: 'alDia', etiqueta: t('agenda.estadoCerrado') },
    confirmada: { estado: 'info', etiqueta: t('agenda.estadoConfirmada') },
    completada: { estado: 'alDia', etiqueta: t('agenda.estadoCompletada') },
    no_show: { estado: 'atencion', etiqueta: t('agenda.estadoNoShow') },
  };

  const ef = estadoEfectivo(cita);
  const insignia = enVivo
    ? undefined
    : ef === 'en_curso'
      ? ({ estado: 'info', etiqueta: t('agenda.enCurso') } as const)
      : ef
        ? INSIGNIA_POR_ESTADO[ef]
        : undefined;

  return (
    <Celda
      interactiva
      onPress={() => router.push({ pathname: '/cita/[citaId]', params: { citaId: cita.id } })}
      accessibilityRole="button"
      titulo={cita.mascota?.nombre ?? 'Mascota'}
      subtitulo={cita.tipo.nombre}
      inicio={
        <AvatarMascota
          nombre={cita.mascota?.nombre ?? 'Mascota'}
          fotoUrl={fotoUrl}
          especie={cita.mascota && esEspecie(cita.mascota.especie) ? cita.mascota.especie : undefined}
          tamano="sm"
        />
      }
      metadataMono={`${hora}${dur ? ` · ${dur} min` : ''}`}
      fin={insignia ? <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" /> : undefined}
    />
  );
}

export default function Hoy() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [refrescando, setRefrescando] = useState(false);
  // foto_url guarda PATH (S47-B0.2): firma en batch (1 round-trip);
  // un path no firmable cae a la huella digna.
  const [urlsFotos, setUrlsFotos] = useState<Map<string, string>>(new Map());

  const cargar = useCallback(async (esRefresh = false) => {
    if (!esRefresh) setPantalla({ estado: 'cargando' });
    const sesion = await asegurarSesionDev();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }
    const prestador = await obtenerMiPrestador();
    if (!prestador.ok) {
      setPantalla({ estado: 'error', mensaje: prestador.mensaje });
      return;
    }
    const [r, atendidas] = await Promise.all([
      obtenerCitasPaseoDelDia({ prestador_id: prestador.data.id, fecha: hoyLocal() }),
      // la señal "Primera vez" de la Zona 1 (solo lo REAL): mascota
      // sin ninguna atención cerrada con este prestador
      obtenerMascotasAtendidas(prestador.data.id),
    ]);
    if (!r.ok) {
      setPantalla({ estado: 'error', mensaje: r.mensaje });
      return;
    }
    const paths = r.data
      .map((c) => c.mascota?.foto_url)
      .filter((p): p is string => typeof p === 'string' && p.length > 0);
    if (paths.length > 0) setUrlsFotos(await resolverUrlsFotos(paths));
    setPantalla({
      estado: 'listo',
      citas: r.data,
      atendidas: new Set(atendidas.ok ? atendidas.data.map((m) => m.mascota_id) : []),
    });
  }, []);

  // Refetch en focus (fix gate B4.4): al volver del Cierre la lista se
  // actualiza sola. Silencioso = reemplazo directo (Ley 13).
  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  async function refrescar() {
    setRefrescando(true);
    await cargar(true);
    setRefrescando(false);
  }

  // ── Zona 1: la destacada — en_curso (Ley 7: UNA con CitaEnVivo) o,
  // si no hay nada corriendo, la PRÓXIMA cita aún no cerrada del día.
  const citas = pantalla.estado === 'listo' ? pantalla.citas : [];
  const enCurso = citas.filter((c) => c.atencion?.estado === 'en_curso');
  const enVivo = enCurso.length
    ? enCurso.reduce((a, b) => ((b.atencion?.iniciada_en ?? '') > (a.atencion?.iniciada_en ?? '') ? b : a))
    : undefined;
  const proxima =
    enVivo === undefined
      ? citas.find((c) => {
          const ef = estadoEfectivo(c);
          return ef === 'confirmada' || ef === 'terminada';
        })
      : undefined;
  const destacada = enVivo ?? proxima;
  const resto = citas.filter((c) => c.id !== destacada?.id);

  const esPrimeraVez =
    destacada?.mascota != null &&
    pantalla.estado === 'listo' &&
    !pantalla.atendidas.has(destacada.mascota.id);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
      >
        <Encabezado variante="portada" saludo={t('agenda.saludo')} subtitulo={fechaHumana()} />

        {pantalla.estado === 'cargando' && (
          <Tarjeta elevacion="plana">
            <EsqueletoGrupo>
              <View style={{ gap: spacing[4] }}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                    <Esqueleto forma="circulo" alto={40} />
                    <View style={{ flex: 1, gap: spacing[2] }}>
                      <Esqueleto forma="linea" ancho="60%" />
                      <Esqueleto forma="linea" ancho="40%" />
                    </View>
                  </View>
                ))}
              </View>
            </EsqueletoGrupo>
          </Tarjeta>
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

        {pantalla.estado === 'listo' && citas.length === 0 && (
          <EstadoVacio titulo={t('agenda.vacio')} descripcion={t('agenda.vacioDetalle')} />
        )}

        {/* ── Zona 1 — ahora / lo siguiente (preside) ── */}
        {pantalla.estado === 'listo' && destacada && (
          <View style={{ gap: spacing[2] }}>
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.sm,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                color: theme.text.tertiary,
              }}
            >
              {enVivo ? t('agenda.ahora') : t('agenda.loSiguiente')}
            </Text>
            {enVivo ? (
              <CitaEnVivo capa="cuidado">
                <Tarjeta elevacion="plana" relleno="ninguno">
                  <FilaCita cita={enVivo} enVivo fotoUrl={enVivo.mascota?.foto_url ? urlsFotos.get(enVivo.mascota.foto_url) : undefined} />
                </Tarjeta>
              </CitaEnVivo>
            ) : (
              <Tarjeta elevacion="sm" relleno="ninguno">
                <FilaCita cita={destacada} enVivo={false} fotoUrl={destacada.mascota?.foto_url ? urlsFotos.get(destacada.mascota.foto_url) : undefined} />
              </Tarjeta>
            )}
            {/* el "Antes" a un tap: quién es + sus señales (vista
                prestador del expediente); "Primera vez" solo si es REAL */}
            {destacada.mascota != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <Boton
                  variante="ghost"
                  tamaño="sm"
                  etiqueta={t('agenda.conocerMascota', { nombre: destacada.mascota.nombre })}
                  onPress={() => {
                    if (destacada.mascota) {
                      router.push({ pathname: '/mascota/[mascotaId]', params: { mascotaId: destacada.mascota.id } });
                    }
                  }}
                />
                {esPrimeraVez ? <Insignia estado="info" etiqueta={t('agenda.primeraVez')} tamaño="sm" /> : null}
              </View>
            )}
          </View>
        )}

        {/* ── Zona 2 — el día (compacta). Toggle a semana: NO existe
            todavía — lugar hecho, D-317 con disparo. ── */}
        {pantalla.estado === 'listo' && resto.length > 0 && (
          <Tarjeta elevacion="sm" relleno="ninguno">
            {resto.map((c, i) => (
              <View key={c.id}>
                {i > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
                <FilaCita cita={c} enVivo={false} fotoUrl={c.mascota?.foto_url ? urlsFotos.get(c.mascota.foto_url) : undefined} />
              </View>
            ))}
          </Tarjeta>
        )}

        {/* ── Zona 3 — novedades: hueco estructural (ver arriba) ── */}
        {novedadesZona3 !== null ? null : null}

        {/* ── Zona 4 — tu trabajo con dignidad: liquidaciones son B2 y
            el motor de hitos de trayectoria (§2.7) no existe → la zona
            NO existe hoy. JAMÁS métricas en cero. ── */}
      </ScrollView>
    </SafeAreaView>
  );
}
