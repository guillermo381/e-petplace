import { type ReactNode } from 'react'
import { Pressable, View, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BarraPasos } from './BarraPasos'
import { Chevron } from './chevron'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'
import { palette } from '../tokens/palette'
import { medidas } from '../tokens/medidas'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **CABECERA (S116-B lote 2) — la banda ciruela de la casa.**
 * Letra §2 (medidas y degradado) · punto 1 del encargo.
 *
 * **PIEZA NUEVA con nombre propio.** ⚠️ **NO reemplaza a `Encabezado`
 * todavía**, y eso es deliberado: `Encabezado` tiene **173 consumidores**
 * en las dos apps, y el plan §1 dice que una pieza vieja muere *cuando su
 * último consumidor migró*. Los consumidores los migra **C, en el lote 3**.
 * Hasta entonces las dos conviven y `Encabezado` **no lleva lápida**:
 * *poner la lápida hoy marcaría como muerta una pieza que el prestador va
 * a seguir montando después de esta letra* (§5).
 *
 * ── LO QUE HACE, y lo que decide quien la monta ────────────────────────
 * **Llega hasta arriba de todo**: la banda pinta bajo la barra de estado y
 * el contenido baja por el inset. Es el patrón que `HeroMarca` ya fijó en
 * S59 — *la safe area la absorbe la PRIMITIVA*, y por eso ninguna pantalla
 * vuelve a sumar `insets.top` por fuera.
 *
 * 🔴 **NO se achica ni se mueve al scrollear** (textual del encargo). Por
 * eso no recibe ningún valor animado ni scroll: **si mañana alguien quiere
 * una cabecera colapsable, es otra pieza** — hacerla configurable acá
 * volvería opcional lo que el encargo fijó.
 *
 * **La curva inferior y su sombra** son de la pieza. La sombra es *apenas
 * perceptible*: despega la banda del lienzo, no la levanta.
 * ═══════════════════════════════════════════════════════════════════════
 */
export type CabeceraProps = {
  variante: 'raiz' | 'empujada'
  /** Mayúsculas chiquitas en rosa sobre ciruela: la fecha, el barrio,
   *  «ACTIVIDAD». La pieza **no** lo pone en mayúsculas: el token
   *  `antetitulo` ya trae `textTransform` (letra §2). */
  antetitulo?: string
  titulo: string
  /** Una línea de apoyo. En raíz va en blanco al 70 %; en empujada es el
   *  subtítulo. */
  apoyo?: string
  /** UN botón redondo translúcido (raíz: la campana, el avatar) o una
   *  palabra de acción / un dato (empujada: «Omitir», «2 ítems»).
   *  **Es un nodo y no una lista**: *«un lugar para UN botón»* — el plural
   *  llenaría la cabecera de acentos y la Ley 5 ya dice cuántos van. */
  accionDerecha?: ReactNode
  /** Cuando la pantalla es un paso de un flujo. Se dibuja bajo el título
   *  con la pieza `BarraPasos`, que la cabecera no redibuja. */
  pasos?: { total: number; actual: number; etiqueta: string }
  onVolver?: () => void
  /** La voz del botón de volver. Sin default (Ley 3). */
  etiquetaVolver?: string
}

/** El círculo translúcido de las acciones sobre la banda. Vive acá porque
 *  es geometría de ESTA pieza: un disco de vidrio sobre ciruela. */
function DiscoVidrio({ children, onPress, etiqueta }: { children: ReactNode; onPress?: () => void; etiqueta?: string }) {
  const { handlers, estiloPresionado } = usePresionado(0.97)
  const caja: ViewStyle = {
    width: medidas.cabeceraEmpujada.flecha,
    height: medidas.cabeceraEmpujada.flecha,
    borderRadius: radius.chipV5,
    backgroundColor: 'rgba(255,255,255,.16)',
    alignItems: 'center',
    justifyContent: 'center',
  }
  if (onPress === undefined) return <View style={caja}>{children}</View>
  /* ⚠️ El `estiloPresionado` va en un `Animated.View` y NO en el `style` del
     `Pressable`: ahí compila en `packages/ui` y **rompe el typecheck de
     `apps/prestador`** (su `ViewStyle` no acepta los campos de transición
     de Reanimated). Es el molde que `Boton` ya usa. *Segunda vez en este
     lote que un tipo pasa en el paquete y falla en la app — el typecheck de
     `packages/ui` NO alcanza para una pieza nueva.* */
  return (
    <Animated.View style={[caja, estiloPresionado]}>
      <Pressable
        {...handlers}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}

export function Cabecera({
  variante,
  antetitulo,
  titulo,
  apoyo,
  accionDerecha,
  pasos,
  onVolver,
  etiquetaVolver,
}: CabeceraProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const esRaiz = variante === 'raiz'
  const m = esRaiz ? medidas.cabeceraRaiz : medidas.cabeceraEmpujada

  /* Memorial: ciruela noche PLANA, sin degradado (§4). El gradiente del
     tema ya resuelve eso solo —`gradients.memorialPlano` lleva el mismo
     color en los dos stops—, así que acá no hay una rama por tema: se pide
     el slot y el tema contesta. */
  const grad = theme.accent.gradient

  return (
    <LinearGradient
      colors={grad.colors as unknown as readonly [string, string, ...string[]]}
      locations={grad.locations as unknown as readonly [number, number, ...number[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      style={{
        paddingTop: insets.top + (esRaiz ? spacing[3] : spacing[2]),
        paddingHorizontal: m.lados,
        paddingBottom: m.bottom,
        borderBottomLeftRadius: radius.cabeceraV5,
        borderBottomRightRadius: radius.cabeceraV5,
        gap: spacing[3],
        /* Apenas perceptible: despega, no levanta. */
        boxShadow: theme.elevacion.reposo,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
        {!esRaiz && onVolver !== undefined ? (
          <DiscoVidrio onPress={onVolver} etiqueta={etiquetaVolver}>
            {/* El chevron de la casa, en su dirección `izquierda` —que la
                tabla ya trae como reflejo exacto, no como trazo nuevo—. Se
                monta la PIEZA y no el path: R70 vigila que un path svg no
                viaje suelto. */}
            <Chevron direccion="izquierda" color={palette.white} />
          </DiscoVidrio>
        ) : null}

        <View style={{ flex: 1, gap: spacing[1] }}>
          {antetitulo !== undefined ? (
            <Texto variante="antetitulo" color="inverso">
              {antetitulo}
            </Texto>
          ) : null}
          <Texto variante={esRaiz ? 'titulo' : 'seccion'} color="inverso">
            {titulo}
          </Texto>
          {apoyo !== undefined ? (
            <Texto variante="apoyo" color="inverso">
              {apoyo}
            </Texto>
          ) : null}
        </View>

        {accionDerecha !== undefined ? <View>{accionDerecha}</View> : null}
      </View>

      {pasos !== undefined ? <BarraPasos {...pasos} /> : null}
    </LinearGradient>
  )
}

/** El disco de vidrio, exportado para que quien monte la acción derecha use
 *  EL de la cabecera y no dibuje otro (el molde de R57: la superficie es
 *  UNA). */
Cabecera.Disco = DiscoVidrio
