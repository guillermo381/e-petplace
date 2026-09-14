/**
 * e-PetPlace — Design Tokens **v5** · LAS MEDIDAS DEL REDISEÑO DEL CLIENTE
 *
 * Firma: `docs/LETRA_REDISENO_S116.md` §2 (founder, 13-sep-2026).
 * Nace porque la letra da **veinte medidas por OBJETO** —margen, cabecera,
 * CTA, campo, barra, avatar— y ninguna tiene token hoy. La orden del lote
 * es textual: *«Nada literal: si un valor no tiene token, se crea.»*
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 **POR QUÉ ESTO NO ENTRA EN `spacing.ts`, y es la decisión de diseño
 * de este archivo.** `spacing` es una escala de RITMO con **base 4 y
 * múltiplos estrictos** (21 escalones). Las medidas de la letra **no son
 * múltiplos de 4**: 26, 70, 22, 17, 58, 52, 74, 78, 66. Meterlas ahí
 * rompería la única propiedad que hace útil a `spacing` —que cualquier
 * par de valores se lleve bien— y dejaría a `R36` midiendo una escala que
 * ya no es una escala.
 *
 * ⇒ **Son dos vocabularios distintos y se declaran distintos:** `spacing`
 * dice cuánto AIRE hay entre cosas; `medidas` dice cuánto MIDE una cosa.
 * Un padding sigue saliendo de `spacing`; el alto de un CTA sale de acá.
 * ═══════════════════════════════════════════════════════════════════════
 */

