#!/usr/bin/env node
/**
 * VERIFY:HUELLA-POR-CASA — el gate que `icono-huella.ts` decía tener.
 *
 * 🔴 **NACE DECLARANDO UN HUECO: la regla se mudó a su propio módulo en
 * S113-B «para que su gate pueda importarla SIN arrastrar react-native», y
 * ese gate nunca se escribió.** Medido: cero consumidores de
 * `resolverHuella` fuera de `Icono.tsx`. *La mudanza era correcta y su
 * razón también; lo que faltó fue la mitad que la justificaba — y durante
 * tres sesiones la regla estuvo tan sin gate como antes, pero con una nota
 * diciendo que lo tenía.*
 *
 * Se escribe HOY porque hoy la regla cambia (la letra §1.1 apaga la huella
 * en la casa v5) y **cambiar una regla sin gate es cambiarla a ciegas**.
 *
 * LO QUE MIDE — los cuatro hechos que la regla tiene que sostener:
 *  ① en la casa v5 un glifo normal NO lleva huella
 *  ② en la casa v5 un glifo ESTRUCTURAL SÍ la lleva — si no, queda vacío
 *  ③ fuera de la casa v5 nada cambió (el prestador no se tocó)
 *  ④ el montaje `control` sigue apagando la huella donde siempre
 */

import { resolverHuella } from '../packages/ui/src/components/icono-huella.ts'

const TINTA = '#1C1D20'
const HUELLA = '#D10788'
const base = { colorHuella: HUELLA, colorTinta: TINTA }

const casos = [
  // ① la casa v5 apaga la huella de un glifo normal
  { d: 'v5 · glifo normal, presente', e: { ...base, casaV5: true, esEstructura: false }, esp: 'none' },
  { d: 'v5 · glifo normal, tab activa', e: { ...base, casaV5: true, esEstructura: false, activa: true }, esp: 'none' },
  // ② el estructural la conserva o queda vacío
  { d: 'v5 · ESTRUCTURAL presente', e: { ...base, casaV5: true, esEstructura: true }, esp: HUELLA },
  { d: 'v5 · ESTRUCTURAL en reposo', e: { ...base, casaV5: true, esEstructura: true, activa: false }, esp: TINTA },
  // ③ fuera de v5 nada cambió — es el prestador
  { d: 'sin v5 · glifo normal, presente', e: { ...base, casaV5: false, esEstructura: false }, esp: HUELLA },
  { d: 'sin v5 · marca en reposo', e: { ...base, casaV5: false, esEstructura: false, activa: false }, esp: 'none' },
  { d: 'sin v5 · marca activa', e: { ...base, casaV5: false, esEstructura: false, activa: true }, esp: HUELLA },
  { d: 'sin v5 · ESTRUCTURAL en reposo', e: { ...base, casaV5: false, esEstructura: true, activa: false }, esp: TINTA },
  // ④ el montaje sigue rigiendo
  { d: 'sin v5 · montaje control', e: { ...base, casaV5: false, esEstructura: false, montaje: 'control' }, esp: 'none' },
  { d: 'sin v5 · control sobre ESTRUCTURAL', e: { ...base, casaV5: false, esEstructura: true, montaje: 'control' }, esp: HUELLA },
]

let fallos = 0
for (const { d, e, esp } of casos) {
  const r = resolverHuella(e)
  const ok = r === esp
  if (!ok) fallos++
  console.log(`  ${ok ? '·' : '✗'} ${d.padEnd(36)} → ${r}${ok ? '' : `   (esperaba ${esp})`}`)
}

console.log()
if (fallos) {
  console.log(`✗ verify:huella-por-casa — ${fallos} de ${casos.length} fallan.`)
  console.log('  La huella de un glifo no se decide en la pantalla: se decide acá.')
  process.exit(1)
}
console.log(`verify:huella-por-casa — VERDE · ${casos.length}/${casos.length}`)
console.log('  ⚠️ Su verde dice «la regla hace lo que dice», jamás «el glifo se ve bien».')
console.log('     Lo segundo es el gate por ícono del founder, y no lo reemplaza nada.')
