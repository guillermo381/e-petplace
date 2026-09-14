import { Pressable, View, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'
import { halo } from '../tokens/elevacion'
import { medidas } from '../tokens/medidas'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **OPCIÓN (S116-B lote 2) — una entre varias, en filas.**
 * Punto 7 del encargo: *«¿Cómo lo pesaste?», «Método de pago»*.
 *
 * **PIEZA NUEVA.** ⚠️ **No reemplaza a `SelectorOpcion`**, y la diferencia
 * no es de estilo: `SelectorOpcion` son **CHIPS** —cuatro disposiciones,
 * todas horizontales, para valores cortos (días, duraciones, tallas)—; esto
 * son **FILAS** con su círculo a la izquierda, para opciones que son una
 * frase y que a veces traen un dato a la derecha. *Meter filas como quinta
 * disposición de los chips habría hecho que una pieza con «tira» y «grilla»
 * también tuviera «lista», que es otra gramática.*
 * Es el mismo criterio con el que `SelectorMotivo` nació aparte en S114.
 *
 * **Selección ÚNICA por construcción:** recibe `elegida` (una clave) y no
 * un array. *Un multi-selección disfrazado de radio miente antes de que lo
 * toquen* — si hace falta elegir varias, es otra pieza.
 *
 * **La fila de agregar se ve distinta y no es una opción**: sin círculo,
 * con el más. La pone la pieza a partir de `agregar`, no el consumidor
 * como un ítem más — *un catálogo no puede traer su propio «Otro»* (el
 * mismo invariante que `R75` exige en `SelectorMotivo`).
 * ═══════════════════════════════════════════════════════════════════════
 */
export type OpcionItem = {
  clave: string
  texto: string
  /** Segunda línea, opcional. */
  apoyo?: string
  /** Un dato a la derecha («Predeterminada»). Texto, no nodo: si fuera
   *  nodo, una pantalla podría meter ahí un botón y la fila tendría dos
   *  acciones — que es justo lo que 19.7 corolario desaconseja. */
  derecha?: string
}

export type OpcionProps = {
  opciones: OpcionItem[]
  elegida?: string
  onElegir: (clave: string) => void
  agregar?: { texto: string; onPress: () => void }
}

function Circulo({ elegida }: { elegida: boolean }) {
  const { theme } = useTheme()
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: radius.chipV5,
        borderWidth: elegida ? 7 : 1.5,
        borderColor: elegida ? palette.magentaAccion : theme.border.campo,
        backgroundColor: theme.bg.card,
      }}
    />
  )
}

export function Opcion({ opciones, elegida, onElegir, agregar }: OpcionProps) {
  return (
    <View style={{ gap: spacing[2] }} accessibilityRole="radiogroup">
      {opciones.map((o) => (
        <Fila key={o.clave} item={o} elegida={o.clave === elegida} onPress={() => onElegir(o.clave)} />
      ))}
      {agregar !== undefined ? <FilaAgregar texto={agregar.texto} onPress={agregar.onPress} /> : null}
    </View>
  )
}

function Fila({ item, elegida, onPress }: { item: OpcionItem; elegida: boolean; onPress: () => void }) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado(0.99)
  const caja: ViewStyle = {
    minHeight: medidas.areaTactil + spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: medidas.filaPadX,
    paddingVertical: medidas.filaPadY,
    borderRadius: radius.listaV5,
    backgroundColor: theme.bg.card,
    /* La elegida cambia ENTERA: borde magenta + halo. El halo es el mismo
       canal que el foco del campo — «acá estás» — y por eso comparte su
       geometría, no un valor nuevo.
       ⚠️ **S116-B lote 5: comparte la GEOMETRÍA y ya no el color.** El
       foco del campo pasó a ciruela y esta opción **se queda en magenta a
       propósito**: elegir una opción ES accionable, y la orden reserva el
       magenta justamente para eso. *Por eso el halo recibe su color en vez
       de traerlo: el mismo canal puede hablar con dos acentos.* */
    borderWidth: elegida ? 1.5 : 1,
    borderColor: elegida ? palette.magentaAccion : theme.border.subtle,
    ...(elegida
      ? { boxShadow: halo.presencia(palette.magentaAccion) }
      : null),
  }
  return (
    <Animated.View style={estiloPresionado}>
      <Pressable
        {...handlers}
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ checked: elegida }}
        accessibilityLabel={item.texto}
        style={caja}
      >
        <Circulo elegida={elegida} />
        <View style={{ flex: 1, gap: spacing[0] }}>
          {/* El texto de la elegida pasa a negrita — el peso marca la
              elección, no sólo el color (N23: «ningún estado solo con
              color», y acá además hay círculo, borde y halo). */}
          <Texto variante={elegida ? 'enfasis' : 'cuerpo'}>{item.texto}</Texto>
          {item.apoyo !== undefined ? <Texto variante="apoyo">{item.apoyo}</Texto> : null}
        </View>
        {item.derecha !== undefined ? <Texto variante="apoyo">{item.derecha}</Texto> : null}
      </Pressable>
    </Animated.View>
  )
}

function FilaAgregar({ texto, onPress }: { texto: string; onPress: () => void }) {
  const { handlers, estiloPresionado } = usePresionado(0.99)
  return (
    <Animated.View style={estiloPresionado}>
      <Pressable
        {...handlers}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={texto}
        style={{
          minHeight: medidas.areaTactil,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          paddingHorizontal: medidas.filaPadX,
          paddingVertical: medidas.filaPadY,
          borderRadius: radius.listaV5,
          /* Sin círculo y sin superficie: **no es una opción**, es una
             acción. Que se vea distinta es el punto. */
          backgroundColor: 'transparent',
        }}
      >
        <Texto variante="enfasis">{`+  ${texto}`}</Texto>
      </Pressable>
    </Animated.View>
  )
}
