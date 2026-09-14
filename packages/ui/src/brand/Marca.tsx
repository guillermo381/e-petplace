import { Image, View, type ImageSourcePropType, useWindowDimensions } from 'react-native'
import { medidas } from '../tokens/medidas'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **ISOTIPO Y LOGO v5 (S116-B lote 2) — la nariz es la marca.**
 * Letra §1.10 · punto 13 del encargo.
 *
 * **PIEZAS NUEVAS, en un archivo propio.** ⚠️ **No reemplazan a `Isotipo`
 * todavía** —la pieza v4, con la rampa de seis colores— y por eso **no le
 * ponen lápida**: tiene **18 consumidores** y su `ISOTIPO_PATH` es la
 * única fuente del `PinEnMapa`. El plan §1 es explícito: una pieza vieja
 * muere **cuando su último consumidor migró**, y esa migración es de C.
 *
 * ── LAS DOS VERSIONES, y cuál va dónde ────────────────────────────────
 * `sobre` declara **el fondo donde se va a parar**, no el color de la
 * pieza: `claro` sobre lienzo/superficie · `oscuro` sobre ciruela/magenta.
 * *Se pide por el FONDO y no por el color a propósito: quien monta sabe
 * dónde lo pone, no qué archivo hace falta.*
 *
 * ✅ **LA PLACA NEGRA SE FUE (S116-B, autorizado por la mesa).** Esta nota
 * decía que la versión `oscuro` traía su rectángulo horneado y que **no se
 * le quitaba porque editar el asset es del founder** — se declaró en el
 * lote 2 en vez de disimularse, y el founder lo vio en el splash y en la
 * propuesta. Hoy está curado, **medido antes y después**:
 * `logo-sobre-oscuro.png` pasó de **99,3 % a 27,3 % de píxeles opacos**;
 * el isotipo, de **91,4 % a 50,4 %**.
 *
 * 🔴 **Y NO ERA UN RECTÁNGULO APARTE, que era la pregunta.** La placa es
 * **el primer subpath del MISMO `<path>` que dibuja la marca** —un
 * rectángulo del tamaño del lienzo, con el dibujo recortado por dentro
 * como máscara—. ⇒ *quitar sólo el rectángulo INVIERTE el relleno y pinta
 * la marca de negro sólido.* Se probaron las dos salidas rasterizadas
 * sobre el degradado y **gana quitar el path entero**: lo que queda debajo
 * es la marca en sus colores, sin marco.
 *
 * ⚠️ **CÓMO SE REGENERARON LOS PNG, porque el camino obvio no funciona y
 * el próximo que los toque va a chocar con lo mismo:** `qlmanage` —el
 * único rasterizador de este entorno— **NO preserva transparencia**:
 * entrega el dibujo aplastado sobre blanco opaco. Un PNG «transparente»
 * hecho así sale **100 % opaco** y el defecto queda igual, con un archivo
 * nuevo que dice lo contrario. El alfa se DERIVA de dos rasterizados (uno
 * sobre negro, otro sobre blanco): `α = 1 − (Cb − Cn)`, exacto, no una
 * estimación por croma. Y **`@2x` y `@1x` se submuestrean del `@3x`**, no
 * se rasterizan aparte — *tres rasterizados independientes no son la misma
 * imagen: el antialiasing cae distinto y las densidades divergen sin que
 * nada avise.*
 * ═══════════════════════════════════════════════════════════════════════
 */
export type SobreFondo = 'claro' | 'oscuro'

const ISOTIPO: Record<SobreFondo, ImageSourcePropType> = {
  claro:  require('../../assets/marca/isotipo.png'),
  oscuro: require('../../assets/marca/isotipo-sobre-oscuro.png'),
}
const LOGO: Record<SobreFondo, ImageSourcePropType> = {
  claro:  require('../../assets/marca/logo.png'),
  oscuro: require('../../assets/marca/logo-sobre-oscuro.png'),
}

