/**
 * S92-BIS · B1 — CENSO DE IMPACTO DEL BUCKET `avatars` (R2), antes de curarlo.
 *
 * El repro dio el hallazgo más grave del perímetro: **cualquier autenticado sube
 * al bucket `avatars`, que además no tiene límite de tamaño ni de mime** — y
 * **no hay policy de DELETE**, así que lo subido no se puede borrar por la API.
 * *Un bucket que acepta cualquier archivo de cualquiera y no deja limpiarlo es
 * un vertedero de una sola dirección.*
 *
 * Antes de tocarlo hay que saber **qué pantalla lo usa y para qué**, porque
 * cerrar la escritura es freno 2 (cambia comportamiento visible): el objeto de
 * muestra era `…/logo-n…`, o sea que acá no viven solo avatares de persona.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sql, guardarSeg2, RAIZ, linea } from './lib-seg2.mjs';

const ejecutar = promisify(execFile);

// ① la forma de los paths: ¿carpeta por usuario, o cualquier cosa?
const objetos = await sql(
  `SELECT name, owner::text AS owner, (metadata->>'size')::bigint AS bytes,
          metadata->>'mimetype' AS mime, created_at::text AS creado
   FROM storage.objects WHERE bucket_id='avatars' ORDER BY created_at`,
  'av-objetos',
);

// ② las policies del bucket, con su expresión entera
const policies = await sql(
  `SELECT policyname, cmd, roles::text AS roles,
          COALESCE(qual,'(sin qual)') AS qual, COALESCE(with_check,'(sin with_check)') AS wc
   FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
     AND (COALESCE(qual,'') ILIKE '%avatars%' OR COALESCE(with_check,'') ILIKE '%avatars%')
   ORDER BY cmd`,
  'av-policies',
);

// ③ qué columnas de la base apuntan a este bucket
const columnas = await sql(
  `SELECT 'profiles.avatar_url' AS col, count(*)::int AS filas FROM public.profiles WHERE avatar_url IS NOT NULL
   UNION ALL SELECT 'profiles.foto_url', count(*)::int FROM public.profiles WHERE foto_url IS NOT NULL
   UNION ALL SELECT 'prestadores.foto_url', count(*)::int FROM public.prestadores WHERE foto_url IS NOT NULL
   UNION ALL SELECT 'prestador_empleados.foto_url', count(*)::int FROM public.prestador_empleados WHERE foto_url IS NOT NULL
   ORDER BY 1`,
  'av-columnas',
);

// ④ quién lo escribe y quién lo lee en el código
async function grep(patron) {
  try {
    const { stdout } = await ejecutar('git', ['grep', '-n', '-E', '--', patron, 'apps', 'packages', 'supabase/functions'], {
      cwd: RAIZ,
      maxBuffer: 32 * 1024 * 1024,
    });
    return stdout.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}
const usos = await grep("avatars|BUCKET_LOGOS");

guardarSeg2('b1-censo-avatars.json', { objetos, policies, columnas, usos });

linea('\n══ CENSO DE IMPACTO · bucket `avatars` ══\n');
linea(`① LOS ${objetos.length} OBJETOS — su forma dice si hay carpeta por usuario\n`);
for (const o of objetos) {
  const carpeta = o.name.includes('/') ? o.name.split('/')[0] : '(RAÍZ — sin carpeta)';
  const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(carpeta);
  const archivo = o.name.includes('/') ? o.name.split('/').slice(1).join('/') : o.name;
  linea(`  ${esUuid ? '✅' : '🔴'} carpeta=${esUuid ? 'uuid' : carpeta.slice(0, 22)}  archivo=${archivo.slice(0, 30).padEnd(32)} ${String(o.bytes ?? '?').padStart(8)} b  ${o.mime ?? ''}`);
}
const enRaiz = objetos.filter((o) => !o.name.includes('/'));
linea(`\n  objetos SIN carpeta de usuario (en la raíz del bucket): ${enRaiz.length}`);

linea('\n② LAS POLICIES DEL BUCKET\n');
for (const p of policies) {
  linea(`  · ${p.policyname}  [${p.cmd}] ${p.roles}`);
  linea(`      USING      : ${p.qual.replace(/\s+/g, ' ').slice(0, 150)}`);
  linea(`      WITH CHECK : ${p.wc.replace(/\s+/g, ' ').slice(0, 150)}`);
}
const cmds = new Set(policies.map((p) => p.cmd));
linea(`\n  comandos cubiertos: ${[...cmds].join(', ')}`);
linea(`  ${cmds.has('DELETE') ? '' : '🔴 NO HAY POLICY DE DELETE — lo que entra al bucket no se puede borrar por la API'}`);

linea('\n③ COLUMNAS DE LA BASE QUE PODRÍAN APUNTARLO\n');
for (const c of columnas) linea(`  ${String(c.filas).padStart(4)} filas · ${c.col}`);

linea('\n④ USOS EN EL CÓDIGO\n');
for (const u of usos.slice(0, 20)) linea(`  · ${u.slice(0, 150)}`);
linea('');
