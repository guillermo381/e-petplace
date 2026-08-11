// S95-C · Medición de las tablas que el esqueleto jubila.
// SOLO LECTURA. Insumo de la ficha de firma del founder.
// Uso: node scripts/s95/medir-jubiladas.mjs
import { dbQuery } from '../lib-db.mjs';
import { execSync } from 'node:child_process';

const TABLAS = [
  'seller_perfil', 'seller_inventario', 'seller_comisiones', 'seller_documentos',
  'seller_liquidaciones', 'liquidacion_pedidos', 'seller_reglas_asignacion',
  'mensajes_admin_seller', 'pedidos_recurrentes', 'resenas_productos',
  'wishlist', 'lista_espera', 'planes_nutricion', 'cupones', 'cupon_usos',
  'checkout_sesiones', 'vtex_sync_log', 'servicios_exequiales',
];

const lista = TABLAS.map((t) => `'${t}'`).join(',');

console.log('\n═══ ① EXISTENCIA Y COLUMNAS DE FECHA ═══');
const cols = dbQuery(`
  SELECT table_name, string_agg(column_name, ', ' ORDER BY ordinal_position) columnas
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name IN (${lista})
  GROUP BY 1 ORDER BY 1`);
console.log(JSON.stringify(cols, null, 1));

console.log('\n═══ ② CONTEOS EXACTOS + ÚLTIMA ESCRITURA ═══');
// Se arma por tabla porque cada una tiene columnas de fecha distintas.
const conFecha = {};
for (const c of cols) {
  const cs = c.columnas.split(', ');
  conFecha[c.table_name] = {
    created: cs.includes('created_at') ? 'created_at' : null,
    updated: cs.includes('updated_at') ? 'updated_at' : null,
  };
}
for (const t of TABLAS) {
  const f = conFecha[t];
  if (!f) { console.log(`${t}: LA TABLA NO EXISTE`); continue; }
  const partes = [`count(*) n`];
  if (f.created) partes.push(`max(${f.created})::text ultimo_created`);
  if (f.updated) partes.push(`max(${f.updated})::text ultimo_updated`);
  const r = dbQuery(`SELECT ${partes.join(', ')} FROM ${t}`)[0];
  console.log(`${t}: ${JSON.stringify(r)}${!f.created && !f.updated ? '  ⚠️ SIN COLUMNA DE FECHA' : ''}`);
}

console.log('\n═══ ③ FKs ENTRANTES (qué se rompe si la tabla se va) ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT tgt.relname destino, src.relname origen, con.conname,
         CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
              WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' ELSE con.confdeltype::text END on_delete
  FROM pg_constraint con
  JOIN pg_class src ON src.oid=con.conrelid
  JOIN pg_class tgt ON tgt.oid=con.confrelid
  WHERE con.contype='f' AND tgt.relname IN (${lista}) ORDER BY 1,2`), null, 1));

console.log('\n═══ ④ FKs SALIENTES (a quién apuntan) ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT src.relname origen, tgt.relname destino, con.conname
  FROM pg_constraint con
  JOIN pg_class src ON src.oid=con.conrelid
  JOIN pg_class tgt ON tgt.oid=con.confrelid
  WHERE con.contype='f' AND src.relname IN (${lista}) ORDER BY 1,2`), null, 1));

console.log('\n═══ ⑤ FUNCIONES / TRIGGERS QUE LAS TOCAN ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT p.proname, p.prosecdef definer
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND pg_get_functiondef(p.oid) ~* '\\m(${TABLAS.join('|')})\\M'
  ORDER BY 1`), null, 1));

console.log('\n═══ ⑥ VISTAS QUE LAS LEEN ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT c.relname vista
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='v'
    AND pg_get_viewdef(c.oid) ~* '\\m(${TABLAS.join('|')})\\M'
  ORDER BY 1`), null, 1));

console.log('\n═══ ⑦ CONSUMIDORES EN EL MONOREPO (grep) ═══');
for (const t of TABLAS) {
  let hits = '';
  try {
    hits = execSync(
      `grep -rn "${t}" apps packages supabase/functions 2>/dev/null | grep -v "database.types" || true`,
      { encoding: 'utf8' },
    ).trim();
  } catch { hits = ''; }
  const n = hits ? hits.split('\n').length : 0;
  console.log(`${t}: ${n} hit(s)${n ? '\n' + hits.split('\n').map((l) => '    ' + l.slice(0, 160)).join('\n') : ''}`);
}
