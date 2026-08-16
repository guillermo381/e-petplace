/**
 * PinEnMapa — QUIÉN SE ESTÁ MOVIENDO, en el mapa (S99-B · N14).
 *
 * ═══════════════════════════════════════════════════════════════════
 * DE DÓNDE SALE LA FORMA, y no es un pin nuevo: es el punto que la casa
 * YA dibuja, que CRECE para sostener una cara.
 *
 * `MapaRecorrido` en modo vivo marca la última posición con **16 px de
 * relleno + anillo blanco de 2.5** (medido en su cuerpo), y `PinMovible`
 * declara la doctrina con todas las letras:
 *
 *   > *«No se dibuja un pin-gota: el "pin placeholder" murió en S58 y no
 *   > se resucita… el punto ya dice "acá", que es todo lo que tiene que
 *   > decir.»*
 *
 * ⇒ **La identidad no reemplaza al punto: lo habita.** El anillo blanco
 * sobrevive intacto —es lo que separa la marca del mapa, que es una
 * imagen de contraste impredecible— y adentro va la cara en vez del
 * relleno plano. Un pin-gota habría sido un objeto nuevo compitiendo con
 * dos piezas que ya resolvieron el mismo problema.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LA CARA SALE DE LA ESCALERA, NO DE ACÁ (§2.11) ──────────────────
 * Monta `AvatarMascota`, que ya resuelve foto → cara de raza → cara de
 * especie → huella. **Esta pieza no elige qué mostrar: elige DÓNDE.**
 * Sin foto no hay hueco: la huella digna ya es el último peldaño.
 *
 * ── ⏪ ACÁ DECÍA QUE `moto` ERA UN FRENO. Su condición se cumplió, y
 * ── DESPUÉS LA PIEZA FALLÓ SU GATE POR OTRA COSA ────────────────────
 * El freno original (*«el registry no tiene moto; dibujarla acá
 * saltearía §6b»*) se levantó con la firma de la candidata D. **Pero la
 * pieza se rechazó igual, y por un eje distinto** — verbatim del
 * founder: *«se ve como algo puesto encima, no como algo que hace parte
 * del mapa. La diferencia con Rappi es que el mapa y el ícono se
 * INTEGRAN.»*
 *
 * 🔴 **EL DIAGNÓSTICO NO ERA EL DIBUJO: ERA LA GRAMÁTICA.** §6ter ya
 * decía *«el mapa no es interfaz, es MUNDO»* — y esta pieza seguía
 * montando **un glifo de interfaz sobre el mundo**. *Un símbolo plano
 * dentro de un círculo es correcto como ícono, y exactamente por eso se
 * veía pegado.*
 *
 * ⇒ `moto` **se RE-DIBUJÓ como objeto del mundo** (silueta D intacta,
 * tratamiento nuevo) **y nació `destino` con ella**: los dos objetos del
 * par tienen que pertenecer al mismo mundo, así que no se pueden aprobar
 * de a uno. Las cuatro físicas están en `SombraDeSuelo`, `ObjetoMoto` y
 * `ObjetoDestino`, cada una con su porqué.
 *
 * **Registro del eje que repite:** son DOS fallas del mismo ícono —la
 * primera se juzgó en el LUGAR equivocado (lámina vs mapa), la segunda
 * se dibujó con la GRAMÁTICA equivocada (símbolo vs objeto)—. *El brief
 * corregido decía «se dibuja PARA el pin sobre fondo de mapa»: le
 * faltaba la mitad que dice CÓMO.*
 *
 * ── EL MOVIMIENTO: INTERPOLACIÓN, Y POR QUÉ NO SPRING ───────────────
 * Entre dos lecturas de GPS el pin **interpola**, con el bezier de la
 * casa y la duración de ENTRADA (300). N10 lo cierra sin ambigüedad: el
 * bezier es para *«lo que aparece, lo que se va, lo que navega»*; el
 * spring es *«solo gestos de REBOTE, lo que responde al dedo y vuelve»*.
 * **Acá no hay dedo:** el pin se mueve porque llegó un dato. Un rebote
 * diría que el repartidor pasó de largo y volvió, que es literalmente
 * una mentira sobre su posición.
 *
 * ── REDUCE-MOTION: SE VA EL VIAJE, SE QUEDA EL MOMENTO (R41) ────────
 * Con la preferencia activa —o en memorial— el pin **salta** a su nueva
 * posición en vez de recorrerla. Es la receta firmada en S98 aplicada
 * al caso: *reducir movimiento es quitarle el VIAJE, no el momento*. Y
 * acá el momento es «está en otro lado», que se conserva entero.
 * ⚠️ Este viaje **NO es autónomo por gesto del usuario**: nadie lo pidió
 * con el dedo, así que entra bajo la preferencia sin la duda que sí
 * tenía la vuelta del arrastre de `Hoja`.
 */

