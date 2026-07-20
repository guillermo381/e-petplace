// ─────────────────────────────────────────────────────────────────────
// EL TALLER DEL ADIESTRADOR — /adiestramiento/taller (S63-B). Dosis
// baja (§15b: acento de oficio, CTA en tinta).
//
// TESIS: tu oferta de adiestramiento se publica solo COMPLETA — y
// completa incluye con quién trabajas.
// FIRMA: el paso de especies BLOQUEANTE con su porqué visible — la
// oferta fantasma (especies '[]', hallazgo del gate Bloque 2) es
// IMPOSIBLE desde esta pantalla. Comportamiento, no color.
//
// DECISIÓN DOCUMENTADA (pedido founder — sugerido vs limpio): el acote
// de especies se pide LIMPIO POR OFICIO, sin heredar del grooming:
//   (a) el techo de adiestramiento es ["perro"] (§2) — heredar el
//       acote de un groomer (perro+gato) daría un valor fuera del techo;
//   (b) el acote es una declaración de COMPETENCIA por oficio — heredar
//       en silencio reintroduce el default que este pedido mata;
//   (c) con una sola especie elegible hoy, declarar cuesta UN toque.
//
// Programas: UI sobre el motor de la A (20260715180000, RLS pp_own) —
// CHECKs espejados en el form (2-30 sesiones, vigencia >= (N-1) semanas,
// duración en pasos de 15'); el rango por nivel es AYUDA (§12.4), no
// límite. Modalidades: diferido a S64-B0 (default único del chasis).
//
// S65-B2 P2 (hallazgo founder del recorrido, letra §1/§4/§12.4): la
// escalera troncal son TRES TARJETAS FIJAS (Básico/Medio/Experto) con
// toggle de activación — activa = se editan N (default sugerido del
// nivel, sin guard duro), precio propio (jamás N×sesión) y descripción.
// "Personalizado" = la puerta a las ESPECIALIDADES (§1, catálogo
// paralelo — SUPUESTO DECLARADO al founder): reusa la Hoja existente
// con nivel 'especialidad' preseteado. Vigencia/duración de las
// tarjetas: derivadas y DICHAS en la tarjeta (vigencia N+2 semanas al
// nacer, se conserva al editar con piso (N-1); duración = la de la
// sesión suelta al nacer). Safe-area (requisito duro S65): scroll y
// Hoja suman insets.bottom — ningún botón bajo la barra del sistema.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  Hoja,
  HojaScroll,
  Insignia,
  Interruptor,
  SelectorOpcion,
  Separador,
  SliderPrecio,
  StepperCantidad,
  Tarjeta,
  Texto,
  VozComision,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  RANGO_SUGERIDO_POR_NIVEL,
  guardarOfertaAdiestramiento,
  guardarProgramaAdiestramiento,
  obtenerComisionVigenteCita,
  obtenerFranjasDeServicios,
  obtenerFranjasHorario,
  obtenerMiPrestador,
  obtenerModoHorarios,
  obtenerOfertaAdiestramientoPropia,
  type ModoHorarios,
  type MundoAdiestramientoPropio,
  type NivelPrograma,
  type ProgramaAdiestramientoPropio,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';
// S68-B (D-426 muere): la sección de horarios COMPARTIDA entra al
// taller del adiestramiento — el oficio declara horarios propios con la
// misma pieza que paseo/grooming/veterinaria (elección de modo D-386
// incluida).
import {
  SeccionHorarios,
  aplicarDiffFranjas,
  draftDesdeFranja,
  franjaDirty,
  type DraftFranja,
  type OfertaParaHorarios,
} from '@/components/seccion-horarios';

// pasos discretos del slider (patrón taller grooming S59-B6; la
// calibración fina de los rieles es materia del gate founder)
function pasosDe(min: number, max: number, paso: number): number[] {
  const r: number[] = [];
  for (let v = min; v <= max + 1e-9; v += paso) r.push(Number(v.toFixed(2)));
  return r;
}
function indiceEn(pasos: number[], valor: number): number {
  let mejor = 0;
  for (let i = 1; i < pasos.length; i++) {
    if (Math.abs(pasos[i] - valor) < Math.abs(pasos[mejor] - valor)) mejor = i;
  }
  return mejor;
}

const PASOS_SESION = pasosDe(10, 100, 2.5);
const PASOS_PROGRAMA = pasosDe(40, 600, 10);
const DURACIONES_SESION = [30, 45, 60, 75, 90] as const;
// §12.5: default 60'.
const DURACION_DEFAULT = 60;

