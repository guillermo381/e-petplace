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
  obtenerEspeciesElegibles,
  type EspecieCatalogo,
  type NovedadPaseoCatalogo,
} from './wrappers/catalogos';
export {
  leerTimelineMascota,
  leerTimelineHogar,
  obtenerFotosDeEvento,
  leerDetalleAtencion,
  type ItemTimeline,
  type PaginaTimeline,
  type FotoDeEvento,
  type NovedadDeAtencion,
  type DetalleAtencion,
  type PuntoTrack,
  type ServicioAplicadoFamilia,
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
  actualizarPerfilPrestador,
  actualizarExponePersonas,
  resolverUrlLogoNegocio,
  // S84-A7: la gemela de la galería (fotos Y clip — mismo bucket público).
  // Vive al lado de la del logo a propósito: dos resolvedores de URL en dos
  // casas es como nacen las divergencias silenciosas.
  resolverUrlGaleriaPrestador,
  type InputActualizarPerfilPrestador,
  type MiPrestador,
  type CodigoErrorPrestador,
  // S79-T4.1: los códigos del camino de escritura de la sede.
  type CodigoErrorPerfilPrestador,
  // S79-T4.6: la ceremonia del primer ingreso (mata el puente AsyncStorage de B).
  actualizarNombreComercial,
  type CodigoErrorNombreComercial,
  registrarPrimerIngreso,
  type PrimerIngreso,
  // S78-A8 (pedido de B): el lector del gate de la vitrina.
  puedeEncenderVitrina,
} from './wrappers/prestador';
// S76-B2 (D-525): el gate de PRODUCTO de la superficie de atender.
export { puedoAtenderClinico } from './wrappers/acceso-clinico';
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
  obtenerCitaPaseoPorId,
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
  type ProximaCitaMascota,
  type SenalesHogarMascota,
} from './wrappers/hogar';

// Citas activas por mascota — D-430 (S67): el detalle contextual
// (+S74-A cura D-497: la variante hogar-wide en UNA query)
export {
  obtenerCitasActivasMascota,
  obtenerCitasActivasHogar,
  type CitaActivaMascota,
  type CitaActivaHogar,
} from './wrappers/citasMascota';
export { mascotasElegibles, type EstadoVidaMascota } from './wrappers/_mascotas-elegibles';

// Perfil de mascota — S51-B2.3 (pila de módulos)
export {
  obtenerPerfilMascota,
  declararFotoMascota,
  type PerfilMascota,
  type UmbralesEspecie,
  type VacunaDeMascota,
  type CodigoErrorFotoMascota,
  type EncuadreFotoDeclarado,
} from './wrappers/perfilMascota';
export type { IdentidadMascota, AlergiasEstado, DesparasitacionDeMascota } from './wrappers/perfilMascota';

// Salud del expediente — S82 r4: los productores del dueño (los tres
// motores del gate) + el lector de la serie de peso
export {
  registrarDesparasitacion,
  declararSinAlergiasConocidas,
  registrarPesoMascota,
  obtenerHistoriaPeso,
  type CodigoErrorSalud,
  type TipoDesparasitacion,
  type MetodoPeso,
  type PesoDeLaSerie,
  obtenerPlanVacunal,
  type EstadoPlanVacuna,
  type VacunaDelPlan,
} from './wrappers/salud';

