/**
 * PuertaHermana — LA PUERTA ENTRE DOS VENTANAS HERMANAS (S99-B · pedido
 * de D, contrato acordado sin enmienda).
 *
 * ═══════════════════════════════════════════════════════════════════
 * POR QUÉ ES PIEZA Y NO DOS ARMADOS LOCALES, con el argumento de D
 * porque es el correcto: **si cada pantalla la arma sola, el espejo se
 * rompe la primera vez que alguien cura una sola.**
 *
 * No es hipotético. `FichaPrestador` nació del mismo defecto y su
 * cabecera lo dice medido: la copia *«YA MINTIÓ DOS VECES EN UN MES»*.
 * Dos armados que hoy coinciden **coinciden por copia**, que es la forma
 * más frágil de coincidir — no hay nada que los ate.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── EL ESPEJO ES LA PIEZA, Y POR ESO `direccion` DERIVA TODO ────────
 * La pantalla declara **adónde va**; jamás compone el orden ni elige el
 * chevron. Con `'derecha'` el chevron va después de la etiqueta; con
 * `'izquierda'`, antes — y el trazo sale de la **tabla única**
 * (`chevron.ts`), donde `izquierda` nació como el reflejo exacto de
 * `derecha`, no como un dibujo aparte.
 *
 * *Si el orden fuera del consumidor, «espejo» sería una intención. Acá
 * es una consecuencia: no hay forma de montarla torcida.*
 *
 * ── ① EL CONTADOR — LA DECISIÓN CAMBIÓ, Y LOS DOS LITERALES QUEDAN ──
 * 🔴 **ENMENDADA POR FIRMA DE LA MESA (S99, 15-ago-2026): LA PUERTA
 * LLEVA CONTADOR.** *Dos letras firmadas que se contradicen son peores
 * que una equivocada —cualquiera cita la que le conviene y está «en
 * regla»— así que la vieja se conserva ENTERA y se dice qué la
 * reemplaza* (precedente: el magenta S83, la plata S83 y S88).
 *
 * **La letra vieja, de D, verbatim:** *«NO lleva contador. Dos razones,
 * la segunda es la fuerte: un número tendría que ser verdad **del día
 * que el selector compartido está mostrando**, y sostener eso obliga a
 * cada ventana a traer los datos de la otra solo para pintar una cifra —
 * el viaje que N16 existe para eliminar, en la pantalla donde D-738 se
 * midió. Y sobre todo: la puerta es un LUGAR, no un aviso. Un contador
 * la vuelve badge, y un badge en 0 es peor que ninguno: un cero pintado
 * se lee como ausencia, y acá la ausencia es del día, no del lugar.
 * ☠️ CANDIDATA DECLARADA, no prohibida.»*
 *
 * **La letra nueva, de la mesa:** cuenta **lo NO VISTO** · puede llegar
 * a cero · simetría en las dos puertas · **cero = ausencia de insignia,
 * jamás un cero dibujado**.
 *
 * **Y NO gana por ser más nueva: la razón de D SE DISUELVE.** Él midió
 * bien **otra cantidad** — su objeción vale entera contra *«los pedidos
 * DEL DÍA que el selector muestra»*, que sí obliga a traer el rango de
 * la ventana hermana. **Lo NO VISTO no tiene día:** es un número suelto,
 * no una consulta sobre el rango del otro ⇒ **el viaje que él quería
 * evitar no aparece.** Su segunda razón no se refuta: **se cumple** —
 * con `0` acá no se dibuja absolutamente nada, que es lo que pedía.
 * *Su candidata no esperaba a que las dos ventanas leyeran el mismo
 * rango: esperaba a que alguien nombrara bien la cantidad.*
 *
 * ── POR QUÉ NO ES UN `Badge`, habiendo uno en la casa ───────────────
 * Se intentó consumirlo primero (L-175: se ensancha, jamás se copia). No
 * entra, por dos motivos MEDIDOS: **① su anatomía es otra** — `Badge` se
 * posa sobre un ícono (`children` + `position:absolute`), y **la puerta
 * no tiene ícono**: forzarlo sería inventarle un glifo para tener dónde
 * colgar el número. **② su forma `contador` es ROJA** — monta
 * `Insignia estado="atencion"`, y ese estado resuelve a `danger`. **Un
 * pedido esperando no es un error**, que es la misma frase con la que la
 * propia cabecera de `Badge` se prohíbe el rojo. Una pill roja acá sería
 * exactamente **la mancha** que el founder nombró y **la alarma** que la
 * mesa prohibió. Dos anatomías, dos piezas.
 *
 * **② NO tiene estado deshabilitado ni vacío**, y esto es de ley.
 *    La **Ley 23** prohíbe ofrecer *lo que se va a rechazar*; una ventana
 *    hermana sin trabajo **no rechaza nada** — existe, tiene su vacío
 *    honesto y su propio selector de día. Apagarla **dejaría a alguien
 *    sin poder llegar a su propia ventana justo el día que no tiene
 *    trabajo, que es cuando más quiere mirarla.** Y para saberlo habría
 *    que traer los datos de la otra: el mismo peaje del contador, pagado
 *    para apagar un control.
 *
 * **③ NO decide si se monta.** Que la puerta exista es composición por
 *    CAPACIDAD (quien tiene las dos naturalezas la ve; quien tiene una
 *    sola, no) y vive en el consumidor. La pieza dibuja la puerta; quién
 *    la merece no es asunto suyo.
 *
 * ── LA ALTURA Y EL AIRE VIVEN ACÁ (Ley 8) ──────────────────────────
 * Blanco de 44 y el aire adentro. **Ningún consumidor los re-decide** —
 * si la altura la pusiera cada pantalla, las dos mitades del espejo
 * podrían diferir en píxeles y nadie lo vería hasta cruzar.
 *
 * ── LA FORMA DEL CONTADOR: EL REGISTRO, JAMÁS LA PINTURA ────────────
 * El número es **mono tabular 13 en `text.primary`** — el registro que
 * la Ley 3 reserva para *dato que produjo una máquina*, que es
 * exactamente lo que un conteo es. La etiqueta es **sans medium 13 en
 * `text.secondary`** ⇒ el número queda distinguido por **familia, peso
 * y color a la vez, sin una gota de acento y sin una caja.**
 * *La jerarquía sale del registro tipográfico, no de pintura.*
 *
 * **Lo descartado, con su razón:** `accent.active` abriría un par nuevo
 * de WCAG (texto a 13px ⇒ piso 4.5:1) para agregar **cero información**
 * · una caja violaría 19.8 (*se contornea lo que se FIJA*: un conteo se
 * lee, no se fija) y lo disfrazaría de control adentro de un control ·
 * y **nada anima** (Ley 6: la novedad se dice con PRESENCIA).
 *
 * **REGLA DE EXISTENCIA — y resuelve sola la única ambigüedad de la
 * forma:** con `sinVer <= 0` no se dibuja nada (ni pill, ni «0», ni
 * hueco). De ahí sale por qué el número **va solo, sin palabra al
 * lado**: un total estaría siempre; éste aparece y desaparece ⇒
 * ***LA APARICIÓN ES EL SIGNIFICADO*** — un número que a veces no está
 * solo puede querer decir «hay algo nuevo». La palabra vive en la voz de
 * a11y, donde no cuesta ancho, y así la puerta queda corta —que es lo
 * que necesita para poder espejarse.
 */