import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg'

import { AvatarMascota, type AvatarMascotaEspecie } from './AvatarMascota'
import { motion } from '../tokens/motion'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'

/** El anillo que separa la marca del mapa — MISMO valor que el punto
 *  vivo de `MapaRecorrido` (2.5). Si allá cambia, cambia acá: son la
 *  misma marca en dos densidades.
 *
 *  🔴 **RIGE SOLO EN `mascota`, Y LA RAZÓN ESTÁ MEDIDA (S99-B).** El
 *  founder pidió ver la moto sin el disco encima; la mesa aportó que el
 *  anillo *«es lo que separa una silueta oscura del fondo cuando el pin
 *  pasa sobre una calle gris o un parque verde»*. **Se midió, y para
 *  NUESTRO mapa está al revés:**
 *
 *  | contra el tono | silueta tinta | anillo blanco |
 *  |---|---|---|
 *  | asfalto `#DAD7D2` | **11.54** | 1.44 |
 *  | parque `#BFDDB0` | **11.19** | 1.48 |
 *  | agua `#A9CCE8` | **9.85** | 1.68 |
 *
 *  ⇒ **la silueta oscura no desaparece: gana 3× el piso en los tres
 *  tonos. El que desaparece contra los tres es el ANILLO BLANCO.**
 *
 *  Y el cuarto tono —mapa oscuro, donde la tinta cae a 1.56 y el anillo
 *  sí trabaja— **hoy no existe en el producto: medido, CERO
 *  `customMapStyle` en toda la casa; el mapa siempre se pinta claro.**
 *  Era un tono que yo mismo había puesto en la hoja de contacto como
 *  hipótesis, y la hipótesis no estaba en el mapa.
 *
 *  ── POR QUÉ `mascota` SÍ LO CONSERVA, y no es inconsistencia ────────
 *  **El anillo hace falta donde el contenido es INCONTROLABLE.** La cara
 *  de la mascota es una FOTO: puede ser de cualquier color, incluido el
 *  del asfalto. El glifo de la moto lo pintamos nosotros. *La misma
 *  regla —separar la marca del mapa— da resultados distintos según
 *  quién elige el color, y eso es la regla aplicada, no una excepción.*
 *
 *  ☠️ **CONDICIÓN DE REVIVIR, escrita para que no sea un riesgo mudo:**
 *  el día que un mapa de la casa se pinte oscuro (`customMapStyle`), la
 *  tinta cae a **1.56** y la moto necesita seguir al tema del mapa
 *  —papel sobre oscuro da **10.10**— o recuperar su separación. */
const ANILLO = 2.5
/** El lado del pin. `sm` (40) + anillo: sostiene una cara reconocible
 *  sin tapar la calle de abajo. Un `md` (64) sobre un mapa de teléfono
 *  come el contexto que el mapa existe para dar. */
const LADO_CARA = 40
/** El lado de los objetos del mundo (moto · destino). Mismo blanco que
 *  la cara, para que el par no compita en tamaño con el pin de paseo. */
const LADO_OBJETO = 44

