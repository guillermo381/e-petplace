/**
 * FilaMascotas — EL CARRUSEL DE LA CASA, en el techo del Hogar.
 *
 * Avatares circulares con aro; **el elegido lleva el aro de marca**; el «+»
 * cierra la fila. Debajo, **la línea de estado de la elegida** — una, no una
 * por mascota.
 *
 * ── LO QUE ESTA PIEZA CAMBIA, Y SE DECLARA PORQUE ES UN CAMBIO DE MODELO ─
 * Lo que había en el techo del Hogar era una **tira informativa**: cada
 * mascota con su nombre, su punto de estado y su propia línea de próxima
 * vacuna debajo. Ocho mascotas eran ocho líneas de estado compitiendo.
 * *Una tira donde todo habla no tiene foco: es un tablero de faltantes con
 * forma de fila de caras.*
 *
 * Esto es un **selector**: una elegida por vez, y la línea de estado es la
 * suya. 🔴 **La consecuencia hay que decirla: el estado de las demás deja de
 * verse sin tocarlas.** Ése es exactamente el intercambio —foco a cambio de
 * simultaneidad— y quien monte tiene que saber que lo está haciendo.
 *
 * ── EL ARO ES EL ESTADO, Y POR ESO SIEMPRE ESTÁ ───────────────────────
 * Todos los retratos llevan aro; lo que cambia es **de qué color**. *Un aro
 * que aparece sólo en el elegido mueve a los vecinos 6 px cada vez que se
 * elige otro* — la fila entera tiembla, y el temblor se lee como un defecto
 * aunque sea la respuesta al toque.
 *
 * ── EL COLOR SALE DE `accent.sobreGradiente`, Y ES UN SLOT NUEVO ───────
 * No de `accent.active`. **Medido:** `active` vale `magentaAccion` en claro
 * y `tintaV5` en memorial, y **los dos desaparecen sobre la banda**, que
 * desde el lote 3b es ciruela oscura en los tres temas. El slot nuevo da
 * `magentaLuz` (5,78:1 sobre ciruela) y blanco en memorial.
 *
 * ── LA LÍNEA DE ESTADO NO SE CALCULA ACÁ ──────────────────────────────
 * Llega resuelta, y `null` significa **que no hay nada que decir** — no se
 * dibuja. *Un «sin datos» bajo el carrusel es la misma trampa que la tira
 * vieja tenía por mascota, concentrada en un renglón.* La voz sale de
 * `calcularVozHogar` sobre el expediente real (L-139), que vive en
 * `@epetplace/domain` y no acá.
 */

