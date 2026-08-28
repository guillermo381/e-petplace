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
export function reglasSegunLugar(lugar: LugarDeCaptura): readonly ReglaEncuadre[] {
  return lugar === 'domicilio'
    ? REGLAS_ENCUADRE
    : REGLAS_ENCUADRE.filter((r) => r !== 'domicilio_primer_plano');
}
