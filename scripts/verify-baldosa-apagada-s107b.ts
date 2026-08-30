/**
 * verify-baldosa-apagada-s107b — ¿EL APAGADO SE VE, Y SIGUE DICIENDO SU CAPA?
 *
 * 🔴 POR QUÉ EXISTE, Y ES LA MITAD IMPORTANTE: **`verify:contrast` NO MIDE
 * ESTO.** Aquél recorre PARES DE TOKENS declarados; el apagado de `Baldosa`
 * es **un `opacity: 0.45` en runtime** sobre el glifo y **un canto cambiado al
 * tinte de su capa**. Ninguno de los dos es un par registrado ⇒ *«391 pares,
 * 0 fallos» no dice absolutamente nada sobre el apagado.* Decir que «pasó el
 * gate» habría sido un verde de otra fuente.
 *
 * QUÉ MIDE, componiendo de verdad (alfa sobre el fondo de la baldosa):
 *   ① **el glifo apagado** — `capaText[capa]` al 45 % sobre `bg.card`
 *   ② **el canto apagado** — `capaBg[capa]` sobre `bg.card`
 * Los dos son GRÁFICA (no texto), así que el piso es **3:1**.
 *
 * ⚠️ **La matemática se REUSA de `verify-contrast.ts`, no se reescribe** — su
 * propio historial registra que un autor calculó la luminancia en LINEAL en
 * vez de sRGB y obtuvo números cómodos y falsos. *No se repite el error por
 * escribir la fórmula de nuevo.*
 *
 * ⚠️ Y lo que este instrumento **NO** dice: si el apagado se LEE como «todavía
 * no lo usás» y no como «deshabilitado». **Eso es ojo del founder.**
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ✅ **FIRMADO Y CERRADO (founder, 30-ago-2026): el glifo apagado SE VE BIEN EN
 * EL APARATO y queda como está.** Este archivo **deja de ser un gate y pasa a
 * ser un DATO DECLARADO**: sale siempre en 0 y reporta sus números.
 *
 * 🔴 **Por qué se degrada en vez de dejarlo en rojo, que era lo cómodo:** un
 * gate que queda ROJO POR DECISIÓN enseña a ignorar el rojo — y el día que un
 * rojo de verdad aparezca acá, nadie lo va a mirar. *Un instrumento cuyo rojo
 * ya no significa «hay que arreglar algo» no es un gate: es ruido con
 * autoridad.* Los números siguen impresos porque **el dato no cambió**: en
 * claro el glifo a 0.45 rinde 2.02–2.06 contra un piso gráfico de 3, y el
 * founder lo miró y lo aceptó. *Queda escrito para que nadie lo re-descubra
 * como si fuera nuevo.*
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { getTheme } from '../packages/ui/src/themes'

type RGBA = { r: number; g: number; b: number; a: number }

const parse = (c: string): RGBA => {
  const s = c.trim()
  if (s.startsWith('#')) {
    const h = s.slice(1)
    const n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
    return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16), a: n.length === 8 ? parseInt(n.slice(6, 8), 16) / 255 : 1 }
  }
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (!m) throw new Error(`color no parseable: ${c}`)
  const p = m[1].split(',').map((x) => parseFloat(x))
  return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }
}
const blend = (fg: RGBA, bg: RGBA): RGBA => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1,
})
/* sRGB, JAMÁS lineal — ver la advertencia de la cabecera. */
const lum = ({ r, g, b }: RGBA): number => {
  const f = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a: RGBA, b: RGBA) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

const PISO = 3
/* 🔴 LAS CAPAS QUE LOS CINCO MUNDOS USAN DE VERDAD, medidas del consumidor
   (`negocio.tsx`): paseo · grooming · adiestramiento · **guardería** = CUIDADO
   · veterinaria = IDENTIDAD. **Las otras dos NO las usa ningún mundo hoy** —
   se miden igual, marcadas, porque el día que entre una la trampa del ternario
   de `FilaCita` las trae acá. *Medir de más y decir cuál es cuál es honesto;
   medir de más y sumarlo todo al mismo veredicto, no.* */
const CAPAS = ['identidad', 'cuidado', 'comunidad', 'comunidadAmplia'] as const
const EN_USO = new Set(['identidad', 'cuidado'])
let fallos = 0

for (const modo of ['light', 'dark'] as const) {
  const t: any = getTheme(modo)
  if (!('capaText' in t) || !('capaBg' in t)) { console.log(`· ${modo}: sin capas (memorial degrada — no aplica)`); continue }
  const fondo = parse(t.bg.card)
  console.log(`\n── ${modo} ─────────────────────────────`)
  for (const capa of CAPAS) {
    const glifo = { ...parse(t.capaText[capa]), a: 0.45 }
    const rGlifo = ratio(blend(glifo, fondo), fondo)
    const rCanto = ratio(blend(parse(t.capaBg[capa]), fondo), fondo)
    const okG = rGlifo >= PISO
    // El canto NO tiene piso de 3: es una MARCA de categoría de 3 px, no un
    // control. Se reporta su número para que el founder sepa cuánto se ve.
    /* EL ALFA MÍNIMO QUE LLEGA AL PISO — para que el hallazgo sea accionable
       y no sólo un rojo. Se busca por barrido, no por fórmula: el compuesto no
       es lineal en alfa. `null` = ni al 100 % llega (el color mismo no da). */
    let minimo: number | null = null
    for (let a = 0.45; a <= 1.001; a += 0.01) {
      if (ratio(blend({ ...parse(t.capaText[capa]), a }, fondo), fondo) >= PISO) { minimo = Math.round(a * 100) / 100; break }
    }
    const enUso = EN_USO.has(capa)
    if (!okG && enUso) fallos++
    console.log(
      `${okG ? '✓' : '✗'} ${capa.padEnd(16)}${enUso ? ' [EN USO]' : ' [sin mundo]'} glifo@45% ${rGlifo.toFixed(2)} (piso ${PISO})` +
        ` · alfa mínimo ${minimo === null ? 'NINGUNO (ni al 100%)' : minimo}` +
        ` · canto ${rCanto.toFixed(2)} (informativo)`,
    )
  }
}
console.log(
  `\n${fallos} capa(s) EN USO por debajo del piso gráfico de ${PISO}.` +
    '\n✅ DATO DECLARADO, NO FALLO — el founder lo gateó en el aparato el 30-ago y firmó que se ve' +
    '\n   bien. Ver la cabecera: este instrumento no reprueba, informa.',
)
/* Sale SIEMPRE en 0: ver la cabecera. Un rojo por decisión firmada enseña a
   ignorar el rojo. */
process.exit(0)
