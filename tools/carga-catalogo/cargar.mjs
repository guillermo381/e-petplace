#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// CARGADOR DEL CATÁLOGO DE LA DESPENSA — S95-F
//
// Lee un archivo CSV y carga el catálogo llamando a las DOS funciones de la
// puerta del vendedor. **No escribe una sola tabla directo.**
//
//   proponer_sku_vendedor()  → producto canónico + variante + SKU `propuesto`
//   publicar_oferta_sku()    → el SKU pasa a `aceptado` y nace la oferta
//
// POR QUÉ ASÍ: si la carga inicial pasa por la MISMA función que va a usar el
// vendedor desde su app, el camino queda probado con datos reales antes de que
// él lo toque. *Estrenamos nosotros la puerta, no el primer vendedor.*
// (`MODELO_DESPENSA` §4.2, enmienda firmada S95-F.)
//
// 🔴 LA REGLA QUE GOBIERNA ESTE ARCHIVO: **jamás completa un dato que falta.**
//    Si el CSV no trae la tasa, la especie o los alérgenos, el cargador PARA y
//    lo dice. Un alérgeno inventado no es un bug de datos: es un riesgo
//    clínico (L-139).
//
// USO:
//   node tools/carga-catalogo/cargar.mjs <archivo.csv> --cuenta <uuid>
//   node tools/carga-catalogo/cargar.mjs <archivo.csv> --cuenta <uuid> \
//        --admin <email> --aplicar
//
//   Sin `--aplicar` corre en **ENSAYO**: valida todo y no escribe nada.
// ═══════════════════════════════════════════════════════════════════════════

import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// ─── Canal a la base: el CLI linkeado, igual que el resto de la casa ────────
//     Cero secretos en el repo — la credencial vive en el keychain del founder.
const TMP = mkdtempSync(join(tmpdir(), 'carga-catalogo-'))
let _seq = 0

function sql(texto) {
  const f = join(TMP, `q${_seq++}.sql`)
  writeFileSync(f, texto)
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', '--file', f], {
    encoding: 'utf8',
  })
  const salida = r.stdout || ''
  const i = salida.indexOf('{')
  if (r.status !== 0 || i === -1) {
    // El error de Postgres viene adentro del JSON de error del CLI. Lo
    // devolvemos crudo: el que rechaza es la función, no este script.
    const crudo = (r.stdout || '') + (r.stderr || '')
    const m = crudo.match(/ERROR:\s*[0-9A-Z]+:\s*([^\\"]+)/)
    throw new Error(m ? m[1].trim() : crudo.slice(0, 300).trim())
  }
  return JSON.parse(salida.slice(i)).rows
}

const lit = (v) =>
  v === null || v === undefined || v === '' ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
const jsonLit = (o) => `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`

// ─── CSV: parser propio, sin dependencias ──────────────────────────────────
//     Soporta comillas dobles y comas adentro de campo, que es lo que produce
//     cualquier planilla al exportar.
function parseCSV(texto) {
  const filas = []
  let campo = ''
  let fila = []
  let enComillas = false
  const s = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (enComillas) {
      if (c === '"') {
        if (s[i + 1] === '"') { campo += '"'; i++ } else enComillas = false
      } else campo += c
    } else if (c === '"') enComillas = true
    else if (c === ',') { fila.push(campo); campo = '' }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = '' }
    else campo += c
  }
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila) }
  return filas.filter((f) => f.some((x) => x.trim() !== ''))
}

// 🔴 SEPARADOR: PIPE **O** COMA, y el arreglo va acá y no en el CSV.
//
// El cargador nació esperando `|`. La primera planilla real llegó con comas
// —`"pollo, arroz"`— y **una planilla real siempre va a traer comas, porque así
// escribe la gente.** Arreglar el CSV habría funcionado una vez y roto la
// siguiente.
//
// LO QUE ESTABA EN JUEGO NO ERA EL FORMATO: sin esto, `"pollo, arroz"` entraba
// como **UN SOLO alérgeno** llamado literalmente «pollo, arroz». Ningún perro
// tiene alergia a esa cadena, así que **la exclusión dura nunca habría
// disparado** y el producto se le habría recomendado a un perro alérgico al
// pollo. *No es un detalle de parseo: es la feature entera fallando en
// silencio, que es el peor modo de falla de este frente.*
//
// El parser del CSV ya resuelve las comillas, así que `"pollo, arroz"` llega
// como un campo con coma adentro: separar por coma acá es seguro y no rompe
// nada de lo que ya funcionaba con pipes.
const lista = (v) =>
  String(v || '')
    .split(/[|,]/)
    .map((x) => x.trim())
    .filter(Boolean)

