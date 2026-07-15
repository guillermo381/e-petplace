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
    // S60-C2.2: la jornada ya no es solo paseos (grooming vivo) — la
    // voz genérica de la jornada, propuesta al gate · LOTE S60
    saludo: 'Tu jornada de hoy',
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
    // la semana (D-317, S57-B1) · LOTE S57, GATE PENDIENTE
    vistaEtiqueta: 'Agenda',
    vistaHoy: 'Hoy',
    vistaSemana: 'Semana',
    // S61-B5: el filtro por oficio (solo con ≥2 oficios activos) · LOTE S61, GATE PENDIENTE
    filtroEtiqueta: 'Ver por servicio',
    filtroTodos: 'Todos',
    filtroPaseos: 'Paseos',
    filtroEstetica: 'Estética',
    filtroVacio: 'Hoy no tienes citas de este servicio.',
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
    comisionRetiene: 'e-PetPlace retiene {{pct}}%',
    comisionNeto: 'e-PetPlace retiene {{pct}}% · vas a recibir {{neto}}',
    comisionNoDisponible: 'No pudimos leer la comisión vigente.',
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
    agendaUnica: 'Tu agenda es una sola para todos tus servicios.',
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
} as const;
