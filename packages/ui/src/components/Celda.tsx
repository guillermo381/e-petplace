/**
 * Celda — la fila de lista del sistema (S43-B3.4): citas de agenda,
 * mascotas, clientes, resultados.
 *
 * ═══════════════════════════════════════════════════════════════════
 * REGLA DE PRESSED EN FILAS: una fila NO escala — resalta fondo
 * (bg.overlay, transición fast). Una fila que escala dentro de una
 * lista se ve rota; el scale es de botones y cards sueltas.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Anatomía en tres zonas: inicio? (slot) · contenido (titulo/subtitulo
 * como STRINGS — la celda protege su jerarquía tipográfica, no acepta
 * children libres) · fin? (slot) XOR metadataMono? (string con la regla
 * de voz CABLEADA: JetBrains Mono, minúsculas forzadas, tracking suave).
 *
 * Sin margin propio, sin divisor propio: el divisor es <Separador />
 * (pensado para ItemSeparatorComponent de FlatList).
 *
 * ENTRAR A UNA SECCIÓN no es este trabajo (Ley 19.1, S58): eso es
 * CeldaNavegacion — ícono b′ tipado + chevron + pressed 0.99.
 */

import { useState, type ReactNode } from 'react'
import { Pressable, Text, View, type AccessibilityRole } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

export type CeldaDensidad = 'normal' | 'compacta'

const ALTURA_MIN: Record<CeldaDensidad, number> = {
  normal: 56,    // dos líneas cómodas
  compacta: 48,
}

// S44-B4.1 (enmienda de arquitecto): metadataMono y fin CONVIVEN —
// apilados en la zona fin (mono arriba, nodo abajo, alineados al borde).
// El caso real: hora de la cita + Insignia de estado en la agenda.
type ZonaFin = { fin?: ReactNode; metadataMono?: string }

type Comun = ZonaFin & {
  titulo: string
  subtitulo?: string
  inicio?: ReactNode
  densidad?: CeldaDensidad
}

export type CeldaProps =
  | (Comun & { interactiva?: false; onPress?: never; accessibilityRole?: never })
  | (Comun & { interactiva: true; onPress: () => void; accessibilityRole: AccessibilityRole })

