/**
 * ThemeProvider de e-PetPlace.
 *
 * D-305 (S48): el tema NO es elegible por el usuario — lo resuelve el
 * SISTEMA. El cableado vive en los APPS: el _layout raíz resuelve
 * useColorScheme() y pasa 'light'/'dark' por el prop controlado `mode`.
 * Este package sigue agnóstico: NO importa Appearance ni asume runtime
 * nativo (RN-web lo consume tal cual).
 *
 * `memorial` queda SIEMPRE encima del modo (controlado o no): no es un
 * tema elegible, es un momento. Las pantallas M6 envuelven su contenido
 * en <ThemeProvider memorial> y el sub-tema se aplica sin tocar nada.
 *
 * Sin `mode`, el provider es no-controlado con 'light' por DEFAULT
 * (B1 §7.3) y `setMode` manual — el modo herramienta de la galería.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { getTheme, type Theme, type ThemeMode } from './themes'

type ThemeContextValue = {
  theme: Theme
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({
  children,
  mode: modeControlado,
  defaultMode = 'light',
  memorial = false,
}: {
  children: ReactNode
  /** Modo CONTROLADO: si viene, el provider lo sigue reactivo (cambio
   *  en caliente incluido) y `setMode` no tiene efecto. */
  mode?: ThemeMode
  defaultMode?: ThemeMode
  memorial?: boolean
}) {
  const [modeInterno, setMode] = useState<ThemeMode>(defaultMode)
  const mode = modeControlado ?? modeInterno
  const effectiveMode: ThemeMode = memorial ? 'memorial' : mode

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: getTheme(effectiveMode), mode: effectiveMode, setMode }),
    [effectiveMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme: falta <ThemeProvider> arriba en el árbol (montarlo en el root layout).')
  }
  return ctx
}
