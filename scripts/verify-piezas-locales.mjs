#!/usr/bin/env node
/**
 * verify:piezas-locales — TRINQUETE: el rediseño se hace en la PIEZA, no en la
 * pantalla.
 *
 * ── QUÉ IMPIDE ─────────────────────────────────────────────────────────────
 * `LETRA_REDISENO_S116` §3 lo dice en una línea: **«Nada se rediseña en la
 * pantalla. C consume; si falta, pide por buzón.»** Y la vara de coherencia lo
 * pregunta por lote: *«¿bajó el conteo de piezas locales?»* — si no bajó, el
 * lote absorbió cero.
 *
 * Este gate es lo que vuelve esa frase exigible. **Sin él, la vía barata
 * siempre gana**: cuando falta una pieza, dibujarla en la pantalla funciona,
 * compila y se ve bien — y el catálogo se queda donde estaba. *El costo no
 * aparece en el lote que la dibuja: aparece tres lotes después, cuando la
 * misma cosa está cuatro veces y ninguna igual.*
 *
 * ── QUÉ CUENTA, y por qué así ──────────────────────────────────────────────
 * Los `.tsx` de **`apps/cliente/src`, recursivo, MENOS `src/app`**.
 * **Los `.ts` NO cuentan** —`foto-encuadre.ts` y `alta/tipos.ts`— porque son
 * helpers y tipos, no piezas: contarlos haría subir el número por trabajo que
 * este gate no vino a frenar.
 *
 * ── POR QUÉ GUARDA LA LISTA Y NO SÓLO EL NÚMERO ────────────────────────────
 * Para poder **nombrar el archivo nuevo** en vez de decir «subió». Un contador
 * dice que algo pasó; la lista dice qué. *Y de paso detecta el caso que un
 * contador no ve: uno que nace y otro que muere en el mismo lote — conteo
 * idéntico, catálogo igual de gordo.* Ese caso sale como AVISO, no como rojo:
 * el trinquete es sobre el número, y ensancharlo a «ningún nombre nuevo» lo
 * volvería ruidoso con cada renombre legítimo.
 *
 * ── ⊳ ENSANCHE S116-A LOTE 8 · POR QUÉ `src/` MENOS LAS RUTAS ──────────────
 * ⏪ Miraba **sólo `src/components`**, así que una pieza guardada en cualquier
 * otra carpeta —`src/lib`, `src/features`, donde sea— **no existía para el
 * trinquete**. *La vía barata no era dibujar en la pantalla: era guardar el
 * dibujo un directorio al costado.*
 *
 * 🔴 **Y `src/app` se excluye A PROPÓSITO, que es la mitad difícil del
 * ensanche:** ahí viven **113 rutas**, y una ruta NO es una pieza del catálogo.
 * Contarlas subiría el número de 61 a 174 y el trinquete pasaría a medir
 * *«cuántas pantallas tiene la app»* — un número que sube cuando el producto
 * crece, o sea un gate que se pone rojo por trabajo legítimo. **Un gate
 * ruidoso se apaga.**
 * ⇒ el corpus es *«todo lo que no es una ruta»*, y la exclusión va **por
 * carpeta y declarada**, no por heurística sobre el contenido del archivo.
 *
 * **Lo que apareció al ensancharlo: NADA.** Medido: los 174 `.tsx` del cliente
 * están **todos** en `app/` (113) o en `components/` (61); cero en cualquier
 * otro lado. *El valor no es un hallazgo: es que el hueco deje de existir* — y
 * se dice así en vez de reportar un ensanche como si hubiera encontrado algo.
 *
 * ── LO QUE NO MIDE, declarado ──────────────────────────────────────────────
 * **No sabe si una pieza local está justificada.** Una pantalla puede tener su
 * pieza propia con razón (un caso único que no pertenece al catálogo). Su verde
 * dice «el catálogo local no creció», jamás «todo lo que hay debe estar».
 * **Y no mide el prestador**: su rediseño no es de esta letra.
 *
 * SALIDAS: 0 verde · 1 rojo (subió) · 2 NO CONCLUYENTE (no pudo medir).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const di = (s) => process.stdout.write(s + '\n')
const RAIZ = process.cwd()
const DIR = join(RAIZ, 'apps/cliente/src')
/** Las RUTAS no son piezas. Se excluye por carpeta y declarado (ver el bloque
 *  del ensanche): contarlas convertiría el trinquete en un contador de
 *  pantallas, que sube cuando el producto crece. */
