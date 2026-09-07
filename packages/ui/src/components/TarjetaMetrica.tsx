/**
 * TARJETA DEL TABLERO — dato grande, contexto, y su dibujo (S113-B · 2.2).
 *
 * La pieza que repite el tablero seis veces: peso, vacunas, antiparasitario,
 * medicación, citas, actividad. **Una sola pieza y no seis** — *seis tarjetas
 * parecidas divergen, y la que se cure primero deja a las otras cinco
 * diciendo otra cosa.*
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **SIN DATO NO HAY GRÁFICO, Y ESO ES ESTRUCTURAL.**
 * ═══════════════════════════════════════════════════════════════════════════
 * Un sparkline con **un** punto dibuja una recta horizontal, y esa recta dice
 * *«estuvo estable»* — una afirmación que nadie hizo. Con menos de dos puntos
 * el dibujo **no se monta** y la tarjeta se queda con su dato y su contexto,
 * que siguen siendo ciertos. *Una lista que no sabe algo lo deja en blanco y
 * se nota; un gráfico que no sabe algo dibuja una línea plana, y una línea
 * plana se lee como una medición.*
 *
 * ── 🔴 EL DATO AUSENTE NO SE AGRANDA (19.9) ─────────────────────────────
 * `valor: null` ⇒ la tarjeta dibuja su **voz de ausencia en apoyo**, no en
 * display. *Salió de mirar el perfil real: «Sin fecha de refuerzo» presidía
 * con el mismo peso que un «24 kg» medido, y la pantalla igualaba «lo
 * medimos» con «no lo sabemos».*
 *
 * ── LOS CUATRO DIBUJOS, Y NINGUNO ES UN CHART GENÉRICO ──────────────────
 * `sparkline` (la serie) · `anillo` (n de N) · `barras` (la semana, reusando
 * `BarrasSemana`) · `chips` (por plaga). **Sin ejes, sin leyendas, sin
 * tooltips**: son señales, no gráficos — quien quiere el detalle toca.
 *
 * ── ⛔ MEMORIAL: SIN DIBUJO, LA TARJETA QUEDA ───────────────────────────
 * El dato de una vida que terminó **sigue siendo cierto y se puede consultar**;
 * lo que se apaga es la señal que empuja a actuar. *No se le borra la historia
 * a nadie — se deja de pedirle cosas.*
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El tablero del perfil (C). **Entregada y no montada** — medido.
 */

import { Pressable, Text, View } from 'react-native'
import Svg, { Circle, Polyline } from 'react-native-svg'

import { BarrasSemana } from './BarrasSemana'
import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'
import { Chevron } from './chevron'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { fraccionDelAnillo, hayLineaQueDibujar, margenDeTrazo, puntosDeLinea, radioDeAnillo } from './tablero-metrica'

/* ⚠️ **EL LIENZO ES UN `viewBox`, NO PÍXELES**, y ésa es la diferencia entre
   una tarjeta que aguanta y una que se rompe. ⏪ El SVG medía 96 de ancho
   FIJO: en la columna angosta —dos tarjetas por fila— el número grande y el
   gráfico sumaban más que el ancho útil y **el dibujo salía de la tarjeta**.
   Medido en el emulador a dos densidades, no supuesto.
   Hoy el `Svg` va a `width="100%"` dentro de una caja que **encoge**, y el
   viewBox mantiene la proporción: *el dibujo se adapta al lugar que sobra en
   vez de exigir el suyo.* */
const LIENZO = { ancho: 96, alto: 28, grosor: 2 }
const ANILLO = { lado: 40, grosor: 4 }
/* El aire visible entre el trazo y el borde de su caja, ADEMÁS del medio
   grosor que el trazo se lleva por estar centrado en su camino. */
const AIRE = 2

/**
 * 🔴 **CADA DIBUJO TRAE LO QUE NECESITA Y NADA MÁS.** Una interfaz con
 * `serie?`, `hechos?`, `total?`, `valores?` y `chips?` deja escribir una
 * tarjeta con anillo y serie a la vez, y ahí alguien tiene que decidir cuál
 * gana — una decisión que nadie firmó.
 */
