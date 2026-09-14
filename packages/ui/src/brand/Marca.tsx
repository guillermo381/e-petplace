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
 *
 * ── 🔴 S116-B lote 5 · LA VERSIÓN CLARA TAMBIÉN LO TENÍA, Y SU FONDO SÍ
 *    ERA UNA FORMA APARTE (al revés que la oscura) ──────────────────────
 * Orden de la mesa: *«logo.png (la versión clara) tiene fondo blanco
 * horneado: misma cura que le hiciste al isotipo»*. **Medido antes:
 * alfa mínimo 247 sobre 255 en toda la imagen** —o sea opaca entera— y la
 * esquina en blanco pleno. **Después: 55 % transparente, 35 % opaco.**
 *
 * ⚠️ **Y acá la cura del isotipo NO ALCANZABA, que es el hallazgo:** los
 * dos rasterizados veían el blanco igual, así que el despeje daba α = 1 y
 * **devolvía exactamente lo que entró**. *Un resultado idéntico al
 * original es el síntoma, y se lee como «ya estaba bien».* El blanco
 * resultó ser un `<path fill="#ffffff">` propio —un rectángulo de
 * 1255×903 sobre un lienzo de 1254×1254— **y por eso la respuesta a la
 * pregunta de la mesa es distinta en cada logo: en el oscuro NO era una
 * forma aparte y en el claro SÍ.**
 *
 * ⚠️ **LO QUE QUEDA Y NO SE DISIMULA:** el trazo del marco del SVG
 * sobrevive en el borde, con **alfa ~100/255 en las esquinas**. Sobre
 * lienzo es blanco sobre casi-blanco y no se ve (montado y mirado:
 * `docs/loop/capturas-s116-b/logo-claro-alfa.png`); **sobre ciruela SÍ se
 * ve como un rectángulo tenue** — y no llega a ninguna pantalla porque
 * `sobre="claro"` es, por contrato, sólo para lienzo y superficie. *No se
 * quita porque su trazo es el MISMO path que contornea la marca entera:
 * sacarlo se lleva el contorno del logo.*
 *
 * El camino quedó como script —`scripts/curar-alfa-horneado.py`— porque
 * ésta fue la segunda vez: *derivar la fórmula de nuevo cada vez es la
 * misma deuda que un número tecleado dos veces.*
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
 *  · **`protagonista`** — el ISOTIPO es la pantalla (00 · splash).
 *  · **`portada`** — el LOGO preside (01 · propuesta, 03 · acceso,
 *    05 · crear cuenta). Más chico que `protagonista` **porque lleva el
 *    wordmark**: al mismo ancho, su nariz se vería la mitad.
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
export type TamanoMarca = 'cabecera' | 'splash' | 'protagonista' | 'portada'

/** El ancho de la marca según su papel. **Es una función y no una tabla**
 *  porque dos de los tres salen del ancho de la pantalla, que sólo se sabe
 *  en runtime. */
function anchoDeMarca(tamano: TamanoMarca, anchoPantalla: number): number {
  if (tamano === 'protagonista') return anchoPantalla * medidas.marcaProtagonistaFraccion
  /* `portada` es el del LOGO en 01 · 03 · 05. Ver su token: es más chico
     que `protagonista` porque el wordmark se lleva parte del ancho. */
  if (tamano === 'portada') return anchoPantalla * medidas.marcaPortadaFraccion
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
