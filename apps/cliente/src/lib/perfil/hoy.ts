/**
 * ⭐ **EL HOY DEL PERFIL: los cuatro datos de `CeldasHoy`** (S113-C · 1.1 · C6).
 *
 * Deriva, del perfil, lo que la pieza de B dibuja. Vive acá y no en la pantalla
 * porque son decisiones —qué es «al día», qué plaga cuenta, cuál medicación se
 * nombra— y porque así se pueden probar sin montar nada.
 */
import type { CoberturaPlaga, Plaga } from '@epetplace/ui';

/** El vocabulario de la casa para las plagas. **Sale del tipo de B, no del
 *  dato**: medido el 5-sep, `evento_desparasitacion_aplicada` tiene **CERO
 *  filas** en toda la base, así que no hay valores reales contra los cuales
 *  calibrar. *Un mapeo escrito contra datos que no existen se verifica el día
 *  que existan* — por eso lo desconocido no se descarta en silencio: cae en
 *  `otras`, y la pantalla decide si lo dice. */
const CONOCIDAS: readonly Plaga[] = ['pulgas', 'garrapatas', 'mosquitos', 'internos'];

const esPlaga = (x: string): x is Plaga => (CONOCIDAS as readonly string[]).includes(x);

export interface DesparasitacionMinima {
  plagas: string[] | null;
  fecha_proxima: string | null;
  fecha_aplicada: string | null;
  producto: string;
}

/**
 * La cobertura por plaga. `alDia: null` = **no hay registro de esa plaga**, que
 * la pieza distingue de «vencida» — *y esa distinción es la que evita decirle a
 * una familia que su perro está descubierto cuando lo que pasa es que nadie
 * anotó nada.*
 */
export function coberturaDePlagas(
  filas: readonly DesparasitacionMinima[],
  hoy: string,
): CoberturaPlaga[] {
  return CONOCIDAS.map((p) => {
    const suyas = filas.filter((f) => (f.plagas ?? []).some((x) => x.toLowerCase() === p));
    if (suyas.length === 0) return { plaga: p, alDia: null };
    /* Con varias aplicaciones manda la que protege más lejos: la próxima MÁS
       TARDÍA. Tomar la última aplicada daría «vencida» cuando una anterior
       todavía cubre. */
    const proximas = suyas.map((f) => f.fecha_proxima).filter((f): f is string => f !== null);
    if (proximas.length === 0) {
      /* Aplicada sin próxima: **hay registro y no se sabe hasta cuándo**. No es
         «al día» ni «vencida»; se dice que no se sabe con `null`. */
      return { plaga: p, alDia: null };
    }
    return { plaga: p, alDia: proximas.sort().at(-1)! >= hoy };
  });
}

/** La próxima desparasitación que toca, de cualquier plaga. `null` si ninguna
 *  fila trae fecha. */
export function proximaDesparasitacion(filas: readonly DesparasitacionMinima[]): string | null {
  const f = filas.map((x) => x.fecha_proxima).filter((x): x is string => x !== null).sort();
  return f.length > 0 ? f[0] : null;
}

/** La medicación que se nombra en la celda: **la primera con nombre**. La
 *  franja ya dice lo urgente y la pieza de abajo las lista todas; la celda es
 *  un vistazo, no un inventario. */
export function medicacionDeLaCelda(
  filas: readonly { nombre: string | null; hasta: string | null }[],
): { nombre: string; hasta: string | null } | null {
  for (const m of filas) {
    const n = m.nombre?.trim();
    if (n !== undefined && n.length > 0) return { nombre: n, hasta: m.hasta };
  }
  return null;
}
