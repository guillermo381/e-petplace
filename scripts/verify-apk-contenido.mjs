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
 * Hermano de `D-574`, con una diferencia que lo hace peor: D-574 al menos tenía
 * guard.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LA REGLA ────────────────────────────────────────────────────────────────
 *   **una APK sin bundle solo es legítima si algo puede dárselo** — y eso hay
 *   que **verlo en el ZIP**, jamás deducirlo del repo de hoy.
 *
 *   ① trae `assets/index.android.bundle` con tamaño > 0 ......... VERDE
 *   ② no lo trae, y el ZIP muestra el dev-launcher ............... VERDE
 *   ③ no lo trae, y el ZIP prueba que el dev-launcher NO está .... ROJO
 *   ④ no lo trae, y no se puede determinar desde el ZIP .......... **NO CONCLUYENTE**
 *
 *   ⚠️ **④ NO es un empate cómodo: sale con exit ≠ 0.** *Un juez que no puede
 *   juzgar tiene que decirlo — pasar por no saber es exactamente el defecto que
 *   este archivo vino a cerrar.*
 *
 * ── 🔴 LA REVISIÓN DE S102-B (21-ago) — CUATRO CORRECCIONES, TODAS APLICADAS ──
 *  Los jueces son territorio de B (enmienda S99) y la mesa mandó el archivo a su
 *  revisión antes de confiarlo. Su literal, porque cada una corrige algo que yo
 *  no veía:
 *
 *  ① **Mi voto era borrar la rama dev-client; B lo dio vuelta con razón.** *Una
 *     dev build legítima no tiene bundle y arranca perfecto* ⇒ borrarla ponía el
 *     guard en ROJO sobre **una clase entera de artefactos sanos**, y ése es el
 *     guard que alguien empieza a saltear (mecánica de la **regla 87**: un rojo
 *     conocido se vuelve la llave de todos los demás). **El defecto no era la
 *     rama: era UNA LÍNEA adentro** —`coh.tieneDevClient`, que miraba el repo
 *     mientras el resto del juez miraba el ZIP—. ***La cura es cortar una fuga,
 *     no amputar una función.***
 *  ② **`unzip -l` ya imprime el tamaño en su primera columna** ⇒ exigir `> 0` no
 *     cuesta una llamada más: cuesta **capturar un grupo del regex que ya corría**.
 *     *No por el archivo de 0 bytes —improbable— sino porque el número ya está en
 *     la mano, y no capturarlo es la decisión que después nadie revisa.*
 *  ③ **Si la línea promete más que la medición, se baja la línea.** «arranca
 *     sola» era más de lo que mido: mido que **tiene JS que cargar**.
 *  ④ 🔴 **La autoprueba probaba el SENSOR, no el JUICIO** — corría solo
 *     `traeBundle()`. Podía dar verde **mientras el juez daba un falso verde
 *     sobre la misma APK**: los dos verdes ciertos y el conjunto mintiendo.
 *     ***Es la diferencia entre probar que el termómetro marca y probar que el
 *     médico diagnostica.*** Hoy la autoprueba exige un **VEREDICTO** (rojo o no
 *     concluyente, **jamás verde**), no una detección.
 *
 * ── LO QUE ESTE GUARD TODAVÍA NO PUEDE, DECLARADO ──────────────────────────
 *  Las marcas del dev-launcher de abajo **no están calibradas contra una dev
 *  build real**: hasta que `--calibrar` corra sobre una APK que se sabe con
 *  dev-client, **su ausencia no prueba nada** y el caso ③ se reporta como ④.
 *  *Un cero de una marca que no sé si aparecería es un cero sin control
 *  positivo* (`L-330`), y este archivo no va a cometer el error que documenta.
 *
 * USO
 *   node scripts/verify-apk-contenido.mjs <ruta.apk> --app cliente|prestador
 *   node scripts/verify-apk-contenido.mjs --coherencia --app cliente
 *        (sin APK: solo el par perfil↔dependencia — repo contra repo, legítimo)
 *   node scripts/verify-apk-contenido.mjs --autoprueba <apk-sin-bundle> --app <app>
 *        (control: exige que el JUEZ no dé verde sobre una APK sin bundle)
 *   node scripts/verify-apk-contenido.mjs --calibrar <apk-con-dev-client>
 *        (control positivo de las marcas: qué muestra el ZIP de una dev build real)
 *
 * Exit ≠ 0 = la build no se instala. **El exit se lee del COMANDO, jamás de un
 * pipe** (`L-191`): `node … > salida.txt 2>&1; echo $?`.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/* ── LAS MARCAS DEL DEV-LAUNCHER — **CALIBRADAS**, y la calibración cambió dos
 *    cosas que yo tenía mal (21-ago, dos APKs del mismo día como par):
 *
 *    ① **NO viven en el listado del ZIP.** Son clases Java: viven adentro de
 *       `classes*.dex`, cuyo contenido `unzip -l` no lista. Mi primera versión
 *       las buscaba en el listado y **daba cero en las dos APKs** — un cero
 *       idéntico para el caso bueno y el malo, o sea ninguna información.
 *
 *    ② 🔴 **La búsqueda insensible a mayúsculas NO discrimina** — y ésa era la
 *       que yo tenía. Medido en el par:
 *
 *         marcador                    APK rota   dev build real
 *         ──────────────────────────  ────────   ──────────────
 *         `devlauncher` (-i) .......      14          377     ← NO sirve
 *         `DevLauncher` ............      14          139     ← NO sirve
 *         `expo/modules/devlauncher`       0          285     ← discrimina
 *         `expo/modules/devmenu` ...       0          166     ← discrimina
 *
 *       ⚠️ Esos números son **líneas** (`grep -c`, que cuenta líneas que
 *       contienen la aguja, no apariciones). El guard cuenta **apariciones** y
 *       por eso reporta `×1884` / `×894` sobre la misma APK. **Se aclara acá
 *       porque un archivo cuyo comentario contradice a su propio instrumento es
 *       la próxima medición equivocada de alguien.** Lo que importa —y es lo
 *       mismo en las dos escalas— es el **cero contra el no-cero**.
 *
 *       *La forma CamelCase aparece igual en una APK sin dev-client* (la
 *       nombran otros módulos de Expo) ⇒ con el flag `i` el guard habría dicho
 *       **«dev-launcher presente»** sobre la APK que no arranca. **La
 *       calibración no confirmó mis marcas: me salvó de un falso verde.**
 *
 *    ⇒ Se busca la **RUTA DE PAQUETE, sensible a mayúsculas**, dentro del dex.
 *      Si algún día expo renombra el paquete, `--calibrar` vuelve a dar rojo y
 *      el caso ③ degrada a NO CONCLUYENTE. *El guard pierde filo antes que
 *      mentir.* */
