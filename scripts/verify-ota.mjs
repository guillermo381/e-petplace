#!/usr/bin/env node
/**
 * LA SEGUNDA MITAD DEL PASO ⓪ (S86 — firma de mesa).
 *
 *   EL PASO ⓪ VERIFICABA EL ANCLA; LE FALTABA VERIFICAR EL DESTINO.
 *   Un ancla limpia sobre un runtime que ningún binario tiene es un OTA
 *   perfecto que no le llega a nadie.
 *
 * QUÉ LO PARIÓ, con su fecha: el 4-ago-2026 se publicó un OTA del
 * prestador con el ancla verificada (12 hashes medidos contra
 * origin/main, árbol limpio, `eas update:list` leído después del
 * publish y mostrando el group propio como cabeza del branch) y **el
 * founder no vio ningún cambio**. Todo lo que el paso ⓪ sabía mirar
 * estaba VERDE. Lo que faltaba era una pregunta que nadie hacía:
 * **¿qué le responde el servidor a un aparato que pregunta como
 * aparato?** Es la familia de S85 en su forma más cara — salida
 * creíble, resultado falso.
 *
 * LA DIFERENCIA, y es toda la tesis de este archivo: `eas update:list`
 * describe **lo que guardaste**; esto mide **lo que se sirve**. Son dos
 * cosas distintas y solo la segunda es la que llega al teléfono.
 *
 * Uso:
 *   node scripts/verify-ota.mjs --app prestador --update 019fcda7-30a5-7ceb-857f-193354b576ec
 *   node scripts/verify-ota.mjs --app cliente   --update <id>  [--channel preview]
 *   node scripts/verify-ota.mjs --app prestador --runtime 9.9.9 --update x   (el rojo producido)
 *
 * Exit 0 = el aparato que exista va a recibir ESTE update.
 * Exit ≠0 = NO se distribuye. L-192: este guard sale rojo por diseño;
 * su prueba de fuego es `--runtime 9.9.9`, que está en su fixture.
 *
 * LOS TRES CASOS (firmados):
 *   ① El id servido ≠ el id publicado  → ROJO. Publicaste y el canal
 *      sirve otra cosa: el aparato va a recibir esa otra cosa.
 *   ② El runtime publicado no tiene NINGUNA build finished → ROJO.
 *      Es el caso literal de la letra: un OTA contra un runtime que
 *      ningún aparato tiene no puede salir en silencio.
 *   ③ Runtimes HUÉRFANOS (con build finished y que NO reciben este
 *      lote) → **AVISA, NO FRENA.** Es letra de mesa, y su porqué:
 *      *callarlo es lo que hizo creíble el diagnóstico equivocado del
 *      4-ago* — con el prestador en 1.0.3 se dio por hipótesis que la
 *      APK era 1.0.2, y nadie tenía a mano que el runtime 1.0.2 sigue
 *      sirviendo un update del 26-jul.
 *
 * Y UNA REGLA DE FORMA (L-197): si este guard NO PUEDE MEDIR, sale
 * ROJO — jamás verde. Un fallo degrada a AUSENCIA, nunca a un valor
 * que el consumidor use como cierto. El escape existe, es explícito y
 * es ruidoso: `--sin-builds`.
 */

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

// ── argumentos ───────────────────────────────────────────────────────
const arg = (n, def = null) => {
  const i = process.argv.indexOf(`--${n}`)
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1]
    : def
}
const tiene = (n) => process.argv.includes(`--${n}`)

const app = arg('app')
const updateEsperado = arg('update')
const canal = arg('channel', 'preview')
const plataforma = arg('platform', 'android')
const sinBuilds = tiene('sin-builds')

if (!app || !updateEsperado) {
  console.error('uso: node scripts/verify-ota.mjs --app <prestador|cliente> --update <updateId> [--channel preview] [--runtime X] [--sin-builds]')
  process.exit(2)
}

const rojos = []
const avisos = []

