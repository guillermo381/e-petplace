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
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  CeldaNavegacion,
  CitaEnVivo,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
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
  obtenerBloqueosPrestador,
  obtenerCitasGroomingDelDia,
  obtenerCitasPaseoDelDia,
  obtenerMascotasAtendidas,
  obtenerMiPrestador,
  obtenerOfertasGroomingPropias,
  obtenerOfertasPaseoPropias,
  resolverUrlsFotos,
  type BloqueoPrestador,
  type CitaAgendaPaseo,
} from '@epetplace/api';
import { fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';

import { verificarSesion } from '@/lib/api';
import { TechoOficio, ToggleTecho, VeloBarraEstadoOficio } from '@/components/techo-oficio';
import { FiltroOficio, type FiltroOficioValor } from '@/components/filtro-oficio';
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
      /** ids de las citas de GROOMING (S60-B1) — deciden la RUTA del tap. */
      groomingIds: Set<string>;
      bloqueos: BloqueoPrestador[];
      atendidas: Set<string>;
      /** S61-B5: oficios con oferta ACTIVA — con ≥2 nace el filtro del
       *  día. Si el fetch de ofertas falla, el control no existe: es
       *  azúcar de vista, jamás esconde citas (las citas tienen su
       *  propio camino de error, Ley 13 intacta). */
      oficios: { paseo: boolean; grooming: boolean };
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

// Estado de cita → Insignia (compartido por FilaCita y FilaSalida —
// en_curso viste 'info'; CitaEnVivo porta el canal del vivo destacado;
// verdad firme: solo estados que la puerta única deja pasar).
function useInsigniasEstado(): Record<string, { estado: InsigniaEstado; etiqueta: string }> {
  const { t } = useTraduccion();
  return {
    en_curso: { estado: 'info', etiqueta: t('agenda.enCurso') },
    terminada: { estado: 'proximo', etiqueta: t('agenda.estadoPorCerrar') },
    cerrada_con_calidad: { estado: 'alDia', etiqueta: t('agenda.estadoCerrado') },
    confirmada: { estado: 'info', etiqueta: t('agenda.estadoConfirmada') },
    completada: { estado: 'alDia', etiqueta: t('agenda.estadoCompletada') },
    no_show: { estado: 'atencion', etiqueta: t('agenda.estadoNoShow') },
  };
}

// ═══════════ D-385 — LA SALIDA GRUPAL (S62) ═══════════
// La unidad de trabajo del paseador es la SALIDA, no la cita: N citas
// de paseo del MISMO bloque (fecha + hora + duración) se pintan como
// UNA fila con N mascotas, expandible a sus citas (acordeón inline,
// precedente Hogar S61-A11). El grooming JAMÁS agrupa (una silla, una
// mascota) y el EN VIVO del dueño no se toca — la agrupación es del
// lado oficio, solo vista.
type ItemJornada =
  | { tipo: 'cita'; cita: CitaAgendaPaseo }
  | { tipo: 'salida'; clave: string; citas: CitaAgendaPaseo[] };

function claveBloque(c: CitaAgendaPaseo): string | null {
  if (!c.fecha || !c.hora) return null;
  return `${c.fecha}|${c.hora}|${c.duracion_minutos ?? ''}`;
}

function agruparSalidas(citas: CitaAgendaPaseo[], groomingIds: Set<string>): ItemJornada[] {
  const items: ItemJornada[] = [];
  const porClave = new Map<string, { tipo: 'salida'; clave: string; citas: CitaAgendaPaseo[] }>();
  for (const c of citas) {
    const clave = groomingIds.has(c.id) ? null : claveBloque(c);
    if (clave === null) {
      items.push({ tipo: 'cita', cita: c });
      continue;
    }
    const grupo = porClave.get(clave);
    if (grupo) {
      grupo.citas.push(c);
    } else {
      const nuevo = { tipo: 'salida' as const, clave, citas: [c] };
      porClave.set(clave, nuevo);
      items.push(nuevo);
    }
  }
  // Un bloque de UNA cita no es salida: vuelve a fila simple.
  return items.map((i) => (i.tipo === 'salida' && i.citas.length === 1 ? { tipo: 'cita', cita: i.citas[0]! } : i));
}

function FilaCita({
  cita,
  enVivo,
  fotoUrl,
  esGrooming = false,
}: {
  cita: CitaAgendaPaseo;
  enVivo: boolean;
  fotoUrl?: string;
  /** S60-B1: la fila de grooming navega a SU flujo (Antes/Durante/Cierre). */
  esGrooming?: boolean;
}) {
  const router = useRouter();
  const { t } = useTraduccion();
  const insignias = useInsigniasEstado();
  const hora = cita.hora ? cita.hora.slice(0, 5) : '—';
  // S57-B1: la duración REAL de la cita (snapshot S55-B2), no el default
  // del catálogo — una de 120' se pintaba como 30'.
  const dur = cita.duracion_minutos;

  const ef = estadoEfectivo(cita);
  const insignia = enVivo ? undefined : ef ? insignias[ef] : undefined;

  return (
    <Celda
      interactiva
      onPress={() =>
        router.push(
          esGrooming
            ? { pathname: '/grooming/cita/[citaId]', params: { citaId: cita.id } }
            : { pathname: '/cita/[citaId]', params: { citaId: cita.id } },
        )
      }
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
      // S61-B12 (pulgar del mock B7): LA MARCA DE OFICIO por fila — el
      // ícono b′ en registro aa (tealDark paseo / ámbar AA estética),
      // junto a la Insignia de estado. Color funcional, jamás hex puro.
      fin={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }}>
          <Icono nombre={esGrooming ? 'grooming' : 'paseo'} registro="aa" tamano={21} />
          {insignia && <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" />}
        </View>
      }
    />
  );
}

