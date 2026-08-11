// S95-C · Verificación posterior de la migración 1. SOLO LECTURA.
import { dbQuery } from '../lib-db.mjs';

console.log('═══ ① LAS DOCE QUE APUNTAN A pedidos — conteo POSTERIOR ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT 'pedidos' t, count(*) n FROM pedidos
  UNION ALL SELECT 'pedido_items', count(*) FROM pedido_items
  UNION ALL SELECT 'envios', count(*) FROM envios
  UNION ALL SELECT 'envio_eventos', count(*) FROM envio_eventos
  UNION ALL SELECT 'devoluciones', count(*) FROM devoluciones
  UNION ALL SELECT 'facturas', count(*) FROM facturas
  UNION ALL SELECT 'cupon_usos', count(*) FROM cupon_usos
  UNION ALL SELECT 'evento_inscripciones', count(*) FROM evento_inscripciones
  UNION ALL SELECT 'tickets_soporte', count(*) FROM tickets_soporte
  ORDER BY 1`), null, 1));

console.log('\n═══ ② LAS 14 APAGADAS + LAS 2 BLOQUEADAS ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT x tabla, (to_regclass('public.'||x) IS NOT NULL) existe FROM unnest(ARRAY[
    'seller_inventario','seller_comisiones','seller_documentos','seller_liquidaciones',
    'liquidacion_pedidos','seller_reglas_asignacion','mensajes_admin_seller',
    'pedidos_recurrentes','wishlist','lista_espera','planes_nutricion',
    'checkout_sesiones','vtex_sync_log','servicios_exequiales',
    'seller_perfil','resenas_productos','cupones','cupon_usos']) x ORDER BY 2 DESC, 1`), null, 1));

console.log('\n═══ ③ COLUMNAS vtex_* RESTANTES ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT table_name, column_name FROM information_schema.columns
  WHERE table_schema='public' AND column_name LIKE 'vtex%'`), null, 1));

console.log('\n═══ ④ D-757 · privilegio EFECTIVO sobre pedidos (resuelve PUBLIC) ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT r rol,
         has_table_privilege(r,'public.pedidos','SELECT') sel,
         has_table_privilege(r,'public.pedidos','INSERT') ins,
         has_table_privilege(r,'public.pedidos','UPDATE') upd,
         has_table_privilege(r,'public.pedidos','DELETE') del
  FROM unnest(ARRAY['anon','authenticated','service_role']) r`), null, 1));

console.log('\n═══ ⑤ POLICIES vivas sobre pedidos ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT policyname, cmd, roles::text, qual, with_check FROM pg_policies
  WHERE schemaname='public' AND tablename='pedidos' ORDER BY cmd, policyname`), null, 1));

console.log('\n═══ ⑥ LAS VISTAS QUE SOBREVIVEN Y LAS QUE SE FUERON ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT x vista, (to_regclass('public.'||x) IS NOT NULL) existe FROM unnest(ARRAY[
    'v_pedido_liquidacion','v_recurrentes_pendientes','v_resenas_todas','v_pitch_metrics',
    'v_gmv_mensual','v_metricas_tiempo_real','v_dashboard_logistico']) x ORDER BY 1`), null, 1));

console.log('\n═══ ⑦ LAS CUATRO PANTALLAS DE MÉTRICAS, AHORA ═══');
for (const v of ['v_gmv_mensual', 'v_metricas_tiempo_real']) {
  try {
    console.log(v + ': ' + JSON.stringify(dbQuery(`SELECT * FROM ${v} LIMIT 2`)));
  } catch (e) { console.log(v + ': ❌ ' + e.message.slice(0, 150)); }
}

console.log('\n═══ ⑧ LA CAMPAÑA Y EL CUPÓN SIGUEN VIVOS (no eran de la despensa) ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT ca.nombre campana, ca.estado, cu.codigo cupon, cu.activo
  FROM campanas ca LEFT JOIN cupones cu ON cu.id=ca.cupon_id`), null, 1));
