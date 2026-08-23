// Wrapper de AUTH (S45-B4) — la puerta única también para la sesión.
// Email+password, sin social (decisión B1). Los códigos se normalizan
// desde error.code de supabase auth-js (v2: 'user_already_exists',
// 'invalid_credentials', 'weak_password', …) con fallback por mensaje
// SOLO vía startsWith de códigos conocidos (regla 35 / L-115).

import { getClient } from '../client';
// El largo mínimo vive en UN lugar (firma founder S88): seguridad.ts.
import { MIN_LARGO_CONTRASENA } from './seguridad';
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
  /* Misma voz única que `contrasena_debil` en seguridad.ts — ver el porqué
     completo allá (D-720). Acá pega en el REGISTRO de las dos apps: es el
     primer lugar donde alguien elige una contraseña, y era donde el mensaje
     viejo mentía más seguido, porque `password123` es exactamente la clase de
     clave que se tipea al crear una cuenta. */
  password_debil:
    `Necesitamos una contraseña más fuerte: mínimo ${MIN_LARGO_CONTRASENA} caracteres y evita palabras o combinaciones fáciles de identificar. Un truco: tres palabras que no tengan relación, como melon-lampara-rio.`,
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

// ═══════════════════════════════════════════════════════════════════════════
// LA NORMALIZACIÓN DEL CORREO — en la puerta, una sola vez
// ═══════════════════════════════════════════════════════════════════════════
/**
 * `trim` + minúsculas. **Se normaliza acá y no en cada pantalla** (S104-A).
 *
 * Medido: 17 de 165 filas de `profiles.email` divergían de `auth.users.email`,
 * y **las 17 divergían SOLO por mayúsculas** — `auth` normaliza, la copia
 * guardaba lo tipeado. La divergencia no nació de un bug del motor: nació de
 * que nadie normalizó en el campo. *La cura del backfill limpió las 17; ésta
 * es la que evita las próximas.*
 *
 * También cierra un modo de falla del login que no se ve: alguien que se
 * registró como `Luis@x.com` y al día siguiente tipea `luis@x.com` es la MISMA
 * cuenta para Supabase — pero cualquier búsqueda nuestra por igualdad exacta
 * contra la copia diría que no existe.
 */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ═══════════════════════════════════════════════════════════════════════════
// EL CONSENTIMIENTO — P23 hecho fila
// ═══════════════════════════════════════════════════════════════════════════
/**
 * La versión de términos que se le mostró a quien acepta.
 *
 * ⚠️ **NO es `v1.0`, y la diferencia importa.** Las 59 filas vivas de
 * `consentimientos` dicen `version='v1.0'` y son del LEGADO (25-abr → 10-may
 * 2026, escritas por `e-petplace-v2`). **Las páginas legales se corrigieron y
 * republicaron en S103** ⇒ escribir `v1.0` hoy afirmaría que esta persona
 * aceptó el mismo documento que aquellas 59, y es falso.
 *
 * 🔴 **Es provisional y se declara como tal:** hoy los documentos legales no
 * tienen versión propia — son 26 de letra firmada, 10 medidas y **17 esperando
 * abogado** (D-405). El día que el abogado entregue documentos versionados,
 * esta constante toma SU versión y deja de ser una fecha. *Se guarda además la
 * URL exacta en `metadata`, porque lo que P23 promete demostrar no es un
 * número: es QUÉ se le mostró.*
 */
export const VERSION_TERMINOS_VIGENTE = 'legales-2026-08';

export type TipoConsentimiento = 'registro' | 'invitacion_familia' | 'acceso_prestador';

