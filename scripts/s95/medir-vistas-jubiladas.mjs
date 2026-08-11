// S95-C · Qué tabla de la lista de jubilación lee cada vista, y con qué filas.
// SOLO LECTURA.
import { dbQuery } from '../lib-db.mjs';

const TABLAS = [
  'seller_perfil', 'seller_inventario', 'seller_comisiones', 'seller_documentos',
  'seller_liquidaciones', 'liquidacion_pedidos', 'seller_reglas_asignacion',
  'mensajes_admin_seller', 'pedidos_recurrentes', 'resenas_productos',
  'wishlist', 'lista_espera', 'planes_nutricion', 'cupones', 'cupon_usos',
  'checkout_sesiones', 'vtex_sync_log', 'servicios_exequiales',
];

console.log('═══ QUÉ TABLA LEE CADA VISTA ═══');
const filas = dbQuery(`
  SELECT c.relname vista, t.tabla
  FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN LATERAL unnest(ARRAY[${TABLAS.map((t) => `'${t}'`).join(',')}]) AS t(tabla)
  WHERE n.nspname='public' AND c.relkind='v'
    AND pg_get_viewdef(c.oid) ~ ('\\m' || t.tabla || '\\M')
  ORDER BY 1,2`);
console.log(JSON.stringify(filas, null, 1));

console.log('\n═══ TODAS LAS VISTAS QUE LEEN pedidos O pedido_items ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT c.relname vista,
         (pg_get_viewdef(c.oid) ~ '\\mpedidos\\M') lee_pedidos,
         (pg_get_viewdef(c.oid) ~ '\\mpedido_items\\M') lee_items
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='v'
    AND pg_get_viewdef(c.oid) ~ '\\m(pedidos|pedido_items)\\M'
  ORDER BY 1`), null, 1));

console.log('\n═══ CAMPAÑAS Y CUPONES — el motor de promos de MODELO_LOYALTY §9 ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT ca.id campana_id, ca.nombre campana, ca.activa, ca.cupon_id,
         cu.codigo cupon, cu.activo cupon_activo, cu.tipo, cu.valor
  FROM campanas ca LEFT JOIN cupones cu ON cu.id = ca.cupon_id`), null, 1));

console.log('\n═══ FILAS VIVAS de las 4 tablas con contenido ═══');
console.log(JSON.stringify(dbQuery(`SELECT id, nombre, activa FROM campanas`), null, 1));
console.log(JSON.stringify(dbQuery(`SELECT id, codigo, tipo, valor, activo, usos_actuales FROM cupones`), null, 1));
console.log(JSON.stringify(dbQuery(`SELECT * FROM seller_reglas_asignacion`), null, 1));
console.log(JSON.stringify(dbQuery(`SELECT id, seller_id, asunto, leido, created_at FROM mensajes_admin_seller`), null, 1));
console.log(JSON.stringify(dbQuery(`SELECT id, numero_liquidacion, estado, periodo_inicio, periodo_fin, monto_neto FROM seller_liquidaciones`), null, 1));
