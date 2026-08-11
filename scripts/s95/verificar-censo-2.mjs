// S95-C · BLOQUE 0 (segunda pasada) — las preguntas que abrió la primera.
// SOLO LECTURA.
import { dbQuery } from '../lib-db.mjs';

const bloques = [];
const bloque = (titulo, sql) => bloques.push({ titulo, sql });

bloque('A · crear_evento_economico — BODY (cómo lee parametros / cuál es la base)', `
  SELECT pg_get_functiondef(p.oid) def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='crear_evento_economico'
`);

bloque('B · Las tres tablas que apuntan a pedidos y el censo NO nombró', `
  SELECT 'evento_inscripciones' t, count(*) n, count(*) FILTER (WHERE pedido_id IS NOT NULL) con_pedido FROM evento_inscripciones
  UNION ALL SELECT 'servicios_exequiales', count(*), count(*) FILTER (WHERE pedido_id IS NOT NULL) FROM servicios_exequiales
  UNION ALL SELECT 'tickets_soporte', count(*), count(*) FILTER (WHERE pedido_id IS NOT NULL) FROM tickets_soporte
  UNION ALL SELECT 'pedidos_recurrentes', count(*), count(*) FILTER (WHERE ultimo_pedido_id IS NOT NULL) FROM pedidos_recurrentes
  UNION ALL SELECT 'resenas_productos', count(*), count(*) FILTER (WHERE pedido_id IS NOT NULL) FROM resenas_productos
  UNION ALL SELECT 'liquidacion_pedidos', count(*), count(*) FILTER (WHERE pedido_id IS NOT NULL) FROM liquidacion_pedidos
`);

bloque('C · zonas_cobertura — el dato de flete que la letra dice que no existe', `
  SELECT * FROM zonas_cobertura ORDER BY country_code, ciudad, transportista
`);

bloque('D · envios y devoluciones vivos — ¿de qué pedidos cuelgan?', `
  SELECT e.id, e.pedido_id, e.estado, e.transportista, e.costo_envio, e.pagado_por, p.estado pedido_estado, p.total
  FROM envios e LEFT JOIN pedidos p ON p.id=e.pedido_id
`);

bloque('D2 · devoluciones vivas', `
  SELECT d.id, d.pedido_id, d.estado, d.motivo, d.monto_reembolso, d.reembolsado_en, p.estado pedido_estado
  FROM devoluciones d LEFT JOIN pedidos p ON p.id=d.pedido_id
`);

bloque('E · vtex_sync_log — la tabla que el censo no contó', `
  SELECT c.relname, c.reltuples::bigint est FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname ILIKE '%vtex%'
`);
bloque('E2 · filas de vtex_sync_log', `SELECT count(*) n FROM vtex_sync_log`);

bloque('F · FK targets reales de las columnas seller_id', `
  SELECT src.relname tabla, a.attname columna, tgt.relname destino
  FROM pg_constraint con
  JOIN pg_class src ON src.oid=con.conrelid
  JOIN pg_class tgt ON tgt.oid=con.confrelid
  JOIN unnest(con.conkey) WITH ORDINALITY k(attnum, ord) ON true
  JOIN pg_attribute a ON a.attrelid=src.oid AND a.attnum=k.attnum
  WHERE con.contype='f' AND a.attname IN ('seller_id','seller_perfil_id','cuenta_comercial_id','user_id')
    AND src.relname IN ('productos','pedido_items','seller_inventario','seller_comisiones',
                        'seller_liquidaciones','envios','devoluciones','seller_perfil','seller_documentos','pedidos')
  ORDER BY 1,2
`);

bloque('G · cuentas_comerciales vivas', `
  SELECT id, nombre_comercial, razon_social, country_code, moneda, estado, tipo_fiscal FROM cuentas_comerciales ORDER BY created_at
`);

bloque('H · mascotas — las columnas que la recomendación necesita', `
  SELECT column_name, data_type, is_nullable FROM information_schema.columns
  WHERE table_schema='public' AND table_name='mascotas' ORDER BY ordinal_position
`);