const MARCAS_DEV_LAUNCHER = ['expo/modules/devlauncher', 'expo/modules/devmenu']

/* Un bundle de RN pesa megas. Bajo esto, algo pasó — B, corrección ②. */
const BUNDLE_SOSPECHOSO_BYTES = 100 * 1024

const args = process.argv.slice(2)
const idxApp = args.indexOf('--app')
const app = idxApp >= 0 ? args[idxApp + 1] : null
const soloCoherencia = args.includes('--coherencia')
const autoprueba = args.includes('--autoprueba')
const calibrar = args.includes('--calibrar')
const apk = args.find((a) => a.endsWith('.apk'))

if (!app && !calibrar) {
  console.error('uso: verify-apk-contenido.mjs <ruta.apk> --app cliente|prestador')
  console.error('     verify-apk-contenido.mjs --coherencia --app cliente')
  console.error('     verify-apk-contenido.mjs --autoprueba <apk-sin-bundle> --app <app>')
  console.error('     verify-apk-contenido.mjs --calibrar <apk-con-dev-client>')
  process.exit(2)
}

/** El listado del ZIP. Se envuelve: si `unzip` falla, **el juez lo dice** —
 *  su voz es diagnóstico, y un throw crudo la pierde (B, menor de ④). */
function listarZip(ruta) {
  try {
    return {
      ok: true,
      listado: execFileSync('unzip', ['-l', ruta], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      }),
    }
  } catch (e) {
    return { ok: false, motivo: `no pude leer el ZIP (${e?.message ?? e})` }
  }
}

