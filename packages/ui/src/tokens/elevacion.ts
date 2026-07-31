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
/** `halo` NO es un nivel: es el complemento del material en los temas
 *  OSCUROS. Por eso vive aparte de `ElevacionNivel` — `theme.elevacion[nivel]`
 *  sigue devolviendo solo sombras y nadie puede pedir "elevación halo". */
export type ElevacionTokens = Readonly<Record<ElevacionNivel, string>> & {
  /** El canto de luz. `null` en claro: ahí la sombra ya separa. */
  readonly halo: string | null
}

/** EL HALO — FIRMADO POR EL FOUNDER (S82, gate ③) EN SU FORMA DIRECCIONAL.
 *
 *  EL PROBLEMA, medido y no estético: en oscuro la sombra NO PUEDE
 *  separar. `elevacion.dark.reposo` es negro sobre fondo casi negro —
 *  física, no calibración. Y el otro canal, el paso de luminancia entre
 *  superficie y fondo, está **cerrado por los dos lados**: subir bg.card
 *  rompe SEIS pares AA firmados, y bajar bg.base no alcanza (con el
 *  fondo en negro absoluto el par llega a 1.083 — el +0.05 de WCAG
 *  aplana el extremo oscuro). Hoy: dark 1.037 · memorial 1.100. El
 *  founder lo cazó CUATRO veces antes de que existiera esta línea.
 *
 *  LA FORMA FIRMADA ES DIRECCIONAL — SOLO EL CANTO SUPERIOR. La variante
 *  que RODEA se montó como contraste, se miró, y MURIÓ en el gate
 *  (Ley 37). Y de ahí sale lo que hay que dejar escrito para que nadie
 *  lo reabra: **A6 (SIN CAJA) QUEDA INTACTA, SIN ENMIENDA**, porque un
 *  halo direccional NO ES UNA CAJA — no rodea, no encierra, no delimita:
 *  es el borde donde pegaría la luz. Lo que A6 prohíbe es el contorno
 *  que hace de caja, y una caja necesita cuatro lados. Si algún día
 *  alguien lo dibuja en los cuatro, eso SÍ es un borde con otro nombre y
 *  ahí sí hace falta mesa.
 *
 *  POR QUÉ ES TOKEN Y NO UNA LÍNEA EN Tarjeta: Ley 20 manda el material
 *  por token. Un halo artesanal por componente es cómo nacen los cinco
 *  valores distintos que después nadie puede cambiar de una vez.
 *
 *  LA ALTERNATIVA QUE NO SE TOMÓ, declarada para que no se re-descubra:
 *  el mismo efecto se puede escribir como `inset 0 1px 0` dentro del
 *  propio boxShadow, y sería más elegante (cero borde, todo material).
 *  NO se tomó por DOS razones: el founder firmó mirando la forma con
 *  borde, y `inset` en boxShadow de RN es soporte que habría que
 *  verificar en dispositivo — si no está soportado, no falla: NO SE
 *  DIBUJA, y un modo de falla silencioso es exactamente lo que esta
 *  casa dejó de aceptar (L-192). Queda como candidata con su prueba
 *  pendiente, no como mejora obvia. */
export const elevacion = {
  light: {
    reposo:  '0 1px 2px rgba(31,27,22,0.05), 0 2px 8px rgba(31,27,22,0.06)',
    elevada: '0 2px 4px rgba(31,27,22,0.08), 0 12px 32px rgba(31,27,22,0.12)',
    // en claro la sombra SÍ separa (papel sobre papel): el halo no hace falta
    // y agregarlo sería adorno — la regla Chanel lo mata antes de nacer.
    halo: null,
  },
  dark: {
    // contacto mínimo: la elevación real la dice bg.card (paso de luminancia)
    reposo:  '0 1px 2px rgba(0,0,0,0.45)',
    elevada: '0 2px 6px rgba(0,0,0,0.55)',
    halo: 'rgba(255,255,255,0.14)',
  },
  memorial: {
    // conserva la elevación; superficies oscuras → resuelve como dark
    reposo:  '0 1px 2px rgba(0,0,0,0.45)',
    elevada: '0 2px 6px rgba(0,0,0,0.55)',
    // memorial es "bosque nocturno" (base #0A0E0A) y tiene la MISMA física:
    // su par card/base mide 1.100. El halo es ESTÁTICO —no se anima, no
    // rebota—, así que la ley de memorial (nada se mueve) no lo toca.
    halo: 'rgba(255,255,255,0.14)',
  },
} as const satisfies Record<'light' | 'dark' | 'memorial', ElevacionTokens>
