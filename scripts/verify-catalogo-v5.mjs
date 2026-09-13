#!/usr/bin/env node
/**
 * VERIFY:CATALOGO-V5 — el gate que impide que `docs/CATALOGO_PIEZAS_V5.md`
 * envejezca.
 *
 * 🔴 **NACE PORQUE ESTA CASA YA PAGÓ ESTA CLASE TRES VECES, Y LAS TRES
 * VECES LA CURA NO FUE CORREGIR EL NÚMERO: FUE SACARLO O MEDIRLO.** El
 * contador de piezas de `packages/ui` publicaba **53 cuando eran 171** —con
 * su nota «RE-MEDIDO» al lado, o sea 28 sesiones—; el de wrappers decía
 * **26 cuando eran 122**; el de migraciones cayó **cuatro veces** y el de
 * fichas **seis**.
 *
 * **Un catálogo es peor que un contador**, porque publica MUCHOS números y
 * porque lo lee otra pista para decidir qué montar. *Un catálogo vencido no
 * desinforma a un lector: desinforma a cada pantalla que se componga con él.*
 *
 * ⇒ el catálogo **no se mantiene a mano: se verifica**. Este gate mide tres
 * cosas contra el objeto, y ninguna es «¿está bien escrito?»:
 *
 *  ① **toda pieza listada EXISTE** — si una muere y su entrada queda, C va a
 *    pedir algo que no está.
 *  ② **toda pieza listada está EXPORTADA** desde `packages/ui` — existir en
 *    disco no es existir para el consumidor (`L-318`, motor sin puerta).
 *  ③ **los consumidores publicados COINCIDEN con la medición.** Es el que
 *    de verdad lo mantiene vivo: cada vez que C monta una pieza, el número
 *    cambia y el gate lo dice.
 *
 * ⚠️ **LO QUE NO MIDE, declarado:** que la descripción sea cierta, que las
 * props listadas sean las que importan, ni que la captura corresponda. *Un
 * gate no puede leer si una frase describe bien una pieza* — eso lo sostiene
 * la regla de mantenimiento del propio catálogo, y su verde no la reemplaza.
 */

import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const CAT = 'docs/CATALOGO_PIEZAS_V5.md'
const INDEX = 'packages/ui/src/index.ts'

if (!existsSync(CAT)) { console.log(`✗ no existe ${CAT}`); process.exit(1) }
const cat = readFileSync(CAT, 'utf8')
const index = readFileSync(INDEX, 'utf8')

/** Cada entrada del catálogo abre con `### \`Nombre\`` y publica su cuenta
 *  de consumidores en una línea `**consumidores:** N`. Las dos cosas se
 *  leen del documento; los hechos, del objeto. */
/* ⚠️ **Se parte a mano y NO con un lookahead:** `$` bajo el flag `m` es
 * fin de LÍNEA, así que el cuerpo de cada entrada quedaba en una sola
 * línea y el gate daba 20 rojos idénticos sobre un catálogo correcto.
 * *Un rojo por la razón equivocada está tan roto como un verde por la
 * razón equivocada.* */
const entradas = cat.split(/\n### /).slice(1).map(bloque => {
  const [cabeza, ...resto] = bloque.split('\n')
  /* Una entrada puede nombrar VARIAS piezas — `SelectorOpcion` · `FiltroPills`
   * son el mismo concepto («el chip») con dos implementaciones. Se leen
   * TODAS, y la línea de consumidores tiene que traer una cuenta por cada
   * una, en el mismo orden. *Una entrada que nombra dos y publica un número
   * está incompleta, y eso es exactamente lo que hay que cazar.* */
  const nombres = [...cabeza.matchAll(/`(\w+)`/g)].map(m => m[1])
  return { nombres, cuerpo: resto.join('\n') }
}).filter(e => e.nombres.length)

if (!entradas.length) { console.log('✗ el catálogo no tiene entradas legibles'); process.exit(1) }

const contar = n => {
  try {
    const out = execSync(
      `grep -rlE "(^|[ ,{])${n}([ ,}]|$)" apps --include="*.tsx" 2>/dev/null | xargs grep -lE "from '@epetplace/ui'" 2>/dev/null || true`,
      { encoding: 'utf8' })
    return out.trim().split('\n').filter(Boolean).length
  } catch { return 0 }
}

let fallos = 0
let piezas = 0
for (const { nombres, cuerpo } of entradas) {
  const linea = cuerpo.match(/\*\*consumidores:\*\*\s*([^\n]+)/)
  if (!linea) {
    console.log(`  ✗ ${nombres.join(' · ')}: su entrada no publica «**consumidores:** N»`)
    fallos++
    continue
  }
  const dichos = [...linea[1].matchAll(/\d+/g)].map(m => +m[0])
  if (dichos.length !== nombres.length) {
    console.log(`  ✗ ${nombres.join(' · ')}: nombra ${nombres.length} pieza(s) y publica ${dichos.length} cuenta(s)`)
    fallos++
    continue
  }
  nombres.forEach((nombre, i) => {
    piezas++
    if (!new RegExp(`\\b${nombre}\\b`).test(index)) {
      console.log(`  ✗ ${nombre}: está en el catálogo y NO se exporta desde packages/ui`)
      console.log(`      una pieza que el consumidor no puede importar no existe para él`)
      fallos++
      return
    }
    const real = contar(nombre)
    if (dichos[i] !== real) {
      console.log(`  ✗ ${nombre}: el catálogo dice ${dichos[i]} consumidores y el objeto dice ${real}`)
      fallos++
    }
  })
}

// ④ la regla final tiene que seguir ahí — es el único contenido no medible
// que este gate puede vigilar, y es el que le da autoridad al documento.
if (!/lo que no está acá no se dibuja en la pantalla/i.test(cat)) {
  console.log('  ✗ el catálogo perdió su regla de cierre')
  fallos++
}

console.log()
if (fallos) {
  console.log(`✗ verify:catalogo-v5 — ${fallos} desajuste(s) sobre ${piezas} piezas.`)
  console.log('  El catálogo lo lee C para decidir qué montar: uno vencido')
  console.log('  no desinforma a un lector, desinforma a cada pantalla.')
  process.exit(1)
}
console.log(`verify:catalogo-v5 — VERDE · ${piezas} piezas en ${entradas.length} entradas, todas exportadas y con su cuenta al día`)
console.log('  ⚠️ Su verde dice «las piezas existen y los números son de hoy»,')
console.log('     jamás «las descripciones son ciertas». Eso lo sostiene quien lo escribe.')
