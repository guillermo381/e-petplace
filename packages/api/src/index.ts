// @epetplace/api — puerta única a Supabase: tipos generados + wrappers tipados.
// Regla: ningún app hace supabase.from()/rpc() directo — siempre a través de wrappers de este paquete.

export type { Database, Json } from './database.types';
export { initApi, getClient, type EpetplaceClient, type OpcionesApi, type StorageSesion } from './client';
export {
  registrarse,
  iniciarSesion,
  cerrarSesion,
  obtenerSesion,
  type SesionDueno,
  type InputRegistrarse,
  type InputIniciarSesion,
  type CodigoErrorAuth,
} from './wrappers/auth';
export {
  obtenerEspeciesActivas,
  obtenerCatalogoNovedadesPaseo,
  type EspecieCatalogo,
  type NovedadPaseoCatalogo,
} from './wrappers/catalogos';
export {
  leerTimelineMascota,
  obtenerFotosDeEvento,
  leerDetalleAtencion,
  type ItemTimeline,
  type PaginaTimeline,
  type FotoDeEvento,
  type NovedadDeAtencion,
  type DetalleAtencion,
  type PuntoTrack,
  type CodigoErrorTimeline,
} from './wrappers/timeline';
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
  obtenerMiPrestador,
  type MiPrestador,
  type CodigoErrorPrestador,
} from './wrappers/prestador';
export {
  crearFamiliaConPrimeraMascota,
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  type InputCrearFamiliaConPrimeraMascota,
  type FamiliaCreada,
  type EstadoOnboardingDueno,
  type MascotaResumen,
  type PrecisionFechaNacimiento,
  type CodigoErrorOnboarding,
} from './wrappers/onboarding';
export { resolverUrlFoto, resolverUrlsFotos } from './wrappers/fotos';
export {
  extraerVacunasDeCarnet,
  registrarVacunasDeCarnet,
  obtenerVacunaPorEvento,
  type VacunaExtraida,
  type InputExtraerVacunas,
  type CodigoErrorExtraccion,
  type VacunaCarnetInput,
  type InputRegistrarVacunas,
  type ResultadoRegistrarVacunas,
  type ResultadoRegistroVacunas,
  type ErrorRegistrarVacunas,
  type CodigoErrorRegistroVacunas,
  type VacunaDeEvento,
} from './wrappers/vacunas';
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
  obtenerCitasPaseoDelDia,
  obtenerTrackPaseo,
  type NovedadCatalogoPaseo,
  type IncidenciaCatalogoPaseo,
  type CitaAgendaPaseo,
  type MascotaAgenda,
  type InputCitasPaseoDelDia,
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

// Agendamiento del dueño — S54-B2 (hold 15 min + cobro simulado)
export {
  obtenerOfertaPaseo,
  obtenerSlotsDisponibles,
  crearBloqueoAgenda,
  confirmarCitaPagada,
  type CodigoErrorAgendamiento,
  type OfertaPaseo,
  type SlotDisponible,
  type InputSlotsDisponibles,
  type HoldAgenda,
  type InputCrearBloqueo,
  type CitaPagada,
  type InputConfirmarCita,
} from './wrappers/agendamiento';

// Estado del hogar — S51-B2.2 (señales de las tres voces + Zona 2)
export {
  obtenerEstadoHogar,
  type AtencionEnCursoHogar,
  type EstadoHogar,
  type ProximaCitaHogar,
  type SenalesHogarMascota,
} from './wrappers/hogar';

// Perfil de mascota — S51-B2.3 (pila de módulos)
export {
  obtenerPerfilMascota,
  type PerfilMascota,
  type UmbralesEspecie,
  type VacunaDeMascota,
} from './wrappers/perfilMascota';
export type { IdentidadMascota } from './wrappers/perfilMascota';

// Config del país — S51-B2.4 (Explorar por country_config)
export { obtenerServiciosPais, type ServiciosPais } from './wrappers/paisConfig';

// Mascotas del prestador — S51-B3.3 (historial + detalle icónico v1)
export {
  obtenerDetalleMascotaPrestador,
  obtenerMascotasAtendidas,
  type DetalleMascotaPrestador,
  type MascotaAtendida,
} from './wrappers/mascotasPrestador';

// Perfil propio — S53-B2b (saludo con nombre)
export { obtenerMiPerfil, type MiPerfil } from './wrappers/miPerfil';

// Vitales — S53-B2c (paseos con track real)
export { obtenerPaseosConTrack, type PaseoConTrack } from './wrappers/vitales';

// Cuenta comercial — S54-B (wizard B2.3, §6.5) — archivo NUEVO de esta sesión
export {
  obtenerMiCuentaComercial,
  obtenerPaisesParaRegistro,
  obtenerBancosDePais,
  obtenerTiposDocumentoTitular,
  verificarIdentificacionDisponible,
  crearCuentaComercialInicial,
  actualizarDatosBancarios,
  type MiCuentaComercial,
  type DatosBancariosResumen,
  type EstadoCuentaComercial,
  type TipoFiscal,
  type PaisRegistro,
  type BancoCatalogo,
  type TipoDocumentoTitular,
  type DisponibilidadIdentificacion,
  type InputCrearCuentaComercial,
  type InputDatosBancarios,
  type CodigoErrorCuentaComercial,
} from './wrappers/cuentaComercial';

// Ledger propio, solo lectura — S54-B (peldaño de liquidaciones en Negocio)
export {
  obtenerResumenPendienteLiquidar,
  type ResumenPendienteLiquidar,
  type CodigoErrorEventosEconomicos,
} from './wrappers/eventosEconomicos';
