// LA JORNADA VE AL VET (S69-B, M0) — el CUARTO gemelo de los lectores
// del día. El HOY del prestador compone UNA sola jornada (paseo +
// grooming + adiestramiento + veterinaria); este wrapper es el lado
// VETERINARIA de esa lista, en SOLO LECTURA. El motor de la atención
// clínica (el Durante, el registro por procedencia) es la tanda V4 — acá
// nace únicamente lo que M0 necesita: que la cita vet APAREZCA en la
// jornada y sea tapeable.
//
// EL DISCRIMINADOR — es_medico, no una sola categoría (relevado contra
// DB VIVA, regla 40/L-144): los tipos vet NO comparten un único valor de
// `categoria` como paseo/grooming/adiestramiento —
//   consulta_general · vacunacion · consulta_especializada · cirugia ·
//   urgencia_local · urgencia_domicilio · laboratorio · radiografia ·
//   ecografia · certificados     → categoria='veterinario'
//   telemedicina                 → categoria='telemedicina'
//   emergencia                   → categoria='emergencia'
// La única columna que los une es `tipos_servicio.es_medico=true` — el
// MISMO discriminador que usa `veterinaria-oferta.ts` (una sola verdad de
// "qué es vet"). Los otros tres oficios son es_medico=false → la jornada
// nunca doble-cuenta (los 4 conjuntos son disjuntos). Los procedimientos
// ('otro', es_medico=false, reservable=false) NO entran a la jornada por
// este lector: llegan por presupuesto aprobado (V4) — declarado.
//
// Reusa el shape CitaAgendaPaseo (la generalización que ya sirve a los
// tres gemelos vivos) para que el HOY componga sin ramas de tipo.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import { parseDireccionSnapshot, type CitaAgendaPaseo, type InputCitasPaseoDelDia } from './paseo';

// ── Errores tipados (el lector solo levanta ausencia / forma) ───────────────
const CODIGOS_VET_ATENCION = ['cita_no_encontrada', 'datos_inconsistentes'] as const;
export type CodigoErrorVetAtencion = (typeof CODIGOS_VET_ATENCION)[number];

const MENSAJES: Record<CodigoErrorVetAtencion | 'error_desconocido', string> = {
  cita_no_encontrada: 'La cita no existe o ya no es accesible.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido: 'Ocurrió un error inesperado. Probá de nuevo.',
};

function fallo<T>(raw: string): ResultadoWrapper<T, CodigoErrorVetAtencion> {
  const codigo = (CODIGOS_VET_ATENCION as readonly string[]).find((c) => raw.startsWith(c)) as
    | CodigoErrorVetAtencion
    | undefined;
  const c = codigo ?? 'error_desconocido';
  return { ok: false, codigo: (c === 'error_desconocido' ? 'datos_inconsistentes' : c) as CodigoErrorVetAtencion, mensaje: MENSAJES[c] };
}

const SELECT_CITA =
  'id, fecha, hora, estado, tipo_servicio, suscripcion_servicio_id, duracion_minutos, direccion_snapshot, metadata, mascota:mascotas(id, nombre, especie, foto_url), tipo:tipos_servicio!inner(nombre, duracion_default_minutos), atencion:evento_atencion(estado, iniciada_en), presupuesto:presupuesto(items:presupuesto_item(id, descripcion_libre, created_at))';

/** El origen releído desde metadata (S70-B1). Hoy la fila distingue el
 *  walk-in del mostrador ('mostrador') de la reserva in-app (sin origen). */
function origenDeCita(metadata: unknown): string | null {
  if (metadata !== null && typeof metadata === 'object' && 'origen' in metadata) {
    const o = (metadata as { origen: unknown }).origen;
    return typeof o === 'string' ? o : null;
  }
  return null;
}

/** La descripción del presupuesto de una cita `procedimiento` (S72-A, Pieza 3).
 *  DATOS, NO PROSA: `primera` = descripcion_libre del primer ítem por
 *  `created_at` (la tabla no tiene `orden`); `extras` = cuántos ítems más.
 *  null si la cita no tiene presupuesto o el presupuesto no trae ítems. El
 *  embed `presupuesto` es to-one (o array de uno según PostgREST): se maneja
 *  ambas formas. Si la RLS ocultara los ítems, cae a null (B pinta
 *  "Procedimiento") — degradación honesta, Ley 13. */
