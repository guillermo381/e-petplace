/**
 * PantallaConPie — CONTENIDO QUE SCROLLEA + PIE FIJO, y el pie RESERVA SU
 * PROPIO LUGAR (S100b-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ NACE, con el defecto medido en el aparato: **el pie fijo se
 * estaba pintando ENCIMA del contenido en CINCO pantallas de la despensa**,
 * y en una de ellas lo tapado era **la composición y los alérgenos** de un
 * producto — con la ficha sin scroll, o sea **inalcanzables**.
 *
 * **La causa no era el pie: era que el contenido no reservaba su alto.** Y
 * la forma exacta del defecto es la que esta casa ya tiene nombrada — dos
 * números que deben coincidir, saliendo de dos cuentas distintas:
 *
 * ```
 * // la ficha, antes:
 * paddingBottom: insets.bottom + (conCta ? spacing[8] + 96 : spacing[8])
 * //                                                    ↑ el alto del pie, TECLEADO
 * ```
 *
 * Ese `96` es una **estimación** del alto del pie. El pie real de esa
 * pantalla lleva **dos botones apilados** y mide bastante más ⇒ la cuenta
 * quedaba corta y el contenido se metía debajo. *El comentario decía «deja
 * aire para la barra fija» y el número no seguía a la barra.*
 *
 * ⇒ **La cura no es elegir mejor el número: es DERIVARLO.** Acá el pie se
 * mide a sí mismo (`onLayout`) y **esa misma medida es la que reserva el
 * scroll**. No hay dos cuentas, hay una. *Un par que debe coincidir y sale
 * de dos lugares es una bomba con temporizador; derivarlo la desarma*
 * (L-284, y el mismo movimiento que `EtiquetaDeCampo` hizo con la etiqueta).
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LO QUE VUELVE EL DEFECTO INEXPRESABLE ──────────────────────────
 * **El pie y la reserva son la MISMA pieza.** No hay forma de montar el
 * pie sin reservar, porque quien reserva es quien lo dibuja. *Mientras la
 * reserva viva en el consumidor, alguien va a olvidarla — y su modo de
 * falla es silencioso: la pantalla se ve bien hasta que el contenido crece.*
 *
 * ⚠️ **Y ES SILENCIOSO EN EL PEOR SENTIDO:** el nodo tapado **sigue
 * existiendo en el árbol de accesibilidad**. Medido en la ficha: el lector
 * de pantalla anuncia la composición que el ojo no puede ver. *Un
 * instrumento que lee el árbol da verde sobre este defecto* — por eso no lo
 * cazó ningún gate y hubo que mirar la pantalla.
 *
 * ── EL INSET DEL SISTEMA TAMBIÉN VIVE ACÁ ──────────────────────────
 * El `insets.bottom` lo pone la pieza, no el consumidor. Es la Ley 8
 * aplicada al pie: *ley de la pieza; ningún consumidor la re-decide.*
 * **Precedente directo:** `Hoja` absorbió su `insets.bottom` en S65 por
 * este mismo motivo, y desde entonces nadie tuvo que acordarse.
 *
 * ── LO QUE ESTA PIEZA NO HACE ──────────────────────────────────────
 * No decide qué va en el pie (recibe un `ReactNode`), no dibuja fondo
 * propio más allá del de la pantalla, y **no opina sobre cuántas acciones
 * entran** — eso es composición, y la Ley 22c ya la gobierna.
 *
 * ⚠️ **NO cubre la barra de tabs.** Una pantalla dentro de `(tabs)` recibe
 * su inset por el navegador; ésta reserva **el alto de SU pie**, que es lo
 * que estaba faltando. *Se dice para que nadie lea esta pieza como la cura
 * de todo lo que quedaba debajo.*
 */

