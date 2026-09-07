#!/usr/bin/env -S deno run --allow-read --allow-net --allow-env --allow-run
/**
 * `extract-papel` CONTRA PAPELES REALES — exactitud por campo e invención.
 * S113-D · fase 3, D3.
 *
 * 🔴 **MODELO REAL: gasta.** Usa EL prompt de la edge, importado.
 *
 * ── DE DÓNDE SALEN LOS PAPELES, Y POR QUÉ SON MÍOS ─────────────────────────
 * Del generador que dejó el founder, **con semilla propia (`1130744`) y salida
 * propia**: E arma su lote y su mano, yo el mío, y ninguno lee el del otro.
 * *Dos manos sobre el mismo lote no son dos mediciones: son una con dos
 * lectores.* Mismo generador ⇒ mismas trampas, distintos datos.
 *
 * ── MI MANO, Y NO ES EL JSON DEL GENERADOR ─────────────────────────────────
 * La verdad del generador es la del CÓDIGO que produjo los papeles — más fuerte
 * que cualquier lectura humana. Lo que aporto es haberla **contrastado contra
 * la imagen**, y ahí apareció lo que ningún JSON dice:
 *
 * 🔴 **LA FLECHA `↓` NO SE DIBUJA: sale un cuadro vacío.** Medido: **34 de las
 * 46 fuentes del generador no tienen `U+2193`**, y el render elige fuente por
 * documento. Así que para las marcas de flecha el `ground_truth` dice `↓` y el
 * papel muestra `□`. *Medir «¿transcribió la marca?» contra una verdad que el
 * artefacto no lleva haría ver mal a un modelo que está bien.*
 * ⇒ **La vara se corrigió** (firma del founder: *las filas con unidades que la
 * fuente no dibuja se corrigen en la vara, no se le cobran al modelo*): la
 * celda de la marca usa una fuente que tiene la flecha, y los superíndices
 * pasaron a `^n` — que además es lo que imprime un laboratorio que no puede
 * componerlos. Verificado **contra la imagen**, no contra el código.
 *
 * 🔴 Y EL CONJUNTO NO SE CITA COMO EXACTITUD SOBRE PAPELES DE VERDAD. Son
 * sintéticos y **no hay otros**: mide LA LEY —no interpreta, transcribe con su
 * unidad y su referencia, no inventa marcas— y es **tablero de regresión**.
 * Su número es un PISO. Medir con papeles reales es `D-1047`, cuando lleguen
 * las primeras familias.
 */
import { declararObjeto } from './declarar-objeto.ts'
import { PROMPT, sanearFila, CLASES } from '../extract-papel/index.ts'
import { costoEstimadoUsd } from '../_shared/ia/precios.ts'

await declararObjeto({
  mide: ['supabase/functions/extract-papel/index.ts'],
  modeloReal: true,
  noCubre:
    'papeles de verdad: son sintéticos, generados por código. Prueban la LEY y las trampas ' +
    '—coma decimal, unidades que cambian, fuera de rango con y sin marca— pero no la variedad ' +
    'de un papel arrugado de una clínica real. 🔴 **El conjunto NO SE CITA como exactitud sobre ' +
    'papeles de verdad** (firma del founder): mide la LEY y es tablero de regresión. Medir con ' +
    'papeles reales es `D-1047`, cuando lleguen las primeras familias; hasta entonces es un PISO.',
})

const RAIZ = Deno.env.get('LOTE_D') ?? ''
if (!RAIZ) { console.error('🔴 falta LOTE_D'); Deno.exit(2) }

const clave = new TextDecoder().decode(
  (await new Deno.Command('security', {
    args: ['find-generic-password', '-a', 'medicion', '-s', 'anthropic-medicion', '-w'],
  }).output()).stdout,
).trim()
if (!clave.startsWith('sk-ant-')) { console.error('🔴 NO CONCLUYENTE — sin clave'); Deno.exit(2) }

