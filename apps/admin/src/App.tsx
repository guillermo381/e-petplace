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
  /* El regreso de Google que no llegó a ser sesión. NO es `sin_sesion`: ahí la
     persona no intentó nada; acá intentó, volvió, y algo se rompió en el
     camino. Mandarla al login sin decirlo la deja reintentando para siempre
     contra el mismo defecto — «volviste al login» es indistinguible de «no
     tenés permiso», y son dos cosas distintas. */
  | { fase: 'callback_fallido'; mensaje: string }

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

    /* ─── EL REGRESO DE GOOGLE ────────────────────────────────────────────
       🔴 **El cliente de la casa trae `detectSessionInUrl: false`**, y está
       bien: `packages/api/src/client.ts` lo comparte con las dos apps de
       Expo, y *RN no es un browser* — ahí no hay URL que mirar. **Pero el
       admin SÍ es un browser**, y con `flowType: 'pkce'` Google vuelve a
       `window.location.origin` con `?code=…` esperando que alguien lo canjee.
       Nadie lo canjeaba ⇒ el código moría en la barra de direcciones,
       `getSession()` devolvía `null` y el gate mandaba al login. *Volver al
       login del mismo portal es exactamente lo que hace un callback que nadie
       consume.* Por eso email y contraseña sí entraban: no pasan por la URL.

       Se canjea acá y no se toca `initApi`: cambiar el cliente compartido para
       arreglar esta app le movería el piso a `cliente` y `prestador`, que están
       en producción y para las que ese `false` es correcto. Esto es literal-
       mente lo que `detectSessionInUrl` haría por dentro, hecho en la única
       app que lo necesita. */
    async function arrancar() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const errGoogle = params.get('error_description') ?? params.get('error')

      /* Google puede volver diciendo que NO, y eso no es un fallo nuestro: hay
         que repetirlo tal cual en vez de disfrazarlo de «no hay sesión». */
      if (errGoogle) {
        limpiarUrl()
        if (vivo) setEstado({ fase: 'callback_fallido', mensaje: errGoogle })
        return
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        /* La URL se limpia SIEMPRE, salga bien o mal: un `code` es de un solo
           uso, y dejarlo puesto hace que el próximo refresh reintente con uno
           ya gastado y falle por una razón distinta de la original. */
        limpiarUrl()
        if (!vivo) return
        if (error) { setEstado({ fase: 'callback_fallido', mensaje: error.message }); return }
      }

      const { data } = await supabase.auth.getSession()
      resolver(data.session)
    }

    arrancar()

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

  if (estado.fase === 'callback_fallido') {
    return (
      <Pantalla>
        <Fallo mensaje="Volviste de Google pero no pudimos abrir la sesión." detalle={estado.mensaje} />
        <p style={{ color: color.texto2, fontSize: 14, margin: `${sp[4]}px 0 ${sp[4]}px`, lineHeight: 1.5 }}>
          No es que no tengas permiso: la sesión no llegó a crearse. Puedes
          intentar de nuevo, o entrar con tu email y contraseña.
        </p>
        <Boton variante="secundario" onClick={() => { window.location.href = window.location.origin }}>
          Volver al inicio
        </Boton>
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

/** Saca `?code`/`?error` de la barra sin recargar ni ensuciar el historial. */
function limpiarUrl() {
  window.history.replaceState({}, '', window.location.pathname)
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