// ─── Columnas ──────────────────────────────────────────────────────────────
const OBLIGATORIAS = [
  'familia', 'marca', 'producto', 'presentacion', 'codigo_variante',
  'codigo_impuesto', 'sku_vendedor', 'precio_venta',
  // 🔴 `especies` SIGUE SIENDO OBLIGATORIA Y `tallas`/`momento_vital` NO, y la
  //    diferencia no es de estilo: **la recomendación filtra por especie con
  //    `contains`**, así que un producto sin especie declarada NUNCA matchea
  //    con una mascota concreta y queda invisible. Vacío ahí es un producto
  //    muerto. En talla y momento, en cambio, el vacío es el DEFAULT de la
  //    columna y significa «aplica a cualquiera» (S95-J / S95-J2) — es un
  //    valor con sentido, no un dato faltante.
  'especies', 'alergenos',
]
const OPCIONALES = [
  'tallas', 'momento_vital',
  'descripcion', 'contenido_valor', 'contenido_unidad', 'peso_kg', 'gtin',
  'largo_cm', 'ancho_cm', 'alto_cm', 'stock', 'ingredientes', 'dieta_prescripcion',
  // S96 · fotos: paths del bucket `productos-fotos` o URLs, separadas por | o
  // coma. LA PRIMERA ES LA PORTADA (adjuntar_fotos_producto, la forma que
  // decide D-767). El cargador NO sube archivos: referencia lo ya subido.
  'fotos',
  // 🔴 S96 (firma founder 12-ago, 2ª tanda): el estado de la composición —
  // verificada · declarada_sin_verificar · ausente. SOLO la verificada puede
  // callar en la superficie. Vacío = se DERIVA: con `ingredientes` presente,
  // 'declarada_sin_verificar'; sin ellos, 'ausente'. NADA cae en 'verificada'
  // por omisión: verificar es un acto explícito de e-PetPlace, y este archivo
  // lo AVISA fila por fila cuando alguien lo declara.
  'composicion_estado',
  // 🔴 S96 (firma founder 12-ago, 3ª tanda): DE QUÉ MERCADO es la ficha de
  // composición — 'EC' hoy, o 'global' (ficha del fabricante). El fabricante
  // formula por planta y por mercado (caso Royal Canin Hepatic: la ficha EC
  // declara hígado de ave; la británica no). `verificada` SIN mercado real
  // REBOTA — la global no sostiene una verificación.
  'composicion_mercado',
]

// `no_aplica` (4º estado, firma 12-ago): la composición no es una categoría
// que aplique — las arenas sanitarias. SIEMPRE explícito, jamás derivado.
const ESTADOS_COMPOSICION = ['verificada', 'declarada_sin_verificar', 'ausente', 'no_aplica']

