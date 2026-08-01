/**
 * Atmosfera — LA LUZ DE AMBIENTE DE LA PANTALLA (S83-B16, FIRMADA por el
 * founder en negro y confirmada en la casa verde).
 *
 * ── EL NOMBRE, y por qué NO se llama "glow" ────────────────────────────
 * La **Ley 7** dice que el glow es SEMÁNTICO: reservado a *"en vivo / en
 * curso"*, dark only, un solo elemento vivo por pantalla. Esto NO es eso:
 * es ATMÓSFERA — no dice que algo esté pasando, dice de qué capa es la
 * pantalla. **Dos trabajos distintos no comparten nombre**, y por eso la
 * salida no es enmendar la Ley 7 sino que el efecto tenga el suyo: la Ley
 * 7 queda INTACTA y sigue gobernando el glow de estado (`CitaEnVivo`).
 * El nombre no se inventó acá — el portal viejo tituló su archivo
 * *"Atmósfera de capa"* (v3.2); se recupera el que el ecosistema ya le
 * había dado.
 *
 * ── QUÉ ES ────────────────────────────────────────────────────────────
 * Un degradado RADIAL detrás del contenido, en el color de la capa. **No
 * lleva blur y no lo necesita**: el degradado ES el difuminado (forma 2
 * del relevamiento S83-B8 — `RadialGradient` de `react-native-svg`, CERO
 * dependencias nuevas; Skia se descartó por eso mismo). Es FONDO:
 * `pointerEvents="none"`, absoluto sobre su padre, `aria-hidden`.
 *
 * ── LA DOSIS (§15b: el prestador trabaja, no celebra) ──────────────────
 * **UNA por pantalla.** Es la misma regla que el AmbientGlow ya traía
 * ("un glow ambient activo por pantalla") y la misma familia que la Ley 5
 * (un `accent.active` por vista) y la Ley 7 (un elemento vivo). No hay
 * guard que lo impida: es dosis, y la dosis se cumple mirando.
 *
 * ── MEMORIAL LA APAGA (Ley 8) ─────────────────────────────────────────
 * En la fuente, como `MarcaDeAgua`: memorial no se decora. El legacy ya
 * lo tenía escrito con otras palabras (*"memorial: intensity={0} o no
 * renderizar"*) — se conserva la decisión, se mecaniza la degradación.
 *
 * ── EL COLOR NO TIENE DEFAULT, a propósito ────────────────────────────
 * La pantalla declara de qué CAPA es su atmósfera. Un default sería la
 * pieza decidiendo dosis desde adentro, que es justo lo que
 * `MarcaEleccion` declara que no hace. En el prestador el color es su
 * oficio (`accent.cta` / `palette.tealDark`); en el cliente, la capa del
 * contexto.
 */

import { View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'

import { useTheme } from '../ThemeProvider'

/** Dónde nace la luz. El legacy tenía siete posiciones y usó DOS en toda
 *  su vida (`top-right` en el layout, `top-right` en el Durante): el
 *  vocabulario nace con las que se van a usar y crece si hace falta —
 *  una API con cinco valores muertos es deuda desde el día uno. */
export type OrigenAtmosfera = 'arriba' | 'arriba-derecha' | 'centro'

const ORIGEN: Record<OrigenAtmosfera, { cx: string; cy: string }> = {
  arriba: { cx: '50%', cy: '8%' },
  'arriba-derecha': { cx: '85%', cy: '10%' },
  centro: { cx: '50%', cy: '50%' },
}

export type AtmosferaProps = {
  /** El color de la CAPA. Sin default: la pantalla lo declara. */
  color: string
  /** Dónde nace la luz. Default `'arriba-derecha'`, el único que el
   *  portal viejo usó en producción. */
  origen?: OrigenAtmosfera
  /** Opacidad del núcleo. Default 0.18 — entre el 0.16 del layout del
   *  legacy y el 0.22 de su pantalla del Durante, del lado sobrio porque
   *  §15b manda sobriedad. Se ajusta por gate, no por gusto. */
  intensidad?: number
}

export function Atmosfera({ color, origen = 'arriba-derecha', intensidad = 0.18 }: AtmosferaProps) {
  const { theme } = useTheme()
  // Memorial: no se monta (Ley 8 — degrada sola, en la fuente).
  if (theme.mode === 'memorial') return null
  const { cx, cy } = ORIGEN[origen]
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} aria-hidden>
      <Svg width="100%" height="100%">
        <Defs>
          {/* Tres stops y no dos: con dos, el borde del degradado se ve
              como un anillo. El del medio es lo que lo hace atmósfera. */}
          <RadialGradient id="atmosfera" cx={cx} cy={cy} r="55%">
            <Stop offset="0" stopColor={color} stopOpacity={intensidad} />
            <Stop offset="0.55" stopColor={color} stopOpacity={intensidad * 0.32} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#atmosfera)" />
      </Svg>
    </View>
  )
}
