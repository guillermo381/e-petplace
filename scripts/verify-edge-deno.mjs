/**
 * GATE · TYPECHECK REAL DE LAS EDGE FUNCTIONS (`deno check`)
 *
 * ── QUÉ REEMPLAZA Y POR QUÉ ──
 * Jubila a `scripts/verify-edge-simbolos.mjs`, que **daba VERDE con un
 * defecto vivo de su propia clase**. Medido: `pagos-webhook-stg` usaba
 * `KEY_CLIENT` y **nadie lo declaraba nunca** — `ReferenceError` en runtime,
 * que la plataforma devuelve como 500. **Costo: 8 eventos del proveedor sin
 * validar durante un día entero**, con el gate en verde todo ese tiempo. Las
 * 8 filas del buzón lo dicen literal:
 *   `analisis_fallo: ReferenceError: KEY_CLIENT is not defined`.
 *
 * **El juez viejo no falló: contestó bien una pregunta más angosta que su
 * propósito.** Medía «símbolo de MÓDULO usado sin importar» contra una lista
 * fija (`createHmac`, `createClient`, …). `KEY_CLIENT` no viene de un módulo
 * — es un **identificador libre** —, así que la otra mitad de la clase «usar
 * algo que no existe» le quedaba afuera. *El gate que existe para que esto
 * no pase, no lo vio.*
 *
 * ── POR QUÉ NO SE ENSANCHÓ EL VIEJO ──
 * **Ya se intentó y su propia cabecera lo documenta como fracaso:** la
 * primera versión detectaba cualquier identificador sin definir y dio *«20
 * rojos sobre 22 funciones y casi todos falsos»*, con la conclusión *«un
 * gate que grita siempre es un gate que nadie mira — y eso es peor que no
 * tenerlo, porque además da la sensación de estar cubierto»*. Su angostura
 * era una **decisión medida**. Ensancharlo con más regex resucita ese gate.
 * ⇒ Se cambia el instrumento, no el criterio: **un typechecker de verdad**
 *   cubre LAS DOS mitades de la clase sin heurística y sin falsos positivos.
 *
 * ── ⚠️ EL AISLAMIENTO NO ES OPCIONAL, Y ES PEOR DE LO QUE PARECE ──
 * Correr `deno check` dentro del monorepo **no solo falla: MUTA el repo.**
 * Medido en S103-B: deno lee el `pnpm-workspace.yaml` vecino y **escribe una
 * clave `workspaces` dentro de `package.json`** («Migrated its workspace
 * configuration into …»), además de no resolver `npm:@supabase/*` contra el
 * `node_modules` de pnpm. Un gate que corrompe el árbol cada vez que corre
 * es peor que no tener gate. ⇒ **Todo chequeo ocurre sobre una COPIA, en un
 * directorio temporal FUERA del repo**, con su propio `deno.json`
 * (`nodeModulesDir: auto`). El repo no se toca nunca.
 *
 * ── ⚠️ SIN `deno` ESTE GATE NO DA VERDE (L-197 · L-333) ──
 * Si `deno` no está instalado, el veredicto es **NO CONCLUYENTE y sale en
 * rojo**, jamás verde. Un gate que se saltea en silencio cuando le falta su
 * herramienta es exactamente el modo de falla que este archivo viene a
 * cerrar: *el juez anterior también decía «verde» mientras no miraba.*
 *
 * ── AUTOPRUEBA (`--autoprueba`) ──
 * Por **L-333**, el autoprueba no se conforma con «el detector detecta»:
 * **exige un veredicto sobre el CASO MALO** — inyecta el defecto real de
 * `KEY_CLIENT` en una copia y **exige que el juez lo reporte en ROJO**. Si
 * el juez diera verde sobre el caso malo, el autoprueba sale en rojo
 * denunciando al juez. *Ése es exactamente el modo en que el juez anterior
 * pasó: cada mitad daba verde con razón, y el conjunto mentía.*
 *
 * ── USO ──
 *   node scripts/verify-edge-deno.mjs              → chequea todas
 *   node scripts/verify-edge-deno.mjs --autoprueba → se prueba a sí mismo
 */
