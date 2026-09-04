/**
 * ORBE COACH — **el único dibujo del orbe de la casa** (S113-B · lote 0.3).
 *
 * Sirve a sus TRES apariciones, parametrizado por tamaño y estado:
 * · el orbe grande de `PresenciaCoach` —con resplandor, perla o violeta—
 * · el orbe chico de la fila «Preguntale» —36, siempre violeta—
 * · el de `CabeceraCoach` —36, siempre violeta, que late con cada frase—
 *
 * ── ☠️ LOS DOS DIBUJOS QUE MURIERON PARA QUE ÉSTE EXISTA ────────────────
 * Había **tres copias del mismo orbe**: `CuerpoOrbe` y `OrbeMini` dentro de
 * `PresenciaCoach`, y uno propio adentro de `CabeceraCoach`. **Y la copia de
 * la cabecera se quedó con el defecto que el lote 0.2 curó en las otras dos:**
 * sus paradas de brasa eran `rgba(...)` en el `stopColor`, y **en Android eso
 * pierde el alpha** ⇒ la cabecera se veía un **disco durazno plano**, con el
 * violeta tapado debajo.
 *
 * 🔴 **Y ésa es la lección, no el bug:** *una cura aplicada en dos de tres
 * copias no es una cura, es una coincidencia.* El defecto no sobrevivió por
 * descuido — sobrevivió porque **había dónde sobrevivir**. Con un solo dibujo,
 * la próxima cura llega a las tres apariciones o no llega a ninguna.
 *
 * ── ⚠️ LOS `id` DE LOS DEGRADADOS SON GLOBALES EN `react-native-svg` ─────
 * Tres orbes en pantalla con los mismos `id` se pisan entre sí, y **el que
 * gana depende del orden de montaje** — o sea que el defecto aparecería a
 * veces. Por eso cada instancia deriva los suyos de `useId()`.
 */

import { useId } from 'react'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg'

import { palette } from '../tokens/palette'
import { BRASA, BRASA_MUERE, BRASA_ALFA, LIENZO, LILA_ALFA, RESPLANDOR_ALFA, RESPLANDOR_RADIO, ANILLO } from './coach-geometria'

export interface OrbeCoachProps {
  /** El diámetro del CUERPO. El lienzo lo calcula la pieza. */
  tamano: number
  /** 0 = perla · 1 = violeta. Con un `SharedValue` el cambio se FUNDE; con un
   *  número es fijo. **La fila y la cabecera pasan `1`**: ahí el Coach ya está
   *  despierto y no hay nada que fundir. */
  encendido: SharedValue<number> | 0 | 1
  /** El resplandor violeta detrás. **Sólo el orbe grande lo lleva:** es lo que
   *  le da presencia flotando sobre contenido. *Dentro de una fila o de una
   *  Hoja no tiene trabajo que hacer, y encima ensuciaría lo que tiene al
   *  lado.* */
  conResplandor?: boolean
  /** El color de la identidad encendida. **Default: el violeta del Coach.**
   *  🔴 La presencia SIN Coach pasa el acento de su casa (`accent.cta`), que
   *  para el prestador es `tealDark` por §15b.1 — *el violeta es de Nexo y de
   *  nadie más, así que una puerta que no es suya no puede vestirlo.* */
  color?: string
}

/* ── LA BRASA, y por qué son CINCO paradas y no dos ─────────────────────
 * ⏪ **Con dos paradas se leía «un punto con borde»**, no calor: una caída
 * lineal termina en un anillo donde el degradé se corta, y el ojo lee ese
 * corte como contorno. **Las paradas intermedias son la diferencia entre un
 * punto y un rescoldo.**
 * Y muere ANTES del final del gradiente —a `BRASA_MUERE` de su radio— para
 * que **el corte ocurra donde ya no queda nada que cortar.** */
const PARADAS_BRASA = [
  { o: '0', a: BRASA_ALFA },
  { o: '0.25', a: BRASA_ALFA * 0.6 },
  { o: '0.45', a: BRASA_ALFA * 0.2 },
  { o: String(BRASA_MUERE), a: 0 },
  { o: '1', a: 0 },
] as const