// Config del país — S51-B2.4 (Explorar por country_config)
export {
  obtenerServiciosPais,
  obtenerConfigMoneda,
  type ServiciosPais,
  type ConfigMonedaPais,
} from './wrappers/paisConfig';

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
  // S88-D (Lote 4) — la excepción §6 del método (S85): A escribió
  // guardarPreferenciaCanal PARA la pantalla de Preferencias («es el que la
  // pantalla va a consumir», su JSDoc) y el export quedó omitido; el lector
  // del catálogo nace en el cruce declarado del mismo commit. Se declara: A
  // firma o revierte.
  guardarPreferenciaCanal,
  obtenerCatalogoNotificaciones,
  type Preferencias,
  type CodigoErrorPreferencias,
  type CanalNotificacion,
  type AudienciaNotificacion,
  type CategoriaNotificacionCatalogo,
  type CanalNotificacionCatalogo,
  type CatalogoNotificaciones,
} from './wrappers/preferencias';
export {
  obtenerPizarra,
  tomarCita,
  crearCitaNegocio,
  type CitaDePizarra,
  type CitaTomada,
  type CitaDeNegocioCreada,
  type CodigoErrorPizarra,
  type CodigoErrorTomarCita,
  type CodigoErrorCrearCitaNegocio,
} from './wrappers/pizarra';
export {
  obtenerDatosNegocio,
  type DatosNegocio,
  type DatosNegocioSemana,
  type DatosNegocioDia,
  type DatosNegocioMix,
  type DatosNegocioMixItem,
  type DatosNegocioTrayectoria,
  type DatosNegocioPlata,
  type CodigoErrorDatosNegocio,
} from './wrappers/datosNegocio';
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

// Vacaciones / bloqueos del prestador — S56-B (TAREA 2, D-341) — archivo
// NUEVO de esta sesión
export {
  obtenerBloqueosPrestador,
  crearBloqueoPrestador,
  eliminarBloqueoPrestador,
  type BloqueoPrestador,
  type InputCrearBloqueoPrestador,
  type CodigoErrorBloqueos,
  obtenerDiasCerrados,
  obtenerDiasCerradosServicio,
  declararDiaCerrado,
  type DiaCerrado,
} from './wrappers/bloqueos';

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
  editarFranjaHorario,
  eliminarFranjaHorario,
  type BloquePaseo,
  type OfertaPaseoPropia,
  type FranjaHorario,
  type InputCrearOfertaPaseo,
  type InputActualizarOfertaPaseo,
  type InputCrearFranja,
  type InputActualizarFranja,
  type InputEditarFranja,
  type CodigoErrorConfiguracionPaseo,
} from './wrappers/configuracionPaseo';

// D-386 — la elección de modo de horarios (S62-B sobre el motor S62-A
// 20260715130000) — archivo NUEVO de esta sesión
export {
  obtenerModoHorarios,
  convertirHorariosAPorServicio,
  elegirModoHorarios,
  eliminarFranjasPrestador,
  obtenerFranjasDeServicios,
  crearFranjaServicio,
  type ModoHorarios,
  type FranjaHorarioServicio,
  type InputCrearFranjaServicio,
  type CodigoErrorModoHorarios,
} from './wrappers/horarios-modo';

// ── S88-A · LA PUERTA DEL VERBO ASIGNAR (motor 20260805240000) ─────────────
// Cierra el «motor sin puerta» de S77: el tercer brazo de
// `cita_update_prestador` vivía sin un solo escritor. `dar_de_baja_empleado`
// produce las citas sin persona; ésta es la única vía de volver a ruteárselas.
// ── S88-A · LA CAMPANA (lámina firmada) ───────────────────────────────────
// Hoy devuelve lista vacía y eso es CORRECTO: `in_app` no tiene transporte
// hasta que la pantalla exista (ley de secuencia de la lámina).
export {
  obtenerMisAvisos,
  hayAvisosSinLeer,
  marcarAvisoLeido,
  type AvisoDeCampana,
  type CodigoCampana,
} from './wrappers/campana';

// ── S88-A · D-664 · la posición dicha por el SERVIDOR ─────────────────────
// Mata `esDueno = leí ≥1 fila`, que daba true para los cuatro roles.
export {
  obtenerMiPosicionEnPrestador,
  type PosicionEnPrestador,
  type CodigoPosicion,
} from './wrappers/posicionPrestador';

