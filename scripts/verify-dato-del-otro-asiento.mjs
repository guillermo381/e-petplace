#!/usr/bin/env node
/**
 * ⭐ PROPUESTA (C · S114) — **el dato que es del OTRO asiento no se dibuja.**
 *
 * ═══ 🔴 LO QUE ESTE GATE **NO** ES, y se dice primero ══════════════════════
 *
 * La mesa preguntó si se puede cazar *«dos superficies del mismo objeto
 * diciendo cosas distintas del mismo dato»*. **En general NO SE PUEDE**, y no
 * lo construí: haría falta entender qué AFIRMA cada pantalla, que es
 * semántica. Un detector así sería romo —falsos por todos lados— y esta casa
 * ya firmó tres veces que *un instrumento que no puede producir su rojo no
 * está midiendo*, y su hermana: **un detector romo es peor que ninguno**,
 * porque su verde se lee como salud.
 *
 * **Lo que SÍ es mecanizable es el HECHO concreto**, y por eso el gate es
 * angosto: `casos_postventa.plazo_hasta` es el reloj de 48 h **del
 * prestador**, y §2 dice que la familia no lo ve. *Eso no es una opinión sobre
 * lo que una pantalla afirma: es un campo que no debe aparecer en un lado.*
 *
 * ── DE DÓNDE SALE ─────────────────────────────────────────────────────────
 * De un defecto MÍO, encontrado caminando: `mis-casos.tsx` declaraba en su
 * cabecera que el plazo no se muestra, **y la pantalla del caso lo mostraba**
 * —«responde antes del 9/9/2026, 10:27:56 AM»—, que además es una instrucción
 * AL PRESTADOR dicha a la familia. **Ningún gate podía verlo.**
 *
 * ⚠️ **Cuenta USOS, no menciones.** Los comentarios que explican la cura
 * nombran `plazoHasta` legítimamente; un detector por texto daría rojo sobre
 * su propia documentación — el mismo modo de falla que el contador de piezas
 * se cobró en esta sesión.
 *
 * ⚠️ **Su verde dice «el reloj del prestador no llega al cliente», JAMÁS «las
 * dos pantallas dicen lo mismo».** Lo segundo no lo mide nadie.
 */

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const RAIZ = process.cwd()

/** Quita comentarios de línea y de bloque para no contar prosa. */
function sinComentarios(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

const archivos = execSync(
  "git ls-files 'apps/cliente/src/**/*.ts' 'apps/cliente/src/**/*.tsx'",
  { cwd: RAIZ, encoding: 'utf8' },
).split('\n').filter(Boolean)

/* El dato prohibido en el asiento de la familia, con su razón. */
const PROHIBIDOS = [{ campo: 'plazoHasta', razon: 'el reloj de 48 h es del PRESTADOR (§2)' }]

const fallos = []
for (const ruta of archivos) {
  const cuerpo = sinComentarios(readFileSync(`${RAIZ}/${ruta}`, 'utf8'))
  for (const { campo, razon } of PROHIBIDOS) {
    /* `.campo` como acceso de propiedad: `c.plazoHasta`, `caso.plazoHasta`.
       No matchea la palabra suelta de un comentario ya removido. */
    const usos = cuerpo.match(new RegExp(`\\.${campo}\\b`, 'g'))
    if (usos !== null) fallos.push({ ruta, campo, razon, n: usos.length })
  }
}

for (const f of fallos) {
  console.log(`  ✗ **${f.ruta}** usa \`.${f.campo}\` ${f.n} vez(ces) — ${f.razon}.`)
}
console.log(
  `verify:dato-del-otro-asiento · ${archivos.length} archivo(s) del cliente · ` +
  `${PROHIBIDOS.length} dato(s) vigilado(s) · cuenta USOS, no menciones · ` +
  `⚠️ su verde dice «el reloj del prestador no llega al cliente», jamás «las dos pantallas dicen lo mismo»`,
)
process.exit(fallos.length > 0 ? 1 : 0)