// S96: sinónimos de carga → el código canónico del vocabulario. moluscos y
// crustáceos son UNA entrada por firma founder (reactividad cruzada —
// partirlos crea el caso de declarar uno y callar el otro).
const SINONIMOS_ALERGENO = {
  moluscos: 'moluscos_crustaceos',
  crustaceos: 'moluscos_crustaceos',
  crustáceos: 'moluscos_crustaceos',
  mariscos: 'moluscos_crustaceos',
  salmón: 'salmon',
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔴 LOS DOS VOCABULARIOS CERRADOS (S95-J / S95-J2)
//
// `productos.tallas_aplicables` y `productos.momentos_aplicables` tienen CHECK
// en la base. **`proponer_sku_vendedor` los inserta SIN validar**, así que un
// valor fuera del vocabulario llega hasta Postgres y rebota como
// `check_violation` cruda — un error que menciona un constraint y no dice qué
// hacer. *A un vendedor que carga su catálogo eso no le sirve de nada.*
//
// Se valida ACÁ, antes de viajar, con el mensaje que sí ayuda.
const TALLAS_VALIDAS = ['S', 'M', 'L']
const MOMENTOS_VALIDOS = ['cachorro', 'joven', 'adulto', 'senior']

// El catálogo del vendedor dice «pequeño / mediano / grande»; la base dice
// S/M/L. **Se traduce, no se rechaza**: es la misma talla con otro nombre, y
// hacer que el vendedor reescriba su catálogo para hablar nuestro idioma sería
// trasladarle a él un problema nuestro.
const SINONIMOS_TALLA = {
  pequeno: 'S', pequeño: 'S', chico: 'S', s: 'S',
  mediano: 'M', medio: 'M', m: 'M',
  grande: 'L', l: 'L', gigante: 'L',
}

// 🔴 «TODAS» NO ES UN VALOR: ES EL ARRAY VACÍO. El catálogo del vendedor
// escribe «todas» para decir «sirve para cualquier talla», y en la base eso se
// dice con la lista VACÍA —que además es el DEFAULT—. Meter la palabra «todas»
// haría que el producto no matchee con NINGUNA mascota y quede invisible sin
// que nadie sepa por qué.
const SIGNIFICA_CUALQUIERA = ['todas', 'todos', 'cualquiera', 'todas las tallas', 'na', 'n/a']

function normalizarVocabulario(valores, tabla, validos) {
  if (valores.some((v) => SIGNIFICA_CUALQUIERA.includes(v.toLowerCase().trim()))) {
    return { valores: [], invalidos: [] }   // «todas» → vacío
  }
  const salida = []
  const invalidos = []
  for (const v of valores) {
    const clave = v.toLowerCase().trim()
    const traducido = tabla[clave] ?? (validos.includes(v) ? v : null)
    if (traducido === null) invalidos.push(v)
    else if (!salida.includes(traducido)) salida.push(traducido)
  }
  return { valores: salida, invalidos }
}

// ═══════════════════════════════════════════════════════════════════════════
function main() {
  const args = process.argv.slice(2)
  const archivo = args.find((a) => !a.startsWith('--'))
  const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null }
  const cuenta = val('--cuenta')
  const admin = val('--admin')
  const aplicar = args.includes('--aplicar')

  if (!archivo) {
    console.error('Falta el archivo CSV.\n  node tools/carga-catalogo/cargar.mjs catalogo.csv --cuenta <uuid>')
    process.exit(2)
  }
  if (!cuenta) {
    console.error('Falta --cuenta <uuid de la cuenta comercial del vendedor>.')
    process.exit(2)
  }
  if (aplicar && !admin) {
    console.error('Para --aplicar hace falta --admin <email>: la publicación exige un admin real y NO se adivina.')
    process.exit(2)
  }

  console.log(`\n${aplicar ? '🔴 MODO APLICAR' : '🟢 MODO ENSAYO (no escribe nada)'}\n`)

  // ── Catálogos vivos: se LEEN, no se asumen (regla 22) ────────────────────
  const familias = sql(
    `select codigo from cat_familias_producto where activo and not deprecado order by codigo;`
  ).map((r) => r.codigo)
  const impuestos = sql(
    `select codigo from cat_tasas_impuesto where activo order by codigo;`
  ).map((r) => r.codigo)
  // S96 (firma 12-ago, 3ª tanda): el vocabulario de alérgenos es DATO —
  // ampliar = un INSERT en cat_alergenos, y este archivo lo lee vivo.
  const alergenosValidos = sql(
    `select codigo from cat_alergenos where activo order by codigo;`
  ).map((r) => r.codigo)
  const mercados = sql(
    `select country_code from country_config order by country_code;`
  ).map((r) => r.country_code)

  console.log(`Familias vivas:  ${familias.join(' · ')}`)
  console.log(`Códigos de tasa: ${impuestos.join(' · ')}`)
  console.log(`Alérgenos:       ${alergenosValidos.join(' · ')}\n`)

  // ── La cuenta tiene que ser vendedora ──────────────────────────────────
  //    En ENSAYO es un AVISO, no un freno: hoy la cuenta del vendedor todavía
  //    no existe, y el founder tiene que poder preparar y validar su planilla
  //    igual. Frenar acá le impediría avanzar en lo único que sí depende de
  //    él. Para APLICAR sí es freno duro — y no se crea la cuenta.
  const [{ es_vendedora }] = sql(
    `select _cuenta_es_vendedora(${lit(cuenta)}) as es_vendedora;`
  )
  if (!es_vendedora) {
    const aviso =
      `la cuenta ${cuenta} no tiene rol \`seller_productos\` activo.\n` +
      `   No se inventa la cuenta ni el rol para que la carga entre:\n` +
      `   es un acto del founder, no de este script.`
    if (aplicar) {
      console.error(`🔴 FRENO: ${aviso}\n`)
      process.exit(1)
    }
    console.log(`⚠️  AVISO: ${aviso}`)
    console.log(`   El ensayo sigue igual — la planilla se puede validar desde ya.\n`)
  }

  let adminId = null
  if (aplicar) {
    const r = sql(
      `select a.id from admin_users a join profiles p on p.id = a.id
        where lower(p.email) = lower(${lit(admin)}) and a.activo;`
    )
    if (!r.length) {
      console.error(`🔴 FRENO: "${admin}" no es un admin activo. Publicar exige admin y no se simula.`)
      process.exit(1)
    }
    adminId = r[0].id
  }

  // ── Leer y validar — CSV o JSON, el mismo vocabulario ───────────────────
  //    S96: el archivo puede ser `.json` (un array de objetos con las MISMAS
  //    claves que las columnas del CSV). Un solo camino de validación para
  //    los dos formatos: el formato es la cáscara, las reglas son una.
  let filasDatos
  if (archivo.toLowerCase().endsWith('.json')) {
    let crudo
    try { crudo = JSON.parse(readFileSync(archivo, 'utf8')) }
    catch (e) { console.error(`🔴 El JSON no parsea: ${e.message}`); process.exit(2) }
    if (!Array.isArray(crudo) || crudo.length === 0) {
      console.error('🔴 El JSON tiene que ser un array de objetos, uno por producto.')
      process.exit(2)
    }
    const clavesPrimera = Object.keys(crudo[0]).map((k) => k.toLowerCase())
    const faltanJ = OBLIGATORIAS.filter((c) => !clavesPrimera.includes(c))
    if (faltanJ.length) {
      console.error(`🔴 Faltan claves obligatorias en el JSON: ${faltanJ.join(', ')}`)
      process.exit(2)
    }
    filasDatos = crudo.map((o, i) => {
      const f = { _linea: i + 1 }
      for (const [k, v] of Object.entries(o)) {
        // Los arrays JSON se aceptan nativos; todo lo demás viaja como texto,
        // igual que en el CSV — un solo camino de validación.
        f[k.toLowerCase()] = Array.isArray(v) ? v.join('|') : String(v ?? '').trim()
      }
      return f
    })
  } else {
    const filas = parseCSV(readFileSync(archivo, 'utf8'))
    if (!filas.length) { console.error('El archivo está vacío.'); process.exit(2) }

    const cab = filas[0].map((h) => h.trim().toLowerCase())
    const faltan = OBLIGATORIAS.filter((c) => !cab.includes(c))
    if (faltan.length) {
      console.error(`🔴 Faltan columnas obligatorias: ${faltan.join(', ')}`)
      console.error(`   (La columna \`alergenos\` tiene que EXISTIR aunque el producto no tenga: se escribe "ninguno".)`)
      process.exit(2)
    }

    filasDatos = filas.slice(1).map((f, i) => {
      const o = { _linea: i + 2 }
      cab.forEach((h, j) => { o[h] = (f[j] ?? '').trim() })
      return o
    })
  }

  const resultados = []
  const avisos = []  // S96: no frenan la carga — le hablan a quien cura
  const skusVistos = new Map()
  const variantesVistas = new Map()

  for (const f of filasDatos) {
    const motivos = []
    // `alergenos` queda afuera del chequeo genérico: tiene su propio mensaje,
    // que explica QUÉ escribir. "falta alergenos" no le dice a nadie que la
    // palabra que hay que poner es `ninguno`.
    const falta = (c) => { if (!f[c]) motivos.push(`falta ${c}`) }
    OBLIGATORIAS.filter((c) => c !== 'alergenos').forEach(falta)

    if (f.familia && !familias.includes(f.familia)) {
      motivos.push(`familia "${f.familia}" no existe (vivas: ${familias.join(', ')})`)
    }
    if (f.codigo_impuesto && !impuestos.includes(f.codigo_impuesto)) {
      motivos.push(`codigo_impuesto "${f.codigo_impuesto}" no existe o no está activo`)
    }

    // 🔴 EL ALÉRGENO NO ADMITE CELDA VACÍA.
    //    Vacío es ambiguo: puede ser "no tiene" o "no lo llené". Las dos cosas
    //    se ven igual y una de ellas es peligrosa. Para decir "no tiene" hay
    //    que ESCRIBIR `ninguno`.
    if (f.alergenos === '') {
      motivos.push('alergenos vacío: escribí "ninguno" si el producto no tiene. Vacío es ambiguo y acá la ambigüedad es clínica')
    }

    for (const c of ['especies', 'tallas', 'momento_vital']) {
      if (f[c] && lista(f[c]).length === 0) motivos.push(`${c} no tiene valores`)
    }

    // 🔴 LOS DOS VOCABULARIOS CERRADOS, validados ANTES de viajar.
    const t = normalizarVocabulario(lista(f.tallas), SINONIMOS_TALLA, TALLAS_VALIDAS)
    if (t.invalidos.length > 0) {
      motivos.push(
        `tallas ${t.invalidos.map((x) => `"${x}"`).join(', ')} no existe(n). ` +
        `Válidas: ${TALLAS_VALIDAS.join(' · ')} (o pequeño/mediano/grande, que se traducen). ` +
        `Para "sirve para cualquier talla", escribí "todas" o dejalo vacío`,
      )
    }
    f._tallas = t.valores

    const m = normalizarVocabulario(lista(f.momento_vital), {}, MOMENTOS_VALIDOS)
    if (m.invalidos.length > 0) {
      motivos.push(
        `momento_vital ${m.invalidos.map((x) => `"${x}"`).join(', ')} no existe(n). ` +
        `Válidos: ${MOMENTOS_VALIDOS.join(' · ')}. ` +
        `Ojo: M1…M6 son del EXPEDIENTE, no del catálogo — un producto declara la ` +
        `etapa de vida para la que sirve, no el momento del vínculo con la mascota`,
      )
    }
    f._momentos = m.valores

    const precio = Number(f.precio_venta)
    if (f.precio_venta && (!Number.isFinite(precio) || precio <= 0)) {
      motivos.push(`precio_venta "${f.precio_venta}" no es un número mayor a cero`)
    }

    // ── S96 · el estado de composición (firma 12-ago) ──────────────────────
    if (f.composicion_estado && !ESTADOS_COMPOSICION.includes(f.composicion_estado)) {
      motivos.push(
        `composicion_estado "${f.composicion_estado}" no existe. ` +
        `Válidos: ${ESTADOS_COMPOSICION.join(' · ')} — y vacío se deriva solo`,
      )
    }
    // La derivación DEFENSIVA: sin declaración explícita, con ingredientes es
    // 'declarada_sin_verificar' y sin ellos 'ausente'. Jamás 'verificada'.
    f._compoEstado = f.composicion_estado ||
      (lista(f.ingredientes).length > 0 ? 'declarada_sin_verificar' : 'ausente')
    if (f.composicion_estado === 'verificada') {
      avisos.push(
        `L${f._linea} declara composicion_estado=VERIFICADA (${f.marca} — ${f.producto}): ` +
        `es una afirmación de e-PetPlace de que la lista de alérgenos se cotejó ` +
        `contra la composición. Si nadie la cotejó, sacala: la verificada es la única que CALLA`,
      )
    }
    if (['ausente', 'no_aplica'].includes(f.composicion_estado) && lista(f.ingredientes).length > 0) {
      motivos.push(
        `composicion_estado "${f.composicion_estado}" con ingredientes declarados: sería ` +
        'negar una composición que está (la base también lo rebota). ' +
        'Para "ausente", dejalo vacío y se deriva solo',
      )
    }
    // COROLARIO de la misma firma: la advertencia se dispara por COMPOSICIÓN,
    // jamás por nombre — y el nombre tampoco exime. Medido en el catálogo
    // real: 10 productos "hypoallergenic/sensitive" llevan alérgeno común.
    if (/hypo|allerg|hipoalerg|sensitive|sensible/i.test(f.producto || '') &&
        f.alergenos && f.alergenos.toLowerCase() !== 'ninguno') {
      avisos.push(
        `L${f._linea} "${f.producto}": el nombre promete piel/estómago sensible y la ` +
        `composición declara "${f.alergenos}". No es un error de carga — es el recordatorio ` +
        `de que la advertencia sale de la COMPOSICIÓN y el nombre no es una dieta de eliminación`,
      )
    }

    // ── S96 · 3ª tanda: el vocabulario de alérgenos y el mercado ───────────
    // El alérgeno se valida contra `cat_alergenos` VIVO (la base lo rebota
    // igual — acá se rebota HABLANDO y con el camino de ampliación escrito).
    f._alergenos = f.alergenos && f.alergenos.toLowerCase() !== 'ninguno'
      ? lista(f.alergenos).map((a) => {
          const t = a.toLowerCase().trim()
          return SINONIMOS_ALERGENO[t] ?? t
        })
      : []
    const desconocidos = f._alergenos.filter((a) => !alergenosValidos.includes(a))
    if (desconocidos.length > 0) {
      motivos.push(
        `alérgeno(s) ${desconocidos.map((x) => `"${x}"`).join(', ')} fuera del vocabulario. ` +
        `Vigente: ${alergenosValidos.join(' · ')}. Ampliarlo es un INSERT en cat_alergenos ` +
        `(con firma de curaduría), no una migración — pero se amplía ANTES de cargar, no callando`,
      )
    }
    if (f.composicion_mercado &&
        f.composicion_mercado !== 'global' && !mercados.includes(f.composicion_mercado)) {
      motivos.push(
        `composicion_mercado "${f.composicion_mercado}" no es un país configurado ` +
        `(${mercados.join(' · ')}) ni "global"`,
      )
    }
    // 🔴 LA REGLA DURA de la firma: verificada exige saber CONTRA QUÉ FICHA —
    // y la ficha global del fabricante NO alcanza (caso Royal Canin Hepatic).
    if (f.composicion_estado === 'verificada' && !f.composicion_mercado) {
      motivos.push(
        'composicion_estado "verificada" sin composicion_mercado: una verificación ' +
        'sin ficha de mercado no afirma nada — declarar contra qué ficha se cotejó (hoy: EC)',
      )
    }
    if (f.composicion_estado === 'verificada' && f.composicion_mercado === 'global') {
      motivos.push(
        'composicion_estado "verificada" contra ficha "global": el fabricante formula ' +
        'por mercado — la global cae en declarada_sin_verificar, no en verificada',
      )
    }

    // Duplicados DENTRO del archivo: se cazan acá, no en la base.
    if (f.sku_vendedor) {
      if (skusVistos.has(f.sku_vendedor)) {
        motivos.push(`sku_vendedor repetido (ya está en la línea ${skusVistos.get(f.sku_vendedor)})`)
      } else skusVistos.set(f.sku_vendedor, f._linea)
    }
    const kv = `${f.familia}|${f.marca}|${f.producto}|${f.codigo_variante}`.toLowerCase()
    if (f.codigo_variante) {
      if (variantesVistas.has(kv)) {
        motivos.push(`variante repetida (ya está en la línea ${variantesVistas.get(kv)})`)
      } else variantesVistas.set(kv, f._linea)
    }

    resultados.push({ f, motivos, estado: motivos.length ? 'rechazado' : 'pendiente' })
  }

  const validos = resultados.filter((r) => r.estado === 'pendiente')

  // ── Ejecutar ────────────────────────────────────────────────────────────
  //    S96 · EN GRANDE: las filas viajan en TANDAS de una sola ida a la base
  //    (VALUES + LATERAL sobre las MISMAS funciones de la puerta — la tanda no
  //    es un atajo alrededor de proponer/publicar: es N llamadas en un viaje).
  //    Si una tanda rebota, se reintenta FILA POR FILA para aislar a la
  //    culpable con su motivo — nunca se pierde una tanda entera en silencio.
  if (aplicar) {
    const claims = `select set_config('request.jwt.claims', json_build_object('sub', ${lit(adminId)}, 'role','authenticated')::text, false);`

    const armar = (f) => ({
      producto: {
        familia_codigo: f.familia,
        nombre: f.producto,
        marca: f.marca,
        descripcion: f.descripcion || null,
        especies_aplicables: lista(f.especies),
        // Ya normalizados y validados arriba: S/M/L y la etapa etaria.
        tallas_aplicables: f._tallas,
        momentos_aplicables: f._momentos,
        ingredientes_activos: lista(f.ingredientes),
        // Ya normalizados y validados contra cat_alergenos ("ninguno" ⇒ []).
        alergenos: f._alergenos,
        es_dieta_prescripcion: ['si', 'sí', 'true', '1'].includes(String(f.dieta_prescripcion).toLowerCase()),
      },
      variante: {
        codigo: f.codigo_variante,
        presentacion: f.presentacion,
        contenido_valor: f.contenido_valor || null,
        contenido_unidad: f.contenido_unidad || null,
        peso_kg: f.peso_kg || null,
        gtin: f.gtin || null,
        impuesto_codigo: f.codigo_impuesto,
        largo_cm: f.largo_cm || null,
        ancho_cm: f.ancho_cm || null,
        alto_cm: f.alto_cm || null,
      },
      sku: {
        sku_vendedor: f.sku_vendedor,
        precio_propuesto: f.precio_venta,
        stock_disponible: f.stock || 0,
      },
      fotos: lista(f.fotos),
    })

    // Una fila → la fuente de la tanda. Las fotos van como jsonb o NULL; la
    // primera es la portada (adjuntar_fotos_producto). El estado de
    // composición viaja SOLO si el archivo lo declaró EXPLÍCITO: la
    // derivación (con ingredientes → declarada_sin_verificar · sin →
    // ausente · la verificada caduca si la composición cambia) ya la hace el
    // trigger de la base — llamar a declarar con el derivado en cada
    // re-corrida DEGRADARÍA una verificación viva de e-PetPlace.
    const valorFila = (r) => {
      const a = armar(r.f)
      const fotos = a.fotos.length ? `${jsonLit(a.fotos)}` : `NULL::jsonb`
      const compo = r.f.composicion_estado ? lit(r.f.composicion_estado) : `NULL::text`
      const mercado = r.f.composicion_mercado ? lit(r.f.composicion_mercado) : `NULL::text`
      return `(${r.f._linea}, ${jsonLit(a.producto)}, ${jsonLit(a.variante)}, ` +
             `${jsonLit(a.sku)}, ${Number(r.f.precio_venta)}::numeric, ${fotos}, ${compo}, ${mercado})`
    }

    const consultaTanda = (grupo) =>
      `${claims}\n` +
      `select t.linea, canon.r as canonico, prop.r as propuesto, pub.r as publicado, fot.r as fotos, dec.r as compo\n` +
      `from (values\n  ${grupo.map(valorFila).join(',\n  ')}\n` +
      `) as t(linea, producto, variante, sku, precio, fotos, compo, mercado)\n` +
      // S96 (firma founder): el canónico lo escribe e-PetPlace (este script
      // corre como admin) y el SKU del vendedor es MAPEO sobre él — dos
      // puertas, en este orden, jamás una que haga las dos cosas.
      `cross join lateral (select proponer_producto_canonico(t.producto, t.variante) as r) canon\n` +
      `cross join lateral (select proponer_sku_vendedor(${lit(cuenta)}, t.producto, t.variante, t.sku, 'epetplace') as r) prop\n` +
      `cross join lateral (select publicar_oferta_sku((prop.r->>'sku_id')::uuid, t.precio, 'EC') as r) pub\n` +
      // El producto_id sale del RETORNO de la función, jamás de un subquery:
      // un subquery del statement no ve las filas que la función volátil acaba
      // de insertar (snapshot de sentencia — lo cazó el ensayo de esta tanda).
      `left join lateral (\n` +
      `  select case when t.fotos is not null then adjuntar_fotos_producto(\n` +
      `    (canon.r->>'producto_id')::uuid, t.fotos) end as r\n` +
      `) fot on true\n` +
      `left join lateral (\n` +
      `  select case when t.compo is not null or t.mercado is not null then\n` +
      `    declarar_composicion_estado((canon.r->>'producto_id')::uuid, t.compo, t.mercado)\n` +
      `  end as r\n` +
      `) dec on true;`

    const asentar = (r, canonico, propuesto, publicado, fotos) => {
      // S96: el "creado" del producto/variante vive en la puerta canónica;
      // el del sku, en la del vendedor (mapeo).
      r.estado = canonico.creado.producto || canonico.creado.variante || propuesto.creado.sku
        ? 'creado' : 'actualizado'
      r.detalle = `sku ${String(propuesto.sku_id).slice(0, 8)} · oferta ${String(publicado.oferta_id).slice(0, 8)}`
        + (publicado.sin_cambio ? ' (sin cambio)' : '')
        + (fotos ? ` · ${fotos.fotos} foto(s)` : '')
    }

    const TANDA = 20
    for (let i = 0; i < validos.length; i += TANDA) {
      const grupo = validos.slice(i, i + TANDA)
      try {
        const filasR = sql(consultaTanda(grupo))
        for (const fila of filasR) {
          const r = grupo.find((x) => x.f._linea === fila.linea)
          if (r) asentar(r, fila.canonico, fila.propuesto, fila.publicado, fila.fotos)
        }
      } catch {
        // La tanda rebotó: fila por fila, para que la culpable diga su motivo
        // y las inocentes entren igual.
        for (const r of grupo) {
          try {
            const [fila] = sql(consultaTanda([r]))
            asentar(r, fila.canonico, fila.propuesto, fila.publicado, fila.fotos)
          } catch (e) {
            r.estado = 'rechazado'
            r.motivos = [`la base lo rechazó: ${e.message}`]
          }
        }
      }
    }
  }

  // ── Reporte ─────────────────────────────────────────────────────────────
  if (avisos.length) {
    console.log('─'.repeat(78))
    console.log(`⚠️  ${avisos.length} aviso(s) — no frenan la carga, le hablan a quien cura:`)
    for (const a of avisos) console.log(`   ${a}`)
  }
  console.log('─'.repeat(78))
  for (const r of resultados) {
    const icono = { creado: '✅', actualizado: '🔄', rechazado: '🔴', pendiente: '·' }[r.estado]
    const nombre = `${r.f.marca || '(sin marca)'} — ${r.f.producto || '(sin nombre)'} · ${r.f.presentacion || ''}`
    console.log(`${icono} L${String(r.f._linea).padStart(3)} ${r.estado.padEnd(11)} ${nombre}`)
    if (r.detalle) console.log(`         ${r.detalle}`)
    for (const m of r.motivos) console.log(`         ↳ ${m}`)
  }
  console.log('─'.repeat(78))

  const cuenta_ = (e) => resultados.filter((r) => r.estado === e).length
  // S96: la foto del estado de composición de lo válido — para que quien
  // carga VEA cuánto catálogo va a decir su condición en la vitrina.
  const porCompo = (e) => validos.filter((r) => r.f._compoEstado === e).length
  console.log(
    `composición → verificada ${porCompo('verificada')} · ` +
    `declarada_sin_verificar ${porCompo('declarada_sin_verificar')} · ` +
    `ausente ${porCompo('ausente')} · no_aplica ${porCompo('no_aplica')}` +
    `   (callan la verificada y la no_aplica; las otras dos dicen su condición)`,
  )
  if (aplicar) {
    console.log(`creados ${cuenta_('creado')} · actualizados ${cuenta_('actualizado')} · rechazados ${cuenta_('rechazado')}`)
  } else {
    console.log(`válidos ${validos.length} · rechazados ${cuenta_('rechazado')}   (ENSAYO: no se escribió nada)`)
    console.log(`\nPara escribir de verdad:\n  node tools/carga-catalogo/cargar.mjs ${archivo} --cuenta ${cuenta} --admin <email> --aplicar`)
  }

  // Un rechazo es un fallo: quien corra esto en cadena tiene que enterarse.
  process.exit(cuenta_('rechazado') > 0 ? 1 : 0)
}

main()
