/**
 * SuperficieChat — EL TECLADO, LA LISTA Y LA BARRA, UNA SOLA VEZ (S112-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **ES LA PIEZA QUE IMPIDE QUE LAS DOS APPS TENGAN DOS CHATS DISTINTOS.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Nace de un rojo medido por C en las dos casas el mismo día:
 *
 * ```
 * cliente   · adoptar/solicitud/[id]  → ScrollView, CERO EvitaTeclado
 * prestador · adopcion/solicitud/[id] → EvitaTeclado + ScrollView plano
 * ```
 *
 * ⇒ **en el cliente el teclado tapa el campo** —el defecto que el founder
 * ve— y en el prestador empuja pero **la lista no está anclada al final**,
 * así que el último mensaje puede quedar arriba del pliegue. *Dos
 * comportamientos distintos para la misma conversación.*
 *
 * ── POR QUÉ ES UNA PIEZA Y NO DOS MONTAJES ───────────────────────────────
 * La composición es **idéntica** en las dos: inset del teclado, lista
 * invertida anclada al final, barra pegada al teclado, cierre al deslizar,
 * borde inferior con el teclado cerrado. **Lo único que cambia es el
 * contenido** —quién habla, qué acciones tiene la cabecera—, y eso entra por
 * slots.
 *
 * Y el precedente de la casa es exacto: `EvitaTeclado` nació local en el
 * prestador y **subió a `packages/ui` cuando apareció el segundo consumidor**
 * (`D-498`, *«la casa tiene UNA»*). Acá el segundo consumidor aparece **el
 * mismo día**, así que la copia nacería ya condenada.
 *
 * ── ① EL INSET DEL TECLADO, y por qué `useAnimatedKeyboard` ──────────────
 * La barra viaja **CON** el teclado, no después: el inset se lee del sistema
 * en el hilo de UI y se aplica como estilo animado. *Un
 * `KeyboardAvoidingView` con offsets a ojo llega tarde y llega distinto en
 * cada teléfono* — la letra lo prohíbe con todas las letras (§2.2).
 *
 * ⚠️ **Y con el teclado cerrado el inset cae al borde seguro del teléfono**,
 * no a cero: la barra respeta el borde inferior (§2.2). De los dos errores
 * posibles se elige el que no pega la barra al filo.
 *
 * ── ② LA LISTA VA INVERTIDA, y eso es lo que la ancla ────────────────────
 * **Anclada al final POR CONSTRUCCIÓN, no por un efecto.** *Un `scrollToEnd`
 * en un efecto pelea con el teclado y con el paginado, y pierde las dos
 * veces* — y encima produce el salto que la letra prohíbe.
 *
 * 🔴 **CONSECUENCIA PARA QUIEN LA MONTA, y no es opcional:** `datos` va del
 * **más nuevo al más viejo**. Es lo contrario de lo que uno escribe sin
 * pensar, y si llega al revés la conversación se lee de atrás para adelante
 * **sin ningún error**. Por eso está acá y en el nombre de la prop.
 *
 * Y `onCargarAnteriores` se dispara **arriba visualmente** —el «final» de una
 * lista invertida es el mensaje más viejo—: es el paginado hacia atrás.
 *
 * ── ③ `alFondo` SALE DE LA PIEZA, no entra ───────────────────────────────
 * Sólo la lista sabe dónde está el scroll. La pieza lo **reporta** y la
 * pantalla decide qué hacer con eso (mostrar la pastilla, el botón de bajar).
 * *Una pieza que recibiera ese dato por prop obligaría a la pantalla a
 * calcularlo con datos que no tiene.*
 *
 * ── LO QUE NO TIENE, Y NO SE CONSTRUYE ───────────────────────────────────
 * · **Nada de adjuntar.** Medido por D en tres lugares: sin columna, sin
 *   parámetro, **sin bucket privado** — y con una trampa señalizada:
 *   `adopcion-fotos` existe y es **público**, es la vidriera. *Colgar ahí los
 *   adjuntos de una conversación privada los deja a la vista de cualquiera.*
 * · Sin reacciones y sin «está escribiendo…»: *no se construye lo que el
 *   motor no sabe* (§2.3).
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El hilo de la solicitud en las DOS apps (C1). **Entregada y no montada.**
 */