export {
  asignarCitaAPersona,
  obtenerPersonasParaAsignar,
  puedoAsignarCitas,
  type CitaAsignada,
  type PersonaParaAsignar,
  type CodigoAsignacionCita,
} from './wrappers/asignacionCita';

// ── Zonas de cobertura del prestador (S58-A, D-331 — v1 DECLARATIVA) ────────
export {
  obtenerCatalogoCiudades,
  obtenerZonasDePrestador,
  agregarZonaCobertura,
  quitarZonaCobertura,
  type CiudadCatalogo,
  type ZonaCobertura,
  type CodigoErrorZonas,
} from './wrappers/zonas';

// ── Países activos con nombre (S58-B, curas del gate — hunk Sesión B) ───────
export {
  obtenerPaisesActivos,
  obtenerPaisesDelMundo,
  type PaisDelMundo,
  type PaisActivo,
  type CodigoErrorPaises,
} from './wrappers/paises';

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

// ── El PAQUETE DE SALIDAS, D-343 (S57-A — hunk Sesión A) ────────────────────
export {
  PRESETS_PAQUETE,
  comprarPaqueteSalidas,
  reservarSalidaPaquete,
  cancelarReservaPaquete,
  obtenerMisPaquetesSalidas,
  obtenerSaldoPaquete,
  obtenerPaseadoresConPaquete,
  type PresetPaquete,
  type ComprarPaqueteInput,
  type PaqueteComprado,
  type ReservarSalidaInput,
  type SalidaReservada,
  type PaqueteSalidas,
  type SaldoPaquete,
  type PaseadorConPaquete,
  type CodigoErrorPaquete,
} from './wrappers/paquetes';

// ── Cancelación y reagenda del SUELTO, P18 (S57-A — hunk Sesión A) ──────────
export {
  reagendarCitaSuelta,
  cancelarCitaSuelta,
  obtenerMisCitasPaseo,
  resolverOfertaDeCita,
  type CitaPaseoDueno,
  type CodigoErrorCitaSuelta,
} from './wrappers/citaSuelta';

// ── No-show del prestador, Decisión T (S57-B3 — hunk Sesión B) ──────────────
export {
  marcarNoShowCita,
  type CodigoErrorNoShow,
  type ResultadoNoShow,
} from './wrappers/noShow';

// ── P19: socialización del paseo grupal (S59-A4 — hunk Sesión A) ────────────
export {
  responderSocializacionPaseo,
  type RespuestaPaseoSocial,
  type CodigoErrorPaseoSocial,
} from './wrappers/paseo-social';

// ── La oferta de grooming (S59-B5, fundación S59-A3 — hunk Sesión B) ────────
export {
  SERVICIOS_GROOMING,
  TALLAS_GROOMING,
  actualizarExtraPelajeLargo,
  actualizarRecargoDomicilio,
  guardarServicioGrooming,
  obtenerOfertasGroomingPropias,
  type CodigoErrorGrooming,
  type GuardarServicioGroomingInput,
  type OfertaGroomingPropia,
  type ServicioGrooming,
  type TallaGrooming,
  type TallaOfertaGrooming,
} from './wrappers/grooming';

// ── La reserva de grooming del DUEÑO (S60-A1 — hunk Sesión A) ───────────────
export {
  TALLAS_MASCOTA,
  PELAJES_MASCOTA,
  obtenerOfertaGrooming,
  obtenerOfertaGroomingPublica,
  type OfertaGroomingPublica,
  type ModalidadGrooming,
  obtenerIniciosGrooming,
  obtenerGroomersDisponibles,
  obtenerMisGroomings,
  declararTallaPelaje,
  type CodigoErrorGroomingReserva,
  type GroomerDisponible,
  type GroomingDelHogar,
  type InputGroomersDisponibles,
  type InputIniciosGrooming,
  type OfertaGrooming,
  type PelajeMascota,
  type TallaMascota,
  type TallaPelajeDeclarados,
} from './wrappers/grooming-reserva';

