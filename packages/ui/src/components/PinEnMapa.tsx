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

import { AvatarMascota, type AvatarMascotaEspecie } from './AvatarMascota'
import { motion } from '../tokens/motion'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'

/** El anillo que separa la marca del mapa — MISMO valor que el punto
 *  vivo de `MapaRecorrido` (2.5). Si allá cambia, cambia acá: son la
 *  misma marca en dos densidades. */
const ANILLO = 2.5
/** El lado del pin. `sm` (40) + anillo: sostiene una cara reconocible
 *  sin tapar la calle de abajo. Un `md` (64) sobre un mapa de teléfono
 *  come el contexto que el mapa existe para dar. */
const LADO_CARA = 40

export interface PinEnMapaProps {
  /* ⚠️ NO HAY PROP `variante`, Y ES DECISIÓN: hoy existe UNA sola
     (mascota) y una prop de un solo valor no discrimina nada — es
     decorado que promete una capacidad que no está (la clase D-574 que
     esta casa persigue). Cuando `moto` pase su gate por ícono, entra
     como prop y la pieza no cambia de forma: esa es la razón de que
     esté escrito acá y no descubrirlo entonces. */
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

export function PinEnMapa({ nombre, fotoUrl, especie, x, y }: PinEnMapaProps) {
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
