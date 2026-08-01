/**
 * MarcaDeAgua — EL PAPEL TAPIZ (S82-B r10, orden founder: "el isotipo
 * vive sobre ese fondo al 4-6%… el tinte y el agua son UNA pieza, no
 * dos"; y en r10: "VA EN TODAS LAS PANTALLAS — nace como pieza del
 * fondo compartido, NO override por pantalla").
 *
 * Es FONDO, no contenido: `pointerEvents="none"`, posición absoluta que
 * cubre a su padre, isotipo en tinta al `opacity.marcaDeAgua` (0.06 —
 * el número FIRMADO del Hogar; ver el token). Centrado y ENTERO: el
 * founder firmó en S83-B22 la receta que corre en el Hogar, contra las
 * tres variantes que cortaban ("la idea es que se vea, suave, en marca
 * de agua, pero no cortado"). Ver `FACTOR_ENTERA`.
 *
 * POR QUÉ NACE EN packages/ui Y NO POR PANTALLA: hasta hoy vivía
 * copiada en dos pantallas del cliente y **ya se había separado** —
 * 0.06 en el Hogar contra 0.04 en el perfil (hallazgo r8). Una pieza
 * del fondo que se copia se desincroniza; esta existe para que el
 * número viva una sola vez.
 *
 * MEMORIAL LA APAGA (Ley 8: memorial no se decora — el papel tapiz es
 * ornamento y memorial es sobriedad). CORRECCIÓN S83 (la prosa decía "el
 * tema oscuro NO la recibe todavía" y era falso: el único `return null`
 * es el de memorial). El oscuro SÍ la recibe, y desde S82-B r33 tiene su
 * tinte en las dos casas — la premisa de aquella nota venció.
 *
 * ⚠️ LEY 4 — LA RESOLUCIÓN DE S82-B r15 QUEDA EN DUDA POR LA FIRMA NUEVA.
 * Lo que sigue es el argumento de entonces, que se apoyaba en la variante
 * SANGRADA; con el agua ENTERA su premisa ("cortada no identifica") ya no
 * se cumple, y por eso la Ley 4 vuelve a la mesa. Se conserva el texto
 * porque explica QUÉ se está reabriendo:
 *
 * ✅ LEY 4 — RESUELTA SIN ENMIENDA (firma founder, S82-B r15). El literal
 * (que trajo A) dice: el isotipo está FUERA de la contabilidad de dosis
 * pero con límite DURO de UNO POR PANTALLA — y el agua + el techo eran
 * dos. La salida no fue enmendar la ley: fue que **el agua no es un
 * isotipo**. Al 6% y cortada por los cuatro bordes no IDENTIFICA (no hay
 * silueta cerrada, ni escala legible, ni contorno propio): funciona como
 * material del papel — parentesco en la casa: el Guijarro es ilustración
 * §4, no identidad. **La Ley 4 queda INTACTA y el agua no entra a su
 * cuenta.** Lo que hizo verdadero el argumento fue la ANATOMÍA: la
 * variante completa (210 centrado) se veía entera y se leía marca; el
 * founder firmó la SANGRADA mirando las dos.
 */

import { useWindowDimensions, View } from 'react-native'

import { Isotipo } from './Isotipo'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'

