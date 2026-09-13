/**
 * e-PetPlace — Design Tokens v4 · RADIOS
 * Portado de v3.1 sin cambio.
 */

export const radius = {
  none:  0,
  xs:    4,
  sm:    8,
  // LEY DE GEOMETRÍA (S58, firma founder): lo que se ELIGE es rectángulo
  // suave (10-12); lo que INFORMA es píldora (full). Insignia intacta.
  suave: 10,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  full:  9999,

  /* ═══════════════════════════════════════════════════════════════════
   * 🔴 **v5 · LOS RADIOS POR ROL (S116, letra §2).** La letra los nombra
   * por OBJETO —«tarjeta radio 24 · lista radio 22 · campo radio 18 ·
   * chip radio 999»—, no por escalón, y por eso entran con el nombre del
   * objeto: quien monte una tarjeta pide `tarjetaV5`, no «2xl».
   *
   * ⚠️ **`listaV5` (22) y `campoV5` (18) NO existían en la escala** — son
   * valores nuevos, no alias. `tarjetaV5` SÍ coincide con `2xl` y
   * `chipV5` con `full`, y aun así entran con nombre propio: **el día
   * que la letra mueva uno, se mueve solo el rol y no la escala entera**,
   * que es lo que `R37` (el radio único) existe para proteger.
   * ═══════════════════════════════════════════════════════════════════ */
  tarjetaV5: 24,
  listaV5:   22,
  campoV5:   18,
  chipV5:    9999,
  /** El radio inferior de la cabecera raíz (§2: «radio inferior 28»). */
  cabeceraV5: 28,
} as const

export type RadiusKey = keyof typeof radius
