/**
 * EstadoVacio — el momento de dignidad cuando no hay datos (S43-B3.9).
 * No un hueco: voz humana + acompañamiento + (opcional) el primer paso.
 *
 * SIN animación de entrada — aparece con la pantalla, no después:
 * un vacío que anima llama la atención sobre sí mismo.
 * UNO por pantalla.
 */

import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  accion,
}: {
  /** 48-64px; ilustración monolinea cuando exista — por ahora íconos outline. */
  icono?: ReactNode
  /** VOZ HUMANA — ej: "Todavía nada por acá". */
  titulo: string
  /** Tono que acompaña — ej: "Cuando agendes tu primera atención, va a aparecer acá." */
  descripcion?: string
  /** Un Boton (primario o secundario — el consumidor decide). */
  accion?: ReactNode
}) {
  const { theme } = useTheme()

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing[8],
        gap: spacing[8],   // aire generoso entre bloques
      }}
    >
      {icono ? <View>{icono}</View> : null}
      <View style={{ alignItems: 'center', gap: spacing[3] }}>
        <Text
          accessibilityRole="header"
          style={{
            textAlign: 'center',
            fontFamily: typography.family.sans.light,   // voz humana
            fontSize: typography.size.xl,
            lineHeight: typography.size.xl * typography.leading.snug,
            color: theme.text.primary,
          }}
        >
          {titulo}
        </Text>
        {descripcion ? (
          <Text
            numberOfLines={3}
            style={{
              textAlign: 'center',
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: typography.size.sm * typography.leading.normal,
              color: theme.text.secondary,
            }}
          >
            {descripcion}
          </Text>
        ) : null}
      </View>
      {accion ? <View>{accion}</View> : null}
    </View>
  )
}
