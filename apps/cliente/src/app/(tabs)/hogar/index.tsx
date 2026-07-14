/**
 * HOGAR — la tesis del producto hecha pantalla (S51-B2.2, sobre
 * DISEÑO_EXPERIENCIA §1-§2): el estado del hogar, no una grilla.
 *
 * ORDEN S58 (patrón v2 "techo vivo" FIRMADO), de arriba hacia abajo:
 *   Techo vivo — HeroMarca techoVivo (curva 44/26) + destello Coach.
 *   HERO de hoy — atención en curso (CitaEnVivo, Ley 7) o el próximo
 *     paseo en tarjeta de DOS PISOS (servicio+estado relativo en capa
 *     teal / dirección del snapshot D-339 con pin y chevron → hub).
 *     Sin nada: NO EXISTE (silencio digno).
 *   Tu hogar — las mascotas con su línea de estado Y su próxima cita
 *     (FichaMascotaHogar; voz calculada por calcularVozHogar de
 *     @epetplace/domain sobre el expediente REAL — L-139). Tap → perfil.
 *   GRUPO de celdas (Ley 19.1) — carnet/hub/agregar con subtítulo VIVO.
 *   Zona 3 — en contexto: el motor de revelaciones es B4 — hueco
 *     estructural (ver ZONA 3 abajo), null honesto.
 *   La vida — LineaDeVida del HOGAR (merge multi-mascota por fecha).
 *
 * Herencias vivas de la pantalla S45-S48 que esta reemplaza: Hoja de
 * detalle de vacuna (tap en nodo) y VisorFoto del carnet. La Hoja de
 * Ajustes/sesión MIGRÓ a Cuenta (B2.5).
 */

import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  CitaEnVivo,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FichaMascotaHogar,
  HeroMarca,
  Hoja,
  Icono,
  HojaScroll,
  LineaDeVida,
  Separador,
  Tarjeta,
  VisorFoto,
  motion,
  spacing,
  typography,
  useAviso,
  useTheme,
  type FichaMascotaHogarVoz,
  type LineaDeVidaEstadoPie,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerMiPerfil,
  leerTimelineMascota,
  obtenerEstadoHogar,
  obtenerMascotasDeFamilia,
  obtenerMisPlanesPaseo,
  obtenerVacunaPorEvento,
  resolverUrlFoto,
  resolverUrlsFotos,
  type EstadoHogar,
  type ItemTimeline,
  type MascotaResumen,
  type PlanPaseo,
  type VacunaDeEvento,
} from '@epetplace/api';
import { calcularVozHogar, type VozEstadoHogar } from '@epetplace/domain';

import { fechaCortaMono } from '@epetplace/i18n';

import { CoachHoja } from '@/components/coach';
import { useTraduccion } from '@/i18n';


type TraductorHogar = ReturnType<typeof useTraduccion>['t'];

// Saludo por franja horaria (S52-P2a, voz del lote): la app saluda
// como una persona — mañana/tarde/noche del reloj del dispositivo.
function saludoPorFranja(hora: number, t: TraductorHogar): string {
  if (hora >= 5 && hora < 12) return t('hogar.saludoManana');
  if (hora >= 12 && hora < 19) return t('hogar.saludoTarde');
  return t('hogar.saludoNoche');
}

// Entrada escalonada de zonas (S52-P2f): fade+translate sutil, tokens
// de la casa (<300ms, Ley 6); solo al montar — jamás en re-fetch.
const entradaZona = (orden: number) =>
  FadeInDown.duration(motion.duration.normal).delay(orden * motion.stagger.fast);

// El CUÁNDO relativo del hero (patrón v2): "En 2 h" / "En 20 min" para
// lo cercano; lo lejano habla en mono absoluto (fechaCortaMono).
function cuandoRelativo(
  fecha: string,
  hora: string | null,
  t: TraductorHogar,
): { relativo: string } | { mono: true } {
  if (hora === null) return { mono: true };
  const ts = Date.parse(`${fecha}T${hora}:00`);
  if (!Number.isFinite(ts)) return { mono: true };
  const min = Math.round((ts - Date.now()) / 60000);
  if (min <= 0) return { mono: true };
  if (min < 60) return { relativo: t('hogar.enMinutos', { n: min }) };
  if (min < 48 * 60) return { relativo: t('hogar.enHoras', { n: Math.round(min / 60) }) };
  return { mono: true };
}

