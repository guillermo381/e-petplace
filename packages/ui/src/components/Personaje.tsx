import { View, Image, type ViewStyle, type ImageSourcePropType } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { motion } from '../tokens/motion'
import { medidas } from '../tokens/medidas'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **PERSONAJE (S116-B lote 2) — las seis caras de la casa.**
 * Letra `LETRA_REDISENO_S116` §1.10 · punto 12 del encargo del lote.
 *
 * **PIEZA NUEVA. No reemplaza a nadie** — la casa no tenía dónde vivir una
 * ilustración de especie: `AvatarMascota` dibuja la FOTO de una mascota
 * concreta y cae a una huella cuando no hay; esto es la ilustración de la
 * ESPECIE, que es otra cosa y es lo que la letra pide para el splash, los
 * beneficios y las confirmaciones.
 *
 * ── DE DÓNDE SALE CADA CARA, medido en `S116-B-ASSETS.md` ──────────────
 * **Ninguna es vector, y se dice acá para que nadie lo suponga.** De los
 * 18 «SVG» del catálogo sólo 8 son vectores reales; **gato, perro y conejo
 * son un PNG en base64 envuelto en `<svg>`**, así que su `.svg` pesa más
 * que su `.png` y es el mismo raster. Se ingiere el PNG a 3×.
 *
 * | especie | archivo | vector |
 * |---|---|---|
 * | perro · gato · conejo · roedor | `assets/personajes/*@3x.png` | no |
 * | **ave** | `ave@3x.png` — **llegó el 13-sep**, es la cara sin wordmark | no (su svg es raster envuelto: 0 paths, 2 `<image>`) |
 * | **otro** | la NARIZ (`otro@3x.png`, copia del isotipo) | **sí**, 268 paths |
 *
 * ⚠️ **El ave venía sin cara y por eso la letra §1.10 fue enmendada** para
 * que usara la nariz; **el archivo llegó y esa enmienda queda sin objeto**
 * — pero se conserva escrita, porque describe correctamente qué hacer si
 * mañana falta otra especie.
 *
 * 🔴 **DOS COSAS ABIERTAS, declaradas y no disimuladas:**
 *  1. **`roedor@3x.png` tiene fondo BLANCO OPACO** (medido: 2,9 % de alfa).
 *     Sobre el lienzo rosa se va a ver como un recuadro. **No se le quitó
 *     el fondo**: quitarlo es editar el asset y eso es del founder.
 *     Mitigación de la pieza: su `fondo` default es `blanco`, que lo tapa.
 *  2. **El ave viene de CUERPO ENTERO** —alas y rayitos— mientras las otras
 *     cuatro son *cabezas*. Dentro del mismo círculo su cara ocupa bastante
 *     menos, y **a `fila` (52) queda chica**. Medido con captura en el
 *     lote de assets. La pieza no lo corrige por su cuenta: recortar el
 *     ave sería redibujarlo.
 * ═══════════════════════════════════════════════════════════════════════
 */
export type EspeciePersonaje = 'perro' | 'gato' | 'conejo' | 'ave' | 'roedor' | 'otro'

/** Los tamaños son los de la letra §2 y viven en `medidas`; `grande` es el
 *  del splash y del vacío, que la letra nombra sin número — se deriva del
 *  avatar del hogar ×2, para no teclear uno nuevo. */
export type TamanoPersonaje = 'grande' | 'hogar' | 'selector' | 'fila'

const LADO: Record<TamanoPersonaje, number> = {
  grande:   medidas.avatarHogar * 2,
  hogar:    medidas.avatarHogar,
  selector: medidas.avatarSelector,
  fila:     medidas.avatarFila,
}

/* Un `Record` completo y no un mapa parcial: **una especie nueva en la
   unión que no tenga archivo no compila**, que es la única forma de que no
   aparezca un hueco silencioso el día que entre el cerdo (el catálogo del
   ilustrador ya trae uno — ver `S116-B-ASSETS.md`). */
/* 🔴 **LOS ARCHIVOS NO LLEVAN `@3x`, Y NO ES COSMÉTICO.** Se ingirieron así
   en el lote 1 y **Metro no los resolvió**: *«Unable to resolve
   "../../assets/personajes/perro@3x.png"»*. El sufijo `@nx` **es semántico
   para Metro** —es la densidad de pantalla—, así que busca el archivo BASE
   y toma `@3x` como una de sus variantes. Con sólo la variante y sin base,
   no encuentra nada. *El nombre parecía documentación («esto está a 3×») y
   era una instrucción al bundler.* ⇒ nombre plano; la resolución por
   densidad la maneja Metro si algún día entran las otras dos.

   ⚠️ **El tipo es `ImageSourcePropType`, NO `ReturnType<typeof require>`.**
   El segundo compila en `packages/ui` y **resuelve a `unknown` bajo la
   config de `apps/prestador`**, donde `<Image source>` lo rechaza (TS2769).
   *Lo cazó el gate del hook, que compila las apps; `tsc` sobre el paquete
   solo daba 0 — el consumidor vive en otro tsconfig.* */
