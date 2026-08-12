/**
 * PuertaDeOficio — EL BARRIDO al cambiar de oficio.
 *
 * `LETRA_RECORRIDO_DESPENSA_S96` §3: *"no es una pantalla intermedia ni
 * una animación que se paga todos los días. La barra inferior se reordena
 * y el color del oficio barre la pantalla de un lado al otro, en menos de
 * medio segundo. Se siente como cambiar de oficio, no como cargar una
 * app."*
 *
 * ══════════════════════════════════════════════════════════════════════
 * 🔴 LO QUE ESTA PIEZA **NO** HACE, Y ES LO ÚNICO QUE IMPORTA
 * ══════════════════════════════════════════════════════════════════════
 * La letra lo escribe sin rodeos:
 *
 *   > *"Cruzar la puerta cambia PERMISOS, no decoración. Una veterinaria
 *   > que además vende alimento, del lado de productos no ve expediente
 *   > aunque sea veterinaria. **Si la puerta solo cambia colores, es una
 *   > animación bonita sobre un agujero.**"*
 *
 * **Este componente ES el color.** No cambia permisos, no filtra datos,
 * no sabe qué puede ver quien lo mira. **El cambio de alcance vive en el
 * servidor** (la matriz acto/rol de `BIO_EXPEDIENTE`, cerrado en
 * policies), y esta pieza es su acuse de recibo visual.
 *
 * Se escribe acá, en el archivo y no solo en el acta, porque **el modo de
 * falla es que alguien monte el barrido y crea que cruzó la puerta.** Un
 * barrido sobre un agujero se ve exactamente igual que un barrido sobre
 * una puerta de verdad — ésa es toda la trampa.
 *
 * ── LA DURACIÓN: 340ms, Y NO ES UN NÚMERO NUEVO ────────────────────────
 * Usa `motion.marca` — la física de la casa (`aperturaBezier`
 * [.32,.72,0,1], 340ms), la misma con la que abre el Coach desde S53.
 * **Resuelve sola la tensión aparente entre la letra y la Ley 6:** la
 * letra pide *"menos de medio segundo"* y la Ley 6 manda *<300ms en UI*.
 * 340 no es UI chica: es un gesto de MARCA, y la casa ya tiene ese
 * registro firmado con su propio token. **Cumple la letra (340 < 500) sin
 * inventar una duración ni pedir una excepción a la Ley 6** — que sigue
 * rigiendo donde rige.
 *
 * ── DÓNDE NO BARRE, Y POR QUÉ NO ES UNA FALLA ──────────────────────────
 * · **Memorial:** no anima. Ley 6 es literal — *"jamás animar nada en
 *   memorial"* — y Ley 8 lo generaliza: memorial no es un tema que se
 *   soporta, es un momento que se respeta.
 * · **Reduce motion del sistema:** no anima. Quien pidió menos movimiento
 *   lo pidió para todo, no para las animaciones que a nosotros nos
 *   parezcan prescindibles.
 *
 * En los dos casos `onFin` **se llama igual y en el acto**: el barrido es
 * cortesía, y una pantalla que espera un callback que nunca llega se
 * cuelga. *Degradar el gesto jamás puede degradar el contrato.*
 *
 * ── LA CAPA, NO EL HEX ─────────────────────────────────────────────────
 * Recibe la CATEGORÍA (ley 10 de `DIRECCION_ARTE`: SALUD · CUIDADO ·
 * COMUNIDAD · CONSUMO) y resuelve el color del tema. No acepta un color:
 * si lo aceptara, la app tendría que pasarle un hex, y eso es la Ley 1
 * rota por la puerta de atrás.
 *
 * No captura toques (`pointerEvents="none"`): barre por encima y la
 * pantalla de abajo sigue viva. No es un velo de carga (Ley 13) — no
 * espera nada, solo acusa el cruce.
 */

import { useEffect } from 'react'
import { useWindowDimensions, View } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

/** Las categorías de la taxonomía firmada (ley 10). */
export type CapaDeOficio = 'identidad' | 'cuidado' | 'comunidad' | 'consumo'

export type PuertaDeOficioProps = {
  /** La categoría del oficio al que se ENTRA. */
  capa: CapaDeOficio
  /**
   * Cambiar de `false` a `true` lanza el barrido. La pantalla lo baja a
   * `false` en `onFin`.
   */
  activo: boolean
  /**
   * Se llama SIEMPRE al terminar — también cuando no hubo animación
   * (memorial, reduce motion). Ver el encabezado: degradar el gesto no
   * puede degradar el contrato.
   */
  onFin?: () => void
}

export function PuertaDeOficio({ capa, activo, onFin }: PuertaDeOficioProps) {
  const { theme } = useTheme()
  const { width } = useWindowDimensions()
  const reduceMotion = useReducedMotion()
  const x = useSharedValue(-width)

  // CONSUMO no vive en `theme.capa` — su slot de capa nace cuando la
  // tienda lo pida (ley 10, nota de terracotta). Hasta entonces resuelve
  // por `accent.warm`, que ES su token medido y está en el gate WCAG.
  const color = capa === 'consumo' ? theme.accent.warm : theme.capa[capa]
  const quieto = theme.mode === 'memorial' || reduceMotion

  useEffect(() => {
    if (!activo) return
    if (quieto) {
      onFin?.()
      return
    }
    x.value = -width
    x.value = withTiming(
      width,
      {
        duration: motion.marca.aperturaMs,
        easing: Easing.bezier(...motion.marca.aperturaBezier),
      },
      (terminado) => {
        if (terminado && onFin !== undefined) runOnJS(onFin)()
      },
    )
    // `onFin` fuera de deps a propósito: una identidad nueva del callback
    // no puede relanzar un barrido que ya corrió. El disparo es `activo`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, quieto, width])

  const estilo = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))

  if (!activo || quieto) return null

  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Animated.View
        style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: color }, estilo]}
      />
    </View>
  )
}
