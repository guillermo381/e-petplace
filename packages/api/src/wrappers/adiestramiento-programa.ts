/**
 * S108-A · LOS PROGRAMAS DE ADIESTRAMIENTO DE LA FAMILIA.
 *
 * 🤝 Pedido de S108-C: *sin lector de saldo de sesiones, un programa pendiente
 * no se puede decir en ninguna pantalla y volvemos al guard mudo.*
 *
 * 🔴 **DEVUELVE TODOS LOS ESTADOS, incluido el que no se pagó.** Es la misma
 * lección que el paquete: filtrar acá vuelve invisible la plata que la familia
 * cree haber gastado — y su ausencia no da error, la lista se pinta igual con
 * una fila menos. *Qué se muestra y qué se dice lo decide la superficie.*
 */
import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

/* 🔴 `ProgramaContratado` YA EXISTE en `adiestramiento-reserva` con otra forma
   (la del flujo de reserva). Este es el del SALDO, en vocabulario de sesiones,
   y por eso lleva nombre propio: *dos tipos con el mismo nombre y campos
   distintos es cómo una pantalla lee el que no era.* */
export interface ProgramaConSaldo {
  programaContratadoId: string;
  prestadorId: string;
  prestadorNombre: string;
  mascotaId: string | null;
  /** Vocabulario de SESIONES, no de días ni de unidades. */
  sesionesTotal: number;
  sesionesUsadas: number;
  sesionesQuedan: number;
  precioTotal: number;
  precioPorSesion: number | null;
  /** `activo` · `completado` · `vencido` · `cancelado`. */
  estado: string;
  /** Crudo: `pendiente` · `pagado` · `reembolsado`. */
  estadoPago: string;
  /** Murió porque se venció su ventana de pago, no por reverso ni por vigencia. */
  noPagadoATiempo: boolean;
  vigenciaHasta: string | null;
  primeraSesion: string | null;
}

export type CodigoErrorPrograma = 'sin_sesion' | 'datos_inconsistentes' | 'fallo';

export async function obtenerMisProgramas(): Promise<
  ResultadoWrapper<ProgramaConSaldo[], CodigoErrorPrograma>
> {
  const { data, error } = await getClient().rpc('obtener_mis_programas');
  if (error) {
    if (error.message.startsWith('auth_required')) {
      return { ok: false, codigo: 'sin_sesion', mensaje: error.message };
    }
    return { ok: false, codigo: 'fallo', mensaje: error.message };
  }
  if (!Array.isArray(data)) return { ok: false, codigo: 'datos_inconsistentes', mensaje: 'datos_inconsistentes' };

  const salida: ProgramaConSaldo[] = [];
  for (const fila of data) {
    if (typeof fila !== 'object' || fila === null) {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: 'datos_inconsistentes' };
    }
    const r = fila as Record<string, unknown>;
    if (typeof r.programa_contratado_id !== 'string' || typeof r.sesiones_total !== 'number') {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: 'datos_inconsistentes' };
    }
    salida.push({
      programaContratadoId: r.programa_contratado_id,
      prestadorId: typeof r.prestador_id === 'string' ? r.prestador_id : '',
      prestadorNombre: typeof r.prestador_nombre === 'string' ? r.prestador_nombre : '',
      mascotaId: typeof r.mascota_id === 'string' ? r.mascota_id : null,
      sesionesTotal: r.sesiones_total,
      sesionesUsadas: typeof r.sesiones_usadas === 'number' ? r.sesiones_usadas : 0,
      sesionesQuedan: typeof r.sesiones_quedan === 'number' ? r.sesiones_quedan : 0,
      precioTotal: typeof r.precio_total === 'number' ? r.precio_total : 0,
      precioPorSesion: typeof r.precio_por_sesion === 'number' ? r.precio_por_sesion : null,
      estado: typeof r.estado === 'string' ? r.estado : '',
      estadoPago: typeof r.estado_pago === 'string' ? r.estado_pago : '',
      noPagadoATiempo: r.no_pagado_a_tiempo === true,
      vigenciaHasta: typeof r.vigencia_hasta === 'string' ? r.vigencia_hasta : null,
      primeraSesion: typeof r.primera_sesion === 'string' ? r.primera_sesion : null,
    });
  }
  return { ok: true, data: salida };
}
