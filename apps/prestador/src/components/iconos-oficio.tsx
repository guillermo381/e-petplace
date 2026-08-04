/**
 * El glifo de OFICIO de la Hoja del miembro (S78-B) + el control de
 * estado de la tarjeta de servicio.
 *
 * ☠️ S86-B · LOS CUATRO DIBUJANTES CLONADOS MURIERON — `IconoOficio`
 * CONSUME EL REGISTRY (D-546, cerrada; D-645).
 *
 * **Su razón de existir se cumplió y por eso el clon se retira.** La
 * cabecera anterior declaraba el porqué con precisión: la composición
 * firmada en el gate S78 pide *trazo y huella en colores
 * INDEPENDIENTES* (trazo `text.primary` + huella en el teal del
 * oficio), y ninguno de los tres `registro` de `Icono` podía
 * producirla — daban arcoíris de capa, arcoíris AA, o los dos del
 * mismo color. **La deuda estaba bien diagnosticada; lo que faltaba
 * era la prop.** Hoy `Icono` acepta `huella` como gemela de `tinta`,
 * así que la composición sale del registry sin redibujar nada.
 *
 * ⚠️ ESTE ARCHIVO NO MUERE ENTERO, Y ES DELIBERADO: `ControlEstado` no
 * es un glifo b′ (no es objeto de oficio + huella) sino una affordance
 * de selección, y **no tiene gemelo en el registry** — matar el archivo
 * por simetría se habría llevado una pieza viva que nadie clonó. Lo que
 * muere es la copia, no el módulo.
 */

import Svg, { Circle, Path } from 'react-native-svg';
import { Icono, type IconoNombre } from '@epetplace/ui';

import type { OficioChip } from '@epetplace/api';

type Pincel = {
  /** Color del objeto del oficio. */
  color: string;
  /** Color de la huella — INDEPENDIENTE del trazo (la prop `huella` de `Icono`). */
  colorHuella: string;
  tamano?: number;
};

/** Los cuatro oficios y su glifo del set b′. El adiestramiento se dice
 *  `training` en el registry — el mapa vive acá, en la frontera, y no
 *  se resuelve con un cast. */
const GLIFO_DE_OFICIO: Record<OficioChip, IconoNombre> = {
  veterinaria: 'veterinaria',
  grooming: 'grooming',
  paseo: 'paseo',
  adiestramiento: 'training',
};

/** El glifo del oficio, PELADO (sin contenedor) — 27px por la composición firmada. */
export function IconoOficio({
  oficio,
  color,
  colorHuella,
  tamano = 27,
}: Pincel & { oficio: OficioChip }) {
  return (
    <Icono
      nombre={GLIFO_DE_OFICIO[oficio]}
      tamano={tamano}
      tinta={color}
      huella={colorHuella}
    />
  );
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
