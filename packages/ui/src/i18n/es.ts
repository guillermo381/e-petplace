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
    // S61-A11 (LOTE S61, gate pendiente): colapsada + voz del grooming
    verMas: 'Ver más',
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
  clipSesion: {
    reproducir: 'Reproducir el clip',
    cargando: 'Cargando el clip',
    error: 'Este clip no se pudo cargar.',
    reintentar: 'Probar de nuevo',
  },
  // S68-B7 — SliderPrecio: la edición numérica (firma founder del gate)
  sliderPrecio: {
    editarHint: 'Toca para escribir el valor exacto',
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
} as const;
