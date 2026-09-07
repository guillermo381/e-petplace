/**
 * GATE · UN RESULTADO DE BÚSQUEDA DE TIPO `papel` NUNCA LLEVA UN VALOR CLÍNICO.
 *
 * ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 * La búsqueda **indexa los analitos a propósito**: quien busca «hematocrito»
 * quiere el examen donde aparece, no un papel que se llame así. Pero indexar
 * para ENCONTRAR y proyectar para MOSTRAR son dos cosas, y sólo la primera es
 * segura.
 *
 * 🔴 **Es la última puerta por la que un examen puede llegar a la familia sin
 * pasar por el muro de D.** Nexo tiene prohibido interpretar un valor —
 * *aconseja, no dictamina* — y la búsqueda **no pasa por Nexo**: si un día
 * alguien agrega `pv.valor` al SELECT «para que se vea mejor en la lista», la
 * familia lee «Creatinina 2,8» en una fila, sin referencia, sin fecha del
 * método y sin nadie que la derive al vet. *El muro que vigila una puerta no
 * protege la de al lado.*
 *
 * ⚠️ **Mide la FUNCIÓN VIVA, no el archivo de la migración**: la función pudo
 * recrearse después. Y mide **el brazo de papeles**, no la función entera —
 * los otros brazos hablan de otras tablas y `valor` ahí no significa esto.
 *
 * Su control (`--control`) prueba que el detector **encuentra** una proyección
 * prohibida cuando la hay: *un gate que nunca vio su rojo no está midiendo.*
 *
 *   node scripts/verify-papel-sin-valores.mjs [--control]
 */
import { execFileSync } from 'node:child_process'

/* Las columnas de `papel_valor` que NO pueden salir en un resultado. `analito`
   NO está: es el nombre del estudio, no su resultado — y es justamente lo que
   hace encontrable la bóveda. */
const PROHIBIDAS = ['valor', 'unidad', 'literal', 'referencia', 'comentario', 'observacion']

/** Aísla el brazo de papeles: desde `'papel' as tipo` hasta el `from` de su tabla. */
function brazoDePapeles(def) {
  const i = def.indexOf("'papel' as tipo")
  if (i < 0) return null
  const j = def.indexOf('papeles_familia', i)
  return j < 0 ? null : def.slice(i, j)
}

/** Una proyección es `pv.<col>` o `<col> as algo` dentro del SELECT del brazo. */
function proyeccionesProhibidas(brazo) {
  return PROHIBIDAS.filter((c) =>
    new RegExp(`\\bpv\\.${c}\\b`, 'i').test(brazo) ||
    new RegExp(`\\bselect[\\s\\S]{0,400}?\\b${c}\\s+as\\b`, 'i').test(brazo))
}

if (process.argv.includes('--control')) {
  /* El control NO toca la base: le da al detector un brazo con la proyección
     prohibida adentro y exige que la vea. Y uno limpio, para que un detector
     que dice «sí» a todo no pase por bueno. */
  const sucio = `'papel' as tipo, pf.titulo, pv.valor as resultado, pf.fecha from papeles_familia`
  const limpio = `'papel' as tipo, pf.titulo, pf.origen, pf.fecha from papeles_familia`
  const a = proyeccionesProhibidas(brazoDePapeles(sucio) ?? '')
  const b = proyeccionesProhibidas(brazoDePapeles(limpio) ?? '')
  const ok = a.includes('valor') && b.length === 0
  console.log(ok
    ? '✅ control: ve `pv.valor` proyectado y deja pasar el brazo limpio'
    : `🔴 control: no discrimina (sucio=${JSON.stringify(a)} limpio=${JSON.stringify(b)})`)
  process.exit(ok ? 0 : 2)
}

let def
try {
  const salida = execFileSync('npx',
    ['--yes', 'supabase', '--experimental', 'db', 'query', '--linked', '--file', '/dev/stdin'],
    { input: `select pg_get_functiondef(p.oid) as def from pg_proc p
              join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='buscar_en_mi_familia';`,
      encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  const m = /\{[\s\S]*\}/.exec(salida)
  if (!m) throw new Error('la base no devolvió JSON')
  const d = JSON.parse(m[0])
  if (d._tag === 'Error') throw new Error(d.error?.message ?? 'error de la base')
  def = d.rows?.[0]?.def
} catch (e) {
  console.log('🔴 NO CONCLUYENTE: no se pudo leer la función viva — ' + e.message)
  process.exit(2)
}

if (!def) {
  console.log('🔴 NO CONCLUYENTE: `buscar_en_mi_familia` no existe en la base.')
  process.exit(2)
}

const brazo = brazoDePapeles(def)
if (!brazo) {
  /* Control positivo del propio gate: si el brazo desapareció, un «0 hallazgos»
     sería un verde vacío sobre algo que ya no está midiendo. */
  console.log('🔴 NO CONCLUYENTE: no encontré el brazo de papeles — el gate no midió nada.')
  process.exit(2)
}

const malas = proyeccionesProhibidas(brazo)
console.log(`verify:papel-sin-valores · brazo de ${brazo.length} chars · ${malas.length} proyección(es) prohibida(s)`)
if (malas.length > 0) {
  for (const c of malas) console.log(`  ✗ proyecta \`${c}\``)
  console.log('\n✗ Un resultado de búsqueda es un PUNTERO al papel: título, origen y fecha.')
  console.log('  El valor se lee adentro, donde vive su referencia y su contexto.')
  process.exit(1)
}
console.log('✅ el brazo indexa analitos para ENCONTRAR y no proyecta ningún valor')
