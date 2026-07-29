/**
 * La voz humana de UN hecho del timeline (S82-C — extraída de
 * hogar/index cuando el perfil de mascota la necesitó; regla 37: el
 * diccionario vive UNA vez). Ley 3: el código del evento jamás sale de
 * acá; desconocido degrada digno — 'Momento de cuidado' (precedente
 * LineaDeVida). Las keys viven en el namespace hogar.* del cliente.
 */

import type { useTraduccion } from '@/i18n';

type Traductor = ReturnType<typeof useTraduccion>['t'];

export function vozHecho(item: { tipo: string; vacuna_nombre: string | null }, t: Traductor): string {
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
export const FAMILIA_DE_TIPO: Record<string, 'paseos' | 'estetica' | 'adiestramiento' | 'salud'> = {
  atencion_paseo_registrada: 'paseos',
  atencion_grooming_registrada: 'estetica',
  atencion_adiestramiento_registrada: 'adiestramiento',
  vacuna_aplicada: 'salud',
  historia_clinica_registrada: 'salud',
};