// ── la config del app: de dónde sale el runtime y la url ─────────────
const cfg = JSON.parse(readFileSync(join(RAIZ, 'apps', app, 'app.json'), 'utf8')).expo
const url = cfg?.updates?.url
const policy = cfg?.runtimeVersion?.policy

if (!url) {
  console.error(`✗ apps/${app}/app.json no declara updates.url — sin destino no hay nada que verificar.`)
  process.exit(2)
}
// El runtime NO se adivina: o sale de la policy declarada, o se pasa a
// mano. Derivarlo de otra cosa sería inventar el dato que este guard
// existe para comprobar.
const runtime = arg('runtime', policy === 'appVersion' ? cfg.version : null)
if (!runtime) {
  console.error(`✗ no puedo resolver el runtime de ${app}: policy="${policy}". Pasalo con --runtime.`)
  process.exit(2)
}

console.log(`── verify-ota · ${app} · canal ${canal} · runtime ${runtime} · ${plataforma}`)

// ── ① QUÉ SIRVE EL SERVIDOR, preguntado como pregunta el aparato ─────
async function servido(rt) {
  const r = await fetch(url, {
    headers: {
      'expo-platform': plataforma,
      'expo-runtime-version': rt,
      'expo-channel-name': canal,
      'expo-protocol-version': '1',
      'expo-expect-signature': 'false',
      accept: 'multipart/mixed',
    },
  })
  const cuerpo = await r.text()
  const m = cuerpo.match(/"id"\s*:\s*"([0-9a-f-]{36})"/i)
  return { status: r.status, id: m ? m[1] : null }
}

let srv
try {
  srv = await servido(runtime)
} catch (e) {
  // L-197: no pudo medir ⇒ ROJO, jamás verde.
  console.error(`✗ NO PUDE PREGUNTARLE AL SERVIDOR (${e.message}). No es verde: es que no sé.`)
  process.exit(1)
}

if (!srv.id) {
  rojos.push(
    `el servidor NO sirve NINGÚN update para runtime ${runtime} en el canal ${canal} (HTTP ${srv.status}).\n` +
    `     Un aparato con ese runtime se queda con su bundle embebido.`,
  )
} else if (srv.id !== updateEsperado) {
  rojos.push(
    `EL CANAL SIRVE OTRA COSA.\n` +
    `     publicado : ${updateEsperado}\n` +
    `     se sirve  : ${srv.id}\n` +
    `     El aparato va a recibir el segundo, no el tuyo.`,
  )
} else {
  console.log(`✓ ① el servidor sirve ${srv.id} — es el publicado`)
}