// ── La reserva vet del DUEÑO (S68-A2, V2 — hunk Sesión A) ───────────────────
export {
  obtenerOfertaVet,
  obtenerIniciosVet,
  // S78-A7 (LETRA_VITRINA): el selector de persona del CUÁNDO vet.
  obtenerPersonasQueAtienden,
  type PersonaQueAtiende,
  obtenerVitrinaNegocios,
  obtenerVeterinariosDisponibles,
  type CodigoErrorVetReserva,
  type InputIniciosVet,
  type InputVeterinariosDisponibles,
  type OfertaVet,
  type VeterinarioDisponible,
  obtenerMisConsultasVet,
  type ConsultaDelHogar,
} from './wrappers/veterinaria-reserva';

// ── La reserva de adiestramiento del DUEÑO (S63-A Bloque 3 — hunk Sesión A) ─
export {
  COMPRABLES_ADIESTRAMIENTO,
  obtenerIniciosAdiestramiento,
  obtenerOfertaAdiestramientoPublica,
  obtenerAdiestradoresDisponibles,
  contratarPrograma,
  obtenerParteAdiestramiento,
  obtenerMisAdiestramientos,
  resolverUrlsClips,
  type AdiestramientoDelHogar,
  type ClipDelParte,
  type CodigoErrorAdiestramientoReserva,
  type ComprableAdiestramiento,
  type ObjetivoDelParte,
  type OfertaAdiestramientoPublica,
  type OfertaAdiestrador,
  type ParteAdiestramiento,
  type ProgramaContratado,
  type ProgresionNarrativa,
} from './wrappers/adiestramiento-reserva';

// ── La bitácora de la familia (S63-A, §7 — hunk Sesión A) ───────────────────
export {
  obtenerVocabularioBitacora,
  registrarBitacoraFamilia,
  obtenerBitacora,
  type BitacoraRegistrada,
  type ChipBitacoraTipo,
  type ChipVocabulario,
  type ChipVocabularioAgrupado,
  type CodigoErrorBitacora,
  type EntradaBitacora,
  type NivelCurriculum,
} from './wrappers/adiestramiento-bitacora';

// ── La zona de servicios vivos del Hogar (S60-A6, D-366 — hunk Sesión A) ────
export {
  obtenerResumenServiciosHogar,
  type ProximaDeServicio,
  type ResumenServiciosHogar,
} from './wrappers/serviciosHogar';

// ── La atención de grooming (S60-B1 — hunk Sesión B) ────────────────────────
export {
  agregarServicioGrooming,
  agregarServicioGroomingEnCierre,
  cerrarGroomingConCalidad,
  iniciarAtencionGrooming,
  obtenerCitaGroomingPorId,
  obtenerCitasGroomingDelDia,
  obtenerEstadoDuranteGrooming,
  obtenerEstadosPelajeCatalogo,
  obtenerFichaAntesGrooming,
  obtenerGroomingPorCita,
  obtenerIncidenciasGrooming,
  obtenerResumenCierreGrooming,
  obtenerResumenDiaGrooming,
  obtenerServiciosGroomingCatalogo,
  quitarEstadoPelajeGrooming,
  quitarServicioGrooming,
  registrarArchivoGrooming,
  registrarDiscrepanciaTallaGrooming,
  registrarEstadoPelajeEnCierre,
  registrarEstadoPelajeGrooming,
  terminarAtencionGrooming,
  type AtencionDiaGrooming,
  type CitaGroomingDetalle,
  type CodigoErrorGroomingAtencion,
  type EstadoDuranteGrooming,
  type EstadoPelajeCatalogo,
  type FichaAntesGrooming,
  type FotoResumenGrooming,
  type GroomingDeCita,
  type IncidenciaGroomingCatalogo,
  type ResultadoDiscrepanciaTalla,
  type ResultadoIniciarGrooming,
  type ResumenCierreGrooming,
  type ResumenDiaGrooming,
  type ServicioGroomingCatalogo,
  type TipoArchivoGrooming,
} from './wrappers/grooming-atencion';

