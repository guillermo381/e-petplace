/**
 * DocumentoLegalLectura — EL TEXTO ENTERO, Y LA PRUEBA DE QUE SE PUDO VER
 * (S112-B, B3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **LA PIEZA NO TRAE NINGÚN TEXTO Y NO PUEDE TRAERLO.**
 * ═══════════════════════════════════════════════════════════════════════════
 * `NO SE INVENTA TEXTO LEGAL` es ley del loop. `texto` es obligatoria y no
 * tiene default: la forma de cumplir esa ley es no poder incumplirla. Lo que
 * se dibuja es lo que el servidor devolvió, tal cual, versionado e inmutable.
 *
 * ── UNA PIEZA, DOS DOCUMENTOS ────────────────────────────────────────────
 * Sirve a las **condiciones de adopción** (se leen y se aceptan una vez por
 * cuenta) y al **acta** (se lee, faltan datos, se firma con código). No son
 * dos piezas porque no son dos formas: *son el mismo texto largo con el
 * mismo pie, y lo único que cambia es qué hay entre el texto y el botón.*
 * Por eso el pie es de SLOTS y no de props tipadas por caso — una pieza que
 * pregunta «¿sos el acta o las condiciones?» es dos piezas mal cosidas.
 *
 * ── 🔴 «VI TODO» ES UN PREDICADO, NO UN EVENTO — y ése es el rojo ────────
 * Ver la cabecera de `vio-todo.ts`: un documento que entra sin scroll no
 * produce ningún `onScroll`, así que un «vi todo» hecho de eventos deja la
 * pantalla MUERTA —botón apagado para siempre, sin error y sin síntoma—.
 * **El caso está medido: las condiciones son 1 711 caracteres**, el tamaño
 * que entra sin scroll en un teléfono grande y no entra en uno chico. *El
 * mismo documento produce el defecto en un aparato y no en el otro.*
 *
 * Acá la pregunta se contesta en **tres momentos**, todos con la misma
 * cuenta: cuando se mide el viewport (`onLayout`), cuando se mide el
 * contenido (`onContentSizeChange`) y cuando alguien scrollea (`onScroll`).
 * *No hay una rama para el texto corto: el texto corto es la cuenta dando
 * verdadero en el primer layout.*
 *
 * `onVioTodo` se llama **UNA sola vez**, con pestillo en `ref`: la pantalla
 * suele responderle escribiendo estado, y un aviso que se repite en cada
 * frame de scroll sería un bucle de render.
 *
 * ⚠️ **LO QUE ESTA PIEZA NO PRUEBA (`L-459`), dicho para que la letra no se
 * lea de más:** que la persona LEYÓ. Prueba que **pudo ver** —que el
 * documento estuvo entero frente a ella—. Es la vara que la letra pide y es
 * la única que un teléfono puede medir; llamarla «leyó» sería fabricar
 * evidencia, que es lo que §5.12 prohíbe.
 *
 * ── LA LETRA QUE CUMPLE ──────────────────────────────────────────────────
 * · **N21** — el texto ES la pantalla ⇒ **no lleva carta**. El pie fijo con
 *   su CTA tampoco. Lo que sí puede llevar superficie es lo que la pantalla
 *   meta en `faltantes` (un grupo rotulado), y eso lo decide ella.
 * · **N25** — un solo botón, abajo, donde llega el pulgar: lo pone la
 *   pantalla en `pie`, y `PantallaConPie` le reserva el alto real medido.
 * · **D-999** — el botón del pie llega apagado con su razón («todavía no
 *   viste el documento entero»); la pieza no lo dibuja ni la inventa.
 * · **Ley 3** — cero diccionario: hasta el título entra por prop.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * Condiciones de adopción (C4) y acta en las dos apps (C8).
 * **Entregada y no montada.**
 */
import type { ReactNode } from 'react'
import { useCallback, useRef } from 'react'
import { View } from 'react-native'
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { spacing } from '../tokens/spacing'
import { PantallaConPie } from './PantallaConPie'
import { Texto } from './Texto'
import { pudoVerTodo } from './vio-todo'

