/**
 * GATE · TODA VISTA DE `public` CORRE COMO QUIEN LA CONSULTA.
 *
 * ── POR QUÉ EXISTE, con su rojo real ────────────────────────────────────────
 * Sin `security_invoker`, una vista corre con los permisos de **quien la creó**
 * —`postgres`— y **atraviesa la RLS de todas sus tablas**. El 5-sep-2026 eso
 * dejaba a `anon` leyendo, con la llave que viaja en el bundle de las apps:
 *   v_pitch_metrics · v_mrr · v_crecimiento_usuarios · v_metricas_tiempo_real ·
 *   v_ia_costo_por_pieza_dia   (y `v_gmv_mensual`, vacía pero abierta)
 * `v_pitch_metrics` devolvía `usuarios_registrados_total`, el MRR y el GMV.
 * *No es un dato interno que se filtra: es el número que se dice en una reunión
 * con inversores.*
 *
 * 🔴 **MIDE EL HECHO, NO EL LITERAL — y esto lo parió el propio censo.** Postgres
 * guarda la opción como `security_invoker=on` o `security_invoker=true` **según
 * cómo se escribió el ALTER**, y las dos significan lo mismo. El primer censo
 * comparaba sólo contra `=true` y **reportó como inseguras once vistas que
 * acababa de curar**. *Un censo atado al literal de una opción mide cómo se
 * escribió la migración, no el estado de la base* — y su falso rojo manda a
 * "arreglar" lo que ya está bien.
 *
 * ⚠️ Mide contra **`pg_class`**, jamás contra el texto de las migraciones: una
 * vista puede haberse recreado después sin la opción, y el archivo seguiría
 * diciendo que la tiene.
 *
 *   node scripts/verify-vistas-invoker.mjs [--control]
 */
import { execFileSync } from 'node:child_process'

const FORMAS = ['security_invoker=true', 'security_invoker=on']

/* ═══════════════════════════════════════════════════════════════════════════
 * ⚖️ LAS DOS EXENTAS — FIRMA DE LA MESA, 15-sep-2026, CON SU MEDICIÓN AL LADO
 *
 * 🔴 **LA VISTA ES EL PERMISO, y por eso acá la regla se da vuelta.** Estas dos
 * existen para exponer **MENOS** que su tabla: `prestadores` tiene 41 columnas
 * —teléfono, dirección exacta, lat/lon, datos de cuenta— con su RLS cerrada a
 * propósito desde S84/S91, y `v_prestadores_publicos` publica una proyección
 * curada (zona aproximada en vez de coordenadas, sin contacto). **La vista no
 * atraviesa la RLS por descuido: es la única puerta que la casa quiso abrir.**
 *
 * ⚠️ **LA MEDICIÓN, que es la razón de que esto esté escrito acá y no en un
 * acta:** el 15-sep se «curó» este rojo poniéndoles `security_invoker = on`, y
 * **el gate se puso VERDE mientras la app se moría**. Con una sesión real:
 *
 *     GET /rest/v1/v_prestadores_publicos → 403
 *     {"code":"42501","message":"permission denied for table prestadores"}
 *
 * ⇒ **«Cerca de ti» quedaba VACÍO para todo el mundo.** Se revirtió
 * (`20260915200000`). *La cura que este gate propone, sobre estas dos, rompe
 * producción — y nada de lo que el gate mide puede verlo.*
 *
 * ⇒ **Por eso la exención va POR NOMBRE y con el 403 escrito:** para que quien
 * las vea en rojo no las «arregle» sin medir. *Una exención sin su razón es una
 * regla más floja; con la razón es una regla que aprendió algo.*
 *
 * ⚠️ **ALCANCE: SÓLO ESTAS DOS.** Las demás vistas sin invoker de este proyecto
 * —`v_gmv_mensual`, `v_metricas_tiempo_real`, `v_motivos_resueltos`— **NO están
 * exentas y siguen en rojo**: son de otro dominio, nadie midió qué pasa si se
 * las cura, y *eximir de paso lo que no se midió es cómo un gate de seguridad
 * se vacía sin que nadie lo decida.*
 * ═══════════════════════════════════════════════════════════════════════════ */
