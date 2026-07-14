// Estado del hogar (S51-B2.2): las señales por mascota para las tres
// voces (calcularVozHogar de @epetplace/domain las consume) + lo que la
// Zona 2 necesita (atención en curso, próxima cita). Solo lecturas; la
// RLS es la puerta (atencion_select / perfil_vigente_select /
// cita_select_por_acceso — relevadas S51: todas por
// user_tiene_acceso_a_mascota, el dueño entra).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos leer el estado del hogar. Probá de nuevo.';

export interface SenalesHogarMascota {
  mascota_id: string;
  tiene_emergencia_activa: boolean;
  vacunas_total: number;
  /** Máxima fecha_aplicada (ISO date) o null. */
  ultima_vacuna_aplicada: string | null;
  /** Mínima fecha_proxima registrada con su vacuna, o null (hoy la
   *  extracción del carnet no llena fecha_proxima — null honesto). */
  proxima_vacuna: { nombre: string; fecha: string } | null;
  /** Máxima cerrada_en de atenciones cerradas con calidad, o null. */
  ultima_atencion_cerrada: string | null;
}

export interface AtencionEnCursoHogar {
  atencion_id: string;
  mascota_id: string;
  iniciada_en: string | null;
  /** S60 (hunk aditivo A): el oficio de la atención — la celda viva del
   *  Hogar dice la verdad ("Paseo en curso" / "Estética en curso");
   *  null = sin evento raíz legible (voz genérica). */
  oficio: 'paseo' | 'grooming' | null;
}

export interface ProximaCitaHogar {
  cita_id: string;
  mascota_id: string;
  /** ISO date. */
  fecha: string;
  /** HH:MM o null. */
  hora: string | null;
  tipo_servicio: string | null;
  /** 'hold' = bloqueo de agenda VIGENTE (pendiente_pago, dentro de los
   *  15 min); 'firme' = confirmada (pagada, o NULL = ciclo de pago no
   *  aplica — legacy/walk-in). La Zona 2 les da voz distinta (D-319). */
  reserva: 'hold' | 'firme';
  /** La calle del snapshot D-339 (direccion_snapshot.direccion), o null
   *  honesto — citas pre-D-339 no lo tienen. Patrón Hogar v2 (S58). */
  direccion: string | null;
}

/** Próxima cita POR MASCOTA (patrón Hogar v2, S58): la ficha de cada
 *  mascota muestra su próxima cita — derivado de las MISMAS citas ya
 *  pedidas para proxima_cita, cero query extra. */
export interface ProximaCitaMascota {
  fecha: string;
  hora: string | null;
}

export interface EstadoHogar {
  /** Una entrada por mascota pedida (aunque no tenga datos: señales en cero). */
  senales: SenalesHogarMascota[];
  /** TODAS las atenciones en_curso del hogar, la más reciente primero
   *  (S59 §7.5 — multi-mascota primera clase: dos paseos simultáneos
   *  jamás se pisan; antes solo viajaba la más reciente). Vacía = nada
   *  en vivo. */
  atenciones_en_curso: AtencionEnCursoHogar[];
  /** La cita futura más próxima del hogar — firme (confirmada) o hold
   *  VIGENTE del propio hogar —, o null. El hold vencido no existe
   *  (D-319: su `estado` queda 'pendiente' para siempre; acá se filtra
   *  por `estado_reserva` + `expira_en`). */
  proxima_cita: ProximaCitaHogar | null;
  /** Próxima cita firme/hold vigente POR mascota (S58, patrón v2). */
  proxima_cita_por_mascota: Record<string, ProximaCitaMascota>;
}

// Fecha local del dispositivo YYYY-MM-DD (patrón S44: en-CA da ese formato).
function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

