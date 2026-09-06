/**
 * GATE · PLANTILLA-PRIMERO, PROBADO DESDE AFUERA (S113-D, lote 2.0c).
 *
 * Cuenta filas de `ia_uso` antes y después de un turno contra la edge
 * DESPLEGADA. No lee una línea del código de la edge: mide su efecto.
 *
 * ── TRES COSAS QUE ESTE GATE HACE Y PARECEN DETALLES ───────────────────────
 * ① **Cuenta `pieza='coach'`, NO la tabla.** El router TAMBIÉN es un modelo y
 *    DEBE correr: es quien decide que la pregunta es de dato. Contando la tabla
 *    entera, este gate daría rojo sobre el diseño funcionando bien. (E lo midió:
 *    en 13 turnos `coach_router` corrió 12 veces y `coach` 8.)
 * ② **El delta 0 va con su discriminador EN LA MISMA CORRIDA.** Un turno de
 *    narrativa que SÍ hace crecer el contador. *Sin él, un `ia_uso` que dejó de
 *    escribirse por cualquier motivo da verde para siempre, y ese silencio se
 *    lee como plantilla-primero funcionando.*
 * ③ **La pregunta de dato es la de la CITA, no la del peso.** La plantilla del
 *    peso se calla cuando la mascota no tiene peso cargado —y hace bien: no
 *    inventa— así que el gate daría rojo sobre el comportamiento correcto.
 *    La de la cita contesta SIEMPRE, con cita o sin ella. *Un gate cuyo verde
 *    depende de que el fixture tenga datos es un gate que se pone rojo cuando
 *    la pieza acierta.* Me pasó en la primera corrida.
 *
 * Y el memorial se mide por su CÓDIGO, no por el 404: **una edge borrada
 * también devuelve 404.**
 *
 *   node scripts/verify-coach-delta.mjs      (exige sesión y llaves; sin ellas,
 *                                             NO CONCLUYENTE en rojo)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const REF = 'supabase/.temp/project-ref'
if (!existsSync(REF)) {
  console.error('\nNO CONCLUYENTE verify:coach-delta — sin proyecto linkeado.\n'); process.exit(2)
}
const URL_BASE = `https://${readFileSync(REF, 'utf8').trim()}.supabase.co`
const llave = (servicio, cuenta) => {
  try { return execFileSync('security', ['find-generic-password', '-a', cuenta, '-s', servicio, '-w']).toString().trim() }
  catch { return '' }
}
const srk = llave('epetplace-service-role', 'medicion')
const pass = llave('epetplace-siembra-s97', 'siembra')
if (!srk || !pass) {
  console.error('\nNO CONCLUYENTE verify:coach-delta — faltan credenciales en el llavero.\n'); process.exit(2)
}

let v = 0, r = 0
const exigir = (n, ok, visto) => {
  if (ok) { v++; console.log(`  OK   ${n}`) }
  else { r++; console.log(`  ROJO ${n}${visto === undefined ? '' : ` — visto: ${JSON.stringify(visto)}`}`) }
}

const rt = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: srk, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'guillo381+8@gmail.com', password: pass }),
})
const { access_token } = await rt.json()
if (!access_token) { console.error('\nNO CONCLUYENTE — sin sesión.\n'); process.exit(2) }

const mascotas = await (await fetch(`${URL_BASE}/rest/v1/mascotas?select=id,nombre,estado_vida&limit=20`,
  { headers: { Authorization: `Bearer ${access_token}`, apikey: srk } })).json()
// 🔴 El valor real de la columna es 'activa'/'fallecida'. Elegir por
// `!== 'memorial'` me trajo una mascota muerta en la primera corrida.
const viva = mascotas.find((m) => m.estado_vida === 'activa')
const muerta = mascotas.find((m) => m.estado_vida === 'fallecida')
if (!viva) { console.error('\nNO CONCLUYENTE — sin mascota activa visible.\n'); process.exit(2) }

const cuenta = async (pieza) => {
  const res = await fetch(`${URL_BASE}/rest/v1/ia_uso?select=id&pieza=eq.${pieza}`,
    { headers: { Authorization: `Bearer ${srk}`, apikey: srk, Prefer: 'count=exact', Range: '0-0' } })
  return Number(res.headers.get('content-range').split('/')[1])
}
const turno = async (mascotaId, texto) => {
  const res = await fetch(`${URL_BASE}/functions/v1/coach`, {
    method: 'POST', headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mascotaId, texto }),
  })
  return { status: res.status, json: await res.json().catch(() => ({})) }
}

console.log(`\ncoach-delta · mascota «${viva.nombre}»\n`)
for (const [caso, texto, dCoach] of [
  ['DATO      ', '¿cuándo es la próxima cita?', 0],
  ['NARRATIVA ', '¿es normal que duerma tanto a su edad?', 1],
]) {
  const c0 = await cuenta('coach'), r0 = await cuenta('coach_router')
  const t = await turno(viva.id, texto)
  await new Promise((s) => setTimeout(s, 1500))
  const c1 = await cuenta('coach'), r1 = await cuenta('coach_router')
  exigir(`${caso} · redactor Δ${c1 - c0} (esperado ${dCoach}) · router Δ${r1 - r0}`,
    t.status === 200 && (c1 - c0) === dCoach && (r1 - r0) === 1,
    { status: t.status, fuente: t.json.fuente, coach: c1 - c0, router: r1 - r0 })
}
console.log('  ↑ el segundo es el DISCRIMINADOR: prueba que el contador se mueve.')
console.log('    Sin él, un `ia_uso` que dejó de escribirse daría verde para siempre.')

if (muerta) {
  const c0 = await cuenta('coach'), r0 = await cuenta('coach_router')
  const t = await turno(muerta.id, 'sé que ya no está, contame igual')
  await new Promise((s) => setTimeout(s, 1500))
  exigir(`MEMORIAL · 404 con codigo='memorial' (no un 404 de ruta)`,
    t.status === 404 && t.json.codigo === 'memorial', { status: t.status, codigo: t.json.codigo })
  exigir('  ...y CERO llamadas: ni redactor ni router',
    (await cuenta('coach')) - c0 === 0 && (await cuenta('coach_router')) - r0 === 0)
} else {
  console.log('  ⚠️ sin mascota fallecida visible: el brazo de memorial NO se midió.')
}

console.log(`\n${r === 0 ? 'OK' : 'ROJO'} verify:coach-delta — ${v} verdes · ${r} rojos\n`)
process.exit(r === 0 ? 0 : 1)
