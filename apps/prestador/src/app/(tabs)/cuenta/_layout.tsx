/**
 * Stack del tab Cuenta del prestador (S57-B, letra P17) — el índice y
 * sus pantallas viven en la pila del tab: tabs visibles, back natural
 * (calcado del patrón Cuenta v1 del cliente, S55-B3).
 */

import { Stack } from 'expo-router';

export default function CuentaStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
