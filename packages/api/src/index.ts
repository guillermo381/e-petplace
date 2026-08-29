// @epetplace/api — puerta única a Supabase: tipos generados + wrappers tipados.
// Regla: ningún app hace supabase.from()/rpc() directo — siempre a través de wrappers de este paquete.

export type { Database, Json } from './database.types';
export { initApi, getClient, type EpetplaceClient, type OpcionesApi, type StorageSesion } from './client';
export {
  registrarse,
  iniciarSesion,
  cerrarSesion,
  obtenerSesion,
  // ⚠️ S104-C · HUNK ADITIVO (regla 76(c)/(d), a RATIFICACIÓN de A): estas
  // funciones YA viven en `wrappers/auth.ts` (S104-A) pero no estaban en el
  // index, así que eran inalcanzables desde `@epetplace/api`. La invitación de
  // empleado del prestador las necesita para registrar el consentimiento
  // (LEY DE PARIDAD DE CUENTA). `registrarse` ya registra el suyo — esto es
  // para el consumo DIRECTO de las puertas que no pasan por el alta.
  registrarConsentimiento,
  registrarConsentimientos,
  confirmarAltaConCodigo,
  // S104-C · reenvío del código de alta (76(c), a ratificación de A): la
  // segunda mitad de la pantalla /verificar-correo. Gemela de confirmar.
  reenviarCodigoAlta,
  documentosVigentes,
  consultarConsentimiento,
  decidirConsentimiento,
  // S104-C · la versión POR DOCUMENTO (76(c), a ratificación de A). Las
  // pantallas de los actos consentibles (arbitraje §38.10 · dictado §31.6) la
  // necesitan: su versión es la del T&C professional del que son cláusula
  // (`VERSION_LEGAL.terminos_professional`), jamás un número tecleado (D-720).
  VERSION_LEGAL,
  type ActoConsentible,
  type TipoRegistrable,
  type EstadoConsentimiento,
  type DocumentoLegal,
  type DocumentoAceptado,
  normalizarEmail,
  type TipoConsentimiento,
  type SesionDueno,
  type InputRegistrarse,
  type InputIniciarSesion,
  type CodigoErrorAuth,
} from './wrappers/auth';
export {
  obtenerEspeciesActivas,
  obtenerCatalogoNovedadesPaseo,
  obtenerEspeciesElegibles,
  // S91 · D-379: el catálogo que SUGIERE razas (el dueño confirma).
  obtenerRazasDeEspecie,
  // S91 · la galería especies-razas: DOS pretendientes (el chip del alta de D
  // y el filtro por especie de B) ⇒ una sola pieza, en la puerta única.
  resolverUrlRaza,
  resolverUrlGenericaEspecie,
  resolverUrlRutaEspecies,
  type EspecieCatalogo,
  type NovedadPaseoCatalogo,
  type RazaCatalogo,
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
export type { ResultadoWrapper, CodigoDeFallo } from './resultado';
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
  // S99-A · lote #0 (D-738): el contexto de arranque EN UN VIAJE — la
  // fuente de la composición por capacidad (barra · HOY · ventana de L4).
  obtenerContextoArranque,
  type ContextoArranque,
  type CuentaComercialDeContexto,
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
  // S91 (pedido de B): el nombre de quien reservó, por lote de citas.
  obtenerNombresReservadorPorCita,
  // S91 (pedido de C): la ficha PÚBLICA, por la vista y jamás por la tabla.
  obtenerPerfilesPublicos,
  type PerfilPublico,
  type ServicioPublico,
  type NombreReservador,
  type CodigoReservador,
} from './wrappers/prestador';
// S76-B2 (D-525): el gate de PRODUCTO de la superficie de atender.
export { puedoAtenderClinico } from './wrappers/acceso-clinico';
/* S97-A (D-806) · LA ESCALERA de la cara de una mascota — el ORDEN en que se
   prueban los tres escalones. ⚠️ El RESOLVEDOR de URLs no está acá: vive en
   `catalogos.ts` desde S91 (se midió antes de escribir, y ya existía).
   Sube desde `apps/cliente/src/lib/cara-mascota.ts` porque **el prestador
   necesita la misma cara**: su alta dibuja seis especies con una sola huella
   mientras el cliente ya resolvía 111 imágenes. Cero assets nuevos. */