export function Celda(props: CeldaProps) {
  const { titulo, subtitulo, inicio, densidad = 'normal' } = props
  const { theme } = useTheme()
  const [presionada, setPresionada] = useState(false)

  const metadataMono = 'metadataMono' in props ? props.metadataMono : undefined
  const fin = 'fin' in props ? props.fin : undefined

  const cuerpo = (
    <>
      {inicio ? <View>{inicio}</View> : null}

      {/* 🔴 EL SUJETO NO CEDE — cura de S97+-B. Cuatro vueltas, y el
          comentario se reescribe entero porque quedó contradiciéndose a
          sí mismo: un comentario que discute con su propio código es el
          defecto que esta tanda vino a cazar.

          EL DEFECTO ORIGINAL (D, en dispositivo): el nombre de la mascota
          truncaba a **`Z…`** —UNA letra— en el HOY del prestador.

          EL REPARTO, medido: este bloque tenía `flex: 1` = `flexBasis: 0`
          —no reclama ancho propio, toma lo que sobra— y el bloque derecho
          no tenía `flexShrink`, así que su ancho era intrínseco y **no
          cedía jamás**. El sujeto pagaba toda la compresión.

          ⚠️ ATRIBUCIÓN: la escala de N1 (13→14, 15→16) lo **agravó**, no
          lo causó. Pasar de «Zeus» a «Z» es perder el 75%; un ~7% de
          crecimiento no produce eso. **El defecto vive acá desde S43.**

          LA ARITMÉTICA QUE ORDENA TODO, y que solo apareció al leer el
          árbol completo (orden de la mesa tras cuatro parches):
              avatar + gaps + padding ....  ~92 px
              este bloque (piso) .........   96 px
              la derecha (glifo + 2 chips)  ~160 px  ← NO comprimible
              ───────────────────────────────────────
              pedido ~348 · disponible ~340 (412 − hora 46 − gaps)

          **No caben, y ningún elemento es comprimible de verdad**: una
          `Insignia` con texto adentro tiene ancho intrínseco. Por eso
          cada ajuste movía el defecto de lugar en vez de cerrarlo —
          truncado → solapamiento → corte mudo → colisión.

          EL PISO SON 96 y se calibró TRES VECES, la última **bajándolo**:
          subió a 128 para que entrara «Vacunación» y eso empujó 32 px más
          contra una derecha que no puede ceder. *El piso de una columna
          lo fija el renglón más exigente — pero si el total no entra,
          subirlo solo cambia quién se rompe.* Con 96 el título entra
          holgado (~9-10 caracteres: Thor, Zeus, Aurora) y el subtítulo
          **elide con su elipsis**, que es su lugar en la ley.

          LAS TRES PIEZAS VIVAS, y por qué cada una:
          · `minWidth: 96` acá — el título tiene piso.
          · `minWidth: 0` en la derecha — sin eso su `flexShrink` es
            DECORATIVO (el default de un ítem flex es `min-width: auto`,
            que le prohíbe encoger por debajo de su contenido).
          · `overflow: 'hidden'` en la derecha — piso de seguridad contra
            la colisión medida (glifo 21 px DENTRO del texto). Va ahí y
            **no acá**: en el texto silenciaba la elipsis del `Text`, que
            es información. *Recortar un adorno es feo; recortar un aviso
            es mentir.*

          🔴 LO QUE ESTO **NO** RESUELVE, elevado a la mesa: la fila lleva
          más contenido del que entra. Es decisión de ANATOMÍA —que los
          chips bajen a su propia línea— y no otro ajuste de flexbox. */}
      <View style={{ flex: 1, minWidth: 96, gap: spacing[0.5] }}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.base,
            color: theme.text.primary,
          }}
        >
          {titulo}
        </Text>
        {subtitulo ? (
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: typography.size.sm * typography.leading.snug,
              color: theme.text.secondary,
            }}
          >
            {subtitulo}
          </Text>
        ) : null}
      </View>

      {metadataMono || fin ? (
        // La otra mitad de la cura (el porqué completo, arriba): este
        // bloque CEDE. Sin `flexShrink` su ancho era intrínseco y el
        // sujeto pagaba la diferencia entero.
        //
        // ⚠️ `minWidth: 0` NO ES ADORNO — es lo que hace que el
        // `flexShrink` de al lado exista. El default de un ítem flex es
        // `min-width: auto`, que le prohíbe encoger por debajo de su
        // contenido: con eso puesto, `flexShrink: 1` es una declaración
        // que no encoge nada. Fue el defecto de la primera vuelta.
        //
        // ⏪ CUARTA VUELTA — `overflow: 'hidden'` ACÁ, y es el opuesto
        // exacto del que se retiró del texto. D midió la colisión: el
        // glifo cae 21 px DENTRO del texto y el chip empieza 66 px ANTES
        // de que el texto termine — las dos columnas ocupando el mismo
        // espacio.
        //
        // EL MECANISMO, y sale de la cura anterior: `minWidth: 0` dejó
        // que este View ENCOJA, pero **sus hijos no encogen** (un chip
        // con texto adentro tiene ancho intrínseco). Así que el View se
        // achica y su contenido se sale — y con `alignItems: 'flex-end'`
        // se sale hacia la IZQUIERDA, que es donde vive el texto.
        // *Antes no cedía y empujaba; ahora cede y INVADE.*
        //
        // POR QUÉ ACÁ SÍ Y EN EL TEXTO NO — la distinción que la vuelta
        // anterior enseñó: un `overflow` es legítimo **donde no tapa un
        // aviso**. En el texto silenciaba la elipsis del `Text`, que es
        // información. Acá no hay nada que decir: un chip recortado se ve
        // recortado. *Recortar un adorno es feo; recortar un aviso es
        // mentir.*
        //
        // ⚠️ ES UN PISO DE SEGURIDAD, NO LA SOLUCIÓN: garantiza que
        // NADA se superponga, y el precio es que un chip puede quedar
        // cortado por su izquierda. Feo y honesto. La causa de fondo
        // —que esta fila lleva más contenido del que entra— está elevada
        // a la mesa: es decisión de ANATOMÍA (que los chips bajen a su
        // propia línea), no otro ajuste de flexbox.
        <View
          style={{
            alignItems: 'flex-end',
            gap: spacing[1],
            flexShrink: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {metadataMono ? (
            // Regla de voz cableada: mono, MINÚSCULAS forzadas, tracking suave
            <Text
              style={{
                fontFamily: typography.family.mono.regular,
                fontSize: typography.size.sm,
                letterSpacing: typography.tracking.mono,
                color: theme.text.secondary,
              }}
            >
              {metadataMono.toLowerCase()}
            </Text>
          ) : null}
          {fin ? <View>{fin}</View> : null}
        </View>
      ) : null}
    </>
  )

  const layout = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
    minHeight: ALTURA_MIN[densidad],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  }

  if (!props.interactiva) {
    return <View style={layout}>{cuerpo}</View>
  }

  // label compuesto: titulo, subtitulo y metadata en orden natural de lectura
  const etiqueta = [titulo, subtitulo, metadataMono?.toLowerCase()].filter(Boolean).join(', ')

  return (
    <Pressable
      onPress={props.onPress}
      onPressIn={() => setPresionada(true)}
      onPressOut={() => setPresionada(false)}
      accessibilityRole={props.accessibilityRole}
      accessibilityLabel={etiqueta}
    >
      <Animated.View
        style={[
          layout,
          {
            backgroundColor: presionada ? theme.bg.overlay : 'transparent',
            transitionProperty: 'backgroundColor',
            transitionDuration: motion.duration.fast,
            transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
          },
        ]}
      >
        {cuerpo}
      </Animated.View>
    </Pressable>
  )
}
