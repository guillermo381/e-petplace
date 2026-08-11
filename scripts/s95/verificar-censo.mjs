// S95-C · BLOQUE 0 — verificación del censo de comercio contra la base viva.
// SOLO LECTURA. Un censo es una foto: si el terreno se movió, se sabe ahora.
// Uso: node scripts/s95/verificar-censo.mjs
import { dbQuery } from '../lib-db.mjs';

const bloques = [];
function bloque(titulo, sql) {
  bloques.push({ titulo, sql });
}

// ① Inventario de tablas de comercio con filas reales
bloque('① TABLAS DEL SUBSISTEMA — existencia y filas', `
  SELECT c.relname AS tabla,
         c.reltuples::bigint AS filas_estimadas,
         c.relrowsecurity AS rls,
         c.relforcerowsecurity AS force_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND c.relname IN (
      'pedidos','pedido_items','productos','seller_perfil','seller_inventario',
      'seller_comisiones','seller_liquidaciones','liquidacion_pedidos','seller_documentos',
      'seller_reglas_asignacion','mensajes_admin_seller','pedidos_recurrentes',
      'resenas_productos','productos_comerciales','envios','envio_eventos','zonas_cobertura',
      'facturas','devoluciones','cupones','cupon_usos','checkout_sesiones','tickets_soporte',
      'wishlist','lista_espera','planes_nutricion','direcciones_guardadas',
      'cuentas_comerciales','cuenta_roles','eventos_economicos','fee_configs','fee_configs_historial',
      'liquidaciones','liquidacion_eventos','eventos_mascota','cat_tipos_evento','country_config',
      'transacciones_puntos','puntos_usuario','logros','logros_usuario','loyalty_b2b'
    )
  ORDER BY c.relname
`);

// ② Conteos exactos de las que importan
bloque('② CONTEOS EXACTOS', `
  SELECT 'pedidos' t, count(*) n FROM pedidos
  UNION ALL SELECT 'pedido_items', count(*) FROM pedido_items
  UNION ALL SELECT 'productos', count(*) FROM productos
  UNION ALL SELECT 'seller_perfil', count(*) FROM seller_perfil
  UNION ALL SELECT 'seller_inventario', count(*) FROM seller_inventario
  UNION ALL SELECT 'seller_comisiones', count(*) FROM seller_comisiones
  UNION ALL SELECT 'seller_liquidaciones', count(*) FROM seller_liquidaciones
  UNION ALL SELECT 'envios', count(*) FROM envios
  UNION ALL SELECT 'envio_eventos', count(*) FROM envio_eventos
  UNION ALL SELECT 'zonas_cobertura', count(*) FROM zonas_cobertura
  UNION ALL SELECT 'devoluciones', count(*) FROM devoluciones
  UNION ALL SELECT 'facturas', count(*) FROM facturas
  UNION ALL SELECT 'checkout_sesiones', count(*) FROM checkout_sesiones
  UNION ALL SELECT 'cupones', count(*) FROM cupones
  UNION ALL SELECT 'cupon_usos', count(*) FROM cupon_usos
  UNION ALL SELECT 'direcciones_guardadas', count(*) FROM direcciones_guardadas
  UNION ALL SELECT 'cuentas_comerciales', count(*) FROM cuentas_comerciales
  UNION ALL SELECT 'cuenta_roles', count(*) FROM cuenta_roles
  UNION ALL SELECT 'eventos_economicos', count(*) FROM eventos_economicos
  UNION ALL SELECT 'fee_configs', count(*) FROM fee_configs
  ORDER BY 1
`);

// ③ Los 137 pedidos — estado, plata, referencias
bloque('③ PEDIDOS — desglose por estado', `
  SELECT estado, count(*) n, sum(total) suma_total,
         count(*) FILTER (WHERE pagado_en IS NOT NULL) con_pagado_en,
         count(*) FILTER (WHERE kushki_charge_id IS NOT NULL) con_kushki,
         count(*) FILTER (WHERE user_id IS NULL) sin_user,
         count(*) FILTER (WHERE vtex_order_id IS NOT NULL) con_vtex
  FROM pedidos GROUP BY estado ORDER BY 2 DESC
`);

bloque('③b PEDIDOS — rango temporal', `
  SELECT min(created_at) primero, max(created_at) ultimo,
         count(*) FILTER (WHERE items IS NOT NULL AND jsonb_array_length(items) > 0) con_items_jsonb
  FROM pedidos
`);

