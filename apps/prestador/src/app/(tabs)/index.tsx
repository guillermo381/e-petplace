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
//   Zona 2 — el día: el resto de la agenda compacta. Desde S57-B1 el
//     lugar hecho D-317 está OCUPADO: segmento Hoy/Semana — la semana
//     son los próximos 7 días con citas FIRMES (mismo filtro positivo),
//     las del plan marcadas, y los días de vacaciones visibles como
//     bloqueados (prestador_bloqueos, solo lectura honesta).
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
  SelectorOpcion,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
  type AvatarMascotaEspecie,
  type InsigniaEstado,
} from '@epetplace/ui';
import {
  obtenerBloqueosPrestador,
  obtenerCitasPaseoDelDia,
  obtenerMascotasAtendidas,
  obtenerMiPrestador,
  resolverUrlsFotos,
  type BloqueoPrestador,
  type CitaAgendaPaseo,
} from '@epetplace/api';
import { fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | {
      estado: 'listo';
      /** El día base del fetch (fecha local al cargar) — ancla de la semana. */
      desde: string;
      /** El rango completo hoy..hoy+6 (la vista Hoy filtra por `desde`). */
      citas: CitaAgendaPaseo[];
      bloqueos: BloqueoPrestador[];
      atendidas: Set<string>;
    };

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

// Suma días en fecha LOCAL por partes literales (jamás Date(iso) directo
// ni toISOString — D-312 / hallazgo S55: corren el día en UTC-5).
function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-CA').format(new Date(a ?? 0, (m ?? 1) - 1, (d ?? 1) + dias));
}

