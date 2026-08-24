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
/* ☠️ `VERSION_TERMINOS_VIGENTE = 'legales-2026-08'` MURIÓ el 24-ago-2026, el
   mismo día que nació. Era una versión ÚNICA y provisional, inventada cuando el
   canon no fijaba vocabulario legal. **La reemplaza `VERSION_LEGAL`**, que da
   una versión POR DOCUMENTO — que es lo que el abogado entregó y lo que P23
   necesita. Se retira en vez de dejarse: dos fuentes de «qué versión escribo»
   conviviendo es el defecto que esta misma tanda vino a cerrar en el correo. */

/**
 * LA VERSIÓN DE CADA DOCUMENTO, por separado.
 *
 * ⚠️ **Las dos de términos nacen en `1.0` porque son DOCUMENTOS NUEVOS** — el
 * abogado partió el único `/terminos` (que C midió en **v1.1**) en dos textos
 * distintos: consumo y B2B. *Heredar el `1.1` del documento viejo diría que
 * alguien aceptó una v1.1 de un texto que nunca existió en v1.0.* La privacidad
 * **sí** conserva su `1.1`: es la misma, común a los dos, con secciones 3.1 y
 * 3.2 separadas adentro.
 *
 * 🔴 **Y el freno que este archivo ya se cobró una vez:** `tratamiento_datos`
 * se registró como tipo y nunca tuvo página. **Antes de que una pantalla ofrezca
 * estos dos, C confirma contra el sitio que las URLs existen** — un check que
 * apunta a una página que no está le pide a alguien que acepte algo que no
 * puede leer.
 */
export const VERSION_LEGAL: Record<DocumentoLegal, string> = {
  terminos_parent: '1.0',
  terminos_professional: '1.0',
  privacidad: '1.1',
};

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
 * fabricar el consentimiento de otro). Con la verificación de correo apagada,
 * `signUp` devuelve sesión y esto entra en el mismo acto.
 *
 * ✅ **Y con la verificación ENCENDIDA tampoco hace falta aflojar nada ni sumar
 * superficie: entra por `confirmarAltaConCodigo()`, porque `verifyOtp` DEVUELVE
 * SESIÓN.** *La respuesta no era una RPC con privilegios: era registrar el
 * consentimiento un momento después, cuando la cuenta empieza a existir de
 * verdad.* (Firma del founder, 24-ago — ver la ficha D-893.)
 */
