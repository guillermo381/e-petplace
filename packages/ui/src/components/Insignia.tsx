/**
 * Insignia — el chip de estado del sistema (S43-B3.5).
 *
 * ═══════════════════════════════════════════════════════════════════
 * NO ES INTERACTIVA — jamás Pressable. Un badge que se toca es un
 * botón disfrazado: si necesita acción, es un Boton (o una Celda).
 * ═══════════════════════════════════════════════════════════════════
 *
 * Dos familias (discriminated union — el consumidor JAMÁS elige colores):
 *   estado → alDia/atencion/proximo/info: tint + texto AA del tema,
 *            la pareja completa sale de tokens.
 *   capa   → vida/cuidado/comunidad/comunidadAmplia: punto del hex
 *            PURO (registro gráfico) + texto en capaText (registro AA).
 *            La regla de dos registros cableada acá, no confiada.
 *
 * soloPunto (familia capa): solo el punto de 10 para celdas densas.
 * La etiqueta sigue siendo obligatoria — pasa a ser el accessibilityLabel:
 * el color jamás es el único canal (TS lo fuerza).
 */

import { Text, View } from 'react-native'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export type InsigniaEstado = 'alDia' | 'atencion' | 'proximo' | 'info'
export type InsigniaCapa = 'vida' | 'cuidado' | 'comunidad' | 'comunidadAmplia'
export type InsigniaTamaño = 'sm' | 'md'

const TAMAÑOS: Record<InsigniaTamaño, { alto: number; fontSize: number }> = {
  sm: { alto: 22, fontSize: typography.size.xs },
  md: { alto: 26, fontSize: typography.size.sm },
}

const ESTADO_A_STATUS = {
  alDia: 'success',
  atencion: 'danger',
  proximo: 'warning',
  info: 'info',
} as const

const CAPA_A_KEY = {
  vida: 'identidad',
  cuidado: 'cuidado',
  comunidad: 'comunidad',
  comunidadAmplia: 'comunidadAmplia',
} as const

export type InsigniaProps =
  | { estado: InsigniaEstado; capa?: never; soloPunto?: never; etiqueta: string; tamaño?: InsigniaTamaño }
  | { capa: InsigniaCapa; estado?: never; soloPunto?: boolean; etiqueta: string; tamaño?: InsigniaTamaño }

export function Insignia(props: InsigniaProps) {
  const { etiqueta, tamaño = 'md' } = props
  const { theme } = useTheme()
  const t = TAMAÑOS[tamaño]
  const capaTexto = 'capaText' in theme ? theme.capaText : theme.capa

  if ('capa' in props && props.capa) {
    const k = CAPA_A_KEY[props.capa]

    if (props.soloPunto) {
      return (
        <View
          accessibilityRole="text"
          accessibilityLabel={etiqueta}
          style={{ width: 10, height: 10, borderRadius: radius.full, backgroundColor: theme.capa[k] }}
        />
      )
    }

    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={etiqueta}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[1.5],
          height: t.alto,
          paddingHorizontal: spacing[2.5],
          borderRadius: radius.full,
          backgroundColor: theme.bg.elevated,
          borderWidth: theme.border.width,
          borderColor: theme.border.subtle,
          alignSelf: 'flex-start',
        }}
      >
        <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: theme.capa[k] }} />
        <Text style={{ fontFamily: typography.family.sans.medium, fontSize: t.fontSize, color: capaTexto[k] }}>
          {etiqueta}
        </Text>
      </View>
    )
  }

  const s = ESTADO_A_STATUS[(props as { estado: InsigniaEstado }).estado]
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={etiqueta}
      style={{
        justifyContent: 'center',
        height: t.alto,
        paddingHorizontal: spacing[2.5],
        borderRadius: radius.full,
        backgroundColor: theme.status[`${s}Bg`],
        borderWidth: theme.border.width,
        borderColor: theme.status[`${s}Border`],
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ fontFamily: typography.family.sans.medium, fontSize: t.fontSize, color: theme.status[`${s}Text`] }}>
        {etiqueta}
      </Text>
    </View>
  )
}
