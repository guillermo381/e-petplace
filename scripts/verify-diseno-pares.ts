/**
 * verify-diseno-pares.ts — el VOLCADOR de pares de R12 (S82-B r4).
 *
 * Enumera los pares texto/superficie y canto/fondo REALES de la casa en
 * CLARO y OSCURO y emite JSON para que verify:diseno (R12) los juzgue.
 * La matemática es la MISMA de verify-contrast.ts (S43) — parse/blend/
 * luminance copiadas literales para que los dos gates jamás midan
 * distinto. No reemplaza a verify:contrast (que gatea los 178 pares
 * curados por componente con sus exenciones de espec): este volcador
 * cubre el barrido SISTEMÁTICO de R12 — todo par de texto y todo canto,
 * en LOS DOS temas, sin curaduría por componente.
 *
 * Umbrales (los aplica R12, acá solo se declaran en el JSON):
 *   texto = 4.5 · canto/gráfica = 3.0 (no-textual WCAG).
 *
 * Correr suelto: pnpm exec tsx scripts/verify-diseno-pares.ts
 */

import { lightTheme, darkTheme, memorialTheme, getTheme } from '../packages/ui/src/themes'
// S84-B19: el COLOR del muro es un token de palette; lo que vive en la
// app es su aplicación, no su valor — por eso se puede medir desde acá.
import { palette } from '../packages/ui/src/tokens/palette'

type RGBA = { r: number; g: number; b: number; a: number }

function parse(color: string): RGBA {
  if (color.startsWith('#')) {
    const h = color.slice(1)
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: 1,
    }
  }
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/)
  if (!m) throw new Error(`Color no parseable: ${color}`)
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 }
}

function blend(fg: RGBA, bg: RGBA): RGBA {
  const a = fg.a
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1,
  }
}

