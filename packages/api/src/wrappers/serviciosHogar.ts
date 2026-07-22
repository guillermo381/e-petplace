// LA ZONA DE SERVICIOS VIVOS DEL HOGAR (S60-A6, D-366 parcial — el
// insumo rey de Kary: "vista rápida desde la posición consolidada").
// Resumidor CLIENT-COMPUESTO — cero RPC nueva: una sola verdad por
// lectura (obtenerMisCitasPaseo ya filtrada por catálogo + paquetes +
// obtenerMisGroomings), en paralelo, y el nombre de la mascota para la
// voz de familia. La REGLA DE EXISTENCIA la decide la superficie con
// estos datos: cero actividad = cero celda (el Hogar anticipa, jamás
// hace marketing — Explorar descubre).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import { obtenerMisCitasPaseo } from './citaSuelta';
import { obtenerMisPaquetesSalidas } from './paquetes';
import { obtenerMisGroomings } from './grooming-reserva';
import { obtenerMisAdiestramientos } from './adiestramiento-reserva';

const MENSAJE_ERROR = 'No pudimos leer tus servicios. Probá de nuevo.';

export interface ProximaDeServicio {
  /** 'YYYY-MM-DD'. */
  fecha: string;
  /** 'HH:MM'. */
  hora: string;
  /** La voz de familia habla con nombre; null honesto sin mascota. */
  mascota_nombre: string | null;
  tipo_servicio: string;
}

export interface ResumenServiciosHogar {
  paseo: {
    proxima: ProximaDeServicio | null;
    /** Saldo VIGENTE sumado de los paquetes del hogar (activo + sin vencer). */
    salidas_saldo: number;
  };
  estetica: {
    proxima: ProximaDeServicio | null;
    /** Fecha de la última sesión CERRADA con calidad, o null. */
    ultima_cerrada: string | null;
  };
  /** S73 ítem 1 (D-462 camino a): las dos ramas que faltaban — el rail
   *  mínimo-4 dice la verdad completa. Mismo patrón client-compuesto. */
  adiestramiento: {
    proxima: ProximaDeServicio | null;
    /** Última sesión con parte (cerrada con calidad), o null. */
    ultima_cerrada: string | null;
  };
  veterinaria: {
    proxima: ProximaDeServicio | null;
    /** DATO DE RUTA, no de superficie (vara S73-B): el destino v1 del
     *  cuadrado es /citas/[mascotaId] — el próximo lector NO lo pinta.
     *  Cae a la mascota de la por-coordinar o de la última si no hay
     *  próxima. */
    mascota_id_destino: string | null;
    /** Última cita completada pasada, o null. */
    ultima_cerrada: string | null;
    /** Cita firme SIN fecha (legal desde D-439): actividad sin próxima
     *  — el rail la cuenta (la invisibilidad no se repite, S71). */
    por_coordinar: boolean;
  };
}

function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

export async function obtenerResumenServiciosHogar(): Promise<
  ResultadoWrapper<ResumenServiciosHogar, 'error_servicios_hogar'>
