/**
 * Íconos de la BarraTabs del prestador (S51-B3.1) — Ley 12: outline
 * 1.75px, remates redondeados, UN color (lo entrega BarraTabs).
 */

import Svg, { Circle, Path } from 'react-native-svg';

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

/** Hoy — el sol de la jornada. */
export function IconoHoy({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4.2} {...stroke(color)} />
      <Path
        d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3"
        {...stroke(color)}
      />
    </Svg>
  );
}

/** Mascotas — la huella. */
export function IconoMascotas({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M12 11.5c2.6 0 4.8 1.9 5.4 4.4.3 1.4-.8 2.6-2.2 2.6-1.1 0-2.1-.5-3.2-.5s-2.1.5-3.2.5c-1.4 0-2.5-1.2-2.2-2.6.6-2.5 2.8-4.4 5.4-4.4Z"
        {...stroke(color)}
      />
      <Circle cx={5.5} cy={9.5} r={1.7} {...stroke(color)} />
      <Circle cx={9.5} cy={6.3} r={1.7} {...stroke(color)} />
      <Circle cx={14.5} cy={6.3} r={1.7} {...stroke(color)} />
      <Circle cx={18.5} cy={9.5} r={1.7} {...stroke(color)} />
    </Svg>
  );
}

/** Negocio — el maletín. */
export function IconoNegocio({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M4.5 8.5h15a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z" {...stroke(color)} />
      <Path d="M9 8.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2.5M3.5 13h17" {...stroke(color)} />
    </Svg>
  );
}
