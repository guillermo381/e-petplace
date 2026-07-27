/**
 * S79-B (T2-B2): el PUENTE local del primer login — la clave y sus lectores.
 *
 * Marca "bienvenida vista" por usuario EN EL DISPOSITIVO (AsyncStorage),
 * hasta que llegue la marca durable del PEDIDO B→A #1 (columna en
 * `prestadores` + lectura en `obtenerMiPrestador`). Cuando ese motor exista,
 * este archivo muere entero (Ley 37) y el guard lee el wrapper.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

function clave(userId: string): string {
  return `s79.bienvenida.vista:${userId}`;
}

/** true = ya la vio EN ESTE DISPOSITIVO. Falla de storage = true (ante la
 *  duda no se interrumpe con la carta dos veces — la carta es cortesía). */
export async function bienvenidaVista(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(clave(userId))) !== null;
  } catch {
    return true;
  }
}

export async function marcarBienvenidaVista(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(clave(userId), new Date().toISOString());
  } catch {
    // cortesía: si el storage falla, la carta se repite y ya
  }
}
