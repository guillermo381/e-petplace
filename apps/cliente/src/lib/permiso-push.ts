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

/** El módulo de avisos, tal como esta casa lo consume. Se declara el
 *  contrato MÍNIMO que se usa — no se importan los tipos del paquete,
 *  porque importarlos evaluaría su JS, que es justo lo que la sonda
 *  existe para no hacer. */
export interface ModuloAvisos {
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getDevicePushTokenAsync: () => Promise<{ data?: unknown }>;
}

/**
 * ⭐ S90-B — EL MÓDULO, O NULL SI EL BINARIO NO LO TRAE.
 *
 * PORT DECLARADO desde `apps/prestador/src/lib/permiso-push.ts` (S90-B).
 * **Territorio cruzado, declarado:** lo escribió la pista B, dueña de
 * `packages/ui` y del lint; `apps/cliente` no es suyo. Va acá porque la
 * cura es la MISMA pieza al revés y clonarla habría sido exactamente lo
 * que el método prohíbe.
 *
 * POR QUÉ EXISTE APARTE DE `permisoPushDelSistema`: ese veredicto colapsa
 * «nunca se preguntó» (`undetermined`) dentro de `no_medible`, y para
 * PREFERENCIAS eso está bien —no se afirma nada sobre un permiso que no
 * se conoce (L-197)—. **Pero la invitación de la casa vive exactamente en
 * ese caso**: invita a quien todavía no decidió. Si consumiera el
 * veredicto, no invitaría nunca — y su modo de falla sería el silencio,
 * que es lo que L-192 prohíbe.
 */
export function moduloAvisosSiHayNativo(): ModuloAvisos | null {
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
  if (sonda === null) return null;

  // ② Con el nativo PRESENTE, recién acá se evalúa el JS del paquete.
  let modulo: Partial<ModuloAvisos> | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('expo-notifications');
  } catch {
    return null;
  }
  if (
    modulo === null ||
    typeof modulo.getPermissionsAsync !== 'function' ||
    typeof modulo.requestPermissionsAsync !== 'function' ||
    typeof modulo.getDevicePushTokenAsync !== 'function'
  ) {
    return null;
  }
  return modulo as ModuloAvisos;
}

export async function permisoPushDelSistema(): Promise<PermisoPush> {
  const modulo = moduloAvisosSiHayNativo();
  if (modulo === null) return 'no_medible';
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