export { caraDeMascota, caraDeMascotaPorRuta } from './wrappers/caraMascota';
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
  // S91 · cláusula del pez (firma founder): el campo dos del acuario.
  type TipoAguaAcuario,
  // S91 · el origen del paso 3 (espejo del CHECK de mascotas.origen)
  type OrigenMascota,
  type CodigoErrorOnboarding,
} from './wrappers/onboarding';
export { resolverUrlFoto, resolverUrlsFotos } from './wrappers/fotos';
// S89-A — el tren de push: la puerta del token del aparato
export { registrarTokenDeAparato, type PlataformaPush, type CodigoPush } from './wrappers/push';
// ⭐ S90-B (D-676) — la matrícula de la PERSONA. Hunk aditivo de la pista B
// bajo regla 76(c)/(d); a ratificación de A. El motor y su gate ya existen
// desde S89-A: lo que faltaba era el camino para CARGAR el dato.
export {
  obtenerMatriculaEmpleado,
  guardarMatriculaEmpleado,
  type MatriculaEmpleado,
  type CodigoMatricula,
} from './wrappers/empleado-matricula';
// S89-A orden 8 ⑤ — los papeles del producto (carnet de vacunas v1)
export {
  urlDocumento,
  listarPapelesDeMascota,
  obtenerConsultasConReceta,
  type ConsultaConReceta,
  type PapelDelCatalogo,
  type TipoDocumento,
  type TipoDocumentoExpediente,
  type TipoDocumentoActo,
  type CodigoDocumento,
} from './wrappers/documentos';
// ⚠️ S90-D · PEDIDO A A (esta pista no es dueña de packages/api — ver cabecera
// de `wrappers/certificados.ts`).
export {
  emitirCertificadoSalud,
  obtenerCertificadosMascota,
  obtenerMiFirmaClinica,
  type AlcanceCertificado,
  type CertificadoEmitido,
  type CodigoCertificado,
  type FirmaClinica,
} from './wrappers/certificados';
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

/* S105-A · LA CITA RESUELTA — para el DETALLE, jamás para listas ni agendas.
   *Una cita cancelada aparece sólo donde la superficie promete contar lo que
   PASÓ; donde promete lo que VIENE, excluirla es correcto.* Los de arriba
   (`obtenerCitasActivas*`) prometen lo que viene y siguen filtrando bien. */
/* S105-A · LAS TARJETAS QUE EL PROVEEDOR TIENE POR VÁLIDAS (edge de D).
   ⚠️ NO resuelve la duplicación —es síntoma de D-921, ya curado— sino que
   deja de ofrecer tarjetas que el proveedor ya no honra. */
export {
  listarTarjetasVerificadas,
  type ListadoTarjetas,
  type TarjetaVerificada,
  type EstadoProveedor,
  type CodigoTarjetas,
} from './wrappers/pagos-tarjetas';

/* S105-A · RETOMAR LA COMPRA — nace CON su motor, en la misma tanda. */
export {
  retomarCompra,
  type CompraRetomada,
  type AjustePrecio,
  type ItemFaltante,
  type CodigoRetomarCompra,
} from './wrappers/retomar-compra';

export {
  leerCitaResuelta,
  type CitaResuelta,
  type CausaCancelacion,
  type CodigoCitaResuelta,
} from './wrappers/cita-resuelta';

// Perfil de mascota — S51-B2.3 (pila de módulos)
export {
  obtenerPerfilMascota,
  declararFotoMascota,
  // S91 (P3): la puerta de EDICIÓN de raza del perfil.
  actualizarRazaMascota,
  type CodigoRazaMascota,
  type PerfilMascota,
  type UmbralesEspecie,
  type VacunaDeMascota,
  type CodigoErrorFotoMascota,
  type EncuadreFotoDeclarado,
  // El censo del acuario (S91, enmienda firmada a D-685): especies y cuántos,
  // JAMÁS peces con identidad.
  obtenerCensoDelAcuario,
  declararCensoDelAcuario,
  type CensoDelAcuario,
  type HabitanteDelCenso,
  type ResultadoDeclaracion,
  type CodigoCensoAcuario,
} from './wrappers/perfilMascota';
export type { IdentidadMascota, AlergiasEstado, DesparasitacionDeMascota } from './wrappers/perfilMascota';

