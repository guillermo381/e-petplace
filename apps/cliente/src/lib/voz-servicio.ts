/**
 * S61-A1 (FALLA-J1 del juez): la voz del COMPRABLE vive en el riel —
 * el dueño jamás lee `tipos_servicio.nombre` crudo (es-only, D-388) ni
 * el código del motor (Ley 3). Mapa CERRADO código→key, patrón
 * VOZ_SUBIDA del carnet (regla 36): los comprables de grooming estrenan
 * sus keys (LOTE S61, gate founder); los de paseo REUSAN la voz ya
 * gateada de 'Paseo'/'Walk'.
 *
 * Nota de alcance: hoy las ofertas grooming no tienen `nombre_custom`
 * (relevado S61) — la voz canónica por código es la única. Cuando el
 * menú custom por groomer exista, su nombre es DATO del prestador y
 * necesita su propio carril (familia D-388), no este mapa.
 */

const KEY_VOZ_SERVICIO = {
  grooming: 'servicioVoz.grooming',
  grooming_completo: 'servicioVoz.groomingCompleto',
  adiestramiento: 'servicioVoz.adiestramiento',
  // S68-A2: los comprables del mundo vet (V2 + urgencia same-day).
  consulta_general: 'servicioVoz.consultaGeneral',
  vacunacion: 'servicioVoz.vacunacion',
  urgencia_local: 'servicioVoz.urgenciaLocal',
  urgencia_domicilio: 'servicioVoz.urgenciaDomicilio',
  paseo: 'explorar.paseoTitulo',
  paseo_30min: 'explorar.paseoTitulo',
  paseo_60min: 'explorar.paseoTitulo',
  paseo_paquete: 'explorar.paseoTitulo',
  paseo_mensual: 'explorar.paseoTitulo',
} as const;

export type KeyVozServicio = (typeof KEY_VOZ_SERVICIO)[keyof typeof KEY_VOZ_SERVICIO];

/**
 * La voz de familia del comprable: key del riel si el código está en el
 * mapa; si no, el nombre de DB que traiga el caller; si tampoco, null —
 * el caller OMITE (jamás pinta el código crudo).
 */
export function vozServicio(
  t: (key: KeyVozServicio) => string,
  codigo: string | null | undefined,
  nombreDb?: string | null,
): string | null {
  if (typeof codigo === 'string' && codigo in KEY_VOZ_SERVICIO) {
    return t(KEY_VOZ_SERVICIO[codigo as keyof typeof KEY_VOZ_SERVICIO]);
  }
  return typeof nombreDb === 'string' && nombreDb.length > 0 ? nombreDb : null;
}