// ④ FKs entrantes a pedidos (regla 41)
bloque('④ FKs ENTRANTES A pedidos (regla 41)', `
  SELECT con.conname, src.relname AS tabla_origen, con.confdeltype AS on_delete
  FROM pg_constraint con
  JOIN pg_class src ON src.oid = con.conrelid
  JOIN pg_class tgt ON tgt.oid = con.confrelid
  WHERE con.contype = 'f' AND tgt.relname = 'pedidos'
  ORDER BY 2
`);

bloque('④b FKs ENTRANTES A productos / seller_perfil', `
  SELECT tgt.relname AS tabla_destino, src.relname AS tabla_origen, con.conname, con.confdeltype AS on_delete
  FROM pg_constraint con
  JOIN pg_class src ON src.oid = con.conrelid
  JOIN pg_class tgt ON tgt.oid = con.confrelid
  WHERE con.contype = 'f' AND tgt.relname IN ('productos','seller_perfil','seller_inventario')
  ORDER BY 1,2
`);

// ⑤ La puerta abierta: policies de pedidos
bloque('⑤ POLICIES sobre pedidos / productos / pedido_items', `
  SELECT tablename, policyname, cmd, roles::text, qual, with_check
  FROM pg_policies
  WHERE schemaname='public' AND tablename IN ('pedidos','pedido_items','productos','seller_inventario')
  ORDER BY tablename, cmd, policyname
`);

// ⑤b grants de anon sobre las tablas de comercio
bloque('⑤b GRANTS de anon sobre tablas de comercio', `
  SELECT table_name, string_agg(DISTINCT privilege_type, ',' ORDER BY privilege_type) privilegios
  FROM information_schema.role_table_grants
  WHERE grantee='anon' AND table_schema='public'
    AND table_name IN ('pedidos','pedido_items','productos','seller_perfil','seller_inventario',
                       'seller_comisiones','envios','devoluciones','facturas','checkout_sesiones')
  GROUP BY table_name ORDER BY 1
`);

// ⑥ fee_configs — la puerta financiera
bloque('⑥ fee_configs COMPLETO', `
  SELECT * FROM fee_configs ORDER BY tipo_actor, country_code
`);

bloque('⑥b COLUMNAS de fee_configs', `
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='fee_configs' ORDER BY ordinal_position
`);

// ⑦ seller_comisiones — el 20% vivo
bloque('⑦ seller_comisiones (D-748)', `
  SELECT * FROM seller_comisiones
`);

// ⑧ producto_asignacion y procedencia
bloque('⑧ cat_tipos_evento · producto_asignacion', `
  SELECT * FROM cat_tipos_evento WHERE codigo IN ('producto_asignacion','cita_servicio','vacuna_aplicada')
`);

bloque('⑧b eventos_mascota · procedencia y conteo por tipo', `
  SELECT procedencia, count(*) n FROM eventos_mascota GROUP BY 1 ORDER BY 2 DESC
`);

bloque('⑧c COLUMNAS de eventos_mascota', `
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='eventos_mascota' ORDER BY ordinal_position
`);

// ⑨ Loyalty — la desconexión medida
bloque('⑨ LOYALTY · triggers sobre pedidos y pedido_items', `
  SELECT c.relname AS tabla, t.tgname, p.proname AS funcion, t.tgenabled
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_proc p ON p.oid = t.tgfoid
  WHERE NOT t.tgisinternal AND c.relname IN ('pedidos','pedido_items','productos','seller_inventario','envios')
  ORDER BY 1,2
`);

bloque('⑨b LOYALTY · funciones que tocan transacciones_puntos u otorgar_puntos', `
  SELECT p.proname, p.prosecdef AS definer,
         (pg_get_functiondef(p.oid) ILIKE '%transacciones_puntos%') AS toca_ledger,
         (pg_get_functiondef(p.oid) ILIKE '%otorgar_puntos%') AS llama_otorgar
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND (pg_get_functiondef(p.oid) ILIKE '%transacciones_puntos%'
         OR pg_get_functiondef(p.oid) ILIKE '%otorgar_puntos%')
  ORDER BY 1
`);

bloque('⑨c LOYALTY · grants de otorgar_puntos (D-314)', `
  SELECT p.proname, pg_get_function_identity_arguments(p.oid) args,
         has_function_privilege('anon', p.oid, 'EXECUTE') anon_puede,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') auth_puede
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='otorgar_puntos'
`);

// ⑩ Idempotencia — el patrón que no existe
bloque('⑩ IDEMPOTENCIA · columnas candidatas en toda la base', `
  SELECT table_name, column_name FROM information_schema.columns
  WHERE table_schema='public'
    AND (column_name ILIKE '%idempot%' OR column_name ILIKE '%request_id%'
         OR column_name ILIKE '%external_id%' OR column_name ILIKE '%dedupe%'
         OR column_name ILIKE '%_key_unica%')
  ORDER BY 1,2
`);