import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { FlatList, View } from 'react-native'
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/** Cuántos píxeles del fondo cuentan como «estoy abajo». Media línea de
 *  texto: menos que eso es ruido de scroll, más ya es haberse ido. */
const MARGEN_FONDO = 24

export type SuperficieChatProps<T> = {
  /** Fijo arriba: la escalera, la cabecera, las acciones. No scrollea. */
  encabezado?: ReactNode
  /**
   * 🔴 **DEL MÁS NUEVO AL MÁS VIEJO.** La lista va invertida — ver la nota
   * ② de la cabecera. Al revés se lee la conversación de atrás para
   * adelante, sin ningún error.
   */
  datosDelMasNuevoAlMasViejo: T[]
  /** Identidad estable de cada mensaje. */
  claveDe: (item: T) => string
  /** La burbuja la dibuja quien sabe de qué lado va. */
  renderMensaje: (item: T) => ReactNode
  /** El campo + enviar, o la variante en lectura. Va pegado al teclado. */
  barra?: ReactNode
  /** Paginado hacia atrás: se dispara ARRIBA visualmente. */
  onCargarAnteriores?: () => void
  /** La pieza REPORTA si está pegada abajo; no lo recibe. */
  onAlFondoCambia?: (alFondo: boolean) => void
  /** Flota sobre la lista, encima de la barra (la pastilla, el bajar). */
  sobrepuesto?: ReactNode
}

export function SuperficieChat<T>({
  encabezado,
  datosDelMasNuevoAlMasViejo,
  claveDe,
  renderMensaje,
  barra,
  onCargarAnteriores,
  onAlFondoCambia,
  sobrepuesto,
}: SuperficieChatProps<T>) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const teclado = useAnimatedKeyboard()

  /* EL INSET: el alto del teclado, y con el teclado cerrado el borde seguro
     del teléfono. `Math.max` y no una condición sobre el estado del teclado:
     durante la transición el alto pasa por valores menores al inset, y ahí
     una condición haría saltar la barra dos veces. */
  const estiloPie = useAnimatedStyle(() => ({
    paddingBottom: Math.max(teclado.height.value, insets.bottom),
  }))

  /* En una lista INVERTIDA el «fondo» es `contentOffset.y === 0`. */
  const alScrollear = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      onAlFondoCambia?.(e.nativeEvent.contentOffset.y <= MARGEN_FONDO)
    },
    [onAlFondoCambia],
  )

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {encabezado}

      <View style={{ flex: 1 }}>
        <FlatList
          inverted
          data={datosDelMasNuevoAlMasViejo}
          keyExtractor={claveDe}
          renderItem={({ item }) => <>{renderMensaje(item)}</>}
          /* «Si deslizo la lista hacia abajo, el teclado se guarda solo»
             (§2.2) — y `on-drag` lo hace con el gesto, no al soltar. */
          keyboardDismissMode="on-drag"
          /* Que un toque en un mensaje funcione con el teclado abierto sin
             pedir dos toques. */
          keyboardShouldPersistTaps="handled"
          onEndReached={onCargarAnteriores}
          onEndReachedThreshold={0.4}
          onScroll={alScrollear}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical: spacing[2] }}
        />

        {/* LO SOBREPUESTO — flota sobre la lista y **debajo de la barra**:
            una pastilla tapada por el campo no la ve nadie. `box-none` para
            que el scroll pase entre sus hijos. */}
        {sobrepuesto === undefined ? null : (
          <View
            pointerEvents="box-none"
            style={{ position: 'absolute', left: 0, right: 0, bottom: spacing[3] }}
          >
            {sobrepuesto}
          </View>
        )}
      </View>

      {/* LA BARRA, pegada al teclado. Va FUERA del contenedor de la lista
          para que el inset no le coma alto al hilo. */}
      <Animated.View style={estiloPie}>{barra}</Animated.View>
    </View>
  )
}