const MODELO = 'claude-sonnet-5'
const SUPERINDICES: Record<string, string> = {
  '\u2070': '0', '\u00b9': '1', '\u00b2': '2', '\u00b3': '3', '\u2074': '4',
  '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9',
}
/** 🔴 `x10³/µL` y `x10^3/µL` son LA MISMA unidad escrita de dos formas, y
 *  compararlas como texto crudo contaba 32 diferencias que no lo son. Esto
 *  compara **unidades, no tipografía** — no es indulgencia: un veterinario lee
 *  las dos igual, y ningún laboratorio elige entre ellas por significado.
 *  Lo destapó pedir QUÉ escribió el modelo en vez de contar cuántas difieren:
 *  las 32 eran una sola cosa. */
const norm = (s: unknown) =>
  String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2070\u00b9\u00b2\u00b3\u2074-\u2079]/g, (c) => `^${SUPERINDICES[c]}`)
    .replace(/\^\^+/g, '^').replace(/\^(\d)\^(\d)/g, '^$1$2')
    .replace(/\s+/g, ' ').replace(/[.,]/g, () => '.').trim()
/** Un valor «7,61» y «7.61» son el MISMO número escrito por dos laboratorios.
 *  Comparar como texto crudo contaría como error una diferencia de coma. */
const mismoNum = (a: unknown, b: unknown) => {
  const na = parseFloat(String(a ?? '').replace(',', '.'))
  const nb = parseFloat(String(b ?? '').replace(',', '.'))
  return Number.isFinite(na) && Number.isFinite(nb) ? Math.abs(na - nb) < 1e-9 : norm(a) === norm(b)
}

type Analito = {
  parametro: string; valor_texto: string; unidad: string; rango_texto: string
  marca_impresa: string | null; fuera_de_rango: boolean
}
const gt = JSON.parse(await Deno.readTextFile(`${RAIZ}/ground_truth_completo.json`)) as Record<string, unknown>[]
const conAnalitos = gt.filter((g) => Array.isArray(g.resultados) && (g.resultados as unknown[]).length > 0)

let tokIn = 0, tokOut = 0, costo = 0
const cuenta = {
  filas_esperadas: 0, filas_devueltas: 0, emparejadas: 0,
  valor: 0, unidad: 0, referencia: 0,
  marca_ascii_ok: 0, marca_ascii_total: 0,
  marca_flecha_total: 0, marca_flecha_ok: 0,
  /** 🔴 EL NÚMERO QUE IMPORTA: una marca donde el papel no tiene ninguna. */
  marcas_inventadas: 0, sin_marca_total: 0,
  juicios: 0,
}
const inventadas: string[] = []
const difUnidad: string[] = []
const juicios: string[] = []
const JUICIOS = ['alto', 'alta', 'bajo', 'baja', 'elevad', 'disminu', 'anormal', 'aumentad',
  'preocupa', 'grave', 'severo', 'insuficien', 'critico', 'crítico', 'normal']

