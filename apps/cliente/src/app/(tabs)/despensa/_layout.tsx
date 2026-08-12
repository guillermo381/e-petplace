/**
 * Stack del tab Despensa (S95-I, mismo patrón que Explorar y Hogar —
 * decisión founder (a) de S51): la ficha del producto vive DENTRO de la
 * pila del tab — tabs visibles, back natural.
 */

import { Stack } from 'expo-router';

export default function DespensaStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
