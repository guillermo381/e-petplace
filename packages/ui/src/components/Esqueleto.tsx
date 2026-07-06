/**
 * Esqueleto — el placeholder ESTÁTICO de carga del sistema (S44-B2.2).
 *
 * ═══════════════════════════════════════════════════════════════════
 * Completamente INERTE (Ley 13): SIN shimmer, SIN pulso, SIN fade de
 * entrada. El shimmer es animación de espera y está prohibido.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Reemplazo directo cuando llegan los datos — JAMÁS layout shift
 * animado. No es EstadoVacio: esqueleto = cargando, EstadoVacio =
 * vacío confirmado. Spinner solo pasado 150ms (patrón Boton) — el
 * esqueleto no lo reemplaza, conviven.
 *
 * Se compone imitando el layout final (la galería trae la receta
 * canónica "fila de agenda"). Color: bg.overlay sobre el fondo del
 * contexto — en memorial degrada solo por token (Ley 8), sin caso
 * especial: acá no hay nada que animar ni marca que apagar.
 *
 * Accesibilidad: cada Esqueleto se oculta del lector de pantalla
 * (formas vacías no se leen). El GRUPO anuncia la carga: envolver
 * en <EsqueletoGrupo> — progressbar + accessibilityState busy.
 */

import type { ReactNode } from 'react'
import { View, type DimensionValue } from 'react-native'

import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'

export type EsqueletoForma = 'linea' | 'circulo' | 'bloque'

export interface EsqueletoProps {
  forma?: EsqueletoForma
  /** linea/bloque: acepta número o % ('60%') para variar largos. circulo lo ignora. */
  ancho?: DimensionValue
  /** linea: grosor (default 12) · bloque: alto (default 80) · circulo: DIÁMETRO (default 40). */
  alto?: number
}

const RADIO: Record<EsqueletoForma, number> = {
  linea: radius.sm,
  circulo: radius.full,
  bloque: radius.md,
}

const ALTO_DEFAULT: Record<EsqueletoForma, number> = {
  linea: 12,
  circulo: 40,
  bloque: 80,
}

export function Esqueleto({ forma = 'linea', ancho, alto }: EsqueletoProps) {
  const { theme } = useTheme()
  const h = alto ?? ALTO_DEFAULT[forma]

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: forma === 'circulo' ? h : (ancho ?? '100%'),
        height: h,
        borderRadius: RADIO[forma],
        backgroundColor: theme.bg.overlay,
      }}
    />
  )
}

/**
 * EsqueletoGrupo — el contenedor accesible de un estado de carga.
 * Anuncia "cargando" UNA vez (progressbar + busy) en lugar de dejar
 * al lector de pantalla frente a formas vacías. Envolvé acá el
 * conjunto de Esqueletos que imita la pantalla final.
 */
export function EsqueletoGrupo({
  children,
  etiqueta = 'Cargando',
}: {
  children: ReactNode
  etiqueta?: string
}) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      // aria-busy es el alias RN de accessibilityState.busy — a diferencia
      // del state, RN-web SÍ lo emite como atributo (verificado S44-B2.2).
      aria-busy
      accessibilityLabel={etiqueta}
    >
      {children}
    </View>
  )
}