import { useState } from 'react'
import { Pressable, Text } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { CHEVRON } from './chevron'
import { motion } from '../tokens/motion'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

/** Blanco de 44 — ley de la pieza (N8). */
const ALTURA_MIN = 44
const LADO_CHEVRON = 20

export interface PuertaHermanaProps {
  /** La voz del DESTINO, en palabras del consumidor ("Tus pedidos de
   *  hoy"). La pieza no la compone ni le agrega flechas de texto: el
   *  chevron ya dice la dirección. */
  etiqueta: string
  /** Adónde lleva. De acá derivan el chevron, el orden Y el lado del
   *  contador — ver cabecera. */
  direccion: 'derecha' | 'izquierda'
  /** CUÁNTO HAY SIN VER del otro lado. **Requerida A PROPÓSITO, y no es
   *  rigor de más:** con una prop opcional la asimetría más probable no
   *  es que una puerta pinte distinto — es que **una la pase y la otra se
   *  olvide**, y eso solo se descubre cruzando, que es justo el modo de
   *  falla que esta pieza existe para cerrar. Requerida, las dos mitades
   *  están obligadas a decidir, y `0` es una respuesta legítima que no
   *  dibuja nada. *Se hizo obligatoria el día que salía gratis —un solo
   *  consumidor, la galería—; después ya no se puede.*
   *
   *  ⚠️ **La pieza NO decide qué es «visto»** (quién lo marca, cuándo y
   *  contra qué): recibe un número. Esa definición es de A y de D, y se
   *  declara acá porque el riesgo real es que nadie la fije y el número
   *  termine siendo «los de hoy» sin que nadie lo haya decidido — que es
   *  exactamente la cantidad cuya objeción D midió bien. */
  sinVer: number
  onPress: () => void
}

