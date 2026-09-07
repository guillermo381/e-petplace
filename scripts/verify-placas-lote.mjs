/**
 * GATE · `crear_lote_placas` CORRIÓ ALGUNA VEZ POR SU CAMINO REAL.
 *
 * ── POR QUÉ EXISTE (L-402 en su forma exacta) ───────────────────────────────
 * *No basta «¿está alcanzable?» — hace falta «¿CORRIÓ ALGUNA VEZ?»*. Una puerta
 * que nadie estrenó puede estar rota de nacimiento y no dar síntoma, porque no
 * hay tráfico que lo revele. `aplicar_evento_de_pago` estuvo muerta un día
 * entero por eso, y el gate de hoy nace de esa misma lección.
 *
 * ⚠️ **Lo que mide y lo que NO**: mide que existan placas creadas. **No prueba
 * que se hayan creado desde el portal** — eso sólo lo prueba quien lo hace con
 * una sesión admin real. *Un lote creado con `service_role` daría este mismo
 * verde y no habría probado el gate de admin* (L-167: un gate se verifica por
 * el camino de la pantalla, jamás por la defensa que uno supone).
 * `pasaporte_placa` no guarda quién creó el lote, así que este gate **no puede
 * distinguir** un lote hecho desde el portal de uno hecho con `service_role`.
 * *Se declara en vez de fingir que lo mide*: quien lo corra por el portal deja
 * la constancia en el parte, no en la tabla.
 *
 *   node scripts/verify-placas-lote.mjs [--control]
 */
import { execFileSync } from 'node:child_process'

function sql(texto) {
  const salida = execFileSync('npx',
    ['--yes', 'supabase', '--experimental', 'db', 'query', '--linked', '--file', '/dev/stdin'],
    { input: texto, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  const m = /\{[\s\S]*\}/.exec(salida)
  if (!m) throw new Error('la base no devolvió JSON')
  const d = JSON.parse(m[0])
  if (d._tag === 'Error') throw new Error(d.error?.message ?? 'error de la base')
  return d.rows ?? []
}

if (process.argv.includes('--control')) {
  /* El control prueba que el gate DISTINGUE cero de no-cero. Un gate que
     informa «0 lotes» y sale verde no está midiendo nada. */
  const juzgar = (lotes) => (lotes > 0 ? 0 : 1)
  const ok = juzgar(0) === 1 && juzgar(3) === 0
  console.log(ok
    ? '✅ control: 0 lotes da rojo, 3 lotes da verde'
    : '🔴 control: el gate no distingue')
  process.exit(ok ? 0 : 2)
}

let filas
try {
  filas = sql(`select
      -- Los nombres se MIDIERON, no se dedujeron: la tabla es
      -- pasaporte_placa (singular, con prefijo), no «placas». La primera
      -- versión consultaba placas/placas_lotes y salía NO CONCLUYENTE por
      -- «no se pudo consultar la base» — un rojo del INSTRUMENTO que se lee
      -- igual que un rojo del mundo.
      (select count(distinct lote_id) from public.pasaporte_placa) as lotes,
      (select count(*) from public.pasaporte_placa) as placas,
      (select count(*) from public.pasaporte_placa where mascota_id is not null) as activadas,
      (select count(distinct lote_id) from public.pasaporte_placa where lote_id is not null) as con_autor;`)
} catch (e) {
  console.log('🔴 NO CONCLUYENTE: no se pudo consultar la base — ' + e.message)
  process.exit(2)
}

const r = filas[0] ?? {}
const lotes = Number(r.lotes ?? 0)
console.log(`verify:placas-lote · ${lotes} lote(s) · ${r.placas ?? 0} placa(s) · ${r.activadas ?? 0} activada(s)`)

if (lotes === 0) {
  console.log('\n✗ `crear_lote_placas` NUNCA CORRIÓ. Existe y está desplegada, y eso')
  console.log('  no prueba nada: una puerta sin tráfico no puede mostrar que está rota.')
  console.log('  Cura: crear un lote desde el portal admin con una sesión admin real')
  console.log('  (ver docs/loop/S113-PLACAS-IMPRESION.md). NO con `service_role`:')
  console.log('  eso saltea el gate de admin, que es justo lo que hay que estrenar.')
  process.exit(1)
}
console.log('✅ la puerta se estrenó: hay placas creadas por un lote')