export interface PinEnMapaProps {
  /** ⏪ ACÁ DECÍA «NO HAY PROP `variante`, Y ES DECISIÓN» — el freno
   *  cumplió su condición y se levanta solo, como estaba escrito: *«cuando
   *  `moto` pase su gate por ícono, entra como prop y la pieza no cambia
   *  de forma»*. **Firma del founder: la D, con caja.** La pieza no cambió
   *  de forma: eso es lo que el freno compraba.
   *
   *  🔴 **Y LA MOTO NO ENTRA AL REGISTRY DE `Icono`, a propósito.** Lo
   *  dice la letra que esta misma sesión depositó (`DIRECCION_ARTE`
   *  §6ter): **el mapa no es interfaz, es MUNDO** — la marca de mapa es
   *  clase aparte, su física es MASA y no trazo, y la Ley 12 (objeto en
   *  trazo 1.9 + huella) simplemente no la gobierna. Meterla en `Icono`
   *  la pondría bajo R30 como glifo de interfaz e invitaría a montarla a
   *  21 px en una fila junto a una huella — exactamente la confusión que
   *  §6ter existe para impedir. **Vive acá, con su clase.** */
  variante?: 'mascota' | 'moto' | 'destino'
  nombre: string
  fotoUrl?: string | number | null
  especie?: AvatarMascotaEspecie
  /** El desplazamiento en píxeles respecto del centro del contenedor.
   *  Quien monta el pin traduce lat/lng → píxeles (el mapa sabe hacerlo;
   *  la pieza no tiene por qué saber de proyecciones). **La pieza anima
   *  el viaje; el mapa dice adónde.** */
  x: number
  y: number
}

/** LA SOMBRA EN EL SUELO — la física más barata y la que más trabaja
 *  (§6ter): *«una mancha suave debajo dice: esto está parado ahí. Sin
 *  ella, cualquier objeto flota.»*
 *
 *  Elipse (no círculo) porque el suelo se ve en escorzo, y con
 *  `RadialGradient` porque **una sombra de borde duro es un objeto
 *  más**: lo que la vuelve sombra es que se DESVANECE. Va a `.28` de
 *  negro traslúcido — deja pasar el tile, y por eso el objeto parece
 *  apoyado EN el mapa en vez de pegado ENCIMA. */
function SombraDeSuelo({ id, cx, cy, rx }: { id: string; cx: number; cy: number; rx: number }) {
  return (
    <>
      <Defs>
        <RadialGradient id={id}>
          <Stop offset="0%" stopColor={palette.mapaSombra} stopOpacity={1} />
          <Stop offset="70%" stopColor={palette.mapaSombra} stopOpacity={0.55} />
          <Stop offset="100%" stopColor={palette.mapaSombra} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.34} fill={`url(#${id})`} />
    </>
  )
}

/** LA MOTO — silueta D FIRMADA, con el TRATAMIENTO del mundo.
 *
 *  ⏪ 🔴 **CORRECCIÓN DE UN ERROR MÍO, y es de sobre-corrección.** El
 *  founder devolvió: *«el pin NO PARECE UNA MOTO: se ve la caja y una
 *  línea»*. Al buscar la causa releí la firma y decía, literal:
 *  ***«la candidata D queda FIRMADA como silueta ganadora; su TRATAMIENTO
 *  cambia»***.
 *
 *  **Yo cambié la SILUETA.** Reproyecté el dibujo a tres cuartos para
 *  cumplir «perspectiva compartida» y en el camino **destruí lo único
 *  que ya estaba firmado**: el perfil que se reconocía. *La física del
 *  mundo se logró y la legibilidad del objeto se perdió — y un objeto
 *  integrado que no se reconoce sigue sin servir.*
 *
 *  ⇒ **Vuelve la silueta D, verbatim**, y encima **solo el tratamiento**:
 *  sombra en el suelo · color del terreno · sin anillo. La perspectiva se
 *  paga con **el gesto más barato que no toca la silueta** —las ruedas
 *  apoyadas en una elipse de sombra, no reproyectadas— porque *la
 *  perspectiva es una de las cuatro físicas y la legibilidad es la
 *  condición de todas.*
 *
 *  **La vara que deja, firmada por la mesa:** *se mide que SE APOYE y se
 *  mide que SE RECONOZCA — son DOS pruebas, no una.* Esta pieza pasó la
 *  primera y falló la segunda; el arreglo no puede volver a cambiarlas
 *  de lugar. */
