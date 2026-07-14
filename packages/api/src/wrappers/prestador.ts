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
// S60-B2 (hunk aditivo): la sección ENTIDAD de Cuenta·Tu perfil (P17
// v1.1, visto del arquitecto): descripcion + contacto (editables) y
// estado (solo lectura; el admin lo gobierna).
// S61 domicilio v1 (hunk aditivo): grooming_recargo_domicilio — el
// espejo del extra de pelaje (numeric NULL honesto, CHECK >= 0).
export type MiPrestador = Pick<
  Database['public']['Tables']['prestadores']['Row'],
  | 'id'
  | 'nombre_comercial'
  | 'tipo'
  | 'country_code'
  | 'direccion'
  | 'ciudad'
  | 'grooming_extra_pelaje_largo'
  | 'grooming_recargo_domicilio'
  | 'descripcion'
  | 'telefono'
  | 'whatsapp'
  | 'email_contacto'
  | 'sitio_web'
  | 'estado'
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
    .select(
      'id, nombre_comercial, tipo, country_code, direccion, ciudad, grooming_extra_pelaje_largo, grooming_recargo_domicilio, descripcion, telefono, whatsapp, email_contacto, sitio_web, estado',
    )
    .eq('user_id', uid)
    .maybeSingle();

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  if (data === null) return { ok: false, codigo: 'sin_prestador', mensaje: MENSAJES.sin_prestador };
  return { ok: true, data };
}

// ── S60-B2 (hunk aditivo): edición ACOTADA del perfil de la entidad ─────────
// WHITELIST EXPLÍCITA (visto del arquitecto): SOLO descripcion +
// contacto. El payload se arma clave por clave — jamás spread del form.
// nombre_comercial/foto_url = identidad PÚBLICA (sesión D-370);
// direccion/ciudad = sede operativa; estado/aprobado_* = del admin;
// fiscal = cuentas_comerciales (regla 25). La RLS (prestadores_own,
// fila entera) NO acota columnas: esta whitelist es la capa de
// PRODUCTO — la protección del motor la registra la A como deuda 🔴.

export interface InputActualizarPerfilPrestador {
  /** '' o solo espacios ⇒ NULL honesto en DB. */
  descripcion?: string;
  /** E.164 sin '+' (regla 28) — el display con '+' es del frontend. */
  telefono?: string;
  whatsapp?: string;
  email_contacto?: string;
  sitio_web?: string;
}

function aNull(v: string | undefined): string | null | undefined {
  if (v === undefined) return undefined; // no viajó: no se toca
  const limpio = v.trim();
  return limpio.length === 0 ? null : limpio;
}

export async function actualizarPerfilPrestador(
  input: InputActualizarPerfilPrestador,
): Promise<ResultadoWrapper<null, CodigoErrorPrestador>> {
  const { data: auth } = await getClient().auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const payload: Partial<Database['public']['Tables']['prestadores']['Update']> = {};
  const descripcion = aNull(input.descripcion);
  const telefono = aNull(input.telefono);
  const emailContacto = aNull(input.email_contacto);
  const sitioWeb = aNull(input.sitio_web);
  if (descripcion !== undefined) payload.descripcion = descripcion;
  if (telefono !== undefined) payload.telefono = telefono;
  // whatsapp es NOT NULL en DB (legacy): el "sin dato" es '' — relevado.
  if (input.whatsapp !== undefined) payload.whatsapp = input.whatsapp.trim();
  if (emailContacto !== undefined) payload.email_contacto = emailContacto;
  if (sitioWeb !== undefined) payload.sitio_web = sitioWeb;
  if (Object.keys(payload).length === 0) return { ok: true, data: null };

  const { data, error } = await getClient()
    .from('prestadores')
    .update(payload)
    .eq('user_id', uid)
    .select('id')
    .maybeSingle();

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  if (data === null) return { ok: false, codigo: 'sin_prestador', mensaje: MENSAJES.sin_prestador };
  return { ok: true, data: null };
}
