#!/usr/bin/env node
/**
 * VERIFY:ALTO-CON-TEXTO — **un alto fijo que contiene texto es sospechoso.**
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 **NACE DE UNA CLASE, NO DE UN CASO — y la clase costó TRES vueltas.**
 * El campo de formulario recortaba el texto que la persona escribía, y la
 * causa no era del campo: **en React Native `fontSize` escala con la
 * preferencia de tamaño de letra del sistema, y un `height` en dp no.**
 * Con la letra en 1,3 el texto crece, la caja no, y **lo que sobra se
 * corta**.
 *
 * **Medido en el aparato, mismo campo, cambiando SÓLO la preferencia:**
 * escala 1,0 → valor **23,0 dp** · escala 1,3 → valor **6,7 dp**.
 *
 * ⚠️ **Y por eso ningún gate lo veía: el defecto no es invisible, es
 * invisible CON LA ESCALA 1,0** — la única que un emulador recién creado
 * tiene. *Un corpus de verificación que sólo prueba la configuración por
 * defecto no prueba la configuración de nadie.*
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── QUÉ MARCA, Y POR QUÉ SÓLO ESO ─────────────────────────────────────
 * Un `height:` numérico que **es un estilo de texto** (tiene `fontSize` o
 * `lineHeight` cerca) **o que CONTIENE texto** (hay un `<Text>`,
 * `<Texto>` o `<TextInput>` en su subárbol inmediato).
 *
 * **No marca** —y cada exención es una forma de estar bien, no un
 * permiso—:
 *   · **`minHeight` / `maxHeight`**: *piso, no jaula.* Un piso deja crecer;
 *     eso es exactamente la cura.
 *   · **derivado de la escala** (`getFontScale`, `medidas.`): sigue la
 *     preferencia, que es la otra cura.
 *   · **`'100%'` y porcentajes**: no son dp, no se desincronizan.
 *
 * ⚠️ **SU PUNTO CIEGO, declarado:** un `height` que contiene texto puede
 * estar perfectamente bien porque el texto **no escala** (un glifo, un
 * número de ancho fijo) o porque **sobra lugar**. *Este gate no dice «esto
 * está roto»: dice «esto se desincroniza si la persona agranda la letra, y
 * nadie lo verificó».* Por eso es trinquete y no una prohibición.
 *
 * ── POR QUÉ TRINQUETE Y NO CERO ───────────────────────────────────────
 * **Medido al escribirlo: 42 en producto** (31 en `packages/ui`, 11 en el
 * cliente). *Curarlos todos en una tanda sería tocar 42 sitios sin mirar
 * ninguno en el aparato — que es la forma de convertir un defecto medido
 * en cuarenta y dos defectos nuevos.* **Primero el número; la cura se
 * prioriza mirando.**
 *
 * ☠️ **LA GALERÍA QUEDA FUERA, con su razón:** sus alturas son cajas de
 * MAQUETA —un `height: 420` que acota una demo— y no prometen contener el
 * texto de nadie. *Meterlas al conteo haría que el número más grande del
 * gate fuera el que menos importa.* Mismo criterio que `verify:techos-locales`.
 */
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

/** Medido contra el objeto el 15-sep-2026. **Solo-baja.** */
const BASELINE = { ui: 31, cliente: 11 }

/** Deriva de la escala de letra ⇒ no se desincroniza. */
const DERIVA_DE_ESCALA = /getFontScale|medidas\.|medidasCampo/

const sospechosos = { ui: [], cliente: [] }
for (const patron of ["packages/ui/src/**/*.tsx", "apps/cliente/src/**/*.tsx"]) {
  for (const f of execSync(`git ls-files '${patron}'`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean)) {
    if (f.includes('/gallery/')) continue // ver la cabecera
    const L = readFileSync(f, 'utf8').split('\n')
    for (let i = 0; i < L.length; i++) {
      const m = L[i].match(/(?<![a-zA-Z])height:\s*([A-Za-z0-9_.[\]()]+)\s*,/)
      if (!m) continue
      const v = m[1]
      if (/^['"]/.test(v) || v === 'undefined' || /%/.test(v)) continue
      if (/minHeight|maxHeight/.test(L[i])) continue
      if (DERIVA_DE_ESCALA.test(L.slice(Math.max(0, i - 3), i + 1).join(' '))) continue
      const esTexto = /fontSize:|lineHeight:/.test(L.slice(Math.max(0, i - 6), i + 7).join('\n'))
      const contiene = /<Text[\s>]|<TextInput[\s>]|<Texto[\s>]/.test(L.slice(i, i + 14).join('\n'))
      if (!esTexto && !contiene) continue
      const donde = f.startsWith('packages/ui') ? 'ui' : 'cliente'
      sospechosos[donde].push(`${f}:${i + 1}  ${esTexto ? 'ES texto  ' : 'CONTIENE  '} ${L[i].trim().slice(0, 56)}`)
    }
  }
}

console.log('verify:alto-con-texto · un alto fijo que contiene texto se desincroniza')
console.log('   de la preferencia de tamaño de letra del sistema (medido: 23,0 dp → 6,7 dp con escala 1,3)')
let rojo = false
for (const k of ['ui', 'cliente']) {
  const n = sospechosos[k].length, base = BASELINE[k]
  const signo = n > base ? '✗' : n < base ? '↓' : '✓'
  if (n > base) rojo = true
  console.log(`\n  ${signo} ${k === 'ui' ? 'packages/ui' : 'apps/cliente'} · ${n} (baseline ${base})`)
  if (n > base) { console.log('     SUBIÓ — el gate es solo-baja:'); for (const s of sospechosos[k]) console.log(`       ${s}`) }
  else if (n < base) console.log(`     bajó de ${base} a ${n} — actualizá el baseline.`)
}
console.log('\n  ⚠️ Su verde dice «no nacieron altos fijos nuevos sobre texto», JAMÁS')
console.log('     «los que hay están bien»: un alto fijo puede sobrar lugar. Lo que')
console.log('     prueba que un campo se lee entero es una captura con la letra del')
console.log('     sistema agrandada — `scripts/tinta-campo.mjs`.')
process.exit(rojo ? 1 : 0)
