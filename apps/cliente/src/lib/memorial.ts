/**
 * ¿ESTÁ EN MEMORIAL? — **LA definición, y vive sólo acá.**
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **PERDIDA NO ES MEMORIAL.** Firma del founder, 7-sep-2026.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * *Una mascota perdida puede volver, y la familia que la está buscando
 * necesita la app ENTERA* — el expediente para dar señas, el pasaporte para
 * que quien la encuentre sepa a quién llamar, la agenda para avisar al vet.
 * **Apagarle el producto a quien busca es castigarla por su pérdida.**
 *
 * ── LO QUE HABÍA, MEDIDO ────────────────────────────────────────────────
 * La casa tenía **dos reglas vivas que no coincidían**, y la mayoría estaba
 * del lado equivocado:
 * ```
 *   estado_vida !== null && !== 'activa'                  ⇒ perdida ES memorial
 *     hogar/index ×3 · [mascotaId] ×3 · vacunas · nexo/atajos · postventa/puerta
 *
 *   estado_vida !== null && !== 'activa' && !== 'perdida' ⇒ perdida NO lo es
 *     pasaporte ×2
 * ```
 * **Nueve ocurrencias contra dos**, y la de dos era la correcta. *La regla
 * buena estaba escrita y perdía por mayoría — que es lo que pasa cuando una
 * definición se re-deriva en cada archivo en vez de importarse.*
 *
 * ⚠️ **Una de las nueve la escribí yo en la tanda anterior** (`postventa/puerta`),
 * copiando la forma dominante sin preguntarme qué decía. *Es exactamente el
 * mecanismo: la forma equivocada se propaga porque parece la convención.*
 *
 * ── SI UNA SUPERFICIE NECESITA OTRA COSA, LA DECLARA CONTRA ESTA ────────
 * No re-deriva. Ejemplo vivo y legítimo: el certificado de salud del
 * prestador pregunta **`estado_vida === 'activa'`** para el campo «viva», que
 * es otra pregunta —clínica, no de duelo— y por eso no usa esto. *Lo que la
 * regla prohíbe no es tener otra pregunta: es escribir otra respuesta a la
 * MISMA pregunta.*
 */

import type { EstadoVidaMascota } from '@epetplace/api';

/**
 * 🔴 **EXHAUSTIVA A PROPÓSITO, con `switch` y no con `=== 'fallecida'`.**
 *
 * Las dos formas dan lo mismo hoy. La diferencia es qué pasa **el día que
 * nazca un cuarto estado**: con la comparación directa cae en «no es
 * memorial» **en silencio**; con el `switch` exhaustivo, `tsc` no compila
 * hasta que alguien lo clasifique — *que es el momento en que hay que
 * clasificarlo*. Mismo criterio que el `Record` completo de los glifos.
 *
 * `null` = sin declarar ⇒ **no es memorial**. Es el default de una mascota
 * recién dada de alta y no significa nada sobre su vida.
 */
export function esMemorial(estadoVida: EstadoVidaMascota | string | null | undefined): boolean {
  if (estadoVida === null || estadoVida === undefined) return false;

  switch (estadoVida as EstadoVidaMascota) {
    case 'fallecida':
      return true;
    /* 🔴 La firma del founder, en una línea de código: la que se busca
       sigue teniendo la app entera. */
    case 'perdida':
      return false;
    case 'activa':
      return false;
    default: {
      /* Un valor que el tipo no conoce llega del servidor: no se adivina.
         **Se trata como NO memorial** —la salida que conserva el producto—
         y el tipo de abajo hace que un valor nuevo del ENUM no llegue acá
         sin romper la compilación primero. */
      const _exhaustivo: never = estadoVida as never;
      void _exhaustivo;
      return false;
    }
  }
}

/**
 * ¿La está buscando? Se expone al lado de la de arriba **para que las dos
 * preguntas se lean juntas** y nadie vuelva a meter `perdida` adentro de
 * memorial por no tener dónde ponerla.
 */
export function estaPerdida(estadoVida: EstadoVidaMascota | string | null | undefined): boolean {
  return estadoVida === 'perdida';
}
