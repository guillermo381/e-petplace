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
import { normalizarEmail } from './_email';
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
 *  ✅ **FIRMA FOUNDER S88 — 8 EN TODOS LADOS.** El número vive acá, UNA vez
 *  (`MIN_LARGO_CONTRASENA`), y todo lo que lo diga lo importa. El panel de
 *  Supabase (`minimum_password_length`, medido en **6**) se alinea a 8 —
 *  toggle de la visita admin, D-634.
 *  Mientras el panel siga en 6 no hay bug: el cliente EXCEDE al servidor y esa
 *  dirección es segura. La peligrosa es la inversa, y no ocurre.
 *
 *  Se valida acá para decirlo ANTES del round-trip (Ley 23), no para
 *  reemplazar al servidor: si los dos divergen, gana el servidor y el
 *  usuario ve su error.
 *
 *  El número viaja INTERPOLADO al mensaje de abajo a propósito: el texto
 *  del rebote es parte del guard, y un guard que dice "6" mientras exige
 *  "8" es el defecto que la candidata #21 nombra. */
export const MIN_LARGO_CONTRASENA = 8;

/**
 * LARGO DEL CÓDIGO DE RECUPERACIÓN — **espeja una config del SERVIDOR**.
 *
 * Lo elige GoTrue (`MAILER_OTP_LENGTH`), no nosotros: hoy manda **8 dígitos**,
 * medido con un código real que llegó al correo del founder (S92-BIS).
 *
 * ⚠️ **LA DIVERGENCIA ACÁ ES MÁS PELIGROSA QUE LA DE `MIN_LARGO_CONTRASENA`, y
 * conviene tenerlo claro:** con el largo de contraseña, el cliente **excede** al
 * servidor y esa dirección es segura —pide de más, el servidor acepta—. Con el
 * código **no hay dirección segura**: si acá dice 6 y llegan 8, el campo corta y
 * el botón nunca se habilita; si dice 10 y llegan 8, el botón nunca se habilita
 * tampoco. **Cualquiera de los dos lados que se mueva sin el otro deja la
 * recuperación INUSABLE**, con el motor sano y la pantalla muda.
 *
 * Vive acá, una sola vez, porque el número no es de una pantalla: es de la
 * política de auth. Si alguien cambia `MAILER_OTP_LENGTH` en el dashboard, este
 * archivo es el único lugar que hay que tocar — **y nada va a avisar que hay
 * que hacerlo** (la clase de L-219: la config vive en otro producto).
 */
export const LARGO_CODIGO_RECUPERACION = 8;

/** Alias local histórico — el número vive UNA vez (firma founder S88). */
const MIN_LARGO = MIN_LARGO_CONTRASENA;

