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
 * 🔴 **CUATRO COSAS NO SE ESCONDEN JAMÁS:**
 * · **EL TEMPORIZADOR** (firma del founder, 26-ago). *Un reloj que arranca en
 *   `00:00` y desaparece a los 4 s no lo ve nadie: el founder lo tuvo funcionando
 *   en las dos apps y nunca supo que existía.* **Un dato que solo aparece si
 *   tocás la pantalla, en la práctica no está** — y §4 cobra la consulta por su
 *   duración, así que el vet necesita verla sin pedirla.
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
import { ControlLlamada, LADO } from './ControlLlamada'
import { Texto } from './Texto'
import { EncabezadoLlamada, type EncabezadoLlamadaProps } from './EncabezadoLlamada'
import { TemporizadorLlamada } from './TemporizadorLlamada'
import { TileVideoPropio, type TileVideoPropioProps } from './TileVideoPropio'

/** Lo que la dirección fijó: 4 s de quietud y el chrome se va. */
const QUIETUD_MS = 4000

/** 🔴 EL ALTO DE LA BARRA DE CONTROLES — **una sola fuente, y ése es el punto.**
 *
 *  Este número vivía **tecleado en la pantalla del prestador**, con un
 *  comentario que decía *«copiarlo en vez de estimar es lo que hace que siga
 *  calzando el día que la barra cambie»*. **Copiar no logra eso: lo logra NO
 *  copiar.** Un valor copiado calza hasta que alguien cambia el original, y
 *  entonces las dos copias siguen compilando y una miente (L-284: dos números
 *  que deben coincidir no salen de dos lugares).
 *
 *  🔴 **Y SE DERIVA, no se teclea — porque el 120 tecleado era JUSTAMENTE la
 *  copia.** La barra mide `spacing[8] + LADO.lg + spacing[4] = 108`; los 12 que
 *  faltaban para el 120 histórico son el aire entre la barra y lo que flote
 *  encima, y ahora se dicen (`spacing[3]`) en vez de estar escondidos dentro de
 *  un número redondo. **Mismos píxeles que hoy, pero se mueven con la barra.**
 *
 *  *Si mañana entra un control más alto o cambia el padding, esto sigue
 *  calzando — que es lo que el comentario que copiaba el 120 decía querer y no
 *  podía lograr copiando.*
 *
 *  Lo consumen la franja `sobreLaBarra` y el `insetBottom` que la pantalla le
 *  pasa al modal. */
