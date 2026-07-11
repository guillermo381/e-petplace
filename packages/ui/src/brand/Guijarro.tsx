/**
 * Guijarro — el lenguaje de ILUSTRACIÓN de la casa (S53, DIRECCION_ARTE
 * §4, primer uso real): forma orgánica irregular (JAMÁS círculo
 * perfecto) en el tinte suave de su capa, con el motivo en trazo
 * encima. Cada instancia se rota distinto (prop `rotacion`) — dos
 * guijarros iguales en la misma vista es contra la ley.
 *
 * Solo superficies GRANDES (EstadoVacio, heros, Hojas educativas,
 * cards de índice). Jamás celdas densas, tabs ni chips.
 * Memorial degrada: tinte a bg.overlay (sin capa).
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { useTheme } from '../ThemeProvider'

export type GuijarroCapa = 'identidad' | 'cuidado' | 'comunidad' | 'comunidadAmplia'

// LA forma canónica (24 box): blob asimétrico de curvas suaves.
const BLOB =
  'M12.6 2.1c3.6-.4 7.4 1.3 9 4.4 1.5 2.9 1 6.7-.6 9.7-1.6 3.1-4.4 5.4-7.9 5.7-3.4.3-6.9-1.4-8.7-4.3-1.7-2.8-1.7-6.5-.2-9.5C5.7 5.1 9 2.5 12.6 2.1Z'

export function Guijarro({
  capa,
  tamano = 56,
  rotacion = 0,
  children,
}: {
  capa: GuijarroCapa
  tamano?: number
  /** grados — cada guijarro de una vista se rota DISTINTO (§4). */
  rotacion?: number
  /** el motivo en trazo, centrado encima. */
  children?: ReactNode
}) {
  const { theme } = useTheme()
  const tinte = 'capaBg' in theme ? theme.capaBg[capa] : theme.bg.overlay

  return (
    <View style={{ width: tamano, height: tamano, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={tamano}
        height={tamano}
        viewBox="0 0 24 24"
        style={{ position: 'absolute', transform: [{ rotate: `${rotacion}deg` }] }}
      >
        <Path d={BLOB} fill={tinte} />
      </Svg>
      {children}
    </View>
  )
}
