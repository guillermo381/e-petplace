/**
 * S115-E · ⓪ BASELINE — la foto de ANTES.
 *
 * Sin baseline no hay «no cambió»: una medición posterior sin punto de partida
 * puede decir «está bien» sobre algo que empeoró, y nadie lo sabría.
 *
 * SÓLO LECTURA. Escribe un JSON en docs/loop/ para que la foto sea comparable
 * después, y lo imprime.
 *
 * Uso:  node scripts/s115/baseline.mjs [--salida <ruta.json>]
 * Sale 0 si pudo tomar la foto entera, 2 si algo no se pudo medir (jamás 1:
 * un baseline no juzga al producto, sólo lo retrata).
 */
import { writeFileSync } from 'node:fs';
import { q, uno, procedencia, NO_CONCLUYENTE } from './_lib-e.mjs';

const args = process.argv.slice(2);
const iSalida = args.indexOf('--salida');
const SALIDA = iSalida >= 0 ? args[iSalida + 1] : 'docs/loop/S115-E-baseline.json';

const foto = { tomada_en: null, procedencia: procedencia(), medidas: {}, no_medido: [] };

/** Cada medida se toma aparte: si una falla, las otras siguen y se declara cuál faltó. */
function medir(clave, sql, extraer) {
  try {
    const filas = q(sql);
    foto.medidas[clave] = extraer ? extraer(filas) : filas;
  } catch (e) {
    foto.no_medido.push({ clave, razon: String(e?.message ?? e).slice(0, 300) });
    foto.medidas[clave] = null;
  }
}

// ── El reloj lo dice el servidor, jamás la máquina que corre el script ────────
try {
  foto.tomada_en = uno('select now() as t').t;
  foto.postgres = uno('select version() as v').v;
} catch (e) {
  console.error('⚪ NO CONCLUYENTE · no hay canal a la base:', String(e?.message ?? e));
  process.exit(NO_CONCLUYENTE);
}

// ── ① Superficie del schema public ───────────────────────────────────────────
medir('tablas_public',
  `select count(*)::int as n from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='r'`, (f) => f[0].n);

medir('vistas_public',
  `select count(*)::int as n from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind in ('v','m')`, (f) => f[0].n);

medir('funciones_public',
  `select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public'`, (f) => f[0].n);

medir('schemas_no_estandar',
  `select nspname from pg_namespace
   where nspname not like 'pg_%' and nspname not in ('information_schema')
   order by nspname`, (f) => f.map((x) => x.nspname));

// ── ② proacl: quién puede ejecutar qué (la foto que hace medible a L-140) ────
// El resumen es el número que se compara; la lista nominal es para el diff fino.
medir('funciones_con_execute_anon',
  `select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE')`,
  (f) => f[0].n);

medir('funciones_con_execute_authenticated',
  `select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and has_function_privilege('authenticated', p.oid, 'EXECUTE')`,
  (f) => f[0].n);

medir('funciones_proacl_null',
  `select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proacl is null`, (f) => f[0].n);

// Lista nominal de las alcanzables por anon — para poder decir CUÁL apareció, no sólo cuántas.
medir('nominal_execute_anon',
  `select p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' as f
   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE')
   order by 1`, (f) => f.map((x) => x.f));

// ── ③ facturas ───────────────────────────────────────────────────────────────
medir('facturas_existe', `select to_regclass('public.facturas') is not null as e`, (f) => f[0].e);
medir('facturas_filas', `select count(*)::int as n from facturas`, (f) => f[0].n);
medir('facturas_detalle',
  `select numero_factura, total, estado, emitida_por_tercero, clave_acceso,
          subtotal_0, subtotal_12, subtotal_15, iva_valor, created_at
   from facturas order by created_at`);

// ── ④ Secuenciales — DOS lecturas, porque «secuencial» es ambiguo y se declara ─
// (a) las SECUENCIAS de Postgres en public (el objeto)
medir('secuencias_postgres',
  `select c.relname as seq from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='S' order by 1`, (f) => f.map((x) => x.seq));
// (b) los numeradores fiscales que hoy existen en datos
medir('secuencial_numeros_factura',
  `select numero_factura from facturas order by created_at`, (f) => f.map((x) => x.numero_factura));
// (c) tablas cuyo nombre sugiere numeración fiscal (hoy deberían ser 0)
medir('tablas_secuencia_fiscal',
  `select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='r'
     and (relname ~* 'fiscal' or relname ~* 'secuenc' or relname ~* 'documento')
   order by 1`, (f) => f.map((x) => x.relname));

