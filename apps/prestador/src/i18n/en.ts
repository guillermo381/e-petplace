/**
 * Diccionario inglés del prestador — espejo exigible del español.
 * Voz emocional: propuestas pendientes de gate founder (decisión 7
 * S51); lo funcional se traduce directo.
 */

import type { Espejo } from '@epetplace/i18n';

import type { prestadorEs } from './es';

export const prestadorEn = {
  tabs: {
    hoy: 'Today',
    mascotas: 'Pets',
    negocio: 'Business',
  },
  sesion: {
    sinSesion: 'No active session',
    sinSesionDetalle: 'Signing in with your own account arrives with the next cycle. For now this app runs on the team test session.',
    reintentar: 'Try again',
    cerrarSesion: 'Sign out',
    confirmacionCierre: 'Signing out? Your work stays saved.',
    cancelar: 'Cancel',
    titulo: 'Session',
  },
  agenda: {
    saludo: 'Your walks for today',
    vacio: 'No walks today',
    vacioDetalle: 'When a family books a walk, it will show up here.',
    reintentar: 'Try again',
    enCurso: 'In progress',
    ahora: 'Now',
    loSiguiente: 'Up next',
    primeraVez: 'First time',
    conocerMascota: 'Meet {{nombre}}',
    estadoPorCerrar: 'To close',
    estadoCerrado: 'Closed',
    estadoConfirmada: 'Confirmed',
    estadoCompletada: 'Completed',
    estadoNoShow: 'No show',
  },
  mascotas: {
    titulo: 'Pets',
    vacio: 'The lives you care for will live here',
    vacioDetalle: 'With your first closed visit, the pet joins your history with their record.',
    unaAtencion: '1 visit',
    atenciones: '{{n}} visits',
    error: "We couldn't load the pets",
    errorDetalle: 'Check your connection and try again.',
  },
  detalleMascota: {
    condicionCronica: 'Chronic condition',
    alergias: 'Allergies',
    emergenciaActiva: 'Active emergency',
    sinSenales: 'No care signals recorded in their file.',
    carnet: 'Vaccine card',
    unaVacuna: '1 vaccine on record',
    vacunas: '{{n}} vaccines on record',
    carnetVacio: 'No vaccines on record yet.',
    historial: 'Your history with {{nombre}}',
    atencionCerrada: 'Walk closed',
    atencionEnCurso: 'Walk in progress',
    identidad: 'Identity',
    raza: 'Breed',
    sexo: 'Sex',
    sexoMacho: 'Male',
    sexoHembra: 'Female',
    nacimiento: 'Born',
    peso: 'Weight',
    microchip: 'Microchip',
    error: "We couldn't load the record",
  },
  negocio: {
    titulo: 'Your business',
    enPreparacion: 'In preparation',
    servicios: 'Services & pricing',
    horarios: 'Hours',
    equipo: 'Team',
    cuentaComercial: 'Business account',
    liquidaciones: 'Payouts',
    liquidacionesDetalle: 'Wakes up when you start getting paid through the app.',
    cuentaComercialDetalle: "You'll need it before charging — it arrives with the payments cycle.",
    idioma: 'Language',
    idiomaEs: 'Español',
    idiomaEn: 'English',
    idiomaError: "We couldn't save the language. Try again.",
  },
} as const satisfies Espejo<typeof prestadorEs>;
