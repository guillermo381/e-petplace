/**
 * SuperficieLlamada — la pantalla de la videoconsulta (S106-B, OBRAS 2 y 4).
 *
 * Orquesta: **video remoto a pantalla completa** + el tile propio + el
 * encabezado + la barra de controles. **No sabe de transporte**: los dos videos
 * entran como nodos (ver `TileVideoPropio`).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ── OBRA 4 · EL CHROME QUE SE ESCONDE, Y LAS DOS COSAS QUE NUNCA ───────────
 * ═══════════════════════════════════════════════════════════════════════════
 * **4 s sin tocar → el chrome se desvanece. Un toque en cualquier parte lo
 * devuelve.** Porque lo que la familia vino a mirar es al animal y a la cara
 * del veterinario, no nuestros botones.
 *
 * 🔴 **DOS COSAS NO SE ESCONDEN JAMÁS:**
 * · **COLGAR.** *Si me quiero ir, no puedo tener que adivinar dónde tocar
 *   primero para que aparezca el botón de salida.* Un control de emergencia que
 *   exige un toque de descubrimiento no es un control de emergencia.
 * · **El asa del modal** (la monta el consumidor, ver `ModalDosAlturas`): es la
 *   única pista de que hay algo abajo. Escondida, la ficha clínica deja de
 *   existir para quien no sabía que estaba.
 *
 * **Duraciones:** esconder `estandar` (300 ms) · devolver `micro` (150 ms).
 * **Aparecer más rápido que desaparecer es intencional:** irse puede ser
 * gradual, volver tiene que sentirse inmediato — el usuario tocó porque quiere
 * algo AHORA.
 *
 * ⚠️ **CHOQUE DECLARADO:** la dirección pidió **200 ms** para esconder. **No
 * existe como token** — el vocabulario firmado es `150 · 300 · 520` y dice
 * *«nada más se mueve»*. Se usa 300; si el founder ratifica 200, es una línea
 * en `motion.ts`. *Un número que no es token se vuelve el 200 de esta pieza y
 * el 210 de la próxima.*
 *
 * ── EL TEMPORIZADOR NO SE PAUSA CUANDO EL CHROME SE VA ─────────────────────
 * Se esconde la vista, no el reloj: `TemporizadorLlamada` corre por diferencia
 * contra `inicioTs`, así que al reaparecer muestra la verdad y no un número
 * que empezó de nuevo.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated'

import { motion } from '../tokens/motion'
import { spacing } from '../tokens/spacing'
import { sobreVideo } from '../tokens/sobreVideo'
import { ControlLlamada } from './ControlLlamada'
import { EncabezadoLlamada, type EncabezadoLlamadaProps } from './EncabezadoLlamada'
import { TileVideoPropio, type TileVideoPropioProps } from './TileVideoPropio'

/** Lo que la dirección fijó: 4 s de quietud y el chrome se va. */
const QUIETUD_MS = 4000

export interface SuperficieLlamadaProps {
  /** El video que va grande. Nodo: esta pieza no sabe de transporte. */
  videoGrande: ReactNode
  /** El video que va chico. `null` = todavía no hay (o se apagó la cámara). */
  videoChico: ReactNode | null
  /** Alto disponible de la superficie (para calcular el tile). */
  alto: number

  encabezado: Omit<EncabezadoLlamadaProps, 'insetTop'>
  insetTop?: number
  insetBottom?: number

  /** Un toque en el tile: el consumidor decide qué va grande. */
  onIntercambiar: TileVideoPropioProps['onIntercambiar']
  etiquetaTile: string

  microfonoActivo: boolean
  camaraActiva: boolean
  onMicrofono: () => void
  onCamara: () => void
  onColgar: () => void
  /** Voz de los tres controles (a11y — SIEMPRE, no son opcionales). */
  vozControles: { microfono: string; camara: string; colgar: string }

  /** Lo que el consumidor monte abajo (el asa del modal, por ejemplo). */
  pie?: ReactNode
}