// S63-B (Bloque 3 parcial): la ficha del Antes de adiestramiento —
// hunk aditivo regla 76(c).
export {
  obtenerFichaAntesAdiestramiento,
  type CodigoErrorAntesAdiestramiento,
  type FichaAntesAdiestramiento,
  type ProgramaPrevioAdiestramiento,
  type SenalConductualPaseo,
} from './wrappers/adiestramiento-antes';

// S63-B: la oferta del adiestrador (taller) — hunk aditivo regla 76(c).
export {
  NIVELES_PROGRAMA,
  RANGO_SUGERIDO_POR_NIVEL,
  TIPO_ADIESTRAMIENTO,
  guardarOfertaAdiestramiento,
  guardarProgramaAdiestramiento,
  obtenerOfertaAdiestramientoPropia,
  type CodigoErrorOfertaAdiestramiento,
  type MundoAdiestramientoPropio,
  type NivelPrograma,
  type OfertaAdiestramientoPropia,
  type ProgramaAdiestramientoPropio,
} from './wrappers/adiestramiento-oferta';

// S63-B (Bloque 3 experiencia): la atención de adiestramiento —
// hunk aditivo regla 76(c).
export {
  cerrarAtencionAdiestramiento,
  iniciarAtencionAdiestramiento,
  obtenerAdiestramientoPorCita,
  obtenerCitaAdiestramientoPorId,
  obtenerCitasAdiestramientoDelDia,
  obtenerClipsAdiestramiento,
  obtenerCurriculumNivel,
  obtenerEstadoDuranteAdiestramiento,
  obtenerObjetivosAdiestramiento,
  quitarObjetivoAdiestramiento,
  registrarClipAdiestramiento,
  registrarNotaAdiestramiento,
  registrarObjetivoAdiestramiento,
  terminarAtencionAdiestramiento,
  type AdiestramientoDeCita,
  type CitaAdiestramientoDetalle,
  type ClipAdiestramientoRegistrado,
  type CodigoErrorAdiestramientoAtencion,
  type EstadoDuranteAdiestramiento,
  type ObjetivoAdiestramientoCatalogo,
  type ObjetivoRegistrado,
  type ResultadoIniciarAdiestramiento,
} from './wrappers/adiestramiento-atencion';

