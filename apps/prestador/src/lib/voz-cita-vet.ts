/**
 * S72-B (pieza 3): la voz de la cita PROCEDIMIENTO en las superficies de HOY.
 *
 * Un procedimiento todo-libre coordinado gana `tipo_servicio='procedimiento'`
 * (S72-A, 04a93b4) para entrar a la agenda vet — pero su `tipo.nombre` es el
 * genérico "Procedimiento". El lector (683d691) trae `descripcionPresupuesto`;
 * la regla firmada por la mesa la resuelve ACÁ, en UN solo lugar, para que la
 * celda de agenda y el detalle de la cita digan LO MISMO (una superficie que
 * contradice a la otra en el mismo dato es peor que el genérico).
 *
 * DATOS, NO PROSA (Ley 3): `primera` es la descripción del primer ítem;
 * `extras` = cuántos ítems MÁS hay. La voz ("primera +N") vive acá, jamás en
 * el lector — el «+N» se traduciría por idioma en el riel, no en la DB.
 *
 * Nota de dato (verificado por A contra DB viva): `primera` es DETERMINISTA
 * pero semánticamente ARBITRARIA — los ítems se insertan en batch con el mismo
 * created_at y desempatan por id, así que la "primera" puede no ser la que el
 * vet tipeó primero. Se corrige con `presupuesto_item.orden` (deuda, disparo P2).
 */

/** El sub-shape que trae el lector (nullable: los otros oficios y las citas vet normales no lo tienen). */
type DescripcionPresupuesto = { primera: string | null; extras: number } | null | undefined;

/** Firma angosta: solo las dos keys que la regla usa (el `t` tipado del app es asignable por contravarianza). */
type TProc = (
  clave: 'agenda.procGenerico' | 'agenda.procMasN',
  valores?: Record<string, string | number>,
) => string;

export function vozCitaVet(
  descripcionPresupuesto: DescripcionPresupuesto,
  tipoNombre: string,
  t: TProc,
): string {
  // null = NO es un procedimiento coordinado → la etiqueta del tipo, como siempre.
  if (descripcionPresupuesto == null) return tipoNombre;
  // sin descripción legible → el genérico honesto (L-139).
  const base = descripcionPresupuesto.primera ?? t('agenda.procGenerico');
  // extras=0 → SOLO la descripción (jamás "+0" — dato real verificado por A).
  return descripcionPresupuesto.extras > 0
    ? t('agenda.procMasN', { base, n: descripcionPresupuesto.extras })
    : base;
}
