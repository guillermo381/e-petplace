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
 */

import { useRef, useState } from 'react';
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
  spacing,
  typography,
  useAviso,
  useTheme,
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
  type FranjaHorario,
  type ModoHorarios,
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

// grilla v1: pasos de 30 min, 05:00–22:00 (heredada de /horarios S55-B)
const HORAS: string[] = [];
for (let m = 5 * 60; m <= 22 * 60; m += 30) {
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
              servicioId: f.servicioId,
              diaSemana: f.diaSemana,
              horaInicio: f.horaInicio,
              horaFin: f.horaFin,
              maxCitasPorSlot: f.cupo,
            })
          : await crearFranjaHorario({
              prestadorId,
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
 *  nueva y la edición del grupo, S61-B5). */
function ListaHoras({ minimo, onElegir }: { minimo: string | null; onElegir: (h: string) => void }) {
  return (
    <HojaScroll>
      {HORAS.filter((h) => (minimo !== null ? h > minimo : true)).map((h, i) => (
        <View key={h}>
          {i > 0 && <Separador />}
          <Celda interactiva accessibilityRole="button" titulo={h} onPress={() => onElegir(h)} />
        </View>
      ))}
    </HojaScroll>
  );
}


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
  const [cupoSel, setCupoSel] = useState(1);
  const contadorNuevas = useRef(0);

  const vozDia = (dia: number): string => t(`horarios.dia${dia as 0 | 1 | 2 | 3 | 4 | 5 | 6}` as const);
  const letraDia = (dia: number): string => t(`taller.diaCorto${dia as 0 | 1 | 2 | 3 | 4 | 5 | 6}` as const);
  // la voz del cupo POR OFICIO (S59-B6 cura 2; S68-B: solo el paseo
  // dice "paseos" — el resto de los oficios habla de mascotas)
  const vozMascotas = oficio !== 'paseo';
  const vozCupoTitulo = vozMascotas ? t('tallerGrooming.cupo') : t('horarios.cupo');
  const vozCupoAyuda = vozMascotas ? t('tallerGrooming.cupoAyuda') : t('horarios.cupoAyuda');
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
    const del = await eliminarFranjasPrestador(prestadorId);
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

  return (
    <View style={{ gap: spacing[3] }}>
      {titulo}
      {/* D-386 (S62): LA ELECCIÓN — universal o por servicio, jamás
          mezcla (letra founder S60; el guard de DB la respalda). La
          explica dice la verdad del modo vigente. */}
      <SelectorOpcion
        etiqueta={t('horarios.modoEtiqueta')}
        acento="oficio"
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
          setCupoSel(1);
          // D-386: la réplica arranca con TODAS las ofertas marcadas —
          // desmarcar es el gesto raro, no el común
          setOfertasSel(ofertas.map((o) => o.id));
        }}
      />
      {grupos.length === 0 ? (
        <Texto variante="apoyo">{t('taller.sinFranjas')}</Texto>
      ) : (
        <Tarjeta relleno="ninguno">
          {grupos.map((miembros, i) => {
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
              <View key={f.key}>
                {i > 0 && <Separador />}
                <Celda
                  interactiva
                  accessibilityRole="button"
                  titulo={vozCupo(f.cupo)}
                  subtitulo={partes.join(' · ')}
                  metadataMono={`${f.horaInicio} – ${f.horaFin}`}
                  onPress={() => {
                    setHojaGrupo(miembros.map((x) => x.key));
                    setCupoSel(f.cupo);
                    setDesdeEdit(f.horaInicio);
                    setHastaEdit(f.horaFin);
                    setVistaGrupo('form');
                    setConfirmandoQuitar(false);
                  }}
                />
              </View>
            );
          })}
        </Tarjeta>
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
                  <StepperCantidad
                    etiqueta={vozCupoTitulo}
                    registro="oficio"
                    valor={cupoSel}
                    min={1}
                    max={4}
                    onCambio={setCupoSel}
                  />
                </View>
                <Texto variante="apoyo">{vozCupoAyuda}</Texto>
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
              <StepperCantidad
                etiqueta={vozCupoTitulo}
                registro="oficio"
                valor={cupoSel}
                min={1}
                max={4}
                onCambio={setCupoSel}
              />
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
          <HojaScroll>
            {HORAS.filter((h) => (vistaNueva === 'hasta' && desdeSel !== null ? h > desdeSel : true)).map((h, i) => (
              <View key={h}>
                {i > 0 && <Separador />}
                <Celda
                  interactiva
                  accessibilityRole="button"
                  titulo={h}
                  onPress={() => {
                    if (vistaNueva === 'desde') {
                      setDesdeSel(h);
                      if (hastaSel !== null && hastaSel <= h) setHastaSel(null);
                    } else {
                      setHastaSel(h);
                    }
                    setVistaNueva('form');
                  }}
                />
              </View>
            ))}
          </HojaScroll>
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
