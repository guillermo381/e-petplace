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
  /* S109-D · faltaba, y NO era hipotética: hay una cita real de una familia
     con este tipo, listada MUDA hoy. La encontró el gate de voz-por-tipo. */
  consulta_especializada: 'servicioVoz.consultaEspecializada',
  vacunacion: 'servicioVoz.vacunacion',
  urgencia_local: 'servicioVoz.urgenciaLocal',
  urgencia_domicilio: 'servicioVoz.urgenciaDomicilio',
  /* S106-C t3 · el quinto oficio. **Sin esta línea la teleconsulta se pinta
     MUDA**: el fallback del dueño omite el nombre a propósito (D-474), así
     que una cita real quedaría sin decir qué es — y el defecto se ve como
     "falta un dato", no como "falta una traducción". */
  telemedicina: 'servicioVoz.telemedicina',
  /* ⭐ S109-D · GUARDERÍA, y su voz es de PRESENCIA y no de acto — coherente
     con el HOY del prestador, donde el día se lee «3 animales hoy» y jamás «3
     guarderías». *El dueño no compró una sesión: compró que su animal PASE EL
     DÍA en algún lado.*

     🔴 Y entra acá porque su ausencia ya se estaba cobrando: sin clave,
     `vozServicio` cae a `nombreDb`, y el lector de citas por mascota no lo
     pasa ⇒ devolvía `null` y **la estadía aparecía en la lista sin decir qué
     era**. Es el segundo caso idéntico de este archivo — el primero fue
     `telemedicina`, y su nota sigue tres líneas más abajo. */
  guarderia_dia: 'servicioVoz.guarderiaDia',
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