function descripcionDePresupuesto(presupuesto: unknown): { primera: string | null; extras: number } | null {
  const pres = Array.isArray(presupuesto) ? presupuesto[0] : presupuesto;
  if (pres === null || pres === undefined || typeof pres !== 'object') return null;
  const items = (pres as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;
  // Orden: created_at, con `id` de desempate. La tabla no tiene `orden`, y
  // los ítems de un mismo presupuesto se insertan en batch → created_at
  // IDÉNTICO (relevado): sin el desempate por id, `primera` variaría entre
  // renders. `id` (uuid) lo hace DETERMINISTA — arbitrario pero estable.
  const clave = (x: unknown) =>
    String((x as { created_at?: unknown }).created_at ?? '') + '|' + String((x as { id?: unknown }).id ?? '');
  const ordenados = [...items].sort((a, b) => {
    const ka = clave(a);
    const kb = clave(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  const primeraRaw = (ordenados[0] as { descripcion_libre?: unknown }).descripcion_libre;
  return {
    primera: typeof primeraRaw === 'string' ? primeraRaw : null,
    extras: ordenados.length - 1,
  };
}

// ── Agenda: las citas de veterinaria del día/rango (espejo de los 3) ────────
// Mismo shape CitaAgendaPaseo. direccion = null en la LISTA (el HOY no la
// pinta); el detalle por id sí trae el snapshot (urgencia a domicilio lo
// porta, D-339).

export async function obtenerCitasVetDelDia(
  input: InputCitasPaseoDelDia,
): Promise<ResultadoWrapper<CitaAgendaPaseo[], CodigoErrorVetAtencion>> {
  const { data, error } = await getClient()
    .from('evento_cita_servicio')
    .select(SELECT_CITA)
    .eq('prestador_id', input.prestador_id)
    .gte('fecha', input.fecha)
    .lte('fecha', input.fecha_hasta ?? input.fecha)
    // EL DISCRIMINADOR vet — es_medico (ver cabecera), no una categoría única.
    .eq('tipo.es_medico', true)
    // VERDAD FIRME — misma lista positiva de la puerta del paseo.
    .in('estado', ['confirmada', 'en_curso', 'completada', 'no_show'])
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });

  if (error) return fallo(error.message);
  const citas: CitaAgendaPaseo[] = (data ?? []).map((c) => {
    const atenciones = (c.atencion ?? []) as { estado: string; iniciada_en: string }[];
    const atencion =
      atenciones.length === 0
        ? null
        : atenciones.reduce((a, b) => (b.iniciada_en > a.iniciada_en ? b : a));
    const { direccion_snapshot: _snap, metadata, presupuesto, ...resto } = c;
    return {
      ...resto,
      atencion,
      direccion: null,
      origen: origenDeCita(metadata),
      descripcionPresupuesto: descripcionDePresupuesto(presupuesto),
    };
  });
  return { ok: true, data: citas };
}

/** UNA cita de veterinaria por su id — el destino del tap de la jornada.
 *  La RLS (cita_select_prestador) es el guard; misma verdad firme y mismo
 *  shape que la lista, + el snapshot D-339 (urgencia a domicilio lo lleva). */
export async function obtenerCitaVetPorId(
  citaId: string,
): Promise<ResultadoWrapper<CitaAgendaPaseo, CodigoErrorVetAtencion>> {
  const { data, error } = await getClient()
    .from('evento_cita_servicio')
    .select(SELECT_CITA)
    .eq('id', citaId)
    .eq('tipo.es_medico', true)
    .in('estado', ['confirmada', 'en_curso', 'completada', 'no_show'])
    .maybeSingle();

  if (error) return fallo(error.message);
  if (data === null) return fallo('cita_no_encontrada');
  const atenciones = (data.atencion ?? []) as { estado: string; iniciada_en: string }[];
  const atencion =
    atenciones.length === 0
      ? null
      : atenciones.reduce((a, b) => (b.iniciada_en > a.iniciada_en ? b : a));
  const { direccion_snapshot, metadata, presupuesto, ...resto } = data;
  return {
    ok: true,
    data: {
      ...resto,
      atencion,
      direccion: parseDireccionSnapshot(direccion_snapshot),
      origen: origenDeCita(metadata),
      descripcionPresupuesto: descripcionDePresupuesto(presupuesto),
    },
  };
}