async function unDoc(g: Record<string, unknown>) {
  const nombre = String(g._meta && (g._meta as Record<string, unknown>).archivo || '')
  const ruta = `${RAIZ}/documentos/${nombre}`
  let bytes: Uint8Array
  try { bytes = await Deno.readFile(ruta) } catch { console.log(`  ⚠️ sin archivo: ${nombre}`); return }
  /* 🔴 `String.fromCharCode(...bytes)` revienta con `Maximum call stack size
     exceeded`: son ~1 MB de imagen y el spread los pasa TODOS como argumentos.
     *No es un límite de base64: es un límite de cuántos argumentos entran en
     una llamada.* De a 32 kB no lo toca. */
  let bin = ''
  for (let k = 0; k < bytes.length; k += 32768) {
    bin += String.fromCharCode(...bytes.subarray(k, k + 32768))
  }
  const b64 = btoa(bin)
  const media = nombre.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': clave, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODELO, max_tokens: 4000, thinking: { type: 'disabled' },
      messages: [{
        role: 'user',
        content: [
          media === 'application/pdf'
            ? { type: 'document', source: { type: 'base64', media_type: media, data: b64 } }
            : { type: 'image', source: { type: 'base64', media_type: media, data: b64 } },
          { type: 'text', text: PROMPT },
        ],
      }],
    }),
  })
  const j = await r.json()
  if (!r.ok) { console.log(`  🔴 ${r.status} ${nombre}: ${JSON.stringify(j).slice(0, 160)}`); return }
  tokIn += j.usage.input_tokens; tokOut += j.usage.output_tokens
  costo += costoEstimadoUsd(MODELO, {
    tokens_entrada: j.usage.input_tokens ?? 0, tokens_salida: j.usage.output_tokens ?? 0,
    tokens_cache_lectura: 0, tokens_cache_escritura: 0,
  }) ?? 0

  const txt = (j.content ?? []).filter((c: { type: string }) => c.type === 'text')
    .map((c: { text: string }) => c.text).join('')
  let d: Record<string, unknown> = {}
  try { d = JSON.parse(txt.replace(/^```json\s*|```$/g, '').trim()) } catch {
    console.log(`  🔴 JSON inválido: ${nombre}`); return
  }
  const filas = (Array.isArray(d.filas) ? d.filas : []) as Record<string, unknown>[]
  const esperados = g.resultados as Analito[]
  cuenta.filas_esperadas += esperados.length
  cuenta.filas_devueltas += filas.length

  const usadas = new Set<number>()
  for (const e of esperados) {
    const i = filas.findIndex((f, k) => !usadas.has(k) && norm(f.nombre).includes(norm(e.parametro).split(' ')[0]))
    const esFlecha = e.marca_impresa === '↑' || e.marca_impresa === '↓'
    if (e.marca_impresa === null) cuenta.sin_marca_total++
    else if (esFlecha) cuenta.marca_flecha_total++
    else cuenta.marca_ascii_total++
    if (i < 0) continue
    usadas.add(i)
    const f = filas[i]
    cuenta.emparejadas++
    if (mismoNum(f.valor, e.valor_texto)) cuenta.valor++
    if (norm(f.unidad) === norm(e.unidad)) cuenta.unidad++
    else if (difUnidad.length < 40) {
      /* 🔴 QUÉ ESCRIBIÓ, no sólo que difirió (pedido de E). Un fallo de unidad
         puede ser cosmético («UI/L» vs «U/L») o puede ser **una unidad comida**
         —`x10/µL` donde el papel dice `x10^6/µL`— que es un error de un factor
         de un millón y se lee perfectamente plausible. *Un contador que no
         distingue las dos no puede decir si el papel es seguro.* */
      difUnidad.push(`${e.parametro}: papel «${e.unidad}» · modelo «${f.unidad}»`)
    }
    if (norm(f.referencia).replace(/\s/g, '') === norm(e.rango_texto).replace(/\s/g, '')) cuenta.referencia++

    /* 🔴 LA INVENCIÓN. `literal` es la línea tal cual; si el papel NO tiene
       marca y el literal trae una, el modelo la puso. Se buscan las cuatro que
       el papel usa, y sólo al FINAL de la línea o suelta — no adentro de un
       nombre («Hb» no es una `H»). */
    const lit = String(f.literal ?? '')
    const traeMarca = /(?:^|\s)([HL*↑↓])\s*$/.test(lit) || /\s[HL*↑↓]\s/.test(lit)
    if (e.marca_impresa === null && traeMarca) {
      cuenta.marcas_inventadas++
      if (inventadas.length < 8) inventadas.push(`${nombre} · ${e.parametro}: «${lit}»`)
    }
    if (e.marca_impresa !== null && lit.includes(e.marca_impresa)) {
      if (esFlecha) cuenta.marca_flecha_ok++; else cuenta.marca_ascii_ok++
    }

    // Ningún adjetivo de juicio, en ningún campo de la fila.
    const texto = norm(JSON.stringify(f)).replace(/"confianza":"[a-z]+"/g, '')
    for (const jz of JUICIOS) {
      if (texto.includes(jz)) { cuenta.juicios++; if (juicios.length < 8) juicios.push(`${nombre} · ${e.parametro}: ${jz} en «${JSON.stringify(f).slice(0, 120)}»`); break }
    }
  }
  const clase = String(d.clase ?? '')
  console.log(`  ${(CLASES as readonly string[]).includes(clase) ? 'ok' : '🔴'} ${clase.padEnd(8)} ${String(filas.length).padStart(3)}/${String(esperados.length).padStart(3)} filas  ${nombre.slice(0, 52)}`)
}