export type DocumentoLegalLecturaProps = {
  /**
   * El texto ENTERO, tal como lo devolvió el servidor. Obligatoria y sin
   * default — ver la primera nota de la cabecera.
   */
  texto: string
  /** Título del documento. Lo trae la pantalla (Ley 3). */
  titulo?: string
  /**
   * Se llama **una sola vez**, en cuanto el documento pudo verse entero —
   * incluido el caso en que entra sin scroll, que es el que rompe.
   */
  onVioTodo: () => void
  /**
   * EL ACTA: el estado de las firmas («Firmaste · falta la firma del
   * refugio»). Va arriba de todo el pie porque es información, no obstáculo.
   */
  estadoFirmas?: ReactNode
  /**
   * EL ACTA: lo que falta con su NOMBRE («Falta tu cédula»), con los campos
   * para cargarlo. Va **pegado al botón** a propósito: es lo que lo frena, y
   * un obstáculo lejos del control que bloquea se lee como decoración.
   */
  faltantes?: ReactNode
  /**
   * La casilla y el botón. **Fragmento o controles sueltos, jamás envueltos
   * en un `View` propio** — ver la nota de `PantallaConPie.pie`: un `View`
   * intermedio captura el gesto en todo su rectángulo.
   */
  pie?: ReactNode
}

export function DocumentoLegalLectura({
  texto,
  titulo,
  onVioTodo,
  estadoFirmas,
  faltantes,
  pie,
}: DocumentoLegalLecturaProps) {
  /* Las dos mitades de la geometría llegan por caminos distintos y en
   * cualquier orden, así que se guardan y la cuenta se hace con lo que haya.
   * En `ref` y no en estado: son insumos de una decisión, no algo que se
   * dibuje — guardarlos en estado re-renderizaría el documento entero en
   * cada frame de scroll. */
  const altoVisible = useRef(0)
  const altoContenido = useRef(0)
  const desplazamiento = useRef(0)
  /** El pestillo: `onVioTodo` se llama UNA vez. */
  const yaAviso = useRef(false)

  const revisar = useCallback(() => {
    if (yaAviso.current) return
    if (pudoVerTodo(altoVisible.current, altoContenido.current, desplazamiento.current)) {
      yaAviso.current = true
      onVioTodo()
    }
  }, [onVioTodo])

  const alMedirViewport = useCallback(
    (e: LayoutChangeEvent) => {
      altoVisible.current = e.nativeEvent.layout.height
      revisar()
    },
    [revisar],
  )

  const alMedirContenido = useCallback(
    (_ancho: number, alto: number) => {
      altoContenido.current = alto
      revisar()
    },
    [revisar],
  )

  const alScrollear = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
      // Se re-leen las tres del evento: es la fuente más fresca, y en un
      // documento con imágenes el contenido crece DESPUÉS del primer layout.
      desplazamiento.current = contentOffset.y
      altoContenido.current = contentSize.height
      altoVisible.current = layoutMeasurement.height
      revisar()
    },
    [revisar],
  )

  return (
    <PantallaConPie
      pie={
        pie === undefined && faltantes === undefined && estadoFirmas === undefined ? undefined : (
          <>
            {estadoFirmas}
            {faltantes}
            {pie}
          </>
        )
      }
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}
      scrollProps={{
        onLayout: alMedirViewport,
        onContentSizeChange: alMedirContenido,
        onScroll: alScrollear,
        // 16 ms: la cuenta es de tres restas y el pestillo corta al primer
        // verdadero, así que el costo es de un frame y una sola vez.
        scrollEventThrottle: 16,
      }}
    >
      {titulo === undefined ? null : <Texto variante="titulo">{titulo}</Texto>}

      {/* El texto entero, en la letra de la casa. `cuerpo` y no `apoyo`: es
          lo que la persona vino a leer, no una nota al pie. Se dibuja tal
          cual llegó — sin recortar, sin resumir, sin «ver más». */}
      <View accessibilityRole="text">
        <Texto variante="cuerpo">{texto}</Texto>
      </View>
    </PantallaConPie>
  )
}
