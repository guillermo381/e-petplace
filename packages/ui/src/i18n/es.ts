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
    reintentar: 'Reintentar',
    errorCargarMas: 'No pudimos cargar más momentos.',
  },
} as const;
