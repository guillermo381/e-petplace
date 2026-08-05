/**
 * SEGURIDAD (S84-A27) — cambiar contraseña y recuperarla por CÓDIGO.
 *
 * Alcance firmado para S84. **Recuperar por ENLACE queda para S85** con el
 * tren de la build: exige App Links `https` y hoy hay cero `intentFilters`
 * (medición A21). **El camino del CÓDIGO no necesita nada de eso** — el
 * token viaja como 6 dígitos que la persona tipea.
 *
 * ── ⚠️ LA REGLA QUE NO SE ROMPE ─────────────────────────────────────
 * **NUNCA se declara si un correo existe.** `pedirCodigoRecuperacion`
 * devuelve **`ok` SIEMPRE**, exista la cuenta o no. La superficie dice
 * *"si esa dirección tiene cuenta, te llega un código"* — el mismo mensaje
 * en los dos casos.
 *
 * **Y la parte que es fácil romper sin querer:** `resetPasswordForEmail`
 * de Supabase **tampoco falla** con un email inexistente, así que el
 * tiempo de respuesta ya es indistinguible **por sí solo**. Lo que
 * delataría es agregarle algo: una validación previa del tipo *"ese correo
 * no está registrado"*, puesta con buena intención, **convierte el
 * formulario en un censo de usuarios**. Por eso este wrapper **no consulta
 * nada antes de pedir** — y no es un olvido, es la regla.
 *
 * ── EL BORDE DE LAS CUENTAS SIN CONTRASEÑA (medido: son OCHO) ────────
 * `auth.users`: **137 con proveedor `email`, 8 SIN él** — las cuentas
 * solo-Google que el canon viene arrastrando desde S81. Para esas ocho:
 *   · **cambiar contraseña es imposible**, y decirles *"la contraseña
 *     actual no coincide"* sería MENTIRLES: no tienen ninguna. Por eso
 *     existe `sin_contrasena` como código propio.
 *   · **recuperar por código SÍ funciona, y las SACA DEL CALLEJÓN**: el
 *     flujo de recuperación permite ESTABLECER una contraseña donde no
 *     había. *Efecto lateral bueno y no buscado — se declara para que
 *     quien lo note no crea que es un bug.*
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_ERROR_SEGURIDAD = [
  'sin_sesion',
  'sin_email',
  'sin_contrasena',
  'contrasena_actual_incorrecta',
  'contrasena_debil',
  'contrasena_igual',
  'codigo_invalido',
  'demasiados_intentos',
  'error_desconocido',
] as const;
export type CodigoErrorSeguridad = (typeof CODIGOS_ERROR_SEGURIDAD)[number];

/** EL MOTOR CUMPLE LO QUE LA PANTALLA PROMETE (orden de mesa, S85).
 *
 *  Las dos superficies —`cuenta/seguridad` y `recuperar`— dicen **"Al
 *  menos 8 caracteres"** en es y en (`largoMinimo`, ×2 en cada idioma).
 *  El wrapper exigía **6**, así que una clave de 7 pasaba: la pantalla
 *  pedía una cosa y el motor aceptaba otra. *Una promesa que el motor no
 *  sostiene no es una validación laxa: es una pantalla que miente hacia
 *  el lado cómodo, que es el que nadie reporta.*
 *
 *  ⚠️ **YA NO ESPEJA LA CONFIG DEL SERVIDOR — la EXCEDE, y a propósito.**
 *  `minimum_password_length` del panel de Supabase sigue en **6**
 *  (medido). Exceder es seguro en esta dirección: todo lo que el cliente
 *  acepta (≥8) el servidor también. La dirección peligrosa sería la
 *  inversa —cliente laxo, servidor estricto—, y ésa no ocurre.
 *  Alinear el panel a 8 es un toggle de la visita admin (D-634).
 *
 *  Se valida acá para decirlo ANTES del round-trip (Ley 23), no para
 *  reemplazar al servidor: si los dos divergen, gana el servidor y el
 *  usuario ve su error.
 *
 *  El número viaja INTERPOLADO al mensaje de abajo a propósito: el texto
 *  del rebote es parte del guard, y un guard que dice "6" mientras exige
 *  "8" es el defecto que la candidata #21 nombra. */