// la escalera troncal (§1) — las tarjetas fijas de S65-B2
const NIVELES_TRONCALES = ['basico', 'medio', 'experto'] as const;
type NivelTroncal = (typeof NIVELES_TRONCALES)[number];
// default sugerido del nivel = punto medio del rango §12.4
const N_SUGERIDO: Record<NivelTroncal, number> = { basico: 7, medio: 9, experto: 11 };

function esTroncal(n: NivelPrograma): n is NivelTroncal {
  return (NIVELES_TRONCALES as readonly string[]).includes(n);
}

// UNA tarjeta por nivel troncal: el PRIMER programa de cada nivel es su
// fila; el resto (especialidades + duplicados legacy) vive con
// Personalizado — nada queda inalcanzable.
function separarProgramas(programas: ProgramaAdiestramientoPropio[]): {
  troncal: Partial<Record<NivelTroncal, ProgramaAdiestramientoPropio>>;
  otros: ProgramaAdiestramientoPropio[];
} {
  const troncal: Partial<Record<NivelTroncal, ProgramaAdiestramientoPropio>> = {};
  const otros: ProgramaAdiestramientoPropio[] = [];
  for (const p of programas) {
    if (esTroncal(p.nivel) && troncal[p.nivel] === undefined) troncal[p.nivel] = p;
    else otros.push(p);
  }
  return { troncal, otros };
}

interface DraftNivel {
  nSesiones: number;
  precioIndice: number;
  descripcion: string;
  /** Sin fila guardada: el toggle abre el editor (nada se guarda solo). */
  abierto: boolean;
}

function draftNivelBase(nivel: NivelTroncal): DraftNivel {
  return {
    nSesiones: N_SUGERIDO[nivel],
    precioIndice: indiceEn(PASOS_PROGRAMA, 200),
    descripcion: '',
    abierto: false,
  };
}

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | ({ estado: 'listo'; prestadorId: string } & MundoAdiestramientoPropio);

interface DraftPrograma {
  programaId: string | null;
  // S65-B2: el nivel viene del punto de entrada — Personalizado crea
  // ESPECIALIDAD (§1); una fila existente conserva el suyo.
  nivel: NivelPrograma;
  nombre: string;
  descripcion: string;
  nSesiones: number;
  precioIndice: number;
  vigenciaSemanas: number;
  duracionMinutos: number;
  activo: boolean;
}

function draftNuevo(): DraftPrograma {
  return {
    programaId: null,
    nivel: 'especialidad',
    nombre: '',
    descripcion: '',
    nSesiones: 8,
    precioIndice: indiceEn(PASOS_PROGRAMA, 200),
    vigenciaSemanas: 10,
    duracionMinutos: DURACION_DEFAULT,
    activo: true,
  };
}

function draftDe(p: ProgramaAdiestramientoPropio): DraftPrograma {
  return {
    programaId: p.id,
    nivel: p.nivel,
    nombre: p.nombre,
    descripcion: p.descripcion ?? '',
    nSesiones: p.nSesiones,
    precioIndice: indiceEn(PASOS_PROGRAMA, p.precioPrograma),
    vigenciaSemanas: Math.max(1, Math.round(p.vigenciaDias / 7)),
    duracionMinutos: p.duracionMinutosSesion,
    activo: p.activo,
  };
}

