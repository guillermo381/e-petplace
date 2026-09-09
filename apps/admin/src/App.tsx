import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { esAdmin } from '@api-admin'
import { supabase } from './lib/supabase'
import { color, sp, fuente } from './tokens'
import { Fallo, Boton } from './ui/piezas'
import Login from './pantallas/Login'
import Layout from './componentes/Layout'
import Liquidaciones from './pantallas/Liquidaciones'
import Casos from './pantallas/Casos'
import HojaCaso from './pantallas/HojaCaso'

/**
 * EL GATE, Y LO QUE DE VERDAD LO SOSTIENE.
 *
 * 🔴 **Esto NO es la defensa: es la cortesía.** Lo que impide que un no-admin
 * vea datos es la RLS del servidor — las policies `admin_all_*` con
 * `is_admin()`. Este componente sólo evita mostrarle una pantalla vacía a
 * alguien que no puede llenarla. *Si alguien parchea este archivo en su
 * navegador, no gana nada: las consultas siguen volviendo 0 filas o 401.*
 * Medido por camino real en el rojo de F2 (ver el parte).
 *
 * TRES ESTADOS, NO DOS (L-178): «no sos admin» y «no pude preguntarlo» son
 * hechos distintos. Confundirlos manda al login a alguien que sí tiene
 * permiso, sin decirle por qué — y ese es un callejón sin salida silencioso.
 */
type EstadoGate =
  | { fase: 'cargando' }
  | { fase: 'sin_sesion' }
  | { fase: 'admin' }
  | { fase: 'no_admin' }
  | { fase: 'no_se_pudo'; mensaje: string }

function Splash() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: color.base, color: color.texto2, fontFamily: fuente.cuerpo, fontSize: 14,
    }}>Verificando tu acceso…</div>
  )
}

export default function App() {
  const [estado, setEstado] = useState<EstadoGate>({ fase: 'cargando' })

  useEffect(() => {
    let vivo = true

    async function resolver(sesion: Session | null) {
      if (!vivo) return
      if (!sesion) { setEstado({ fase: 'sin_sesion' }); return }
      const r = await esAdmin()
      if (!vivo) return
      if (!r.ok) { setEstado({ fase: 'no_se_pudo', mensaje: r.mensaje }); return }
      setEstado({ fase: r.data ? 'admin' : 'no_admin' })
    }

    supabase.auth.getSession().then(({ data }) => resolver(data.session))

    const { data: sub } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (evento === 'TOKEN_REFRESHED') return
      if (evento === 'SIGNED_OUT') { setEstado({ fase: 'sin_sesion' }); return }
      resolver(sesion)
    })

    return () => { vivo = false; sub.subscription.unsubscribe() }
  }, [])

  if (estado.fase === 'cargando') return <Splash />
  if (estado.fase === 'sin_sesion') return <Login />

  /* Se dice qué pasó, y se ofrece salir. Un rebote mudo al login sobre una
     cuenta que SÍ es admin haría que la persona reintente para siempre. */
  if (estado.fase === 'no_se_pudo') {
    return (
      <Pantalla>
        <Fallo mensaje="No pudimos verificar tu acceso." detalle={estado.mensaje} />
        <div style={{ marginTop: sp[4] }}>
          <Boton variante="secundario" onClick={() => window.location.reload()}>Reintentar</Boton>
        </div>
      </Pantalla>
    )
  }

  if (estado.fase === 'no_admin') {
    return (
      <Pantalla>
        <h1 style={{ color: color.texto, fontSize: 18, margin: `0 0 ${sp[2]}px` }}>
          Esta cuenta no tiene acceso a operaciones.
        </h1>
        <p style={{ color: color.texto2, fontSize: 14, margin: `0 0 ${sp[5]}px`, lineHeight: 1.5 }}>
          Tu sesión es válida, pero no figuras como administrador de plataforma.
          Si crees que es un error, pide que te den de alta en <code>admin_users</code>.
        </p>
        <Boton variante="secundario" onClick={() => supabase.auth.signOut()}>Cerrar sesión</Boton>
      </Pantalla>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/liquidaciones" replace />} />
          <Route path="/liquidaciones" element={<Liquidaciones />} />
          <Route path="/casos" element={<Casos />} />
          <Route path="/casos/:casoId" element={<HojaCaso />} />
          {/* No hay rutas «preparadas»: lo que no pasa la puerta de §2 no se
              nombra (letra §4). Cualquier otra ruta vuelve al inicio. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function Pantalla({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: color.base, padding: sp[6], fontFamily: fuente.cuerpo,
    }}>
      <div style={{ maxWidth: 460 }}>{children}</div>
    </div>
  )
}
