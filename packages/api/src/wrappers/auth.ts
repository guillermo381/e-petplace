// Wrapper de AUTH (S45-B4) — la puerta única también para la sesión.
// Email+password, sin social (decisión B1). Los códigos se normalizan
// desde error.code de supabase auth-js (v2: 'user_already_exists',
// 'invalid_credentials', 'weak_password', …) con fallback por mensaje
// SOLO vía startsWith de códigos conocidos (regla 35 / L-115).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_ERROR_AUTH = [
  'email_ya_registrado',
  'credenciales_invalidas',
  'email_invalido',
  'password_debil',
  'email_no_confirmado',
  'sin_sesion',
] as const;

export type CodigoErrorAuth = (typeof CODIGOS_ERROR_AUTH)[number];

const MENSAJES_ERROR_AUTH: Record<
  CodigoErrorAuth | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  email_ya_registrado:   'Ese email ya tiene cuenta. Probá iniciar sesión.',
  credenciales_invalidas: 'El email o la contraseña no coinciden.',
  email_invalido:        'Ese email no parece válido.',
  password_debil:        'La contraseña necesita al menos 6 caracteres.',
  email_no_confirmado:   'Falta confirmar tu email. Revisá tu correo.',
  sin_sesion:            'No hay una sesión activa.',
  datos_inconsistentes:  'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:     'Ocurrió un error inesperado. Probá de nuevo.',
};

// error.code de auth-js → código de la casa.
const CODIGO_SUPABASE_A_CASA: Record<string, CodigoErrorAuth> = {
  user_already_exists:  'email_ya_registrado',
  email_exists:         'email_ya_registrado',
  invalid_credentials:  'credenciales_invalidas',
  validation_failed:    'email_invalido',
  weak_password:        'password_debil',
  email_not_confirmed:  'email_no_confirmado',
  session_missing:      'sin_sesion',
};

function mapeoErrorAuth<T>(codigoSupabase: string | undefined, mensaje: string): ResultadoWrapper<T, CodigoErrorAuth> {
  const porCodigo = codigoSupabase !== undefined ? CODIGO_SUPABASE_A_CASA[codigoSupabase] : undefined;
  if (porCodigo !== undefined) {
    return { ok: false, codigo: porCodigo, mensaje: MENSAJES_ERROR_AUTH[porCodigo] };
  }
  // Fallback legacy: instancias que aún no mandan error.code.
  if (mensaje.startsWith('User already registered')) {
    return { ok: false, codigo: 'email_ya_registrado', mensaje: MENSAJES_ERROR_AUTH.email_ya_registrado };
  }
  if (mensaje.startsWith('Invalid login credentials')) {
    return { ok: false, codigo: 'credenciales_invalidas', mensaje: MENSAJES_ERROR_AUTH.credenciales_invalidas };
  }
  return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_ERROR_AUTH.error_desconocido };
}

export interface SesionDueno {
  user_id: string;
  email: string | null;
  /** De user_metadata.nombre (lo siembra registrarse; handle_new_user lo
   *  espeja a profiles). null si la cuenta nació sin nombre. */
  nombre: string | null;
}

function nombreDeMetadata(metadata: Record<string, unknown> | undefined): string | null {
  const v = metadata?.nombre;
  return typeof v === 'string' && v.length > 0 ? v : null;
}

export interface InputRegistrarse {
  nombre: string;
  email: string;
  password: string;
}

/** Alta email+password. El trigger handle_new_user crea el profile con
 *  raw_user_meta_data.nombre. Si el proyecto exige confirmación de email,
 *  devuelve la cuenta sin sesión (sesion_activa=false). */
export async function registrarse(
  input: InputRegistrarse,
): Promise<ResultadoWrapper<SesionDueno & { sesion_activa: boolean }, CodigoErrorAuth>> {
  const { data, error } = await getClient().auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { nombre: input.nombre } },
  });

  if (error) return mapeoErrorAuth(error.code, error.message);
  if (!data.user) return mapeoErrorAuth(undefined, 'datos_inconsistentes');

  return {
    ok: true,
    data: {
      user_id: data.user.id,
      email: data.user.email ?? null,
      nombre: nombreDeMetadata(data.user.user_metadata),
      sesion_activa: data.session !== null,
    },
  };
}

export interface InputIniciarSesion {
  email: string;
  password: string;
}

export async function iniciarSesion(
  input: InputIniciarSesion,
): Promise<ResultadoWrapper<SesionDueno, CodigoErrorAuth>> {
  const { data, error } = await getClient().auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) return mapeoErrorAuth(error.code, error.message);
  if (!data.user) return mapeoErrorAuth(undefined, 'datos_inconsistentes');

  return {
    ok: true,
    data: {
      user_id: data.user.id,
      email: data.user.email ?? null,
      nombre: nombreDeMetadata(data.user.user_metadata),
    },
  };
}

export async function cerrarSesion(): Promise<ResultadoWrapper<null, CodigoErrorAuth>> {
  const { error } = await getClient().auth.signOut();
  if (error) return mapeoErrorAuth(error.code, error.message);
  return { ok: true, data: null };
}

/** Sesión vigente (persistida por el adapter del app) o null. */
export async function obtenerSesion(): Promise<ResultadoWrapper<SesionDueno | null, CodigoErrorAuth>> {
  const { data, error } = await getClient().auth.getSession();
  if (error) return mapeoErrorAuth(error.code, error.message);
  if (!data.session) return { ok: true, data: null };
  return {
    ok: true,
    data: {
      user_id: data.session.user.id,
      email: data.session.user.email ?? null,
      nombre: nombreDeMetadata(data.session.user.user_metadata),
    },
  };
}
