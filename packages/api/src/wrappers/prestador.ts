// Lectura del prestador propio (S44-B4.1). Puerta única: la RLS de
// prestadores (SELECT propio por user_id) es el guard.
//
// S75-A1 (R1) — EL RESOLVEDOR DEJA DE SER SOLO-TITULAR. Hasta S74 este
// wrapper resolvía EXCLUSIVAMENTE por `prestadores.user_id`, y por eso
// las 26 pantallas que cuelgan de él le decían "no tenés prestador" a
// un empleado real del negocio (D-512: el motor entiende de empleados;
// la app todavía no). Dos pasos, CERO cambio de RLS:
//   (1) titularidad — la fila propia por `user_id` (lo de siempre);
//   (2) si no hay, el VÍNCULO ACTIVO: `prestador_empleados` por
//       `user_id` + `activo = true` → `prestador_id` → la fila por `id`.
// La RLS ya cubre las dos patas y se verificó con el literal de las
// policies (no se dedujo):
//   · `empleados_self` [SELECT] USING (user_id = auth.uid()) — el
//     empleado lee SUS propias filas de vínculo.
//   · `prestadores_public` [SELECT] USING (estado = 'activo' OR
//     user_id = auth.uid() OR is_admin()) — el empleado lee la fila
//     del negocio porque está ACTIVO, no porque sea suya.
// BORDE DECLARADO (consecuencia del literal de arriba, no del código):
// un empleado de un negocio que NO está en estado 'activo' (hoy vive
// uno: "Carlos", en_revision) cae en `sin_prestador`. Es honesto — ese
// negocio todavía no opera —, y curarlo sería tocar RLS, que este paso
// NO hace.
// ORDEN DETERMINISTA: titularidad primero; después, el vínculo activo
// MÁS ANTIGUO (`created_at ASC`, columna NOT NULL). v1 asume UN negocio
// por persona; el borde de dos negocios NO rompe (elige el más antiguo,
// siempre el mismo) pero pide una superficie de selección — v2.
// LO QUE ESTE PASO NO HACE: no resuelve `obtenerMiCuentaComercial` (R2,
// por `owner_profile_id`, fuera del v1 por decisión founder) y no
// gatea nada por rol — la identidad no es permiso (D-490/D-513).

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
// S75-A1 (hunk aditivo): cuenta_comercial_id — lo que `fees.ts` leía
// con su PROPIA consulta por `user_id`; al entrar acá, C1 pasa a
// CONSUMIR este resolvedor en vez de duplicarlo (L-150: una sola
// verdad; si no, el empleado resolvería su negocio en 26 pantallas y
// seguiría sin comisión en el taller).
export type MiPrestador = Pick<
  Database['public']['Tables']['prestadores']['Row'],
  | 'id'
  | 'nombre_comercial'
  | 'tipo'
  | 'country_code'
  | 'cuenta_comercial_id'
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

const COLUMNAS_MI_PRESTADOR =
  'id, nombre_comercial, tipo, country_code, cuenta_comercial_id, direccion, ciudad, grooming_extra_pelaje_largo, grooming_recargo_domicilio, descripcion, telefono, whatsapp, email_contacto, sitio_web, estado';

/**
 * El negocio del user logueado — por TITULARIDAD o por VÍNCULO ACTIVO
 * (S75-A1). Ver el encabezado del archivo para el porqué, el literal de
 * las policies que lo sostienen y los bordes declarados.
 */
export async function obtenerMiPrestador(): Promise<
  ResultadoWrapper<MiPrestador, CodigoErrorPrestador>
> {
  const { data: auth } = await getClient().auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  // (1) Titularidad — el camino de siempre, byte por byte: las 26
  // pantallas del titular reciben EXACTAMENTE la misma fila que antes.
  const { data, error } = await getClient()
    .from('prestadores')
    .select(COLUMNAS_MI_PRESTADOR)
    .eq('user_id', uid)
    .maybeSingle();

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  if (data !== null) return { ok: true, data };

  // (2) Vínculo activo. No es titular: ¿es empleado activo de alguien?
  const { data: vinculos, error: errorVinculo } = await getClient()
    .from('prestador_empleados')
    .select('prestador_id')
    .eq('user_id', uid)
    .eq('activo', true)
    .order('created_at', { ascending: true })
    .limit(1);

  if (errorVinculo) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  const prestadorId = vinculos?.[0]?.prestador_id;
  if (prestadorId === undefined) {
    return { ok: false, codigo: 'sin_prestador', mensaje: MENSAJES.sin_prestador };
  }

  const { data: fila, error: errorFila } = await getClient()
    .from('prestadores')
    .select(COLUMNAS_MI_PRESTADOR)
    .eq('id', prestadorId)
    .maybeSingle();

  if (errorFila) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  // null acá = el vínculo existe pero la fila no es legible: el negocio
  // no está 'activo' (el borde declarado arriba). `sin_prestador` es la
  // voz honesta — no hay negocio que mostrarle todavía.
  if (fila === null) return { ok: false, codigo: 'sin_prestador', mensaje: MENSAJES.sin_prestador };
  return { ok: true, data: fila };
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
