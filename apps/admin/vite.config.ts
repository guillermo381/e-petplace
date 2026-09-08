import { defineConfig, loadEnv } from 'vite'
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
/**
 * 🔴 EL GUARD DEL BUILD — sin esto se publica un sitio VACÍO que dice «✓ built».
 *
 * `src/lib/supabase.ts` ya lanza si faltan las variables: eso es correcto y
 * fail-closed. **Pero un `throw` a nivel de módulo NO frena el build: lo vuelve
 * código inalcanzable, y Rollup hace tree-shaking de TODA la app detrás.**
 *
 * Medido (8-sep-2026), y por eso está acá:
 *
 * ```
 * sin variables   199,89 kB · exit 0 · «✓ built»  → React + el guard. NADA de la app.
 * con variables   482,67 kB · exit 0              → la app entera
 * ```
 *
 * *El bundle de 199 kB pesa lo suficiente para parecer real, se publica sin un
 * solo error, y sirve una página en blanco.* Yo reporté ese número como «el
 * admin construido» durante toda una tanda.
 *
 * ⇒ **Un guard de RUNTIME no protege el BUILD.** El artefacto se produce igual y
 * el `exit 0` dice que salió bien. La única forma de que no se publique es que
 * el build falle acá — mismo criterio que `apps/pagos-web/build.mjs`, que
 * aborta con `process.exit(1)` y cuyo comentario ya lo decía:
 * *«una página servida con config incompleta se ve bien y no funciona».*
 */
function exigirEnv(modo: string) {
  const env = loadEnv(modo, process.cwd(), 'VITE_')
  const faltan = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
    .filter((k) => !env[k]?.trim())
  if (faltan.length) {
    console.error(
      `\n🔴 FALTAN VARIABLES: ${faltan.join(', ')}.\n` +
      `   Este sitio NO se publica a medias: sin ellas el bundle sale sin la\n` +
      `   aplicación (≈200 kB en vez de ≈480) y sirve una página en blanco,\n` +
      `   sin un solo error. Cargalas en el entorno del build y reintentá.\n`)
    process.exit(1)
  }
}

export default defineConfig(({ mode }) => {
  exigirEnv(mode)
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@api-admin': fileURLToPath(new URL('../../packages/api/src/admin/index.ts', import.meta.url)),
      '@api': fileURLToPath(new URL('../../packages/api/src', import.meta.url)),
    },
  },
  server: { port: 5273 },
  }
})