/** ¿Trae el bundle, y pesa algo? Se lee del listado — **con su tamaño**. */
function bundleEnListado(listado) {
  /* `unzip -l` imprime: `  <tamaño>  <fecha> <hora>  <ruta>`.
     Se captura el tamaño del MISMO regex que ya buscaba la ruta. */
  const m = listado.match(/^\s*(\d+)\s+\S+\s+\S+\s+assets\/index\.android\.bundle\s*$/m)
  if (!m) return { presente: false }
  return { presente: true, bytes: Number(m[1]) }
}

/** ¿El dev-launcher está DENTRO del artefacto? Se lee del bytecode, no del
 *  listado — ver la calibración arriba. Tres respuestas, no dos. */
function devLauncherEnDex(ruta) {
  let dex
  try {
    dex = execFileSync('unzip', ['-p', ruta, 'classes*.dex'], {
      maxBuffer: 512 * 1024 * 1024,
      encoding: 'buffer',
    })
  } catch (e) {
    return { veredicto: 'indeterminado', halladas: [], motivo: `no pude leer el bytecode (${e?.message ?? e})` }
  }
  if (!dex || dex.length === 0) {
    return { veredicto: 'indeterminado', halladas: [], motivo: 'la APK no trae `classes*.dex`' }
  }

  const halladas = []
  for (const m of MARCAS_DEV_LAUNCHER) {
    /* Conteo, no presencia: el número es lo que hizo auditable la calibración.
       Búsqueda binaria SENSIBLE a mayúsculas — el flag `i` era el defecto. */
    const aguja = Buffer.from(m, 'utf8')
    let n = 0
    let i = dex.indexOf(aguja)
    while (i !== -1) { n++; i = dex.indexOf(aguja, i + 1) }
    if (n > 0) halladas.push(`${m}×${n}`)
  }
  if (halladas.length) return { veredicto: 'presente', halladas }
  /* Cero de una marca CALIBRADA sí es evidencia: se midió que en una dev build
     real aparece 285 veces y en la rota 0. */
  return { veredicto: 'ausente', halladas: [] }
}

/** El par perfil↔dependencia. **Repo contra repo — las dos mitades del mismo
 *  instante**, y por eso es legítimo (B, corrección ①). Su resultado JAMÁS
 *  entra al juicio del artefacto. */
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

  const fallos = []

  if (perfilesConDevClient.length > 0 && !tieneDevClient) {
    fallos.push(
      `el/los perfil(es) [${perfilesConDevClient.join(', ')}] declaran developmentClient:true ` +
        `y expo-dev-client NO está en dependencias ⇒ esos builds salen SIN bundle y SIN quién se lo dé`,
    )
  }

  /* 🔴 `requireCommit` — su porqué vive ACÁ porque `eas.json` no lo admite: su
     esquema rechaza la clave `"//"` (medido, 21-ago; el intento de dejar la nota
     adentro falló con «cli.// is not allowed»). ⇒ **la razón se vuelve mecánica
     en vez de comentario** — un comentario se borra sin que nadie se entere; un
     guard en rojo obliga a leer por qué.

     Sin `requireCommit`, EAS archiva el **ÁRBOL**, no el commit. Medido en vivo:
     una build salió de `76f83f5f` —que NO tenía `expo-dev-client`— y la APK
     resultante lo traía (`expo/modules/devlauncher` ×1884). *No es que la build
     IGNORE lo no commiteado: **lo usa**, y después el hash del acta apunta a un
     código que nunca se construyó.*

     Esta casa cita hashes para todo, y **el gate del founder no se corre sobre
     un artefacto de procedencia irreconstruible**: un veredicto que no se puede
     volver a producir no se puede citar, y entonces no es un gate. Es la gemela
     nativa de lo que S91 curó en OTA (`publicar-ota.mjs`, veda + acto único —
     *«un publish sucio es inauditable después»*); allá el riesgo era
     estructural, acá hubo **un artefacto concreto instalado en un teléfono**. */
  if (eas.cli?.requireCommit !== true) {
    fallos.push(
      'eas.json no fija `cli.requireCommit: true` ⇒ la build archiva el ÁRBOL y no el commit: ' +
        'el artefacto que salga NO se puede atar a un hash, y un gate sin ancla no es un gate',
    )
  }

  if (fallos.length) return { ok: false, perfilesConDevClient, motivo: fallos.join(' · TAMBIÉN: ') }
  return { ok: true, perfilesConDevClient }
}

