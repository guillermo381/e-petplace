/**
 * encuadre.ts — LAS REGLAS DE CAPTURA, COMO CÓDIGOS (S107-D).
 *
 * 🔴 `CRITERIO_LEGAL_GUARDERIA` §5 es **ley de captura**. Este archivo NO
 * contiene su texto y no puede contenerlo: el §0 del plan prohíbe redactar
 * legales en las pistas —**placeholder incluido**— y el contrato de A §④ lo
 * repite: *«ningún texto de este bloque se redacta en pantalla como cláusula —
 * la pantalla sólo guía el encuadre»*. Acá viven **los códigos**; la voz la
 * pone el diccionario de C y la lee el founder en su lote.
 *
 * Vive aparte del hook a propósito: sin dependencias de React ni de React
 * Native, **se puede probar en banco**. *Una regla que decide qué se le pide a
 * quien dispara no debería ser inauditable por arrastrar la cámara detrás.*
 */

export const REGLAS_ENCUADRE = [
  'animal_en_cuadro',
  'personas_no',
  'menores_descarte',
  'domicilio_primer_plano',
] as const;

export type ReglaEncuadre = (typeof REGLAS_ENCUADRE)[number];

export type LugarDeCaptura = 'instalaciones' | 'domicilio';

/**
 * Qué reglas guiar según dónde se dispara.
 *
 * En **instalaciones** no se guía sobre fachadas: esa regla no aplica ahí, y
 * **una guía que menciona lo que no puede pasar enseña a ignorar la guía**. En
 * el **domicilio** —las fotos del acta— rigen las cuatro, y la del primer
 * plano es la que evita el dato personal del §5.3 (la fachada revela domicilio
 * asociado a identidad).
 *
 * ⚠️ `menores_descarte` y `personas_no` NO se modulan por lugar: **rigen
 * siempre**. Modularlas sería exactamente el hueco por el que entra la foto que
 * no debía existir.
 */
/**
 * ⚠️ **DEVUELVE UNA TUPLA NO VACÍA (S111-C), y es lo que ya cumplía.**
 *
 * Antes prometía `readonly ReglaEncuadre[]` — un tipo que **admite vacío** —
 * mientras sus dos ramas devuelven **4 y 3** reglas. *El tipo decía menos de lo
 * que la función garantiza*, y el consumidor tenía que estrechar o castear algo
 * que nunca podía pasar.
 *
 * 🔴 **Y no se promete a mano: el `filter` NO conserva el largo**, así que
 * afirmar la tupla sobre su resultado sería exactamente la promesa que este
 * cambio existe para no hacer. Se construye la lista **enumerando la primera
 * regla aparte**: ahí el compilador ve el primer elemento y la garantía es
 * suya, no mía.
 *
 * *Su consumidor —`EvidenciaClip` de B— exige no-vacía y además **apaga el
 * obturador si llega vacía**: dos capas, y ninguna depende de que yo me acuerde
 * (`L-424`). Falla cerrado: sin guía no se graba.*
 */
export function reglasSegunLugar(
  lugar: LugarDeCaptura,
): readonly [ReglaEncuadre, ...ReglaEncuadre[]] {
  const resto = REGLAS_ENCUADRE.filter(
    (r) => r !== 'animal_en_cuadro' && (lugar === 'domicilio' || r !== 'domicilio_primer_plano'),
  );
  /* `animal_en_cuadro` es la primera SIEMPRE y en los dos lugares — es la regla
     madre del encuadre, y ponerla al frente es lo que hace que el tipo pueda
     ser no-vacío sin una afirmación. */
  return ['animal_en_cuadro', ...resto];
}
