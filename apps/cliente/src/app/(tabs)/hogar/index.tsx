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

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  AvatarMascota,
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
  Insignia,
  LineaDeVida,
  SelectorOpcion,
  Separador,
  Tarjeta,
  VisorFoto,
  motion,
  spacing,
  typography,
  useAviso,
  usePresionado,
  useTheme,
  type FichaMascotaHogarAccion,
  type FichaMascotaHogarVoz,
  type LineaDeVidaEstadoPie,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerMiPerfil,
  leerDetalleAtencion,
  leerTimelineMascota,
  obtenerEstadoHogar,
  obtenerMascotasDeFamilia,
  obtenerMisPlanesPaseo,
  obtenerPresupuestosFamilia,
  type PresupuestoFamilia,
  obtenerResumenServiciosHogar,
  type ResumenServiciosHogar,
  obtenerVacunaPorEvento,
  obtenerSolicitudesPendientesDueno,
  resolverUrlFoto,
  resolverUrlsFotos,
  type DetalleAtencion,
  type EstadoHogar,
  type ItemTimeline,
  type MascotaResumen,
  type PlanPaseo,
  type SolicitudPendiente,
  type VacunaDeEvento,
} from '@epetplace/api';
import { calcularVozHogar, type VozEstadoHogar } from '@epetplace/domain';

import { fechaCortaMono, fechaLargaHumana } from '@epetplace/i18n';

import { CoachHoja } from '@/components/coach';
import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';


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
// ═════════════════════════════════════════════════════════════════

type EstadoMascotas = MascotaResumen[] | 'cargando' | 'error';

// S61-A11: el item del HOGAR = el del timeline + su mascota (el merge
// multi-mascota etiqueta; leerTimelineMascota es por mascota).
type ItemHogar = ItemTimeline & { mascota_id: string };

// El filtro por TIPO habla en familias de servicio (Ley 3) — el código
// del evento jamás sale de acá. 'otros' pasa solo sin filtro activo.
const FAMILIA_DE_TIPO: Record<string, 'paseos' | 'estetica' | 'adiestramiento' | 'vacunas'> = {
  atencion_paseo_registrada: 'paseos',
  atencion_grooming_registrada: 'estetica',
  // S65 (hallazgo founder): la sesión cerrada no tenía familia — sin
  // chip en "¿Qué momentos?" y con filtro activo desaparecía.
  atencion_adiestramiento_registrada: 'adiestramiento',
  vacuna_aplicada: 'vacunas',
};

