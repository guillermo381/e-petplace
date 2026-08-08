/**
 * La voz humana de UN hecho del timeline (S82-C — extraída de
 * hogar/index cuando el perfil de mascota la necesitó; regla 37: el
 * diccionario vive UNA vez). Ley 3: el código del evento jamás sale de
 * acá; desconocido degrada digno — 'Momento de cuidado' (precedente
 * LineaDeVida). Las keys viven en el namespace hogar.* del cliente.
 */

import type { useTraduccion } from '@/i18n';

type Traductor = ReturnType<typeof useTraduccion>['t'];

/**
 * S91 · LOS TRES HITOS NARRATIVOS — voces FIRMADAS por el founder (8-ago).
 *
 * Se resuelven por `hito_clave` y NO por `tipo`: los tres comparten
 * `tipo = 'hito_narrativo'`, así que el tipo no discrimina. Es la misma
 * excepción que ya vivía acá para `vacuna_aplicada`.
 *
 * ⚠️ LAS CLAVES SALIERON DEL OBJETO, NO DE UN DOCUMENTO. La orden de mesa
 * nombró «llegada»; la fila viva de `cat_hitos_narrativos` es
 * `llego_a_la_familia` (medido: las tres claves activas). Manda la fuente.
 *
 * ⚠️ Y LA DEGRADACIÓN ES PARTE DEL CONTRATO: una clave que este bundle no
 * conozca cae al genérico. No se agrega un fallback que adivine — un bundle
 * viejo no puede inventarle voz a un hito nuevo (mismo criterio que D-662 con
 * los papeles). El nodo genérico es feo y es honesto.
 */
const VOZ_HITO: Record<string, 'hogar.hechoHitoVidaNueva' | 'hogar.hechoHitoLlegoALaFamilia' | 'hogar.hechoHitoMundoNuevo'> = {
  vida_nueva_empieza: 'hogar.hechoHitoVidaNueva',
  llego_a_la_familia: 'hogar.hechoHitoLlegoALaFamilia',
  mundo_nuevo_empieza: 'hogar.hechoHitoMundoNuevo',
};

/**
 * `nombreMascota` es OBLIGATORIO y no opcional a propósito: solo una de las
 * tres voces lo usa, pero si fuera opcional el llamador que se olvidara
 * pintaría «llegó a la familia» sin sujeto — y eso no lo caza ningún
 * typecheck. Exigirlo mueve el error de runtime a compilación (L-192: un modo
 * de falla silencioso no es un modo de falla aceptable).
 */
export function vozHecho(
  item: { tipo: string; vacuna_nombre: string | null; hito_clave?: string | null },
  t: Traductor,
  nombreMascota: string,
): string {
  const claveHito = item.hito_clave ? VOZ_HITO[item.hito_clave] : undefined;
  if (claveHito !== undefined) return t(claveHito, { nombre: nombreMascota });

  switch (item.tipo) {
    case 'atencion_paseo_registrada': return t('hogar.hechoPaseo');
    case 'atencion_grooming_registrada': return t('hogar.hechoGrooming');
    case 'atencion_adiestramiento_registrada': return t('hogar.hechoAdiestramiento');
    case 'vacuna_aplicada':
      return item.vacuna_nombre !== null
        ? t('hogar.hechoVacuna', { nombre: item.vacuna_nombre })
        : t('hogar.hechoVacunaSinNombre');
    case 'historia_clinica_registrada': return t('hogar.hechoConsulta');
    default: return t('hogar.hechoMomento');
  }
}

/** La familia del hecho (el eje del filtro y del canto — Ley 3). */
export const FAMILIA_DE_TIPO: Record<
  string,
  'paseos' | 'estetica' | 'adiestramiento' | 'salud' | 'bitacora'
> = {
  // S91 · P4 — la bitácora es familia PROPIA del filtro. No entra a 'salud'
  // ni a un oficio: lo que la familia observa no es un servicio, y meterlo en
  // una casilla ajena haría que el chip de ese oficio mintiera sobre lo que
  // agrupa.
  bitacora_familia_registrada: 'bitacora',
  atencion_paseo_registrada: 'paseos',
  atencion_grooming_registrada: 'estetica',
  atencion_adiestramiento_registrada: 'adiestramiento',
  vacuna_aplicada: 'salud',
  historia_clinica_registrada: 'salud',
};
