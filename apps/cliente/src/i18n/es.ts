/**
 * Diccionario español del dueño — namespace `cliente` (S51-B1a).
 * Registro: tuteo neutro (regla 27, decisión founder S51).
 *
 * Las pantallas existentes migran su voz acá AL TOCARSE (deuda de
 * extracción en docs/DEUDAS_CANONICAS.md); toda pantalla NUEVA nace
 * con sus textos acá — cero strings crudos (regla 26 bilingüe).
 */

export const clienteEs = {
  tabs: {
    hogar: 'Hogar',
    explorar: 'Explorar',
    cuenta: 'Cuenta',
  },
  bienvenida: {
    heroTitulo: 'La vida de tu mascota, en un solo lugar.',
    heroSubtitulo: 'Cada paseo, cada visita al vet, cada momento — guardado y a mano.',
    crearCuenta: 'Crear cuenta',
    yaTengoCuenta: 'Ya tengo cuenta',
  },
  hogar: {
    titulo: 'Tu hogar',
    // saludo por franja horaria (S52-P2a — voz del lote gateado)
    saludoManana: 'Buenos días',
    saludoTarde: 'Buenas tardes',
    saludoNoche: 'Buenas noches',
    cargando: 'Cargando tu hogar',
    // ── Las tres voces del estado (DISEÑO_EXPERIENCIA §2) ──
    // Voz emocional APROBADA por founder (gate del lote S51).
    vozAlDia: '{{nombre}} está al día.',
    vozEmergencia: '{{nombre}} necesita tu atención ahora.',
    vozVacunaVence: 'A {{nombre}} le vence {{vacuna}} en {{dias}} días.',
    vozVacunaVenceUnDia: 'A {{nombre}} le vence {{vacuna}} mañana.',
    vozVacunaVenceHoy: 'A {{nombre}} le vence {{vacuna}} hoy.',
    vozVacunaVencida: 'A {{nombre}} se le venció {{vacuna}} hace {{dias}} días.',
    vozVacunaVencidaUnDia: 'A {{nombre}} se le venció {{vacuna}} ayer.',
    vozConociendolo: 'Aún estamos conociendo a {{nombre}} — carga su carnet y te cuidamos mejor.',
    vozQuieto: 'El expediente de {{nombre}} quedó quieto — ¿hay novedades de su cuidado?',
    // ── Zona 2 (hoy) — funcional ──
    paseoEnCurso: 'Paseo en curso',
    verEnVivo: 'Ver cómo va',
    proximaCita: 'Próxima cita',
    // ── Zona 4 (la vida) — funcional + aporte ──
    cargarCarnet: 'Carnet de vacunas',
    cargarCarnetDetalle: 'Sácale una foto al carnet — nosotros leemos las vacunas y las guardamos en su historia.',
    carnetDeQuien: '¿De quién es el carnet?',
    historiaEmpieza: 'La historia empieza acá.',
    historiaEmpiezaDetalle: 'Cada paseo, cada visita al vet, va a quedar guardada.',
    sinMascotas: 'Todavía no hay nadie por acá',
    sinMascotasDetalle: 'Agrega a tu mascota para empezar su historia.',
    errorHistoria: 'No pudimos cargar su historia',
    errorHistoriaDetalle: 'Revisa tu conexión y prueba de nuevo.',
    reintentar: 'Reintentar',
  },
  coach: {
    // ── El Coach v0 (S53-B2b) — VOZ EMOCIONAL, GATE PENDIENTE.
    // v0 = plantillas sobre DATOS REALES del expediente (L-139: cero
    // generación, cero diagnóstico); el cerebro de verdad es A5.
    abrir: 'Abrir el Coach',
    preguntaSobre: 'Pregunta sobre {{nombre}}',
    // las tres preguntas sugeridas
    pEdad: '¿Qué edad tiene?',
    pCarnet: '¿Cómo va su carnet?',
    pActividad: '¿Qué actividad tiene?',
    // respuestas-plantilla (datos verificables adentro)
    rEdad: '{{nombre}} tiene {{edad}} — su etapa es {{momento}}.',
    rEdadSinMomento: '{{nombre}} tiene {{edad}}.',
    rEdadSinFecha: 'Todavía no tengo su fecha de nacimiento — puedes cargarla en su perfil y te la cuento.',
    rCarnet: 'Tiene {{n}} vacunas registradas. La última que guardamos es {{vacuna}}.',
    rCarnetUna: 'Tiene 1 vacuna registrada: {{vacuna}}.',
    rCarnetVacio: 'Su carnet todavía está vacío — cárgalo con una foto y lo leo por ti.',
    rActividad: 'Tiene {{n}} paseos guardados en su historia; el último fue el {{fecha}}.',
    rActividadUno: 'Tiene 1 paseo guardado en su historia, el {{fecha}}.',
    rActividadVacia: 'Todavía no hay paseos registrados — cuando salga a pasear con la app, quedan guardados acá.',
    // la honestidad del v0
    pie: 'Pronto vas a poder preguntarme lo que quieras.',
  },
  ficha: {
    // ── Voces de la FichaMascotaHogar v2 (S52-P3) — SIN sujeto: el
    // nombre PRESIDE la card y la voz no lo repite. VERSIONADAS EN
    // PARES con hogar.voz* (con {{nombre}}, que se CONSERVAN para
    // contextos sin sujeto visible: notificaciones, Coach, alertas).
    // VOZ EMOCIONAL — GATE PENDIENTE (tanda S52 al lote del founder).
    vozAlDia: 'Está al día.',
    vozEmergencia: 'Necesita tu atención ahora.',
    vozVacunaVence: 'Le vence {{vacuna}} en {{dias}} días.',
    vozVacunaVenceUnDia: 'Le vence {{vacuna}} mañana.',
    vozVacunaVenceHoy: 'Le vence {{vacuna}} hoy.',
    vozVacunaVencida: 'Se le venció {{vacuna}} hace {{dias}} días.',
    vozVacunaVencidaUnDia: 'Se le venció {{vacuna}} ayer.',
    vozConociendolo: 'Aún nos estamos conociendo — carga su carnet.',
    vozQuieto: 'Su expediente quedó quieto — ¿hay novedades?',
  },
  perfil: {
    // ── momento vital (Ley 3: la VOZ, jamás M1..M7) ──
    // Bautizo APROBADO por founder (gate del lote S51).
    momentoM1: 'Primeros meses',
    momentoM2: 'Creciendo',
    momentoM3: 'Adulto',
    momentoM4: 'Con cuidado especial',
    momentoM5: 'Años dorados',
    // edad (funcional, voz humana)
    edadAnios: '{{anios}} años',
    edadUnAnio: '1 año',
    edadMeses: '{{meses}} meses',
    edadUnMes: '1 mes',
    // ── secciones de la pila ──
    vida: 'Su vida',
    salud: 'Salud',
    identidad: 'Identidad',
    // ── salud ──
    carnetVacio: 'Su carnet todavía está vacío',
    carnetVacioDetalle: 'Cárgalo con una foto y guardamos sus vacunas.',
    cargarCarnet: 'Cargar carnet',
    // ── VITALES (S53-B2c: el módulo Bienestar elevado a dashboard;
    // el hueco M-WEAR queda HECHO — los índices se llenan ese día) ──
    vitales: 'Vitales',
    vitalesUltimos7: 'Últimos 7 días',
    vitalesKm: 'recorridos',
    vitalesMin: 'de paseo',
    vitalesMetaVarias: '{{n}} salidas · última {{fecha}}',
    vitalesMetaUna: '1 salida · última {{fecha}}',
    vitalesBarrasA11y: '{{n}} de 7 días con salida',
    // comparativa — SOLO con respaldo de datos (L-139); GATE PENDIENTE:
    vitalesComparativa: 'Esta semana caminó más que la pasada.',
    bienestarVacio: 'Su actividad va a aparecer acá',
    bienestarVacioDetalle: 'Cada paseo con su recorrido queda guardado en su historia.',
    // ── índices educativos (§6.4: visibles, honestos-vacíos) ──
    // GATE PENDIENTE (voz educativa):
    indiceSalud: 'Índice de salud',
    indiceDescanso: 'Descanso y actividad',
    indiceSeConstruye: 'Se construye con su expediente',
    eduSaludQue: 'Una lectura general de cómo está su salud, en una sola mirada.',
    eduSaludDeQue: 'Se alimenta de su carnet de vacunas, sus chequeos y su actividad. Mientras más completo su expediente, más fiel la lectura.',
    eduDescansoQue: 'Cómo se mueve y descansa a lo largo del tiempo.',
    eduDescansoDeQue: 'Hoy se construye con sus paseos. El día que tenga un collar conectado, va a contar también su descanso.',
    eduAccion: 'Cargar su carnet',
    // ── identidad progresiva ──
    raza: 'Raza',
    sexo: 'Sexo',
    sexoMacho: 'Macho',
    sexoHembra: 'Hembra',
    nacimiento: 'Nacimiento',
    peso: 'Peso',
    microchip: 'Microchip',
    identidadInvitacion: 'Su identidad se completa de a poco — cada dato nos ayuda a cuidarlo mejor.',
    error: 'No pudimos cargar el perfil',
  },
  vacunaHoja: {
    titulo: 'Vacuna',
    cargando: 'Cargando la vacuna',
    error: 'No pudimos cargar la vacuna. Cierra y prueba de nuevo.',
    verCarnet: 'Ver carnet',
    errorAbrirCarnet: 'No pudimos abrir el carnet. Prueba de nuevo.',
    // voz de máquina (mono minúsculas — las fuerza la pantalla)
    aplicada: 'aplicada',
    proxima: 'próxima',
    lote: 'lote',
  },
  explorar: {
    titulo: 'Explorar',
    error: 'No pudimos cargar los servicios',
    // servicios (funcional — el nombre de la vertical)
    servicios: 'Servicios',
    servicioPaseo: 'Paseo',
    servicioPaseoDetalle: 'Paseadores que cuidan y documentan cada salida.',
    servicioGrooming: 'Estética y baño',
    servicioGroomingDetalle: 'Grooming profesional que queda en su historia.',
    servicioVet: 'Veterinaria',
    servicioVetDetalle: 'Atención clínica para su salud.',
    servicioAdiestramiento: 'Adiestramiento',
    servicioAdiestramientoDetalle: 'Educación y conducta con profesionales.',
    agendarLlega: 'Agendar desde la app llega pronto.',
    // refugios / M0
    refugios: 'Refugios y adopción',
    refugiosVacio: 'Todavía no hay refugios publicados',
    refugiosVacioDetalle: 'Cuando un refugio se sume, sus mascotas en adopción van a vivir acá.',
    // próximamente honesto (§8 — sin fechas prometidas)
    proximamente: 'Próximamente',
    proxHotel: 'Hotel',
    proxGuarderia: 'Guardería',
    proxSeguros: 'Seguros',
    proxTelemedicina: 'Telemedicina',
    proxPrime: 'ePetPlace Prime',
  },
  cuenta: {
    titulo: 'Tu cuenta',
    idioma: 'Idioma',
    idiomaEs: 'Español',
    idiomaEn: 'English',
    idiomaError: 'No pudimos guardar el idioma. Prueba de nuevo.',
    // lugares del ciclo B1 — honestos, jamás formularios muertos
    enPreparacion: 'En preparación',
    perfil: 'Tu perfil',
    contrasena: 'Contraseña',
    notificaciones: 'Notificaciones',
    eliminarCuenta: 'Eliminar cuenta',
    sesion: 'Sesión',
  },
  ajustes: {
    titulo: 'Ajustes',
    // Nació en voseo (S45) y se transpone a tuteo neutro al tocarse (S51).
    confirmacionCierre: '¿Cierras tu sesión? Tus datos quedan guardados.',
    cerrarSesion: 'Cerrar sesión',
    cancelar: 'Cancelar',
  },
} as const;
