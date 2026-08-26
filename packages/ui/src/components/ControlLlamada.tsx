/**
 * ControlLlamada — el botón circular de la videollamada (S106-B, OBRA 2).
 *
 * **Consume la clase «control sobre video»** (`tokens/sobreVideo.ts`): disco +
 * anillo, los dos canales que se turnan según el video sea claro u oscuro.
 * **Ninguna pantalla se pinta su propio scrim** — si lo hicieran, en dos meses
 * habría dos.
 *
 * ── POR QUÉ LOS GLIFOS VIVEN ACÁ Y NO EN EL REGISTRY DE `Icono` ────────────
 * `Icono` es el set **b′**: objeto en trazo 1.9 + **una huella rellena**
 * (Ley 12). **Acá la Ley 12 no gobierna**, por la misma razón exacta que en la
 * marca de mapa (`DIRECCION_ARTE` §6ter): *«el mapa no es interfaz — es
 * MUNDO… las leyes del ícono gobiernan superficies que la casa pinta, con su
 * fondo, su tema y su contraste bajo control»*. **Un video en vivo no cumple
 * ninguna de esas tres.**
 *
 * ⇒ Estos glifos son **MASA sobre disco**, sin huella — igual que `PinEnMapa`.
 * *Y no es una excepción nueva: es la clase que la casa ya nombró, aplicada a
 * su segundo caso.* Si algún día se quieren en el registry, es otra tanda con
 * su gate por ícono; meterlos hoy los ataría a una ley que no los gobierna.
 *
 * ── 🔴 «GIRAR CÁMARA» ES ACCIÓN, NO INTERRUPTOR (§2 de la dirección) ───────
 * La dirección lo marca en rojo: *«va a ser el botón más usado de esta
 * pantalla — ambas cámaras arrancan frontales y el momento de mostrar al animal
 * llega en toda consulta. Que sea obvio, grande y no se esconda junto al resto
 * del chrome.»* Por eso **no lleva `activo`** (no hay estado que cortar: girar
 * es un acto) y **`SuperficieLlamada` lo exceptúa del ocultado**, junto a
 * colgar.
 *
 * ── EL DESTRUCTIVO ES DISTINTO, Y A PROPÓSITO ──────────────────────────────
 * `colgar` va en **masa plena roja**, no en disco translúcido: es el único
 * control que **jamás se esconde** (OBRA 4) y el único cuyo toque termina algo.
 * *Un botón que corta una consulta médica no puede depender de que el video de
 * atrás sea favorable.*
 *
 * ── ESTADO, NO DECORACIÓN ──────────────────────────────────────────────────
 * `activo={false}` (micrófono cortado, cámara apagada) **invierte**: disco
 * claro con glifo oscuro. *El corte se ve de un vistazo sin leer nada* — y el
 * `accessibilityState.checked` lo dice para quien no lo ve.
 */

import { Pressable } from 'react-native'
import Animated from 'react-native-reanimated'
import Svg, { Line, Path, Rect } from 'react-native-svg'

import { sobreVideo } from '../tokens/sobreVideo'
import { radius } from '../tokens/radius'
import { usePresionado } from './usePresionado'

export type ControlLlamadaGlifo = 'microfono' | 'camara' | 'girarCamara' | 'colgar'

export interface ControlLlamadaProps {
  glifo: ControlLlamadaGlifo
  /** La voz del control — SIEMPRE, es su `accessibilityLabel`. */
  etiqueta: string
  onPress: () => void
  /**
   * Para `microfono` y `camara`: encendido (true) o cortado (false).
   * Cortado INVIERTE el disco. No aplica a `colgar`.
   */
  activo?: boolean
  /** `colgar` es más grande: es el que se busca sin mirar. */
  tamaño?: 'md' | 'lg'
}

const LADO = { md: 52, lg: 60 } as const

