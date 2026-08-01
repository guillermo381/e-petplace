/**
 * SelectorSegmentado — el control canónico de VISTAS EXCLUSIVAS dentro
 * de una pantalla (Ley 19.3 · D-359, firmado S58): Próximos/Agenda/
 * Historial, Hoy/Semana, secciones de Cuenta.
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ NO ES: no es filtro ni multi-selección (eso es SelectorOpcion —
 * los chips QUEDAN PROHIBIDOS como tabs/segmentos, decisión founder
 * S57), no es la navegación raíz (BarraTabs), no porta estado de datos
 * (Insignia). Presentacional puro: la pantalla es dueña de la vista.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ⚠️ EL DESVÍO, DECLARADO Y NO RESUELTO (S82 r37, gate del founder).
 *
 * La Ley 19.3 dice que este control CAMBIA DE VISTA. Con
 * `proposito="eleccion"` **elige un PRODUCTO** (baño vs baño-y-corte;
 * sesión vs programa). Eso es un uso fuera del propósito con el que la
 * ley lo firmó, y va escrito acá porque una ley que se estira en
 * silencio deja de ser ley: la próxima sesión que lea 19.3 y vea este
 * uso tiene que encontrar el porqué, no deducirlo.
 *
 * LO QUE LA MESA ARGUMENTÓ EN CONTRA (B y el arquitecto, `ce195b3`): el
 * segmentado DECLARA cambio de vista, y en la reserva no se cambia de
 * vista — se elige qué comprar; además convive con día, hora y duración,
 * que ya son chips, así que un segmentado ahí se leería como otra cosa.
 * La propuesta era `SelectorOpcion`, excluyente por contrato y hablando
 * la gramática de sus hermanos.
 *
 * LO QUE EL FOUNDER RESOLVIÓ MIRANDO, y es el argumento que gana: **con
 * la pata y el magenta deja de leerse como cambio de vista.** La
 * gramática que la mesa buscaba por otra pieza, este control la habla
 * con los dos agregados puestos — y encima conserva lo que
 * `SelectorOpcion` no tiene: la exclusividad ES LA FORMA (un riel, una
 * superficie que se mueve), no una promesa del contrato.
 *
 * LO QUE QUEDA ABIERTO, sin maquillaje: si 19.3 se ENMIENDA para incluir
 * la elección de producto, o si nace una entrada nueva del diccionario
 * para "elegir entre 2-3 alternativas excluyentes de un mismo eje". Es
 * decisión de mesa y NO la toma este archivo. Lo que sí hace este
 * archivo es no mentir: con `proposito="eleccion"` el rol de
 * accesibilidad deja de ser `tab` y pasa a `radio` — porque el desvío
 * es de LEY, no de semántica, y anunciar "pestaña" al que está
 * comprando sería un error aparte.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Anatomía (espec firmada): riel contenedor en superficie hundida
 * (bg.overlay) + 2-3 segmentos; el segmento ACTIVO es una superficie
 * apoyada sobre el riel con elevacion.reposo — el lenguaje del material
 * papel (Ley 20). Regla Chanel del marco cableada: el activo lleva
 * sombra, jamás borde. Texto solo en v1 (sin íconos, firmado): activo
 * en text.primary, inactivos en text.secondary — sans.medium en AMBOS
 * estados (el cambio de peso movería el layout). Tap area completa por
 * segmento (celda flex entera, alto ≥44).
 *
 * Resolución por tema del paso de luminancia del activo: claro =
 * bg.card (la superficie blanca). Dark/memorial no tienen superficie
 * MÁS clara que el riel en su escala: el activo usa border.default como
 * relleno (precedente del agarre de la Hoja: bg.border como fill
 * gráfico) + la sombra de contacto mínima de elevacion.reposo.
 *
 * Motion (criterio emil, código SM — la receta CSS-transition de
 * Reanimated de Boton/Tarjeta/Celda): la superficie activa SE DESLIZA
 * (translateX, duration.fast, easeOut) y la sombra viaja con ella; la
 * sombra JAMÁS se anima sola (Ley 6). Memorial: reemplazo directo, sin
 * deslizamiento — en memorial nada se desliza.
 *
 * Memorial y dosis prestador: EL MISMO componente, sin variante — no
 * porta color de capa (espec firmada).
 *
 * A11y: tablist con etiqueta; cada segmento tab con selected. El canal
 * semántico es accessibilityState.selected — la sombra es refuerzo.
 *
 * Escalera §4b: NO muestra datos del expediente — control de navegación
 * puro; los peldaños no aplican (declarado explícito en la espec).
 */