import { useState, type ReactNode } from 'react'
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export interface PantallaConPieProps {
  /**
   * Lo que va fijo abajo. **Ausente = no hay pie y no se reserva nada** —
   * la pieza se comporta como un `ScrollView` común.
   *
   * *Es opcional a propósito: muchas pantallas alternan entre tener CTA y
   * no tenerlo según su estado, y con la reserva derivada ese caso deja de
   * necesitar una condición en el `paddingBottom` del consumidor* — que es
   * justo donde vivía el `96`.
   *
   * 🔴 **PASALO COMO FRAGMENTO O COMO CONTROLES SUELTOS, no envuelto en un
   * `View` tuyo.** El contenedor de la pieza lleva `pointerEvents="box-none"`
   * para que el gesto de scroll pase entre los botones (ver su nota), **pero
   * eso cubre UNA capa: un `View` intermedio tuyo vuelve a capturar el toque
   * en todo su rectángulo y reabre la zona muerta.**
   *
   * ✅ `pie={<><Boton …/><Boton …/></>}`
   * ⛔ `pie={<View style={{ gap: 8 }}><Boton …/><Boton …/></View>}`
   * — si necesitás agrupar de verdad, ese `View` lleva `pointerEvents="box-none"`.
   *
   * *Se dice acá y no en la cabecera porque **es una trampa del consumidor,
   * y el lugar donde se lee al construir es la prop que se está tipeando.***
   */
  pie?: ReactNode
  children: ReactNode
  /**
   * El del contenido. Su `paddingBottom` **se SUMA** a la reserva del pie:
   * el consumidor sigue decidiendo cuánto aire quiere al final de SU
   * contenido, y la pieza le agrega lo que el pie ocupa.
   */
  contentContainerStyle?: StyleProp<ViewStyle>
  /** Se pasa tal cual al `ScrollView` (por ej. `refreshControl`). */
  scrollProps?: Omit<
    React.ComponentProps<typeof ScrollView>,
    'contentContainerStyle' | 'children'
  >
}

export function PantallaConPie({ pie, children, contentContainerStyle, scrollProps }: PantallaConPieProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  /** El alto REAL del pie, medido. Arranca en 0 y se corrige en el primer
   *  layout — un frame sin reserva no se ve porque el pie tampoco está
   *  dibujado todavía. */
  const [altoPie, setAltoPie] = useState(0)

  const propio = StyleSheet.flatten(contentContainerStyle) ?? {}
  /** `paddingBottom` puede venir como número o como porcentaje/string; solo
   *  sumamos cuando es número, que es lo que la casa usa. Si viniera otra
   *  cosa, la reserva se aplica igual y el valor del consumidor se respeta
   *  — jamás se descarta en silencio. */
  const propioAbajo = typeof propio.paddingBottom === 'number' ? propio.paddingBottom : 0

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView
        {...scrollProps}
        contentContainerStyle={[
          contentContainerStyle,
          // 🔴 LA LÍNEA QUE CURA LAS CINCO PANTALLAS: la reserva es el alto
          // MEDIDO del pie, no una estimación. Si el pie crece —un botón
          // más, una voz más larga, una fuente más grande por accesibilidad—
          // la reserva crece con él sin que nadie toque nada.
          { paddingBottom: propioAbajo + altoPie },
        ]}
      >
        {children}
      </ScrollView>

      {pie === undefined ? null : (
        <View
          /* 🔴 `box-none` — LA ZONA MUERTA DE GESTO, CURADA (S100b-B).
           *
           * **El defecto, y lo encontré equivocándome:** reporté que la
           * ficha «no scrollea». La pista C midió la fuente y dijo que sí.
           * Al preguntarme POR QUÉ me había equivocado apareció la causa
           * real: **mi swipe empezó dentro de la banda del pie, y el pie
           * se comió el gesto.** La captura salió idéntica y la leí como
           * «no scrollea».
           *
           * ⇒ **Un pie que captura el toque en toda su banda deja sin
           * scroll el tercio inferior de la pantalla.** Y ahí es
           * exactamente donde una familia apoya el pulgar: *quien sostiene
           * el teléfono con una mano arrastra abajo, no arriba.* Con el pie
           * capturando, la pantalla se siente trabada y la persona
           * concluye que no hay más contenido.
           *
           * **`box-none` = el contenedor no es blanco de toque; sus hijos
           * sí.** Los botones siguen funcionando; el aire entre ellos deja
           * pasar el gesto al `ScrollView` de abajo.
           *
           * ✅ **Y es SEGURO precisamente por la otra mitad de esta pieza:**
           * como la reserva se deriva del alto medido, **debajo del pie no
           * queda contenido** — el toque que pasa cae sobre espacio vacío
           * del scroll y lo único que puede hacer es desplazar. *Sin la
           * reserva derivada, `box-none` habría dejado tocar contenido
           * escondido; las dos mitades se necesitan.* */
          pointerEvents="box-none"
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height
            // Solo escribimos si cambió: `onLayout` puede repetir el mismo
            // valor y un `setState` por frame haría re-render en vano.
            setAltoPie((previo) => (Math.abs(previo - h) < 0.5 ? previo : h))
          }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: spacing[5],
            paddingTop: spacing[3],
            // El inset del sistema es de la pieza (ver la cabecera).
            paddingBottom: insets.bottom + spacing[3],
            backgroundColor: theme.bg.base,
            gap: spacing[2],
          }}
        >
          {pie}
        </View>
      )}
    </View>
  )
}
