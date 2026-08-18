/**
 * EL CHEVRON — la tabla ÚNICA de los tres estados del mismo glifo
 * (S83-B12). No es un ícono nuevo: es geometría compartida, y por eso
 * vive en un `.ts` sin componente, como `usePresionado`.
 *
 * POR QUÉ NACE: el mapa ya existía dentro de `FilaCita`, y su propio
 * JSDoc declaraba la intención — *"si algún día el trazo cambia, cambia
 * en un lugar"*. No estaba ocurriendo: el mismo trazo vivía en CUATRO
 * sitios (`CeldaNavegacion`, `FichaMascotaHogar`, el mapa de `FilaCita`
 * y `PieRevelar`), byte por byte iguales y sin nada que los atara. Al
 * ensanchar `CeldaNavegacion` con el vocabulario direccional, copiar el
 * mapa habría sido la QUINTA copia — exactamente lo que **L-175**
 * prohíbe (*se lee el registry y se ENSANCHA; jamás se copia*). Es el
 * mismo argumento con el que `DIRECCION_ARTE` §3 hizo canónica la
 * primitiva `Huella`: *nadie la redibuja*.
 *
 * EL CRITERIO DE CUÁL USAR ES **E14, YA FIRMADO**: información
 * DESPLIEGA (⌄ revela · ⌃ pliega, en el lugar) · acción LLEVA (› navega
 * a otra pantalla, o abre el formulario que la resuelve). La dirección
 * codifica una verdad del contenido (Ley 18) y por eso no tiene default
 * en las piezas de dominio: ahí se declara.
 *
 * ⚠️ NO SE EXPORTA desde `index.ts` a propósito: es geometría interna de
 * la casa, no API de las apps. Una pantalla que necesite un chevron usa
 * la PIEZA que lo porta (`CeldaNavegacion`, `PieRevelar`, `FilaCita`),
 * jamás el path suelto — que es el defecto que este archivo cierra.
 */

/** ⌄ y ⌃ despliegan en el lugar · › ‹ llevan a otro lado (E14).
 *
 *  ➕ S99-B · `izquierda` ENSANCHA la tabla, no la copia — que es lo que
 *  este archivo existe para que pase (L-175). Nace para la puerta
 *  hermana de las dos ventanas del HOY: **el espejo tiene que ser el
 *  MISMO trazo reflejado**, y si el de vuelta se dibujara aparte, el día
 *  que alguien afine el chevron afinaría medio espejo. Su `d` es el
 *  reflejo exacto de `derecha` sobre el eje vertical del viewBox de 24
 *  (x → 24−x), no un trazo nuevo a ojo. */
export type DireccionChevron = 'derecha' | 'izquierda' | 'abajo' | 'arriba'

export const CHEVRON: Record<DireccionChevron, string> = {
  derecha: 'M9 18l6-6-6-6',
  izquierda: 'M15 18l-6-6 6-6',
  abajo: 'M6 9l6 6 6-6',
  arriba: 'M6 15l6-6 6 6',
}

/* ══════════════════════════════════════════════════════════════════════
 * 🔴 LA PIEZA VIVE EN ESTE MISMO ARCHIVO, Y EL PORQUÉ ES DE LA CASA.
 *
 * Nació aparte, como `Chevron.tsx`, y **el typecheck lo rebotó en el
 * acto**: `Chevron.tsx` y `chevron.ts` **difieren solo en mayúsculas**, o
 * sea que en macOS son EL MISMO ARCHIVO. *En un sistema sensible a
 * mayúsculas habrían sido dos, y el defecto habría viajado sin síntoma
 * hasta el primer build ajeno.* (Y la trampa cobró DOS veces: al limpiar,
 * un `remove('Chevron.tsx')` se llevó el `chevron.tsx` recién escrito.)
 *
 * ⇒ **se juntan, y queda mejor que separado:** la tabla y su único
 * portador legítimo viven en el mismo lugar, así que la regla que este
 * archivo declara —*«el path no se exporta; se usa la pieza»*— **se
 * cumple desde adentro** en vez de depender de que nadie mire el `.ts`.
 * El import de los portadores vivos no cambia: `'./chevron'` no lleva
 * extensión.
 * ══════════════════════════════════════════════════════════════════════ */

import Svg, { Path } from 'react-native-svg'

import { useTheme } from '../ThemeProvider'

/** El tamaño de los tres portadores vivos. Se conserva idéntico: esta
 *  pieza NO afina el trazo, lo centraliza. */
const LADO = 20

