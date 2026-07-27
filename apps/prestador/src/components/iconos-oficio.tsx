/**
 * Íconos de OFICIO para la Hoja del miembro (S78-B) — LENGUAJE b′.
 *
 * Geometría COPIADA LITERAL del set FIRMADO en `packages/ui/Icono.tsx`
 * (`veterinaria` :72 · `grooming` :82 · `paseo` :63 · `training` :221) y la
 * primitiva `Huella` IMPORTADA — nadie la redibuja (DIRECCION_ARTE Ley 2).
 * PRECEDENTE DECLARADO: `iconos-tabs.tsx` de este mismo app hizo exactamente
 * esto en S58, y antes `IconoCuenta` viajó igual desde el cliente (S57).
 *
 * POR QUÉ LOCAL Y NO `<Icono>`: la composición firmada en el gate S78 pide
 * **trazo y huella en colores INDEPENDIENTES** (encendido: trazo
 * `text.primary` + huella en el teal del oficio · apagado: los dos en
 * `text.tertiary`). `Icono` resuelve el color de la huella ADENTRO por
 * `registro`, y sus tres registros dan: hex puro de capa (arcoíris),
 * funcional AA (arcoíris) o el MISMO color del trazo. Ninguno produce
 * "trazo tinta + huella teal", y el arcoíris de capas contradice §15b.1
 * (el prestador tiene UN acento: el teal del oficio).
 *
 * ⇒ DEUDA DECLARADA, no escondida: esto es el CUARTO componente local de
 * glifos sobre el muro de `packages/ui` (familia D-535). La cura de raíz es
 * una prop de huella en `Icono` — territorio de A, pedida y NO tocada acá.
 *
 * El CONTROL DE ESTADO no es un glifo b′ (no es objeto de oficio + huella):
 * es una affordance de selección, y la casa no tenía una circular. Nace acá
 * con la composición que la pidió.
 */

import Svg, { Circle, Path } from 'react-native-svg';
import { Huella } from '@epetplace/ui';

import type { OficioChip } from '@epetplace/api';

const trazo = (color: string) => ({
  stroke: color,
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

type Pincel = {
  /** Color del objeto del oficio. */
  color: string;
  /** Color de la huella — INDEPENDIENTE del trazo (esa es la razón de este módulo). */
  colorHuella: string;
  tamano?: number;
};

/** El estetoscopio ESCUCHA a la huella (registry :72). */
function IconoVeterinaria({ color, colorHuella, tamano = 27 }: Pincel) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      <Path d="M7.2 3v3.5a4.8 4.8 0 0 0 9.6 0V3" {...trazo(color)} />
      <Path d="M12 11.3v2.1c0 2.8-1 4.8-3.1 4.8" {...trazo(color)} />
      <Circle cx={6.6} cy={18.2} r={2.3} {...trazo(color)} />
      <Huella color={colorHuella} x={12.6} y={12.4} escala={0.46} />
    </Svg>
  );
}

/** Las tijeras trabajan; la huella espera al costado (registry :82). */
function IconoGrooming({ color, colorHuella, tamano = 27 }: Pincel) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      <Path d="M11.8 4.6 6.4 14.2" {...trazo(color)} />
      <Path d="M6.8 4.6l5.4 9.6" {...trazo(color)} />
      <Circle cx={5.2} cy={16.6} r={2.4} {...trazo(color)} />
      <Circle cx={13.4} cy={16.6} r={2.4} {...trazo(color)} />
      <Huella color={colorHuella} x={13.8} y={9.2} escala={0.42} />
    </Svg>
  );
}

/** La correa cae hasta la huella — la mascota tirando (registry :63). */
function IconoPaseo({ color, colorHuella, tamano = 27 }: Pincel) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      <Circle cx={17} cy={5.4} r={2.5} {...trazo(color)} />
      <Path d="M16.7 7.8c1.1 3.4-2.7 4.6-5.8 5.4" {...trazo(color)} />
      <Huella color={colorHuella} x={1.6} y={12.2} escala={0.47} />
    </Svg>
  );
}

/** El silbato del adiestrador (registry :221 — el que MATÓ la estrella). */
function IconoAdiestramiento({ color, colorHuella, tamano = 27 }: Pincel) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      <Circle cx={9} cy={14.2} r={4.6} {...trazo(color)} />
      <Path d="M9.6 9.6h9.2a1.2 1.2 0 0 1 1.2 1.2v2l-5.6 1.6" {...trazo(color)} />
      <Huella color={colorHuella} x={6.5} y={11.6} escala={0.32} />
    </Svg>
  );
}

/** El glifo del oficio, PELADO (sin contenedor) — 27px por la composición firmada. */
export function IconoOficio({ oficio, ...pincel }: Pincel & { oficio: OficioChip }) {
  if (oficio === 'veterinaria') return <IconoVeterinaria {...pincel} />;
  if (oficio === 'grooming') return <IconoGrooming {...pincel} />;
  if (oficio === 'paseo') return <IconoPaseo {...pincel} />;
  return <IconoAdiestramiento {...pincel} />;
}

/**
 * El control de estado de la tarjeta de servicio (24px).
 * Encendido: círculo lleno en el acento del oficio con el check en papel.
 * Apagado: círculo vacío de 1px — dice "se puede encender", sin gritar.
 * Presentacional puro: el toque lo maneja la tarjeta entera.
 */
export function ControlEstado({
  encendido,
  colorEncendido,
  colorBorde,
  colorCheck,
  tamano = 24,
}: {
  encendido: boolean;
  colorEncendido: string;
  colorBorde: string;
  colorCheck: string;
  tamano?: number;
}) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      <Circle
        cx={12}
        cy={12}
        r={11}
        fill={encendido ? colorEncendido : 'none'}
        stroke={encendido ? colorEncendido : colorBorde}
        strokeWidth={1}
      />
      {encendido ? (
        <Path
          d="M7.6 12.4l3 3 5.8-6.2"
          stroke={colorCheck}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ) : null}
    </Svg>
  );
}
