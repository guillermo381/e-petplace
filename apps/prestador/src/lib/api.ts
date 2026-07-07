/**
 * Bootstrap de la puerta única + sesión DEV-ONLY (S44-B4 / D-290).
 *
 * ATAJO ASUMIDO DE B4: no hay pantalla de login — en dev, si no hay
 * sesión, se firma con las credenciales demo de .env.local (jamás
 * commiteado). D-290 lo retira antes de cualquier usuario real.
 */

import { initApi, getClient } from '@epetplace/api';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let apiLista = false;
if (url && anonKey) {
  initApi(url, anonKey);
  apiLista = true;
}

export type EstadoSesion =
  | { ok: true }
  | { ok: false; mensaje: string };

export async function asegurarSesionDev(): Promise<EstadoSesion> {
  if (!apiLista) {
    return { ok: false, mensaje: 'Faltan EXPO_PUBLIC_SUPABASE_URL / ANON_KEY en .env.local.' };
  }
  const cliente = getClient();
  const { data } = await cliente.auth.getSession();
  if (data.session) return { ok: true };

  if (!__DEV__) {
    return { ok: false, mensaje: 'No hay sesión activa.' };
  }
  const email = process.env.EXPO_PUBLIC_DEMO_EMAIL ?? '';
  const password = process.env.EXPO_PUBLIC_DEMO_PASSWORD ?? '';
  if (!email || !password) {
    return { ok: false, mensaje: 'Completá EXPO_PUBLIC_DEMO_EMAIL / EXPO_PUBLIC_DEMO_PASSWORD en apps/prestador/.env.local y reiniciá Metro.' };
  }
  const { error } = await cliente.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, mensaje: `No pudimos iniciar la sesión demo: ${error.message}` };
  }
  return { ok: true };
}
