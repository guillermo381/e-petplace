import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { color, sp, radio, fuente } from '../tokens'
import { Boton, Fallo } from '../ui/piezas'

export default function Login() {
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true); setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password: clave })
    /* La voz distingue red de credencial. «Email o contraseña incorrectos»
       sobre una caída de red es la clase de mensaje que manda a alguien a
       resetear una clave que estaba bien (D-719/D-720, curadas en S92-bis). */
    if (err) {
      const esRed = /network|fetch|failed to fetch/i.test(err.message ?? '')
      setError(esRed ? 'No pudimos conectarnos. Revisa tu conexión.' : 'Email o contraseña incorrectos.')
    }
    setCargando(false)
  }

  /**
   * ENTRAR CON GOOGLE.
   *
   * 🔴 **El `redirectTo` NO va hardcodeado, y eso es la lección de `L-525`
   * puesta desde el principio.** En el legado era una URL literal, y cuando la
   * canónica cambió —de la URL de rama al dominio propio— **el código se curó y
   * la allow-list de Supabase quedó con la vieja**: el login «funcionaba» y
   * dejaba al founder en el sitio público, sin un solo error.
   *
   * `window.location.origin` elimina esa mitad del problema: **la URL deja de
   * vivir en dos lugares del código.** Sirve igual desde la URL de Vercel y
   * desde el dominio propio el día que se mueva, **sin tocar este archivo.**
   *
   * ⚠️ **Lo que NO elimina, y hay que saberlo:** la otra mitad sigue viviendo
   * fuera del repo. **Cada origen desde el que se entre tiene que estar en
   * Supabase → Authentication → Redirect URLs**, o Supabase descarta el
   * `redirect_to` al volver del proveedor y cae al Site URL. *Hoy son dos:*
   *
   *     https://e-petplace-operaciones.vercel.app/**
   *     https://admin.epetplace.com/**
   */
  async function entrarConGoogle() {
    setCargando(true); setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    /* Si `signInWithOAuth` devuelve sin error, el navegador ya se está yendo al
       proveedor: no se apaga `cargando` — dejarlo encendido evita el segundo
       toque sobre un botón que ya disparó. */
    if (err) {
      setError('No pudimos abrir el acceso con Google. Prueba de nuevo.')
      setCargando(false)
    }
  }

  const input: React.CSSProperties = {
    width: '100%', padding: `${sp[3]}px ${sp[4]}px`, borderRadius: radio.suave,
    border: `1px solid ${color.borde}`, background: color.carta, color: color.texto,
    fontSize: 14, fontFamily: fuente.cuerpo, boxSizing: 'border-box', outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: color.base, padding: sp[6], fontFamily: fuente.cuerpo,
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ marginBottom: sp[8] }}>
          <h1 style={{ color: color.texto, fontSize: 22, fontWeight: 800, margin: `0 0 ${sp[1]}px` }}>
            e-PetPlace
          </h1>
          <p style={{ color: color.texto2, fontSize: 14, margin: 0 }}>Mesa de operaciones</p>
        </div>

        <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
          <input style={input} type="email" placeholder="Email" autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input style={input} type="password" placeholder="Contraseña" autoComplete="current-password"
            value={clave} onChange={(e) => setClave(e.target.value)} required />
          {error ? <Fallo mensaje={error} /> : null}
          <Boton type="submit" disabled={cargando}>
            {cargando ? 'Entrando…' : 'Entrar'}
          </Boton>
        </form>

        {/* El separador dice QUÉ separa, no decora: son dos caminos a lo mismo. */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: sp[3],
          margin: `${sp[5]}px 0`, color: color.texto3, fontSize: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: color.borde }} />
          o
          <div style={{ flex: 1, height: 1, background: color.borde }} />
        </div>

        <Boton variante="secundario" onClick={entrarConGoogle} disabled={cargando}>
          Entrar con Google
        </Boton>
      </div>
    </div>
  )
}
