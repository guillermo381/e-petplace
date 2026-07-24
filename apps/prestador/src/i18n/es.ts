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
  // LA BIENVENIDA del prestador (S61-B8, letra founder) · LOTE S61, GATE PENDIENTE
  bienvenida: {
    paraPrestadores: 'para prestadores',
    // S61-B13: 'El oficio' → 'El arte' (letra founder)
    titular: 'El arte de cuidar, con las herramientas que merece.',
    subtitulo: 'Bienvenido al grupo curado de prestadores fundadores.',
    ingresar: 'Ingresar',
    solicitarAcceso: '¿Eres prestador nuevo? Solicitar acceso',
    selloIdentidad: 'Identidad verificada',
    selloPagos: 'Pagos protegidos',
    solicitarTitulo: 'Solicitar acceso',
    solicitarCuerpoTitulo: 'Un grupo que empieza curado.',
    solicitarCuerpo:
      'Los prestadores fundadores entran por invitación del equipo de e-PetPlace. Cuando abramos solicitudes, este va a ser el lugar.',
    // S61-B13: el canal de contacto (dato founder, D-399) · LOTE S61
    escribenosWhatsApp: 'Escríbenos por WhatsApp',
    // S61-B14: literal founder refinado
    whatsappMensaje:
      'Hola, estoy interesado en prestar mis servicios de cuidado de mascotas a través de e-PetPlace. Vengo desde la app de prestadores.',
    whatsappFallback: 'WhatsApp no se pudo abrir. Escríbenos al {{numero}}.',
    volver: 'Volver',
  },
  sesion: {
    // El estado honesto del raíz (S51; auth real desde S54/D-290):
    // sin sesión aterriza en LA BIENVENIDA (S61-B8) — sinSesion queda
    // para la rama de error; el detalle y el CTA viejos murieron (Ley 37).
    sinSesion: 'No hay una sesión activa',
    // con sesión pero SIN negocio de prestador (D-290): jamás crash
    sinRol: 'Tu cuenta no tiene un negocio asociado',
    sinRolDetalle: 'Entraste como {{email}}. Esta app es para quienes ofrecen servicios en e-PetPlace — si es tu caso y no ves tu negocio, escríbenos.',
    // S75-B: el EMPLEADO ACTIVO esperando la puerta (rama inerte hoy, muere
    // cuando la puerta abra). Voz honesta L-139: dice lo que ES verdad (ya
    // sos parte) y lo que TODAVÍA no (el acceso al día a día), sin prometer.
    empleadoTitulo: 'Ya eres parte de {{negocio}}',
    empleadoDetalle:
      'Tu acceso al día a día del negocio todavía no está disponible en la app. Te avisamos cuando lo esté.',
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
  // S75-B1: EL HANDSHAKE — el invitado inactivo llega acá desde el raíz
  // (la sonda lo intercepta antes del "sin negocio"). Voz L-139: dice la
  // verdad verificable, jamás promete un acceso que la puerta niega. El
  // estado ACEPTADO reusa sesion.empleadoTitulo/Detalle (mismo mensaje).
  invitacion: {
    titulo: '{{negocio}} te sumó a su equipo',
    tituloSinNombre: 'Te sumaron a un equipo', // enmienda (b): nombre null
    // S75-B17: era 'Te invitaron como {{nombre}}' — el "como" se leía como
    // ROL (el founder: "Luos no es un rol"). {{nombre}} es el nombre que el
    // titular tipeó al invitar (dato de la fila, no interpolación rota); la
    // invitación v1 NO lleva rol (E4). Reescrito para que sea claramente un
    // NOMBRE, no un cargo.
    invitadoComo: 'Tu nombre en el equipo: {{nombre}}',
    entrar: 'Entrar al equipo',
    // rebotes del aceptador (clase ok:false), voz humana por código (Ley 3)
    errorYaActivado: 'Esta invitación ya no está disponible.',
    errorNoEsTuya: 'Esta invitación no es para tu cuenta.',
    errorGenerico: 'No pudimos confirmar tu ingreso. Prueba de nuevo.',
    errorCarga: 'No pudimos cargar tu invitación.',
    reintentar: 'Probar de nuevo',
  },
  agenda: {
    // S60-C2.2: la jornada ya no es solo paseos (grooming vivo) — la
    // voz genérica de la jornada, propuesta al gate · LOTE S60
    // S71-B1 — EL TECHO DE LA JORNADA. `saludo` ('Tu jornada de hoy')
    // MURIÓ con el literal genérico del hallazgo 2 (Ley 37). Voz: TUTEO
    // NEUTRO — 'terminas', jamás 'terminás' (el voseo es el desvío).
    saludoNombre: 'Hola, {{nombre}}',
    saludoSinNombre: 'Hola',
    datoQuedan: 'Te quedan {{n}} · terminas {{hora}}',
    datoQueda1: 'Te queda 1 · terminas {{hora}}',
    datoQuedanSinHora: 'Te quedan {{n}}',
    datoQueda1SinHora: 'Te queda 1',
    datoCompleta: 'Jornada completa.',
    datoPorCoordinar: 'Día atendido · {{n}} por coordinar',
    datoLibreConSemana: 'Hoy libre · {{n}} esta semana',
    datoSemana: '{{n}} citas esta semana',
    // El pie de revelar (candidato a diccionario 19.6): el número EN la
    // etiqueta — jamás un 'Ver más' mudo. Compartida por las dos secciones.
    verLasN: 'Ver las {{n}}',
    vacio: 'Hoy no tienes citas',
    vacioDetalle: 'Cuando una familia agende contigo, va a aparecer acá.',
    reintentar: 'Reintentar',
    // S59-B3 voz única del estado (MODELO_PASEO §7, misma palabra en toda
    // superficie — el pill de ui ya la porta) · LOTE S59, GATE PENDIENTE
    enCurso: 'En vivo',
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
    // S70-B1: el origen releído — el walk-in del mostrador lo dice en la
    // fila (reposo, jamás acento); la reserva in-app no marca · LOTE S70, GATE PENDIENTE
    origenMostrador: 'Mostrador',
    // S70-B2-v2: jornada V2 (Por coordinar · Ya atendidas · vacío v2b) · LOTE S70, GATE PENDIENTE
    vacioVerSemana: 'Ver tu semana',
    porCoordinarTitulo: 'Por coordinar',
    porCoordinarCta: 'Fijar fecha',
    porCoordinarLibre: 'Procedimiento',
    // S72-B pieza 3: la voz del procedimiento coordinado en la agenda —
    // «Ecografía» / «Ecografía +1» / «Procedimiento» (sin descripción).
    procGenerico: 'Procedimiento',
    procMasN: '{{base}} +{{n}}',
    yaAtendidas: 'Ya atendidas ({{n}})',
    acordeonOcultar: 'Ocultar',
    // la semana (D-317, S57-B1) · LOTE S57, GATE PENDIENTE
    vistaEtiqueta: 'Agenda',
    vistaHoy: 'Hoy',
    vistaSemana: 'Semana',
    // S61-B5: el filtro por oficio (solo con ≥2 oficios activos) · LOTE S61, GATE PENDIENTE
    filtroEtiqueta: 'Ver por servicio',
    filtroTodos: 'Todos',
    filtroPaseos: 'Paseos',
    filtroEstetica: 'Estética',
    filtroAdiestramiento: 'Adiestramiento',
    // S69-B: el cuarto oficio en el filtro del HOY · LOTE S69, GATE PENDIENTE
    filtroVeterinaria: 'Veterinaria',
    filtroVacio: 'Hoy no tienes citas de este servicio.',
    // LOTE S62 (D-385): la salida grupal — una fila, N mascotas
    salidaNombresDos: '{{a}} y {{b}}',
    salidaNombresVarios: '{{a}}, {{b}} y {{n}} más',
    salidaDe: 'salida de {{n}}',
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
    // S61-B12: el header CD de la portada (D-370) · LOTE S61, GATE PENDIENTE
    oficioAmbos: 'Paseos y estética',
    oficioPaseos: 'Paseos',
    oficioEstetica: 'Estética',
    fundador: 'Prestador fundador',
    hitoOferta: 'oferta activa',
    hitoAgenda: 'agenda {{n}} días',
    hitoDomicilio: 'a domicilio',
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
    // S60-B2 — la sección de la ENTIDAD en Tu perfil (P17 v1.1, visto
    // del arquitecto) · LOTE S60, GATE PENDIENTE. Reuso declarado:
    // ofertaPaseo.visibleTitulo/noVisibleTitulo (la voz 7.13 de las
    // portadas, misma key).
    negocioTitulo: 'Tu negocio',
    nombreComercialLabel: 'Nombre público',
    nombreComercialAyuda: 'Tu nombre público cambia junto con tu perfil público — llega pronto.',
    tipoLabel: 'Oficio',
    tipoPaseador: 'Paseador',
    tipoClinica: 'Clínica veterinaria',
    tipoGrooming: 'Grooming',
    sedeLabel: 'Tu sede',
    sedeAyuda: 'La sede operativa se cambia con el equipo de e-PetPlace.',
    sinCargar: 'Sin cargar',
    descripcionLabel: 'Descripción',
    descripcionAyuda: 'Lo que las familias leen de tu negocio.',
    contactoTitulo: 'Contacto del negocio',
    whatsappLabel: 'WhatsApp',
    emailContactoLabel: 'Email de contacto',
    sitioWebLabel: 'Sitio web',
    negocioGuardado: 'Listo — tu negocio quedó al día.',
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
    // S60-C2.1 ampliada: el porqué del CTA ausente en cita futura
    empiezaElDia: 'El paseo se empieza el día de la cita.',
    // A dónde ir — D-339 (S56-B TAREA 3) · LOTE S56, GATE PENDIENTE
    direccionTitulo: 'A dónde ir',
    // marca "parte del plan" (D-338, S56-B T7) · LOTE S56, GATE PENDIENTE
    parteDelPlan: 'Parte del plan de {{nombre}}',
    direccionAbrirMapa: 'Abrir en el mapa',
    direccionSinDato: 'Esta cita no tiene una dirección registrada.',
    direccionMapaError: 'No pudimos abrir el mapa.',
    // durante
    // S59-B3 voz única "En vivo" (§7): el título conserva el sustantivo,
    // la palabra del estado migra · LOTE S59, GATE PENDIENTE
    enCursoTitulo: 'Paseo en vivo',
    gpsIniciando: 'GPS iniciando',
    gpsActivo: 'GPS activo',
    gpsDetenido: 'GPS detenido',
    gpsSinPermiso: 'Sin permiso de ubicación',
    gpsNoDisponible: 'GPS no disponible',
    gpsError: 'GPS con error',
    // LOTE S62 (curas del track): los estados honestos nuevos
    gpsSinPermisoAjustes: 'Permiso de ubicación bloqueado',
    gpsAproximado: 'Ubicación aproximada',
    gpsSinSenal: 'GPS sin señal',
    unPunto: '1 punto',
    puntos: '{{n}} puntos',
    sinGpsExplicacion:
      'Necesitamos tu ubicación para registrar el recorrido que ve la familia. El paseo puede seguir igual — sin ruta, al terminar te pedimos contar qué pasó.',
    sinGpsAjustesExplicacion:
      'La app no tiene permiso de ubicación y el sistema ya no vuelve a preguntar. Actívalo en los ajustes del teléfono para registrar el recorrido.',
    gpsAproximadoExplicacion:
      'Tu teléfono está compartiendo la ubicación aproximada. El recorrido se registra, pero impreciso — para la ruta real, permite la ubicación precisa.',
    gpsSinSenalExplicacion:
      'El GPS todavía no entrega tu posición. Si estás bajo techo, suele llegar al salir al aire libre.',
    abrirAjustes: 'Abrir ajustes',
    pedirPrecision: 'Permitir precisa',
    trackPendienteRed:
      'Los últimos puntos del recorrido no se guardaron. Revisa tu conexión y toca Terminar de nuevo.',
    // LETRA FIRMADA founder S62 (voz honesta D-292: el motor es foreground)
    // S63-B: queda SOLO para el modo fallback 'pantalla' — con el permiso
    // "siempre" concedido la reemplaza trackEnBolsillo (D-292 vivo).
    trackPantallaEncendida: 'El recorrido se registra solo con la pantalla encendida.',
    trackEnBolsillo: 'El recorrido se registra aunque guardes el teléfono.',
    // D-292 (S63-B): la voz honesta ANTES del prompt nativo del "siempre" +
    // la notificación del servicio (Android la exige; es la voz del sistema).
    fondoHojaTitulo: 'El recorrido, con el teléfono guardado',
    fondoHojaExplicacion:
      'Si permites la ubicación "siempre", el recorrido se registra aunque guardes el teléfono en el bolsillo o la pantalla se apague. Se usa solo mientras dura un paseo y consume algo más de batería mientras caminas.',
    fondoHojaComo: 'En la pantalla del sistema, elige la opción "Permitir todo el tiempo".',
    fondoHojaPermitir: 'Permitir ubicación siempre',
    fondoHojaAhoraNo: 'Ahora no',
    fondoNotificacionTitulo: 'Paseo en curso',
    fondoNotificacionCuerpo: 'e-PetPlace registra el recorrido mientras dura el paseo.',
    probarDeNuevo: 'Probar de nuevo',
    parteDelPerro: 'Parte del perro',
    evidencia: 'Evidencia',
    fotosSufijo: '{{n}} fotos',
    parteRegistrado: 'Parte registrado',
    fotoNoSubio: 'La foto no se subió. Tócala para reintentar.',
    // S61-B10: la CAUSA en detalle (los errores dirigen, Ley 17.4;
    // 'revisa tu conexión' RESERVADO a red) · LOTE S61, GATE PENDIENTE
    fotoNoSubioRed: 'Revisa tu conexión e inténtalo de nuevo.',
    fotoNoSubioLectura: 'No se pudo leer la foto del dispositivo.',
    agregarNotaIncidencia: 'Agregar nota o incidencia',
    terminarPaseo: 'Terminar paseo',
    notaOIncidencia: 'Nota o incidencia',
    nota: 'Nota',
    incidencia: 'Incidencia',
    // LOTE S62 (migración clase-4 §15b.2): labels de grupo de la Hoja;
    // los chips de severidad pasan a voz corta (el label ya dice qué son)
    queRegistras: 'Qué registras',
    incidenciaTipo: 'Tipo de incidencia',
    severidad: 'Severidad',
    elegirIncidencia: 'Elige qué pasó del catálogo.',
    severidadMedia: 'Media',
    severidadAlta: 'Alta',
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
    // LOTE S62 (curas del track): el hueco del mapa deja de callar
    sinRutaNoRegistrada: 'El recorrido no se registró en este paseo.',
    sinRutaSoloPartida: 'Solo se registró el punto de partida — el recorrido no alcanzó a dibujarse.',
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
    // S74-B recepción v1: la ETAPA DESTILADA en voz (bautizo founder S51)
    etapaM1: 'Primeros meses',
    etapaM2: 'Creciendo',
    etapaM3: 'Adulto',
    etapaM4: 'Con cuidado especial',
    etapaM5: 'Años dorados',
    etapaError: 'No pudimos leer su etapa. Vuelve a entrar en un momento.',
    carnet: 'Carnet',
    unaVacuna: '1 vacuna registrada',
    vacunas: '{{n}} vacunas registradas',
    // S71: el historial con 0 atenciones habla (Ley 13) — rima con 'Primera vez'
    historialVacio: 'Va a ser tu primera atención con {{nombre}}.',
    carnetVacio: 'Sin vacunas registradas todavía.',
    historial: 'Tu historial con {{nombre}}',
    atencionCerrada: 'Paseo cerrado',
    // S59-B3 voz única "En vivo" (§7) · LOTE S59, GATE PENDIENTE
    atencionEnCurso: 'Paseo en vivo',
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
    // S58-B B1a (§15b.5): NEGOCIO COMO MUNDOS · LOTE S58, GATE PENDIENTE
    paseo: 'Paseo',
    mundoPaseoVacio: 'Ábrelo y arma tu oferta en el taller.',
    mundoGrooming: 'Grooming',
    // S59-B5: el mundo ABRIÓ — el coming-soon murió (Ley 37); el vacío
    // invita al taller (mismo patrón que el mundo Paseo) · LOTE S59
    mundoGroomingVacio: 'Ábrelo y arma tu oferta en el taller.',
    // S63-B: el mundo Adiestramiento
    mundoAdiestramiento: 'Adiestramiento',
    mundoAdiestramientoVacio: 'Configura tu oferta y tus programas.',
    mundoAdiestramientoDetalle: 'Sesión {{precio}} · {{n}} programas',
    // S68-B: el mundo Veterinaria · LOTE S68 · APROBADO founder 18-jul
    mundoVeterinaria: 'Veterinaria',
    mundoVeterinariaVacio: 'Abre tu consultorio: servicios, precios y horarios.',
    mundoVeterinariaDetalleUno: '1 servicio activo · desde {{precio}}',
    mundoVeterinariaDetalle: '{{n}} servicios activos · desde {{precio}}',
    // S56-B TAREA 2 (D-341) · LOTE S56, GATE PENDIENTE
    vacaciones: 'Vacaciones',
    vacacionesDetalle: 'Marca los días en que no paseas.',
    equipo: 'Equipo',
    equipoDetalle: 'Roles, invitaciones y tu firma',
    cobros: 'Cobros',
    cuentaComercial: 'Cuenta comercial',
    liquidaciones: 'Liquidaciones',
    // honesto en términos de hitos — JAMÁS "$0" (§2.6):
    liquidacionesDetalle: 'Se despierta cuando empieces a cobrar por la app.',
    // S70-B2-v2: entrada a "El movimiento" (presupuestos del negocio, D-440)
    movimiento: 'El movimiento',
    movimientoDetalle: 'Los presupuestos que armaste y en qué quedaron.',
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
    // S72-B: la cola de cobro nombra el oficio — el vet reconoce su trabajo.
    servicioGrooming: 'Grooming',
    servicioAdiestramiento: 'Adiestramiento',
    servicioVeterinaria: 'Veterinaria',
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
  // Voces del oficio que EL TALLER hereda (S58-B B1b: /servicios murió
  // absorbida; sus keys muertas murieron con ella — Ley 37; los TEXTOS
  // que siguen acá son los de los lotes S56/S57, sin cambios).
  servicios: {
    // la voz honesta con la cuenta comercial no activa (jamás activar desde acá)
    cuentaNoActiva:
      'Puedes configurar ahora. Tus paseos se ofrecen a los clientes cuando el equipo active tu cuenta comercial.',
    // los bloques del menú canónico (voz funcional; nombre_custom la pisa)
    bloque30: 'Salida corta · 30 min',
    bloque60: 'Paseo · 1 hora',
    bloque120: 'Paseo largo · 2 horas',
    bloque180: 'Paseo de 3 horas',
    bloque240: 'Paseo de 4 horas',
    bloque300: 'Paseo de 5 horas',
    pausada: 'Pausado',
    precio: 'Precio',
    precioAyuda: 'En dólares. Rige para reservas nuevas.',
    // nombre/descripcion MURIERON de la UI (v3, L-144: el motor los sirve
    // por COALESCE; su edición muda al perfil del prestador — deuda)
    precioInvalido: 'El precio tiene que ser mayor a cero.',
    // comisión visible donde se pone precio (S56-B TAREA 4, financiero v2.6
    // regla 7.15 — el % viene del dato, jamás hardcodeado)
    // v3.2: plan y paquete son INTERRUPTOR+slider — las voces de campos
    // de texto murieron (Ley 37); las ayudas de vigencia sobreviven
    precioPlanAyuda: 'Rige desde la próxima renovación. Los períodos en curso no cambian.',
    paqueteExplica: 'Tus clientes compran 5, 10 o 15 salidas de este bloque por adelantado. Tú pones un solo precio por salida.',
    precioPaqueteAyuda: 'Rige para los paquetes que se compren desde ahora. Los ya comprados no cambian.',
  },
  // EL ARTE DEL PASEO — el taller (S58-B B1b, adenda founder) · LOTE S58, GATE PENDIENTE
  taller: {
    titulo: 'El arte del paseo',
    error: 'No pudimos cargar tu oferta.',
    errorDetalle: 'Prueba de nuevo en un momento.',
    reintentar: 'Reintentar',
    duracionesTitulo: 'Duraciones y precios',
    // S59-B1 cura de copy (texto EXACTO del founder) · LOTE S59, GATE PENDIENTE
    duracionesIntro: 'Elige las duraciones que ofreces y ponles precio por salida.',
    // etiquetas cortas del menú canónico (la voz larga sigue en servicios.bloque*)
    d30: '30 min',
    d60: '1 hora',
    d120: '2 horas',
    d180: '3 horas',
    d240: '4 horas',
    d300: '5 horas',
    seOfreceAlGuardar: 'Se ofrece cuando guardes.',
    ofrecer: 'Ofrecer esta duración',
    sinDuraciones: 'Aún no ofreces ninguna duración.',
    agregarDuracion: 'Ofrecer otra duración',
    // v3.2: plan y paquete por interruptor (el contrato POR SALIDA intacto)
    planInterruptor: 'Ofrecer plan mensual',
    // corrección founder S58: el plan se dice EN MENSUAL; el contrato
    // sigue por salida (7.14) — la equivalencia se declara abajo
    planRotulo: 'Lo que tu cliente paga al mes',
    planEquivale: 'Mes típico de 4 salidas · {{salida}} por salida',
    paqueteInterruptor: 'Ofrecer paquete de salidas',
    paqueteRotulo: 'Precio de cada salida al comprar paquete',
    // el wizard (v3): progreso sereno
    paso: 'Paso {{n}} de 3',
    continuar: 'Continuar',
    horariosTitulo: 'Días y horarios',
    horariosExplica: 'Marca los días y agrega la franja: aplica a todos los marcados.',
    dias: 'Días',
    // regla 32: la key ES el índice de DB (0=Domingo)
    diaCorto0: 'D',
    diaCorto1: 'L',
    diaCorto2: 'M',
    diaCorto3: 'X',
    diaCorto4: 'J',
    diaCorto5: 'V',
    diaCorto6: 'S',
    todaLaSemana: 'Toda la semana',
    diasAplica: 'Se aplica a: {{dias}}',
    // ('agregá' del mandato viajó a tuteo neutro, regla 27 — desvío
    // declarado, precedente S57): el vacío tiene CAMINO
    sinFranjas: 'Sin franjas todavía: agrega una.',
    franjaNueva: 'Se agrega cuando guardes.',
    agregarFranjaListo: 'Agregar franja',
    // zonas de cobertura (contrato D-331 v1: declara, no filtra;
    // Ley 22: chips tonales multi-selección del catálogo)
    zonasTitulo: 'Zonas de cobertura',
    zonasExplica: 'Las ciudades donde trabajas. Ayudan a las familias a encontrarte.',
    otraCiudad: 'Otra ciudad',
    ciudadFaltante: 'Si tu ciudad no está, escríbenos: el catálogo lo carga el equipo.',
    listo: 'Listo',
    // S59-B6 cura 3(a): la sección de horarios DECLARA la agenda única
    // (la verdad del motor) · LOTE S59, GATE PENDIENTE
    guardar: 'Guardar tu oferta',
    guardado: 'Tu oferta quedó guardada.',
  },
  // EL ARTE DEL GROOMING — el taller del mundo (S59-B5, MODELO_GROOMING v1.0) · LOTE S59, GATE PENDIENTE
  tallerGrooming: {
    titulo: 'El arte del grooming',
    paso: 'Paso {{n}} de 2',
    serviciosTitulo: 'Servicios y precios',
    serviciosIntro: 'Enciende los servicios que ofreces y ponles precio por talla.',
    especies: '¿A quién atiendes?',
    especiePerro: 'Perros',
    especieGato: 'Gatos',
    especiesMinima: 'Elige al menos una especie.',
    servicioBano: 'Baño',
    servicioBanoCorte: 'Baño y corte',
    ofrecerServicio: 'Ofrecer este servicio',
    talla: 'Talla',
    tallaS: 'Pequeña',
    tallaM: 'Mediana',
    tallaL: 'Grande',
    // la voz corta del espejo (S/M/L de DB se DICE P·M·G en español)
    tallaCortaS: 'P',
    tallaCortaM: 'M',
    tallaCortaL: 'G',
    duracion: 'Duración',
    duracionAyuda: 'Cuánto ocupa tu agenda esa combinación.',
    minutos: '{{n}} min',
    extraInterruptor: 'Cobrar extra por pelaje largo',
    extraRotulo: 'El extra que se suma al precio',
    extraAyuda: 'Se suma una vez por cita. El precio base no cambia.',
    // S61-B2 — DOMICILIO: la config del Dónde (letra founder S61) · LOTE S61, GATE PENDIENTE
    atiendesLocal: 'Atiendes en tu local',
    atiendesDomicilio: 'Atiendes a domicilio',
    dondeMinimo: 'Enciende al menos una: tu local o a domicilio.',
    dondeZonasDetalle: 'Compartidas con todos tus servicios.',
    recargoInterruptor: 'Cobrar recargo por domicilio',
    recargoRotulo: 'El recargo que se suma al precio',
    recargoAyuda: 'Se suma una vez por cita a domicilio. La base y la duración no cambian; el traslado no se cobra aparte.',
    // S59-B6 cura 2 (gate founder): la voz del cupo ES del oficio —
    // 'Paseos simultáneos' era voz prestada · LOTE S59, GATE PENDIENTE
    cupo: 'Mascotas a la vez',
    cupoAyuda: 'Cuántas mascotas puedes atender a la vez en esta franja.',
    cupoUno: '1 mascota a la vez',
    cupoVarios: '{{cantidad}} mascotas a la vez',
  },
  // TU OFERTA DE GROOMING — el resumen, la portada del mundo (S59-B5) · LOTE S59, GATE PENDIENTE
  ofertaGrooming: {
    titulo: 'Tu oferta de grooming',
    vacioTitulo: 'Tu servicio de grooming',
    vacioCuerpo: 'En dos pasos eliges servicios, precios por talla y horarios. Tus clientes solo ven lo que tú actives.',
    vacioCta: 'Configurar tu oficio',
    visibleTitulo: 'Visible para las familias',
    visibleVoz: 'Las familias te encuentran y pueden reservar.',
    noVisibleTitulo: 'Todavía no visible',
    noVisibleCuenta: 'Falta que el equipo active tu cuenta comercial.',
    noVisibleServicios: 'Activa al menos un servicio en el taller.',
    noVisibleHorarios: 'Agrega tus días y horarios en el taller.',
    editarOferta: 'Editar tu oferta',
    servicios: 'Servicios y precios',
    serviciosDetalle: '{{lista}} · desde {{precio}}',
    serviciosPausados: 'Todos pausados',
    sufijoExtra: 'con extra por pelaje largo',
    // S59-B6 cura 4: la fila 'A quién atiendes' MURIÓ fusionada (v3.2,
    // mismo destino que Plan y paquete) — su verdad vive en el subtítulo
    // VIVO de Servicios y precios · LOTE S59, GATE PENDIENTE
    sufijoEspeciesAmbas: 'perros y gatos',
    sufijoEspeciesPerro: 'solo perros',
    sufijoEspeciesGato: 'solo gatos',
    // el DÓNDE v1 es fila informativa (gate del mapa, enmienda 1):
    // local declarado + la puerta honesta de SU servicio
    // S61-B2: la fila informativa ASCENDIÓ a fila-lápiz (domicilio vivo);
    // murió 'llega pronto' (Ley 37) · dondeDomicilioVivo al LOTE S61
    dondeFila: 'Dónde atiendes',
    dondeLocal: 'En tu local',
    dondeDomicilioVivo: 'A domicilio',
    // el espejo dice los 6 precios + extra + duraciones
    espejoServicio: '{{nombre}} · {{tallas}}',
    espejoDuraciones: '{{lista}} min según talla',
    espejoExtra: 'Pelaje largo: +{{monto}}',
    // S61-B6: el dueño YA reserva domicilio (D-392) · LOTE S61, GATE PENDIENTE
    espejoDomicilio: 'A domicilio: +{{monto}}',
  },
  // LA ATENCIÓN DE GROOMING — Antes/Durante/Después (S60-B1, §8 del
  // modelo) · LOTE S60, GATE PENDIENTE. Reusos declarados: cita.nota/
  // incidencia/mensajeFamilia/enviarParte (voz genérica de atención,
  // Ley 17.3) + agenda.conocerMascota + tallerGrooming.talla*.
  citaGrooming: {
    // el Antes — la ficha de 30 segundos
    tituloDe: 'Grooming de {{nombre}}',
    titulo: 'Grooming',
    empezar: 'Empezar grooming',
    talla: 'Talla',
    tallaSinDeclarar: 'Sin declarar',
    pelaje: 'Pelaje',
    pelajeNormal: 'Normal',
    pelajeLargo: 'Largo',
    // señales: REUSO detalleMascota.* (misma voz en toda la casa, Ley 17.3)
    // S61-B7: el momento vital como señal DEL OFICIO · LOTE S61, GATE PENDIENTE
    momentoCachorro: 'Cachorro',
    momentoGatito: 'Gatito',
    momentoSenior: 'Senior',
    // S60-C2.1: la cita de otro día se prepara, no se empieza — el
    // porqué del CTA ausente (apagado jamás es mudo)
    empiezaElDia: 'La sesión se empieza el día de la cita.',
    // discrepancia de talla (§2, patrón P19)
    tallaCorregir: 'La talla no coincide',
    tallaCorregirTitulo: 'La talla real',
    tallaCorregirExplicacion:
      'Si la talla declarada no es la real, regístralo: el perfil queda corregido para las próximas reservas. Esta cita no cambia de precio.',
    tallaCorregirCta: 'Corregir el perfil',
    tallaCorregida: 'Perfil corregido para las próximas.',
    // el Durante
    enCursoTitulo: 'Grooming en vivo',
    alRecibir: 'Al recibir',
    alEntregar: 'Al entregar',
    estadoPelajeElegir: 'Registrar estado del pelaje',
    fotoRecibir: 'Foto al recibir',
    fotoEntregar: 'Foto de entrega',
    fotoEntregarAyuda: 'Se toma con la mascota presente — la necesitas para terminar.',
    serviciosAplicados: 'Servicios aplicados',
    fotosSesion: 'Fotos de la sesión',
    quitar: 'Quitar',
    terminar: 'Terminar sesión',
    terminarTitulo: 'Terminar la sesión',
    terminarExplicacion:
      'El tiempo queda registrado. Después completas el cierre y el mensaje a la familia.',
    // guard de UI: el motor no permite registrar servicios después de
    // terminar — sin esto, el cierre queda en un callejón (§8)
    terminarFaltaServicio: 'Marca al menos un servicio aplicado antes de terminar — el cierre lo necesita.',
    seguirTrabajando: 'Seguir trabajando',
    // el Después — cierre con piso de calidad
    cierreTitulo: 'Cierre del grooming',
    tiempoTrabajo: 'Tiempo de trabajo',
    minutosSufijo: '{{n}} min',
    recibiste: 'Recibiste',
    entregaste: 'Entregaste',
    notasTitulo: 'Notas',
    incidenciasTitulo: 'Incidencias',
    fotosSufijo: '{{n}} fotos',
    cerradoMono: 'parte enviado',
    verTuDia: 'Ver tu día',
    // S61-B3.0 — las piezas S60-A3 cableadas · LOTE S61, GATE PENDIENTE
    // reparación de servicios en el cierre (pieza 2)
    servicioAgregar: 'Agregar servicio',
    // la fecha sugerida §8 (pieza 1): fecha, jamás cita
    proximaSesion: 'Próxima sesión',
    proximaSesionAyuda: 'Una fecha sugerida para la familia — no toca tu agenda.',
    proximaSesionSugerir: 'Sugerir fecha',
    proximaSesionEnSemanas: 'En {{n}} semanas',
    proximaSesionQuitar: 'Sin sugerencia',
    // la vista del día (RPC del oficio)
    diaTitulo: 'Tu día de grooming',
    diaSesiones: 'Sesiones',
    diaCerradas: 'Cerradas con parte',
    diaPorCerrar: 'Por cerrar',
    diaTiempo: 'Tiempo de trabajo',
    diaVacio: 'Todavía no terminaste sesiones hoy.',
    // errores con camino (la voz fina del motor vive en el wrapper)
    noDisponible: 'Esta cita ya no está disponible',
    noDisponibleDetalle: 'Puede haberse movido o cancelado. Vuelve a tu día para ver tus citas.',
    volverHoy: 'Volver a tu día',
  },
  // TU OFERTA DE PASEO — el resumen, la portada del mundo (S58-B B1b) · LOTE S58, GATE PENDIENTE
  ofertaPaseo: {
    titulo: 'Tu oferta de paseo',
    error: 'No pudimos cargar tu oferta.',
    errorDetalle: 'Prueba de nuevo en un momento.',
    reintentar: 'Reintentar',
    // peldaño 0 — la invitación que educa: el taller es el camino
    vacioTitulo: 'Tu servicio de paseo',
    vacioCuerpo: 'En tres pasos eliges duraciones, precios, horarios y zonas. Tus clientes solo ven lo que tú actives.',
    vacioCta: 'Configurar tu oficio',
    // el estado — la verdad del motor (7.13), con camino cuando falta algo
    visibleTitulo: 'Visible para las familias',
    visibleVoz: 'Las familias te encuentran y pueden reservar.',
    noVisibleTitulo: 'Todavía no visible',
    noVisibleCuenta: 'Falta que el equipo active tu cuenta comercial.',
    noVisibleDuraciones: 'Activa al menos una duración en el taller.',
    noVisibleHorarios: 'Agrega tus días y horarios en el taller.',
    // una fila por sección
    duraciones: 'Duraciones y precios',
    duracionesDetalle: '{{n}} duraciones · desde {{precio}}',
    duracionesDetalleUna: '1 duración · desde {{precio}}',
    duracionesPausadas: 'Todas pausadas',
    // el espejo usa las voces largas; el subtítulo vivo de Duraciones,
    // los sufijos (v3.2 — la fila Plan y paquete MURIÓ)
    conPlanYPaquete: 'Con plan mensual y paquete de salidas',
    conPlan: 'Con plan mensual',
    conPaquete: 'Con paquete de salidas',
    sufijoConPlanYPaquete: 'con plan y paquete',
    sufijoConPlan: 'con plan',
    sufijoConPaquete: 'con paquete',
    horarios: 'Días y horarios',
    diaUno: '1 día',
    dias: '{{n}} días',
    franjaUna: '1 franja',
    franjas: '{{n}} franjas',
    sinHorarios: 'Sin horarios',
    zonasSin: 'Sin ciudades declaradas',
    vacacionesSin: 'Sin días bloqueados',
    vacacionesCon: 'Tienes días bloqueados',
    editarOferta: 'Editar tu oferta',
    // solo __DEV__ — jamás viaja a preview/producción
    devWizard: 'Recorrer el wizard (dev)',
    // el espejo — la misma composición en taller (borrador) y resumen (DB)
    espejoTitulo: 'Así lo ve el dueño',
    espejoNada: 'Todavía no apareces en las búsquedas.',
    espejoDuraciones: 'Paseos de {{lista}} · desde {{precio}}',
    espejoDias: 'Recibes reservas: {{lista}}.',
    espejoSinDias: 'Sin días de paseo: aún no apareces en las búsquedas.',
    espejoY: 'y',
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
  // Voces de las franjas que EL TALLER hereda (S58-B B1b: /horarios murió
  // absorbida; keys muertas fuera — Ley 37; textos de los lotes S56 intactos).
  horarios: {
    // LOTE S62 (D-386): la elección de organización de la agenda
    modoEtiqueta: 'Cómo organizas tu agenda',
    modoUniversal: 'Una agenda para todo',
    modoPorServicio: 'Por servicio',
    modoExplicaUniversal: 'Tus franjas valen para todos tus servicios.',
    modoExplicaPorServicio: 'Cada servicio tiene sus propias franjas.',
    modoCambiarTitulo: 'Cambiar la organización',
    // S68-B8 (firma founder sobre el hallazgo del gate): la IDA es
    // CONVERSIÓN con voz (nada se borra); la VUELTA es destructiva y lo
    // dice entero. modoCambiarConFranjas murió (Ley 37) · LOTE S68 · APROBADO founder 18-jul
    convertirTitulo: 'Convertir tu agenda',
    convertirVoz:
      'Tus franjas generales pasarán a vivir en cada servicio — no se borra nada. Desde ahí ajustas cada servicio por separado.',
    convertirCta: 'Convertir',
    convertido: 'Listo: tus franjas ahora viven en cada servicio.',
    volverVoz:
      'Volver al horario general borrará las franjas específicas de cada servicio. Tendrás que declarar tu horario de nuevo.',
    modoBorradorAviso: 'Tienes cambios sin guardar en este taller — guárdalos antes o se perderán.',
    ofertasAplicaUniversal:
      'Con algunos servicios desmarcados, la franja pasa a ser específica — tu agenda se convierte a "por servicio".',
    modoCambiarConfirmar: 'Eliminar franjas y cambiar',
    modoCambiado: 'Tu agenda cambió de organización.',
    ofertasAplica: 'Para qué servicios',
    ofertasNinguna: 'Marca al menos un servicio para la franja.',
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
    nuevaTitulo: 'Nueva franja',
    desde: 'Desde',
    hasta: 'Hasta',
    horaElegir: 'Elige la hora',
    cupo: 'Paseos simultáneos',
    cupoAyuda: 'Cuántos paseos puedes atender a la vez en esta franja.',
    pausar: 'Pausar',
    reactivar: 'Reactivar',
    quitar: 'Quitar franja',
    quitarConfirmacion: 'Tus clientes ya no van a poder reservar en esta franja.',
    quitarConfirmar: 'Sí, quitar',
    cancelar: 'Cancelar',
    solape: 'Esa franja se cruza con una que ya tienes ese día.',
  },
  // S63-B: clips de la sesión de adiestramiento (MODELO_ADIESTRAMIENTO
  // §5/§12.3 — techo 15-30s ×3; cola local hasta el bucket de la A).
  clips: {
    titulo: 'Clips de la sesión',
    explica:
      'Graba momentos cortos del progreso — un "sentado" logrado se ve mejor en movimiento. Cada clip va de {{min}} a {{max}} segundos, hasta {{techo}} por sesión.',
    grabarClip: 'Grabar clip',
    empezarAGrabar: 'Empezar a grabar',
    detener: 'Detener',
    cancelar: 'Cancelar',
    revisarTitulo: 'Revisar clip',
    usarClip: 'Usar clip',
    descartar: 'Descartar',
    descartarYRepetir: 'Descartar y repetir',
    repetir: 'Grabar de nuevo',
    quitarClip: 'Quitar clip',
    quedoCorto: 'Quedó corto: los clips van de 15 a 30 segundos. Graba uno nuevo con calma.',
    clipN: 'Clip {{n}}',
    techoAlcanzado: 'Ya registraste los {{techo}} clips de esta sesión.',
    // Tanda corta S63-B (cola conectada): la voz habla SOLO por los
    // clips sin registrar — el stub murió.
    envioPendiente: 'Los clips sin enviar quedan solo en este teléfono — no llegan al parte de la familia.',
    enviando: 'Enviando…',
    enElParte: 'En el parte de la familia',
    noSeEnvio: 'No se envió. Tócalo para reintentar.',
    enEsteTelefono: 'En este teléfono',
    reintentarEnvio: 'Reintentar envío',
    sinPermiso: 'Necesitamos la cámara y el micrófono para grabar el clip — las órdenes que da tu voz son parte del progreso.',
    abrirAjustes: 'Abrir ajustes',
    probarDeNuevo: 'Probar de nuevo',
  },
  // S63-B (Bloque 3 parcial): la ficha del Antes de adiestramiento (§5).
  adiestramiento: {
    titulo: 'Ficha de la sesión',
    tituloDe: 'Ficha de {{nombre}}',
    momentoCachorro: 'Cachorro',
    momentoSenior: 'Años dorados',
    senalesTitulo: 'Cómo se comporta en sus paseos',
    senalesVacio: 'Sus paseos no registran señales de comportamiento todavía.',
    senalesOrigen: 'Lo registraron los paseadores durante paseos reales.',
    programasTitulo: 'Programas contigo',
    programasVacio: 'Todavía no hizo programas contigo.',
    programaSesiones: '{{n}} sesiones',
    bitacoraTitulo: 'La bitácora de la familia',
    bitacoraVacia: 'La familia todavía no escribió en la bitácora. Lo que practiquen entre sesiones aparece acá.',
  },
  // S63-B (Bloque 3 experiencia): la atención de adiestramiento.
  citaAdiestramiento: {
    titulo: 'Sesión de adiestramiento',
    tituloDe: 'Sesión con {{nombre}}',
    enCursoTitulo: 'Sesión en curso',
    cierreTitulo: 'El parte de la sesión',
    sesionKN: 'Sesión {{k}} de {{n}}',
    empezar: 'Empezar la sesión',
    empiezaElDia: 'La sesión se empieza el día de la cita.',
    verFicha: 'Ficha de {{nombre}}',
    verFichaDetalle: 'Señales, condiciones y programas',
    noDisponible: 'Esta sesión no está disponible.',
    noDisponibleDetalle: 'Puede haberse movido o cancelado. Revisa tu jornada.',
    volverHoy: 'Volver a Hoy',
    objetivosTitulo: 'Objetivos de la sesión',
    objetivosSugeridos: 'Sugeridos del nivel',
    objetivosTodos: 'Todo el vocabulario',
    trabajado: 'Trabajado',
    alcanzado: 'Alcanzado',
    registroTitulo: 'Nota y clips',
    notasN: '{{n}} notas',
    unaNota: '1 nota',
    clipsN: '{{n}} clips',
    unClip: '1 clip',
    agregarNota: 'Agregar nota conductual',
    notaTitulo: 'Nota conductual',
    notaPlaceholder: '¿Cómo respondió? ¿Qué le cuesta todavía?',
    guardarNota: 'Guardar nota',
    notaGuardada: 'Nota guardada',
    clipsCelda: 'Clips de la sesión',
    clipsDetalle: 'El progreso se ve mejor en movimiento',
    clipsDetalleN: '{{n}} de 3',
    terminar: 'Terminar sesión',
    terminarTitulo: '¿Terminar la sesión?',
    terminarExplicacion: 'Después de terminar armas el parte para la familia.',
    seguir: 'Seguir en la sesión',
    seguirRegistrando: 'Seguir registrando',
    pisoTitulo: 'Antes de terminar, al parte le falta:',
    pisoFaltaObjetivo: 'Al menos un objetivo trabajado.',
    pisoFaltaNotaClip: 'Al menos una nota conductual o un clip.',
    pisoClipsLocales: 'Hay clips sin enviar — un clip enviado o una nota conductual completan el parte.',
    resumenTitulo: 'Lo que registraste',
    yaCerrada: 'Esta sesión ya está cerrada. El parte quedó con la familia.',
    mensajeFamilia: 'Mensaje a la familia',
    mensajePlaceholder: 'Cómo estuvo hoy, qué te sorprendió…',
    instrucciones: 'Instrucciones para la familia',
    instruccionesPlaceholder: 'Qué practicar entre sesiones, cómo y cuánto.',
    instruccionesExplica: 'Toca un objetivo para sumar una práctica sugerida — el texto queda tuyo, edítalo libre.',
    plantillaPractica: 'Practiquen "{{objetivo}}" en sesiones cortas de 5 minutos, dos veces al día.',
    cerrarCta: 'Enviar parte y cerrar',
    cerrado: 'Sesión cerrada. El parte quedó con la familia.',
  },
  // S63-B: el taller del adiestrador (especies bloqueante + programas).
  // LA PORTADA DEL MUNDO ADIESTRAMIENTO — /adiestramiento (S65-B2 P1,
  // hallazgo founder: el oficio entraba directo al taller). Espejo del
  // patrón paseo/grooming; reusos declarados (Ley 17.3):
  // ofertaPaseo.error/errorDetalle/reintentar/vacacionesCon/vacacionesSin
  // + negocio.vacaciones · LOTE S65, GATE PENDIENTE
  ofertaAdiestramiento: {
    titulo: 'Tu oferta de adiestramiento',
    // peldaño 0 — la invitación que educa: qué se vende (§1 del modelo)
    vacioTitulo: 'Tu servicio de adiestramiento',
    vacioCuerpo:
      'Vendes dos cosas: la sesión suelta y tus programas de varias sesiones con precio propio. Tus clientes solo ven lo que tú actives.',
    vacioCta: 'Configurar tu oficio',
    visibleTitulo: 'Visible para las familias',
    visibleVoz: 'Las familias te encuentran y pueden reservar.',
    noVisibleTitulo: 'Todavía no visible',
    noVisibleCuenta: 'Falta que el equipo active tu cuenta comercial.',
    noVisibleOferta: 'Activa tu sesión suelta en el taller.',
    noVisibleEspecies: 'Declara con quién trabajas en el taller.',
    noVisibleHorarios: 'Aún no tienes días y horarios de atención declarados.',
    editarOferta: 'Editar tu oferta',
    sesionFila: 'La sesión suelta',
    sesionPausada: 'Pausada',
    programasFila: 'Tus programas',
    programasUno: '1 programa activo',
    programasN: '{{n}} programas activos',
    programasSin: 'Todavía sin programas',
  },
  tallerAdiestramiento: {
    titulo: 'Adiestramiento',
    especiesTitulo: 'Con quién trabajas',
    especiesExplica:
      'Declara las especies con las que trabajas. Sin esta declaración, tu oferta no aparece en las búsquedas de las familias.',
    especiesTecho: 'Hoy la plataforma abre el adiestramiento solo para perros.',
    especiePerro: 'Perros',
    especiesFalta: 'Falta declarar con quién trabajas — la oferta no se publica sin esto.',
    ofertaTitulo: 'La sesión suelta',
    ofrecer: 'Ofrecer adiestramiento',
    precioSesion: 'Precio de la sesión',
    duracionSesion: 'Duración de la sesión',
    guardar: 'Guardar oferta',
    guardado: 'Oferta guardada',
    programasTitulo: 'Tus programas',
    programasExplica: 'Un programa es una serie de sesiones con contenido progresivo y precio propio.',
    programasEsperanOferta: 'Guarda tu oferta para poder agregar programas.',
    // S65-B2 P2: las tarjetas fijas de la escalera troncal (§1/§4/§12.4)
    // + Personalizado = la puerta a las especialidades (supuesto
    // declarado al founder) · LOTE S65, GATE PENDIENTE. Murieron
    // agregarPrograma/programaTituloNuevo/nivel (regla 37).
    programaTituloEditar: 'Editar programa',
    nivelBasico: 'Básico',
    nivelMedio: 'Medio',
    nivelExperto: 'Experto',
    nivelEspecialidad: 'Especialidad',
    rangoSugerido: 'Sugerido para este nivel: {{min}} a {{max}} sesiones.',
    nombrePrograma: 'Nombre del programa',
    nombrePlaceholder: 'Obediencia desde cero',
    sesiones: 'Sesiones',
    sesionesN: '{{n}} sesiones',
    precioPrograma: 'Precio del programa',
    vigencia: 'Vigencia',
    vigenciaSemanas: '{{n}} semanas',
    vigenciaExplica: 'La familia tiene este plazo desde la compra para completar las sesiones.',
    programaActivo: 'Programa visible',
    programaOculto: 'Oculto',
    guardarPrograma: 'Guardar programa',
    programaGuardado: 'Programa guardado',
    // los nombres con que nacen los programas de las tarjetas fijas
    // (lo que ve la familia en el QUIÉN)
    nombreBasico: 'Programa básico',
    nombreMedio: 'Programa medio',
    nombreExperto: 'Programa experto',
    descripcionPrograma: 'Qué incluye',
    descripcionPlaceholder: 'Sentado, quieto, venir al llamado…',
    condiciones: 'Vigencia de {{semanas}} semanas · sesiones de {{min}} min',
    personalizadoTitulo: 'Personalizado',
    personalizadoExplica:
      'Un programa a tu medida — una especialidad: ansiedad, correa, trucos. Tú pones el nombre y el contenido.',
    personalizadoCrear: 'Crear programa personalizado',
    personalizadoNuevo: 'Programa personalizado',
    // S68-B (D-426): la sección de horarios entra al taller · LOTE S68 · APROBADO founder 18-jul
    horariosOferta: 'Sesión de adiestramiento',
    guardarHorarios: 'Guardar horarios',
  },
  // ══ S68-B: EL MUNDO VETERINARIA · LOTE S68 · APROBADO founder 18-jul ══
  tallerVeterinaria: {
    titulo: 'Tu consultorio',
    paso: 'Paso {{n}} de 2',
    serviciosTitulo: 'Servicios y precios',
    serviciosIntro: 'Prende lo que ofreces. Cada servicio queda con su duración, su precio y su horario.',
    ofrecerServicio: 'Ofrecer',
    // el menú del oficio (orden firmado S68)
    itemCitaRegular: 'Cita regular',
    itemVacunacion: 'Vacunación',
    itemEspecializada: 'Cita especializada',
    itemUrgenciaLocal: 'Urgencia en local',
    itemUrgenciaDomicilio: 'Urgencia a domicilio',
    itemTelemedicina: 'Telemedicina',
    // la voz honesta OBLIGATORIA de la telemedicina (letra del pedido
    // S68, VERBATIM)
    telemedicinaHonesta: 'Configúrala ahora — las familias la verán cuando la videollamada esté lista.',
    duracion: 'Duración',
    duracionAyuda: 'Cuánto ocupa en tu agenda.',
    minutos: '{{n}} min',
    horario: 'Horario',
    horarioGeneral: 'Usa tu horario general',
    horarioPropiaUna: '1 franja propia',
    horarioPropio: '{{n}} franjas propias',
    especialidades: 'Especialidades',
    especialidadOtra: 'Otra',
    otraTitulo: 'Otra especialidad',
    otraPlaceholder: 'Etología clínica',
    otraAgregar: 'Agregar',
    pendienteCatalogo: 'Deja lista tu configuración — se activa cuando el catálogo del oficio quede listo.',
    // S68-B7: con ?item= las demás tarjetas nacen plegadas — este es su
    // camino de un toque
    desplegar: 'Ajustar',
    // S68-B9 (firma founder del choque 2): menú curado + Otra duración
    otraDuracion: 'Otra duración',
    otraDuracionAyuda: 'En pasos de 5 minutos — de 10 a 240.',
    otraDuracionUsar: 'Usar esta duración',
  },
  veterinaria: {
    titulo: 'Veterinaria',
    vacioTitulo: 'Abre tu consultorio',
    vacioCuerpo: 'Prende tus servicios, ponles precio y horario. Las familias reservan cuando el oficio abra.',
    vacioCta: 'Configurar tu consultorio',
    editarOferta: 'Editar tu consultorio',
    serviciosTitulo: 'Tus servicios',
    sinServicios: 'Todavía no prendes ningún servicio. Entra al taller para armar tu oferta.',
    resumenServicio: '{{precio}} · {{min}} min',
    procedimientosAdministrar: 'Administrar procedimientos',
    procedimientosVacio: 'Suma lo que cotizas por presupuesto.',
    horariosDetalle: 'Franjas y organización de tu agenda.',
    verificadoTitulo: 'Perfil verificado',
    verificadoVoz: 'Tu título y tu registro están aprobados.',
    verificacionInvita: 'Sube tu título y tu registro para abrir el consultorio.',
    verificacionCta: 'Ir a verificación',
  },
  procedimientosVet: {
    titulo: 'Tus procedimientos',
    intro: 'Se cotizan por presupuesto — no se reservan.',
    agregar: 'Agregar procedimiento',
    nuevoTitulo: 'Nuevo procedimiento',
    editarTitulo: 'Editar procedimiento',
    nombre: 'Nombre',
    nombrePlaceholder: 'Limpieza dental',
    precioReferencia: 'Precio de referencia',
    precioAyuda: 'Orientativo para la familia — el presupuesto real lo das tú.',
    visible: 'Visible',
    oculto: 'Oculto',
    guardar: 'Guardar',
    quitar: 'Quitar procedimiento',
    quitarConfirma: 'Quitar definitivamente',
    guardado: 'Procedimiento guardado.',
    quitado: 'Procedimiento quitado.',
    vacioTitulo: 'Aún no tienes procedimientos',
    vacioCuerpo: 'Cirugías menores, limpiezas, tratamientos: lo que cotizas caso a caso.',
  },
  verificacionVet: {
    titulo: 'Verificación profesional',
    intro:
      'Sube tu título y tu registro. Mientras se revisan puedes seguir configurando todo — la verificación se necesita para abrir, no para construir.',
    tituloProfesional: 'Título profesional',
    registroSenescyt: 'Registro SENESCYT',
    sinDocumento: 'Aún no lo subes.',
    enRevision: 'En revisión',
    aprobado: 'Aprobado',
    rechazado: 'Necesitamos otra foto de este documento.',
    vencido: 'Venció — súbelo de nuevo.',
    revisar: 'Revisar',
    subir: 'Subir foto',
    subirDeNuevo: 'Subir de nuevo',
    tomarFoto: 'Tomar foto',
    elegirGaleria: 'Elegir de la galería',
    subido: 'Documento enviado. Queda en revisión.',
    permisoCamara: 'Necesitamos la cámara para la foto del documento. Puedes habilitarla desde los ajustes del teléfono, o elegirla de la galería.',
    errorRed: 'No se pudo subir — revisa tu conexión.',
    errorSubida: 'No se pudo subir el documento. Prueba de nuevo.',
  },
  // El detalle de UNA cita de veterinaria — destino del tap de la jornada
  // (S69-B, M0). Read-only: el Durante clínico llega con V4 · LOTE S69,
  // GATE PENDIENTE.
  citaVet: {
    titulo: 'Atención veterinaria',
    noExiste: 'Esta cita ya no está disponible.',
    cuando: 'Cuándo',
    // S74-B recepción v1: el contacto es de la VISITA (decisión de mesa)
    visitaTitulo: 'La visita',
    visitaReservo: 'Reservó',
    visitaTelefono: 'Teléfono',
    visitaSinContacto: 'Se registró en el mostrador — sin contacto de reserva.',
    visitaSinTelefono: 'No dejó un teléfono al reservar.',
    visitaError: 'No pudimos cargar el contacto de la visita.',
    servicio: 'Servicio',
  },
  // El MOSTRADOR — walk-in del vet (S69-B, M1/M2/M3) · LOTE S69, GATE PENDIENTE
  mostrador: {
    registrarAtencion: 'Registrar atención',
    buscarTitulo: 'Registrar atención',
    buscarLabel: 'Buscar',
    buscarPlaceholder: 'Nombre de la mascota o email del cliente',
    origenClinica: 'Cliente de la clínica',
    origenPendiente: 'Registro pendiente',
    origenRegistrado: 'Ya en e-PetPlace',
    // S70-B2-v2: la cuenta registrada entra al handshake al tocar · LOTE S70
    // S73-B: voseo→tuteo al tocarse (clase D-481).
    registradoTocar: 'Ya en e-PetPlace — toca para elegir la mascota',
    pendienteTitulo: 'Ya tiene un registro pendiente',
    clienteSinNombre: 'Cliente',
    sinResultadosTitulo: 'Nadie con ese dato todavía',
    sinResultadosDetalle: 'Registrá la mascota nueva para empezar su expediente.',
    registrarNueva: 'Registrar mascota nueva',
    nuevaTitulo: 'Registrar mascota nueva',
    mascotaLabel: 'Nombre de la mascota',
    mascotaPlaceholder: 'ej: Firulais',
    especieLabel: '¿Qué especie es?',
    cargandoEspecies: 'Cargando especies',
    clienteLabel: 'Nombre del cliente',
    clientePlaceholder: 'ej: María Pérez',
    emailLabel: 'Email del cliente',
    emailPlaceholder: 'ej: maria@correo.com',
    telefonoLabel: 'Teléfono',
    telefonoPlaceholder: 'ej: 0999123456',
    contactoEtiqueta: 'Contacto del cliente',
    contactoEmail: 'Email',
    contactoTelefono: 'Teléfono',
    contactoAyuda: 'Con esto la familia reclama el expediente cuando se registre.',
    registrar: 'Registrar',
    exitoEmail: 'Cuando {{contacto}} se registre en e-PetPlace, el expediente de {{mascota}} lo va a estar esperando.',
    exitoTelefono: 'Cuando alguien se registre con el {{contacto}}, el expediente de {{mascota}} lo va a estar esperando.',
  },
  // M4/M5 — la atención del mostrador + cobro-dato (S69-B, A1bis) · LOTE S69, GATE PENDIENTE
  // D-472 (S73-B, tajada 1): la voz del camino triste del path vet sale
  // del riel (tuteo L-148 + en). El mapa código→key vive en
  // lib/voz-error-vet.ts; el mensaje del wrapper queda de fallback.
  // "datos_inconsistentes" gana voz humana por acción (la del wrapper
  // era system-speak — Ley 17.2). PENDIENTE DE GATE founder (lote S73).
  erroresVet: {
    busqueda: {
      emailInvalido: 'Escribe un email válido para buscar.',
      telefonoInvalido: 'Escribe un teléfono válido para buscar.',
      accesoDenegado: 'No tienes permiso para buscar clientes.',
      datosInconsistentes: 'No pudimos completar la búsqueda. Intenta de nuevo.',
      errorBusqueda: 'No pudimos buscar. Intenta de nuevo.',
    },
    alta: {
      accesoDenegado: 'No tienes permiso para registrar en este negocio.',
      contactoRequerido: 'Pon un email o un teléfono del cliente.',
      nombreClienteRequerido: 'Pon el nombre del cliente.',
      nombreMascotaRequerido: 'Pon el nombre de la mascota.',
      especieInvalida: 'Elige una especie válida.',
      countryInvalido: 'El país no es válido.',
      clienteYaRegistrado: 'Ese cliente ya está en e-PetPlace — búscalo por su contacto para sumarle la mascota.',
      pendienteYaExiste: 'Ya hay un registro pendiente con ese contacto.',
      datosInconsistentes: 'No pudimos registrar. Intenta de nuevo.',
    },
    atencion: {
      accesoDenegado: 'No tienes acceso a este negocio o esta mascota.',
      prestadorSinCuenta: 'Tu negocio todavía no está habilitado para registrar atenciones.',
      sinAccesoMascota: 'No tienes acceso a esta mascota.',
      tipoNoMedico: 'Ese servicio no es de veterinaria.',
      servicioNoActivo: 'Ese servicio no está activo en tu consultorio.',
      precioInvalido: 'El precio no es válido.',
      countryInvalido: 'El país no es válido.',
      datosInconsistentes: 'No pudimos registrar la atención. Intenta de nuevo.',
    },
    cobro: {
      accesoDenegado: 'No tienes permiso para registrar el cobro.',
      citaNoExiste: 'Esa atención ya no existe.',
      noOperaCuenta: 'No operas este negocio.',
      montoInvalido: 'El monto no es válido.',
      medioInvalido: 'Elige un medio de cobro válido.',
      cobroYaRegistrado: 'Esta atención ya tiene un cobro registrado.',
      datosInconsistentes: 'No pudimos registrar el cobro. Intenta de nuevo.',
    },
    vacuna: {
      accesoDenegado: 'No tienes permiso para registrar en este negocio.',
      citaNoExiste: 'Esa atención ya no existe.',
      sinAccesoMascota: 'No tienes acceso a esta mascota.',
      vacunaXor: 'Elige una vacuna del catálogo o escribe una — no ambas.',
      vacunaCodigoInvalido: 'Esa vacuna no está en el catálogo.',
      datosInconsistentes: 'No pudimos registrar la vacuna. Intenta de nuevo.',
    },
    solicitud: {
      accesoDenegado: 'Tu sesión no está activa. Inicia sesión de nuevo.',
      noOperaCuenta: 'No operas este negocio.',
      cuentaNoActiva: 'El negocio todavía no está activo.',
      mascotaRequerida: 'Elige una mascota.',
      mascotaNoExiste: 'Esa mascota ya no existe.',
      destinoRequerido: 'Falta el cliente destinatario.',
      payloadAltaInvalido: 'Faltan datos de la mascota (nombre y especie).',
      solicitudDuplicada: 'Ya hay una solicitud pendiente para esta mascota.',
      datosInvalidos: 'Revisa los datos e intenta de nuevo.',
    },
    // Tajada 2: el Durante clínico, el presupuesto y el taller.
    estructurar: {
      entradaInvalida: 'No pudimos leer el dictado. Revisa el texto e intenta de nuevo.',
      configuracionFaltante: 'El asistente de notas no está disponible en este momento.',
      errorModelo: 'No pudimos estructurar la nota ahora. Intenta de nuevo en un rato.',
      estructuracionFallida: 'No pudimos estructurar el dictado. Revísalo e intenta de nuevo.',
      datosInconsistentes: 'No pudimos estructurar la nota. Intenta de nuevo.',
    },
    sedimento: {
      accesoDenegado: 'Tu sesión no está activa. Inicia sesión de nuevo.',
      noOperaCuenta: 'No operas este negocio.',
      sinAccesoMascota: 'No tienes acceso a esta mascota.',
      citaRequerida: 'Falta la cita de la consulta.',
      hcYaExiste: 'Esta consulta ya tiene una historia clínica registrada.',
      notaSinMotivo: 'La nota necesita un motivo de consulta.',
      notaSinDiagnostico: 'La nota necesita un diagnóstico.',
      cuentaSinPrestador: 'El negocio no tiene un profesional configurado.',
      posologiaIncompleta: 'Una medicación no tiene dosis o frecuencia. Complétala antes de guardar.',
      // (la voz de PANTALLA del mismo muro vive en consulta.medIncompletaAviso)
      medicamentoSinNombre: 'Una medicación no tiene nombre.',
      condicionSinNombre: 'Una condición crónica no tiene nombre.',
      alergiaSinAlergeno: 'Una alergia no tiene alérgeno.',
      alergiaSinSeveridad: 'Una alergia no tiene severidad.',
      condicionRequerida: 'El caso necesita una condición.',
      noEsTratante: 'No eres la clínica tratante de este caso.',
      datosInvalidos: 'Revisa los datos de la nota.',
    },
    presupuesto: {
      accesoDenegado: 'No tienes permiso para esta acción.',
      noOperaCuenta: 'No operas este negocio.',
      sinAccesoMascota: 'No tienes acceso a esta mascota.',
      countryInvalido: 'El país no es válido.',
      presupuestoNoExiste: 'Ese presupuesto ya no existe.',
      presupuestoNoEsBorrador: 'El presupuesto ya no es un borrador — no se puede editar.',
      venceEnRequerido: 'Pon hasta cuándo vale el presupuesto.',
      venceEnPasada: 'La fecha de vencimiento tiene que ser futura.',
      presupuestoSinItems: 'Agrega al menos un ítem antes de enviar.',
      noEsFamilia: 'Solo la familia puede aprobar desde la app.',
      presupuestoNoEnviado: 'El presupuesto todavía no fue enviado.',
      presupuestoVencido: 'El presupuesto venció.',
      presupuestoNoEditable: 'El presupuesto ya no se puede modificar.',
      citaNoEncontrada: 'Esa cita ya no existe.',
      citaNoEsDePresupuesto: 'Esta cita no salió de un presupuesto.',
      citaYaFijada: 'Esta cita ya tiene fecha coordinada.',
      presupuestoNoAprobado: 'El presupuesto de esta cita todavía no está aprobado.',
      empleadoNoEsDeCuenta: 'Esa persona no pertenece a este negocio.',
      slotInvalido: 'Elige fecha, hora y profesional.',
      slotEnPasado: 'La fecha coordinada tiene que ser futura.',
      slotOcupado: 'Ese horario ya está ocupado para esa persona.',
      datosInvalidos: 'Revisa los datos del presupuesto.',
    },
    citaVet: {
      citaNoEncontrada: 'La cita no existe o ya no es accesible.',
      datosInconsistentes: 'No pudimos cargar la cita. Intenta de nuevo.',
    },
    oferta: {
      sinDatos: 'No pudimos leer tu oferta de veterinaria.',
      noEncontrada: 'Ese servicio ya no existe.',
      verificacionProfesionalPendiente:
        'Tu verificación profesional todavía no está aprobada — el servicio queda guardado y podrás publicarlo al aprobarse.',
      especialidadInvalida: 'Una especialidad lleva su fila del catálogo o un nombre propio — nunca ambos ni ninguno.',
      duracionInvalida: 'La duración tiene que ir de 10 a 240 minutos, en pasos de 5.',
      datosInconsistentes: 'No pudimos guardar tu oferta. Intenta de nuevo.',
    },
  },
  atencionMostrador: {
    titulo: 'Registrar atención',
    servicioLabel: '¿Qué servicio?',
    // S73-B (M2 de A, boceto atencion): voseo→tuteo al tocarse + los
    // estados que faltaban (error con reintento, CTA al taller — 17.5).
    sinServicios: 'Prende un servicio en tu consultorio para registrar atenciones.',
    sinServiciosCta: 'Activar servicios',
    errorCarga: 'No pudimos cargar tu consultorio.',
    // «revisá tu conexión» queda RESERVADO a errores de red (S47) — acá
    // la causa puede ser otra; la voz dirige sin diagnosticar de más.
    errorCargaDetalle: 'Vuelve a intentarlo en un momento.',
    precioLabel: 'Precio',
    registrarAtencion: 'Registrar atención',
    cobroTitulo: 'Cobro',
    montoLabel: 'Monto cobrado',
    medioLabel: 'Medio',
    medioEfectivo: 'Efectivo',
    medioTarjeta: 'Tarjeta',
    medioTransferencia: 'Transferencia',
    registrarCobro: 'Registrar cobro',
    sinCobro: 'Listo, sin cobro ahora',
    exito: 'Atención registrada — quedó en la agenda de hoy y en el expediente de {{mascota}}.',
    // D-434: el registrable de vacuna
    vacunaLabel: '¿Qué vacuna?',
    vacunaOtra: 'Otra',
    vacunaLibreLabel: 'Nombre de la vacuna',
    vacunaLibrePlaceholder: 'ej: Bordetella',
    vacunaExito: 'Vacuna registrada en el expediente de {{mascota}}.',
  },
  // EL PRESUPUESTO CLÍNICO — armado del vet (S69-B, B3) · LOTE S69, GATE PENDIENTE
  presupuesto: {
    titulo: 'Nuevo presupuesto',
    crear: 'Crear presupuesto',
    // S70-B1: detalle de la celda de primera clase (§15b, Ley 19.1) · LOTE S70, GATE PENDIENTE
    crearDetalle: 'Armá los procedimientos y su precio',
    procedimientosTitulo: 'Procedimientos',
    libreTitulo: 'Otra línea',
    libreNombre: 'Concepto',
    libreNombrePlaceholder: 'ej: Radiografía de tórax',
    librePrecio: 'Precio',
    agregarLinea: 'Agregar al presupuesto',
    quitar: 'Quitar',
    total: 'Total',
    vacioAyuda: 'Sumá procedimientos o una línea para armar el presupuesto.',
    enviarFamilia: 'Enviar a la familia',
    aprobarPresencial: 'Registrar aprobación presencial',
    enviadoFamilia: 'Presupuesto enviado a la familia.',
    aprobadoPresencial: 'El procedimiento quedó aprobado con precio congelado — coordina el día con la familia.',
    // Relectura en el detalle de cita (cura de gate)
    listaTitulo: 'Presupuestos de {{nombre}}',
    estadoBorrador: 'Borrador',
    estadoEnviado: 'Enviado',
    estadoAprobado: 'Aprobado',
    estadoRechazado: 'Rechazado',
    estadoVencido: 'Vencido',
  },
  // S70-B2-v2: la pantalla "El movimiento" (listado de presupuestos del negocio)
  movimiento: {
    titulo: 'El movimiento',
    vacio: 'Todavía no armaste presupuestos.',
    vacioDetalle: 'Cuando armes un presupuesto desde una atención, va a aparecer acá.',
    sinItems: 'Presupuesto',
    error: 'No pudimos cargar el movimiento.',
    errorDetalle: 'Prueba de nuevo en un momento.',
  },
  // S70-B2-v2: la pantalla "Fijar fecha" (coordinar el procedimiento, D-439)
  coordinar: {
    titulo: 'Fijar fecha',
    contexto: 'Precio congelado',
    diaLabel: '¿Qué día?',
    horaLabel: '¿A qué hora?',
    // S71 (la puerta no ofrece lo que va a rechazar): hoy sin horas restantes
    hoySinHoras: 'Para hoy ya no quedan horarios — elige otro día.',
    personaLabel: '¿Quién atiende?',
    confirmar: 'Confirmar fecha',
    exito: 'Listo. Coordinaste la cita de {{mascota}}.',
    error: 'No pudimos cargar los datos.',
    errorDetalle: 'Prueba de nuevo en un momento.',
  },
  // S70-B2-v2: el HANDSHAKE — autorización de la familia en el mostrador
  autorizar: {
    titulo: 'Autorización de la familia',
    grillaTitulo: '¿A quién de la familia de {{nombre}} vas a atender?',
    mascotaNueva: 'Mascota nueva',
    pedir: 'Pedir autorización',
    volver: 'Volver',
    altaTitulo: 'Sumá una mascota nueva a esta familia',
    nombreLabel: 'Nombre de la mascota',
    nombrePlaceholder: 'Ej: Luna',
    especieLabel: '¿Qué mascota es?',
    esperando: 'Esperando a la familia de {{nombre}}',
    esperandoDetalle: 'Le llegó el pedido a su teléfono. En cuanto autorice, seguimos.',
    rechazada: '{{nombre}} no autorizó la atención.',
    expirada: 'El pedido de autorización venció. Pedilo de nuevo.',
    error: 'No pudimos abrir la autorización',
    errorDetalle: 'Volvé al mostrador y buscá al cliente de nuevo.',
  },
  // S70-B2-v2: EL DURANTE — la consulta clínica (antes → dictado → confirmación → después)
  consulta: {
    titulo: 'Consulta',
    iniciarCta: 'Iniciar consulta',
    // S75-B16 (censo): voseo → tuteo (L-148), misma pantalla que errorDetalle.
    iniciarDetalle: 'Dicta la nota y guarda la historia clínica',
    mascotaFallback: 'la mascota',
    errorTitulo: 'No pudimos abrir la consulta',
    // S75-B16 (L-148 tuteo + sin promesa falsa de reintento: si no hay
    // acceso, reintentar no lo arregla — Ley 17.4).
    errorDetalle: 'Puede que no tengas acceso a esta mascota.',
    sinRegistros: 'sin registros',
    requerido: 'Obligatorio',
    perfilTitulo: 'Perfil de {{mascota}}',
    perfilEspecie: 'Especie',
    perfilPeso: 'Peso clínico',
    perfilCronica: 'Condición crónica',
    cronicaSi: 'Tiene registro',
    cronicaNo: 'Sin registros',
    perfilEmergencia: 'Emergencia',
    emergenciaActiva: 'Activa',
    casosTitulo: 'Casos activos',
    casosVacio: 'No hay casos abiertos para esta mascota.',
    casoTratante: 'Sos la clínica tratante',
    casoOtra: 'Otra clínica',
    presupuestosTitulo: 'Presupuestos',
    presupuestosVacio: 'Todavía no armaste presupuestos para esta mascota.',
    estadoPresupuesto: {
      borrador: 'Borrador',
      enviado: 'Enviado',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado',
      vencido: 'Vencido',
    },
    iniciar: 'Empezar la consulta',
    dictadoTitulo: 'Dicta la consulta de {{mascota}}',
    // D-456 (S72-B): la decisión founder — "el mic es el del teclado del SO" —
    // vivía SOLO en un comentario de código. La ayuda prometía hablar y nunca
    // decía cómo. Ahora lo dice. Tuteo por L-148 + censo del diccionario.
    // S73-B ítem 8 (a): la frase hacía DOBLE turno (flujo + mic). Se parte:
    // la cabecera guía el flujo; el hint del mic viaja JUNTO AL CAMPO
    // (dictadoCampoAyuda → slot ayuda de Campo), donde el teclado sube.
    dictadoAyuda: 'Habla o escribe libremente. Después revisas todo campo por campo antes de guardar.',
    dictadoCampoAyuda: 'Para dictar, toca el micrófono de tu teclado.',
    dictadoLabel: 'Nota de la consulta',
    dictadoPlaceholder: 'Motivo, hallazgos, diagnóstico, plan, medicación…',
    estructurar: 'Estructurar la nota',
    estructurando: 'Estamos ordenando tu dictado. Puede tardar un momento.',
    confirmacionAyuda: 'Revisa y corrige antes de guardar. Lo que la IA no leyó queda vacío — complétalo tú.',
    motivoLabel: 'Motivo de consulta',
    motivoPlaceholder: '¿Por qué vino?',
    diagnosticoLabel: 'Diagnóstico',
    diagnosticoPlaceholder: 'Diagnóstico principal',
    anamnesisLabel: 'Anamnesis',
    anamnesisPlaceholder: 'Antecedentes y evolución',
    examenLabel: 'Examen físico',
    examenPlaceholder: 'Hallazgos del examen',
    planLabel: 'Plan terapéutico',
    planPlaceholder: 'Indicaciones y tratamiento',
    vitalesTitulo: 'Signos vitales',
    vitalPeso: 'Peso (kg)',
    vitalTemp: 'Temperatura (°C)',
    vitalFc: 'Frecuencia cardíaca',
    vitalFr: 'Frecuencia respiratoria',
    vitalCc: 'Condición corporal',
    formulaTitulo: 'Medicación',
    formulaVacio: 'Sin medicación en esta consulta.',
    medNombre: 'Medicamento',
    medNombrePlaceholder: 'Nombre del medicamento',
    medDosis: 'Dosis',
    medDosisPlaceholder: 'Ej. 1 comprimido',
    medFrecuencia: 'Frecuencia',
    medFrecuenciaPlaceholder: 'Ej. cada 12 h',
    medDuracion: 'Duración (días)',
    medDuracionPlaceholder: 'Ej. 7',
    medVia: 'Vía',
    medViaPlaceholder: 'Ej. oral',
    medIndicaciones: 'Indicaciones',
    medIndicacionesPlaceholder: 'Cómo darlo',
    medQuitar: 'Quitar medicación',
    medAgregar: 'Agregar medicación',
    examenesTitulo: 'Exámenes pedidos',
    examenesVacio: 'Sin exámenes pedidos.',
    examenItemLabel: 'Examen {{n}}',
    examenItemPlaceholder: 'Ej. hemograma',
    examenQuitar: 'Quitar',
    examenAgregar: 'Agregar examen',
    casoTitulo: 'Caso clínico',
    casoModoLabel: '¿Esta consulta pertenece a un caso?',
    casoNinguno: 'Ninguno',
    casoActivo: 'Existente',
    casoNuevo: 'Nuevo',
    casoCondicionLabel: 'Condición del caso',
    casoCondicionPlaceholder: 'Ej. enfermedad renal',
    casoElegirLabel: 'Elegí el caso',
    confirmar: 'Guardar la consulta',
    // S73-B cura de mesa (hallazgo T-B trampa L-139): el botón apagado dice su porqué.
    medIncompletaAviso: 'Completa la dosis y la frecuencia para confirmar.',
    // S73-B 🔴 cura de gate: cada guard del Confirmar con su campo NOMBRADO.
    faltaMotivo: 'Falta el motivo de consulta.',
    faltaDiagnostico: 'Falta el diagnóstico.',
    faltaCasoCondicion: 'Falta la condición del caso.',
    faltaCasoEleccion: 'Elige el caso activo.',
    listo: 'Guardamos la consulta de {{mascota}}.',
    proximoTitulo: 'Próxima consulta sugerida',
    proximoDetalle: '{{control}}',
    cerrar: 'Listo',
  },
  equipo: {
    titulo: 'Tu negocio',
    seccion: 'Tu equipo',
    errorCarga: 'No pudimos cargar tu equipo. Prueba de nuevo.',
    errorEscritura: 'No se guardó el cambio. Prueba de nuevo.',
    errorInvitar: 'No pudimos crear la invitación. Prueba de nuevo.',
    rolDueno: 'Dueño',
    rolProfesional: 'Profesional',
    rolRecepcion: 'Recepción',
    sinRolAccion: 'Sin permisos todavía — asigna un rol',
    rolesAyuda: 'Profesional lee el expediente clínico. Recepción recibe y registra, sin historia clínica.',
    equipoDeUno: 'Tu equipo es tuyo por ahora. Invita cuando lo necesites.',
    invitarCta: 'Invitar a tu equipo',
    invitarTitulo: 'Invitar a tu equipo',
    invitarNombre: 'Nombre',
    invitarEmail: 'Correo',
    invitarAyuda: 'La invitación queda registrada a ese correo. Todavía no le llega sola: el aviso y la entrada automática están en construcción.',
    invitarEnviar: 'Invitar',
    // CURA D-508: los 4 rebotes suaves del motor, en voz humana (Ley 3)
    rebYaEnEquipo: 'Esa persona ya es parte de tu equipo.',
    rebSinCuenta: 'Ese correo todavía no tiene cuenta en e-PetPlace. Cuando la cree, invítalo de nuevo.',
    rebOtroPrestador: 'Ese correo pertenece a otro negocio prestador.',
    rebNoDueno: 'Solo quien es dueño del negocio puede invitar.',
    desvincularCta: 'Desvincular del negocio',
    desvincularConfirma: '{{nombre}} pierde el acceso al negocio. Lo que hizo queda en el expediente.',
    soloDueno: 'El equipo lo administra quien es dueño del negocio.',
  },
} as const;