const EXENTAS = new Map([
  ['v_prestadores_publicos',
   'la vista ES el permiso: `prestadores` está cerrada por RLS y esto publica su proyección curada. Con invoker → 403 permission denied y «Cerca de ti» vacío (medido 15-sep, revertido en 20260915200000).'],
  ['v_vitrina_publicada',
   'misma clase: publica la vitrina de despensa sobre tablas cerradas. Firma de la mesa 15-sep-2026.'],
])

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
  /* El control no toca la base: prueba que el patrón reconoce LAS DOS formas.
     *Si sólo reconociera una, el gate daría rojo sobre vistas correctas — que es
     exactamente lo que pasó la primera vez.* */
  const reconoce = (o) => FORMAS.includes(o)
  const ok = reconoce('security_invoker=on') && reconoce('security_invoker=true') &&
    !reconoce('security_invoker=off') && !reconoce('security_barrier=true')
  console.log(ok
    ? '✅ control: reconoce «on» y «true», y rechaza «off» y una opción ajena'
    : '🔴 control: el patrón no distingue — no está midiendo')
  process.exit(ok ? 0 : 2)
}

let filas
try {
  filas = sql(`
    select c.relname as vista,
           coalesce(array_to_string(c.reloptions,'|'),'') as opts,
           has_table_privilege('anon', c.oid, 'SELECT') as anon
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'v' and n.nspname = 'public'
    order by c.relname;`)
} catch (e) {
  // Sin base no se puede medir. NO CONCLUYENTE, jamás verde.
  console.log('🔴 NO CONCLUYENTE: no se pudo consultar la base — ' + e.message)
  process.exit(2)
}

/* Su control positivo: si el censo no encontró NINGUNA vista, no está midiendo
   nada y un «0 sin invoker» sería un verde vacío. */
if (filas.length === 0) {
  console.log('🔴 NO CONCLUYENTE: el censo no encontró ninguna vista en `public`.')
  process.exit(2)
}

const sinOpcion = filas.filter((f) => !f.opts.split('|').some((o) => FORMAS.includes(o)))
const malas = sinOpcion.filter((f) => !EXENTAS.has(f.vista))
const exentas = sinOpcion.filter((f) => EXENTAS.has(f.vista))

console.log(`verify:vistas-invoker · ${filas.length} vista(s) en public · ${sinOpcion.length} sin security_invoker · ${exentas.length} exenta(s) por firma`)

/* Las exentas se IMPRIMEN, no se callan: una exención invisible es una regla
   que dejó de existir sin que nadie lo note. */
for (const e of exentas) {
  console.log(`  ⚖️ ${e.vista} — EXENTA por firma de la mesa (15-sep-2026)`)
  console.log(`     ${EXENTAS.get(e.vista)}`)
}

/* 🔴 Y la exención se VERIFICA en la otra dirección: si una exenta apareciera
   CON invoker, alguien la «arregló» y la app está rota ahora mismo. El gate lo
   dice en vez de callarse por estar en su lista. */
const rotas = filas.filter((f) => EXENTAS.has(f.vista) && f.opts.split('|').some((o) => FORMAS.includes(o)))
for (const r of rotas) {
  console.log(`  ✗ ${r.vista} TIENE security_invoker, y está EXENTA: alguien la «curó».`)
  console.log(`     ${EXENTAS.get(r.vista)}`)
}

for (const m of malas) {
  console.log(`  ✗ ${m.vista}${m.anon ? '   🔴 y anon TIENE SELECT' : ''}`)
}
if (rotas.length > 0) {
  console.log('\n✗ Una vista EXENTA quedó con `security_invoker`: la vitrina está devolviendo 403.')
  console.log('  Cura: ALTER VIEW <nombre> RESET (security_invoker);')
  process.exit(1)
}
if (malas.length > 0) {
  console.log('\n✗ Una vista sin `security_invoker` corre como su dueño y atraviesa la RLS.')
  console.log('  Cura: ALTER VIEW <nombre> SET (security_invoker = on);')
  process.exit(1)
}
console.log('✅ todas corren como quien las consulta')
