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
 * ── ESTE ARCHIVO SOBRESCRIBIÓ A SU ANTECESOR, Y HAY QUE SABERLO ────────────
 * 🔴 Existía `verify-moneda.mjs` desde **S82-A r16** con el mismo propósito, y
 *    **NUNCA estuvo cableado en `package.json`**: nadie lo corrió nunca. *El
 *    riel tenía su guard desde el día uno, y el guard estaba tan huérfano como
 *    el riel — por eso el número no bajó en treinta y pico de sesiones.*
 *    **De él se conserva lo que tenía mejor** (abajo); se agrega el
 *    discriminador corregido, la auto-prueba y el reporte con archivo y línea.
 *
 * **EL BASELINE ES POR APP, y eso es suyo, no mío:** *«el baseline es POR APP,
 * para que el prestador —que se barre en su propia sesión— no tape una
 * regresión del cliente ni al revés»* (S82). Se conserva porque tenía razón.
 *
 * **CONDICIÓN DE MUERTE (también de S82, sigue valiendo):** este guard se
 * retira el día que el baseline llegue a **0 en las dos apps** y el riel sea el
 * único camino. *Un guard que sobrevive a su razón es basura que después nadie
 * se anima a tocar.*
 *
 * ── POR QUÉ TRINQUETE Y NO GATE DURO ──────────────────────────────────────
 * Al nacer hay **41 en el cliente y 20 en el prestador**, contra **5 llamadas a
 * la fuente**. Un gate duro estaría rojo desde el minuto cero y se apagaría por
 * costumbre. *La cura es de C (lote 3b) y no de este gate.*
 *
 * ── EL DISCRIMINADOR SE ENSANCHÓ (S116-A, 13-sep) Y ESTÁ MEDIDO POR QUÉ ────
 * 🔴 El primero exigía un **`$` en la misma línea**. Medido contra el censo de
 *    C: **perdía 17 sitios, y los 17 eran plata de verdad.** Todos del mismo
 *    patrón — `t('clave', { precio: x.toFixed(2) })` — donde **el `$` vive en
 *    el diccionario de i18n, no en la línea**. En pantalla sale `$6.00` igual.
 *    *Un discriminador que exige ver el símbolo no puede ver la plata que se
 *    arma en dos pedazos.*
 *
 * **Hoy cuenta:** `toFixed(2)` o el literal `$${`, **salvo líneas de bytes**
 * (`1024` / `1048576`), que es **la única clase de falso positivo que apareció
 * al clasificar los 59 uno por uno**: `lib/censo-almacenamiento.ts:56`, que
 * formatea megabytes.
 *
 * ⚠️ **`$${` hoy aporta CERO** —medido: no hay ninguna línea que lo tenga sin
 *    `toFixed(2)`— y se conserva igual, porque cubre el caso de un monto ya
 *    formateado como string. *Se declara para que nadie lea su presencia como
 *    evidencia de que atrapa algo.*
 *
 * 📌 **Y una corrección a la clasificación, para que no se repita:** al separar
 *    plata de no-plata, `despensa/index.tsx:451` cayó del lado equivocado por
 *    tener `peso_kg` en la línea — y es **precio por kilo**, o sea plata. *El
 *    nombre de una variable vecina no dice la unidad del número.*
 *
 * ALCANCE: `src` entero de las dos apps (no sólo `app/` + `components/`): la
 * plata también se formatea en `lib/` y en `hooks/`. Su verde dice «ninguna app
 * empeoró», jamás «la casa formatea bien».
 *
 * SALIDAS: 0 verde · 1 rojo (subió) · 2 NO CONCLUYENTE (no pudo medir).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const di = (s) => process.stdout.write(s + '\n')
const RAIZ = process.cwd()
const BASE_FILE = join(RAIZ, 'scripts/.baseline-moneda.json')

const APPS = {
  cliente: [join(RAIZ, 'apps/cliente/src')],
  prestador: [join(RAIZ, 'apps/prestador/src')],
}

