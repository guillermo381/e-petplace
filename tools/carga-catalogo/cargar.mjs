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
]

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

  console.log(`Familias vivas:  ${familias.join(' · ')}`)
  console.log(`Códigos de tasa: ${impuestos.join(' · ')}\n`)

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

  // ── Leer y validar ──────────────────────────────────────────────────────
  const filas = parseCSV(readFileSync(archivo, 'utf8'))
  if (!filas.length) { console.error('El archivo está vacío.'); process.exit(2) }

  const cab = filas[0].map((h) => h.trim().toLowerCase())
  const faltan = OBLIGATORIAS.filter((c) => !cab.includes(c))
  if (faltan.length) {
    console.error(`🔴 Faltan columnas obligatorias: ${faltan.join(', ')}`)
    console.error(`   (La columna \`alergenos\` tiene que EXISTIR aunque el producto no tenga: se escribe "ninguno".)`)
    process.exit(2)
  }

  const filasDatos = filas.slice(1).map((f, i) => {
    const o = { _linea: i + 2 }
    cab.forEach((h, j) => { o[h] = (f[j] ?? '').trim() })
    return o
  })

  const resultados = []
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
  if (aplicar) {
    const claims = `select set_config('request.jwt.claims', json_build_object('sub', ${lit(adminId)}, 'role','authenticated')::text, false);`

    for (const r of validos) {
      const f = r.f
      const producto = {
        familia_codigo: f.familia,
        nombre: f.producto,
        marca: f.marca,
        descripcion: f.descripcion || null,
        especies_aplicables: lista(f.especies),
        // Ya normalizados y validados arriba: S/M/L y la etapa etaria.
        tallas_aplicables: f._tallas,
        momentos_aplicables: f._momentos,
        ingredientes_activos: lista(f.ingredientes),
        // "ninguno" es la declaración explícita de ausencia ⇒ lista vacía.
        alergenos: f.alergenos.toLowerCase() === 'ninguno' ? [] : lista(f.alergenos),
        es_dieta_prescripcion: ['si', 'sí', 'true', '1'].includes(String(f.dieta_prescripcion).toLowerCase()),
      }
      const variante = {
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
      }
      const sku = {
        sku_vendedor: f.sku_vendedor,
        precio_propuesto: f.precio_venta,
        stock_disponible: f.stock || 0,
      }

      try {
        const [p] = sql(
          `${claims}\nselect proponer_sku_vendedor(${lit(cuenta)}, ${jsonLit(producto)}, ` +
          `${jsonLit(variante)}, ${jsonLit(sku)}, 'epetplace') as r;`
        )
        const res = p.r
        const [o] = sql(
          `${claims}\nselect publicar_oferta_sku(${lit(res.sku_id)}, ${Number(f.precio_venta)}, 'EC') as r;`
        )
        r.estado = res.creado.producto || res.creado.variante || res.creado.sku ? 'creado' : 'actualizado'
        r.detalle = `sku ${String(res.sku_id).slice(0, 8)} · oferta ${String(o.r.oferta_id).slice(0, 8)}`
          + (o.r.sin_cambio ? ' (sin cambio)' : '')
      } catch (e) {
        r.estado = 'rechazado'
        r.motivos = [`la base lo rechazó: ${e.message}`]
      }
    }
  }

  // ── Reporte ─────────────────────────────────────────────────────────────
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
