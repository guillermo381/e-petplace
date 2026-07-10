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
}

export interface ProximaCitaHogar {
  cita_id: string;
  mascota_id: string;
  /** ISO date. */
  fecha: string;
  /** HH:MM o null. */
  hora: string | null;
  tipo_servicio: string | null;
}

export interface EstadoHogar {
  /** Una entrada por mascota pedida (aunque no tenga datos: señales en cero). */
  senales: SenalesHogarMascota[];
  /** La atención en_curso más reciente del hogar, o null. */
  atencion_en_curso: AtencionEnCursoHogar | null;
  /** La cita futura (pendiente/confirmada) más próxima del hogar, o null. */
  proxima_cita: ProximaCitaHogar | null;
}

// Fecha local del dispositivo YYYY-MM-DD (patrón S44: en-CA da ese formato).
function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

export async function obtenerEstadoHogar(
  mascotaIds: string[],
): Promise<ResultadoWrapper<EstadoHogar, 'error_estado_hogar'>> {
  if (mascotaIds.length === 0) {
    return { ok: true, data: { senales: [], atencion_en_curso: null, proxima_cita: null } };
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
      .select('id, mascota_id, estado, iniciada_en, cerrada_en')
      .in('mascota_id', mascotaIds)
      .in('estado', ['en_curso', 'cerrada_con_calidad']),
    cliente
      .from('evento_cita_servicio')
      .select('id, mascota_id, fecha, hora, tipo_servicio')
      .in('mascota_id', mascotaIds)
      .in('estado', ['pendiente', 'confirmada'])
      .gte('fecha', hoyLocal())
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true, nullsFirst: false })
      .limit(1),
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

  // La atención en_curso más reciente del hogar (Ley 7: UNA en vivo).
  let enCurso: AtencionEnCursoHogar | null = null;
  for (const a of atenciones.data) {
    if (a.estado !== 'en_curso') continue;
    if (enCurso === null || (a.iniciada_en ?? '') > (enCurso.iniciada_en ?? '')) {
      enCurso = { atencion_id: a.id, mascota_id: a.mascota_id, iniciada_en: a.iniciada_en };
    }
  }

  // Guard de shape (L-124): el filtro garantiza mascota_id/fecha no
  // nulos, pero el tipo generado no lo sabe — se angosta verificando,
  // jamás con cast (regla 34).
  const cita = citas.data[0];
  const proximaCita: ProximaCitaHogar | null =
    cita !== undefined && cita.mascota_id !== null && cita.fecha !== null
      ? {
          cita_id: cita.id,
          mascota_id: cita.mascota_id,
          fecha: cita.fecha,
          hora: cita.hora !== null ? cita.hora.slice(0, 5) : null,
          tipo_servicio: cita.tipo_servicio,
        }
      : null;

  return {
    ok: true,
    data: {
      senales,
      atencion_en_curso: enCurso,
      proxima_cita: proximaCita,
    },
  };
}
