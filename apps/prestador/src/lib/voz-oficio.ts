/**
 * S79-B (T2-B3): LA VOZ DE OFICIO COMPLETA — la cura del mudo.
 *
 * `cuenta/index.tsx` computaba 'ambos'|'paseo'|'grooming'|null leyendo SOLO
 * paseo y grooming: un negocio solo-vet o solo-adiestramiento quedaba SIN voz
 * de oficio en su propia identidad — y la cohorte que se recluta es de VETS.
 *
 * UNA verdad en UN lugar: recibe los CUATRO oficios activos y devuelve la
 * lista unida (" · ") en la voz del riel. `oficioAmbos` MURIÓ (Ley 37): la
 * combinación ya no es un caso especial, es la lista con dos entradas.
 * Orden fijo = el orden del tab Negocio (paseo · estética · adiestramiento ·
 * veterinaria), para que las dos superficies digan lo mismo (Ley 17.3).
 */

export type OficiosActivos = {
  paseo: boolean;
  grooming: boolean;
  adiestramiento: boolean;
  vet: boolean;
};

/** Firma angosta (patrón voz-cita-vet): el `t` tipado del app es asignable. */
type TOficio = (
  clave:
    | 'miCuenta.oficioPaseos'
    | 'miCuenta.oficioEstetica'
    | 'miCuenta.oficioAdiestramiento'
    | 'miCuenta.oficioVeterinaria',
) => string;

/** null = ningún oficio activo (la superficie omite la línea, jamás inventa). */
export function vozOficio(oficios: OficiosActivos, t: TOficio): string | null {
  const partes: string[] = [];
  if (oficios.paseo) partes.push(t('miCuenta.oficioPaseos'));
  if (oficios.grooming) partes.push(t('miCuenta.oficioEstetica'));
  if (oficios.adiestramiento) partes.push(t('miCuenta.oficioAdiestramiento'));
  if (oficios.vet) partes.push(t('miCuenta.oficioVeterinaria'));
  return partes.length > 0 ? partes.join(' · ') : null;
}
