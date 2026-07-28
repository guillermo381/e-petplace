/**
 * S80-B1 (D-509 ①): la marca de "recién registrado" — estado de sesión
 * de JS, patrón `ceremoniaResuelta` del guard raíz. CERO AsyncStorage
 * (la lección del puente S79: estado por dispositivo miente en cuanto
 * hay dos; acá ni hace falta durar — tras reiniciar, la rama sin_rol
 * cae a la voz genérica CURADA, que dice el mismo camino).
 *
 * Se compara por email normalizado: si otra cuenta entra en la misma
 * sesión de JS, la marca no le habla a quien no se registró.
 */

let emailRegistrado: string | null = null;

export function marcarRegistroReciente(email: string): void {
  emailRegistrado = email.trim().toLowerCase();
}

export function esRegistroReciente(email: string | null | undefined): boolean {
  if (emailRegistrado === null || email == null) return false;
  return email.trim().toLowerCase() === emailRegistrado;
}
