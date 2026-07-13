/**
 * e-PetPlace — Design Tokens · ELEVACIÓN (Ley 20 · D-358, firmado S58)
 *
 * El 3D sutil, POR SISTEMA — dos niveles y solo dos:
 *   reposo  — la superficie que vive sobre el fondo (Tarjeta, celdas)
 *   elevada — lo que flota (Hoja, menús)
 *
 * La sombra en claro es TINTA CÁLIDA rgb(31,27,22), jamás negro puro:
 * es la mitad del efecto papel (la otra mitad es el fondo papel algodón
 * #FAF9F7 — D-360). En dark la elevación la dice el paso de luminancia
 * de bg.card que ya existe; acá solo queda la sombra de contacto mínima
 * (jamás calentar el fondo dark — riesgo OLED S43). Memorial CONSERVA
 * la elevación (la calidez es dignidad, no celebración — Ley 20
 * extendida por firma founder S58): sus superficies son oscuras
 * (bosque nocturno) y resuelven como dark.
 *
 * Formato boxShadow (RN ≥0.76 New Architecture + RN-web): las DOS capas
 * — contacto + difusa — viven en UNA definición, sin views anidadas.
 *
 * REGLA CHANEL DEL MARCO (D-358): donde una superficie gana
 * elevacion.reposo, PIERDE el borde hairline — borde + sombra = decir
 * lo mismo dos veces. El hairline queda para superficies SIN elevación.
 * Cableada en la definición de Tarjeta/Hoja, jamás pantalla por pantalla.
 *
 * Ley 6 intacta: las sombras JAMÁS se animan. Si una superficie se
 * desliza, se desliza la superficie y la sombra viaja con ella.
 * Sombras artesanales fuera de estos tokens: PROHIBIDAS.
 *
 * La calibración fina de estos valores se sella en la pantalla patrón
 * del Hogar (D-358) — acá se firma que el material existe y respira.
 */

export type ElevacionNivel = 'reposo' | 'elevada'
export type ElevacionTokens = Readonly<Record<ElevacionNivel, string>>

export const elevacion = {
  light: {
    reposo:  '0 1px 2px rgba(31,27,22,0.05), 0 2px 8px rgba(31,27,22,0.06)',
    elevada: '0 2px 4px rgba(31,27,22,0.08), 0 12px 32px rgba(31,27,22,0.12)',
  },
  dark: {
    // contacto mínimo: la elevación real la dice bg.card (paso de luminancia)
    reposo:  '0 1px 2px rgba(0,0,0,0.45)',
    elevada: '0 2px 6px rgba(0,0,0,0.55)',
  },
  memorial: {
    // conserva la elevación; superficies oscuras → resuelve como dark
    reposo:  '0 1px 2px rgba(0,0,0,0.45)',
    elevada: '0 2px 6px rgba(0,0,0,0.55)',
  },
} as const satisfies Record<'light' | 'dark' | 'memorial', ElevacionTokens>
