/**
 * Cronometro — el tiempo transcurrido de una atención (S44-B2.4).
 *
 * ═══════════════════════════════════════════════════════════════════
 * Voz de MÁQUINA (Ley 3): JetBrains Mono, tracking del token,
 * tabular-nums — cero baile de layout entre dígitos (Ley 6).
 * Sin unidades, sin label: la pantalla contextualiza.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Cálculo por DIFERENCIA contra Date.now() en cada tick (1s) —
 * JAMÁS acumulando: al volver de background muestra la verdad.
 * `inicioTs` es el timestamp del server (ISO string o epoch ms).
 *
 * `pausadoEnMs`: si viene, se muestra ESE valor congelado — sin
 * parpadeo, sin opacidad de "pausa": quieto y digno. El estado de
 * pausa lo comunica la pantalla, no el número.
 *
 * Formato mm:ss; ≥1h → h:mm:ss. Color text.primary. Memorial: sin
 * caso especial (hereda por token; que un cronómetro corra en
 * memorial es decisión de la pantalla, no del componente).
 *
 * TAMAÑO PROVISIONAL (gate S44-B2.4): typography.size.display (68) —
 * se ratifica o ajusta en el ensamble del Durante (S44-B4) con la
 * pantalla real en dispositivo.
 *
 * Accesibilidad: role timer + label "Tiempo transcurrido";
 * accessibilityLiveRegion="none" explícito — el tick NO se anuncia
 * en loop.
 */

import { useEffect, useState } from 'react'
import { Text } from 'react-native'

import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'

export interface CronometroProps {
  /** Timestamp del server (ISO string o epoch ms) desde el que corre. */
  inicioTs: string | number
  /** Valor congelado en pausa. Presente = no hay tick, se muestra este. */
  pausadoEnMs?: number
}

function aMs(inicioTs: string | number): number {
  return typeof inicioTs === 'number' ? inicioTs : new Date(inicioTs).getTime()
}

function formatear(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const dd = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${dd(m)}:${dd(s)}` : `${dd(m)}:${dd(s)}`
}

export function Cronometro({ inicioTs, pausadoEnMs }: CronometroProps) {
  const { theme } = useTheme()
  const pausado = pausadoEnMs !== undefined

  // El tick solo fuerza re-render: el valor SIEMPRE se deriva de
  // Date.now() en el render (verdad tras background, sin acumulación).
  const [, setTick] = useState(0)
  useEffect(() => {
    if (pausado) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [pausado])

  const ms = pausado ? pausadoEnMs : Date.now() - aMs(inicioTs)
  const texto = formatear(ms)

  return (
    <Text
      accessibilityRole="timer"
      accessibilityLabel="Tiempo transcurrido"
      accessibilityLiveRegion="none"
      allowFontScaling={false}
      style={{
        fontFamily: typography.family.mono.medium,
        fontSize: typography.size.display,
        letterSpacing: typography.tracking.mono,
        fontVariant: ['tabular-nums'],
        color: theme.text.primary,
      }}
    >
      {texto}
    </Text>
  )
}
