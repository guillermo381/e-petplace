/**
 * EL CANDADO BIOMÉTRICO — la lógica local (S104-C · MODELO_LOGIN §2.5).
 *
 * ── QUÉ ES, Y QUÉ NO ──────────────────────────────────────────────────────
 * Huella / Face ID como **candado sobre la sesión existente**, JAMÁS como
 * factor contra Supabase. La sesión ya existe y sigue existiendo detrás del
 * candado; esto solo tapa el contenido hasta que la persona se identifique
 * ante SU teléfono. La pieza visual es `PantallaDeCandado` (packages/ui, B);
 * acá vive quién le pregunta al SO y dónde se guarda la preferencia.
 *
 * ── EL MÓDULO NATIVO SE CARGA CON `require` EN try/catch (patrón D-456) ────
 * `expo-local-authentication` es NATIVO y no viaja por OTA (L-134). Está
 * horneado en el build actual de las dos apps (medido por A contra el commit
 * ancla), pero el `require` guarda el caso de un build futuro que lo pierda:
 * si el módulo no resolvió, el candado queda INERTE (la preferencia no se
 * puede activar) en vez de crashear al montar.
 *
 * ── LA PREFERENCIA ES POR DISPOSITIVO ────────────────────────────────────
 * Vive en AsyncStorage, no en la cuenta: el candado protege ESTE teléfono, y
 * quién lo enciende decide para su aparato. Un booleano no es secreto —
 * AsyncStorage alcanza, no hace falta SecureStore.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// `require` en try/catch: si el nativo no está en el build, queda null y el
// candado se apaga solo, sin tirar la app.
let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LocalAuthentication = require('expo-local-authentication');
} catch {
  LocalAuthentication = null;
}

const CLAVE = 'epp.bloqueo_biometrico';

/** ¿El módulo nativo viajó en este build? Si no, el candado no existe. */
export function moduloBiometricoPresente(): boolean {
  return LocalAuthentication !== null;
}

/** ¿El teléfono TIENE biometría configurada? (hardware + al menos una huella
 *  o rostro enrolados). Sin esto, no se puede ofrecer el candado. */
export async function biometricoDisponible(): Promise<boolean> {
  if (!LocalAuthentication) return false;
  try {
    const [hardware, enrolado] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hardware && enrolado;
  } catch {
    return false;
  }
}

/** ¿La persona activó el candado en este dispositivo? */
export async function bloqueoActivado(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CLAVE)) === '1';
  } catch {
    return false;
  }
}

export async function fijarBloqueo(activado: boolean): Promise<void> {
  try {
    if (activado) await AsyncStorage.setItem(CLAVE, '1');
    else await AsyncStorage.removeItem(CLAVE);
  } catch {
    // Un fallo de storage no debe tirar la pantalla; el peor caso es que la
    // preferencia no se guarde, y el candado no se activa: fail-closed.
  }
}

/**
 * Le pide al SO que reconozca a la persona. Devuelve si dijo que sí.
 *
 * `disableDeviceFallback: true` — el fallback del SO (PIN del teléfono) se
 * APAGA a propósito: nuestro fallback es entrar con la clave de la CUENTA
 * (§2.5), no el PIN del aparato. Si la biometría falla, la única salida es la
 * contraseña de la cuenta, que `PantallaDeCandado` ofrece siempre.
 */
export async function pedirIdentidad(mensaje: string): Promise<boolean> {
  if (!LocalAuthentication) return false;
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: mensaje,
      disableDeviceFallback: true,
    });
    return r.success;
  } catch {
    return false;
  }
}
