/**
 * Íconos de Explorar PRE-b′ (S52-P5a) — SOLO queda adiestramiento:
 * paseo/grooming/vet migraron al set b′ (S53, Icono de @epetplace/ui).
 * Este también migra cuando el lote 2 lo dibuje (D-318).
 */

import Svg, { Path } from 'react-native-svg';

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

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
