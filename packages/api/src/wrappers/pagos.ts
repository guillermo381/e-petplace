// Historial de pagos del DUEÑO (S55-B3, Cuenta v1) — el espejo dueño
// de la vista Cobros del prestador. SOLO LECTURA sobre las citas
// propias con estado_reserva='pagada' (RLS cita_select_due es la
// puerta). MODELO_FINANCIERO v2.4 leído: esto NO toca el ledger — el
// evento económico nace al cerrar (Decisión R); acá se listan PAGOS
// del dueño, y mientras el pago sea simulado la fila LO DICE
// (metadata.pago_simulado, escrita por confirmar_cita_pagada).

import { getClient } from '../client';
import type { Json } from '../database.types';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion: 'No hay sesión activa.',
  error_pagos: 'No pudimos cargar tus pagos. Prueba de nuevo.',
} as const;

export type CodigoErrorPagos = keyof typeof MENSAJES;

export interface PagoDelDueno {
  cita_id: string;
  /** ISO date de la cita. */
  fecha: string | null;
  /** HH:MM o null. */
  hora: string | null;
  tipo_servicio: string | null;
  monto: number | null;
  /** ISO — momento del pago (metadata.pagado_en) o null legacy. */
  pagado_en: string | null;
  /** La superficie DEBE declararlo por fila mientras sea simulado. */
  pago_simulado: boolean;
}

function leerMetadata(metadata: Json | null): { pagadoEn: string | null; simulado: boolean } {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    return { pagadoEn: null, simulado: false };
  }
  const pagadoEn = typeof metadata['pagado_en'] === 'string' ? metadata['pagado_en'] : null;
  return { pagadoEn, simulado: metadata['pago_simulado'] === true };
}

/** Pagos propios, del más reciente al más viejo. */
export async function obtenerMisPagos(): Promise<ResultadoWrapper<PagoDelDueno[], CodigoErrorPagos>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const { data, error } = await cliente
    .from('evento_cita_servicio')
    .select('id, fecha, hora, tipo_servicio, precio, metadata')
    .eq('user_id', uid)
    .eq('estado_reserva', 'pagada')
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false, nullsFirst: false });
  if (error) return { ok: false, codigo: 'error_pagos', mensaje: MENSAJES.error_pagos };

  return {
    ok: true,
    data: data.map((c) => {
      const m = leerMetadata(c.metadata);
      return {
        cita_id: c.id,
        fecha: c.fecha,
        hora: c.hora !== null ? c.hora.slice(0, 5) : null,
        tipo_servicio: c.tipo_servicio,
        monto: c.precio,
        pagado_en: m.pagadoEn,
        pago_simulado: m.simulado,
      };
    }),
  };
}
