import { useRef, useState, type ReactNode } from 'react'
import { Dimensions, View, type LayoutChangeEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **EL PIE FIJO — el mecanismo, en UN solo lugar (S116-B, tanda de
 * corrección).**
 *
 * ── POR QUÉ SE EXTRAE, y no es prolijidad ────────────────────────────
 * `HojaContenido` gana slot de pie (firma de la mesa) y el mecanismo que
 * necesita **ya existía entero adentro de `PantallaConPie`**, donde costó
 * dos defectos medidos en aparato:
 *
 *   ① **el pie tapaba contenido en cinco pantallas** —en una, la
 *      composición y los alérgenos de un producto, *inalcanzables*— porque
 *      el scroll reservaba un `96` TECLEADO en vez del alto real;
 *   ② **el pie se comía el gesto** en toda su banda, y el tercio inferior
 *      de la pantalla dejaba de scrollear justo donde se apoya el pulgar.
 *
 * Y una tercera, que la propia pieza se cobró: **el inset del sistema
 * contado dos veces** adentro de `(tabs)`, donde el navegador ya lo
 * reservó.
 *
 * 🔴 *Escribir un segundo pie en `HojaContenido` sería escribir de nuevo
 * esas tres curas — y la segunda copia no las tendría, porque no las
 * pagó.* Las tres viven acá y las dos piezas las consumen.
 *
 * ── LAS TRES, en una línea cada una ──────────────────────────────────
 * · **La reserva se MIDE**: el alto que el scroll deja abajo es el alto que
 *   el pie reportó, no una estimación. Un botón más y la reserva crece sola.
 * · **El inset se DERIVA**: la pieza se mide contra la base de la pantalla
 *   y reserva *sólo lo que falta*. Adentro de tabs eso da 0.
 * · **`box-none`**: el contenedor no es blanco de toque; sus hijos sí. El
 *   aire entre botones deja pasar el gesto al scroll de abajo — y es seguro
 *   **porque la reserva existe**: debajo del pie no hay contenido que tocar.
 *   *Las dos mitades se necesitan.*
 *
 * ── EL MATERIAL, que es lo único NUEVO de esta extracción ────────────
 * `lienzo` — el pie de controles: fondo del lienzo, aire alrededor y el
 * inset adentro. Es el de siempre.
 * `sangrado` — una franja que **llega al filo**: sin fondo y sin padding,
 * porque su color tiene que tocar el borde de la pantalla y el inset lo
 * absorbe la pieza que va adentro (la `OndaAcceso` lo hace).
 *
 * *Son dos y son cerrados a propósito: con un `style` libre, cada pantalla
 * volvería a decidir el material y volveríamos a tener N pies.*
 * ═══════════════════════════════════════════════════════════════════════
 */
export type MaterialDelPie = 'lienzo' | 'sangrado'

/**
 * 🔴 **EL INSET QUE FALTA DE VERDAD (S116-B lote 6).**
 *
 * `useSafeAreaInsets().bottom` dice cuánto mide la barra del sistema, **no
 * cuánto de ella queda debajo de VOS**. Adentro de `(tabs)` el navegador ya
 * la reservó ⇒ sumarla la cuenta dos veces; en una pantalla suelta hay que
 * sumarla entera. *Es el mismo par descoordinado que `PantallaConPie` mató:
 * dos números que deben coincidir saliendo de dos cuentas distintas.*
 *
 * ⇒ **se MIDE contra la base de la pantalla.** Lo usa el pie fijo y lo usa
 * `OndaAcceso`, que tiene el mismo problema en su borde inferior: el
 * founder vio *«el texto cortado por las tres teclas»* en un Samsung.
 *
 * Devuelve `[ref, alMedir, faltante]` — el ref va en el contenedor cuyo
 * borde inferior importa.
 */
export function useInsetQueFalta(): [React.RefObject<View | null>, () => void, number] {
  const insets = useSafeAreaInsets()
  /* Arranca en `insets.bottom`, el valor CONSERVADOR: si la medición nunca
     llegara, sobra aire — jamás falta. *De los dos errores posibles se elige
     el que no tapa nada.* */
  const [falta, setFalta] = useState(insets.bottom)
  const ref = useRef<View>(null)
  const alMedir = () => {
    ref.current?.measureInWindow((_x, y, _w, alto) => {
      const baseDePantalla = Dimensions.get('screen').height
      const yaReservado = Math.max(0, baseDePantalla - (y + alto))
      const v = Math.max(0, insets.bottom - yaReservado)
      setFalta((previo) => (Math.abs(previo - v) < 0.5 ? previo : v))
    })
  }
  return [ref, alMedir, falta]
}

export function usePieFijo() {
  const insets = useSafeAreaInsets()
  /** Cuánto mide el pie. Arranca en 0: **antes de la primera medición no
   *  hay pie dibujado**, así que reservar de más movería el contenido. */
  const [altoPie, setAltoPie] = useState(0)
  /** Lo que falta del inset. Arranca en `insets.bottom` — el valor
   *  CONSERVADOR: si la medición nunca llegara, el pie queda separado de
   *  más, jamás pegado al borde. *De los dos errores posibles se elige el
   *  que no tapa nada.* */
  const [insetFaltante, setInsetFaltante] = useState(insets.bottom)
  const contenedor = useRef<View>(null)

  /** Va en el `onLayout` del contenedor de la pantalla. Mide cuánto de la
   *  barra del sistema queda REALMENTE debajo: adentro de `(tabs)` el
   *  navegador ya la reservó ⇒ falta 0; en una pantalla suelta la base
   *  llega al borde físico ⇒ falta el inset entero. **La pieza no pregunta
   *  dónde está montada: lo mide.** */
  const medirContenedor = () => {
    contenedor.current?.measureInWindow((_x, y, _w, alto) => {
      const baseDePantalla = Dimensions.get('screen').height
      const yaReservado = Math.max(0, baseDePantalla - (y + alto))
      const falta = Math.max(0, insets.bottom - yaReservado)
      setInsetFaltante((previo) => (Math.abs(previo - falta) < 0.5 ? previo : falta))
    })
  }

  /** Va en el `onLayout` del pie. Sólo escribe si cambió: `onLayout` puede
   *  repetir el mismo valor y un `setState` por frame re-renderiza en vano. */
  const medirPie = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height
    setAltoPie((previo) => (Math.abs(previo - h) < 0.5 ? previo : h))
  }

  return { contenedor, medirContenedor, medirPie, altoPie, insetFaltante }
}

export function PieFijo({
  children,
  material = 'lienzo',
  insetFaltante,
  onLayout,
}: {
  children: ReactNode
  material?: MaterialDelPie
  insetFaltante: number
  onLayout: (e: LayoutChangeEvent) => void
}) {
  const { theme } = useTheme()
  const sangra = material === 'sangrado'
  return (
    <View
      pointerEvents="box-none"
      onLayout={onLayout}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        ...(sangra
          ? null
          : {
              paddingHorizontal: spacing[5],
              paddingTop: spacing[3],
              paddingBottom: insetFaltante + spacing[3],
              backgroundColor: theme.bg.base,
              gap: spacing[2],
            }),
      }}
    >
      {children}
    </View>
  )
}
