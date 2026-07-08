/**
 * Bootstrap de la puerta única del DUEÑO (S45-B4) — auth REAL, sin
 * atajos dev (a diferencia de prestador/D-290).
 *
 * Persistencia de sesión: AsyncStorage como adapter de supabase-js —
 * el patrón oficial de Supabase para RN. (La skill de stack sugiere
 * SecureStore para tokens, pero su límite de 2048 bytes por valor no
 * banca el JSON de sesión de supabase; el endurecimiento a
 * LargeSecureStore queda anotado como deuda en el reporte S45-B4.)
 *
 * Auto-refresh atado al AppState (patrón oficial supabase RN): el
 * refresh corre solo con el app en foreground.
 */

import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initApi, getClient } from '@epetplace/api';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const apiLista = Boolean(url && anonKey);

if (apiLista) {
  // AsyncStorage SOLO en nativo: en web supabase usa localStorage propio,
  // y el render SSR de expo-router (node) no tiene ninguno de los dos —
  // pasarlo ahí revienta el server (hallazgo S45-B4).
  initApi(url, anonKey, Platform.OS === 'web' ? undefined : { storageSesion: AsyncStorage });

  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') {
      getClient().auth.startAutoRefresh();
    } else {
      getClient().auth.stopAutoRefresh();
    }
  });
}
