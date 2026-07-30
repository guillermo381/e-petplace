/**
 * MarcaDeAgua — EL PAPEL TAPIZ (S82-B r10, orden founder: "el isotipo
 * vive sobre ese fondo al 4-6%… el tinte y el agua son UNA pieza, no
 * dos"; y en r10: "VA EN TODAS LAS PANTALLAS — nace como pieza del
 * fondo compartido, NO override por pantalla").
 *
 * Es FONDO, no contenido: `pointerEvents="none"`, posición absoluta que
 * cubre a su padre, isotipo en tinta al `opacity.marcaDeAgua` (0.06 —
 * el número FIRMADO del Hogar; ver el token). Centrado y CORTADO por
 * los bordes a propósito: un isotipo que se sale del marco se lee como
 * textura del papel, no como logo puesto ahí.
 *
 * POR QUÉ NACE EN packages/ui Y NO POR PANTALLA: hasta hoy vivía
 * copiada en dos pantallas del cliente y **ya se había separado** —
 * 0.06 en el Hogar contra 0.04 en el perfil (hallazgo r8). Una pieza
 * del fondo que se copia se desincroniza; esta existe para que el
 * número viva una sola vez.
 *
 * MEMORIAL LA APAGA (Ley 8: memorial no se decora — el papel tapiz es
 * ornamento y memorial es sobriedad). El tema oscuro NO la recibe
 * todavía: el tinte del fondo se encendió SOLO en claro (voto (a)
 * ratificado por el founder en r9 §3), y un agua sin su tinte sería la
 * mitad de la pieza.
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

/** SANGRADA — FIRMADA por el founder en galería (S82-B r15). El isotipo
 *  se sobredimensiona al 150% del ancho de pantalla para que la silueta
 *  SALGA por los cuatro bordes: sin silueta cerrada no identifica, y por
 *  eso se lee TEXTURA y no marca. Se deriva de la PANTALLA y no es un
 *  número fijo — en un teléfono angosto tiene que sangrar igual.
 *  LA VARIANTE COMPLETA MURIÓ con su trabajo hecho (Ley 37): existió
 *  para que el gate pudiera comparar, y la comparación ya ocurrió. */
const FACTOR_SANGRADA = 1.5

export function MarcaDeAgua() {
  const { theme } = useTheme()
  const { width } = useWindowDimensions()
  // Memorial: la pieza no se monta (Ley 8 — degrada sola, en la fuente).
  if (theme.mode === 'memorial') return null
  const tamano = Math.round(width * FACTOR_SANGRADA)
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
        // La sangrada desborda a propósito: sin overflow visible el
        // recorte lo hace el padre, que es exactamente lo que se busca
        // (los cuatro bordes cortan la silueta).
        overflow: 'hidden',
        opacity: opacity.marcaDeAgua,
      }}
    >
      <Isotipo size={tamano} variant="tinta" color={theme.text.primary} />
    </View>
  )
}
