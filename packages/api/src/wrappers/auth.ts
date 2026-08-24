// Wrapper de AUTH (S45-B4) — la puerta única también para la sesión.
// Email+password, sin social (decisión B1). Los códigos se normalizan
// desde error.code de supabase auth-js (v2: 'user_already_exists',
// 'invalid_credentials', 'weak_password', …) con fallback por mensaje
// SOLO vía startsWith de códigos conocidos (regla 35 / L-115).

import { getClient } from '../client';
import { normalizarEmail } from './_email';
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

// La normalización del correo vive en `_email.ts` (una sola implementación
// para todas las puertas; acá se re-exporta para no romper consumidores).
export { normalizarEmail } from './_email';

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
  const r = await registrarConsentimientos(userId, tipo, documentosVigentes(urlMostrada));
  return r.registrados === r.total;
}

/**
 * Los documentos que HOY se pueden aceptar de verdad, con su versión medida.
 *
 * **Son DOS, no tres**, y el motivo no es alcance: `tratamiento_datos` **no
 * tiene documento ni URL** (medido por C contra el sitio). *El tercer check de
 * la firma entra el día que exista la página — y entonces es una línea acá.*
 *
 * ⚠️ `privacidad` se registra sabiendo que **la publicada excluye a las apps
 * móviles**; la de la app es borrador (D-405). **Se registra igual porque es lo
 * que la persona efectivamente vio**, y P23 promete demostrar QUÉ se le mostró
 * — no que lo mostrado fuera suficiente. *Confundir las dos cosas haría que el
 * registro mienta en la dirección cómoda.*
 */
export function documentosVigentes(urlIndice: string | null = null): DocumentoAceptado[] {
  return [
    { documento: 'terminos',   version: '1.1', url: urlIndice },
    { documento: 'privacidad', version: '1.1', url: urlIndice },
  ];
}

/**
 * UN REGISTRO POR DOCUMENTO — **jamás un booleano «aceptó todo»** (firma
 * founder, tanda 2).
 *
 * *Una sola fila que dice «aceptó» no puede contestar la única pregunta que
 * P23 promete contestar: **qué**, exactamente, aceptó esta persona.* El día que
 * un documento cambie de versión, una fila agregada no permite saber cuál de
 * los tres se aceptó en cuál versión — y ése es justo el día en que hace falta.
 *
 * ⚠️ **LO QUE HOY NO SE PUEDE CUMPLIR, y se declara en vez de fingirse:** la
 * app conoce **UNA sola URL legal** — `urlLegales()` devuelve el índice
 * `/legales`, **por decisión declarada de S103-C** (*«si mañana nace un
 * documento nuevo, la app no toca una línea»*). **No existen URLs por
 * documento**, y el canon no fija un vocabulario cerrado de cuáles son los
 * tres. ⇒ **este wrapper ya acepta N documentos con su versión y su URL, pero
 * hasta que esas URLs existan el llamador solo puede pasar `legales`.**
 * *Inventar acá los nombres `terminos`/`privacidad` sería fabricar un
 * vocabulario que ningún documento publicado respalda — y la fila diría que
 * alguien aceptó algo que nadie escribió con ese nombre.*
 * **El vocabulario y las URLs son firma de mesa; el motor ya está.**
 *
 * **Best-effort por fila y con cuenta honesta:** devuelve cuántas entraron de
 * cuántas se intentaron. No lanza — la cuenta ya existe cuando esto corre — y
 * **tampoco se traga el fallo**: el llamador recibe los dos números.
 */
/**
 * EL VOCABULARIO, MEDIDO CONTRA EL SITIO POR C (23-ago) — no inventado acá.
 *
 * | documento | estado |
 * |---|---|
 * | `terminos` | **VIVO**, `/terminos`, **v1.1** (22-ago) |
 * | `privacidad` | **VIVO**, `/privacidad`, **v1.1** — ⚠️ la publicada **excluye la app**; la de la app es BORRADOR (D-405, sin publicar) |
 * | `tratamiento_datos` | 🔴 **NO EXISTE**: ni documento ni URL. El concepto vive DENTRO de privacidad |
 *
 * ⇒ **El tercer check que la firma pide no tiene a dónde enlazar.** Se declara
 * en el tipo **y se deja fuera del default**: *un check que apunta a una página
 * que no existe le pide a alguien que acepte algo que no puede leer.*
 * **Escalado al founder por C y por acá.**
 */
export type DocumentoLegal = 'terminos' | 'privacidad' | 'tratamiento_datos';

export interface DocumentoAceptado {
  documento: DocumentoLegal;
  /** La versión de ESE documento, jamás una global — hoy `terminos` y
   *  `privacidad` van en `1.1`, medidas del sitio. */
  version: string;
  /** La URL exacta que se le mostró. */
  url: string | null;
}

export async function registrarConsentimientos(
  userId: string,
  tipo: TipoConsentimiento,
  documentos: DocumentoAceptado[],
): Promise<{ registrados: number; total: number }> {
  if (documentos.length === 0) return { registrados: 0, total: 0 };

  /* Se insertan como LOTE de filas separadas — una por documento — y no como
     un objeto con tres claves adentro de un solo `metadata`: una fila por
     documento es lo que hace que «¿aceptó la privacidad v2?» sea una consulta
     y no una lectura de jsonb. */
  const filas = documentos.map((d) => ({
    user_id: userId,
    /* 🔴 EL EJE DEL REGISTRO ES EL **DOCUMENTO**, no el momento (rediseño de C,
       aceptado: la firma pide un registro por documento, y `tipo` distinguía
       cuándo se aceptó, no qué). El MOMENTO —registro · invitación · acceso del
       prestador— baja a `metadata.contexto`, donde sigue siendo consultable sin
       ocupar el eje que P23 necesita. */
    tipo: d.documento,
    aceptado: true,
    version: d.version,
    metadata: {
      contexto: tipo,
      url: d.url,
      origen: 'app',
      registrado_en: new Date().toISOString(),
    },
  }));

  const { data, error } = await getClient().from('consentimientos').insert(filas).select('id');
  if (error) return { registrados: 0, total: filas.length };
  return { registrados: data?.length ?? filas.length, total: filas.length };
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
