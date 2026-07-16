/**
 * La voz del design system en inglés — espejo EXIGIBLE del español:
 * una clave faltante o sobrante rompe el typecheck (Espejo<typeof uiEs>).
 */

import type { Espejo } from '@epetplace/i18n';

import type { uiEs } from './es';

export const uiEn = {
  lineaDeVida: {
    cargando: 'Loading the timeline',
    cargarMas: 'Load more',
    // S61-A11 (LOTE S61, gate pendiente): colapsada + voz del grooming
    verMas: 'See more',
    vozGrooming: 'Grooming',
    reintentar: 'Try again',
    errorCargarMas: "We couldn't load more moments.",
    vozPaseo: 'Walk',
    vozAlta: 'Joined the family',
    vozVacuna: 'Got the {{nombre}} vaccine',
    vozVacunaSinNombre: 'Got a vaccine',
    vozMomentoCuidado: 'A moment of care',
    vozNovedadExpediente: 'Record update',
    vozMomentoGuardado: 'A saved moment',
    hoy: 'Today',
    ayer: 'Yesterday',
  },
  fichaVacuna: {
    aplicada: 'given',
    proxima: 'next',
    vacunaDelCarnet: 'vaccine from the card',
    tocaParaEditar: 'tap to edit',
    rechazadaVoz: "This one couldn't be saved. Tap it to review.",
    sinFechaVoz: "We couldn't read the date",
  },
  // ── S55-A A3 (D-315): the rest of the design system's inner voice ──
  campo: {
    mostrarContrasena: 'Show password',
    ocultarContrasena: 'Hide password',
    ver: 'Show',
    ocultar: 'Hide',
  },
  esqueleto: {
    cargando: 'Loading',
  },
  visorFoto: {
    fotos: 'Photos',
    cerrar: 'Close',
    fotoNdeM: 'Photo {{i}} of {{total}}',
    conteo: '{{i}} of {{total}}',
  },
  campoFecha: {
    placeholder: 'When were they born?',
    tituloHoja: 'Date of birth',
    mes: 'Month',
    anio: 'Year',
    diaOpcional: 'Day · optional',
    listo: 'Done',
    noSeLaFecha: "I don't know the date",
    etapaCachorro: 'Puppy or kitten',
    etapaCachorroDetalle: 'under 1 year',
    etapaJoven: 'Young',
    etapaJovenDetalle: '1 to 3 years',
    etapaAdulto: 'Adult',
    etapaAdultoDetalle: '3 to 7 years',
    etapaMayor: 'Senior',
    etapaMayorDetalle: 'over 7 years',
    aproximada: 'approximate',
    estimada: 'estimated',
    etapaDeVida: 'Life stage',
    elegirEtapaGuia: 'Pick the stage that fits them best and we estimate the year.',
    volverALaFecha: 'Back to the date',
  },
  selectorAvatar: {
    invitacion: 'Add a photo',
    fotoDe: "{{nombre}}'s photo",
    fotoElegida: 'Photo chosen',
    sinFoto: 'No photo',
    cambiar: 'Change',
    quitar: 'Remove',
    permisoCamara: "We need the camera for {{nombre}}'s photo. You can enable it in your phone settings, or pick a photo from the gallery.",
    abrirAjustes: 'Open settings',
    elegirGaleria: 'Pick from the gallery',
    tomarFoto: 'Take a photo',
    porAhoraNo: 'Not right now',
    abrirOpcionesHint: 'Opens the options to take or pick a photo',
  },
  // S59 §7.1 — la voz única del estado en vivo (GATE PENDIENTE, lote S59)
  citaEnVivo: {
    estado: 'Live',
    estadoMemorial: 'In progress',
  },
  // S63 — program STATE voice (Ley 3, founder-signed): the motor word
  // 'vencido' never reaches UI — "Ended" states the fact, no reproach.
  programaEstado: {
    activo: 'In progress',
    completado: 'Completed',
    vencido: 'Ended',
    cancelado: 'Cancelled',
  },
  // S63 — ClipSesion (training short clip; LOTE S63, founder gate pending)
  clipSesion: {
    reproducir: 'Play the clip',
    cargando: 'Loading the clip',
    error: "This clip couldn't load.",
    reintentar: 'Try again',
  },
  evidenciaFoto: {
    foto: 'Photo',
    agregarEvidencia: 'Add evidence',
    tomarFoto: 'Take a photo',
    elegirGaleria: 'Pick from the gallery',
    permisoCamara: 'We need the camera to record evidence of the visit. You can enable it in your phone settings.',
    abrirAjustes: 'Open settings',
    probarDeNuevo: 'Try again',
    evidencia: 'Evidence',
    evidenciaSubiendo: 'Evidence, uploading',
  },
} as const satisfies Espejo<typeof uiEs>;