/** EL JUEZ. Mira **solo el ZIP**. Devuelve veredicto + motivos. */
function juzgarApk(ruta) {
  const z = listarZip(ruta)
  if (!z.ok) return { veredicto: 'no_concluyente', motivos: [z.motivo] }

  const b = bundleEnListado(z.listado)
  if (b.presente) {
    if (b.bytes === 0) {
      return {
        veredicto: 'rojo',
        motivos: ['la entrada `assets/index.android.bundle` existe pero pesa 0 bytes — no hay JS que cargar'],
      }
    }
    const avisos =
      b.bytes < BUNDLE_SOSPECHOSO_BYTES
        ? [`⚠️ el bundle pesa ${b.bytes} bytes — muy por debajo de lo normal para RN; mirarlo`]
        : []
    return {
      veredicto: 'verde',
      /* B ③: la línea dice lo que la medición sostiene, ni una palabra más. */
      motivos: [`trae \`assets/index.android.bundle\` (${b.bytes} bytes) — tiene JS que cargar`, ...avisos],
    }
  }

  const dl = devLauncherEnDex(ruta)
  if (dl.veredicto === 'presente') {
    return {
      veredicto: 'verde',
      motivos: [`no trae bundle, pero el bytecode trae el dev-launcher [${dl.halladas.join(' · ')}] — puede bajarlo de Metro`],
    }
  }
  if (dl.veredicto === 'ausente') {
    return {
      veredicto: 'rojo',
      motivos: [
        'no trae `assets/index.android.bundle` Y el bytecode no trae el dev-launcher ⇒ ' +
          'NO PUEDE CARGAR JS POR NINGUNA VÍA. Se instala, arranca y se queda en el splash para siempre.',
        `(marcas buscadas: ${MARCAS_DEV_LAUNCHER.join(', ')} — calibradas 21-ago: 0 en la APK rota, 285 en la dev build real)`,
      ],
    }
  }
  return {
    veredicto: 'no_concluyente',
    motivos: [dl.motivo ?? 'no pude determinar si trae dev-launcher', 'no paso por no saber'],
  }
}

// ── CALIBRACIÓN: el control positivo de las marcas ──────────────────────────
if (calibrar) {
  if (!apk) { console.error('calibrar: falta la ruta de una APK CON dev-client'); process.exit(2) }
  const z = listarZip(apk)
  if (!z.ok) { console.error('ROJO —', z.motivo); process.exit(2) }
  const b = bundleEnListado(z.listado)
  const dl = devLauncherEnDex(apk)
  console.log('CALIBRACIÓN sobre', apk)
  console.log('  bundle ..........', b.presente ? `presente (${b.bytes} bytes)` : 'ausente')
  console.log('  marcas halladas .', dl.halladas.length ? dl.halladas.join(' · ') : '(ninguna)')
  if (!dl.halladas.length) {
    console.log()
    console.log('  ⇒ NINGUNA marca aparece en una APK que se dice con dev-client.')
    console.log('    La lista `MARCAS_DEV_LAUNCHER` NO sirve: el caso ③ seguirá saliendo')
    console.log('    como NO CONCLUYENTE, que es lo honesto. **No se inventan marcas.**')
    process.exit(1)
  }
  console.log()
  console.log('  ⇒ las marcas discriminan. El caso ③ ya puede reportarse como ROJO.')
  process.exit(0)
}

