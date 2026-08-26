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
 * 🔴 **TRES COSAS NO SE ESCONDEN JAMÁS:**
 * · **COLGAR.** *Si me quiero ir, no puedo tener que adivinar dónde tocar
 *   primero para que aparezca el botón de salida.* Un control de emergencia que
 *   exige un toque de descubrimiento no es un control de emergencia.
 * · **GIRAR CÁMARA** (§2 de `DIRECCION_ARTE_VIDEOCONSULTA`, marcado en rojo):
 *   *«va a ser el botón más usado de esta pantalla… que no se esconda junto al
 *   resto del chrome»*. Ambas cámaras arrancan frontales y **el momento de
 *   mostrar al animal llega en toda consulta — y no avisa.**
 * · **El asa del modal** (la monta el consumidor, ver `ModalDosAlturas`): es la
 *   única pista de que hay algo abajo. Escondida, la ficha clínica deja de
 *   existir para quien no sabía que estaba.
 *
 * **Duraciones:** esconder `estandar` (300 ms) · devolver `micro` (150 ms).
 * **Aparecer más rápido que desaparecer es intencional:** irse puede ser
 * gradual, volver tiene que sentirse inmediato — el usuario tocó porque quiere
 * algo AHORA.
 *
 * ✅ **LOS TIEMPOS, RATIFICADOS POR EL FOUNDER (26-ago):** la dirección escribe
 * **200/250 ms**, y la mesa los resolvió a favor de los TOKENS — *«eran
 * intención («rápido», «suave»), no medición: los escribió la mesa, no una
 * regla, y **abrir un vocabulario cerrado y firmado por una preferencia es el
 * peor motivo que hay**»*. Rige `micro` (150) y `estandar` (300).
 * **Y queda registrado como criterio:** *volver más rápido de lo que se va —
 * irse puede ser gradual, volver tiene que sentirse inmediato.*
 *
 * ── EL TEMPORIZADOR NO SE PAUSA CUANDO EL CHROME SE VA ─────────────────────
 * Se esconde la vista, no el reloj: `TemporizadorLlamada` corre por diferencia
 * contra `inicioTs`, así que al reaparecer muestra la verdad y no un número
 * que empezó de nuevo.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated'

import { motion } from '../tokens/motion'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { sobreVideo } from '../tokens/sobreVideo'
import { ControlLlamada } from './ControlLlamada'
import { Texto } from './Texto'
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
  /** 🔴 Girar cámara. Omitirlo lo saca de la barra — pero en la pantalla del
   *  DUEÑO la dirección lo declara obligatorio (§2: «el botón más usado»). */
  onGirarCamara?: () => void
  /** Voz de los controles (a11y — SIEMPRE, no son opcionales). */
  vozControles: { microfono: string; camara: string; colgar: string; girarCamara?: string }
  /** 🔴 LA SEÑAL DE LA NOTA (§2): «La doctora está escribiendo…». Aparece,
   *  **se desvanece sola a los 3 s** y no vuelve hasta el próximo cambio.
   *  *Es una señal tranquilizadora («me están atendiendo de verdad»), NO un
   *  texto para leer: sin contenido de la nota, sin scroll, sin permanencia.*
   *  `null` = nadie está escribiendo. */
  senalDeNota?: string | null

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
  onGirarCamara,
  vozControles,
  senalDeNota = null,
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

  /* La señal de la nota: se muestra y se va sola a los 3 s. No la controla el
     chrome — que el vet escriba no depende de que yo esté tocando la pantalla. */
  const [senalVisible, setSenalVisible] = useState(false)
  useEffect(() => {
    if (senalDeNota == null) { setSenalVisible(false); return }
    setSenalVisible(true)
    const id = setTimeout(() => setSenalVisible(false), 3000)
    return () => clearTimeout(id)
  }, [senalDeNota])

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

      {/* 🔴 La señal de la nota. Vive FUERA del chrome: aparece aunque los
             controles estén ocultos, porque no es un control — es una noticia. */}
      {senalDeNota != null && senalVisible && (
        <Animated.View
          entering={FadeIn.duration(motion.duration.micro)}
          exiting={FadeOut.duration(motion.duration.estandar)}
          style={{ position: 'absolute', left: spacing[4], right: spacing[4], bottom: insetBottom + 120 }}
          pointerEvents="none"
        >
          <View style={{ alignSelf: 'center', paddingHorizontal: spacing[3], paddingVertical: spacing[1.5], borderRadius: radius.full, backgroundColor: sobreVideo.banda }}>
            <Texto variante="apoyo" color="sobreVideo">{senalDeNota}</Texto>
          </View>
        </Animated.View>
      )}

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

            {/* 🔴 GIRAR CÁMARA: fuera de `estiloChrome`, como colgar. La
                   dirección §2 lo pide explícito — «que no se esconda junto al
                   resto del chrome». Es el botón que se busca cuando llega el
                   momento de mostrar al animal, y ese momento no avisa. */}
            {onGirarCamara != null && (
              <ControlLlamada glifo="girarCamara" etiqueta={vozControles.girarCamara ?? ''} onPress={() => { onGirarCamara(); despertar() }} />
            )}

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
