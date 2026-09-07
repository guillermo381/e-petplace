/**
 * LA HUELLA DEL VÍNCULO — cinco almohadillas, cero números (S113-B · 2.2.2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL ANILLO MURIÓ, Y CON ÉL TODA FORMA DE CONTAR.**
 * ═══════════════════════════════════════════════════════════════════════════
 * Decisión del founder. Antes había un anillo que avanzaba, y aunque su
 * porcentaje nunca se dibujó, *un arco que se llena ES un número con otra
 * ropa: se lee «voy por la mitad», y el día que retroceda —porque una
 * dimensión deja de tener dato— la familia va a sentir que perdió algo.*
 *
 * La huella no cuenta: **dice qué sabemos**. Cinco almohadillas, una por
 * dimensión, cada una **pintada si esa dimensión tiene algo** y **en contorno
 * si todavía no**. Una huella con tres llenas no es «60 %»: es una huella a
 * la que le faltan dos cosas, y cuáles.
 *
 * ── 🔴 EL TIPO RECIBE CINCO BOOLEANOS Y NADA MÁS ────────────────────────
 * No hay `fraccion`, ni `hechos`, ni `total`. **No es prolijidad: es que un
 * número que no entra no puede salir.** *Mientras la pieza reciba una
 * cantidad, alguien la va a imprimir el día que quiera «ser más claro» — y ahí
 * una familia pasa a ser una barra de progreso que puede bajar.*
 * (`MODELO_LOYALTY` §3.) Su gate lo mide: cero aritmética, cero `.length`,
 * cero `filter`, y ningún `Texto` adentro.
 *
 * ── 🔴 CADA DIMENSIÓN TIENE SU ALMOHADILLA, SIEMPRE LA MISMA ────────────
 * El orden es **fijo y nombrado**, no un arreglo. *Si las llenas se acomodaran
 * de a una desde la izquierda, la huella diría cuántas y no cuáles* — que es
 * volver a contar por la puerta de atrás. **`identidad` es la almohadilla
 * grande**, la de abajo: es sobre lo que se apoya todo lo demás; las otras
 * cuatro son los dedos, de izquierda a derecha.
 *
 * ── LA FORMA SALE DE LA CASA, Y SU DIVERGENCIA VA DECLARADA ─────────────
 * Las elipses son **las de `Huella`** (`brand/Huella.tsx`) — mismas
 * proporciones de almohadilla y dedo. ⚠️ **Pero la huella canónica b′ tiene
 * TRES dedos** (`DIRECCION_ARTE` §2.2: *«almohadilla + tres dedos»*) **y ésta
 * abre CUATRO**, porque las dimensiones son cinco y cada una necesita la suya.
 *
 * *No es una licencia: es que esto NO es la marca.* La huella b′ es identidad
 * y vive rellena, de un solo color, dentro de un ícono de 24; ésta es un
 * **diagrama** que se lee lleno-contra-vacío. La casa ya tiene el precedente
 * de abrir cuatro dedos donde el significado lo pide —`PresenciaCoach` los
 * llama así—. **Se declara para que nadie la confunda con el isotipo ni la
 * «corrija» a tres el día que cuente los dedos.**
 *
 * ── ACCESIBILIDAD: LA VOZ ESTÁ AL LADO ──────────────────────────────────
 * La pieza **no lleva label**: quien no ve la pantalla necesita *«sabemos esto,
 * falta esto otro»*, y eso lo dice la voz que la acompaña, en palabras. *Un
 * label que dijera «tres de cinco llenas» sería el número entrando por el
 * único lugar donde nadie lo estaba mirando.*
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * `TarjetaConociendolo`, que es su único consumidor y le da la voz.
 */

import { Ellipse, Svg } from 'react-native-svg'

import { useTheme } from '../ThemeProvider'

/** La caja de diseño, igual que la de `Huella`. */
const CAJA = 24
/** El trazo del contorno. Se dibuja centrado, así que come medio a cada lado. */
const TRAZO = 1.6

/**
 * 🔴 **LAS CINCO DIMENSIONES, POR NOMBRE.** Un `boolean[]` habría sido más
 * corto y habría dejado pasar dos cosas que acá son imposibles: mandar cuatro
 * o seis, y —peor— reordenarlas sin que nada se queje. *Una almohadilla que
 * cambia de dimensión entre dos renders convierte el dibujo en decoración.*
 */
export interface DimensionesDelVinculo {
  /** Quién es: nombre, especie, raza, fecha, foto. La almohadilla GRANDE. */
  identidad: boolean
  /** Vacunas, desparasitación, lo clínico. */
  salud: boolean
  /** Peso, talla, lo que se mide. */
  cuerpo: boolean
  /** Rasgos, miedos, lo que lo hace único. */
  caracter: boolean
  /** Rutina, comida, paseos: cómo vive. */
  diaADia: boolean
}

export interface HuellaDelVinculoProps {
  /** 🔴 Cinco booleanos. **No entra ningún número** — ver la cabecera. */
  dimensiones: DimensionesDelVinculo
  /** El lado en px. Default 56. */
  tamano?: number
}

export function HuellaDelVinculo({ dimensiones, tamano = 56 }: HuellaDelVinculoProps) {
  const { theme } = useTheme()

  /* Lleno: el acento pleno. Vacío: contorno del mismo acento, **no gris** —
     *un contorno gris se lee como «apagado» o «no disponible», y esto no está
     apagado: está esperando.* */
  const pintado = (lleno: boolean) =>
    lleno
      ? { fill: theme.accent.control, stroke: 'none' as const }
      : { fill: 'none' as const, stroke: theme.accent.control, strokeWidth: TRAZO }

  return (
    <Svg width={tamano} height={tamano} viewBox={`0 0 ${CAJA} ${CAJA}`}>
      {/* La almohadilla grande — IDENTIDAD, y va abajo porque es el piso: sin
          saber quién es, lo demás no se apoya en nada. Proporción de `Huella`. */}
      <Ellipse cx={12} cy={16.6} rx={5.7} ry={4.7} {...pintado(dimensiones.identidad)} />

      {/* Los cuatro dedos, de izquierda a derecha y SIEMPRE en este orden.
          Tamaño de dedo de `Huella` (rx 2.5 · ry 3.2); el abanico se reparte
          entre cuatro en vez de tres. */}
      <Ellipse cx={4.5} cy={10.2} rx={2.5} ry={3.2} transform="rotate(-34 4.5 10.2)" {...pintado(dimensiones.salud)} />
      <Ellipse cx={9.3} cy={5.6} rx={2.5} ry={3.2} transform="rotate(-12 9.3 5.6)" {...pintado(dimensiones.cuerpo)} />
      <Ellipse cx={14.7} cy={5.6} rx={2.5} ry={3.2} transform="rotate(12 14.7 5.6)" {...pintado(dimensiones.caracter)} />
      <Ellipse cx={19.5} cy={10.2} rx={2.5} ry={3.2} transform="rotate(34 19.5 10.2)" {...pintado(dimensiones.diaADia)} />
    </Svg>
  )
}