export type DibujoMetrica =
  | { tipo: 'sparkline'; serie: readonly number[] }
  | { tipo: 'anillo'; hechos: number; total: number }
  /* ⚠️ `valores` va MUTABLE y no `readonly`, y no es un descuido: es la firma
     que `BarrasSemana` ya tiene. *Declararlo `readonly` acá obligaría a copiar
     el arreglo en cada render sólo para satisfacer a esta pieza* — y el que
     manda es el contrato de la que dibuja. */
  | {
      tipo: 'barras'
      valores: number[]
      /** 🔴 La exige `BarrasSemana`, y bien: *siete rectángulos sin resumen no
       *  le dicen nada a quien no ve la pantalla.* La compone la pantalla
       *  («3 paseos esta semana»), no la pieza (Ley 3). */
      etiqueta: string
    }
  | { tipo: 'chips'; chips: readonly { id: string; texto: string; alDia: boolean | null }[] }

interface MetricaBase {
  /** *«Peso»* — el rótulo, ya redactado. */
  rotulo: string
  /**
   * 🔴 **EL GLIFO DEL OFICIO, para «Tus servicios» (S113-B · 3.1).**
   *
   * ⏪ Ese rail se dibujaba **inline**, con su propia anatomía: rótulo grande
   * arriba y un dato en mono debajo que **truncaba tres de cuatro tarjetas**
   * («Adiestramien…», «07 sept 20…», «Ve…») y mostraba **una unidad distinta
   * en cada una sin decir cuál** — una fecha, «63 salidas», «28…».
   *
   * **No nació una pieza nueva: se ensanchó ésta** (`L-175`, se ensancha jamás
   * se copia). *Dos piezas con la misma anatomía divergen al primer cambio, y
   * la que se queda vieja es siempre la que nadie está mirando.*
   *
   * Ausente = la tarjeta del tablero de siempre, sin un píxel de diferencia.
   */
  glifo?: IconoNombre
  /**
   * El dato grande. **`null` = no lo sabemos**, y entonces se dibuja `vozSinDato`
   * en apoyo: *un dato ausente no se agranda.*
   */
  valor: string | null
  /** *«Sin registro»* — obligatoria: el hueco se dice, no se deja en blanco. */
  vozSinDato: string
  /** *«medido el 04 sept 2026»* — una línea, ya redactada. */
  contexto?: string
  dibujo?: DibujoMetrica
}

/**
 * 🔴 **LAS DOS FORMAS, Y LA SEGUNDA NO SE TOCA.**
 *
 * · **viva** — exige `onPress`: *una tarjeta de tablero que no lleva a ningún
 *   lado es un número que la familia va a tocar igual, y el toque que no hace
 *   nada enseña que la pantalla está rota.*
 * · **v2** — Descanso y Corazón, que llegan **con el collar**. Atenuada, con
 *   **borde punteado** y **sin `onPress`**: el punteado es lo que dice «esto
 *   todavía no es» sin escribir una fecha. *Anuncia sin prometer* — y el tipo
 *   impide darle un destino, que es como se prometería sin querer.
 *
 * ⚠️ La v2 **tampoco lleva dibujo**: no hay serie que mostrar. Su `valor` es
 * la voz de lo que va a medir, no un número.
 */
export type TarjetaMetricaProps = (MetricaBase & {
  /** 🔴 Ancho FIJO para un rail horizontal. Ausente = grilla. Ver `piel`. */
  ancho?: number
}) &
  (
    | { onPress: () => void; v2?: never }
    | { v2: true; onPress?: never; dibujo?: never }
  )

