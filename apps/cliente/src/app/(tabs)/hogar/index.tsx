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
  PieRevelar,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
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
  obtenerCitasActivasMascota,
  obtenerPresupuestosFamilia,
  type PresupuestoFamilia,
  mascotasElegibles,
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

// S71-A3: cuandoRelativo y nombreDia MURIERON con las frases largas de
// la zona de servicios (el rail habla en fecha corta mono — regla E4);
// sus keys (enMinutos/enHoras/planDias…) murieron con ellos (Ley 37).


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
  // S73 ítem 1: con mínimo-4 el fallo del resumen NO puede callar (antes
  // era "zona callada") — pintaría cuatro «Descubre» falsos (L-139).
  const [resumenError, setResumenError] = useState(false);
  // QW1 (S53): el saludo lleva el nombre del miembro (profiles.nombre).
  const [nombrePerfil, setNombrePerfil] = useState<string | null>(null);
  // S71-A3 — PONTE AL DÍA (F2): los habitantes de la sección que preside.
  // El presupuesto deja de ser "UNO contextual de Zona 3" (S69) y las
  // solicitudes dejan de ser un bloque suelto (S70-A5): la sección es la
  // CASA que esos dos huérfanos nunca tuvieron (diagnóstico del boceto).
  const [presupuestosPend, setPresupuestosPend] = useState<PresupuestoFamilia[]>([]);
  // E3 (vara de B): v1 = N llamadas por mascota (93% de familias tienen 1);
  // el lector family-level es deuda declarada con disparo en familias 3+.
  const [porCoordinar, setPorCoordinar] = useState<
    { mascotaId: string; mascotaNombre: string; citaId: string; negocio: string | null }[]
  >([]);
  const [ponteRevelado, setPonteRevelado] = useState(false);
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
        // S60-A6 → S73: la posición por servicio; el fallo gana banda
        // con reintento (el mínimo-4 no puede degradar a «Descubre»).
        setResumenError(false);
        void obtenerResumenServiciosHogar().then((rs) => {
          if (!vigente) return;
          if (rs.ok) setResumenServicios(rs.data);
          else setResumenError(true);
        });
        void obtenerMiPerfil().then((p) => {
          // sin nombre: el saludo va solo — jamás un nombre inventado
          if (vigente && p.ok) setNombrePerfil(p.data.nombre);
        });
        // S70-A5: solicitudes pendientes del mostrador (poll; badge sin push)
        void obtenerSolicitudesPendientesDueno().then((s) => {
          if (vigente) setSolicitudesPend(s.ok ? s.data : []);
        });
        // PONTE AL DÍA: presupuestos vigentes (E7: SOLO 'enviado' — el
        // vencido perezoso jamás pide acción; lector ya ordenado venceEn ASC).
        void obtenerPresupuestosFamilia().then((pr) => {
          if (!vigente) return;
          setPresupuestosPend(pr.ok ? pr.data.filter((x) => x.estadoEfectivo === 'enviado') : []);
        });
        // PONTE AL DÍA: citas aprobadas que esperan fecha (E3: N llamadas
        // por mascota — v1 honesto; el fallo de una no calla a las demás).
        void Promise.all(
          lista.map(async (m) => {
            const rc = await obtenerCitasActivasMascota(m.id);
            if (!rc.ok) return [];
            return rc.data
              .filter((c) => c.estado === 'por_coordinar')
              .map((c) => ({ mascotaId: m.id, mascotaNombre: m.nombre, citaId: c.cita_id, negocio: c.negocio_nombre }));
          }),
        ).then((arr) => {
          if (vigente) setPorCoordinar(arr.flat());
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

      {/* ── PONTE AL DÍA (S71-A3, F2 letra founder): lo que el sistema
          necesita de vos, PRESIDIENDO. La casa de los dos huérfanos
          (autorización S70-A5 + presupuesto S69) más la superficie nueva
          (cita por coordinar). Regla de existencia: hogar al día = la
          sección NO EXISTE — esa desaparición ES la firma de la pantalla
          (Ley 15). Memorial: no se monta (a un memorial no se le pide
          acción). Orden: lo perecedero primero (E2 — la RPC ya ordena
          expira_en ASC; el lector de presupuestos, venceEn ASC). Capas
          E8: autorización=cuidado · presupuesto y cita=salud (tinte
          'vida'). UNA acción por tarjeta (precedente CURA-1: la decisión
          se toma en su superficie, con el contexto delante). ── */}
      {(() => {
        if (esMemorial) return null;
        type Habitante = {
          key: string;
          tinte: 'cuidado' | 'vida';
          titulo: string;
          detalle: string | null;
          cta: string;
          onPress: () => void;
        };
        const ahora = Date.now();
        const habitantes: Habitante[] = [
          ...solicitudesPend.map((s): Habitante => {
            const min = Math.max(1, Math.round((Date.parse(s.expiraEn) - ahora) / 60000));
            return {
              key: `sol-${s.solicitudId}`,
              tinte: 'cuidado',
              titulo:
                s.tipo === 'alta_mascota'
                  ? t('autorizacion.tituloAlta', { negocio: s.negocioNombre ?? '', mascota: s.mascotaNombre ?? '' })
                  : t('autorizacion.tituloAtencion', { negocio: s.negocioNombre ?? '', mascota: s.mascotaNombre ?? '' }),
              detalle: t('hogar.venceEnMin', { n: min }),
              cta: t('hogar.verYDecidir'),
              onPress: () =>
                router.push({ pathname: '/autorizacion/[solicitudId]', params: { solicitudId: s.solicitudId } }),
            };
          }),
          ...presupuestosPend.map(
            (p): Habitante => ({
              key: `pre-${p.id}`,
              tinte: 'vida',
              // D-455 (motor S71): el negocio se nombra; sin nombre, la
              // forma honesta — jamás inventar quién.
              titulo:
                p.negocioNombre !== null
                  ? t('hogar.presupuestoDe', { negocio: p.negocioNombre })
                  : t('hogar.presupuestoPara', { mascota: p.mascotaNombre ?? '' }),
              detalle: t('hogar.presupuestoDetalle', {
                total: p.total,
                mascota: p.mascotaNombre ?? '',
                fecha: fechaLargaHumana(p.venceEn.slice(0, 10), idioma),
              }),
              cta: t('hogar.verlo'),
              onPress: () =>
                router.push({
                  pathname: '/citas/[mascotaId]',
                  params: { mascotaId: p.mascotaId, nombre: p.mascotaNombre ?? '' },
                }),
            }),
          ),
          ...porCoordinar.map(
            (c): Habitante => ({
              key: `coord-${c.citaId}`,
              tinte: 'vida',
              titulo: t('hogar.porCoordinarTitulo', { mascota: c.mascotaNombre }),
              detalle:
                c.negocio !== null
                  ? t('citasMascota.coordinaraNegocio', { negocio: c.negocio })
                  : t('citasMascota.coordinaranSinNombre'),
              cta: t('hogar.verLaCita'),
              onPress: () =>
                router.push({
                  pathname: '/citas/[mascotaId]',
                  params: { mascotaId: c.mascotaId, nombre: c.mascotaNombre, citaId: c.citaId },
                }),
            }),
          ),
        ];
        if (habitantes.length === 0) return null;
        const visibles = ponteRevelado ? habitantes : habitantes.slice(0, 3);
        return (
          <Animated.View
            entering={entradaZona(1)}
            style={{ paddingHorizontal: spacing[4], paddingTop: spacing[5], gap: spacing[3] }}
          >
            <Texto variante="seccion">{t('hogar.ponteAlDia')}</Texto>
            {visibles.map((h) => (
              <Tarjeta key={h.key} tinte={h.tinte} elevacion="reposo">
                <View style={{ gap: spacing[2] }}>
                  <Texto variante="cuerpo">{h.titulo}</Texto>
                  {h.detalle !== null ? <Texto variante="apoyo">{h.detalle}</Texto> : null}
                  <View style={{ alignItems: 'flex-start', marginTop: spacing[1] }}>
                    <Boton variante="compacto" tamaño="sm" etiqueta={h.cta} onPress={h.onPress} />
                  </View>
                </View>
              </Tarjeta>
            ))}
            <PieRevelar
              n={habitantes.length - 3}
              revelado={ponteRevelado}
              onPress={() => setPonteRevelado((v) => !v)}
            />
          </Animated.View>
        );
      })()}

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

      {/* ── TUS SERVICIOS (S60-A6 → S73 ítem 1, letra founder): MÍNIMO 4
          por prioridad de uso + «Descubre» — la regla de existencia S60
          ("cero actividad = cero celda") queda REEMPLAZADA para los
          cuatro oficios (D-462 camino a: el rail dice la verdad
          completa). Copy corto E4 intacto: UN número o UNA fecha; lo que
          no tiene esa forma va SIN dato. Orden = prioridad de uso
          computable (regla simple v1, voto de mesa: próxima > actividad
          reciente > «Descubre» en orden canónico de apertura). ── */}
      {(() => {
        const listaMascotas = Array.isArray(mascotas) ? mascotas : [];
        // Memorial cede el mínimo (letra de elegibilidad §5): sin mascota
        // elegible para NADA, los «Descubre» no se montan. Borde declarado
        // (vara S73-B): estado_vida null y 'perdida' también suprimen —
        // la frontera falla cerrada, y a un hogar con mascota perdida
        // tampoco se le hace marketing.
        const hayElegibles = mascotasElegibles(listaMascotas, null).length > 0;
        const hoyIso = new Intl.DateTimeFormat('en-CA').format(hoy);
        const esReciente = (f: string | null) =>
          f !== null && (Date.parse(hoyIso) - Date.parse(f)) / 86400000 <= 60;

        if (resumenError) {
          return (
            <Animated.View entering={entradaZona(2)} style={{ paddingHorizontal: spacing[4], marginTop: spacing[7], gap: spacing[3] }}>
              <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
                {t('hogar.serviciosTitulo')}
              </Text>
              <EstadoVacio
                registro="seccion"
                titulo={t('hogar.railError')}
                accion={
                  <Boton
                    variante="secundario"
                    tamaño="sm"
                    etiqueta={t('hogar.reintentar')}
                    onPress={() => {
                      setResumenError(false);
                      setResumenServicios(null);
                      void obtenerResumenServiciosHogar().then((rs) => {
                        if (rs.ok) setResumenServicios(rs.data);
                        else setResumenError(true);
                      });
                    }}
                  />
                }
              />
            </Animated.View>
          );
        }
        if (resumenServicios === null) {
          // cargando: el rail espera entero (Ley 13, estático) — no
          // aparece "de a cuadrados" ni miente «Descubre» a medias.
          return (
            <Animated.View entering={entradaZona(2)} style={{ paddingHorizontal: spacing[4], marginTop: spacing[7], gap: spacing[3] }}>
              <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
                {t('hogar.serviciosTitulo')}
              </Text>
              <EsqueletoGrupo>
                <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                  <Esqueleto forma="bloque" ancho={112} alto={92} />
                  <Esqueleto forma="bloque" ancho={112} alto={92} />
                  <Esqueleto forma="bloque" ancho={112} alto={92} />
                </View>
              </EsqueletoGrupo>
            </Animated.View>
          );
        }

        const rp = resumenServicios.paseo;
        const re = resumenServicios.estetica;
        const ra = resumenServicios.adiestramiento;
        const rv = resumenServicios.veterinaria;

        const datoPaseo =
          rp.proxima !== null
            ? fechaCortaMono(rp.proxima.fecha, idioma)
            : rp.salidas_saldo > 0
              ? rp.salidas_saldo === 1
                ? t('hogar.railSaldoUna')
                : t('hogar.railSaldo', { n: rp.salidas_saldo })
              : null; // plan-solo: los días no caben en la forma — sin dato

        type Cuadrado = {
          key: string;
          icono: 'paseo' | 'grooming' | 'training' | 'veterinaria';
          nombre: string;
          dato: string | null;
          actividad: boolean;
          /** grupo 1: ordena por la fecha de la próxima. */
          fechaProxima: string | null;
          /** grupo 2: ordena por recencia (saldo/plan/por-coordinar
           *  vigentes cuentan como HOY — actividad sin fecha). */
          recencia: string | null;
          onPress: () => void;
        };

        // el orden del array ES el canónico de apertura (grupo 3)
        const base: Cuadrado[] = [
          {
            key: 'paseo',
            icono: 'paseo',
            nombre: t('hogar.railPaseos'),
            dato: datoPaseo,
            actividad: rp.proxima !== null || rp.salidas_saldo > 0 || hayPlanes,
            fechaProxima: rp.proxima?.fecha ?? null,
            recencia: rp.salidas_saldo > 0 || hayPlanes ? hoyIso : null,
            onPress: () => router.push('/hogar/paseos'),
          },
          {
            key: 'estetica',
            icono: 'grooming',
            nombre: t('hogar.railEstetica'),
            dato:
              re.proxima !== null
                ? fechaCortaMono(re.proxima.fecha, idioma)
                : esReciente(re.ultima_cerrada) && re.ultima_cerrada !== null
                  ? fechaCortaMono(re.ultima_cerrada, idioma)
                  : null,
            actividad: re.proxima !== null || esReciente(re.ultima_cerrada),
            fechaProxima: re.proxima?.fecha ?? null,
            recencia: re.ultima_cerrada,
            onPress: () => router.push('/hogar/grooming'),
          },
          {
            key: 'adiestramiento',
            icono: 'training',
            nombre: t('hogar.railAdiestramiento'),
            dato:
              ra.proxima !== null
                ? fechaCortaMono(ra.proxima.fecha, idioma)
                : esReciente(ra.ultima_cerrada) && ra.ultima_cerrada !== null
                  ? fechaCortaMono(ra.ultima_cerrada, idioma)
                  : null,
            actividad: ra.proxima !== null || esReciente(ra.ultima_cerrada),
            fechaProxima: ra.proxima?.fecha ?? null,
            recencia: ra.ultima_cerrada,
            onPress: () => router.push('/hogar/adiestramiento'),
          },
          {
            key: 'veterinaria',
            icono: 'veterinaria',
            nombre: t('hogar.railVet'),
            // por-coordinar no tiene forma E4 (sin fecha) → sin dato
            dato:
              rv.proxima !== null
                ? fechaCortaMono(rv.proxima.fecha, idioma)
                : esReciente(rv.ultima_cerrada) && rv.ultima_cerrada !== null
                  ? fechaCortaMono(rv.ultima_cerrada, idioma)
                  : null,
            actividad: rv.proxima !== null || rv.por_coordinar || esReciente(rv.ultima_cerrada),
            fechaProxima: rv.proxima?.fecha ?? null,
            recencia: rv.por_coordinar ? hoyIso : rv.ultima_cerrada,
            onPress: () => {
              // destino v1 (D-493, hueco del hub vet declarado): la
              // mascota de la próxima/por-coordinar/última cita vet.
              const destinoId = rv.mascota_id_destino;
              const nombre = listaMascotas.find((m) => m.id === destinoId)?.nombre ?? '';
              if (destinoId !== null) {
                router.push({ pathname: '/citas/[mascotaId]', params: { mascotaId: destinoId, nombre } });
              } else {
                router.push('/explorar/veterinaria');
              }
            },
          },
        ];

        // comparadores con CERO en igualdad: el sort estable conserva el
        // orden canónico del array base cuando las fechas empatan
        const grupo1 = base
          .filter((c) => c.actividad && c.fechaProxima !== null)
          .sort((a, b) =>
            (a.fechaProxima as string) < (b.fechaProxima as string) ? -1 : (a.fechaProxima as string) > (b.fechaProxima as string) ? 1 : 0,
          );
        const grupo2 = base
          .filter((c) => c.actividad && c.fechaProxima === null)
          .sort((a, b) => ((a.recencia ?? '0000') > (b.recencia ?? '0000') ? -1 : (a.recencia ?? '0000') < (b.recencia ?? '0000') ? 1 : 0));
        const descubre = hayElegibles ? base.filter((c) => !c.actividad) : [];
        const cuadrados = [...grupo1, ...grupo2, ...descubre];
        if (cuadrados.length === 0) return null; // hogar sin elegibles y sin historia

        return (
          <Animated.View entering={entradaZona(2)} style={{ marginTop: spacing[7], gap: spacing[3] }}>
            <Text style={{ paddingHorizontal: spacing[4], fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {t('hogar.serviciosTitulo')}
            </Text>
            {/* el rail sangra edge-to-edge; el aire de cola va en el
                contentContainer (un rail cortado en seco parece bug) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[3] }}
            >
              {cuadrados.map((c) => (
                <Tarjeta
                  key={c.key}
                  interactiva
                  elevacion="reposo"
                  accessibilityRole="button"
                  etiqueta={c.nombre}
                  onPress={c.onPress}
                >
                  <View style={{ width: 96, gap: spacing[2] }}>
                    <Icono nombre={c.icono} tamano={24} />
                    <Texto variante="apoyo" color="primary" numberOfLines={1}>
                      {c.nombre}
                    </Texto>
                    {c.actividad && c.dato !== null ? (
                      <Texto variante="dato" numberOfLines={1}>
                        {c.dato}
                      </Texto>
                    ) : !c.actividad ? (
                      // la invitación es voz humana, no dato de máquina
                      // (Ley 3: sans, no mono)
                      <Texto variante="apoyo" numberOfLines={1}>
                        {t('hogar.railDescubre')}
                      </Texto>
                    ) : null}
                  </View>
                </Tarjeta>
              ))}
            </ScrollView>
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
          {/* S71-A3 (F2, letra founder): la celda del CARNET se MUDÓ
              adentro de la vista de la mascota — el aporte del carnet es
              por mascota, no del hogar (la sección Salud de
              mascota/[mascotaId] ya era su casa: estado vacío con CTA +
              entrada de agregar). El detalle VIVO del refuerzo más
              próximo muere con la celda; su heredero natural es el
              habitante 5 de "Ponte al día" cuando fecha_proxima tenga
              datos (hoy 1/24 — deuda E5 declarada). La ficha con
              pideAtencion sigue cubriendo la urgencia por mascota. */}
          <CeldaNavegacion
            icono="refugio"
            titulo={t('hogar.agregarMascotaCelda')}
            detalle={t('agregarMascota.entradaDetalle')}
            chevron={false}
            onPress={() => router.push('/hogar/agregar')}
          />
        </Tarjeta>
      </Animated.View>

      {/* S71-A3: los dos bloques huérfanos (solicitud S70-A5 · presupuesto
          S69) MURIERON ABSORBIDOS por PONTE AL DÍA — el diagnóstico de la
          planitud era exactamente que exigían acción sin sección donde
          vivir. Ley 37: el código murió con ellos. */}

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

      {/* S71-A3: el selector "¿De quién es el carnet?" murió con la celda
          del carnet — el flujo ahora nace DENTRO de cada mascota, donde
          la pregunta no existe (Ley 37). */}

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
