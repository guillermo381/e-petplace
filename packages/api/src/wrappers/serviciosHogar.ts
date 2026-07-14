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
}

function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

export async function obtenerResumenServiciosHogar(): Promise<
  ResultadoWrapper<ResumenServiciosHogar, 'error_servicios_hogar'>
> {
  const hoy = hoyLocal();
  const [citasPaseo, paquetes, groomings] = await Promise.all([
    obtenerMisCitasPaseo(),
    obtenerMisPaquetesSalidas(),
    obtenerMisGroomings(),
  ]);
  if (!citasPaseo.ok || !paquetes.ok || !groomings.ok) {
    return { ok: false, codigo: 'error_servicios_hogar', mensaje: MENSAJE_ERROR };
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
    const m = await getClient().from('mascotas').select('nombre').eq('id', proximaPaseo.mascota_id).maybeSingle();
    if (!m.error && m.data !== null) nombrePaseo = m.data.nombre;
  }

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
    },
  };
}