// ⑪ Columnas vtex_*
bloque('⑪ COLUMNAS vtex_* — existencia y valores', `
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema='public' AND column_name ILIKE 'vtex%'
  ORDER BY 1,2
`);

// ⑫ Estructura de las tablas que se van a enmendar
bloque('⑫ COLUMNAS de pedidos', `
  SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable, column_default
  FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos'
  ORDER BY ordinal_position
`);

bloque('⑫b COLUMNAS de pedido_items', `
  SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable, column_default
  FROM information_schema.columns WHERE table_schema='public' AND table_name='pedido_items'
  ORDER BY ordinal_position
`);

bloque('⑫c COLUMNAS de productos', `
  SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable, column_default
  FROM information_schema.columns WHERE table_schema='public' AND table_name='productos'
  ORDER BY ordinal_position
`);

bloque('⑫d COLUMNAS de seller_inventario', `
  SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable, column_default
  FROM information_schema.columns WHERE table_schema='public' AND table_name='seller_inventario'
  ORDER BY ordinal_position
`);

bloque('⑫e COLUMNAS de envios', `
  SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable, column_default
  FROM information_schema.columns WHERE table_schema='public' AND table_name='envios'
  ORDER BY ordinal_position
`);

bloque('⑫f COLUMNAS de envio_eventos y zonas_cobertura', `
  SELECT table_name, column_name, data_type, is_nullable
  FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('envio_eventos','zonas_cobertura')
  ORDER BY table_name, ordinal_position
`);

bloque('⑫g COLUMNAS de seller_perfil', `
  SELECT column_name, data_type, is_nullable FROM information_schema.columns
  WHERE table_schema='public' AND table_name='seller_perfil' ORDER BY ordinal_position
`);

bloque('⑫h COLUMNAS de facturas y devoluciones', `
  SELECT table_name, column_name, data_type, numeric_precision, numeric_scale, is_nullable
  FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('facturas','devoluciones')
  ORDER BY table_name, ordinal_position
`);

// ⑬ country_config e IVA
bloque('⑬ country_config · IVA', `
  SELECT * FROM country_config
`);

// ⑭ cuenta_roles y el enum
bloque('⑭ cuenta_roles vivos + enum tipo_actor', `
  SELECT tipo_actor::text, estado::text, count(*) FROM cuenta_roles GROUP BY 1,2 ORDER BY 1
`);

bloque('⑭b ENUM tipo_actor', `
  SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
  WHERE t.typname LIKE '%tipo_actor%' ORDER BY e.enumsortorder
`);

// ⑮ CHECKs de pedidos (estados vivos)
bloque('⑮ CHECK constraints de pedidos / envios / devoluciones', `
  SELECT c.relname tabla, con.conname, pg_get_constraintdef(con.oid) definicion
  FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND con.contype='c'
    AND c.relname IN ('pedidos','pedido_items','envios','devoluciones','productos','seller_inventario')
  ORDER BY 1,2
`);

// ⑯ eventos_economicos — la puerta del dinero
bloque('⑯ crear_evento_economico — firma', `
  SELECT p.proname, pg_get_function_identity_arguments(p.oid) args, p.prosecdef definer
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN ('crear_evento_economico','generar_liquidacion','aplicar_reembolso')
  ORDER BY 1
`);

bloque('⑯b origen_tipo vivos en eventos_economicos + su validación', `
  SELECT origen_tipo, count(*) FROM eventos_economicos GROUP BY 1 ORDER BY 2 DESC
`);

// ⑰ Catálogos existentes (regla 21)
bloque('⑰ CATÁLOGOS cat_* existentes', `
  SELECT c.relname, c.reltuples::bigint filas
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'cat\\_%'
  ORDER BY 1
`);

// ⑱ recomendaciones_log (P11)
bloque('⑱ ¿existe recomendaciones_log? (P11)', `
  SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname ILIKE '%recomendacion%'
`);

// ⑲ helpers de policy que el esqueleto debe reusar
bloque('⑲ HELPERS de policy disponibles', `
  SELECT p.proname, pg_get_function_identity_arguments(p.oid) args, p.prosecdef definer, p.provolatile
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN
    ('is_admin','user_gestiona_prestador','user_tiene_acceso_a_mascota','es_mi_prestador',
     'prestador_activo','user_puede_acceder_prestador','user_puede_escribir_clinico')
  ORDER BY 1
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
  } catch (e) {
    fallos++;
    console.log('❌ ERROR: ' + e.message);
  }
}
console.log('\n\nBloques con error: ' + fallos + ' de ' + bloques.length);
