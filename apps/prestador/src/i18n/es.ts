/**
 * Diccionario español del prestador — namespace `prestador` (S51-B1a).
 * Registro: tuteo neutro (regla 27, decisión founder S51).
 *
 * Las pantallas existentes migran su voz acá AL TOCARSE (D-315);
 * toda pantalla NUEVA nace con sus textos acá — cero strings crudos
 * (regla 26 bilingüe). Voz emocional: lote S51 aprobado por founder.
 */

export const prestadorEs = {
  tabs: {
    hoy: 'Hoy',
    mascotas: 'Mascotas',
    negocio: 'Negocio',
    // la tab Cuenta (letra P17, S57-B) · LOTE S57, GATE PENDIENTE
    cuenta: 'Cuenta',
  },
  sesion: {
    // El estado honesto del raíz (S51; auth real desde S54/D-290):
    // sin sesión la app lo DICE apenas abre y ofrece entrar.
    sinSesion: 'No hay una sesión activa',
    sinSesionDetalle: 'Inicia sesión para ver tu jornada.',
    iniciarSesion: 'Iniciar sesión',
    // con sesión pero SIN negocio de prestador (D-290): jamás crash
    sinRol: 'Tu cuenta no tiene un negocio asociado',
    sinRolDetalle: 'Entraste como {{email}}. Esta app es para quienes ofrecen servicios en e-PetPlace — si es tu caso y no ves tu negocio, escríbenos.',
    reintentar: 'Probar de nuevo',
    cerrarSesion: 'Cerrar sesión',
    confirmacionCierre: '¿Cierras tu sesión? Tu trabajo queda guardado.',
    cancelar: 'Cancelar',
    titulo: 'Sesión',
  },
  // Login del prestador (S54-B, D-290) — email+contraseña por los
  // wrappers de auth existentes; el registro del prestador es otro ciclo.
  login: {
    titulo: 'Iniciar sesión',
    email: 'Email',
    emailPlaceholder: 'ej: ana@correo.com',
    password: 'Contraseña',
    entrar: 'Entrar',
  },
  agenda: {
    saludo: 'Tus paseos de hoy',
    vacio: 'Hoy no tienes paseos',
    vacioDetalle: 'Cuando una familia agende un paseo, va a aparecer acá.',
    reintentar: 'Reintentar',
    enCurso: 'En curso',
    // Zona 1 — lo siguiente preside
    ahora: 'Ahora',
    loSiguiente: 'Lo siguiente',
    primeraVez: 'Primera vez',
    conocerMascota: 'Conocer a {{nombre}}',
    // estados de cita (voz de oficio, funcional)
    estadoPorCerrar: 'Por cerrar',
    estadoCerrado: 'Cerrado',
    estadoConfirmada: 'Confirmada',
    estadoCompletada: 'Completada',
    estadoNoShow: 'No show',
    // fallback cuando la cita llega sin mascota asociada (D-315p)
    mascotaFallback: 'Mascota',
    // marca "parte del plan" (D-338, S56-B T7) · LOTE S56, GATE PENDIENTE
    parteDelPlan: 'Parte del plan',
    // la semana (D-317, S57-B1) · LOTE S57, GATE PENDIENTE
    vistaEtiqueta: 'Agenda',
    vistaHoy: 'Hoy',
    vistaSemana: 'Semana',
    diaHoy: 'Hoy',
    diaLibre: 'Libre',
    diaBloqueado: 'De vacaciones',
  },
  // La tab Cuenta del prestador (letra P17, S57-B) · LOTE S57, GATE PENDIENTE.
  // Voces calcadas de la Cuenta v1 del cliente (aprobadas S55/S56);
  // eliminarVoz con la verdad P17 §4 del lado del negocio.
  miCuenta: {
    titulo: 'Tu cuenta',
    perfil: 'Tu perfil',
    preferencias: 'Preferencias',
    errorCargar: 'No pudimos cargar esto. Prueba de nuevo.',
    guardar: 'Guardar cambios',
    nombreLabel: 'Tu nombre',
    telefonoLabel: 'Teléfono',
    telefonoAyuda: 'Con código de país, solo números. ej: 593991234567',
    emailLabel: 'Email',
    emailAyuda: 'El email no se cambia desde acá todavía.',
    perfilGuardado: 'Listo — tu perfil quedó al día.',
    notificaciones: 'Notificaciones',
    notifPronto: 'Pronto — cuando las notificaciones del negocio lleguen al teléfono, acá vas a decidir cuáles.',
    eliminarCuenta: 'Eliminar cuenta',
    eliminarVoz:
      'Va a estar acá, con todas las de la ley. Antes tenemos que resolver bien qué pasa con tus citas ya pagadas, tus planes vivos y tu saldo por liquidar — un negocio con compromisos no se borra a la ligera.',
    entendido: 'Entendido',
  },
  // El flujo de atención E2E (S44, migrado en D-315 pata prestador).
  // VOZ EMOCIONAL APROBADA por founder (lote S55, es y en) — hunk de
  // comentario editado por la Sesión A por orden explícita del founder.
  // MOTIVOS_GPS siguen es-only en DB (D-324, deuda aparte).
  cita: {
    // detalle / preparar
    tituloPaseoDe: 'Paseo de {{nombre}}',
    tituloPaseo: 'Paseo',
    noDisponible: 'Esta cita ya no está disponible',
    noDisponibleDetalle: 'Puede haberse movido o cancelado. Vuelve a la agenda para ver tus paseos de hoy.',
    noDisponibleDetalleCorto: 'Vuelve a la agenda para ver tus paseos de hoy.',
    volverAgenda: 'Volver a la agenda',
    estadoPorConfirmar: 'Por confirmar',
    hoy: 'hoy',
    iniciarPaseo: 'Iniciar paseo',
    // A dónde ir — D-339 (S56-B TAREA 3) · LOTE S56, GATE PENDIENTE
    direccionTitulo: 'A dónde ir',
    // marca "parte del plan" (D-338, S56-B T7) · LOTE S56, GATE PENDIENTE
    parteDelPlan: 'Parte del plan de {{nombre}}',
    direccionAbrirMapa: 'Abrir en el mapa',
    direccionSinDato: 'Esta cita no tiene una dirección registrada.',
    direccionMapaError: 'No pudimos abrir el mapa.',
    // durante
    enCursoTitulo: 'Paseo en curso',
    gpsIniciando: 'GPS iniciando',
    gpsActivo: 'GPS activo',
    gpsDetenido: 'GPS detenido',
    gpsSinPermiso: 'Sin permiso de ubicación',
    gpsNoDisponible: 'GPS no disponible',
    gpsError: 'GPS con error',
    unPunto: '1 punto',
    puntos: '{{n}} puntos',
    sinGpsExplicacion:
      'Necesitamos tu ubicación para registrar el recorrido que ve la familia. El paseo puede seguir igual — sin ruta, al terminar te pedimos contar qué pasó.',
    probarDeNuevo: 'Probar de nuevo',
    parteDelPerro: 'Parte del perro',
    evidencia: 'Evidencia',
    fotosSufijo: '{{n}} fotos',
    parteRegistrado: 'Parte registrado',
    fotoNoSubio: 'La foto no se subió. Tócala para reintentar.',
    agregarNotaIncidencia: 'Agregar nota o incidencia',
    terminarPaseo: 'Terminar paseo',
    notaOIncidencia: 'Nota o incidencia',
    nota: 'Nota',
    incidencia: 'Incidencia',
    elegirIncidencia: 'Elige qué pasó del catálogo.',
    severidadMedia: 'Severidad media',
    severidadAlta: 'Severidad alta',
    quePaso: 'Qué pasó',
    notaPlaceholder: 'Algo que quieras dejar anotado.',
    incidenciaPlaceholder: 'Cuenta qué pasó con calma.',
    registrarIncidencia: 'Registrar incidencia',
    guardarNota: 'Guardar nota',
    incidenciaRegistrada: 'Incidencia registrada',
    notaRegistrada: 'Nota registrada',
    terminarTitulo: 'Terminar el paseo',
    terminarExplicacion:
      'El recorrido y el tiempo quedan registrados. Después vas a poder completar el parte y mandarle un mensaje a la familia.',
    seguirPaseando: 'Seguir paseando',
    sinRutaMotivo: 'No registramos ruta GPS en este paseo. Cuéntale a la familia qué pasó:',
    // cierre
    cierreTitulo: 'Parte del paseo',
    resumenConteos: '{{puntos}} puntos gps · {{fotos}} fotos · {{notas}} notas',
    sinRutaGps: 'Sin ruta GPS: {{motivo}}',
    faltaNovedad: 'Registra al menos una novedad del paseo para enviar el parte.',
    registrarNovedad: 'Registrar novedad',
    mensajeFamilia: 'Mensaje a la familia',
    mensajeFamiliaAyuda: 'Opcional — va con el parte.',
    enviarParte: 'Enviar parte y cerrar',
    parteEnviado: 'Parte enviado',
    parteEnviadoMono: 'parte enviado',
  },
  mascotas: {
    titulo: 'Mascotas',
    // §2.6: vacío = en preparación, jamás fracasado (voz aprobada S51):
    vacio: 'Las vidas que cuides van a vivir acá',
    vacioDetalle: 'Con tu primera atención cerrada, la mascota entra a tu historial con su expediente.',
    unaAtencion: '1 atención',
    atenciones: '{{n}} atenciones',
    error: 'No pudimos cargar las mascotas',
    errorDetalle: 'Revisa tu conexión y prueba de nuevo.',
  },
  detalleMascota: {
    // señales de cuidado (solo lo REAL del expediente)
    condicionCronica: 'Condición crónica',
    alergias: 'Alergias',
    emergenciaActiva: 'Emergencia activa',
    sinSenales: 'Sin señales de cuidado registradas en su expediente.',
    carnet: 'Carnet',
    unaVacuna: '1 vacuna registrada',
    vacunas: '{{n}} vacunas registradas',
    carnetVacio: 'Sin vacunas registradas todavía.',
    historial: 'Tu historial con {{nombre}}',
    atencionCerrada: 'Paseo cerrado',
    atencionEnCurso: 'Paseo en curso',
    // la familia humana NO es visible por RLS (relevado S51) — cuando
    // el canal interno exista (B5), su lugar nace acá.
    identidad: 'Identidad',
    raza: 'Raza',
    sexo: 'Sexo',
    sexoMacho: 'Macho',
    sexoHembra: 'Hembra',
    nacimiento: 'Nacimiento',
    peso: 'Peso',
    microchip: 'Microchip',
    error: 'No pudimos cargar el expediente',
  },
  negocio: {
    titulo: 'Tu negocio',
    enPreparacion: 'En preparación',
    oferta: 'Tu oferta',
    servicios: 'Servicios y precios',
    serviciosDetalle: 'Qué paseos ofreces y sus precios.',
    horarios: 'Horarios',
    horariosDetalle: 'Tus días y franjas de paseo.',
    // S56-B TAREA 2 (D-341) · LOTE S56, GATE PENDIENTE
    vacaciones: 'Vacaciones',
    vacacionesDetalle: 'Marca los días en que no paseas.',
    equipo: 'Equipo',
    cobros: 'Cobros',
    cuentaComercial: 'Cuenta comercial',
    liquidaciones: 'Liquidaciones',
    // honesto en términos de hitos — JAMÁS "$0" (§2.6):
    liquidacionesDetalle: 'Se despierta cuando empieces a cobrar por la app.',
    // S54-B: la verdad del dinero cuando el ledger tiene eventos propios
    liquidacionesPendientes: 'Tienes {{cantidad}} servicios cobrados esperando liquidación.',
    liquidacionesPendientesUno: 'Tienes 1 servicio cobrado esperando liquidación.',
    cuentaComercialDetalle: 'La necesitas antes de cobrar — llega con el ciclo de pagos.',
    idioma: 'Idioma',
    idiomaEs: 'Español',
    idiomaEn: 'English',
    idiomaError: 'No pudimos guardar el idioma. Prueba de nuevo.',
  },
  // Cuenta comercial — S54-B (wizard B2.3, MODELO_FINANCIERO §6.5)
  cuenta: {
    titulo: 'Cuenta comercial',
    error: 'No pudimos cargar tu cuenta comercial.',
    reintentar: 'Reintentar',
    // peldaño 0 — invitación que educa (solo alcanzable sin cuenta creada)
    invitacionTitulo: 'Para cobrar por la app',
    invitacionCuerpo:
      'La cuenta comercial es tu identidad fiscal en e-PetPlace: con ella el equipo valida quién cobra y te transfiere lo tuyo. Se registra una sola vez.',
    invitacionCta: 'Registrar mi cuenta',
    // peldaños 1-2 — el estado honesto
    estadoEnRevision: 'En revisión',
    estadoEnRevisionVoz:
      'Tu cuenta está en revisión. El equipo la activa — te avisamos cuando esté lista para cobrar.',
    estadoActiva: 'Activa',
    estadoActivaVoz: 'Tu cuenta está activa: puedes cobrar por la app.',
    estadoSuspendida: 'Suspendida',
    estadoSuspendidaVoz: 'Tu cuenta está suspendida. Escríbenos para revisarlo.',
    estadoCerrada: 'Cerrada',
    estadoCerradaVoz: 'Esta cuenta está cerrada y no permite operaciones nuevas.',
    // datos fiscales
    datosFiscales: 'Datos fiscales',
    razonSocial: 'Razón social',
    nombreComercial: 'Nombre comercial',
    identificacion: 'Identificación fiscal',
    pais: 'País',
    // datos bancarios
    datosBancarios: 'Datos bancarios',
    bancariosEducacion:
      'Esta es la cuenta donde vas a recibir tus liquidaciones. Si ofreces servicios, vendes productos o tienes un refugio, todo se consolida acá: recibes una sola transferencia.',
    bancariosFaltan:
      'Aún no cargas tus datos bancarios. Sin ellos el equipo no puede activar tu cuenta ni pagarte.',
    bancariosCta: 'Cargar datos bancarios',
    bancariosActualizar: 'Actualizar datos bancarios',
    banco: 'Banco',
    bancoElegir: 'Elige tu banco',
    titular: 'Titular',
    tipoCuenta: 'Tipo de cuenta',
    tipoCorriente: 'Corriente',
    tipoAhorros: 'Ahorros',
    numeroCuenta: 'Número de cuenta',
    numeroCuentaAyuda: 'Puedes copiarlo con o sin guiones.',
    titularNombre: 'Titular de la cuenta',
    titularNombreAyuda: 'Tal como figura en el banco.',
    titularTipoDocumento: 'Documento del titular',
    titularDocumento: 'Número de documento',
    campoObligatorio: 'Este dato es obligatorio.',
    formatoInvalido: 'El formato no es válido.',
    numeroCuentaInvalido: 'Entre 4 y 34 caracteres — números, espacios o guiones.',
    guardar: 'Guardar',
    bancariosGuardados: 'Datos bancarios guardados.',
    // registro (peldaño 0 → 1)
    nuevaTitulo: 'Registrar cuenta',
    nuevaIdentificacionVoz:
      'Empecemos por tu identificación fiscal — con ella verificamos que la cuenta sea tuya.',
    tipoFiscal: 'Tipo de contribuyente',
    tipoFiscalElegir: 'Elige tu tipo de contribuyente',
    tipoFiscalPersonaNatural: 'Persona natural',
    tipoFiscalPersonaNaturalObligada: 'Persona natural obligada a llevar contabilidad',
    tipoFiscalPersonaJuridica: 'Persona jurídica',
    tipoFiscalSinFinesLucro: 'Entidad sin fines de lucro',
    identificacionAyuda: 'Solo números, sin puntos ni guiones.',
    continuar: 'Continuar',
    nuevaDatosVoz: 'Ahora, los datos con los que factura tu negocio.',
    razonSocialAyuda: 'El nombre legal, como consta en tu RUC o cédula.',
    nombreComercialAyuda: 'El nombre con el que te conocen tus clientes.',
    crear: 'Crear cuenta',
    nuevaCreada: 'Tu cuenta quedó registrada y en revisión.',
  },
  // Vista de Liquidaciones v1 — S55-B (B1, RUTA 3.1.D). Verdad firme:
  // estados honestos, cero promesas de fecha que el motor no da.
  cobros: {
    titulo: 'Liquidaciones',
    error: 'No pudimos cargar tus cobros.',
    errorDetalle: 'Prueba de nuevo en un momento.',
    reintentar: 'Reintentar',
    // peldaño 0 — invitación que educa (JAMÁS $0)
    vacioTitulo: 'Acá vas a ver lo que cobras',
    // ≤3 líneas a 420px: EstadoVacio (registro pantalla) trunca en la 3ª
    vacioCuerpo:
      'Cada servicio pagado por la app queda registrado acá. Tus cobros se agrupan en liquidaciones: una transferencia con el total.',
    vacioSinCuentaActiva:
      'El primer paso es tu cuenta comercial: con ella el equipo valida quién cobra.',
    vacioCta: 'Mi cuenta comercial',
    // peldaño 1 — el desglose esperando liquidación
    esperandoTitulo: 'Esperando liquidación',
    esperandoUno: '1 servicio cobrado',
    esperandoVarios: '{{cantidad}} servicios cobrados',
    esperandoEducacion:
      'Tus cobros se agrupan en liquidaciones: recibes una sola transferencia con el total.',
    pagoSimulado: 'Pago simulado',
    servicioPaseo: 'Paseo',
    servicioGenerico: 'Servicio',
    // peldaño 2 — las liquidaciones emitidas (la voz de cada estado real)
    liquidacionesTitulo: 'Tus liquidaciones',
    estadoEnPreparacion: 'En preparación',
    estadoAprobada: 'Aprobada',
    estadoPagada: 'Pagada',
    estadoEnRevision: 'En revisión',
    estadoAnulada: 'Anulada',
  },
  // Configuración del servicio de paseo — S55-B (B2, modelo cerrado del
  // founder: menú canónico de bloques + precio por bloque)
  // LOTE S56 — GATE PENDIENTE del founder: servicios.* + horarios.* completos
  // (nacieron post-lectura S55; la aprobación S55 NO los cubre) + las keys
  // de comisión visible (S56-B TAREA 4).
  servicios: {
    titulo: 'Servicios y precios',
    error: 'No pudimos cargar tus servicios.',
    errorDetalle: 'Prueba de nuevo en un momento.',
    reintentar: 'Reintentar',
    // peldaño 0 — invitación que educa
    vacioTitulo: 'Tu servicio de paseo',
    vacioCuerpo:
      'Elige qué paseos ofreces y cuánto cuesta cada uno. Tus clientes solo ven lo que tú actives.',
    vacioCta: 'Ofrecer mi primer paseo',
    // la voz honesta con la cuenta comercial no activa (jamás activar desde acá)
    cuentaNoActiva:
      'Puedes configurar ahora. Tus paseos se ofrecen a los clientes cuando el equipo active tu cuenta comercial.',
    // peldaño 1 — la lista de bloques
    bloquesTitulo: 'Tus paseos',
    agregarBloque: 'Ofrecer otra duración',
    // los bloques del menú canónico (voz funcional; nombre_custom la pisa)
    bloque30: 'Salida corta · 30 min',
    bloque60: 'Paseo · 1 hora',
    bloque120: 'Paseo largo · 2 horas',
    bloque180: 'Paseo de 3 horas',
    bloque240: 'Paseo de 4 horas',
    bloque300: 'Paseo de 5 horas',
    pausada: 'Pausado',
    // edición
    editarTitulo: 'Editar paseo',
    nuevoTitulo: 'Ofrecer un paseo',
    duracion: 'Duración',
    precio: 'Precio',
    precioAyuda: 'En dólares. Rige para reservas nuevas.',
    nombre: 'Nombre (opcional)',
    nombreAyuda: 'Como lo van a ver tus clientes.',
    descripcion: 'Descripción (opcional)',
    guardar: 'Guardar',
    crear: 'Ofrecer este paseo',
    pausar: 'Pausar',
    reactivar: 'Reactivar',
    guardado: 'Guardado.',
    creado: 'Tu paseo quedó configurado.',
    // errores con voz (espejo de los códigos del wrapper)
    precioInvalido: 'El precio tiene que ser mayor a cero.',
    bloqueDuplicado: 'Ya ofreces un paseo de esa duración.',
    // peldaño 2 — hueco declarado
    paquetesHueco: 'Paquetes y paseos recurrentes llegan más adelante.',
    // comisión visible donde se pone precio (S56-B TAREA 4, financiero v2.6
    // regla 7.15 — el % viene del dato, jamás hardcodeado)
    comisionRetiene: 'e-PetPlace retiene {{pct}}%',
    comisionNeto: 'e-PetPlace retiene {{pct}}% · vas a recibir {{neto}}',
    comisionNoDisponible: 'No pudimos leer la comisión vigente.',
    // precio del plan (S56-B ACTO 2, D-338 — ayuda aprobada por el arquitecto)
    precioPlan: 'Precio por salida en plan mensual (opcional)',
    precioPlanAyuda: 'Rige desde la próxima renovación. Los períodos en curso no cambian.',
    planVacio: 'Sin plan en este bloque: tus clientes no ven la opción de hacerlo frecuente.',
    planComparacion: 'Suelto {{suelto}} · plan {{plan}} por salida',
    precioPlanInvalido: 'El precio del plan tiene que ser mayor a cero. Déjalo vacío si no ofreces plan.',
  },
  // Vacaciones / bloqueos — S56-B TAREA 2 (D-341) · LOTE S56, GATE PENDIENTE
  vacaciones: {
    titulo: 'Vacaciones',
    error: 'No pudimos cargar tus días libres.',
    errorDetalle: 'Prueba de nuevo en un momento.',
    reintentar: 'Reintentar',
    // peldaño 0 — invitación que educa
    vacioTitulo: 'Tus días libres',
    vacioCuerpo:
      'Cuando te tomes unos días, márcalos acá. Mientras dure un bloqueo no apareces en las búsquedas ni recibes reservas nuevas — tus citas ya confirmadas siguen en pie.',
    vacioCta: 'Marcar mis primeros días',
    // la promesa — la cumple el motor (D-341, seis puertas)
    promesa:
      'Mientras dure un bloqueo no apareces en las búsquedas ni recibes reservas nuevas. Tus citas ya confirmadas siguen en pie.',
    sinMotivo: 'Días bloqueados',
    vigente: 'En curso — no apareces en las búsquedas.',
    quitar: 'Quitar',
    agregar: 'Marcar más días',
    // formulario
    nuevoTitulo: 'Marcar días libres',
    desde: 'Desde',
    duracion: 'Cuánto tiempo',
    unDia: '1 día',
    dias: '{{n}} días',
    unaSemana: '1 semana',
    dosSemanas: '2 semanas',
    tresSemanas: '3 semanas',
    unMes: '1 mes',
    hastaInclusive: 'Hasta el {{fecha}}, inclusive.',
    motivo: 'Motivo (opcional)',
    motivoAyuda: 'Para acordarte de qué era.',
    crear: 'Bloquear estos días',
    creado: 'Listo. Esos días no recibes reservas.',
    quitado: 'Bloqueo quitado.',
  },
  // LOTE S56 — GATE PENDIENTE del founder (junto con servicios.*).
  horarios: {
    titulo: 'Horarios',
    error: 'No pudimos cargar tus horarios.',
    errorDetalle: 'Prueba de nuevo en un momento.',
    reintentar: 'Reintentar',
    // peldaño 0 — invitación que educa
    vacioTitulo: 'Tus horarios de paseo',
    vacioCuerpo:
      'Di qué días y en qué franjas sales a pasear. Tus clientes solo pueden reservar dentro de ellas.',
    vacioCta: 'Agregar mi primera franja',
    agregarFranja: 'Agregar franja',
    // regla 32: 0=Domingo … 6=Sábado (la key ES el índice de DB)
    dia0: 'Domingo',
    dia1: 'Lunes',
    dia2: 'Martes',
    dia3: 'Miércoles',
    dia4: 'Jueves',
    dia5: 'Viernes',
    dia6: 'Sábado',
    // la fila de franja: el cupo es la voz humana, la hora es de máquina
    cupoUno: '1 paseo a la vez',
    cupoVarios: '{{cantidad}} paseos a la vez',
    pausada: 'Pausada',
    // formulario
    nuevaTitulo: 'Nueva franja',
    editarTitulo: 'Editar franja',
    dia: 'Día',
    diaElegir: 'Elige el día',
    desde: 'Desde',
    hasta: 'Hasta',
    horaElegir: 'Elige la hora',
    cupo: 'Paseos simultáneos',
    cupoAyuda: 'Cuántos paseos puedes atender a la vez en esta franja.',
    crear: 'Agregar franja',
    guardar: 'Guardar',
    pausar: 'Pausar',
    reactivar: 'Reactivar',
    quitar: 'Quitar franja',
    quitarConfirmacion: 'Tus clientes ya no van a poder reservar en esta franja.',
    quitarConfirmar: 'Sí, quitar',
    cancelar: 'Cancelar',
    creada: 'Franja agregada.',
    guardado: 'Guardado.',
    quitada: 'Franja quitada.',
    // errores con voz
    rangoInvalido: 'La hora de fin tiene que ser después de la de inicio.',
    solape: 'Esa franja se cruza con una que ya tienes ese día.',
  },
} as const;
