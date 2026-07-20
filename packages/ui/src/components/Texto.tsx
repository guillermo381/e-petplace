/**
 * Texto — la pieza de texto del sistema (S71-A1, componente 58).
 *
 * POR QUÉ NACE (deep research S71, Bloque 0): el design system tenía 57
 * exports y NINGUNO era texto. Consecuencia: `<Text>` de react-native con
 * `style` inline tokenizado era el único camino posible, y la receta se
 * repetía ~200 veces en el cliente (7 literales solo en `parte`). El
 * resultado no era hardcodeo — los tokens estaban bien puestos — sino algo
 * peor: **la jerarquía tipográfica se re-decidía a mano en cada pantalla**.
 * Ley 11 sobre la pieza más usada del monorepo.
 *
 * LA API ES DELIBERADAMENTE POBRE. Cuatro variantes, color semántico y
 * `numberOfLines`. Nada decorativo, y **sin prop `style`**: la escotilla de
 * estilo libre devolvería el gobierno de la jerarquía a la pantalla, que es
 * exactamente el problema que este componente existe para cerrar. Si una
 * superficie necesita algo que esta API no da, eso es una conversación de
 * mesa (Ley 11: propuesta + gate), jamás una prop nueva metida al pasar.
 *
 * EL LAYOUT ES DEL PADRE. `Texto` es una hoja: no lleva margin, flex ni
 * ancho. Para truncar, `numberOfLines`; para acomodar, la `View` que lo
 * contiene.
 *
 * Las variantes (Ley 3 — regla de voz):
 *   · titulo  → DM Sans 300 · 28px · lo humano a escala de voz.
 *   · seccion → DM Sans 500 · 18px · el rótulo de un bloque, con
 *               `accessibilityRole="header"` DE FÁBRICA.
 *   · cuerpo  → DM Sans 400 · 18px · la prosa por default.
 *   · apoyo   → DM Sans 400 · 13px · secundario, subtítulos, ayudas.
 *   · dato    → JetBrains Mono 400 · 13px · metadata que generó una máquina
 *               (fechas, horas, IDs, códigos), con `tabular-nums` para que
 *               los dígitos no bailen (precedente Cronometro, S44).
 *
 * CONGELADO S71-A2 con las cuatro enmiendas de mesa, todas MEDIDAS antes
 * de decidir (no dictadas):
 *
 *   (1) NACE `seccion`. Había **10 definiciones de `TituloBloque`**
 *       repartidas entre las dos apps — y las diez BYTE-IDÉNTICAS (medium
 *       + `size.md` + `text.primary` + `accessibilityRole="header"`), más
 *       3 `tituloSeccion` locales. Diez copias iguales no son diez
 *       decisiones: son una decisión que nadie tuvo dónde poner. El
 *       `accessibilityRole` viaja ADENTRO porque era lo primero que se
 *       perdía al re-teclear la receta.
 *
 *   (2) `apoyo` ABSORBE `VozSecundaria` — NO nace quinta variante. Las
 *       **4 copias de `VozSecundaria`** también son byte-idénticas entre
 *       sí, y difieren de `apoyo` en UNA cosa: traen
 *       `lineHeight: size.sm * leading.normal`. Cuatro implementaciones
 *       independientes que coinciden en el mismo valor son cuatro votos
 *       por el mismo interlineado, no un capricho local: `apoyo` lo
 *       adopta y las absorbe. La prosa chica sin `lineHeight` se
 *       apelmaza — el defecto estaba en la variante, no en los clones.
 *
 *   (3) `FilaDato` (componente 59) nace HERMANO, no prop de acá: es
 *       LAYOUT (etiqueta sobre valor) y compone `Texto`. Meterlo como
 *       variante habría hecho que este componente devuelva dos nodos —
 *       la puerta a que `Texto` se convierta en un mini-framework.
 *
 *   (4) `montoCorto` NO NACE (D-448). El formateo de plata es del RIEL,
 *       por idioma — igual que `fechaCortaMono`. Una variante tipográfica
 *       no arregla que haya 42 formateos con 2 divergentes; los
 *       escondería mejor.
 *
 * Los tres temas salen gratis: el color sale de `theme.text.*`.
 */

import { Text } from 'react-native'
import type { ReactNode } from 'react'

import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'

export type TextoVariante = 'titulo' | 'seccion' | 'cuerpo' | 'apoyo' | 'dato'
export type TextoColor = 'primary' | 'secondary' | 'tertiary'

export type TextoProps = {
  children: ReactNode
  /** Default: 'cuerpo'. */
  variante?: TextoVariante
  /** Color semántico del sistema. Default: el de la variante. */
  color?: TextoColor
  /** Truncado. Passthrough a react-native. */
  numberOfLines?: number
}

const RECETA: Record<
  TextoVariante,
  {
    fontFamily: string
    fontSize: number
    color: TextoColor
    tabular?: boolean
    /** Interlineado explícito — solo donde la prosa lo necesita (enmienda 2). */
    leading?: number
    /** Rótulo de bloque: el rol de a11y viaja con la variante (enmienda 1). */
    header?: boolean
  }
> = {
  titulo:  { fontFamily: typography.family.sans.light,   fontSize: typography.size.xl, color: 'primary'   },
  seccion: { fontFamily: typography.family.sans.medium,  fontSize: typography.size.md, color: 'primary',   header: true },
  cuerpo:  { fontFamily: typography.family.sans.regular, fontSize: typography.size.md, color: 'primary'   },
  apoyo:   { fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: 'secondary', leading: typography.size.sm * typography.leading.normal },
  dato:    { fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, color: 'secondary', tabular: true },
}

export function Texto({ children, variante = 'cuerpo', color, numberOfLines }: TextoProps) {
  const { theme } = useTheme()
  const receta = RECETA[variante]

  return (
    <Text
      accessibilityRole={receta.header === true ? 'header' : undefined}
      numberOfLines={numberOfLines}
      style={{
        fontFamily: receta.fontFamily,
        fontSize: receta.fontSize,
        color: theme.text[color ?? receta.color],
        ...(receta.leading !== undefined ? { lineHeight: receta.leading } : null),
        ...(receta.tabular ? { fontVariant: ['tabular-nums' as const] } : null),
      }}
    >
      {children}
    </Text>
  )
}
