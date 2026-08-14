/**
 * e-PetPlace — Design Tokens v4 · TIPOGRAFÍA
 *
 * CAMBIO v3.1 → v4: SIN Playfair Display. DM Sans es la ÚNICA familia
 * de UI (300/400/500/700) + JetBrains Mono (400/500) para metadata.
 *
 * ═══════════════════════════════════════════════════════════════════
 * REGLA DE VOZ (vinculante — B1 firmado):
 *
 *   JetBrains Mono SOLO para datos que una máquina generó —
 *   IDs, horas, códigos, montos — siempre minúsculas, tracking
 *   suave (.04–.06em), sin text-transform.
 *
 *   Todo lo que describe a un ser vivo o persona va en DM Sans.
 *
 *   Voz humana = DM Sans 300/400 en tamaños lg+.
 *
 *   Vocabulario interno del modelo (M1..M7, IDs de capa) JAMÁS
 *   visible al usuario.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Los nombres de fontFamily son los que registra expo-font vía
 * @expo-google-fonts (ver src/fonts.ts — cargarlos con useFonts en el
 * root layout de cada app antes de renderizar).
 */

export const typography = {

  family: {
    // DM SANS — única voz de UI. Un nombre por peso (así funciona RN:
    // fontFamily selecciona el archivo, fontWeight no aplica a customs).
    sans: {
      light:   'DMSans_300Light',
      regular: 'DMSans_400Regular',
      medium:  'DMSans_500Medium',
      bold:    'DMSans_700Bold',
      // S82-B r15: LA ITÁLICA MURIÓ (decisión founder — está estigmatizada
      // como marca de texto generado por IA en su mercado). El slot se
      // retira ENTERO (Ley 37: lo que sale de la UI sale del código); la
      // voz del producto se reconstruyó con peso, tamaño e interlineado.
    },
    // JETBRAINS MONO — metadata generada por máquina (ver REGLA DE VOZ)
    mono: {
      regular: 'JetBrainsMono_400Regular',
      medium:  'JetBrainsMono_500Medium',
    },
  },

  /* ── LA ESCALA — N1 EJECUTADA POR VÍA A (firma de mesa, 14-ago-2026) ──
     ⏪ Decía «Escala v3.1 intacta». Ya no lo está, y se dice acá.

     LOS TRES QUE SE MOVIERON: `sm` 13→**14** · `base` 15→**16** ·
     `md` 18→**20**. El Norte N1 pide cuerpo 16 · secundario 14 · título
     de sección 20, y **ninguno de los tres existía en la escala**.

     POR QUÉ SE MOVIÓ EL VALOR Y NO SE AGREGARON TOKENS NUEVOS, que era
     la otra vía y se midió: agregar 14/16/20 al lado de 13/15/18 solo
     alcanzaba a quien monta `Texto`. Los **330 usos directos** medidos
     (`size.sm` 208 · `size.base` 92 · `size.md` 30) se quedaban en la
     escala vieja, y dos pantallas vecinas dirían 13 y 14. *Hoy la casa
     es consistente en el valor equivocado; la otra vía la dejaba
     inconsistente, que es peor que no hacer nada.*

     ⚠️ SU COSTO, declarado y no escondido: los 330 sitios cambiaron de
     tamaño de una vez. El riesgo no es el tipo — es el LAYOUT: +1 y +2 px
     mueven truncados, alturas de fila y saltos de línea en pantallas que
     nadie va a volver a mirar una por una. **Esto necesita ojo en
     dispositivo, y B no lo tiene.**

     `xs` (11), `lg` (22), `xl` (28) y de ahí para arriba NO se tocan:
     N1 no los nombra, y mover lo que la letra no pide es inventar. */
  size: {
    xs:    11,
    sm:    14,
    base:  16,
    md:    20,
    lg:    22,
    xl:    28,
    '2xl': 32,
    '3xl': 38,
    '4xl': 48,
    hero:  56,
    display: 68,
  },

  // Pesos — solo informativos para web/RN-web; en nativo el peso
  // viene dado por la familia (ver family arriba)
  weight: {
    light:   '300',
    regular: '400',
    medium:  '500',
    bold:    '700',
  },

  // Altura de línea (multiplicadores — en RN: lineHeight = size * leading)
  leading: {
    tight:   1.1,
    snug:    1.3,
    normal:  1.6,
    relaxed: 1.75,
  },

  // Espaciado de letras.
  // RN usa letterSpacing en px, no em → valores precomputados por
  // contexto de uso (px ≈ em * fontSize típico del contexto).
  tracking: {
    tight:  -0.4,   // títulos display (≈ -0.025em @ 16px+)
    normal:  0,
    mono:    0.6,   // metadata mono 11-13px (≈ .04-.06em) — REGLA DE VOZ
    wide:    0.8,   // (≈ .05em @ 15px)
    widest:  1.4,   // tags — recordar: mono JAMÁS en mayúsculas
  },

} as const

export type TypeSizeKey = keyof typeof typography.size
