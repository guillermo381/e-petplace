/**
 * SECCIÓN "DÍAS Y HORARIOS" — compartida entre los talleres (S59-B5).
 * Nació DENTRO de El arte del paseo (v3, S58-B); al abrir El arte del
 * grooming se EXTRAJO acá tal cual (una sola verdad — la duplicación de
 * ~350 líneas era deuda segura): 7 días con letra sola en multi-selección,
 * la franja nueva (horas + cupo) aplica a los días marcados, la lista
 * agrupa franjas idénticas, la edición dice a qué días pertenece, y la
 * celda-puente a /vacaciones vive acá (§15b.5a).
 *
 * CONTRATO: presentacional sobre el BORRADOR — el dueño del estado es el
 * taller (franjas + onCambio); el guardado vive en `aplicarDiffFranjas`
 * (el diff en secuencia por la puerta única, mecánica intacta del paseo).
 * Las franjas son las GENERALES del prestador (servicio_id NULL): el
 * motor las lee para TODO servicio (obtener_slots: servicio_id IS NULL
 * OR = p_servicio_id) — una sola agenda del prestador, dos lápices.
 *
 * ── S78-B · TURNOS (habilitado por A2 `8ade0a2`: las seis firmas de
 *    jornada aceptan `empleadoId`; ausente = el titular, contrato V0) ──
 *
 * LA REGLA DURA DEL FOUNDER, cumplida por estructura: con UN solo turno
 * nadie ve la palabra "turno" — el bloque de Jornadas se monta SOLO con
 * 2+ personas con chip de ESTE oficio. N=1: cero diff (verificado: el
 * lector ya filtra por empleado_id y sin argumento resuelve al titular).
 *
 * EL TURNO ES DERIVADO, no entidad (M1 de turnos, gate 26-jul): un
 * patrón de franjas que ya existe — asignarlo COPIA las franjas del
 * titular a la persona. Sin memoria: tras cambiarlo, la persona con
 * citas conservadas colapsa al estado "Jornada propia" (declarado).
 *
 * ESTADO 6 FIRMADO (founder, 26-jul): las citas ya pactadas SE
 * CONSERVAN con su persona. El hecho lo garantiza el MOTOR (la cita no
 * referencia franjas — vive por fecha/hora propias); el aviso es
 * contexto junto al confirmar, jamás muro, jamás destructivo.
 *
 * ALCANCE DEL ACABADO (disciplina anti-S70): se re-acaba SOLO lo que el
 * turno toca (el bloque de Jornadas nace acabado; la lista de franjas
 * pasa a TarjetaEstado). Los SelectorOpcion, las tres Hoja, ListaHoras
 * y la celda de vacaciones quedan pre-acabadas y migran por D-318.
 */

