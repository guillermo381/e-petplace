/**
 * Íconos de la BarraTabs del prestador — LENGUAJE b′ COMPLETO (S58,
 * micro-pedido founder: cableado al lote D-361 del registry, ea7e8e4).
 * Geometría COPIADA LITERAL del set FIRMADO en packages/ui/Icono.tsx
 * (precedente S57: IconoCuenta viajó igual desde el cliente) — en tabs
 * el estado lo entrega BarraTabs (§2.6): en reposo SOLO trazo; la tab
 * activa se marca porque su HUELLA APARECE en colorHuella. El rezago
 * pre-b′ de Hoy/Negocio (D-318) MUERE acá; Mascotas ya cumplía (ES la
 * primitiva Huella — revisado contra ley en ea7e8e4).
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

/** Hoy — el sol del oficio (registry b′); activa: el día lleva su huella. */
export function IconoHoy({ color, activa, colorHuella }: EstadoTab) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4.6} {...trazo(color)} />
      <Path
        d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"
        {...trazo(color)}
      />
      {activa ? <Huella color={colorHuella} x={9.3} y={9.5} escala={0.32} /> : null}
    </Svg>
  );
}

/** Mascotas — LA huella (la primitiva ES el ícono; activa hereda el acento). */
export function IconoMascotas({ color, activa, colorHuella }: EstadoTab) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Huella color={activa ? colorHuella : color} x={2} y={2} escala={0.84} />
    </Svg>
  );
}

/** Negocio — el maletín del oficio (registry b′); activa: con su huella. */
export function IconoNegocio({ color, activa, colorHuella }: EstadoTab) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M4.4 8.6h15.2V18a1.5 1.5 0 0 1-1.5 1.5H5.9A1.5 1.5 0 0 1 4.4 18Z" {...trazo(color)} />
      <Path d="M9.4 8.6V6.9a1.9 1.9 0 0 1 1.9-1.9h1.4a1.9 1.9 0 0 1 1.9 1.9v1.7" {...trazo(color)} />
      {activa ? <Huella color={colorHuella} x={8.7} y={10.7} escala={0.4} /> : null}
    </Svg>
  );
}

/** Cuenta — la chapita del collar (registry b′, cero figuras humanas §2.4). */
export function IconoCuenta({ color, activa, colorHuella }: EstadoTab) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={5.6} r={1.9} {...trazo(color)} />
      <Circle cx={12} cy={13.6} r={6.6} {...trazo(color)} />
      {activa ? <Huella color={colorHuella} x={8.9} y={10.6} escala={0.38} /> : null}
    </Svg>
  );
}
