// S72-A · frontera ÚNICA de la descripción de un presupuesto en una cita
// `procedimiento` (Pieza 3, ambos lados). La cita todo-libre coordinada gana
// `tipo_servicio='procedimiento'` (etiqueta genérica): el lector trae la
// descripción real del presupuesto para que ni el vet ni el dueño lean
// "Procedimiento" donde dice "Limpieza dental".
//
// DATOS, NO PROSA (Ley 3): este módulo devuelve `{ primera, extras }` crudo —
// la VOZ ("primera +N", o el fallback de cada actor) vive en el i18n de cada
// app. El TOTAL JAMÁS viaja acá (D-457: la plata es de NEGOCIO, por rol).
//
// Vive en UN solo lugar a propósito: el día que nazca `presupuesto_item.orden`
// (D-473), el orden se cura acá y los dos lectores lo heredan sin drift.
//
// OJO — el fragmento de embed NO se comparte como constante: postgrest-js
// infiere el tipo del `.select()` del STRING LITERAL en compilación, y una
// concatenación (`'...' + const`) colapsa el tipo a GenericStringError. Cada
// lector lleva el embed INLINE, idéntico:
//   presupuesto:presupuesto!evento_cita_servicio_presupuesto_id_fkey(items:presupuesto_item(id, descripcion_libre, created_at))
// El nombre de la FK (`!evento_cita_servicio_presupuesto_id_fkey`) es
// OBLIGATORIO: hay DOS FKs entre evento_cita_servicio y presupuesto, así que
// `presupuesto:presupuesto` a secas rompe el select con PGRST201 (regresión
// S72-A curada). El SQL directo NO reproduce esto — solo la API PostgREST.

export type DescripcionPresupuesto = { primera: string | null; extras: number };

/** `primera` = descripcion_libre del primer ítem; `extras` = cuántos ítems más.
 *  null si la cita no tiene presupuesto o el presupuesto no trae ítems (el
 *  caller decide su fallback). Orden: created_at con `id` de desempate — la
 *  tabla no tiene `orden` (D-473) y los ítems de un presupuesto se insertan en
 *  batch con created_at IDÉNTICO, así que sin el desempate `primera` variaría
 *  entre renders; `id` (uuid) lo hace DETERMINISTA. Maneja el embed to-one
 *  como objeto o como array-de-uno (según PostgREST). Si la RLS ocultara los
 *  ítems, cae a null — degradación honesta (Ley 13). */
export function descripcionDePresupuesto(presupuesto: unknown): DescripcionPresupuesto | null {
  const pres = Array.isArray(presupuesto) ? presupuesto[0] : presupuesto;
  if (pres === null || pres === undefined || typeof pres !== 'object') return null;
  const items = (pres as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;
  const clave = (x: unknown) =>
    String((x as { created_at?: unknown }).created_at ?? '') + '|' + String((x as { id?: unknown }).id ?? '');
  const ordenados = [...items].sort((a, b) => {
    const ka = clave(a);
    const kb = clave(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  const primeraRaw = (ordenados[0] as { descripcion_libre?: unknown }).descripcion_libre;
  return {
    primera: typeof primeraRaw === 'string' ? primeraRaw : null,
    extras: ordenados.length - 1,
  };
}
