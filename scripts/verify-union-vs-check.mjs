/**
 * GATE · UN UNION DE TIPOS NO PUEDE DECIR MENOS QUE SU CHECK (S113-A, 2.1).
 *
 * ── SU ROJO REAL, medido por B en `main` ────────────────────────────────────
 * `TipoAviso` del wrapper tenía TRES valores y el CHECK de `avisos_coach`
 * CUATRO: `'anticipacion'` nació en la base y nunca llegó al tipo. Y el modo de
 * falla es el peor de todos, porque **no rompe nada**: un `switch` sobre
 * `TipoAviso` compila como EXHAUSTIVO —TypeScript cree que cubrió todo— y en
 * el aparato llega una fila cuyo tipo no está en ningún `case`. *No es un
 * error de tipos: es un tipo que miente y un compilador que le cree.*
 *
 * 🔴 LA ASIMETRÍA ES A PROPÓSITO, y es la lección: **el union puede decir
 * MENOS que el CHECK sólo si alguien lo declara; jamás puede decir MÁS.**
 *  · union ⊂ CHECK sin declarar → ROJO: hay filas que el código no contempla
 *  · union ⊃ CHECK             → ROJO: el código ofrece un valor que la base rechaza
 * *Las dos direcciones importan, y un gate que mide una sola deja la otra
 * sin vigilancia* (L-492).
 *
 * ⚠️ Lee el CHECK del OBJETO (`pg_constraint`), jamás del texto de una
 * migración: la tabla pudo alterarse después y el archivo seguiría diciendo lo
 * de antes.
 *
 *   node scripts/verify-union-vs-check.mjs [--control]
 */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

/** Cada par: el union del wrapper y el CHECK que tiene que espejar. */
const PARES = [
  { tipo: 'TipoAviso', archivo: 'packages/api/src/wrappers/coach.ts',
    tabla: 'public.avisos_coach', columna: 'tipo',
    /* Valores que el CLIENTE agrega y la base no tiene. Se declaran uno por uno
       con su razón — *si se admitiera cualquier extra, el brazo que caza «el
       código ofrece un valor que la base rechaza» dejaría de vigilar.* */
    delCliente: {
      desconocido: 'escape del lector: un tipo que la base gane mañana llega con este valor y el compilador obliga a contemplarlo, en vez de caer por un switch que se cree exhaustivo',
    } },
]

/* 🔴 LEE LAS DOS FORMAS, y la segunda la trajo su propio rojo: al pasar el
   tipo a `(typeof TIPOS_AVISO)[number] | 'desconocido'` el gate encontró UN
   valor donde había cinco. *Un gate atado a una forma mide la convención, no
   el hecho* — y la convención se rompe justo cuando alguien mejora el código. */
function unionDelWrapper(src, nombre) {
  const m = src.match(new RegExp(`export type ${nombre}\\s*=\\s*([^;]+);`))
  if (!m) return null                     // ausente ≠ vacío, y se distingue
  let cuerpo = m[1]
  // forma 2: `(typeof LISTA)[number]` — se resuelve leyendo la lista
  for (const r of cuerpo.matchAll(/\(typeof\s+(\w+)\)\[number\]/g)) {
    const l = src.match(new RegExp(`const ${r[1]}\\s*=\\s*\\[([^\\]]*)\\]`))
    if (!l) return null                   // referencia a una lista que no está
    cuerpo += ' | ' + l[1]
  }
  const vs = [...cuerpo.matchAll(/'([^']+)'/g)].map((x) => x[1])
  return vs.length ? vs : null
}

function checkDeLaBase(tabla, columna) {
  const sql = `select pg_get_constraintdef(oid) as def from pg_constraint
    where conrelid = '${tabla}'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%${columna} = ANY%';`
  const salida = execFileSync('npx',
    ['--yes', 'supabase', '--experimental', 'db', 'query', '--linked', '--file', '/dev/stdin'],
    { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  const m = /\{[\s\S]*\}/.exec(salida)
  if (!m) throw new Error('la base no devolvió JSON')
  const d = JSON.parse(m[0])
  if (d._tag === 'Error') throw new Error(d.error?.message ?? 'error de la base')
  const filas = d.rows ?? []
  if (!filas.length) return null
  return [...filas[0].def.matchAll(/'([^']+)'::text/g)].map((x) => x[1])
}

if (process.argv.includes('--control')) {
  /* El control NO toca la base: prueba que el lector ve las dos direcciones.
     *Un gate que sólo sabe reconocer el caso que lo parió no está midiendo.* */
  const falta = unionDelWrapper("export type X = 'a' | 'b';", 'X')
  const ausente = unionDelWrapper('export type Y = string;', 'X')
  const ok = JSON.stringify(falta) === '["a","b"]' && ausente === null
  console.log(ok
    ? '✅ control: extrae el union y distingue AUSENTE de vacío'
    : `🔴 control: el lector no discrimina — falta=${JSON.stringify(falta)} ausente=${JSON.stringify(ausente)}`)
  process.exit(ok ? 0 : 2)
}

let rojo = 0
for (const p of PARES) {
  const u = unionDelWrapper(readFileSync(p.archivo, 'utf8'), p.tipo)
  if (u === null) {
    console.log(`🔴 NO CONCLUYENTE: no encontré \`export type ${p.tipo}\` en ${p.archivo}`)
    process.exit(2)
  }
  let c
  try { c = checkDeLaBase(p.tabla, p.columna) } catch (e) {
    console.log('🔴 NO CONCLUYENTE: no se pudo leer el CHECK — ' + e.message)
    process.exit(2)
  }
  if (c === null) {
    console.log(`🔴 NO CONCLUYENTE: ${p.tabla}.${p.columna} no tiene CHECK de lista — el gate no mide nada`)
    process.exit(2)
  }
  const faltan = c.filter((v) => !u.includes(v))
  const declarados = Object.keys(p.delCliente ?? {})
  const sobran = u.filter((v) => !c.includes(v) && !declarados.includes(v))
  console.log(`union-vs-check · ${p.tipo} (${u.length}) ↔ ${p.tabla}.${p.columna} (${c.length})`)
  if (faltan.length) {
    rojo++
    console.log(`  ✗ el CHECK acepta ${faltan.length} valor(es) que el tipo NO nombra: ${faltan.join(', ')}`)
    console.log('    ⚠️ un `switch` sobre este tipo compila EXHAUSTIVO y no los cubre.')
  }
  if (sobran.length) {
    rojo++
    console.log(`  ✗ el tipo ofrece ${sobran.length} valor(es) que la base RECHAZA: ${sobran.join(', ')}`)
  }
  for (const d of declarados) {
    if (!u.includes(d)) { rojo++; console.log(`  ✗ '${d}' está declarado como valor del cliente y el tipo NO lo tiene: la tabla miente.`) }
    else if (c.includes(d)) { rojo++; console.log(`  ✗ '${d}' se declaró como del cliente y la base SÍ lo acepta: retirá la declaración.`) }
    else console.log(`  · '${d}' del CLIENTE, por declaración — ${p.delCliente[d]}`)
  }
  if (!faltan.length && !sobran.length) console.log('  ✅ dicen lo mismo')
}
process.exit(rojo ? 1 : 0)