// D-385: la fila de UNA salida — pila de caras + nombres + estado
// agregado; tap = expandir a sus citas (la pantalla es dueña del set
// de abiertas). Composición local con la casa: Celda + AvatarMascota.
function FilaSalida({
  citas,
  abierta,
  onToggle,
  urlsFotos,
}: {
  citas: CitaAgendaPaseo[];
  abierta: boolean;
  onToggle: () => void;
  urlsFotos: Map<string, string>;
}) {
  const { t } = useTraduccion();
  const insignias = useInsigniasEstado();
  const primera = citas[0]!;
  const hora = primera.hora ? primera.hora.slice(0, 5) : '—';
  const dur = primera.duracion_minutos;

  const nombres = citas.map((c) => c.mascota?.nombre ?? t('agenda.mascotaFallback'));
  const titulo =
    citas.length === 2
      ? t('agenda.salidaNombresDos', { a: nombres[0], b: nombres[1] })
      : t('agenda.salidaNombresVarios', { a: nombres[0], b: nombres[1], n: citas.length - 2 });

  // Estado agregado: si TODAS las citas coinciden, la salida lo dice;
  // estados mixtos se leen expandiendo (la fila no promedia — Ley 13).
  const efs = new Set(citas.map((c) => estadoEfectivo(c) ?? ''));
  const efComun = efs.size === 1 ? [...efs][0]! : null;
  const insignia = efComun ? insignias[efComun] : undefined;

  return (
    <View>
      <Celda
        interactiva
        onPress={onToggle}
        accessibilityRole="button"
        titulo={titulo}
        subtitulo={`${primera.tipo.nombre} · ${t('agenda.salidaDe', { n: citas.length })}`}
        inicio={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {citas.slice(0, 3).map((c, i) => (
              <View key={c.id} style={{ marginLeft: i === 0 ? 0 : -spacing[2] }}>
                <AvatarMascota
                  nombre={c.mascota?.nombre ?? t('agenda.mascotaFallback')}
                  fotoUrl={c.mascota?.foto_url ? urlsFotos.get(c.mascota.foto_url) : undefined}
                  especie={c.mascota && esEspecie(c.mascota.especie) ? c.mascota.especie : undefined}
                  tamano="xs"
                />
              </View>
            ))}
          </View>
        }
        metadataMono={`${hora}${dur ? ` · ${dur} min` : ''}`}
        fin={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }}>
            <Icono nombre="paseo" registro="aa" tamano={21} />
            {insignia && <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" />}
          </View>
        }
      />
      {abierta &&
        citas.map((c) => (
          <View key={c.id}>
            <Separador indentacion={spacing[3] + 40 + spacing[3]} />
            <FilaCita
              cita={c}
              enVivo={false}
              esGrooming={false}
              fotoUrl={c.mascota?.foto_url ? urlsFotos.get(c.mascota.foto_url) : undefined}
            />
          </View>
        ))}
    </View>
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
  // S61-B5: el filtro por oficio — vista del día, JAMÁS persiste.
  const [filtroOficio, setFiltroOficio] = useState<FiltroOficioValor>('todos');
  // D-385: salidas expandidas (por clave de bloque) — vista, jamás persiste.
  const [salidasAbiertas, setSalidasAbiertas] = useState<Set<string>>(new Set());
  const toggleSalida = (clave: string) =>
    setSalidasAbiertas((s) => {
      const n = new Set(s);
      if (n.has(clave)) n.delete(clave);
      else n.add(clave);
      return n;
    });
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
    const [r, rg, bloqueos, atendidas, ofPaseo, ofGrooming] = await Promise.all([
      obtenerCitasPaseoDelDia({ prestador_id: prestador.data.id, fecha: desde, fecha_hasta: sumarDias(desde, 6) }),
      // S60-B1: la jornada es UNA — las citas de grooming entran a la
      // misma lista con su tipo (el subtítulo ya lo dice) y su ruta.
      obtenerCitasGroomingDelDia({ prestador_id: prestador.data.id, fecha: desde, fecha_hasta: sumarDias(desde, 6) }),
      // vacaciones (solo lectura): los días bloqueados se pintan como tales
      obtenerBloqueosPrestador(prestador.data.id),
      // la señal "Primera vez" de la Zona 1 (solo lo REAL): mascota
      // sin ninguna atención cerrada con este prestador
      obtenerMascotasAtendidas(prestador.data.id),
      // S61-B5: la condición del filtro por oficio — los wrappers de
      // ofertas EXISTENTES (cero query nueva)
      obtenerOfertasPaseoPropias(prestador.data.id),
      obtenerOfertasGroomingPropias(prestador.data.id),
    ]);
    if (!r.ok) {
      setPantalla({ estado: 'error', mensaje: r.mensaje });
      return;
    }
    // El grooming es promesa de la MISMA jornada — su error tampoco se
    // disfraza de "sin citas" (Ley 13).
    if (!rg.ok) {
      setPantalla({ estado: 'error', mensaje: rg.mensaje });
      return;
    }
    // La marca de bloqueo es PROMESA de la vista semana (jamás se cae en
    // silencio — Ley 13: un error no se disfraza de "sin vacaciones").
    if (!bloqueos.ok) {
      setPantalla({ estado: 'error', mensaje: bloqueos.mensaje });
      return;
    }
    // Merge por fecha+hora: una sola línea de tiempo de trabajo.
    const citas = [...r.data, ...rg.data].sort((a, b) => {
      const fa = a.fecha ?? '';
      const fb = b.fecha ?? '';
      return fa === fb ? (a.hora ?? '').localeCompare(b.hora ?? '') : fa.localeCompare(fb);
    });
    const paths = citas
      .map((c) => c.mascota?.foto_url)
      .filter((p): p is string => typeof p === 'string' && p.length > 0);
    if (paths.length > 0) setUrlsFotos(await resolverUrlsFotos(paths));
    setPantalla({
      estado: 'listo',
      desde,
      citas,
      groomingIds: new Set(rg.data.map((c) => c.id)),
      bloqueos: bloqueos.data,
      atendidas: new Set(atendidas.ok ? atendidas.data.map((m) => m.mascota_id) : []),
      oficios: {
        paseo: ofPaseo.ok && ofPaseo.data.some((o) => o.activo),
        grooming: ofGrooming.ok && ofGrooming.data.some((o) => o.activo),
      },
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
  const groomingIds = pantalla.estado === 'listo' ? pantalla.groomingIds : new Set<string>();
  // S61-B5: con DOS oficios activos nace el filtro; con uno, el control
  // no existe (cero UI muerta) y la lista es la de siempre.
  const dosOficios = pantalla.estado === 'listo' && pantalla.oficios.paseo && pantalla.oficios.grooming;
  const citasVisibles =
    !dosOficios || filtroOficio === 'todos'
      ? citas
      : citas.filter((c) => groomingIds.has(c.id) === (filtroOficio === 'grooming'));
  const citasHoy = desde === null ? [] : citasVisibles.filter((c) => c.fecha === desde);
  // S61-B12: el día SIN filtrar — la Zona 1 es INMUNE al filtro por
  // GUARD ESTRUCTURAL (se computa de acá, jamás de la lista filtrada)
  const citasHoySin = desde === null ? [] : citas.filter((c) => c.fecha === desde);
  // el vacío FILTRADO se dice distinto: hay jornada, no de este servicio
  const hoyVacioPorFiltro =
    citasHoy.length === 0 && dosOficios && filtroOficio !== 'todos' && citasHoySin.length > 0;

  // ── Zona 1: la destacada — en_curso (Ley 7: UNA con CitaEnVivo) o,
  // si no hay nada corriendo, la PRÓXIMA cita aún no cerrada del día.
  // S61-B12: sobre el día SIN FILTRAR — el vivo preside SIEMPRE.
  const enCurso = citasHoySin.filter((c) => c.atencion?.estado === 'en_curso');
  const enVivo = enCurso.length
    ? enCurso.reduce((a, b) => ((b.atencion?.iniciada_en ?? '') > (a.atencion?.iniciada_en ?? '') ? b : a))
    : undefined;
  const proxima =
    enVivo === undefined
      ? citasHoySin.find((c) => {
          const ef = estadoEfectivo(c);
          return ef === 'confirmada' || ef === 'terminada';
        })
      : undefined;
  const destacada = enVivo ?? proxima;
  // D-385: la SALIDA de la destacada preside ENTERA — las compañeras de
  // bloque (paseo, misma fecha+hora+duración) suben con ella a la Zona 1
  // (sobre el día SIN filtrar: el guard estructural cubre a la salida).
  const claveDestacada =
    destacada && !groomingIds.has(destacada.id) ? claveBloque(destacada) : null;
  const salidaDestacada =
    destacada === undefined
      ? []
      : claveDestacada === null
        ? [destacada]
        : [
            destacada,
            ...citasHoySin.filter(
              (c) => c.id !== destacada.id && !groomingIds.has(c.id) && claveBloque(c) === claveDestacada,
            ),
          ];
  const idsDestacados = new Set(salidaDestacada.map((c) => c.id));
  const resto = citasHoy.filter((c) => !idsDestacados.has(c.id));
  // D-385: el resto de la jornada se agrupa por salida (solo paseo; el
  // grooming es una silla, una mascota — jamás agrupa).
  const restoItems = agruparSalidas(resto, groomingIds);

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
            citas: citasVisibles.filter((c) => c.fecha === iso),
          };
        });

  const esPrimera = (mascotaId: string) =>
    pantalla.estado === 'listo' && !pantalla.atendidas.has(mascotaId);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing[10] }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
      >
        {/* §15b.2 S61 (re-firma B11/B12): EL TECHO DEL OFICIO — muro
            tealDark, texto papel pleno, y el toggle Hoy/Semana COMPACTO
            integrado (el segmentado gemelo apilado MURIÓ). */}
        <TechoOficio
          titulo={t('agenda.saludo')}
          dato={fechaDiaSemanaHumana(hoyLocal(), idioma as IdiomaSoportado)}
          pie={
            pantalla.estado === 'listo' ? (
              <ToggleTecho
                etiqueta={t('agenda.vistaEtiqueta')}
                opciones={[
                  { codigo: 'hoy' as const, etiqueta: t('agenda.vistaHoy') },
                  { codigo: 'semana' as const, etiqueta: t('agenda.vistaSemana') },
                ]}
                activo={vista}
                onCambio={setVista}
              />
            ) : undefined
          }
        />

        <View style={{ padding: spacing[4], gap: spacing[4] }}>

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

        {/* ── Zona 1 — ahora / lo siguiente (PRESIDE: encima de todo
            control e INMUNE al filtro — guard estructural S61-B12) ── */}
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
            {/* S59-B2 (Ley 19.1): el "Antes" a un tap es NAVEGACIÓN al
                expediente — viste CeldaNavegacion DENTRO de la tarjeta del
                hero (el botón ghost de solo texto murió: no decía que se
                toca ni a dónde va). Ícono 'carnet' = el expediente; la
                señal "Primera vez" (solo si es REAL) vive en el detalle. */}
            {(() => {
              // D-385: la SALIDA entera preside — cada cita su fila (el
              // vivo real marca la suya), y el "Antes" POR MASCOTA (el
              // paseador va a salir con TODAS: cada expediente a un tap).
              const filas = salidaDestacada.map((c, i) => (
                <View key={c.id}>
                  {i > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
                  <FilaCita
                    cita={c}
                    enVivo={enVivo?.id === c.id}
                    esGrooming={groomingIds.has(c.id)}
                    fotoUrl={c.mascota?.foto_url ? urlsFotos.get(c.mascota.foto_url) : undefined}
                  />
                </View>
              ));
              const mascotas = [
                ...new Map(
                  salidaDestacada
                    .map((c) => c.mascota)
                    .filter((m): m is NonNullable<typeof m> => m != null)
                    .map((m) => [m.id, m] as const),
                ).values(),
              ];
              const conocer = mascotas.map((mascota) => (
                <View key={mascota.id}>
                  <Separador />
                  <CeldaNavegacion
                    icono="carnet"
                    registro="aa"
                    titulo={t('agenda.conocerMascota', { nombre: mascota.nombre })}
                    detalle={esPrimera(mascota.id) ? t('agenda.primeraVez') : undefined}
                    onPress={() =>
                      router.push({ pathname: '/mascota/[mascotaId]', params: { mascotaId: mascota.id } })
                    }
                  />
                </View>
              ));
              const cuerpo = (
                <Tarjeta elevacion={enVivo ? 'plana' : 'sm'} relleno="ninguno">
                  {filas}
                  {conocer}
                </Tarjeta>
              );
              return enVivo ? <CitaEnVivo capa="cuidado">{cuerpo}</CitaEnVivo> : cuerpo;
            })()}
          </View>
        )}

        {/* S61-B12: el filtro por oficio RE-VESTIDO (íconos b′, huella
            AA en el activo) — DEBAJO de la Zona 1, solo con 2 oficios */}
        {pantalla.estado === 'listo' && dosOficios && (
          <FiltroOficio activo={filtroOficio} onCambio={setFiltroOficio} />
        )}

        {pantalla.estado === 'listo' && vista === 'hoy' && citasHoy.length === 0 && (
          // S52-P7b: registro sereno — el día vacío se dice en el
          // flujo, sin display que grite (dosis baja). S61-B5: el vacío
          // POR FILTRO dice su verdad (hay jornada, no de este servicio).
          hoyVacioPorFiltro ? (
            <EstadoVacio registro="seccion" titulo={t('agenda.filtroVacio')} />
          ) : citasHoySin.length === 0 ? (
            <EstadoVacio registro="seccion" titulo={t('agenda.vacio')} descripcion={t('agenda.vacioDetalle')} />
          ) : null
        )}

        {/* ── Zona 2 — el día (compacta; D-385: agrupada por salida) ── */}
        {pantalla.estado === 'listo' && vista === 'hoy' && restoItems.length > 0 && (
          <Tarjeta elevacion="sm" relleno="ninguno">
            {restoItems.map((item, i) => (
              <View key={item.tipo === 'cita' ? item.cita.id : item.clave}>
                {i > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
                {item.tipo === 'cita' ? (
                  <FilaCita cita={item.cita} enVivo={false} esGrooming={groomingIds.has(item.cita.id)} fotoUrl={item.cita.mascota?.foto_url ? urlsFotos.get(item.cita.mascota.foto_url) : undefined} />
                ) : (
                  <FilaSalida
                    citas={item.citas}
                    abierta={salidasAbiertas.has(item.clave)}
                    onToggle={() => toggleSalida(item.clave)}
                    urlsFotos={urlsFotos}
                  />
                )}
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
                    {agruparSalidas(dia.citas, groomingIds).map((item, i) => (
                      <View key={item.tipo === 'cita' ? item.cita.id : item.clave}>
                        {i > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
                        {item.tipo === 'cita' ? (
                          <FilaCita cita={item.cita} enVivo={false} esGrooming={groomingIds.has(item.cita.id)} fotoUrl={item.cita.mascota?.foto_url ? urlsFotos.get(item.cita.mascota.foto_url) : undefined} />
                        ) : (
                          <FilaSalida
                            citas={item.citas}
                            abierta={salidasAbiertas.has(item.clave)}
                            onToggle={() => toggleSalida(item.clave)}
                            urlsFotos={urlsFotos}
                          />
                        )}
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
        </View>
      </ScrollView>
      {/* S59-B1: el velo de tinta — la zona de la barra de estado JAMÁS
          queda blanca, ni cuando el techo scrollea (regla del pedido). */}
      <VeloBarraEstadoOficio />
    </View>
  );
}
