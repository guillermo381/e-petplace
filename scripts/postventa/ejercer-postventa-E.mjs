/**
 * ejercer-postventa-E — LAS DOS EDGES POR CAMINO REAL. (S114-D, lote 5)
 *
 * ── QUÉ ES ESTO Y QUÉ NO ────────────────────────────────────────────────────
 * No es un test de unidad ni un arnés de contrato: es **el camino real**. Login
 * con sesión de persona, `fetch` contra la edge desplegada, sujetos que existen
 * en la base. Lo que mide es lo que le va a pasar a una familia.
 *
 * ── LA LEY DEL REPORTE ─────────────────────────────────────────────────────
 * 🔴 El sujeto es un modelo ⇒ **N corridas y tendencia, jamás el conteo de
 * una**. Y todo cero viene con su control: un detector que no puede decir «sí»
 * mide su propia ceguera.
 *
 * ── LAS CREDENCIALES ───────────────────────────────────────────────────────
 * Se leen del llavero AL MOMENTO y **no se imprimen nunca, ni enmascaradas**:
 * un valor mostrado a medias sigue quedando en el transcript, y un transcript
 * no se puede editar después.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace'
const env = Object.fromEntries(
  readFileSync(`${RAIZ}/apps/prestador/.env.local`, 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const URL = env.EXPO_PUBLIC_SUPABASE_URL
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY
if (!URL || !ANON) { console.error('🔴 NO CONCLUYENTE — falta URL o ANON en .env.local'); process.exit(2) }

const cuenta = (servicio) => {
  const acct = execFileSync('security', ['find-generic-password', '-s', servicio], { encoding: 'utf8' })
    .match(/"acct"<blob>="([^"]+)"/)?.[1]
  const pass = execFileSync('security', ['find-generic-password', '-s', servicio, '-w'], { encoding: 'utf8' }).trim()
  if (!acct || !pass) throw new Error(`el llavero no tiene ${servicio} completo`)
  return { email: acct, pass }
}

async function entrar(servicio) {
  const { email, pass } = cuenta(servicio)
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON },
    body: JSON.stringify({ email, password: pass }),
  })
  const j = await r.json()
  if (!r.ok || !j.access_token) throw new Error(`login de ${email} falló: ${j.error_description ?? j.msg ?? r.status}`)
  return { token: j.access_token, email, uid: j.user?.id }
}

async function llamar(edge, token, cuerpo) {
  const t0 = Date.now()
  try {
    const r = await fetch(`${URL}/functions/v1/${edge}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${token}` },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(90_000),
    })
    const texto = await r.text()
    let j = null
    try { j = JSON.parse(texto) } catch { /* se reporta abajo con su motivo */ }
    return { status: r.status, json: j, crudo: texto.slice(0, 200), ms: Date.now() - t0 }
  } catch (e) {
    // «Sin respuesta» no es una sola cosa: se dice cuál fue.
    return { status: 0, json: null, crudo: String(e).slice(0, 120), ms: Date.now() - t0 }
  }
}

/** El detector de voseo de la casa — la MISMA lista que usa el cinturón, no una
 *  mía. Un detector propio mediría mi idea del voseo, no el de la casa. */
const PARES = JSON.parse(readFileSync(`${RAIZ}/supabase/functions/_shared/voz/voseo.json`, 'utf8'))
const FORMAS = PARES.pares.map((p) => p[0]).filter((f) => f.length > 2)
/* `\b` NO delimita palabras en español: una vocal acentuada no es carácter de
   palabra ASCII, así que `\bdejá\b` no cierra nunca. Es la ley de la casa. */
const reVoseo = new RegExp(`(?<![\\p{L}\\p{N}])(${FORMAS.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}\\p{N}])`, 'iu')
/* El usted es la otra mitad y no está en la lista de voseo: se detecta aparte. */
const reUsted = /(?<![\p{L}\p{N}])(usted|su mascota|le informamos|puede usted|dígame|díganos|comuníquese)(?![\p{L}\p{N}])/iu

export { entrar, llamar, reUsted, reVoseo }

if (import.meta.url === `file://${process.argv[1]}`) {
  const N = Number(process.argv[2] ?? 5)
  const { default: correr } = await import('./ejercer-cuerpo.mjs')
  await correr({ entrar, llamar, reVoseo, reUsted, N })
}
