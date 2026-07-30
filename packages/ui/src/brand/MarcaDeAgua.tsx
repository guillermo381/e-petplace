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
 * ⚠️ LEY 4 — LAS DOS LECTURAS, NINGUNA RESUELTA ACÁ (el literal lo
 * trajo A: el isotipo está FUERA de la contabilidad de dosis pero con
 * límite DURO de UNO POR PANTALLA). Con el agua en todas + el del techo
 * ya son DOS, y con el que el founder pide al lado del título, TRES:
 *
 *   (A) EL AGUA ES UN ISOTIPO ⇒ la ley MUERDE y hace falta ENMIENDA (o
 *       el techo cede el suyo, o el agua no va). Es la lectura literal:
 *       la forma es la de la marca y su centrado es intencional.
 *   (B) EL AGUA NO ES UN ISOTIPO, ES TEXTURA ⇒ no entra a la cuenta y la
 *       Ley 4 queda INTACTA, cero enmienda. El argumento: al 6% y
 *       cortada por los cuatro bordes no IDENTIFICA — no tiene silueta
 *       cerrada, ni escala legible, ni contorno propio; funciona como
 *       material del papel (parentesco en la casa: el Guijarro es
 *       ilustración §4, no identidad).
 *
 * **LA (B) EXIGE UNA ANATOMÍA QUE LA CALIBRACIÓN HEREDADA NO TIENE, y
 * ese es el hallazgo:** el 210 centrado de la lámina S82-C se ve
 * COMPLETO en una pantalla de 390×844 — silueta cerrada, o sea marca.
 * Para que "textura" sea verdad y no un adjetivo, el agua tiene que
 * SANGRAR (`sangrada`, la variante sobredimensionada de abajo). De cuál
 * elija el founder en el gate depende cuál lectura aplica: la completa
 * empuja a (A) —enmienda—, la sangrada habilita (B) —ley intacta—.
 * Las dos viven en la galería, comparables. Nadie lo da por sentado.
 */

import { useWindowDimensions, View } from 'react-native'

import { Isotipo } from './Isotipo'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'

/** COMPLETA — la calibración heredada de la lámina S82-C r2 (size 210 ≈
 *  340 de ancho por el ratio del viewBox). Silueta cerrada y visible:
 *  es la que empuja la lectura (A) de la Ley 4. */
const TAMANO_COMPLETA = 210
/** SANGRADA — sobredimensionada al 150% del ancho de pantalla para que
 *  la silueta SALGA por los cuatro bordes: es la anatomía que el
 *  argumento "textura, no marca" necesita para ser verdad (lectura B).
 *  Se deriva de la pantalla, no es un número fijo: en un teléfono
 *  angosto tiene que sangrar igual. */
const FACTOR_SANGRADA = 1.5

export function MarcaDeAgua({ sangrada = false }: { sangrada?: boolean }) {
  const { theme } = useTheme()
  const { width } = useWindowDimensions()
  // Memorial: la pieza no se monta (Ley 8 — degrada sola, en la fuente).
  if (theme.mode === 'memorial') return null
  const tamano = sangrada ? Math.round(width * FACTOR_SANGRADA) : TAMANO_COMPLETA
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