export const medidas = {

  /** El margen lateral de la pantalla. La letra da los dos casos:
   *  «margen 26 (20 con flecha)» — una pantalla con flecha de volver
   *  arranca más a la izquierda porque la flecha ya ocupa ese aire. */
  margen: 26,
  margenConFlecha: 20,

  /** La cabecera. Dos anatomías, y la letra las separa por nombre:
   *  «cabecera raíz padding 70/26/22, radio inferior 28» ·
   *  «cabecera empujada 68/20/20, flecha 42». */
  cabeceraRaiz:     { top: 70, lados: 26, bottom: 22 },
  cabeceraEmpujada: { top: 68, lados: 20, bottom: 20, flecha: 42 },

  /** Los dos botones. «CTA alto 58 radio 999 con sombra magenta 28 %» ·
   *  «secundario alto 52 borde 1,5 magenta». */
  ctaAlto: 58,
  secundarioAlto: 52,
  secundarioBorde: 1.5,

  /** El campo: «radio 18, foco borde 1,5 + halo 4 al 10 %». */
  campoFocoBorde: 1.5,
  campoFocoHalo: 4,

  /** La fila de lista: «lista radio 22, fila 16/17» — 16 de padding
   *  horizontal, 17 de vertical. */
  filaPadX: 16,
  filaPadY: 17,

  /** La tarjeta: «borde 1 tinta 9 %». El COLOR vive en la paleta
   *  (`tintaBorde09`); acá vive el ancho. */
  tarjetaBorde: 1,

  /** La barra inferior de cinco tabs (§1.5). «alto 92, activo círculo 74
   *  con borde 5 del lienzo, −14» — el −14 es cuánto sobresale el círculo
   *  del activo por encima de la barra. */
  barraAlto: 92,
  barraActivoDiametro: 74,
  barraActivoBorde: 5,
  barraActivoOffset: -14,

  /** El asistente (NEXO) que flota en toda raíz (§1.5). */
  asistenteDiametro: 60,

  /* ══════════════════════════════════════════════════════════════════
   *  LA MARCA CUANDO ES LA PROTAGONISTA (00 · splash, 01 · propuesta)
   *
   * 🔴 **ES UNA FRACCIÓN DEL ANCHO, NO UN PX, Y ESA ES LA DECISIÓN.** La
   * orden dice *«cerca de la mitad del ancho del teléfono»* — eso **no es
   * un tamaño: es una proporción**. Un `200` en píxeles cumple la orden en
   * el aparato donde se midió y la incumple en todos los demás: en un
   * teléfono chico tapa la pantalla, en una tablet queda perdido en el
   * medio. *Un token fijo convertiría «la mitad del ancho» en «200», que
   * es otra cosa que resulta parecida en un solo aparato.*
   *
   * ⚠️ **Y por eso la pieza necesita `useWindowDimensions`** — el ancho lo
   * sabe el aparato, igual que `insets`. Misma familia que `AIRE_RAIZ`:
   * el token trae lo que es de la casa, el aparato pone lo suyo.
   *
   * ⏪ **LO QUE HABÍA, medido:** `IsotipoV5` en `splash` usaba
   * `avatarHogar` (**78**) — o sea **el tamaño de un avatar de ficha para
   * el protagonista de la primera pantalla** — y `LogoV5` tenía un **200
   * escrito a mano dentro de la pieza**. Los dos salen acá.
   * ══════════════════════════════════════════════════════════════════ */
  /** Cuánto del ancho de la pantalla ocupa la marca cuando PRESIDE. */
  marcaProtagonistaFraccion: 0.5,
  /** Cuánto ocupa en el splash, donde acompaña y no preside. */
  marcaSplashFraccion: 0.34,
  /** El logo en una cabecera: acá sí es un alto fijo — la cabecera tiene
   *  su propia medida y la marca se para adentro. */
  marcaCabeceraAncho: 120,

  /* ══════════════════════════════════════════════════════════════════
   *  EL AIRE QUE TODA PANTALLA RAÍZ TIENE QUE DEJAR ABAJO
   *
   * 🔴 **NACE DE UN DEFECTO VISTO: `BotonAsistente` tapaba contenido.**
   * La barra tenía su medida (`barraAlto`) y el asistente la suya
   * (`asistenteDiametro`), **y nadie tenía la suma** — así que cada
   * pantalla resolvía su `paddingBottom` por su cuenta, o no lo resolvía.
   * *Dos medidas correctas que nadie compone dejan un hueco que no es de
   * ninguna de las dos.*
   *
   * LA CUENTA, para que se pueda auditar y no haya que creerla:
   *   `barraAlto` 92  +  separación 8  +  `asistenteDiametro` 60  +
   *   respiro 8  =  **168**
   * El respiro final es lo que evita que la última fila quede BESANDO el
   * botón: tocarla sería tocar el borde del asistente.
   *
   * ⚠️ **ES LA PARTE FIJA, Y LA PANTALLA LE SUMA `insets.bottom`** — misma
   * fórmula que `ALTO_FILA_TABS + insets.bottom`, que el shell ya dejó
   * escrita. *Un token que incluyera el inset sería falso en cuanto
   * cambiara el aparato.*
   *
   * ⚠️ **UN SOLO TOKEN, NO UN NÚMERO POR PANTALLA.** Si mañana el
   * asistente crece o la barra cambia, **el valor se recalcula solo y
   * todas las raíces lo heredan**; un 168 escrito en once pantallas es
   * once lugares donde olvidarse de uno. Y `R4` caza el número suelto.
   *
   * 🔴 **SE DERIVA, NO SE ESCRIBE — y vive ABAJO del objeto por eso.**
   * Un `168` acá adentro sería un número que hay que acordarse de
   * recalcular el día que cambie `barraAlto`, y esta casa ya tiene su
   * lección escrita (`L-284`: *se deriva en vez de emparejar*, y el valor
   * equivocado se vuelve **inexpresable**). Ver `AIRE_RAIZ`, al pie.
   * ══════════════════════════════════════════════════════════════════ */

  /** Los tres tamaños de avatar que la letra nombra:
   *  «avatar hogar 78 / selector 66 / fila 52». */
  avatarHogar: 78,
  avatarSelector: 66,
  avatarFila: 52,

  /** El piso táctil. **No es de la letra v5: es la regla de accesibilidad
   *  de la casa** (44 en toda la skill, entrada 19.7 y siguientes), y la
   *  letra la RATIFICA —«área táctil 44, separación 8»—. Vive acá para
   *  que una pantalla nueva no vuelva a teclear el número. */
  areaTactil: 44,
  separacionTactil: 8,

} as const

/** Lo que el `BotonAsistente` deja entre la barra y su borde inferior.
 *  🔴 **SE EXPORTA para que la pieza la consuma**, y no es prolijidad: si
 *  la pieza escribiera su propio `spacing[2]` acá, serían **dos números
 *  que significan lo mismo y pueden divergir sin que nada falle** — el
 *  botón se movería y el aire de las raíces quedaría corto. *Un valor
 *  compartido por dos piezas no se copia: se importa.* */
export const SEPARACION_ASISTENTE = 8
/** El respiro entre la última fila y el borde del asistente. Sin él, tocar
 *  la última fila es tocar el botón. */
const RESPIRO_ULTIMA_FILA = 8

/** El aire que toda pantalla raíz deja abajo — **derivado, no escrito**
 *  (ver el bloque de `asistenteDiametro`). Es la parte FIJA: la pantalla
 *  le suma `insets.bottom`, igual que hace con `ALTO_FILA_TABS`.
 *
 *  `barra 92 + separación 8 + asistente 60 + respiro 8 = 168` */
export const AIRE_RAIZ =
  medidas.barraAlto + SEPARACION_ASISTENTE + medidas.asistenteDiametro + RESPIRO_ULTIMA_FILA

export type MedidaKey = keyof typeof medidas
