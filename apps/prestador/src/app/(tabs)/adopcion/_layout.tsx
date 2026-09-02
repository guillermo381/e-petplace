/**
 * Stack del tab del REFUGIO (S112-C) — su Home y el hilo de cada solicitud
 * viven en la pila del tab: **tabs visibles, back natural** (el patrón de
 * `cuenta/`, que a su vez calca el de Cuenta v1 del cliente).
 *
 * 🔴 **POR QUÉ EL PORTAL SE MUDÓ DE LA RAÍZ A UN TAB, y no es acomodo:** vivía
 * en `app/adopcion/` y era **inalcanzable** — ninguna barra lo montaba. §4.2
 * pide que el refugio entre y vea sus tres tabs, y una tab tiene que ser un
 * archivo dentro de `(tabs)`.
 *
 * ✅ **Y las RUTAS no cambiaron**, que era la condición: `/adopcion` y
 * `/adopcion/solicitud/<id>` siguen siendo las mismas. Eso importa porque **son
 * las que D ya emite en el `data` de la push** (su `_adopcion_ruta`) y las que
 * yo le confirmé contra el objeto. *Mudar el archivo y cambiar la ruta habría
 * roto un contrato que otra pista ya aplicó.*
 */

import { Stack } from 'expo-router';

export default function AdopcionStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
