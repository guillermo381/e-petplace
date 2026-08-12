// S95-D · Medición previa al motor. SOLO LECTURA. Regla 22: los nombres se
// miden, no se adivinan.
import { dbQuery } from '../lib-db.mjs';

const TABLAS = [
  'pedidos','pedido_items','pedido_estados','cat_estados_pedido','pedido_descuentos',
  'producto_variantes','vendedor_skus','ofertas','productos','cat_familias_producto',
  'inventario_movimientos','inventario_reservas','vendedor_bodegas',
  'envios','envio_eventos','zonas_cobertura','cat_transportistas',
  'pagos_intentos','pagos_eventos','facturas','devoluciones',
  'evento_producto_asignacion','eventos_mascota','cat_tipos_evento',
  'mascotas','mascota_perfil_vigente','familia','familia_miembro',
  'cuentas_comerciales','cuenta_roles','country_config','cat_especies',
];

console.log('═══ ① COLUMNAS DE TODO LO QUE EL MOTOR TOCA ═══');
for (const t of TABLAS) {
  const r = dbQuery(`SELECT string_agg(column_name || ':' ||
      CASE WHEN data_type='USER-DEFINED' THEN udt_name ELSE data_type END ||
      CASE WHEN is_nullable='NO' THEN '!' ELSE '' END, ', ' ORDER BY ordinal_position) c
    FROM information_schema.columns WHERE table_schema='public' AND table_name='${t}'`);
  console.log(`\n${t}:\n  ${r[0]?.c ?? '❌ NO EXISTE'}`);
}

console.log('\n\n═══ ② VALORES VIVOS DE LOS CATÁLOGOS QUE EL MOTOR LEE ═══');
for (const [t, cols] of [
  ['cat_estados_pedido','codigo, nombre, es_terminal, orden, activo'],
  ['cat_familias_producto','codigo, nombre, entra_al_expediente, activo'],
  ['cat_transportistas','codigo, nombre, es_propio, activo'],
  ['cat_tasas_impuesto','codigo, country_code, pct, activo'],
]) {
  console.log(`\n${t}:`);
  console.log(JSON.stringify(dbQuery(`SELECT ${cols} FROM ${t} ORDER BY 1`)));
}

console.log('\n\n═══ ③ ENUMS relevantes ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT t.typname, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) vals
  FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
  JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public'
    AND t.typname IN ('tipo_actor_enum','tipo_evento_economico_enum','revenue_stream_enum',
                      'estado_evento_economico_enum','tipo_calculo_fee_enum')
  GROUP BY 1 ORDER BY 1`), null, 1));

console.log('\n═══ ④ CHECKs vivos del frente ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT c.relname t, con.conname, pg_get_constraintdef(con.oid) def
  FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND con.contype='c'
    AND c.relname IN ('pedidos','pedido_items','pedido_estados','envios',
                      'producto_variantes','vendedor_skus','inventario_movimientos',
                      'evento_producto_asignacion','eventos_mascota')
  ORDER BY 1,2`), null, 1));

console.log('\n═══ ⑤ mascota_perfil_vigente + calcular_momento_vital (la recomendación) ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT p.proname, pg_get_function_identity_arguments(p.oid) args,
         pg_get_function_result(p.oid) ret, p.prosecdef definer
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname ~ '(momento_vital|etapa_vida)'`), null, 1));

console.log('\n═══ ⑥ Helpers de autorización disponibles ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT p.proname, pg_get_function_identity_arguments(p.oid) args, p.provolatile
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN
    ('is_admin','es_vendedor_de','user_tiene_acceso_a_mascota','uid_actual',
     'user_gestiona_prestador','resolver_comision_despensa')
  ORDER BY 1`), null, 1));

console.log('\n═══ ⑦ ¿Existe algo de "señal"/"log"/"analitica" que reusar? (regla 21) ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r'
    AND (c.relname ~ '(senal|señal|_log|evento_analitic|metrica|tracking|visitante|sesion)')
  ORDER BY 1`), null, 1));

console.log('\n═══ ⑧ Filas vivas del frente (para los cinturones) ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT 'pedidos' t, count(*) n FROM pedidos
  UNION ALL SELECT 'productos', count(*) FROM productos
  UNION ALL SELECT 'producto_variantes', count(*) FROM producto_variantes
  UNION ALL SELECT 'vendedor_skus', count(*) FROM vendedor_skus
  UNION ALL SELECT 'zonas_cobertura', count(*) FROM zonas_cobertura
  UNION ALL SELECT 'cat_estados_pedido', count(*) FROM cat_estados_pedido
  UNION ALL SELECT 'eventos_mascota', count(*) FROM eventos_mascota
  UNION ALL SELECT 'cuentas_comerciales', count(*) FROM cuentas_comerciales
  ORDER BY 1`), null, 1));