export interface ChevronProps {
  /** SIN DEFAULT a propósito: E14 dice que la dirección codifica una
   *  verdad del contenido (Ley 18) — quien lo monta sabe si su gesto
   *  LLEVA o DESPLIEGA, y la pieza no puede adivinarlo. *Un default acá
   *  sería la pieza opinando sobre el contenido de la pantalla.* */
  direccion: DireccionChevron
  /** Override del color. Por defecto `text.tertiary`, el que los tres
   *  portadores vivos ya usan — no es una elección nueva: es el valor de
   *  la casa, puesto en un solo lugar por primera vez. */
  color?: string
  lado?: number
  /**
   * 🔴 **EL PESO DEL TRAZO — REGISTRO, no un `strokeWidth` suelto**
   * (S100d·bis, pedido de la pista C con su medición).
   *
   * **Firma del founder sobre el rótulo plegable de la ficha:** *«la flecha
   * en ocre, **más gruesa**»*.
   *
   * **C midió antes de pedir y frenó bien:** esta pieza acepta `color` y **no
   * aceptaba grosor** — el `strokeWidth` estaba tecleado adentro. *El trazo
   * del chevron es geometría compartida; este archivo existe justamente para
   * que nadie lo redibuje* (L-175). **Y pidió un REGISTRO y no un número, con
   * su razón:** *«un `strokeWidth` suelto invita a que cada pantalla elija el
   * suyo»*. **Tiene razón y por eso es una unión de dos palabras, no un
   * `number`.**
   *
   * · **`'fila'`** (default) — el chevron de una celda o una fila. 2.0.
   * · **`'seccion'`** — el que despliega un BLOQUE, junto a un rótulo de
   *   sección. **2.75**, para que pese lo que pesa su vecino tipográfico
   *   (`Texto variante="seccion"` es 20/Bold; un trazo de 2 al lado se lee
   *   como una nota al pie de su propio título).
   *
   * ⚠️ **El COLOR sigue siendo del consumidor** y con F-OCRE (N26 v2) el de
   * sección va en `accent.cta`: **la flecha que despliega ACCIONA.** *No es
   * una excepción a la ley: la ley se ensanchó el mismo día, con este caso
   * adentro.*
   */
  enfasis?: 'fila' | 'seccion'
  /**
   * 🔴 **EL TONO — el acento lo resuelve LA PIEZA, jamás la pantalla**
   * (S100d·bis, y lo pidió C **después de que mi propio lint la frenara**).
   *
   * **Le pasé un ejemplo con `color={theme.accent.cta}` y `verify:diseno` lo
   * rebotó:** *«Ley 21 · `accent.cta` re-resuelto en apps, baseline 0»*. **La
   * regla tenía razón y mi ejemplo estaba mal.** *Si cada superficie eligiera
   * su ocre, el día que la casa cambie el CTA quedarían dos.*
   *
   * ✅ **Y C hizo lo correcto con el rojo: no apagó la regla, no subió el
   * baseline y no tecleó un hex.** Pidió la pieza. *Un lint que se apaga para
   * que pase un caso deja de vigilar los otros.*
   *
   * · **`'neutro'`** (default) — `text.tertiary`, el de los tres portadores
   *   vivos. Cero cambio.
   * · **`'accion'`** — **el ocre de N26 v2**, resuelto acá adentro: *la flecha
   *   que despliega ACCIONA.*
   *
   * ⚠️ **`color` sigue existiendo y NO es la puerta del acento:** es para
   * cuando la flecha vive sobre una superficie que le cambia el contraste (un
   * muro, un canto). **Para decir «esto acciona» se usa `tono`** — la pantalla
   * declara QUÉ es la flecha; con qué color lo dice la casa, es de la casa.
   */
  tono?: 'neutro' | 'accion'
}

/** EL PORTADOR PARA SLOTS QUE NO SON UNA FILA ENTERA (S99-B).
 *
 *  Los tres portadores previos son filas completas (`CeldaNavegacion`,
 *  `PieRevelar`, `FilaCita`). **`DatoAdministrable` no es una fila: es un
 *  envoltorio transparente con un slot `senal`**, así que ninguno servía
 *  — y sin esta pieza la única salida era copiar el path: *la quinta
 *  copia, la que este archivo existe para impedir.* C no la dibujó a
 *  propósito y frenó bien.
 *
 *  ⚠️ **Por qué chevron y no el «lapicito» que el founder nombró** al ver
 *  que *«el precio y el stock se tocan, pero todavía no se VE que se
 *  tocan»*: su frase describe el SÍNTOMA con un candidato, y la casa ya
 *  tiene resuelto el vocabulario —**E14: información DESPLIEGA · acción
 *  LLEVA**, y esto lleva—. *Un lápiz sería una segunda señal para el
 *  mismo gesto. Lo que su queja pide —que se VEA— lo dan los dos; lo que
 *  decide es cuál ya significa eso en el resto del producto.* */
export function Chevron({ direccion, color, lado = LADO, enfasis = 'fila', tono = 'neutro' }: ChevronProps) {
  const { theme } = useTheme()
  return (
    /* `aria-hidden`: el chevron nunca es la etiqueta de nada — lo que un
       lector de pantalla anuncia es la ACCIÓN, y ésa la declara quien
       monta. Los tres portadores vivos ya lo ocultan igual. */
    <Svg width={lado} height={lado} viewBox="0 0 24 24" fill="none" aria-hidden>
      <Path
        d={CHEVRON[direccion]}
        /* El orden importa: un `color` explícito gana —es la salida para una
           superficie que cambia el contraste—, y si no lo hay manda el TONO,
           que es donde vive el acento de la casa. La pantalla nunca escribe
           el ocre. */
        stroke={color ?? (tono === 'accion' ? theme.accent.cta : theme.text.tertiary)}
        strokeWidth={enfasis === 'seccion' ? 2.75 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