const FUENTE: Record<EspeciePersonaje, ImageSourcePropType> = {
  perro:  require('../../assets/personajes/perro.png'),
  gato:   require('../../assets/personajes/gato.png'),
  conejo: require('../../assets/personajes/conejo.png'),
  ave:    require('../../assets/personajes/ave.png'),
  roedor: require('../../assets/personajes/roedor.png'),
  otro:   require('../../assets/personajes/otro.png'),
}

export type PersonajeProps = {
  especie: EspeciePersonaje
  tamano?: TamanoPersonaje
  /** El anillo magenta del selector. Sólo eso: la pieza no navega ni tapea. */
  elegido?: boolean
  /** «Siempre dentro de un círculo blanco o rosa tinte, **nunca sobre
   *  magenta directo**» (punto 12). Por eso el fondo es una unión cerrada
   *  de dos y no un color libre. */
  fondo?: 'blanco' | 'rosa'
}

export function Personaje({ especie, tamano = 'hogar', elegido = false, fondo = 'blanco' }: PersonajeProps) {
  const { theme } = useTheme()
  const lado = LADO[tamano]

  const caja: ViewStyle = {
    width: lado,
    height: lado,
    borderRadius: radius.chipV5,
    backgroundColor: fondo === 'rosa' ? theme.bg.overlay : theme.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    /* El anillo del elegido. **Se dibuja SIEMPRE**, transparente cuando no
       está elegido, para que elegir no mueva el layout — la pieza cambia de
       color, no de tamaño. */
    borderWidth: 2,
    borderColor: elegido ? palette.magentaAccion : 'transparent',
  }

  return (
    <View style={caja}>
      <Image
        source={FUENTE[especie]}
        style={{ width: lado, height: lado }}
        resizeMode="contain"
        /* La ilustración es decorativa: quien la monta dice de quién es.
           Un `alt` acá repetiría el nombre de la mascota que ya está al lado.
           ⚠️ Se usa `accessible={false}` y **no** el par
           `accessibilityElementsHidden`+`importantForAccessibility`: ese par
           compila en `packages/ui` y **rompe el typecheck de
           `apps/prestador`** (TS2769, sin overload). *Lo cazó el gate del
           hook, que compila las apps — `tsc` sobre el paquete solo daba 0.* */
        accessible={false}
      />
    </View>
  )
}

/**
 * **TRÍO** — tres caras lado a lado, apenas superpuestas. Es la composición
 * de las confirmaciones y del «¡Listo!» (punto 11).
 *
 * El solape es una fracción del lado y no un número: si el tamaño cambia,
 * el trío sigue viéndose igual. **Memorial no lo monta** (§4: «sin trío»),
 * y eso lo decide el consumidor — la pieza no conoce el momento vital.
 */
export function TrioPersonajes({
  especies,
  tamano = 'hogar',
}: {
  especies: [EspeciePersonaje, EspeciePersonaje, EspeciePersonaje]
  tamano?: TamanoPersonaje
}) {
  const lado = LADO[tamano]
  const solape = Math.round(lado * 0.22)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {especies.map((e, i) => (
        <Animated.View
          key={`${e}-${i}`}
          /* ══════════════════════════════════════════════════════════
           *  EL FUNDIDO ESCALONADO — S116-B
           *
           * 🔴 Medido: esta pieza tenía **cero movimiento**, y la letra
           * §2 lo pide textual: *«personajes en fundido 500 ms cada 3 s en
           * splash y confirmaciones»*. El trío es justamente la mitad de
           * `Confirmacion`, que sí anima su check — o sea que **el check
           * crecía y los tres personajes aparecían de golpe debajo.**
           *
           * ES `FadeIn` Y NO una entrada con desplazamiento: la letra dice
           * FUNDIDO. *Tres caras que suben desde abajo compiten con el
           * check que crece arriba; un fundido las deja llegar sin pelearle
           * al momento.*
           *
           * EL ESCALONADO usa `stagger.normal` (80) — el token de la casa,
           * no un número. Tres caras a la vez es una imagen; **de a una es
           * que llegaron**.
           *
           * ⚠️ **`FadeIn` de Reanimated respeta `useReducedMotion` SOLO.**
           * No hace falta el hook acá: la librería apaga las entradas
           * declarativas cuando el sistema lo pide. *Se declara para que
           * nadie agregue un guard redundante — y para que, si algún día
           * la librería cambia eso, se sepa dónde mirar.* */
          entering={FadeIn.duration(motion.duration.fast * 2).delay(i * motion.stagger.normal)}
          style={i === 0 ? null : { marginLeft: -solape }}
        >
          <Personaje especie={e} tamano={tamano} />
        </Animated.View>
      ))}
    </View>
  )
}
