// @epetplace/api — puerta única a Supabase: tipos generados + wrappers tipados.
// Regla: ningún app hace supabase.from()/rpc() directo — siempre a través de wrappers de este paquete.

export type { Database, Json } from './database.types';
export { initApi, getClient, type EpetplaceClient } from './client';
export type { ResultadoWrapper } from './resultado';
export {
  agregarNotaAtencion,
  agregarIncidenciaAtencion,
  registrarArchivoAtencion,
  type InputAgregarNota,
  type InputAgregarIncidencia,
  type InputRegistrarArchivo,
  type ResultadoRegistrarArchivo,
  type CodigoErrorAtencion,
} from './wrappers/atencion';
export {
  iniciarAtencionPaseo,
  registrarTrackPaseo,
  agregarNovedadPaseo,
  terminarAtencionPaseo,
  cerrarPaseoConCalidad,
  obtenerPaseoPorCita,
  obtenerResumenCierrePaseo,
  obtenerNovedadesPaseo,
  obtenerIncidenciasPaseo,
  type NovedadCatalogoPaseo,
  type IncidenciaCatalogoPaseo,
  type CodigoErrorPaseo,
  type EstadoAtencionPaseo,
  type GpsEstadoPaseo,
  type PuntoGpsPaseo,
  type PaseoPorCita,
  type InputIniciarPaseo,
  type InputRegistrarTrack,
  type InputAgregarNovedad,
  type InputTerminarPaseo,
  type InputCerrarPaseo,
  type ResultadoIniciarPaseo,
  type ResultadoTrackPaseo,
  type ResultadoNovedadPaseo,
  type ResultadoTerminarPaseo,
  type ResultadoCerrarPaseo,
  type NovedadRegistradaPaseo,
  type ResumenCierrePaseo,
} from './wrappers/paseo';
