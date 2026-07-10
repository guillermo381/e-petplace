/**
 * Las tres voces del estado del hogar (S51-B2.2) — criterio v1 gateado
 * por founder en sesión. Puro: señales adentro, código de voz afuera;
 * la pantalla traduce el código a texto por el riel i18n (Ley 3: estos
 * códigos JAMÁS se muestran).
 *
 * Precedencia (DISEÑO_EXPERIENCIA §2): pideAtencion > conociendolo > alDia.
 * "Al día" SE GANA con datos (L-139 hecha Home): actividad de cuidado
 * dentro de la ventana de recencia. Sin ninguna vacuna = expediente
 * ralo; con datos pero sin actividad reciente = expediente quieto
 * (VARIANTE de la 3ª voz — decisión founder S51: misma precedencia,
 * texto distinto por causa).
 *
 * NOTA (founder S51): la ventana de 12 meses es FIJA en v1. La
 * calibración fina (por especie/momento vital — un M5 senior pide
 * ventana más corta) llega con el motor de alertas de A5; no se
 * construye acá.
 */

export const VENTANA_RECENCIA_MESES = 12;

/** Días de anticipación con que una vacuna por vencer pide atención. */
export const DIAS_AVISO_VACUNA = 14;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export type SenalesMascota = {
  tieneEmergenciaActiva: boolean;
  /** Total de vacunas registradas (0 = expediente ralo). */
  vacunasTotal: number;
  /** Máxima fecha_aplicada registrada (ISO date), o null. */
  ultimaVacunaAplicada: string | null;
  /**
   * La próxima dosis conocida: mínima fecha_proxima registrada (hoy la
   * extracción no la llena — la señal despierta sola cuando haya datos).
   */
  proximaVacuna: { nombre: string; fecha: string } | null;
  /** Última atención de servicio cerrada (ISO timestamp), o null. */
  ultimaAtencionCerrada: string | null;
};

export type VozEstadoHogar =
  | { voz: 'pideAtencion'; causa: 'emergencia' }
  | { voz: 'pideAtencion'; causa: 'vacunaVence'; vacuna: string; dias: number }
  | { voz: 'pideAtencion'; causa: 'vacunaVencida'; vacuna: string; dias: number }
  | { voz: 'conociendolo'; causa: 'expedienteRalo' }
  | { voz: 'conociendolo'; causa: 'expedienteQuieto' }
  | { voz: 'alDia' };

function diasHasta(fechaIso: string, hoy: Date): number {
  const [a, m, d] = fechaIso.split('-').map(Number);
  if (!a || !m || !d) return Number.NaN;
  const objetivo = Date.UTC(a, m - 1, d);
  const base = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((objetivo - base) / MS_POR_DIA);
}

// La ventana se compara a DÍA CALENDARIO (UTC): las fechas date-only
// (vacunas) parsean a medianoche UTC y compararlas contra un límite
// con hora las corría por horas — el fantasma UTC de D-312. El día de
// los 12 meses justos CUENTA como adentro.
function dentroDeVentana(iso: string | null, hoy: Date): boolean {
  if (iso === null) return false;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return false;
  const diaSenal = Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate());
  const limite = Date.UTC(hoy.getFullYear(), hoy.getMonth() - VENTANA_RECENCIA_MESES, hoy.getDate());
  return diaSenal >= limite;
}

export function calcularVozHogar(senales: SenalesMascota, hoy: Date): VozEstadoHogar {
  // 1 — pide atención
  if (senales.tieneEmergenciaActiva) {
    return { voz: 'pideAtencion', causa: 'emergencia' };
  }
  if (senales.proximaVacuna !== null) {
    const dias = diasHasta(senales.proximaVacuna.fecha, hoy);
    if (!Number.isNaN(dias) && dias < 0) {
      return { voz: 'pideAtencion', causa: 'vacunaVencida', vacuna: senales.proximaVacuna.nombre, dias: -dias };
    }
    if (!Number.isNaN(dias) && dias <= DIAS_AVISO_VACUNA) {
      return { voz: 'pideAtencion', causa: 'vacunaVence', vacuna: senales.proximaVacuna.nombre, dias };
    }
  }

  // 2 — aún conociéndolo (ralo: sin ninguna vacuna registrada)
  if (senales.vacunasTotal === 0) {
    return { voz: 'conociendolo', causa: 'expedienteRalo' };
  }

  // 3 — al día SE GANA: actividad de cuidado dentro de la ventana.
  const alDia =
    dentroDeVentana(senales.ultimaVacunaAplicada, hoy) ||
    dentroDeVentana(senales.ultimaAtencionCerrada, hoy);
  if (alDia) return { voz: 'alDia' };

  // Con datos pero viejos: variante "quieto" de la 3ª voz.
  return { voz: 'conociendolo', causa: 'expedienteQuieto' };
}
