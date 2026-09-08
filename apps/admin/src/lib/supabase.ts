/**
 * LA PUERTA ÚNICA, INICIALIZADA UNA VEZ.
 *
 * Usa `initApi` de `packages/api` — el MISMO cliente que las dos apps. No se
 * crea un `createClient` propio: eso sería una segunda puerta, y la casa tiene
 * una (`packages/api/src/client.ts`).
 *
 * 🔴 **Anon key, jamás `service_role`** (letra §3④). El relevamiento midió que
 * la anon key expuesta no abre nada porque la RLS hace el trabajo; una
 * `service_role` en un bundle web haría exactamente lo contrario: abriría todo
 * y la RLS dejaría de significar algo.
 */
import { initApi } from '@api-admin'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !key) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copiá .env.example a .env.local.',
  )
}

/* El guard que hace inexpresable el peor error de esta app. Un JWT de Supabase
   lleva su rol en el payload; si alguien pegara una service_role acá, esto
   rompe en el arranque en vez de servir una app que ignora la RLS.
   Se lee el claim, no el nombre de la variable: medir por forma, no por nombre. */
try {
  const payload = JSON.parse(atob((key.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/')))
  if (payload?.role && payload.role !== 'anon') {
    throw new Error(
      `La clave configurada tiene role="${payload.role}". Este bundle sólo acepta anon (letra §3④).`,
    )
  }
} catch (e) {
  if (e instanceof Error && e.message.includes('sólo acepta anon')) throw e
  // Un JWT que no se puede decodificar no es motivo para no arrancar: puede ser
  // una key con otro formato. Lo que NO se hace es asumir que está bien.
  console.warn('[admin] no se pudo leer el claim role de la clave; se sigue sin verificar.')
}

export const supabase = initApi(url, key, {
  storageSesion: {
    getItem: (k) => window.localStorage.getItem(k),
    setItem: (k, v) => window.localStorage.setItem(k, v),
    removeItem: (k) => window.localStorage.removeItem(k),
  },
})
