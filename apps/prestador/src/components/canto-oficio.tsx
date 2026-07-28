/**
 * EL CANTO DE CAPA — S80-B8 (DIRECCION_ARTE §9.1/§9.2, primera
 * aplicación en el prestador; boceto M2 s80-b8).
 *
 * Tira vertical de 3px al borde IZQUIERDO de una fila de servicio: un
 * tono de CAPA degradado EN ALFA (§9.1 — canto de capa, jamás el de
 * marca acá: §9.1 "nunca en la misma tarjeta"). Es propiedad del TIPO
 * (§9.2): toda fila de servicio lo lleva, esté sola o en fila, viva o
 * plegada. El color viene del MISMO mapa que el registry de Icono
 * (L-175): cuidado=paseo/adiestramiento · identidad=vet · ocre=grooming.
 *
 * ANATOMÍA LOCAL a propósito (patrón TarjetaEstado/GateRoto): su
 * promoción a packages/ui se coordina — quien la necesite en otra
 * superficie NO la copia.
 *
 * LA CONTINUIDAD (§9.6, experimento B7): con `tag`, el canto es EL
 * elemento compartido — viaja de la fila a la cabecera del detalle y
 * al volver regresa a SU fila. Física de la casa: 340 ms +
 * bezier(.32,.72,0,1) — el default 500 ms del builder NO se acepta
 * (verificado en fuente instalada: durationV = 500). Sin fila destino
 * (cita cerrada, filtro activo, web sin SET) degrada a fade solo.
 */

import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, SharedTransition } from 'react-native-reanimated';

/** La física §5.2 sobre el builder experimental — UNA instancia para
 *  origen y destino (la misma config a ambos lados del viaje). */
export const transicionCanto = SharedTransition.duration(340).easing(
  Easing.bezier(0.32, 0.72, 0, 1),
);

const ANCHO_CANTO = 3;

export function CantoOficio({ color, tag }: { color: string; tag?: string }) {
  const tira = (
    <LinearGradient
      colors={[color, 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1, width: ANCHO_CANTO }}
    />
  );
  const posicion = {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: ANCHO_CANTO,
  };
  if (tag !== undefined) {
    return (
      <Animated.View
        sharedTransitionTag={tag}
        sharedTransitionStyle={transicionCanto}
        style={posicion}
        pointerEvents="none"
      >
        {tira}
      </Animated.View>
    );
  }
  return (
    <View style={posicion} pointerEvents="none">
      {tira}
    </View>
  );
}
