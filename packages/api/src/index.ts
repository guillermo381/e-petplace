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
  agregarMascotaAFamilia,
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  type InputCrearFamiliaConPrimeraMascota,
  type InputAgregarMascotaAFamilia,
  type FamiliaCreada,
  type MascotaAgregada,
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
  type DireccionCitaPaseo,
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
  obtenerPaseadoresDisponibles,
  obtenerSlotsDisponibles,
  obtenerIniciosPaseo,
  type InputIniciosPaseo,
  crearBloqueoAgenda,
  confirmarCitaPagada,
  type CodigoErrorAgendamiento,
  type PaseadorDisponible,
  type InputPaseadoresDisponibles,
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
export {
  obtenerMiPerfil,
  actualizarMiPerfil,
  type MiPerfil,
  type InputActualizarMiPerfil,
} from './wrappers/miPerfil';
// ── S55-A B3: Cuenta v1 ──
export {
  obtenerMiFamilia,
  renombrarFamilia,
  type MiFamilia,
  type MiembroFamilia,
  type CodigoErrorFamilia,
} from './wrappers/familia';
export {
  obtenerPreferencias,
  guardarIdiomaPreferido,
  guardarPreferenciaNotificacion,
  type Preferencias,
  type CodigoErrorPreferencias,
} from './wrappers/preferencias';
export {
  obtenerMisPagos,
  type PagoDelDueno,
  type CodigoErrorPagos,
} from './wrappers/pagos';

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
// + S55-B (B1): el desglose para la vista de Liquidaciones v1
export {
  obtenerResumenPendienteLiquidar,
  obtenerDesglosePendienteLiquidar,
  type ResumenPendienteLiquidar,
  type EventoPendienteLiquidar,
  type CodigoErrorEventosEconomicos,
} from './wrappers/eventosEconomicos';

// Liquidaciones propias, solo lectura — S55-B (B1, RUTA 3.1.D) — archivo NUEVO de esta sesión
export {
  obtenerMisLiquidaciones,
  type LiquidacionPropia,
  type EstadoLiquidacion,
  type CodigoErrorLiquidaciones,
} from './wrappers/liquidaciones';

// Comisión vigente visible al prestador — S56-B (TAREA 4, financiero v2.6
// regla 7.15) — archivo NUEVO de esta sesión
export {
  obtenerComisionVigenteCita,
  type ComisionVigenteCita,
  type CodigoErrorFees,
} from './wrappers/fees';

// Configuración del servicio de paseo — S55-B (B2) — archivo NUEVO de esta sesión
export {
  BLOQUES_PASEO,
  obtenerOfertasPaseoPropias,
  crearOfertaPaseo,
  actualizarOfertaPaseo,
  obtenerFranjasHorario,
  crearFranjaHorario,
  actualizarFranjaHorario,
  eliminarFranjaHorario,
  type BloquePaseo,
  type OfertaPaseoPropia,
  type FranjaHorario,
  type InputCrearOfertaPaseo,
  type InputActualizarOfertaPaseo,
  type InputCrearFranja,
  type InputActualizarFranja,
  type CodigoErrorConfiguracionPaseo,
} from './wrappers/configuracionPaseo';

// ── Dirección del hogar (S56-A, D-339 — hunk Sesión A) ──────────────────────
export {
  obtenerDireccionHogar,
  guardarDireccionHogar,
  type DireccionHogar,
  type GuardarDireccionHogarInput,
  type CodigoErrorDireccion,
} from './wrappers/direcciones';

// ── El PLAN de paseo, D-338 (S56-A — hunk Sesión A) ─────────────────────────
export {
  contratarPlanPaseo,
  obtenerMisPlanesPaseo,
  obtenerCitasDePlan,
  configurarRenovacionPlan,
  saltarCitaPlan,
  type ContratarPlanInput,
  type PlanContratado,
  type PlanPaseo,
  type CitaDePlan,
  type CodigoErrorPlan,
} from './wrappers/planes';