export async function registrarConsentimiento(
  userId: string,
  tipo: TipoConsentimiento,
  urlMostrada: string | null = null,
): Promise<boolean> {
  const r = await registrarConsentimientos(userId, tipo, documentosVigentes(tipo, urlMostrada ? { privacidad: urlMostrada } : {}));
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
export function documentosVigentes(
  contexto: TipoConsentimiento,
  urls: Partial<Record<DocumentoLegal, string>> = {},
): DocumentoAceptado[] {
  /* 🔴 EL DOCUMENTO LO DECIDE LA PUERTA, y las dos que se confunden fácil son
     `acceso_prestador` (solicitar acceso Y aceptar invitación de empleado):
     **las dos son puertas del PRESTADOR**, así que va el documento profesional
     aunque la persona sea la misma que en el cliente. *El registro guarda el
     documento que se vio de verdad, no el que le correspondería a la persona.* */
  const terminos: DocumentoLegal =
    contexto === 'acceso_prestador' ? 'terminos_professional' : 'terminos_parent';

  return [
    { documento: terminos,     version: VERSION_LEGAL[terminos],     url: urls[terminos] ?? null },
    { documento: 'privacidad', version: VERSION_LEGAL['privacidad'], url: urls['privacidad'] ?? null },
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
export type DocumentoLegal = 'terminos_parent' | 'terminos_professional' | 'privacidad';

/**
 * LO QUE SE PUEDE REGISTRAR COMO CONSENTIMIENTO — y son DOS clases distintas.
 *
 * `DocumentoLegal` son **textos que la persona leyó y aceptó**. Los dos de
 * abajo **no son documentos: son ACTOS** que el contrato exige consentir por
 * separado, y por eso no se meten en el mismo union sin decirlo.
 *
 * · **`arbitraje`** (§38.10 de los T&C): **opcional y separado**. Si el
 *   profesional NO lo acepta, **el contrato subsiste** y la vía es la justicia
 *   ordinaria ⇒ **hay que poder registrar el «NO», con su fecha.** *Un
 *   consentimiento que solo sabe decir que sí no es un consentimiento: es una
 *   condición.*
 * · **`dictado_voz`** (§31.6): **previo, específico, separado y REVOCABLE.**
 *   El microcopy de la pantalla no alcanza — *avisar no es consentir*.
 */
export type ActoConsentible = 'arbitraje' | 'dictado_voz';
export type TipoRegistrable = DocumentoLegal | ActoConsentible;

export interface DocumentoAceptado {
  documento: TipoRegistrable;
  /** La versión de ESE documento, jamás una global — hoy `terminos` y
   *  `privacidad` van en `1.1`, medidas del sitio. */
  version: string;
  /** La URL exacta que se le mostró. */
  url: string | null;
  /** **`false` es un valor legítimo, no un error.** El arbitraje se puede
   *  rechazar y el contrato sigue en pie; el dictado se puede revocar. Por
   *  defecto `true`, que es el caso de los documentos. */
  aceptado?: boolean;
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
    aceptado: d.aceptado ?? true,
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

/**
 * CONFIRMAR EL ALTA CON EL CÓDIGO DE 8 DÍGITOS — y registrar el consentimiento
 * **en el mismo acto**.
 *
 * ── POR QUÉ ESTA FUNCIÓN EXISTE Y LA RPC DEFINER NO SE USA ───────────────
 * Con `mailer_autoconfirm` apagado, `signUp` **no devuelve sesión** ⇒ el
 * consentimiento no se puede registrar ahí (la policy es `auth.uid() =
 * user_id`). Se midió de verdad: la cuenta sonda del gate de D-893 quedó con
 * `consentimientos = 0` (**D-896**).
 *
 * La primera respuesta fue una RPC `SECURITY DEFINER`. **La descartó el
 * founder con la razón correcta: `verifyOtp` DEVUELVE SESIÓN**, así que
 * alcanza con registrar el consentimiento un momento después — **sin aflojar la
 * policy y sin sumar una superficie con privilegios.**
 *
 * **Lo que se pierde con esperar al código: nada.** *Si alguien abandona entre
 * crear la cuenta y canjear el código, no hay cuenta usable que necesite
 * evidencia.* El consentimiento se registra **cuando la cuenta empieza a
 * existir**, que es exactamente cuando P23 lo necesita.
 *
 * *(La RPC `registrar_consentimiento_de_alta` **queda viva y declarada** como el
 * camino del invitado que acepta por enlace — no se borra, no se usa acá.)*
 */
export async function confirmarAltaConCodigo(input: {
  email: string;
  codigo: string;
  urlsLegales?: Partial<Record<DocumentoLegal, string>>;
}): Promise<
  ResultadoWrapper<
    SesionDueno & { consentimiento_registrado: boolean },
    CodigoErrorAuth | 'codigo_invalido'
  >
> {
  const { data, error } = await getClient().auth.verifyOtp({
    email: normalizarEmail(input.email),
    token: input.codigo.trim(),
    type: 'signup',
  });

  if (error) {
    /* Un código malo y uno vencido son la misma respuesta a propósito: decir
       cuál falló le confirma a un extraño que ese correo tiene cuenta. */
    return { ok: false, codigo: 'codigo_invalido', mensaje: 'Ese código no es válido o ya venció. Pedí uno nuevo.' };
  }
  if (!data.user) return mapeoErrorAuth(undefined, 'datos_inconsistentes');

  /* Acá SÍ hay sesión — es el punto entero de esta función. El consentimiento
     entra por la policy normal, sin privilegios prestados. */
  const r = await registrarConsentimientos(
    data.user.id,
    'registro',
    documentosVigentes('registro', input.urlsLegales ?? {}),
  );

  return {
    ok: true,
    data: {
      user_id: data.user.id,
      email: data.user.email ?? null,
      nombre: nombreDeMetadata(data.user.user_metadata),
      consentimiento_registrado: r.total > 0 && r.registrados === r.total,
    },
  };
}

/**
 * REENVIAR EL CÓDIGO DE ALTA — la segunda mitad de la pantalla de verificación.
 *
 * ── 76(c): HUNK ADITIVO EN packages/api, A RATIFICACIÓN DE A ──────────────
 * La pantalla `/verificar-correo` (pista C) necesita reenviar el código, y la
 * puerta única prohíbe que el app llame a Supabase directo. Es la gemela de
 * `confirmarAltaConCodigo`: mismo `type: 'signup'`, mismo email normalizado.
 * `auth.resend` NO revela si el correo tiene cuenta (responde igual exista o
 * no) — así que reenviar no filtra la existencia, igual que el canje.
 *
 * La cuenta regresiva de 60s es de la PANTALLA, no de acá: este wrapper solo
 * dispara el reenvío y dice si salió.
 */
export async function reenviarCodigoAlta(
  email: string,
): Promise<ResultadoWrapper<null, CodigoErrorAuth>> {
  const { error } = await getClient().auth.resend({
    type: 'signup',
    email: normalizarEmail(email),
  });
  if (error) return mapeoErrorAuth(error.code, error.message);
  return { ok: true, data: null };
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

// ═══════════════════════════════════════════════════════════════════════════
// LOS DOS ACTOS CONSENTIBLES — arbitraje (§38.10) y dictado por voz (§31.6)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * 🔴 **REVOCAR ES AGREGAR, NUNCA EDITAR NI BORRAR.**
 *
 * `consentimientos` no tiene policy de UPDATE ni de DELETE, **y está bien que
 * no la tenga**: si una fila de consentimiento se pudiera reescribir, dejaría
 * de poder demostrar nada — que es lo único que P23 le pide.
 *
 * ⇒ **el estado vigente de un acto es su fila MÁS RECIENTE**, y revocar es
 * escribir una nueva con `aceptado = false`. *Así queda registrado no solo qué
 * decidió la persona, sino cuándo cambió de opinión — que es exactamente lo que
 * un consentimiento revocable tiene que poder mostrar.* (Mismo criterio que
 * D-544: corregir una nota sedimentada es agregar, no editar.)
 */
export interface EstadoConsentimiento {
  vigente: boolean;
  /** `null` si la persona nunca se pronunció — que NO es lo mismo que un «no». */
  decidido_en: string | null;
  version: string | null;
}

export async function consultarConsentimiento(
  acto: TipoRegistrable,
): Promise<ResultadoWrapper<EstadoConsentimiento, 'sin_sesion' | 'error_desconocido'>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: 'No hay una sesión activa.' };

  const { data, error } = await cliente
    .from('consentimientos')
    .select('aceptado, created_at, version')
    .eq('user_id', uid)
    .eq('tipo', acto)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { ok: false, codigo: 'error_desconocido', mensaje: 'No pudimos leer tu preferencia.' };
  }
  /* Nunca se pronunció ⇒ `vigente:false` con `decidido_en:null`. La pantalla
     tiene que distinguir «dijo que no» de «todavía no le preguntamos»: el
     primero se respeta, el segundo se pregunta. */
  if (!data) return { ok: true, data: { vigente: false, decidido_en: null, version: null } };
  return {
    ok: true,
    data: { vigente: data.aceptado === true, decidido_en: data.created_at, version: data.version },
  };
}

/** Registra la decisión sobre un acto. `aceptado:false` es una respuesta
 *  legítima —no un fallo—: el arbitraje se rechaza y el dictado se revoca. */
export async function decidirConsentimiento(input: {
  acto: TipoRegistrable;
  aceptado: boolean;
  version: string;
  url?: string | null;
  contexto?: TipoConsentimiento;
}): Promise<ResultadoWrapper<null, 'sin_sesion' | 'error_desconocido'>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: 'No hay una sesión activa.' };

  const r = await registrarConsentimientos(uid, input.contexto ?? 'registro', [
    { documento: input.acto, version: input.version, url: input.url ?? null, aceptado: input.aceptado },
  ]);
  if (r.registrados !== r.total) {
    return { ok: false, codigo: 'error_desconocido', mensaje: 'No pudimos guardar tu decisión.' };
  }
  return { ok: true, data: null };
}
