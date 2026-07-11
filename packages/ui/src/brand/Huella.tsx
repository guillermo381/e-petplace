/**
 * Huella — LA primitiva del lenguaje b′ (S53, DIRECCION_ARTE §2.2).
 *
 * Forma canónica: almohadilla en elipse + TRES dedos, RELLENA. Este
 * es el único lugar donde la huella existe — NADIE la redibuja a mano:
 * todo ícono la importa y la coloca (x, y, escala) dentro de su grilla
 * 24×24. El color lo decide el consumidor según la ley del ícono
 * (hex puro de capa como gráfica; AA/tinta en dosis prestador;
 * text.secondary en memorial).
 *
 * A escala 1 la huella ocupa la grilla completa (24×24 con aire).
 * Se renderiza como <G> DENTRO de un <Svg viewBox="0 0 24 24">.
 */

import { Ellipse, G } from 'react-native-svg'

/** Lado de la caja de diseño de la huella a escala 1. */
export const HUELLA_BOX = 24

export function Huella({
  color,
  escala = 1,
  x = 0,
  y = 0,
}: {
  color: string
  /** 1 = ocupa la grilla 24 completa; los íconos usan 0.35–0.5. */
  escala?: number
  /** Esquina superior-izquierda de la caja de la huella en la grilla del ícono. */
  x?: number
  y?: number
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${escala})`}>
      {/* almohadilla */}
      <Ellipse cx={12} cy={15.7} rx={5.7} ry={4.7} fill={color} />
      {/* dedo central */}
      <Ellipse cx={12} cy={5.9} rx={2.8} ry={3.5} fill={color} />
      {/* dedos laterales, abanicados */}
      <Ellipse cx={5.7} cy={8.3} rx={2.5} ry={3.2} fill={color} transform="rotate(-24 5.7 8.3)" />
      <Ellipse cx={18.3} cy={8.3} rx={2.5} ry={3.2} fill={color} transform="rotate(24 18.3 8.3)" />
    </G>
  )
}
