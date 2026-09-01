// @epetplace/mensajeria — LA LEY DEL CANAL INTERNO.
//
// Dominio PURO: sin Supabase, sin React, sin i18n. Devuelve CÓDIGOS, jamás
// frases — el vocabulario del motor no sale a UI.
//
// Diseño que obedece: `docs/loop/buzon/S111-D-para-todos-DISENO-MENSAJERIA.md`.
// El canal cuelga de la SOLICITUD, no de la cita ni del usuario suelto.

export {
  ESTADOS_TERMINALES,
  esEstadoTerminal,
  puedeEscribirEnHilo,
  puedeTransicionar,
  type CodigoRechazoTransicion,
  type EstadoSolicitud,
  type ResultadoTransicion,
  type RolEnHilo,
} from './solicitud';

export {
  DIAS_SILENCIO_PUBLICADOR,
  diasTranscurridos,
  estadoDeSilencio,
  type EntradaSilencio,
  type EstadoSilencio,
} from './silencio';

export {
  camposVisibles,
  puedeVer,
  type ActorDelHilo,
  type CampoDeSolicitud,
} from './privacidad';

export {
  avisaAlPadrino,
  reglaFin,
  REGLAS_FIN_PADRINAZGO,
  type CausaFinPadrinazgo,
  type ReglaFinPadrinazgo,
} from './padrinazgo';

export {
  hayFallidos,
  MAX_INTENTOS,
  proximoAEnviar,
  puedeReintentar,
  reducirCola,
  type AccionCola,
  type Cola,
  type EstadoEnvio,
  type MensajeEnCola,
} from './cola';

export {
  avisosDe,
  type AudienciaAviso,
  type CategoriaAviso,
  type ContextoAviso,
  type HechoDelVertical,
  type IntencionAviso,
  type TipoAviso,
} from './avisos';