/** ENTERA — FIRMA DEL FOUNDER (S83-B22), que ENMIENDA la de S82-B r15.
 *  Su letra: *"no puedes copiar cómo quedó en cliente? Allí quedó bien"*,
 *  y antes, sobre las tres sangradas: *"todos cortan el isotipo; la idea
 *  es que se vea, suave, en marca de agua, pero no cortado"*.
 *
 *  LA SANGRADA MUERE con su trabajo hecho (Ley 37) y esta nota conserva
 *  su porqué, porque la ENMIENDA arrastra un argumento: la sangrada
 *  existía para que la silueta NO cerrara —"sin silueta cerrada no
 *  identifica, y por eso se lee textura y no marca"—, y ése fue el
 *  argumento que dejó la LEY 4 INTACTA. Una silueta ENTERA sí identifica.
 *  ⚠️ **La Ley 4 (un isotipo por pantalla) vuelve a la mesa**: agua +
 *  isotipo del techo son DOS. Es firma del founder, no de esta pieza.
 *
 *  EL NÚMERO: la receta que corre en el Hogar es `size 210` FIJO. Se
 *  conserva su RESULTADO y se cura su robustez —lo único que la orden
 *  autorizó a proponer—: 210 en una pantalla de 390 hace que el isotipo
 *  ocupe el **78 %** del ancho, y ese mismo 210 en una de 320 ocupa el
 *  **96 %**, que es rozar. El factor derivado que reproduce el 210 EXACTO
 *  a 390 px es **0.536** (210 = 390 × 0.536), y mantiene ese 78 % en
 *  cualquier ancho. Es ajuste de robustez, no de diseño: en el teléfono
 *  del gate se ve idéntico. */
const FACTOR_ENTERA = 0.536

/** LAS TRES PROPS DEL GATE (S83-B9) — **todas opcionales y con default
 *  EXACTAMENTE igual al comportamiento de producción**: montadas sin
 *  pasar nada, la pieza es byte por byte la de hoy. Nacen porque el gate
 *  de la casa verde tiene que hacerse sobre LA PIEZA REAL y no sobre un
 *  clon de galería — un clon se desincroniza, que es la razón por la que
 *  esta pieza existe (ver arriba: 0.06 contra 0.04, hallazgo r8).
 *  ☠️ MUERTE: cuando el founder firme, la variante ganadora se vuelve el
 *  default y **las props que nadie use se borran en el mismo acto** — la
 *  API de una lámina no sobrevive a su lámina (Ley 37). */
export function MarcaDeAgua({
  color,
  rampa = false,
  alfa,
  tamano,
}: {
  /** Override del color de la tinta. Default: `theme.text.primary`.
   *  Mecanismo S61-B8 (la prop `color` de `Isotipo`, nacida por letra del
   *  founder para el isotipo en tealDark). */
  color?: string
  /** `true` = la RAMPA del isotipo. Default false = tinta plana, que es
   *  lo que rige. **Es la variante que §15b.2 prohíbe en el prestador**
   *  ("cero gradiente en toda la app"): se monta para que el founder VEA
   *  lo que esa letra prohibió antes de decidir si lo sostiene. */
  rampa?: boolean
  /** Override del alfa. Default: `opacity.marcaDeAgua` (0.06, firmado). */
  alfa?: number
  /** Tamaño FIJO en px. Default: derivado de la pantalla (`FACTOR_ENTERA`
   *  0.536), que reproduce el 210 del Hogar a 390 px y lo preserva en
   *  cualquier ancho. Existe para montar en galería las anatomías que
   *  corren inline en las apps y compararlas contra la pieza — sin esto
   *  el gate compara contra un fantasma. */
  tamano?: number
} = {}) {
  const { theme } = useTheme()
  const { width } = useWindowDimensions()
  // Memorial: la pieza no se monta (Ley 8 — degrada sola, en la fuente).
  if (theme.mode === 'memorial') return null
  const lado = tamano ?? Math.round(width * FACTOR_ENTERA)
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        // El recorte se CONSERVA como red, no como intención: la firma
        // nueva pide que NO corte y el factor 0.536 lo garantiza en
        // cualquier ancho. Queda por si algún consumidor pasa un `tamano`
        // mayor que su contenedor — ahí el padre recorta en vez de que la
        // silueta se derrame sobre el contenido.
        overflow: 'hidden',
        opacity: alfa ?? opacity.marcaDeAgua,
      }}
    >
      {rampa ? (
        <Isotipo size={lado} variant="gradiente" />
      ) : (
        <Isotipo size={lado} variant="tinta" color={color ?? theme.text.primary} />
      )}
    </View>
  )
}
