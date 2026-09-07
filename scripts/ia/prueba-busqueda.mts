#!/usr/bin/env tsx
/**
 * LA CAJA QUE ENCUENTRA, DE PUNTA A PUNTA — con sesión real (S113-D · fase 3).
 *
 * 🔴 **Corre el sujeto de verdad**: `initApi` + `signInWithPassword` con la
 * cuenta de prueba, y después `buscarConIntencion` — la misma función que va a
 * llamar la pantalla, contra la misma base y con la misma RLS.
 * *Un arnés que reimplementa los dos pases mide su propia copia de la
 * composición, y la composición es justamente lo que esta pieza aporta.*
 *
 * Cero escrituras: sólo lee.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { declararObjeto } from './declarar-objeto'
import { initApi, getClient, buscarConIntencion } from '../../packages/api/src/index'

await declararObjeto({
  mide: [
    'packages/api/src/wrappers/busqueda-intencion.ts',
    'packages/domain/src/busquedaPoda.ts',
    'supabase/migrations/20260909640000_s113a_buscar_en_mi_familia.sql',
  ],
  modeloReal: false,
  noCubre:
    'si la búsqueda entiende frases que nadie de esta mesa escribió: las 43 las escribió ' +
    'quien escribió la poda, sobre UNA familia. Y no cubre errores de tipeo («thorr», «muneca»), ' +
    'que dan cero en los dos pases: eso pide coincidencia difusa y no existe.',
})

/* 🔴 `.env.local` NO está trackeado, así que en un worktree de pista no existe:
   vive sólo en el árbol principal. Se prueba el propio y se cae al principal —
   y si no está en ninguno, el arnés lo DICE y sale con 2. *Un arnés que no
   encuentra sus credenciales no midió mal: no midió.* */
const CANDIDATOS = [
  new URL('../../', import.meta.url).pathname,
  execFileSync('git', ['worktree', 'list'], { encoding: 'utf8' }).split('\n')[0].split(' ')[0] + '/',
]
const RAIZ = CANDIDATOS.find((r) => existsSync(`${r}apps/cliente/.env.local`))
if (!RAIZ) { console.error('🔴 NO CONCLUYENTE — no encontré apps/cliente/.env.local en ningún árbol'); process.exit(2) }
const env = Object.fromEntries(
  readFileSync(`${RAIZ}apps/cliente/.env.local`, 'utf8').split('\n')
    .filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
/* La clave se lee del llavero EN EL MOMENTO y no se imprime ni enmascarada:
   un valor mostrado a medias sigue quedando en el transcript, y un transcript
   no se puede editar después. */
const CLAVE = execFileSync('security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' }).trim()

initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
const { data: ses, error } = await getClient().auth.signInWithPassword({
  email: 'guillo381+8@gmail.com', password: CLAVE,
})
if (error || !ses?.session) { console.error('🔴 sin sesión — el arnés NO midió nada:', error?.message); process.exit(2) }

const BUSQUEDAS = [
  'Thor', 'Zeus', 'Lolo', 'croquetas', 'Advantix', 'Aurora', 'Clínica Los Shyris',
  'Paseos Andres', 'vacunación', 'baño y corte', 'arena sanitaria', 'salmon', 'adaptil',
  'guardería', 'teleconsulta', 'cordero', 'pollo y arroz', 'pedido de croquetas',
  'la cita de Thor', 'el baño de Zeus', 'mi pedido de Advantix', 'la cita de vacunación',
  'el pedido de arena',
]
const PREGUNTAS = [
  'cuándo le toca la pipeta', 'cada cuánto se baña un gato', 'es normal que tome tanta agua',
  'qué le doy si vomita', 'cuánto tiene que pesar un beagle adulto', 'puedo darle hueso de pollo',
  'por qué se rasca tanto', 'a qué edad se castra', 'se le cae mucho pelo, es normal',
  'cuántas veces al día come un cachorro', 'le puedo dar leche', 'qué vacunas le faltan',
  'cómo sé si tiene fiebre', 'es malo que duerma tanto', 'cuándo puedo sacarlo a la calle',
  'qué hago si no quiere comer', 'mi perro cojea desde ayer', 'cómo le corto las uñas',
  'necesita desparasitación', 'está muy flaco',
]
/* 🔴 Y lo que NINGUNA de las dos listas cubre, puesto aparte para no inflar el
   número: tipeo y una mascota que no existe. Se corren igual — el punto es que
   salgan por el escalón ③ diciendo la verdad, no que encuentren. */
const NI_UNA_NI_OTRA = ['thorr', 'muneca', 'Rocinante']

const t0 = Date.now()
let dir = 0, pod = 0, cero = 0, falsos = 0
console.log('\n── BÚSQUEDAS ──')
for (const q of BUSQUEDAS) {
  const r = await buscarConIntencion(q, 20)
  if (!r.ok) { console.log(`  🔴 ${q}: ${r.codigo}`); continue }
  const d = r.data
  if (d.pase === 'directo') dir++
  else if (d.pase === 'podado') pod++
  else cero++
  const marca = d.pase === 'podado' ? `  ⟲ podó ${JSON.stringify(d.podado?.quitadas)} → «${d.podado?.consulta}»` : ''
  console.log(`  ${d.resultados.length === 0 ? '🔴' : 'ok'} ${d.pase.padEnd(15)} ${String(d.resultados.length).padStart(2)}  ${q}${marca}`)
}
console.log('\n── PREGUNTAS DE CUIDADO (no deberían encontrar NADA) ──')
for (const q of PREGUNTAS) {
  const r = await buscarConIntencion(q, 20)
  if (!r.ok) { console.log(`  🔴 ${q}: ${r.codigo}`); continue }
  if (r.data.resultados.length > 0) { falsos++; console.log(`  🔴 FALSO POSITIVO ${r.data.resultados.length}  ${q}`) }
  if (!r.data.ofrecer_nexo) console.log(`  🔴 no ofrece Nexo: ${q}`)
}
console.log('\n── NI BÚSQUEDA NI PREGUNTA (tipeo · lo que no existe) ──')
for (const q of NI_UNA_NI_OTRA) {
  const r = await buscarConIntencion(q, 20)
  if (r.ok) console.log(`  ${r.data.pase.padEnd(15)} ${String(r.data.resultados.length).padStart(2)}  ${q}  · ofrece Nexo: ${r.data.ofrecer_nexo}`)
}

const ms = Date.now() - t0
console.log(`\nBÚSQUEDAS  ${dir + pod}/${BUSQUEDAS.length} encuentran — ${dir} en el pase 1, ${pod} rescatadas por la poda, ${cero} en cero`)
console.log(`PREGUNTAS  ${falsos}/${PREGUNTAS.length} falsos positivos ← cuanto MENOS, mejor`)
console.log(`~${Math.round(ms / (BUSQUEDAS.length + PREGUNTAS.length + NI_UNA_NI_OTRA.length))} ms por consulta, ida y vuelta reales`)
process.exit(cero === 0 && falsos === 0 ? 0 : 1)
