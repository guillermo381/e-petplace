/**
 * GATE · NINGÚN TÍTULO DE AVISO SIRVE PARA CUALQUIER OTRO (S113-A · 2.2.1).
 *
 * ── SU ROJO REAL ────────────────────────────────────────────────────────────
 * El aviso de anticipación decía **«Algo para mirar»**. No estaba roto, no
 * fallaba, y se lee perfectamente — *sirve igual para la cadera, para los ojos
 * y para el corazón, que es exactamente el problema*. El founder lo marcó en
 * la pasada: **el título tiene que decir QUÉ es.**
 *
 * 🔴 EL DISCRIMINADOR ES MECÁNICO, no una opinión sobre la redacción: **un
 * título sin interpolación no puede decir de qué habla.** Si la cadena no
 * lleva `{{…}}`, el mismo texto sale para todos los avisos de ese tipo —
 * *no importa cuán bien escrito esté.*
 *
 * ⚠️ LOS FALLBACKS ESTÁN EXENTOS, POR DECLARACIÓN Y CON SU RAZÓN: un aviso
 * viejo puede no traer tema, y **un título a medio componer («Su , con el
 * tiempo») es peor que uno genérico**. Se nombran uno por uno; si apareciera
 * un fallback nuevo sin declarar, sale rojo.
 *
 *   node scripts/verify-titulo-dice-que.mjs [--control]
 */
import { readFileSync, existsSync } from 'node:fs'

const DIC = 'apps/cliente/src/i18n/es.ts'

/** Las keys de título de la tarjeta «hoy». Se listan a mano a propósito: un
 *  gate que las descubre por prefijo mide la convención del nombre, no el
 *  hecho — y la convención se rompe en la primera key que alguien llame
 *  distinto (L-459 y su corolario). */
const TITULOS = [
  'hoyAviso', 'hoyCita', 'hoyVacuna', 'hoyAntiparasitario', 'hoyTip',
]

/** Exentos CON SU RAZÓN. No es una lista de perdón: cada uno dice por qué. */
const FALLBACKS = new Map([
  ['hoyAvisoSinTema', 'sólo si un aviso viejo no trae tema; a medio componer es peor'],
  ['hoyAntiparasitarioSinTema', 'ídem: sin el tipo, «Su antiparasitario  está vencido»'],
])

function valorDe(src, key) {
  const m = src.match(new RegExp(`\\n\\s*${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`))
  return m ? m[1] : null
}

if (process.argv.includes('--control')) {
  /* No toca el diccionario: prueba que el detector distinga las dos formas.
     *Un gate que sólo reconoce el caso que lo parió no está midiendo.* */
  const generico = (v) => !/\{\{[^}]+\}\}/.test(v)
  const ok = generico('Algo para mirar')
    && !generico('Su {{tema}}, con el tiempo')
    && !generico('La {{vacuna}} se acerca')
    && generico('Su próxima cita')
  console.log(ok
    ? '✅ control: un título con {{…}} dice de qué habla; uno sin, no'
    : '🔴 control: el detector no discrimina — no está midiendo')
  process.exit(ok ? 0 : 2)
}

if (!existsSync(DIC)) {
  console.log(`🔴 NO CONCLUYENTE: falta ${DIC}`)
  process.exit(2)
}
const src = readFileSync(DIC, 'utf8')

let rojo = 0, vistos = 0
console.log(`titulo-dice-que · ${TITULOS.length} título(s) de la tarjeta «hoy» · ${DIC}`)
for (const k of TITULOS) {
  const v = valorDe(src, k)
  if (v === null) {
    /* Ausente ≠ genérico, y se distingue: una key que no está puede haberse
       renombrado, y este gate mediría cuatro creyendo que mide cinco. */
    console.log(`  🔴 ${k} NO EXISTE en el diccionario — el gate no puede medirlo`)
    rojo++; continue
  }
  vistos++
  if (!/\{\{[^}]+\}\}/.test(v)) {
    console.log(`  ✗ ${k}: «${v}» — sirve para cualquier aviso de su tipo`)
    rojo++
  } else {
    console.log(`  ✅ ${k}: «${v}»`)
  }
}

/* Control positivo: si no midió ninguno, un «0 genéricos» sería verde vacío. */
if (vistos === 0) {
  console.log('\n🔴 NO CONCLUYENTE: no se leyó ni un título — no hay nada medido.')
  process.exit(2)
}

for (const [k, razon] of FALLBACKS) {
  const v = valorDe(src, k)
  if (v === null) { console.log(`  🔴 fallback declarado y ausente: ${k}`); rojo++; continue }
  console.log(`  · ${k} EXENTO — ${razon}`)
}

if (rojo) {
  console.log('\n✗ Un título sin interpolación no dice de qué habla.')
  console.log('  El dato viaja: `hoy.tema` para aviso/antiparasitario/tip,')
  console.log('  `vacuna` y `servicio` para los otros dos.')
  process.exit(1)
}
console.log(`\n✅ los ${vistos} dicen QUÉ son · ${FALLBACKS.size} fallback(s) exentos por declaración`)