> {
  const hoy = hoyLocal();
  const cliente = getClient();
  const [citasPaseo, paquetes, groomings, adiestramientos, tiposVet] = await Promise.all([
    obtenerMisCitasPaseo(),
    obtenerMisPaquetesSalidas(),
    obtenerMisGroomings(),
    obtenerMisAdiestramientos(),
    // canon regla 59: el mundo clínico se compone por es_medico=true,
    // jamás por categoría (incluye 'procedimiento', S72). Dos pasos como
    // el clon del adiestramiento — cero embed (la clase PGRST201 no se
    // invita de vuelta).
    cliente.from('tipos_servicio').select('codigo').eq('es_medico', true),
  ]);
  if (!citasPaseo.ok || !paquetes.ok || !groomings.ok || !adiestramientos.ok || tiposVet.error) {
    return { ok: false, codigo: 'error_servicios_hogar', mensaje: MENSAJE_ERROR };
  }

  // vet: lectura directa por la RLS del dueño (cita_select_due +
  // cita_select_por_acceso — verificadas por la vara S73-B), UNA query
  // del hogar, jamás N por mascota (piso de performance, ítem 7).
  const codigosVet = (tiposVet.data ?? []).map((t) => t.codigo);
  type CitaVetCruda = { fecha: string | null; hora: string | null; estado: string; tipo_servicio: string; mascota_id: string | null };
  let citasVet: CitaVetCruda[] = [];
  if (codigosVet.length > 0) {
    const r = await cliente
      .from('evento_cita_servicio')
      .select('fecha, hora, estado, tipo_servicio, mascota_id')
      .in('tipo_servicio', codigosVet)
      .in('estado', ['confirmada', 'en_curso', 'completada']);
    if (r.error) {
      return { ok: false, codigo: 'error_servicios_hogar', mensaje: MENSAJE_ERROR };
    }
    citasVet = (r.data ?? []) as CitaVetCruda[];
  }

  // paseo: la próxima confirmada futura (la lista ya viene ordenada asc)
  const proximaPaseo = citasPaseo.data.find((c) => c.estado === 'confirmada' && c.fecha >= hoy) ?? null;

  // saldo vigente del hogar (la MISMA regla del hub, D-343/P16)
  const salidasSaldo = paquetes.data
    .filter((p) => p.estado === 'activo' && p.saldo > 0 && (p.fecha_vencimiento === null || p.fecha_vencimiento >= hoy))
    .reduce((acc, p) => acc + p.saldo, 0);

  // estética: próxima confirmada + última cerrada (el hub ya trae ambas)
  const proximaEstetica = groomings.data.find((g) => g.estado === 'confirmada' && g.fecha >= hoy) ?? null;
  const ultimaCerrada = groomings.data
    .filter((g) => g.atencion_id !== null)
    .reduce<string | null>((max, g) => (max === null || g.fecha > max ? g.fecha : max), null);

  // el nombre para la voz del paseo (estética ya lo trae de su lector)
  let nombrePaseo: string | null = null;
  if (proximaPaseo !== null && proximaPaseo.mascota_id !== null) {
    const m = await cliente.from('mascotas').select('nombre').eq('id', proximaPaseo.mascota_id).maybeSingle();
    if (!m.error && m.data !== null) nombrePaseo = m.data.nombre;
  }

  // adiestramiento: próxima confirmada futura (mínimo defensivo — el
  // orden del lector no se presume) + última con parte
  const proximaAd = adiestramientos.data
    .filter((a) => a.estado === 'confirmada' && a.fecha >= hoy)
    .reduce<(typeof adiestramientos.data)[number] | null>(
      (min, a) => (min === null || a.fecha < min.fecha || (a.fecha === min.fecha && a.hora < min.hora) ? a : min),
      null,
    );
  const ultimaAd = adiestramientos.data
    .filter((a) => a.tiene_parte)
    .reduce<string | null>((max, a) => (max === null || a.fecha > max ? a.fecha : max), null);

  // vet: próxima firme futura · por-coordinar (fecha null) · última pasada
  const proximaVet = citasVet
    .filter((c) => c.fecha !== null && c.fecha >= hoy && (c.estado === 'confirmada' || c.estado === 'en_curso'))
    .reduce<CitaVetCruda | null>(
      (min, c) =>
        min === null || (c.fecha as string) < (min.fecha as string) ||
        ((c.fecha as string) === (min.fecha as string) && (c.hora ?? '') < (min.hora ?? ''))
          ? c
          : min,
      null,
    );
  const porCoordinar = citasVet.find((c) => c.fecha === null) ?? null;
  const ultimaVet = citasVet
    .filter((c) => c.estado === 'completada' && c.fecha !== null && c.fecha < hoy)
    .reduce<CitaVetCruda | null>((max, c) => (max === null || (c.fecha as string) > (max.fecha as string) ? c : max), null);
  const mascotaVetDestino =
    proximaVet?.mascota_id ?? porCoordinar?.mascota_id ?? ultimaVet?.mascota_id ?? null;

  return {
    ok: true,
    data: {
      paseo: {
        proxima:
          proximaPaseo !== null
            ? {
                fecha: proximaPaseo.fecha,
                hora: proximaPaseo.hora.slice(0, 5),
                mascota_nombre: nombrePaseo,
                tipo_servicio: proximaPaseo.tipo_servicio ?? 'paseo',
              }
            : null,
        salidas_saldo: salidasSaldo,
      },
      estetica: {
        proxima:
          proximaEstetica !== null
            ? {
                fecha: proximaEstetica.fecha,
                hora: proximaEstetica.hora,
                mascota_nombre: proximaEstetica.mascota_nombre,
                tipo_servicio: proximaEstetica.tipo_servicio,
              }
            : null,
        ultima_cerrada: ultimaCerrada,
      },
      adiestramiento: {
        proxima:
          proximaAd !== null
            ? {
                fecha: proximaAd.fecha,
                hora: proximaAd.hora,
                mascota_nombre: proximaAd.mascota_nombre,
                tipo_servicio: proximaAd.tipo_servicio,
              }
            : null,
        ultima_cerrada: ultimaAd,
      },
      veterinaria: {
        proxima:
          proximaVet !== null
            ? {
                fecha: proximaVet.fecha as string,
                hora: (proximaVet.hora ?? '').slice(0, 5),
                // el rail descarta el nombre (E4); null honesto, no query extra
                mascota_nombre: null,
                tipo_servicio: proximaVet.tipo_servicio,
              }
            : null,
        mascota_id_destino: mascotaVetDestino,
        ultima_cerrada: ultimaVet !== null ? ultimaVet.fecha : null,
        por_coordinar: porCoordinar !== null,
      },
    },
  };
}
