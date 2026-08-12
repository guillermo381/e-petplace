// S95-H2 · MEDIR ANTES DE CHOCAR. Solo lectura.
//   ① La CUARTA PUERTA: ¿en qué estado nace una cuenta y eso alcanza para vender?
//   ② Los dos CHECK nuevos de la Pista J, contra lo que el CSV declara.
//   ③ Las tres funciones de alta: ¿existen y con qué firma?
import { dbQuery } from '../../scripts/lib-db.mjs';
import { readFileSync } from 'node:fs';

const p = (r) => console.log(JSON.stringify(r, null, 1));

console.log('═══ ① LA CUARTA PUERTA ═══');
console.log('¿En qué estado nace una cuenta por `crear_cuenta_comercial_inicial`?');
p(dbQuery(`
  SELECT (pg_get_functiondef(pr.oid) ~ 'pendiente_validacion') nace_pendiente,
         (pg_get_functiondef(pr.oid) ~ 'activa') menciona_activa
  FROM pg_proc pr JOIN pg_namespace n ON n.oid=pr.pronamespace
  WHERE n.nspname='public' AND pr.proname='crear_cuenta_comercial_inicial'`));

console.log('\n¿`es_vendedor_de` exige que la cuenta esté activa? (la cuarta puerta de G)');
p(dbQuery(`
  SELECT (pg_get_functiondef(pr.oid) ~ 'cc.estado') mira_estado
  FROM pg_proc pr JOIN pg_namespace n ON n.oid=pr.pronamespace
  WHERE n.nspname='public' AND pr.proname IN ('es_vendedor_de','_cuenta_es_vendedora')`));

console.log('\n¿Hay función que ACTIVE una cuenta comercial?');
p(dbQuery(`
  SELECT pr.proname, pg_get_function_identity_arguments(pr.oid) args
  FROM pg_proc pr JOIN pg_namespace n ON n.oid=pr.pronamespace
  WHERE n.nspname='public' AND pr.prokind='f'
    AND pg_get_functiondef(pr.oid) ~ 'UPDATE cuentas_comerciales'
  ORDER BY 1`));

console.log('\n═══ ② LOS DOS CHECK NUEVOS ═══');
p(dbQuery(`
  SELECT conname, pg_get_constraintdef(oid) d FROM pg_constraint
  WHERE conrelid='public.productos'::regclass AND contype='c'
    AND conname LIKE 'chk_productos_%aplicables'`));

console.log('\n── QUÉ DECLARA EL CSV DE SEMILLA en esas dos columnas ──');
const csv = readFileSync('tools/carga-catalogo/catalogo-semilla-s95h.csv', 'utf8')
  .split('\n').filter((l) => l.trim().length > 0);
const cols = csv[0].split(',');
const iT = cols.indexOf('tallas');
const iM = cols.indexOf('momento_vital');
const tallas = new Set();
const momentos = new Set();
for (const linea of csv.slice(1)) {
  const c = linea.split(',');
  (c[iT] ?? '').split('|').filter(Boolean).forEach((x) => tallas.add(x));
  (c[iM] ?? '').split('|').filter(Boolean).forEach((x) => momentos.add(x));
}
console.log(`tallas en el CSV        : ${[...tallas].join(' · ')}`);
console.log(`momentos en el CSV      : ${[...momentos].join(' · ')}`);
console.log(`válidos para tallas     : S · M · L`);
console.log(`válidos para momentos   : cachorro · joven · adulto · senior`);

console.log('\n═══ ③ LAS TRES PUERTAS DE ALTA ═══');
p(dbQuery(`
  SELECT pr.proname, pg_get_function_identity_arguments(pr.oid) args
  FROM pg_proc pr JOIN pg_namespace n ON n.oid=pr.pronamespace
  WHERE n.nspname='public' AND pr.proname IN
    ('otorgar_rol_vendedor','definir_regla_envio_vendedor','crear_bodega_vendedor',
     'crear_cuenta_comercial_inicial','proponer_sku_vendedor','publicar_oferta')
  ORDER BY 1`));

console.log('\n═══ ④ ESTADO ACTUAL DEL CATÁLOGO ═══');
p(dbQuery(`
  SELECT 'productos' t, count(*) n FROM productos
  UNION ALL SELECT 'ofertas', count(*) FROM ofertas
  UNION ALL SELECT 'reglas_envio', count(*) FROM reglas_envio
  UNION ALL SELECT 'vendedor_bodegas', count(*) FROM vendedor_bodegas
  UNION ALL SELECT 'cuentas_seller', count(*) FROM cuenta_roles WHERE tipo_actor='seller_productos'
  ORDER BY 1`));