export const ALTO_BARRA = spacing[8] + LADO.lg + spacing[4] + spacing[3]

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
  /** 🔴 GIRAR CÁMARA — **OBLIGATORIA desde el gate del 26-ago.**
   *
   *  ⏪ Nació opcional, con la idea de que una pantalla pudiera no tenerlo.
   *  **Medido: las DOS lo pasan** (cliente y prestador), así que la
   *  opcionalidad no servía a nadie — y en cambio dejaba viva una rama
   *  `{onGirarCamara != null && …}` que **hay que descartar a mano cada vez
   *  que el botón no aparece**.
   *
   *  *Una prop opcional que todos pasan no es flexibilidad: es un sospechoso
   *  permanente.* Obligatoria, el tsc lo exige y la rama desaparece. */
  onGirarCamara: () => void
  /** Voz de los controles (a11y — SIEMPRE, no son opcionales). */
  vozControles: { microfono: string; camara: string; colgar: string; girarCamara: string; altavoz: string }
  /**
   * 🔴 LA SALIDA DE AUDIO (firma del founder, 26-ago).
   *
   * ⏪ **Lo había descartado, y el argumento era correcto ENTONCES:** *«un
   * toggle no arregla un default malo, lo delega en el usuario»*. **Con el
   * default en altavoz ya curado y confirmado en llamada real, ese argumento
   * caduca**: deja de ser una excusa para no arreglar el default y pasa a ser
   * control sobre algo que ya funciona bien solo. *La razón del founder es de
   * uso — hay momentos de una consulta en que no se quiere el altavoz.*
   *
   * 🔴 **SE DIBUJA SIEMPRE — corrección de firma del founder (27-ago).**
   *
   * ⏪ Lo había hecho opcional para esconderlo con auriculares o bluetooth
   * conectados, con este criterio: *«si alguien se puso auriculares, quiere
   * auriculares»*. **El founder lo corrige con un caso real que yo no tuve en
   * cuenta: el vet puede tener los auriculares puestos y querer pasar a altavoz
   * en ese momento** —para que la familia escuche, para tener las manos libres—.
   *
   * **Mi criterio confundía DEFAULT con DISPONIBILIDAD.** *Esconder el control
   * le quita una decisión que es suya, y la app no debería adivinar por él.*
   *
   * ✅ **Lo que SÍ se conserva de aquella regla: el DEFAULT respeta lo
   * enchufado** —arranca donde corresponde, y eso lo resuelve el consumidor con
   * `getAudioOutputs()`—. **Lo que cambia es su ESTADO, jamás su existencia.**
   */
  onAltavoz: () => void
  /** `true` = suena por altavoz. */
  altavozActivo: boolean
  /** 🔴 LA SEÑAL DE LA NOTA (§2): «La doctora está escribiendo…». Aparece,
   *  **se desvanece sola a los 3 s** y no vuelve hasta el próximo cambio.
   *  *Es una señal tranquilizadora («me están atendiendo de verdad»), NO un
   *  texto para leer: sin contenido de la nota, sin scroll, sin permanencia.*
   *  `null` = nadie está escribiendo. */
  senalDeNota?: string | null

  /** Lo que el consumidor monte DENTRO del velo, debajo de los controles. */
  pie?: ReactNode

  /** 🔴 LO QUE FLOTA SOBRE EL VIDEO, **POR ENCIMA DE LA BARRA Y DEBAJO DE
   *  ELLA EN ORDEN DE PINTADO** — tarjetas de contexto, el asa del modal, un
   *  botón de captura.
   *
   *  **Existe porque su ausencia encerró al founder en una consulta real.** Sin
   *  este slot, la pantalla montaba esas capas **como hermanas de la pieza**, y
   *  el orden del JSX las puso encima de los controles: sin volver al video y
   *  **sin poder colgar**.
   *
   *  ⚠️ **Lo que entre acá NO puede tapar la barra**, y no por cuidado de quien
   *  lo monta: por construcción. *Ésa es toda la razón de que el slot exista —
   *  la garantía no puede depender de que el próximo consumidor se acuerde.*
   *
   *  La franja se posiciona sola sobre la barra (ver `ALTO_BARRA`): **la altura
   *  no se copia.** */
  sobreLaBarra?: ReactNode
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
  onAltavoz,
  altavozActivo,
  senalDeNota = null,
  pie,
  sobreLaBarra,
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

      {/* 🔴 EL TEMPORIZADOR, HERMANO DEL ENCABEZADO Y FUERA DEL CHROME.
             **Y lleva su propia `banda`, que es la mitad que la firma no
             nombraba pero sin la cual la cura queda a medias:** hasta hoy se
             leía gracias al VELO del encabezado, y al salir de ahí quedaría
             texto papel sobre video crudo — **ilegible sobre una pared
             blanca**. Con la banda de la clase el par está medido: **8.27
             sobre video blanco · 19.47 sobre negro**.
             *Exceptuar un elemento del ocultado no es moverlo de contenedor:
             es darle el piso que el contenedor le prestaba.* */}
      {encabezado.inicioTs != null && (
        <View
          style={{
            position: 'absolute',
            top: insetTop + spacing[3],
            right: spacing[4],
            paddingHorizontal: spacing[2.5],
            paddingVertical: spacing[1],
            borderRadius: radius.full,
            backgroundColor: sobreVideo.banda,
          }}
          pointerEvents="none"
        >
          <TemporizadorLlamada inicioTs={encabezado.inicioTs} />
        </View>
      )}

      {/* 🔴 La señal de la nota. Vive FUERA del chrome: aparece aunque los
             controles estén ocultos, porque no es un control — es una noticia. */}
      {senalDeNota != null && senalVisible && (
        <Animated.View
          entering={FadeIn.duration(motion.duration.micro)}
          exiting={FadeOut.duration(motion.duration.estandar)}
          style={{ position: 'absolute', left: spacing[4], right: spacing[4], bottom: insetBottom + ALTO_BARRA }}
          pointerEvents="none"
        >
          <View style={{ alignSelf: 'center', paddingHorizontal: spacing[3], paddingVertical: spacing[1.5], borderRadius: radius.full, backgroundColor: sobreVideo.banda }}>
            <Texto variante="apoyo" color="sobreVideo">{senalDeNota}</Texto>
          </View>
        </Animated.View>
      )}

      {/* 🔴 LA FRANJA SOBRE LA BARRA — el slot que faltaba, y su ausencia hizo
             daño real (S106-B t5).

             ── QUÉ PASÓ ────────────────────────────────────────────────────
             La pantalla necesitaba flotar cosas sobre el video **por encima de
             los controles** (tarjetas de contexto, el botón de capturar, el
             asa). Como esta pieza no tenía dónde, se montaron **como HERMANO
             de `SuperficieLlamada`, después de ella** — y en React Native el
             orden de pintado lo decide el orden del JSX.

             **Resultado: la capa tapó los controles y el founder quedó
             ENCERRADO en una consulta real** — sin poder volver al video y
             **sin poder colgar**, con un animal del otro lado esperando.

             ── POR QUÉ EL SLOT Y NO SÓLO UN `zIndex` ───────────────────────
             `zIndex` ordena **entre hermanos**. Un `zIndex` alto acá adentro
             defiende de lo que se monte ADENTRO — y no puede hacer nada contra
             un hermano de la pieza. *Una pieza no puede defenderse de sus
             hermanos: lo único que puede hacer es **dejar de darle motivos al
             consumidor para tener hermanos**.*

             ⇒ **este slot existe para que «afuera» no haga falta.** Lo que
             entra acá queda **debajo de la barra por construcción**, no por
             cuidado de quien lo monta.

             📐 **Y se lleva el 120 adentro.** Era un número que la pantalla
             copiaba —su propio comentario decía *«copiarlo en vez de estimar
             es lo que hace que siga calzando el día que la barra cambie»*—.
             **Un número copiado calza hasta que alguien cambia el original.**
             Acá el alto de la barra y la altura de esta franja salen del mismo
             lugar. */}
      {sobreLaBarra != null && (
        <View
          style={{ position: 'absolute', left: 0, right: 0, bottom: insetBottom + ALTO_BARRA, gap: spacing[2] }}
          pointerEvents="box-none"
        >
          {sobreLaBarra}
        </View>
      )}

      {/* ── El pie: velo + controles.
             🔴 `zIndex` EXPLÍCITO, y es la ley de colgar hecha código.
             `DIRECCION_ARTE` dice que **colgar no se esconde jamás** porque
             *en una consulta paga, quien quiere terminar tiene que poder
             terminar SIEMPRE*. **Hasta hoy esa ley vivía sólo en un
             documento**, y el orden del JSX alcanzaba para violarla.
             *Una promesa de diseño que el código no expresa es peor que no
             haberla escrito: se confía en ella al leer.*
             Cubre lo que se monte adentro; contra un hermano de la pieza el
             que defiende es el slot de arriba. */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 }}>
        <LinearGradient
          colors={[...sobreVideo.velo].reverse() as [string, string]}
          style={{ paddingTop: spacing[8], paddingBottom: insetBottom + spacing[4] }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[3] }}>
            {/* ⚠️ EL ANCHO, MEDIDO — con CINCO controles la fila aprieta.
                   Con el altavoz dibujándose SIEMPRE son cinco permanentes:
                   `4×48 + 60 + 4×12 = **300 px**` ⇒ **10 px por lado en un
                   teléfono de 320 · 30 en uno de 360**.
                   ⏪ A 52 la fila medía **316 y dejaba 2 px por lado** — sin
                   aire. Por eso `md` bajó a 48 (ver `ControlLlamada`).
                   🔴 **Y el techo, con su número: un SEXTO control llevaría a
                   `5×48 + 60 + 5×12 = 360` ⇒ no entra ni en 360.** La salida
                   entonces NO es achicar el disco —48 deja 4 px sobre el target
                   mínimo de 44— sino **decidir qué sale de la barra.** *El
                   número queda escrito para que esa decisión se tome mirándolo
                   y no en el momento.* */}

            {/* 🔴 EL ORDEN ES EL DE LA DIRECCIÓN §2: **micrófono · cámara ·
                   girar cámara · colgar**, y estaba mal — corría
                   `micrófono · girar · colgar · cámara`, con COLGAR EN EL MEDIO.
                   *Un destructivo entre dos controles reversibles es el peor
                   lugar donde puede estar: el pulgar lo encuentra buscando otra
                   cosa.* Y la dirección lo pone último por eso mismo. */}
            <Animated.View style={estiloChrome} pointerEvents={visible ? 'auto' : 'none'}>
              <ControlLlamada glifo="microfono" etiqueta={vozControles.microfono} activo={microfonoActivo} onPress={() => { onMicrofono(); despertar() }} />
            </Animated.View>

            <Animated.View style={estiloChrome} pointerEvents={visible ? 'auto' : 'none'}>
              <ControlLlamada glifo="camara" etiqueta={vozControles.camara} activo={camaraActiva} onPress={() => { onCamara(); despertar() }} />
            </Animated.View>

            {/* 🔴 GIRAR CÁMARA: fuera de `estiloChrome`, como colgar. La
                   dirección §2 lo pide explícito — «que no se esconda junto al
                   resto del chrome». Es el botón que se busca cuando llega el
                   momento de mostrar al animal, y ese momento no avisa. */}
            {/* La salida de audio: se esconde con el chrome — cambiarla es
                   ajuste, no emergencia. */}
            <Animated.View style={estiloChrome} pointerEvents={visible ? 'auto' : 'none'}>
              <ControlLlamada glifo="altavoz" etiqueta={vozControles.altavoz} activo={altavozActivo} onPress={() => { onAltavoz(); despertar() }} />
            </Animated.View>

            <ControlLlamada glifo="girarCamara" etiqueta={vozControles.girarCamara} onPress={() => { onGirarCamara(); despertar() }} />

            {/* 🔴 COLGAR: último y fuera de `estiloChrome` A PROPÓSITO. */}
            <ControlLlamada glifo="colgar" tamaño="lg" etiqueta={vozControles.colgar} onPress={onColgar} />
          </View>

          {/* El asa del modal (si el consumidor la monta) tampoco se esconde. */}
          {pie}
        </LinearGradient>
      </View>
    </View>
  )
}

const ABSOLUTO = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const
