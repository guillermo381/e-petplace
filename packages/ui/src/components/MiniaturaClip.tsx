/**
 * MiniaturaClip — UN CLIP ENTRE FOTOS, sin abrirlo (S107-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * En el hilo del día conviven fotos y clips. **Si se ven iguales, el clip se
 * pierde**: nadie toca un video que parece una foto, y nadie espera que una
 * foto se mueva. La miniatura dice las dos cosas que la distinguen — **que es
 * un clip, y cuánto dura** — antes de que alguien decida tocarla.
 *
 * ── 🔴 LA MARCA VA CON LA CLASE «CONTROL SOBRE VIDEO», NO CON EL TEMA ────
 * Y no es una elección: **un póster de video es el ejemplo literal que
 * `DIRECCION_ARTE` §6ter usó** para descartar ensanchar la Ley 12:
 *
 * > *«esa condición no está acotada: toda foto, todo gradiente y **todo póster
 * > de video** son fondo no controlado»*
 *
 * ⇒ Se **CONSUME** `tokens/sobreVideo` (§6septies), que ya existe y ya está
 * medido contra los dos extremos —blanco puro y negro puro— por
 * `verify-contrast.ts`. **No se inventa un scrim nuevo**: *si cada superficie
 * se pinta el suyo, en dos meses hay dos y nadie sabe cuál es el bueno* (el
 * literal de `ControlLlamada`). **Cero pares nuevos de contraste**, porque los
 * pares de esta clase ya están verificados.
 *
 * ── LA DURACIÓN ES DATO, Y VA SOBRE BANDA, NO SOBRE DISCO ────────────────
 * `sobreVideo.banda` (0.72) y no `disco` (0.62), porque la clase lo dice en su
 * cuerpo: *«más opaca que el disco: la prosa necesita más piso que un glifo»*.
 * Un `0:12` es texto, no un símbolo — y sobre un póster claro el disco lo
 * dejaría al filo.
 *
 * ── EL TRIÁNGULO ES MASA, SIN HUELLA (§6ter/§6septies) ───────────────────
 * Igual que los glifos de `ControlLlamada`: **acá la Ley 12 no gobierna**, así
 * que el play es silueta rellena de alto contraste sobre su disco, sin trazo
 * 1.9 y sin huella. *No es una excepción nueva: es la clase que la casa ya
 * nombró, aplicada a su tercer caso.*
 *
 * ── LEY 11: POR QUÉ NACE (protocolo 1c, pregunta 2) ──────────────────────
 * · `ClipSesion` **REPRODUCE** un clip a ancho completo — es el destino del
 *   toque, no su representación en una lista. Montarlo por cada clip del hilo
 *   pondría N reproductores en una pantalla de scroll.
 * · `EvidenciaFoto.Thumbnail` es la miniatura de una FOTO y porta estado de
 *   SUBIDA (subiendo/subida/error). No tiene ni marca de clip ni duración, y
 *   agregárselas la volvería dos cosas.
 * · `ClipSesion` en su variante **vitrina** es superficie que se mueve sola
 *   (autoplay, sin controles) — lo contrario de lo que hace falta acá.
 * El trabajo «representar un clip dentro de una lista de medios» no estaba en
 * el diccionario (Ley 19).
 *
 * ── LEY 13 ───────────────────────────────────────────────────────────────
 * Sin `posterUrl` **no se dibuja un hueco gris con cara de dato**: se dibuja
 * la superficie neutra de la casa con la marca encima. *El clip existe aunque
 * su póster no haya llegado, y decir lo contrario sería que un fallo de red se
 * disfrace de vacío.*
 *
 * ── ESCALERA (§4b) · DOSIS · MOVIMIENTO ──────────────────────────────────
 * No muestra datos del expediente. Sin animación (Ley 6) y **sin transición de
 * imagen** — el mismo criterio con el que `EvidenciaFoto.Thumbnail` monta
 * `expo-image` sin `transition`. Memorial: la clase es de video, no de tema,
 * así que no degrada — lo que degrada es el contexto que la monta.
 */

import { Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import Svg, { Path } from 'react-native-svg'

import { radius } from '../tokens/radius'
import { sobreVideo } from '../tokens/sobreVideo'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { Text } from 'react-native'

export type MiniaturaClipProps = {
  /** El póster del clip. Ausente = superficie neutra con la marca (Ley 13). */
  posterUrl?: string
  /**
   * La duración **ya formateada** por quien la tiene: «0:12».
   * Ausente = no se dibuja la banda. *Un clip sin duración conocida sigue
   * siendo un clip; inventarle «0:00» sería afirmar que dura nada.*
   */
  duracion?: string
  /** Abre el clip. La miniatura no reproduce: lleva. */
  onPress: () => void
  /**
   * Qué es esto, para quien no ve la pantalla: «Clip de la mañana».
   * 🔴 Por prop — el perímetro de la tanda: ninguna pieza escribe su texto.
   */
  accesibilidadEtiqueta: string
  /** El lado del cuadrado. Default 88 — la talla de una tira de medios. */
  lado?: number
}

/** El play: MASA sobre disco, sin trazo y sin huella (§6septies). */
function MarcaDeClip({ lado }: { lado: number }) {
  const disco = Math.round(lado * 0.34)
  const glifo = Math.round(disco * 0.5)

  return (
    <View
      style={{
        width: disco,
        height: disco,
        borderRadius: radius.full,
        backgroundColor: sobreVideo.disco,
        borderWidth: sobreVideo.anilloAncho,
        borderColor: sobreVideo.anillo,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={glifo} height={glifo} viewBox="0 0 12 12">
        {/* Triángulo lleno, con el vértice apenas adentro para que el peso
            óptico quede centrado — un play centrado geométricamente se ve
            corrido a la izquierda. */}
        <Path d="M4 2.5 L9.5 6 L4 9.5 Z" fill={sobreVideo.contenido} />
      </Svg>
    </View>
  )
}

export function MiniaturaClip({
  posterUrl,
  duracion,
  onPress,
  accesibilidadEtiqueta,
  lado = 88,
}: MiniaturaClipProps) {
  const { theme } = useTheme()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[accesibilidadEtiqueta, duracion].filter(Boolean).join('. ')}
      style={{
        width: lado,
        height: lado,
        borderRadius: radius.md,
        overflow: 'hidden',
        // La superficie de abajo es de la casa (Ley 13: sin póster no hay
        // hueco con cara de dato). Lo que va ENCIMA es de la clase.
        backgroundColor: theme.bg.overlay,
      }}
    >
      {posterUrl === undefined ? null : (
        <Image
          source={{ uri: posterUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          // Sin `transition` — Ley 13, mismo criterio que EvidenciaFoto.
        />
      )}

      <View style={{ ...ABSOLUTO, alignItems: 'center', justifyContent: 'center' }}>
        <MarcaDeClip lado={lado} />
      </View>

      {duracion === undefined ? null : (
        <View
          style={{
            position: 'absolute',
            right: spacing[1],
            bottom: spacing[1],
            paddingHorizontal: spacing[1.5],
            paddingVertical: spacing[0.5],
            borderRadius: radius.sm,
            backgroundColor: sobreVideo.banda,
          }}
        >
          {/* Voz de máquina (Ley 3), en el contenido de la clase — no en el
              texto del tema: debajo no hay tema. Por eso `Text` con tokens y
              no `Texto`, cuyo color es semántico del tema. */}
          <Text
            style={{
              color: sobreVideo.contenido,
              fontFamily: typography.family.mono.regular,
              fontSize: typography.size.xs,
              lineHeight: typography.size.xs + 4,
            }}
          >
            {duracion}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

const ABSOLUTO = {
  position: 'absolute' as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}
