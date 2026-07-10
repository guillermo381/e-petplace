/**
 * Íconos de la BarraTabs del dueño (S51-B2.1) — Ley 12: outline 1.75px,
 * remates redondeados, UN color (lo entrega BarraTabs según estado).
 */

import Svg, { Circle, Path } from 'react-native-svg';

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

/** Hogar — la casa. */
export function IconoHogar({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M3 10.5 12 3l9 7.5" {...stroke(color)} />
      <Path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" {...stroke(color)} />
      <Path d="M9.5 21v-6a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6" {...stroke(color)} />
    </Svg>
  );
}

/** Explorar — la brújula. */
export function IconoExplorar({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} {...stroke(color)} />
      <Path d="m15.5 8.5-2 5-5 2 2-5Z" {...stroke(color)} />
    </Svg>
  );
}

/** Cuenta — la persona. */
export function IconoCuenta({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={3.5} {...stroke(color)} />
      <Path d="M5 20c.8-3.2 3.6-5 7-5s6.2 1.8 7 5" {...stroke(color)} />
    </Svg>
  );
}
