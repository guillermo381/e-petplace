#!/usr/bin/env node
/**
 * verify:auth-receptor — UN MÉTODO RESUELTO SE LLAMA CON SU RECEPTOR.
 *
 * ── LO QUE PASÓ, y es la razón de que este gate exista ─────────────────────
 * `D-1098`: `registrarse` no podía llamar `auth.signUp`. La primera cura lo
 * resolvió con `resolverMetodo()` … **y devolvía la función SUELTA**:
 *
 *     if (typeof obj[nombre] === 'function') return obj[nombre]   // ← sin bind
 *
 * `obj[nombre]` **lee por la cadena de prototipos**, así que encontraba el
 * método del prototipo, lo devolvía sin receptor, **y la rama de abajo —la
 * única que bindeaba— no se ejecutaba nunca**. Al invocarlo, `supabase-js`
 * perdía su `this` y reventaba sobre su propio estado (`'storage' of
 * undefined`). *La cura cambió un modo de falla por otro y el camino siguió
 * roto.* Lo midió C en el aparato.
 *
 * ── LAS DOS COSAS QUE VIGILA ───────────────────────────────────────────────
 * ① **El resolvedor bindea en TODAS sus ramas.** Una rama sin `bind` devuelve
 *    un método que funciona en cualquier prueba de presencia y revienta al
 *    usarse.
 * ② **La invocación está guardada.** Un guard de PRESENCIA no alcanza:
 *    verifica que el método esté, no que se pueda llamar — que es exactamente
 *    la diferencia que costó esta ficha.
 *
 * ── Y SU CONTROL POSITIVO, que es lo que lo hace valer ─────────────────────
 * Simula el caso real —un objeto cuyo método vive en el prototipo y usa
 * `this`— y **prueba que sin `bind` revienta y con `bind` no**. Si esa sonda
 * dejara de reventar, el gate estaría midiendo otra cosa y lo dice.
 *
 * SALIDAS: 0 verde · 1 rojo · 2 NO CONCLUYENTE.
 */
import { readFileSync, existsSync } from 'node:fs'

const di = (s) => process.stdout.write(s + '\n')
const ARCHIVO = 'packages/api/src/wrappers/auth.ts'

/* ══ ① CONTROL POSITIVO DEL MECANISMO — el defecto tiene que ser reproducible ══ */
class MotorFalso {
  constructor() { this.storage = { ok: true } }
  signUp() { return this.storage.ok }        // depende de `this`, como supabase-js
}
const instancia = new MotorFalso()

/* el método existe leyéndolo por la cadena: así lo encontraba la versión rota */
if (typeof instancia.signUp !== 'function') { di('ROJO · la sonda no reproduce el shape.'); process.exit(2) }

const suelto = instancia.signUp                 // ← lo que hacía la versión rota
let reventoSuelto = false
try { suelto() } catch (e) { reventoSuelto = e instanceof TypeError }
if (!reventoSuelto) {
  di('ROJO · la sonda NO revienta suelta — este gate ya no mide el defecto de D-1098.')
  process.exit(2)
}

const bindeado = instancia.signUp.bind(instancia)
let okBindeado = false
try { okBindeado = bindeado() === true } catch { okBindeado = false }
if (!okBindeado) { di('ROJO · la sonda falla incluso bindeada — el control no discrimina.'); process.exit(2) }

di('verify:auth-receptor · control positivo ✓ (suelto revienta con TypeError · bindeado funciona)')

/* ══ ② EL ARCHIVO: todas las ramas del resolvedor bindean ══ */
if (!existsSync(ARCHIVO)) { di(`ROJO · no existe ${ARCHIVO} — no pude medir.`); process.exit(2) }
const src = readFileSync(ARCHIVO, 'utf8')

const i = src.indexOf('function resolverMetodo')
if (i < 0) { di('ROJO · no encontré resolverMetodo() — no pude medir.'); process.exit(2) }
const cuerpo = src.slice(i, src.indexOf('\n}', i) + 2)

const retornos = [...cuerpo.matchAll(/return\s+(?!null)([^;]+);/g)].map((m) => m[1])
const sinBind = retornos.filter((r) => !r.includes('.bind('))
di(`  ${retornos.length} retorno(s) de método en resolverMetodo() · sin bind: ${sinBind.length}`)

if (sinBind.length > 0) {
  di('')
  di('✗ HAY UN RETORNO SIN `bind` — el método sale sin receptor:')
  for (const r of sinBind) di(`   · return ${r.trim().slice(0, 80)}`)
  di('')
  di('  `obj[nombre]` lee por la cadena de prototipos: devolverlo suelto da una')
  di('  función que pasa cualquier prueba de presencia y revienta al usarse.')
  di('  Ver D-1098.')
  process.exit(1)
}

/* ══ ③ LA INVOCACIÓN ESTÁ GUARDADA ══ */
const guardaInvocacion = /catch\s*\([^)]*\)\s*\{[\s\S]{0,400}?instanceof TypeError/.test(src)
if (!guardaInvocacion) {
  di('')
  di('✗ LA INVOCACIÓN NO ESTÁ GUARDADA — falta el `catch` que distingue')
  di('  «el motor se rompió sobre su propio estado» de un error normal.')
  di('  Un guard de PRESENCIA verifica que el método esté, no que se pueda llamar.')
  process.exit(1)
}
di('  la invocación está guardada (TypeError → rebote tipado) ✓')
di('')
di('✓ verify:auth-receptor VERDE — el método se resuelve CON su receptor y su llamada está guardada.')
process.exit(0)
