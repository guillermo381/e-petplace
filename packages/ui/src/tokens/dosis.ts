/**
 * e-PetPlace — Design Tokens v4 · DOSIFICACIÓN ASIMÉTRICA (B1 firmado)
 *
 * NO son dos temas. Es UNA constante que gobierna cuánta marca recibe
 * cada superficie. La skill epetplace-design-system (B4) la hará exigible.
 *
 *   prestador → dosis 'baja':
 *     · UN acento de capa por vista (no mezclar capas en una pantalla)
 *     · CTA principal en tinta (#1D1A2E = text.primary light), no en color
 *     · SIN gradiente firma — jamás
 *     · La marca aparece en detalles: un borde, un ícono, un estado
 *
 *   dueño → dosis 'alta':
 *     · Capas visibles (verde/teal/pink codifican el modelo a la vista)
 *     · Gradiente firma en contextos cerrados: hero onboarding,
 *       CTA principal del dueño, momento adopción — y nada más
 *     · La calidez (cream/terracotta) puede vestir secciones narrativas
 */

export const dosis = {
  prestador: 'baja',
  dueno: 'alta',
} as const

export type DosisKey = keyof typeof dosis
export type DosisNivel = (typeof dosis)[DosisKey]
