/**
 * S96-C · LA TARJETA DE ENTRADA A «VENTA DE PRODUCTOS» — una sola pieza
 * para sus TRES casas: el tab Negocio del gestor, el muro del no-titular
 * vendedor, y el HOY del no-gestor vendedor (§0bis de la lámina de la
 * barra, firma de mesa). Nació local en negocio.tsx y se mudó acá con su
 * segundo consumidor en otro archivo — lo que se copia diverge.
 *
 * La voz llega por props (el consumidor tiene el diccionario); la pieza
 * no sabe de roles ni de naturalezas: el PREDICADO de dibujarla es de la
 * pantalla, y su condición de la casa (S78-B/D-521) es que la lectura sea
 * EXITOSA — un fallo jamás fabrica «no vendedor».
 */

import { View } from 'react-native';
import { Icono, Tarjeta, Texto, spacing } from '@epetplace/ui';

export function TarjetaVentas({
  etiqueta,
  detalle,
  onPress,
}: {
  etiqueta: string;
  detalle: string;
  onPress: () => void;
}) {
  return (
    <Tarjeta
      interactiva
      elevacion="reposo"
      accessibilityRole="button"
      etiqueta={etiqueta}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <Icono nombre="despensa" registro="aa" tamano={28} />
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="seccion">{etiqueta}</Texto>
          <Texto variante="apoyo">{detalle}</Texto>
        </View>
      </View>
    </Tarjeta>
  );
}
