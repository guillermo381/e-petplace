/**
 * ThemeProvider de e-PetPlace.
 *
 * Modo 'light' por DEFAULT (B1 §7.3 — dark es opt-in del usuario).
 * `memorial` es forzable por prop para subtrees M6: las pantallas de
 * memorial envuelven su contenido en <ThemeProvider memorial> y el
 * sub-tema se aplica sin tocar la preferencia del usuario.
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
  defaultMode = 'light',
  memorial = false,
}: {
  children: ReactNode
  defaultMode?: ThemeMode
  memorial?: boolean
}) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode)
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