// ── ⑤ pagos_intentos aprobados ───────────────────────────────────────────────
medir('pagos_aprobados_total',
  `select count(*)::int as n from pagos_intentos where estado='aprobado'`, (f) => f[0].n);
medir('pagos_por_estado',
  `select estado, count(*)::int as n from pagos_intentos group by 1 order by 2 desc`);
medir('pagos_aprobados_por_proveedor',
  `select proveedor, count(*)::int as n, sum(monto)::numeric(12,2) as monto,
          min(creado_en) as primero, max(creado_en) as ultimo
   from pagos_intentos where estado='aprobado' group by 1 order by 2 desc`);
medir('pagos_aprobados_max_creado_en',
  `select max(creado_en) as t from pagos_intentos where estado='aprobado'`, (f) => f[0].t);

// ── ⑥ cuentas_comerciales por modelo_comercial ───────────────────────────────
medir('cuentas_por_modelo',
  `select modelo_comercial::text as modelo, estado, count(*)::int as n
   from cuentas_comerciales group by 1,2 order by 1,2`);
medir('cuentas_total', `select count(*)::int as n from cuentas_comerciales`, (f) => f[0].n);
medir('modelo_comercial_enum',
  `select e.enumlabel as v from pg_type t join pg_enum e on e.enumtypid=t.oid
   where t.typname='modelo_comercial_enum' order by e.enumsortorder`, (f) => f.map((x) => x.v));

// ── ⑦ Contexto fiscal que los instrumentos van a mirar después ───────────────
medir('cat_tasas_impuesto',
  `select codigo, country_code, porcentaje, vigencia_desde, vigencia_hasta
   from cat_tasas_impuesto order by codigo`);
medir('app_config_fiscal',
  `select clave, valor from app_config where clave ~* 'fiscal|tope|iva|sri' order by clave`);
medir('desgloses_filas',
  `select 'bono' as d, count(*)::int as n from bono_desglose
    union all select 'cita', count(*)::int from cita_desglose
    union all select 'programa', count(*)::int from programa_desglose
    union all select 'compra', count(*)::int from compra_desglose
    union all select 'guarderia_suscripcion', count(*)::int from guarderia_suscripcion_desglose
    union all select 'recurrencia', count(*)::int from recurrencia_desglose
    union all select 'suscripcion', count(*)::int from suscripcion_desglose
   order by 1`);
medir('eventos_economicos_filas',
  `select count(*)::int as n from eventos_economicos`, (f) => f[0].n);

// ── Salida ───────────────────────────────────────────────────────────────────
writeFileSync(SALIDA, JSON.stringify(foto, null, 2) + '\n');

const m = foto.medidas;
console.log('━━ S115-E · BASELINE');
console.log(`   tomada ${foto.tomada_en} · rama ${foto.procedencia.rama} · sha ${foto.procedencia.sha.slice(0, 8)}`);
console.log(`   tablas public .............. ${m.tablas_public}`);
console.log(`   vistas public ............. ${m.vistas_public}`);
console.log(`   funciones public .......... ${m.funciones_public}`);
console.log(`   ├─ EXECUTE a anon ......... ${m.funciones_con_execute_anon}`);
console.log(`   ├─ EXECUTE a authenticated  ${m.funciones_con_execute_authenticated}`);
console.log(`   └─ proacl NULL (default) .. ${m.funciones_proacl_null}`);
console.log(`   facturas .................. ${m.facturas_existe ? `${m.facturas_filas} filas` : 'NO EXISTE'}`);
console.log(`   secuencias de Postgres .... ${m.secuencias_postgres ? m.secuencias_postgres.length : '?'}`);
console.log(`   tablas fiscal/secuencia/doc ${m.tablas_secuencia_fiscal ? (m.tablas_secuencia_fiscal.length ? m.tablas_secuencia_fiscal.join(', ') : '(ninguna)') : '?'}`);
console.log(`   pagos aprobados ........... ${m.pagos_aprobados_total} (último ${m.pagos_aprobados_max_creado_en})`);
console.log(`   cuentas comerciales ....... ${m.cuentas_total}`);
for (const c of m.cuentas_por_modelo ?? []) console.log(`      ${c.modelo} · ${c.estado} · ${c.n}`);
console.log(`   eventos_economicos ........ ${m.eventos_economicos_filas}`);
console.log(`\n   → ${SALIDA}`);

if (foto.no_medido.length) {
  console.log('\n⚪ NO SE PUDO MEDIR (declarado, no omitido):');
  for (const x of foto.no_medido) console.log(`   · ${x.clave} — ${x.razon}`);
  process.exit(NO_CONCLUYENTE);
}
process.exit(0);
