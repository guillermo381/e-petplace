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

const malas = filas.filter((f) => !f.opts.split('|').some((o) => FORMAS.includes(o)))
console.log(`verify:vistas-invoker · ${filas.length} vista(s) en public · ${malas.length} sin security_invoker`)
for (const m of malas) {
  console.log(`  ✗ ${m.vista}${m.anon ? '   🔴 y anon TIENE SELECT' : ''}`)
}
if (malas.length > 0) {
  console.log('\n✗ Una vista sin `security_invoker` corre como su dueño y atraviesa la RLS.')
  console.log('  Cura: ALTER VIEW <nombre> SET (security_invoker = on);')
  process.exit(1)
}
console.log('✅ todas corren como quien las consulta')