function ObjetoMoto({ lado }: { lado: number }) {
  return (
    <Svg width={lado} height={lado} viewBox="0 0 24 24">
      {/* La sombra TOCA la base de las ruedas (cy 17.6 + r 3.4 = 21).
          ⏪ Antes flotaba 2 px por debajo y eso basta para que el objeto
          se despegue: una sombra separada de su objeto no lo apoya, lo
          acompaña. */}
      <SombraDeSuelo id="sombraMoto" cx={12} cy={21} rx={9.5} />
      {/* SILUETA D, VERBATIM de la candidata firmada — la caja de reparto
          es lo que la hace decir «reparto» y no «bicicleta». */}
      <Path d="M2.6 5.8h7.2a1.2 1.2 0 0 1 1.2 1.2v4.6H2.6Z" fill={palette.mapaMoto} />
      <Path
        d="M2.6 12.4h9l3.2-4.2h3.6v2.5h-2.3l-2.7 3.5h3.5c1.9 0 3.5 1.2 4.1 2.9H4.4c-.5-1.6-1.9-2.7-3.6-2.9Z"
        fill={palette.mapaMoto}
      />
      <Circle cx={5.8} cy={17.6} r={3.4} fill={palette.mapaMoto} />
      <Circle cx={18.2} cy={17.6} r={3.4} fill={palette.mapaMoto} />
    </Svg>
  )
}

/** EL DESTINO — **un EDIFICIO, no un marcador** (§6ter, literal: *«la
 *  casita es un objeto del mundo, no un pin señalando un lugar»*).
 *
 *  Nace con la moto porque **el juicio es la comparación**: dos objetos
 *  que tienen que pertenecer al mismo mundo no se pueden aprobar de a
 *  uno.
 *
 *  **Es NEUTRO, y es decisión:** un edificio de marca volvería a ser un
 *  marcador con forma de casa. Sus dos tonos son del terreno (sat ~0.10)
 *  y su volumen sale del par —1.73 entre cuerpo y techo—, no de un
 *  contorno.
 *  **Lo único de marca es la PUERTA**, en `mapaMoto`: dice *este es el
 *  tuyo* sin convertir la casa en un logo, **y ata visualmente los dos
 *  objetos del par** — el que va y el lugar al que va. */
function ObjetoDestino({ lado }: { lado: number }) {
  return (
    <Svg width={lado} height={lado} viewBox="0 0 32 32">
      {/* ⏪ 🔴 *«la casita NO ESTÁ PEGADA AL MAPA, parece que flota»*.
          Medido: la base del edificio termina en y≈23.7 y la sombra
          estaba centrada en 26.5 — **casi 3 px de aire entre el objeto y
          su sombra**, que es exactamente lo que hace flotar a algo. La
          sombra ahora se solapa con la base: **una sombra que no toca no
          apoya.** */}
      <SombraDeSuelo id="sombraDestino" cx={16} cy={23.2} rx={9.5} />
      {/* techo en tres cuartos: dos aguas, la cumbrera corrida a la
          derecha — el mismo ángulo que la caja de la moto */}
      <Path d="M16 5.4l9.6 6.2-4.3 2.1L16 9.9Z" fill={palette.mapaEdificioTecho} />
      <Path d="M16 5.4L6.4 11.6l4.3 2.1L16 9.9Z" fill={palette.mapaEdificioTecho} opacity={0.78} />
      {/* las dos caras del cuerpo: la que mira y la que se va */}
      <Path d="M10.7 13.7L16 9.9v11.9l-5.3 2.4Z" fill={palette.mapaEdificio} />
      <Path d="M21.3 13.7L16 9.9v11.9l5.3 2.4Z" fill={palette.mapaEdificio} opacity={0.74} />
      {/* la puerta — lo único de marca */}
      <Path d="M13.2 17.9l2.2-1.1v5.1l-2.2 1Z" fill={palette.mapaMoto} />
    </Svg>
  )
}

