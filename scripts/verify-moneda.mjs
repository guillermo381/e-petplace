#!/usr/bin/env node
/**
 * verify:moneda — TRINQUETE: la plata se formatea en UN solo lugar.
 *
 * LA LEY (S115): coma decimal y UNA sola fuente — `packages/i18n/src/moneda.ts`.
 *
 * POR QUÉ EXISTE, con el caso que lo parió: el founder vio `$6.00` con PUNTO
 * en «Confirmar y pagar» (D-1095). El sitio era
 * `apps/cliente/src/components/checkout-reserva.tsx:522`:
 *
 *     <Celda titulo={t('checkout.total')} metadataMono={`$${precio.toFixed(2)}`} />
 *
 * **`toFixed` es JavaScript puro: produce PUNTO siempre y no mira el locale.**
 * La fuente está sana —`Intl.NumberFormat('es-EC').format(6)` da `6,00`—, así
 * que lo que hay es BYPASS, no un defecto del riel.
 *
 * 🔴 Y LO QUE LO VUELVE URGENTE NO ES EL PUNTO, ES LA CONVIVENCIA: en ese mismo
 *    archivo, la MISMA variable `precio` sale `$6.00` en la línea 522 y `$6,00`
 *    en la 554, donde `SeccionFacturacion` sí llama a la fuente. *La casa no
 *    formatea mal: formatea de las dos maneras a la vez, sobre el mismo número.*
 *
 * POR QUÉ UN TRINQUETE Y NO UN GATE DURO: al nacer hay **42 ocurrencias en 32
 * archivos**, contra **5 llamadas a la fuente**. Un gate duro estaría rojo desde
 * el minuto cero y se apagaría por costumbre; el trinquete deja el número donde
 * está y **no lo deja subir**. *La cura es de C (lote 3b) y no de este gate.*
 *
 * ⚠️ EL DISCRIMINADOR, y es lo que hace que el número signifique algo: se cuenta
 *    una línea sólo si tiene **`toFixed(` CON un `$` en la línea**, o bien el
 *    literal **`$${`** (símbolo pegado a la interpolación).
 *    Sin el `$`, `toFixed(2)` también cuenta kilos y megabytes — medido: hay
 *    ocurrencias de esas en el cliente, y contarlas inflaría el baseline.
 *
 * ALCANCE DECLARADO: las PANTALLAS del cliente — `apps/cliente/src/app` y
 * `.../components`. **`lib/` queda afuera con su razón medida:**
 * `lib/censo-almacenamiento.ts` formatea **megabytes**, no plata
 * (`` `${(total/1048576).toFixed(2)}MB` ``), y el `$` que lo hacía entrar era
 * el de la interpolación, no un símbolo de moneda.
 *
 * 🔴 **POR ESO EL BASELINE ES 41 Y NO 42.** La medición que abrió `D-1095`
 * publicó **42**, y ese número traía **un falso positivo**: esa línea de MB.
 * *El grep original lo esquivaba por casualidad —usaba `toFixed(2)` literal y
 * las otras dos de ese archivo son `toFixed(1)`—, así que el error entró por
 * la única que coincidía.* **Se corrige acá, con su comando, en vez de
 * heredarlo: un baseline con un falso positivo adentro deja lugar para que
 * alguien agregue uno de verdad sin que el trinquete suene.**
 *
 * **El prestador NO se mide** — su censo no se hizo. Su verde dice «el cliente
 * no empeoró», jamás «la casa formatea bien».
 *
 * SALIDAS: 0 verde · 1 rojo (subió) · 2 NO CONCLUYENTE (no pudo medir).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const di = (s) => process.stdout.write(s + '\n')
const RAIZ = process.cwd()
const BASE_FILE = join(RAIZ, 'scripts/.baseline-moneda.json')
const DIRS = [join(RAIZ, 'apps/cliente/src/app'), join(RAIZ, 'apps/cliente/src/components')]

/* una línea cuenta si: tiene `$` Y (toFixed( … ) o una interpolación) */
const TIENE_PLATA = (l) => (/toFixed\s*\(/.test(l) && l.includes('$')) || /\$\$\{/.test(l)
const ES_COMENTARIO = (l) => /^\s*(\*|\/\/|\/\*)/.test(l)

function archivos(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue
    const p = join(dir, e)
    if (statSync(p).isDirectory()) archivos(p, out)
    else if (/\.(tsx|ts)$/.test(e)) out.push(p)
  }
  return out
}

const lista = DIRS.flatMap((d) => archivos(d))
if (lista.length === 0) { di('ROJO · cero archivos en el corpus — no pude medir.'); process.exit(2) }

/* ══ AUTO-PRUEBA: si no distingue su rojo, su verde no vale (L-459) ══ */
if (!TIENE_PLATA('metadataMono={`$${precio.toFixed(2)}`}')) { di('ROJO · auto-prueba: no ve el caso de D-1095.'); process.exit(2) }
if (TIENE_PLATA('const kg = peso.toFixed(2)')) { di('ROJO · auto-prueba: cuenta un toFixed que NO es plata.'); process.exit(2) }
if (TIENE_PLATA('const s = `${nombre} vino`')) { di('ROJO · auto-prueba: cuenta una interpolación sin $.'); process.exit(2) }

const hits = []
for (const f of lista) {
  const lineas = readFileSync(f, 'utf8').split('\n')
  lineas.forEach((l, i) => {
    if (!ES_COMENTARIO(l) && TIENE_PLATA(l)) hits.push({ f: relative(RAIZ, f), n: i + 1, t: l.trim() })
  })
}

const base = existsSync(BASE_FILE) ? JSON.parse(readFileSync(BASE_FILE, 'utf8')) : null
if (base === null || typeof base.baseline !== 'number') {
  writeFileSync(BASE_FILE, JSON.stringify({ baseline: hits.length, sembrado: new Date().toISOString() }, null, 2) + '\n')
  di(`baseline sembrado en ${hits.length}`); process.exit(0)
}

const porArchivo = {}
for (const h of hits) porArchivo[h.f] = (porArchivo[h.f] || 0) + 1
const nArch = Object.keys(porArchivo).length
di(`verify:moneda · ${hits.length} formateo(s) de plata FUERA de la fuente única · ${nArch} archivos · baseline ${base.baseline} SOLO-BAJA`)

if (hits.length > base.baseline) {
  const nuevos = hits.slice(0, 0) // no se puede saber cuál es nuevo: el baseline es un número
  di('')
  di(`✗ EL NÚMERO SUBIÓ: ${base.baseline} → ${hits.length}. El trinquete NO deja subir.`)
  di('')
  di('  La plata se formatea en UN lugar: `formatearPrecio` de @epetplace/i18n.')
  di('  `toFixed` produce PUNTO siempre y no mira el locale — la ley de S115 es COMA.')
  di('')
  di('  Los sitios de hoy (archivo:línea):')
  for (const h of hits) di(`   · ${h.f}:${h.n}\n       ${h.t.slice(0, 92)}`)
  di('')
  di('  Si el caso nuevo es legítimo, se declara y se sube el baseline A MANO,')
  di('  con su razón — jamás en el mismo commit que lo introdujo.')
  di('  Ver D-1095. La cura del acumulado es de C (lote 3b).')
  process.exit(1)
}
if (hits.length < base.baseline) {
  di('')
  di(`✓ VERDE — y BAJÓ: ${base.baseline} → ${hits.length}. Actualizá el baseline en el mismo commit que lo curó:`)
  di(`  un baseline que baja y no se asienta convierte la próxima subida en invisible.`)
  process.exit(0)
}
di('')
di('✓ verify:moneda VERDE — el número no subió.')
di(`  (${hits.length} pendientes de D-1095, dueño C · lote 3b. Su verde dice «no empeoró», jamás «está bien».)`)
process.exit(0)