export function SuperficieLlamada({
  videoGrande,
  videoChico,
  alto,
  encabezado,
  insetTop = 0,
  insetBottom = 0,
  onIntercambiar,
  etiquetaTile,
  microfonoActivo,
  camaraActiva,
  onMicrofono,
  onCamara,
  onColgar,
  vozControles,
  pie,
}: SuperficieLlamadaProps) {
  const [visible, setVisible] = useState(true)
  const opacidad = useSharedValue(1)
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null)

  const programarOcultado = useCallback(() => {
    if (reloj.current) clearTimeout(reloj.current)
    reloj.current = setTimeout(() => setVisible(false), QUIETUD_MS)
  }, [])

  /** Cualquier toque devuelve el chrome y reinicia la cuenta. */
  const despertar = useCallback(() => {
    setVisible(true)
    programarOcultado()
  }, [programarOcultado])

  useEffect(() => {
    programarOcultado()
    return () => { if (reloj.current) clearTimeout(reloj.current) }
  }, [programarOcultado])

  useEffect(() => {
    opacidad.value = withTiming(visible ? 1 : 0, {
      // Volver es más rápido que irse: el usuario tocó porque quiere algo ahora.
      duration: visible ? motion.duration.micro : motion.duration.estandar,
      easing: Easing.bezier(...motion.easing.easeOut.bezier),
    })
  }, [visible, opacidad])

  const estiloChrome = useAnimatedStyle(() => ({ opacity: opacidad.value }))

  return (
    <View style={{ flex: 1, backgroundColor: 'rgb(5,5,8)' }}>
      {/* ── El remoto, a sangre. Es el fondo de todo lo demás. */}
      <View style={{ ...ABSOLUTO }}>{videoGrande}</View>

      {/* ── La capa que escucha el toque. `box-none` deja pasar los toques a
             los controles: si capturara, el botón de colgar no andaría. */}
      <Pressable
        onPress={despertar}
        style={ABSOLUTO}
        accessible={false}
        pointerEvents="box-only"
      />

      {/* ── El tile propio. Vive fuera del chrome: NO se esconde — verme a mí
             misma no es un control, es parte de la llamada. */}
      {videoChico != null && (
        <TileVideoPropio
          onIntercambiar={onIntercambiar}
          etiqueta={etiquetaTile}
          altoDisponible={alto}
          margen={{ top: insetTop, bottom: insetBottom }}
        >
          {videoChico}
        </TileVideoPropio>
      )}

      {/* ── EL CHROME que se desvanece: encabezado + los dos controles de
             estado. Colgar NO está acá (ver abajo). */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, estiloChrome]} pointerEvents={visible ? 'auto' : 'none'}>
        <EncabezadoLlamada {...encabezado} insetTop={insetTop} />
      </Animated.View>

      {/* ── El pie: velo + controles. */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient
          colors={[...sobreVideo.velo].reverse() as [string, string]}
          style={{ paddingTop: spacing[8], paddingBottom: insetBottom + spacing[4] }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[5] }}>
            {/* Micrófono y cámara SÍ se esconden. */}
            <Animated.View style={estiloChrome} pointerEvents={visible ? 'auto' : 'none'}>
              <ControlLlamada glifo="microfono" etiqueta={vozControles.microfono} activo={microfonoActivo} onPress={() => { onMicrofono(); despertar() }} />
            </Animated.View>

            {/* 🔴 COLGAR: fuera de `estiloChrome` A PROPÓSITO. Nunca se esconde. */}
            <ControlLlamada glifo="colgar" tamaño="lg" etiqueta={vozControles.colgar} onPress={onColgar} />

            <Animated.View style={estiloChrome} pointerEvents={visible ? 'auto' : 'none'}>
              <ControlLlamada glifo="camara" etiqueta={vozControles.camara} activo={camaraActiva} onPress={() => { onCamara(); despertar() }} />
            </Animated.View>
          </View>

          {/* El asa del modal (si el consumidor la monta) tampoco se esconde. */}
          {pie}
        </LinearGradient>
      </View>
    </View>
  )
}

const ABSOLUTO = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const
