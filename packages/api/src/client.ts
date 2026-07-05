import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type EpetplaceClient = SupabaseClient<Database>;

let cliente: EpetplaceClient | null = null;

/**
 * Puerta única a la DB. Cada app llama initApi() una vez al arrancar con sus
 * env vars (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY); los
 * wrappers usan getClient() y jamás crean clientes propios.
 */
export function initApi(url: string, anonKey: string): EpetplaceClient {
  if (!url || !anonKey) {
    throw new Error('initApi: faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
  cliente = createClient<Database>(url, anonKey);
  return cliente;
}

export function getClient(): EpetplaceClient {
  if (!cliente) {
    throw new Error('getClient: initApi() no fue llamado. Inicializá la API en el entry de la app.');
  }
  return cliente;
}
