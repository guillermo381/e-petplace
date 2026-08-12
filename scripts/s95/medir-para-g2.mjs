// S95-G2 · Medición previa. SOLO LECTURA. Regla 22.
import { dbQuery } from '../lib-db.mjs';
const p = (r) => console.log(JSON.stringify(r, null, 1));

console.log('═══ ① ¿QUIÉN EXIGE QUE LA CUENTA ESTÉ `activa`? (G2.2) ═══');
p(dbQuery(`
  SELECT p.proname, pg_get_function_identity_arguments(p.oid) args
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prokind='f'
    AND pg_get_functiondef(p.oid) ~ 'cuentas_comerciales'
    AND pg_get_functiondef(p.oid) ~ 'activa'
  ORDER BY 1`));

console.log('\n═══ ② EL CUERPO DE LOS DOS HELPERS DE VENDEDOR ═══');
for (const f of ['_cuenta_es_vendedora', 'es_vendedor_de']) {
  const r = dbQuery(`SELECT pg_get_functiondef(oid) d FROM pg_proc WHERE proname='${f}'`);
  console.log(`\n── ${f} ──\n${r[0]?.d ?? 'NO EXISTE'}`);
}

console.log('\n═══ ③ POLICIES que exigen cuenta activa ═══');
p(dbQuery(`
  SELECT tablename, policyname, cmd FROM pg_policies
  WHERE schemaname='public' AND (qual ~ 'activa' OR with_check ~ 'activa')
    AND (qual ~ 'cuenta' OR with_check ~ 'cuenta') ORDER BY 1,2`));

console.log('\n═══ ④ TIPOS DE REGLA DE ENVÍO vivos (G2.3) ═══');
p(dbQuery(`SELECT codigo, nombre, activo, motivo_inactivo FROM cat_tipos_regla_envio ORDER BY codigo`));

console.log('\n═══ ⑤ ¿El cotizador conoce el DESTINO? — su firma ═══');
p(dbQuery(`
  SELECT pg_get_function_identity_arguments(oid) args FROM pg_proc
  WHERE proname='cotizar_envio_despensa'`));

console.log('\n═══ ⑥ COLUMNAS de envios relacionadas con la entrega (G2.4) ═══');
p(dbQuery(`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_schema='public' AND table_name='envios'
    AND column_name ~ 'entrega|receptor|codigo|verific|repartidor|transport'
  ORDER BY ordinal_position`));

console.log('\n═══ ⑦ zonas_cobertura — estado real ═══');
p(dbQuery(`
  SELECT count(*) filas,
         count(*) FILTER (WHERE activo) activas,
         string_agg(DISTINCT ciudad, ', ') ciudades
  FROM zonas_cobertura`));

console.log('\n═══ ⑧ ¿Existe algo que declare COBERTURA de la despensa? ═══');
p(dbQuery(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public' AND table_name ~ 'cobertura|zona'
  ORDER BY 1`));