export function OrbeCoach({ tamano, encendido, conResplandor = false, color }: OrbeCoachProps) {
  /* Ver la nota de los `id` globales en la cabecera del archivo. */
  const uid = useId().replace(/:/g, '')
  const lado = conResplandor ? tamano * LIENZO : tamano
  const c = lado / 2
  const r = tamano / 2
  const fijo = typeof encendido === 'number'
  /* Las tres paradas del cuerpo encendido. Con un color propio se derivan de
     él por opacidad: **una casa no tiene por qué traer tres violetas suyos.** */
  const vivo = color ?? palette.coachMedio
  const paradas = color
    ? [
        { o: '0', c: color, a: 0.72 },
        { o: '0.56', c: color, a: 0.92 },
        { o: '1', c: color, a: 1 },
      ]
    : [
        { o: '0', c: palette.coachClaro, a: 1 },
        { o: '0.56', c: palette.coachMedio, a: 1 },
        { o: '1', c: palette.coachProfundo, a: 1 },
      ]

  const estiloVioleta = useAnimatedStyle(() => ({
    opacity: typeof encendido === 'number' ? encendido : encendido.value,
  }))

  const brasa = (id: string) => (
    <RadialGradient
      id={id}
      cx={`${BRASA.cx * 100}%`}
      cy={`${BRASA.cy * 100}%`}
      r={`${(BRASA.diametro / 2) * 100}%`}
    >
      {PARADAS_BRASA.map((p) => (
        /* 🔴 `stopOpacity` SEPARADO, jamás un `rgba` adentro del color: en
           Android el alpha embebido se pierde y el degradé colapsa a un
           relleno opaco. Es el defecto que mató a las tres copias viejas. */
        <Stop key={p.o} offset={p.o} stopColor={palette.coachBrasa} stopOpacity={p.a} />
      ))}
    </RadialGradient>
  )

  return (
    <>
      <Svg width={lado} height={lado} style={{ position: 'absolute' }}>
        <Defs>
          {conResplandor ? (
            <RadialGradient id={`glow${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={vivo} stopOpacity={RESPLANDOR_ALFA} />
              <Stop offset="1" stopColor={vivo} stopOpacity={0} />
            </RadialGradient>
          ) : null}
          <RadialGradient id={`perla${uid}`} cx="38%" cy="34%" r="62%">
            <Stop offset="0" stopColor={palette.coachPerla} stopOpacity={1} />
            <Stop offset="1" stopColor={vivo} stopOpacity={LILA_ALFA} />
          </RadialGradient>
          {brasa(`brasa${uid}`)}
        </Defs>
        {conResplandor ? <Circle cx={c} cy={c} r={r * RESPLANDOR_RADIO} fill={`url(#glow${uid})`} /> : null}
        <Circle
          cx={c}
          cy={c}
          r={r}
          fill={`url(#perla${uid})`}
          /* El contorno: sin él, una esfera casi blanca sobre papel blanco no
             tiene dónde terminar. */
          stroke={vivo}
          strokeOpacity={LILA_ALFA}
          strokeWidth={ANILLO}
        />
        <Circle cx={c} cy={c} r={r} fill={`url(#brasa${uid})`} />
      </Svg>

      {/* La capa violeta, encimada. Con `encendido` animado se FUNDE; con 1
          fijo está siempre, y ahí ni siquiera se monta el Animated. */}
      <Animated.View
        style={[{ position: 'absolute', width: lado, height: lado }, fijo ? { opacity: encendido } : estiloVioleta]}
        pointerEvents="none"
      >
        <Svg width={lado} height={lado}>
          <Defs>
            <RadialGradient id={`vio${uid}`} cx="38%" cy="34%" r="62%">
              {paradas.map((q) => (
                <Stop key={q.o} offset={q.o} stopColor={q.c} stopOpacity={q.a} />
              ))}
            </RadialGradient>
            {brasa(`brasaVio${uid}`)}
          </Defs>
          <Circle cx={c} cy={c} r={r} fill={`url(#vio${uid})`} />
          <Circle cx={c} cy={c} r={r} fill={`url(#brasaVio${uid})`} />
        </Svg>
      </Animated.View>
    </>
  )
}
