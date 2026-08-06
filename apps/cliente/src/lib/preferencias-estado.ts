/**
 * El ESPEJO de `preferencia_efectiva` (migración `20260805000000`, §③) —
 * la regla de celda de la grilla de Preferencias (Lote 4, lámina firmada).
 *
 * EL LITERAL QUE ESPEJA (SQL):
 *   COALESCE(
 *     persistido(user, categoria, canal),
 *     CASE WHEN canal = 'whatsapp' THEN false ELSE categoria.default END,
 *     false
 *   )
 *
 * POR QUÉ UN ESPEJO Y NO UNA RE-DERIVACIÓN: la pantalla tiene que mostrar
 * lo que el motor VA A HACER — el default no se inventa acá, viene del
 * catálogo (server). Precedente de la casa: `puedeEncenderVitrina` es el
 * espejo exacto del predicado de su trigger (S78), con discriminador de
 * no-divergencia. El de éste vive en su par: si el SQL cambia, cambia esto
 * — y el par es el lugar donde esa divergencia se caza.
 */

export function preferenciaEfectiva(input: {
  /** Lo persistido para (categoria, canal) — undefined si no hay fila. */
  persistida: boolean | undefined;
  canal: string;
  /** `default_habilitada` de la categoría (catálogo). */
  defaultCategoria: boolean;
}): boolean {
  if (input.persistida !== undefined) return input.persistida;
  if (input.canal === 'whatsapp') return false;
  return input.defaultCategoria;
}

/** La existencia de una fila = ¿le llega por ALGÚN canal? (gate 4 del
 *  motor: cero canales habilitados = descartada). */
export function filaEncendida(input: {
  canales: string[];
  persistidas: Record<string, boolean>;
  categoria: string;
  defaultCategoria: boolean;
}): boolean {
  return input.canales.some((canal) =>
    preferenciaEfectiva({
      persistida: input.persistidas[`${input.categoria}:${canal}`],
      canal,
      defaultCategoria: input.defaultCategoria,
    }),
  );
}
