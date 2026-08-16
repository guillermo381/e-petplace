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
 * ── 🔴 LA VARIANTE `moto` NO ESTÁ ACÁ, Y ES FRENO, NO OLVIDO ────────
 * **Medido: el registry de `Icono` tiene 46 glifos y NINGUNO es moto,
 * repartidor ni entrega.** Dibujar uno acá saltearía §6b —la hoja de
 * contacto: 2-3 variantes, montaje a 21 px y 44 px junto a cinco del
 * registry, y **gate POR ÍCONO del founder**—, que es exactamente el
 * proceso que la casa escribió para que un glifo no nazca en el medio de
 * otra tarea. *La mitad que falta se declara, no se improvisa con lo que
 * había.* La hoja de contacto es el próximo paso y va con su gate.
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

import Svg, { Circle, Path } from 'react-native-svg'

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
  variante?: 'mascota' | 'moto'
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

/** LA MOTO — variante D, «con caja», FIRMADA por el founder (S99-B).
 *  MASA, jamás trazo: a 21 px sobre tiles reales lo único que sobrevive
 *  es el bloque de tinta (`DIRECCION_ARTE` §6ter). La caja de reparto es
 *  lo que la hace decir «reparto» y no «bicicleta» — el riesgo que el
 *  primer gate encontró. */
function GlifoMoto({ lado, color }: { lado: number; color: string }) {
  return (
    <Svg width={lado} height={lado} viewBox="0 0 24 24">
      <Path d="M2.6 5.8h7.2a1.2 1.2 0 0 1 1.2 1.2v4.6H2.6Z" fill={color} />
      <Path
        d="M2.6 12.4h9l3.2-4.2h3.6v2.5h-2.3l-2.7 3.5h3.5c1.9 0 3.5 1.2 4.1 2.9H4.4c-.5-1.6-1.9-2.7-3.6-2.9Z"
        fill={color}
      />
      <Circle cx={5.8} cy={17.6} r={3.4} fill={color} />
      <Circle cx={18.2} cy={17.6} r={3.4} fill={color} />
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

  if (variante === 'moto') {
    return (
      <Animated.View
        pointerEvents="none"
        accessibilityLabel={nombre}
        style={[{ position: 'absolute' }, estilo]}
      >
        {/* SIN ANILLO — la medición está en la cabecera de `ANILLO`: la
            silueta gana 9.85–11.54 contra los tres tonos que el mapa de
            la casa realmente pinta, y el disco blanco es lo que NO se ve
            (1.44–1.68). La sombra del tema queda: separa por profundidad
            sin tapar nada, y es la que le da al glifo el apoyo sobre el
            mapa que el disco daba de más. */}
        <View style={{ boxShadow: theme.elevacion.reposo, borderRadius: radius.full }}>
          <GlifoMoto lado={LADO_CARA} color={theme.text.primary} />
        </View>
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
