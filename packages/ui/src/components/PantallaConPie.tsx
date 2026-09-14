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
 * 🔴 **Y EL INSET SE DERIVA, NO SE SUMA — LA PIEZA SE COBRÓ SU PROPIA LEY
 * (S100c-B, medido en aparato).** El founder reportó *«~1 cm muerto entre el
 * botón y el menú»*. **Medido en el SM-S938B:** barra de navegación del
 * sistema **52 dp** · `insets.bottom + spacing[3]` = **64 dp** de reserva ·
 * y el CTA quedó con su base en **638 dp** contra el filo de la barra de
 * tabs en **699** ⇒ **61 dp de hueco**. *Dos cuentas, un número: la reserva
 * predicha explica el hueco medido.*
 *
 * **La causa: adentro de `(tabs)` el navegador YA reserva la barra del
 * sistema** —lo mismo que B midió para el scroll (`ScrollView` de una
 * pantalla de tab termina exactamente en 699 dp)—, así que sumarle
 * `insets.bottom` **lo cuenta dos veces.** *Es el defecto que esta pieza
 * nació para matar, cometido por la pieza misma: dos números que deben
 * coincidir saliendo de dos lugares.*
 *
 * ⇒ **La cura NO es una prop** (`absorbeInset?: boolean` habría devuelto la
 * decisión al consumidor, que es justo lo que la Ley 8 prohíbe **y** habría
 * dejado el par descoordinado otra vez). **Se DERIVA:** el contenedor se
 * mide en la ventana y reserva **solo lo que falta** entre su base y la base
 * de la pantalla. Adentro de tabs eso da **0**; en una pantalla suelta da el
 * inset entero. *El consumidor no tiene nada que declarar porque no hay nada
 * que saber.*
 *
 * ⚠️ **NO TIENE OJO TODAVÍA.** Se midió el defecto en el aparato; **la cura
 * no se vio correr** —eso exige un publish— y su modo de falla, si la
 * derivación se equivoca, es **el pie pegado al borde** en una pantalla
 * suelta. **Va al gate del conjunto.**
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

import { type ReactNode } from 'react'
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { PieFijo, usePieFijo } from './pie-fijo'

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
  /* 🔴 **EL MECANISMO SE MUDÓ A `pie-fijo.tsx` (S116-B) Y ACÁ NO QUEDÓ UNA
     COPIA.** `HojaContenido` ganó slot de pie por firma de la mesa, y su
     pie necesitaba **exactamente** estas tres curas —la reserva medida, el
     inset derivado y el `box-none`—, que se pagaron acá con dos defectos
     de aparato. *Escribirlas de nuevo allá habría sido escribir la versión
     que no las pagó.* El porqué de cada una vive en la cabecera del módulo
     nuevo; esta pieza **no cambia de comportamiento**, cambia de dónde lo
     saca. */
  const { contenedor, medirContenedor, medirPie, altoPie, insetFaltante } = usePieFijo()

  const propio = StyleSheet.flatten(contentContainerStyle) ?? {}
  /** `paddingBottom` puede venir como número o como porcentaje/string; solo
   *  sumamos cuando es número, que es lo que la casa usa. Si viniera otra
   *  cosa, la reserva se aplica igual y el valor del consumidor se respeta
   *  — jamás se descarta en silencio. */
  const propioAbajo = typeof propio.paddingBottom === 'number' ? propio.paddingBottom : 0

  return (
    <View
      ref={contenedor}
      onLayout={medirContenedor}
      style={{ flex: 1, backgroundColor: theme.bg.base }}
    >
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
        <PieFijo insetFaltante={insetFaltante} onLayout={medirPie}>
          {pie}
        </PieFijo>
      )}
    </View>
  )
}