// ── AUTOPRUEBA: exige un VEREDICTO, no una detección (B, corrección ④) ──────
if (autoprueba) {
  if (!apk) { console.error('autoprueba: falta la ruta de una APK SIN bundle'); process.exit(2) }
  const r = juzgarApk(apk)
  if (r.veredicto === 'verde') {
    console.log('AUTOPRUEBA ROJA — el JUEZ dio VERDE sobre la APK que se pasó como caso malo.')
    for (const m of r.motivos) console.log(`    · ${m}`)
    console.log('  Si esa APK realmente no arranca, el juez está mintiendo. No se confía.')
    process.exit(1)
  }
  console.log(`AUTOPRUEBA VERDE — el JUEZ no da verde sobre el caso malo (dijo: ${r.veredicto}).`)
  for (const m of r.motivos) console.log(`    · ${m}`)
  console.log('  (Se prueba el diagnóstico, no el termómetro: un sensor que detecta')
  console.log('   no prueba que el juez que lo usa concluya bien.)')
  process.exit(0)
}

// ── EL GUARD ────────────────────────────────────────────────────────────────
const coh = coherenciaPerfil(app)
const fallos = []
const verdes = []
const dudas = []

if (coh.ok) {
  verdes.push(
    coh.perfilesConDevClient.length
      ? `perfil↔dependencia coherentes (dev-client declarado en [${coh.perfilesConDevClient.join(', ')}] y presente)`
      : 'ningún perfil declara developmentClient — no aplica el par',
  )
  verdes.push('`cli.requireCommit: true` — el artefacto se va a poder atar a un commit')
} else {
  fallos.push(coh.motivo)
}

if (!soloCoherencia) {
  if (!apk || !existsSync(apk)) {
    console.error('ROJO — no encuentro la APK. Pasá su ruta, o usá --coherencia para el chequeo sin APK.')
    process.exit(2)
  }
  const r = juzgarApk(apk)
  if (r.veredicto === 'verde') verdes.push(...r.motivos)
  else if (r.veredicto === 'rojo') fallos.push(...r.motivos)
  else dudas.push(...r.motivos)
}

/* B ③ aplicada también acá: en `--coherencia` NO hay APK, así que el título no
   puede hablar de una. *La voz dice lo que se midió, ni una palabra más.* */
const TITULO_ROJO = soloCoherencia
  ? 'ROJO — LA CONFIGURACIÓN NO PUEDE PRODUCIR UNA BUILD SANA:'
  : 'ROJO — LA BUILD NO PUEDE CARGAR SU JS:'
const TITULO_VERDE = soloCoherencia
  ? 'VERDE — la configuración puede producir una build sana:'
  : 'VERDE — la APK tiene JS que cargar:'

if (fallos.length) {
  console.log(TITULO_ROJO)
  for (const f of fallos) console.log(`  ✗ ${f}`)
  for (const d of dudas) console.log(`  ? ${d}`)
  for (const v of verdes) console.log(`  ✓ ${v}`)
  process.exit(1)
}

if (dudas.length) {
  console.log('NO CONCLUYENTE — no puedo determinarlo desde el ZIP, y no paso por no saber:')
  for (const d of dudas) console.log(`  ? ${d}`)
  for (const v of verdes) console.log(`  ✓ ${v}`)
  process.exit(3)
}

console.log(TITULO_VERDE)
for (const v of verdes) console.log(`  ✓ ${v}`)
process.exit(0)
