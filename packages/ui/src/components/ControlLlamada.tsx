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
 * ── ⚠️ `altavoz`: LA ASIMETRÍA DE PLATAFORMA, para quien lo cablee ────────
 * El control es UNO, pero **abajo no lo es** — leído del SDK
 * (`AudioSession.d.ts`), y por eso se declara acá:
 * · **Android** devuelve la lista real: `speaker · earpiece · headset ·
 *   bluetooth`.
 * · **iOS** solo da `default` y `force_speaker`, *«due to OS limitations»*;
 *   para elegir auriculares o bluetooth ofrece su propio `showAudioRoutePicker`.
 *
 * ⇒ **El toggle binario altavoz↔auricular funciona en las dos**, con distinta
 * implementación debajo. *Lo que NO se puede es ofrecer una lista de salidas
 * igual en ambas — quien lo intente va a encontrar que en iOS no existe.*
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

export type ControlLlamadaGlifo = 'microfono' | 'camara' | 'girarCamara' | 'altavoz' | 'colgar'

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

/* 🔴 `md` BAJÓ DE 52 A 48 (S106-B, y es consecuencia medida de que el toggle de
   altavoz pase a dibujarse SIEMPRE).

   Con cinco controles permanentes: `4×md + lg + 4×gap`. A 52 la fila mide
   **316 px y deja 2 px por lado en un teléfono de 320** — o sea, sin aire.
   A 48 mide **300** y deja **10 px por lado en 320 · 30 en 360**.

   ⚠️ **48 es el piso: NO se puede bajar más.** El mínimo de target táctil es
   **44**, así que quedan 4 px de margen. *Si algún día hace falta más espacio,
   la salida NO es achicar el disco —se rompe el target— sino decidir qué sale
   de la barra.*

   **El techo, con el número:** un SEXTO control llevaría la fila a
   `5×48 + 60 + 5×12 = 360` ⇒ **no entra ni en 360**. */
const LADO = { md: 48, lg: 60 } as const

/** Los tres glifos, en masa/trazo grueso — se leen a 24 px sobre cualquier fondo. */
function Glifo({ nombre, color, cortado }: { nombre: ControlLlamadaGlifo; color: string; cortado: boolean }) {
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
        /* 🔴 LA VUELTA SOLA — **cero cámara en el dibujo, y ésa es la cura.**
           (Firma de la mesa, 27-ago, sobre medición.)

           ═══ POR QUÉ ESTE GLIFO SE RE-DIBUJÓ DOS VECES ═══════════════════
           El founder reportó **cuatro controles donde hay cinco**, dos veces:
           primero *«uno en el centro que no hace nada literalmente»*, después
           nombrando cuatro y no mencionando éste. Se descartaron, con
           medición, CINCO explicaciones: la voz no resuelta, la prop no
           pasada, el símbolo ausente del bundle, el ancho que recorta, y el
           SVG inválido. **Las cinco daban verde y el ojo seguía diciendo
           cuatro.**

           ── LA MEDICIÓN QUE LO RESOLVIÓ, y no miraba el glifo ─────────────
           Renderizada la fila entera y recortado cada disco: **los cinco
           pintan**, y éste era **el MÁS entintado** (689 px claros contra 632
           de `camara`, 396 del micrófono, 306 del altavoz). No faltaba: se
           dibujaba de más.

           Lo que faltaba era **distinguirse**. Solape de tinta (IoU) del
           dibujo anterior contra el glifo de `camara`, que vive **en el disco
           de al lado**: **0,647** — dos tercios de su tinta eran la misma
           tinta. Los dos eran un cuerpo de cámara con el triángulo del lente;
           lo único que los separaba era una flecha de 2 px arriba, *que a
           21 px es exactamente lo que la Ley 9 llama ruido*.

           🔴 **LA LEY QUE SALE DE ACÁ, y vale para todo el registry:** *un
           glifo que colisiona con su vecino no es un glifo feo — es un CONTROL
           QUE DESAPARECE.* El usuario no cuenta discos: **nombra funciones**, y
           dos controles que dicen «cámara» son una función, no dos.

           ── POR QUÉ **la vuelta sola** y no una cámara mejor dibujada ──────
           Medidos tres candidatos contra `camara`: la vuelta sola **0,110** ·
           la cámara-que-gira 0,300 · las dos caras 0,212. Gana la que **no
           dibuja cámara en absoluto** — y de las tres es la única que sigue
           legible a 21 px. Es además la convención universal de *flip*.
           *El objeto de este control no es la cámara: es LA VUELTA.*

           ⚠️ **Lo que la medición NO prueba, declarado:** corrió en
           react-native-web. Prueba árbol, ancho y silueta; **no prueba el
           render nativo**. La colisión de silueta sí vale en los dos, porque
           es del path y no del backend de dibujo. */
        <>
          {/* Las dos mitades de la vuelta, cada una con su punta. Trazo
              +0,4 sobre el resto: sin masa que lo sostenga, el arco necesita
              cuerpo propio para no adelgazarse contra el video. */}
          <Path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5" stroke={color} strokeWidth={t + 0.4} strokeLinecap="round" />
          <Path d="M19.5 12a7.5 7.5 0 0 1-12.6 5.5" stroke={color} strokeWidth={t + 0.4} strokeLinecap="round" />
          <Path d="M17.6 2.4l1.2 4.6-4.6 1.2z" fill={color} />
          <Path d="M6.4 21.6l-1.2-4.6 4.6-1.2z" fill={color} />
        </>
      )}
      {nombre === 'altavoz' && (
        /* Cono + dos ondas. **Anatomía probada** (S106-B, gate): todo en
           `color`, sin `opacity` y sin recortes con el color del fondo — que
           fue lo único que distinguía al glifo que salió en blanco. */
        <>
          <Path d="M4 9.5h3.2L11.5 6v12L7.2 14.5H4z" fill={color} />
          <Path d="M15 9.8a3.4 3.4 0 0 1 0 4.4" stroke={color} strokeWidth={t} strokeLinecap="round" />
          <Path d="M17.8 7.6a6.8 6.8 0 0 1 0 8.8" stroke={color} strokeWidth={t} strokeLinecap="round" />
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
        <Glifo nombre={glifo} color={tinta} cortado={cortado} />
      </Animated.View>
    </Pressable>
  )
}
