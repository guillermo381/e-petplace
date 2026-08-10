/**
 * 🔴 D-710 · ¿DE QUIÉN SON LOS 83 DOCUMENTOS HUÉRFANOS?
 *
 * El censo dice **cuántos** y **cuánto pesan**. Lo que decide si se borran es
 * otra cosa: **de quién son**. No es lo mismo basura de las 64 cuentas sonda que
 * S92 borró, que la cédula de un prestador real cuya fila se perdió.
 *
 * *Un borrado de 83 documentos de identidad decidido por el peso en MB sería
 * decidir por el número equivocado.*
 *
 * La carpeta de `prestador-documentos` es el primer segmento del path. Se mide
 * contra `prestadores` y contra `auth.users`.
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

linea('\n══ D-710 · de quién son los documentos huérfanos ══\n');

const filas = sql(`
  WITH obj AS (
    SELECT split_part(name, '/', 1) AS carpeta, count(*) AS n, sum((metadata->>'size')::bigint) AS bytes
    FROM storage.objects
    WHERE bucket_id = 'prestador-documentos'
      AND NOT EXISTS (SELECT 1 FROM prestador_documentos d WHERE d.archivo_url LIKE '%' || storage.objects.name)
    GROUP BY 1
  )
  SELECT
    o.carpeta,
    o.n,
    o.bytes,
    (EXISTS (SELECT 1 FROM prestadores p WHERE p.id::text = o.carpeta)) AS es_prestador_vivo,
    (EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = o.carpeta)) AS es_usuario_vivo
  FROM obj o ORDER BY o.bytes DESC;
`);

let vivos = 0;
let bytesVivos = 0;
let sinDuenno = 0;
let bytesSin = 0;

for (const f of filas) {
  const vivo = f.es_prestador_vivo || f.es_usuario_vivo;
  if (vivo) {
    vivos += Number(f.n);
    bytesVivos += Number(f.bytes ?? 0);
  } else {
    sinDuenno += Number(f.n);
    bytesSin += Number(f.bytes ?? 0);
  }
  linea(
    `  ${vivo ? '🟠 DUEÑO VIVO ' : '⚪ sin dueño '} ${String(f.n).padStart(3)} doc(s) · ${(Number(f.bytes ?? 0) / 1048576).toFixed(1)} MB · carpeta …${String(f.carpeta).slice(-8)}`,
  );
}

linea('');
linea(`  ─ con dueño VIVO en la base: ${vivos} doc(s) · ${(bytesVivos / 1048576).toFixed(1)} MB`);
linea(`  ─ SIN dueño (huella de datos borrados): ${sinDuenno} doc(s) · ${(bytesSin / 1048576).toFixed(1)} MB`);
linea('');
linea('  ⇒ los de DUEÑO VIVO no son basura: son documentos de alguien que existe,');
linea('    cuya FILA se perdió. Borrarlos es distinto que barrer residuo de test.');

guardarSeg2('d710-de-quien-son.json', { filas, vivos, bytesVivos, sinDuenno, bytesSin });
linea('');