// Salud del expediente — S82 r4: los productores del dueño (los tres
// motores del gate) + el lector de la serie de peso
export {
  registrarDesparasitacion,
  declararSinAlergiasConocidas,
  registrarPesoMascota,
  // S91 (P2): la CURVA de peso, no el vigente.
  obtenerSeriePeso,
  type MedicionPeso,
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
  // S103 — la memoria del medio de pago. Sale por la puerta única: sin este
  // export, la pantalla tendría que llamar a `supabase.rpc()` directo, que es
  // exactamente lo que la regla madre prohíbe y lo que C frenó bien.
  guardarMedioPagoPreferido,
  type MedioPagoPreferido,
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
  // S96 (firma founder): el selector de cuenta comercial — todas las que opera.
  misCuentasComerciales,
  listarDocumentosCuenta,
  registrarDocumentoCuenta,
  actualizarNombreCuentaComercial,
  type DocumentoCuenta,
  type CuentaOperada,
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
  // S97-A · la naturaleza se SOLICITA (el paso ② del wizard propone, jamás otorga)
  solicitarNaturalezaComercial,
  retirarNaturalezaSolicitada,
  obtenerNaturalezasDeCuenta,
  type NaturalezaComercial,
  type EstadoNaturaleza,
  type NaturalezaDeCuenta,
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
  hayNovedades,
  registrarVisitaCampana,
  marcarAvisoLeido,
  type AvisoDeCampana,
  type AppCampana,
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
  // S100c · la libreta de direcciones con alias. NO reemplaza a la del hogar.
  listarMisDirecciones,
  guardarDireccionConAlias,
  type DireccionGuardada,
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
  type FiltroVocabularioBitacora,
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
  // S97-A · la MODALIDAD del servicio (paso ② del wizard + la tab ATENDER +
  // el gate del rol recepción — una sola fuente, tres lectores)
  fijarModalidadServicio,
  obtenerModalidadesPorOficio,
  type ServicioDeOficio,
  // S97-A · la regla condicional de recepción + el onboarding por paso
  puedeOfrecerRolRecepcion,
  obtenerEstadoOnboardingWizard,
  saltarPasoOnboarding,
  retomarPasoOnboarding,
  type PasoOnboarding,
  type EstadoPasoOnboarding,
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
  LARGO_CODIGO_RECUPERACION,
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

// ── LA DESPENSA (S95-E) ─────────────────────────────────────────────────────
export {
  listarProductosDespensa,
  contarProductosDespensa,
  obtenerFichaProducto,
  buscarProductosDespensa,
  // S99-L5b (N20, adjudicación (a)): los conteos por eje sobre LO COMPRABLE
  // — al barrel EN EL MISMO COMMIT (la clase motor-sin-puerta no suma más).
  conteosVitrinaPorEje,
  // S99 · la promesa ANTES de comprar (firma founder) — por VENDEDOR.
  promesaPorVendedor,
  recomendarParaMascota,
  // S96 (12-ago, 2ª tanda): el paso de entendimiento de §5.4, registrado.
  registrarEntendimientoAlergia,
  // S96 (4ª tanda): la advertencia por RELACIÓN, con su imprecisión tipada.
  expandirAlergenosAVigilar,
  // S96 (pedido D): el vocabulario con su VOZ (cat_alergenos.nombre_es).
  listarAlergenos,
  type AlergenoVigilado,
  type ProductoDeVitrina,
  type VarianteDeProducto,
  type FichaProducto,
  type ConteosVitrina,
  type PromesaDeVendedor,
  type Recomendacion,
  type FiltrosVitrina,
  // S96: vocabulario VERBATIM del CHECK y de EstadoComposicion de @epetplace/ui.
  type ComposicionEstado,
} from './wrappers/despensa-catalogo';

export {
  NARRATIVAS_PEDIDO,
  esNarrativa,
  type NarrativaPedido,
  type CodigoErrorDespensa,
} from './wrappers/_despensa-comun';

export {
  cotizarEnvioDespensa,
  // ☠️ S96: `calcularPromesaEntrega` (bodega) murió con su función; la promesa
  // es por turno y cupo.
  calcularPromesaDespensa,
  nuevaClaveIdempotencia,
  crearPedidoDespensa,
  // S100 · el gate de la puerta (D-827): revalida el carrito contra la
  // vitrina de AHORA, antes de la caja.
  revalidarCarritoDespensa,
  // S100c · la otra mitad de la mala noticia en la puerta: «pedí 3 y hay 1».
  maximoComprableDeOfertas,
  type MaximoDeOferta,
  reservarStockPedido,
  iniciarPagoPedido,
  cancelarPedidoDespensa,
  obtenerCodigoEntrega,
  atarItemAMascota,
  reclamarCompraMostrador,
  configurarRecurrencia,
  alternarRecurrencia,
  type CotizacionEnvio,
  type InputCotizarEnvio,
  type PromesaEntrega,
  type ItemDeCompra,
  type DatosDeEntrega,
  type PedidoCreado,
  type EstadoOfertaCarrito,
  type MotivoNoDisponible,
  // S100 · LA COMPRA: la entidad que se cobra. N pedidos atrás, UN pago
  // adelante — y `referencia` es el id de la COMPRA, jamás el de un pedido.
  crearCompraDesdePedidos,
  crearIntentoPago,
  // F6: qué tienda prepara cada pedido — la familia no puede leer
  // `cuentas_comerciales`, así que va por DEFINER angosta (molde D-455).
  obtenerNombresTiendaPorPedido,
  type CompraCreada,
  type IntentoDePago,
} from './wrappers/despensa-pedido';

export {
  listarMisPedidos,
  obtenerDetallePedido,
  type PedidoEnLista,
  type LineaDePedido,
  type SeguimientoEnvio,
  type DetallePedido,
  // S100 · F3: la ficha del repartidor (tres campos; la foto NO — vive en el
  // bucket de las cédulas y eso es deuda declarada, no un permiso).
  obtenerFichaRepartidor,
  type FichaRepartidor,
  // S100c · los dos lectores que la lista de pedidos necesitaba (pedidos de D,
  // los dos con su caso medido contra la base). El primero cura las nueve
  // tarjetas iguales del mismo día; el segundo saca a la luz un dato que
  // entraba por el panel del vendedor y no salía por ninguna puerta.
  resumenDeItemsDePedidos,
  type ResumenItemsPedido,
  facturasDePedidos,
  type FacturaDePedido,
  type FacturaDeUnPedido,
} from './wrappers/despensa-seguimiento';

export {
  listarPedidosDelVendedor,
  obtenerLineasParaEmpaque,
  marcarPedidoEnPreparacion,
  empacarPedido,
  // ☠️ S96: `marcarPedidoDespachado` murió con `esperando_courier` — el
  // despacho ASIGNA repartidor (decisión founder ①).
  despacharPedido,
  entregarRetiroEnMostrador,
  // S99-L3 · «Poner primero» — el reorden del panel (ratificado por mesa).
  ponerPedidoPrimero,
  volverPedidoAlOrden,
  listarSkusDelVendedor,
  listarSkusDelVendedorPagina,
  // S99-L5b (N18): el evaluador de alcance — puro, por-SKU, una fuente con
  // el cliente. El re-export va ACÁ Y AHORA: la segunda muestra de
  // «motor sin puerta» fue exactamente un wrapper sin barrel.
  razonesDeAlcance,
  ajustarStockVendedor,
  actualizarPrecioOferta,
  // S99 · los dos lectores de C (mesa 17-ago) + la carga determinista L5a
  // — al barrel EN EL MISMO COMMIT (la clase motor-sin-puerta no suma más).
  viajesPorRepartidor,
  proponerSkusVendedorLote,
  configurarVentaMostrador,
  configurarCapacidadRepartidor,
  listarRepartidores,
  registrarRepartidor,
  actualizarRepartidor,
  // S99 (adj. #2) · el reclamo por correo: el acto de un toque y su lector.
  aceptarVinculoRepartidor,
  misVinculosRepartidorPendientes,
  registrarVehiculoRepartidor,
  eliminarVehiculoRepartidor,
  obtenerReglaEnvioActiva,
  type ReglaEnvioActiva,
  // S99-A · D-791 + L4: el escritor de la regla y el lector por rango — el
  // barrel es de nombres explícitos, y un wrapper sin re-export es una puerta
  // que no abre (precedente S96-C, cobrado de nuevo acá por C).
  definirReglaEnvioVendedor,
  listarPedidosDelVendedorEnRango,
  type PedidoDelVendedorConDia,
  definirRecursoReparto,
  declararExcepcionRecurso,
  definirTurnoEntrega,
  cupoRepartoDelDia,
  registrarVentaMostrador,
  type PedidoDelVendedor,
  type LoteDeItem,
  type SkuDelVendedor,
  type RazonAlcance,
  type FilaLoteSku,
  type ResultadoFilaLote,
  type Repartidor,
  type VehiculoRepartidor,
} from './wrappers/despensa-vendedor';

// ── EL REPARTIDOR (S96 · la pantalla mínima de tres acciones) ───────────────
export {
  misEntregasAsignadas,
  marcarEnCaminoADestino,
  subirFotoEntrega,
  entregarConEvidencia,
  marcarEntregaFallida,
  // S96-C (precedente método §6: la omisión se agrega y SE DECLARA, no se
  // clona): el wrapper del track existía y el re-export no — sin él, el
  // cableo del GPS del reparto no compila. A verifica y firma o revierte.
  registrarTrackEnvio,
  type EntregaAsignada,
  type PuntoTrackEnvio,
} from './wrappers/despensa-repartidor';

// ── HUNK ADITIVO DE LA PISTA C (S96) — lo que el panel necesitaba y el
//    contrato no traía; cada hueco medido contra la fuente. A firma o muda
//    (76(c): archivo nuevo + este hunk; el porqué vive en el archivo). ───────
export {
  obtenerEscalonPedido,
  extrasPanelPedidos,
  registrarFacturaPedido,
  rolesActivosDeMiCuenta,
  listarRecursosReparto,
  listarTurnosEntrega,
  ESCALONES_VIVOS,
  type ExtraPanelPedido,
  type RecursoReparto,
  type TurnoEntrega,
} from './wrappers/despensa-panel-extra';

export {
  crearAltaTarjeta,
  obtenerAltaTarjeta,
  type AltaEmitida,
  type AltaLeida,
  type CodigoAltaTarjeta,
  type EstadoAlta,
} from './wrappers/pagos-alta-tarjeta';

export {
  verificarCompuertas,
  COMPUERTAS_DEFECTO_NUESTRO,
  type CodigoCompuerta,
  type Compuertas,
  type CompuertasVerde,
  type CompuertasRojo,
} from './wrappers/pagos-compuertas';

export {
  listarTarjetasGuardadas,
  type TarjetaGuardada,
  borrarTarjetaGuardada,
  type CodigoBorrado,
} from './wrappers/tarjetas-guardadas';

export {
  cobrarCompra, cobrarCita, cobrarSujeto,
  type CodigoCobro, type SenalDeCobro, type SujetoDeCobro,
} from './wrappers/pagos-cobro';

// S103-A · LA PUERTA DEL RIEL DEUNA — misma forma que el cobro con tarjeta a
// propósito: `una casa, un motor, dos puertas`. Lo que devuelve es una
// INVITACIÓN A PAGAR (un código para tipear en otra app), jamás un pago.
export {
  pedirCodigoDeuna, pedirCodigoDeunaCompra, pedirCodigoDeunaCita,
  type CodigoDeuna, type SujetoDeuna, type SolicitudDeuna,
} from './wrappers/pagos-deuna';

export {
  leerEstadoCompra, leerEstadoCita,
  type EstadoCompra, type EsperaCompra, type EstadoCita, type EsperaCita,
} from './wrappers/pagos-espera';

// S104-A · tanda 2 — la invitación de familia (puerta única, cero INSERT desde apps).
export {
  invitarAFamilia,
  aceptarInvitacionFamilia,
  revocarInvitacionFamilia,
  darDeBajaCorreo,
  type InvitacionCreada,
  type InvitacionAceptada,
  type CodigoInvitacionFamilia,
  estadoCorreoInvitacion,
  type EstadoCorreoInvitacion,
  type YaInvitada,
} from './wrappers/familia-invitacion';

// S104-A · tanda 3 — LA SALIDA. Vive en packages/api por la LEY DE PARIDAD:
// el cierre PERSONAL y la copia nacen en las dos apps. El cierre del NEGOCIO
// no está acá y no es deuda: es la excepción ② de esa ley (trámite asistido).
export {
  solicitarCierreCuenta,
  exportarMisDatos,
  type CierreSolicitado,
  type CopiaSolicitada,
  type ErrorCierre,
} from './wrappers/cuenta-salida';

// S104-A · el freno del enlace de invitación (freno de mesa, 24-ago): una sola
// verdad que las dos apps consumen, en vez de una disciplina por pantalla.
export {
  ENLACE_INVITACION_HABILITADO,
  APP_BASE_URL,
  urlInvitacion,
} from './wrappers/_enlace-invitacion';

// S104-A · entrar con Google (solo cliente). El navegador lo abre la app: este
// paquete es agnóstico de Expo y así se queda.
export {
  iniciarSesionConGoogle,
  type AbrirSesionAuth,
  type ResultadoNavegador,
  type CodigoGoogle,
} from './wrappers/auth-google';

// ⚠️ HUNK ADITIVO DECLARADO (76f) — `index.ts` es archivo compartido: esto se
// agrega AL FINAL y no toca ninguna línea existente.
//
// S106-A · TELEMEDICINA, el quinto oficio. `LETRA_TELEMEDICINA` v1.1.
// 🔴 NO se exporta `puede_entrar_a_videollamada`: es `service_role` y la
// llama `video-token` desde el servidor. Un wrapper suyo sería una puerta a
// algo que la casa decidió que no tuviera puerta de cliente.
// 🔴 El consentimiento NO tiene función propia: viaja como
// `acepta_teleconsulta` dentro de `crearBloqueoAgenda` (agendamiento.ts), en
// el MISMO acto que el hold.
export {
  aceptarMinimosServicio,
  prestadorAceptoMinimos,
  ventanaCancelacionMinutos,
  marcarTeleconsultaNoRealizable,
  cancelarTeleconsulta,
  type MinimosAceptados,
  type ResultadoDevolucion,
  type ResultadoCancelacionTeleconsulta,
  type CodigoErrorTelemedicina,
} from './wrappers/telemedicina';

/* S106-A t2 · la puerta de la videollamada (motor de D, wrapper de A). */
export {
  pedirTokenVideollamada,
  type TokenVideollamada,
  type ResultadoVideollamada,
  type CodigoVideollamada,
} from './wrappers/videollamada';

/* S106-A t2 · el cuadro congelado de la teleconsulta. */
export {
  adjuntarCuadroTeleconsulta,
  subirCuadroTeleconsulta,
  type CuadroAdjuntado,
  type InputCuadroTeleconsulta,
  type CodigoCuadroTeleconsulta,
} from './wrappers/teleconsulta-adjuntos';
export { obtenerConfigVideo, type ConfigVideo } from './wrappers/telemedicina';
export { prestadorTieneVerificacionProfesional, cerrarTeleconsulta } from './wrappers/telemedicina';
export { obtenerHistorialClinicoMascota, type ItemHistorialClinico, type FiltrosHistorialClinico } from './wrappers/veterinaria-nota-clinica';
export { guardarBorradorNota, leerBorradorNota, type BorradorNota, type CodigoBorradorNota } from './wrappers/veterinaria-nota-clinica';

/* S107-A · guardería: el cupo del lugar y sus dos franjas. */
export {
  definirEspacioGuarderia,
  declararExcepcionEspacioGuarderia,
  definirFranjaGuarderia,
  obtenerFranjasGuarderia,
  obtenerCupoGuarderia,
  type FranjaGuarderia,
  type CupoDiaGuarderia,
  type EstadoCupoDia,
  type TipoFranjaGuarderia,
  type DiaSemana,
  definirPaqueteGuarderia,
  obtenerPaquetesGuarderia,
  type PaqueteGuarderia,
  type TamanoPaquete,
  type CodigoErrorGuarderiaConfig,
} from './wrappers/guarderia-config';

/* S107-A · guardería: la oferta (precio y visibilidad). */
export {
  definirOfertaGuarderia,
  obtenerOfertaGuarderiaPropia,
  obtenerGuarderiasDisponibles,
  obtenerEstadoGuarderia,
  type OfertaGuarderiaPublicada,
  type OfertaGuarderiaPropia,
  type EstadoGuarderia,
  type EstadoGuarderiaCompleto,
  type MotivoNoPublicada,
  type GuarderiaDisponible,
  type ModalidadGuarderia,
  type CodigoErrorGuarderiaOferta,
} from './wrappers/guarderia-oferta';

/* S107-A · guardería: el gate sanitario y la reserva del día. */
export {
  obtenerMisEstadiasGuarderia,
  type EstadiaDeMiMascota,
  evaluarRequisitosGuarderia,
  reservarDiaGuarderia,
  type RequisitosGuarderia,
  type RequisitoFaltante,
  type EstadoRequisito,
  type ReservaGuarderia,
  obtenerEstadiasDelDia,
  publicarMediaGuarderia,
  obtenerMediaDelDia,
  obtenerMediaDeMiMascota,
  registrarPuntoVivo,
  obtenerPuntoVivo,
  levantarActaGuarderia,
  confirmarActaGuarderia,
  type MediaGuarderia,
  type PuntoVivo,
  type DireccionActa,
  type Conformidad,
  type EstadiaDelDia,
  type EstadoEstadia,
  type CodigoErrorGuarderiaReserva,
} from './wrappers/guarderia-reserva';