// Día de la semana en voz del idioma — convención regla 32
// (0=Domingo..6=Sábado; 2023-01-01 fue domingo).
function nombreDia(d: number, idioma: string): string {
  const fecha = new Date(Date.UTC(2023, 0, 1 + d));
  return new Intl.DateTimeFormat(idioma === 'en' ? 'en' : 'es', { weekday: 'long', timeZone: 'UTC' }).format(fecha);
}


// Código de voz (Ley 3: jamás visible) → texto del riel + semántica.
// S52-P3: la ficha usa las voces SIN sujeto (ficha.*) — el nombre
// preside la card y no se repite. Las variantes con {{nombre}}
// (hogar.voz*) se CONSERVAN para contextos sin sujeto visible
// (notificaciones, Coach, alertas — decisión founder S52).
function vozATexto(voz: VozEstadoHogar, t: TraductorHogar): { texto: string; semantica: FichaMascotaHogarVoz } {
  switch (voz.voz) {
    case 'alDia':
      return { texto: t('ficha.vozAlDia'), semantica: 'alDia' };
    case 'pideAtencion': {
      if (voz.causa === 'emergencia') {
        return { texto: t('ficha.vozEmergencia'), semantica: 'pideAtencion' };
      }
      const { vacuna, dias } = voz;
      if (voz.causa === 'vacunaVence') {
        const texto =
          dias === 0
            ? t('ficha.vozVacunaVenceHoy', { vacuna })
            : dias === 1
              ? t('ficha.vozVacunaVenceUnDia', { vacuna })
              : t('ficha.vozVacunaVence', { vacuna, dias });
        return { texto, semantica: 'pideAtencion' };
      }
      const texto =
        dias === 1
          ? t('ficha.vozVacunaVencidaUnDia', { vacuna })
          : t('ficha.vozVacunaVencida', { vacuna, dias });
      return { texto, semantica: 'pideAtencion' };
    }
    case 'conociendolo':
      return {
        texto: voz.causa === 'expedienteRalo' ? t('ficha.vozConociendolo') : t('ficha.vozQuieto'),
        semantica: 'conociendolo',
      };
  }
}

// ═══════════ ZONA 3 — EN CONTEXTO (hueco estructural) ═══════════
// El motor de revelaciones NO existe (nace en B4 junto al de alertas —
// trenza A0⇄B4). Cuando exista, entregará a esta pantalla un valor de
// este tipo y la zona se renderizará entre Zona 2 y Zona 4. Hasta
// entonces: null honesto ESTRUCTURAL — cero card vacía, cero relleno.
type RevelacionZona3 = { titulo: string; narrativa: string; accion: () => void } | null;
const revelacionZona3: RevelacionZona3 = null;
// ═════════════════════════════════════════════════════════════════

type EstadoMascotas = MascotaResumen[] | 'cargando' | 'error';