/**
 * Registra que alguien aceptó los términos. **Puerta única del consentimiento.**
 *
 * ── LEY DE PARIDAD DE CUENTA (firma founder, 23-ago-2026) ─────────────────
 * Vive en `packages/api` y **no en una app**, porque la ley exige que toda
 * pieza del ciclo de cuenta nazca en las DOS. Sus consumidores son tres y dos
 * son del prestador: el registro del cliente · **solicitar acceso** ·
 * **aceptar la invitación de empleado**. *Quien entra por invitación también
 * acepta términos, y queda registrado.*
 *
 * ── POR QUÉ NO ROMPE EL REGISTRO SI FALLA ─────────────────────────────────
 * Devuelve `false` en vez de lanzar. La cuenta ya existe cuando esto corre:
 * hacer fallar el alta por un fallo de auditoría dejaría a una persona sin
 * poder entrar por algo que no es suyo. **Pero tampoco se traga el fallo**: el
 * llamador recibe el booleano y puede decirlo. *Callarlo sería prometer una
 * evidencia que no existe, que es exactamente lo que P23 no tolera.*
 *
 * ⚠️ Exige SESIÓN ACTIVA — la policy es `auth.uid() = user_id` (S104-A, cerrada
 * porque antes admitía a `anon` con `with_check=true` y cualquiera podía
 * fabricar el consentimiento de otro). Hoy alcanza: con la verificación de
 * correo apagada (D-299), `signUp` devuelve sesión. **El día que se encienda,
 * hace falta una RPC DEFINER — no aflojar la policy.**
 */
export async function registrarConsentimiento(
  userId: string,
  tipo: TipoConsentimiento,
  urlMostrada: string | null = null,
): Promise<boolean> {
  const { error } = await getClient().from('consentimientos').insert({
    user_id: userId,
    tipo,
    aceptado: true,
    version: VERSION_TERMINOS_VIGENTE,
    metadata: { url: urlMostrada, origen: 'app', registrado_en: new Date().toISOString() },
  });
  return error === null;
}

export interface InputRegistrarse {
  nombre: string;
  email: string;
  password: string;
  /** La URL de términos que la pantalla mostró (para la evidencia de P23). */
  urlLegalMostrada?: string;
}

/** Alta email+password. El trigger handle_new_user crea el profile con
 *  raw_user_meta_data.nombre. Si el proyecto exige confirmación de email,
 *  devuelve la cuenta sin sesión (sesion_activa=false). */
export async function registrarse(
  input: InputRegistrarse,
): Promise<
  ResultadoWrapper<
    SesionDueno & { sesion_activa: boolean; consentimiento_registrado: boolean },
    CodigoErrorAuth
  >
> {
  const { data, error } = await getClient().auth.signUp({
    email: normalizarEmail(input.email),
    password: input.password,
    options: { data: { nombre: input.nombre } },
  });

  if (error) return mapeoErrorAuth(error.code, error.message);
  if (!data.user) return mapeoErrorAuth(undefined, 'datos_inconsistentes');

  /* El consentimiento se registra EN LA MISMA PUERTA que crea la cuenta —
     P23 promete poder demostrar qué aceptó cada quien, y una promesa que se
     cumple en otra pantalla es una promesa que algún camino se saltea.
     Sin sesión no se puede escribir (la policy es `auth.uid() = user_id`):
     eso pasa solo si la verificación de correo está encendida, y entonces el
     `false` que sale de acá es la verdad, no un error tragado. */
  const consentimiento_registrado =
    data.session !== null
      ? await registrarConsentimiento(data.user.id, 'registro', input.urlLegalMostrada ?? null)
      : false;

  return {
    ok: true,
    data: {
      user_id: data.user.id,
      email: data.user.email ?? null,
      nombre: nombreDeMetadata(data.user.user_metadata),
      sesion_activa: data.session !== null,
      consentimiento_registrado,
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
    /* Misma normalización que el registro: quien se registró tipeando
       `Luis@x.com` tiene que poder entrar tipeando `luis@x.com`. Supabase ya
       las trata como la misma cuenta — la normalización acá es para que las
       DOS puertas de esta casa se comporten igual. */
    email: normalizarEmail(input.email),
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