import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Boton,
  Celda,
  Hoja,
  HojaScroll,
  SelectorOpcion,
  Separador,
  StepperCantidad,
  Tarjeta,
  Texto,
  radius,
  spacing,
  typography,
  useAviso,
  useTheme,
  TarjetaEstado,
} from '@epetplace/ui';
import {
  actualizarFranjaHorario,
  convertirHorariosAPorServicio,
  crearFranjaHorario,
  crearFranjaServicio,
  editarFranjaHorario,
  elegirModoHorarios,
  eliminarFranjaHorario,
  eliminarFranjasPrestador,
  obtenerChipsEmpleado,
  obtenerEquipoNegocio,
  obtenerFranjasDeServicios,
  obtenerFranjasHorario,
  obtenerMiEmpleadoId,
  type FranjaHorario,
  type ModoHorarios,
  type OficioChip,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export interface DraftFranja {
  key: string;
  id: string | null; // null = nace al guardar
  /** D-386 (S62): la OFERTA dueña — null = franja GENERAL (modo
   *  universal). En modo por_servicio toda franja porta su oferta. */
  servicioId: string | null;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  cupo: number;
  /** ⭐ S85-C9 — EL TECHO DEL OFICIO (`tipos_servicio.cupo_techo`, vía
   *  `FranjaHorario.cupoTechoMaximo` de A). Viaja CON la franja y no como
   *  constante de pantalla: el número tiene autor en el catálogo, y el
   *  `max={4}` escrito a mano que vivía acá quedó viejo el día que A subió
   *  el techo a 10 — sin que nada fallara. */
  cupoTecho: number;
  activo: boolean;
  quitar: boolean;
  baseCupo: number | null;
  baseActivo: boolean | null;
  // S61-B5 (D-391): la edición EN SU LUGAR — las horas también son
  // borrador con base; null = franja nueva (sin base que comparar)
  baseHoraInicio: string | null;
  baseHoraFin: string | null;
}

/** La oferta del oficio, con su voz — para la réplica D-386 (b). */
export interface OfertaParaHorarios {
  id: string;
  etiqueta: string;
}

// display lunes-primero; el ÍNDICE que viaja a DB sigue siendo 0=Domingo
export const ORDEN_DISPLAY = [1, 2, 3, 4, 5, 6, 0] as const;

// LA GRILLA DEL DÍA ENTERO (S81 — muere la herencia 05:00–22:00 de
// /horarios S55-B que este comentario confesaba): 48 medias horas,
// mismo día, fin > inicio vive en las DOS puertas (h > minimo). CERO
// motor: C5 midió que 22:30→23:30 ya produce slots y el wrapper guarda.
const HORAS: string[] = [];
for (let m = 0; m < 24 * 60; m += 30) {
  HORAS.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
}

export function draftDesdeFranja(f: FranjaHorario, servicioId: string | null = null): DraftFranja {
  return {
    key: f.id,
    id: f.id,
    servicioId,
    diaSemana: f.diaSemana,
    horaInicio: f.horaInicio,
    horaFin: f.horaFin,
    cupo: f.maxCitasPorSlot,
    cupoTecho: f.cupoTechoMaximo,
    activo: f.activo,
    quitar: false,
    baseCupo: f.maxCitasPorSlot,
    baseActivo: f.activo,
    baseHoraInicio: f.horaInicio,
    baseHoraFin: f.horaFin,
  };
}

export function franjaDirty(f: DraftFranja): boolean {
  if (f.id === null) return !f.quitar;
  return (
    f.quitar ||
    f.cupo !== f.baseCupo ||
    f.activo !== f.baseActivo ||
    f.horaInicio !== f.baseHoraInicio ||
    f.horaFin !== f.baseHoraFin
  );
}

/**
 * EL DIFF DE FRANJAS EN SECUENCIA (guardado único, mecánica del paseo):
 * cada éxito actualiza su base en el array devuelto — el fallo parcial
 * deja el resto dirty y reintentable. El error de solape vuelve TIPADO
 * con su día para que el caller le ponga la voz.
 */
export async function aplicarDiffFranjas(
  prestadorId: string,
  franjas: DraftFranja[],
  /** S78-B (contrato A2): la PERSONA dueña del borrador. Ausente = el
   *  titular (V0 exacto — los talleres sin selector no cambian). Las
   *  vías por id (actualizar/eliminar) no lo necesitan: la fila ya
   *  porta su persona. */
  empleadoId?: string,
): Promise<
  | { ok: true; franjas: DraftFranja[] }
  | { ok: false; franjas: DraftFranja[]; error: { tipo: 'solape'; diaSemana: number } | { tipo: 'otro'; mensaje: string } }
> {
  let vivas = [...franjas];
  const pisar = (key: string, cambios: Partial<DraftFranja>) => {
    vivas = vivas.map((f) => (f.key === key ? { ...f, ...cambios } : f));
  };

  for (const f of franjas) {
    if (!franjaDirty(f)) continue;
    if (f.id !== null && f.quitar) {
      const r = await eliminarFranjaHorario(f.id);
      if (!r.ok) return { ok: false, franjas: vivas, error: { tipo: 'otro', mensaje: r.mensaje } };
      vivas = vivas.filter((x) => x.key !== f.key);
    } else if (f.id !== null) {
      // S61-B5 (D-391): horas cambiadas = la vía de EDICIÓN (valida
      // solape server-side con exclusión de la propia); solo cupo/estado
      // = la vía liviana de siempre
      const horasCambiaron = f.horaInicio !== f.baseHoraInicio || f.horaFin !== f.baseHoraFin;
      if (horasCambiaron) {
        const r = await editarFranjaHorario({
          id: f.id,
          prestadorId,
          empleadoId,
          horaInicio: f.horaInicio,
          horaFin: f.horaFin,
          maxCitasPorSlot: f.cupo,
          activo: f.activo,
        });
        if (!r.ok) {
          return {
            ok: false,
            franjas: vivas,
            error:
              r.codigo === 'franja_solapada'
                ? { tipo: 'solape', diaSemana: f.diaSemana }
                : { tipo: 'otro', mensaje: r.mensaje },
          };
        }
        pisar(f.key, {
          baseCupo: f.cupo,
          baseActivo: f.activo,
          baseHoraInicio: f.horaInicio,
          baseHoraFin: f.horaFin,
        });
      } else {
        const r = await actualizarFranjaHorario({ id: f.id, maxCitasPorSlot: f.cupo, activo: f.activo });
        if (!r.ok) return { ok: false, franjas: vivas, error: { tipo: 'otro', mensaje: r.mensaje } };
        pisar(f.key, { baseCupo: f.cupo, baseActivo: f.activo });
      }
    } else if (!f.quitar) {
      // D-386: la franja nace GENERAL (universal) o DE SU OFERTA
      // (por_servicio) — el guard de modo en DB respalda al borrador.
      const r =
        f.servicioId !== null
          ? await crearFranjaServicio({
              prestadorId,
              empleadoId,
              servicioId: f.servicioId,
              diaSemana: f.diaSemana,
              horaInicio: f.horaInicio,
              horaFin: f.horaFin,
              maxCitasPorSlot: f.cupo,
            })
          : await crearFranjaHorario({
              prestadorId,
              empleadoId,
              diaSemana: f.diaSemana,
              horaInicio: f.horaInicio,
              horaFin: f.horaFin,
              maxCitasPorSlot: f.cupo,
            });
      if (!r.ok) {
        return {
          ok: false,
          franjas: vivas,
          error:
            r.codigo === 'franja_solapada'
              ? { tipo: 'solape', diaSemana: f.diaSemana }
              : { tipo: 'otro', mensaje: r.mensaje },
        };
      }
      pisar(f.key, { id: r.data.id, baseCupo: r.data.maxCitasPorSlot, baseActivo: r.data.activo });
    }
  }
  return { ok: true, franjas: vivas };
}

/** La grilla de horas (una sola verdad — la usan la Hoja de franja
 *  nueva y la edición del grupo, S61-B5). S81: con el día entero son
 *  48 medias horas — la LISTA de Celdas murió (48 filas no son lista);
 *  UNA GRILLA (SelectorOpcion, coordenadas = contorno legal 7bis). */
function ListaHoras({
  minimo,
  onElegir,
  etiqueta,
  seleccionada,
}: {
  minimo: string | null;
  onElegir: (h: string) => void;
  etiqueta: string;
  seleccionada?: string | null;
}) {
  return (
    <HojaScroll>
      <SelectorOpcion
        etiqueta={etiqueta}
        etiquetaVisible={false}
        acento="oficio"
        disposicion="grilla"
        opciones={HORAS.filter((h) => (minimo !== null ? h > minimo : true)).map((h) => ({ codigo: h, etiqueta: h }))}
        seleccionada={seleccionada ?? undefined}
        onSelect={onElegir}
      />
    </HojaScroll>
  );
}


/** El resumen de una jornada para las tarjetas del selector (S78-B). */
interface FranjaResumen {
  servicioId: string | null;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  cupo: number;
  activo: boolean;
}

interface PersonaJornada {
  /** null = el titular (el contrato V0 de A2: empleadoId ausente). */
  empleadoId: string | null;
  nombre: string;
  esTitular: boolean;
  /** Snapshot de sus franjas; null = no se pudo leer (Ley 13: el error
   *  no se disfraza de "sin jornada" — la tarjeta omite el resumen). */
  patron: FranjaResumen[] | null;
}

const claveResumen = (f: FranjaResumen): string =>
  `${f.servicioId ?? ''}|${f.diaSemana}|${f.horaInicio}|${f.horaFin}`;

/** Igualdad de PATRÓN sobre las franjas ACTIVAS (el turno son sus horas
 *  vivas; una pausada no rompe la pertenencia al turno). */
function patronIgual(a: FranjaResumen[], b: FranjaResumen[]): boolean {
  const va = new Set(a.filter((f) => f.activo).map(claveResumen));
  const vb = new Set(b.filter((f) => f.activo).map(claveResumen));
  return va.size === vb.size && [...va].every((k) => vb.has(k));
}

/** `08:00 – 17:00` sobre las activas (dato, no bautismo — el turno se
 *  nombra por sus horas, jamás "Turno 1"). */
function rangoDe(patron: FranjaResumen[]): string | null {
  const vivas = patron.filter((f) => f.activo);
  if (vivas.length === 0) return null;
  const min = vivas.reduce((m, f) => (f.horaInicio < m ? f.horaInicio : m), vivas[0].horaInicio);
  const max = vivas.reduce((m, f) => (f.horaFin > m ? f.horaFin : m), vivas[0].horaFin);
  return `${min} – ${max}`;
}

const resumenDeBorrador = (fs: DraftFranja[]): FranjaResumen[] =>
  fs
    .filter((f) => !f.quitar)
    .map((f) => ({
      servicioId: f.servicioId,
      diaSemana: f.diaSemana,
      horaInicio: f.horaInicio,
      horaFin: f.horaFin,
      cupo: f.cupo,
      activo: f.activo,
    }));

/**
 * ⭐ S85-C8 — CON CUÁNTOS NACE UNA FRANJA NUEVA. **FIRMA DEL FOUNDER
 * (3-ago): TRES.**
 *
 * **El número tiene AUTOR, y por eso está acá y no suelto en un
 * `useState`:** hasta hoy era un `1` sin firma, y ese 1 produjo el
 * defecto que el founder encontró en campo — cada franja nueva nacía con
 * capacidad efectiva 1, así que **la primera reserva agotaba el cupo y el
 * slot desaparecía de la agenda del cliente** (medido por A: la mitad de
 * las 24 franjas de Paseos Andres en 1).
 *
 * ⚠️ **TRES NO ES EL MÁXIMO — es la EXPECTATIVA.** El techo de plataforma
 * está en 10 (`tipos_servicio.cupo_techo`, migración `20260803220000`), y
 * son dos cosas distintas: *el techo dice hasta dónde se puede; esto dice
 * con cuánto empieza alguien que no declaró nada*. Nacer en el techo
 * habría afirmado que un paseador saca diez perros a la vez.
 *
 * ☠️ Y NO ALCANZA A LO VIEJO: las franjas que ya están en 1 **no las mueve
 * este default** — solo rige para las que nazcan. Las existentes se suben
 * a mano o por backfill con su letra.
 */
const CUPO_NUEVA_FRANJA = 3;

export function SeccionHorarios({
  franjas,
  onCambio,
  oficio,
  titulo,
  prestadorId,
  modo,
  ofertas,
  onModoCambiado,
  hayBorradorExterno,
  cuentaComercialId,
  empleadoSel,
  onEmpleadoCambio,
}: {
  franjas: DraftFranja[];
  onCambio: (franjas: DraftFranja[]) => void;
  /** S59-B6 cura 2: la voz del CUPO es DEL OFICIO — 'Paseos simultáneos'
   *  era voz genérica prestada; cada mundo dice la suya. S68-B: entran
   *  veterinaria y adiestramiento — hablan la voz "mascotas a la vez"
   *  (las keys viven en tallerGrooming.* por herencia, el texto es
   *  neutro de mascotas). */
  oficio: 'paseo' | 'grooming' | 'veterinaria' | 'adiestramiento';
  /** El TituloBloque lo pinta el taller (estilo propio de sección). */
  titulo: React.ReactNode;
  /** D-386 (S62): la elección universal/por-servicio vive acá. */
  prestadorId: string;
  modo: ModoHorarios;
  /** Las ofertas del OFICIO con su voz — la franja por_servicio se
   *  REPLICA a las marcadas (decisión founder (b): la elección se
   *  presenta a nivel del oficio, la oferta individual no se expone
   *  como concepto — Ley 3). */
  ofertas: OfertaParaHorarios[];
  /** El modo cambió en el server: el taller RECARGA sus franjas. */
  onModoCambiado: () => void;
  /** S68-B8 (mitad UI de D-409): el taller declara si tiene borradores
   *  vivos fuera de esta sección (precios, etc.) — las Hojas de
   *  conversión/vuelta avisan ANTES de disparar la recarga que los
   *  perdería. */
  hayBorradorExterno?: boolean;
  /** S78-B TURNOS — la cuenta comercial del negocio (llave del lector de
   *  equipo). null = no se pudo leer: el bloque de Jornadas no se monta
   *  (ausencia ante la duda, jamás un selector roto). */
  cuentaComercialId: string | null;
  /** La PERSONA cuyo borrador está abajo. null = el titular. El taller
   *  lo guarda porque `aplicarDiffFranjas` lo necesita al guardar. */
  empleadoSel: string | null;
  /** El switch YA VALIDADO: esta sección hace el refetch y empuja las
   *  franjas nuevas por `onCambio` ANTES de avisar — el taller solo
   *  registra el id. */
  onEmpleadoCambio: (empleadoId: string | null) => void;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  // estado puramente LOCAL de la sección (días marcados + hojas)
  const [diasSel, setDiasSel] = useState<number[]>([]);
  // D-386: el cambio de modo (RPC) y su confirmación si hay franjas.
  // S68-B8: la Hoja bifurca por DIRECCIÓN — ida = conversión (no se
  // borra nada), vuelta = destructiva (CTA rojo).
  const [modoPendiente, setModoPendiente] = useState<ModoHorarios | null>(null);
  const [modoOcupado, setModoOcupado] = useState(false);
  // S68-B8: el gesto "franja solo para un servicio" en universal — la
  // franja espera a que la conversión se CONFIRME y recién ahí se crea
  const [franjaPendiente, setFranjaPendiente] = useState<{
    dias: number[];
    desde: string;
    hasta: string;
    cupo: number;
    servicios: string[];
  } | null>(null);
  // D-386: las ofertas marcadas para la franja nueva (por_servicio)
  const [ofertasSel, setOfertasSel] = useState<string[]>([]);
  const [hojaGrupo, setHojaGrupo] = useState<string[] | null>(null);
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false);
  // S61-B5 (D-391): la edición de HORAS del grupo, en su lugar
  const [vistaGrupo, setVistaGrupo] = useState<'form' | 'desde' | 'hasta'>('form');
  const [desdeEdit, setDesdeEdit] = useState<string | null>(null);
  const [hastaEdit, setHastaEdit] = useState<string | null>(null);
  const [creandoFranja, setCreandoFranja] = useState(false);
  const [vistaNueva, setVistaNueva] = useState<'form' | 'desde' | 'hasta'>('form');
  const [desdeSel, setDesdeSel] = useState<string | null>(null);
  const [hastaSel, setHastaSel] = useState<string | null>(null);
  const [cupoSel, setCupoSel] = useState(CUPO_NUEVA_FRANJA);
  /**
   * ⭐ S85-C17 — EL CUPO CON EL QUE SE ABRIÓ, y es lo que distingue esta
   * cura de las dos anteriores.
   *
   * **El defecto del founder, con su literal:** *"en la franja, antes de
   * entrar a editar dice 4; le doy clic y está en 1, como si hubiera dos
   * datos diferentes"*. **No son dos datos.** La lista pinta `f.cupo`
   * crudo (4); el stepper pinta `Math.min(Math.max(valor,min),max)` — y
   * con el techo llegando en 1, **el componente CLAMPEA el 4 a 1**.
   *
   * **Y lo reabrí yo.** En C9 el `max` era `Math.max(techo, cupoSel)`,
   * puesto exactamente para esto; en C10 lo saqué porque producía el
   * TRINQUETE. Los dos defectos eran reales — cambié uno por el otro.
   *
   * **La distinción que faltaba: `cupoSel` SE MUEVE mientras editás, y
   * `cupoBase` NO.** Atar el tope al valor en edición hace que el tope
   * persiga al dedo (trinquete); atarlo al valor con el que la franja se
   * abrió lo deja FIJO durante toda la edición — el 4 se ve, no se puede
   * inventar un 5, y el trinquete no vuelve.
   *
   * ⚠️ Con techo roto esto deja guardar un valor que el server va a
   * rebotar, y es a propósito: **entre mentir sobre el valor que el
   * prestador YA tiene y dejar que el server diga que no, gana el
   * server** (corolario de Ley 23 — la puerta es cortesía, la autoridad
   * es del motor). Y desde `98f8038` ese rebote dice el número correcto.
   */
  const [cupoBase, setCupoBase] = useState(CUPO_NUEVA_FRANJA);
  /**
   * ⭐ S85-C9 — EL TECHO DEL OFICIO, del catálogo y no de la pantalla.
   * Sale de `cupoTechoMaximo` (A), que baja de `tipos_servicio.cupo_techo`.
   * Es UNO por oficio, así que se toma de la primera franja que lo traiga.
   *
   * ☠️ MURIÓ el `max={4}` escrito a mano. Ese número **quedó viejo sin que
   * nada fallara** el día que A subió el techo a 10: el motor aceptaba diez
   * y la pantalla seguía cortando en cuatro. Un tope con autor en el
   * catálogo no puede envejecer así.
   *
   * ⚠️ **EL BORDE, firmado: si el techo no llega, vale 1 — y las franjas
   * llegan igual.** La pantalla JAMÁS se cae por no poder calcular una
   * AYUDA: un fallo de lo accesorio no tumba lo principal.
   *
   * 🔴 **PERO EL BORDE, TAL COMO LO ESCRIBÍ, PRODUJO UN BUG DE CAMPO — y
   * la cura de acá es de DOS piezas porque el defecto era de dos.**
   * Literal del founder: *"deja disminuir pero no aumentar. Lo bajé a 3 y
   * me dejó, lo traté de subir a 4 y no me dejó."*
   *
   * **① LA CIRCULARIDAD, que es la causa raíz y es mía:** los drafts
   * NUEVOS heredaban `cupoTecho: techoDelOficio` — o sea que el techo se
   * derivaba de los mismos drafts que venía a limitar. Si el primero
   * nacía con el fallback, **todos quedaban en 1 para siempre, y el
   * cómputo se confirmaba a sí mismo**. Ahora un draft nuevo declara
   * `cupoTecho: 0` = *todavía no sé*, y el techo sale SOLO de franjas que
   * lo traen del wrapper.
   *
   * **② EL `Math.max(techo, cupoSel)`, que convertía lo anterior en una
   * TRINQUETE:** con techo 1, `max` pasaba a valer el valor vigente, así
   * que el stepper **nunca podía subir y siempre podía bajar**. Yo lo puse
   * para que un techo caído no dejara un tope por debajo del valor real —
   * el problema es que la cura hacía que el tope SIGUIERA al valor.
   * *Un tope que se mueve con el dato no es un tope: es un trinquete.*
   *
   * **LO QUE RIGE AHORA:** con techo CONOCIDO, el `max` ES el techo y
   * restringe de verdad. Con techo desconocido **no se inventa un
   * número**: el tope sale de lo que el servidor YA ACEPTÓ — ver
   * `topeCupo`.
   */
  const techoDelOficio = franjas.find((f) => f.cupoTecho > 0)?.cupoTecho ?? 1;
  /** ¿Lo sabemos de verdad, o estamos en el fallback? La diferencia decide
   *  si el tope RESTRINGE o solo acompaña — ver el `max` del stepper. */
  const techoConocido = franjas.some((f) => f.cupoTecho > 0);
  /**
   * ⭐ S85-C19 — EL TOPE, UNA SOLA VEZ, Y CON LOS DOS ESTADOS SEPARADOS.
   *
   * 🔴 **NACE DE UN DEFECTO MÍO QUE NO ERA DE CÓDIGO SINO DE PALABRA:** el
   * comentario de arriba decía *"con techo desconocido el control deja
   * subir"* y **el código capeaba en `Math.max(3, cupoBase)`**. Los dos
   * sitios del stepper hacían lo mismo, así que la contradicción no
   * producía síntoma: *un comentario que miente no rompe nada, y por eso
   * sobrevive*. **Y la mentira se propagó fuera de mi territorio** — A29
   * escribió su cura del techo dando por cierto que acá "el control deja
   * subir" (su literal), o sea que diseñó el contrato del `0` contra un
   * comportamiento que esta pantalla no tenía. *El comentario equivocado
   * de una pista se convierte en premisa de otra.*
   *
   * **CON TECHO CONOCIDO** el tope ES el techo — con el piso de `cupoBase`
   * que firmó C17, para que un valor real por encima del techo se VEA en
   * vez de ser aplastado.
   *
   * **CON TECHO DESCONOCIDO (`0` = "no sé", contrato de A29)** el tope sale
   * de **lo que el servidor ya aceptó**: el mayor `baseCupo` entre las
   * franjas guardadas, junto al default firmado y al valor de apertura.
   * **Ningún número inventado** (L-180): cada uno de los tres tiene autor
   * —el server, la firma del founder, la franja misma— y ninguno sale de
   * suponer cuánto "debería" permitir la plataforma.
   *
   * ⚠️ **SU LÍMITE, DECLARADO:** si la lectura del techo falla Y el
   * prestador quiere MÁS de lo que tuvo nunca, el `+` se detiene sin
   * decir por qué. Es una degradación acotada a una doble condición rara,
   * y **la alternativa era peor**: una voz de error sobre una AYUDA
   * accesoria, o un tope inventado. No se le pone voz a propósito —
   * `vozTecho` calla cuando no sabe, que es su regla (L-180).
   */
  const cupoMayorGuardado = franjas.reduce(
    (m, f) => (typeof f.baseCupo === 'number' && f.baseCupo > m ? f.baseCupo : m),
    0,
  );
  const topeCupo = techoConocido
    ? Math.max(techoDelOficio, cupoBase)
    : Math.max(CUPO_NUEVA_FRANJA, cupoMayorGuardado, cupoBase);
  /**
   * ⭐ S85-C15 — EL SERVICIO EXCLUSIVO (firma de la mesa, por adelantado).
   *
   * Techo 1 = la plataforma NO permite dos a la vez para este oficio. Y con
   * `min=1, max=1` el stepper queda **sin recorrido** — un estado que el
   * PROPIO componente llama inválido: `StepperCantidad` avisa en dev
   * *"min ≥ max — un rango sin recorrido no es un stepper"*.
   *
   * **Un `+` que nunca va a poder subir es la puerta ofreciendo lo que va a
   * rechazar (Ley 23).** Acá no hay nada que elegir: hay algo que decir.
   *
   * ⚠️ Y NO ESPERA A LA QUERY del caso del founder, por la razón que la
   * mesa firmó: **aunque su techo resulte mal por dato, otros prestadores
   * van a caer en este estado LEGÍTIMAMENTE** —los 25 tipos que no son
   * paseo tienen `cupo_techo` NULL, o sea exclusivos por diseño— y el
   * stepper degenerado no puede quedar para ellos. *La query decide si el
   * founder está acá por error; no decide si este estado existe.*
   *
   * ⚠️ **Y EXIGE `cupoBase <= 1` (S85-C17), que no es redundante:** si el
   * techo dijera 1 pero la franja YA declara 4, retirar el control
   * ESCONDERÍA ese 4 — la misma mentira que el clamp, con otra cara. Con
   * un valor real por encima del techo el control se queda y muestra la
   * verdad; que el server decida si la acepta.
   */
  const servicioExclusivo = techoConocido && techoDelOficio <= 1 && cupoBase <= 1;

  /* ☠️ LÁPIDA — LA SONDA DEL CUPO (S85-C16) MURIÓ ACÁ, CON SU DIAGNÓSTICO
     CUMPLIDO. Imprimía los tres números que deciden el `max` porque el 10
     del motor llegaba como 1 a la pantalla y las dos mediciones previas
     habían apuntado a lugares correctos que no eran. **El punto de pérdida
     lo encontró A29 y era el tramo del medio**: `prestador_servicios` no
     tiene FK a `tipos_servicio`, el embed fallaba SIEMPRE, y un
     `return 1` lo convertía en un techo legal y creíble.
     Se retira en el mismo commit que honra el contrato nuevo, que es la
     condición con la que nació. *Una sonda que sobrevive a su diagnóstico
     es ruido con nombre de instrumento.* */
  const contadorNuevas = useRef(0);

  // ── S78-B TURNOS: las personas con chip de ESTE oficio ──
  const [personas, setPersonas] = useState<PersonaJornada[] | null>(null);
  const [cambiandoPersona, setCambiandoPersona] = useState(false);

  /** El lector del patrón, con la MISMA bifurcación que usa el taller
   *  (por_servicio lee las franjas de las ofertas; universal las
   *  generales) — un resumen leído con otra vara mentiría. */
  async function leerPatron(empleadoId: string | null): Promise<FranjaResumen[] | null> {
    const emp = empleadoId ?? undefined;
    if (modo === 'por_servicio' && ofertas.length > 0) {
      const r = await obtenerFranjasDeServicios(prestadorId, ofertas.map((o) => o.id), emp);
      if (!r.ok) return null;
      return r.data.map((f) => ({
        servicioId: f.servicioId,
        diaSemana: f.diaSemana,
        horaInicio: f.horaInicio,
        horaFin: f.horaFin,
        cupo: f.maxCitasPorSlot,
        activo: f.activo,
      }));
    }
    const r = await obtenerFranjasHorario(prestadorId, emp);
    if (!r.ok) return null;
    return r.data.map((f) => ({
      servicioId: null,
      diaSemana: f.diaSemana,
      horaInicio: f.horaInicio,
      horaFin: f.horaFin,
      cupo: f.maxCitasPorSlot,
      activo: f.activo,
    }));
  }

  const patronADrafts = (patron: FranjaResumen[]): DraftFranja[] =>
    patron.map((fp) => {
      contadorNuevas.current += 1;
      return {
        key: `nueva-${contadorNuevas.current}`,
        id: null,
        servicioId: fp.servicioId,
        diaSemana: fp.diaSemana,
        horaInicio: fp.horaInicio,
        horaFin: fp.horaFin,
        cupo: fp.cupo,
        // 0 = TODAVÍA NO SÉ. Ver la nota de `techoDelOficio`: heredar acá el
        // fallback era la circularidad que produjo el bug de campo.
        cupoTecho: 0,
        activo: true,
        quitar: false,
        baseCupo: null,
        baseActivo: null,
        baseHoraInicio: null,
        baseHoraFin: null,
      };
    });

  useEffect(() => {
    let vigente = true;
    void (async () => {
      if (cuentaComercialId === null) {
        setPersonas(null);
        return;
      }
      const eq = await obtenerEquipoNegocio(cuentaComercialId);
      if (!vigente || !eq.ok) return;
      const activos = eq.data.miembros.filter((m) => m.activo);

      // Punto 3 del pedido: LA PERSONA AJUSTA SU PROPIA JORNADA. El
      // no-dueño que llega al taller ve/edita LO SUYO (D2 de A2: la
      // persona escribe la suya → pasa), sin selector — desde su vista
      // el negocio es N=1 y la regla dura rige igual.
      if (!eq.data.esDueno) {
        const yo = await obtenerMiEmpleadoId(prestadorId);
        if (!vigente || yo === null) return;
        // el borrador pasa a SUS franjas (con ids reales, misma firma
        // del taller) y el taller guarda con su id — jamás el titular
        if (modo === 'por_servicio' && ofertas.length > 0) {
          const r = await obtenerFranjasDeServicios(prestadorId, ofertas.map((o) => o.id), yo);
          if (!vigente || !r.ok) return;
          onEmpleadoCambio(yo);
          onCambio(r.data.map((f) => draftDesdeFranja(f, f.servicioId)));
        } else {
          const r = await obtenerFranjasHorario(prestadorId, yo);
          if (!vigente || !r.ok) return;
          onEmpleadoCambio(yo);
          onCambio(r.data.map((f) => draftDesdeFranja(f)));
        }
        return;
      }

      // LA REGLA DURA: con una sola persona no existe el concepto.
      if (activos.length <= 1) return;
      const titularM = activos.find((m) => m.roles.includes('dueño'));
      const resto = activos.filter((m) => !m.roles.includes('dueño'));
      // solo quienes tienen chip de ESTE oficio (2 viajes por cabeza —
      // el costo D-497 ya declarado; la cura es ensanchar el lector de
      // equipo, pedido a A)
      const conChip = await Promise.all(
        resto.map(async (m) => {
          const r = await obtenerChipsEmpleado(m.empleadoId);
          return { m, tiene: r.ok && r.data.some((c) => c.oficio === (oficio as OficioChip)) };
        }),
      );
      if (!vigente) return;
      const habilitados = conChip.filter((x) => x.tiene).map((x) => x.m);
      if (habilitados.length === 0) return;
      const lista: Omit<PersonaJornada, 'patron'>[] = [
        { empleadoId: null, nombre: titularM?.nombre ?? '', esTitular: true },
        ...habilitados.map((m) => ({ empleadoId: m.empleadoId, nombre: m.nombre, esTitular: false })),
      ];
      const conPatron = await Promise.all(
        lista.map(async (p) => ({ ...p, patron: await leerPatron(p.empleadoId) })),
      );
      if (vigente) setPersonas(conPatron);
    })();
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se relee al
    // cambiar la cuenta o el modo; el resto viaja por closure a propósito
  }, [cuentaComercialId, modo]);

  /** El switch de persona — dirty-check, refetch, y RECIÉN AHÍ el aviso
   *  al taller (jamás un id nuevo sobre franjas viejas). */
  async function tocarPersona(id: string | null) {
    if (id === empleadoSel || cambiandoPersona) return;
    if (franjas.some(franjaDirty)) {
      mostrar({ texto: t('horarios.guardaAntes'), variante: 'error' });
      return;
    }
    setCambiandoPersona(true);
    const patron = await leerPatron(id);
    setCambiandoPersona(false);
    if (patron === null) {
      mostrar({ texto: t('horarios.personaError'), variante: 'error' });
      return;
    }
    // frescura del snapshot: la tarjeta que se deja hereda el borrador
    // (no está dirty ⇒ es lo guardado)
    setPersonas((prev) =>
      prev?.map((p) => (p.empleadoId === empleadoSel ? { ...p, patron: resumenDeBorrador(franjas) } : p)) ?? prev,
    );
    onEmpleadoCambio(id);
    // el borrador nuevo se lee CON IDS por la misma firma del taller
    const emp = id ?? undefined;
    if (modo === 'por_servicio' && ofertas.length > 0) {
      const r = await obtenerFranjasDeServicios(prestadorId, ofertas.map((o) => o.id), emp);
      if (r.ok) onCambio(r.data.map((f) => draftDesdeFranja(f, f.servicioId)));
    } else {
      const r = await obtenerFranjasHorario(prestadorId, emp);
      if (r.ok) onCambio(r.data.map((f) => draftDesdeFranja(f)));
    }
  }

  /** Copiar el turno del negocio a la persona elegida — MODIFICA EL
   *  BORRADOR (las suyas salen, las copias entran); el Guardar del
   *  taller es quien aplica. ESTADO 6 FIRMADO: sus citas ya pactadas SE
   *  CONSERVAN (el motor no ata citas a franjas) — el aviso de al lado
   *  es contexto, no muro. Solo se copian las ACTIVAS del patrón: una
   *  franja nace activa (el alta no acepta pausada). */
  function usarTurnoNegocio() {
    const tit = personas?.find((p) => p.esTitular)?.patron;
    if (!tit || tit.length === 0) return;
    const salen = franjas.filter((f) => f.id !== null).map((f) => ({ ...f, quitar: true }));
    const copias = patronADrafts(tit.filter((f) => f.activo));
    onCambio([...salen, ...copias]);
  }

  const vozDia = (dia: number): string => t(`horarios.dia${dia as 0 | 1 | 2 | 3 | 4 | 5 | 6}` as const);
  const letraDia = (dia: number): string => t(`taller.diaCorto${dia as 0 | 1 | 2 | 3 | 4 | 5 | 6}` as const);
  // la voz del cupo POR OFICIO (S59-B6 cura 2; S68-B: solo el paseo
  // dice "paseos" — el resto de los oficios habla de mascotas)
  const vozMascotas = oficio !== 'paseo';
  const vozCupoTitulo = vozMascotas ? t('tallerGrooming.cupo') : t('horarios.cupo');
  const vozCupoAyuda = vozMascotas ? t('tallerGrooming.cupoAyuda') : t('horarios.cupoAyuda');
  /** ⭐ S85-C9 — LA VOZ DEL TECHO (letra de A). Dice de QUIÉN es el límite:
   *  del NEGOCIO, no de esta franja — sin esa mitad, un stepper que se
   *  frena en 10 se lee como un tope de la franja que estás editando y el
   *  prestador cree que otra franja podría más. */
  /** ⚠️ SOLO SE DICE SI SE SABE. Con el techo en fallback, "Hasta 1 en
   *  simultáneo" sería una regla inventada de la peor clase: suena
   *  específica y sale de no haber podido leer nada (L-180). Sin dato, la
   *  línea no nace. */
  const vozTecho = techoConocido && !servicioExclusivo ? t('horarios.cupoTecho', { n: techoDelOficio }) : null;
  const vozCupo = (cupo: number): string =>
    cupo === 1
      ? vozMascotas
        ? t('tallerGrooming.cupoUno')
        : t('horarios.cupoUno')
      : vozMascotas
        ? t('tallerGrooming.cupoVarios', { cantidad: cupo })
        : t('horarios.cupoVarios', { cantidad: cupo });

  const actualizarFranjas = (keys: string[], cambios: Partial<DraftFranja>) => {
    onCambio(franjas.map((f) => (keys.includes(f.key) ? { ...f, ...cambios } : f)));
  };

  // grupos de franjas: idénticas en horas+cupo+estado se muestran como UNA
  // (la edición dice a qué días pertenece — mandato v3)
  const vivasSinQuitar = franjas.filter((f) => !f.quitar);
  const porClave = new Map<string, DraftFranja[]>();
  for (const f of vivasSinQuitar) {
    const clave = `${f.horaInicio}|${f.horaFin}|${f.cupo}|${f.activo}`;
    porClave.set(clave, [...(porClave.get(clave) ?? []), f]);
  }
  const grupos = [...porClave.values()].sort((a, b) => a[0].horaInicio.localeCompare(b[0].horaInicio));

  const diasDeGrupo = (miembros: DraftFranja[]): string =>
    ORDEN_DISPLAY.filter((d) => miembros.some((f) => f.diaSemana === d))
      .map(letraDia)
      .join(' · ');

  // D-386: en por_servicio el grupo DICE a qué ofertas pertenece
  const serviciosDeGrupo = (miembros: DraftFranja[]): string =>
    ofertas
      .filter((o) => miembros.some((f) => f.servicioId === o.id))
      .map((o) => o.etiqueta)
      .join(' · ');

  const grupoEnHoja = hojaGrupo === null ? null : franjas.filter((f) => hojaGrupo.includes(f.key));

  // D-386: el cambio de elección — la RPC es EL camino; con franjas del
  // modo viejo, la Hoja ofrece eliminarlas y reintentar (jamás mezcla).
  async function tocarModo(nuevo: ModoHorarios) {
    if (nuevo === modo || modoOcupado) return;
    setModoOcupado(true);
    const r = await elegirModoHorarios(nuevo);
    setModoOcupado(false);
    if (r.ok) {
      mostrar({ variante: 'exito', texto: t('horarios.modoCambiado') });
      onModoCambiado();
      return;
    }
    if (r.codigo === 'franjas_del_otro_modo_existen') {
      setModoPendiente(nuevo);
      return;
    }
    mostrar({ variante: 'error', texto: r.mensaje });
  }

  async function confirmarCambioModo() {
    if (modoPendiente === null || modoOcupado) return;
    setModoOcupado(true);
    const del = await eliminarFranjasPrestador(prestadorId, empleadoSel ?? undefined);
    if (!del.ok) {
      setModoOcupado(false);
      mostrar({ variante: 'error', texto: del.mensaje });
      return;
    }
    const r = await elegirModoHorarios(modoPendiente);
    setModoOcupado(false);
    setModoPendiente(null);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    mostrar({ variante: 'exito', texto: t('horarios.modoCambiado') });
    onModoCambiado();
  }

  // S68-B8 — LA IDA: convertir (las generales pasan a vivir en cada
  // servicio, no se borra nada). Si el gesto traía una franja nueva
  // específica, se crea DESPUÉS de la conversión confirmada (letra del
  // pedido: directo al server — el refetch la trae de vuelta).
  async function confirmarConversion() {
    if (modoOcupado) return;
    setModoOcupado(true);
    const r = await convertirHorariosAPorServicio();
    if (!r.ok) {
      setModoOcupado(false);
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    if (franjaPendiente !== null) {
      let fallo = false;
      for (const dia of franjaPendiente.dias) {
        for (const sid of franjaPendiente.servicios) {
          const rf = await crearFranjaServicio({
            prestadorId,
            empleadoId: empleadoSel ?? undefined,
            servicioId: sid,
            diaSemana: dia,
            horaInicio: franjaPendiente.desde,
            horaFin: franjaPendiente.hasta,
            maxCitasPorSlot: franjaPendiente.cupo,
          });
          if (!rf.ok) {
            // la conversión YA está hecha — la franja que no entró se
            // dice con su causa; el refetch pinta la verdad
            mostrar({ variante: 'error', texto: `${vozDia(dia)}: ${rf.mensaje}` });
            fallo = true;
            break;
          }
        }
        if (fallo) break;
      }
    }
    setModoOcupado(false);
    setModoPendiente(null);
    setFranjaPendiente(null);
    // cohesión Ley 17.3: el CTA dijo "Convertir" — la confirmación
    // habla el mismo idioma
    mostrar({ variante: 'exito', texto: t('horarios.convertido') });
    onModoCambiado();
  }

  // D-386: el solape se compara SOLO dentro de la misma agenda — la
  // general contra generales; la de una oferta contra las de ESA oferta
  // (dos ofertas a la misma hora es legal: la ocupación del motor sigue
  // global y protege el cuerpo del prestador).
  const chocaCon = (dia: number, servicioId: string | null, desde: string, hasta: string, exceptoKeys: string[] = []) =>
    franjas.some(
      (f) =>
        !exceptoKeys.includes(f.key) &&
        !f.quitar &&
        f.diaSemana === dia &&
        f.servicioId === servicioId &&
        desde < f.horaFin &&
        f.horaInicio < hasta,
    );

  function agregarFranjasDraft() {
    if (desdeSel === null || hastaSel === null || diasSel.length === 0) return;
    const porServicio = modo === 'por_servicio';
    if (ofertas.length > 0 && ofertasSel.length === 0) {
      mostrar({ texto: t('horarios.ofertasNinguna'), variante: 'error' });
      return;
    }
    // S68-B8 — EL GESTO: en universal, una franja para ALGUNOS servicios
    // (no todos) dispara la conversión con voz; la franja queda
    // pendiente y se crea recién con la conversión CONFIRMADA
    if (!porServicio && ofertas.length > 0 && ofertasSel.length < ofertas.length) {
      setFranjaPendiente({
        dias: [...diasSel],
        desde: desdeSel,
        hasta: hastaSel,
        cupo: cupoSel,
        servicios: [...ofertasSel],
      });
      setCreandoFranja(false);
      setModoPendiente('por_servicio');
      return;
    }
    // la réplica D-386 (b): día × oferta marcada; en universal, día × [null]
    const servicios: (string | null)[] = porServicio ? ofertasSel : [null];
    // solape local por CADA combinación (el wrapper re-valida al guardar);
    // se chequea TODO antes de agregar — jamás un alta parcial
    for (const dia of diasSel) {
      for (const sid of servicios) {
        if (chocaCon(dia, sid, desdeSel, hastaSel)) {
          mostrar({ texto: `${vozDia(dia)}: ${t('horarios.solape')}`, variante: 'error' });
          return;
        }
      }
    }
    const nuevas: DraftFranja[] = diasSel.flatMap((dia) =>
      servicios.map((sid) => {
        contadorNuevas.current += 1;
        return {
          key: `nueva-${contadorNuevas.current}`,
          id: null,
          servicioId: sid,
          diaSemana: dia,
          horaInicio: desdeSel,
          horaFin: hastaSel,
          cupo: cupoSel,
          // 0 = TODAVÍA NO SÉ. Ver la nota de `techoDelOficio`: heredar acá el
        // fallback era la circularidad que produjo el bug de campo.
        cupoTecho: 0,
          activo: true,
          quitar: false,
          baseCupo: null,
          baseActivo: null,
          baseHoraInicio: null,
          baseHoraFin: null,
        };
      }),
    );
    onCambio([...franjas, ...nuevas]);
    setCreandoFranja(false);
  }

  // ── S78-B: derivaciones del bloque de Jornadas ──
  const personaActiva = personas?.find((p) => p.empleadoId === empleadoSel) ?? null;
  const patronTitular = personas?.find((p) => p.esTitular)?.patron ?? null;
  const patronVivo = resumenDeBorrador(franjas);
  const nadieConJornada =
    personas !== null &&
    patronVivo.length === 0 &&
    personas.every((p) => p.empleadoId === empleadoSel || (p.patron !== null && p.patron.length === 0));
  // la oferta del turno: persona elegida ≠ titular, el negocio TIENE
  // patrón, y la persona no lo está usando ya
  const ofreceTurno =
    personaActiva !== null &&
    !personaActiva.esTitular &&
    patronTitular !== null &&
    patronTitular.some((f) => f.activo) &&
    !patronIgual(patronVivo, patronTitular);

  const subtituloPersona = (p: PersonaJornada): string => {
    const patron = p.empleadoId === empleadoSel ? patronVivo : p.patron;
    const partes: string[] = [];
    if (p.esTitular) partes.push(t('horarios.jornadaTitular'));
    if (patron === null) return partes.join(' · '); // no se pudo leer: ni inventa ni miente
    if (patron.length === 0) {
      partes.push(t('horarios.jornadaSin'));
      return partes.join(' · ');
    }
    const rango = rangoDe(patron);
    if (rango === null) {
      partes.push(t('horarios.jornadaPausadaCard'));
      return partes.join(' · ');
    }
    if (!p.esTitular && patronTitular !== null && patronIgual(patron, patronTitular)) {
      partes.push(t('horarios.jornadaUsaTurno'));
    } else if (!p.esTitular) {
      partes.push(t('horarios.jornadaPropia'));
    }
    partes.push(rango);
    return partes.join(' · ');
  };

  return (
    <View style={{ gap: spacing[3] }}>
      {titulo}

      {/* ══ S78-B · JORNADAS — se monta SOLO con 2+ personas de este
          oficio (la regla dura: con una, el concepto no existe). El
          bloque va ARRIBA porque cambia el SUJETO de todo lo de abajo
          (momento-primero: la persona antes que los días). ══ */}
      {personas !== null && personas.length >= 2 && (
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{t('horarios.jornadas')}</Texto>
          <Texto variante="apoyo">{t('horarios.jornadasHint')}</Texto>
          <View style={{ gap: spacing[2.5], marginTop: spacing[1] }}>
            {personas.map((p) => (
              <TarjetaEstado
                key={p.empleadoId ?? 'titular'}
                encendido={p.empleadoId === empleadoSel}
                rol="radio"
                etiqueta={p.nombre}
                onPress={() => void tocarPersona(p.empleadoId)}
              >
                <View style={{ flex: 1, gap: spacing[0.5] }}>
                  <Texto variante="cuerpo">{p.nombre}</Texto>
                  <Texto variante="apoyo">{subtituloPersona(p)}</Texto>
                </View>
              </TarjetaEstado>
            ))}
          </View>

          {/* estado 2: nadie tiene jornada — voz con camino, jamás hueco */}
          {nadieConJornada && (
            <Tarjeta tinte="warning" relleno="amplio">
              <View style={{ gap: spacing[1] }}>
                <Texto variante="seccion">{t('horarios.nadieTitulo')}</Texto>
                <Texto variante="cuerpo">{t('horarios.nadieCuerpo')}</Texto>
              </View>
            </Tarjeta>
          )}

          {/* estados 4/6: el turno del negocio, ofrecido para copiar.
              ESTADO 6 FIRMADO: las citas ya pactadas SE CONSERVAN con su
              persona (el motor no ata citas a franjas) — el aviso es
              CONTEXTO junto al confirmar, contorno neutro, jamás muro.
              El CTA es secundario: el sólido de la pantalla es el
              Guardar del taller (Ley 19.2 — un sólido por superficie;
              delta declarado contra la lámina, que lo pintó lleno).
              v2 con número: espera el wrapper de A sobre
              `contar_citas_despegables` (pedido emitido).
              LUGAR RESERVADO (no dibujado): la cita conservada fuera
              del patrón vigente gana su marca de fila en el HOY/Semana
              (familia "Parte del plan") — se declara para agregar sin
              rehacer. Y el COLAPSO declarado: el derivado no tiene
              memoria — tras el cambio, la persona se lee "Jornada
              propia". */}
          {ofreceTurno && patronTitular !== null && (
            <View
              style={{
                borderWidth: theme.border.width,
                borderColor: theme.border.default,
                borderRadius: radius.md,
                padding: spacing[3],
                gap: spacing[2],
              }}
            >
              <Texto variante="seccion">
                {t('horarios.turnoTitulo', { rango: rangoDe(patronTitular) ?? '' })}
              </Texto>
              <Texto variante="cuerpo">
                {patronVivo.length > 0
                  ? t('horarios.turnoCuerpoPropia', { nombre: personaActiva.nombre })
                  : t('horarios.turnoCuerpoSin')}
              </Texto>
              {patronVivo.length > 0 && (
                <Texto variante="apoyo">{t('horarios.turnoCitasConservadas')}</Texto>
              )}
              <Boton
                variante="secundario"
                bloque
                etiqueta={t('horarios.turnoCta')}
                onPress={usarTurnoNegocio}
              />
            </View>
          )}
        </View>
      )}

      {/* D-386 (S62): LA ELECCIÓN — universal o por servicio, jamás
          mezcla (letra founder S60; el guard de DB la respalda). La
          explica dice la verdad del modo vigente.

          ══ S86-B · ④ DE LA PROPUESTA DE PAREDES — ESTE BLOQUE GANA SU
          SUPERFICIE, y es el único del cuerpo que la ganó. El criterio
          firmado: *merece superficie lo que el prestador puede TOCAR
          como una unidad*. Acá hay UNA decisión con consecuencias reales
          —cambiar el modo CONVIERTE franjas— y su explicación vive
          adentro porque explica ESA decisión, no la pantalla.

          ⚠️ Y ES LA ÚNICA QUE NO CHOCA: los otros dos candidatos de la
          propuesta (la lista de personas y la de franjas) ya son
          superficie A NIVEL DE FILA — `TarjetaEstado`, la gramática
          firmada en S78. Envolverlas sería la caja dentro de la caja que
          la propia propuesta prohíbe en su ⑦. Acá abajo NO hay ninguna
          superficie previa: son chips y prosa sobre el fondo. ══ */}
      <Tarjeta>
        <View style={{ gap: spacing[2] }}>
          <SelectorOpcion
            etiqueta={t('horarios.modoEtiqueta')}
            acento="oficio"
            solitario
            opciones={[
              { codigo: 'universal', etiqueta: t('horarios.modoUniversal') },
              { codigo: 'por_servicio', etiqueta: t('horarios.modoPorServicio') },
            ]}
            seleccionada={modo}
            onSelect={(codigo) => void tocarModo(codigo === 'por_servicio' ? 'por_servicio' : 'universal')}
          />
          <Texto variante="apoyo">
            {modo === 'universal' ? t('horarios.modoExplicaUniversal') : t('horarios.modoExplicaPorServicio')}
          </Texto>
        </View>
      </Tarjeta>
      <Texto variante="apoyo">{t('taller.horariosExplica')}</Texto>
      <SelectorOpcion
        etiqueta={t('taller.dias')}
        disposicion="fila"
        acento="oficio"
        multiple
        opciones={ORDEN_DISPLAY.map((dia) => ({ codigo: String(dia), etiqueta: letraDia(dia) }))}
        seleccionadas={diasSel.map(String)}
        onSelect={(codigo) => {
          const dia = Number.parseInt(codigo, 10);
          setDiasSel((prev) => (prev.includes(dia) ? prev.filter((x) => x !== dia) : [...prev, dia]));
        }}
      />
      <Boton
        variante="ghost"
        etiqueta={t('taller.todaLaSemana')}
        onPress={() => setDiasSel([...ORDEN_DISPLAY])}
      />
      <Boton
        variante="secundario"
        etiqueta={t('horarios.agregarFranja')}
        bloque
        deshabilitado={diasSel.length === 0}
        onPress={() => {
          setCreandoFranja(true);
          setVistaNueva('form');
          setDesdeSel(null);
          setHastaSel(null);
          setCupoSel(CUPO_NUEVA_FRANJA);
          setCupoBase(CUPO_NUEVA_FRANJA);
          // D-386: la réplica arranca con TODAS las ofertas marcadas —
          // desmarcar es el gesto raro, no el común
          setOfertasSel(ofertas.map((o) => o.id));
        }}
      />
      {grupos.length === 0 ? (
        <Texto variante="apoyo">{t('taller.sinFranjas')}</Texto>
      ) : (
        /* S78-B: la lista de ESTADO pasa a tarjetas separadas — la misma
           anatomía firmada en la Hoja del miembro (activa = superficie
           con sombra · pausada = contorno transparente): UNA gramática
           de "está ahí pero no rige" en toda la app del prestador. El
           on/off acá es ESTADO, no acción — el toque ABRE (rol button). */
        <View style={{ gap: spacing[2.5] }}>
          {grupos.map((miembros) => {
            const f = miembros[0];
            const partes = [diasDeGrupo(miembros)];
            // D-386: en por_servicio el grupo dice sus ofertas
            if (modo === 'por_servicio') {
              const voz = serviciosDeGrupo(miembros);
              if (voz.length > 0) partes.push(voz);
            }
            if (!f.activo) partes.push(t('horarios.pausada'));
            if (miembros.some((x) => x.id === null)) partes.push(t('taller.franjaNueva'));
            return (
              <TarjetaEstado
                key={f.key}
                encendido={f.activo}
                rol="button"
                etiqueta={`${vozCupo(f.cupo)} · ${partes.join(' · ')}`}
                onPress={() => {
                  setHojaGrupo(miembros.map((x) => x.key));
                  setCupoSel(f.cupo);
                  setCupoBase(f.cupo);
                  setDesdeEdit(f.horaInicio);
                  setHastaEdit(f.horaFin);
                  setVistaGrupo('form');
                  setConfirmandoQuitar(false);
                }}
              >
                <View style={{ flex: 1, gap: spacing[0.5] }}>
                  <Texto variante="cuerpo">{vozCupo(f.cupo)}</Texto>
                  <Texto variante="apoyo">{partes.join(' · ')}</Texto>
                </View>
                <Texto variante="dato">{`${f.horaInicio} – ${f.horaFin}`}</Texto>
              </TarjetaEstado>
            );
          })}
        </View>
      )}
      {/* vacaciones — la celda-puente vive con los horarios (§15b.5a) */}
      <Tarjeta relleno="ninguno">
        <Celda
          interactiva
          accessibilityRole="button"
          titulo={t('negocio.vacaciones')}
          subtitulo={t('negocio.vacacionesDetalle')}
          onPress={() => router.push('/vacaciones')}
        />
      </Tarjeta>

      {/* Hoja: grupo de franjas — DICE a qué días pertenece (v3) */}
      <Hoja
        visible={grupoEnHoja !== null && grupoEnHoja.length > 0}
        onCerrar={() => setHojaGrupo(null)}
        titulo={
          grupoEnHoja !== null && grupoEnHoja.length > 0
            ? `${grupoEnHoja[0].horaInicio} – ${grupoEnHoja[0].horaFin}`
            : ''
        }
      >
        {grupoEnHoja !== null && grupoEnHoja.length > 0 && vistaGrupo !== 'form' ? (
          // S61-B5: el picker de horas de la EDICIÓN — la misma grilla
          <ListaHoras
            etiqueta={t(vistaGrupo === 'hasta' ? 'horarios.hasta' : 'horarios.desde')}
            seleccionada={vistaGrupo === 'hasta' ? hastaEdit : desdeEdit}
            minimo={vistaGrupo === 'hasta' ? desdeEdit : null}
            onElegir={(h) => {
              if (vistaGrupo === 'desde') {
                setDesdeEdit(h);
                if (hastaEdit !== null && hastaEdit <= h) setHastaEdit(null);
              } else {
                setHastaEdit(h);
              }
              setVistaGrupo('form');
            }}
          />
        ) : grupoEnHoja !== null && grupoEnHoja.length > 0 ? (
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            <Texto variante="apoyo">{t('taller.diasAplica', { dias: diasDeGrupo(grupoEnHoja) })}</Texto>
            {!confirmandoQuitar ? (
              <>
                {/* S61-B5 (D-391): las HORAS se editan en su lugar —
                    murió el eliminar+crear como único camino */}
                <Tarjeta relleno="ninguno">
                  <Celda
                    interactiva
                    accessibilityRole="button"
                    titulo={t('horarios.desde')}
                    metadataMono={desdeEdit ?? undefined}
                    onPress={() => setVistaGrupo('desde')}
                  />
                  <Separador />
                  <Celda
                    interactiva
                    accessibilityRole="button"
                    titulo={t('horarios.hasta')}
                    metadataMono={hastaEdit ?? undefined}
                    subtitulo={hastaEdit === null ? t('horarios.horaElegir') : undefined}
                    onPress={() => setVistaGrupo('hasta')}
                  />
                </Tarjeta>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.base,
                      color: theme.text.primary,
                    }}
                  >
                    {vozCupoTitulo}
                  </Text>
                  {servicioExclusivo ? (
                    <Texto variante="apoyo">{t('horarios.cupoExclusivo')}</Texto>
                  ) : (
                    <StepperCantidad
                      etiqueta={vozCupoTitulo}
                      registro="oficio"
                      valor={cupoSel}
                      min={1}
                      max={topeCupo}
                      onCambio={setCupoSel}
                    />
                  )}
                </View>
                <Texto variante="apoyo">{vozCupoAyuda}</Texto>
                {vozTecho !== null && <Texto variante="apoyo">{vozTecho}</Texto>}
                <Boton
                  variante="primario"
                  etiqueta={t('taller.listo')}
                  bloque
                  deshabilitado={desdeEdit === null || hastaEdit === null}
                  onPress={() => {
                    if (desdeEdit === null || hastaEdit === null) return;
                    // solape en BORRADOR por cada día del grupo, contra
                    // las franjas AJENAS al grupo (el wrapper re-valida
                    // al guardar con exclusión de la propia)
                    const keys = grupoEnHoja.map((f) => f.key);
                    for (const m of grupoEnHoja) {
                      // D-386: el solape es POR AGENDA (general o de su oferta)
                      if (chocaCon(m.diaSemana, m.servicioId, desdeEdit, hastaEdit, keys)) {
                        mostrar({ texto: `${vozDia(m.diaSemana)}: ${t('horarios.solape')}`, variante: 'error' });
                        return;
                      }
                    }
                    actualizarFranjas(keys, { cupo: cupoSel, horaInicio: desdeEdit, horaFin: hastaEdit });
                    setHojaGrupo(null);
                  }}
                />
                <Boton
                  variante="ghost"
                  etiqueta={grupoEnHoja[0].activo ? t('horarios.pausar') : t('horarios.reactivar')}
                  bloque
                  onPress={() => {
                    actualizarFranjas(grupoEnHoja.map((f) => f.key), { activo: !grupoEnHoja[0].activo });
                    setHojaGrupo(null);
                  }}
                />
                <Boton variante="destructivo" etiqueta={t('horarios.quitar')} bloque onPress={() => setConfirmandoQuitar(true)} />
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.base,
                    lineHeight: typography.size.base * typography.leading.normal,
                    color: theme.text.secondary,
                  }}
                >
                  {t('horarios.quitarConfirmacion')}
                </Text>
                <Boton
                  variante="destructivo"
                  etiqueta={t('horarios.quitarConfirmar')}
                  bloque
                  onPress={() => {
                    const keys = grupoEnHoja.map((f) => f.key);
                    onCambio(
                      franjas
                        .filter((f) => !(keys.includes(f.key) && f.id === null))
                        .map((f) => (keys.includes(f.key) ? { ...f, quitar: true } : f)),
                    );
                    setHojaGrupo(null);
                    setConfirmandoQuitar(false);
                  }}
                />
                <Boton variante="ghost" etiqueta={t('horarios.cancelar')} bloque onPress={() => setConfirmandoQuitar(false)} />
              </>
            )}
          </View>
        ) : null}
      </Hoja>

      {/* Hoja: nueva franja — aplica a los DÍAS MARCADOS (v3) */}
      <Hoja
        visible={creandoFranja}
        onCerrar={() => setCreandoFranja(false)}
        titulo={vistaNueva === 'form' ? t('horarios.nuevaTitulo') : t('horarios.horaElegir')}
        altura="media"
      >
        {vistaNueva === 'form' ? (
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            <Texto variante="apoyo">
              {t('taller.diasAplica', { dias: ORDEN_DISPLAY.filter((d) => diasSel.includes(d)).map(letraDia).join(' · ') })}
            </Texto>
            {/* D-386 (b): en por_servicio la franja se REPLICA a las
                ofertas marcadas (todas por default). S68-B8: el selector
                vive TAMBIÉN en universal — desmarcar es el gesto que
                dispara la conversión con voz (todas marcadas = franja
                general, como siempre). */}
            {ofertas.length > 0 && (
              <>
                <SelectorOpcion
                  etiqueta={t('horarios.ofertasAplica')}
                  acento="oficio"
                  multiple
                  disposicion={ofertas.length > 4 ? 'grilla' : 'fila'}
                  opciones={ofertas.map((o) => ({ codigo: o.id, etiqueta: o.etiqueta }))}
                  seleccionadas={ofertasSel}
                  onSelect={(codigo) =>
                    setOfertasSel((prev) =>
                      prev.includes(codigo) ? prev.filter((x) => x !== codigo) : [...prev, codigo],
                    )
                  }
                />
                {modo === 'universal' && ofertasSel.length < ofertas.length && (
                  <Texto variante="apoyo">{t('horarios.ofertasAplicaUniversal')}</Texto>
                )}
              </>
            )}
            <Tarjeta relleno="ninguno">
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('horarios.desde')}
                metadataMono={desdeSel ?? undefined}
                subtitulo={desdeSel === null ? t('horarios.horaElegir') : undefined}
                onPress={() => setVistaNueva('desde')}
              />
              <Separador />
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('horarios.hasta')}
                metadataMono={hastaSel ?? undefined}
                subtitulo={hastaSel === null ? t('horarios.horaElegir') : undefined}
                onPress={() => setVistaNueva('hasta')}
              />
            </Tarjeta>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  color: theme.text.primary,
                }}
              >
                {vozCupoTitulo}
              </Text>
              {servicioExclusivo ? (
                <Texto variante="apoyo">{t('horarios.cupoExclusivo')}</Texto>
              ) : (
                <StepperCantidad
                  etiqueta={vozCupoTitulo}
                  registro="oficio"
                  valor={cupoSel}
                  min={1}
                  max={topeCupo}
                  onCambio={setCupoSel}
                />
              )}
            </View>
            <Texto variante="apoyo">{vozCupoAyuda}</Texto>
            <Boton
              variante="primario"
              etiqueta={t('taller.agregarFranjaListo')}
              bloque
              deshabilitado={desdeSel === null || hastaSel === null || diasSel.length === 0}
              onPress={agregarFranjasDraft}
            />
          </View>
        ) : (
          <ListaHoras
            etiqueta={t(vistaNueva === 'hasta' ? 'horarios.hasta' : 'horarios.desde')}
            seleccionada={vistaNueva === 'hasta' ? hastaSel : desdeSel}
            minimo={vistaNueva === 'hasta' && desdeSel !== null ? desdeSel : null}
            onElegir={(h) => {
              if (vistaNueva === 'desde') {
                setDesdeSel(h);
                if (hastaSel !== null && hastaSel <= h) setHastaSel(null);
              } else {
                setHastaSel(h);
              }
              setVistaNueva('form');
            }}
          />
        )}
      </Hoja>

      {/* Hoja D-386 + S68-B8: el cambio de modo bifurca por DIRECCIÓN.
          IDA (→ por_servicio) = CONVERSIÓN con voz — las generales pasan
          a vivir en cada servicio, no se borra nada (RPC A9).
          VUELTA (→ universal) = DESTRUCTIVA — las específicas se borran
          y el horario se declara de nuevo (CTA rojo de la casa). */}
      <Hoja
        visible={modoPendiente !== null}
        onCerrar={() => {
          if (!modoOcupado) {
            setModoPendiente(null);
            setFranjaPendiente(null);
          }
        }}
        titulo={
          modoPendiente === 'por_servicio' ? t('horarios.convertirTitulo') : t('horarios.modoCambiarTitulo')
        }
      >
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.base,
              lineHeight: typography.size.base * typography.leading.normal,
              color: theme.text.secondary,
            }}
          >
            {modoPendiente === 'por_servicio' ? t('horarios.convertirVoz') : t('horarios.volverVoz')}
          </Text>
          {/* mitad UI de D-409: los borradores vivos se avisan ANTES de
              la recarga que los perdería — jamás en silencio */}
          {hayBorradorExterno === true && <Texto variante="apoyo">{t('horarios.modoBorradorAviso')}</Texto>}
          {modoPendiente === 'por_servicio' ? (
            <Boton
              variante="primario"
              etiqueta={t('horarios.convertirCta')}
              bloque
              cargando={modoOcupado}
              onPress={() => void confirmarConversion()}
            />
          ) : (
            <Boton
              variante="destructivo"
              etiqueta={t('horarios.modoCambiarConfirmar')}
              bloque
              cargando={modoOcupado}
              onPress={() => void confirmarCambioModo()}
            />
          )}
          <Boton
            variante="ghost"
            etiqueta={t('horarios.cancelar')}
            bloque
            onPress={() => {
              if (!modoOcupado) {
                setModoPendiente(null);
                setFranjaPendiente(null);
              }
            }}
          />
        </View>
      </Hoja>
    </View>
  );
}