export function PinEnMapa({ variante = 'mascota', nombre, fotoUrl, especie, x, y }: PinEnMapaProps) {
  const { theme } = useTheme()
  /** El hook se llama SUELTO y se combina después — `memorial || hook()`
   *  es una llamada CONDICIONAL a un hook (la lección de forma de S98-B,
   *  escrita por haberla desobedecido). */
  const reducido = useReducedMotion()
  const sinViaje = theme.mode === 'memorial' || reducido

  const px = useSharedValue(x)
  const py = useSharedValue(y)

  useEffect(() => {
    if (sinViaje) {
      px.value = x
      py.value = y
      return
    }
    /** ⚠️ EL BEZIER DE LA CASA VIVE EN `motion.marca.aperturaBezier`, y
     *  el nombre esconde la ley: N10 lo llama *«el bezier de la casa»*
     *  para TODA entrada y transición, pero el token está archivado bajo
     *  *marca*. Se consume desde ahí —es el valor correcto, medido— y se
     *  sirve la observación en el parte: una pieza que escribe una
     *  entrada no debería tener que entrar a `marca` para encontrar la
     *  curva general. Renombrarlo toca consumidores y es de mesa. */
    const conf = {
      duration: motion.duration.estandar, // 300 — el registro «estándar» de N10
      easing: Easing.bezier(...motion.marca.aperturaBezier),
    }
    px.value = withTiming(x, conf)
    py.value = withTiming(y, conf)
  }, [x, y, sinViaje, px, py])

  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateX: px.value }, { translateY: py.value }],
  }))

  if (variante === 'moto' || variante === 'destino') {
    return (
      <Animated.View
        pointerEvents="none"
        accessibilityLabel={nombre}
        style={[{ position: 'absolute' }, estilo]}
      >
        {/* ⛔ NI ANILLO NI `boxShadow`, y las dos ausencias son la pieza:
            el anillo lo volvía sticker (medido) y un `boxShadow` es
            sombra de TARJETA —cae detrás del rectángulo del contenedor—
            mientras que un objeto del mundo proyecta sobre el SUELO, en
            elipse y debajo. La sombra vive DENTRO del SVG. */}
        {variante === 'moto' ? <ObjetoMoto lado={LADO_OBJETO} /> : <ObjetoDestino lado={LADO_OBJETO} />}
      </Animated.View>
    )
  }

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, estilo]}>
      <View
        style={{
          padding: ANILLO,
          backgroundColor: palette.white,
          borderRadius: radius.full,
          /** La sombra sale del TEMA (Ley 20 · R4). Escribí un `boxShadow`
           *  a mano y el lint lo cazó en la primera corrida — con razón:
           *  «sombras artesanales fuera de estos tokens: PROHIBIDAS», en
           *  el header del propio token. `reposo` es el nivel correcto:
           *  el pin se apoya sobre el mapa, no flota sobre la pantalla. */
          boxShadow: theme.elevacion.reposo,
        }}
      >
        <AvatarMascota
          nombre={nombre}
          fotoUrl={fotoUrl ?? undefined}
          especie={especie}
          tamano="sm"
          capa="cuidado"
        />
      </View>
    </Animated.View>
  )
}

/** El lado total que ocupa el pin — quien lo monta necesita el número
 *  para centrarlo sobre su coordenada en vez de estimarlo a ojo (mismo
 *  criterio que `ALTO_PIE_CAMPO` y `PATA`/`MONTA`). */
export const LADO_PIN = LADO_CARA + ANILLO * 2