// ── S61-A11: el acordeón de la vida — el detalle se despliega DEBAJO
// (jamás navega de una). Se monta recién al expandir: fetch perezoso.
// "Ver completo" SOLO para el paseo (el mapa no cabe digno acá).
function DetalleNodoHogar({ atencionId, onVerCompleto }: { atencionId: string; onVerCompleto: () => void }) {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const [detalle, setDetalle] = useState<DetalleAtencion | 'cargando' | 'error'>('cargando');

  useEffect(() => {
    let vigente = true;
    void leerDetalleAtencion(atencionId).then((r) => {
      if (vigente) setDetalle(r.ok ? r.data : 'error');
    });
    return () => {
      vigente = false;
    };
  }, [atencionId]);

  if (detalle === 'cargando') {
    return (
      <EsqueletoGrupo etiqueta={t('hogar.acordeonCargando')}>
        <View style={{ gap: spacing[2] }}>
          <Esqueleto forma="linea" ancho="80%" />
          <Esqueleto forma="linea" ancho="50%" />
        </View>
      </EsqueletoGrupo>
    );
  }
  if (detalle === 'error') {
    return (
      <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.status.dangerText }}>
        {t('hogar.acordeonError')}
      </Text>
    );
  }
  const sinNada = detalle.mensaje_familia === null && detalle.servicios_aplicados.length === 0;
  return (
    <View style={{ gap: spacing[2] }}>
      {detalle.mensaje_familia !== null ? (
        <Text
          style={{
            // voz humana: DM Sans 300 (regla de voz) — el cierre emocional
            fontFamily: typography.family.sans.light,
            fontSize: typography.size.md,
            lineHeight: Math.round(typography.size.md * typography.leading.snug),
            color: theme.text.primary,
          }}
        >
          “{detalle.mensaje_familia}”
        </Text>
      ) : null}
      {detalle.servicios_aplicados.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1.5] }}>
          {detalle.servicios_aplicados.map((sv) => (
            <Insignia key={sv.codigo} estado="info" tamaño="sm" etiqueta={idioma === 'en' ? sv.voz_en : sv.voz} />
          ))}
        </View>
      ) : null}
      {sinNada ? (
        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
          {t('hogar.acordeonSinDetalle')}
        </Text>
      ) : null}
      {detalle.oficio === 'paseo' ? (
        <View style={{ alignSelf: 'flex-start' }}>
          <Boton variante="compacto" etiqueta={t('hogar.acordeonVerCompleto')} onPress={onVerCompleto} />
        </View>
      ) : detalle.oficio === 'adiestramiento' && detalle.cita_id !== null ? (
        // S65: la sesión tiene SU parte — el acordeón invita a verlo
        // entero (progresión, clips, instrucciones), como el paseo.
        <View style={{ alignSelf: 'flex-start' }}>
          <Boton
            variante="compacto"
            etiqueta={t('hogar.acordeonVerCompleto')}
            onPress={() =>
              router.push({ pathname: '/adiestramiento/[citaId]', params: { citaId: detalle.cita_id as string } })
            }
          />
        </View>
      ) : null}
    </View>
  );
}