/** Los tres glifos, en masa/trazo grueso — se leen a 24 px sobre cualquier fondo. */
function Glifo({ nombre, color, cortado, fondoDelGlifo }: { nombre: ControlLlamadaGlifo; color: string; cortado: boolean; fondoDelGlifo: string }) {
  const t = 2
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {nombre === 'microfono' && (
        <>
          <Rect x="9" y="3" width="6" height="11" rx="3" fill={color} />
          <Path d="M5 11a7 7 0 0 0 14 0" stroke={color} strokeWidth={t} strokeLinecap="round" />
          <Line x1="12" y1="18" x2="12" y2="21" stroke={color} strokeWidth={t} strokeLinecap="round" />
        </>
      )}
      {nombre === 'camara' && (
        <>
          <Rect x="2.5" y="6.5" width="13" height="11" rx="2.5" fill={color} />
          <Path d="M16.5 11l5-3v8l-5-3z" fill={color} />
        </>
      )}
      {nombre === 'girarCamara' && (
        /* Cámara con flecha de vuelta: el gesto de dar vuelta, no un ícono de
           «configurar cámara». La flecha es lo que se lee a 24 px. */
        <>
          <Rect x="3" y="7" width="18" height="12" rx="3" fill={color} opacity={0.9} />
          <Path
            d="M8.5 13.2a3.6 3.6 0 0 1 6.2-2.2M15.5 12.8a3.6 3.6 0 0 1-6.2 2.2"
            stroke={fondoDelGlifo}
            strokeWidth={1.9}
            strokeLinecap="round"
          />
          <Path d="M14.2 9.4l1.2 1.6-2 .3z" fill={fondoDelGlifo} />
          <Path d="M9.8 16.6l-1.2-1.6 2-.3z" fill={fondoDelGlifo} />
        </>
      )}
      {nombre === 'colgar' && (
        /* El teléfono girado: la convención universal de colgar. */
        <Path
          d="M3.5 13.5c5-4.5 12-4.5 17 0l-2.2 2.2a1.6 1.6 0 0 1-2 .2l-1.8-1.2a1.6 1.6 0 0 1-.7-1.3v-1.3a12 12 0 0 0-3.6 0v1.3c0 .5-.3 1-.7 1.3l-1.8 1.2a1.6 1.6 0 0 1-2-.2z"
          fill={color}
        />
      )}
      {/* La barra del corte: un canal más que el color, para quien no lo ve. */}
      {cortado && <Line x1="3.5" y1="20.5" x2="20.5" y2="3.5" stroke={color} strokeWidth={t + 0.4} strokeLinecap="round" />}
    </Svg>
  )
}

export function ControlLlamada({ glifo, etiqueta, onPress, activo = true, tamaño = 'md' }: ControlLlamadaProps) {
  const { handlers, estiloPresionado } = usePresionado()
  const lado = LADO[tamaño]
  const esColgar = glifo === 'colgar'
  /* `girarCamara` no tiene estado encendido/apagado: es una ACCIÓN, no un
     interruptor. Nunca se dibuja cortada. */
  const esAccion = esColgar || glifo === 'girarCamara'
  const cortado = !esAccion && !activo

  // Cortado invierte: el disco se aclara y el glifo se oscurece.
  const fondo = esColgar ? sobreVideo.colgar : cortado ? sobreVideo.contenido : sobreVideo.disco
  const tinta = esColgar ? sobreVideo.colgarContenido : cortado ? 'rgb(5,5,8)' : sobreVideo.contenido

  return (
    <Pressable
      onPress={onPress}
      {...handlers}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      {...(esAccion ? {} : { accessibilityState: { checked: activo } })}
      hitSlop={8}
    >
      {/* `Animated.View` y no `View`: `estiloPresionado` lleva las props de
          transición de Reanimated, que el `ViewStyle` de react-native no tipa
          (precedente `Baldosa`). */}
      <Animated.View
        style={[
          {
            width: lado,
            height: lado,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: fondo,
            /* El anillo NO se pinta sobre masa plena: ahí la separación ya la
               da el color, y un borde claro sobre rojo sería adorno. */
            borderWidth: esColgar || cortado ? 0 : sobreVideo.anilloAncho,
            borderColor: sobreVideo.anillo,
          },
          estiloPresionado,
        ]}
      >
        <Glifo nombre={glifo} color={tinta} cortado={cortado} fondoDelGlifo={fondo} />
      </Animated.View>
    </Pressable>
  )
}