function luminance({ r, g, b }: RGBA): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contraste(fgRaw: string, bgRaw: string, base: string): number {
  const bg = blend(parse(bgRaw), parse(base))
  const fg = blend(parse(fgRaw), bg)
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

export interface ParMedido {
  tema: 'light' | 'dark' | 'lightOficio' | 'darkOficio'
  clase: 'texto' | 'canto' | 'superficie' | 'fill'
  nombre: string
  ratio: number
  minimo: number
}

const pares: ParMedido[] = []
/** S83-B30 — LAS DOS CASAS. Hasta hoy el barrido sistemático medía SOLO
 *  el tema del cliente, así que la casa del prestador —que tiene su
 *  propio `bg.base`, su propio CTA y sus propios acentos desde S83— no
 *  entraba a NINGÚN gate. El defecto que lo destapó: el tapiz al 8%
 *  (firmado, B25) tiró el fill del CTA del prestador de 3.37 a 2.79 y
 *  ningún gate lo vio, porque el par no existía en ningún corpus. */
const temas = {
  light: lightTheme,
  dark: darkTheme,
  lightOficio: getTheme('light', 'oficio'),
  darkOficio: getTheme('dark', 'oficio'),
} as const

for (const [tema, t] of Object.entries(temas) as ['light' | 'dark' | 'lightOficio' | 'darkOficio', typeof lightTheme][]) {
  const base = t.bg.base
  const texto = (nombre: string, fg: string, bg: string) =>
    pares.push({ tema, clase: 'texto', nombre, ratio: contraste(fg, bg, base), minimo: 4.5 })
  const canto = (nombre: string, fg: string, bg: string) =>
    pares.push({ tema, clase: 'canto', nombre, ratio: contraste(fg, bg, base), minimo: 3 })
  // S82-B r19 — LA CLASE QUE FALTABA: SUPERFICIE contra FONDO. R12 medía
  // texto/superficie y por eso pasaba con nota alta mientras la pieza
  // desaparecía: una tarjeta con texto 16:1 sobre un fondo del que no se
  // separa es invisible como PIEZA aunque su contenido se lea perfecto.
  // Mínimo 1.25 (propuesto r19): no es umbral WCAG —no existe uno para
  // esto— sino el punto medido donde el ojo separa sin que la superficie
  // se lea gris (1.18 es el piso; >1.33 rompe la sobriedad del oscuro).
  // EL MÍNIMO ES SOLO DEL OSCURO, y el porqué es físico: en claro la
  // superficie tiene DOS canales (luminosidad y la sombra de tinta sobre
  // papel, que SÍ se ve), y en oscuro tiene UNO — una sombra oscura sobre
  // fondo oscuro no existe. En claro se mide informativo (mínimo 0) para
  // que el número esté a la vista sin fabricar un rojo que la sombra ya
  // resuelve.
  const superficie = (nombre: string, sup: string, fondo: string) =>
    pares.push({ tema, clase: 'superficie', nombre, ratio: contraste(sup, fondo, base), minimo: tema === 'dark' ? 1.25 : 0 })
  superficie('bg.card/bg.base', t.bg.card, t.bg.base)
  superficie('bg.elevated/bg.base', t.bg.elevated, t.bg.base)

  // TEXTO sobre sus superficies reales (primary/secondary — tertiary es
  // placeholder/decorativo, fuera de AA por la letra del gate S43).
  for (const s of ['base', 'card', 'overlay'] as const) {
    texto(`text.primary/bg.${s}`, t.text.primary, t.bg[s])
    texto(`text.secondary/bg.${s}`, t.text.secondary, t.bg[s])
  }
  // La voz de capa: sobre su tinte y sobre las superficies neutras.
  for (const k of Object.keys(t.capaText) as (keyof typeof t.capaText)[]) {
    texto(`capaText.${k}/capaBg.${k}`, t.capaText[k], t.capaBg[k])
    texto(`capaText.${k}/bg.card`, t.capaText[k], t.bg.card)
  }
  // Status: la voz sobre su tinte.
  for (const k of ['success', 'warning', 'danger', 'info'] as const) {
    const kText = `${k}Text` as const, kBg = `${k}Bg` as const
    if (kText in t.status && kBg in t.status)
      texto(`status.${kText}/status.${kBg}`, (t.status as Record<string, string>)[kText], (t.status as Record<string, string>)[kBg])
  }
  // El CTA (Ley 21: el slot del par).
  texto('accent.ctaTexto/accent.cta', t.accent.ctaTexto, t.accent.cta)

  // CANTOS (no-textual 3:1): el hex PURO de capa como canto SÓLIDO al
  // borde de una superficie (FilaCita/CantoCurva sólido) — contra la
  // superficie que lo porta y contra el fondo de la pantalla.
  for (const k of Object.keys(t.capa) as (keyof typeof t.capa)[]) {
    canto(`capa.${k}/bg.card`, t.capa[k], t.bg.card)
    canto(`capa.${k}/bg.base`, t.capa[k], t.bg.base)
  }
  // El fill del chip entidad (Ley 21 controlLleno) como bloque sobre fondo.
  if ('controlLleno' in t.accent)
    canto('accent.controlLleno/bg.card', (t.accent as Record<string, string>).controlLleno, t.bg.card)

  // ── S83-B30 · LA CLASE QUE FALTABA: **FILL SOBRE FONDO** (3:1) ──
  // El gate medía el LABEL sobre el fill (¿se lee lo que dice?) y nunca
  // el FILL sobre el fondo (¿se ve el botón?). Son dos preguntas y la
  // casa solo tenía guard para una — es la causa raíz compartida de
  // D-590 (el CTA sin barrido), D-606 (la gráfica en tertiary) y D-599
  // (la galería fuera del corpus): **los pares no-textuales se agregaban
  // A MANO, así que ningún elemento nuevo entraba solo.** Acá entran por
  // enumeración de los slots, no por lista.
  const fill = (nombre: string, f: string, fondo: string) =>
    pares.push({ tema, clase: 'fill', nombre, ratio: contraste(f, fondo, base), minimo: 3 })
  for (const slot of ['cta', 'active', 'control', 'marcaEleccion'] as const) {
    if (slot in t.accent) {
      const v = (t.accent as Record<string, string>)[slot]
      fill(`accent.${slot}/bg.base`, v, t.bg.base)
      fill(`accent.${slot}/bg.card`, v, t.bg.card)
    }
  }

  // ── S84-B19 · EL MURO ENTRA AL CORPUS ────────────────────────────────
  // EL HUECO, con el número que lo prueba: el muro del oficio es la ÚNICA
  // superficie del producto que NO SALE DEL TEMA — vive en
  // `apps/prestador/components/techo-oficio`, o sea en una app. Todo este
  // barrido enumera slots del tema, así que el muro era INVISIBLE para el
  // gate: `accent.cta` del oficio y el muro son EL MISMO HEX
  // (palette.tealDark) ⇒ **contraste 1.00, y pasaba en VERDE** porque
  // nadie medía ese par.
  //
  // Es la misma familia que cacé en S83 cuando `verify:contrast` no
  // medía los temas de oficio: allá era una CASA ciega, acá una
  // SUPERFICIE ciega. La cura es la misma — que entre al corpus.
  //
  // SE PUEDE MEDIR SIN CRUZAR TERRITORIO porque el COLOR del muro es un
  // token de `palette` (tealDark / tealDarkNoche); lo que vive en la app
  // es su APLICACIÓN, no su valor.
  //
  // ⚠️ LO QUE ESTO NO PRUEBA, dicho para que nadie lo lea de más: mide
  // los NÚMEROS de lo que podría pintarse sobre el muro; NO prueba que
  // ninguna pantalla pinte ahí el color prohibido. Eso exigiría ver el
  // código que monta sobre el muro, y el muro se recibe por prop. Lo que
  // cambia es que el 1.00 ahora SE VE en vez de no existir.
  // El muro oscurece en los DOS temas oscuros (D-407): mi primera
  // versión preguntaba `tema === 'dark'` y dejaba a darkOficio con el
  // muro claro — el mismo error de ALCANCE que esta regla vino a cerrar,
  // un piso más abajo. Lo cazaron los números al leerlos.
  const muro = tema.startsWith('dark') ? palette.tealDarkNoche : palette.tealDark
  const sobreMuro = (nombre: string, fg: string, minimo: number) =>
    pares.push({ tema, clase: minimo >= 4.5 ? 'texto' : 'fill', nombre: `${nombre}/MURO`, ratio: contraste(fg, muro, muro), minimo })
  // El par FIRMADO de §15b.2: sobre el muro el acento funcional es PAPEL.
  sobreMuro('papel pleno (light0)', palette.light0, 4.5)
  // Los que NO deben usarse ahí — entran para que su número EXISTA:
  // LOS VEDADOS ENTRAN COMO INFORMATIVOS (mínimo 0), y la distinción es
  // la que vuelve honesta a la regla: NO son regresiones que alguien deba
  // curar — son colores que §15b.2 ya PROHIBIÓ sobre el muro, y se miden
  // para que su número EXISTA en vez de no aparecer. Marcarlos como fallo
  // pondría roja a R12 contra código correcto; exigirles 4.5 sería
  // pedirles que sirvan justo donde están vedados.
  sobreMuro('accent.cta (VEDADO §15b.2 — informativo)', (t.accent as Record<string, string>).cta, 0)
  sobreMuro('text.primary (VEDADO — informativo)', t.text.primary, 0)
}

// ── R15 (S82-B r6): el volcado de TOKENS del tema del cliente —
// los tres temas que el cliente consume, aplanados a rutas con su
// valor string, para que el lint juzgue identidades (no ratios). ──
export interface TokenPlano {
  tema: string
  ruta: string
  valor: string
}
const tokens: TokenPlano[] = []
function aplanar(tema: string, obj: unknown, ruta: string) {
  if (typeof obj === 'string') {
    tokens.push({ tema, ruta, valor: obj })
    return
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => aplanar(tema, v, `${ruta}[${i}]`))
    return
  }
  if (obj !== null && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) aplanar(tema, v, ruta ? `${ruta}.${k}` : k)
  }
}
aplanar('light', lightTheme, '')
aplanar('dark', darkTheme, '')
aplanar('memorial', memorialTheme, '')

// Salida: JSON por stdout ({ pares, tokens } — R12 y R15 lo consumen);
// legible con --tabla.
if (process.argv.includes('--tabla')) {
  for (const p of pares) {
    const ok = p.ratio >= p.minimo
    console.log(`${ok ? '  ' : '✗ '}${p.tema.padEnd(5)} ${p.clase.padEnd(5)} ${p.nombre.padEnd(46)} ${p.ratio.toFixed(2)} (mín ${p.minimo})`)
  }
  const fallan = pares.filter((p) => p.ratio < p.minimo)
  console.log(`\n${pares.length} pares medidos · ${fallan.length} bajo mínimo · ${tokens.length} tokens volcados`)
} else {
  console.log(JSON.stringify({ pares, tokens }))
}