/** Qué papel juega la marca en la pantalla:
 *  · `cabecera` — se para en una barra, junto a otra cosa.
 *  · `splash` — acompaña la espera.
 *  · **`protagonista`** — ES la pantalla (00 · splash, 01 · propuesta).
 *
 * 🔴 **LOS DOS GRANDES SON FRACCIÓN DEL ANCHO, NO PX** (ver el bloque de
 * `marcaProtagonistaFraccion` en `medidas`): la orden pide *«cerca de la
 * mitad del ancho del teléfono»*, y eso **no es un tamaño sino una
 * proporción** — un px fijo la cumple en el aparato donde se midió y la
 * incumple en todos los demás.
 *
 * ⏪ **Y ESTE MISMO COMENTARIO DECÍA ALGO QUE EL CÓDIGO NO CUMPLÍA:**
 * *«salen de `medidas`, no de números sueltos»* — y `LogoV5` tenía un
 * **200 escrito a mano** dos funciones más abajo. *Es la clase exacta del
 * comentario de Baloo en `Confirmacion`: un texto que afirma lo correcto
 * refuerza la creencia de que está bien, y el próximo que lo lea tampoco
 * va a ir a mirar.* Hoy es cierto. */
export type TamanoMarca = 'cabecera' | 'splash' | 'protagonista'

/** El ancho de la marca según su papel. **Es una función y no una tabla**
 *  porque dos de los tres salen del ancho de la pantalla, que sólo se sabe
 *  en runtime. */
function anchoDeMarca(tamano: TamanoMarca, anchoPantalla: number): number {
  if (tamano === 'protagonista') return anchoPantalla * medidas.marcaProtagonistaFraccion
  if (tamano === 'splash') return anchoPantalla * medidas.marcaSplashFraccion
  return medidas.marcaCabeceraAncho
}

export function IsotipoV5({ sobre = 'claro', tamano = 'cabecera' }: { sobre?: SobreFondo; tamano?: TamanoMarca }) {
  const { width } = useWindowDimensions()
  /* 🔴 **SE DIMENSIONA POR ANCHO, y es un cambio respecto de cómo nació.**
     Antes fijaba el ALTO (`avatarHogar`, 78) y dejaba que el ancho saliera
     de la proporción — o sea que *«la mitad del ancho»* era inexpresable:
     el alto no sabe nada del ancho de la pantalla. En `cabecera` da lo
     mismo (la proporción es fija), así que el cambio no mueve nada de lo
     que ya estaba montado. */
  const ancho = anchoDeMarca(tamano, width)
  /* `contain` y no `cover`: **un isotipo no se recorta.** La caja la pone
     quien lo monta; la pieza sólo garantiza que entra entero. */
  return (
    <View style={{ width: ancho, aspectRatio: 1365 / 922, justifyContent: 'center' }}>
      <Image source={ISOTIPO[sobre]} style={{ width: '100%', height: '100%' }} resizeMode="contain" accessible={false} />
    </View>
  )
}

export function LogoV5({ sobre = 'claro', tamano = 'cabecera' }: { sobre?: SobreFondo; tamano?: TamanoMarca }) {
  /* El logo lleva el wordmark, así que se dimensiona por ANCHO: el alto lo
     da su proporción. Al revés —fijando el alto— el texto queda ilegible en
     `cabecera` sin que nadie lo note. */
  const { width } = useWindowDimensions()
  const ancho = anchoDeMarca(tamano, width)
  return (
    <View style={{ width: ancho, aspectRatio: 2090 / 1507 }}>
      <Image
        source={LOGO[sobre]}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
        /* El logo SÍ se nombra: es la identidad, y un lector de pantalla que
           no lo dice deja a alguien sin saber en qué app está. */
        accessible
        accessibilityRole="image"
        accessibilityLabel="e-PetPlace"
      />
    </View>
  )
}
