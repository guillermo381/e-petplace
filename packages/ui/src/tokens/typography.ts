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

    /* ═══════════════════════════════════════════════════════════════
     * 🔴 **v5 · LAS DOS FAMILIAS DEL CLIENTE (S116, letra §1.4).**
     * *«Baloo 2 800 para display, títulos y cifras; Plus Jakarta Sans
     * 400/600/700 para todo lo demás»* — **deroga N1 y «la casa no
     * titula en bold»** para la app cliente.
     *
     * ⚠️ **`sans` y `mono` de arriba NO se tocan, y la razón está
     * MEDIDA, no supuesta: el PRESTADOR las consume — 64 ocurrencias en
     * 26 archivos** (`grep -rn 'family\.sans\|family\.mono'
     * apps/prestador/src`), más **130 en 58 piezas compartidas de
     * `packages/ui`** que montan las dos apps. La letra §5 dice que el
     * prestador no cambia; re-apuntar `sans` lo habría cambiado entero
     * y en silencio.
     * ⇒ **DM Sans NO sale del mapa en este lote.** Su disparo real:
     * cuando el prestador tenga su propia letra, o cuando el último
     * lector del CLIENTE migre a `display`/`texto` (censo por import).
     * ═══════════════════════════════════════════════════════════════ */

    /** Baloo 2 ExtraBold — display, títulos y cifras del cliente.
     *  UN solo peso a propósito: la letra nombra 800 y nada más. */
    display: {
      extraBold: 'Baloo2_800ExtraBold',
    },
    /** Plus Jakarta Sans — TODO lo demás del cliente. */
    texto: {
      regular:  'PlusJakartaSans_400Regular',
      semiBold: 'PlusJakartaSans_600SemiBold',
      bold:     'PlusJakartaSans_700Bold',
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
    /** 🔴 **LA ETIQUETA DE UN CONTROL (S113-B, orden del founder).**
     *  Nace porque **13 no estaba y se pidió dos veces**. La escala de
     *  arriba es de PROSA —11 · 14 · 16 · 20…— y una etiqueta de control
     *  no es prosa: es un rótulo que acompaña a un objeto tocable, donde
     *  14 pesa de más y 11 se pierde al lado de un círculo de 48.
     *  ⚠️ **Entra con nombre propio y no como un número más de la escala**,
     *  para que nadie lo tome por el siguiente peldaño de la prosa. Su
     *  compañera obligada es `family.sans.medium`, que es la fuente de los
     *  controles de la casa (la misma de la barra de pestañas). */
    control: 13,
    /** 🔴 **EL DATO GRANDE DE UNA TARJETA DE TABLERO (S113-B · 2.2.1).**
     *  Nace por orden del founder —*«el dato grande baja de 22 a 18»*— y
     *  **entra con nombre propio, no como peldaño de la escala**, por la misma
     *  razón que `control: 13`: la escala de arriba es de PROSA (11 · 14 · 16 ·
     *  20 · 22) y esto es una CIFRA, que se lee de un vistazo y compite con un
     *  gráfico al lado. *A 22 el número empujaba al dibujo fuera de la
     *  tarjeta en la columna angosta; a 18 conviven.* Su compañera obligada es
     *  `family.sans.medium` con cifras tabulares — sin eso, dos tarjetas
     *  vecinas mueven su punto decimal. */
    metrica: 18,
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


  /* ═══════════════════════════════════════════════════════════════════
   * 🔴 **v5 · LA ESCALA POR ROL (S116, letra §2 — «tokens fijos; los
   * rangos del mock se cierran acá»).**
   *
   * **Es una escala de ROLES, no de tamaños**, y por eso vive aparte de
   * `size`: cada entrada trae familia + tamaño + interlínea juntos, que
   * es exactamente lo que evita que una pantalla vuelva a decidir la
   * jerarquía a mano — el defecto que `Texto` nació para cerrar (S71).
   *
   * Los DOS rangos de la letra se cierran acá con nombre, jamás con un
   * intermedio inventado:
   *   · «cifra Baloo 44/44 y 22/22» ⇒ `cifra` y `cifraChica`
   *   · «apoyo PJS 400–600 12/17»   ⇒ `apoyo` (400) y `apoyoFuerte` (600)
   *
   * ⚠️ **El tope de la pantalla pasa de TRES a CUATRO tamaños** (§1.4).
   * Lo mide `R39`, que se RECALIBRA — no se apaga.
   * ═══════════════════════════════════════════════════════════════════ */
  escala: {
    display:    { familia: 'Baloo2_800ExtraBold',        size: 34, lineHeight: 38 },
    titulo1:    { familia: 'Baloo2_800ExtraBold',        size: 28, lineHeight: 31 },
    titulo2:    { familia: 'Baloo2_800ExtraBold',        size: 22, lineHeight: 26 },
    cifra:      { familia: 'Baloo2_800ExtraBold',        size: 44, lineHeight: 44 },
    cifraChica: { familia: 'Baloo2_800ExtraBold',        size: 22, lineHeight: 22 },
    cta:        { familia: 'PlusJakartaSans_700Bold',    size: 16, lineHeight: 20 },
    fila:       { familia: 'PlusJakartaSans_700Bold',    size: 14, lineHeight: 18 },
    cuerpo:     { familia: 'PlusJakartaSans_400Regular', size: 14, lineHeight: 22 },
    apoyo:      { familia: 'PlusJakartaSans_400Regular', size: 12, lineHeight: 17 },
    apoyoFuerte:{ familia: 'PlusJakartaSans_600SemiBold',size: 12, lineHeight: 17 },
    /** El antetítulo es el ÚNICO que lleva mayúsculas y tracking.
     *  ⚠️ **No resucita el eyebrow que S52 mató**: aquel era mono +
     *  uppercase + tracking como ESTRUCTURA DECORATIVA (Ley 18); éste lo
     *  firma la letra §2 con su color semántico (magenta en cuerpo,
     *  `rosaSobreCiruela` sobre ciruela), o sea que codifica una verdad
     *  del contenido. La distinción es de FUNCIÓN, no de forma, y se
     *  declara acá para que nadie la «corrija» citando S52. */
    antetitulo: { familia: 'PlusJakartaSans_700Bold',    size: 11, lineHeight: 14,
                  letterSpacing: 2, textTransform: 'uppercase' as const },
  },

} as const

export type TypeSizeKey = keyof typeof typography.size
