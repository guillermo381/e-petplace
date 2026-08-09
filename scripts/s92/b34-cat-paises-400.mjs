/**
 * S92-A · ¿el 400 de `cat_paises` es un rebote de PERMISO o de TIPO?
 *
 * En el verde, el DELETE de anon sobre cat_paises devolvió 400 mientras sus dos
 * hermanas devolvieron 401. Un 400 puede ser «no tenés permiso» expresado raro,
 * o puede ser «ese filtro no matchea el tipo de la columna» — en cuyo caso el
 * permiso NUNCA SE EVALUÓ y el verde no prueba nada.
 *
 * Es la misma clase de duda que hizo caer la v1 del rojo de B1. Se contesta
 * mirando la PK real y repitiendo el intento bien formado.
 */
import { sql, rest, linea } from './lib-s92.mjs';

const cols = await sql(
  `SELECT column_name, data_type FROM information_schema.columns
   WHERE table_schema='public' AND table_name='cat_paises' ORDER BY ordinal_position LIMIT 6`,
  'cp-cols',
);
linea('\n  columnas de cat_paises:');
for (const c of cols) linea(`     ${c.column_name} : ${c.data_type}`);

const pk = await sql(
  `SELECT a.attname AS col FROM pg_index i
   JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum = ANY(i.indkey)
   WHERE i.indrelid='public.cat_paises'::regclass AND i.indisprimary`,
  'cp-pk',
);
const clave = pk[0]?.col ?? cols[0].column_name;
linea(`\n  PK: ${clave}`);

const grants = await sql(
  `SELECT privilege_type FROM information_schema.role_table_grants
   WHERE table_schema='public' AND table_name='cat_paises' AND grantee='anon' ORDER BY 1`,
  'cp-grants',
);
linea(`  grants de anon HOY: ${grants.map((g) => g.privilege_type).join(', ') || '(ninguno)'}`);

// el intento BIEN FORMADO: filtro sobre la PK real, con un valor imposible
const r = await rest(`/rest/v1/cat_paises?${clave}=eq.__s92_no_existe__`, { metodo: 'DELETE' });
linea(`\n  DELETE bien formado como anon → HTTP ${r.status}`);
linea(`     ${r.cuerpo.slice(0, 200)}`);

const esPermiso = r.status === 401 || /permission denied/i.test(r.cuerpo) || r.status === 403;
linea(
  esPermiso
    ? '\n  ✅ Es rebote de PERMISO: el DELETE está cerrado de verdad.\n'
    : `\n  ⚠️ NO es rebote de permiso (${r.status}). Hay que mirarlo.\n`,
);