// ── ② y ③ LOS BINARIOS QUE EXISTEN ───────────────────────────────────
if (sinBuilds) {
  console.log('⚠️  --sin-builds: NO se comprobó que exista un binario para este runtime.')
  console.log('    Eso es la mitad ② del guard, y se está salteando A PROPÓSITO.')
} else {
  let builds
  try {
    const out = execFileSync(
      'npx',
      ['eas-cli', 'build:list', '--platform', plataforma, '--limit', '30', '--json', '--non-interactive'],
      { cwd: join(RAIZ, 'apps', app), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 24 },
    )
    const i = out.indexOf('[')
    builds = JSON.parse(out.slice(i))
  } catch (e) {
    // L-197 otra vez: sin dato no se opina.
    console.error(`✗ NO PUDE LEER LAS BUILDS (${e.message}).`)
    console.error('  Si es urgente y lo asumís, corré con --sin-builds: queda escrito que se salteó.')
    process.exit(1)
  }

  /* El escape de la enmienda S107: explícito, con NOTA obligatoria, y ruidoso.
     No afloja el guard — lo convierte en una declaración firmada de quien sabe
     algo que EAS no puede saber. */
  const iLocal = process.argv.indexOf('--binario-local')
  const notaLocal = iLocal > -1 ? process.argv[iLocal + 1] : null
  if (iLocal > -1 && !notaLocal) {
    console.error('✗ --binario-local exige una NOTA: quién lo cortó y cuándo. Sin eso no se declara nada.')
    process.exit(1)
  }

  const vivas = builds.filter((b) => b.status === 'FINISHED' && b.channel === canal)
  const runtimesVivos = [...new Set(vivas.map((b) => b.runtimeVersion))].sort()

  if (!runtimesVivos.includes(runtime) && notaLocal) {
    console.log(`⚠️ ② SIN build de EAS para ${runtime}, pero se DECLARÓ un binario local:`)
    console.log(`     «${notaLocal}»`)
    console.log('     El rojo queda salteado POR DECLARACIÓN, y esta línea es su registro.')
  } else if (!runtimesVivos.includes(runtime)) {
    /* ✏️ ENMIENDA S107 — EL GUARD DECÍA MÁS DE LO QUE MEDÍA, y costó una
     *  decisión equivocada.
     *
     *  Decía: «es un OTA perfecto que NO LE LLEGA A NADIE». Eso es una
     *  afirmación sobre EL MUNDO, y este bloque sólo puede ver **las builds
     *  registradas en EAS**. 🔴 Un binario cortado en LOCAL e instalado por
     *  `adb` —cosa que esta casa hace, con precedente en S78— **es invisible
     *  a esta medición**, y el 29-ago hubo exactamente uno: el founder tenía
     *  un 1.0.7 corriendo, los OTAs le llegaban, y el guard afirmó que no le
     *  llegaban a nadie. *Medido: 12 builds en EAS, ninguna 1.0.7. La
     *  medición era impecable; la conclusión, falsa.*
     *
     *  ⇒ **El rojo se conserva** —sigue siendo el caso del 4-ago y sigue
     *  frenando— **pero ahora dice QUÉ MIDIÓ, no qué concluye.** Es `L-432`
     *  en su forma más pura: una medición bien hecha contestando otra
     *  pregunta. *Un guard que declara su alcance se puede saltear con un
     *  dato; uno que afirma sobre el mundo obliga a discutirle.* */
    rojos.push(
      `NINGÚN BINARIO **REGISTRADO EN EAS** TIENE EL RUNTIME ${runtime} (canal ${canal}).\n` +
      `     Builds finished en EAS: ${runtimesVivos.join(', ') || '(ninguna)'}\n` +
      `     ⚠️ ESTA MEDICIÓN NO VE BINARIOS LOCALES instalados por adb — si hay uno\n` +
      `        con este runtime, el update SÍ le llega y este rojo es del instrumento,\n` +
      `        no del update. Se declara con --binario-local <nota> y queda escrito.`,
    )
  } else {
    const ultima = vivas.find((b) => b.runtimeVersion === runtime)
    console.log(`✓ ② existe build finished para ${runtime} (${ultima.id.slice(0, 8)}, ${String(ultima.completedAt).slice(0, 10)})`)
  }

  // ③ HUÉRFANOS — avisa, no frena (letra de mesa).
  const huerfanos = runtimesVivos.filter((r) => r !== runtime)
  for (const r of huerfanos) {
    let que = '(no pude preguntar)'
    try {
      const s = await servido(r)
      que = s.id ? s.id : '(nada — se quedan con el bundle embebido)'
    } catch { /* se declara como no medido, no se inventa */ }
    avisos.push(`runtime ${r} tiene binario instalable y NO recibe este lote · hoy se le sirve: ${que}`)
  }
}

// ── veredicto ────────────────────────────────────────────────────────
if (avisos.length) {
  console.log('')
  console.log(`⚠️  ③ RUNTIMES HUÉRFANOS (${avisos.length}) — esto AVISA, no frena:`)
  for (const a of avisos) console.log(`     · ${a}`)
  console.log('     Callarlo es lo que hizo creíble el diagnóstico equivocado del 4-ago.')
}

if (rojos.length) {
  console.log('')
  console.error(`✗ verify-ota EN ROJO (${rojos.length}) — NO SE DISTRIBUYE:`)
  for (const r of rojos) console.error(`   · ${r}`)
  process.exit(1)
}

console.log('')
console.log('✓ verify-ota VERDE — el aparato que exista va a recibir este update.')
