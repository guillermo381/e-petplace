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
 * POR QUÉ EXISTE APARTE DE `permisoPushDelSistema`, y es la razón entera:
 * ese veredicto colapsa «nunca se preguntó» (`undetermined`) dentro de
 * `no_medible`, y para PREFERENCIAS eso está bien —no se afirma nada sobre
 * un permiso que no se conoce (L-197)—. **Pero la invitación de la casa
 * vive exactamente en ese caso**: invita a quien todavía no decidió. Si
 * consumiera el veredicto, no invitaría nunca — y su modo de falla sería
 * el silencio, que es lo que L-192 prohíbe.
 *
 * La sonda es LA MISMA (patrón D-579/L-187): `requireOptionalNativeModule`
 * devuelve null y JAMÁS lanza, y su nativo lo trae todo APK de la casa.
 * Recién con el nativo presente se evalúa el JS del paquete (L-190: la
 * frontera JS no cubre nativo — el crash del founder salió de ahí).
 */
export function moduloAvisosSiHayNativo(): ModuloAvisos | null {
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
    return 'no_medible';
  } catch {
    return 'no_medible';
  }
}