export default function Hogar() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [mascotas, setMascotas] = useState<EstadoMascotas>('cargando');
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [estadoHogar, setEstadoHogar] = useState<EstadoHogar | null>(null);

  // Zona 4 — timeline del hogar: merge multi-mascota con cursor por mascota.
  const [items, setItems] = useState<ItemTimeline[] | null | 'error'>(null);
  const cursoresRef = useRef<Record<string, string | null>>({});
  const [estadoPie, setEstadoPie] = useState<LineaDeVidaEstadoPie>('nada');
  const cargandoMasRef = useRef(false);

  const [carnetSelectorAbierto, setCarnetSelectorAbierto] = useState(false);
  const [coachAbierto, setCoachAbierto] = useState(false);
  // D-338: la celda del Hogar es una de las DOS entradas al hub "Mis
  // paseos" — visible SOLO con planes (silencio digno). S58: se guarda
  // el primer plan ACTIVO para el subtítulo VIVO del grupo.
  const [planActivo, setPlanActivo] = useState<PlanPaseo | null>(null);
  const [hayPlanes, setHayPlanes] = useState(false);
  // QW1 (S53): el saludo lleva el nombre del miembro (profiles.nombre).
  const [nombrePerfil, setNombrePerfil] = useState<string | null>(null);
  const [vacunaAbierta, setVacunaAbierta] = useState(false);
  const [vacuna, setVacuna] = useState<VacunaDeEvento | 'cargando' | 'error'>('cargando');
  const [carnetFirmado, setCarnetFirmado] = useState<string | null>(null);

  const esMemorial = theme.mode === 'memorial';

  // S59 — barra de estado del techo vivo: el gradiente pinta bajo la
  // barra (HeroMarca absorbe el inset), así que sobre él van íconos
  // CLAROS. Solo cuando el techo se pinta (hay mascotas) y fuera de
  // memorial (bg.card claro pide íconos oscuros). Al perder el foco se
  // restaura la voz del tema — wiring en la pantalla, patrón BarraTabs:
  // packages/ui no conoce el foco de navegación.
  const techoPintado = Array.isArray(mascotas) && mascotas.length > 0;
  useFocusEffect(
    useCallback(() => {
      if (esMemorial || !techoPintado) return;
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle(theme.mode === 'dark' ? 'light-content' : 'dark-content');
    }, [esMemorial, techoPintado, theme.mode]),
  );

  const ordenarPorFecha = (a: ItemTimeline, b: ItemTimeline) => (a.fecha_evento < b.fecha_evento ? 1 : -1);

  const cargarTimelineHogar = useCallback(async (lista: MascotaResumen[]) => {
    const paginas = await Promise.all(lista.map((m) => leerTimelineMascota(m.id)));
    if (paginas.some((p) => !p.ok)) {
      setItems('error');
      setEstadoPie('nada');
      return;
    }
    const todos: ItemTimeline[] = [];
    const cursores: Record<string, string | null> = {};
    paginas.forEach((p, i) => {
      if (p.ok) {
        todos.push(...p.data.items);
        cursores[lista[i].id] = p.data.siguiente_cursor;
      }
    });
    cursoresRef.current = cursores;
    todos.sort(ordenarPorFecha);
    setItems(todos);
    setEstadoPie(Object.values(cursores).some((c) => c !== null) ? 'mas' : 'nada');
  }, []);

  const cargarMas = useCallback(async () => {
    if (cargandoMasRef.current || !Array.isArray(mascotas)) return;
    const pendientes = Object.entries(cursoresRef.current).filter(([, c]) => c !== null);
    if (pendientes.length === 0) {
      // reintento sin cursores: recargar el timeline del hogar
      setEstadoPie('cargando');
      await cargarTimelineHogar(mascotas);
      return;
    }
    cargandoMasRef.current = true;
    setEstadoPie('cargando');
    const resultados = await Promise.all(
      pendientes.map(([id, cursor]) => leerTimelineMascota(id, { cursor: cursor as string })),
    );
    cargandoMasRef.current = false;
    if (resultados.some((r) => !r.ok)) {
      setEstadoPie('error');
      return;
    }
    const nuevos: ItemTimeline[] = [];
    resultados.forEach((r, i) => {
      if (r.ok) {
        nuevos.push(...r.data.items);
        cursoresRef.current[pendientes[i][0]] = r.data.siguiente_cursor;
      }
    });
    setItems((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      return [...base, ...nuevos].sort(ordenarPorFecha);
    });
    setEstadoPie(Object.values(cursoresRef.current).some((c) => c !== null) ? 'mas' : 'nada');
  }, [mascotas, cargarTimelineHogar]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const estado = await getEstadoOnboardingDueno();
        if (!vigente) return;
        if (!estado.ok || !estado.data.tiene_familia || estado.data.familia_id === null) {
          router.replace('/');
          return;
        }
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (!vigente) return;
        if (!r.ok) {
          setMascotas('error');
          return;
        }
        const lista = r.data;
        setMascotas(lista);

        // señales + fotos + timeline en paralelo — reemplazo directo (Ley 13)
        void obtenerEstadoHogar(lista.map((m) => m.id)).then((eh) => {
          if (vigente && eh.ok) setEstadoHogar(eh.data);
        });
        void obtenerMisPlanesPaseo().then((pl) => {
          if (vigente && pl.ok) {
            setHayPlanes(pl.data.length > 0);
            setPlanActivo(pl.data.find((p) => p.estado === 'activa') ?? null);
          }
        });
        void obtenerMiPerfil().then((p) => {
          // sin nombre: el saludo va solo — jamás un nombre inventado
          if (vigente && p.ok) setNombrePerfil(p.data.nombre);
        });
        const paths = lista.map((m) => m.foto_url).filter((p): p is string => typeof p === 'string' && p.length > 0);
        if (paths.length > 0) {
          void resolverUrlsFotos(paths).then((urls) => {
            if (!vigente) return;
            const porMascota: Record<string, string> = {};
            lista.forEach((m) => {
              const url = m.foto_url ? urls.get(m.foto_url) : undefined;
              if (url) porMascota[m.id] = url;
            });
            setFotos(porMascota);
          });
        }
        void cargarTimelineHogar(lista);
      })();
      return () => {
        vigente = false;
      };
    }, [router, cargarTimelineHogar]),
  );

  const alTocarNodo = (item: { atencion_id?: string | null; evento_id: string; tipo?: string }) => {
    if (item.tipo === 'vacuna_aplicada') {
      setVacunaAbierta(true);
      setVacuna('cargando');
      void obtenerVacunaPorEvento(item.evento_id).then((r) => {
        setVacuna(r.ok ? r.data : 'error');
      });
      return;
    }
    if (item.atencion_id) {
      router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: item.atencion_id } });
    }
  };

  async function verCarnet(path: string) {
    const url = await resolverUrlFoto(path);
    if (url === null) {
      mostrar({ texto: t('vacunaHoja.errorAbrirCarnet'), variante: 'error' });
      return;
    }
    setCarnetFirmado(url);
  }

  function irACargarCarnet(m: MascotaResumen) {
    setCarnetSelectorAbierto(false);
    router.push({ pathname: '/carnet', params: { mascotaId: m.id, nombre: m.nombre } });
  }

  if (mascotas === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, padding: spacing[5], paddingTop: insets.top + spacing[8] }}>
        <EsqueletoGrupo etiqueta={t('hogar.cargando')}>
          <View style={{ gap: spacing[4] }}>
            <Esqueleto forma="linea" ancho="50%" />
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
            <View style={{ height: spacing[4] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
          </View>
        </EsqueletoGrupo>
      </View>
    );
  }

  if (mascotas === 'error') {
    // el error JAMÁS se disfraza de vacío (Ley 13)
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio
          titulo={t('hogar.errorHistoria')}
          descripcion={t('hogar.errorHistoriaDetalle')}
          accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setMascotas('cargando')} />}
        />
      </View>
    );
  }

  if (mascotas.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio titulo={t('hogar.sinMascotas')} descripcion={t('hogar.sinMascotasDetalle')} />
      </View>
    );
  }

  const hoy = new Date();
  const senalesPorMascota = new Map(estadoHogar?.senales.map((s) => [s.mascota_id, s]) ?? []);
  // S59 §7.5 — multi-mascota primera clase: N paseos vivos = N celdas
  // vivas, cada una a SU en vivo (antes solo viajaba la más reciente).
  const enCurso = estadoHogar?.atenciones_en_curso ?? [];
  const proximaCita = enCurso.length === 0 ? (estadoHogar?.proxima_cita ?? null) : null;
  const nombreDe = (id: string) => (Array.isArray(mascotas) ? (mascotas.find((m) => m.id === id)?.nombre ?? '') : '');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg.base }}
      contentContainerStyle={{ paddingBottom: spacing[8] }}
    >
      {/* ── Zona 1 — el hogar ───────────────────────────────────
          Techo: HeroMarca compacto (enmienda Ley 4 S52, SELLADA
          condicionada al gate visual del founder). PUNTO DE REVERSIÓN
          BARATA: si el gate lo baja, reemplazar este bloque por
          <Encabezado variante="portada" saludo={saludoPorFranja(...)}/>
          — el lockup en tinta de P1; un cambio de componente, cero
          lógica. El isotipo blanco de adentro es el UNO por pantalla.
          Memorial degrada solo (bg.card plano). */}
      <View>
        {/* S58 patrón v2: el TECHO VIVO — la base curva 44/26 (la
            calibración final se sella en el gate en dispositivo).
            S59: la safe area la absorbe HeroMarca (el gradiente pinta
            bajo la barra de estado; el padding externo murió). */}
        <HeroMarca
          titulo={`${saludoPorFranja(hoy.getHours(), t)}${nombrePerfil ? `, ${nombrePerfil.trim().split(' ')[0]}` : ''}`}
          variante="techoVivo"
        />
        {/* LA ENTRADA DEL COACH (S53-B2b, §6 + DIRECCION_ARTE §5.1):
            el destello vive en el techo del Hogar, discreto. Blanco
            sobre el gradiente (misma familia que el isotipo — marca,
            no CTA); memorial degrada solo por el registry del Icono.
            El PUNTO DE NOVEDAD se enciende solo cuando el motor de
            revelaciones (B4) tenga algo nuevo que decir — jamás badge
            permanente; su lugar queda hecho abajo. */}
        <Pressable
          onPress={() => setCoachAbierto(true)}
          accessibilityRole="button"
          accessibilityLabel={t('coach.abrir')}
          hitSlop={10}
          style={{
            position: 'absolute',
            top: insets.top + spacing[3],
            right: spacing[3],
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icono nombre="coach" tamano={24} registro="tinta" tinta={esMemorial ? theme.text.secondary : theme.text.onGradient} />
          {/* punto de novedad — motor B4: {hayNovedadCoach ? <View .../> : null} */}
        </Pressable>
      </View>

      {/* ── HERO de hoy (patrón v2: arriba, es lo que viene) ────────
          En curso gana el lugar (Ley 7); si no, el próximo paseo en
          tarjeta de DOS PISOS: servicio+estado relativo en capa teal /
          dirección con pin y chevron (entra al hub). Sin nada: silencio. */}
      {enCurso.length > 0 ? (
        // §7.5: una celda VIVA por atención en curso — cada CitaEnVivo
        // envuelve una cita REAL ejecutándose ahora (el espíritu de la
        // Ley 7 intacto: nada decorativo; la letra firmada §7.5 manda
        // en el multi-paseo simultáneo).
        <Animated.View entering={entradaZona(0)} style={{ paddingHorizontal: spacing[4], paddingTop: spacing[5], gap: spacing[4] }}>
          {enCurso.map((a) => (
            <CitaEnVivo key={a.atencion_id} capa="cuidado">
              <Celda
                interactiva
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: a.atencion_id } })}
                titulo={nombreDe(a.mascota_id)}
                subtitulo={t(
                  a.oficio === 'grooming'
                    ? 'hogar.groomingEnCurso'
                    : a.oficio === 'paseo'
                      ? 'hogar.paseoEnCurso'
                      : 'hogar.atencionEnCurso',
                )}
                fin={
                  <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.accent.primary }}>
                    {t('hogar.verEnVivo')}
                  </Text>
                }
              />
            </CitaEnVivo>
          ))}
        </Animated.View>
      ) : proximaCita !== null ? (
        <Animated.View entering={entradaZona(0)} style={{ paddingHorizontal: spacing[4], paddingTop: spacing[5] }}>
          <Tarjeta relleno="ninguno" elevacion="reposo">
            {(() => {
              const cuando = cuandoRelativo(proximaCita.fecha, proximaCita.hora, t);
              const monoAbsoluto = `${fechaCortaMono(proximaCita.fecha, idioma)}${proximaCita.hora ? ` · ${proximaCita.hora}` : ''}`;
              return (
                <Celda
                  titulo={`${nombreDe(proximaCita.mascota_id)}${proximaCita.tipo_servicio ? ` · ${proximaCita.tipo_servicio}` : ''}`}
                  subtitulo={t(proximaCita.reserva === 'hold' ? 'hogar.reservandoHorario' : 'hogar.proximaCita')}
                  {...('relativo' in cuando
                    ? {
                        fin: (
                          // el estado del hero habla en la capa del paseo (teal AA)
                          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: 'capaText' in theme ? theme.capaText.cuidado : theme.capa.cuidado }}>
                            {cuando.relativo}
                          </Text>
                        ),
                      }
                    : { metadataMono: monoAbsoluto })}
                />
              );
            })()}
            {proximaCita.direccion !== null ? (
              <>
                <Separador />
                <Celda
                  interactiva
                  accessibilityRole="button"
                  onPress={() => router.push('/hogar/paseos')}
                  titulo={proximaCita.direccion}
                  inicio={<Icono nombre="ubicacion" tamano={20} />}
                  fin={
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
                      <Path d="M9 18l6-6-6-6" stroke={theme.text.tertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  }
                />
              </>
            ) : null}
          </Tarjeta>
        </Animated.View>
      ) : null}

      {/* ── Tu hogar (Zona 1): la mascota preside, su próxima cita visible ── */}
      <Animated.View
        entering={entradaZona(1)}
        style={{ paddingHorizontal: spacing[4], paddingTop: spacing[5], gap: spacing[3] }}
      >
        {mascotas.map((m) => {
          const senales = senalesPorMascota.get(m.id);
          // Sin señales todavía (estado del hogar cargando): la ficha
          // muestra solo el nombre — jamás una voz inventada (L-139).
          const voz = senales
            ? vozATexto(
                calcularVozHogar(
                  {
                    tieneEmergenciaActiva: senales.tiene_emergencia_activa,
                    vacunasTotal: senales.vacunas_total,
                    ultimaVacunaAplicada: senales.ultima_vacuna_aplicada,
                    proximaVacuna: senales.proxima_vacuna,
                    ultimaAtencionCerrada: senales.ultima_atencion_cerrada,
                  },
                  hoy,
                ),
                t,
              )
            : null;
          const pc = estadoHogar?.proxima_cita_por_mascota[m.id];
          return (
            <FichaMascotaHogar
              key={m.id}
              nombre={m.nombre}
              fotoUrl={fotos[m.id]}
              voz={voz?.semantica ?? 'conociendolo'}
              textoEstado={voz?.texto ?? ''}
              proximaCitaMono={pc ? `${fechaCortaMono(pc.fecha, idioma)}${pc.hora ? ` · ${pc.hora}` : ''}` : undefined}
              onPress={() => router.push({ pathname: '/hogar/mascota/[mascotaId]', params: { mascotaId: m.id } })}
            />
          );
        })}
      </Animated.View>

      {/* ── El GRUPO de celdas (patrón v2, Ley 19.1): entrar a una
          sección con subtítulo VIVO — dato real del expediente, jamás
          descripción estática. Hairline solo interno (Chanel); la
          superficie apoyada no lleva borde. "Agregar mascota" es
          ACCIÓN dentro del grupo (sin chevron). ── */}
      <Animated.View entering={entradaZona(2)} style={{ paddingHorizontal: spacing[4], marginTop: spacing[7] }}>
        <Tarjeta relleno="ninguno" elevacion="reposo">
          <CeldaNavegacion
            icono="veterinaria"
            titulo={t('hogar.cargarCarnet')}
            detalle={(() => {
              // vivo: el refuerzo más próximo del hogar (señal real)
              let masProxima: { nombre: string; fecha: string } | null = null;
              for (const s of estadoHogar?.senales ?? []) {
                if (s.proxima_vacuna !== null && (masProxima === null || s.proxima_vacuna.fecha < masProxima.fecha)) {
                  masProxima = { nombre: nombreDe(s.mascota_id), fecha: s.proxima_vacuna.fecha };
                }
              }
              if (masProxima !== null && masProxima.nombre !== '') {
                const dias = Math.round((Date.parse(masProxima.fecha) - Date.parse(new Intl.DateTimeFormat('en-CA').format(hoy))) / 86400000);
                if (dias === 0) return t('hogar.refuerzoHoy', { nombre: masProxima.nombre });
                if (dias === 1) return t('hogar.refuerzoManana', { nombre: masProxima.nombre });
                if (dias > 1) return t('hogar.refuerzoEnDias', { nombre: masProxima.nombre, n: dias });
              }
              // sin señal: la invitación de siempre (voz de vacío, no dato)
              return t('hogar.cargarCarnetDetalle');
            })()}
            onPress={() => {
              if (mascotas.length === 1) irACargarCarnet(mascotas[0]);
              else setCarnetSelectorAbierto(true);
            }}
          />
          {/* D-338 intacto: el hub solo cuando el plan existe (silencio digno) */}
          {hayPlanes ? (
            <>
              <Separador />
              <CeldaNavegacion
                icono="paseo"
                titulo={t('plan.hubTitulo')}
                detalle={
                  planActivo !== null && planActivo.dias_semana.length > 0
                    ? t('hogar.planDias', { dias: planActivo.dias_semana.map((d) => nombreDia(d, idioma)).join(', ') })
                    : undefined
                }
                onPress={() => router.push('/hogar/paseos')}
              />
            </>
          ) : null}
          <Separador />
          <CeldaNavegacion
            icono="refugio"
            titulo={t('hogar.agregarMascotaCelda')}
            detalle={t('agregarMascota.entradaDetalle')}
            chevron={false}
            onPress={() => router.push('/hogar/agregar')}
          />
        </Tarjeta>
      </Animated.View>

      {/* ── Zona 3 — en contexto: hueco estructural (ver arriba) ── */}
      {revelacionZona3 !== null ? null : null}

      {/* ── Zona 4 — la vida ─────────────────────────────────────
          Ritmo S52-P2c: entre zonas spacing[7]; adentro spacing[4]. */}
      <Animated.View
        entering={entradaZona(3)}
        style={{ paddingHorizontal: spacing[4], marginTop: spacing[7], gap: spacing[4] }}
      >
        {/* la invitación del carnet MIGRÓ al grupo de celdas (Chanel S58) */}
        {items === null ? (
          <LineaDeVida items={[]} cargando />
        ) : items === 'error' ? (
          <EstadoVacio
            titulo={t('hogar.errorHistoria')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('hogar.reintentar')}
                onPress={() => {
                  setItems(null);
                  if (Array.isArray(mascotas)) void cargarTimelineHogar(mascotas);
                }}
              />
            }
          />
        ) : items.length === 0 ? (
          <EstadoVacio titulo={t('hogar.historiaEmpieza')} descripcion={t('hogar.historiaEmpiezaDetalle')} />
        ) : (
          <LineaDeVida items={items} onPressNodo={alTocarNodo} estadoPie={estadoPie} onCargarMas={() => void cargarMas()} />
        )}
      </Animated.View>

      {/* ¿De quién es el carnet? — selector multi-mascota */}
      <Hoja visible={carnetSelectorAbierto} onCerrar={() => setCarnetSelectorAbierto(false)} titulo={t('hogar.carnetDeQuien')} conCerrar>
        <HojaScroll>
          {mascotas.map((m, i) => (
            <View key={m.id}>
              {i > 0 ? <Separador /> : null}
              <Celda interactiva accessibilityRole="button" onPress={() => irACargarCarnet(m)} titulo={m.nombre} />
            </View>
          ))}
        </HojaScroll>
      </Hoja>

      {/* Detalle de vacuna (tap en nodo) — Hoja + Ver carnet firmado */}
      <Hoja visible={vacunaAbierta} onCerrar={() => { setVacunaAbierta(false); setCarnetFirmado(null); }} titulo={t('vacunaHoja.titulo')} conCerrar>
        {vacuna === 'cargando' ? (
          <View style={{ padding: spacing[4] }}>
            <EsqueletoGrupo etiqueta={t('vacunaHoja.cargando')}>
              <View style={{ gap: spacing[2] }}>
                <Esqueleto forma="linea" ancho="60%" />
                <Esqueleto forma="linea" ancho="40%" />
              </View>
            </EsqueletoGrupo>
          </View>
        ) : vacuna === 'error' ? (
          <View style={{ padding: spacing[4] }}>
            <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.status.dangerText }}>
              {t('vacunaHoja.error')}
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing[3], padding: spacing[4] }}>
            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}>
              {vacuna.nombre_vacuna}
            </Text>
            {(vacuna.tipo_vacuna || vacuna.veterinario_nombre_externo) && (
              <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                {[vacuna.tipo_vacuna, vacuna.veterinario_nombre_externo].filter(Boolean).join(' · ')}
              </Text>
            )}
            {(vacuna.fecha_aplicada || vacuna.fecha_proxima || vacuna.lote) && (
              <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
                {[
                  vacuna.fecha_aplicada ? `${t('vacunaHoja.aplicada')} ${fechaCortaMono(vacuna.fecha_aplicada, idioma)}` : null,
                  vacuna.fecha_proxima ? `${t('vacunaHoja.proxima')} ${fechaCortaMono(vacuna.fecha_proxima, idioma)}` : null,
                  vacuna.lote ? `${t('vacunaHoja.lote')} ${vacuna.lote.toLowerCase()}` : null,
                ].filter(Boolean).join(' · ')}
              </Text>
            )}
            {vacuna.archivo_url !== null && (
              <Boton
                variante="secundario"
                bloque
                etiqueta={t('vacunaHoja.verCarnet')}
                onPress={() => { if (vacuna.archivo_url !== null) void verCarnet(vacuna.archivo_url); }}
              />
            )}
          </View>
        )}
      </Hoja>

      <CoachHoja visible={coachAbierto} onCerrar={() => setCoachAbierto(false)} mascotas={mascotas} />

      {carnetFirmado !== null && (
        <VisorFoto
          visible
          onCerrar={() => setCarnetFirmado(null)}
          fotos={[carnetFirmado]}
          etiqueta={t('vacunaHoja.titulo')}
        />
      )}

    </ScrollView>
  );
}
