/**
 * El permiso de notificaciones del SO, medido sin mentir (lámina §5):
 * un chip de Push que se ve activo sobre un permiso negado es la
 * superficie mintiendo sobre algo que puede medir.
 *
 * ⚠️ CURA S88-D (crash del founder, cura por hipótesis adjudicada por la
 * mesa — L-190: la frontera JS no cubre nativo): la v1 hacía
 * `require('expo-notifications')` dentro de un try — pero eso EVALÚA la
 * cadena entera de módulos del paquete sobre un APK que no trae el
 * nativo (el del campo, 16-jul, pre-S81), y su modo de falla no está
 * bajo nuestro control. La v2 NO evalúa ese JS en absoluto si el nativo
 * no está: SONDEA primero con `requireOptionalNativeModule` de
 * expo-modules-core —que devuelve null y JAMÁS lanza, y cuyo nativo el
 * APK viejo SÍ trae— y recién con el módulo presente toca el paquete.
 * Es el patrón D-579/L-187 de la casa (la sonda del manifest).
 *
 * Si no se puede medir: `no_medible` — L-197: lo que no se puede medir
 * vale AUSENCIA, jamás un valor. `no_medible` NO se pinta como negado
 * ni como concedido.
 */

export type PermisoPush = 'concedido' | 'negado' | 'no_medible';

export async function permisoPushDelSistema(): Promise<PermisoPush> {
  // ① LA SONDA — ¿el binario que me corre trae el nativo de
  // notificaciones? expo-modules-core está en todo APK de la casa; su
  // requireOptionalNativeModule devuelve null sin lanzar.
  let sonda: unknown = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const core = require('expo-modules-core') as {
      requireOptionalNativeModule?: (nombre: string) => unknown;
    };
    sonda = core.requireOptionalNativeModule?.('ExpoNotificationPermissionsModule') ?? null;
  } catch {
    sonda = null;
  }
  if (sonda === null) return 'no_medible';

  // ② Con el nativo PRESENTE, recién acá se evalúa el JS del paquete.
  let modulo: { getPermissionsAsync?: () => Promise<{ status: string }> } | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('expo-notifications');
  } catch {
    modulo = null;
  }
  if (modulo === null || typeof modulo.getPermissionsAsync !== 'function') {
    return 'no_medible';
  }
  try {
    const r = await modulo.getPermissionsAsync();
    if (r.status === 'granted') return 'concedido';
    if (r.status === 'denied') return 'negado';
    // 'undetermined' y cualquier estado nuevo: todavía no hay verdad que
    // afirmar sobre el permiso — no se pinta advertencia.
    return 'no_medible';
  } catch {
    return 'no_medible';
  }
}
