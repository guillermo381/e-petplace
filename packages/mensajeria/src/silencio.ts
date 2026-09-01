/**
 * EL RELOJ DEL SILENCIO — `LETRA_ADOPCION` §5, firma ⑧.
 *
 * > *«El silencio tiene reloj: al postular, respuesta automática configurada;
 * > **si el refugio no responde en 5 días, e-PetPlace avisa a la familia que el
 * > refugio no respondió.** La promesa de no repetir el silencio de Instagram la
 * > cumple el refugio; cuando no la cumple, la verdad la decimos nosotros.»*
 *
 * 🔑 EL SILENCIO ES DERIVABLE, NO UN ESTADO QUE ALGUIEN ESCRIBE. Se calcula de
 * tres datos que el motor ya tiene: el estado, cuándo se creó, y si hubo algún
 * mensaje del publicador. **Por eso no hace falta un cron por solicitud:** basta
 * evaluación perezosa + un tick que despache lo que esta función marque.
 */

/**
 * 🔴 FIRMA, NO PARÁMETRO. §5 dice «5 días» con todas las letras.
 * (Distinto de la ventana de `PORTAL_PRESTADOR` §6.4.7, que la letra declara
 * «X días configurable» y por eso allá NO se pone default — `L-180`.)
 */
export const DIAS_SILENCIO_PUBLICADOR = 5;

export interface EntradaSilencio {
  readonly estado: 'recibida' | 'en_conversacion' | 'aceptada' | 'declinada';
  readonly creadaEn: Date;
  /**
   * ¿Hubo algún mensaje del publicador que NO sea la respuesta automática?
   *
   * ⚠️ La automática NO cuenta como respuesta, y es deliberado: si contara, el
   * reloj no sonaría nunca —toda solicitud la recibe al postular— y la promesa
   * de §5 sería letra muerta el día uno.
   */
  readonly huboRespuestaHumanaDelPublicador: boolean;
  /** Se pasa: esta función no lee el reloj del sistema. */
  readonly ahora: Date;
  /** Ya se avisó: el aviso de §5 se emite UNA vez, no cada tick. */
  readonly avisoDeSilencioYaEmitido: boolean;
}

export type EstadoSilencio =
  /** Todavía dentro de los 5 días, o ya respondida, o terminal. */
  | 'sin_silencio'
  /** Cumplió los 5 días sin respuesta humana y NO se avisó: hay que avisar. */
  | 'silencio_a_avisar'
  /** Cumplió y ya se avisó: no se repite. */
  | 'silencio_ya_avisado';

const MS_POR_DIA = 86_400_000;

export function diasTranscurridos(desde: Date, hasta: Date): number {
  return (hasta.getTime() - desde.getTime()) / MS_POR_DIA;
}

/**
 * ¿Esta solicitud está en el silencio que §5 manda romper?
 *
 * Sólo aplica a `recibida`: en `en_conversacion` el publicador YA habló, y en
 * las terminales la conversación terminó. *Avisar «no te respondieron» sobre
 * una solicitud ya respondida o ya declinada sería la app mintiendo.*
 */
export function estadoDeSilencio(e: EntradaSilencio): EstadoSilencio {
  if (e.estado !== 'recibida') return 'sin_silencio';
  if (e.huboRespuestaHumanaDelPublicador) return 'sin_silencio';
  if (diasTranscurridos(e.creadaEn, e.ahora) < DIAS_SILENCIO_PUBLICADOR) {
    return 'sin_silencio';
  }
  return e.avisoDeSilencioYaEmitido ? 'silencio_ya_avisado' : 'silencio_a_avisar';
}
