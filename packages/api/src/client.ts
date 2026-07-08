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