// S68-B (P0-P3): el mundo VETERINARIA del prestador + la verificación
// profesional — hunk aditivo regla 76(c)/(f).
export {
  MENU_VETERINARIA,
  TIPO_POR_ITEM,
  TIPO_PROCEDIMIENTO,
  eliminarProcedimientoVeterinaria,
  guardarEspecialidadesVeterinaria,
  guardarProcedimientoVeterinaria,
  guardarServicioVeterinaria,
  obtenerCatalogoEspecialidadesVet,
  obtenerCatalogoVeterinaria,
  obtenerEspecialidadesPrestador,
  obtenerMundoVeterinariaPropio,
  type CodigoErrorVeterinaria,
  type EspecialidadCatalogo,
  type EspecialidadDeclarada,
  type GuardarEspecialidadesInput,
  type GuardarProcedimientoInput,
  type GuardarServicioVeterinariaInput,
  type ItemMenuVeterinaria,
  type MundoVeterinariaPropio,
  type OfertaVeterinariaPropia,
  type ProcedimientoVeterinaria,
  type TipoVeterinariaCatalogo,
} from './wrappers/veterinaria-oferta';
// S69-B (M0): la jornada VE al vet — el cuarto gemelo de los lectores del
// día (SOLO LECTURA; el motor de la atención clínica es V4). Hunk aditivo.
export {
  obtenerCitasVetDelDia,
  obtenerCitaVetPorId,
  type CodigoErrorVetAtencion,
} from './wrappers/veterinaria-atencion';
// S69-B (M2): el buscador del MOSTRADOR — mascotas accesibles (RLS) +
// alta asistida por email (Fase G). Solo lectura, hunk aditivo.
export {
  buscarMascotasAccesibles,
  buscarClienteAltaAsistida,
  buscarClientePorTelefono,
  crearAltaAsistidaMostrador,
  registrarAtencionMostrador,
  registrarCobroPresencial,
  obtenerCatalogoVacunas,
  registrarVacunaMostrador,
  consultarSolicitudAutorizacion,
  MEDIOS_COBRO,
  type EstadoSolicitud,
  type EstadoSolicitudMostrador,
  type MascotaMostrador,
  // S70-B2-v2 (Durante): el empleadoId del vet tratante (v1 = titular)
  // se resuelve con obtenerTitularId (exportado abajo).
  type ResultadoBusquedaCliente,
  type MascotaDeClienteRegistrado,
  type CodigoBusquedaCliente,
  type AltaAsistidaMostradorInput,
  type AltaAsistidaMostradorResultado,
  type CodigoAltaMostrador,
  type AtencionMostradorInput,
  type CodigoAtencionMostrador,
  type MedioCobro,
  type CodigoCobroPresencial,
  type VacunaCatalogo,
  type VacunaMostradorInput,
  type CodigoVacunaMostrador,
} from './wrappers/veterinaria-mostrador';
// S78-A2 (D-540): `resolverPersonaDeFranja` es el resolvedor único de la
// persona dueña de una franja — ausente = titular, presente = verificada
// contra ESE negocio (la RLS de prestador_horarios no mira empleado_id).
export { obtenerTitularId, obtenerMiEmpleadoId, resolverPersonaDeFranja } from './wrappers/titular';
// S69-B (B3): el presupuesto clínico — 5 RPCs del contrato A1 (lane cedida
// por la A). Hunk aditivo.
export {
  crearPresupuestoBorrador,
  enviarPresupuesto,
  aprobarPresupuestoFamilia,
  registrarAprobacionPresencial,
  rechazarPresupuesto,
  obtenerPresupuestosPrestador,
  obtenerCitasPorCoordinar,
  fijarFechaProcedimiento,
  type PresupuestoItemInput,
  type CrearPresupuestoInput,
  type AprobacionPresupuesto,
  type CodigoErrorPresupuesto,
  type PresupuestoPrestador,
  type PresupuestoPrestadorItem,
  type EstadoPresupuesto,
  type CitaPorCoordinar,
  type CitaPorCoordinarItem,
  type FijarFechaInput,
  type FechaFijada,
  obtenerEmpleadosCuenta,
  type EmpleadoCuenta,
} from './wrappers/veterinaria-presupuesto';
// S70-A2: la constelación de la nota clínica + caso v1.
export {
  estructurarNotaClinica,
  sedimentarNotaClinica,
  abrirCasoClinico,
  asociarACaso,
  type NotaEstructurada,
  type ItemFormula,
  type VitalesMedidos,
  type NotaConfirmada,
  type CasoRef,
  type SedimentarInput,
  type ResultadoSedimento,
  type AbrirCasoInput,
  type CodigoErrorSedimento,
  type EstructurarInput,
  obtenerParteConsulta,
  obtenerCasosActivosMascota,
  type ParteConsulta,
  type ItemFormulaParte,
  type CasoActivo,
  type CodigoErrorCasos,
  // S78-A3.1 (D-543): la re-entrada — ¿esta cita ya tiene su nota?
  obtenerHistoriaClinicaDeCita,
  type HistoriaClinicaDeCita,
  type EstadoHistoriaDeCita,
  type CodigoErrorHistoriaDeCita,
} from './wrappers/veterinaria-nota-clinica';
// S70-A3/A3bis: handshake del mostrador.
export {
  crearSolicitudAutorizacion,
  responderSolicitudAutorizacion,
  type TipoSolicitud,
  type AccionSolicitud,
  type PayloadAlta,
  type CrearSolicitudInput,
  type RespuestaSolicitud,
  type CodigoErrorSolicitud,
  obtenerSolicitudesPendientesDueno,
  type SolicitudPendiente,
} from './wrappers/handshake-mostrador';
export {
  ESTADOS_DOCUMENTO,
  // ⚠️ S84-C33 — LOS TRES DEL EJE ① LOS AGREGA C, Y LO DECLARA (76(d):
  // este archivo es de A). NO es una decisión: es la omisión del re-export
  // de símbolos que A **acaba de escribir para destrabarme** (`d820ba3`,
  // asunto literal: "C destrabada") y que sin esta línea no cruzan la
  // puerta única. Cero lógica agregada — tres nombres a la lista.
  // LA ALTERNATIVA ERA PEOR Y POR ESO NO SE TOMÓ: re-implementar
  // `documentoDeFigura` del lado de la app clonaría la regla fiscal
  // (`persona_natural` → cédula) en un segundo cuerpo, y el día que la
  // regla cambie una de las dos copias queda vieja en silencio. La
  // función existe justamente para que esa regla viva UNA vez.
  TIPOS_DOCUMENTO_FIGURA,
  TIPOS_DOCUMENTO_OFICIO_VET,
  TIPOS_DOCUMENTO_OPCIONAL,
  documentoDeFigura,
  TIPOS_DOCUMENTO_VERIFICACION,
  obtenerDocumentosVerificacion,
  registrarDocumentoVerificacion,
  resolverUrlDocumento,
  type CodigoErrorDocumentos,
  type DocumentoVerificacion,
  type EstadoDocumento,
  type RegistrarDocumentoInput,
  type TipoDocumentoVerificacion,
} from './wrappers/prestador-documentos';
// S69-A3 (cara del dueño): lector read-only de presupuestos de la familia.
// Hunk aditivo de la A — la escritura (aprobar/rechazar) vive en veterinaria-presupuesto (B).
export {
  obtenerPresupuestosFamilia,
  type PresupuestoFamilia,
  type PresupuestoItemLeido,
  type EstadoEfectivoPresupuesto,
  type CodigoErrorPresupuestosLeidos,
} from './wrappers/presupuestos-familia';

