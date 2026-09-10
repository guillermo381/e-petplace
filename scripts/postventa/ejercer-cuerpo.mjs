/** El cuerpo del ejercicio. Separado del arranque para que las piezas de
 *  credencial y transporte se puedan importar sin correr nada. */
import { execFileSync } from 'node:child_process'

const sql = (q) => {
  const s = execFileSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', cwd: '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace', timeout: 180_000 })
  return JSON.parse(s.slice(s.indexOf('{'))).rows ?? []
}

const pct = (n, d) => (d === 0 ? '—' : `${((n / d) * 100).toFixed(0)} %`)
const rango = (xs) => `${Math.min(...xs)}–${Math.max(...xs)}`
const media = (xs) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)

export default async function correr({ entrar, llamar, reVoseo, reUsted, N }) {
  console.log(`\n${'═'.repeat(74)}\n  LAS DOS EDGES POR CAMINO REAL · ${N} corridas por celda\n${'═'.repeat(74)}`)

  // ── El sujeto, leído de la base ────────────────────────────────────────────
  const casos = sql(`select c.id::text as caso, c.objeto_tipo, c.objeto_id::text as objeto,
      c.motivo_codigo, c.clase, c.etapa,
      (select count(*) from public.caso_mensajes m where m.caso_id=c.id)::int as turnos
    from public.casos_postventa c order by c.clase, turnos desc`)
  console.log(`\n  sujetos: ${casos.length} casos · clases ${[...new Set(casos.map((c) => c.clase))].join(', ')}`)

  // El conjunto RESUELTO por objeto — la misma fuente que lee la edge.
  const resueltos = {}
  for (const o of ['cita', 'estadia', 'pedido']) {
    resueltos[o] = sql(`select codigo, clase, urgente, pide_foto, procedencia from public.v_motivos_resueltos where objeto_resuelto='${o}'`)
  }
  console.log(`  catálogo resuelto: ${Object.entries(resueltos).map(([o, r]) => `${o}=${r.length}`).join(' · ')}`)

  const familia = await entrar('epetplace-cuenta-founder')
  const casa = await entrar('epetplace-cuenta-casa-prueba')
  console.log(`  sesiones: familia ✅ · casa ✅  (credenciales del llavero, no impresas)\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // ① INTAKE — TEXTO Y DICTADO
  // ═══════════════════════════════════════════════════════════════════════════
  const RELATOS = [
    { objeto: 'cita', modo: 'texto', esperado_clase: 2,
      t: 'Contraté un paseo de una hora y el paseador me lo trajo a los veinte minutos. Pagué por una hora completa.' },
    { objeto: 'cita', modo: 'texto', esperado_clase: 3,
      t: 'Mi perra volvió del paseo cojeando de la pata de atrás y con una herida en la almohadilla. Está temblando.' },
    { objeto: 'pedido', modo: 'texto', esperado_clase: 1,
      t: 'El pedido nunca llegó. Esperé todo el día y nadie tocó el timbre ni me llamó.' },
    { objeto: 'estadia', modo: 'texto', esperado_clase: 1,
      t: 'Quedamos en que pasaban a buscarlo a las nueve y no vino nadie. Tuve que llevarlo yo.' },
    // 🔴 EL DICTADO. No es el mismo texto con otra etiqueta: es como habla
    // alguien, con muletillas, sin puntuación y con la idea a mitad de camino.
    // *Mandar prosa escrita con `modo:'voz'` mediría la etiqueta, no el dictado.*
    { objeto: 'cita', modo: 'voz', esperado_clase: 2,
      t: 'eh hola mira te cuento que ayer eh lo llevé al baño y la verdad que no me gustó nada como quedó o sea lo dejaron todo mal cortado y encima con la oreja lastimada no sé' },
    /* 🔴 EL RELATO QUE DESTAPA EL DUPLICADO. `no_ejecutado` existe para cita Y
       para estadía, y estadía hereda de cita ⇒ el conjunto resuelto lo trae dos
       veces con dos voces. Si el desempate no funciona, la voz que vuelve es la
       de una CITA («No vino / no me atendieron») sobre una guardería. */
    { objeto: 'estadia', modo: 'texto', esperado_clase: 1, voz_propia: 'No lo cuidaron / no me lo devolvieron',
      t: 'Lo dejé tres días en la guardería y cuando fui a buscarlo no me lo devolvieron. Nadie me explicó nada.' },
    { objeto: 'pedido', modo: 'voz', esperado_clase: 3,
      t: 'nada que el alimento que me llegó eh venía con un olor rarísimo y bueno el perro comió un poco y ahora está con diarrea o sea yo creo que estaba en mal estado' },
  ]

  const acc = RELATOS.map(() => ({ ok: 0, enCat: 0, claseOk: 0, fotoOk: 0, voseo: 0, usted: 0, sin: 0, opciones: 0, motivos: [] }))

  for (let v = 1; v <= N; v++) {
    for (let i = 0; i < RELATOS.length; i++) {
      const r = RELATOS[i]
      const res = await llamar('postventa-intake', familia.token, { texto: r.t, objeto: r.objeto, modo: r.modo })
      const a = acc[i]
      if (res.status !== 200 || !res.json) { a.sin += 1; continue }
      // El catálogo entero viaja SIEMPRE — es la promesa del modo de falla.
      if (Array.isArray(res.json.opciones) && res.json.opciones.length === resueltos[r.objeto].length) a.opciones += 1
      const p = res.json.propuesta
      if (!p) { a.sin += 1; continue }
      a.ok += 1
      const fila = resueltos[r.objeto].find((m) => m.codigo === p.motivo)
      if (fila) {
        a.enCat += 1
        // 🔴 La clase y el pide_foto tienen que venir DE LA FILA. Se compara
        // contra la base, no contra lo que el modelo dijo.
        if (p.clase === fila.clase && p.urgente === fila.urgente) a.claseOk += 1
        if (p.pide_foto === fila.pide_foto) a.fotoOk += 1
      }
      a.motivos.push(p.motivo)
      /* Cuando el relato declara qué voz espera, se compara: es el
         discriminador del duplicado propio-vs-heredado. */
      if (r.voz_propia !== undefined) {
        if (p.voz_catalogo === r.voz_propia) a.vozPropia = (a.vozPropia ?? 0) + 1
        else a.vozAjena = (a.vozAjena ?? 0) + 1
      }
      if (reVoseo.test(p.resumen)) a.voseo += 1
      if (reUsted.test(p.resumen)) a.usted += 1
    }
  }

  console.log(`${'─'.repeat(74)}\n  ① INTAKE — motivo del catálogo · clase de la fila · voz\n${'─'.repeat(74)}`)
  for (let i = 0; i < RELATOS.length; i++) {
    const r = RELATOS[i], a = acc[i]
    const top = Object.entries(a.motivos.reduce((m, x) => ({ ...m, [x]: (m[x] ?? 0) + 1 }), {}))
      .sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k}×${n}`).join(' ')
    console.log(`\n  [${r.modo}] ${r.objeto} — «${r.t.slice(0, 52)}…»`)
    console.log(`     propuestas: ${a.ok}/${N}${a.sin ? ` · sin propuesta: ${a.sin}` : ''}`)
    console.log(`     motivo EN EL CATÁLOGO RESUELTO: ${a.enCat}/${a.ok} (${pct(a.enCat, a.ok)})   → ${top}`)
    console.log(`     clase+urgente DE LA FILA: ${a.claseOk}/${a.enCat}   ·   pide_foto DE LA FILA: ${a.fotoOk}/${a.enCat}`)
    console.log(`     catálogo entero en \`opciones\`: ${a.opciones}/${N}`)
    console.log(`     voz — voseo: ${a.voseo}/${a.ok}   usted: ${a.usted}/${a.ok}`)
    if (r.voz_propia !== undefined) {
      console.log(`     🔴 voz PROPIA del objeto (no la heredada): ${a.vozPropia ?? 0}/${a.ok}   ajena: ${a.vozAjena ?? 0}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ② EL MODO DE FALLA — que sea el declarado y no un «probá de nuevo»
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${'─'.repeat(74)}\n  ② EL MODO DE FALLA DECLARADO\n${'─'.repeat(74)}`)
  const bordes = [
    ['texto que no dice nada', { texto: 'aaaa', objeto: 'cita', modo: 'texto' }],
    ['texto sin relación con un servicio', { texto: 'quiero saber el horario de atención', objeto: 'cita', modo: 'texto' }],
    ['objeto inválido', { texto: 'algo pasó', objeto: 'inventado', modo: 'texto' }],
    ['sin texto', { texto: '', objeto: 'cita', modo: 'texto' }],
  ]
  for (const [nombre, cuerpo] of bordes) {
    const res = await llamar('postventa-intake', familia.token, cuerpo)
    const j = res.json ?? {}
    const tieneOpciones = Array.isArray(j.opciones) && j.opciones.length > 0
    const veredicto = res.status === 200
      ? (j.propuesta ? `propuesta \`${j.propuesta.motivo}\`` : `propuesta null${tieneOpciones ? ` + ${j.opciones.length} opciones ✅` : ' SIN opciones 🔴'}`)
      : `HTTP ${res.status} · \`${j.codigo ?? '?'}\``
    console.log(`  ${nombre.padEnd(36)} → ${veredicto}`)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ③ HOJA — clase 2 (con hilo) y clase 3
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${'─'.repeat(74)}\n  ③ HOJA DEL CASO\n${'─'.repeat(74)}`)
  const PROHIBIDOS = ['estado', 'nuevo_estado', 'transicion', 'transición', 'resolucion', 'resolución',
    'monto', 'monto_devuelto', 'total', 'importe', 'reembolso', 'devolucion', 'devolución',
    'clase', 'destino', 'decidido_por', 'aprobado', 'confirmado_por']

  /* 🔴 UN HALLAZGO DEL SUJETO, DECLARADO ANTES DE LEER NINGÚN NÚMERO: los
     cuatro casos sembrados están en etapa `resuelto` o `resuelto_entre_partes`.
     La hoja existe para un caso que la casa TIENE QUE RESOLVER, así que sobre
     un caso cerrado el modelo contesta —correctamente— «no hay nada que
     proponer». *Eso mide que lee el material, no que sabe proponer.*
     Por eso cada caso se corre en DOS variantes: con su etapa real (honesto) y
     sin la etapa (lo que la casa ve cuando abre el caso). **No se inventa una
     etapa abierta**: se omite el campo y se dice que se omitió. */
  /* 🔴 LOS SUJETOS SE APUNTAN POR ID, NO POR HEURÍSTICA — Y LA CORRECCIÓN ES
     DE E, QUE TENÍA RAZÓN.
     La versión anterior elegía «el mejor caso de clase 2» ordenando por abierto
     y por turnos. Funciona hoy y **deja de funcionar sin avisar**: el día que
     alguien siembre otro caso de clase 2 con más turnos, el arnés cambia de
     sujeto solo y las corridas dejan de ser comparables **sin que nada falle**.
     *Un índice o un «el primero que cumpla» no identifica un sujeto: lo
     describe, y la descripción se la puede quedar otro.*

     Se aceptan por prefijo porque es lo que un humano copia y pega, pero se
     RESUELVEN contra la base y se imprime el uuid entero: lo que se reporta
     tiene que poder buscarse después. Si un id no resuelve —o resuelve a más de
     uno— es NO CONCLUYENTE, jamás un fallback a la heurística: caer al «mejor
     disponible» mediría otro caso con el nombre del que pediste. */
  const ABIERTAS = ['recibido', 'con_prestador', 'con_casa']
  const abierto = (x) => ABIERTAS.includes(x.etapa)

  const pedidos = process.argv.slice(3).filter((a) => a.startsWith('--caso='))
    .map((a) => a.slice('--caso='.length))
  let sujetos
  if (pedidos.length > 0) {
    sujetos = []
    for (const pref of pedidos) {
      const m = casos.filter((c) => c.caso.startsWith(pref))
      if (m.length !== 1) {
        console.log(`\n  🔴 NO CONCLUYENTE — \`${pref}\` resuelve a ${m.length} casos. No se elige uno por mí.`)
        process.exit(2)
      }
      sujetos.push(m[0])
    }
    console.log(`  sujetos POR ID (${sujetos.length}):`)
    for (const c of sujetos) console.log(`    ${c.caso}  clase ${c.clase} · ${c.etapa} · ${c.turnos} turnos`)
  } else {
    const elegir = (clase) =>
      casos.filter((x) => x.clase === clase).sort((a, b) =>
        (abierto(b) - abierto(a)) || (b.turnos - a.turnos))[0]
    sujetos = [elegir(2), elegir(3)].filter(Boolean)
    console.log(`  ⚠️ sujetos ELEGIDOS POR HEURÍSTICA (no se pasó --caso=): el día que`)
    console.log(`     aparezca otro caso que la cumpla mejor, esto cambia de sujeto solo.`)
    for (const c of sujetos) console.log(`     ${c.caso}  clase ${c.clase} · ${c.etapa}`)
  }

  const hayAbierto = sujetos.some((c) => c && abierto(c))
  if (!hayAbierto) {
    console.log(`\n  🔴 NO CONCLUYENTE PARA EL CAMINO PRINCIPAL — ningún sujeto está abierto.`)
    console.log(`     Lo que sigue mide que la hoja LEE el material, no que sabe PROPONER.`)
  }

  for (const c of sujetos) {
    if (!c) { console.log('  ⚠️ falta un sujeto para esta clase'); continue }
   for (const variante of ['con etapa real', 'sin etapa']) {
    const hilo = sql(`select autor as quien, cuerpo as texto, creado_en::text as cuando from public.caso_mensajes where caso_id='${c.caso}' order by creado_en`)
      .map((m) => ({ quien: m.quien === 'familia' ? 'familia' : m.quien === 'casa' ? 'casa' : 'prestador', texto: m.texto, cuando: m.cuando }))
    const a = { ok: 0, marcada: 0, prohibidos: 0, sinPorque: 0, voseo: 0, usted: 0, sin: 0, quees: [] }
    for (let v = 1; v <= N; v++) {
      const caso = variante === 'con etapa real'
        ? { motivo: c.motivo_codigo, clase: c.clase, objeto: c.objeto_tipo, etapa: c.etapa }
        : { motivo: c.motivo_codigo, clase: c.clase, objeto: c.objeto_tipo }
      const res = await llamar('postventa-hoja', casa.token, {
        caso,
        hilo,
        evidencia: { objeto_id: c.objeto, tipo: c.objeto_tipo },
      })
      const j = res.json
      if (res.status !== 200 || !j || j.codigo) { a.sin += 1; continue }
      a.ok += 1
      if (j.es_propuesta === true) a.marcada += 1
      const claves = [...Object.keys(j), ...Object.keys(j.propuesta ?? {}).map((k) => `propuesta.${k}`)]
      if (claves.some((k) => PROHIBIDOS.includes(k.replace('propuesta.', '').toLowerCase()))) a.prohibidos += 1
      if (!j.propuesta?.porque) a.sinPorque += 1
      const prosa = `${j.resumen_hilo} ${j.propuesta?.que} ${j.propuesta?.porque}`
      if (reVoseo.test(prosa)) a.voseo += 1
      if (reUsted.test(prosa)) a.usted += 1
      a.quees.push(j.propuesta?.que ?? '')
    }
    const marca = abierto(c) ? '🟢 ABIERTO — camino principal' : '⚠️ cerrado — mide lectura, no propuesta'
    console.log(`\n  clase ${c.clase} · ${c.objeto_tipo} · ${c.motivo_codigo} · ${hilo.length} turnos · [${variante}${variante === 'con etapa real' ? ` = ${c.etapa}` : ''}] · ${marca}`)
    console.log(`     hojas: ${a.ok}/${N}${a.sin ? ` · sin hoja: ${a.sin}` : ''}`)
    console.log(`     marcada \`es_propuesta\`: ${a.marcada}/${a.ok}`)
    console.log(`     con campo de estado/monto/transición: ${a.prohibidos}/${a.ok}  (tiene que ser 0)`)
    console.log(`     sin \`porque\`: ${a.sinPorque}/${a.ok}  (tiene que ser 0)`)
    console.log(`     voz — voseo: ${a.voseo}/${a.ok}   usted: ${a.usted}/${a.ok}`)
    if (a.quees[0]) console.log(`     ejemplo: «${a.quees[0].slice(0, 115)}»`)
   }
  }
  console.log(`\n${'═'.repeat(74)}\n`)
}
