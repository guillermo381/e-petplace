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

export type MedidaKey = keyof typeof medidas
