/**
 * S92-BIS · B1 — CENSO DE STORAGE. El bloque de la corona.
 *
 * Acá viven historias clínicas, carnets de vacunas, recetas, certificados, fotos
 * de mascotas, clips de adiestramiento, documentos de prestadores y evidencias
 * de servicio. **Es el dato más sensible del producto y S92 no lo miró.**
 *
 * Este script NO cura: mide. Cuatro ejes:
 *   ① buckets: público, límites, mime, cuántos objetos
 *   ② policies de `storage.objects` por bucket, con su audiencia real
 *   ③ EL MAPA de la base a Storage — qué columnas guardan paths de qué bucket
 *      (R2: el censo de impacto de un bucket incluye esto)
 *   ④ quién lo lee en el código, y **si lee por URL pública o firmada** — que es
 *      lo que decide si cerrar un bucket rompe una pantalla (freno 2)
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sql, guardarSeg2, RAIZ, linea } from './lib-seg2.mjs';

const ejecutar = promisify(execFile);

// ── ① LOS BUCKETS ──────────────────────────────────────────────────────────
const buckets = await sql(
  `SELECT b.id, b.name, b.public,
          b.file_size_limit,
          COALESCE(array_to_string(b.allowed_mime_types, ', '), '(sin restricción)') AS mimes,
          (SELECT count(*) FROM storage.objects o WHERE o.bucket_id = b.id)::int AS objetos,
          b.created_at::text AS creado
   FROM storage.buckets b ORDER BY b.public DESC, b.id`,
  'b1-buckets',
);

// ── ② LAS POLICIES DE storage.objects ──────────────────────────────────────
const policies = await sql(
  `SELECT policyname, cmd, roles::text AS roles,
          COALESCE(qual,'') AS qual, COALESCE(with_check,'') AS with_check
   FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
   ORDER BY policyname`,
  'b1-policies',
);

// ── ③ EL MAPA: columnas de la base que guardan paths ───────────────────────
const mapa = await sql(
  `SELECT table_name, column_name
   FROM information_schema.columns
   WHERE table_schema='public'
     AND (column_name ILIKE '%storage_path%' OR column_name ILIKE '%bucket%'
          OR column_name ILIKE '%foto_url%' OR column_name ILIKE '%_url'
          OR column_name ILIKE '%archivo%url%')
   ORDER BY 1,2`,
  'b1-mapa',
);

// ── ④ CÓMO LO LEE EL CÓDIGO: pública vs firmada ────────────────────────────
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
const publicas = await grep('getPublicUrl|/object/public/');
const firmadas = await grep('createSignedUrl|/object/sign/');

guardarSeg2('b1-censo-storage.json', { buckets, policies, mapa, publicas, firmadas });

linea('\n══ B1 · CENSO DE STORAGE ══\n');
linea('① LOS BUCKETS\n');
linea('  bucket                   público  límite      objetos  mime');
linea('  ' + '─'.repeat(88));
for (const b of buckets) {
  const lim = b.file_size_limit ? `${Math.round(b.file_size_limit / 1024 / 1024)}MB` : '(SIN LÍMITE)';
  const marca = b.public ? '🔴 SÍ  ' : '   no  ';
  linea(`  ${b.id.padEnd(24)} ${marca} ${lim.padEnd(12)} ${String(b.objetos).padStart(5)}  ${b.mimes.slice(0, 34)}`);
}
const publicos = buckets.filter((b) => b.public);
const sinLimite = buckets.filter((b) => !b.file_size_limit);
linea(`\n  PÚBLICOS: ${publicos.length} de ${buckets.length}  ·  SIN límite de tamaño: ${sinLimite.length}  ·  objetos totales: ${buckets.reduce((a, b) => a + b.objetos, 0)}`);

linea('\n② LAS POLICIES DE storage.objects\n');
for (const p of policies) {
  const expr = `${p.qual} ${p.with_check}`;
  // ¿nombra un rol/gate de verdad, o solo el bucket?
  const soloBucket = /bucket_id/.test(expr) && !/auth\.uid|is_admin|user_|storage\.foldername|owner/i.test(expr);
  const marca = soloBucket ? '🔴' : '  ';
  linea(`  ${marca} ${p.policyname.slice(0, 46).padEnd(48)} [${p.cmd}] ${p.roles}`);
  if (soloBucket) linea(`        ⚠️ SOLO verifica el bucket — no mira quién es: ${expr.trim().slice(0, 110)}`);
}

linea('\n③ EL MAPA DE LA BASE A STORAGE\n');
for (const m of mapa) linea(`  · ${m.table_name}.${m.column_name}`);

linea('\n④ CÓMO LEE EL CÓDIGO\n');
linea(`  por URL PÚBLICA (getPublicUrl / /object/public/): ${publicas.length} sitios`);
for (const p of publicas.slice(0, 14)) linea(`     · ${p.slice(0, 140)}`);
if (publicas.length > 14) linea(`     … y ${publicas.length - 14} más`);
linea(`\n  por URL FIRMADA (createSignedUrl / /object/sign/): ${firmadas.length} sitios`);
for (const f of firmadas.slice(0, 10)) linea(`     · ${f.slice(0, 140)}`);
linea('');
