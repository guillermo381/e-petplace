/**
 * Stack del tab Cuenta (S55-B3): el índice y sus pantallas viven en la
 * pila del tab — tabs visibles, back natural (patrón Hogar S51).
 */

import { Stack } from 'expo-router';

export default function CuentaStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
