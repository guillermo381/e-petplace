import { View } from 'react-native'
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { Boton } from './Boton'
import { TrioPersonajes, type EspeciePersonaje } from './Personaje'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'
import { medidas } from '../tokens/medidas'
import { motion } from '../tokens/motion'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **CONFIRMACIÓN (S116-B lote 2) — la pantalla de «¡Listo!».**
 * Punto 11 del encargo.
 *
 * **PIEZA NUEVA.** No reemplaza a nadie.
 *
 * ── LO QUE LA DEFINE ──────────────────────────────────────────────────
 * **Lienzo entero, sin cabecera.** No recibe `Cabecera` ni la dibuja: una
 * confirmación no tiene «volver» — lo que había atrás ya pasó.
 *
 * 🔴 **«Nada se mueve después de entrar»** (textual). Todo lo que anima lo
 * hace UNA vez, al montar: el check crece, los destellos entran
 * escalonados, los personajes aparecen. **Después queda quieto.** *Una
 * pantalla de cierre que sigue moviéndose le pide atención a alguien que
 * ya terminó.*
 *
 * ⚠️ **Y con `useReducedMotion` no entra nada: aparece hecha.** No es una
 * versión pobre — es la misma pantalla sin la entrada (la firma de la mesa
 * del 13-sep, la misma que gobierna `usePresionado`).
 *
 * ── EL SLOT FISCAL, y por qué es un slot ──────────────────────────────
 * `lineaExtra` existe para **la línea que S115 dejó pendiente** — *«la
 * factura te llega aparte por correo»*. Es un `string` opcional y **no un
 * nodo**: si fuera nodo, una pantalla podría meter ahí el monto, el
 * desglose o un botón, y `R74`/`R84` existen justamente para que la plata
 * y las tarifas no se cuelen dentro de una pieza. *Acá entra una frase, y
 * la frase la escribe el riel.*
 *
 * ── MEMORIAL ──────────────────────────────────────────────────────────
 * **No monta el trío ni los destellos** (§4: «sin personajes, sin trío,
 * sin check festivo»). Lo decide el TEMA, no el consumidor: una pantalla
 * de cierre en memorial no debería depender de que alguien se acuerde.
 * ═══════════════════════════════════════════════════════════════════════
 */
export type ConfirmacionProps = {
  titulo: string
  apoyo?: string
  /** El dato que importa: el pedido y su monto, la mascota y su edad. */
  dato?: { etiqueta: string; valor: string }
  /** La línea fiscal de S115. **Texto, jamás un nodo** (ver cabecera). */
  lineaExtra?: string
  primario: { texto: string; onPress: () => void }
  secundario?: { texto: string; onPress: () => void }
  /** Las caras de la familia, **la primera es la protagonista**. Si llegan
   *  menos de tres se COMPLETA con las de la casa (ver abajo).
   *  ⏪ *El comentario que estaba acá ya prometía ese completado y el
   *  código hacía lo contrario: sin tres exactas, no dibujaba trío. Hoy es
   *  cierto.* */
  especies?: EspeciePersonaje[]
  /** ¿Va el trío? **Sin default en la firma: lo decide la CASA** —
   *  encendido en cliente, apagado en prestador y en memorial. Pasalo
   *  `false` sólo si esta pantalla es la excepción. */
  trio?: boolean
  /** El «¡Listo!» en Baloo. Sin default: la voz es del riel (Ley 3). */
  exclamacion: string
}

const DESTELLOS = 6

