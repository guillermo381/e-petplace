/**
 * Interruptor — el estado BINARIO del sistema (S58, Ley 11 + Ley 22;
 * componente 32 — primer consumidor: "Ofrecer esta duración" del arte
 * del paseo, B1b). Encendido/apagado, nada más.
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ NO ES: no es selección entre pares (eso es SelectorOpcion, TONAL
 * por Ley 22 — un binario disfrazado de chips es un bug de rol), no
 * porta label visible (el label es de la pantalla: fila con título +
 * este control), no valida nada. Presentacional puro.
 * APAGADO JAMÁS DICE ERROR — apagado es estado, no falla: riel sereno
 * en bg.overlay, cero rojo, cero opacidad de "deshabilitado".
 * ═══════════════════════════════════════════════════════════════════
 *
 * Ley 22 — SÓLIDO: encendido = fill del acento POR REGISTRO
 * ('control' = cliente: magentaDark/violetText · 'oficio' = prestador:
 * tealDark/teal) con thumb BLANCO apoyado (elevacion.reposo — Chanel:
 * sombra, jamás borde en el fill). Memorial degrada a TINTA y el thumb
 * no se desliza (reemplazo directo). La píldora del riel es convención
 * de plataforma del switch — no informa ni elige entre pares (Ley 21
 * intacta).
 *
 * Motion: SOLO el thumb se desliza (receta CSS-transition de
 * Reanimated de la casa); el color del riel cambia por reemplazo
 * directo — nada más se anima (Ley 6: la sombra viaja con el thumb).
 *
 * A11y: switch con checked anunciado; target 44 (hitSlop sobre el
 * riel de 28).
 *
 * Escalera §4b: no muestra datos del expediente — control puro,
 * peldaños no aplican (declarado explícito).
 */

import { Pressable } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'

const ANCHO = 48
const ALTO = 28
const THUMB = 24
const RELLENO = (ALTO - THUMB) / 2

export interface InterruptorProps {
  encendido: boolean
  onCambio: (encendido: boolean) => void
  /** accessibilityLabel — el label VISIBLE es de la pantalla (fila título + control). */
  etiqueta: string
  /** Ley 22 por registro: 'control' (cliente, default) · 'oficio' (prestador, tealDark). */
  registro?: 'control' | 'oficio'
  /**
   * S112-B (B7) · **NO SE PUEDE MOVER**, y no es lo mismo que estar apagado.
   *
   * 🔴 **APAGADO vs DESHABILITADO — la distinción que la cabecera de esta
   * pieza ya defendía sin nombrarla.** *Apagado es un VALOR* («esta
   * publicación está pausada») y por eso sigue siendo sereno, sin rojo y sin
   * opacidad. *Deshabilitado es que NO PODÉS CAMBIARLO* («este animal es
   * adulto y no está esterilizado: se publica esterilizado»), y ése sí baja
   * de opacidad, no dispara `onCambio` y se anuncia como deshabilitado.
   *
   * Default `false`: los consumidores vivos no cambian en un byte (`L-244`).
   */
  deshabilitado?: boolean
  /**
   * POR QUÉ no se puede mover. Va al `accessibilityHint`.
   *
   * 🔴 **LA LÍNEA VISIBLE NO SE DIBUJA ACÁ, Y ES DELIBERADO.** Este control
   * vive a la derecha de una fila; una línea colgada debajo de un riel de 28
   * px rompe la fila que lo contiene (N24). **La razón visible es de quien
   * compone la fila, que es el único que sabe dónde termina.**
   *
   * ⚠️ Y eso deja un hueco que un tipo no puede cerrar desde acá: nada
   * obliga al contenedor a dibujarla. **Lo cierra `TarjetaMascotaRefugio`
   * con una unión discriminada** —o hay `onCambio`, o hay `razon`— para que
   * en la superficie donde esto importa el mudo no se pueda expresar. *Dos
   * capas, cada una con lo que sabe* (el precedente es `StepperCantidad` con
   * el stock).
   */
  razonDeshabilitado?: string
}

export function Interruptor({
  encendido,
  onCambio,
  etiqueta,
  registro = 'control',
  deshabilitado = false,
  razonDeshabilitado,
}: InterruptorProps) {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'

  // SÓLIDO por registro; memorial degrada a TINTA (accent.control
  // memorial YA resuelve a tinta — el registro no lo pisa).
  const fillEncendido = esMemorial
    ? theme.accent.control
    : registro === 'oficio'
      ? theme.accent.primary
      : theme.accent.control

  return (
    <Pressable
      onPress={deshabilitado ? undefined : () => onCambio(!encendido)}
      disabled={deshabilitado}
      accessibilityRole="switch"
      accessibilityLabel={etiqueta}
      accessibilityState={{ checked: encendido, disabled: deshabilitado }}
      accessibilityHint={deshabilitado ? razonDeshabilitado : undefined}
      hitSlop={(44 - ALTO) / 2}
      style={{
        // La opacidad SÓLO por deshabilitado. Apagado NO la baja — sigue
        // siendo un estado sereno, que es lo que esta pieza defiende desde
        // que nació.
        opacity: deshabilitado ? opacity.disabled : 1,
        width: ANCHO,
        height: ALTO,
        borderRadius: radius.full,
        // apagado = estado sereno (bg.overlay + hairline); encendido =
        // fill sólido — el hairline muere con el fill (Chanel). El
        // borde queda con ancho CONSTANTE (transparente al encender):
        // el estado jamás mueve la geometría.
        backgroundColor: encendido ? fillEncendido : theme.bg.overlay,
        borderWidth: theme.border.width,
        borderColor: encendido ? 'transparent' : theme.border.subtle,
        justifyContent: 'center',
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            width: THUMB,
            height: THUMB,
            borderRadius: radius.full,
            // contenido en blanco/papel (Ley 22) — constante en los 3 temas
            backgroundColor: palette.white,
            boxShadow: theme.elevacion.reposo,
            transform: [{ translateX: encendido ? ANCHO - THUMB - RELLENO : RELLENO }],
          },
          // memorial: reemplazo directo — nada se desliza
          esMemorial
            ? null
            : {
                transitionProperty: 'transform',
                transitionDuration: motion.duration.fast,
                transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
              },
        ]}
      />
    </Pressable>
  )
}