bloque('I · mascota_perfil_vigente — columnas', `
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_schema='public' AND table_name='mascota_perfil_vigente' ORDER BY ordinal_position
`);

bloque('J · validación de origen_tipo en eventos_economicos (trigger + CHECK)', `
  SELECT con.conname, pg_get_constraintdef(con.oid) def FROM pg_constraint con
  JOIN pg_class c ON c.oid=con.conrelid WHERE c.relname='eventos_economicos' AND con.contype='c'
`);
bloque('J2 · triggers de eventos_economicos', `
  SELECT t.tgname, p.proname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
  JOIN pg_proc p ON p.oid=t.tgfoid WHERE c.relname='eventos_economicos' AND NOT t.tgisinternal
`);

bloque('K · función de validación de origen polimórfico — body', `
  SELECT p.proname, pg_get_functiondef(p.oid) def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND pg_get_functiondef(p.oid) ILIKE '%origen_tipo%' AND p.proname NOT IN ('crear_evento_economico')
`);

bloque('L · ¿hay alguna función/trigger que escriba en productos, pedidos o seller_*?', `
  SELECT p.proname, p.prosecdef definer
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND (pg_get_functiondef(p.oid) ~* '(insert into|update)\\s+(public\\.)?(pedidos|productos|pedido_items|seller_inventario|envios)\\b')
  ORDER BY 1
`);

bloque('M · sequences / UNIQUE de pedidos (numero_orden)', `
  SELECT con.conname, pg_get_constraintdef(con.oid) def FROM pg_constraint con
  JOIN pg_class c ON c.oid=con.conrelid WHERE c.relname IN ('pedidos','productos','seller_inventario','pedido_items')
    AND con.contype IN ('u','p') ORDER BY 1
`);

bloque('N · policies de envios / devoluciones / facturas / zonas_cobertura', `
  SELECT tablename, policyname, cmd, roles::text, qual, with_check FROM pg_policies
  WHERE schemaname='public' AND tablename IN ('envios','envio_eventos','devoluciones','facturas','zonas_cobertura','seller_perfil','seller_comisiones')
  ORDER BY tablename, cmd
`);

bloque('O · grants de anon sobre fee_configs / eventos_economicos / eventos_mascota', `
  SELECT table_name, grantee, string_agg(DISTINCT privilege_type, ',' ORDER BY privilege_type) p
  FROM information_schema.role_table_grants
  WHERE table_schema='public' AND grantee IN ('anon','authenticated')
    AND table_name IN ('fee_configs','eventos_economicos','eventos_mascota','cat_tipos_evento','country_config','zonas_cobertura','cuenta_roles')
  GROUP BY 1,2 ORDER BY 1,2
`);

bloque('P · tablas tipadas de evento existentes (el molde a copiar)', `
  SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'evento\\_%' ORDER BY 1
`);

bloque('Q · evento_vacuna_aplicada — el molde de tabla tipada', `
  SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns
  WHERE table_schema='public' AND table_name='evento_vacuna_aplicada' ORDER BY ordinal_position
`);

bloque('R · policies de eventos_mascota (el molde más estricto)', `
  SELECT policyname, cmd, roles::text, qual, with_check FROM pg_policies
  WHERE schemaname='public' AND tablename='eventos_mascota' ORDER BY cmd
`);

bloque('S · ¿existe rol seller en algún lado? cuenta_roles histórico', `
  SELECT * FROM cuenta_roles ORDER BY created_at
`);

bloque('T · roles de DB existentes (para grants)', `
  SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role','postgres') ORDER BY 1
`);

let fallos = 0;
for (const b of bloques) {
  console.log('\n' + '='.repeat(78));
  console.log(b.titulo);
  console.log('='.repeat(78));
  try {
    const rows = dbQuery(b.sql);
    if (!rows.length) console.log('(sin filas)');
    else console.log(JSON.stringify(rows, null, 1));
  } catch (e) { fallos++; console.log('❌ ERROR: ' + e.message); }
}
console.log('\n\nBloques con error: ' + fallos + ' de ' + bloques.length);