export function TarjetaMetrica(props: TarjetaMetricaProps) {
  const { theme } = useTheme()
  const { rotulo, valor, vozSinDato, contexto } = props
  const esMemorial = theme.mode === 'memorial'
  const esV2 = props.v2 === true
  const dibujo = esV2 ? undefined : props.dibujo

  const piel = {
    /* 🔴 **DOS ANCHOS, UNA ANATOMÍA.** En la grilla del tablero la tarjeta
       crece y comparte fila (`flex: 1` + media columna); en un rail horizontal
       eso no significa nada —no hay fila que repartir— y hace falta una medida.
       *Un `flex: 1` dentro de un scroll horizontal no falla: colapsa, y se ve
       como una tarjeta que se olvidó de su contenido.* */
    ...(props.ancho === undefined
      ? { flex: 1, minWidth: '45%' as const }
      : { width: props.ancho }),
    gap: spacing[1],
    padding: spacing[4],
    borderRadius: radius.md,
    backgroundColor: theme.bg.card,
    /* 🔴 El punteado dice «esto todavía no es» sin escribir una fecha. */
    ...(esV2
      ? {
          backgroundColor: 'transparent',
          borderWidth: theme.border.width,
          borderStyle: 'dashed' as const,
          borderColor: theme.border.subtle,
          opacity: 0.65,
        }
      : {}),
  }

  const cuerpo = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[1] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexShrink: 1 }}>
          {/* El glifo del oficio, cuando lo hay. `montaje="control"` apaga su
              huella: *cuatro rótulos con cuatro patitas al lado convierten una
              fila de estado en una fila de mascotas.* */}
          {props.glifo === undefined ? null : (
            <Icono nombre={props.glifo} tamano={18} registro="tinta" montaje="control" />
          )}
          {/* 🔴 El rótulo NO trunca: es el que dice de qué es la tarjeta.
              *Un «Adiestramien…» obliga a tocar para saber qué se contrató.* */}
          <Texto variante="apoyo">{rotulo}</Texto>
        </View>
        {esV2 ? null : <Chevron color={theme.text.tertiary} direccion="derecha" />}
      </View>

      {/* El dato y su dibujo comparten fila: el número a la izquierda, la
          señal a la derecha-abajo. *Apilados, el gráfico empuja el contexto
          fuera de la tarjeta en la columna angosta.*

          🔴 **SALVO LOS CHIPS, y lo dijo el emulador:** son texto y crecen a lo
          ancho — al lado del dato quedaban CORTADOS («garrapat…») y encimados.
          *Un gráfico ocupa lo que se le da; una tira de palabras ocupa lo que
          necesita, y en media columna no entra.* Van debajo, a todo el ancho. */}
      <View
        style={
          dibujo?.tipo === 'chips'
            ? { gap: spacing[1] }
            : { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing[2] }
        }
      >
        {/* 🔴 El dato grande SÓLO si existe. Ver la cabecera. */}
        {valor === null ? (
          <Texto variante="apoyo">{vozSinDato}</Texto>
        ) : (
          /* 18 px con cifras tabulares, dibujado con el token y no con una
             quinta variante de `Texto` — precedente `TresNumeros`, y su
             propia cabecera argumenta contra la variante nueva. Tabular
             porque es un número: sin eso, dos tarjetas con distinta cifra
             mueven su punto decimal.

             ⏪ **Bajó de 22 a 18 (orden del founder), y no era sólo peso
             visual: a 22 el número más el gráfico no entraban en la columna
             angosta y el dibujo salía de la tarjeta.**

             🔴 `flexShrink: 0` — **el número JAMÁS se achica ni se corta.**
             *La cifra es el contenido; el dibujo es la señal.* Cuando no
             entran los dos, el que cede es el dibujo, y por eso el que
             encoge es su caja y no ésta. */
          <Text
            style={{
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.metrica,
              color: theme.text.primary,
              fontVariant: ['tabular-nums'],
              flexShrink: 0,
            }}
          >
            {valor}
          </Text>
        )}
        {/* ⛔ En memorial la tarjeta conserva su dato y pierde la señal. */}
        {dibujo === undefined || esMemorial ? null : <Dibujo dibujo={dibujo} />}
      </View>

      {/* 🔴 La línea de contexto a **11** (orden del founder), con el token
          `xs` y un `<Text>` propio — es el patrón que la casa ya usa para 11
          (`BarraTabs`, `ClipSesion`, `CitaEnVivo`, `BurbujaPendientes`), no
          una variante nueva. *Es metadata: acompaña al dato, no compite.*
          A 14 la segunda línea pesaba lo mismo que el rótulo y la tarjeta se
          leía como tres cosas en vez de una. */}
      {contexto !== undefined ? (
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.xs,
            lineHeight: 15,
            color: theme.text.secondary,
          }}
        >
          {contexto}
        </Text>
      ) : null}
    </>
  )

  /* 🔴 La v2 NO es un `Pressable` apagado: no es tocable en absoluto. *Un
     botón deshabilitado invita a tocarlo y después no hace nada.* */
  if (esV2) return <View style={piel}>{cuerpo}</View>

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={contexto === undefined ? `${rotulo} · ${valor ?? vozSinDato}` : `${rotulo} · ${valor ?? vozSinDato} · ${contexto}`}
      onPress={props.onPress}
      style={piel}
    >
      {cuerpo}
    </Pressable>
  )
}

