/**
 * Casilla — LA ACEPTACIÓN que se conserva como PRUEBA (S104-C, Ley 11 + Ley
 * 22). Un checkbox de verdad (`accessibilityRole="checkbox"`).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 NO REEMPLAZA A `Interruptor`, Y UNIFICARLAS ROMPE LA LETRA.
 *
 * `Interruptor` es `role="switch"`: un AJUSTE que se prende y se apaga sin
 * consecuencia (una preferencia que se puede desandar). `Casilla` es
 * `role="checkbox"`: una ACEPTACIÓN que se conserva como prueba (P23). El
 * T&C profesional §4.3 y §38.10 exigen «casilla específica, **distinta e
 * independiente**» — y **un `switch` no cumple ese literal**: en una
 * aceptación legal la semántica del control ES parte de la prueba. Si alguna
 * vez alguien las unifica «por prolijidad», rompe §4.3. Son dos cosas
 * distintas y se quedan distintas.
 *
 * FUNDAMENTO MEDIDO (S104-C, cruce a `packages/ui` autorizado por la
 * conductora A · aditivo puro, 76(d)): `Casilla` no existía · `Interruptor`
 * es `role="switch"` (confirmado en su fuente) · cero checkboxes en el
 * monorepo · la letra usa la palabra «casilla».
 * ═══════════════════════════════════════════════════════════════════════
 *
 * QUÉ ES: un cuadro que se marca + un label (children) que puede llevar un
 * enlace al documento (`<Texto>`/`<Text>` con su propio `onPress` abre el
 * documento SIN marcar la casilla — es el responder más interno). Lo
 * OBLIGATORIO / OPCIONAL lo decide la PANTALLA: este control no valida.
 *
 * Ley 22 — SÓLIDO: marcada = fill del acento POR REGISTRO ('control' =
 * cliente magentaDark/violetText · 'oficio' = prestador tealDark/teal) con
 * el check en PAPEL; sin marcar = cuadro con borde sereno en `bg.overlay`.
 * SIN MARCAR JAMÁS DICE ERROR: sin marcar es estado, no falla — la pantalla
 * que exige la casilla lo dice con su propia voz, no con rojo en el cuadro.
 * Memorial degrada a TINTA (accent.control memorial ya resuelve a tinta).
 *
 * Geometría (Ley 21): rectángulo SUAVE, no píldora — se ELIGE, no informa.
 * A escala de 24px la esquina va a `radius.sm` (proporcional; la suave de 10
 * sobre 24 se lee casi redonda).
 *
 * A11y: `role="checkbox"` con `checked` anunciado; target 44 (hitSlop sobre
 * el cuadro de 24); el label accesible es una prop (el lector lee el TEXTO
 * de la aceptación, no el enlace).
 *
 * Escalera §4b: control puro, no muestra datos del expediente — no aplica.
 */

import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

const LADO = 24

export interface CasillaProps {
  marcada: boolean
  onCambio: (marcada: boolean) => void
  /** Lo que lee el lector de pantalla — el TEXTO de la aceptación, jamás el
   *  enlace (que vive en children con su propio onPress). */
  etiquetaAccesible: string
  /** El label visual: texto de la aceptación + enlace inline opcional al
   *  documento. Lo compone la pantalla para controlar qué es tocable. */
  children: ReactNode
  /** Ley 22 por registro: 'control' (cliente, default) · 'oficio' (prestador). */
  registro?: 'control' | 'oficio'
}

export function Casilla({
  marcada,
  onCambio,
  etiquetaAccesible,
  children,
  registro = 'control',
}: CasillaProps) {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'

  // SÓLIDO por registro; memorial degrada a TINTA (accent.control memorial YA
  // resuelve a tinta — el registro no lo pisa).
  const fillMarcada = esMemorial
    ? theme.accent.control
    : registro === 'oficio'
      ? theme.accent.primary
      : theme.accent.control

  return (
    <Pressable
      onPress={() => onCambio(!marcada)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel={etiquetaAccesible}
      hitSlop={(44 - LADO) / 2}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}
    >
      <View
        style={{
          width: LADO,
          height: LADO,
          // el cuadro se alinea con la primera línea del texto, no con su centro
          marginTop: spacing[0.5],
          borderRadius: radius.sm,
          // sin marcar = estado sereno (bg.overlay + hairline); marcada = fill
          // sólido, y el hairline muere con el fill (Chanel). Borde de ancho
          // CONSTANTE (transparente al marcar): el estado no mueve la geometría.
          backgroundColor: marcada ? fillMarcada : theme.bg.overlay,
          borderWidth: theme.border.width,
          borderColor: marcada ? 'transparent' : theme.border.subtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {marcada && (
          <Svg width={14} height={14} viewBox="0 0 14 14">
            {/* el check en PAPEL (Ley 22) — constante en los tres temas */}
            <Path
              d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
              stroke={palette.white}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        )}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  )
}
