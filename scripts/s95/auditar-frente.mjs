// S95-C · Auditoría final del frente antes del barrido (M8). SOLO LECTURA.
import { dbQuery } from '../lib-db.mjs';

const FRENTE = [
  'productos','producto_variantes','vendedor_skus','ofertas',
  'cat_familias_producto','cat_tasas_impuesto','inventario_movimientos',
  'inventario_reservas','vendedor_bodegas','pedidos','pedido_items',
  'pedido_estados','cat_estados_pedido','pedido_descuentos','pagos_intentos',
  'pagos_eventos','facturas','envios','envio_eventos','zonas_cobertura',
  'cat_transportistas','devoluciones','evento_producto_asignacion',
  'seller_perfil','resenas_productos',
];
const l = FRENTE.map((t) => `'${t}'`).join(',');

console.log('═══ ① RLS + FORCE por tabla ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT c.relname, c.relrowsecurity rls, c.relforcerowsecurity force
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname IN (${l}) AND NOT c.relrowsecurity`), null, 1));

console.log('\n═══ ② PRIVILEGIO EFECTIVO DE anon sobre el frente ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT x tabla,
         has_table_privilege('anon','public.'||x,'SELECT') sel,
         has_table_privilege('anon','public.'||x,'INSERT') ins,
         has_table_privilege('anon','public.'||x,'UPDATE') upd,
         has_table_privilege('anon','public.'||x,'DELETE') del
  FROM unnest(ARRAY[${l}]) x
  WHERE has_table_privilege('anon','public.'||x,'SELECT')
     OR has_table_privilege('anon','public.'||x,'INSERT')
     OR has_table_privilege('anon','public.'||x,'UPDATE')
     OR has_table_privilege('anon','public.'||x,'DELETE')`), null, 1));

console.log('\n═══ ③ Tablas del frente SIN NINGUNA policy ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT x tabla FROM unnest(ARRAY[${l}]) x
  WHERE NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=x)`), null, 1));

console.log('\n═══ ④ Policies del frente, por tabla y comando ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT tablename, cmd, count(*) n FROM pg_policies
  WHERE schemaname='public' AND tablename IN (${l})
  GROUP BY 1,2 ORDER BY 1,2`), null, 1));

console.log('\n═══ ⑤ Funciones nuevas de S95 y su privilegio efectivo (L-140) ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT p.proname, pg_get_function_identity_arguments(p.oid) args, p.prosecdef definer,
         has_function_privilege('anon', p.oid, 'EXECUTE') anon,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') auth
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN
    ('es_vendedor_de','resolver_comision_despensa','expirar_reservas_vencidas',
     '_trg_inventario_aplicar_movimiento','_trg_pedido_estado_actual',
     '_trg_producto_asignacion_frontera')
  ORDER BY 1`), null, 1));

console.log('\n═══ ⑥ search_path de las funciones nuevas ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT p.proname, p.proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN
    ('es_vendedor_de','resolver_comision_despensa','expirar_reservas_vencidas',
     '_trg_inventario_aplicar_movimiento','_trg_pedido_estado_actual',
     '_trg_producto_asignacion_frontera')
  ORDER BY 1`), null, 1));

console.log('\n═══ ⑦ Las dos bloqueadas: qué privilegios conservan ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT table_name, grantee, string_agg(DISTINCT privilege_type,',' ORDER BY privilege_type) p
  FROM information_schema.role_table_grants
  WHERE table_schema='public' AND table_name IN ('seller_perfil','resenas_productos')
  GROUP BY 1,2 ORDER BY 1,2`), null, 1));

console.log('\n═══ ⑧ ¿Las vistas bloqueantes son security_invoker? ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT c.relname, c.reloptions FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname IN ('v_pitch_metrics','v_resenas_todas',
    'v_gmv_mensual','v_metricas_tiempo_real','v_dashboard_logistico')`), null, 1));
