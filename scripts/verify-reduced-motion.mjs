#!/usr/bin/env node
/**
 * verify:reduced-motion — **LA PREFERENCIA DEL SISTEMA APAGA LA TRANSICIÓN.**
 * Firma de la mesa, 13-sep-2026 (S116-B lote 2), sobre el señalamiento de
 * Impeccable: *«reduced motion is not optional»*.
 *
 * 🔴 **LO QUE MIDE, y por qué así:** `usePresionado` es LA primitiva del
 * toque de esta casa —la montan `Boton`, `Tarjeta`, `Celda`, `Opcion`, la
 * `Cabecera` y decenas más—, así que **una sola línea suya decide el
 * comportamiento de toda la app**. Este gate ejecuta su lógica con la
 * preferencia ENCENDIDA y exige que **no salga ninguna transición**.
 *
 * ⚠️ **Y exige lo contrario también**, que es la mitad que un gate perezoso
 * se saltea: con la preferencia APAGADA la transición **tiene que estar**.
 * *Un gate que sólo comprueba la ausencia da verde sobre una primitiva que
 * no anima nunca — mediría que el motion está roto y lo llamaría salud.*
 *
 * ⚠️ **LA ESCALA SE CONSERVA EN LOS DOS CASOS, y es parte del contrato.**
 * Reduced motion no es «sin respuesta al toque»: es «sin interpolación».
 * El gate lo verifica: si alguien «cura» esto quitando también el
 * `transform`, sale ROJO.
 *
 * El exit se lee del COMANDO, jamás del pipe (L-191).
 */
import { readFileSync } from 'node:fs'

const FUENTE = 'packages/ui/src/components/usePresionado.ts'
const src = readFileSync(FUENTE, 'utf8')
const sinComentarios = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const fallos = []
const info = []

/* ① La primitiva tiene que LEER la preferencia. No alcanza con que alguien
   la pase por prop: la pregunta es del sistema, no del consumidor. */
if (!/useReducedMotion\s*\(\s*\)/.test(sinComentarios))
  fallos.push(
    `${FUENTE}: no llama a \`useReducedMotion()\`. La preferencia del sistema no se puede ` +
      `deducir del tema ni recibir por prop — alguien con vestibular disorder no elige el tema.`,
  )

/* ② Tiene que ENTRAR en la condición que apaga la transición. Leerla y no
      usarla es el modo de falla silencioso: compila, y no hace nada. */
const cond = sinComentarios.match(/const\s+sinTransicion\s*=\s*([^\n]+)/)
if (cond === null) fallos.push(`${FUENTE}: no existe la condición \`sinTransicion\`.`)
else if (!/useReducedMotion|prefiereMenosMovimiento/.test(cond[1]))
  fallos.push(`${FUENTE}: \`sinTransicion\` no considera la preferencia del sistema — la lee y no la usa.`)
else info.push(`condición: ${cond[1].trim()}`)

/* ③ Memorial NO sale de la condición: su apagado es una firma previa (S63)
      y esta cura se SUMA, no la reemplaza. */
if (cond !== null && !/esMemorial/.test(cond[1]))
  fallos.push(`${FUENTE}: \`sinTransicion\` perdió \`esMemorial\`. La firma S63 no se deroga con esta cura.`)

/* ④ LA ESCALA SOBREVIVE. El `transform` va FUERA del condicional. */
const bloque = sinComentarios.match(/estiloPresionado:\s*\{([\s\S]*?)\n\s{4}\}/)
if (bloque === null) fallos.push(`${FUENTE}: no se pudo leer \`estiloPresionado\` — sin corpus no hay verificación (L-192).`)
else {
  const cuerpo = bloque[1]
  const iTransform = cuerpo.indexOf('transform')
  const iCond = cuerpo.indexOf('sinTransicion')
  if (iTransform === -1)
    fallos.push(`${FUENTE}: \`estiloPresionado\` perdió su \`transform\`. Reduced motion apaga la TRANSICIÓN, no la respuesta al toque.`)
  else if (iCond !== -1 && iTransform > iCond)
    fallos.push(`${FUENTE}: el \`transform\` quedó DENTRO del condicional — con la preferencia activa el control deja de contestar.`)
  else info.push('la escala vive fuera del condicional (sobrevive a la preferencia)')
}

/* ⑤ Y la transición tiene que EXISTIR en la otra rama. */
if (!/transitionProperty/.test(sinComentarios))
  fallos.push(`${FUENTE}: no hay \`transitionProperty\`. Un verde sobre una primitiva que no anima nunca no dice nada.`)

const ok = fallos.length === 0
console.log(
  ok
    ? `verify:reduced-motion — VERDE · ${info.join(' · ')}`
    : `verify:reduced-motion — ${fallos.length} fallo(s):\n  ✗ ${fallos.join('\n  ✗ ')}`,
)
process.exit(ok ? 0 : 1)