import { execFileSync, execSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, readdirSync, existsSync, rmSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const DIR = 'supabase/functions'
const AUTOPRUEBA = process.argv.includes('--autoprueba')
const PROBAR_CINTURON = process.argv.includes('--probar-cinturon')

/**
 * ⚠️ LA CLASE QUE ESTE GATE JUZGA — y por qué no juzga todo lo que `deno`
 * sabe decir.
 *
 * **Medido en S103-B sobre las 23 funciones:** `deno check` crudo devuelve
 * **90 errores** — y **89 son ruido**: 77 `TS2339` (`Property 'x' does not
 * exist on type 'GenericStringError'`, el artefacto conocido de inferencia
 * de `supabase-js` cuando una consulta no estrecha su unión), 9 `TS2345`
 * (`Uint8Array` vs `BodyInit`, desajuste de librería entre Deno y la que
 * usa el runtime) y 3 `TS7006` (`any` implícito). **Las seis funciones que
 * los producen están VIVAS y su salida pasó el gate impreso del founder
 * (S90): no son defectos de runtime, son artefactos de tipado.**
 *
 * Gatear sobre los 90 reproduciría **exactamente** el fracaso que el juez
 * anterior documentó —*«20 rojos sobre 22 funciones y casi todos falsos […]
 * un gate que grita siempre es un gate que nadie mira»*— con otro
 * instrumento y peor proporción: **89 a 1.**
 *
 * ⇒ Se juzga **la clase, no el typechecker entero**: «usar algo que no
 *   existe», que en TypeScript es `TS2304` (*Cannot find name*) y su
 *   hermano `TS2552` (*…did you mean?*).
 *
 * **Esto NO afloja el criterio del juez anterior: lo cumple mejor.** Su
 * regla era *«se cubre una clase, con cero falsos positivos»* y su límite
 * era cubrir **media** clase (solo símbolos de módulo, contra una lista
 * fija). `TS2304` cubre **las dos mitades a la vez** —`createHmac` sin
 * importar da `TS2304` igual que `KEY_CLIENT` sin declarar— y con cero
 * heurística: lo dice un typechecker, no un regex.
 *
 * **Los otros 89 no se tapan: se declaran** al pie del reporte y quedan
 * como deuda con dueño. *Callarlos sería el defecto de al lado.*
 */
const CLASE = new Set(['TS2304', 'TS2552'])

/** ¿Está `deno`? Sin él no hay veredicto — y eso NO es verde. */
function hayDeno() {
  try {
    execSync('deno --version', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * EL CINTURON DEL AISLAMIENTO -- mecanico, no una nota al pie.
 *
 * MEDIDO (S103-B): `deno` corrido dentro del monorepo no solo falla --
 * lee el `pnpm-workspace.yaml` vecino y ESCRIBE una clave `workspaces`
 * dentro de `package.json` ("Migrated its workspace configuration into
 * ..."). Un gate que corrompe el arbol cada vez que corre es peor que no
 * tener gate.
 *
 * El aislamiento ya es POR CONSTRUCCION: `chequear()` copia a un temporal
 * fuera del repo y corre ahi. Pero una precondicion que vive en un
 * comentario se cumple mientras alguien la lea, y el dia que alguien
 * "simplifique" el runner para correr en sitio, el defecto vuelve callado.
 *
 * Por eso ademas se MIDE: se toma la huella de `package.json` antes y
 * despues de cada corrida de deno. Si cambio, el gate RESTAURA el archivo
 * y ABORTA -- no reporta verde ni rojo, porque en ese estado no midio
 * nada: midio un arbol que el mismo ensucio.
 */
const PKG = 'package.json'
const huella = (f) => (existsSync(f) ? createHash('sha256').update(readFileSync(f)).digest('hex') : 'ausente')

function abortarPorMutacion(contenidoOriginal) {
  if (contenidoOriginal !== null) writeFileSync(PKG, contenidoOriginal)
  console.error('\nABORTADO -- el gate modifico `package.json` y NO puede medir.\n')
  console.error('   `deno` escribio en el archivo (el caso medido: una clave `workspaces`')
  console.error('   migrada desde `pnpm-workspace.yaml`). El aislamiento se rompio: la')
  console.error('   corrida ocurrio dentro del repo, no sobre una copia.')
  console.error('\n   El archivo fue RESTAURADO a su contenido previo.')
  console.error('   No hay veredicto: un gate que ensucia el arbol que mide, no lo mide.\n')
  process.exit(3)
}

/**
 * Copia el arbol de funciones a un temporal FUERA del repo y lo chequea.
 * Se copia el arbol ENTERO (no funcion por funcion) para que los imports
 * relativos a `_shared/` sigan resolviendo como en produccion.
 *
 * `enSitio` existe SOLO para `--probar-cinturon`: corre deno dentro del
 * repo a proposito, para que el cinturon tenga contra que dispararse. Un
 * cinturon que nunca se probo en rojo no es un cinturon.
 */
function chequear(mutar, enSitio = false) {
  const antesHuella = huella(PKG)
  const antesContenido = existsSync(PKG) ? readFileSync(PKG, 'utf8') : null

  const base = enSitio ? null : mkdtempSync(join(tmpdir(), 'epp-edge-'))
  try {
    let cwd, entradasDir
    if (enSitio) {
      cwd = process.cwd()
      entradasDir = DIR
    } else {
      cpSync(DIR, join(base, 'functions'), { recursive: true })
      writeFileSync(join(base, 'deno.json'), JSON.stringify({ nodeModulesDir: 'auto' }))
      if (mutar) mutar(join(base, 'functions'))
      cwd = base
      entradasDir = join(base, 'functions')
    }

    const entradas = readdirSync(entradasDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(entradasDir, d.name, 'index.ts')))
      .map((d) => (enSitio ? `${DIR}/${d.name}/index.ts` : `functions/${d.name}/index.ts`))

    // Solo bajo `--probar-cinturon`: simula que algo mutó el archivo DURANTE
    // la corrida aislada, para ejercitar la rama que ABORTA. Sin esto, esa
    // rama nunca se ejecuta y quedaría sin probar -- que es el defecto que
    // este archivo entero viene a cerrar.
    if (process.env.EPP_SIMULAR_MUTACION === '1' && !enSitio) {
      writeFileSync(PKG, readFileSync(PKG, 'utf8') + '\n')
    }

    let r
    try {
      execFileSync('deno', ['check', ...entradas], { cwd, stdio: 'pipe', encoding: 'utf8' })
      r = { verde: true, salida: '', total: entradas.length }
    } catch (e) {
      r = { verde: false, salida: `${e.stdout || ''}${e.stderr || ''}`, total: entradas.length }
    }

    // EL CINTURON: se mide DESPUES de cada corrida, siempre.
    if (huella(PKG) !== antesHuella) {
      r.mutado = true
      if (!enSitio) abortarPorMutacion(antesContenido)
      else if (antesContenido !== null) writeFileSync(PKG, antesContenido)
    }
    return r
  } finally {
    if (base) rmSync(base, { recursive: true, force: true })
  }
}

/** Los `TS####` con su función y su línea, para que el rojo diga dónde. */
function errores(salida) {
  const limpio = salida.replace(/\[[0-9;]*m/g, '')
  const out = []
  const re = /(TS\d+) \[ERROR\]: ([^\n]+)[\s\S]*?functions\/([^/]+)\/[^:]*:(\d+):(\d+)/g
  for (const m of limpio.matchAll(re)) out.push({ codigo: m[1], mensaje: m[2].trim(), fn: m[3], linea: m[4] })
  return out
}

// ── SIN HERRAMIENTA NO HAY VEREDICTO ────────────────────────────────────
if (!hayDeno()) {
  console.error('\n🟠 NO CONCLUYENTE · `deno` no está instalado — este gate NO puede medir.\n')
  console.error('  Instalalo (`brew install deno`) o corré el gate donde exista.')
  console.error('  NO se reporta verde: un gate que se saltea en silencio es el defecto')
  console.error('  que este archivo vino a cerrar.\n')
  process.exit(2)
}

// ── AUTOPRUEBA · exige veredicto sobre el CASO MALO (L-333) ─────────────
// -- PRUEBA DEL CINTURON: corre deno EN SITIO para que se dispare --------
if (PROBAR_CINTURON) {
  console.log('\n. Cinturon: corro deno DENTRO del repo a proposito y exijo que lo detecte.\n')
  const antes = readFileSync(PKG, 'utf8')
  const huellaAntes = huella(PKG)

  const r = chequear(null, true)

  const huellaDespues = huella(PKG)
  const restaurado = readFileSync(PKG, 'utf8') === antes

  if (!r.mutado) {
    console.log('  NO CONCLUYENTE: deno NO toco `package.json` en esta corrida.')
    console.log(`     huella antes/despues: ${huellaAntes.slice(0, 12)} / ${huellaDespues.slice(0, 12)}`)
    console.log('     El cinturon no se pudo probar -- puede ser otra version de deno,')
    console.log('     u otro layout. NO se reporta verde: no se probo nada.\n')
    process.exit(2)
  }

  console.log('  OK deno MUTO `package.json` al correr en sitio -- el caso medido existe.')
  console.log(`  OK el cinturon lo DETECTO (huella distinta) y restauro: ${restaurado ? 'si' : 'NO'}`)
  if (!restaurado) {
    console.error('\nROJO EL CINTURON ESTA ROTO: detecto la mutacion y NO restauro el archivo.\n')
    process.exit(1)
  }
  // BRAZO 2 -- la rama que ABORTA. En modo aislado deno no toca el repo, asi
  // que esa rama nunca corre sola: se ejercita en un SUBPROCESO simulando la
  // mutacion. Una rama de codigo que nunca se ejecuto no esta probada.
  console.log('\n. Brazo 2: simulo mutacion DURANTE la corrida aislada y exijo ABORTO.\n')
  const antes2 = readFileSync(PKG, 'utf8')
  const hijo = spawnSync(process.execPath, [process.argv[1]], {
    env: { ...process.env, EPP_SIMULAR_MUTACION: '1' },
    encoding: 'utf8',
  })
  const restaurado2 = readFileSync(PKG, 'utf8') === antes2
  const abortoBien = hijo.status === 3

  console.log(`  ${abortoBien ? 'OK' : 'ROJO'} salida del gate: ${hijo.status} (3 = abortado por mutacion)`)
  console.log(`  ${restaurado2 ? 'OK' : 'ROJO'} package.json restaurado: ${restaurado2 ? 'si' : 'NO'}`)
  if (!abortoBien || !restaurado2) {
    console.error('\nROJO EL CINTURON ESTA ROTO en su rama de aborto.\n')
    console.error((hijo.stdout || '') + (hijo.stderr || ''))
    process.exit(1)
  }
  const dijoAbortado = ((hijo.stdout || '') + (hijo.stderr || '')).includes('ABORTADO')
  console.log(`  ${dijoAbortado ? 'OK' : 'ROJO'} y lo DIJO en voz alta`)
  if (!dijoAbortado) process.exit(1)

  console.log('\nOK Cinturon probado en sus DOS ramas: detecta+restaura, y aborta sin dar veredicto.\n')
  process.exit(0)
}

if (AUTOPRUEBA) {
  console.log('\n. Autoprueba: fabrico el defecto y exijo ROJO por la razon correcta.\n')

  /**
   * EL DEFECTO SE FABRICA, NO SE PIDE PRESTADO.
   *
   * La primera version de este autoprueba rompia `const KEY_CLIENT` dentro
   * de `pagos-webhook-stg` -- el defecto historico real. Medido: queda NO
   * CONCLUYENTE apenas ese archivo cambia (en `origin/main` esa linea ni
   * siquiera existe). Un autoprueba que depende de una linea de codigo de
   * produccion se apaga solo el dia que alguien la toca, que es justo
   * cuando mas falta hace.
   *
   * Ahora inyecta una funcion sintetica propia con las DOS mitades de la
   * clase a la vez: una global nunca declarada (el caso `KEY_CLIENT`) y un
   * simbolo de modulo sin importar (`createHmac`, el caso que patio al juez
   * anterior). No toca ninguna funcion real.
   */
  const SINTETICA =
    'Deno.serve(() => {\n' +
    '  const a = SECRETO_QUE_NADIE_DECLARO;\n' +
    '  const b = createHmac("sha256", "x");\n' +
    '  return new Response(String(a) + String(b));\n' +
    '});\n'

  const malo = chequear((raiz) => {
    const dir = join(raiz, '_autoprueba_s103b')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.ts'), SINTETICA)
  })

  const errsMalo = errores(malo.salida).filter((x) => CLASE.has(x.codigo))
  const global = errsMalo.find((x) => x.mensaje.includes('SECRETO_QUE_NADIE_DECLARO'))
  const modulo = errsMalo.find((x) => x.mensaje.includes('createHmac'))

  if (!global || !modulo) {
    console.error('ROJO EL JUEZ ESTA ROTO: no reporto las dos mitades de la clase.')
    console.error(`  global no declarada  -> ${global ? 'vista' : 'NO VISTA'}`)
    console.error(`  simbolo sin importar -> ${modulo ? 'visto' : 'NO VISTO'}`)
    console.error('  Un rojo por la razon equivocada esta tan roto como un verde por la equivocada.\n')
    process.exit(1)
  }

  console.log(`  OK mitad 1 - global nunca declarada -> ${global.codigo}: ${global.mensaje}`)
  console.log(`  OK mitad 2 - simbolo de modulo sin importar -> ${modulo.codigo}: ${modulo.mensaje}`)

  // CONTROL POSITIVO, medido con la MISMA vara que el gate. La primera
  // version preguntaba `sano.verde` -- el veredicto CRUDO de deno, que
  // incluye los 89 fuera de clase -- y por eso el arbol sano "fallaba" y el
  // autoprueba salia NO CONCLUYENTE. Un control que mide una magnitud
  // distinta a la del gate no controla nada.
  const sano = chequear(null)
  const sanoDeClase = errores(sano.salida).filter((x) => CLASE.has(x.codigo))
  if (sanoDeClase.length) {
    console.log(`\n  NOTA: el arbol tiene ${sanoDeClase.length} defecto(s) REALES de la clase:`)
    for (const e of sanoDeClase) console.log(`    - ${e.fn}:${e.linea} - ${e.codigo}: ${e.mensaje}`)
    console.log('  El autoprueba igual concluye: el juez discrimina, y ademas hay trabajo.')
  } else {
    console.log(`  OK control positivo - el arbol sin el defecto fabricado da VERDE (${sano.total} funciones)`)
  }

  console.log('\nOK Autoprueba: el juez discrimina - rojo con el defecto, y ve las dos mitades.\n')
  process.exit(0)
}

/**
 * 🔴 S107 · EL PARSEO VA ANTES QUE CUALQUIER CLASIFICACION.
 * Firma del founder (30-ago), con su razon:
 *
 *   > **Un archivo que no parsea no tiene errores de clase: no tiene nada.**
 *   > El parseo no es una clase mas, es la PRECONDICION de poder clasificar.
 *
 * ⏪ MEDIDO EL 30-ago: `pagos-tarjetas/index.ts` quedo con un cierre duplicado
 * -- no parseaba-- y **este gate dijo `OK`**. Lo cazo el deploy, y el deploy no
 * siempre esta.
 *
 * La causa era del instrumento: `errores()` matchea `TS####`, y un error de
 * parseo de deno **no trae codigo TS**, asi que la lista salia vacia y el gate
 * leia «cero defectos de clase» como verde.
 *
 * ⇒ Hermana de `L-431`: **un gate que filtra por clase da verde sobre todo lo
 * que esta fuera de su clase -- incluido lo que impide que el archivo exista.**
 */
function parseoRoto(salida) {
  const limpio = salida.replace(/\[[0-9;]*m/g, '')
  const marcas = [
    /The module's source code could not be parsed/,
    /Expression expected/,
    /Unexpected (?:token|eof)/i,
    /^error: Parsing error/m,
  ]
  if (!marcas.some((m) => m.test(limpio))) return []
  const out = []
  const re = /functions\/([^/]+)\/[^:]*:(\d+):(\d+)/g
  for (const m of limpio.matchAll(re)) out.push({ fn: m[1], linea: m[2] })
  return out.length ? out : [{ fn: '(sin ubicar)', linea: '?' }]
}

// ── EL GATE ─────────────────────────────────────────────────────────────
const r = chequear(null)

/* 🔴 PRIMERO EL PARSEO, y su rojo NO se puede ablandar por clase. */
const rotos = parseoRoto(r.salida)
if (rotos.length) {
  console.error('\nROJO · HAY ARCHIVO(S) QUE NO PARSEAN — el gate no puede clasificar lo que no existe:')
  for (const x of rotos) console.error(`    - ${x.fn}:${x.linea}`)
  console.error('\n  Un archivo que no parsea no tiene errores de clase: no tiene nada.')
  console.error('  Se arregla la sintaxis y se vuelve a correr.\n')
  process.exit(1)
}

const todos = errores(r.salida)
const deLaClase = todos.filter((e) => CLASE.has(e.codigo))
const fuera = todos.filter((e) => !CLASE.has(e.codigo))

/** Lo de fuera de clase SE DECLARA siempre. Callarlo es el defecto de al lado. */
function declararFuera() {
  if (!fuera.length) return
  const porCodigo = [...fuera.reduce((m, e) => m.set(e.codigo, (m.get(e.codigo) || 0) + 1), new Map())]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c}x${n}`)
    .join(' - ')
  const fns = [...new Set(fuera.map((e) => e.fn))].join(', ')
  console.log(`\n  FUERA DE CLASE - declarados y NO gateados: ${fuera.length} (${porCodigo})`)
  console.log(`     en: ${fns}`)
  console.log('     Artefactos de tipado sobre funciones vivas y con gate pasado, no')
  console.log('     defectos de runtime. Auditarlos es deuda propia; gatearlos mataria')
  console.log('     este gate - es el fracaso que el juez anterior ya documento.')
}

if (!deLaClase.length) {
  console.log(`\nOK verify:edge-deno - ${r.total} edge functions - cero <<usa algo que no existe>>.`)
  console.log('  Cubre las DOS mitades de la clase: simbolo de modulo sin importar')
  console.log('  Y global nunca declarada. Lo dice un typechecker, no un regex.')
  declararFuera()
  console.log('')
  process.exit(0)
}

console.error(`\nROJO verify:edge-deno - ${deLaClase.length} uso(s) de algo que NO EXISTE:\n`)
for (const e of deLaClase) console.error(`  - ${e.fn}:${e.linea} - ${e.codigo}: ${e.mensaje}`)
console.error('\n  Esto NO rompe ningun build: es un ReferenceError en runtime, que la')
console.error('  plataforma devuelve como 500. Y un 500 detiene los reintentos del')
console.error('  proveedor para siempre - asi se perdieron 8 eventos el 21-ago.')
declararFuera()
console.error('')
process.exit(1)
