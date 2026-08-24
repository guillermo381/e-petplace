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
    // S100c-D · Pedidos entra a la barra en el slot de Explorar (firma del
    // founder). La etiqueta de `explorar` QUEDA: la pantalla sigue viva y
    // se alcanza desde el perfil de la mascota — lo que salió es su botón.
    pedidos: 'Pedidos',
    // S95-I · el cuarto slot (§3, el ciclo del trono). Le guarda el lugar
    // a Comunidad: cuando ésta nazca, la Despensa le entrega el trono.
    despensa: 'Despensa',
    cuenta: 'Cuenta',
  },
  // S61-A8 — la bienvenida reescrita (letra founder; LOTE S61, GATE
  // PENDIENTE). heroTitulo/heroSubtitulo murieron con el hero (Ley 37).
  bienvenida: {
    titular: 'Tu mascota no tiene un expediente. Tiene',
    titularAcento: 'una vida.',
    crearCuenta: 'Crear cuenta',
    yaTengoCuenta: 'Ya tengo cuenta',
    legales: 'Al crear tu cuenta aceptas nuestros Términos y nuestra Política de privacidad.',
  },
  // S82-A r4 — la frontera del crash (espejo VERBATIM de las voces S79-B
  // del prestador, ya aprobadas allá; lote S82 igual las lista)
  caida: {
    titulo: 'Esta pantalla no se pudo mostrar',
    detalle: 'Es un problema nuestro, no de tu configuración — tus datos están a salvo. Prueba de nuevo.',
    reintentar: 'Reintentar',
  },
  // S55-A A3 (D-315): raíz + auth extraídos al riel (voseo→tuteo al tocarse)
  raiz: {
    tardando: 'Esto está tardando más de lo normal',
    tardandoDetalle: 'Revisa tu conexión y prueba de nuevo.',
    probarDeNuevo: 'Probar de nuevo',
  },
  login: {
    olvide: '¿Olvidaste tu contraseña?',
    titulo: 'Iniciar sesión',
    emailLabel: 'Email',
    emailPlaceholder: 'ej: ana@correo.com',
    passwordLabel: 'Contraseña',
    entrar: 'Entrar',
    conGoogle: 'Continuar con Google',
  },
  registro: {
    titulo: 'Crear cuenta',
    nombreLabel: 'Tu nombre',
    nombrePlaceholder: 'ej: Ana',
    emailLabel: 'Email',
    emailPlaceholder: 'ej: ana@correo.com',
    passwordLabel: 'Contraseña',
    // S88-D: el largo viene de MIN_LARGO_CONTRASENA (seguridad.ts, la
    // regla única firmada) — la pantalla lo pasa como {{n}}; un número
    // escrito acá ya mintió una vez (decía 6 con la regla en 8).
    passwordAyuda: 'Al menos {{n}} caracteres',
    // S88-D · las razones del apagado (Boton razonDeshabilitado): una
    // por causa — la de la clave repite la voz del wrapper
    // (password_debil) a propósito: una sola voz para una sola regla.
    razonCampos: 'Completa los campos para crear tu cuenta.',
    razonPasswordCorta: 'La contraseña necesita al menos {{n}} caracteres.',
    crearMiCuenta: 'Crear mi cuenta',
    correoConfirmacion: 'Te mandamos un correo para confirmar tu cuenta.',
  },
  // S104-C · verificar correo. Aparece solo cuando el proyecto exige
  // confirmar el correo (registrarse devuelve sesion_activa=false).
  verificarCorreo: {
    titulo: 'Confirmá tu correo',
    intro: 'Te enviamos un código de 8 dígitos a {{email}}. Escribilo para entrar.',
    codigoLabel: 'Código',
    codigoAyuda: '8 dígitos',
    confirmar: 'Confirmar',
    reenviar: 'Reenviar el código',
    reenviarEn: 'Reenviar en {{n}}s',
    reenviado: 'Te enviamos un código nuevo.',
  },
  // S55-A A3 (D-315): onboarding S45 al riel. Voz de marca APROBADA
  // por founder (lote S55, es y en).
  // ══ S91-D · EL ALTA DE MASCOTA — UNA voz para las DOS entradas ═══════════
  // Hasta S90 esta voz vivía DOS VECES (`onboarding.*` y `agregarMascota.*`)
  // con 23 de 24 claves idénticas palabra por palabra: el calco de las
  // pantallas se había copiado también al diccionario. §6 del método protege
  // la voz cuando cambia según QUIÉN la lee — acá la lee la MISMA persona, en
  // la misma casa, contestando la misma pregunta. No eran dos voces: era una
  // voz escrita dos veces, y por eso se unifica sin perder nada.
  //
  // ⚠️ LOTE S91 · GATE PENDIENTE. Y DOS DECISIONES DE VOZ QUE EL GATE ARBITRA,
  // declaradas para que no pasen de contrabando:
  //   ① TUTEO, no el voseo de la lámina. La lámina firmada dice «Contanos» y
  //      «¿Querés completar…?» — es el DICTADO del founder, y los dictados
  //      viajan en voseo (L-148). El acento de esta casa es tuteo neutro y lo
  //      re-firmó la pasada única de S89. Las palabras y el argumento del
  //      modal son los firmados; lo único que cambió es el acento. Si el gate
  //      prefiere el voseo del dictado, son TRES strings.
  //   ② LA VOZ DEL ACUARIO ES PROPUESTA, NO LETRA. La mesa firmó la cláusula
  //      (7-ago: el sujeto es el sistema, el campo dos es el tipo de agua) y
  //      dejó dicho que la voz se firma en el gate de pantalla.
  alta: {
    // ── paso 1/4
    paso1Titulo: '¿Quién se suma a tu casa?',
    especieEtiqueta: '¿Qué especie es?',
    especieAcuario: 'Acuario',
    cargandoEspecies: 'Cargando especies',
    reintentar: 'Reintentar',
    nombreLabel: '¿Cómo se llama?',
    nombrePlaceholder: 'ej: Zeus',
    nombreAcuarioLabel: '¿Cómo se llama el acuario?',
    nombreAcuarioPlaceholder: 'ej: El de la sala',
    acuarioPorQue:
      'Un acuario se cuida entero: el agua, las plantas y quienes viven en ella. Por eso registramos el acuario, y no cada pez por separado.',
    presentar: 'Presentar a {{nombre}}',
    registrarAcuario: 'Registrar el acuario',
    continuar: 'Continuar',
    tuMascota: 'tu mascota',
    // ── paso 2/4 · el título cambia por especie (firma founder)
    paso2Raza: '¿De qué raza es {{nombre}}?',
    paso2TipoAve: '¿Qué tipo de ave es {{nombre}}?',
    paso2TipoRoedor: '¿Qué tipo de roedor es {{nombre}}?',
    paso2Agua: '¿Cómo es el agua de {{nombre}}?',
    // Neutral: para las especies que hoy NO se ofrecen (reptil, otro). El mapa
    // de PasoRaza es TOTAL, así que ninguna cae en la pregunta de otra.
    paso2Tipo: '¿Qué tipo es {{nombre}}?',
    razaLabel: 'Su raza',
    razaPlaceholder: 'Escríbela como la conozcas',
    razaSugerencias: 'O elige una de estas',
    razaMestizo: 'Mestizo',
    // El VALOR que se guarda cuando se elige el botón — se traduce al
    // guardarse, como el nombre de la familia (dato persistido).
    razaMestizoValor: 'Mestizo',
    razaNoSe: 'No sé',
    razaAyuda: 'No hace falta que aciertes: esto se puede cambiar siempre desde su perfil.',
    aguaEtiqueta: 'El agua del acuario',
    aguaDulce: 'Dulce',
    aguaMarino: 'Marino',
    // ── paso 3/4
    paso3Titulo: 'Cuéntanos de su historia',
    fechaLabel: '¿Cuándo nació?',
    fechaAcuarioLabel: '¿Cuándo lo montaste?',
    fechaPlaceholder: 'Elige una fecha',
    fechaAyuda: 'Si no sabes el día exacto, ábrelo y elige «No sé la fecha»: puedes decir solo su etapa.',
    sexoEtiqueta: '¿Es macho o hembra?',
    sexoMacho: 'Macho',
    sexoHembra: 'Hembra',
    sexoNoSe: 'No sé',
    origenEtiqueta: '¿Cómo llegó a tu casa?',
    origenAdoptado: 'Lo adopté',
    origenRefugio: 'Vino de un refugio',
    origenNacidoEnCasa: 'Nació en casa',
    origenEncontrado: 'Lo encontré',
    origenCriadero: 'Vino de un criadero',
    // ── paso 4/4
    paso4Titulo: 'Una foto de {{nombre}}',
    ahoraNo: 'Ahora no',
    // ── el cierre
    nombreFamilia: 'Familia de {{nombre}}',
    nombreFamiliaFallback: 'Mi familia',
    guardando: 'Preparando el lugar de {{nombre}}',
    errorTitulo: 'No pudimos guardar todavía',
    errorFotoPerdida: 'La foto no llegó hasta acá. Puedes probar de nuevo o seguir sin ella por ahora.',
    errorFoto: 'La foto no se pudo subir. Puedes probar de nuevo o seguir sin ella por ahora.',
    probarDeNuevo: 'Probar de nuevo',
    continuarSinFoto: 'Continuar sin foto',
    // ── el modal al crear (lámina: texto firmado; ver ① arriba)
    modalTitulo: '¿Quieres completar el perfil de {{nombre}}?',
    modalCuerpo:
      'Cuanto más sabemos de él, mejor lo podemos cuidar — y mejor le explicamos a quien lo atienda quién es.',
    modalCuando: 'Puedes hacerlo ahora o cuando quieras desde su perfil.',
    modalCompletar: 'Completar ahora',
    modalMasTarde: 'Más tarde',
    // ── la celda de entrada en el Hogar (vivía en `agregarMascota`)
    entradaDetalle: 'Cada quien con su propia historia.',
  },
  hogar: {
    // S91-C · LAS VOCES POR RAMA (orden de mesa, hallazgo de D). Tres
    // lectores caían en UNA frase —«no pudimos cargar el grooming» con
    // Reintentar— y dos de ellos ni eso: hacían `return` y se callaban.
    // Un síntoma que no se puede accionar es tan caro como el defecto que
    // oculta: el caso del founder llevó cuatro vueltas por esto.
    // Y la CONEXIÓN se nombra SOLO cuando es red: si la rama sabe que
    // falló un lector, lo dice.
    falloServicios: 'No pudimos traer tu historial de {{servicio}}',
    falloMascotas: 'No pudimos traer tus mascotas',
    falloCatalogo: 'No pudimos saber qué mascotas aplican a este servicio',
    falloDetalle: 'El resto de la pantalla funciona. Prueba de nuevo.',
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
    // S59 §7.1 LA VOZ ÚNICA ("en curso" murió del cliente) — GATE DE
    // STRINGS PENDIENTE (lote S59)
    paseoEnCurso: 'Paseo en vivo',
    // S60 — la celda viva dice la verdad del oficio (LOTE S60)
    groomingEnCurso: 'Estética en vivo',
    atencionEnCurso: 'Atención en vivo',
    // S60-A6 — TUS SERVICIOS: la posición por servicio (LOTE S60; el
    // título de la zona es PROPUESTA al pulgar del founder)
    serviciosTitulo: 'Tus servicios',
    // S71-A3 — PONTE AL DÍA (F2, letra founder) + el rail de servicios (F1).
    // LOTE PENDIENTE DE GATE FOUNDER. Tuteo neutro.
    ponteAlDia: 'Ponte al día',
    // S82-C (lámina posición-consolidada): RECOMENDACIONES — el conteo
    // mono de la cabecera + las filas nuevas (vacuna que vence · citas
    // de la semana). verYDecidir/verlo/verLaCita murieron con los CTAs
    // de tarjeta (las filas navegan enteras, Ley 37).
    recoUnaCosa: '1 cosa',
    recoCosas: '{{n}} cosas',
    recoVacunaDetalle: 'Agendar el refuerzo',
    // r6-2: las fichas murieron — su contenido son estas filas; la
    // fila-resumen de la semana murió con sus keys (Ley 37).
    recoCitaDe: 'La cita de {{mascota}}',
    recoCargarCarnet: 'Cargar el carnet de {{mascota}}',
    // 🔴 S100c-D · EL PEDIDO EN VUELO LLEGA AL HOGAR. La fila estaba
    // DECLARADA SIN MONTAR desde S82-C —*«monta cuando exista [el motor
    // de despensa]»*— y el motor existe desde S95. Voz por narrativa: la
    // más avanzada preside (lo que sigue, primero).
    recoPedidoEnCamino: 'Tu pedido va en camino',
    recoPedidoPreparando: 'Tu pedido se está preparando',
    recoPedidoConfirmado: 'Tu pedido está confirmado',
    // COLAPSA, y no es gusto: `DISEÑO_EXPERIENCIA` §10ter.1 firma que *«el
    // eje de Ponte al día no es el TIEMPO, es ACCIÓN vs INFORMACIÓN — lo
    // que espera acción preside y no colapsa; el colapso rige sobre lo
    // informativo»*. Un pedido en vuelo no espera nada del dueño.
    recoPedidosVarios: 'Tienes {{n}} pedidos en curso',
    venceEnMin: 'Vence en {{n}} min',
    presupuestoDe: 'Presupuesto de {{negocio}}',
    presupuestoPara: 'Presupuesto para {{mascota}}',
    presupuestoDetalle: '${{total}} por {{mascota}} · vence el {{fecha}}',
    porCoordinarTitulo: 'La cita de {{mascota}} espera fecha',
    railPaseos: 'Paseos',
    railEstetica: 'Estética',
    // S73 ítem 1: el rail mínimo-4 (LOTE S73, gate founder pendiente)
    railAdiestramiento: 'Adiestramiento',
    railVet: 'Veterinaria',
    railDescubre: 'Descubre',
    railError: 'No pudimos leer tus servicios.',
    railSaldoUna: '1 salida',
    railSaldo: '{{n}} salidas',
    // S61-A11 — el Hogar de Kary (LOTE S61, GATE PENDIENTE founder)
    // S82-C (lámina): "Tu vida" — filtro único por familia con glifo
    // (¿De quién?/¿Qué momentos? murieron: la mascota vive en el chip
    // del detalle y en su perfil); las voces del hecho (Ley 3 — el
    // código del evento jamás visible; desconocido degrada digno).
    vidaTitulo: 'Tu vida',
    filtroTodo: 'Todo',
    filtroSalud: 'Salud',
    filtroPaseos: 'Paseos',
    filtroBitacora: 'Bitácora',
    filtroAdiestramiento: 'Adiestramiento',
    filtroEstetica: 'Estética',
    filtroSinMomentos: 'Nada por acá con ese filtro.',
    hechoPaseo: 'Salió a pasear',
    hechoGrooming: 'Sesión de estética',
    hechoAdiestramiento: 'Sesión de adiestramiento',
    hechoVacuna: 'Recibió la vacuna {{nombre}}',
    hechoVacunaSinNombre: 'Recibió una vacuna',
    hechoConsulta: 'Visita al veterinario',
    // S91 · LOS HITOS. Voces FIRMADAS verbatim (founder, 8-ago-2026).
    // Solo la de llegada lleva {{nombre}}: «Una vida nueva empieza» sobre la
    // ficha de Thor no necesita decir Thor — así está firmado.
    hechoHitoVidaNueva: 'Una vida nueva empieza',
    hechoHitoLlegoALaFamilia: '{{nombre}} llegó a la familia',
    hechoHitoMundoNuevo: 'Un mundo nuevo empieza',
    hechoMomento: 'Momento de cuidado',
    vidaCargarMas: 'Cargar más',
    acordeonCargando: 'Cargando el momento',
    acordeonError: 'No pudimos cargar este momento.',
    acordeonSinDetalle: 'Este momento no dejó más detalle.',
    acordeonVerCompleto: 'Ver completo',
    fichaVerCita: 'Ver su cita',
    fichaVerCarnet: 'Ver su carnet',
    fichaCargarCarnet: 'Cargar su carnet',
    verEnVivo: 'Ver cómo va',
    proximaCita: 'Próxima cita',
    // D-319: el hold vigente del bloqueo 15 min — rima con checkout.holdVoz
    reservandoHorario: 'Reservando este horario',
    // ── Zona 4 (la vida) — funcional + aporte ──
    historiaEmpieza: 'La historia empieza acá.',
    historiaEmpiezaDetalle: 'Cada paseo, cada visita al vet, va a quedar guardada.',
    sinMascotas: 'Todavía no hay nadie por acá',
    sinMascotasDetalle: 'Agrega a tu mascota para empezar su historia.',
    errorHistoria: 'No pudimos cargar su historia',
    errorHistoriaDetalle: 'Revisa tu conexión y prueba de nuevo.',
    reintentar: 'Reintentar',
    // ── S58 patrón Hogar v2 — GATE DE STRINGS PENDIENTE (lote S58) ──
    // hero del próximo paseo: el CUÁNDO relativo en voz corta
    // subtítulos VIVOS del grupo de celdas (jamás descripción estática)
    agregarMascotaCelda: 'Agregar mascota',
    // S73 C3 (LOTE S73, gate founder pendiente): la frase literal del
    // founder partida en titulo+detalle de la celda
    adoptarCelda: 'Adopta a un nuevo miembro',
    adoptarCeldaDetalle: 'para tu familia',
  },
  coach: {
    // ── El Coach v0 (S53-B2b) — voz APROBADA por founder (cierre S53).
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
    // VOZ EMOCIONAL — APROBADA por founder (lote S55, es y en).
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
    // S91 · P1 — la edad HONESTA por precisión (lámina firmada).
    edadAprox: '~{{edad}}',
    edadHacia: 'hacia {{anio}}',
    // S91 · P1 — el origen en voz humana. `desconocido` NO tiene voz: el
    // silencio no se comenta.
    origenAdoptado: 'Lo adoptaron',
    origenRefugio: 'Llegó de un refugio',
    origenNacidoEnCasa: 'Nació en casa',
    origenEncontrado: 'Lo encontraron',
    origenCriadero: 'Llegó de un criadero',
    origenComprado: 'Llegó de otra familia',
    origenTransferido: 'Llegó de otra familia',
    origenAltaAsistida: 'Lo registró su veterinaria',
    edadUnMes: '1 mes',
    // ── secciones de la pila ──
    // S82-C (imagen-acuerdo del perfil): la sección pasa a SU HISTORIA;
    // + el header alto (editar/compartir/pastilla), los HECHOS y el CTA.
    vida: 'Su historia',
    editar: 'Editar',
    volver: 'Volver',
    compartir: 'Compartir',
    compartirMensaje: 'Conoce a {{nombre}} en e-PetPlace',
    pastillaAlDia: 'Cuidado al día',
    // r3 ③④ (literal transcrito, GATE EXIGIBLE — el founder confirma):
    // la voz del MOMENTO (M3 = el literal de la captura de Zeus; jamás
    // desempeño ni progreso — LOYALTY §3, guard R11) + la grilla de hoy.
    vozCardM1: '{{nombre}} está en sus primeros meses. Es el momento de las primeras vacunas y los primeros hábitos.',
    vozCardM2: '{{nombre}} está creciendo. Es el momento de socializar y aprender.',
    vozCardM3: '{{nombre}} está en plena adultez joven. Es el momento de asentar hábitos.',
    vozCardM4: '{{nombre}} está en una etapa de cuidado especial. Es el momento de seguir de cerca sus controles.',
    vozCardM5: '{{nombre}} está en sus años dorados. Es el momento de más calma y controles frecuentes.',
    vozProcedencia: 'Según su raza y edad',
    hoyTitulo: 'Cómo está hoy',
    hoyDesparasitacion: 'Desparasitación',
    hoyAlergias: 'Alergias',
    // S91 · P2 — el peso con su fecha y su puerta.
    pesoMedidoEl: 'medido el {{fecha}}',
    pesoRegistrar: 'Registrar el de hoy',
    hoySinRegistroCorto: 'Sin registro',
    pesoHojaTitulo: 'El peso de {{nombre}}',
    pesoHojaPorQue:
      'Cada peso se guarda con su fecha y los anteriores no se borran: así se ve cómo cambia, que es lo que sirve en una consulta.',
    pesoHojaLabel: '¿Cuánto pesa hoy?',
    pesoHojaPlaceholder: 'ej: 12,4',
    pesoHojaMetodo: '¿Cómo lo supiste?',
    pesoMetodoBascula: 'Con una báscula',
    pesoMetodoEstimado: 'Es un estimado',
    pesoHojaGuardar: 'Guardar el peso de hoy',
    hoySinRegistro: 'Sin registro',
    hoySinFechaRefuerzo: 'Sin fecha de refuerzo',
    ventanaHoy: 'Hoy',
    ventanaSemana: 'Última semana',
    ventanaMes: 'Último mes',
    vitalesSinSalidas: 'No salió a pasear en este tramo.',
    hoyAlDia: 'Al día',
    hoyFaltaUna: 'Falta una',
    hoyRefuerzoVencido: 'refuerzo vencido',
    hoyHasta: 'hasta {{fecha}}',
    hoyEnCarnet: '{{n}} en el carnet',
    hoyUltima: 'última {{fecha}}',
    // r5: vacunas agrupadas + la línea honesta del sin-dato + filtros
    // de tiempo de la historia.
    vacunas: 'Vacunas',
    verCarnetCompleto: 'Ver el carnet completo',
    // S89 orden 8 ⑤ — el papel del producto (descarga real)
    descargarCarnet: 'Descargar el carnet',
    descargarHistoria: 'Descargar la historia clínica',
    documentos: 'Documentos',
    // S96-D · la puerta de la despensa desde el expediente (§5.1)
    suAlimento: 'El alimento de {{nombre}}',
    // S91-C — la entrada a la bitácora desde el perfil. La voz habla de
    // OBSERVAR, no de adiestrar: el Eje 6 es del dueño, no de un oficio.
    bitacora: 'Su bitácora',
    // A10 (gate, 2ª pasada) — LA VOZ FIRMADA POR LA MESA. «Contanos» era
    // voseo y la app habla de tú («Ponte al día», «Elige», «Arrastra»); y el
    // subtítulo dice el PORQUÉ, que es lo que convierte un pedido en una
    // invitación.
    bitacoraDetalle: 'Lo que ves en casa completa su expediente.',
    descargarCarnetFalla: 'No pudimos preparar el carnet. Prueba de nuevo.',
    vacunasResumenUna: '1 vacuna en su carnet',
    vacunasResumen: '{{n}} vacunas en su carnet',
    hoySinRegistroLinea: 'Sin registro todavía: {{lista}}',
    filtroSemana: 'Esta semana',
    filtroMes: 'Este mes',
    // r7 (lámina ficha-mascota): la cuenta del rótulo, la voz serif del
    // expediente, la línea de los índices que NO existen, y el pie que
    // dice POR QUÉ reservar (la razón sale del expediente).
    vozExpediente: 'Su expediente se completa de a poco. Cada dato que sumas es uno menos que hay que adivinar en una urgencia.',
    indicesTodavia: 'Índice de salud y descanso se construyen con su expediente. Todavía no hay con qué.',
    // S91 · P5 — la narrativa del vínculo, en VOZ. El número que la elige
    // NUNCA se muestra (MODELO_LOYALTY §2: ni score, ni barra, ni checklist).
    vinculoMucho: 'Ya conocemos a {{nombre}} casi como tú.',
    vinculoAlgo: 'Vamos conociendo a {{nombre}}. Cada dato que sumas es uno menos que hay que adivinar en una urgencia.',
    vinculoPoco: 'Todavía estamos conociendo a {{nombre}}. Su expediente se completa de a poco.',
    // S91 · P7 — el acuario: su campo dos y su fecha propia.
    // S91 · P3 — la raza editable, con la gramática del alta.
    // S91 · P4 — la puerta de la bitácora, en Su historia.
    bitacoraEntrada: 'Cuéntanos algo de {{nombre}}',
    razaHojaTitulo: '¿De qué raza es {{nombre}}?',
    razaHojaGuardar: 'Guardar',
    tipoAgua: 'Agua',
    aguaDulce: 'Dulce',
    aguaMarino: 'Marino',
    montadoEl: 'Montado el',
    pieRotulo: 'Lo próximo',
    pieRazonVacuna: 'Su {{vacuna}} está vencida. Un control lo pone al día.',
    pieRazonSinCarnet: 'Todavía no hay vacunas cargadas de {{nombre}}. Un control abre su historia clínica.',
    pieRazonGeneral: 'Un control periódico mantiene el expediente de {{nombre}} al día.',
    reservarServicioDe: 'Reservar un servicio para {{nombre}}',
    pastillaAtencion: 'Necesita atención',
    pastillaConociendo: 'Conociéndolo',
    habitantes: 'Quiénes viven acá',
    habitantesDeclarar: 'Declarar quiénes viven acá',
    habitantesVacio: 'Todavía no contaste quiénes viven acá.',
    habitantesSinLeer: 'No pudimos cargar quiénes viven acá.',
    habitantesOtraLabel: 'Otra especie',
    habitantesOtraPlaceholder: 'La que no esté en la lista',
    habitantesOtraAgregar: 'Agregar esta especie',
    habitantesHojaTitulo: 'Quiénes viven en {{nombre}}',
    habitantesHojaAyuda: 'Elige las especies y cuenta cuántas hay de cada una. No hace falta que sea exacto.',
    habitantesHojaElegir: 'Especies',
    habitantesHojaGuardar: 'Guardar',
    pastillaPendientesUno: '1 por resolver',
    pastillaPendientes: '{{n}} por resolver',
    hechosPaseos: 'Paseos',
    hechosVacunas: 'Vacunas',
    reservarServicio: 'Reservar un servicio',
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
    // comparativa — SOLO con respaldo de datos (L-139); APROBADA S53:
    vitalesComparativa: 'Esta semana caminó más que la pasada.',
    bienestarVacio: 'Su actividad va a aparecer acá',
    bienestarVacioDetalle: 'Cada paseo con su recorrido queda guardado en su historia.',
    // ── índices educativos (§6.4: visibles, honestos-vacíos) ──
    // Voz educativa APROBADA por founder (cierre S53):
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
  // S55-A A3 (D-315): flujo carnet al riel (voseo→tuteo). La voz de
  // espera es la aprobada S48 VERBATIM; las traducciones EN quedaron
  // APROBADAS por founder (lote S55).
  // S82-A r5 — EL PLAN DE VACUNAS (contexto 1 de la lámina patron-2;
  // ADENDA al lote consolidado 2026-07-30, no un lote nuevo).
  // OJO: la tercera cifra dice "sin fecha de refuerzo", NO "sin
  // registro" — el plan base no existe en la DB (cat_vacunas es
  // vocabulario) y afirmar lo que falta sería L-139.
  planVacunas: {
    titulo: 'Las vacunas de {{nombre}}',
    pesoKg: '{{kg}} kg',
    cargando: 'Cargando sus vacunas',
    resumenAlDia: 'al día',
    resumenAtencion: 'necesita atención',
    resumenSinFecha: 'sin fecha de refuerzo',
    ejeTodo: 'Todo',
    ejeAlDia: 'Al día',
    ejeAtencion: 'Necesita atención',
    ejeSinFecha: 'Sin fecha',
    rotulo: 'Sus vacunas',
    hasta: 'hasta {{fecha}}',
    vencio: 'venció {{fecha}}',
    sinFecha: 'sin fecha de refuerzo',
    aplicada: 'Aplicada',
    tipo: 'Tipo',
    proximo: 'Próximo refuerzo',
    filtroVacio: 'Nada con ese filtro.',
    filtroVacioDetalle: 'Quítalo para ver todas sus vacunas.',
    verTodo: 'Ver todo',
    vacioTitulo: 'Su carnet todavía está vacío',
    vacioDetalle: 'Cárgalo con una foto y guardamos sus vacunas con sus fechas.',
    cargarCarnet: 'Cargar el carnet',
    errorTitulo: 'No pudimos traer sus vacunas',
    errorDetalle: 'Revisa tu conexión y prueba de nuevo.',
    reintentar: 'Reintentar',
  },
  // S82-A r9 — EL LOG DE VETERINARIA (D-493). ADENDA al lote
  // consolidado. OJO: "espera fecha" es el nulo honesto de D-439 — una
  // cita firme puede no tener día todavía.
  logVet: {
    titulo: 'Sus visitas al veterinario',
    cargando: 'Cargando sus visitas',
    esperaFecha: 'espera fecha',
    agendarDe: 'Agendar la visita de {{nombre}}',
    agendar: 'Agendar una consulta',
    desdeNota: 'El precio de cada consulta lo pone su veterinaria.',
    vacioProximos: 'No tiene visitas por venir',
    vacioProximosDetalle: 'Cuando agendes una consulta, va a aparecer acá.',
    vacioHistorial: 'Todavía no hay visitas guardadas',
    vacioHistorialDetalle: 'Cada consulta que reciba queda en su historia.',
    errorTitulo: 'No pudimos traer sus visitas',
  },
  carnet: {
    titulo: 'Carnet de vacunas',
    capturaTitulo: 'Sácale una foto al carnet de {{nombre}} — nosotros leemos las vacunas',
    capturaDetalle: 'Con buena luz y el carnet bien plano, mejor. Después vas a poder revisar y corregir todo antes de guardar.',
    multiPagina: '¿El carnet tiene varias páginas? Escanéalas de a una — cada tanda se suma a su historia.',
    espera: 'Estamos leyendo el carnet. Esto puede tardar un minuto — cada vacuna que encontremos se suma a su historia.',
    permisoCamara: 'Necesitamos permiso para usar la cámara. Puedes habilitarlo en los ajustes del teléfono, o elegir una foto de la galería.',
    sacarFoto: 'Sacarle una foto',
    masOpciones: 'Más opciones',
    sesionInactiva: 'Tu sesión no está activa. Vuelve a entrar e intenta de nuevo.',
    subidaLecturaLocal: 'No pudimos leer la foto del teléfono. Prueba sacarla de nuevo.',
    subidaArchivoGrande: 'La foto pesa demasiado. Prueba sacarla de nuevo.',
    subidaMime: 'Ese formato de imagen no está soportado. Prueba con una foto nueva.',
    subidaPolicy: 'No pudimos guardar la foto en tu espacio. Cierra sesión, vuelve a entrar y prueba de nuevo.',
    subidaRed: 'La foto no se pudo subir. Revisa tu conexión y prueba de nuevo.',
    sinVacunas: 'No encontramos vacunas legibles en esta foto. Puedes probar con otra, o volver a intentarlo en otro momento.',
    probarDeNuevo: 'Probar de nuevo',
    sacarOtraFoto: 'Sacar otra foto',
    volver: 'Volver',
    verCarnetCompleto: 'Ver el carnet completo',
    revisionGuia: 'Esto es lo que leímos. Toca una vacuna para corregirla — la fecha es necesaria para guardar.',
    tipoOpcional: 'Si tu carnet no trae el tipo de vacuna, no pasa nada. Puedes agregarlo después.',
    porCompletarUna: 'Hay 1 vacuna por completar antes de guardar.',
    porCompletar: 'Hay {{n}} vacunas por completar antes de guardar.',
    // S82 (vara CARNET: identidad, no registro): el verbo del flujo YA
    // era "sumar a su historia" (espera, multiPagina) — el CTA decía
    // "Guardar" (registro). El par CTA/éxito se alinea al mismo nombre
    // en todo el flujo (Ley 17.3).
    guardarUna: 'Sumar 1 vacuna a su historia',
    guardarN: 'Sumar {{n}} vacunas a su historia',
    exitoUna: 'Sumamos 1 vacuna a la historia de {{nombre}}',
    exitoN: 'Sumamos {{n}} vacunas a la historia de {{nombre}}',
    hojaGaleriaTitulo: 'Otra forma de cargar el carnet',
    elegirGaleria: 'Elegir de la galería',
    edicionTitulo: 'Revisa esta vacuna',
    nombreVacunaLabel: 'Nombre de la vacuna',
    tipoLabel: 'Tipo',
    tipoAyuda: 'Opcional. Ej: antirrábica, séxtuple, polivalente',
    fechaAplicoLabel: 'Cuándo se aplicó',
    fechaPlaceholder: 'Elige la fecha',
    fechaFutura: 'La fecha no puede ser futura.',
    guardarCambios: 'Guardar cambios',
    carnetDe: 'Carnet de {{nombre}}',
  },
  // S82-A — el encuadre de la foto de mascota (lámina 2026-07-29;
  // lote S82 pendiente de gate founder). Tuteo neutro (la lámina venía
  // en voseo — regla 27 manda).
  fotoEncuadre: {
    tituloEditar: 'La foto de {{nombre}}',
    elegirFoto: 'Elegir una foto',
    elegirDetalle: 'Elige una donde se le vea bien la cara. Puedes acomodarla después.',
    hojaTitulo: 'Su foto',
    camara: 'Sacar una foto',
    galeria: 'Elegir de la galería',
    permisoCamara: 'Necesitamos permiso para usar la cámara. Puedes habilitarlo en los ajustes del teléfono, o elegir una foto de la galería.',
    cargarOtra: 'Cargar otra foto',
    arrastra: 'Arrastra la foto para acomodarla.',
    acerca: 'Acerca con dos dedos para poder acomodar el encuadre.',
    // r3 — el hint jamás afirma una capacidad muerta (clase D-574)
    gestoMuerto: 'El ajuste no está respondiendo en este teléfono. Puedes guardar así — la foto queda centrada.',
    visorA11y: 'El encuadre de la foto de {{nombre}}. Pellizca para acercar y arrastra para acomodar.',
    asiSeVe: 'Así lo vas a ver',
    asiSeVeDetalle: 'El perfil respeta tu centro y abre el plano. Todo lo chico usa el encuadre exacto.',
    enPerfil: 'En su perfil',
    enHogar: 'En tu hogar y al elegir mascota',
    enSalaVet: 'En la sala del veterinario',
    alReservar: 'Al reservar, sin elegir',
    alReservarElegido: 'Al reservar, elegido',
    filaTitulo: 'Paseo de {{nombre}}',
    filaDetalle: 'sábado · 10:30',
    leyendaFila: 'En sus citas, y en el mapa mientras alguien lo pasea',
    listo: 'Listo',
    exito: 'La foto de {{nombre}} quedó lista.',
    editarFotoA11y: 'Cambiar la foto de {{nombre}}',
    errorCargar: 'No pudimos cargar la foto. Revisa tu conexión y prueba de nuevo.',
  },
  // S55-A A3 (D-315): detalle del paseo al riel (voseo→tuteo).
  paseo: {
    titulo: 'Paseo',
    tituloConFecha: 'Paseo · {{fecha}}',
    cargando: 'Cargando el paseo',
    errorTitulo: 'No pudimos cargar este paseo',
    errorDetalle: 'Revisa tu conexión y prueba de nuevo.',
    noEncontradoTitulo: 'No encontramos este paseo',
    noEncontradoDetalle: 'Puede que ya no esté disponible.',
    reintentar: 'Reintentar',
    volver: 'Volver',
    novedadFallback: 'Novedad del paseo',
    // ── S59 §7.3/§7.4 — la cara EN VIVO. GATE DE STRINGS PENDIENTE
    // (lote S59) ──
    vivoEmpezo: 'Empezó a las {{hora}}',
    vivoSinGps: 'Aún no recibimos la ubicación del paseador. El mapa se enciende solo cuando llega su señal.',
    actualizadoRecien: 'Actualizado recién',
    actualizadoHace: 'Actualizado hace {{min}} min',
    // S81-B (la cara MAPA — GATE PENDIENTE, lote S81): el asa de la banda
    bandaVerMas: 'Ver más del paseo',
    bandaPlegar: 'Plegar el detalle',
    verFoto: 'Ver foto {{i}} de {{total}}',
    deFuente: 'De {{fuente}}:',
    fotosDelPaseo: 'Fotos del paseo',
    // ── S62 — el umbral <2 del recorrido (letra founder, espejo del
    // motor 20260715150000). LOTE S62 (enmienda al lote aprobado) ──
    recorridoNoRegistrado: 'El recorrido de este paseo no alcanzó a registrarse.',
    recorridoNoRegistradoPorque: 'La señal de ubicación no estuvo disponible durante el recorrido. El resto del paseo quedó registrado con normalidad.',
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
    // S54-B3.1; S60: el grooming abrió — la voz nombra SOLO lo que falta
    agendarLlegaOtros: 'Agendar veterinaria llega pronto.',
    // S58 ruta del mundo — GATE DE STRINGS PENDIENTE (lote S58)
    paseoAgendable: 'Toca para entrar',
    paseadoresTitulo: 'Paseadores',
    paseadoresError: 'No pudimos cargar los paseadores',
    paseadoresVacio: 'Todavía no hay paseadores ofreciendo',
    paseadoresVacioDetalle: 'Un paseador acá cuida y documenta cada salida. Cuando uno active su agenda real, lo verás con su precio y horarios de verdad.',
    paseadoresNota: 'Precios y horarios reales de cada paseador. Elegir horario y pagar desde acá llega pronto.',
    // S54-B3.2 — momento-primero: el CUÁNDO y el QUIÉN
    paseoTitulo: 'Paseo',
    // r14-6 (literal del founder) — el label del cabezal, ahí donde
    // murió la banda de color. Al LOTE CONSOLIDADO de strings que armó A.
    agendaPaseos: 'Agenda Paseos',
    cuandoDia: 'Día',
    cuandoHora: 'Hora de inicio',
    cuandoDuracion: 'Duración',
    cuandoElegir: 'Elegir',
    cuandoHoy: 'Hoy',
    cuandoManana: 'Mañana',
    verQuienPuede: 'Ver quién puede',
    // S55-B4 — el CUÁNDO tipo Teams: duración → día → grilla de inicios
    cuandoSalidaBano: 'La salida al baño.',
    cuandoDesde: 'desde ${{precio}}',
    cuandoPrecio: '${{precio}}',
    // r15 · EL DÍA CERRADO — el estado que hasta hoy no se podía
    // decir: "cierra los domingos" viajaba con la voz de "no hay lugar".
    // r15-bis · LA MASCOTA QUE NO RESUELVE — la falla RUIDOSA. Antes
    // esto no tenía voz porque la pantalla elegía otra en silencio.
    mascotaNoReservable: '{{nombre}} no puede reservar un paseo',
    mascotaNoEncontrada: 'No encontramos esa mascota',
    mascotaNoReservableDetalle: 'No armamos la reserva para no hacerla con la mascota equivocada. Elige tú a quién.',
    elegirOtraMascota: 'Elegir a quién',
    cuandoDiaCerrado: 'Ese día no se atiende',
    cuandoDiaCerradoPorque: 'El negocio no abre ese día. Elige otro y seguimos.',
    cuandoSinIniciosPorque: 'Los paseadores no tienen lugar libre ese día para esa duración.',
    cuandoSinInicios: 'Ese día no hay horarios libres para este bloque. Prueba con otro día.',
    // S61-A5 cura 1 — §6ter: el camino tocable del día sin lugar (LOTE S61)
    sinIniciosProbarDia: 'Probar {{dia}}',
    quienTitulo: 'Paseadores disponibles',
    catalogoErrorTitulo: 'No pudimos cargar qué mascotas aplican',
    catalogoErrorDetalle: 'Revisa tu conexión y prueba de nuevo. Preferimos no ofrecerte de más.',
    nadiePuede: 'Nadie puede a esa hora',
    nadiePuedeDetalle: 'Prueba con otro horario u otro día.',
    probarOtroHorario: 'Probar otro horario',
    // S56 D-341 — GATE PENDIENTE founder (lote S56): la voz de cliente
    // para prestador_no_disponible (bloqueos/vacaciones del paseador).
    prestadorNoDisponible: 'El paseador no está disponible en esas fechas — prueba otro horario.',
    elegirMascota: '¿Para quién es el paseo?',
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
    proxPrime: 'e-PetPlace Prime',
  },
  // S54-B3.3 — checkout mono-ítem con forma de carrito
  checkout: {
    titulo: 'Confirmar y pagar',
    resumen: 'Tu paseo',
    cupon: 'Cupón',
    cuponPronto: 'Pronto',
    total: 'Total',
    holdVoz: 'Te guardamos este horario por 15 minutos.',
    procesando: 'Procesando el pago…',
    pagar: 'Pagar',
    /* 🔴 LA BANDA DE «SIMULADO» SIGUE VIVA, Y NO ES UN OLVIDO — es la verdad
       de TRES puertas que todavía no cobran: el PLAN de paseo, el PAQUETE de
       salidas y el PROGRAMA de adiestramiento (`plan-hoja`, `paquete-hoja`,
       `confirmar-programa`). Esas tres siguen contratando por su RPC, sin
       tocar la tarjeta.
       ☠️ De donde SÍ murió es de la reserva suelta —el checkout de los cuatro
       oficios—, que desde S101-C cobra de verdad.
       *La encontró el typecheck al borrarla: mi censo había mirado una sola
       puerta y las otras tres decían la verdad. Borrar la banda de las tres
       habría convertido tres avisos honestos en tres silencios falsos.* */
    simuladoAviso: 'Fase de pruebas: el pago es simulado — no se cobra nada real.',
    exitoTitulo: 'Paseo confirmado',
    exitoDetalle: 'Ya está en la agenda del paseador. Lo verás en tu Hogar.',
    volverHogar: 'Ir al Hogar',
    // ☠️ S101-C · MURIERON `rechazado`, `rechazadoDetalle`, `reintentar`,
    //    `timeout` y `timeoutDetalle` (Ley 37): eran las pantallas enteras del
    //    simulador. Con el cobro real un fallo es un AVISO y la familia se
    //    queda en el resumen con su hold vivo — y `timeoutDetalle` decía
    //    literalmente «en esta fase simulada», que ya era falso.
    holdVencido: 'Este horario se liberó',
    holdVencidoDetalle: 'Pasaron los 15 minutos del apartado. Elige otro horario.',
    elegirOtro: 'Elegir otro horario',
    // S56-A D-339 — GATE PENDIENTE founder (lote S56)
    direccionTitulo: '¿A qué puerta llegamos?',
    direccionVoz: 'Para que el paseador sepa dónde buscar a tu mascota.',
    direccionAgregar: 'Cuéntanos tu dirección',
    direccionCambiar: 'Cambiar',
    direccionLista: 'El paseo llega a esta puerta.',
  },
  // S56-A D-338 — el plan de paseo. GATE PENDIENTE founder (lote S56).
  // ── P19 (S59-A4) — la socialización del paseo grupal. GATE DE
  // STRINGS PENDIENTE (lote S59) ──
  // S61-A1 (FALLA-J1) — la voz del comprable en el riel, por código
  // (LOTE S61, GATE PENDIENTE founder). El paseo reusa explorar.paseoTitulo.
  servicioVoz: {
    grooming: 'Baño',
    groomingCompleto: 'Baño y corte',
    adiestramiento: 'Adiestramiento',
    // S68-A2 — el mundo vet (LOTE S68 APROBADO founder, 18 Jul 2026)
    consultaGeneral: 'Consulta',
    vacunacion: 'Vacunación',
    urgenciaLocal: 'Urgencia en clínica',
    urgenciaDomicilio: 'Urgencia a domicilio',
  },
  // S68-A2 — la reserva vet del dueño (V2: mascota→qué→día→hora→quién→
  // pagar sobre el chasis compartido). LOTE S68 APROBADO founder (18 Jul 2026).
  veterinaria: {
    titulo: 'Veterinaria',
    paraQuien: '¿Para quién es?',
    servicioEtiqueta: '¿Qué necesita?',
    precioDesde: 'Para {{nombre}}: desde ${{precio}}',
    precioExacto: 'Para {{nombre}}: ${{precio}}',
    urgenciaSoloHoy: 'Las urgencias se reservan para hoy, dentro del horario de cada veterinario.',
    urgenciaSinLugarHoy: 'Hoy no queda lugar para urgencias por la app. Si es grave, contacta a tu veterinario directamente.',
    eligeMascota: 'Elige arriba a tu mascota para ver la agenda.',
    sinInicios: 'Ese día no hay horarios con lugar.',
    vacioTitulo: 'Todavía no hay veterinarios con agenda',
    vacioDetalle: 'Estamos sumando clínicas. Vuelve pronto.',
    errorTitulo: 'No pudimos cargar la agenda.',
    sinMascotasTitulo: 'Tu hogar todavía no tiene mascotas',
    sinMascotasDetalle: 'Agrega a tu mascota para reservar su cita.',
    quienTitulo: 'Quién puede atender',
    ventanaPara: 'La cita de {{nombre}}',
    enSuClinica: 'En su clínica',
    vaAlHogar: 'Va a tu hogar',
    precioDeOferta: 'El precio es el de cada veterinario para este servicio.',
    checkoutResumen: 'Tu cita veterinaria',
    exitoTitulo: '¡Cita reservada!',
    exitoDetalle: 'Vas a ver la cita en el perfil de tu mascota.',
    dondeTitulo: 'Dónde es',
    dondeDomicilioTitulo: 'A dónde va el veterinario',
    direccionDomicilioVoz: 'Para la urgencia a domicilio necesitamos la dirección de tu hogar.',
    // S78-A7 — el selector de persona (LETRA_VITRINA; solo se ve con
    // vitrina encendida y 2+ personas ofertables — colapso N=1 es diseño)
    conQuienTitulo: '¿Con quién?',
    conQuienVoz: 'Si quieres, elige quién atiende. Si no, {{negocio}} asigna a alguien de su equipo.',
    cualquieraEquipo: 'Cualquiera del equipo',
    integranteEquipo: 'Integrante del equipo',
    conQuienConfirmar: 'Continuar',
    personaNoPudo: 'Justo a esa hora no puede — pero la clínica sí.',
    dejarQueAsigne: 'Dejar que la clínica asigne',
    atiendeTitulo: 'Quién atiende',
  },
  // S63-A Bloque 3 — la reserva de adiestramiento del dueño + el parte
  // (LOTE S63, gate founder pendiente)
  adiestramiento: {
    titulo: 'Adiestramiento',
    quienTitulo: 'Quién puede',
    paraQuien: 'Para quién',
    errorTitulo: 'No pudimos cargar el adiestramiento.',
    sinElegiblesTitulo: 'El adiestramiento es para perros',
    sinElegiblesDetalle: 'Tu hogar todavía no tiene un perro registrado.',
    comprableEtiqueta: 'Qué quieres reservar',
    comprableSesion: 'Sesión suelta',
    comprablePrograma: 'Programa completo',
    // r32 · EL SIGNIFICADO DEL DÍA CAMBIA CON EL COMPRABLE, y se dice
    // DONDE se decide: con programa el día no es cuándo ES, es cuándo
    // EMPIEZA. La voz honesta del QUÉ explica; estos rótulos avisan.
    cuandoEmpieza: 'Cuándo empieza',
    horaPrimera: 'Hora de la primera',
    comprableProgramaVoz:
      'Un programa son varias sesiones ordenadas, una por semana, con el mismo adiestrador. Eliges la fecha y hora de la primera y las demás se agendan solas.',
    vacioTitulo: 'Todavía no hay adiestradores disponibles',
    vacioDetalle: 'Estamos sumando adiestradores. Vuelve pronto.',
    sinInicios: 'Ese día no tiene horarios con lugar.',
    ventanaPara: 'Sesión para {{nombre}}',
    lugarPorConfirmar: 'El adiestrador confirma el lugar',
    nivelBasico: 'Programa básico',
    nivelMedio: 'Programa medio',
    nivelExperto: 'Programa experto',
    nivelEspecialidad: 'Especialidad',
    sesionesN: '{{n}} sesiones',
    checkoutResumen: 'Tu sesión de adiestramiento',
    exitoTitulo: 'Sesión reservada',
    exitoDetalle: 'El adiestrador ya tiene tu sesión en su agenda.',
    dondeTitulo: 'Dónde',
    resumenProgramaTitulo: 'Tu programa',
    resumenSesiones:
      'Las {{n}} sesiones se agendan ahora: una por semana, a las {{hora}}, desde el {{fecha}}.',
    resumenUltima: 'La última sesión queda el {{fecha}}.',
    resumenVigencia: 'Tienes {{dias}} días desde hoy para completarlas.',
    resumenMover: 'Puedes mover una sesión con 24 horas de aviso.',
    comprarPrograma: 'Comprar programa',
    procesandoPrograma: 'Confirmando tu programa…',
    programaExitoTitulo: 'Programa agendado',
    programaExitoDetalle:
      'Las {{n}} sesiones quedaron en la agenda: la primera el {{primera}} y la última el {{ultima}}. Vigencia hasta el {{vigencia}}.',
    irAlHogar: 'Ir al Hogar',
    hubTitulo: 'Adiestramiento',
    agendarDe: 'Agendar la sesión de {{nombre}}',
    agendar: 'Agendar',
    hubProximos: 'Próximos',
    hubHistorial: 'Historial',
    hubProximosVacioTitulo: 'Sin sesiones agendadas',
    hubProximosVacioDetalle: 'Cuando reserves, tus sesiones viven acá.',
    hubHistorialVacioTitulo: 'Todavía sin sesiones realizadas',
    hubHistorialVacioDetalle: 'El parte de cada sesión cerrada vive acá.',
    sesionKdeN: 'Sesión {{k}} de {{n}}',
    sesionK: 'Sesión {{k}}',
    // la bitácora de la familia (§7) — sin gamificación (LOYALTY §5)
    bitacoraTab: 'Bitácora',
    bitacoraAnotar: 'Anotar algo',
    bitacoraVacioTitulo: 'La bitácora está esperando',
    bitacoraVacioDetalle: 'Lo que observes de tu perro entre sesiones vive acá — y su adiestrador lo lee antes de cada sesión.',
    bitacoraHojaTitulo: '¿Qué observaste?',
    // S65 §7 — grupos del vocabulario (convención viva de DB: catálogo
    // de conductas + nivel del currículum) + autocompletado (LOTE S65)
    bitacoraGrupoCasa: 'En casa',
    bitacoraGrupoBasico: 'Comandos básicos',
    bitacoraGrupoMedio: 'Nivel medio',
    bitacoraGrupoExperto: 'Nivel experto',
    bitacoraGrupoOtros: 'Otros avances',
    bitacoraSugerencias: '¿Es alguna de estas?',
    // S65 — filtro rápido + acordeón de grupos (LOTE S65, gate founder)
    bitacoraFiltroLabel: 'Busca una observación',
    bitacoraFiltroPlaceholder: 'ej: ladró, correa, puerta',
    bitacoraTextoLabel: 'Cuéntanos más (opcional)',
    bitacoraTextoPlaceholder: 'ej: hoy se sentó solo antes de comer',
    bitacoraGuardar: 'Guardar',
    bitacoraGuardada: 'Observación guardada',
    verParte: 'Ver el parte',
    parteTitulo: 'El parte de la sesión',
    parteError: 'No pudimos cargar el parte.',
    parteObjetivos: 'Lo que trabajaron',
    parteAlcanzadoVoz: 'Lo logró',
    parteNotas: 'Nota del adiestrador',
    parteClips: 'Los videos de la sesión',
    parteInstrucciones: 'Para practicar en casa',
    parteMensajeTitulo: 'Del adiestrador para ustedes',
    progresionFrase:
      '{{nombre}} ya domina {{n}} de los {{total}} comandos de su programa.',
    progresionFraseSinTotal: '{{nombre}} ya domina {{n}} comandos de su programa.',
    progresionFraseCero: 'El programa de {{nombre}} está en marcha.',
  },
  // S60-A1 — la reserva de grooming del dueño (LOTE S60, gate founder)
  grooming: {
    titulo: 'Estética y baño',
    quienTitulo: 'Groomers disponibles',
    errorTitulo: 'No pudimos cargar el grooming',
    sinElegiblesTitulo: 'Todavía no hay a quién bañar',
    sinElegiblesDetalle: 'El grooming es para perros y gatos. Suma a tu mascota y reserva su primer baño.',
    paraQuien: '¿Para quién es?',
    // §3 — la pregunta única de talla y pelaje (patrón P19)
    tallaFaltaTitulo: 'Nos falta su talla',
    tallaFaltaDetalle: 'Para darte el precio justo de {{nombre}}, declara su talla y pelaje una vez. Queda en su perfil y lo puedes editar siempre.',
    tallaDeclarar: 'Declarar talla y pelaje',
    tallaHojaTitulo: 'Talla y pelaje',
    tallaHojaVoz: 'Se declara una vez y queda en el perfil de {{nombre}} — el precio del grooming es por talla, con extra si el pelaje es largo. Lo puedes editar cuando quieras.',
    tallaEtiqueta: 'Talla',
    tallaS: 'Pequeño',
    tallaM: 'Mediano',
    tallaL: 'Grande',
    pelajeLargo: 'Pelaje largo',
    pelajeLargoDetalle: 'El pelaje largo suma un extra del groomer.',
    tallaGuardar: 'Guardar en su perfil',
    tallaCeldaTitulo: 'Talla y pelaje',
    tallaEstadoSinDeclarar: 'Sin declarar',
    pelajeLargoCorto: 'pelaje largo',
    // S61-A6 — D-392 domicilio del dueño (LOTE S61, GATE PENDIENTE)
    dondeEtiqueta: '¿Dónde?',
    modalidadLocal: 'En el local',
    modalidadDomicilio: 'A domicilio',
    modalidadDomicilioRecargo: 'A domicilio · +${{recargo}}',
    modalidadDomicilioRecargoDesde: 'A domicilio · desde +${{recargo}}',
    dondeDomicilioTitulo: 'A dónde vamos',
    direccionDomicilioVoz: 'Para ir a tu casa necesitamos tu dirección. Se guarda una vez y la puedes editar siempre.',
    desgloseServicio: 'servicio',
    desgloseExtraPelaje: 'pelaje largo',
    desgloseDomicilio: 'domicilio',
    // S61-A5 cura 3 — el peldaño 0 sin mascota (LOTE S61, GATE PENDIENTE;
    // la letra del pedido decía "Contanos" — transpuesta a tuteo, regla 27)
    precioDesdePublico: 'Desde ${{precio}} — el precio final es por su talla',
    horariosSinMascotaTitulo: 'Cuéntanos para quién es',
    horariosSinMascotaDetalle: 'Elígela arriba y te mostramos los horarios con su precio.',
    // el CUÁNDO adaptado: servicio → hora (la duración es consecuencia)
    vacioTitulo: 'Todavía no hay groomers ofreciendo',
    vacioDetalle: 'Un groomer acá baña, corta y documenta cada sesión en su historia. Cuando uno active su oferta real, lo verás con precios de verdad.',
    servicioEtiqueta: 'Servicio',
    precioDesde: 'Para {{nombre}}: desde ${{precio}}',
    precioExacto: 'Para {{nombre}}: ${{precio}}',
    sinInicios: 'Ese día no hay horarios libres. Prueba con otro día.',
    // el QUIÉN con el precio resuelto + el DÓNDE (v1 en el local)
    ventanaPara: 'Grooming para {{nombre}}',
    enSuLocal: 'En el local del groomer',
    precioDeSuPerfil: 'El precio ya es el de {{nombre}}: su talla y pelaje viven en su perfil.',
    dondeTitulo: 'A dónde ir',
    // el EN VIVO del dueño — sin mapa: la mascota preside (§8)
    vivoTitulo: 'Estética y baño',
    vivoTituloConFecha: 'Estética del {{fecha}}',
    vivoEstado: '{{nombre}} está en manos de su groomer.',
    vivoEstadoGenerico: 'Tu mascota está en manos de su groomer.',
    fotosDeLaSesion: 'Fotos de la sesión',
    // S61-A2 — el parte entero (LOTE S61, GATE PENDIENTE founder)
    parteCuidados: 'Los cuidados de la sesión',
    proximaSugerida: 'Próxima sesión sugerida: {{fecha}}',
    // S60-A4 — el hub del dueño (LOTE S60)
    hubTitulo: 'Mis sesiones de estética',
    agendarDe: 'Agendar el grooming de {{nombre}}',
    agendar: 'Agendar una sesión',
    hubProximosVacio: 'Sin sesiones próximas',
    hubProximosVacioDetalle: 'Cuando reserves, la verás acá con su lugar y su hora.',
    hubHistorialVacio: 'Todavía no hay sesiones cerradas',
    hubHistorialVacioDetalle: 'Cada sesión cerrada deja su parte con fotos en su historia.',
    // CURA S60-C1 — la voz del checkout resuelve por oficio (LOTE S60)
    checkoutResumen: 'Tu sesión de estética',
    exitoTitulo: 'Estética y baño confirmado',
    exitoDetalle: 'Ya está en la agenda de su groomer. Lo verás en tu Hogar.',
  },
  // CURA S60-C1 — voz NEUTRA de las caras pre-carga de la atención
  // (el oficio aún no se conoce; jamás "paseo" a ciegas) (LOTE S60)
  atencion: {
    titulo: 'Atención',
    cargando: 'Cargando la atención',
    errorTitulo: 'No pudimos cargar esta atención',
    noEncontradoTitulo: 'No encontramos esta atención',
  },
  paseoSocial: {
    declaracion: 'Los paseos suelen ser con más de un perro a la vez.',
    celdaTitulo: 'Paseos en grupo',
    pregunta: '¿{{nombre}} se lleva bien paseando con otros perros?',
    si: 'Sí, se lleva bien',
    no: 'No, prefiere pasear solo',
    noVoz: 'Por ahora los paseos son en grupo. Estamos armando algo para {{nombre}}.',
    noVozCamino: 'Tu respuesta queda guardada y la puedes cambiar cuando quieras desde su perfil.',
    entendido: 'Entendido',
    estadoSi: 'Se lleva bien con otros perros',
    estadoNo: 'Prefiere pasear solo',
    estadoSinResponder: 'Sin responder',
  },
  plan: {
    chip: 'Hacerlo frecuente',
    chipDetalle: 'Un plan mensual con tu paseador — elige quién pasea y lo armamos.',
    chipElegiPrimero: 'Elige duración, día y hora primero.',
    hojaTitulo: 'Tu plan de paseo',
    hojaVoz: 'Un pago al mes y tus salidas quedan agendadas todo el período.',
    diasEtiqueta: '¿Qué días?',
    dia0: 'D',
    dia1: 'L',
    dia2: 'M',
    dia3: 'X',
    dia4: 'J',
    dia5: 'V',
    dia6: 'S',
    diasNoCubre: '{{nombre}} no pasea los días apagados.',
    // S59 §6.1 — plan L-V, voz con camino. GATE PENDIENTE (lote S59)
    findeVoz: 'Los fines de semana se reservan sueltos o con tu paquete.',
    cargandoDias: 'Mirando la agenda del paseador',
    frecuenciaEtiqueta: '¿Cada cuánto?',
    frecuenciaSemanal: 'Cada semana',
    frecuenciaQuincenal: 'Cada dos semanas',
    frecuenciaMensual: 'Una vez al mes',
    renovacionEtiqueta: 'Renovación',
    renovacionVoz: 'Si se renueva, te avisamos 72 horas antes. Pausar es un toque desde Mis paseos.',
    // S79 (reforma): el plan es suscripción MENSUAL — el precio es del mes.
    precioMes: 'Precio del mes',
    salidasEstimadas: 'Salidas este mes',
    mesNota: 'Pagas el mes completo. Las salidas que no uses no se descuentan.',
    noOfrecido: 'Este paseador no ofrece plan mensual. Puedes reservar suelto o con paquete.',
    contratar: 'Contratar plan (simulado)',
    exito: 'Plan contratado — {{n}} salidas quedaron agendadas.',
    hubTitulo: 'Mis paseos',
    segProximos: 'Próximos',
    segHistorial: 'Historial',
    // S60-A6 pieza 2 — la lista fusionada (LOTE S60): Agenda murió
    filaTitulo: 'Paseo de {{nombre}}',
    citaDePlan: 'De tu plan',
    estadoActiva: 'Activo',
    estadoPausada: 'Renovación pausada',
    estadoVencida: 'Terminado',
    renuevaEl: 'Se renueva el {{fecha}}',
    terminaEl: 'Termina el {{fecha}}',
    pausar: 'Pausar renovación',
    reanudar: 'Reanudar renovación',
    pausado: 'Listo — tu plan no se renueva.',
    reanudado: 'Listo — tu plan se renueva cada mes.',
    mover: 'Mover',
    moverTitulo: 'Mover esta salida',
    moverVoz: 'Dentro del período de tu plan y con tu mismo paseador.',
    moverDia: '¿A qué día?',
    moverHora: '¿A qué hora?',
    moverSinHoras: 'Ese día no tiene horarios libres.',
    movida: 'Listo — la salida se movió.',
    sinPlanesTitulo: 'Todavía no tienes un plan',
    sinPlanesDetalle: 'Cuando agendes un paseo, tócale "Hacerlo frecuente" y tu plan nace ahí.',
    // S58 hub v2 — GATE DE STRINGS PENDIENTE (lote S58)
    filtroTodos: 'Todos',
    agendarDe: 'Agendar el paseo de {{nombre}}',
    elegiMascota: 'Elige a quién le quieres reservar.',
    agendarPaseo: 'Agendar un paseo',
    // r30 · la ETIQUETA del apagado nombra lo que falta (S63-B: el
    // apagado dice QUÉ FALTA, SIEMPRE — el hint no lo reemplaza).
    agendarFaltaMascota: 'Elige a quién primero',
    vacioSegmento: 'Nada por aquí todavía.',
    salidaCompletada: 'Completada',
    salidaCancelada: 'Cancelada',
  },
  // S57-A D-343 — el paquete de salidas. GATE PENDIENTE founder (lote S57).
  paquete: {
    chip: 'Comprar un paquete',
    chipDetalle: 'Salidas por adelantado con un paseador — las reservas cuando quieras, sin agendar nada hoy.',
    chipElegiDuracion: 'Elige una duración primero.',
    pantallaTitulo: 'Paquetes de salidas',
    nadieOfrece: 'Nadie ofrece paquetes para esta duración todavía',
    nadieOfreceDetalle: 'Ya lo sabemos y estamos buscando. Puedes agendar salidas sueltas mientras tanto.',
    hojaTitulo: 'Tu paquete de salidas',
    hojaVoz: 'Salidas de {{min}} minutos con {{nombre}}, para cualquiera de tus perros. Compras hoy y reservas cada salida cuando la necesites.',
    primeraTitulo: 'Paquete comprado',
    primeraVoz: '¿Reservas tu primera salida? También puedes hacerlo después, desde Mis paseos.',
    primeraReservar: 'Reservar mi primera salida',
    primeraDespues: 'Después',
    saldoActivo: 'Tu paquete está activo — elige día y hora, y al elegir paseador usas tu saldo.',
    comprarMas: 'Comprar más salidas',
    // S58 hub v2 — GATE DE STRINGS PENDIENTE (lote S58)
    teQuedan: 'Te quedan {{n}} salidas',
    teQuedaUna: 'Te queda 1 salida',
    sinPerrosTitulo: 'El paseo es para perros',
    sinPerrosDetalle: 'Tu hogar todavía no tiene un perro registrado. Cuando lo agregues, el paseo se abre solo.',
    sinPerrosAccion: 'Agregar a mi perro',
    // D-727: el paseo TENÍA prestada la key 'grooming.ventanaPara' y decía
    // «Grooming para Thor» en la pantalla de paseadores. Cada oficio dice lo
    // suyo — copiar el literal a mano habría repetido el defecto en el otro idioma.
    ventanaPara: 'Paseo para {{nombre}}',
    /* P0 (9-ago-2026) · GATE DE STRINGS PENDIENTE. Nacen porque la pantalla
       decía «tu hogar todavía no tiene un perro registrado» cuando el catálogo
       de especies aún no había llegado — con dos perros vivos en el hogar. No
       tener perros y no saber todavía son dos cosas distintas y una de las dos
       era mentira. */
    catalogoCargandoTitulo: 'Un segundo',
    catalogoCargandoDetalle: 'Estamos terminando de cargar los datos del paseo. Prueba de nuevo en un momento.',
    catalogoErrorTitulo: 'No pudimos cargar los datos del paseo',
    catalogoErrorDetalle: 'Revisa tu conexión y vuelve a entrar. Tus mascotas están bien: lo que no llegó es la información del servicio.',
    /* 🔴 P0 REABIERTO (9-ago) — GATE PENDIENTE. Las MASCOTAS también tienen
       tres estados, y sin estas voces el fallo de su lectura se contestaba
       con «tu hogar no tiene un perro registrado»: una afirmación sobre el
       hogar de alguien, hecha sobre un dato que nunca llegó. */
    misMascotasCargandoTitulo: 'Un segundo',
    misMascotasCargandoDetalle: 'Estamos terminando de cargar tus mascotas. Prueba de nuevo en un momento.',
    misMascotasErrorTitulo: 'No pudimos cargar tus mascotas',
    misMascotasErrorDetalle: 'Están bien: lo que falló es la conexión con tus datos, no ellas. Prueba de nuevo.',
    presetsEtiqueta: '¿Cuántas salidas?',
    presetSalidas: '{{n}} salidas',
    vigenciaVoz: 'Las salidas duran un mes desde la compra. Si compras otro paquete antes de esa fecha, las que no usaste se suman al nuevo.',
    rolloverVoz: 'Tienes {{n}} salidas sin usar — se suman a este paquete al comprarlo.',
    precioPorSalida: 'Precio por salida',
    total: 'Total',
    comprar: 'Comprar paquete (simulado)',
    exito: 'Paquete comprado — tienes {{n}} salidas para reservar.',
    eleccionTitulo: 'Tienes un paquete con este paseador',
    eleccionVoz: 'Te quedan {{n}} salidas — puedes usar una o pagar este paseo aparte.',
    reservarConPaquete: 'Reservar con tu paquete',
    pagarSuelto: 'Pagar este paseo suelto',
    reservada: 'Salida reservada — te quedan {{n}} en el paquete.',
    tarjetaTitulo: 'Paquete de salidas · {{min}} min',
    venceEl: 'Vence el {{fecha}}',
    citaDePaquete: 'Con tu paquete',
    ventanasVoz: 'Puedes cancelar hasta 2 horas antes y la salida vuelve a tu paquete. Con menos de 2 horas, la salida se usa.',
    cancelarReserva: 'Cancelar esta salida',
    cancelada: 'La salida volvió a tu paquete — tienes {{n}} disponibles.',
  },
  // S57-A P18 — cancelación y reagenda del paseo suelto. GATE PENDIENTE founder (lote S57).
  suelto: {
    citaSuelta: 'Paseo suelto',
    detalleTitulo: 'Este paseo',
    ventanasVoz: 'Puedes cancelar hasta un día antes; después, solo reagendarlo. Con menos de 2 horas, el paseo se pierde.',
    reagendar: 'Reagendar',
    cancelar: 'Cancelar el paseo',
    cancelado: 'Paseo cancelado — devolución simulada de ${{monto}} registrada.',
    reagendado: 'Listo — el paseo se movió.',
    reagendarTitulo: 'Reagendar este paseo',
    reagendarVoz: 'A otro horario real de tu mismo paseador. Tu pago viaja con el paseo.',
    sinOferta: 'Tu paseador ya no ofrece esta duración — escríbenos a soporte.',
    salidaPerdida: 'Se perdió',
  },
  // S56-A D-339 — la dirección del hogar. GATE PENDIENTE founder (lote S56).
  direccion: {
    titulo: 'Tu dirección',
    voz: 'La puerta de tu hogar — donde el paseador busca y devuelve a tu mascota.',
    direccionLabel: 'Dirección',
    direccionPlaceholder: 'ej: Av. González Suárez N32-14, depto 5B',
    ciudadLabel: 'Ciudad',
    sectorLabel: 'Sector o barrio (opcional)',
    referenciasLabel: 'Referencias para llegar (opcional)',
    referenciasAyuda: 'ej: portón azul, timbre 2',
    guardar: 'Guardar dirección',
    guardada: 'Listo — tu dirección quedó guardada.',
    // S79-A4 — la resolución Places: la ubicación existe solo si se buscó.
    ubicada: 'Ubicada en el mapa.',
    // S96-D — el punto movible (LETRA_RECORRIDO §7): si Places no
    // encuentra la casa, el punto igual existe.
    sinResultados: 'No encontramos esa dirección. Escríbela igual y pon el punto a mano en el mapa.',
    /* A-03 (S100c) · el buscador apagado LO DICE. Antes se apagaba en silencio
       y desde la pantalla se veía igual que «no encontré nada» y que «estoy
       buscando» — tres estados con una sola pinta (L-218).
       Espeja `lugares.ts:81` y no lo reusa: D-539, `packages/api` habla español
       fijo y no sabe traducir. */
    /* S100c · la libreta de direcciones. El nombre es la LLAVE con la que la
       persona reconoce el lugar; la calle es el detalle. */
    aliasLabel: 'Nombre de esta dirección',
    aliasAyuda: 'Para reconocerla después: «Oficina», «Casa de mamá».',
    agregarOtra: 'Agregar otra dirección',
    buscadorApagado: 'La búsqueda de direcciones no está disponible por ahora. Escríbela a mano y pon el punto en el mapa.',
    puntoEtiqueta: 'Mueve el mapa para ajustar el punto de entrega',
    puntoAyuda: 'Ajusta el mapa hasta que el pin quede sobre tu puerta. Es lo que el repartidor va a buscar.',
    ponerPunto: 'Poner el punto en el mapa',
    faltaPunto: 'Falta el punto en el mapa: es lo que encuentra tu casa cuando la dirección no alcanza.',
    // 🔴 S100d·bis · LAS DOS PUERTAS EXPLÍCITAS. Antes el campo y el mapa
    // estaban siempre puestos, y llegar a los botones obligaba a arrastrar
    // sobre el mapa — que MUEVE el punto. El founder: «me desacomoda la
    // dirección… si no me di cuenta, no pasa».
    // Los dos verbos son de ACCIÓN y en infinitivo (Ley 22c): abren algo
    // concreto, no prometen una pantalla nueva.
    cambiarDireccion: 'Cambiar la dirección',
    ajustarPunto: 'Ajustar el punto en el mapa',
    confirmarPunto: 'Confirmar punto',
    mapaBloqueado: 'El mapa está fijo. Toca «Ajustar punto» para moverlo.',
    guardarComoOtra: 'Guardar como otra dirección',
    guardarComoOtraAyuda: 'Un nombre para reconocerla después — «Oficina», «Casa de mamá».',
  },
  // S55-A A2 — alta de mascota adicional (el hogar que crece).
  // Voz funcional de formulario; nace bilingüe (riel B1, tuteo neutro).
  // S73 C3 — la puerta de la adopción (refugios, peldaño 0 honesto)
  adoptar: {
    titulo: 'Adopción',
    proximamenteTitulo: 'Los refugios llegan pronto',
    proximamenteDetalle:
      'Estamos sumando refugios a e-PetPlace. Cuando estén acá, vas a conocer a sus mascotas en adopción y podrás darles familia.',
  },
  // S55-A B3 — Cuenta v1 (ciclo §3.5 adelantado). Voz completa
  // APROBADA por founder (lote S55, es y en).
  // S88-D · la campana del dueño (lámina firmada). El marco comparte
  // FORMA con el del prestador (§6 del método); la voz vive en cada
  // casa. El vacío nació como «No tenés avisos» (literal lámina §4);
  // la PASADA ÚNICA S89 (6-ago) lo re-firmó a tuteo EN SU LUGAR —
  // rige el acento único del founder.
  avisos: {
    titulo: 'Avisos',
    vacio: 'No tienes avisos',
    errorCargar: 'No pudimos cargar tus avisos.',
    /** Fallback DIGNO para una intención que nació sin voz (null honesto
     *  del lector) — se declara genérico, no se inventa un texto. */
    sinVozTitulo: 'Aviso',
    noLeido: 'Sin leer',
    momentoRecien: 'Recién',
    momentoMin: 'Hace {{n}} min',
    momentoHoras: 'Hace {{n}} h',
    momentoAyer: 'Ayer',
  },
  // S89-D orden 7 · LA CASA DE LOS PAPELES (firma del founder sobre
  // capturas). Los nombres de papel se resuelven por `claveVoz` del
  // catálogo derivado (`lib/papeles.ts`) — un papel nuevo sin voz rompe
  // el typecheck, jamás sale mudo. VOCES CANDIDATAS al próximo lote.
  perfilPrestador: {
    titulo: 'El negocio',
    errorTitulo: 'No pudimos cargar el perfil',
    errorDetalle: 'Revisa tu conexión y prueba de nuevo.',
    vacioTitulo: 'Este negocio no está disponible',
    vacioDetalle: 'Puede haber pausado su atención. Prueba con otro.',
    desde: 'desde {{precio}}',
    // La escalera de confianza: reseñas > citas > silencio. Con 0
    // reseñas NO hay estrellas vacías — serían un juicio que nadie emitió.
    confianzaResenas: '★ {{nota}} · {{n}} reseñas',
    confianzaCitas: '{{n}} citas completadas',
    verPerfilDe: 'Ver el perfil de {{nombre}}',
    reservar: 'Reservar',
    volver: 'Volver',
    cohorteFundador: 'Fundador desde {{anio}}',
    cohortePionero: 'Pionero desde {{anio}}',
    citas: '{{n}} citas completadas',
  },
  documentos: {
    titulo: 'Documentos',
    ley: 'Los papeles de tu familia, todos acá.',
    nombreCarnetVacunas: 'Carnet de vacunas',
    nombreHistoriaClinica: 'Historia clínica',
    // S90-A orden 5 — voces FIRMADAS por el founder (llegaron con la orden).
    nombreReceta: 'Receta',
    nombreFichaIdentidad: 'Ficha de identidad',
    /** El acto, bajo el nombre del papel: sostiene el affordance hasta
     *  que exista el glifo de descarga (pedido a B — Ley 12: no se
     *  presta un glifo que significa otra cosa). */
    descargar: 'Descargar PDF',
    // S91-C — EL SELECTOR DE LA RECETA. La receta se emite sobre UNA
    // consulta: la superficie pregunta cuál en vez de rebotar, y jamás
    // adivina (Thor tiene dos, y «la última» habría entregado la
    // equivocada la mitad de las veces).
    recetaElegirTitulo: '¿De qué consulta?',
    recetaElegirVoz: 'Cada receta pertenece a una consulta. Elige de cuál la quieres.',
    /** Nulo honesto: el papel existe aunque el negocio no tenga nombre. */
    recetaConsultaSinNegocio: 'Consulta veterinaria',
    /** AUSENCIA, jamás fallo — se dice en voz NEUTRA. No ofrece camino
     *  porque la familia no emite recetas: dice qué la hace aparecer,
     *  que es lo más cerca de un camino que esta verdad admite. */
    recetaSinConsultas: 'Todavía no hay ninguna receta. Aparece acá cuando un veterinario prescriba medicación.',
    vacioTitulo: 'Todavía no hay papeles',
    vacioDetalle: 'Cuando agregues una mascota, sus documentos van a vivir acá.',
    errorTitulo: 'No pudimos cargar tus documentos',
    errorDetalle: 'Revisa tu conexión y prueba de nuevo.',
  },
  cuenta: {
    // ── S101-B · FASE 5 · LOS MEDIOS DE PAGO ───────────────────────────
    // 🔴 «Medio de pago», no «tarjeta»: DeUna entra como otro medio sobre el
    //    mismo contrato, y el nombre de la pantalla es la decisión de
    //    arquitectura.
    medios: 'Medios de pago',
    mediosSub: 'Con qué pagas en e-PetPlace',
    mediosVacioTitulo: 'Todavía no guardas ninguno',
    mediosVacio: 'Guarda una tarjeta para pagar más rápido. Puedes borrarla cuando quieras.',
    /* 🔴 SOLO aparece cuando dos filas serían idénticas — ver `desempatarMedios`.
       *No dice «duplicada» ni acusa a nadie de nada: dice el único dato que
       las separa.* */
    medioAgregadaEl: 'Agregada el {{fecha}}',
    medioAgregar: 'Agregar tarjeta',
    medioElegido: 'Elegido',
    medioVence: 'Vence {{fecha}}',
    medioVencidoEn: 'Venció {{fecha}}',
    medioVencidoAyuda: 'Una tarjeta vencida no puede cobrarse. Agrega otra para seguir pagando.',
    medioBorrar: 'Borrar',
    medioBorrarTitulo: '¿Borrar este medio de pago?',
    // P1 — la segunda confirmación DICE QUÉ SE BORRA, con su nombre.
    medioBorrarCuerpo: 'Vas a borrar {{cual}}. No se puede deshacer, pero puedes volver a guardarla cuando quieras.',
    medioBorrarConfirmar: 'Sí, borrar',
    medioBorrarCancelar: 'No, dejarla',
    medioBorrado: 'Listo, la borramos.',
    medioBorrarFallo: 'No pudimos borrarla. Ya lo estamos viendo.',
    titulo: 'Tu cuenta',
    // S74 — entrada TEMPORAL del gate de la fusión (muere con la firma, Ley 37)
    laminaFusion: 'Lámina S74 · la fusión del avatar',
    // S101-B — ANDAMIO DE GATE, no superficie definitiva (Ley 37: muere con el
    // gate). La casa real de «medios de pago» se decide en SU gate, no acá; el
    // literal lo dice para que nadie lo confunda con producto terminado.
    // Se dibuja SOLO si hay config de pagos — sin config, la celda no existe.
    gateAltaTarjeta: 'Agregar tarjeta',
    // Las cuatro voces del desenlace. 🔴 Todas dicen lo LEÍDO DEL SERVIDOR:
    // el `?desenlace=` de la URL de retorno es una pista, jamás el hecho.
    altaGuardada: 'Listo, tu tarjeta quedó guardada.',
    altaRechazada: 'No pudimos guardar la tarjeta. Prueba con otra.',
    // 🔴 El caso ③: al volver sin completar, el alta SIGUE ABIERTA. Decir
    // «abandonada» acá sería deducirla del retorno del navegador.
    altaPendiente: 'El alta sigue abierta — todavía no vence.',
    altaAbandonada: 'El alta venció sin completarse.',
    altaNoAbrio: 'No pudimos abrir el formulario. Prueba de nuevo.',
    idioma: 'Idioma',
    idiomaEs: 'Español',
    idiomaEn: 'English',
    idiomaError: 'No pudimos guardar el idioma. Prueba de nuevo.',
    enPreparacion: 'En preparación',
    perfil: 'Tu perfil',
    contrasena: 'Contraseña',
    notificaciones: 'Notificaciones',
    eliminarCuenta: 'Eliminar cuenta',
    sesion: 'Sesión y cuenta',
    // índice
    familia: 'Tu familia',
    preferencias: 'Preferencias',
    pagos: 'Pagos',
    ayuda: 'Ayuda y legales',
    errorCargar: 'No pudimos cargar esto. Prueba de nuevo.',
    reintentar: 'Reintentar',
    guardar: 'Guardar cambios',
    // Tu perfil
    nombreLabel: 'Tu nombre',
    telefonoLabel: 'Teléfono',
    telefonoAyuda: 'Con código de país, solo números. ej: 593991234567',
    emailLabel: 'Email',
    emailAyuda: 'El email no se cambia desde acá todavía.',
    fotoTitulo: 'Tu foto',
    fotoCambiar: 'Cambiar foto',
    fotoTomar: 'Tomar foto',
    fotoGaleria: 'Elegir de la galería',
    fotoQuitar: 'Quitar foto',
    perfilGuardado: 'Listo — tu perfil quedó al día.',
    // Tu familia
    familiaNombreLabel: 'Nombre de la familia',
    familiaNombrePlaceholder: 'ej: Familia de Ana',
    familiaGuardado: 'Listo — el nombre quedó guardado.',
    familiaMiembros: 'Miembros',
    familiaTu: '(tú)',
    familiaMiembroAjeno: 'Miembro de la familia',
    rolAdultoTitular: 'Adulto titular',
    rolAdultoAutorizado: 'Adulto autorizado',
    rolMenor: 'Menor',
    rolCuidadorExterno: 'Cuidador externo',
    familiaSoloTitular: 'Solo el adulto titular puede cambiar el nombre.',
    // S104-C · INVITAR A LA FAMILIA (motor de A). La fila se GATEA por el
    // freno `ENLACE_INVITACION_HABILITADO`: mientras las páginas del sitio
    // (/invitacion, /baja) no existan (404 medido), la fila dice «Pronto» y no
    // se crean invitaciones que no se pueden compartir (freno estructural de A).
    familiaInvitar: 'Invitar a alguien de tu familia',
    familiaInvitarPronto: 'Pronto',
    familiaInvitarSoloTitular: 'Solo quien creó la familia puede invitar.',
    familiaInvitarAyuda: 'Le compartís un enlace para que se una a tu familia.',
    familiaInvitarEmailLabel: 'Su correo',
    familiaInvitarNombreLabel: 'Su nombre (opcional)',
    familiaInvitarCrear: 'Crear la invitación',
    // La voz del escalón (firma 5.1): qué gana quien entra. NO se ofrece
    // configurar permisos — en v1 el permiso ES el escalón (deuda declarada).
    familiaInvitarComoFamiliar: 'Se une como familiar autorizado: va a poder ver el expediente de las mascotas de tu familia.',
    // avisoPorCorreo=false: el invitado no tiene cuenta, el correo NO sale —
    // la pantalla lo dice, jamás promete un correo que no va a llegar.
    familiaInvitarSoloEnlace: 'Compartí este enlace con {{email}} — por WhatsApp, por ejemplo. Es la forma de que se una.',
    // correoSuprimido=true: esa dirección pidió no recibir más. La invitación
    // vale y el enlace sirve, pero la casa NO le escribe. Callarlo dejaría a
    // quien invita esperando un correo que nunca sale (firma A).
    familiaInvitarSuprimido: '{{email}} pidió no recibir nuestros correos, así que no le vamos a escribir. La invitación vale igual: compartile vos este enlace.',
    // avisoPorCorreo=true: el correo sí sale; el enlace es el respaldo.
    familiaInvitarCorreoYEnlace: 'Le enviamos un correo a {{email}}. También podés compartirle este enlace:',
    familiaCopiarEnlace: 'Copiar el enlace',
    familiaEnlaceCopiado: 'Enlace copiado',
    // S104-C · «Enviar por…» (Share API nativa). La casa NO manda nada: entrega
    // el enlace por un camino más corto. El texto lleva el enlace y a quién se
    // cuida — NUNCA el correo de quien invita (firma founder).
    familiaEnviarPor: 'Enviar por…',
    familiaMensajeCompartir: 'Te invito a nuestra familia en e-PetPlace para cuidar juntos a nuestras mascotas. Uníte acá: {{enlace}}',
    familiaInvitarOtra: 'Invitar a otra persona',
    familiaInvitarListo: 'Listo',
    familiaInvitarSinEnlace: 'El enlace todavía no está disponible. Probá más tarde.',
    // Preferencias · notificaciones — LOTE 4 (S88-D, lámina firmada 5-ago).
    // ☠️ Ley 37: murieron notifVoz («Cuando las notificaciones lleguen…»
    // — la promesa se jubila: el motor existe y ya habló una vez) y los
    // grupos por tipo (notifCitas/notifCuidado/notifNovedades + detalles).
    // FIRMADO EN LA PASADA ÚNICA S89 (6-ago): el lote entero con el
    // acento único (tuteo — los porqués re-firmados a «Eliges»), el
    // consentimiento de §4 fuera de borrador, y la LEY «push» jamás
    // de cara al cliente (patrón Ley 3: vocabulario del motor).
    notifLey: 'Elige por dónde te llegan los avisos. Algunos siempre llegan — eliges cómo.',
    notifFilaOperacion: 'Tus citas y servicios',
    notifFilaSaludSeguridad: 'Cuidado y salud',
    notifFilaSeguridadCuenta: 'La seguridad de tu cuenta',
    notifFilaSaldoPagado: 'Lo que ya pagaste',
    notifFilaRelacional: 'Mensajes y respuestas',
    notifFilaResumen: 'Resúmenes',
    notifFilaComercial: 'Novedades y ofertas',
    // Los EJEMPLOS por fila (enmienda de lámina FIRMADA, gate S88 —
    // propuestos contra el catálogo VIVO y firmados por el founder con
    // dos cambios: seguridad dice lo que le importa a la persona, no
    // funciones; comercial dice qué se gana al encenderla). «Resúmenes»
    // NO tiene key a propósito: su fila no se dibuja hasta que la
    // categoría tenga un tipo vivo (tiposVivos, Ley 23) — cuando nazca
    // su primer digest, la fila aparece sola y su ejemplo se escribe.
    notifEjOperacion: 'Recordatorios y confirmaciones de citas, tus pagos y pedidos.',
    notifEjSaludSeguridad: 'Vacunas por vencer y alertas de salud de tus mascotas.',
    notifEjSeguridadCuenta: 'Si alguien entra a tu cuenta o cambia tu contraseña.',
    notifEjSaldoPagado: 'Paquetes o planes que pagaste y están por vencer o renovarse.',
    notifEjRelacional: 'Mensajes nuevos de quienes cuidan a tus mascotas.',
    notifEjComercial: 'Promociones, descuentos y novedades de e-PetPlace.',
    notifPorqueSaludSeguridad: 'Estos avisos siempre llegan. Eliges por dónde, no si te llegan.',
    notifPorqueSeguridadCuenta: 'Los avisos de tu cuenta siempre llegan. Eliges por dónde.',
    notifPorqueSaldoPagado: 'Si algo que ya pagaste está por vencer, te avisamos siempre.',
    notifPorDonde: 'Por dónde',
    // ENMIENDA DE LÁMINA (firma founder, gate S88): «Push» NO es
    // vocabulario del dueño — los canales se dicen en el idioma de la
    // persona; nadie tiene que saber cómo se llama la tecnología para
    // elegirla. WhatsApp queda como marca.
    canalInApp: 'En la app',
    canalPush: 'En el teléfono',
    canalEmail: 'Por correo',
    canalWhatsapp: 'WhatsApp',
    // S89 — la invitación de la casa antes del diálogo del SO (lámina firmada)
    notifInvitacionTitulo: 'Avisos en tu teléfono',
    notifInvitacionCuerpo: 'Cuando pase algo importante — una cita confirmada, una vacuna por vencer — te avisamos en el teléfono, aunque la app esté cerrada. Lo cambias cuando quieras desde Preferencias.',
    notifInvitacionSi: 'Sí, avisarme',
    notifInvitacionNo: 'Ahora no',
    notifPermisoNegado: 'El teléfono tiene apagadas las notificaciones de e-PetPlace. Hasta que las actives en los ajustes del sistema, los avisos en el teléfono no pueden llegar.',
    waConsentTitulo: 'Avisos por WhatsApp',
    waConsentTexto: 'Quiero recibir avisos de e-PetPlace por WhatsApp en este número. Puedo desactivarlo cuando quiera desde Preferencias.',
    waConsentAceptar: 'Sí, quiero recibirlos',
    waConsentCancelar: 'Ahora no',
    // Pagos
    pagosVacioTitulo: 'Sin pagos todavía',
    pagosVacio: 'Cuando pagues tu primer servicio, va a vivir acá.',
    pagoSimulado: 'Pago simulado',
    servicioPaseo: 'Paseo',
    pagosMetodos: 'Métodos de pago',
    pagosMetodosPronto: 'En preparación — por ahora el pago es simulado y no se cobra nada real.',
    pagosMetodosYaEsta: 'Los administras en Cuenta › Medios de pago.',
    // Ayuda y legales
    terminosTitulo: 'Términos y condiciones',
    privacidadTitulo: 'Política de privacidad',
    /* La puerta ÚNICA al índice legal del sitio (A, con la fuente de B). */
    legalesTitulo: 'Términos y privacidad',
    /* ☠️ `legalPlaceholder` MURIÓ (S103-C, mesa 104). Decía, publicado:
       «Esta app está en fase de pruebas: NO SE COBRA DINERO REAL…».
       **Era cierta cuando se escribió y dejó de serlo sin que nadie la
       tocara**: S101 conectó el motor de cobro de punta a punta. *La única
       pantalla donde la app hace una afirmación legal sobre el dinero
       afirmaba lo contrario de lo que el motor hace.* Su reemplazo declara
       QUÉ documento se está leyendo, que es el dato que faltaba. */
    legalEstado:
      'Por ahora estos son los documentos del sitio de e-PetPlace. Los de la app están en preparación y los vas a encontrar aquí cuando existan.',
    // El soporte del soft launch: WhatsApp del founder con mensaje
    // pre-escrito (patrón de `apps/prestador/solicitar-acceso`).
    // ☠️ Mueren `ayudaCanal` y `ayudaPronto`: el canal dejó de ser una
    // promesa y pasó a ser un botón.
    soporteTitulo: '¿Necesitas ayuda?',
    soporteCuerpo: 'Escríbenos por WhatsApp y te respondemos.',
    soporteBoton: 'Escribir por WhatsApp',
    /* El mensaje pre-escrito. **No lleva dato de la cuenta**: viaja por un
       canal que no controlamos y lo escribe la persona si quiere. */
    soporteMensaje: 'Hola, necesito ayuda con la app de e-PetPlace.',
    soporteFallback: 'Si no se abre WhatsApp, escríbenos al {{numero}}.',
    /* El camino de las TRES compuertas que hablan hacia soporte
       (`monto_divergente` · `compra_sin_pedidos` · `desglose_incompleto`,
       `LETRA_PUERTA_DE_PAGO_S101B` §3.1). *Su voz decía «Ya lo estamos
       viendo» y no tenía a dónde ir.* */
    soporteDesdeCobro: 'Hola, tuve un problema al pagar en e-PetPlace.',
    // Eliminar cuenta — letra (a): visible con voz honesta (espec P15 en docs)
    // S104-C (firma founder 5.1): «co-dueños» → «las personas de tu familia».
    // ☠️ S104-C · `eliminarVoz` y `entendido` MURIERON con la Hoja de voz
    // honesta (Ley 37): P15 FIRMADA + motor de A ⇒ la entrada navega a
    // `/cuenta/cerrar` (namespace `cerrarCuenta`), no abre una Hoja de espera.
  },
  ajustes: {
    titulo: 'Ajustes',
    // Nació en voseo (S45) y se transpone a tuteo neutro al tocarse (S51).
    confirmacionCierre: '¿Cierras tu sesión? Tus datos quedan guardados.',
    cerrarSesion: 'Cerrar sesión',
    cancelar: 'Cancelar',
  },
  // ── D-430 (S67): el detalle contextual de la cita de la mascota —
  // el CTA de la ficha aterriza acá, jamás en un hub (LOTE S67
  // APROBADO founder, 18 Jul 2026) ──
  // ── S95-I · LA DESPENSA (lote de strings PENDIENTE DE GATE) ──────────
  // Voz de familia, tuteo neutro (regla 27 / L-148). El vocabulario del
  // motor —`M3`, `S|M|L`, los códigos de especie— JAMÁS aparece acá: se
  // traduce contra los diccionarios que la casa ya tiene y lo que no
  // matchea no se pinta (Ley 3).
  // ══ S101-C · LA VOZ DEL PAGO — SU PROPIA CASA ═══════════════════════
  // 🔴 Estas frases vivían bajo `despensa.*`, y era su dirección equivocada:
  //    **«El banco no autorizó el pago» no es una frase de despensa.** Desde
  //    que los servicios se cobran por el mismo motor, la voz es de LA CASA.
  //    *Dejarlas allá obligaba a copiarlas para el checkout de la cita — y una
  //    voz copiada es una voz que un día alguien afina de un solo lado.*
  /* ══ S103-C · LA SERIE RECURRENTE — «Que llegue solo», del lado de quien ya
        la tiene andando (`LETRA_COBRO_RECURRENTE` §2: «la pantalla dice la
        verdad completa: qué se va a cobrar, cuándo es el próximo cobro, a qué
        medio, y cómo se corta»).
        🔴 **La voz jamás inventa lo que el motor no guarda.** Hoy la tabla no
        tiene ni medio de pago ni monto esperado (censo de A, divergencias #3 y
        #4): para esos dos hay voz de AUSENCIA, no un valor de relleno. */
  serie: {
    titulo: 'Que llegue solo',
    queLlega: 'Qué te llega',
    cada: 'Cada {{dias}} días',
    proximoCobro: 'Próximo cobro',
    /* La ausencia dicha con su nombre — jamás un guion mudo ni un cero. */
    montoDesconocido: 'Lo vas a ver en el aviso, 48 horas antes.',
    medio: 'Con qué se paga',
    medioDesconocido: 'Todavía no lo mostramos aquí.',
    /* 🔴 EL VACÍO DE LA PANTALLA — voz PROPIA, y no la del medio de pago.
       ⏪ El estado vacío reusaba `medioDesconocido` y repetía el título del
       encabezado. **Lo cazó caminar la pantalla, no leer el código**: en el
       aparato se veía «Que llegue solo / Que llegue solo / Todavía no lo
       mostramos aquí» — el eco que la casa llama Chanel, y encima una frase
       escrita para OTRA cosa (el medio), que sobre la pantalla entera hace
       pensar que la serie existe y se la esconde.
       🔴 Y sigue sin decir «no tienes envíos automáticos»: eso sería una
       afirmación sobre los datos, y lo que pasa es que todavía no sabemos
       leerlos. La segunda línea existe para que nadie se asuste: nada cambió. */
    sinLectorTitulo: 'Todavía no podemos mostrarla',
    sinLectorCuerpo: 'Estamos terminando esta pantalla. Tus envíos automáticos siguen como estaban.',
    aDondeLlega: 'A dónde llega',
    avisoPrevio: 'Te avisamos 48 horas antes de cada cobro.',
    /* §6: pausa ≠ cancelación, y la salida es del cliente. */
    pausada: 'Quedó en pausa: no pudimos completar el cobro.',
    comoReanudar: 'Actualiza tu medio de pago para reanudarla.',
    /* §7: la falta de stock salta la entrega y **jamás sustituye**. */
    saltada: 'Este mes no pudimos enviar {{producto}}.',
    saltadaSigue: 'La serie sigue activa para la próxima entrega.',
    /* Cortar: UN botón, sin soporte de por medio (§2). */
    cancelar: 'Cancelar envíos',
    cancelarConfirma: '¿Cancelas los envíos automáticos?',
    cancelarDetalle: 'No se cobra nada más. Puedes volver a activarlos cuando quieras.',
    cancelarSi: 'Sí, cancelar',
    cancelada: 'Listo: cancelamos los envíos automáticos.',
    /* El fallo dice QUÉ falló, jamás un genérico: la familia acaba de tocar
       «cancelar» y necesita saber que **la serie sigue viva**. */
    errorCancelar: 'No pudimos cancelar los envíos. Siguen activos — prueba de nuevo.',
    volver: 'Volver',
  },
  pago: {
    comoPagas: 'Cómo quieres pagar',
    /* ③ ☠️ MURIÓ `medioElegido: 'Elegido'`. *Era una etiqueta contando lo
       que la fila ya mostraba, y ocupaba el único lugar donde tenía que
       estar la acción.* Hoy esa zona es CTA. */
    medioCambiar: 'Cambiar',
    /* La invitación cuando todavía no hay ninguna elegida. **No es «Cambiar»**:
       cambiar exige que haya algo que cambiar. */
    elegiMedioTitulo: 'Elige cómo quieres pagar',
    /* ① El botón de pagar de la casa: UNA voz para las dos puertas. */
    pagar: 'Pagar',
    sinMedios: 'Todavía no guardas una tarjeta.',
    elegiMedio: 'Elige con cuál quieres pagar.',
    /* ── S103-C · DEUNA (`LETRA_DEUNA` §5 y §6) ───────────────────────────
       El nombre es propio y **no se traduce**. La voz de «todavía no» es
       honesta y temporal: el riel está bloqueado por un dato del comercio
       (el `pointOfSale`), medido por la pista D. */
    deunaFila: 'Deuna',
    /* Por qué el default no pudo ser DeUna. **La firma exige decirlo**: el
       default cae a tarjeta y jamás cambia en silencio. */
    deunaNoDisponibleAhora: 'Deuna todavía no está disponible: por ahora se paga con tarjeta.',
    deunaPronto: 'Muy pronto vas a poder pagar desde tu app Deuna.',
    /* La espera del código: **misma pantalla, otra voz** (§6, firma ② del
       founder: «funciona exactamente igual que si fuera tarjeta»). */
    deunaEsperaTitulo: 'Ingresa este código en tu app Deuna',
    deunaEsperaCuerpo: 'Abre tu app Deuna, ingresa el código y confirma el pago.',
    /* 🔴 «vence en», jamás «faltan»: lo que se acaba es el CÓDIGO, no el
       pedido. *Un reloj sin sujeto hace pensar que se pierde la compra.* */
    deunaCodigoVence: 'El código vence en {{tiempo}}',
    /* 🔴 «Copiar» — **FIRMA FINAL del founder, 22-ago.** Su razón, literal:
       *es redundante en pantalla —hay un código y un botón al lado, la palabra
       repite lo que el ojo ya sabe— y recupera los ~60 px que le quitaba al
       código, que es lo único que esa pantalla vino a mostrar.*

       ── EL RECORRIDO COMPLETO, con su porqué, PARA QUE NADIE LO REVIERTA ──
       `Copiar código` → `Copiar` → `Copiar código` → **`Copiar`**.
       *Cuatro etapas y dos pares que se ven idénticos: sin esta nota, el
       próximo que lea el código va a ver una oscilación sin sentido y va a
       "corregirla".*

       ① `Copiar código` — mi lectura del contrato de `BotonCopiar`: la
          etiqueta visible ES el nombre accesible, así que debe decir el objeto.
       ② `Copiar` — craft del founder: la caja competía con el código.
       ③ `Copiar código` — el founder corrige su propia instrucción anterior
          (había pedido una etiqueta accesible aparte, y **el contrato la
          prohíbe con razón**: dos nodos `role="button"` anidados).
       ④ **`Copiar`** — firma final, con el costo medido y ACEPTADO.

       ⚠️ **EL COSTO, DECLARADO Y NO ESCONDIDO:** quien no ve la pantalla
       escucha **«Copiar» sin el objeto**. **Se acepta**, y la razón es la que
       hay que conservar: *el lector de pantalla **acaba de leer el código** —
       el contexto está a un elemento de distancia.*
       🔴 **Esto NO es una omisión de accesibilidad pendiente de curar.** Es
       una decisión tomada con su costo a la vista. *Quien la "arregle"
       alargando la etiqueta va a estar deshaciendo una firma, no corrigiendo
       un olvido.* **La cadena visible sigue siendo el nombre accesible y NO
       nace una prop aparte.** */
    deunaCopiar: 'Copiar',
    deunaCopiado: 'Código copiado',
    deunaCodigoVencido: 'El código venció.',
    deunaCodigoNuevo: 'Generar un código nuevo',
    /* Cuando el hold murió NO nace otro código: rige la voz del rearme que
       la casa ya tiene (`esperaExpirada`), y esta línea dice el porqué. */
    deunaHoldVencido: 'El tiempo que apartamos se terminó. No te cobramos nada.',
    /* §6 · `APPROVED` verificado. La pantalla NO lo declara: lo dice el
       servidor y ella lo dibuja. */
    // 🔴 S103-C · LAS CINCO FAMILIAS DE FALLO (CONTRATO_WRAPPER_DEUNA §4).
    // Cada familia tiene voz propia porque cada una manda a la persona a un
    // lugar distinto: soporte, reintentar, o volver atrás.
    deunaPidiendoCodigo: 'Pidiendo tu código…',
    deunaFalloTitulo: 'No pudimos generar tu código',
    // ② LA COMPUERTA — nuestro motor. El proveedor NUNCA se enteró, así que
    // el título no puede decir «falló el pago»: el pago no se intentó.
    deunaCompuertaTitulo: 'Antes de cobrarte, algo cambió',
    deunaCausaPagoEnProceso: 'Ya hay un pago en curso para esta compra. Espera un momento y vuelve a intentarlo.',
    deunaCausaReservaVencida: 'La reserva venció y soltamos los productos. Vuelve a armar tu pedido.',
    deunaCausaVendedorNoActivo: 'Este vendedor no está recibiendo pedidos ahora mismo.',
    deunaCausaMontoDivergente: 'El total cambió desde que empezaste. Vuelve atrás para verlo actualizado.',
    deunaCausaCompraSinPedidos: 'Esta compra quedó sin productos. Vuelve a armarla.',
    // ④ LA RED — no es rechazo. Y jamás dice «cerrá sesión».
    deunaRedTitulo: 'No pudimos conectarnos',
    deunaRedCuerpo: 'No es un rechazo: no llegamos a preguntar. Prueba de nuevo.',
    deunaReintentar: 'Probar de nuevo',
    // ① DEFECTO NUESTRO — jamás «reintentá»: no va a cambiar.
    deunaNuestroCuerpo: 'Es un problema nuestro y no se arregla reintentando. Escríbenos y lo resolvemos.',
    // ③ EL PROVEEDOR RECHAZÓ
    deunaRechazoCuerpo: 'Deuna no pudo completar el cobro. Escríbenos y lo revisamos.',
    // ⑤ AMBIGUO A PROPÓSITO — «no existe o es de otro». No se afina.
    // 🔴 SIN SUSTANTIVO DEL SUJETO (dictamen de mesa, 23-ago). Decía «esta
    // COMPRA», y este código lo emiten los DOS sujetos: `cita_no_existe`
    // recibía una voz que nombraba algo que la pantalla no sabe cuál es.
    // Es el mismo defecto que la casa ya pagó con el comprobante que decía
    // «compra» para un paseo, entrando por la voz de error.
    // «este pago» SÍ se puede afirmar: es la pantalla donde está parada.
    deunaAmbiguoCuerpo: 'No pudimos abrir este pago. Vuelve atrás y prueba de nuevo.',
    deunaSesionCuerpo: 'Tu sesión terminó. Vuelve a entrar para seguir.',
    deunaVolver: 'Volver',
    deunaAprobada: 'Pago confirmado',
    deunaAprobadaCuerpo: 'Listo, recibimos tu pago.',
    /* 🔴 §6 · `NOT_FOUND` en ventana y `REVERSED_FAILED`. Defecto NUESTRO: no
       se culpa al cliente, y el nombre técnico del hallazgo se registra pero
       JAMÁS se le muestra. */
    deunaHallazgo: 'No pudimos confirmar tu pago',
    deunaHallazgoCuerpo: 'Ya lo estamos revisando. Escríbenos y lo resolvemos.',
    // ── LA ESPERA. 🔴 Nunca un spinner mudo, nunca «rechazado» por timeout.
    esperaTitulo: 'Estamos confirmando tu pago',
    esperaTituloCorto: 'Tu pago',
    esperaCuerpo: 'Puede tardar unos segundos. Puedes cerrar esta pantalla: tu pedido sigue solo.',
    // El tope NO declara desenlace — la compra sigue viva.
    esperaSigueAbierta: 'Está tardando más de lo normal. Tu pedido sigue en curso y te vamos a avisar.',
    esperaFallida: 'El pago no se completó. No te cobramos nada.',
    esperaCancelada: 'Esta compra quedó cancelada.',
    esperaVerPedidos: 'Ver mis pedidos',
    // La cita tiene su propio cuerpo: lo que sigue solo es la RESERVA.
    esperaCuerpoCita: 'Puede tardar unos segundos. Puedes cerrar esta pantalla: tu reserva sigue en pie.',
    esperaSigueAbiertaCita: 'Está tardando más de lo normal. Tu reserva sigue en pie y te vamos a avisar.',
    // 🔴 Una reserva que venció NO es un pago que falló, y no comparte su voz.
    esperaExpirada: 'El horario que apartamos se liberó. No te cobramos nada.',
    esperaCanceladaCita: 'Esta reserva quedó cancelada.',
    // ── LAS COMPUERTAS (letra §3.1) ────────────────────────────────────
    // 🔴 Cada una habla ANTES de tocar la tarjeta. La regla madre: la familia
    //    jamás descubre un problema de su pedido —o de su reserva— a través
    //    del cobro. Y las de «defecto nuestro» NO la culpan ni le piden que
    //    revise nada: le decimos que lo estamos viendo nosotros.
    cobroPagoEnProceso: 'Tu pago anterior se está procesando.',
    cobroReservaVencida: 'Tu reserva venció. Vamos a revisar que todo siga disponible.',
    cobroVendedorNoActivo: 'Esta tienda no está recibiendo pedidos en este momento.',
    cobroElegiMedio: 'Elige con qué tarjeta quieres pagar.',
    cobroCompraNoExiste: 'No encontramos esta compra.',
    cobroCitaNoExiste: 'No encontramos esta reserva.',
    // Las nuestras comparten voz a propósito: la causa fina es de soporte,
    // no de la familia — distinguirlas en pantalla sería contarle un problema
    // interno que no puede resolver.
    cobroDefectoNuestro: 'No pudimos completar el cobro. Ya lo estamos viendo.',
    cobroRechazado: 'El banco no autorizó el pago. Prueba con otra tarjeta.',
    cobroDesconocido: 'No pudimos completar el cobro. Ya lo estamos viendo.',
    cobroConfirmando: 'Estamos confirmando tu pago.',
  },
  /**
   * S103-C · SEGURIDAD — la contraseña del cliente.
   *
   * 🔴 **LAS CATORCE SON VERBATIM DEL PRESTADOR**, y eso es deliberado: ya
   * estaban en tuteo neutro y es **la misma función para el mismo humano**.
   * *Dos frases distintas para el mismo acto es cómo dos superficies
   * empiezan a desacordar sin síntoma.*
   *
   * ⏪ **ACÁ DECÍA OTRA COSA, Y ERA FALSA — hallazgo de D.** Decía *«las tres
   * últimas son propias porque el cliente no tiene `/recuperar` **(medido)**,
   * así que termina en soporte»*. **Era cierto cuando se escribió y esta
   * misma rama lo derogó horas después**, al montar `/recuperar` — que se
   * define **trece líneas más abajo, en este archivo**.
   *
   * 🔴 **Y el sello «(medido)» es lo que lo volvía peligroso, no la
   * afirmación:** una frase falsa SIN él invita a verificar; **con él suena
   * verificada y apaga la sospecha del que lee.** *Es la hermana invertida
   * de `destacada`: allá un guard hacía parecer viva una prop muerta; acá un
   * sello de medición hace parecer medida una afirmación vencida. **Las dos
   * sobreviven por lo mismo: son comentarios, no rompen nada y no fallan
   * ningún gate.***
   *
   * ⇒ **Y la medición de la cura corrigió el número que yo iba a escribir:**
   * fui a arreglar «tres propias» por «dos» y **las catorce claves existen en
   * el prestador**. La única que difería era `soloGoogle`, por tres palabras
   * («ahora» en vez de «desde recuperar») — **alineada, porque mi propio
   * argumento de arriba la obligaba.**
   */
  /** S103-C · RECUPERAR — heredadas VERBATIM del prestador: ya estaban en
   *  tuteo neutro y es el mismo acto para el mismo humano. */
  recuperar: {
    titulo: 'Recuperar tu contraseña',
    ayudaPedir: 'Escribe el correo con el que entras y te enviamos un código de {{n}} dígitos.',
    email: 'Tu correo',
    pedir: 'Enviar el código',
    // NUNCA declara si el correo existe: la misma frase exista o no.
    siTieneCuenta: 'Si {{email}} tiene una cuenta, ya le enviamos un código de {{n}} dígitos.',
    // ☠️ `avisoCorreo` MURIÓ (S104-C, D-628 cerrada por medición): el correo
    // ya no llega en inglés ni de dirección ajena — probado con una cuenta
    // real que recuperó su clave y entró (Ley 37).
    codigo: 'El código de {{n}} dígitos',
    codigoVerificado: 'Código verificado. Ahora elige tu nueva contraseña.',
    verificar: 'Verificar el código',
    nueva: 'La nueva contraseña',
    largoMinimo: 'Al menos {{n}} caracteres.',
    cambiar: 'Cambiar contraseña y entrar',
    otroCodigo: 'Enviar otro código',
    listo: 'Listo — ya puedes entrar.',
    esperaConNumero: 'Pediste varios códigos seguidos. Espera {{s}} segundos y vuelve a intentar.',
    esperaSinNumero: 'Pediste varios códigos seguidos. Espera un momento y vuelve a intentar.',
  },
  // S104-C · DARSE DE BAJA de los correos, en un clic (motor de A, grant a
  // anon). Sin sesión, sin login. La pantalla dice lo mismo exista o no el
  // token — distinguir sería un oráculo de tokens válidos (firma A).
  baja: {
    titulo: 'Dejar de recibir correos',
    cuerpo: '¿Querés dejar de recibir invitaciones y avisos de e-PetPlace en este correo?',
    confirmar: 'Sí, no quiero más correos',
    listo: 'Listo. No te vamos a escribir más a este correo.',
  },
  // S104-C · la pantalla del INVITADO de familia (motor de A:
  // aceptarInvitacionFamilia). Tres láminas cortas + aceptar.
  invitacionFamilia: {
    titulo: 'Te invitaron a una familia',
    lamina1Titulo: 'Sos parte de una familia',
    lamina1Cuerpo: 'Alguien te sumó a su familia en e-PetPlace para cuidar juntos a sus mascotas.',
    lamina2Titulo: 'Vas a ver su expediente',
    lamina2Cuerpo: 'La vida de cada mascota, documentada: vacunas, paseos, visitas al veterinario y más.',
    lamina3Titulo: 'Cuidá con ellos',
    lamina3Cuerpo: 'Vas a estar al día con lo que cada mascota necesita, y seguir sus cuidados.',
    siguiente: 'Siguiente',
    unirme: 'Unirme a la familia',
    // Sin sesión: se guía a entrar/crear cuenta CON EL MISMO CORREO (el motor
    // exige que la sesión coincida con el invitado — email_no_coincide).
    sinSesionCuerpo: 'Para unirte, entrá o creá tu cuenta con el mismo correo al que te invitaron.',
    entrar: 'Ya tengo cuenta',
    crearCuenta: 'Crear mi cuenta',
    otraCuenta: 'Entrar con otra cuenta',
    sinToken: 'Este enlace no es válido o ya venció. Pedile a quien te invitó que te mande uno nuevo.',
    listo: 'Listo, ya sos parte de la familia.',
  },
  seguridad: {
    tituloPantalla: 'Seguridad',
    titulo: 'Contraseña',
    ayuda: 'La clave con la que entras a la app.',
    actual: 'Tu contraseña actual',
    nueva: 'La nueva contraseña',
    largoMinimo: 'Al menos {{n}} caracteres.',
    confirmar: 'Repite la nueva contraseña',
    // El único error que el servidor no puede cazar: para él las dos son
    // válidas. La voz no culpa a nadie — describe el hecho.
    noCoinciden: 'Las dos contraseñas no coinciden. Escríbelas de nuevo.',
    cambiar: 'Cambiar contraseña',
    listo: 'Listo — tu contraseña quedó cambiada.',
    esperaConNumero: 'Probaste varias veces seguidas. Espera {{s}} segundos y vuelve a intentar.',
    esperaSinNumero: 'Probaste varias veces seguidas. Espera un momento y vuelve a intentar.',
    // 🔴 ENMENDADA respecto del prestador: la suya ofrece crear la clave
    // desde `/recuperar`, y esa ruta NO EXISTE en el cliente. Prometerla
    // sería mandar a una puerta que no abre.
    // ⏪ ENMENDADA (S103-C): decía «Escríbenos y te ayudamos a crear una»
    // porque `/recuperar` NO existía en el cliente. Ya existe, así que la
    // familia solo-Google puede crearse la clave SOLA — que era el hueco.
    // ☠️ Con esto murieron `irASoporte`, `mensajeSoporte` y `soporteFallback`.
    soloGoogle:
      'Entras a e-PetPlace con Google, así que todavía no tienes una contraseña propia. Puedes crear una desde recuperar: te enviamos un código a tu correo.',
    irARecuperar: 'Crear una contraseña',
    // S104-C · el candado biométrico sobre la sesión (§2.5). La voz no nombra
    // el método (huella/rostro): depende del teléfono, y el SO ya lo dice en
    // su propio prompt.
    biometricoTitulo: 'Candado de la app',
    biometricoEtiqueta: 'Bloquear al volver a la app',
    biometricoAyuda:
      'Cuando salgas y vuelvas, tu teléfono te va a pedir que te reconozca antes de mostrar tu sesión. Si no puede, entras con tu contraseña.',
    biometricoNoDisponible:
      'Configura el desbloqueo de tu teléfono (huella o rostro) para usar el candado.',
    biometricoPrompt: 'Confirma que eres tú',
    biometricoRechazado: 'No pudimos confirmarlo. Prueba de nuevo.',
  },
  despensa: {
    titulo: 'Despensa',
    tituloProducto: 'Producto',

    // El criterio — la firma de Descubrir. NUNCA cuenta lo excluido: el
    // motor devuelve lo que pasó, no lo que quedó afuera.
    criterioPara: 'Para {{nombre}}',
    criterioSinAlergenos: 'Dejamos fuera lo que lleva {{lista}}, porque su expediente lo registra.',
    criterioSinAlergias: 'Su expediente dice que no tiene alergias conocidas.',
    criterioCondicion: 'Incluimos dietas de prescripción por la condición que tiene registrada.',
    elegiMascota: 'Elige una mascota y te mostramos solo lo que puede comer.',
    verTodo: 'Ver toda la despensa',

    // El porqué — la firma de la ficha
    porqueTitulo: 'Por qué te lo mostramos',
    porqueTituloMascota: 'Por qué se lo mostramos para {{nombre}}',
    porqueEspecie: 'Está pensado para {{lista}}.',
    porqueTalla: 'Para talla {{lista}}.',
    porqueMomento: 'Para la etapa: {{lista}}.',
    porquePrescripcion:
      'Es una dieta de prescripción. Quién la indica y por cuánto tiempo lo decide su veterinario, no esta pantalla.',

    // Las presentaciones
    presentaciones: 'Presentaciones',
    varianteSinOferta: 'Sin precio publicado por ahora',
    sinPresentaciones: 'Todavía no hay presentaciones cargadas',
    sinPresentacionesDetalle: 'Cuando el vendedor cargue sus tamaños, los vas a ver acá con su precio.',
    presentacionElegida: 'Elegida',

    // S96 · el buscador y los filtros (§5.1) — las facetas se derivan de
    // lo cargado; estas voces solo nombran lo que el catálogo declara.
    buscarLabel: 'Buscar',
    buscarPlaceholder: 'Nombre o marca',
    limpiarBusqueda: 'Limpiar la búsqueda',
    busquedaVaciaTitulo: 'Nada con "{{termino}}"',
    busquedaVaciaDetalle: 'Todavía no tenemos ese producto. El catálogo crece: vale la pena volver a mirar.',
    familiaAlimento: 'Alimento',
    familiaAntiparasitario: 'Antiparasitarios',
    familiaSuplemento: 'Suplementos',
    familiaDieta: 'Dieta de prescripción',

    // S100c-C · C-02 — las dos tiras de chips pasan a UN control con hoja.
    // El contador va en la etiqueta: un botón que dice cuántos filtros hay
    // puestos es la única forma de saberlo sin abrirlo.
    filtrar: 'Filtrar',
    filtrarCon: 'Filtrar · {{n}}',
    filtrosTitulo: 'Filtrar',
    filtrosVer: 'Ver {{n}} productos',
    filtrosLimpiar: 'Limpiar {{n}} filtros',
    // ☠️ S100d-bis · Ley 37 — acá vivía `filtroEjeCon` («Categoría · 3»).
    // **La mató el founder con una pregunta:** *«no sé por qué pone el 3»*.
    // Medido: contaba las opciones del eje **y las tres estaban a la
    // vista**. Nació como la mitad de la cura del truncado; la otra mitad
    // (`envuelve`) lo resolvió de raíz y dejó a ésta sin nada que declarar.
    filtroCategoria: 'Categoría',
    filtroEspecie: 'Para qué animal',
    filtroMarca: 'Marca',
    filtroPresentacion: 'Presentación',
    filtroPrecio: 'Precio',
    precio_hasta10: 'Hasta $10',
    precio_de10a25: '$10 a $25',
    precio_de25a50: '$25 a $50',
    precio_mas50: 'Más de $50',

    // S99-D · §8.6ter — EL VENDEDOR QUE NO LO TIENE: se muestra y SE DICE.
    // El choque contra §4.4 está resuelto POR SUJETO en la letra: lo que no
    // aparece en navegación es el producto que NADIE vende; éste tiene oferta
    // viva y sin stock, y esconderlo «deja al dueño sin entender».
    // 🔴 HABLA DEL PRESENTE Y NO PROMETE: §4.4 prohíbe «temporalmente» por
    // ser una promesa incumplible, y no se ofrece un «avisame cuando llegue»
    // que todavía no existe — un camino que no lleva a ningún lado es peor
    // que no ofrecerlo (Ley 13).
    filaSinStock: 'Ahora no está disponible.',

    // 🔴 S100-C · N19 ③ — EL PRECIO POR KILO. El dato que decide una compra de
    // alimento y que casi ningún catálogo pone. Solo aparece cuando la variante
    // declara su peso: sin `peso_kg` no hay cuenta, y una cuenta inventada
    // sobre un peso ausente sería peor que no decir nada.
    porKilo: '${{monto}}/kg',

    // 🔴 S100-C — LAS SEÑALES CORTAS DE LA TARJETA (prop `alergia` de B).
    // CORTAS a propósito: en media pantalla una frase con el nombre de la
    // mascota son tres líneas y tapa el producto. La tarjeta SEÑALA que hay
    // conflicto; el detalle y el paso de entendimiento viven en la ficha.
    // La imprecisa NO baja el tono: si esa proteína ES pollo, le hace igual de
    // mal — lo que cambia es la voz, no la gravedad.
    // 🔴 S100-C · N19 ⑥ — DISPONIBILIDAD REAL. `hay_stock` es BOOLEANO por
    // firma: dice «¿puedo comprar esto?», jamás cuánto queda (medido por A:
    // es literalmente `stock_disponible > 0`). Sin numero, sin urgencia.
    fichaSinStock: 'Esta presentación no está disponible ahora.',
    // Las presentaciones que existen y no se pueden comprar: se DICEN, y no
    // se ofrecen como elegibles — no son una opción, son una ausencia.
    tambienVieneEn: 'También viene en {{lista}}, sin disponibilidad hoy.',
    senalContiene: 'Contiene {{lista}}',
    senalPodriaContener: 'Podría contener {{lista}}',
    senalSinComposicion: 'Sin composición declarada',
    senalSinVerificar: 'Composición sin verificar',

    // 🔴 S100-C · H-004 — EL TECHO QUE SE DICE. La vitrina carga 50 sobre 563
    // comprables: sin esta línea la familia veía el 8,9 % del catálogo y una
    // lista completa se veía igual que una truncada.
    // Dice el número Y el camino: sin la segunda mitad sería un aviso que
    // informa un límite y no ofrece salida (Ley 13, el callejón).
    techoVitrina:
      'Te mostramos {{mostrados}} de {{total}} productos. Busca por nombre o marca para llegar al resto.',

    // S96 · la advertencia de alergia (§5.4) — nombra mascota y alérgeno,
    // jamás esconde. El paso explícito gatea el agregar.
    filaContiene: 'Contiene {{lista}}, y el expediente de {{nombre}} lo registra como alergia.',
    alergiaContiene: '{{nombre}} es alérgico a {{lista}} y este alimento lo contiene.',
    alergiaContieneDetalle: 'Puedes comprarlo igual — la decisión es tuya. Solo queremos que la tomes sabiendo.',
    alergiaSinComposicion: 'No tenemos los ingredientes de este producto, así que no podemos confirmar si es seguro para {{nombre}}.',
    alergiaSinVerificar:
      'La composición la declaró el fabricante y todavía no la verificamos. Por las alergias de {{nombre}}, revisa la etiqueta antes de dárselo.',
    // La coincidencia IMPRECISA (relaciones del vocabulario: ave ⊃ pollo).
    // Mismo registro que la exacta — cambia la palabra, no el matiz.
    alergiaImprecisa: 'Este alimento contiene {{lista}} — y el expediente de {{nombre}} registra esa alergia.',
    imprecisoPar: '{{declarado}} (podría ser {{origen}})',
    alergiaEntiendo: 'Entiendo, quiero verlo igual',
    alergiaEntendida: 'Ya lo tuviste en cuenta',
    tuMascota: 'tu mascota',

    // S96 · la composición (§0.5 — el detalle al nivel del mejor
    // e-commerce; candado ① de §5.4: sin composición se dice).
    composicion: 'Composición',
    composicionAusente: 'No tenemos los ingredientes de este producto. El fabricante no los declaró.',
    composicionAlergenos: 'Declara contener: {{lista}}.',
    composicionFuente: 'Declarada por el fabricante, todavía sin verificar.',
    composicionVerificada: 'Composición verificada.',
    composicionNoAplica: 'Este tipo de producto no lleva lista de ingredientes.',

    // S96 · las fotos
    verFotos: 'Ver las fotos del producto',
    fotosDelProducto: 'Fotos del producto',

    // S96 · el carrito desde la ficha
    cantidad: 'Cantidad',
    agregar: 'Agregar al carrito',
    agregarConPrecio: 'Agregar · {{precio}}',
    agregado: 'Agregado al carrito.',
    agregadoPara: 'Agregado al carrito para {{nombre}}.',
    verCarrito: 'Ver carrito · {{n}}',
    // S100b-D · G-14 · la canasta del encabezado. Es el NOMBRE ACCESIBLE de
    // un ícono, no una etiqueta visible: el lector de pantalla tiene que
    // decir a dónde lleva Y cuánto hay, porque el número que el ojo ve al
    // lado del glifo él no lo relaciona solo.
    irAlCarrito: 'Ir al carrito',
    irAlCarritoCon: 'Ir al carrito · {{n}} en el carrito',
    faltaPresentacion: 'Elige una presentación para agregarlo.',
    /** El precio de la presentación más barata, mientras no haya una
     *  elegida. Es la escalera del precio honesto de S82: **lo que varía
     *  dice «desde»**. Sin esto la ficha de un producto con varias
     *  presentaciones **no muestra ningún precio hasta que elegís**. */
    precioDesde: 'desde',
    faltaEntendimiento: 'Leé el aviso de arriba: falta que confirmes que lo tuviste en cuenta.',

    /* 🔴 A-01 (S100c) · LO QUE CAMBIÓ MIENTRAS EL CARRITO ESTABA GUARDADO.
       Dos hechos distintos con dos voces distintas a propósito: «se agotó»
       invita a volver más adelante, «ya no está a la venta» no. Fundirlos en
       un «no disponible» ahorraría una key y le sacaría a la familia lo único
       que le sirve para decidir qué hacer.
       ⚠️ Ninguna culpa a la familia ni se disculpa de más: es un hecho del
       mundo, dicho en una línea. */
    /* A-02 (S100c) · el resumen confirma cómo y cuándo llega. El rótulo es
       una PREGUNTA contestada, no una etiqueta de formulario: la familia no
       está llenando un campo, está revisando una promesa. */
    resumenComoLlega: 'Cómo llega',
    resumenFechaPorEntrega: 'Cada entrega va por su cuenta y tiene su propia fecha.',

    /* 🔴 A-01(b) · el tope de lo que se puede llevar, dicho ANTES de pagar.
       Literal del founder. **Dice cuánto podés llevar, jamás cuánto hay**: el
       motor devuelve LEAST(pedido, disponible), así que sobre 500 unidades
       pidiendo 3 contesta 3 y no se filtra inventario ajeno.
       Y no culpa a nadie ni se disculpa: es un hecho del mundo, en una línea. */
    /* 🔴 S100d·bis · LA VOZ DEL NÚMERO QUE SE AJUSTA SOLO.
       Founder: *«disculpá, por ahora solo tenemos 12 disponibles»*, con el
       pedido de ajustarla a la voz de la casa.
       Lo que se conserva de su literal: **el pedido de disculpas** y **el
       "por ahora"** — la escasez es de hoy, no del producto.
       Lo que se ajusta: la casa no dice «disculpá» por algo que no hizo mal
       (Ley 13 en tono), y **la frase tiene que decir qué PASÓ con el número**,
       no solo cuánto hay: *un número que cambia bajo el dedo sin voz es peor
       que el defecto original.* */
    maximoEntregable: 'Por ahora tenemos {{n}} de este producto — dejamos esa cantidad en tu carrito.',

    itemSeAgoto: 'Se agotó mientras lo tenías guardado.',
    itemYaNoEsta: 'Ya no está a la venta.',
    itemPrecioCambio: 'El precio cambió: ahora es {{precio}}.',
    faltaSacarNoDisponibles: 'Saca del carrito lo que ya no está disponible para seguir.',

    // S96 · las otras puertas
    tusPedidos: 'Tus pedidos',
    // S100c-D · los dos rótulos de la casa de Pedidos. Solo se dibujan
    // cuando existen LAS DOS secciones: con una sola, rotular anuncia
    // una división que no está (Chanel).
    pedidosEnCurso: 'En curso',
    // S100d · los chips del HISTÓRICO. Solo estos dos: lo en curso vive
    // arriba y no se repite abajo (firma del founder).
    chipEntregados: 'Entregados',
    chipCancelados: 'Cancelados',
    pedirDeNuevo: 'Pedir de nuevo',
    pedidosHistorial: 'Historial',
    tusPedidosDetalle: 'Sigue lo que pediste, del más reciente al más viejo.',
    reclamoEntrada: '¿Compraste en el local?',
    reclamoEntradaDetalle: 'Ingresa el código de tu factura y la compra entra a su expediente.',

    // S96 · el carrito (§6.3/§6.4/§5.2)
    carritoTitulo: 'Tu carrito',
    carritoVacioTitulo: 'Tu carrito está vacío',
    carritoVacioDetalle: 'Lo que agregues desde la despensa lo vas a ver acá.',
    carritoVacioIr: 'Volver a la despensa',
    cantidadDe: 'Cantidad de {{nombre}}',
    // ☠️ S100b-A · G-08: murió `quitar`. El botón de texto se fue con la
    // papelera del stepper — dos controles para la misma intención eran uno de
    // más, y la voz sin consumidor es la mitad del control esperando.
    paraQuien: '¿Para quién es?',
    // S100b-A · G-10: la salida al reparto. Voz de familia y en infinitivo
    // porque EJECUTA (Ley 22c) — no promete una pantalla nueva, abre la
    // misma lista con una pregunta por producto.
    repartirEntreMascotas: 'Repartir entre varias mascotas',
    donarEste: 'Donar este producto',
    donacionDetalle:
      'El refugio lo elige e-PetPlace y la entrega la coordina el equipo. Una donación no entra a ningún expediente ni suma beneficios: es un regalo, no una compra con premio.',
    // 🔴 S100d · EL AGRADECIMIENTO, al ELEGIR la donación (punto 15).
    // Base del founder: «Agradecemos tu buen corazón, este producto será
    // enviado a un refugio», con el pedido explícito de mejorarla. La voz la
    // escribió B; acá se monta sin retocarla, con sus tres decisiones:
    // ① «no va a llegar a tu casa» es INFORMACIÓN, no cortesía — sin eso
    //    alguien espera un paquete que nunca sale para su dirección.
    // ② el límite de §6.4 se dice como VIRTUD y no como descargo: «no otorga
    //    beneficio comercial» es letra de contrato; esto es la misma regla
    //    dicha de manera que se entienda y además se comparta.
    // ③ NO se nombra ninguna mascota de la familia — el punto del texto es
    //    justamente que no es para ellas.
    // 🔴 S100d · EL PEDIDO QUE NO SE PUEDE ABRIR — y NO es un problema de red.
    //
    // Acá el detalle decía «Revisa tu conexión y prueba de nuevo» con un
    // Reintentar, para un caso donde reintentar NO PUEDE funcionar nunca.
    //
    // ⚠️ LA VOZ SE ESCRIBIÓ PARA EL CASO COMÚN Y **NO** NOMBRA EL RARO (aviso
    // de D, y es de las buenas): el caso «era de otra cuenta» y el caso «ya no
    // está» se ven distintos para quien mira, pero con la vista ya cerrada por
    // `security_invoker` el primero **no debería poder pasar** — y mencionarlo
    // lo reabre como pregunta en la cabeza de quien lee. *Una voz que se
    // defiende de algo que no ocurre le enseña al lector que ocurre.*
    pedidoNoDisponibleTitulo: 'No encontramos este pedido',
    pedidoNoDisponibleDetalle:
      'Puede que ya no esté disponible. Tus otros pedidos siguen acá.',
    pedidoNoDisponibleVolver: 'Ver tus pedidos',
    donacionGraciasTitulo: 'Gracias.',
    donacionGraciasCuerpo:
      'Este producto no va a llegar a tu casa: va a un refugio, a una mascota que todavía está esperando la suya. No suma puntos ni descuentos, y es a propósito: una donación que da algo a cambio deja de ser una donación.',
    donacionGraciasCierre: 'Listo',
    especieNoRegistrada:
      'Este producto es para una especie que todavía no tienes registrada en tu familia. Puedes registrarla ahora o después — la compra sigue igual.',
    registrarla: 'Registrar una mascota',
    totalLoDiceElMotor: 'El total con envío e impuestos lo vas a ver antes de pagar.',
    continuar: 'Continuar',
    errorMascotasDestino:
      'No pudimos cargar tus mascotas para elegir el destino. Puedes comprar igual y atarlo después.',

    // S96 · el checkout (§6/§7)
    checkoutTitulo: 'Tu pedido',
    metodoEntrega: '¿Cómo te llega?',
    metodoDespacho: 'Envío a domicilio',
    metodoRetiro: 'Retiro en tienda',
    retiroDetalle:
      'Lo retiras en el local del vendedor. Cuando esté listo, vas a tener un código para mostrar en el mostrador.',
    aDonde: 'A dónde te lo llevamos',
    sinDireccion: 'Todavía no nos contaste tu dirección.',
    agregarDireccion: 'Agregar mi dirección',
    // ☠️ S100b-A · G-11: murió `cambiarDireccion`. La dirección dejó de tener
    // un botón propio — la línea con chevron ES el control (referencia Laika).
    quienRecibe: 'Quién recibe',
    listoDatos: 'Listo',
    receptorLabel: 'Quién recibe',
    telefonoLabel: 'Teléfono de contacto',
    // El benchmark lo vuelve barato y obligatorio: 49 % de los sitios NO
    // explica por qué pide el teléfono, y más del 70 % de los encuestados es
    // reticente a darlo. Decir para qué es, al lado del campo, cuesta nada.
    telefonoAyuda: 'Es el número al que llama el repartidor si no encuentra la casa.',
    instruccionesLabel: 'Instrucciones de entrega',
    instruccionesAyuda:
      'Lo que el repartidor tiene que saber: "dejar en portería", "entregar a Carla". Si no hay nadie, esta instrucción decide.',
    cuandoLlega: 'Cuándo te llega',
    sinVendedorDetalle:
      'Todavía no podemos calcular la entrega de este pedido desde la app. Estamos terminando esa conexión.',
    promesaCargando: 'Calculando la próxima ventana de entrega…',
    sinCupoEseDia: 'Ese día no hay capacidad de reparto. Elige otro.',
    vendedorSinReparto: 'Este vendedor todavía no tiene reparto configurado.',
    promesaFallo: 'No pudimos calcular la ventana de entrega. Prueba de nuevo.',
    promesaVentana: 'Te llega el {{dia}}, entre {{desde}} y {{hasta}}.',
    saltoPorCupo: 'El día más cercano estaba completo, así que la entrega corrió al siguiente con lugar.',
    // 🔴 D-872 (b) · LAS DOS CAUSAS QUE `saltoPorCupo` NO PUEDE DECIR.
    // `saltoPorCupo` afirma ESCASEZ. El motor distingue `sin_operacion`
    // (ese día el vendedor no reparte: domingo, feriado propio) de
    // `cupo_lleno`, y son cosas distintas para quien decide comprar.
    saltoPorSinOperacion:
      'El día más cercano el vendedor no reparte, así que la entrega pasa al siguiente día que sí.',
    // Para `mixto` y para `null` (motor viejo o valor desconocido): dice que
    // la entrega corrió SIN afirmar por qué. Fail-closed de significado.
    saltoSinCausa:
      'El día más cercano no estaba disponible, así que la entrega pasa al siguiente con lugar.',
    // La ley de la firma: qué NO se puede, qué SÍ, y termina en pregunta.
    promesaFichaSinEntrega:
      'Este vendedor no hace entregas a domicilio por ahora. Puedes retirar tu pedido en la tienda, ¿te sirve así?',
    // S100 · F5: la división se declara ANTES de pagar. La voz dice lo
    // CONCRETO —cuántas entregas y qué va en cada una—, no el hecho abstracto:
    // que llegue en partes no molesta; que llegue una parte cuando esperabas
    // todo, sí.
    divisionTitulo: 'Tu compra llega en {{n}} entregas',
    divisionDetalle:
      'Son pedidos independientes, uno por tienda: llegan por separado y los sigues por separado. Pagas una sola vez.',
    preparaTienda: 'Lo prepara: {{tienda}}',
    bloqueEntrega: 'Entrega {{i}} de {{n}}',
    ventanaProxima: 'La más próxima',
    sinLugarEseDia: 'Sin lugar ese día',
    // ☠️ S100b-A · G-16: murieron `programarFecha`, `programarPlaceholder`,
    // `programarAyuda` y `quitarFecha` — el control quedó DEROGADO por firma
    // del founder (17-ago-2026) y `LETRA_RECORRIDO_DESPENSA_S96` §6.2 está
    // tachada. Se borran las claves y no solo el montaje: *una voz sin
    // consumidor es la mitad del control esperando que alguien la vuelva a
    // usar* — y este control ya volvió tres veces. El motor conserva su
    // `p_fecha_programada`; lo que no queda es con qué decirlo.
    resumen: 'El total de tu pedido',
    subtotal: 'Productos',
    impuesto: 'IVA',
    envio: 'Envío',
    envioRetiro: 'Retiro en tienda',
    total: 'Total',
    // S100c-D · el comprobante, dentro de la carta del total. NO hay camino
    // a abrirlo, y es MEDIDO: las 6 facturas de la base tienen `archivo_url`
    // y `pdf_url` en CERO. Un botón que no abre nada es una puerta que
    // rebota (Ley 23) — y encima sobre el papel de la contabilidad ajena.
    facturaNumero: 'Factura',
    totalNoLlego: 'Este pedido ya estaba creado. El total lo ves en Tus pedidos.',
    pagoSimuladoTitulo: 'Pago simulado',
    pagoSimuladoDetalle:
      'Todavía no hay medio de pago real: no se cobra nada, no se factura nada. Es una compra de prueba y queda marcada así.',
    pagoSimuladoRecordatorio: 'Este pedido quedó con pago SIMULADO: no se cobró nada.',
    exitoTitulo: 'Listo',
    exitoCuerpo: 'Tu pedido quedó creado.',
    /* 🔴 S101-D · ⑤ LA VOZ VIEJA DEL ÉXITO. Decía «Te avisamos cuando el
       vendedor lo confirme» — la frase del mundo ANTERIOR al motor de pagos,
       cuando no había cobro y lo único que podía pasar después era que la
       tienda mirara el pedido. **Hoy lo que se confirma es EL PAGO.**
       Medido antes de reescribirla, porque una voz de éxito que se cambia sin
       medir su momento fabrica una mentira nueva: esta fase se alcanza SOLO
       con `espera.estado === 'pagada'` (`checkout.tsx:208`), o sea con el
       servidor diciendo pagada — el webhook o el barrido, jamás la respuesta
       síncrona que §0 de la letra prohíbe tratar como confirmación.
       ⇒ Puede decir «confirmado» sin mentir. Y NO promete un aviso que esta
       pantalla no controla: dice el hecho y ofrece el camino. */
    exitoDetalle: 'Tu pago quedó confirmado. Puedes seguir el pedido en Tus pedidos.',
    exitoRetiro: 'Cuando esté listo para retirar, vas a ver el código para el mostrador en el detalle del pedido.',
    verTotal: 'Ver el total',
    pagarSimulado: 'Pagar',
    verTusPedidos: 'Ver tus pedidos',
    faltaItems: 'El carrito está vacío.',
    faltaVendedor: 'Todavía no podemos crear pedidos desde la app: falta conectar el vendedor de la oferta.',
    faltaCargando: 'Cargando tu dirección…',
    faltaDireccion: 'Falta tu dirección de entrega.',
    faltaPunto: 'A tu dirección le falta el punto en el mapa. Abrila y ajustalo — es lo que encuentra tu casa.',
    faltaReceptor: 'Cuéntanos quién recibe.',
    faltaTelefono: 'Falta un teléfono de contacto.',
    faltaPromesa: 'No hay ventana de entrega disponible — revisa la fecha o prueba retiro en tienda.',

    // S96 · la recurrencia (§6.1 — el mensaje honesto es VERBATIM de la letra)
    recurrenciaTitulo: 'Que llegue solo',
    recurrenciaHonesta:
      'Este pedido se cargará automáticamente al medio de pago guardado. Lo puedes desactivar cuando quieras.',
    recurrenciaSinPasarela:
      'El cobro automático se activa cuando esté el medio de pago. Hasta entonces, nada se cobra.',
    recurrenciaCada: '¿Cada cuánto?',
    // S100b-A · G-13: la voz del hueco. El interruptor dice la intención; la
    // cadencia la cierra, y mientras falta la pantalla lo DICE.
    recurrenciaElegiCada: 'Elige cada cuánto quieres que llegue y queda configurado.',
    recurrenciaQueEs: 'Qué es «Que llegue solo»',
    recurrenciaDias: 'Cada {{n}} días',
    /* ☠️ S103-C · MUERE EL VOSEO **y muere la promesa de lugar**, que era la
       mitad cara. Decía: *«Listo: quedó configurado. Lo **manejás** desde Tus
       pedidos.»*

       · **`manejás`** era el ÚNICO voseo vivo en un valor de cadena del
         diccionario del cliente (medido: los otros hits son comentarios).
         `D-857` declaró las 34 barridas en S101-D y **ésta sobrevivió**,
         porque aquel barrido cubría *«las SEIS SUPERFICIES DE PAGO»* y esta
         cadena es de despensa.
       · 🔴 **«Lo manejas desde Tus pedidos» apuntaba a una superficie que no
         existe.** Medido: las cuatro rutas de `(tabs)/pedidos/` no mencionan
         la serie, y no hay lector. *No es una promesa vaga: es una promesa con
         dirección — le dice a la familia dónde ir, y ahí no hay nada.*

       ⇒ **La frase dice lo que hoy es verdad y nada más.** El camino vuelve
       cuando el lector de A exista y la entrada se pueda dibujar. *Se publica
       lo incompleto, jamás lo falso.* */
    recurrenciaLista: 'Listo: quedó configurado.',
    recurrenciaActiva: 'La compra recurrente quedó configurada.',
    recurrenciaApagada: 'Listo: la compra recurrente quedó apagada.',

    // S96 · la escalera del pedido (§8.1 — CUATRO pasos; "Preparando" tapa
    // los tres escalones internos del vendedor a propósito).
    // S100-D: `pasoPagando` murió con su escalón — `pagando` es ANTES de
    // que exista una promesa, así que no es peldaño (receta de B §1). Su
    // voz la pone ahora el catálogo (`narrativa_nombre`), no este mapa.
    // 🔴 S100d · LAS VOCES DE LA ESCALERA PASAN DE ETIQUETA A RELATO.
    // Firma del founder: *«debería salir con la escalera y un mensaje de
    // "estamos preparando tu pedido"… muy parecido a como lo maneja Rappi»*.
    // ⏪ Decían «Confirmado · Preparando · En camino · Entregado» — **rótulos
    // de estado de máquina**: nombran la casilla, no le cuentan nada a nadie.
    // Ahora **narran en primera persona del plural**, que es lo que hace la
    // referencia: *quien mira no quiere saber en qué estado está su pedido —
    // quiere saber qué está pasando con su comida.*
    // ⚠️ Y NO rompen la fila de la lista: en `registro="compacta"` la pieza
    // usa la etiqueta **solo para el lector de pantalla** (medido en su
    // fuente), así que el largo nuevo no toca la tira de cuatro nodos.
    pasoConfirmado: 'Recibimos tu pedido',
    pasoPreparando: 'Estamos preparando tu pedido',
    pasoEnCamino: 'Tu pedido va en camino',
    pasoEntregado: 'Tu pedido llegó',
    // S100b-D · LA VOZ DEL PEDIDO QUE TODAVÍA NO TIENE RECORRIDO. El NOMBRE
    // del estado lo pone el catálogo (`narrativa_nombre`); esto explica qué
    // significa. Tiene que ser verdad para los DOS casos que `pagando` tapa
    // —pago sin confirmar y revisión de riesgo—, porque decirle a alguien
    // que está bajo sospecha de fraude es maltrato (`_despensa-comun.ts`).
    // Por eso habla del PAGO y no del vendedor: el vendedor todavía no lo
    // vio, y prometer que "lo está confirmando" sería falso.
    estadoSinRecorrido: 'Todavía no confirmamos el pago. Te avisamos apenas esté.',
    // S100-D · L3 · la ceremonia de la entrega. NO repite «Entregado» —
    // eso ya lo dice la escalera, que es el ESTADO. Esto es el MOMENTO, y
    // por eso está en pasado y en voz de familia. Cero euforia de compra:
    // esta casa no celebra transacciones (MODELO_LOYALTY §5).
    celebracionLlego: 'Tu pedido llegó',
    // El tercer acto: EL SEDIMENTO. Habla del EXPEDIENTE, jamás de puntos ni
    // de recompensa — comprar no es cuidar (MODELO_LOYALTY §5). Y no felicita
    // a nadie por comprar: dice qué quedó, que es otra cosa.
    celebracionSedimento: 'Quedó en la historia de {{nombre}}',
    celebracionSedimentoVarias: 'Quedó en la historia de tus mascotas',
    // S100-D · L2 · EN CAMINO. La ventana es RANGO y jamás el minuto (N14):
    // prometer un minuto que no podemos cumplir es peor que no prometer.
    enCaminoEntrada: 'Seguir el pedido',
    enCaminoEntradaDetalle: 'Mira por dónde va',
    enCaminoCta: 'Ver por dónde va',
    enCaminoTitulo: 'En camino',
    enCaminoSinTrack: 'Todavía no tenemos su ubicación. Apenas salga, vas a poder seguirlo acá.',
    enCaminoVentana: 'Llega entre',
    enCaminoVentanaDetalle: 'Es una ventana, no una hora exacta.',
    enCaminoRecentrar: 'Volver al recorrido',
    enCaminoQuienTrae: 'Quién lo trae',
    // S100c-D · la hoja arrastrable. La voz del asa dice QUÉ hace, no cómo
    // se hace (nadie necesita que le expliquen que se arrastra: se agarra).
    enCaminoHojaVerMas: 'Ver los detalles del pedido',
    // 🔴 S100d · punto 24③ — la voz del asa DEJA DE SER SOLO PARA EL LECTOR DE
    // PANTALLA y se dibuja. Al hacerse visible necesita su otra mitad: una
    // señal que dice «ver más» cuando ya está abierta miente. *La flecha y la
    // voz cambian juntas o no cambia ninguna.*
    enCaminoHojaVerMenos: 'Ocultar los detalles',
    // 🔴 El hueco de la foto se NOMBRA para el lector de pantalla en vez de
    // quedar mudo: un círculo vacío sin voz es un elemento que no existe
    // para quien no ve, y acá el hueco es información (la ficha está
    // incompleta A PROPÓSITO, con su deuda firmada).
    repartidorSinFoto: 'Todavía no mostramos su foto',
    // 🔴 S100d · LA VENTANA QUE YA PASÓ (firma del founder). Describe lo que
    // la familia ya está viendo y **no atribuye culpa**: la app sabe que la
    // hora pasó, no sabe por qué. *«Demorado» sería una acusación al vendedor
    // que no podemos sostener con lo que tenemos.*
    ventanaTardando: 'Está tardando más de lo previsto',
    promesaRango: '{{desde}} y {{hasta}}',
    vehiculoMoto: 'Moto',
    vehiculoCarro: 'Carro',
    desvioNoLlego: 'La entrega no se pudo hacer',
    desvioNoLlegoDetalle: 'El pedido volvió con el vendedor. Lo coordinamos de nuevo por WhatsApp.',
    desvioCancelado: 'Cancelado',

    // S96 · Tus pedidos
    promesaCorta: '{{dia}}, {{desde}}–{{hasta}}',
    pedidoDel: 'Pedido del {{dia}}',
    // S100c-D · qué trae el pedido, en el título de la fila. «y N más» y no
    // «N productos»: **20 de 23 pedidos de la cuenta del gate tienen UN solo
    // ítem** — la voz se escribe para el caso real, no para el ejemplo.
    pedidoTraeVarios: '{{producto}} y {{n}} más',
    verPedido: 'Ver el pedido',
    errorPedidosTitulo: 'No pudimos cargar tus pedidos',
    sinPedidosTitulo: 'Todavía no pediste nada',
    sinPedidosDetalle: 'Cuando hagas tu primer pedido, lo vas a seguir desde acá.',

    // S96 · el detalle del pedido
    pedidoTitulo: 'Tu pedido',
    errorPedidoTitulo: 'No pudimos cargar este pedido',
    codigoPuerta: 'El código de tu entrega',
    codigoPuertaDetalle: 'Díselo a quien te lleve el pedido. Es lo que confirma que te llegó a ti.',
    codigoMostrador: 'El código para el mostrador',
    codigoMostradorDetalle: 'Mostralo en el local cuando retires tu pedido.',
    quePediste: 'Qué pediste',
    lineaCantidad: '{{n}} u.',
    lineaLote: 'Lote {{lote}}',
    lineaDonacion: 'Donación',
    lineaPara: 'Para {{nombre}}',
    instruccionDicha: 'Instrucción de entrega: {{texto}}',
    cancelarPedido: 'Cancelar el pedido',
    cancelarDetalle:
      'Todavía nadie empezó a prepararlo, así que cancelar no cuesta nada. Después de este punto, el botón cambia y lo conversamos.',
    cancelarConfirmar: 'Sí, cancelar',
    cancelarNo: 'No, lo dejo',
    canceladoOk: 'El pedido quedó cancelado.',
    tengoUnProblema: 'Tengo un problema',
    // 🔏 Horario FIRMADO por el founder (12-ago-2026, vía A): 8:00–21:00.
    problemaDetalle: 'Te lleva al WhatsApp del equipo de e-PetPlace. Contestamos de 8:00 a 21:00.',
    problemaMensaje: 'Hola, tengo un problema con mi pedido {{numero}}.',
    problemaFallback: 'No pudimos abrir WhatsApp. Escríbenos al {{numero}}.',
    paraQuienFue: '¿Para quién fue?',
    atarConfirmar: 'Sumar a su expediente',
    atadoOk: 'Listo: quedó atado. Entra a su expediente al entregarse.',
    atadoConEvento: 'Listo: ya es parte de su historia.',

    // S96 · el reclamo del código (§4 — el vendedor jamás elige la mascota)
    reclamoTitulo: 'El código de tu factura',
    reclamoIntro:
      'Si compraste en el local, tu factura tiene un código. Ingrésalo, elige para quién fue, y la compra entra a su expediente.',
    reclamoCodigoLabel: 'Código',
    reclamoCodigoPlaceholder: 'El código impreso en tu factura',
    reclamoFaltaCodigo: 'Ingresa el código de la factura.',
    reclamoFaltaMascota: 'Elige para quién fue la compra.',
    reclamoSinMascotasTitulo: 'Todavía no registraste ninguna mascota',
    reclamoSinMascotasDetalle: 'La compra entra al expediente de una mascota. Registrala primero — tarda un minuto.',
    reclamoCta: 'Sumar al expediente',
    reclamoListoTitulo: 'Ya es parte de su historia',
    reclamoListoDetalle: 'La compra quedó en el expediente de {{nombre}}.',
    reclamoVolver: 'Volver a la despensa',

    // Los vacíos — con camino, jamás finales mudos
    vacioTitulo: 'La despensa todavía está vacía',
    vacioDetalle:
      'Estamos armando el catálogo con productos que sirvan de verdad a tu mascota. Cuando esté, lo vas a ver acá.',
    sinParaMascotaTitulo: 'Nada para {{nombre}} por ahora',
    sinParaMascotaDetalle:
      'Puede que todavía no haya productos cargados, o que lo publicado no sea para ella. Puedes ver toda la despensa igual.',

    // Los errores — dicen qué pasó y qué hacer (Ley 17.4)
    errorMascotasTitulo: 'No pudimos cargar tus mascotas',
    errorVitrinaTitulo: 'No pudimos cargar la despensa',
    errorVitrinaDetalle: 'Puede ser la conexión. Prueba de nuevo.',
    errorRecoTitulo: 'No pudimos armar la recomendación',
    errorRecoDetalle: 'Prueba de nuevo en un momento.',
    errorFichaTitulo: 'No pudimos cargar este producto',
    errorFichaDetalle: 'Puede ser la conexión. Prueba de nuevo.',
    // 🔴 La verificación fail-closed del wrapper. NO es "no hay nada":
    // es "no podemos garantizar que sea seguro", y se dice así.
    exclusionRotaTitulo: 'Preferimos no mostrarte nada',
    exclusionRotaDetalle:
      'No pudimos comprobar que estos productos sean seguros para {{nombre}}. Antes que arriesgarnos, no te mostramos ninguno.',

    // Las seis especies activas (medidas contra cat_especies), en plural:
    // la frase es "Está pensado para perros".
    especiePerro: 'perros',
    especieGato: 'gatos',
    especieConejo: 'conejos',
    especieAve: 'aves',
    especieRoedor: 'roedores',
    especiePez: 'peces',
  },
  citasMascota: {
    titulo: 'La cita de {{nombre}}',
    tituloSinNombre: 'Su cita',
    estadoConfirmada: 'Confirmada',
    // S71-A (costura de D-439) — la cita aprobada que espera fecha.
    // LOTE PENDIENTE DE GATE FOUNDER. Tuteo neutro.
    estadoPorCoordinar: 'Aprobado · Falta coordinar la fecha',
    faltaCoordinar: 'Falta coordinar la fecha',
    procedimientoConExtras: '{{primera}} +{{n}}',
    coordinaraNegocio: '{{negocio}} te va a contactar para agendar',
    // sin nombre visible del negocio: la verdad igual, sin inventar quién
    coordinaranSinNombre: 'Te van a contactar para agendar',
    quienAtiende: 'Quien la atiende',
    otrasActivas: 'Sus otras citas',
    vacio: 'Sin citas por venir',
    vacioDetalle: 'Cuando reserves una cita, la vas a ver acá.',
    error: 'No pudimos cargar las citas.',
    errorDetalle: 'Prueba de nuevo en un momento.',
    reintentar: 'Probar de nuevo',
  },
  // LOTE S69 · APROBADO founder 18-jul (lectura de cierre — mecánica D-315).
  // Voz honesta v1-sin-fecha FIRMADA por la mesa: la cita nace sin día fijo,
  // la clínica coordina; jamás se promete un {fecha} que no existe.
  presupuesto: {
    tituloPendiente: 'Tienes un presupuesto para aprobar',
    recibido: 'Te llegó el {{fecha}}',
    vence: 'Vale hasta el {{fecha}}',
    total: 'Total',
    queSigue: 'Si lo apruebas, la clínica coordina contigo el día del procedimiento — el precio queda congelado.',
    aprobar: 'Aprobar',
    rechazar: 'Rechazar',
    aprobadoOk: 'Aprobaste el presupuesto — la clínica coordina el día del procedimiento con este precio.',
    rechazadoOk: 'Rechazaste el presupuesto.',
    errorAccion: 'No pudimos completar la acción. Prueba de nuevo.',
  },

  // S70-A4 — el parte de la consulta clínica en voz de familia
  parte: {
    titulo: 'La visita de {{nombre}}',
    tituloSinNombre: 'La visita al veterinario',
    enNegocio: 'En {{negocio}}',
    diagnostico: 'Lo que encontró el veterinario',
    formulaTitulo: 'Lo que tienes que darle',
    cantidad: 'Cantidad {{n}}',
    dosisLinea: '{{dosis}}, {{frecuencia}}',
    porDias: 'Durante {{dias}} días',
    via: 'Por vía {{via}}',
    examenesTitulo: 'Estudios pedidos',
    examenPedido: 'Pedido',
    // S71-A CURA-2(c): el estado real del estudio (dominio del CHECK vivo).
    // Voz de familia, tuteo neutro — LOTE PENDIENTE DE GATE FOUNDER.
    examenEnProceso: 'En proceso',
    examenResultado: 'Resultado listo',
    examenRevisado: 'Revisado por el vet',
    examenCancelado: 'Cancelado',
    proximoControl: 'Próximo control',
    // S82-C lazo 1: la celda que preserva el original clínico (19.1 —
    // murió el ghost mudo "Ver completo"; motivoLabel/proximoControlFecha
    // /verCompleto salieron por Ley 37: cero consumidores).
    notaDelVet: 'La nota del veterinario',
    notaDelVetDetalle: 'El registro original, tal como lo escribió',
    notaClinica: 'Nota clínica',
    notaMotivo: 'Motivo de consulta',
    notaAnamnesis: 'Antecedentes',
    notaExamen: 'Examen físico',
    notaPlan: 'Plan terapéutico',
    notaIndicaciones: 'Indicaciones',
    sinFormula: 'No le recetaron nada esta vez.',
    error: 'No pudimos cargar la visita.',
    errorDetalle: 'Prueba de nuevo en un momento.',
    reintentar: 'Probar de nuevo',
  },

  // S70-A5 — la Hoja de autorización del handshake del mostrador
  autorizacion: {
    tituloAtencion: '{{negocio}} quiere atender a {{mascota}}',
    tituloAlta: '{{negocio}} quiere registrar a {{mascota}} en tu familia y atenderlo hoy',
    // S82-C L3: voseo→tuteo al tocarse la pantalla (regla 27; C3 de la
    // directiva de craft, re-verificado contra fuente).
    cuerpo: 'Si autorizas, el negocio va a poder ver y cuidar su expediente.',
    autorizar: 'Autorizar',
    rechazar: 'Rechazar',
    autorizadaOk: 'Listo, {{negocio}} ya puede atenderlo.',
    rechazadaOk: 'Rechazaste la solicitud.',
    vencida: 'La solicitud venció. Pídela de nuevo en el mostrador.',
    yaRespondida: 'Ya respondiste esta solicitud.',
    noExiste: 'Esta solicitud ya no está disponible.',
    error: 'No pudimos completar la acción. Prueba de nuevo.',
    cerrar: 'Cerrar',
    cargando: 'Cargando…',
  },

  // S104-C · TANDA 3 — la salida. Cerrar la cuenta con motor (P15 cl.4) +
  // exportar (cl.5). El texto se ALINEA a la Política publicada (§19.3/§19.4/
  // §19.5): el cierre NO borra, es seudonimización — jamás «borrar todo».
  cerrarCuenta: {
    titulo: 'Eliminar cuenta',
    intro: 'Eliminar tu cuenta no borra todo de golpe. Esto es exactamente qué se va y qué queda.',
    seVaTitulo: 'Qué se va',
    seVaAcceso: 'Tu acceso y tus sesiones: no vuelves a entrar con este correo y esta clave.',
    seVaExternas: 'Tus formas de entrar con otras cuentas, como Google, si las usaste.',
    seVaArchivos: 'Tus archivos personales y tu foto de perfil.',
    seVaCarnet: 'Las fotos del carnet de tus mascotas desaparecen de las impresiones que ya generaste.',
    quedaTitulo: 'Qué queda, desligado de ti',
    quedaConsentimientos:
      'El registro de qué aceptaste: es la prueba de qué se te prometió, y la ley obliga a conservarla.',
    quedaPagos: 'Tus pagos, por obligación fiscal.',
    quedaExpediente:
      'Los hechos del expediente de tu mascota, porque tu mascota puede cambiar de familia y su historia le pertenece a ella.',
    ventana:
      'Tienes 30 días para arrepentirte: escribe a {{correo}} y volvemos todo atrás. Pasados los 30 días, el cierre es definitivo.',
    exportarCta: 'Exportar mis datos antes de irme',
    exportarDetalle: 'Te enviamos una copia de todo a tu correo.',
    continuar: 'Continuar',
    confirmarTitulo: '¿Eliminamos tu cuenta?',
    // El mensaje va COMPLETO acá: al confirmar pierde el acceso EN EL ACTO, y
    // ésta es la última pantalla que ve — después no puede volver a leerlo.
    confirmarCuerpo:
      'Al confirmar, pierdes el acceso ahora mismo. Tienes 30 días para volver atrás escribiendo a {{correo}}; pasado ese plazo, ya no podrás entrar ni recuperarla. Guarda ese correo antes de continuar.',
    // Firma founder: la imagen del carnet se reproduce en las impresiones ya
    // generadas; al borrarse (cierre definitivo) quedan sin ella.
    confirmarCarnet:
      'Y algo que solo se ve al cerrar: cuando el cierre sea definitivo, las fotos del carnet de tus mascotas se borran, y las impresiones que ya generaste quedan sin ellas.',
    confirmarCta: 'Eliminar mi cuenta',
    volver: 'No, volver',
    listoTitulo: 'Tu cuenta quedó en proceso de cierre',
    yaEstabaTitulo: 'Tu cuenta ya estaba en proceso de cierre',
    listoCuerpo:
      'Perdiste el acceso. Tienes hasta el {{fecha}} para volver atrás escribiendo a {{correo}}. Después, el cierre es definitivo.',
    escribir: 'Escribir a privacidad',
    salir: 'Salir',
    asistidoTitulo: 'Esto lo resolvemos contigo',
    asistidoCuerpo:
      'Tu cuenta está enlazada a algo que no se puede cerrar con un botón sin dejar a otras personas sin acceso. Escríbenos a {{correo}} y lo resolvemos juntos.',
    errorGenerico: 'No pudimos eliminar tu cuenta ahora. Prueba de nuevo en un momento.',
    reintentar: 'Probar de nuevo',
  },
  exportarDatos: {
    titulo: 'Exportar mis datos',
    intro:
      'Pídenos una copia de todo lo que e-PetPlace guarda sobre ti y tus mascotas. Es tu derecho, y te la damos.',
    detalle: 'Preparamos el archivo y te lo enviamos a tu correo, con un enlace que vence. Puede tardar un rato.',
    cta: 'Pedir mi copia',
    enviado:
      'Listo. Te enviamos tu copia a {{correo}}. Revisa tu correo (y la carpeta de spam) en las próximas horas.',
    yaEnCamino: 'Ya te la estamos preparando. Te llega a {{correo}}: revisa tu correo en las próximas horas.',
    error: 'No pudimos preparar tu copia ahora. Prueba de nuevo en un momento.',
    pedirDeNuevo: 'Pedirla de nuevo',
  },
} as const;
