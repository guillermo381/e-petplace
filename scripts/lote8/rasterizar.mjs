/**
 * RASTERIZAR UN SVG — el instrumento que a esta casa le faltaba.
 *
 * No hay rasterizador en el sistema (medido: ni rsvg, ni resvg, ni inkscape,
 * ni cairosvg, ni sharp). Lo que SÍ hay es el Chrome del sistema, que
 * `playwright-core` puede manejar por su canal `chrome` — y un navegador es
 * un rasterizador de SVG completo y fiel, que es justo lo que hace falta
 * para una marca.
 *
 * ⚠️ `omitBackground: true` deja el PNG con alfa REAL: lo que el SVG no pinta
 * queda transparente. Para el ícono de iOS eso NO sirve —la App Store rechaza
 * un ícono con canal alfa— y por eso el aplanado es un paso APARTE, en
 * `medir.py`: *rasterizar y aplanar son dos actos, y mezclarlos esconde cuál
 * de los dos dejó el alfa.*
 */
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** @param {{svg:string, ancho:number, alto:number, salida:string, transformar?:(s:string)=>string}} o */
export async function rasterizar({ svg, ancho, alto, salida, transformar }) {
  let cuerpo = readFileSync(resolve(svg), 'utf8')
  if (transformar) cuerpo = transformar(cuerpo)

  const navegador = await chromium.launch({ channel: 'chrome' })
  try {
    const pagina = await navegador.newPage({
      viewport: { width: ancho, height: alto },
      deviceScaleFactor: 1,
    })
    /* El SVG se estira al viewport por CSS y no por sus atributos: así el
       mismo archivo sirve para cualquier tamaño sin tocarlo. */
    await pagina.setContent(
      `<!doctype html><style>
         html,body{margin:0;padding:0;background:transparent}
         svg{display:block;width:${ancho}px;height:${alto}px}
       </style>${cuerpo}`,
      { waitUntil: 'load' },
    )
    await pagina.screenshot({ path: resolve(salida), omitBackground: true })
  } finally {
    await navegador.close()
  }
  return salida
}
