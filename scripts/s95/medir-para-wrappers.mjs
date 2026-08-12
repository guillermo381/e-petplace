// S95-E · Bloque 0 — MEDIR ANTES DE ESCRIBIR WRAPPERS. Solo lectura.
// Regla 22: los nombres se miden, no se adivinan (me mordió tres veces en S95-C).
//
// Contesta las preguntas que DECIDEN el diseño de esta capa:
//   ① ¿Existe función de recomendación en la base? Bloque 2 exige que la
//      exclusión por alergia NO viva en memoria del wrapper.
//   ② ¿Dónde vive HOY la alergia/condición de la mascota?
//   ③ ¿Qué columnas expone `v_pedidos_narrativa` y qué estados hay?
import { dbQuery } from '../lib-db.mjs';

const p = (r) => console.log(JSON.stringify(r, null, 1));

console.log('═══ ① FUNCIONES DE LA DESPENSA VIVAS EN LA BASE ═══');
p(dbQuery(`SELECT p.proname, pg_get_function_identity_arguments(p.oid) args
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname ~ 'despensa|pedido|oferta|producto|inventario|senal|envio|promesa|recomend'
  ORDER BY 1`));

console.log('\n═══ ② DÓNDE VIVE ALERGIA / CONDICIÓN / DIETA ═══');
p(dbQuery(`SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema='public' AND column_name ~ 'alergi|condicion|restriccion|dieta'
  ORDER BY 1,2`));

console.log('\n═══ ③ COLUMNAS DE v_pedidos_narrativa ═══');
p(dbQuery(`SELECT column_name, data_type FROM information_schema.columns
  WHERE table_schema='public' AND table_name='v_pedidos_narrativa'
  ORDER BY ordinal_position`));

console.log('\n═══ ④ ESTADOS: interno → narrativa ═══');
p(dbQuery(`SELECT codigo, narrativa, activo, orden FROM cat_estados_pedido ORDER BY orden`));

console.log('\n═══ ⑤ NARRATIVAS del catálogo ═══');
// Regla 22 en vivo: `cat_narrativas_pedido` NO tiene `orden` (lo tiene
// `cat_estados_pedido`). Se piden las columnas reales, no las supuestas.
p(dbQuery(`SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) cols
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='cat_narrativas_pedido'`));
p(dbQuery(`SELECT * FROM cat_narrativas_pedido`));

console.log('\n═══ ⑥ COLUMNAS de mascota_perfil_vigente y mascotas ═══');
for (const t of ['mascota_perfil_vigente', 'mascotas']) {
  const r = dbQuery(`SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) c
    FROM information_schema.columns WHERE table_schema='public' AND table_name='${t}'`);
  console.log(`\n${t}:\n  ${r[0]?.c ?? '❌ NO EXISTE'}`);
}

console.log('\n\n═══ ⑦ CUÁNTAS FILAS VIVAS HAY EN CADA TABLA DE LA DESPENSA ═══');
p(dbQuery(`SELECT 'productos' t, count(*) n FROM productos
  UNION ALL SELECT 'producto_variantes', count(*) FROM producto_variantes
  UNION ALL SELECT 'vendedor_skus', count(*) FROM vendedor_skus
  UNION ALL SELECT 'ofertas', count(*) FROM ofertas
  UNION ALL SELECT 'reglas_envio', count(*) FROM reglas_envio
  UNION ALL SELECT 'vendedor_bodegas', count(*) FROM vendedor_bodegas
  UNION ALL SELECT 'pedidos', count(*) FROM pedidos
  UNION ALL SELECT 'cuentas_comerciales_activas', count(*) FROM cuentas_comerciales WHERE estado='activa'
  UNION ALL SELECT 'cuenta_roles_seller', count(*) FROM cuenta_roles WHERE tipo_actor='seller_productos'
  ORDER BY 1`));

console.log('\n═══ ⑧ RLS: policies de SELECT sobre catálogo y ofertas ═══');
p(dbQuery(`SELECT tablename, policyname, cmd, roles::text, qual
  FROM pg_policies WHERE schemaname='public'
    AND tablename IN ('productos','producto_variantes','ofertas','vendedor_skus',
                      'cat_familias_producto','pedidos','pedido_items','envios')
    AND cmd='SELECT' ORDER BY tablename, policyname`));
