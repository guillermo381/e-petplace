// Lectura del prestador propio (S44-B4.1). Puerta única: la RLS de
// prestadores (SELECT propio por user_id) es el guard.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import type { Database } from '../database.types';

const CODIGOS_ERROR_PRESTADOR = ['sin_sesion', 'sin_prestador'] as const;
export type CodigoErrorPrestador = (typeof CODIGOS_ERROR_PRESTADOR)[number];

const MENSAJES: Record<CodigoErrorPrestador | 'error_desconocido' | 'datos_inconsistentes', string> = {
  sin_sesion:           'No hay sesión activa.',
  sin_prestador:        'Tu usuario no tiene un prestador asociado.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Probá de nuevo.',
};

// S58-B (hunk aditivo): country_code entra al contrato — la fuente ya
// era clara (fees.ts lo lee de la MISMA tabla); las zonas del taller
// filtran el catálogo por el país del prestador.
// S59-B5 (hunk aditivo): direccion/ciudad (la fila "Dónde" del mundo
// grooming — solo lectura de la sede) + grooming_extra_pelaje_largo
// (UN extra del prestador, NULL honesto — fundación S59-A3).
export type MiPrestador = Pick<
  Database['public']['Tables']['prestadores']['Row'],
  'id' | 'nombre_comercial' | 'tipo' | 'country_code' | 'direccion' | 'ciudad' | 'grooming_extra_pelaje_largo'
>;

/** El prestador del user logueado (dueño). Empleados: fuera de F1. */
export async function obtenerMiPrestador(): Promise<
  ResultadoWrapper<MiPrestador, CodigoErrorPrestador>
> {
  const { data: auth } = await getClient().auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const { data, error } = await getClient()
    .from('prestadores')
    .select('id, nombre_comercial, tipo, country_code, direccion, ciudad, grooming_extra_pelaje_largo')
    .eq('user_id', uid)
    .maybeSingle();

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  if (data === null) return { ok: false, codigo: 'sin_prestador', mensaje: MENSAJES.sin_prestador };
  return { ok: true, data };
}