import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { MarcaEleccion, MONTA } from '../brand/MarcaEleccion'

// riel radius.md (12) − padding spacing[1] (4) = 8 → el activo es radius.sm
const RADIO_RIEL = radius.md
const RADIO_ACTIVO = radius.sm
const RELLENO_RIEL = spacing[1]
const ALTO_SEGMENTO = 40 // + relleno del riel = 48 de target táctil

export interface SelectorSegmentadoItem {
  codigo: string
  /** VOZ HUMANA — ej: "Próximos" (jamás el vocabulario interno del modelo). */
  etiqueta: string
}

export interface SelectorSegmentadoProps {
  /** 2 o 3 vistas exclusivas (Ley 19.3) — más de 3 no es un segmento, es otra pantalla. */
  segmentos: SelectorSegmentadoItem[]
  /** Código del segmento activo. La pantalla es dueña de la vista. */
  activo: string
  onCambio: (codigo: string) => void
  /** accessibilityLabel del grupo (el control no lleva label visible). */
  etiqueta: string
  /**
   * QUÉ TRABAJO HACE ESTE CONTROL. Default `'vista'` = el de siempre
   * (Ley 19.3), byte por byte: los consumidores viejos no cambian.
   *
   * `'eleccion'` = ELIGE UN PRODUCTO, no cambia de vista. Trae los dos
   * agregados que el founder firmó mirando —la letra de la elegida en
   * magenta y LA PATA pisándola— y, lo que no se ve pero es lo que más
   * importa, **cambia la semántica de accesibilidad**: pasa de
   * tablist/tab a radiogroup/radio. Un lector de pantalla que anuncia
   * "pestaña" cuando lo que estás haciendo es elegir qué comprar dice
   * algo falso, y eso no lo arregla ningún color.
   */
  proposito?: 'vista' | 'eleccion'
}

