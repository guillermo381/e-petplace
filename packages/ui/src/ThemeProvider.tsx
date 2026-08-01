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
import { View } from 'react-native'

import { MarcaDeAgua } from './brand/MarcaDeAgua'
import { getTheme, type CtaAncla, type Theme, type ThemeMode } from './themes'

type ThemeContextValue = {
  theme: Theme
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  /** El ancla vigente — para que un provider ANIDADO pueda heredarla.
   *  Ver el porqué en el JSDoc de la prop `cta`. */
  cta: CtaAncla
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({
  children,
  mode: modeControlado,
  defaultMode = 'light',
  memorial = false,
  cta: ctaProp,
  marcaDeAgua = false,
}: {
  children: ReactNode
  /** Modo CONTROLADO: si viene, el provider lo sigue reactivo (cambio
   *  en caliente incluido) y `setMode` no tiene efecto. */
  mode?: ThemeMode
  defaultMode?: ThemeMode
  memorial?: boolean
  /** S63 — enmienda Ley 21 FIRMADA: el ANCLA del CTA primario.
   *  'tinta' = el de siempre (cliente). 'oficio' = tealDark en light Y
   *  dark (raíz del PRESTADOR). MEMORIAL SIEMPRE tinta, gane quien gane
   *  esta prop: memorial no se celebra.
   *
   *  ⚠️ SIN PROP, SE HEREDA DEL PROVIDER PADRE — y el default 'tinta'
   *  solo rige cuando NO hay padre (S83-C19). Antes era un default
   *  DURO, y esa dureza tenía un modo de falla silencioso: **todo
   *  provider anidado descartaba el ancla de su casa y volvía al
   *  cliente.** Lo cobró la galería del PRESTADOR — `TokenGallery`
   *  monta su propio provider (con razón: necesita `setMode` vivo para
   *  su toggle) y ahí se perdía `cta="oficio"` del raíz: el founder vio
   *  papel tapiz rosa, selectores magenta y focus magenta mientras los
   *  labels decían verde. **Son 78 `<ThemeProvider>` en ese archivo y
   *  UNO solo pasaba la prop** — repetirla 77 veces habría curado el
   *  síntoma y dejado viva la trampa para el siguiente.
   *  El alcance del cambio es exactamente el defecto: un anidado sin
   *  prop dentro del prestador pasa a 'oficio'; el que la declara y el
   *  que no tiene padre (`PantallaCaidaRaiz`, autosuficiente) no se
   *  mueven, y memorial sigue forzado en `getTheme`.
   *  Es la misma doctrina que ya rige en los slots: **las garantías
   *  viven en la FUENTE, no en la disciplina de cada pantalla.** */
  cta?: CtaAncla
  /** S82-B r10 (orden founder: el agua "VA EN TODAS LAS PANTALLAS —
   *  nace como pieza del fondo compartido, NO override por pantalla").
   *  Encendida acá, el agua queda detrás de TODO el árbol de la app en
   *  UN solo lugar: cero pantalla tocada, cero copia que se
   *  desincronice (el modo de fallo ya ocurrido: 0.06 vs 0.04).
   *  DEFAULT false a propósito, y desde S83-B27 el porqué es OTRO: la
   *  razón vieja ("el prestador no la recibe — su fondo se queda en papel
   *  algodón, r8 §5") QUEDÓ FALSA por dos firmas del founder. (a) El agua
   *  SÍ va al prestador: "no puedes copiar cómo quedó en cliente? Allí
   *  quedó bien" (S83-B22), y por eso la pieza tiene hoy la receta del
   *  Hogar como default. (b) El prestador tampoco se queda en papel: en
   *  oscuro tiene su tapiz verde propio, hoy al 8% (S83-B25).
   *  LO QUE SIGUE SIENDO CIERTO, y es lo único que el default sostiene:
   *  encenderla es de la APP, no de la pieza —ninguna la enciende
   *  todavía— y la galería no debe contaminar sus paneles anidados. */
  marcaDeAgua?: boolean
}) {
  const [modeInterno, setMode] = useState<ThemeMode>(defaultMode)
  const mode = modeControlado ?? modeInterno
  const effectiveMode: ThemeMode = memorial ? 'memorial' : mode

  // S83-C19 — LA HERENCIA DEL ANCLA: prop > padre > 'tinta'. Se lee el
  // contexto ANTES de crear el propio (un provider anidado ve al padre;
  // el raíz no ve a nadie y cae al default de siempre).
  const padre = useContext(ThemeContext)
  const ctaEfectivo: CtaAncla = ctaProp ?? padre?.cta ?? 'tinta'

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: getTheme(effectiveMode, ctaEfectivo), mode: effectiveMode, setMode, cta: ctaEfectivo }),
    [effectiveMode, ctaEfectivo],
  )

  return (
    <ThemeContext.Provider value={value}>
      {marcaDeAgua ? (
        // El wrapper existe SOLO con el agua encendida: sin ella el árbol
        // de render queda EXACTAMENTE como antes (cero riesgo de flex
        // para el prestador y la galería).
        <View style={{ flex: 1, backgroundColor: value.theme.bg.base }}>
          <MarcaDeAgua />
          {children}
        </View>
      ) : (
        children
      )}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme: falta <ThemeProvider> arriba en el árbol (montarlo en el root layout).')
  }
  return ctx
}
