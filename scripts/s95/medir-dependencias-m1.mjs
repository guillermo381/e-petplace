// S95-C · Precondición de la migración 1: QUÉ DEPENDE de cada objeto a apagar.
// Condición 4 del gate: antes de cada DROP, verificar qué vistas dependen.
// Si una vista sirve a un frente que NO es la despensa → FRENAR Y ELEVAR.
// SOLO LECTURA.
import { dbQuery } from '../lib-db.mjs';

const A_APAGAR = [
  'seller_perfil', 'seller_inventario', 'seller_comisiones', 'seller_documentos',
  'seller_liquidaciones', 'liquidacion_pedidos', 'seller_reglas_asignacion',
  'mensajes_admin_seller', 'pedidos_recurrentes', 'resenas_productos',
  'wishlist', 'lista_espera', 'planes_nutricion', 'checkout_sesiones',
  'vtex_sync_log', 'servicios_exequiales',
];
const lista = A_APAGAR.map((t) => `'${t}'`).join(',');

console.log('═══ ① DEPENDENCIAS REALES (pg_depend) — vistas, reglas y funciones ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT DISTINCT dependiente.relname dependiente,
         dependiente.relkind::text tipo,
         origen.relname objeto_del_que_depende
  FROM pg_depend d
  JOIN pg_rewrite r ON r.oid = d.objid
  JOIN pg_class dependiente ON dependiente.oid = r.ev_class
  JOIN pg_class origen ON origen.oid = d.refobjid
  JOIN pg_namespace n ON n.oid = origen.relnamespace
  WHERE n.nspname='public' AND origen.relname IN (${lista})
    AND dependiente.relname <> origen.relname
  ORDER BY 3,1`), null, 1));

console.log('\n═══ ② TODAS LAS VISTAS DEL SCHEMA Y QUÉ TOCAN ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT c.relname vista,
         (pg_get_viewdef(c.oid) ~ '\\mprestador') toca_prestador,
         (pg_get_viewdef(c.oid) ~ '\\mmascota') toca_mascota,
         (pg_get_viewdef(c.oid) ~ '\\m(cita|evento_cita_servicio)') toca_citas,
         (pg_get_viewdef(c.oid) ~ ('\\m(' || '${A_APAGAR.join('|')}' || ')\\M')) toca_apagadas
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('v','m')
  ORDER BY 1`), null, 1));

console.log('\n═══ ③ COLUMNAS vtex_* — sus constraints e índices ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT c.relname tabla, con.conname, con.contype::text, pg_get_constraintdef(con.oid) def
  FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND pg_get_constraintdef(con.oid) ~* 'vtex'`), null, 1));
console.log(JSON.stringify(dbQuery(`
  SELECT tablename, indexname, indexdef FROM pg_indexes
  WHERE schemaname='public' AND indexdef ~* 'vtex'`), null, 1));

console.log('\n═══ ④ CONTEO PREVIO DE LAS DOCE QUE APUNTAN A pedidos ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT 'pedidos' t, count(*) n FROM pedidos
  UNION ALL SELECT 'checkout_sesiones', count(*) FROM checkout_sesiones
  UNION ALL SELECT 'cupon_usos', count(*) FROM cupon_usos
  UNION ALL SELECT 'devoluciones', count(*) FROM devoluciones
  UNION ALL SELECT 'envios', count(*) FROM envios
  UNION ALL SELECT 'evento_inscripciones', count(*) FROM evento_inscripciones
  UNION ALL SELECT 'facturas', count(*) FROM facturas
  UNION ALL SELECT 'liquidacion_pedidos', count(*) FROM liquidacion_pedidos
  UNION ALL SELECT 'pedido_items', count(*) FROM pedido_items
  UNION ALL SELECT 'pedidos_recurrentes', count(*) FROM pedidos_recurrentes
  UNION ALL SELECT 'resenas_productos', count(*) FROM resenas_productos
  UNION ALL SELECT 'servicios_exequiales', count(*) FROM servicios_exequiales
  UNION ALL SELECT 'tickets_soporte', count(*) FROM tickets_soporte
  UNION ALL SELECT 'envio_eventos', count(*) FROM envio_eventos
  ORDER BY 1`), null, 1));

console.log('\n═══ ⑤ COLUMNAS de pedidos que apuntan a tablas que se apagan ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT src.relname tabla, a.attname columna, tgt.relname destino, con.conname
  FROM pg_constraint con
  JOIN pg_class src ON src.oid=con.conrelid
  JOIN pg_class tgt ON tgt.oid=con.confrelid
  JOIN unnest(con.conkey) WITH ORDINALITY k(attnum, ord) ON true
  JOIN pg_attribute a ON a.attrelid=src.oid AND a.attnum=k.attnum
  WHERE con.contype='f' AND tgt.relname IN (${lista}) ORDER BY 1,2`), null, 1));

console.log('\n═══ ⑥ POLICIES Y TRIGGERS de las tablas a apagar (mueren con ellas) ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT tablename, count(*) policies FROM pg_policies
  WHERE schemaname='public' AND tablename IN (${lista}) GROUP BY 1 ORDER BY 1`), null, 1));