import { Pressable, ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { RetratoCircular } from './retrato-mascota'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'

/** El diámetro de la foto. **72 y no 112**: la tira vieja necesitaba 112
 *  porque cada retrato cargaba nombre + punto + línea de vencimiento; acá
 *  el peso informativo bajó a la línea de abajo, y con 112 la fila
 *  empujaba el saludo fuera de la banda en pantallas de 360. */
const RETRATO = 72
const ARO = 3
/** El «+» es del alto del retrato SIN aro: es un control, no una mascota,
 *  y darle el mismo lado total lo pondría a competir. */
const MAS = RETRATO

export interface MascotaDeFila {
  id: string
  nombre: string
  fotoUrl?: string
  /** Quien ya no está. **No cambia la forma, cambia el aro**: sigue
   *  eligiéndose y sigue teniendo su expediente — *sacarla de la fila sería
   *  decir que dejó de ser de la familia.* Lo que no lleva es el aro de
   *  marca cuando está elegida: va en la tinta de la banda. */
  enMemoria?: boolean
}

export interface FilaMascotasProps {
  mascotas: MascotaDeFila[]
  /** El id de la elegida. **Obligatorio**: no hay estado «ninguna» — con
   *  mascotas en la casa siempre hay una mirándose, y un carrusel sin
   *  elegida deja la línea de abajo sin sujeto. */
  elegida: string
  onElegir: (id: string) => void
  /** La línea de estado de la elegida, ya resuelta. `null` = no se dibuja. */
  linea?: string | null
  /** El «+» del final. Ausente = no se dibuja (hay casas donde agregar no
   *  está a mano, y una pieza no decide eso). */
  agregar?: { onPress: () => void; etiqueta: string }
}

function Retrato({
  mascota,
  elegida,
  onElegir,
}: {
  mascota: MascotaDeFila
  elegida: boolean
  onElegir: () => void
}) {
  const { theme } = useTheme()
  const presion = usePresionado()
  const enMemoria = mascota.enMemoria === true
  /* El aro elegido: marca sobre la banda, salvo en memorial —donde la
     mascota YA no está y el color de marca no corresponde—, que va en la
     tinta de la banda. El no elegido es esa misma tinta apenas insinuada:
     presente para que la fila no tiemble, callado para que no compita. */
  const aro = elegida
    ? enMemoria
      ? theme.text.onGradient
      : theme.accent.sobreGradiente
    : theme.bg.sobreGradiente

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: elegida }}
      accessibilityLabel={mascota.nombre}
      onPress={onElegir}
      style={{ alignItems: 'center', gap: spacing[2], width: RETRATO + ARO * 2 }}
      {...presion.handlers}
    >
      <Animated.View style={presion.estiloPresionado}>
        <RetratoCircular
          diametro={RETRATO}
          grosorAro={ARO}
          aro={aro}
          fondo={theme.bg.sobreGradiente}
          tinta={theme.text.onGradient}
          fotoUrl={mascota.fotoUrl}
        />
      </Animated.View>
      {/* El nombre **no se acentúa al elegir**: lo que dice cuál es el
          elegido es el aro, y decirlo dos veces le quita fuerza al aro.
          Lo que sí cambia es el PESO —la elegida en `enfasis`, las demás en
          `apoyo`—, que es jerarquía y no un segundo indicador de color. */}
      <Texto
        variante={elegida ? 'enfasis' : 'apoyo'}
        color="sobreGradiente"
        centrado
        numberOfLines={1}
      >
        {mascota.nombre}
      </Texto>
    </Pressable>
  )
}

export function FilaMascotas({ mascotas, elegida, onElegir, linea, agregar }: FilaMascotasProps) {
  const { theme } = useTheme()
  const presionMas = usePresionado()

  return (
    <View style={{ gap: spacing[3] }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="radiogroup"
        contentContainerStyle={{ gap: spacing[4], alignItems: 'flex-start' }}
      >
        {mascotas.map((m) => (
          <Retrato key={m.id} mascota={m} elegida={m.id === elegida} onElegir={() => onElegir(m.id)} />
        ))}
        {agregar !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={agregar.etiqueta}
            onPress={agregar.onPress}
            {...presionMas.handlers}
          >
            <Animated.View
              style={[
                presionMas.estiloPresionado,
                {
                  width: MAS,
                  height: MAS,
                  borderRadius: radius.full,
                  backgroundColor: theme.bg.sobreGradiente,
                  alignItems: 'center',
                  justifyContent: 'center',
                  /* Centrado contra el RETRATO, no contra la columna: la
                     columna incluye el nombre de abajo, y alinear con ella
                     dejaría el «+» flotando a media altura. */
                  marginTop: ARO,
                },
              ]}
            >
              <Svg width={28} height={28} viewBox="0 0 24 24">
                <Path
                  d="M12 5v14M5 12h14"
                  stroke={theme.text.onGradient}
                  strokeWidth={1.9}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </Animated.View>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* 🔴 **`aria-live` de hecho, sin serlo**: la línea cambia al elegir y
          un lector de pantalla que no la relea deja a quien no ve sin saber
          que cambió. Va con `accessibilityLiveRegion="polite"`, que es lo
          que RN expone en Android. */}
      {linea !== null && linea !== undefined && linea !== '' ? (
        <View accessibilityLiveRegion="polite">
          <Texto variante="apoyo" color="sobreGradiente">
            {linea}
          </Texto>
        </View>
      ) : null}
    </View>
  )
}
