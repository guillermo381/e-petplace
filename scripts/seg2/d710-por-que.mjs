/**
 * 🔴 D-710 · ¿POR QUÉ LOS 56 PERDIERON SU FILA?
 *
 * El founder nombró las dos hipótesis, y la segunda vale mucho más que los
 * 44 MB:
 *   ① **eran prestadores de PRUEBA** (la limpieza de sondas de S92) → basura,
 *      se borran y listo;
 *   ② **hay un camino de borrado que elimina la fila y DEJA el archivo** → cada
 *      baja de documento dejaría un documento de identidad huérfano en Storage
 *      **para siempre**. *Eso es un defecto que se repite solo.*
 *
 * Y una tercera que el founder también nombró y es la peor: **prestadores
 * REALES y vigentes cuyo documento falta** — ahí no sobra un archivo, falta un
 * dato que alguien necesita.
 */
import { execFileSync } from 'node:child_process';
import { linea, guardarSeg2 } from './lib-seg2.mjs';

const sql = (q) => {
  const s = execFileSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
  });
  const i = s.indexOf('\n{');
  return JSON.parse(s.slice(i === -1 ? s.indexOf('{') : i + 1)).rows;
};

linea('\n══ D-710 · de quiénes son los 56 y qué les pasó ══\n');

const duenos = sql(`
  SELECT
    p.nombre_comercial,
    p.estado,
    (p.nombre_comercial ILIKE '%DEMO%' OR p.nombre_comercial ILIKE '%prueba%' OR p.nombre_comercial ILIKE '%test%') AS es_seed,
    count(o.id) AS docs_huerfanos,
    (SELECT count(*) FROM prestador_documentos d WHERE d.prestador_id = p.id) AS docs_con_fila
  FROM storage.objects o
  JOIN prestadores p ON p.id::text = split_part(o.name, '/', 1)
  WHERE o.bucket_id = 'prestador-documentos'
    AND NOT EXISTS (SELECT 1 FROM prestador_documentos d WHERE d.archivo_url LIKE '%' || o.name)
  GROUP BY p.id, 1,2,3 ORDER BY 4 DESC;
`);

linea('① ¿DE QUIÉN SON?\n');
for (const d of duenos) {
  linea(
    `  ${d.es_seed ? '🧪 SEED ' : '🟠 REAL '} ${String(d.docs_huerfanos).padStart(3)} huérfano(s) · ${String(d.docs_con_fila).padStart(2)} con fila · estado=${d.estado} · ${String(d.nombre_comercial).slice(0, 34)}`,
  );
}

const reales = duenos.filter((d) => !d.es_seed);
const seeds = duenos.filter((d) => d.es_seed);
linea(`\n  ─ de prestadores SEED (prueba): ${seeds.reduce((a, d) => a + Number(d.docs_huerfanos), 0)} doc(s)`);
linea(`  ─ de prestadores REALES:        ${reales.reduce((a, d) => a + Number(d.docs_huerfanos), 0)} doc(s)`);

linea('\n② ¿HAY UN CAMINO DE BORRADO QUE DEJA EL ARCHIVO?\n');
const caminos = sql(`
  SELECT p.proname, (pg_get_functiondef(p.oid) ILIKE '%storage%') AS toca_storage
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND pg_get_functiondef(p.oid) ILIKE '%prestador_documentos%'
    AND pg_get_functiondef(p.oid) ILIKE '%delete%'
  ORDER BY 1;
`);
if (caminos.length === 0) {
  linea('  · ninguna función de `public` borra filas de `prestador_documentos`.');
} else {
  for (const c of caminos) {
    linea(`  · ${c.proname} — ${c.toca_storage ? 'toca storage' : '🔴 NO toca storage: dejaría el archivo'}`);
  }
}

const policies = sql(`
  SELECT policyname, roles::text FROM pg_policies
  WHERE schemaname='public' AND tablename='prestador_documentos' AND cmd IN ('DELETE','ALL');
`);
linea(
  policies.length === 0
    ? '  · NINGUNA policy de DELETE/ALL: por RLS nadie borra filas de esa tabla.'
    : `  · ${policies.length} policy(s) que permiten borrar: ${policies.map((p) => p.policyname).join(', ')}`,
);

const fks = sql(`
  SELECT conname, confdeltype FROM pg_constraint
  WHERE conrelid='public.prestador_documentos'::regclass AND contype='f';
`);
linea('\n③ LAS FK DE LA TABLA (c=cascade · n=set null · a=no action · r=restrict)\n');
for (const f of fks) linea(`  · ${f.conname} → ON DELETE '${f.confdeltype}'`);

guardarSeg2('d710-por-que.json', { duenos, caminos, policies, fks });
linea('');