// ¿El día cae dentro de algún bloqueo? (rango INCLUSIVE ambos extremos,
// granularidad día — la semántica de prestador_bloqueos, S56 D-341).
function diaBloqueado(iso: string, bloqueos: BloqueoPrestador[]): boolean {
  return bloqueos.some((b) => b.fechaInicio <= iso && iso <= b.fechaFin);
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
  // S57-B1: la duración REAL de la cita (snapshot S55-B2), no el default
  // del catálogo — una de 120' se pintaba como 30'.
  const dur = cita.duracion_minutos;

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
      titulo={cita.mascota?.nombre ?? t('agenda.mascotaFallback')}
      // La marca "parte del plan" (D-338, S56-B T7) — escalera: peldaño 0 =
      // sin planes, invisible (hoy) · peldaño 1 = este sufijo cuando la fila
      // trae suscripcion_servicio_id · peldaño 2 = detalle del plan visible
      // al prestador (hueco declarado en el pedido D-338 (c), RLS futura).
      subtitulo={
        cita.suscripcion_servicio_id !== null
          ? `${cita.tipo.nombre} · ${t('agenda.parteDelPlan')}`
          : cita.tipo.nombre
      }
      inicio={
        <AvatarMascota
          nombre={cita.mascota?.nombre ?? t('agenda.mascotaFallback')}
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
  const { t, idioma } = useTraduccion();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [refrescando, setRefrescando] = useState(false);
  // D-317: el segmento Hoy/Semana. 'semana' = los próximos 7 días.
  const [vista, setVista] = useState<'hoy' | 'semana'>('hoy');
  // foto_url guarda PATH (S47-B0.2): firma en batch (1 round-trip);
  // un path no firmable cae a la huella digna.
  const [urlsFotos, setUrlsFotos] = useState<Map<string, string>>(new Map());

  const cargar = useCallback(async (esRefresh = false) => {
    if (!esRefresh) setPantalla({ estado: 'cargando' });
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }
    const prestador = await obtenerMiPrestador();
    if (!prestador.ok) {
      setPantalla({ estado: 'error', mensaje: prestador.mensaje });
      return;
    }
    // UN fetch cubre las dos vistas (S57-B1): rango hoy..hoy+6 — la vista
    // Hoy filtra por `desde`; la Semana agrupa el rango entero.
    const desde = hoyLocal();
    const [r, bloqueos, atendidas] = await Promise.all([
      obtenerCitasPaseoDelDia({ prestador_id: prestador.data.id, fecha: desde, fecha_hasta: sumarDias(desde, 6) }),
      // vacaciones (solo lectura): los días bloqueados se pintan como tales
      obtenerBloqueosPrestador(prestador.data.id),
      // la señal "Primera vez" de la Zona 1 (solo lo REAL): mascota
      // sin ninguna atención cerrada con este prestador
      obtenerMascotasAtendidas(prestador.data.id),
    ]);
    if (!r.ok) {
      setPantalla({ estado: 'error', mensaje: r.mensaje });
      return;
    }
    // La marca de bloqueo es PROMESA de la vista semana (jamás se cae en
    // silencio — Ley 13: un error no se disfraza de "sin vacaciones").
    if (!bloqueos.ok) {
      setPantalla({ estado: 'error', mensaje: bloqueos.mensaje });
      return;
    }
    const paths = r.data
      .map((c) => c.mascota?.foto_url)
      .filter((p): p is string => typeof p === 'string' && p.length > 0);
    if (paths.length > 0) setUrlsFotos(await resolverUrlsFotos(paths));
    setPantalla({
      estado: 'listo',
      desde,
      citas: r.data,
      bloqueos: bloqueos.data,
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

  // El fetch trae el rango hoy..hoy+6; la vista Hoy opera sobre el día base.
  const citas = pantalla.estado === 'listo' ? pantalla.citas : [];
  const desde = pantalla.estado === 'listo' ? pantalla.desde : null;
  const citasHoy = desde === null ? [] : citas.filter((c) => c.fecha === desde);

  // ── Zona 1: la destacada — en_curso (Ley 7: UNA con CitaEnVivo) o,
  // si no hay nada corriendo, la PRÓXIMA cita aún no cerrada del día.
  const enCurso = citasHoy.filter((c) => c.atencion?.estado === 'en_curso');
  const enVivo = enCurso.length
    ? enCurso.reduce((a, b) => ((b.atencion?.iniciada_en ?? '') > (a.atencion?.iniciada_en ?? '') ? b : a))
    : undefined;
  const proxima =
    enVivo === undefined
      ? citasHoy.find((c) => {
          const ef = estadoEfectivo(c);
          return ef === 'confirmada' || ef === 'terminada';
        })
      : undefined;
  const destacada = enVivo ?? proxima;
  const resto = citasHoy.filter((c) => c.id !== destacada?.id);

  // ── La semana: 7 días desde hoy — citas firmes por día + estado del
  // día (bloqueado por vacaciones / libre). Cero métricas, solo verdad.
  const dias =
    desde === null || pantalla.estado !== 'listo'
      ? []
      : Array.from({ length: 7 }, (_, i) => {
          const iso = sumarDias(desde, i);
          return {
            iso,
            esHoy: i === 0,
            bloqueado: diaBloqueado(iso, pantalla.bloqueos),
            citas: citas.filter((c) => c.fecha === iso),
          };
        });

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
        {/* D-315p curado (S57-B1): la fecha larga humana ahora vive en el
            riel y habla el idioma del dispositivo. */}
        <Encabezado
          variante="portada"
          saludo={t('agenda.saludo')}
          subtitulo={fechaDiaSemanaHumana(hoyLocal(), idioma as IdiomaSoportado)}
        />

        {/* D-317: el segmento Hoy/Semana (el lugar hecho, ocupado en S57-B1) */}
        {pantalla.estado === 'listo' && (
          <SelectorOpcion
            etiqueta={t('agenda.vistaEtiqueta')}
            opciones={[
              { codigo: 'hoy', etiqueta: t('agenda.vistaHoy') },
              { codigo: 'semana', etiqueta: t('agenda.vistaSemana') },
            ]}
            seleccionada={vista}
            onSelect={(codigo) => setVista(codigo === 'semana' ? 'semana' : 'hoy')}
          />
        )}

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

        {pantalla.estado === 'listo' && vista === 'hoy' && citasHoy.length === 0 && (
          // S52-P7b: registro sereno — el día vacío se dice en el
          // flujo, sin display que grite (dosis baja).
          <EstadoVacio registro="seccion" titulo={t('agenda.vacio')} descripcion={t('agenda.vacioDetalle')} />
        )}

        {/* ── Zona 1 — ahora / lo siguiente (preside) ── */}
        {pantalla.estado === 'listo' && vista === 'hoy' && destacada && (
          <View style={{ gap: spacing[2] }}>
            {/* S52-P7: etiqueta humanizada — sentence case, sin eyebrow */}
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.md,
                color: theme.text.primary,
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

        {/* ── Zona 2 — el día (compacta) ── */}
        {pantalla.estado === 'listo' && vista === 'hoy' && resto.length > 0 && (
          <Tarjeta elevacion="sm" relleno="ninguno">
            {resto.map((c, i) => (
              <View key={c.id}>
                {i > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
                <FilaCita cita={c} enVivo={false} fotoUrl={c.mascota?.foto_url ? urlsFotos.get(c.mascota.foto_url) : undefined} />
              </View>
            ))}
          </Tarjeta>
        )}

        {/* ── La SEMANA (D-317): día → citas firmes, dosis baja. El día
            bloqueado por vacaciones se dice (dato, no juicio); las citas
            confirmadas de un día bloqueado SIGUEN — el bloqueo jamás las
            toca (P14/P16). El día sin nada es "Libre": verdad de
            planificación, no métrica en cero. ── */}
        {pantalla.estado === 'listo' && vista === 'semana' && (
          <View style={{ gap: spacing[5] }}>
            {dias.map((dia) => (
              <View key={dia.iso} style={{ gap: spacing[2] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  <Text
                    accessibilityRole="header"
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.base,
                      color: theme.text.primary,
                    }}
                  >
                    {dia.esHoy ? t('agenda.diaHoy') : fechaDiaSemanaHumana(dia.iso, idioma as IdiomaSoportado)}
                  </Text>
                  {dia.bloqueado && <Insignia estado="info" etiqueta={t('agenda.diaBloqueado')} tamaño="sm" />}
                </View>
                {dia.citas.length > 0 ? (
                  <Tarjeta elevacion="sm" relleno="ninguno">
                    {dia.citas.map((c, i) => (
                      <View key={c.id}>
                        {i > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
                        <FilaCita cita={c} enVivo={false} fotoUrl={c.mascota?.foto_url ? urlsFotos.get(c.mascota.foto_url) : undefined} />
                      </View>
                    ))}
                  </Tarjeta>
                ) : dia.bloqueado ? null : (
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {t('agenda.diaLibre')}
                  </Text>
                )}
              </View>
            ))}
          </View>
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
