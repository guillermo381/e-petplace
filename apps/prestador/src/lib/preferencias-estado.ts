/**
 * El ESPEJO de `preferencia_efectiva` (migración `20260805000000`, §③) —
 * la regla de celda de la grilla de Preferencias.
 *
 * PORT DECLARADO (S88-C) de `apps/cliente/src/lib/preferencias-estado.ts`
 * (pista D, Lote 4) — la excepción §6 del método: se comparte la FORMA
 * (la lógica del espejo es una sola verdad), jamás la voz. Si el SQL de
 * `preferencia_efectiva` cambia, cambian LOS DOS espejos — el par del
 * cliente es donde esa divergencia se caza.
 *
 * EL LITERAL QUE ESPEJA (SQL):
 *   COALESCE(
 *     persistido(user, categoria, canal),
 *     CASE WHEN canal = 'whatsapp' THEN false ELSE categoria.default END,
 *     false
 *   )
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
