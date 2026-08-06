/**
 * El permiso de notificaciones del SO, medido sin mentir (lámina §5):
 * un chip de «En el teléfono» que se ve activo sobre un permiso negado
 * es la superficie mintiendo sobre algo que puede medir.
 *
 * PORT DECLARADO (S88-C) de `apps/cliente/src/lib/permiso-push.ts` — LA
 * V2 de la pista D (cura del crash del founder, L-190: la frontera JS no
 * cubre nativo). El prestador tiene el MISMO riesgo: APKs de campo que
 * no traen el nativo de notificaciones. La v2 NO evalúa el JS del
 * paquete si el nativo no está: SONDEA primero con
 * `requireOptionalNativeModule` de expo-modules-core (devuelve null y
 * JAMÁS lanza) — patrón D-579/L-187 de la casa.
 *
 * Si no se puede medir: `no_medible` — L-197: lo que no se puede medir
 * vale AUSENCIA, jamás un valor.
 */

export type PermisoPush = 'concedido' | 'negado' | 'no_medible';

export async function permisoPushDelSistema(): Promise<PermisoPush> {
  // ① LA SONDA — ¿el binario que me corre trae el nativo?
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
    return 'no_medible';
  } catch {
    return 'no_medible';
  }
}
