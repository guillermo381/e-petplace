/**
 * EL CRITERIO DE UNA SERIE, EN UN SOLO LUGAR (S113-A · 2.2).
 *
 * 🔴 **«SIN DATO → SIN GRÁFICO» TIENE TRES ESTADOS, Y EL DEL MEDIO ES EL QUE
 * MIENTE** (firma founder, 6-sep-2026 · lección de E): sin dato · **un punto**
 * · serie. *Un sparkline de un solo punto se lee «estable» —una línea recta, un
 * valor que no se mueve— y eso es una afirmación que un dato solo no sostiene.*
 *
 * El caso vacío se nota; el de un punto **no**: no está vacío, no falla, dibuja
 * algo perfectamente creíble, y por eso nadie va a verificarlo.
 *
 * ── POR QUÉ VIVE ACÁ Y NO EN CADA PANTALLA ─────────────────────────────────
 * `obtener_tablero_mascota` ya devuelve `peso.serie_dibujable` resuelto por el
 * motor, que es la forma preferida. Pero hay series que llegan como array plano
 * —`obtenerHistoriaPeso`, los tracks de paseo, las barras de la semana— y
 * cambiarles la forma rompería a sus consumidores. Para ésas, el criterio se
 * IMPORTA de acá. *Si cada superficie decide cuántos puntos alcanzan, alcanza
 * una que decida distinto para que el mismo animal se vea de dos formas.*
 */

/** El mínimo para que una línea signifique algo. Dos: uno no es una serie. */
export const MINIMO_PARA_SERIE = 2;

/** `false` con cero o un punto. Toda pieza que dibuje una línea pregunta esto
 *  ANTES de dibujar — no después, y jamás contando el array a mano. */
export function esSerieDibujable(puntos: readonly unknown[] | null | undefined): boolean {
  return (puntos?.length ?? 0) >= MINIMO_PARA_SERIE;
}

export type Tendencia = 'sube' | 'baja' | 'igual' | null;

/**
 * 🔴 Devuelve **`null`** con menos de dos puntos, y eso **no es `'igual'`**:
 * *«no se sabe» y «no cambió» son cosas distintas, y confundirlas convierte una
 * ausencia de medición en una medición.*
 *
 * @param valores en orden CRONOLÓGICO (el último es el más reciente).
 */
export function tendenciaDeSerie(valores: readonly number[] | null | undefined): Tendencia {
  if (!valores || valores.length < MINIMO_PARA_SERIE) return null;
  const ultimo = valores[valores.length - 1];
  const previo = valores[valores.length - 2];
  if (ultimo > previo) return 'sube';
  if (ultimo < previo) return 'baja';
  return 'igual';
}
