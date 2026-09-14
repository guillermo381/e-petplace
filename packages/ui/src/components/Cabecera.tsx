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
  /* ══════════════════════════════════════════════════════════════════
   *  CÓMO SE PINTA — `'tarjeta'` (default, lo de siempre) o `'fondo'`.
   *
   * 🔴 **ES UNA PROP Y NO UN TERCER VALOR DE `variante`, y la orden misma
   * lo obliga:** pide *«mismos contenidos… **flecha en empujada**»*, o sea
   * que `raiz`/`empujada` siguen vivas. **`fondo` no es QUÉ ES la cabecera:
   * es CÓMO SE PINTA**, y son dos ejes.
   *
   * *La casa ya resolvió este caso exacto en `Boton`, y su entrada lo dejó
   * escrito: «la superficie es ORTOGONAL a la variante».* Meterlo en
   * `variante` habría obligado a `fondoRaiz` y `fondoEmpujada` el día
   * siguiente.
   *
   * QUÉ CAMBIA: **nada de contenido.** Pierde el radio inferior y la
   * sombra, porque deja de ser una tarjeta apoyada y pasa a ser el FONDO
   * de la pantalla — *una sombra sobre el fondo no despega nada: no hay
   * nada debajo.*
   *
   * ⚠️ **Default `'tarjeta'`: los siete consumidores no cambian una prop.**
   * Quien la monta como fondo es `HojaContenido`, que sabe que hay una
   * hoja encima. */
  presentacion?: 'tarjeta' | 'fondo'
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

/* ══════════════════════════════════════════════════════════════════════
 *  EL ALTO DE LA CABECERA — pedido de C (buzón S116, pedido 2)
 *
 * C lo pidió como `ALTO_CABECERA_*`, al molde de `ALTO_FILA_TABS`, para
 * que **el valor de arranque de su medición asincrónica sea el correcto**
 * en vez de un cero que salta en el primer cuadro. La razón es buena y el
 * molde es el de la casa.
 *
 * 🔴 **PERO NO HAY UN ALTO, y decirlo es más útil que inventar uno.** La
 * cabecera mide `insets.top + padding + CONTENIDO + padding`, y el
 * contenido es variable por diseño: antetítulo opcional, título de una o
 * dos líneas, apoyo opcional, barra de pasos opcional. *Un `ALTO_CABECERA`
 * único sería correcto para una combinación y falso para las otras siete —
 * y al ser un valor de arranque, su error se ve como un salto.*
 *
 * ⇒ se exporta **LA PARTE FIJA**, que es exactamente lo que
 * `ALTO_FILA_TABS` hace y lo que su nota ya declaró: *«se exporta la parte
 * que es de la pieza, no la que es del teléfono»*. Acá son **dos** las que
 * no son de la pieza: el inset **y el contenido**.
 * ══════════════════════════════════════════════════════════════════════ */

/** El padding vertical de la cabecera RAÍZ (70 arriba + 22 abajo).
 *  **No incluye `insets.top` ni el contenido**: el alto real es
 *  `inset + ALTO_CABECERA_RAIZ_FIJO + lo que midan sus líneas`. Sirve como
 *  piso de arranque para una medición con `onLayout`, no como el alto. */
export const ALTO_CABECERA_RAIZ_FIJO = medidas.cabeceraRaiz.top + medidas.cabeceraRaiz.bottom

/** Íd. para la cabecera EMPUJADA (68 + 20). */
export const ALTO_CABECERA_EMPUJADA_FIJO =
  medidas.cabeceraEmpujada.top + medidas.cabeceraEmpujada.bottom

export function Cabecera({
  variante,
  antetitulo,
  titulo,
  apoyo,
  accionDerecha,
  pasos,
  onVolver,
  etiquetaVolver,
  presentacion = 'tarjeta',
}: CabeceraProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const esRaiz = variante === 'raiz'
  const esFondo = presentacion === 'fondo'
  const m = esRaiz ? medidas.cabeceraRaiz : medidas.cabeceraEmpujada

  /* Memorial: ciruela noche PLANA, sin degradado (§4). El gradiente del
     tema ya resuelve eso solo —`gradients.memorialPlano` lleva el mismo
     color en los dos stops—, así que acá no hay una rama por tema: se pide
     el slot y el tema contesta. */
  const grad = theme.accent.gradient

  /* 🔴 **COMO FONDO NO PINTA NADA, Y ES LA CURA DE LA COSTURA (lote 6).**
     El founder vio *«dos tonos de ciruela con una costura horizontal justo
     debajo del logo»*. **Medido, y la causa es aritmética:** esta pieza y
     `HojaContenido` pintan **el mismo degradado** con el mismo `start`/`end`
     — pero `end={{ y: 1 }}` significa *el fondo de MI caja*. La cabecera
     completa la rampa entera en sus ~300 px; el fondo la estira sobre los
     ~2400 de la pantalla. ⇒ **al pie de la cabecera se tocan dos colores
     distintos del mismo degradado.** No es que «no empaten»: es que son dos
     superficies, y dos superficies siempre van a tener un borde.

     ⚠️ **El síntoma lo prueba solo: no se ven DOS tonos si no hay DOS
     superficies.** Igualar los números habría sido perseguir el empate en
     cada alto de cabecera y en cada teléfono; **con una sola superficie el
     borde es inexpresable.**

     Y es lo que su propio contrato ya decía —`HojaContenido`: *«el degradado
     lo pinta ESTA pieza, no la Cabecera»*—; lo que faltaba era que la
     cabecera dejara de pintarlo. ⇒ como `fondo` es un `View` transparente.
     *Quien la monte como fondo tiene que darle una superficie debajo; hoy
     el único que lo hace es `HojaContenido`, que es para lo que nació.* */
  const estiloSuperficie = {
        paddingTop: insets.top + (esRaiz ? spacing[3] : spacing[2]),
        paddingHorizontal: m.lados,
        paddingBottom: m.bottom,
        /* Como FONDO no lleva radio ni sombra: no está apoyada sobre
           nada — es lo que está debajo de todo. La hoja que se le monta
           encima pone su propio radio, que es el que se ve. */
        borderBottomLeftRadius: esFondo ? 0 : radius.cabeceraV5,
        borderBottomRightRadius: esFondo ? 0 : radius.cabeceraV5,
        gap: spacing[3],
        /* Apenas perceptible: despega, no levanta. */
        boxShadow: esFondo ? undefined : theme.elevacion.reposo,
  }

  const contenido = (
    <>
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
    </>
  )

  /* Las dos ramas, explícitas: un componente elegido por variable no se
     puede tipar sin ensanchar las props de las dos (el gate lo frenó). */
  return esFondo ? (
    <View style={estiloSuperficie}>{contenido}</View>
  ) : (
    <LinearGradient
      colors={grad.colors as unknown as readonly [string, string, ...string[]]}
      locations={grad.locations as unknown as readonly [number, number, ...number[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      style={estiloSuperficie}
    >
      {contenido}
    </LinearGradient>
  )
}

/** El disco de vidrio, exportado para que quien monte la acción derecha use
 *  EL de la cabecera y no dibuje otro (el molde de R57: la superficie es
 *  UNA). */
Cabecera.Disco = DiscoVidrio
