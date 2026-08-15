/**
 * LA CAJA DEL CAMPO — la anatomía de N11, escrita UNA vez (S99-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * POR QUÉ NACE, y no es prolijidad: **la anatomía de la caja estaba
 * escrita TRES VECES dentro de `packages/ui`** — `Campo`, `CampoCodigo`
 * y `CampoFecha` repetían el mismo `BORDE = 1.5`, el mismo
 * `theme.mode === 'light' ? bg.card : bg.elevated` y la misma
 * transición, byte por byte.
 *
 * Hoy coinciden **por copia**, que es la forma más frágil de coincidir.
 * Y N11 lo vuelve exigible con todas las letras: ***«dos estilos de
 * campo jamás conviven en la misma región de una pantalla»*** — aplicar
 * la ley a `Campo` y no a sus dos hermanas fabricaría exactamente los
 * dos estilos que la ley prohíbe. Es la misma enfermedad que R25 y R30
 * existen para cazar, un piso más adentro.
 *
 * Vive en un `.ts` sin componente —como `chevron.ts` y `usePresionado`—
 * porque **no es una pieza: es geometría compartida.**
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LO QUE N11 CAMBIÓ, Y LO QUE DEROGÓ ─────────────────────────────
 * **☠️ EL RELLENO COMO AFFORDANCE MUERE.** Hasta hoy `Campo` nacía con
 * `sinCaja = true` POR DEFAULT: borde **transparente** en reposo y
 * `bg.overlay` como única señal. Medido: el interior quedaba a
 * **1.07:1** contra el fondo en claro. *Un campo que se distingue de su
 * fondo por 1.07 no se distingue.*
 *
 * 🔴 **Y ESO ERA UNA DECISIÓN FIRMADA (S81), así que el choque se
 * DECLARA y no se resuelve callado** (precedente: el magenta S83, la
 * plata S83 y S88).
 *
 * ⚠️ **LA 19.8 NO MUERE — N11 ES LA 19.8 BIEN APLICADA** (precisión de A
 * al registrar esto para el acta, y vale escribirla acá porque «las dos
 * la leen al revés» se puede leer como que la ley quedó en disputa: no
 * quedó. Lo que muere es **la lectura** de S81, no la ley que citaba):
 *   · **S81:** *«A6 ALCANZA a Campo — el borde de reposo era caja, no
 *     affordance; la affordance la da el RELLENO»*.
 *   · **N11 (S99, firma del founder):** *«☠️ el relleno gris sólido
 *     muere… es la ley 19.8 aplicada al formulario: **se contornea lo
 *     que se fija** — un campo vacío todavía no existe, por eso no se
 *     rellena»*.
 * **Gana N11**: es más nueva, es firma del founder de esta sesión, y
 * trae su razón escrita. *Y el costo de la derogación resultó CERO: la
 * prop `sinCaja` tenía **cero consumidores** — todos los `sinCaja` del
 * árbol son de `Boton`, otra pieza y otra prop.*
 *
 * ── EL CONTORNO TIENE PISO, Y ES UN NÚMERO ─────────────────────────
 * `theme.border.campo` **≥3:1 contra `bg.base`** — token nuevo porque
 * ninguno de la casa llegaba (`default` 1.18/1.28, `presente`
 * 1.62/1.64: se diseñaron para SEPARAR, no para CONTENER). Su gate es
 * **R43** en `verify:diseno`: si alguien mueve el valor por debajo del
 * piso, sale rojo.
 *
 * ── EL FOCO GANA PRESENCIA, NO SOLO COLOR ──────────────────────────
 * N11 pide *«foco con presencia (borde en acento + elevación sutil)»*.
 * La elevación sale de `theme.elevacion.reposo` — **jamás una sombra a
 * mano** (Ley 20 / R4). Y el grosor sigue sin moverse: el estado cambia
 * color y sombra, nunca el borde, porque un borde que engorda **corre
 * el layout mientras alguien tipea**, que es la regla rectora de la
 * pieza desde S43.
 */

import type { Theme } from '../themes'
import { motion } from '../tokens/motion'
import { radius } from '../tokens/radius'

/** SIEMPRE 1.5 — el estado cambia color, jamás grosor (regla rectora). */
export const BORDE_CAMPO = 1.5

export interface EstadoCaja {
  /** Pinta `status.danger` y gana prioridad sobre el foco. */
  error?: boolean
  enfocado?: boolean
}

/** El color del contorno según estado. El reposo YA NO ES TRANSPARENTE
 *  (ver la derogación en la cabecera). */
export function colorDeContorno(theme: Theme, { error, enfocado }: EstadoCaja): string {
  if (error) return theme.status.danger
  if (enfocado) return 'active' in theme.accent ? theme.accent.active : theme.accent.primary
  return theme.border.campo
}

/** El interior: **lo más claro de su región** (N11). En claro es blanco
 *  sobre el papel tapiz; en los temas oscuros, el paso de luminancia que
 *  cada tema ya tiene declarado para sus superficies. */
export function interiorDeCaja(theme: Theme): string {
  return theme.mode === 'light' ? theme.bg.card : theme.bg.overlay
}

/** El estilo COMPLETO de la caja — las tres piezas lo consumen entero,
 *  jamás por partes: una que tome el borde y se escriba el fondo vuelve
 *  a ser una cuarta copia con otro nombre. */
export function estiloDeCaja(theme: Theme, estado: EstadoCaja) {
  return {
    borderRadius: radius.md,
    borderWidth: BORDE_CAMPO,
    borderColor: colorDeContorno(theme, estado),
    backgroundColor: interiorDeCaja(theme),
    /** La presencia del foco (N11). En reposo NO hay sombra: el contorno
     *  ya contiene, y sombrear todo campo llenaría de material una
     *  pantalla de formulario. */
    boxShadow: estado.enfocado && !estado.error ? theme.elevacion.reposo : undefined,
    // única animación permitida: color del borde (Ley 6 · regla rectora)
    transitionProperty: 'borderColor',
    transitionDuration: motion.duration.fast,
  } as const
}
