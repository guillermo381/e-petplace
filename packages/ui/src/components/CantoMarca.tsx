/**
 * CantoMarca — la voz de la casa al borde de su propia carta (S81-B;
 * promoción del Svg local de S81-C `bienvenida-dia1`, que migra al
 * tocarse — D-318).
 *
 * LA LEY (§9.1 DOS CANTOS, DOS VOCES — firmada): canto de CAPA = tu
 * trabajo y de qué oficio (vive en FilaCita, POR CATEGORÍA, Ley 10);
 * canto de MARCA = "acá te habla e-PetPlace". **Nunca en la misma
 * tarjeta.** Rampa turquesa→magenta SIEMPRE (§8.4, dirección fijada),
 * 3px, vertical. El censo FIRMADO le da CINCO sitios en el portal
 * (`PORTAL` §2.3 bienvenida · §2.5 aspiracional · §2.7 hitos · §3.3
 * Día 30 · §4 graduación) — cinco encargos es pieza, no copia.
 *
 * §8.3: la marca vive en la FIRMA y en los MOMENTOS, jamás en la
 * herramienta — quien lo monte fuera de un sitio del censo está
 * rompiendo la ley, no usando el componente.
 *
 * Composición: barra que estira a la altura del portador
 * (`alignSelf: 'stretch'`) — el consumidor la pone en una fila junto
 * al cuerpo que la voz abraza. Presentacional puro, cero props: el
 * ancho (3) y la rampa son LEY, no opciones.
 *
 * Memorial degrada (Ley 8: memorial sin gradiente, la marca no
 * celebra): barra sólida en text.secondary — presente, serena.
 */

import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'

const ANCHO = 3

export function CantoMarca() {
  const { theme } = useTheme()

  if (theme.mode === 'memorial') {
    return (
      <Svg width={ANCHO} style={{ alignSelf: 'stretch', borderRadius: radius.full }}>
        <Rect x={0} y={0} width={ANCHO} height="100%" fill={theme.text.secondary} />
      </Svg>
    )
  }

  return (
    <Svg width={ANCHO} style={{ alignSelf: 'stretch', borderRadius: radius.full }}>
      <Defs>
        <LinearGradient id="cantoMarcaUi" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.teal} />
          <Stop offset="1" stopColor={palette.pink} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={ANCHO} height="100%" fill="url(#cantoMarcaUi)" />
    </Svg>
  )
}
