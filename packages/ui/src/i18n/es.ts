/**
 * La voz del design system en español — namespace `ui` (S51-B1a).
 *
 * Acá viven SOLO los strings INTERNOS de los componentes de
 * @epetplace/ui (Ley 3: voz humana, el motor jamás visible). Lo que
 * las pantallas pasan por props es voz de cada app y vive en sus
 * diccionarios. Registro: tuteo neutro (regla 27, decisión founder S51).
 *
 * Los componentes migran su voz acá AL TOCARSE — no hay extracción
 * masiva (deuda registrada en docs/DEUDAS_CANONICAS.md).
 */

export const uiEs = {
  lineaDeVida: {
    cargando: 'Cargando la línea de vida',
    cargarMas: 'Cargar más',
    // S61-A11 (LOTE S61): colapsada + voz del grooming
    // (verMas murió en S73 — la revelación por tandas habla por PieRevelar, ley 19.6)
    vozGrooming: 'Estética y baño',
    reintentar: 'Reintentar',
    errorCargarMas: 'No pudimos cargar más momentos.',
    // Diccionario de voz tipo→texto (S52-P4c: migrado del componente
    // al riel — lote es/en aprobado por founder en S51/S52; la CAPA
    // sigue cerrada en el componente, Ley 3):
    vozPaseo: 'Paseo',
    // S65 (hallazgo founder): la sesión cerrada renderizaba el
    // genérico "Momento guardado" — gana voz, como el grooming en S61.
    vozAdiestramiento: 'Sesión de adiestramiento',
    vozAlta: 'Se sumó a la familia',
    // S71-A CURA-4 (mismo patrón que grooming S61 y adiestramiento S65):
    // la consulta sedimentada caía al genérico "Momento guardado" — gana
    // voz. CANDIDATA A del reporte; el founder elige en gate entre:
    //   A "Visita al veterinario"  ·  B "Consulta veterinaria"
    //   C "Quedó en su historia clínica"
    // Cambiar de voz = cambiar esta línea y su espejo en en.ts.
    vozHistoriaClinica: 'Visita al veterinario',
    vozVacuna: 'Recibió la vacuna {{nombre}}',
    vozVacunaSinNombre: 'Recibió una vacuna',
    vozMomentoCuidado: 'Momento de cuidado',
    vozNovedadExpediente: 'Novedad del expediente',
    vozMomentoGuardado: 'Momento guardado',
    hoy: 'Hoy',
    ayer: 'Ayer',
  },
  fichaVacuna: {
    aplicada: 'aplicada',
    proxima: 'próxima',
    vacunaDelCarnet: 'vacuna del carnet',
    tocaParaEditar: 'toca para editar',
    // S55-A A3 (D-315): voz de estado al riel (voseo→tuteo)
    rechazadaVoz: 'Esta no se pudo guardar. Tócala para revisarla.',
    sinFechaVoz: 'No pudimos leer la fecha',
  },
  // ── S55-A A3 (D-315): el resto de la voz interna del design system ──
  campo: {
    mostrarContrasena: 'Mostrar contraseña',
    ocultarContrasena: 'Ocultar contraseña',
    ver: 'Ver',
    ocultar: 'Ocultar',
  },
  // S104-C · el botón Pegar de CampoCodigo. Solo aparece si expo-clipboard
  // resolvió (require en try/catch): el prestador no lo tiene horneado.
  campoCodigo: {
    pegar: 'Pegar',
  },
  candado: {
    // S104-B · MODELO_LOGIN §2.5 — el candado sobre la sesión.
    // La voz NUNCA nombra el método (huella / rostro): depende del
    // aparato, y prometer «poné el dedo» a quien desbloquea con la cara
    // es el mensaje que miente. El SO ya lo dice en su propio prompt.
    bloqueada: 'Tu sesión está abierta. Desbloquea para volver a entrar.',
    verificando: 'Esperando que tu teléfono te reconozca.',
    // No dice «error» ni culpa a nadie: el SO rechazó UNA lectura, que
    // es cotidiano (dedo mojado, mala luz). Y ofrece la salida en la
    // misma frase, porque es el momento en que hace falta.
    rechazada: 'Tu teléfono no pudo reconocerte. Prueba otra vez o entra con tu contraseña.',
    desbloquear: 'Desbloquear',
    // S104-C · enmienda founder (23-ago): «Entrar con otra cuenta», no «con mi
    // contraseña». Dos razones: la salida CIERRA la sesión y va al login, donde
    // se puede entrar con CUALQUIER cuenta; y un usuario solo-Google NO TIENE
    // contraseña, así que prometerle «con mi contraseña» miente. A ratificación
    // de B (es su pieza).
    usarClave: 'Entrar con otra cuenta',
  },
  cierre: {
    // S104-B · P15 §4 — «qué se va, qué queda y por qué».
    seVa: 'Esto se va',
    queda: 'Esto queda',
    // El titular FIRMADO de P15, textual. No es opcional en la pieza:
    // sin él las dos columnas se pueden volver a leer como «se borra todo».
    titular: 'Cerrar la cuenta la vuelve inalcanzable. No destruye lo que la ley obliga a conservar.',
    enCursoTitulo: 'Tu cuenta se está cerrando',
    // FECHA y no contador: ver el porqué medido en la pieza.
    enCursoFecha: 'Se cierra el {{fecha}}. Hasta entonces podés volver.',
    cancelarCierre: 'Cancelar el cierre',
    enCursoNota: 'Si cancelás, todo sigue como estaba.',
  },
  esqueleto: {
    cargando: 'Cargando',
  },
  visorFoto: {
    fotos: 'Fotos',
    cerrar: 'Cerrar',
    fotoNdeM: 'Foto {{i}} de {{total}}',
    conteo: '{{i}} de {{total}}',
  },
  campoFecha: {
    placeholder: '¿Cuándo nació?',
    tituloHoja: 'Fecha de nacimiento',
    mes: 'Mes',
    anio: 'Año',
    diaOpcional: 'Día · opcional',
    listo: 'Listo',
    noSeLaFecha: 'No sé la fecha',
    etapaCachorro: 'Cachorro',
    etapaCachorroDetalle: 'menos de 1 año',
    etapaJoven: 'Joven',
    etapaJovenDetalle: 'entre 1 y 3 años',
    etapaAdulto: 'Adulto',
    etapaAdultoDetalle: 'entre 3 y 7 años',
    etapaMayor: 'Mayor',
    etapaMayorDetalle: 'más de 7 años',
    aproximada: 'aproximada',
    estimada: 'estimada',
    etapaDeVida: 'Etapa de vida',
    elegirEtapaGuia: 'Elige la etapa que mejor lo describe y estimamos el año.',
    volverALaFecha: 'Volver a la fecha',
  },
  selectorAvatar: {
    invitacion: 'Agrégale una foto',
    fotoDe: 'Foto de {{nombre}}',
    fotoElegida: 'Foto elegida',
    sinFoto: 'Sin foto',
    cambiar: 'Cambiar',
    quitar: 'Quitar',
    permisoCamara: 'Necesitamos la cámara para la foto de {{nombre}}. Puedes habilitarla desde los ajustes del teléfono, o elegir una foto de la galería.',
    abrirAjustes: 'Abrir ajustes',
    elegirGaleria: 'Elegir de la galería',
    tomarFoto: 'Tomar foto',
    porAhoraNo: 'Por ahora no',
    abrirOpcionesHint: 'Abre las opciones para tomar o elegir una foto',
  },
  // ── S59 §7.1 — LA VOZ ÚNICA del estado en vivo (GATE DE STRINGS
  // PENDIENTE, lote S59): una sola palabra para el estado en TODA
  // superficie de ambas apps; memorial conserva su voz serena.
  citaEnVivo: {
    estado: 'En vivo',
    estadoMemorial: 'En curso',
  },
  // S71-A3 — PieRevelar (componente 60, entrada 19.6). Forma NEUTRA a
  // propósito: "Ver las 5 / Ver los 4" obligaría a un género por
  // consumidor. LOTE PENDIENTE DE GATE FOUNDER.
  pieRevelar: {
    ver: 'Ver {{n}} más',
    ocultar: 'Ocultar',
  },
  // S96-B — FilaEntrega. Solo rótulos de FORMA: el contenido (dirección,
  // referencia, instrucción) llega por prop desde el snapshot del envío.
  filaEntrega: {
    instrucciones: 'La familia pidió',
    llamar: 'Llamar',
  },
  // S96-B — EscaleraEstados. Acá vive SOLO el armado del label de
  // accesibilidad, que es FORMA: el número lo pone el componente y el
  // NOMBRE del paso llega por prop. El vendedor lee "Empacado" y la
  // familia "Estamos preparando tu pedido" — mismo hecho, dos
  // audiencias, y una audiencia no se deduplica (`METODO_TRES_PISTAS`
  // §6). Por eso NO hay diccionario de estados en este namespace.
  // S100-B — la vitrina a dos columnas. `sinStock` es BOOLEANO en la
  // pieza: la familia necesita «¿puedo comprar esto?», jamás el
  // inventario ajeno (firma S99).
  tarjetaProducto: {
    sinStock: 'Sin stock',
    sinEntrega: 'No entrega por ahora',
    agregar: 'Agregar {{nombre}} al carrito',
    cantidad: 'Cantidad de {{nombre}}',
    agregarCorto: 'Agregar',
  },
  // H-203 (hallazgo de C): estos dos vivían HARDCODEADOS en español
  // dentro de la pieza. Un lector de pantalla en inglés los oía en
  // español — familia D-539, y acá se cierra donde correspondía.
  stepperCantidad: {
    menos: 'Menos',
    borrar: 'Quitar del carrito',
    quitarDeLaCompra: 'Quitar de la compra',
    mas: 'Más',
  },
  escaleraEstados: {
    progreso: 'Paso {{n}} de {{total}}: {{etiqueta}}',
    progresoSinPaso: 'Paso {{n}} de {{total}}',
  },
  // S63 — la voz del ESTADO DEL PROGRAMA (Ley 3, FIRMADA por el
  // founder): "vencido" JAMÁS llega a UI — la familia no lee su
  // programa como falla ni deuda; "Finalizó" dice el hecho sin
  // reproche. Namespace compartido: la pintan ambas apps.
  programaEstado: {
    activo: 'En marcha',
    completado: 'Completado',
    vencido: 'Finalizó',
    cancelado: 'Cancelado',
  },
  // S63 — ClipSesion (el clip corto del adiestramiento; LOTE S63,
  // gate founder pendiente)
  /* S85-B21 · LA COHORTE — la voz vive ACÁ y no en cada app, y es firma
     de mesa con su argumento: el motor selló la REGLA en un trigger
     (fundador ≤ 2027-03-30, después pionero) precisamente para que nadie
     la re-derive. Dejar la mitad PRESENTACIONAL repartida en dos apps la
     re-deriva un piso más arriba — y dos consumidores componiendo la
     misma frase no divergen el primer día: divergen el mes que viene, y
     el que divergió no se entera. Una sola composición, imposible de
     partir. */
  cohorte: {
    desde: 'Desde',
    fundador: 'Prestador fundador',
    pionero: 'Prestador pionero',
  },
  clipSesion: {
    reproducir: 'Reproducir el clip',
    cargando: 'Cargando el clip',
    error: 'Este clip no se pudo cargar.',
    reintentar: 'Probar de nuevo',
  },
  // S68-B7/B9 — SliderPrecio: la edición numérica con affordance VISIBLE
  // (letra founder B9, voseo ajustado a tuteo — precedente B5/B8)
  // S88-B — Badge (extraído de BarraTabs; la voz del label migra al riel
  // al tocarse — el «pendientes» estaba hardcodeado en la barra desde S43)
  badge: {
    pendientes: '{{etiqueta}}, {{n}} pendientes',
    sinLeer: '{{etiqueta}}, avisos sin leer',
  },
  // S99-B — PuertaHermana: el número viaja en el label del TOCABLE (la
  // puerta entera lo es), jamás como nodo aparte. Voz propia y NO
  // `badge.*`: la palabra firmada por la mesa es «sin ver», y meterle una
  // tercera forma a un hook llamado Badge —para una pieza que no es un
  // Badge— sería torcer la pieza equivocada.
  puertaHermana: {
    sinVer: '{{etiqueta}}, {{n}} sin ver',
  },
  sliderPrecio: {
    editarHint: 'Toca el valor para escribirlo',
  },
  // S68-B — VozComision (7.15: el % es DATO leído; textos heredados
  // VERBATIM de servicios.comision* del prestador, aprobados en su lote)
  vozComision: {
    noDisponible: 'No pudimos leer la comisión vigente.',
    retiene: 'e-PetPlace retiene {{pct}}%',
    neto: 'e-PetPlace retiene {{pct}}% · vas a recibir {{neto}}',
  },
  evidenciaFoto: {
    foto: 'Foto',
    agregarEvidencia: 'Agregar evidencia',
    tomarFoto: 'Tomar foto',
    elegirGaleria: 'Elegir de la galería',
    permisoCamara: 'Necesitamos la cámara para registrar la evidencia de la atención. Puedes habilitarla desde los ajustes del teléfono.',
    abrirAjustes: 'Abrir ajustes',
    probarDeNuevo: 'Probar de nuevo',
    evidencia: 'Evidencia',
    evidenciaSubiendo: 'Evidencia, subiendo',
  },
  /** S99-B · `HojaCaptura` — la puerta única de la foto.
   *
   *  ⚠️ LOS DOS LITERALES SON **VERBATIM** de `fotoEncuadre.camara` y
   *  `fotoEncuadre.galeria` del cliente — la voz del ALTA DE MASCOTA, que
   *  es la superficie que el founder señaló. **No es voz nueva y por eso
   *  no abre lote de gate: es la misma frase cambiando de casa.**
   *  (La casa tenía tres redacciones para esto: 'Sacar una foto' ·
   *  'Tomar foto' · 'Take a photo'/'Pick from the gallery'. Gana la
   *  firmada; las otras mueren cuando su sitio migre.) */
  captura: {
    camara: 'Sacar una foto',
    galeria: 'Elegir de la galería',
  },
} as const;