export default function TallerAdiestramiento() {
  const { theme } = useTheme();
  const router = useRouter();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  // draft de la oferta (la pantalla es dueña del valor)
  const [activo, setActivo] = useState(true);
  const [precioIndice, setPrecioIndice] = useState(indiceEn(PASOS_SESION, 25));
  const [duracion, setDuracion] = useState<number>(DURACION_DEFAULT);
  // EL PASO BLOQUEANTE: arranca SIN selección en la oferta nueva —
  // jamás default silencioso.
  const [especies, setEspecies] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  // las tarjetas fijas de la escalera troncal (S65-B2 P2)
  const [niveles, setNiveles] = useState<Record<NivelTroncal, DraftNivel>>({
    basico: draftNivelBase('basico'),
    medio: draftNivelBase('medio'),
    experto: draftNivelBase('experto'),
  });
  const [guardandoNivel, setGuardandoNivel] = useState<NivelTroncal | null>(null);
  const [alternandoNivel, setAlternandoNivel] = useState<NivelTroncal | null>(null);
  // Hoja del programa (Personalizado / especialidades + legacy)
  const [hojaPrograma, setHojaPrograma] = useState(false);
  const [draft, setDraft] = useState<DraftPrograma>(draftNuevo());
  const [guardandoPrograma, setGuardandoPrograma] = useState(false);
  // S68-B: horarios del oficio (D-426) — el borrador NO se clobbea en
  // el refetch-en-focus: solo la primera carga (o el reset explícito
  // post-cambio-de-modo) lo puebla.
  const [franjas, setFranjas] = useState<DraftFranja[] | null>(null);
  const [modoHorarios, setModoHorarios] = useState<ModoHorarios>('universal');
  const [ofertasHorarios, setOfertasHorarios] = useState<OfertaParaHorarios[]>([]);
  const [guardandoHorarios, setGuardandoHorarios] = useState(false);
  // S68-B (D-412): el neto visible — el % es DATO leído (7.15)
  const [comisionPct, setComisionPct] = useState<number | null>(null);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setPantalla({ estado: 'cargando' });
    const sesion = await verificarSesion();
    if (!sesion.ok) return setPantalla({ estado: 'error', mensaje: sesion.mensaje });
    const prestador = await obtenerMiPrestador();
    if (!prestador.ok) return setPantalla({ estado: 'error', mensaje: prestador.mensaje });
    const r = await obtenerOfertaAdiestramientoPropia(prestador.data.id);
    if (!r.ok) return setPantalla({ estado: 'error', mensaje: r.mensaje });
    // S68-B: horarios (D-426) + comisión (D-412) — la comisión y el modo
    // refrescan siempre; el BORRADOR de franjas solo se puebla si está
    // vacío (el refetch-en-focus no pisa trabajo sin guardar)
    const [rComision, rModo, rFranjas] = await Promise.all([
      obtenerComisionVigenteCita(),
      obtenerModoHorarios(prestador.data.id),
      obtenerFranjasHorario(prestador.data.id),
    ]);
    if (rComision.ok) setComisionPct(rComision.data.porcentaje);
    if (rModo.ok && rFranjas.ok) {
      setModoHorarios(rModo.data);
      const ofertaId = r.data.oferta?.id ?? null;
      setOfertasHorarios(ofertaId === null ? [] : [{ id: ofertaId, etiqueta: t('tallerAdiestramiento.horariosOferta') }]);
      if (rModo.data === 'por_servicio' && ofertaId !== null) {
        const rEsp = await obtenerFranjasDeServicios(prestador.data.id, [ofertaId]);
        if (rEsp.ok) {
          setFranjas((prev) => (prev === null ? rEsp.data.map((f) => draftDesdeFranja(f, f.servicioId)) : prev));
        }
      } else {
        setFranjas((prev) => (prev === null ? rFranjas.data.map((f) => draftDesdeFranja(f)) : prev));
      }
    }
    setPantalla({ estado: 'listo', prestadorId: prestador.data.id, ...r.data });
    if (r.data.oferta !== null) {
      setActivo(r.data.oferta.activo);
      if (r.data.oferta.precio !== null) setPrecioIndice(indiceEn(PASOS_SESION, r.data.oferta.precio));
      if (r.data.oferta.duracionMinutos !== null) setDuracion(r.data.oferta.duracionMinutos);
      setEspecies(r.data.oferta.especies);
    }
    // las tarjetas re-sincronizan con la verdad de DB (misma vida que
    // el draft de la oferta: cada focus/recarga)
    const { troncal } = separarProgramas(r.data.programas);
    setNiveles((prev) => {
      const sig = { ...prev };
      for (const nivel of NIVELES_TRONCALES) {
        const fila = troncal[nivel];
        sig[nivel] = fila
          ? {
              nSesiones: fila.nSesiones,
              precioIndice: indiceEn(PASOS_PROGRAMA, fila.precioPrograma),
              descripcion: fila.descripcion ?? '',
              abierto: false,
            }
          : { ...draftNivelBase(nivel), abierto: prev[nivel].abierto };
      }
      return sig;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  const listo = pantalla.estado === 'listo' ? pantalla : null;
  const especiesDeclaradas = especies.length > 0;

  async function guardarOferta() {
    if (listo === null || guardando || !especiesDeclaradas) return;
    setGuardando(true);
    const r = await guardarOfertaAdiestramiento({
      prestadorId: listo.prestadorId,
      ofertaId: listo.oferta?.id ?? null,
      activo,
      precio: PASOS_SESION[precioIndice],
      duracionMinutos: duracion,
      especies,
    });
    setGuardando(false);
    if (!r.ok) return mostrar({ variante: 'error', texto: r.mensaje });
    mostrar({ variante: 'exito', texto: t('tallerAdiestramiento.guardado') });
    void cargar(true);
  }

  async function guardarPrograma() {
    if (listo?.oferta == null || guardandoPrograma || draft.nombre.trim() === '') return;
    setGuardandoPrograma(true);
    const r = await guardarProgramaAdiestramiento({
      ofertaId: listo.oferta.id,
      programaId: draft.programaId,
      nivel: draft.nivel,
      nombre: draft.nombre,
      descripcion: draft.descripcion.trim() === '' ? undefined : draft.descripcion,
      nSesiones: draft.nSesiones,
      precioPrograma: PASOS_PROGRAMA[draft.precioIndice],
      vigenciaDias: draft.vigenciaSemanas * 7,
      duracionMinutosSesion: draft.duracionMinutos,
      activo: draft.activo,
    });
    setGuardandoPrograma(false);
    if (!r.ok) return mostrar({ variante: 'error', texto: r.mensaje });
    setHojaPrograma(false);
    mostrar({ variante: 'exito', texto: t('tallerAdiestramiento.programaGuardado') });
    void cargar(true);
  }

  // ── las tarjetas fijas (S65-B2 P2) ──
  // Toggle sin fila: abre/cierra el editor (nada se guarda solo).
  // Toggle con fila: publica/oculta DE UN TOQUE (precedente P14 pausa).
  async function alternarNivel(nivel: NivelTroncal) {
    if (listo?.oferta == null || alternandoNivel !== null) return;
    const fila = separarProgramas(listo.programas).troncal[nivel];
    if (fila === undefined) {
      setNiveles((prev) => ({ ...prev, [nivel]: { ...prev[nivel], abierto: !prev[nivel].abierto } }));
      return;
    }
    setAlternandoNivel(nivel);
    const r = await guardarProgramaAdiestramiento({
      ofertaId: listo.oferta.id,
      programaId: fila.id,
      nivel,
      nombre: fila.nombre,
      descripcion: fila.descripcion ?? undefined,
      nSesiones: fila.nSesiones,
      precioPrograma: fila.precioPrograma,
      vigenciaDias: fila.vigenciaDias,
      duracionMinutosSesion: fila.duracionMinutosSesion,
      activo: !fila.activo,
    });
    setAlternandoNivel(null);
    if (!r.ok) return mostrar({ variante: 'error', texto: r.mensaje });
    mostrar({ variante: 'exito', texto: t('tallerAdiestramiento.programaGuardado') });
    void cargar(true);
  }

  async function guardarNivel(nivel: NivelTroncal) {
    if (listo?.oferta == null || guardandoNivel !== null) return;
    const fila = separarProgramas(listo.programas).troncal[nivel];
    const d = niveles[nivel];
    setGuardandoNivel(nivel);
    const r = await guardarProgramaAdiestramiento({
      ofertaId: listo.oferta.id,
      programaId: fila?.id ?? null,
      nivel,
      // la tarjeta es fija: el nombre nace del nivel; una fila con
      // nombre propio (legacy de la Hoja) lo conserva
      nombre: fila?.nombre ?? NOMBRE_NIVEL[nivel],
      descripcion: d.descripcion.trim() === '' ? undefined : d.descripcion,
      nSesiones: d.nSesiones,
      precioPrograma: PASOS_PROGRAMA[d.precioIndice],
      // derivadas y dichas en la tarjeta: al nacer N+2 semanas; al
      // editar se conserva la vigencia con piso (N-1) del CHECK
      vigenciaDias: fila !== undefined ? Math.max(fila.vigenciaDias, Math.max(1, d.nSesiones - 1) * 7) : (d.nSesiones + 2) * 7,
      duracionMinutosSesion: fila?.duracionMinutosSesion ?? listo.oferta.duracionMinutos ?? DURACION_DEFAULT,
      activo: true,
    });
    setGuardandoNivel(null);
    if (!r.ok) return mostrar({ variante: 'error', texto: r.mensaje });
    mostrar({ variante: 'exito', texto: t('tallerAdiestramiento.programaGuardado') });
    void cargar(true);
  }

  // S68-B (D-426): el guardado de horarios — bloque propio, coherente
  // con la mecánica por-bloque de este taller (no hay guardado único)
  async function guardarHorarios() {
    if (listo === null || franjas === null || guardandoHorarios) return;
    setGuardandoHorarios(true);
    const rf = await aplicarDiffFranjas(listo.prestadorId, franjas);
    setFranjas(rf.franjas);
    setGuardandoHorarios(false);
    if (!rf.ok) {
      mostrar({
        variante: 'error',
        texto:
          rf.error.tipo === 'solape'
            ? `${t(`horarios.dia${rf.error.diaSemana as 0 | 1 | 2 | 3 | 4 | 5 | 6}` as const)}: ${t('horarios.solape')}`
            : rf.error.mensaje,
      });
      return;
    }
    mostrar({ variante: 'exito', texto: t('taller.guardado') });
  }

  const vozSecundaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: theme.text.secondary,
  } as const;

  const VOZ_NIVEL: Record<NivelPrograma, string> = {
    basico: t('tallerAdiestramiento.nivelBasico'),
    medio: t('tallerAdiestramiento.nivelMedio'),
    experto: t('tallerAdiestramiento.nivelExperto'),
    especialidad: t('tallerAdiestramiento.nivelEspecialidad'),
  };

  // el nombre con que nace el programa de una tarjeta fija (lo que ve
  // la familia en el QUIÉN) — una fila renombrada lo conserva
  const NOMBRE_NIVEL: Record<NivelTroncal, string> = {
    basico: t('tallerAdiestramiento.nombreBasico'),
    medio: t('tallerAdiestramiento.nombreMedio'),
    experto: t('tallerAdiestramiento.nombreExperto'),
  };

  // CHECK de DB espejado: vigencia >= (N-1) semanas — el stepper no
  // deja elegir una config que el motor va a rebotar.
  const minSemanas = Math.max(1, draft.nSesiones - 1);
  const rango = RANGO_SUGERIDO_POR_NIVEL[draft.nivel];

  function Titulo({ texto }: { texto: string }) {
    return (
      <Texto variante="seccion">
        {texto}
      </Texto>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[2] }}>
        <Encabezado
          variante="navegacion"
          titulo={t('tallerAdiestramiento.titulo')}
          atras
          onAtras={() => router.back()}
        />
      </View>
      {/* safe-area (requisito duro S65): el último botón del scroll
          jamás queda bajo la barra de navegación del sistema */}
      <ScrollView
        contentContainerStyle={{
          padding: spacing[4],
          paddingBottom: spacing[10] + insets.bottom,
          gap: spacing[5],
        }}
      >
        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" alto={120} />
              <Esqueleto forma="bloque" alto={96} />
              <Esqueleto forma="bloque" alto={48} />
            </View>
          </EsqueletoGrupo>
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

        {listo !== null && (
          <>
            {/* ── CON QUIÉN TRABAJAS — el paso bloqueante ── */}
            <View style={{ gap: spacing[3] }}>
              <Titulo texto={t('tallerAdiestramiento.especiesTitulo')} />
              <Text style={vozSecundaria}>{t('tallerAdiestramiento.especiesExplica')}</Text>
              <SelectorOpcion
                acento="oficio"
                multiple
                etiqueta={t('tallerAdiestramiento.especiesTitulo')}
                opciones={[{ codigo: 'perro', etiqueta: t('tallerAdiestramiento.especiePerro') }]}
                seleccionadas={especies}
                onSelect={(codigo) =>
                  setEspecies((prev) => (prev.includes(codigo) ? prev.filter((e) => e !== codigo) : [...prev, codigo]))
                }
              />
              <Text style={vozSecundaria}>{t('tallerAdiestramiento.especiesTecho')}</Text>
            </View>

            {/* ── LA SESIÓN SUELTA (§4: precio único, sin matriz) ── */}
            <View style={{ gap: spacing[3] }}>
              <Titulo texto={t('tallerAdiestramiento.ofertaTitulo')} />
              <Tarjeta relleno="amplio">
                <View style={{ gap: spacing[4] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        fontFamily: typography.family.sans.regular,
                        fontSize: typography.size.base,
                        color: theme.text.primary,
                      }}
                    >
                      {t('tallerAdiestramiento.ofrecer')}
                    </Text>
                    <Interruptor
                      encendido={activo}
                      onCambio={setActivo}
                      etiqueta={t('tallerAdiestramiento.ofrecer')}
                      registro="oficio"
                    />
                  </View>
                  <View style={{ gap: spacing[2] }}>
                    {/* S68-B7: el valor vive dentro del slider (Chanel) */}
                    <Text style={vozSecundaria}>{t('tallerAdiestramiento.precioSesion')}</Text>
                    <SliderPrecio
                      etiqueta={t('tallerAdiestramiento.precioSesion')}
                      pasos={PASOS_SESION.map((p) => `$${p.toFixed(2)}`)}
                      indice={precioIndice}
                      onCambio={setPrecioIndice}
                      registro="aa"
                    />
                    {/* D-412 pagada (S68-B): el neto visible junto al
                        precio — la compartida de packages/ui */}
                    <VozComision pct={comisionPct} precio={PASOS_SESION[precioIndice]} />
                  </View>
                  {/* S65 cura chica (captura founder): 5 chips no entran
                      en 'fila' — el 90 min quedaba inalcanzable. 'tira'
                      es el scroll horizontal de la casa (S55-B4). */}
                  <SelectorOpcion
                    acento="oficio"
                    disposicion="tira"
                    etiqueta={t('tallerAdiestramiento.duracionSesion')}
                    opciones={DURACIONES_SESION.map((d) => ({ codigo: String(d), etiqueta: `${d} min` }))}
                    seleccionada={String(duracion)}
                    onSelect={(codigo) => setDuracion(Number(codigo))}
                  />
                </View>
              </Tarjeta>
            </View>

            {/* EL BLOQUEO REAL: sin especies no hay publicación — el CTA
                se apaga y el porqué queda a la vista (Ley 17.4). */}
            {!especiesDeclaradas && <Text style={vozSecundaria}>{t('tallerAdiestramiento.especiesFalta')}</Text>}
            <Boton
              variante="primario"
              bloque
              etiqueta={t('tallerAdiestramiento.guardar')}
              cargando={guardando}
              deshabilitado={!especiesDeclaradas}
              onPress={() => void guardarOferta()}
            />

            {/* ── TUS PROGRAMAS — la escalera troncal en TARJETAS FIJAS
                (S65-B2 P2, letra §1/§4/§12.4) + Personalizado = la
                puerta a las especialidades (supuesto declarado) ── */}
            <View style={{ gap: spacing[3] }}>
              <Titulo texto={t('tallerAdiestramiento.programasTitulo')} />
              <Text style={vozSecundaria}>{t('tallerAdiestramiento.programasExplica')}</Text>
              {listo.oferta === null ? (
                <Text style={vozSecundaria}>{t('tallerAdiestramiento.programasEsperanOferta')}</Text>
              ) : (() => {
                const { troncal, otros } = separarProgramas(listo.programas);
                return (
                  <>
                    {NIVELES_TRONCALES.map((nivel) => {
                      const fila = troncal[nivel];
                      const d = niveles[nivel];
                      const encendido = fila !== undefined ? fila.activo : d.abierto;
                      const rango = RANGO_SUGERIDO_POR_NIVEL[nivel];
                      const dirty =
                        fila === undefined ||
                        d.nSesiones !== fila.nSesiones ||
                        PASOS_PROGRAMA[d.precioIndice] !== fila.precioPrograma ||
                        d.descripcion.trim() !== (fila.descripcion ?? '');
                      // lo que se va a guardar, DICHO en la tarjeta
                      const semanasVigencia =
                        fila !== undefined
                          ? Math.max(Math.round(fila.vigenciaDias / 7), Math.max(1, d.nSesiones - 1))
                          : d.nSesiones + 2;
                      const minutosSesion =
                        fila?.duracionMinutosSesion ?? listo.oferta?.duracionMinutos ?? DURACION_DEFAULT;
                      return (
                        <Tarjeta key={nivel} relleno="amplio">
                          <View style={{ gap: spacing[4] }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: spacing[3],
                              }}
                            >
                              <View style={{ flex: 1, gap: spacing[1] }}>
                                <Text
                                  style={{
                                    fontFamily: typography.family.sans.medium,
                                    fontSize: typography.size.base,
                                    color: theme.text.primary,
                                  }}
                                >
                                  {VOZ_NIVEL[nivel]}
                                </Text>
                                {rango !== undefined && (
                                  <Text style={vozSecundaria}>
                                    {t('tallerAdiestramiento.rangoSugerido', { min: rango.min, max: rango.max })}
                                  </Text>
                                )}
                              </View>
                              {/* anti doble-disparo: el guard vive en
                                  alternarNivel (alternandoNivel) — el
                                  Interruptor no porta deshabilitado */}
                              <Interruptor
                                encendido={encendido}
                                onCambio={() => void alternarNivel(nivel)}
                                etiqueta={VOZ_NIVEL[nivel]}
                                registro="oficio"
                              />
                            </View>

                            {encendido && (
                              <>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <Text style={vozSecundaria}>{t('tallerAdiestramiento.sesiones')}</Text>
                                  <StepperCantidad
                                    valor={d.nSesiones}
                                    min={2}
                                    max={30}
                                    onCambio={(v) =>
                                      setNiveles((prev) => ({ ...prev, [nivel]: { ...prev[nivel], nSesiones: v } }))
                                    }
                                    etiqueta={t('tallerAdiestramiento.sesiones')}
                                    registro="oficio"
                                  />
                                </View>

                                <View style={{ gap: spacing[2] }}>
                                  {/* S68-B7: el valor vive dentro del slider (Chanel) */}
                                  <Text style={vozSecundaria}>{t('tallerAdiestramiento.precioPrograma')}</Text>
                                  <SliderPrecio
                                    etiqueta={t('tallerAdiestramiento.precioPrograma')}
                                    pasos={PASOS_PROGRAMA.map((p) => `$${p.toFixed(2)}`)}
                                    indice={d.precioIndice}
                                    onCambio={(i) =>
                                      setNiveles((prev) => ({ ...prev, [nivel]: { ...prev[nivel], precioIndice: i } }))
                                    }
                                    registro="aa"
                                  />
                                  {/* D-412 pagada (S68-B) */}
                                  <VozComision pct={comisionPct} precio={PASOS_PROGRAMA[d.precioIndice]} />
                                </View>

                                <Campo
                                  label={t('tallerAdiestramiento.descripcionPrograma')}
                                  value={d.descripcion}
                                  onChangeText={(v) =>
                                    setNiveles((prev) => ({ ...prev, [nivel]: { ...prev[nivel], descripcion: v } }))
                                  }
                                  placeholder={t('tallerAdiestramiento.descripcionPlaceholder')}
                                  multilinea={3}
                                />

                                <Text style={vozSecundaria}>
                                  {t('tallerAdiestramiento.condiciones', { semanas: semanasVigencia, min: minutosSesion })}
                                </Text>

                                {dirty && (
                                  <Boton
                                    variante="secundario"
                                    bloque
                                    etiqueta={t('tallerAdiestramiento.guardarPrograma')}
                                    cargando={guardandoNivel === nivel}
                                    onPress={() => void guardarNivel(nivel)}
                                  />
                                )}
                              </>
                            )}
                          </View>
                        </Tarjeta>
                      );
                    })}

                    {/* Personalizado — la puerta a las especialidades (§1) */}
                    <Tarjeta relleno="amplio">
                      <View style={{ gap: spacing[3] }}>
                        <Text
                          style={{
                            fontFamily: typography.family.sans.medium,
                            fontSize: typography.size.base,
                            color: theme.text.primary,
                          }}
                        >
                          {t('tallerAdiestramiento.personalizadoTitulo')}
                        </Text>
                        <Text style={vozSecundaria}>{t('tallerAdiestramiento.personalizadoExplica')}</Text>
                        <View style={{ alignSelf: 'flex-start' }}>
                          <Boton
                            variante="compacto"
                            etiqueta={t('tallerAdiestramiento.personalizadoCrear')}
                            onPress={() => {
                              setDraft(draftNuevo());
                              setHojaPrograma(true);
                            }}
                          />
                        </View>
                      </View>
                    </Tarjeta>

                    {/* especialidades existentes + duplicados legacy de
                        nivel — nada queda inalcanzable (editan en la Hoja) */}
                    {otros.length > 0 && (
                      <Tarjeta>
                        {otros.map((p, i) => (
                          <View key={p.id}>
                            {i > 0 && <Separador />}
                            <Celda
                              titulo={p.nombre}
                              subtitulo={`${VOZ_NIVEL[p.nivel]} · ${t('tallerAdiestramiento.sesionesN', { n: p.nSesiones })}`}
                              metadataMono={`$${p.precioPrograma.toFixed(2)}`}
                              fin={
                                p.activo ? undefined : (
                                  <Insignia estado="proximo" etiqueta={t('tallerAdiestramiento.programaOculto')} tamaño="sm" />
                                )
                              }
                              interactiva
                              accessibilityRole="button"
                              onPress={() => {
                                setDraft(draftDe(p));
                                setHojaPrograma(true);
                              }}
                            />
                          </View>
                        ))}
                      </Tarjeta>
                    )}
                  </>
                );
              })()}
            </View>

            {/* ── HORARIOS DEL OFICIO (S68-B: D-426 muere) — la sección
                COMPARTIDA con paseo/grooming/veterinaria, elección de
                modo D-386 incluida. Guardado por bloque, coherente con
                la mecánica de este taller. ── */}
            {franjas !== null && (
              <View style={{ gap: spacing[3] }}>
                <SeccionHorarios
                  franjas={franjas}
                  onCambio={setFranjas}
                  oficio="adiestramiento"
                  titulo={<Titulo texto={t('taller.horariosTitulo')} />}
                  prestadorId={listo.prestadorId}
                  modo={modoHorarios}
                  ofertas={ofertasHorarios}
                  onModoCambiado={() => {
                    setFranjas(null);
                    void cargar(true);
                  }}
                />
                {franjas.some(franjaDirty) && (
                  <Boton
                    variante="secundario"
                    bloque
                    etiqueta={t('tallerAdiestramiento.guardarHorarios')}
                    cargando={guardandoHorarios}
                    onPress={() => void guardarHorarios()}
                  />
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Hoja del programa personalizado (S65-B2: el nivel viene del
          punto de entrada — nueva = especialidad; una fila existente
          conserva el suyo y el rango sugerido sigue como ayuda) */}
      <Hoja
        visible={hojaPrograma}
        onCerrar={() => {
          if (!guardandoPrograma) setHojaPrograma(false);
        }}
        titulo={
          draft.programaId === null
            ? t('tallerAdiestramiento.personalizadoNuevo')
            : t('tallerAdiestramiento.programaTituloEditar')
        }
      >
        <HojaScroll>
          <View style={{ padding: spacing[4], paddingBottom: spacing[4] + insets.bottom, gap: spacing[4] }}>
            {rango !== undefined && (
              <Text style={vozSecundaria}>
                {t('tallerAdiestramiento.rangoSugerido', { min: rango.min, max: rango.max })}
              </Text>
            )}

            <Campo
              label={t('tallerAdiestramiento.nombrePrograma')}
              value={draft.nombre}
              onChangeText={(v) => setDraft((d) => ({ ...d, nombre: v }))}
              placeholder={t('tallerAdiestramiento.nombrePlaceholder')}
            />

            <Campo
              label={t('tallerAdiestramiento.descripcionPrograma')}
              value={draft.descripcion}
              onChangeText={(v) => setDraft((d) => ({ ...d, descripcion: v }))}
              placeholder={t('tallerAdiestramiento.descripcionPlaceholder')}
              multilinea={3}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={vozSecundaria}>{t('tallerAdiestramiento.sesiones')}</Text>
              <StepperCantidad
                valor={draft.nSesiones}
                min={2}
                max={30}
                onCambio={(v) =>
                  setDraft((d) => ({
                    ...d,
                    nSesiones: v,
                    vigenciaSemanas: Math.max(d.vigenciaSemanas, Math.max(1, v - 1)),
                  }))
                }
                etiqueta={t('tallerAdiestramiento.sesiones')}
                registro="oficio"
              />
            </View>

            <View style={{ gap: spacing[2] }}>
              {/* S68-B7: el valor vive dentro del slider (Chanel) */}
              <Text style={vozSecundaria}>{t('tallerAdiestramiento.precioPrograma')}</Text>
              <SliderPrecio
                etiqueta={t('tallerAdiestramiento.precioPrograma')}
                pasos={PASOS_PROGRAMA.map((p) => `$${p.toFixed(2)}`)}
                indice={draft.precioIndice}
                onCambio={(i) => setDraft((d) => ({ ...d, precioIndice: i }))}
                registro="aa"
              />
              {/* D-412 pagada (S68-B) */}
              <VozComision pct={comisionPct} precio={PASOS_PROGRAMA[draft.precioIndice]} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: spacing[3], gap: spacing[1] }}>
                <Text style={vozSecundaria}>
                  {t('tallerAdiestramiento.vigencia')} · {t('tallerAdiestramiento.vigenciaSemanas', { n: draft.vigenciaSemanas })}
                </Text>
              </View>
              <StepperCantidad
                valor={draft.vigenciaSemanas}
                min={minSemanas}
                max={52}
                onCambio={(v) => setDraft((d) => ({ ...d, vigenciaSemanas: v }))}
                etiqueta={t('tallerAdiestramiento.vigencia')}
                registro="oficio"
              />
            </View>
            <Text style={vozSecundaria}>{t('tallerAdiestramiento.vigenciaExplica')}</Text>

            {/* misma cura S65 que la sesión suelta: la fila de 5 chips
                desborda — 'tira' (scroll horizontal de la casa) */}
            <SelectorOpcion
              acento="oficio"
              disposicion="tira"
              etiqueta={t('tallerAdiestramiento.duracionSesion')}
              opciones={DURACIONES_SESION.map((d) => ({ codigo: String(d), etiqueta: `${d} min` }))}
              seleccionada={String(draft.duracionMinutos)}
              onSelect={(codigo) => setDraft((d) => ({ ...d, duracionMinutos: Number(codigo) }))}
            />

            {draft.programaId !== null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.base,
                    color: theme.text.primary,
                  }}
                >
                  {t('tallerAdiestramiento.programaActivo')}
                </Text>
                <Interruptor
                  encendido={draft.activo}
                  onCambio={(v) => setDraft((d) => ({ ...d, activo: v }))}
                  etiqueta={t('tallerAdiestramiento.programaActivo')}
                  registro="oficio"
                />
              </View>
            )}

            <Boton
              variante="primario"
              bloque
              etiqueta={t('tallerAdiestramiento.guardarPrograma')}
              cargando={guardandoPrograma}
              deshabilitado={draft.nombre.trim() === ''}
              onPress={() => void guardarPrograma()}
            />
          </View>
        </HojaScroll>
      </Hoja>
    </View>
  );
}
