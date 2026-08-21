#!/usr/bin/env node
/**
 * verify-apk-contenido.mjs — ¿esta APK puede ARRANCAR?
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ EXISTE, Y ES LO QUE HAY QUE LEER ANTES DEL CÓDIGO
 *
 * **Acá no falló ningún instrumento.** `verify-manifest-apk.mjs` dio VERDE — y
 * tenía razón: el manifest ESTABA bien (package, `geo.API_KEY`, `google_app_id`,
 * receptor de push, los cuatro presentes). La APK se instaló, arrancó, y se
 * quedó **para siempre en el splash**.
 *
 * La causa, medida en el objeto: **la APK no contenía `index.android.bundle`**.
 * El perfil `development` de `eas.json` declara `developmentClient: true` —o sea,
 * construye una app SIN bundle que espera bajar el JS de Metro— **y
 * `expo-dev-client` no estaba en las dependencias**. Sin ese paquete no hay
 * launcher que lo baje. **Una app que arranca y no puede cargar nada, nunca.**
 *
 * > ### **Verificábamos lo que el artefacto DECLARA, jamás lo que CONTIENE.**
 * > Es *«se verifica el artefacto, no la materia prima»* **un piso más abajo**:
 * > el manifest es una declaración sobre la APK; el bundle es la APK.
 *
 * *Y por eso ningún guard lo vio: el defecto no está en lo que la build declara
 * — está en lo que no trae.* Hermano de `D-574`, con una diferencia que lo hace
 * peor: D-574 al menos tenía guard.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * LA REGLA QUE APLICA, en una línea:
 *   **una APK sin bundle solo es legítima si algo puede dárselo.**
 *
 *   · trae `index.android.bundle`            → arranca sola ......... VERDE
 *   · NO lo trae, pero es dev build Y
 *     `expo-dev-client` está en dependencias → lo baja de Metro ..... VERDE
 *   · NO lo trae y nada puede dárselo        → **NO ARRANCA JAMÁS** .. ROJO
 *
 * Y su mitad que NO necesita APK —se puede correr antes de gastar un build—:
 *   · el perfil promete `developmentClient: true` y falta el paquete → ROJO
 *
 * USO
 *   node scripts/verify-apk-contenido.mjs <ruta.apk> --app cliente|prestador
 *   node scripts/verify-apk-contenido.mjs --coherencia --app cliente
 *        (sin APK: solo el par perfil↔dependencia)
 *   node scripts/verify-apk-contenido.mjs --autoprueba <apk-sin-bundle>
 *        (control positivo: exige que el instrumento DETECTE el caso malo)
 *
 * Exit ≠ 0 = la build no se instala. **El exit se lee del COMANDO, jamás de un
 * pipe** (`L-191`): `node … > salida.txt 2>&1; echo $?`.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
const idxApp = args.indexOf('--app')
const app = idxApp >= 0 ? args[idxApp + 1] : null
const soloCoherencia = args.includes('--coherencia')
const autoprueba = args.includes('--autoprueba')
const apk = args.find((a) => a.endsWith('.apk'))

if (!app && !autoprueba) {
  console.error('uso: verify-apk-contenido.mjs <ruta.apk> --app cliente|prestador')
  console.error('     verify-apk-contenido.mjs --coherencia --app cliente')
  console.error('     verify-apk-contenido.mjs --autoprueba <apk-sin-bundle>')
  process.exit(2)
}

/** ¿La APK contiene el bundle? Se lee del ZIP, no de un nombre de archivo. */
function traeBundle(ruta) {
  const listado = execFileSync('unzip', ['-l', ruta], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  /* Se busca por RUTA DENTRO DEL ZIP, no por substring suelto: `assets/` es
     donde RN lo pone, y un match laxo podría casar con cualquier cosa que
     mencione la palabra. */
  return /\sassets\/index\.android\.bundle\s*$/m.test(listado)
}

/** El par perfil↔dependencia. No necesita APK: corre antes de gastar un build. */
function coherenciaPerfil(nombreApp) {
  const dirApp = resolve(RAIZ, 'apps', nombreApp)
  const easPath = resolve(dirApp, 'eas.json')
  const pkgPath = resolve(dirApp, 'package.json')
  if (!existsSync(easPath) || !existsSync(pkgPath)) {
    return { ok: false, motivo: `no encuentro eas.json o package.json en apps/${nombreApp}` }
  }
  const eas = JSON.parse(readFileSync(easPath, 'utf8'))
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  const tieneDevClient = Boolean(deps['expo-dev-client'])

  const perfilesConDevClient = Object.entries(eas.build || {})
    .filter(([, p]) => p && p.developmentClient === true)
    .map(([n]) => n)

  if (perfilesConDevClient.length > 0 && !tieneDevClient) {
    return {
      ok: false,
      tieneDevClient,
      perfilesConDevClient,
      motivo:
        `el/los perfil(es) [${perfilesConDevClient.join(', ')}] declaran developmentClient:true ` +
        `y expo-dev-client NO está en dependencias ⇒ esos builds salen SIN bundle y SIN quién se lo dé`,
    }
  }
  return { ok: true, tieneDevClient, perfilesConDevClient }
}

// ── CONTROL POSITIVO (L-330: el control se DECLARA junto al número) ──────────
if (autoprueba) {
  if (!apk) { console.error('autoprueba: falta la ruta de una APK SIN bundle'); process.exit(2) }
  const tiene = traeBundle(apk)
  if (tiene) {
    console.log('AUTOPRUEBA ROJA — la APK que se pasó como caso malo SÍ trae bundle.')
    console.log('  El instrumento no se puede validar con ella: hace falta una sin bundle.')
    process.exit(1)
  }
  console.log('AUTOPRUEBA VERDE — el instrumento DETECTA una APK sin `index.android.bundle`.')
  console.log('  (Un guard que nunca vio el caso malo no prueba que sepa verlo.)')
  process.exit(0)
}

// ── EL GUARD ────────────────────────────────────────────────────────────────
const coh = coherenciaPerfil(app)
const fallos = []
const verdes = []

if (coh.ok) {
  verdes.push(
    coh.perfilesConDevClient.length
      ? `perfil↔dependencia coherentes (dev-client declarado en [${coh.perfilesConDevClient.join(', ')}] y presente)`
      : 'ningún perfil declara developmentClient — no aplica el par',
  )
} else {
  fallos.push(coh.motivo)
}

if (!soloCoherencia) {
  if (!apk || !existsSync(apk)) {
    console.error('ROJO — no encuentro la APK. Pasá su ruta, o usá --coherencia para el chequeo sin APK.')
    process.exit(2)
  }
  const tiene = traeBundle(apk)
  if (tiene) {
    verdes.push('la APK trae `assets/index.android.bundle` — arranca sola')
  } else if (coh.tieneDevClient) {
    verdes.push('la APK NO trae bundle, pero `expo-dev-client` está presente — lo baja de Metro')
  } else {
    fallos.push(
      'la APK NO trae `assets/index.android.bundle` y `expo-dev-client` NO está en dependencias ⇒ ' +
        'NO PUEDE CARGAR JS POR NINGUNA VÍA. Se instala, arranca y se queda en el splash para siempre.',
    )
  }
}

if (fallos.length) {
  console.log('ROJO — LA BUILD NO ARRANCA (o no puede):')
  for (const f of fallos) console.log(`  ✗ ${f}`)
  for (const v of verdes) console.log(`  ✓ ${v}`)
  process.exit(1)
}

console.log('VERDE — la APK puede cargar su JS:')
for (const v of verdes) console.log(`  ✓ ${v}`)
process.exit(0)
