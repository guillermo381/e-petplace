/**
 * Íconos de la BarraTabs del dueño — REDISEÑADOS al lenguaje b′
 * (S53, DIRECCION_ARTE §2.6): en reposo SOLO trazo; la tab activa se
 * marca porque su HUELLA APARECE (la barra entrega colorHuella ya
 * resuelto por tema — accent.active; memorial degrada). Trazo 1.9,
 * remates redondeados, cero figuras humanas (§2.4: la cuenta es la
 * PLACA del collar, no una persona).
 *
 * Sin hooks: la barra los llama como función (contrato BarraTabsItem).
 */

import Svg, { Circle, Path } from 'react-native-svg';
import { Huella } from '@epetplace/ui';

const trazo = (color: string) => ({
  stroke: color,
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

type EstadoTab = { color: string; activa: boolean; colorHuella: string };

/** Hogar — la casa; activa: la huella aparece adentro (hay mascota en casa). */
export function IconoHogar({ color, activa, colorHuella }: EstadoTab) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M3.5 10.5 12 3.5l8.5 7" {...trazo(color)} />
      <Path d="M5.8 9.7V19a1.4 1.4 0 0 0 1.4 1.4h9.6a1.4 1.4 0 0 0 1.4-1.4V9.7" {...trazo(color)} />
      {activa ? <Huella color={colorHuella} x={7.9} y={10.6} escala={0.34} /> : null}
    </Svg>
  );
}

/** Explorar — la brújula; activa: la aguja cede a la huella (§2.9: simplificar). */
export function IconoExplorar({ color, activa, colorHuella }: EstadoTab) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.8} {...trazo(color)} />
      {activa ? (
        <Huella color={colorHuella} x={7.4} y={7.4} escala={0.38} />
      ) : (
        <Path d="m15.4 8.6-2 5-5 2 2-5Z" {...trazo(color)} />
      )}
    </Svg>
  );
}

/** Cuenta — la placa del collar (cero figuras humanas, §2.4); activa: la huella grabada. */
export function IconoCuenta({ color, activa, colorHuella }: EstadoTab) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={5.1} r={1.9} {...trazo(color)} />
      <Circle cx={12} cy={13.8} r={6.9} {...trazo(color)} />
      {activa ? <Huella color={colorHuella} x={7.9} y={9.7} escala={0.34} /> : null}
    </Svg>
  );
}