const MIN_LARGO = 8;

const MENSAJES: Record<CodigoErrorSeguridad, string> = {
  sin_sesion:                   'No hay sesión activa.',
  sin_email:                    'Tu cuenta no tiene un correo asociado.',
  // NO dice "contraseña incorrecta": no tiene ninguna. Decirle lo otro
  // la mandaría a probar claves que nunca existieron.
  sin_contrasena:               'Tu cuenta entra con Google y todavía no tiene contraseña. Usá "Olvidé mi contraseña" para crear una.',
  contrasena_actual_incorrecta: 'La contraseña actual no coincide.',
  contrasena_debil:             `La contraseña nueva tiene que tener al menos ${MIN_LARGO} caracteres.`,
  contrasena_igual:             'La contraseña nueva tiene que ser distinta de la actual.',
  // el código: ni "no existe" ni "venció" por separado — ver la nota abajo.
  codigo_invalido:              'Ese código no es válido o ya venció. Pedí uno nuevo.',
  demasiados_intentos:          'Esperá un momento antes de pedir otro código.',
  error_desconocido:            'Ocurrió un error inesperado. Probá de nuevo.',
};

/**
 * Segundos que faltan, extraídos del mensaje de rate limit de Supabase
 * (*"For security purposes, you can only request this after N seconds"*).
 *
 * **Se expone para que la superficie DIGA CUÁNTO FALTA en vez de fallar
 * en silencio** — con un techo de 2-3 correos por hora, un rebote mudo
 * hace que la persona pida otro y gaste el cupo que le queda.
 *
 * Devuelve `null` si el mensaje no trae número: la superficie muestra la
 * voz genérica. **Jamás se inventa un número** — un "esperá 60 segundos"
 * calculado a ojo es peor que no decir nada.
 */
function segundosDeEspera(mensaje: string): number | null {
  const m = /after (\d+) seconds?/i.exec(mensaje) ?? /(\d+)\s*segundos?/i.exec(mensaje);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) ? n : null;
}

function esRateLimit(mensaje: string, status?: number): boolean {
  return status === 429 || /rate limit|for security purposes|only request this after/i.test(mensaje);
}

// ── ① CAMBIAR CONTRASEÑA, con re-autenticación ──────────────────────

/**
 * **Exige la contraseña ACTUAL, que Supabase no pide.**
 * `updateUser({ password })` cambia la clave con la sola sesión activa, y
 * `secure_password_change` está en `false` (medido) ⇒ **una sesión robada
 * podría cambiarla sin conocer la vieja**. La re-autenticación previa es
 * una llamada extra y cero dependencias.
 *
 * ⚠️ **`signInWithPassword` con la clave correcta RENUEVA la sesión** — es
 * la misma persona, así que no hay pérdida; se declara porque el efecto
 * existe. **Con la clave incorrecta NO toca la sesión vigente**: el
 * usuario se queda adentro y ve el rebote.
 */
