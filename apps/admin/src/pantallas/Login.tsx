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
      setError(esRed ? 'No pudimos conectarnos. Revisá tu conexión.' : 'Email o contraseña incorrectos.')
    }
    setCargando(false)
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
      </div>
    </div>
  )
}
