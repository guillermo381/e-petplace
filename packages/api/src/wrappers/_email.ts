/**
 * LA NORMALIZACIÓN DEL CORREO — una sola implementación, para TODA puerta.
 *
 * Vive en su propio archivo y no dentro de `auth.ts` por una razón mecánica:
 * `auth.ts` ya importa de `seguridad.ts` (`MIN_LARGO_CONTRASENA`), y
 * `seguridad.ts` necesita normalizar en su puerta de recuperación. Dejarla en
 * `auth.ts` crearía un ciclo de imports entre los dos wrappers. *Un helper que
 * usan dos módulos que se conocen entre sí vive afuera de los dos.*
 *
 * ── POR QUÉ EXISTE (S104-A) ───────────────────────────────────────────────
 * Medido: 17 de 165 filas de `profiles.email` divergían de `auth.users.email`,
 * y **las 17 divergían SOLO por mayúsculas**. `auth` normaliza; la copia
 * guardaba lo tipeado. **La divergencia no nació de un bug del motor: nació de
 * que nadie normalizó en el campo.**
 *
 * `MODELO_LOGIN` §5.1 lo pide como checklist: *«Normalizar email en TODA
 * puerta (trim + lower)»*. **TODA** incluye la de recuperación, que hacía
 * `trim()` sin `toLowerCase()` — hueco encontrado al contrastar la letra
 * contra el objeto, no al leer el diff.
 */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}
