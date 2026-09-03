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
 * ── ① EL TECLADO — ⏪ ENMENDADO: se monta `EvitaTeclado`, la pieza de la casa
 * ⏪ **ACÁ VIVÍA `useAnimatedKeyboard()`**, con el argumento de que la barra
 * viajara *con* el teclado en vez de detrás. **Se retira, y por TRES hechos
 * medidos — ninguno de ellos la hipótesis del crash que C reportó:**
 *
 * ① **Está `@deprecated` en la Reanimated instalada (4.5.0)**, con guía de
 *    migración a otra librería. *Lo introduje sin medir que estaba
 *    deprecada*, que es exactamente lo que esta casa le exige a cualquier
 *    dependencia nueva.
 * ② **La casa YA TIENE la pieza**: `EvitaTeclado` subió a `packages/ui` por
 *    `D-498` —*«la casa tiene UNA»*— y yo escribí una segunda respuesta al
 *    mismo problema. *Es literal lo que le vengo diciendo a C todo el día.*
 * ③ **Su forma se eligió MIDIENDO EN DISPOSITIVO, contra este mismo modo de
 *    falla:** S73-B nació de un hallazgo de campo del founder («escribí a
 *    ciegas») y S83-B36 fijó `behavior="padding"` en las dos plataformas
 *    porque *bajo edge-to-edge (SDK 57) la ventana ya no se achica y
 *    `adjustResize` es letra muerta*. **Mi inset animado era una segunda
 *    solución a un problema que ya estaba resuelto con número.**
 *
 * ⚠️ **Y §2.2 no lo prohíbe, aunque parezca:** la letra prohíbe *«un
 * `KeyboardAvoidingView` a ojo con offsets fijos»*. `EvitaTeclado` **no
 * lleva offset**: empuja con el inset del teclado, que sí llega. *La letra
 * nombra una mala práctica, no la pieza.*
 *
 * 🔴 **LO QUE SE PIERDE, y se declara:** el inset animado hacía que la barra
 * siguiera el teclado **cuadro a cuadro**. Con `EvitaTeclado` sigue la
 * animación del sistema, que es un pelo distinta. *Es un costo real y el
 * único juez es el aparato* — va al gate de C junto con el resto.
 *
 * ── 🔴 Y LO QUE LA MEDICIÓN DIJO DEL CRASH, que NO es lo que se esperaba ──
 * La hipótesis que llegó era *«el binario nunca ejercitó esta llamada, así
 * que su lado nativo no la soporta»*. **Se midió contra el lockfile del ancla
 * del binario (`28daa703`) y las DOS mitades dan FALSO:**
 *
 * · **la versión es la MISMA** — el APK trae `react-native-reanimated@4.5.0`,
 *   idéntica a la instalada hoy, así que su lado nativo **sí** implementa
 *   `subscribeForKeyboardEvents`.
 * · **el plugin está** — no hace falta `babel.config.js` (medido: ninguna de
 *   las dos apps tiene uno): `babel-preset-expo` incluye el de worklets
 *   cuando Reanimated está instalada. *Y si no estuviera, no fallaría sólo
 *   esta llamada: fallarían las transiciones de `Boton` y el thumb de
 *   `Interruptor`, que corren desde hace sesiones.*
 *
 * ⇒ **`useAnimatedKeyboard` NO está probado como la causa del crash**, y
 * decirlo importa: si el crash sobrevive a este cambio, **la causa sigue
 * suelta** y hay que buscarla en otro lado en vez de darla por curada. *Esto
 * se retira porque no debió entrar —deprecada y duplicando una pieza de la
 * casa—, no porque se haya demostrado que rompe.*
 *
 * Con el teclado cerrado la barra respeta el **borde seguro** del teléfono.
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
import { memo, useCallback, useRef } from 'react'
import { FlatList, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EvitaTeclado } from './EvitaTeclado'
import { mismaFila } from './misma-fila'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/** Cuántos píxeles del fondo cuentan como «estoy abajo». Media línea de
 *  texto: menos que eso es ruido de scroll, más ya es haberse ido. */
const MARGEN_FONDO = 24