export function PuertaHermana({ etiqueta, direccion, sinVer, onPress }: PuertaHermanaProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const [presionada, setPresionada] = useState(false)

  const chevron = (
    <Svg width={LADO_CHEVRON} height={LADO_CHEVRON} viewBox="0 0 24 24" fill="none" aria-hidden>
      <Path
        d={CHEVRON[direccion]}
        stroke={theme.text.tertiary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )

  /** El conteo, o nada. Va PEGADO a la etiqueta del lado del chevron —
   *  y eso lo deriva `direccion` junto con el orden, así que el espejo
   *  se mantiene por construcción y no por cuidado. */
  const contador =
    sinVer > 0 ? (
      <Text
        style={{
          fontFamily: typography.family.mono.regular,
          fontSize: typography.size.sm,
          color: theme.text.primary,
          fontVariant: ['tabular-nums'],
        }}
        // El número se anuncia DENTRO del label del tocable (abajo);
        // leerlo también acá lo diría dos veces.
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {sinVer}
      </Text>
    ) : null

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPresionada(true)}
      onPressOut={() => setPresionada(false)}
      accessibilityRole="button"
      accessibilityLabel={sinVer > 0 ? t('puertaHermana.sinVer', { etiqueta, n: sinVer }) : etiqueta}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          /** El espejo, en una línea: la puerta se apoya en el borde al
           *  que lleva. La de ida queda a la derecha, la de vuelta a la
           *  izquierda — y **eso no es estética: es lo que hace que el
           *  dedo vuelva al mismo lugar del que salió.** */
          justifyContent: direccion === 'derecha' ? 'flex-end' : 'flex-start',
          gap: spacing[1.5],
          minHeight: ALTURA_MIN,
          paddingHorizontal: spacing[3],
          // pressed 0.99 — la receta única de la casa (diccionario S57)
          transform: [{ scale: presionada ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        {direccion === 'izquierda' ? chevron : null}
        {direccion === 'izquierda' ? contador : null}
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.sm,
            color: theme.text.secondary,
            // Sin esto el `numberOfLines` no encoge: el default de un
            // ítem flex es `min-width: auto` (la misma trampa que S97
            // midió en `Celda`, con el nombre truncado a «Z…»).
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          {etiqueta}
        </Text>
        {direccion === 'derecha' ? contador : null}
        {direccion === 'derecha' ? chevron : null}
      </Animated.View>
    </Pressable>
  )
}

/** El alto que la puerta reserva — quien la monta lo necesita para
 *  calcular el aire de su ventana en vez de estimarlo (mismo criterio
 *  que `ALTO_PIE_CAMPO` y `LADO_PIN`). */
export const ALTO_PUERTA_HERMANA = ALTURA_MIN