export default function Hogar() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  // D-401: pressed del destello del Coach (el único tocable artesanal del Hogar)
  const pressedCoach = usePresionado(0.97);

  const [mascotas, setMascotas] = useState<EstadoMascotas>('cargando');
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [estadoHogar, setEstadoHogar] = useState<EstadoHogar | null>(null);

  // Zona 4 — timeline del hogar: merge multi-mascota con cursor por mascota.
  // S61-A11: cada item porta SU mascota (el merge la etiqueta) — el
  // filtro por mascota y el avatar del chip la necesitan.
  const [items, setItems] = useState<ItemHogar[] | null | 'error'>(null);
  const [filtroMascotas, setFiltroMascotas] = useState<string[]>([]);
  const [filtroTipos, setFiltroTipos] = useState<string[]>([]);
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
  // S60-A6 (D-366, insumo de Kary): la posición por servicio para la
  // zona de SERVICIOS VIVOS — null mientras carga o si la lectura falló
  // (la zona calla, jamás pinta verosímil-falso — L-139).
  const [resumenServicios, setResumenServicios] = useState<ResumenServiciosHogar | null>(null);
  // QW1 (S53): el saludo lleva el nombre del miembro (profiles.nombre).
  const [nombrePerfil, setNombrePerfil] = useState<string | null>(null);
  // Zona 3 estrena habitante (S69): el presupuesto pendiente más próximo a vencer
  // manda (UNO, contextual — §15b). Memorial calla (apagado estructural).
  const [presupuestoZona, setPresupuestoZona] = useState<PresupuestoFamilia | null>(null);
  const [vacunaAbierta, setVacunaAbierta] = useState(false);
  const [vacuna, setVacuna] = useState<VacunaDeEvento | 'cargando' | 'error'>('cargando');
  const [carnetFirmado, setCarnetFirmado] = useState<string | null>(null);
  // S70-A5: solicitudes de autorización del mostrador pendientes (poll en foco;
  // el badge abre la Hoja SIN depender del push).
  const [solicitudesPend, setSolicitudesPend] = useState<SolicitudPendiente[]>([]);

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
    const todos: ItemHogar[] = [];
    const cursores: Record<string, string | null> = {};
    paginas.forEach((p, i) => {
      if (p.ok) {
        todos.push(...p.data.items.map((it) => ({ ...it, mascota_id: lista[i].id })));
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
    const nuevos: ItemHogar[] = [];
    resultados.forEach((r, i) => {
      if (r.ok) {
        nuevos.push(...r.data.items.map((it) => ({ ...it, mascota_id: pendientes[i][0] })));
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
        // S60-A6: la posición por servicio (fallo = zona callada, L-139)
        void obtenerResumenServiciosHogar().then((rs) => {
          if (vigente && rs.ok) setResumenServicios(rs.data);
        });
        void obtenerMiPerfil().then((p) => {
          // sin nombre: el saludo va solo — jamás un nombre inventado
          if (vigente && p.ok) setNombrePerfil(p.data.nombre);
        });
        // S70-A5: solicitudes pendientes del mostrador (poll; badge sin push)
        void obtenerSolicitudesPendientesDueno().then((s) => {
          if (vigente) setSolicitudesPend(s.ok ? s.data : []);
        });
        // Zona 3: el presupuesto vigente más próximo a vencer (lector ya ordenado).
        void obtenerPresupuestosFamilia().then((pr) => {
          if (!vigente) return;
          setPresupuestoZona(pr.ok ? (pr.data.find((x) => x.estadoEfectivo === 'enviado') ?? null) : null);
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
    // S70-A4: el nodo de consulta clínica lleva al PARTE del dueño.
    if (item.tipo === 'historia_clinica_registrada') {
      router.push({ pathname: '/parte/[eventoId]', params: { eventoId: item.evento_id } });
      return;
    }
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
  // S61-A11: proximaCita (el hero global) MURIÓ — la acción vive en la
  // ficha de cada mascota (proxima_cita_por_mascota); Ley 37 aplicada.
  const nombreDe = (id: string) => (Array.isArray(mascotas) ? (mascotas.find((m) => m.id === id)?.nombre ?? '') : '');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg.base }}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}
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
          {...pressedCoach.handlers}
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
          {/* D-401: el destello confirma el dedo (0.97, receta única) */}
          <Animated.View style={pressedCoach.estiloPresionado}>
            <Icono nombre="coach" tamano={24} registro="tinta" tinta={esMemorial ? theme.text.secondary : theme.text.onGradient} />
          </Animated.View>
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
      ) : null}
      {/* S61-A11 (nota de Kary): el hero de PRÓXIMA CITA murió — la
          acción migró a la FICHA de cada mascota (una acción por
          precedencia). El EN VIVO queda como único hero (Ley 7). */}

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
          // S61-A11 (letra firmada): UNA acción por ficha, la más
          // importante por PRECEDENCIA — en vivo > cita > alerta de
          // cuidado accionable > invitación de expediente > NADA
          // (Thor al día no gana CTA de relleno: silencio digno).
          const vivoDe = estadoHogar?.atenciones_en_curso.find((a) => a.mascota_id === m.id);
          // S61-A12: la acción viste su NATURALEZA (gate A11) — vivo =
          // pill §7.1 · ver cita = navegación (chevron, capa cuidado) ·
          // carnet = ACCIÓN tonal (flujo con consecuencias, Ley 22c).
          const accion: FichaMascotaHogarAccion | undefined = vivoDe
            ? {
                tipo: 'vivo',
                onPress: () =>
                  router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: vivoDe.atencion_id } }),
              }
            : pc
              ? {
                  tipo: 'navegacion',
                  capa: 'cuidado',
                  etiqueta: t('hogar.fichaVerCita'),
                  // D-430 (S67, regla de plataforma founder): contexto de
                  // mascota ⇒ el detalle de SU cita — jamás un hub (el
                  // multi-oficio destapó que TODO caía en "Mis paseos").
                  onPress: () =>
                    router.push({ pathname: '/citas/[mascotaId]', params: { mascotaId: m.id, nombre: m.nombre } }),
                }
              : voz?.semantica === 'pideAtencion'
                ? {
                    tipo: 'accion',
                    etiqueta: t('hogar.fichaVerCarnet'),
                    onPress: () => router.push({ pathname: '/carnet', params: { mascotaId: m.id, nombre: m.nombre } }),
                  }
                : senales && senales.vacunas_total === 0
                  ? {
                      tipo: 'accion',
                      etiqueta: t('hogar.fichaCargarCarnet'),
                      onPress: () => router.push({ pathname: '/carnet', params: { mascotaId: m.id, nombre: m.nombre } }),
                    }
                  : undefined;
          return (
            <FichaMascotaHogar
              key={m.id}
              nombre={m.nombre}
              fotoUrl={fotos[m.id]}
              voz={voz?.semantica ?? 'conociendolo'}
              textoEstado={voz?.texto ?? ''}
              proximaCitaMono={pc ? `${fechaCortaMono(pc.fecha, idioma)}${pc.hora ? ` · ${pc.hora}` : ''}` : undefined}
              accion={accion}
              onPress={() => router.push({ pathname: '/hogar/mascota/[mascotaId]', params: { mascotaId: m.id } })}
            />
          );
        })}
      </Animated.View>

      {/* ── TUS SERVICIOS (S60-A6, D-366 — el insumo rey de Kary): la
          posición por servicio, sin buscarla. Regla de existencia: la
          celda vive SOLO con actividad (próximos, saldo, plan, o
          historial ≤60 días) — cero actividad = cero celda (Explorar
          descubre, el Hogar anticipa). Lo VIVO manda sobre lo próximo
          (el hero queda arriba, intacto); UN dato por celda, jamás
          dos. "Mis paseos" MIGRÓ acá desde el grupo del carnet. ── */}
      {(() => {
        const rp = resumenServicios?.paseo;
        const re = resumenServicios?.estetica;
        const vozCuando = (fecha: string, hora: string): string => {
          const c = cuandoRelativo(fecha, hora, t);
          return 'relativo' in c ? c.relativo : `${fechaCortaMono(fecha, idioma)} · ${hora}`;
        };
        // paseo: próxima > saldo > plan (un dato, jamás dos)
        const hayPaseo = (rp !== undefined && (rp.proxima !== null || rp.salidas_saldo > 0)) || hayPlanes;
        const detallePaseo =
          rp?.proxima != null
            ? rp.proxima.mascota_nombre !== null
              ? t('hogar.proximoPaseoDe', { nombre: rp.proxima.mascota_nombre, cuando: vozCuando(rp.proxima.fecha, rp.proxima.hora) })
              : t('hogar.proximoPaseo', { cuando: vozCuando(rp.proxima.fecha, rp.proxima.hora) })
            : rp !== undefined && rp.salidas_saldo > 0
              ? rp.salidas_saldo === 1
                ? t('hogar.saldoUnaSalida')
                : t('hogar.saldoSalidas', { n: rp.salidas_saldo })
              : planActivo !== null && planActivo.dias_semana.length > 0
                ? t('hogar.planDias', { dias: planActivo.dias_semana.map((d) => nombreDia(d, idioma)).join(', ') })
                : undefined;
        // estética: próxima > historial reciente (ventana 60 días, ratificada)
        const cerradaReciente =
          re?.ultima_cerrada != null &&
          (Date.parse(new Intl.DateTimeFormat('en-CA').format(hoy)) - Date.parse(re.ultima_cerrada)) / 86400000 <= 60;
        const hayEstetica = re !== undefined && (re.proxima !== null || cerradaReciente);
        const detalleEstetica =
          re?.proxima != null
            ? re.proxima.mascota_nombre !== null
              ? t('hogar.proximaSesionDe', { nombre: re.proxima.mascota_nombre, cuando: vozCuando(re.proxima.fecha, re.proxima.hora) })
              : t('hogar.proximaSesion', { cuando: vozCuando(re.proxima.fecha, re.proxima.hora) })
            : re?.ultima_cerrada != null
              ? t('hogar.ultimaSesion', { fecha: fechaCortaMono(re.ultima_cerrada, idioma) })
              : undefined;
        if (!hayPaseo && !hayEstetica) return null;
        return (
          <Animated.View entering={entradaZona(2)} style={{ paddingHorizontal: spacing[4], marginTop: spacing[7], gap: spacing[3] }}>
            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {t('hogar.serviciosTitulo')}
            </Text>
            <Tarjeta relleno="ninguno" elevacion="reposo">
              {hayPaseo ? (
                <CeldaNavegacion
                  icono="paseo"
                  titulo={t('plan.hubTitulo')}
                  detalle={detallePaseo}
                  onPress={() => router.push('/hogar/paseos')}
                />
              ) : null}
              {hayPaseo && hayEstetica ? <Separador /> : null}
              {hayEstetica ? (
                <CeldaNavegacion
                  icono="grooming"
                  titulo={t('grooming.hubTitulo')}
                  detalle={detalleEstetica}
                  onPress={() => router.push('/hogar/grooming')}
                />
              ) : null}
            </Tarjeta>
          </Animated.View>
        );
      })()}

      {/* ── El GRUPO de celdas (patrón v2, Ley 19.1): entrar a una
          sección con subtítulo VIVO — dato real del expediente, jamás
          descripción estática. Hairline solo interno (Chanel); la
          superficie apoyada no lleva borde. "Agregar mascota" es
          ACCIÓN dentro del grupo (sin chevron). S60-A6: expediente
          PURO — "Mis paseos" migró a la zona de servicios. ── */}
      <Animated.View entering={entradaZona(3)} style={{ paddingHorizontal: spacing[4], marginTop: spacing[7] }}>
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
          {/* S60-A6: la celda del hub migró a TUS SERVICIOS (arriba) —
              este grupo queda expediente puro (D-338 sigue honrada: la
              regla de existencia de la zona incluye hayPlanes). */}
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

      {/* ── S70-A5: solicitud de autorización del mostrador (UNO, contextual;
           abre la Hoja sin depender del push). Memorial calla. ── */}
      {solicitudesPend.length > 0 && !esMemorial ? (
        <Animated.View
          entering={entradaZona(3)}
          style={{ paddingHorizontal: spacing[4], marginTop: spacing[7], gap: spacing[3] }}
        >
          <Tarjeta relleno="ninguno" elevacion="reposo">
            <CeldaNavegacion
              icono="veterinaria"
              titulo={
                solicitudesPend[0].tipo === 'alta_mascota'
                  ? t('autorizacion.tituloAlta', {
                      negocio: solicitudesPend[0].negocioNombre ?? '',
                      mascota: solicitudesPend[0].mascotaNombre ?? '',
                    })
                  : t('autorizacion.tituloAtencion', {
                      negocio: solicitudesPend[0].negocioNombre ?? '',
                      mascota: solicitudesPend[0].mascotaNombre ?? '',
                    })
              }
              detalle={t('autorizacion.revisar')}
              onPress={() =>
                router.push({
                  pathname: '/autorizacion/[solicitudId]',
                  params: { solicitudId: solicitudesPend[0].solicitudId },
                })
              }
            />
          </Tarjeta>
        </Animated.View>
      ) : null}

      {/* ── Zona 3 — en contexto: PRIMER habitante (S69). El presupuesto
           pendiente más próximo a vencer, UNO y contextual (§15b).
           Memorial calla (apagado estructural). ── */}
      {presupuestoZona !== null && !esMemorial ? (
        <Animated.View
          entering={entradaZona(3)}
          style={{ paddingHorizontal: spacing[4], marginTop: spacing[7], gap: spacing[3] }}
        >
          <Text
            style={{
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.lg,
              color: theme.text.primary,
            }}
          >
            {t('presupuesto.tituloPendiente')}
          </Text>
          <Tarjeta relleno="ninguno" elevacion="reposo">
            <CeldaNavegacion
              icono="veterinaria"
              titulo={t('presupuesto.zonaNarrativa', {
                mascota: presupuestoZona.mascotaNombre ?? '',
                fecha: fechaLargaHumana(presupuestoZona.venceEn.slice(0, 10), idioma),
              })}
              detalle={t('presupuesto.zonaAccion')}
              onPress={() =>
                router.push({
                  pathname: '/citas/[mascotaId]',
                  params: {
                    mascotaId: presupuestoZona.mascotaId,
                    nombre: presupuestoZona.mascotaNombre ?? '',
                  },
                })
              }
            />
          </Tarjeta>
        </Animated.View>
      ) : null}

      {/* ── Zona 4 — la vida ─────────────────────────────────────
          Ritmo S52-P2c: entre zonas spacing[7]; adentro spacing[4]. */}
      <Animated.View
        entering={entradaZona(4)}
        style={{ paddingHorizontal: spacing[4], marginTop: spacing[7] }}
      >
        {/* S61-A12 (cura 2): la vida gana su MARCO por sistema —
            Tarjeta reposo (elevación D-358, jamás borde artesanal);
            título y filtros ADENTRO; el acordeón expande en el marco.
            Memorial/dark heredan de Tarjeta (cero caso especial). */}
        <Tarjeta elevacion="reposo">
        <View style={{ gap: spacing[4] }}>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.sm,
            color: theme.text.secondary,
          }}
        >
          {t('hogar.vidaTitulo')}
        </Text>
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
          (() => {
            // S61-A11: filtros que NO persisten — vacío = todo pasa;
            // 'otros' (tipos sin familia) solo pasa sin filtro activo.
            const itemsFiltrados = items.filter(
              (it) =>
                (filtroMascotas.length === 0 || filtroMascotas.includes(it.mascota_id)) &&
                (filtroTipos.length === 0 || filtroTipos.includes(FAMILIA_DE_TIPO[it.tipo] ?? '')),
            );
            return (
              <View style={{ gap: spacing[3] }}>
                {mascotas.length > 1 ? (
                  <SelectorOpcion
                    multiple
                    acento="control"
                    disposicion="tira"
                    etiqueta={t('hogar.filtroQuien')}
                    opciones={mascotas.map((m) => ({
                      codigo: m.id,
                      etiqueta: m.nombre,
                      adorno: <AvatarMascota nombre={m.nombre} fotoUrl={fotos[m.id]} tamano="xs" />,
                    }))}
                    seleccionadas={filtroMascotas}
                    onSelect={(codigo) =>
                      setFiltroMascotas((f) => (f.includes(codigo) ? f.filter((x) => x !== codigo) : [...f, codigo]))
                    }
                  />
                ) : null}
                <SelectorOpcion
                  multiple
                  acento="control"
                  disposicion="tira"
                  etiqueta={t('hogar.filtroQue')}
                  opciones={[
                    { codigo: 'paseos', etiqueta: t('hogar.filtroPaseos') },
                    { codigo: 'estetica', etiqueta: t('hogar.filtroEstetica') },
                    { codigo: 'adiestramiento', etiqueta: t('hogar.filtroAdiestramiento') },
                    { codigo: 'vacunas', etiqueta: t('hogar.filtroVacunas') },
                  ]}
                  seleccionadas={filtroTipos}
                  onSelect={(codigo) =>
                    setFiltroTipos((f) => (f.includes(codigo) ? f.filter((x) => x !== codigo) : [...f, codigo]))
                  }
                />
                {itemsFiltrados.length === 0 ? (
                  // el camino está a la vista: los chips de arriba
                  <EstadoVacio registro="seccion" titulo={t('hogar.filtroSinMomentos')} />
                ) : (
                  <LineaDeVida
                    items={itemsFiltrados}
                    visiblesIniciales={3}
                    detalleDe={(item) =>
                      item.atencion_id ? (
                        <DetalleNodoHogar
                          atencionId={item.atencion_id}
                          onVerCompleto={() =>
                            router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: item.atencion_id as string } })
                          }
                        />
                      ) : null
                    }
                    onPressNodo={alTocarNodo}
                    estadoPie={estadoPie}
                    onCargarMas={() => void cargarMas()}
                  />
                )}
              </View>
            );
          })()
        )}
        </View>
        </Tarjeta>
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
