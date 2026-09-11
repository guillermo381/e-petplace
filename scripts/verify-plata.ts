/**
 * EL CONTROL DE LA FUENTE ÚNICA DE PLATA (S115-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **Firma del founder (10-sep-2026): COMA DECIMAL Y PUNTO DE MILES en toda la
 * casa** — `$45,00` · `$1.234,50` · `$0,99`. *«es el formato ecuatoriano y el
 * de los RIDE que el cliente va a recibir del SRI — la app no puede decir un
 * número distinto del que dice su factura»*.
 *
 * 🔴 **LO QUE VIGILA, y es un defecto MEDIDO:** con el separador de miles, el
 * parseo que la casa tenía a mano devolvía un número **plausible, equivocado
 * y FINITO**:
 * ```
 *   '1.234,50' → replace(',','.') → '1.234.50' → parseFloat → 1.234
 * ```
 * `SliderPrecio` se protege con `Number.isFinite`, y `1.234` pasa ese guard ⇒
 * **la protección no se disparaba.** Por eso el brazo ④ no es decorativo: es
 * el que verifica que **un parseo fallido NO sea finito**, para que el guard
 * vuelva a servir.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Importa el ARCHIVO REAL — no reimplementa la fórmula (precedente del gate de
 * la barra, que extrae el path del archivo vivo: *mide la pieza y no su eco*).
 * Es `.ts` y corre con `tsx` a propósito: transpilar TS a mano fue frágil y se
 * rompió con un parámetro opcional.
 *
 * Corre: `pnpm verify:plata`
 */

import { formatearPrecio, parsearPrecio, monto } from '../packages/i18n/src/moneda'

let fallos = 0
let corridas = 0
const decir = (ok: boolean, que: string) => {
  corridas += 1
  if (!ok) { fallos += 1; console.error(`  ✗ ${que}`) }
}

console.log('① EL FORMATO FIRMADO — coma decimal, punto de miles')
for (const [valor, esperado] of [[45, '$45,00'], [1234.5, '$1.234,50'], [0.99, '$0,99'],
                                 [1234567.89, '$1.234.567,89'], [0, '$0,00']] as [number, string][]) {
  const r = formatearPrecio(valor)
  decir(r === esperado, `formatearPrecio(${valor}) dio «${r}», esperaba «${esperado}»`)
}

console.log('② IDA Y VUELTA — formatear y parsear son la misma verdad en dos direcciones')
for (const v of [45, 1234.5, 0.99, 1234567.89, 0, 7.05]) {
  const r = parsearPrecio(formatearPrecio(v))
  decir(Math.abs(r - v) < 0.005, `${v} → «${formatearPrecio(v)}» → ${r}`)
}

console.log('③ EL CASO QUE LO ORIGINÓ, con sus controles negativos')
for (const [texto, esperado] of [['1.234,50', 1234.5], ['1234,50', 1234.5], ['25,00', 25],
                                 ['$45,00', 45], ['0,99', 0.99], ['1.234.567,89', 1234567.89]] as [string, number][]) {
  const r = parsearPrecio(texto)
  decir(Math.abs(r - esperado) < 0.005, `parsearPrecio('${texto}') dio ${r}, esperaba ${esperado}`)
}

console.log('④ 🔴 UN PARSEO FALLIDO NO ES FINITO — para que `Number.isFinite` vuelva a ser guard')
for (const texto of ['1234.50', '1.234.50', '25.00', '', 'abc', '$', '1.23,456', '12.34,5', '1.2345,00']) {
  const r = parsearPrecio(texto)
  decir(!Number.isFinite(r), `parsearPrecio('${texto}') dio ${r} — es FINITO y el guard no dispara`)
}

console.log('⑤ `monto()` DELEGA — no duplica el formato, y ya no depende del idioma')
const EC = { codigo: 'USD', simbolo: '$', decimales: 2 }
decir(monto(1234.5, EC, 'es') === formatearPrecio(1234.5), 'monto() en es difiere de la fuente')
decir(monto(1234.5, EC, 'en') === monto(1234.5, EC, 'es'),
  `monto() da distinto por idioma: es «${monto(1234.5, EC, 'es')}» vs en «${monto(1234.5, EC, 'en')}» — ` +
  'la factura dice el mismo número en los dos')
/* El símbolo y los decimales SÍ siguen siendo del país: es lo que el riel resuelve. */
const CO = { codigo: 'COP', simbolo: '$', decimales: 0 }
decir(monto(1234.5, CO, 'es') === '$1.235',
  `monto() ignoró los decimales del país: dio «${monto(1234.5, CO, 'es')}»`)

console.log()
if (fallos > 0) {
  console.error(`verify:plata — ROJO · ${fallos} de ${corridas} comprobaciones fallaron`)
  process.exit(1)
}
console.log(`verify:plata — VERDE · ${corridas} comprobaciones sobre el archivo REAL`)
console.log(
  '   su verde dice «el formato es el firmado, el parseo es su inverso exacto, y lo que no parsea NO es ' +
  'finito» — JAMÁS «ninguna pantalla formatea a mano» (eso es `R87`) ni «los montos llegan bien a la base».',
)
