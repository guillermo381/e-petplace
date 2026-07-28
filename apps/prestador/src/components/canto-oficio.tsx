/**
 * EL CANTO DE CAPA — S80-B8, curado S80-B10 (DIRECCION_ARTE §9.1/§9.2).
 *
 * Tira vertical de 3px al borde IZQUIERDO de una fila de servicio: un
 * tono de CAPA degradado EN ALFA. §9.1 canto de capa — jamás el de
 * marca acá. Propiedad del TIPO (§9.2): toda fila de servicio lo
 * lleva, sola o en fila, viva o plegada. Color: el MISMO mapa que el
 * registry de Icono (L-175).
 *
 * ① EL PISO DEL ALFA (B10, veredicto founder en dispositivo): el
 * degradado va capa → **33% de alfa** (B3 de la directiva, lo aprobado
 * en lámina) — JAMÁS a transparente: a cero, la mitad de abajo
 * desaparecía y la fila perdía contorno (el hallazgo del gate).
 *
 * B11-② — EL ELEMENTO COMPARTIDO SE RETIRÓ (decisión founder, mesa
 * S80): no por malo sino por COSTO (26 pantallas sobre la API
 * experimental REA4 — interpolación de transform declarada incompleta
 * en fuente, `SharedTransitionBoundary` sin contrato) contra RETORNO
 * medido en dispositivo (cero). El fundamento es la medición del M2
 * (`docs/relevamientos/2026-07-28-s80-b8-M2-canto-continuidad.md`) —
 * se conserva como el porqué. La continuidad pasa al NAVEGADOR
 * (transición de pantalla entera, B11-③). Este componente queda PURO:
 * la tira, nada más.
 *
 * ANATOMÍA LOCAL a propósito (patrón TarjetaEstado/GateRoto): su
 * promoción a packages/ui se coordina — nadie la copia.
 */

import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ANCHO_CANTO = 3;

/** B3 de la directiva (lámina aprobada): el degradado del canto tiene
 *  PISO — termina en el 33% del tono, jamás en cero. */
const ALFA_PISO = 0.33;

/** #RRGGBB → rgba con el piso de alfa. Un color que no es hex de 6
 *  (p. ej. ya viene rgba de un tema) degrada a tira SÓLIDA honesta —
 *  jamás se inventa un valor (L-139). */
function conAlfaPiso(color: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(color);
  if (m === null) return color;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${ALFA_PISO})`;
}

export function CantoOficio({ color }: { color: string }) {
  return (
    <View
      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: ANCHO_CANTO }}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[color, conAlfaPiso(color)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1, width: ANCHO_CANTO }}
      />
    </View>
  );
}