export async function cambiarContrasena(input: {
  actual: string;
  nueva: string;
}): Promise<ResultadoWrapper<null, CodigoErrorSeguridad>> {
  if (input.nueva.length < MIN_LARGO) {
    return { ok: false, codigo: 'contrasena_debil', mensaje: MENSAJES.contrasena_debil };
  }
  if (input.nueva === input.actual) {
    return { ok: false, codigo: 'contrasena_igual', mensaje: MENSAJES.contrasena_igual };
  }

  const { data: auth } = await getClient().auth.getUser();
  const user = auth.user;
  if (!user) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };
  if (!user.email) return { ok: false, codigo: 'sin_email', mensaje: MENSAJES.sin_email };

  // el borde de las OCHO cuentas solo-Google: se distingue ANTES de
  // intentar, para no devolverles "la contraseña no coincide".
  const proveedores = user.app_metadata?.providers;
  const tieneClave = Array.isArray(proveedores) ? proveedores.includes('email') : true;
  if (!tieneClave) {
    return { ok: false, codigo: 'sin_contrasena', mensaje: MENSAJES.sin_contrasena };
  }

  const { error: errorAuth } = await getClient().auth.signInWithPassword({
    email: user.email,
    password: input.actual,
  });
  if (errorAuth) {
    // el rebote es específico: "no coincide" es distinto de "no se pudo".
    return {
      ok: false,
      codigo: 'contrasena_actual_incorrecta',
      mensaje: MENSAJES.contrasena_actual_incorrecta,
    };
  }

  const { error } = await getClient().auth.updateUser({ password: input.nueva });
  if (error) {
    if (/at least|should be|weak/i.test(error.message)) {
      return { ok: false, codigo: 'contrasena_debil', mensaje: MENSAJES.contrasena_debil };
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return { ok: true, data: null };
}

// ── ② RECUPERAR POR CÓDIGO ──────────────────────────────────────────

/**
 * Pide el código de 6 dígitos. **Devuelve `ok` exista la cuenta o no** —
 * ver la regla en la cabecera. El ÚNICO error que puede salir es el rate
 * limit, y **ése no habla del correo sino de quien pide**.
 *
 * ⚠️ **Borde declarado del rate limit:** el techo de Supabase se aplica
 * por destinatario, así que un atacante paciente **podría inferir algo**
 * de recibir 429 en un email y no en otro. **Es una fuga mucho más débil
 * que confirmarlo de frente** —exige repetición y tiempo—, y cerrarla del
 * todo pide un rate limit propio del lado nuestro. Se declara en vez de
 * decir que el flujo es perfecto.
 *
 * ⚠️ **HASTA S86, EL CORREO LLEGA CON LAS PLANTILLAS POR DEFECTO** — en
 * inglés y desde el remitente de Supabase. El motor funciona; el correo se
 * ve ajeno. **La superficie tiene que decirlo** (*"puede llegar en inglés,
 * revisá spam"*), o la persona va a creer que no llegó, pedir otro, y
 * gastar un cupo de 2-3 por hora. Ficha **D-628**.
 */
export async function pedirCodigoRecuperacion(input: {
  email: string;
}): Promise<ResultadoWrapper<{ segundosEspera: number | null }, CodigoErrorSeguridad>> {
  // NO se consulta si el email existe. Ver la regla en la cabecera: una
  // validación previa acá convertiría esto en un censo de usuarios.
  const { error } = await getClient().auth.resetPasswordForEmail(input.email.trim());

  if (error) {
    if (esRateLimit(error.message, error.status)) {
      return {
        ok: false,
        codigo: 'demasiados_intentos',
        mensaje: MENSAJES.demasiados_intentos,
      };
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return { ok: true, data: { segundosEspera: null } };
}

/**
 * PASO 1 — verifica el código. **UNA sola vez, y deja SESIÓN.**
 *
 * ⚠️ **PARTIDO EN DOS POR D-659** (bug cazado por el founder en prueba real).
 * Antes esto y el cambio de clave eran «el mismo acto», y ese acto único ERA
 * el defecto: `verifyOtp` quemaba el token y recién después se sabía si la
 * clave servía. Cuando la clave rebotaba, el reintento —la reacción natural de
 * cualquiera— encontraba el código gastado y la persona quedaba afuera con un
 * correo que ya había usado.
 *
 * **La sesión que deja este paso es la que autoriza el paso 2**, y por eso los
 * reintentos de contraseña ya no re-tocan el token. *El hallazgo de la sesión
 * fantasma, vuelto cura.*
 */

/**
 * (histórico) Canjea el código y establece la contraseña en el mismo acto.
 *
 * `verifyOtp({ type: 'recovery' })` **devuelve sesión** — por eso el
 * `updateUser` de abajo funciona sin más pasos.
 * ⚠️ **NO PROBADO CONTRA UN CORREO REAL** (exige la plantilla, que es de
 * S86): es lectura del contrato de Supabase. **Si al probarlo la sesión no
 * alcanzara, el camino del código se cae y el reparto vuelve a la mesa** —
 * queda escrito acá para que quien lo pruebe sepa qué está verificando.
 *
 * **Los dos fallos del código no se distinguen A PROPÓSITO:** "no existe"
 * y "venció" comparten voz. Separarlos le diría a quien prueba códigos si
 * acertó el formato — y el remedio del usuario es el mismo en los dos
 * casos: pedir uno nuevo.
 */
export async function verificarCodigoRecuperacion(input: {
  email: string;
  codigo: string;
}): Promise<ResultadoWrapper<null, CodigoErrorSeguridad>> {
  const { error } = await getClient().auth.verifyOtp({
    email: input.email.trim(),
    token: input.codigo.trim(),
    type: 'recovery',
  });
  if (error) {
    if (esRateLimit(error.message, error.status)) {
      return { ok: false, codigo: 'demasiados_intentos', mensaje: MENSAJES.demasiados_intentos };
    }
    return { ok: false, codigo: 'codigo_invalido', mensaje: MENSAJES.codigo_invalido };
  }
  return { ok: true, data: null };
}

/**
 * PASO 2 — la contraseña, sobre la sesión que dejó el paso 1.
 *
 * **Se puede reintentar todas las veces que haga falta: NO vuelve a tocar el
 * token.** Ése es el punto de la partición (D-659).
 */
export async function establecerContrasenaNueva(input: {
  nueva: string;
}): Promise<ResultadoWrapper<null, CodigoErrorSeguridad>> {
  if (input.nueva.length < MIN_LARGO) {
    return { ok: false, codigo: 'contrasena_debil', mensaje: MENSAJES.contrasena_debil };
  }

  const { error } = await getClient().auth.updateUser({ password: input.nueva });
  if (error) {
    // ⚠️ D-659: se mapea por `code` ESTABLE, jamás por el literal humano.
    // El bug medido: el regex `/at least|should be|weak/` capturaba
    // "New password should be different from the old password" y lo mostraba
    // como «al menos 8 caracteres» — la contraseña no era débil, era LA MISMA.
    // `should be` es tan común en inglés que capturar por ella captura
    // cualquier cosa, y el proveedor reescribe sus mensajes sin avisar.
    const codigoGoTrue = (error as { code?: string }).code;
    if (codigoGoTrue === 'same_password') {
      return { ok: false, codigo: 'contrasena_igual', mensaje: MENSAJES.contrasena_igual };
    }
    if (codigoGoTrue === 'weak_password') {
      return { ok: false, codigo: 'contrasena_debil', mensaje: MENSAJES.contrasena_debil };
    }
    if (esRateLimit(error.message, error.status)) {
      return { ok: false, codigo: 'demasiados_intentos', mensaje: MENSAJES.demasiados_intentos };
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return { ok: true, data: null };
}

/**
 * ⚠️ **CAMINO VIEJO — QUEMA EL CÓDIGO SI LA CLAVE REBOTA (D-659).**
 *
 * Se conserva SOLO para que `recuperar.tsx` siga compilando hasta que C lo
 * migre a los dos pasos. **No se usa en superficie nueva.** Hoy compone las
 * dos funciones, así que hereda la cura del traductor de errores — pero
 * **no la cura de orden**: si el paso 2 rebota, el token ya se gastó, que es
 * exactamente el defecto que la partición existe para arreglar.
 *
 * **Muere con el lote de la pantalla.**
 */
export async function canjearCodigoRecuperacion(input: {
  email: string;
  codigo: string;
  nueva: string;
}): Promise<ResultadoWrapper<null, CodigoErrorSeguridad>> {
  if (input.nueva.length < MIN_LARGO) {
    return { ok: false, codigo: 'contrasena_debil', mensaje: MENSAJES.contrasena_debil };
  }
  const verificado = await verificarCodigoRecuperacion(input);
  if (!verificado.ok) return verificado;
  return establecerContrasenaNueva({ nueva: input.nueva });
}

/** Expuesto para que la superficie pueda decir CUÁNTO FALTA cuando el
 *  rebote es de rate limit. Se exporta la función, no un número: el dato
 *  vive en el mensaje del servidor y no se inventa. */
export { segundosDeEspera };
