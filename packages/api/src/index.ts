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
  type InputActualizarPerfilPrestador,
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

// Vacaciones / bloqueos del prestador — S56-B (TAREA 2, D-341) — archivo
// NUEVO de esta sesión
export {
  obtenerBloqueosPrestador,
  crearBloqueoPrestador,
  eliminarBloqueoPrestador,
  type BloqueoPrestador,
  type InputCrearBloqueoPrestador,
  type CodigoErrorBloqueos,
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
  obtenerVeterinariosDisponibles,
  type CodigoErrorVetReserva,
  type InputIniciosVet,
  type InputVeterinariosDisponibles,
  type OfertaVet,
  type VeterinarioDisponible,
} from './wrappers/veterinaria-reserva';

// ── La reserva de adiestramiento del DUEÑO (S63-A Bloque 3 — hunk Sesión A) ─
export {
  COMPRABLES_ADIESTRAMIENTO,
  obtenerIniciosAdiestramiento,
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
export { obtenerTitularId } from './wrappers/titular';
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
export {
  obtenerContactoReservaCita,
  type ContactoReservaCita,
  type CodigoErrorContactoReserva,
} from './wrappers/recepcion';

// S74-B — la ventana de EQUIPO (LETRA_EQUIPO §14, composición sobre lo vivo)
export {
  obtenerEquipoNegocio,
  asignarRolEmpleado,
  quitarRolEmpleado,
  desvincularEmpleado,
  invitarEmpleado,
  empleadoTieneRol,
  obtenerNegocioEmpleadoActivo,
  type EquipoNegocio,
  type MiembroEquipo,
  type RolEquipo,
  type CodigoErrorEquipo,
  type CodigoInvitar,
} from './wrappers/equipo';
export { obtenerUmbralesMomentoVital } from './wrappers/catalogos';
