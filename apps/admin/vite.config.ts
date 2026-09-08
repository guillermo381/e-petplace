import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

/**
 * ALIAS A LA FRONTERA DE F, y es una decisión, no comodidad.
 *
 * La letra §3③ dice que F escribe **sólo** bajo `packages/api/src/admin/` y no
 * toca ningún otro archivo del paquete. `packages/api/src/index.ts` es de A ⇒
 * **no se le agregan exports**. Por eso la app entra por el barrel propio de
 * `src/admin/`, con alias, en vez de por el índice del paquete.
 *
 * Efecto secundario declarado: la app compila los `.ts` de la frontera como
 * fuente, no como paquete construido. Es lo que hacen las otras apps del
 * monorepo con `packages/api` y no agrega deuda nueva.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@api-admin': fileURLToPath(new URL('../../packages/api/src/admin/index.ts', import.meta.url)),
      '@api': fileURLToPath(new URL('../../packages/api/src', import.meta.url)),
    },
  },
  server: { port: 5273 },
})