function Check({ color, sobre }: { color: string; sobre: string }) {
  return (
    <View
      style={{
        width: 88,
        height: 88,
        borderRadius: radius.chipV5,
        backgroundColor: sobre,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
        <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  )
}

export function Confirmacion({
  titulo,
  apoyo,
  dato,
  lineaExtra,
  primario,
  secundario,
  especies,
  trio,
  exclamacion,
}: ConfirmacionProps) {
  const { theme } = useTheme()
  const quieto = useReducedMotion() || theme.mode === 'memorial'
  const esMemorial = theme.mode === 'memorial'
  /* La casa decide si el trío va, igual que la pata en el chip. */
  const esCasaV5 = theme.accent.formaV5 === true

  /* La entrada escalonada de la casa (letra §2: 45/300). Con la preferencia
     activa o en memorial, `delay` y `duration` en 0 = aparece hecha. */
  const entrada = (i: number) =>
    quieto ? undefined : FadeIn.delay(i * motion.v5.entradaStaggerMs).duration(motion.v5.entradaMs)

  /* ══════════════════════════════════════════════════════════════════
   *  EL TRÍO VIENE ENCENDIDO EN EL CLIENTE — S116-B, firma de la mesa.
   *
   * 🔴 **Era opt-in y NADIE lo pasaba**: medido por C y confirmado acá —
   * **cero `especies=` en `apps/`**. ⇒ `TrioPersonajes` se construyó en el
   * lote 2, aprendió a fundirse escalonado en el 03, y **no se vio nunca**.
   *
   * ⚠️ **NO es un booleano como la pata: el trío necesita SABER QUÉ CARAS.**
   * Por eso el default no es «true»: es **completar**. Lo que llegue va
   * primero —la especie de la mascota, que es la protagonista— y el resto
   * lo pone la casa hasta tres.
   *
   * **LAS DE RELLENO NO REPITEN la protagonista**, y esa es toda la lógica
   * que hay acá: un trío con el mismo gato tres veces no es una familia,
   * es un error de render que nadie va a reportar porque «se ve bien». */
  const CASA: EspeciePersonaje[] = ['perro', 'gato', 'conejo']
  const trioEncendido = (trio ?? esCasaV5) && !esMemorial
  const dadas = especies ?? []
  const relleno = CASA.filter((e) => !dadas.includes(e))
  const trioFinal = trioEncendido ? [...dadas, ...relleno].slice(0, 3) : undefined

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, padding: medidas.margen, gap: spacing[5], justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', gap: spacing[4] }}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* Los destellos: **sólo donde hay fiesta.** En memorial no se
              montan (§4), y eso lo decide el tema. */}
          {!esMemorial
            ? Array.from({ length: DESTELLOS }, (_, i) => {
                const ang = (i / DESTELLOS) * Math.PI * 2
                return (
                  <Animated.View
                    key={i}
                    entering={entrada(i + 1)}
                    style={{
                      position: 'absolute',
                      width: 8,
                      height: 8,
                      borderRadius: radius.chipV5,
                      backgroundColor: theme.accent.cta,
                      transform: [{ translateX: Math.cos(ang) * 68 }, { translateY: Math.sin(ang) * 68 }],
                    }}
                  />
                )
              })
            : null}
          <Animated.View entering={entrada(0)}>
            <Check color={theme.accent.ctaTexto} sobre={esMemorial ? theme.accent.control : theme.accent.cta} />
          </Animated.View>
        </View>

        {trioFinal !== undefined && trioFinal.length === 3 ? (
          <Animated.View entering={entrada(3)}>
            <TrioPersonajes especies={trioFinal as [EspeciePersonaje, EspeciePersonaje, EspeciePersonaje]} tamano="hogar" />
          </Animated.View>
        ) : null}

        <Animated.View entering={entrada(4)} style={{ alignItems: 'center', gap: spacing[2] }}>
          {/* El «¡Listo!» en Baloo — `titulo` es la variante display de la
              casa; el qué pasó va debajo, en sección. */}
          <Texto variante="titulo">{exclamacion}</Texto>
          <Texto variante="seccion">{titulo}</Texto>
          {apoyo !== undefined ? <Texto variante="apoyo">{apoyo}</Texto> : null}
        </Animated.View>
      </View>

      {dato !== undefined ? (
        <Animated.View entering={entrada(5)}>
          {/* `plana` — el material de v5 para el dato de apoyo. */}
          <Tarjeta tinte="plana" elevacion="plana">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Texto variante="apoyo">{dato.etiqueta}</Texto>
              <Texto variante="enfasis">{dato.valor}</Texto>
            </View>
          </Tarjeta>
        </Animated.View>
      ) : null}

      {lineaExtra !== undefined ? (
        <Texto variante="apoyo">{lineaExtra}</Texto>
      ) : null}

      <View style={{ gap: spacing[2] }}>
        <Boton variante="primario" bloque etiqueta={primario.texto} onPress={primario.onPress} />
        {secundario !== undefined ? (
          <Boton variante="secundario" bloque etiqueta={secundario.texto} onPress={secundario.onPress} />
        ) : null}
      </View>
    </View>
  )
}
