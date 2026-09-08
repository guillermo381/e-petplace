import { Outlet, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { color, sp, radio, fuente } from '../tokens'

/**
 * El menú tiene UNA entrada, y eso es la letra funcionando: §4 dice que lo que
 * no pasa la puerta de §2 **no se nombra**. Un menú con seis items grises
 * («Prestadores — próximamente») sería exactamente el portal entero con otro
 * nombre que §1 prohíbe.
 */
const RUTAS = [{ to: '/liquidaciones', label: 'Liquidaciones' }]

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: color.base, fontFamily: fuente.cuerpo }}>
      <aside style={{
        width: 220, borderRight: `1px solid ${color.borde}`, background: color.carta,
        padding: sp[5], display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ marginBottom: sp[8] }}>
          <div style={{ color: color.texto, fontWeight: 800, fontSize: 15 }}>e-PetPlace</div>
          <div style={{ color: color.texto2, fontSize: 12 }}>Operaciones</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: sp[1], flex: 1 }}>
          {RUTAS.map((r) => (
            <NavLink key={r.to} to={r.to} style={({ isActive }) => ({
              padding: `${sp[2]}px ${sp[3]}px`, borderRadius: radio.suave,
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
              color: isActive ? '#FFFFFF' : color.texto2,
              background: isActive ? color.acento : 'transparent',
            })}>{r.label}</NavLink>
          ))}
        </nav>

        <button onClick={() => supabase.auth.signOut()} style={{
          background: 'none', border: 'none', color: color.texto2, fontSize: 13,
          cursor: 'pointer', textAlign: 'left', padding: sp[2], fontFamily: fuente.cuerpo,
        }}>Cerrar sesión</button>
      </aside>

      <main style={{ flex: 1, padding: sp[8], overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
