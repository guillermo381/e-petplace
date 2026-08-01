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
 * ── DÓNDE NO SE MONTA: MEMORIAL Y CLARO ───────────────────────────────
 * En la fuente, como `MarcaDeAgua` — una condición que cada consumidor
 * repite es una condición que un consumidor va a olvidar.
 * MEMORIAL (Ley 8): memorial no se decora. El legacy ya lo tenía escrito
 * con otras palabras (*"memorial: intensity={0} o no renderizar"*) — se
 * conserva la decisión y se mecaniza la degradación.
 * CLARO — **DARK-ONLY, FIRMADO POR EL FOUNDER (S83, 1-ago-2026)**. Nació
 * como default provisorio en B27 ("el default que no inventa", porque la
 * firma del glow había sido en oscuro) y el founder lo CONVIRTIÓ EN LETRA
 * en B29. **No es un pendiente: es la decisión.** Que nadie lo lea como
 * hueco y lo "arregle" pensando que falta — el criterio, además, coincide
 * con `elevacion.luz`, que resuelve `null` en claro porque en claro la
 * superficie ya existe sin ayuda.
 *
 * ── EL COLOR SALE DEL SLOT (S83-B34) ──────────────────────────────────
 * `accent.atmosfera`, el OCTAVO slot: magenta en el cliente, el verde del
 * oficio en el prestador. Nació sin default con el argumento de que "la
 * pantalla declara su capa"; ese argumento cayó cuando el efecto pasó a
 * ser de las DOS casas — si cada pantalla elige, cada pantalla puede
 * equivocarse de casa, y el magenta en el prestador es lo que §15b.1
 * prohíbe. La prop sobrevive para el caso legítimo: una pantalla del
 * cliente cuya atmósfera es la de otra capa.
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
  /** El color de la luz. **Default: `accent.atmosfera`** (S83-B34, el
   *  octavo slot) — magenta en el cliente, el verde del oficio en el
   *  prestador, resuelto POR CASA como los otros siete.
   *  Nació sin default en B16 con el argumento de que "la pantalla
   *  declara de qué capa es". Ese argumento CAYÓ cuando el efecto pasó a
   *  ser de las DOS casas: si cada pantalla declara el color, cada
   *  pantalla puede equivocarse de casa — y el magenta en el prestador es
   *  justo lo que §15b.1 prohíbe. El slot lo hace imposible por
   *  construcción. La prop sobrevive para el caso legítimo: una pantalla
   *  del cliente cuya atmósfera es la de OTRA capa (salud, cuidado). */
  color?: string
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
  // MEMORIAL: no se monta (Ley 8 — degrada sola, en la fuente).
  //
  // CLARO: tampoco — **DARK-ONLY, FIRMADO (founder, S83, 1-ago-2026)**.
  // Vive acá y no en el layout de cada app por la misma razón por la que
  // `MarcaDeAgua` existe: una condición que cada consumidor repite es una
  // condición que un consumidor va a olvidar (acordado con C, que la
  // tenía en su layout).
  // ⚠️ ESTA LÍNEA NO ES UN PENDIENTE. Nació en B27 como default
  // provisorio —la firma del glow había sido en oscuro y no había letra
  // sobre claro— y en B29 el founder la convirtió en DECISIÓN. Si algún
  // día se quiere atmósfera en claro, eso ENMIENDA una firma; no es
  // completar algo que faltaba. El dato que hacía dudar queda registrado
  // para esa eventual mesa: el AmbientGlow del portal viejo SÍ vivía en
  // claro, declarando 0.12 contra 0.22 de oscuro.
  if (theme.mode === 'memorial' || theme.mode === 'light') return null
  const { cx, cy } = ORIGEN[origen]
  // `atmosfera` vive en LOS TRES temas base, así que el acceso es
  // directo: sin `in`, sin cast. Si algún día un tema no lo trajera, el
  // tsc lo diría acá — que es donde tiene que decirlo.
  const tinta = color ?? theme.accent.atmosfera
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} aria-hidden>
      <Svg width="100%" height="100%">
        <Defs>
          {/* Tres stops y no dos: con dos, el borde del degradado se ve
              como un anillo. El del medio es lo que lo hace atmósfera. */}
          <RadialGradient id="atmosfera" cx={cx} cy={cy} r="55%">
            <Stop offset="0" stopColor={tinta} stopOpacity={intensidad} />
            <Stop offset="0.55" stopColor={tinta} stopOpacity={intensidad * 0.32} />
            <Stop offset="1" stopColor={tinta} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#atmosfera)" />
      </Svg>
    </View>
  )
}
