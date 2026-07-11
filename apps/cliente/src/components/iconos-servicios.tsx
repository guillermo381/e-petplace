/**
 * Íconos de las verticales de Explorar (S52-P5a) — Ley 12: outline
 * 1.75px, remates redondeados, UN color por ícono (la pantalla entrega
 * el hex PURO de su capa como registro gráfico).
 */

import Svg, { Circle, Path } from 'react-native-svg';

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

/** Paseo — la huella en camino. */
export function IconoServicioPaseo({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        d="M12 12.6c2.1 0 3.9 1.5 4.4 3.5.3 1.1-.7 2.1-1.8 2.1-.9 0-1.7-.4-2.6-.4s-1.7.4-2.6.4c-1.1 0-2.1-1-1.8-2.1.5-2 2.3-3.5 4.4-3.5Z"
        {...stroke(color)}
      />
      <Circle cx={6.8} cy={11} r={1.4} {...stroke(color)} />
      <Circle cx={10} cy={8.4} r={1.4} {...stroke(color)} />
      <Circle cx={14} cy={8.4} r={1.4} {...stroke(color)} />
      <Circle cx={17.2} cy={11} r={1.4} {...stroke(color)} />
      <Path d="M4 21c2.5-1.2 5-1.2 8 0s5.5 1.2 8 0" {...stroke(color)} />
    </Svg>
  );
}

/** Estética y baño — la gota y el brillo. */
export function IconoServicioGrooming({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M12 3.5c3 3.8 5.5 6.8 5.5 10a5.5 5.5 0 0 1-11 0c0-3.2 2.5-6.2 5.5-10Z" {...stroke(color)} />
      <Path d="M9.5 13.8a2.8 2.8 0 0 0 2.3 2.9" {...stroke(color)} />
    </Svg>
  );
}

/** Veterinaria — la cruz de cuidado. */
export function IconoServicioVet({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        d="M12 21s-7.5-4.4-7.5-10A4.5 4.5 0 0 1 12 7.6 4.5 4.5 0 0 1 19.5 11c0 5.6-7.5 10-7.5 10Z"
        {...stroke(color)}
      />
      <Path d="M12 10.4v5M9.5 12.9h5" {...stroke(color)} />
    </Svg>
  );
}

/** Adiestramiento — la estrella que se gana. */
export function IconoServicioAdiestramiento({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        d="m12 4 2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5L4.8 9.3l5-.7L12 4Z"
        {...stroke(color)}
      />
    </Svg>
  );
}
