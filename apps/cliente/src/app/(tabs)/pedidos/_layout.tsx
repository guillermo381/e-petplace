/**
 * Stack del tab PEDIDOS — la casa del postventa (firma del founder,
 * S100c). Mismo patrón que Despensa, Explorar y Hogar (decisión founder
 * (a) de S51): el detalle y el seguimiento viven DENTRO de la pila del
 * tab — tabs visibles, back natural.
 *
 * 🔴 **POR QUÉ LAS TRES RUTAS SE MUDARON ACÁ Y NO SE QUEDARON EN
 * `/despensa`:** el founder firmó que **Pedidos es una CASA**, no una
 * pantalla colgada de la tienda. Dejar el detalle bajo `/despensa`
 * habría hecho que tocar un pedido **cambiara la tab encendida** —
 * *estás en Pedidos, tocás tu pedido, y la barra te dice que estás en la
 * Despensa.* Una casa cuya puerta de adentro te manda a otra casa no es
 * una casa.
 *
 * El costo del traslado se midió antes: **`/despensa/pedidos` tenía
 * exactamente DOS consumidores** (la vitrina y el «listo» del checkout),
 * y el detalle tres. *Un traslado barato medido es distinto de un
 * traslado barato supuesto.*
 */

import { Stack } from 'expo-router';

export default function PedidosStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