// S74-A — el contacto de la VISITA (recepción v1: quién reservó la cita).
// S78-B — el motor de recepción (s78a6): la jornada con su persona,
// "Llegó" como hecho, y el reloj §7bis dicho por el server.
export {
  obtenerContactoReservaCita,
  obtenerJornadaRecepcion,
  registrarLlegada,
  obtenerSolicitudesMostrador,
  type ContactoReservaCita,
  type CodigoErrorContactoReserva,
  type CitaJornadaRecepcion,
  type SolicitudMostrador,
  type CodigoErrorRecepcion,
} from './wrappers/recepcion';

// S74-B — la ventana de EQUIPO (LETRA_EQUIPO §14, composición sobre lo vivo)
export {
  obtenerEquipoNegocio,
  // S78-A (D-549): el número del aviso de la BAJA — su único consumidor.
  contarCitasDespegables,
  asignarRolEmpleado,
  quitarRolEmpleado,
  desvincularEmpleado,
  invitarEmpleado,
  empleadoTieneRol,
  obtenerNegocioEmpleadoActivo,
  obtenerInvitacionPendiente,
  aceptarInvitacionEquipo,
  // S76-B4: los chips al invitar (B0 APTO + decisión founder)
  obtenerOficiosNegocio,
  asignarServiciosEmpleado,
  // S77-A: la edición del chip para quien YA está adentro (LETRA §4/§10.2)
  obtenerChipsEmpleado,
  quitarServiciosEmpleado,
  obtenerJornadaEmpleado,
  type ChipEmpleado,
  type ResultadoQuitarChips,
  type JornadaEmpleado,
  type ResultadoBaja,
  type OficioChip,
  type OficioNegocio,
  type EquipoNegocio,
  type MiembroEquipo,
  type RolEquipo,
  type CodigoErrorEquipo,
  type CodigoInvitar,
  type InvitacionPendiente,
  type CodigoAceptar,
} from './wrappers/equipo';
export { obtenerUmbralesMomentoVital } from './wrappers/catalogos';
// S79-A2 — el contrato de Places (LETRA_PERFIL_S79 §2; contrato-primero
// para B): sesión de búsqueda + predicciones + resolución con
// coordenadas REALES o rebote — jamás inventadas (L-139).
export {
  crearSesionLugares,
  buscarLugares,
  resolverLugar,
  CODIGOS_ERROR_LUGARES,
  type PrediccionLugar,
  type LugarResuelto,
  type CodigoErrorLugares,
  type BuscarLugaresInput,
  type ResolverLugarInput,
} from './wrappers/lugares';

