/**
 * lib-arbol-montaje.mjs — EL ÁRBOL DE MONTAJE (S89-B ③).
 *
 * La deuda de instrumento sin dueño desde S87: la cura REAL del pareo
 * por VENTANA (R32: ±25 líneas alrededor del montaje) y por ARCHIVO
 * (M2 del burn-down: «este guard mira el archivo, no el árbol»).
 * Instrumento puro — no toca producto, no enmienda ley.
 *
 * QUÉ ES: un grafo de montaje POR SÍMBOLO. Cada archivo se parte en sus
 * declaraciones top-level capitalizadas (componentes); cada símbolo
 * conoce qué tags JSX monta; los tags se resuelven contra los imports
 * del archivo (relativos · alias `@/` por app · `@epetplace/ui` por
 * heurística de nombre) o contra símbolos del mismo archivo. Sobre ese
 * grafo se caminan CADENAS ruta→…→símbolo.
 *
 * POR QUÉ SÍMBOLO Y NO ARCHIVO — medido antes de construir (S89-B):
 * `perfil-piezas.tsx` exporta CUATRO componentes y el `<Campo>` vive
 * SOLO en `ControlTelefono` (l.185). El pareo por archivo de S86 acusó
 * a `cuenta-comercial/index.tsx` como anfitriona descubierta — pero esa
 * ruta importa SOLO `SeccionDesplegable`, que no monta ningún campo.
 * **El pareo por archivo fabricaba una cadena que no existe** (y el
 * guard actual, mirando solo el archivo, ni la veía ni la refutaba).
 * El árbol por símbolo dice la verdad en los dos sentidos.
 *
 * LÍMITES DECLARADOS (L-197: el alcance se dice, no se presume):
 *  · resolución ESTÁTICA por regex — no re-exports (`export { X } from`),
 *    no imports dinámicos, no render-props que pasen componentes como
 *    valor. Un tag no resuelto simplemente NO forma arista (se puede
 *    inspeccionar en `noResueltos`).
 *  · símbolos = declaraciones top-level `function X` / `const X =` con
 *    inicial MAYÚSCULA (la convención de componentes). Un componente
 *    definido inline dentro de otro cuenta como parte del cuerpo del
 *    padre — que es exactamente lo que un árbol de montaje quiere.
 *  · `@epetplace/ui` resuelve por nombre de archivo
 *    (`components/<Tag>.tsx` · `brand/<Tag>.tsx`); lo que el index del
 *    paquete re-exporta con otro nombre no forma arista.
 *  · la AUTO-PRUEBA (`autoPruebaArbol`) construye un árbol VIRTUAL con
 *    el caso mixto real y el discriminador del pareo-por-archivo — un
 *    consumidor la corre ANTES de creerle al grafo (L-192: un
 *    instrumento que no puede probar su regla reporta desde el aire).
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { posix as path } from 'node:path'

/** L-170 mecanizada: un censo NO lee comentarios como código. */
export const sinComentarios = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

// ─────────────────────────────────────────────────────────────────────
// carga
// ─────────────────────────────────────────────────────────────────────

function archivosBajo(dir) {
  const out = []
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e)
    if (statSync(p).isDirectory()) out.push(...archivosBajo(p))
    else if (/\.tsx?$/.test(p) && !p.endsWith('.d.ts')) out.push(p)
  }
  return out
}

/** La raíz `src` de la app a la que pertenece un archivo (para el alias `@/`). */
function raizApp(p) {
  const m = p.match(/^(.*?apps\/[^/]+\/src)(?=\/)/)
  return m ? m[1] : null
}

// ─────────────────────────────────────────────────────────────────────
// símbolos top-level (componentes capitalizados) con su cuerpo
// ─────────────────────────────────────────────────────────────────────

const RE_DECLARACION =
  /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Z][A-Za-z0-9_]*)|^(?:export\s+)?const\s+([A-Z][A-Za-z0-9_]*)\s*[=:]/gm

