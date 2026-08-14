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

      {/* 🔴 EL SUJETO NO CEDE — cura de S97+-B, con su defecto medido.

          LO QUE PASABA, visto en dispositivo por D (captura
          `s97-d-lote/02-hoy-linea.png`): en el HOY del prestador el
          nombre de la mascota truncaba a **`Z…`** —UNA letra— y el
          subtítulo partía a media palabra (`Consult a …`).

          EL MECANISMO, medido acá y no supuesto: este bloque tenía
          `flex: 1`, que en RN es `flexBasis: 0` — **no reclama ancho
          propio, toma lo que sobra**. Y el bloque de la derecha
          (`metadataMono` + `fin`) no tenía `flexShrink`, así que su
          ancho es intrínseco y **no cede jamás**. Con una fila cargada
          —hora, avatar, glifo, dos chips, duración y chevron— la derecha
          se servía primero y al sujeto le quedaban las sobras.

          ⚠️ LA ATRIBUCIÓN, que importa porque hubo dos sospechosos: la
          escala de N1 (13→14, 15→16) **agravó** esto, no lo causó. Pasar
          de «Zeus» a «Z» es perder el 75% del nombre; un crecimiento del
          ~7% en los chips no produce eso — lo produce que este bloque
          absorbía TODA la compresión. **El defecto es estructural y vive
          acá desde S43**; la escala solo lo hizo visible.

          LA CURA, en dos mitades que solo funcionan juntas:
          · `minWidth` acá — el sujeto tiene un piso y por debajo no baja.
          · `flexShrink: 1` en la derecha (abajo) — alguien tiene que
            ceder, y entre el nombre de la mascota y un chip de estado,
            cede el chip. *El nombre es el sujeto de la fila; el resto es
            metadata sobre él.*

          El piso son 96: a `size.base` (16) entran ~9-10 caracteres, que
          cubre los nombres reales de la casa (Thor, Zeus, Aurora). No es
          un número de gusto — es el ancho por debajo del cual un nombre
          deja de ser un nombre. */}
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
        <View style={{ alignItems: 'flex-end', gap: spacing[1], flexShrink: 1 }}>
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
