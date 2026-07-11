/**
 * Bootstrap de la puerta única del PRESTADOR — auth REAL (S54-B,
 * D-290): el atajo dev de S44 (asegurarSesionDev firmando con las
 * credenciales demo) MURIÓ. Espejo del bootstrap del cliente (S45-B4):
 *
 * Persistencia de sesión: AsyncStorage como adapter de supabase-js —
 * el patrón oficial para RN (ya viajaba en la build 1.0.1 por el riel
 * i18n: cero deps nativas nuevas, L-134). SOLO en nativo: en web
 * supabase usa localStorage propio, y el render SSR de expo-router
 * (node) no tiene ninguno de los dos (hallazgo S45-B4).
 *
 * Auto-refresh atado al AppState (patrón oficial supabase RN).
 */

import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initApi, getClient, obtenerSesion } from '@epetplace/api';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const apiLista = Boolean(url && anonKey);

if (apiLista) {
  initApi(url, anonKey, Platform.OS === 'web' ? undefined : { storageSesion: AsyncStorage });

  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') {
      getClient().auth.startAutoRefresh();
    } else {
      getClient().auth.stopAutoRefresh();
    }
  });
}

export type EstadoSesion =
  | { ok: true }
  | { ok: false; mensaje: string };

/** Pre-flight de las pantallas hondas (cita/*): ¿hay sesión vigente?
 *  NO firma nada (eso era el atajo dev) — solo pregunta. El mensaje es
 *  el del wrapper de auth (voz es; el riel no llega a libs sin hook —
 *  hallazgo H3 de D-315p). */
export async function verificarSesion(): Promise<EstadoSesion> {
  if (!apiLista) {
    return { ok: false, mensaje: 'Faltan EXPO_PUBLIC_SUPABASE_URL / ANON_KEY en .env.local.' };
  }
  const r = await obtenerSesion();
  if (!r.ok) return { ok: false, mensaje: r.mensaje };
  if (r.data === null) return { ok: false, mensaje: 'No hay una sesión activa.' };
  return { ok: true };
}
