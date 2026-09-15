/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LA GRILLA DE HORAS — **lo que hay y lo que no** (S116-C · lote 5 · ④)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `SelectorHora` dibuja una hora **apagada y no elegible** cuando no queda
 * lugar. Los lectores del motor (`obtener_inicios_*`) **sólo devuelven las que
 * SÍ tienen lugar** —*«slot sin cupo NO se pinta: silencio digno»*, la decisión
 * de S55— así que sin esto la pieza nunca podría dibujar una apagada.
 *
 * ── 🔴 LA DERIVACIÓN, Y SU LÍMITE, ESCRITO ──────────────────────────────────
 * La grilla se arma **entre la primera y la última hora que el motor devolvió**,
 * en pasos de 30 minutos, y **los huecos de adentro salen apagados**.
 *
 * **Por qué sólo el interior:** un hueco entre dos horas ofrecidas es un hecho
 * —*a esa hora no hay lugar*— y da igual si la causa es que está ocupada o que
 * nadie abrió franja: **para la familia significan lo mismo**. En cambio una
 * hora ANTES de la primera o DESPUÉS de la última **no se sabe si existe**: el
 * negocio puede abrir a las 9 o a las 11, y dibujar las 7 apagadas afirmaría que
 * las 7 son un horario posible que hoy está lleno. *Inventar el borde de la
 * jornada es exactamente el verosímil-falso que `L-139` prohíbe.*
 *
 * ⚠️ **Con una sola hora disponible no hay interior**, así que la grilla es esa
 * sola. Es correcto: no hay nada medido entre un punto y sí mismo.
 *
 * ⚠️ **El paso de 30 es el del motor**, no una elección: los inicios vienen del
 * menú canónico de la casa, que se mueve de media hora en media hora. *Si algún
 * día el motor ofrece cuartos, esto deja de partir bien y hay que traer el paso
 * del servidor en vez de suponerlo.*
 */

import type { HoraOpcion } from '@epetplace/ui';

const PASO_MIN = 30;

/** `'HH:mm'` o `'HH:mm:ss'` → minutos del día. `null` si no es una hora. */
function aMinutos(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (m === null) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function aTexto(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/**
 * Las horas del día para `SelectorHora`: las que el motor ofreció, disponibles;
 * los huecos de adentro, apagados.
 *
 * @param inicios lo que devolvió el lector — **sólo las que tienen lugar**.
 */
export function grillaDeHoras(inicios: readonly string[]): HoraOpcion[] {
  /* Se normaliza a minutos ANTES de ordenar: ordenar los textos funciona con
     `HH:mm` de dos dígitos y se rompe con `9:00`, que es la clase de dato que
     aparece el día que otro lector arme la lista. */
  const disponibles = new Map<number, string>();
  for (const h of inicios) {
    const m = aMinutos(h);
    /* Una hora ilegible **se omite**: pintarla como disponible ofrecería un
       horario que el motor va a rechazar (Ley 23). */
    if (m !== null) disponibles.set(m, h);
  }
  if (disponibles.size === 0) return [];

  const min = Math.min(...disponibles.keys());
  const max = Math.max(...disponibles.keys());
  const salida: HoraOpcion[] = [];
  for (let m = min; m <= max; m += PASO_MIN) {
    const original = disponibles.get(m);
    salida.push({
      /* El código es **el string que el motor dio** cuando existe: es lo que se
         le devuelve al reservar, y re-formatearlo sería mandarle otra cosa. */
      codigo: original ?? aTexto(m),
      etiqueta: aTexto(m),
      disponible: original !== undefined,
    });
  }
  return salida;
}