export function SelectorSegmentado({
  segmentos,
  activo,
  onCambio,
  etiqueta,
  proposito = 'vista',
}: SelectorSegmentadoProps) {
  const { theme } = useTheme()
  const [anchoRiel, setAnchoRiel] = useState(0)
  const eligiendo = proposito === 'eleccion'

  if (__DEV__ && (segmentos.length < 2 || segmentos.length > 3)) {
    console.warn(
      `SelectorSegmentado: ${segmentos.length} segmento(s) — el diccionario dice 2 o 3 (Ley 19.3).`,
    )
  }

  const esMemorial = theme.mode === 'memorial'
  const indiceActivo = segmentos.findIndex((s) => s.codigo === activo)
  const anchoSegmento = anchoRiel > 0 ? (anchoRiel - RELLENO_RIEL * 2) / segmentos.length : 0

  // Paso de luminancia del activo por tema (ver doc de cabecera)
  const superficieActiva = theme.mode === 'light' ? theme.bg.card : theme.border.default

  // ═══ EL AIRE DE LA PATA — la verificación de overflow, resuelta ACÁ ═══
  // La pata monta MONTA px sobre el canto superior del segmento activo, y
  // ese segmento vive a RELLENO_RIEL del borde del riel: la pata SE SALE
  // del riel por (MONTA − RELLENO_RIEL) px. Un contenedor que recorte —o
  // el elemento de arriba— se la come, y eso YA PASÓ una vez (el
  // ScrollView de FiltroPills con paddingTop 4 < MONTA 8: la pata salía
  // cortada por la mitad).
  //
  // LA DIFERENCIA CON AQUEL CASO, y es de diseño: allá el aire lo tuvo
  // que poner el CONSUMIDOR, porque los chips son el contenido de un
  // scroll. Acá la pieza es dueña de su caja, así que **el aire lo
  // reserva ella** — envuelve el riel y se lo cobra a sí misma. El
  // consumidor no tiene que saber que existe una pata, que es la única
  // forma de que el cuarto consumidor no se olvide.
  //
  // Solo cuando hay pata: en 'vista' el ritmo vertical queda intacto.
  const aire = eligiendo ? Math.max(0, MONTA - RELLENO_RIEL) : 0

  const riel = (
    <View
      accessibilityRole={eligiendo ? 'radiogroup' : 'tablist'}
      accessibilityLabel={etiqueta}
      onLayout={(e) => setAnchoRiel(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.bg.hundido,
        borderRadius: RADIO_RIEL,
        padding: RELLENO_RIEL,
      }}
    >
      {anchoSegmento > 0 && indiceActivo >= 0 ? (
        <Animated.View
          // decorativa: el canal semántico es selected en cada tab
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: RELLENO_RIEL,
              bottom: RELLENO_RIEL,
              left: RELLENO_RIEL,
              width: anchoSegmento,
              borderRadius: RADIO_ACTIVO,
              backgroundColor: superficieActiva,
              // regla Chanel del marco: sombra, jamás borde
              boxShadow: theme.elevacion.reposo,
              transform: [{ translateX: indiceActivo * anchoSegmento }],
            },
            // se desliza la SUPERFICIE y la sombra viaja con ella (Ley 6);
            // memorial: reemplazo directo, nada se desliza
            esMemorial
              ? null
              : {
                  transitionProperty: 'transform',
                  transitionDuration: motion.duration.fast,
                  transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
                },
          ]}
        />
      ) : null}

      {segmentos.map((s) => {
        const esActivo = s.codigo === activo
        return (
          <Pressable
            key={s.codigo}
            onPress={() => {
              if (!esActivo) onCambio(s.codigo)
            }}
            accessibilityRole={eligiendo ? 'radio' : 'tab'}
            accessibilityLabel={s.etiqueta}
            // `checked` es el canal del radio; `selected` el de la tab.
            // Mandar el que no corresponde deja el estado MUDO en el
            // lector — el rol y su estado viajan juntos o no viajan.
            accessibilityState={eligiendo ? { checked: esActivo } : { selected: esActivo }}
            style={{
              flex: 1,
              minHeight: ALTO_SEGMENTO,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: spacing[2],
            }}
          >
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.sm,
                // FIRMADO: eligiendo, la letra de la elegida va en el
                // acento del control (magenta). En 'vista' sigue en tinta
                // — cambiar de vista no es elegir, y el color lo dice.
                color: esActivo
                  ? eligiendo
                    ? theme.accent.control
                    : theme.text.primary
                  : theme.text.secondary,
              }}
            >
              {s.etiqueta}
            </Text>
            {/* LA PATA, hermana del label y NUNCA hija de una placa (R22):
                cuelga del segmento, no del glifo. Va acá y no sobre la
                superficie que se desliza a propósito — si viajara con el
                deslizamiento, una marca que se APOYA saldría patinando, y
                el −14° de apoyo dejaría de significar lo que significa. */}
            {eligiendo && esActivo ? <MarcaEleccion color={theme.accent.marcaEleccion} /> : null}
          </Pressable>
        )
      })}
    </View>
  )

  // el aire vive AFUERA del riel: adentro lo comería el padding y el
  // fondo hundido crecería con él (el riel se vería más alto sin serlo).
  return aire > 0 ? <View style={{ paddingTop: aire }}>{riel}</View> : riel
}