function Dibujo({ dibujo }: { dibujo: DibujoMetrica }) {
  const { theme } = useTheme()

  if (dibujo.tipo === 'sparkline') {
    /* 🔴 Menos de dos puntos NO se dibuja. Ver la cabecera. */
    if (!hayLineaQueDibujar(dibujo.serie)) return null
    /* 🔴 El margen se DERIVA del grosor (`margenDeTrazo`) y no se elige: un
       número a ojo se queda viejo el día que el trazo engorde. */
    const margen = margenDeTrazo(LIENZO.grosor) + AIRE
    const puntos = puntosDeLinea(dibujo.serie, LIENZO.ancho, LIENZO.alto, margen)
    return (
      /* 🔴 **LA CAJA QUE CEDE.** `flexShrink: 1` con `maxWidth` = el lienzo:
         nunca crece más que su medida natural y **encoge todo lo que haga
         falta** para que el número entre entero. El `minWidth` es el piso
         donde una línea todavía dice algo — más chico que eso no es un
         gráfico, es un guión, y entonces vale más el aire. */
      <View style={{ flexShrink: 1, flexGrow: 1, maxWidth: LIENZO.ancho, minWidth: 36 }}>
        <Svg
          width="100%"
          height={LIENZO.alto}
          viewBox={`0 0 ${LIENZO.ancho} ${LIENZO.alto}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <Polyline
            points={puntos.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={theme.accent.control}
            strokeWidth={LIENZO.grosor}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    )
  }

  if (dibujo.tipo === 'anillo') {
    const r = radioDeAnillo(ANILLO.lado, ANILLO.grosor, AIRE)
    const vuelta = 2 * Math.PI * r
    const hecho = fraccionDelAnillo(dibujo.hechos, dibujo.total) * vuelta
    return (
      <Svg
        width={ANILLO.lado}
        height={ANILLO.lado}
        viewBox={`0 0 ${ANILLO.lado} ${ANILLO.lado}`}
      >
        {/* El aro de fondo dice cuánto es el total: sin él, un anillo a medias
            no se distingue de uno chico. */}
        <Circle
          cx={ANILLO.lado / 2}
          cy={ANILLO.lado / 2}
          r={r}
          stroke={theme.bg.hundido}
          strokeWidth={ANILLO.grosor}
          fill="none"
        />
        <Circle
          cx={ANILLO.lado / 2}
          cy={ANILLO.lado / 2}
          r={r}
          stroke={theme.accent.control}
          strokeWidth={ANILLO.grosor}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${hecho} ${vuelta}`}
          /* Arranca arriba y no a la derecha: un anillo que empieza a las 3 se
             lee como si ya tuviera un cuarto hecho. */
          transform={`rotate(-90 ${ANILLO.lado / 2} ${ANILLO.lado / 2})`}
        />
      </Svg>
    )
  }

  if (dibujo.tipo === 'barras') {
    /* Reusa la pieza que ya existe: siete barras, valores reales, sin
       inventar el día que no hubo. *Una segunda tira de barras en la casa
       divergiría de ésta al primer cambio.* */
    return <BarrasSemana valores={dibujo.valores} capa="cuidado" etiqueta={dibujo.etiqueta} />
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1] }}>
      {dibujo.chips
        /* 🔴 Una plaga SIN REGISTRO no dibuja chip: *un chip gris se lee como
           «no está al día», y no sabemos si lo está.* */
        .filter((c) => c.alDia !== null)
        .map((c) => (
          <View
            key={c.id}
            style={{
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[0.5],
              borderRadius: radius.full,
              backgroundColor: theme.bg.hundido,
            }}
          >
            <Texto variante="apoyo" color={c.alDia === true ? 'success' : 'warning'}>
              {c.texto}
            </Texto>
          </View>
        ))}
    </View>
  )
}
