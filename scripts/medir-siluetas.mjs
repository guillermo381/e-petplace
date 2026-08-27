#!/usr/bin/env node
/**
 * medir-siluetas — ¿dos glifos que conviven dicen lo mismo? (S106-B t4)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ── POR QUÉ EXISTE, con el caso que lo pidió ───────────────────────────────
 * ═══════════════════════════════════════════════════════════════════════════
 * El founder reportó **cuatro controles donde hay cinco**, dos veces. Se
 * descartaron CINCO explicaciones con medición —la voz no resuelta, la prop no
 * pasada, el símbolo ausente del bundle, el ancho que recorta, el SVG
 * inválido— y **las cinco daban verde mientras el ojo seguía diciendo cuatro.**
 *
 * La causa era que el glifo de `girarCamara` **compartía el 64,7 % de su tinta
 * con el de `camara`, que vive en el disco de al lado.** Se dibujaba —era el
 * MÁS entintado de la fila— y no se distinguía.
 *
 * 🔴 **LA LEY: un glifo que colisiona con su vecino no es un glifo feo — es un
 * CONTROL QUE DESAPARECE.** El usuario no cuenta discos: **nombra funciones**,
 * y dos controles que dicen «cámara» son una función, no dos.
 *
 * *Ningún gate de la casa veía esto: `verify:diseno` lee texto, `verify-contrast`
 * mide color, el typecheck mide tipos. **La colisión de siluetas no es de
 * ninguno de los tres — es de la forma**, y para verla hay que RENDERIZAR.*
 *
 * ── CÓMO LEER EL NÚMERO (y por qué solo sirve con su discriminador) ────────
 * IoU = intersección/unión de las dos máscaras de tinta. **Un IoU suelto no
 * dice nada**: hay que compararlo contra el par más alto de glifos que nadie
 * confunde. En la fila de llamada ese control positivo es
 * **`camara` vs `microfono` = 0,306**. Contra esa vara:
 * · el glifo viejo daba **0,647** — el DOBLE de la colisión natural más alta.
 * · el nuevo da **0,110** — por debajo de ella.
 * ⇒ **el instrumento imprime el par más alto y el más bajo de cada fila**, para
 * que quien lo corra tenga su propia vara y no herede la mía.
 *
 * ── ⚠️ LOS TRES LÍMITES, DECLARADOS ────────────────────────────────────────
 * ① **Corre en react-native-web.** Mide árbol, ancho y SILUETA. **NO mide el
 *    render nativo** — `react-native-svg` traduce a vistas nativas y ahí un
 *    path puede comportarse distinto. *La silueta sí vale en los dos: es del
 *    path, no del backend de dibujo.*
 * ② **NO va al hook de pre-commit ni a `verify:diseno`**: levanta un Chrome y
 *    bundlea 3,9 MB. Es de paso ⓪ o de cierre — precedente `verify-edge-deno`.
 * ③ **No tiene umbral y no lo va a tener.** No existe un IoU «legal»: el juicio
 *    es de la mesa mirando la lámina. *Este instrumento pone el número sobre la
 *    mesa; no firma por ella.*
 *
 * ── USO ────────────────────────────────────────────────────────────────────
 *   node scripts/medir-siluetas.mjs            → la tabla
 *   node scripts/medir-siluetas.mjs --lamina   → además, el PNG para el founder
 * Las filas a medir se declaran en `scripts/siluetas/entrada.tsx`, importando
 * LA PIEZA REAL.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const ENTRADA = join(RAIZ, 'scripts/siluetas/entrada.tsx')
/* El bundle sale FUERA del repo. Precedente `verify-edge-deno`: un gate que
   deja residuo en el árbol ensucia el ancla del próximo publish (regla 82). */
const SALIDA = mkdtempSync(join(tmpdir(), 'siluetas-'))

