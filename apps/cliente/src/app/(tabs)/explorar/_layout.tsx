/**
 * Stack del tab Explorar (S54-B3, mismo patrón que el Hogar — decisión
 * founder (a) de S51): el flujo de agendamiento (paseadores → agenda →
 * checkout) vive DENTRO de la pila del tab — tabs visibles, back natural.
 */

import { Stack } from 'expo-router';

export default function ExplorarStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
