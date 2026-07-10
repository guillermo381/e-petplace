/**
 * Diccionario español del dueño — namespace `cliente` (S51-B1a).
 * Registro: tuteo neutro (regla 27, decisión founder S51).
 *
 * Las pantallas existentes migran su voz acá AL TOCARSE (deuda de
 * extracción en docs/DEUDAS_CANONICAS.md); toda pantalla NUEVA nace
 * con sus textos acá — cero strings crudos (regla 26 bilingüe).
 */

export const clienteEs = {
  bienvenida: {
    // El titular y el subtítulo del hero son VOZ EMOCIONAL: siguen
    // hardcodeados en la pantalla hasta el gate del founder (decisión
    // 7 de S51) — migran acá cuando el lote es/en esté aprobado.
    crearCuenta: 'Crear cuenta',
    yaTengoCuenta: 'Ya tengo cuenta',
  },
  ajustes: {
    titulo: 'Ajustes',
    // Nació en voseo (S45) y se transpone a tuteo neutro al tocarse (S51).
    confirmacionCierre: '¿Cierras tu sesión? Tus datos quedan guardados.',
    cerrarSesion: 'Cerrar sesión',
    cancelar: 'Cancelar',
  },
} as const;