function bundlear() {
  execFileSync(
    'npx',
    [
      'esbuild', ENTRADA,
      '--bundle', `--outfile=${join(SALIDA, 'bundle.js')}`,
      '--loader:.js=jsx', '--loader:.ttf=dataurl', '--loader:.png=dataurl',
      '--jsx=automatic',
      // Las cuatro definiciones que hacen falta para correr un bundle de RN
      // fuera de Metro. Cada una costó un intento fallido: sin ellas el
      // bundle carga y la página queda EN BLANCO con un error de consola.
      '--define:process.env.NODE_ENV="development"',
      '--define:__DEV__=true',
      '--define:global=window',
      '--define:process={"env":{"NODE_ENV":"development"}}',
      '--alias:react-native=react-native-web',
      `--alias:@epetplace/ui=${join(RAIZ, 'packages/ui/src')}`,
      '--resolve-extensions=.web.tsx,.web.ts,.web.js,.tsx,.ts,.jsx,.js,.json',
    ],
    { cwd: RAIZ, stdio: ['ignore', 'ignore', 'pipe'] },
  )
  writeFileSync(
    join(SALIDA, 'index.html'),
    '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#111"><div id="raiz"></div><script src="bundle.js"></script>',
  )
}

async function medir() {
  /* `playwright-core` es CommonJS: el named export no viaja por `import`. */
  const { default: pw } = await import(join(RAIZ, 'node_modules/playwright-core/index.js'))
  const chromium = pw.chromium
  const nav = await chromium.launch({ channel: 'chrome' })
  const pag = await nav.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 2 })
  const errores = []
  pag.on('pageerror', (e) => errores.push(e.message.slice(0, 140)))
  await pag.goto('file://' + join(SALIDA, 'index.html'))
  await pag.waitForTimeout(700)

  const filas = await pag.$$('[data-fila]')
  /* 🔴 CONTROL DE QUE LA PÁGINA RENDERIZÓ. Sin esto, una página en blanco
     devuelve «cero colisiones» y se lee como verde — el modo de falla que
     L-192 nombra: una verificación cuyo fallo es el SILENCIO. */
  if (filas.length === 0) {
    console.error('NO CONCLUYENTE — la página no renderizó ninguna fila.')
    if (errores.length) console.error('  causa: ' + errores[0])
    await nav.close()
    process.exit(2)
  }

  const iou = (A, B) => {
    let i = 0, u = 0
    for (let k = 0; k < A.length; k++) { if (A[k] || B[k]) u++; if (A[k] && B[k]) i++ }
    return u === 0 ? 0 : i / u
  }

  for (const fila of filas) {
    const id = await fila.getAttribute('data-fila')
    const discos = await fila.$$('[role="button"]')
    const etiquetas = [], mascaras = []
    for (const d of discos) {
      etiquetas.push(await d.getAttribute('aria-label'))
      const b64 = (await d.screenshot()).toString('base64')
      mascaras.push(await pag.evaluate(async (dato) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + dato; await img.decode()
        const c = document.createElement('canvas'); c.width = 96; c.height = 96
        const g = c.getContext('2d'); g.drawImage(img, 0, 0, 96, 96)
        const px = g.getImageData(0, 0, 96, 96).data, m = []
        for (let i = 0; i < px.length; i += 4) m.push(px[i] > 190 && px[i + 1] > 190 && px[i + 2] > 190 ? 1 : 0)
        return m
      }, b64))
    }

    console.log(`\n── ${id} · ${discos.length} glifo(s) ─────────────────────────`)
    for (let i = 0; i < etiquetas.length; i++) {
      const tinta = mascaras[i].reduce((a, c) => a + c, 0)
      console.log(`   ${etiquetas[i].padEnd(16)} tinta ${String(tinta).padStart(4)}${tinta === 0 ? '   🔴 NO PINTA' : ''}`)
    }

    const pares = []
    for (let i = 0; i < mascaras.length; i++)
      for (let j = i + 1; j < mascaras.length; j++)
        pares.push({ a: etiquetas[i], b: etiquetas[j], v: iou(mascaras[i], mascaras[j]) })
    pares.sort((x, y) => y.v - x.v)

    console.log('   solape de silueta (IoU), de mayor a menor:')
    for (const p of pares) console.log(`     ${p.v.toFixed(3)}  ${p.a} · ${p.b}`)
    console.log(`   ⇒ el par MÁS parecido de esta fila es ${pares[0].v.toFixed(3)} — ésa es su vara.`)
    console.log('     *No hay umbral: la decisión es de la mesa mirando la lámina.*')

    if (process.argv.includes('--lamina')) {
      const png = join(SALIDA, `${id}.png`)
      await fila.screenshot({ path: png })
      console.log(`   lámina: ${png}`)
    }
  }
  await nav.close()
}

bundlear()
await medir()