function simbolosDe(limpio) {
  const marcas = []
  for (const m of limpio.matchAll(RE_DECLARACION)) {
    marcas.push({ nombre: m[1] ?? m[2], desde: m.index })
  }
  const simbolos = new Map()
  marcas.forEach((marca, i) => {
    const hasta = i + 1 < marcas.length ? marcas[i + 1].desde : limpio.length
    // dos declaraciones del mismo nombre (raro): gana la primera, se declara
    if (!simbolos.has(marca.nombre)) simbolos.set(marca.nombre, { cuerpo: limpio.slice(marca.desde, hasta) })
  })
  // el default export: `export default function X` ya cae arriba;
  // `export default X` (alias) se marca sobre el símbolo nombrado.
  let porDefecto = null
  const df = limpio.match(/^export\s+default\s+(?:async\s+)?function\s+([A-Z][A-Za-z0-9_]*)/m)
  const da = limpio.match(/^export\s+default\s+([A-Z][A-Za-z0-9_]*)\s*;?\s*$/m)
  if (df) porDefecto = df[1]
  else if (da && simbolos.has(da[1])) porDefecto = da[1]
  return { simbolos, porDefecto }
}

const tagsDe = (src) => [...src.matchAll(/<([A-Z][A-Za-z0-9_]*)[\s/>]/g)].map((m) => m[1])

// ─────────────────────────────────────────────────────────────────────
// resolución de imports
// ─────────────────────────────────────────────────────────────────────

const RE_IMPORT = /import\s+([^'";]+?)\s+from\s*['"]([^'"]+)['"]/g

/** nombres locales que trae una cláusula de import (default + llaves + ns). */
function nombresDeClausula(clausula) {
  if (/^type\s/.test(clausula.trim())) return []
  const nombres = []
  const llaves = clausula.match(/\{([^}]*)\}/)
  if (llaves) {
    for (const parte of llaves[1].split(',')) {
      const limpio = parte.trim()
      if (limpio === '' || limpio.startsWith('type ')) continue
      const alias = limpio.match(/\bas\s+([A-Za-z0-9_]+)$/)
      nombres.push(alias ? alias[1] : limpio.split(/\s+/)[0])
    }
  }
  const fuera = clausula.replace(/\{[^}]*\}/, '').trim().replace(/^,|,$/g, '').trim()
  if (fuera !== '') {
    const ns = fuera.match(/\*\s+as\s+([A-Za-z0-9_]+)/)
    if (ns) nombres.push(ns[1])
    else if (/^[A-Za-z0-9_]+$/.test(fuera.replace(/,/g, '').trim())) nombres.push(fuera.replace(/,/g, '').trim())
  }
  return nombres
}

