/**
 * El permiso de notificaciones del SO, medido sin mentir (lámina §5):
 * un chip de Push que se ve activo sobre un permiso negado es la
 * superficie mintiendo sobre algo que puede medir.
 *
 * ⚠️ REQUIRE PROTEGIDO (patrón D-456/D-579): `expo-notifications` entró a
 * package.json en S81 pero el APK preview del campo (build `99c6002f`,
 * 16-jul) NO trae el módulo nativo — un import directo en el bundle OTA
 * crashearía exactamente los teléfonos que hoy existen. Si el módulo no
 * está: `no_medible` — L-197: lo que no se puede medir vale AUSENCIA,
 * jamás un valor. `no_medible` NO se pinta como negado ni como concedido.
 */

export type PermisoPush = 'concedido' | 'negado' | 'no_medible';

export async function permisoPushDelSistema(): Promise<PermisoPush> {
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