// ── LA GALERÍA DEL PRESTADOR (S84-A5) ────────────────────────────────
// La portada es el ORDEN MÍNIMO: `listarFotosGaleria` devuelve ordenado,
// así que la portada es `[0]` y no se pregunta. `borrarFotoGaleria`
// devuelve el path para que la app borre los BYTES (la frontera de
// archivos es de la app, L-137).
export {
  listarFotosGaleria,
  agregarFotoGaleria,
  marcarComoPortada,
  reordenarFotosGaleria,
  borrarFotoGaleria,
  type FotoGaleria,
  type CodigoErrorGaleria,
} from './wrappers/galeria-prestador';

// ── EL ESCRIBA DE LA PRESENCIA (S84-A10) ─────────────────────────────
// Puerta única sobre la Edge Function `escribir-presencia`. Los SEIS
// códigos viajan TIPADOS: el mapeo a voz es contrato, no cosmética.
// `faltan_respuestas` dispara las dos preguntas de §5 — y NO es
// validación de formulario: es el MOTOR imponiendo la letra, así que la
// conducta del botón no depende de que la pantalla la recuerde.
export {
  escribirPresencia,
  type InputEscribirPresencia,
  type BorradorPresencia,
  type HechoPresencia,
  type CodigoErrorPresencia,
} from './wrappers/presencia';

// ── SEGURIDAD (S84-A27) ──────────────────────────────────────────────
// Cambiar contraseña con RE-AUTENTICACIÓN (Supabase no pide la actual y
// `secure_password_change` está en false) · recuperar por CÓDIGO de 6
// dígitos (cero link, cero scheme — el enlace queda para S85 con la
// build). `pedirCodigoRecuperacion` devuelve ok EXISTA O NO la cuenta:
// confirmarlo convertiría el formulario en un censo de usuarios.
export {
  cambiarContrasena,
  pedirCodigoRecuperacion,
  verificarCodigoRecuperacion,
  MIN_LARGO_CONTRASENA,
  establecerContrasenaNueva,
  segundosDeEspera,
  type CodigoErrorSeguridad,
} from './wrappers/seguridad';

export {
  obtenerPlataDelDia,
  type PlataDelDia,
  type CodigoErrorPortada,
} from './wrappers/portadaPrestador';

export {
  obtenerExpedienteModulado,
  type AporteExpediente,
  type NivelAporte,
  type CodigoErrorExpediente,
} from './wrappers/expedienteModulado';

export {
  obtenerFamiliaDeMascota,
  type FamiliaDeMascota,
  type MiembroDeFamilia,
  type CodigoErrorFamiliaMascota,
} from './wrappers/familiaDeMascota';

export {
  obtenerAtencionesAbiertas,
  type AtencionAbierta,
  type CodigoErrorAtencionesAbiertas,
} from './wrappers/atencionesAbiertas';