function resolverModulo(desde, spec, existe) {
  let base = null
  if (spec.startsWith('.')) base = path.join(path.dirname(desde), spec)
  else if (spec.startsWith('@/')) {
    const raiz = raizApp(desde)
    if (raiz === null) return null
    base = path.join(raiz, spec.slice(2))
  } else if (spec === '@epetplace/ui') return { ui: true }
  else return null // paquete externo — fuera del árbol
  base = path.normalize(base)
  for (const cand of [`${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')]) {
    if (existe(cand)) return { path: cand }
  }
  return { noResuelto: base }
}

// ─────────────────────────────────────────────────────────────────────
// el árbol
// ─────────────────────────────────────────────────────────────────────

export const RAICES_DEFAULT = ['apps/prestador/src', 'apps/cliente/src', 'packages/ui/src']

/**
 * Construye el grafo. `virtuales` (path → src) permite fixtures en
 * memoria — la auto-prueba y cualquier consumidor que quiera un rojo
 * producido sin tocar el disco.
 */
export function construirArbol({ raices = RAICES_DEFAULT, virtuales = {} } = {}) {
  const archivos = new Map() // path → { limpio, simbolos, porDefecto, imports: Map(nombre→spec), esRuta }
  const cargar = (p, src) => {
    const limpio = sinComentarios(src)
    const { simbolos, porDefecto } = simbolosDe(limpio)
    const imports = new Map()
    for (const m of limpio.matchAll(RE_IMPORT)) {
      for (const nombre of nombresDeClausula(m[1])) imports.set(nombre, m[2])
    }
    archivos.set(p, {
      limpio,
      simbolos,
      porDefecto,
      imports,
      esRuta: /\/src\/app\//.test(p) && /export\s+default/.test(limpio),
    })
  }
  for (const raiz of raices) {
    if (!existsSync(raiz)) continue
    for (const p of archivosBajo(raiz)) cargar(p, readFileSync(p, 'utf8'))
  }
  for (const [p, src] of Object.entries(virtuales)) cargar(path.normalize(p), src)

  const existe = (p) => archivos.has(p)

  // aristas: (path, simbolo) monta (path', simbolo') — y el índice inverso
  const montaA = new Map() // 'path#simbolo' → Set('path#simbolo')
  const montadoPor = new Map() // 'path#simbolo' → Set('path#simbolo')
  const noResueltos = []
  const clave = (p, s) => `${p}#${s}`
  const arista = (deP, deS, aP, aS) => {
    const de = clave(deP, deS)
    const a = clave(aP, aS)
    if (!montaA.has(de)) montaA.set(de, new Set())
    montaA.get(de).add(a)
    if (!montadoPor.has(a)) montadoPor.set(a, new Set())
    montadoPor.get(a).add(de)
  }

  for (const [p, nodo] of archivos) {
    for (const [nombre, s] of nodo.simbolos) {
      for (const tag of new Set(tagsDe(s.cuerpo))) {
        if (tag !== nombre && nodo.simbolos.has(tag)) {
          arista(p, nombre, p, tag) // definición en el mismo archivo
          continue
        }
        const spec = nodo.imports.get(tag)
        if (spec === undefined) continue // RN / externo / no importado
        const res = resolverModulo(p, spec, existe)
        if (res === null) continue
        if (res.ui) {
          // heurística por nombre dentro de packages/ui
          for (const cand of [`packages/ui/src/components/${tag}.tsx`, `packages/ui/src/brand/${tag}.tsx`]) {
            if (archivos.has(cand)) {
              const dest = archivos.get(cand)
              arista(p, nombre, cand, dest.simbolos.has(tag) ? tag : '*archivo*')
              break
            }
          }
          continue
        }
        if (res.noResuelto !== undefined) {
          noResueltos.push(`${p} → ${spec}`)
          continue
        }
        const dest = archivos.get(res.path)
        arista(p, nombre, res.path, dest.simbolos.has(tag) ? tag : '*archivo*')
      }
    }
  }

  return { archivos, montaA, montadoPor, noResueltos, clave }
}

/**
 * Las CADENAS ruta→…→símbolo (reportadas de la raíz al objetivo).
 * Una «ruta» es el símbolo default-export de un archivo bajo `src/app/`.
 * Ciclo-seguras y acotadas; `sinAnfitriona=true` cuando ningún camino
 * llega a una ruta (galería, código muerto, o un límite de resolución —
 * el consumidor lo DECLARA, jamás lo pinta verde por omisión).
 */
export function cadenasHaciaSimbolo(arbol, pathObjetivo, simboloObjetivo, { maxProfundidad = 14 } = {}) {
  const objetivo = arbol.clave(pathObjetivo, simboloObjetivo)
  const cadenas = []
  const caminar = (ref, camino) => {
    if (camino.length > maxProfundidad) return
    const [p, s] = ref.split('#')
    const nodo = arbol.archivos.get(p)
    const esRaiz = nodo !== undefined && nodo.esRuta && nodo.porDefecto === s
    const arriba = arbol.montadoPor.get(ref)
    if (esRaiz) {
      cadenas.push([ref, ...camino].map((r) => r))
      // una ruta puede a su vez estar montada por otra (layouts no cuentan:
      // no forman arista JSX normal) — no se sigue subiendo desde una raíz
      return
    }
    if (arriba === undefined) return
    for (const padre of arriba) {
      if (camino.includes(padre) || padre === ref) continue // ciclo
      caminar(padre, [ref, ...camino])
    }
  }
  caminar(objetivo, [])
  return { cadenas, sinAnfitriona: cadenas.length === 0 }
}

/** Azúcar: cuerpo de un símbolo (para preguntas textuales sobre la cadena). */
export function cuerpoDe(arbol, ref) {
  const [p, s] = ref.split('#')
  const nodo = arbol.archivos.get(p)
  if (nodo === undefined) return ''
  if (s === '*archivo*') return nodo.limpio
  return nodo.simbolos.get(s)?.cuerpo ?? ''
}

/**
 * Para R32 — los hitSlop NUMÉRICOS que viven DENTRO de los componentes
 * referenciados en una ventana de texto, resueltos por el árbol (mismo
 * archivo o un salto de import). El pareo por ventana no los veía: el
 * hitSlop de un vecino EXTRAÍDO (p. ej. `IdentidadDelTecho`) agranda el
 * mínimo de la esquina exactamente igual que uno inline.
 * LÍMITE DECLARADO: solo literales numéricos — un `hitSlop={expr}` no es
 * legible estáticamente y NO baja el mínimo (el default 10 sigue).
 */
export function hitSlopsVecinos(arbol, pathArchivo, ventanaSrc) {
  const nodo = arbol.archivos.get(pathArchivo)
  if (nodo === undefined) return { valores: [], fuentes: [] }
  const valores = []
  const fuentes = []
  const cosechar = (src, origen) => {
    for (const m of src.matchAll(/hitSlop[:=]\s*\{?\s*(\d+)/g)) {
      valores.push(Number(m[1]))
      fuentes.push(`${origen}: hitSlop ${m[1]}`)
    }
  }
  for (const tag of new Set(tagsDe(ventanaSrc))) {
    if (nodo.simbolos.has(tag)) {
      cosechar(nodo.simbolos.get(tag).cuerpo, `${tag} (mismo archivo)`)
      continue
    }
    const spec = nodo.imports.get(tag)
    if (spec === undefined) continue
    const res = resolverModulo(pathArchivo, spec, (p) => arbol.archivos.has(p))
    if (res === null || res.noResuelto !== undefined) continue
    if (res.ui) {
      for (const cand of [`packages/ui/src/components/${tag}.tsx`, `packages/ui/src/brand/${tag}.tsx`]) {
        const n = arbol.archivos.get(cand)
        if (n !== undefined) { cosechar(n.simbolos.get(tag)?.cuerpo ?? n.limpio, `${tag} (@epetplace/ui)`); break }
      }
      continue
    }
    const n = arbol.archivos.get(res.path)
    if (n !== undefined) cosechar(n.simbolos.get(tag)?.cuerpo ?? n.limpio, `${tag} (${res.path})`)
  }
  return { valores, fuentes }
}

// ─────────────────────────────────────────────────────────────────────
// AUTO-PRUEBA (L-192) — el árbol contra fixtures virtuales que
// reproducen el caso real. Devuelve [] o la lista de fallas.
// ─────────────────────────────────────────────────────────────────────

export function autoPruebaArbol() {
  const fallas = []
  const V = 'virtual/apps/x/src'
  const arbol = construirArbol({
    raices: [],
    virtuales: {
      // el caso MIXTO real (S86→S89): cuatro exports, el Campo en UNO solo
      [`${V}/components/perfil-piezas.tsx`]: `
export function SeccionDesplegable() { return <View /> }
export function ControlTelefono() { return <Campo valor={v} /> }
`,
      // ruta CUBIERTA: monta el que tiene Campo, con EvitaTeclado
      [`${V}/app/perfil.tsx`]: `
import { ControlTelefono, SeccionDesplegable } from '@/components/perfil-piezas'
export default function Perfil() { return <EvitaTeclado><ControlTelefono /><SeccionDesplegable /></EvitaTeclado> }
`,
      // el DISCRIMINADOR del pareo por archivo: importa SOLO el export
      // sin campo — el archivo-nivel la acusaba, el símbolo-nivel NO
      [`${V}/app/cuenta-comercial.tsx`]: `
import { SeccionDesplegable } from '@/components/perfil-piezas'
export default function CuentaComercial() { return <SeccionDesplegable /> }
`,
      // ruta DESCUBIERTA de verdad: alcanza el Campo sin EvitaTeclado
      [`${V}/app/descubierta.tsx`]: `
import { ControlTelefono } from '@/components/perfil-piezas'
export default function Descubierta() { return <ControlTelefono /> }
`,
      // vecino con hitSlop para R32
      [`${V}/components/vecino.tsx`]: `
export function Vecino() { return <Pressable hitSlop={14}><Icono /></Pressable> }
`,
      [`${V}/components/fila.tsx`]: `
import { Vecino } from './vecino'
export function Fila() { return <View><Vecino /><Icono nombre="campana" /></View> }
`,
    },
  })

  const piezas = `${V}/components/perfil-piezas.tsx`
  const { cadenas, sinAnfitriona } = cadenasHaciaSimbolo(arbol, piezas, 'ControlTelefono')
  if (sinAnfitriona) fallas.push('árbol: ControlTelefono salió SIN anfitriona — la resolución de imports no camina.')
  const raices = cadenas.map((c) => c[0])
  if (!raices.some((r) => r.endsWith('perfil.tsx#Perfil')))
    fallas.push('árbol: la cadena perfil→ControlTelefono no apareció.')
  if (!raices.some((r) => r.endsWith('descubierta.tsx#Descubierta')))
    fallas.push('árbol: la cadena descubierta→ControlTelefono no apareció — el rojo real quedaría mudo.')
  if (raices.some((r) => r.includes('cuenta-comercial')))
    fallas.push('árbol: cuenta-comercial aparece como anfitriona de ControlTelefono — ESE es el falso del pareo por archivo que este instrumento existe para no fabricar.')
  // …y el contra-caso que impide que lo de arriba pase POR MUERTE del
  // parser en vez de por precisión: cuenta-comercial SÍ es anfitriona de
  // SeccionDesplegable — si esta arista no existe, el «no aparece» de
  // ControlTelefono es un verde vacío (L-192).
  const sd = cadenasHaciaSimbolo(arbol, piezas, 'SeccionDesplegable')
  if (!sd.cadenas.map((c) => c[0]).some((r) => r.includes('cuenta-comercial')))
    fallas.push('árbol: cuenta-comercial NO aparece como anfitriona de SeccionDesplegable — el parser no formó la arista, y la precisión de arriba sería muerte disfrazada.')
  // cobertura textual sobre la cadena
  const cubierta = (cadena) => cadena.some((ref) => /EvitaTeclado/.test(cuerpoDe(arbol, ref)))
  const porRaiz = Object.fromEntries(cadenas.map((c) => [c[0].split('/').pop(), cubierta(c)]))
  if (porRaiz['perfil.tsx#Perfil'] !== true) fallas.push('árbol: la cadena de perfil no salió CUBIERTA (EvitaTeclado en la raíz).')
  if (porRaiz['descubierta.tsx#Descubierta'] !== false) fallas.push('árbol: la cadena descubierta no salió DESCUBIERTA.')

  // hitSlop del vecino extraído (R32)
  const fila = arbol.archivos.get(`${V}/components/fila.tsx`)
  const ventana = fila.simbolos.get('Fila').cuerpo
  const { valores } = hitSlopsVecinos(arbol, `${V}/components/fila.tsx`, ventana)
  if (!valores.includes(14)) fallas.push('árbol: el hitSlop 14 del vecino extraído no se cosechó — R32 seguiría ciego al otro lado de la extracción.')

  return fallas
}