/* La ÚNICA clase de falso positivo medida: bytes. Nada más se excluye. */
const ES_BYTES = (l) => /1024|1048576/.test(l)
const TIENE_PLATA = (l) => !ES_BYTES(l) && (/toFixed\(2\)/.test(l) || /\$\$\{/.test(l))
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

/* ══ AUTO-PRUEBA: si no distingue su rojo, su verde no vale (L-459) ══ */
if (!TIENE_PLATA('metadataMono={`$${precio.toFixed(2)}`}')) { di('ROJO · auto-prueba: no ve el caso de D-1095.'); process.exit(2) }
if (!TIENE_PLATA("t('x.alMes', { precio: m.monto.toFixed(2) })")) { di('ROJO · auto-prueba: no ve la plata que se arma con i18n (los 17 que perdía el discriminador viejo).'); process.exit(2) }
if (TIENE_PLATA('`[censo] TOTAL=${(total / 1048576).toFixed(2)}MB`')) { di('ROJO · auto-prueba: cuenta bytes como plata.'); process.exit(2) }
if (TIENE_PLATA('const s = `${nombre} vino`')) { di('ROJO · auto-prueba: cuenta una interpolación que no es plata.'); process.exit(2) }

/* ⚠️ LO QUE ESTE DISCRIMINADOR ACEPTA COMO RUIDO, declarado: un
   `peso.toFixed(2)` SÍ cuenta. No se puede distinguir por el nombre de la
   variable —`despensa/index.tsx:451` tiene `peso_kg` en la línea y ES plata—,
   así que el gate prefiere contar de más y que se declare, antes que perder
   plata de verdad. Medido: al clasificar los 59, sólo 1 no era plata. */

const listas = Object.fromEntries(Object.entries(APPS).map(([a, ds]) => [a, ds.flatMap((d) => archivos(d))]))
for (const [a, l] of Object.entries(listas)) {
  if (l.length === 0) { di(`ROJO · la app «${a}» no tiene archivos — no pude medir.`); process.exit(2) }
}

const porApp = {}
for (const [app, lista] of Object.entries(listas)) {
  const hits = []
  for (const f of lista) {
    readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
      if (!ES_COMENTARIO(l) && TIENE_PLATA(l)) hits.push({ f: relative(RAIZ, f), n: i + 1, t: l.trim() })
    })
  }
  porApp[app] = hits
}

const base = existsSync(BASE_FILE) ? JSON.parse(readFileSync(BASE_FILE, 'utf8')) : null
if (base === null || typeof base.baseline !== 'object') {
  const sem = Object.fromEntries(Object.entries(porApp).map(([a, h]) => [a, h.length]))
  writeFileSync(BASE_FILE, JSON.stringify({ baseline: sem, sembrado: new Date().toISOString() }, null, 2) + '\n')
  di(`baseline sembrado: ${JSON.stringify(sem)}`)
  process.exit(0)
}

di('verify:moneda · plata formateada FUERA de la fuente única · SOLO-BAJA')
let rojo = false
let bajo = false
for (const [app, hits] of Object.entries(porApp)) {
  const b = base.baseline[app]
  if (typeof b !== 'number') { di(`ROJO · el baseline no declara la app «${app}» — no pude medir.`); process.exit(2) }
  const nArch = new Set(hits.map((h) => h.f)).size
  di(`  ${app.padEnd(10)} ${String(hits.length).padStart(3)} ocurrencia(s) · ${nArch} archivos · baseline ${b}`)
  if (hits.length > b) {
    rojo = true
    di('')
    di(`✗ ${app}: EL NÚMERO SUBIÓ: ${b} → ${hits.length}. El trinquete NO deja subir.`)
    for (const h of hits) di(`   · ${h.f}:${h.n}\n       ${h.t.slice(0, 92)}`)
  } else if (hits.length < b) bajo = true
}

if (rojo) {
  di('')
  di('  La plata se formatea en UN lugar: `formatearPrecio` de @epetplace/i18n.')
  di('  `toFixed` produce PUNTO siempre y no mira el locale — la ley de S115 es COMA.')
  di('  Si el caso nuevo es legítimo, se declara y se sube el baseline A MANO,')
  di('  con su razón — jamás en el mismo commit que lo introdujo. Ver D-1095.')
  process.exit(1)
}
if (bajo) {
  di('')
  di('✓ VERDE — y BAJÓ en alguna app. Actualizá el baseline en el mismo commit que lo curó:')
  di('  un baseline que baja y no se asienta convierte la próxima subida en invisible.')
  process.exit(0)
}
di('')
di('✓ verify:moneda VERDE — ninguna app subió.')
di('  (Su verde dice «no empeoró», jamás «está bien». La cura es de C, lote 3b — D-1095.)')
process.exit(0)