export async function obtenerEstadoHogar(
  mascotaIds: string[],
): Promise<ResultadoWrapper<EstadoHogar, 'error_estado_hogar'>> {
  if (mascotaIds.length === 0) {
    return { ok: true, data: { senales: [], atenciones_en_curso: [], proxima_cita: null, proxima_cita_por_mascota: {} } };
  }

  const cliente = getClient();
  const [vacunas, perfiles, atenciones, citas] = await Promise.all([
    cliente
      .from('evento_vacuna_aplicada')
      .select('mascota_id, nombre_vacuna, fecha_aplicada, fecha_proxima')
      .in('mascota_id', mascotaIds),
    cliente
      .from('mascota_perfil_vigente')
      .select('mascota_id, tiene_emergencia_activa')
      .in('mascota_id', mascotaIds),
    cliente
      .from('evento_atencion')
      .select('id, mascota_id, estado, iniciada_en, cerrada_en, evento_id')
      .in('mascota_id', mascotaIds)
      .in('estado', ['en_curso', 'cerrada_con_calidad']),
    cliente
      .from('evento_cita_servicio')
      .select('id, mascota_id, fecha, hora, tipo_servicio, estado, estado_reserva, expira_en, direccion_snapshot')
      .in('mascota_id', mascotaIds)
      .in('estado', ['pendiente', 'confirmada'])
      .gte('fecha', hoyLocal())
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true, nullsFirst: false })
      .limit(10),
  ]);

  if (vacunas.error || perfiles.error || atenciones.error || citas.error) {
    return { ok: false, codigo: 'error_estado_hogar', mensaje: MENSAJE_ERROR };
  }

  const senales: SenalesHogarMascota[] = mascotaIds.map((id) => {
    const vs = vacunas.data.filter((v) => v.mascota_id === id);
    const perfil = perfiles.data.find((p) => p.mascota_id === id);

    let ultimaAplicada: string | null = null;
    let proxima: { nombre: string; fecha: string } | null = null;
    for (const v of vs) {
      if (v.fecha_aplicada !== null && (ultimaAplicada === null || v.fecha_aplicada > ultimaAplicada)) {
        ultimaAplicada = v.fecha_aplicada;
      }
      if (v.fecha_proxima !== null && (proxima === null || v.fecha_proxima < proxima.fecha)) {
        proxima = { nombre: v.nombre_vacuna, fecha: v.fecha_proxima };
      }
    }

    let ultimaCerrada: string | null = null;
    for (const a of atenciones.data) {
      if (a.mascota_id === id && a.estado === 'cerrada_con_calidad' && a.cerrada_en !== null) {
        if (ultimaCerrada === null || a.cerrada_en > ultimaCerrada) ultimaCerrada = a.cerrada_en;
      }
    }

    return {
      mascota_id: id,
      tiene_emergencia_activa: perfil?.tiene_emergencia_activa ?? false,
      vacunas_total: vs.length,
      ultima_vacuna_aplicada: ultimaAplicada,
      proxima_vacuna: proxima,
      ultima_atencion_cerrada: ultimaCerrada,
    };
  });

  // S59 §7.5 — TODAS las en_curso, la más reciente primero (antes se
  // quedaba solo la última y dos paseos simultáneos se pisaban).
  const vivas = atenciones.data
    .filter((a) => a.estado === 'en_curso')
    .sort((a, b) => ((a.iniciada_en ?? '') > (b.iniciada_en ?? '') ? -1 : 1));

  // S60 (hunk aditivo A): el OFICIO por atención viva — del tipo del
  // evento raíz ('atencion_paseo_registrada' / 'atencion_grooming_
  // registrada'). Solo se consulta si hay algo vivo (cero costo en el
  // hogar quieto); un fallo deja oficio null y la celda usa voz genérica.
  const tipoPorEvento = new Map<string, string>();
  const eventoIds = vivas.map((a) => a.evento_id).filter((id): id is string => id !== null);
  if (eventoIds.length > 0) {
    const tipos = await cliente.from('eventos_mascota').select('id, tipo').in('id', eventoIds);
    if (!tipos.error) {
      for (const e of tipos.data) tipoPorEvento.set(e.id, e.tipo);
    }
  }
  const oficioDe = (eventoId: string | null): 'paseo' | 'grooming' | null => {
    const tipo = eventoId !== null ? tipoPorEvento.get(eventoId) : undefined;
    if (tipo === 'atencion_paseo_registrada') return 'paseo';
    if (tipo === 'atencion_grooming_registrada') return 'grooming';
    return null;
  };

  const enCurso: AtencionEnCursoHogar[] = vivas.map((a) => ({
    atencion_id: a.id,
    mascota_id: a.mascota_id,
    iniciada_en: a.iniciada_en,
    oficio: oficioDe(a.evento_id),
  }));

  // Cura D-319: 'pendiente' solo entra como hold VIGENTE del bloqueo
  // de 15 min (estado_reserva='pendiente_pago' y expira_en futuro) —
  // el hold vencido queda 'pendiente' para siempre (el cron solo barre
  // estado_reserva) y con limit(1) TAPABA a la cita pagada de más
  // tarde. Expiración perezosa (S54): un hold vencido se trata como
  // inexistente; el reloj del dispositivo solo decide DISPLAY — la
  // correctitud la gatea el server. limit(10): sobran para un hogar;
  // si los 10 fueran holds muertos (irreal), la zona calla — jamás
  // pinta verosímil-falso (L-139).
  const ahora = Date.now();
  const esHoldVigente = (c: { estado: string | null; estado_reserva: string | null; expira_en: string | null }) =>
    c.estado === 'pendiente' &&
    c.estado_reserva === 'pendiente_pago' &&
    c.expira_en !== null &&
    Date.parse(c.expira_en) > ahora;

  // Guard de shape (L-124): el filtro garantiza mascota_id/fecha no
  // nulos, pero el tipo generado no lo sabe — se angosta verificando,
  // jamás con cast (regla 34).
  // La calle del snapshot D-339 — solo la línea que el Hogar pinta;
  // el shape completo vive en paseo.ts (parseDireccionSnapshot).
  const calleDe = (v: unknown): string | null => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
    const d = (v as Record<string, unknown>)['direccion'];
    return typeof d === 'string' && d.length > 0 ? d : null;
  };

  const cita = citas.data.find((c) => c.estado === 'confirmada' || esHoldVigente(c));
  const proximaCita: ProximaCitaHogar | null =
    cita !== undefined && cita.mascota_id !== null && cita.fecha !== null
      ? {
          cita_id: cita.id,
          mascota_id: cita.mascota_id,
          fecha: cita.fecha,
          hora: cita.hora !== null ? cita.hora.slice(0, 5) : null,
          tipo_servicio: cita.tipo_servicio,
          reserva: cita.estado === 'confirmada' ? 'firme' : 'hold',
          direccion: calleDe(cita.direccion_snapshot),
        }
      : null;

  // Por mascota (S58): la primera cita real de cada una — las citas ya
  // vienen ordenadas por fecha/hora ascendente.
  const porMascota: Record<string, ProximaCitaMascota> = {};
  for (const c of citas.data) {
    if (c.mascota_id === null || c.fecha === null) continue;
    if (porMascota[c.mascota_id] !== undefined) continue;
    if (c.estado === 'confirmada' || esHoldVigente(c)) {
      porMascota[c.mascota_id] = { fecha: c.fecha, hora: c.hora !== null ? c.hora.slice(0, 5) : null };
    }
  }

  return {
    ok: true,
    data: {
      senales,
      atenciones_en_curso: enCurso,
      proxima_cita: proximaCita,
      proxima_cita_por_mascota: porMascota,
    },
  };
}