const MENSAJES: Record<CodigoErrorSeguridad, string> = {
  sin_sesion:                   'No hay sesión activa.',
  sin_email:                    'Tu cuenta no tiene un correo asociado.',
  // NO dice "contraseña incorrecta": no tiene ninguna. Decirle lo otro
  // la mandaría a probar claves que nunca existieron.
  sin_contrasena:               'Tu cuenta entra con Google y todavía no tiene contraseña. Usa "Olvidé mi contraseña" para crear una.',
  contrasena_actual_incorrecta: 'La contraseña actual no coincide.',
  /* ⚠️ UNA SOLA VOZ PARA DOS CAUSAS, Y ES A PROPÓSITO (D-720, firma founder).
     El servidor manda `weak_password` **tanto** para «muy corta» **como** para
     «está en las listas de filtradas» — el mismo código, distinto texto en
     inglés. *Mapear por código es lo correcto (D-659 ②) y aun así no alcanza
     para distinguirlas.* El mensaje viejo decía «al menos 8 caracteres» ante
     una clave filtrada de once, y quien obedecía agregaba caracteres y volvía a
     rebotar: **el rebote empujaba a la acción que garantizaba el próximo
     fracaso**, igual que el bucle de D-659.
     Esta voz cubre las dos causas sin mentir en ninguna, y da camino. */
  contrasena_debil:
    `Necesitamos una contraseña más fuerte: mínimo ${MIN_LARGO} caracteres y evita palabras o combinaciones fáciles de identificar. Un truco: tres palabras que no tengan relación, como melon-lampara-rio.`,
  contrasena_igual:             'La contraseña nueva tiene que ser distinta de la actual.',
  /* ⚠️ ESTE MENSAJE ALIMENTABA EL BUCLE QUE CAZÓ EL FOUNDER (S88, re-prueba
     de D-659). Decía: «Ese código no es válido o ya venció. Pedí uno nuevo.»
     — y CALLABA el único dato que importaba: **pedir uno nuevo invalida el
     anterior.** La persona pide otro, el correo viejo sigue en la bandeja
     junto al nuevo, tipea el que tiene a mano, vuelve a fallar, y el mensaje
     le repite «pedí uno nuevo». *El rebote empujaba exactamente a la acción
     que garantizaba el próximo fracaso.*
     GoTrue devuelve `otp_expired` para «vencido» Y para «no coincide»: esa
     distinción NO se puede hacer y no se finge. Lo que sí se puede decir es
     cuál es la causa probable — y ahora se dice. */
  codigo_invalido:
    'Ese código ya no sirve. Si pediste uno nuevo, solo funciona el del último correo — los anteriores dejan de valer.',
  demasiados_intentos:          'Espera un momento antes de pedir otro código.',
  error_desconocido:            'Ocurrió un error inesperado. Prueba de nuevo.',
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

  /* ⚠️ `current_password` NO ES REDUNDANTE con la re-autenticación de arriba, y
     su ausencia tuvo el camino CAÍDO (D-719, S92-BIS).

     Cuando el founder encendió «require current password», GoTrue pasó a
     exigir el campo **en el PUT mismo**: la sesión fresca que deja
     `signInWithPassword` **no le alcanza**. Medido por el camino literal de
     este wrapper — re-autenticación 200, y el `updateUser` siguiente
     `400 current_password_required`. *Ningún prestador podía cambiar su
     contraseña, y ése es el único camino legítimo que deja la regla 87.*

     El valor ya estaba en la mano: `input.actual`. */
  const { error } = await getClient().auth.updateUser({
    password: input.nueva,
    current_password: input.actual,
  });
  if (error) {
    // ⚠️ Se mapea por `code` ESTABLE primero (D-659 ②). El regex de abajo
    // sobrevive solo como red para instancias que no manden código.
    const codigoGoTrue = (error as { code?: string }).code;
    if (codigoGoTrue === 'same_password') {
      return { ok: false, codigo: 'contrasena_igual', mensaje: MENSAJES.contrasena_igual };
    }
    if (codigoGoTrue === 'weak_password') {
      return { ok: false, codigo: 'contrasena_debil', mensaje: MENSAJES.contrasena_debil };
    }
    /* El día que este brazo se dispare, algo cambió en el contrato del
       servidor — pero el usuario NO tiene que ver «error inesperado» por eso:
       la contraseña actual es un campo que la pantalla sí tiene, y decirle que
       no coincide le da una acción. Es la voz honesta más cercana. */
    if (codigoGoTrue === 'current_password_required') {
      return {
        ok: false,
        codigo: 'contrasena_actual_incorrecta',
        mensaje: MENSAJES.contrasena_actual_incorrecta,
      };
    }
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
  const { error } = await getClient().auth.resetPasswordForEmail(normalizarEmail(input.email));

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
    /* ☠️ ACÁ VIVÍA UN CATCH-ALL, y fue lo que hizo INDIAGNOSTICABLE el freno
       del founder (S88): **todo** lo que no era rate limit —red caída, 500 del
       proveedor, correo mal escrito, cualquier cosa— salía como «ese código no
       es válido». *El rebote acusaba al código sin haberlo mirado.*

       Es EXACTAMENTE el defecto que D-659 ② curó en `establecerContrasenaNueva`
       —mapear por `code` estable y no a ciegas— **y que sobrevivió acá**: se
       curó el hermano y no el gemelo. La lección de la casa, cobrada de nuevo:
       cuando la causa de un defecto es un PATRÓN, la cura se barre por el
       patrón, jamás por el sitio que lo destapó.

       Ahora el código se acusa SOLO cuando GoTrue lo acusa (`otp_expired`, que
       el proveedor usa tanto para vencido como para no-coincide — esa mitad no
       se puede partir y no se finge). Todo lo demás dice que no sabe, que es
       la verdad. */
    const codigoGoTrue = (error as { code?: string }).code;
    if (codigoGoTrue === 'otp_expired' || error.status === 403) {
      return { ok: false, codigo: 'codigo_invalido', mensaje: MENSAJES.codigo_invalido };
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
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

// ☠️ `canjearCodigoRecuperacion` MURIÓ ACÁ (S88).
//
// Su lápida decía «muere con el lote de la pantalla», y el lote llegó: C
// construyó el reset en dos pasos sobre `verificarCodigoRecuperacion` +
// `establecerContrasenaNueva`, y el camino viejo quedó con CERO consumidores
// (medido antes de borrar, no supuesto).
//
// **Se mata en vez de dejarse:** hacía las dos cosas «en el mismo acto» y ese
// acto único ERA el defecto — si la clave rebotaba, el token ya estaba quemado
// y el reintento encontraba el correo gastado. *Un camino muerto que quema
// tokens no es código inerte: es una trampa esperando al próximo que lo
// importe porque el autocompletado se lo ofreció.*

/** Expuesto para que la superficie pueda decir CUÁNTO FALTA cuando el
 *  rebote es de rate limit. Se exporta la función, no un número: el dato
 *  vive en el mensaje del servidor y no se inventa. */
export { segundosDeEspera };