const RUTAS = 'app'
const BASE_FILE = join(RAIZ, 'scripts/.baseline-piezas-locales.json')

function piezas(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue
    const p = join(dir, e)
    if (statSync(p).isDirectory()) {
      if (relative(DIR, p) === RUTAS) continue
      piezas(p, out)
    }
    else if (e.endsWith('.tsx')) out.push(relative(DIR, p))
  }
  return out
}

if (!existsSync(DIR)) { di('ROJO · no existe apps/cliente/src — no pude medir.'); process.exit(2) }
const hoy = piezas(DIR).sort()
if (hoy.length === 0) { di('ROJO · cero .tsx en el corpus — no pude medir.'); process.exit(2) }

/* ══ AUTO-PRUEBA: si no ve una pieza en subcarpeta, su número miente (L-459) ══ */
if (!hoy.some((f) => f.includes('/'))) { di('ROJO · auto-prueba: no ve piezas en subcarpetas.'); process.exit(2) }
/* AUTO-PRUEBA DEL ENSANCHE: si las rutas se colaran, el número saltaría de 61 a
   174 y el trinquete mediría otra cosa. Su rojo es barato y su silencio caro. */
if (hoy.some((f) => f === RUTAS || f.startsWith(RUTAS + '/'))) { di('ROJO · auto-prueba: contó una RUTA como pieza.'); process.exit(2) }
if (hoy.some((f) => f.endsWith('.ts') && !f.endsWith('.tsx'))) { di('ROJO · auto-prueba: contó un .ts como pieza.'); process.exit(2) }

const base = existsSync(BASE_FILE) ? JSON.parse(readFileSync(BASE_FILE, 'utf8')) : null
if (base === null || typeof base.baseline !== 'number') {
  writeFileSync(BASE_FILE, JSON.stringify({ baseline: hoy.length, piezas: hoy, sembrado: new Date().toISOString() }, null, 2) + '\n')
  di(`baseline sembrado en ${hoy.length}`); process.exit(0)
}

const antes = new Set(base.piezas || [])
const nuevas = hoy.filter((f) => !antes.has(f))
const idas = [...antes].filter((f) => !hoy.includes(f))

di(`verify:piezas-locales · ${hoy.length} pieza(s) local(es) en apps/cliente/src (sin las rutas) · baseline ${base.baseline} SOLO-BAJA`)

if (hoy.length > base.baseline) {
  di('')
  di(`✗ EL NÚMERO SUBIÓ: ${base.baseline} → ${hoy.length}. El trinquete NO deja subir.`)
  di('')
  if (nuevas.length) {
    di('  Pieza(s) nueva(s):')
    for (const f of nuevas) di(`   · apps/cliente/src/${f}`)
  }
  di('')
  di('  El rediseño se hace en la PIEZA, no en la pantalla (LETRA_REDISENO_S116 §3).')
  di('  Si falta algo del catálogo v5, se pide por buzón a B — no se dibuja acá.')
  di('  Si la pieza local es legítima, se declara y se sube el baseline A MANO,')
  di('  con su razón — jamás en el mismo commit que la introdujo.')
  process.exit(1)
}
if (hoy.length < base.baseline) {
  di('')
  di(`✓ VERDE — y BAJÓ: ${base.baseline} → ${hoy.length}. El lote absorbió ${base.baseline - hoy.length}.`)
  if (idas.length) for (const f of idas) di(`   ☠ ${f}`)
  di('  Actualizá el baseline en el mismo commit que lo curó: uno que baja y no')
  di('  se asienta convierte la próxima subida en invisible.')
  process.exit(0)
}
if (nuevas.length) {
  di('')
  di(`⚠️  El número no subió, pero ${nuevas.length} nombre(s) cambiaron — una nació y otra murió:`)
  for (const f of nuevas) di(`   + ${f}`)
  for (const f of idas) di(`   − ${f}`)
  di('  No es rojo (el trinquete es sobre el número), pero el catálogo no adelgazó.')
}
di('')
di('✓ verify:piezas-locales VERDE — el número no subió.')
di(`  (${hoy.length} pendientes de absorber. Su verde dice «no creció», jamás «está bien».)`)
process.exit(0)
