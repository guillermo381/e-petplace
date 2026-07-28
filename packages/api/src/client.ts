import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type EpetplaceClient = SupabaseClient<Database>;

let cliente: EpetplaceClient | null = null;

/** Adapter de storage para la sesión (shape mínimo de supabase-js). */
export interface StorageSesion {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export interface OpcionesApi {
  /** Persistencia de sesión en nativo (S45-B4): el app pasa su adapter
   *  (AsyncStorage — patrón oficial supabase-js RN); sin adapter la sesión
   *  vive solo en memoria (comportamiento pre-S45, prestador dev). */
  storageSesion?: StorageSesion;
}

/**
 * Puerta única a la DB. Cada app llama initApi() una vez al arrancar con sus
 * env vars (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY); los
 * wrappers usan getClient() y jamás crean clientes propios.
 */
export function initApi(url: string, anonKey: string, opciones?: OpcionesApi): EpetplaceClient {
  if (!url || !anonKey) {
    throw new Error('initApi: faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
  cliente = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // RN no es un browser: sin detección de tokens en URL.
      detectSessionInUrl: false,
      ...(opciones?.storageSesion ? { storage: opciones.storageSesion } : null),
    },
  });
  return cliente;
}

export function getClient(): EpetplaceClient {
  if (!cliente) {
    throw new Error('getClient: initApi() no fue llamado. Inicializá la API en el entry de la app.');
  }
  return cliente;
}

/**
 * EL UID DE LA SESIÓN — resolvedor único de la puerta (S80-A14, aprobado
 * por el founder sobre el censo A13: 10 wrappers, 29 sitios, CERO usaban
 * más que el id).
 *
 * POR QUÉ `getSession()` Y NO `getUser()`: `getUser()` es un ROUND-TRIP DE
 * RED que valida el JWT contra el server de Auth. En estos 29 sitios esa
 * validación **no aporta autorización**: la autorización real la hace la
 * RLS con el JWT que viaja pegado al request de PostgREST — un uid viejo o
 * inventado no puede leer nada que el JWT no permita. Se pagaba red por un
 * dato que ya está local. `getSession()` lee el session store del SDK
 * (cero red).
 *
 * NO ES UNA CACHÉ NUESTRA — y eso es lo que la hace segura (el riesgo que
 * la mesa declaró, D-571): no hay Map propio, no hay TTL propio, no hay
 * invalidación que podamos olvidar. El store lo gobierna el SDK y se
 * actualiza solo en signOut / refresh / onAuthStateChange.
 *
 * EL BORDE, DECLARADO Y PROBADO (fixture `verify-uid-revocacion-s80.mjs`):
 * ante una revocación REMOTA el store local sigue devolviendo el uid hasta
 * que el refresh falle — y ahí el request sale, **el SERVER lo rebota**, y
 * ese rebote tiene que llegar como ERROR DE SERVIDOR: jamás como
 * `sin_sesion`, jamás como lista vacía (condición exigible del founder;
 * D-571/L-178 — un permiso denegado JAMÁS se disfraza de dato faltante).
 * Con `getUser()` el borde existía igual y ADEMÁS mentía: la red caída
 * salía como "sin sesión" (D-538). Acá `sin_sesion` vuelve a significar
 * exactamente eso: no hay sesión local.
 */
export async function uidActual(): Promise<string | null> {
  const { data } = await getClient().auth.getSession();
  return data.session?.user.id ?? null;
}