console.log(`\n== ${conAnalitos.length} documentos con tabla de analitos ==`)
for (let i = 0; i < conAnalitos.length; i += 3) {
  await Promise.all(conAnalitos.slice(i, i + 3).map(unDoc))
}

const pc = (n: number, d: number) => d === 0 ? '—' : `${n}/${d} (${Math.round(n * 100 / d)}%)`

/* 🔴 SIN FILAS NO HAY MEDICIÓN, Y SE DICE. Una corrida que no pudo llamar al
   proveedor —clave sin crédito, red caída— imprimía `MARCAS INVENTADAS 0 sobre
   0` y `ADJETIVOS 0`, que **se leen como un verde**. *Un cero sobre cero no es
   un aprobado: es la ausencia de la prueba.* */
if (cuenta.emparejadas === 0) {
  console.log('\n🔴 NO CONCLUYENTE — cero filas emparejadas: el arnés NO MIDIÓ.')
  console.log('   Revisá el log de arriba: si dice `credit balance is too low`, es la clave.')
  Deno.exit(2)
}
console.log(`\n── EXACTITUD POR CAMPO, sobre las filas emparejadas ──`)
console.log(`  filas          ${pc(cuenta.emparejadas, cuenta.filas_esperadas)} emparejadas · devolvió ${cuenta.filas_devueltas}`)
console.log(`  valor          ${pc(cuenta.valor, cuenta.emparejadas)}`)
console.log(`  unidad         ${pc(cuenta.unidad, cuenta.emparejadas)}`)
console.log(`  referencia     ${pc(cuenta.referencia, cuenta.emparejadas)}`)
if (difUnidad.length) {
  console.log(`\n  ── las ${difUnidad.length} unidades que difieren, LITERALES ──`)
  const cuentaDif = new Map<string, number>()
  for (const d of difUnidad) cuentaDif.set(d.split(': ')[1], (cuentaDif.get(d.split(': ')[1]) ?? 0) + 1)
  for (const [k, n] of [...cuentaDif].sort((a, b) => b[1] - a[1])) console.log(`     ×${n}  ${k}`)
}
console.log(`\n── LA LEY: TRANSCRIBIR SIN INTERPRETAR ──`)
console.log(`  marca ASCII (H·L·*) transcrita   ${pc(cuenta.marca_ascii_ok, cuenta.marca_ascii_total)}`)
console.log(`  marca de FLECHA (↑·↓) transcrita ${pc(cuenta.marca_flecha_ok, cuenta.marca_flecha_total)}`)
console.log(`  🔴 MARCAS INVENTADAS             ${cuenta.marcas_inventadas} sobre ${cuenta.sin_marca_total} filas sin marca`)
if (inventadas.length) console.log(inventadas.map((s) => `     ${s}`).join('\n'))
console.log(`  🔴 ADJETIVOS DE JUICIO           ${cuenta.juicios}`)
if (juicios.length) console.log(juicios.map((s) => `     ${s}`).join('\n'))
console.log(`\nCOSTO REAL  ${tokIn} tok entrada · ${tokOut} salida · $${costo.toFixed(4)} · $${(costo / conAnalitos.length).toFixed(4)} por papel`)
console.log('  ⚠️ UNA corrida. Con un modelo, el número es una tendencia.')
Deno.exit(0)
