/**
 * EL ESPACIO DE LA GUARDERÍA — **una sola lectura para las dos superficies**
 * (S107-C, 30-ago).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 EL DEFECTO QUE ESTO CURÓ, Y ERA EL PEOR DE LOS DOS POSIBLES
 * ═══════════════════════════════════════════════════════════════════════════
 * La portada decía **«0 animales por día»** y el taller **8**. No era que una
 * leyera otra fuente: **leían LA MISMA y la interpretaban distinto** —
 * `obtenerCupoGuarderia(hoy, hoy)`, que devuelve la capacidad **DE ESE DÍA** y
 * en un día que el lugar no abre vale `0`. Medido un **domingo**, con Aurora
 * abriendo L-V: la portada mostró ese 0 rotulado como la capacidad del
 * negocio, y el taller mostró **su default**, un número que no había leído.
 *
 * ☠️ **Y adentro había una PÉRDIDA DE DATOS:** un prestador con capacidad 12
 * que abriera su taller un sábado habría visto 8 y al guardar **se la habría
 * bajado a 8 sin un solo error.** Dos de cada siete días.
 *
 * ── ⏪ LA CURA DE PANTALLA MURIÓ: AHORA HAY DATO ─────────────────────────
 * Acá vivió un rodeo —*leer el cupo de 14 días y tomar el máximo*— porque
 * `capacidad_por_dia` **no tenía lector**. A publicó `obtenerEspaciosGuarderia`
 * y el rodeo se retira entero (Ley 37).
 *
 * **Y hacía falta retirarlo, no sólo mejorarlo:** el máximo sobre 14 días
 * coincide con la capacidad configurada **sólo si el patrón cubre esos días**
 * — con una excepción, o con una sala que abre sólo fines de semana, deja de
 * coincidir. *Era correcto mientras no había dato, y falso apenas lo hay.*
 *
 * ── 🔴 LA LECCIÓN QUE DEJÓ, Y ES LA QUE GOBIERNA ESTE ARCHIVO (`L-439`) ───
 * > **Una limitación declarada en el código protege a quien toca el archivo,
 * > no a quien usa la pantalla.**
 *
 * Yo había declarado el rodeo en la cabecera del taller —*«se declara para que
 * nadie lea esto como el modelo final»*— **y rompió igual**, porque el
 * prestador no lee cabeceras. Su corolario, de A: **un atajo que puede
 * producir un valor equivocado no se declara — se hace inexpresable.**
 *
 * ── POR QUÉ DEVUELVE UN ESPACIO Y NO UN NÚMERO ───────────────────────────
 * **Un negocio no tiene UNA capacidad**: tiene espacios, cada uno con su
 * número y sus días. Colapsarlos acá me obligaría a elegir cuál —¿la suma? ¿la
 * del lunes?— *y sería un número bien calculado contestando una pregunta que
 * no es la suya.*
 *
 * ⚠️ **HOY EL TALLER GESTIONA EXACTAMENTE UNO** (upsert por nombre fijo). Por
 * eso esta función devuelve **ese** espacio y, aparte, **cuántos hay** — para
 * que una segunda sala **se vea** en vez de ser ignorada en silencio. *Las dos
 * superficies leen el MISMO objeto: no pueden volver a divergir.*
 *
 * 🔴 **`null` es «no sé», y NO «cero».** *Un cero se escribe encima de la
 * configuración; un «no sé» frena.*
 */

import { obtenerEspaciosGuarderia, type EspacioGuarderia } from '@epetplace/api';

/** El nombre con el que el taller upserta su espacio. Su clave, no su voz. */
export const NOMBRE_ESPACIO = 'Principal';

export type LecturaEspacio =
  | {
      ok: true;
      /** El que el taller gestiona. `null` = todavía no configuró ninguno. */
      espacio: EspacioGuarderia | null;
      /** Cuántos espacios activos tiene el negocio. >1 ⇒ el taller queda corto. */
      cuantos: number;
    }
  /** No se pudo preguntar. **No es cero.** */
  | { ok: false };

export async function leerEspacioDelTaller(prestadorId: string): Promise<LecturaEspacio> {
  const r = await obtenerEspaciosGuarderia(prestadorId);
  if (!r.ok) return { ok: false };
  const activos = r.data.filter((e) => e.activo);
  return {
    ok: true,
    espacio: activos.find((e) => e.nombre === NOMBRE_ESPACIO) ?? activos[0] ?? null,
    cuantos: activos.length,
  };
}