/**
 * 🔴 LA FILA MEMOIZADA (S112-B · A14) — y su comparador es toda la cura.
 *
 * **El defecto que cierra:** `renderItem` era una flecha nueva en cada
 * render, así que `FlatList` recibía una función distinta cada vez y
 * **redibujaba todas las filas aunque no hubiera pasado nada**. En un hilo
 * eso se paga en cada tecla que alguien escribe, porque el estado del campo
 * vive arriba.
 *
 * ⚠️ **Y memoizar `renderItem` SOLO no alcanzaba**, que es la parte que
 * importa: `useCallback` depende de `renderMensaje`, y `renderMensaje` lo
 * pasa la pantalla —casi siempre como flecha inline—, así que la
 * dependencia cambia en cada render y el `useCallback` no memoiza nada.
 * *Un `useCallback` sobre una prop inestable es un adorno.*
 *
 * ⇒ **la fila se memoiza sobre el ITEM y recibe una función ya estabilizada
 * por `ref`**. Así el número no depende de que el consumidor se acuerde de
 * memoizar — que es la única forma de que sea cierto en las dos apps.
 *
 * **Y su precio, declarado:** obliga al contrato de pureza de
 * `renderMensaje`. *Sin ese contrato, «cero filas redibujadas» sería un
 * número que se paga con datos viejos en pantalla.*
 */
const Fila = memo(
  function Fila<T>({ item, dibujar }: { item: T; dibujar: (item: T) => ReactNode }) {
    return <>{dibujar(item)}</>
  },
  mismaFila,
) as <T>(props: { item: T; dibujar: (item: T) => ReactNode }) => ReactNode

export type SuperficieChatProps<T> = {
  /** Fijo arriba: la escalera, la cabecera, las acciones. No scrollea. */
  encabezado?: ReactNode
  /**
   * 🔴 **DEL MÁS NUEVO AL MÁS VIEJO.** La lista va invertida — ver la nota
   * ② de la cabecera. Al revés se lee la conversación de atrás para
   * adelante, sin ningún error.
   */
  datosDelMasNuevoAlMasViejo: T[]
  /**
   * Identidad estable de cada mensaje. **Tiene que ser PURA sobre el item**
   * —el id, no el índice—: se la estabiliza adentro con una `ref`, así que
   * una que dependa de estado de la pantalla devolvería claves viejas.
   */
  claveDe: (item: T) => string
  /**
   * La burbuja la dibuja quien sabe de qué lado va.
   *
   * 🔴 **CONTRATO DE PUREZA, y es lo que hace CIERTA la memoización:** todo
   * lo que la fila dibuja tiene que venir **en el item**. Las filas están
   * memoizadas por item, así que *un `renderMensaje` que cierre sobre estado
   * de la pantalla no va a repintar cuando ese estado cambie.*
   *
   * No es una restricción caprichosa: es la condición sin la cual «cero filas
   * redibujadas» sería un número que se paga con datos viejos en pantalla.
   * Si algo de la burbuja cambia —un reintento, un estado de envío— **va en
   * el item**, que es donde el resto de esta superficie ya lo busca.
   */
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

  /* LAS DOS FUNCIONES DE LA PANTALLA, ESTABILIZADAS ACÁ. La `ref` se
     actualiza en cada render —así la última versión es la que corre— y las
     envolturas de abajo **nunca cambian de identidad**, que es lo que
     `FlatList` mira para decidir si redibuja. */
  const refRender = useRef(renderMensaje)
  refRender.current = renderMensaje
  const refClave = useRef(claveDe)
  refClave.current = claveDe

  const dibujar = useCallback((item: T) => refRender.current(item), [])
  const clave = useCallback((item: T) => refClave.current(item), [])
  const renderFila = useCallback(
    ({ item }: { item: T }) => <Fila item={item} dibujar={dibujar} />,
    [dibujar],
  )

  /* En una lista INVERTIDA el «fondo» es `contentOffset.y === 0`. */
  const alScrollear = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      onAlFondoCambia?.(e.nativeEvent.contentOffset.y <= MARGEN_FONDO)
    },
    [onAlFondoCambia],
  )

  return (
    /* `EvitaTeclado` envuelve la superficie ENTERA —lista y barra— para que
       el empuje mueva las dos juntas. Envolver sólo la barra la despegaría
       de la lista, que es el defecto que esto viene a no tener. */
    <EvitaTeclado>
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        {encabezado}

        <View style={{ flex: 1 }}>
          <FlatList
            inverted
            data={datosDelMasNuevoAlMasViejo}
            keyExtractor={clave}
            renderItem={renderFila}
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

        {/* LA BARRA. Va FUERA del contenedor de la lista para que su alto no
            se lo coma al hilo. Con el teclado cerrado respeta el borde
            seguro; con el teclado abierto, `EvitaTeclado` empuja todo. */}
        <View style={{ paddingBottom: insets.bottom }}>{barra}</View>
      </View>
    </EvitaTeclado>
  )
}
