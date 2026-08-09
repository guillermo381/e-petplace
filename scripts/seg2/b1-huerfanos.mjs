/**
 * S92-BIS · B1 · paso 6 — HUÉRFANOS DE STORAGE.
 *
 * Objetos que viven en un bucket y **ninguna fila de la base referencia**.
 * No son un agujero de permisos: son datos personales (fotos de mascotas,
 * documentos de identidad de prestadores, evidencias de servicio) que quedaron
 * sin dueño y que **nadie va a volver a mirar** — y que igual se sirven si
 * alguien conoce el path.
 *
 * ⚠️ **CENSAR Y NO BORRAR** (orden del arranque, freno 3). Se sirve la lista y
 * su tamaño; el destino es decisión del founder, como lo fueron los 14
 * teléfonos de S92.
 *
 * ── EL MAPA se lee del propio esquema, no de memoria ────────────────────────
 * `evento_archivo_adjunto` guarda `bucket` + `storage_path` (mapa explícito);
 * el resto de las tablas guardan el path en una columna `*_url` cuyo bucket es
 * conocido por el código. Se declara cada correspondencia para que el censo se
 * pueda auditar.
 */
import { sql, guardarSeg2, linea } from './lib-seg2.mjs';

/** bucket → las consultas que devuelven los paths referenciados. */
const REFERENCIAS = {
  mascotas: [`SELECT foto_url AS p FROM public.mascotas WHERE foto_url IS NOT NULL`],
  avatars: [
    `SELECT foto_url AS p FROM public.prestadores WHERE foto_url IS NOT NULL`,
    `SELECT avatar_url AS p FROM public.profiles WHERE avatar_url IS NOT NULL`,
    `SELECT foto_url AS p FROM public.profiles WHERE foto_url IS NOT NULL`,
    `SELECT foto_url AS p FROM public.prestador_empleados WHERE foto_url IS NOT NULL`,
  ],
  'prestador-documentos': [`SELECT archivo_url AS p FROM public.prestador_documentos WHERE archivo_url IS NOT NULL`],
  // `prestador_fotos.url` — columna MEDIDA del catálogo (la primera versión
  // escribió `storage_path` de memoria y rebotó con 42703). Sexta vez en dos
  // sesiones: los nombres se miden.
  'prestador-galeria': [
    `SELECT url AS p FROM public.prestador_fotos WHERE url IS NOT NULL`,
    `SELECT clip_url AS p FROM public.prestadores WHERE clip_url IS NOT NULL`,
  ],
  'grooming-archivos': [`SELECT storage_path AS p FROM public.evento_grooming_archivos WHERE storage_path IS NOT NULL`],
  'adiestramiento-clips': [`SELECT storage_path AS p FROM public.evento_adiestramiento_clips WHERE storage_path IS NOT NULL`],
  'cita-archivos': [`SELECT storage_path AS p FROM public.evento_archivo_adjunto WHERE bucket='cita-archivos' AND storage_path IS NOT NULL`],
};

const buckets = await sql(`SELECT id FROM storage.buckets ORDER BY id`, 'huerf-buckets');
const informe = [];

linea('\n══ B1 · paso 6 — HUÉRFANOS DE STORAGE ══\n');

for (const b of buckets) {
  const consultas = REFERENCIAS[b.id];
  const objetos = await sql(
    `SELECT name, COALESCE((metadata->>'size')::bigint,0) AS bytes
     FROM storage.objects WHERE bucket_id='${b.id}' ORDER BY name`,
    `huerf-obj-${b.id}`,
  );
  if (objetos.length === 0) {
    informe.push({ bucket: b.id, objetos: 0, referenciados: 0, huerfanos: 0, bytesHuerfanos: 0, sinMapa: !consultas });
    linea(`  ${b.id.padEnd(24)} (bucket vacío)`);
    continue;
  }
  if (!consultas) {
    // sin mapa declarado: NO se declara huérfano nada (R5 — si no se puede
    // medir, no se afirma). `especies-razas`, `marca-publica` y
    // `adopcion-fotos` no tienen tabla que los referencie por diseño.
    informe.push({
      bucket: b.id,
      objetos: objetos.length,
      referenciados: null,
      huerfanos: null,
      bytesHuerfanos: null,
      sinMapa: true,
    });
    linea(`  ${b.id.padEnd(24)} ${String(objetos.length).padStart(4)} objetos · SIN MAPA declarado (no se afirma nada)`);
    continue;
  }

  const refs = new Set();
  for (const c of consultas) {
    const filas = await sql(c, `huerf-ref-${b.id}`);
    for (const f of filas) if (f.p) refs.add(String(f.p));
  }
  // un path referenciado puede venir con o sin el prefijo del bucket
  const normal = (s) => s.replace(new RegExp(`^${b.id}/`), '');
  const refsNorm = new Set([...refs].map(normal));

  const huerfanos = objetos.filter((o) => !refsNorm.has(normal(o.name)) && !refs.has(o.name));
  const bytes = huerfanos.reduce((a, o) => a + Number(o.bytes || 0), 0);

  informe.push({
    bucket: b.id,
    objetos: objetos.length,
    referenciados: refs.size,
    huerfanos: huerfanos.length,
    bytesHuerfanos: bytes,
    muestra: huerfanos.slice(0, 4).map((o) => o.name.slice(0, 52)),
  });

  const marca = huerfanos.length > 0 ? '🟡' : '✅';
  linea(
    `  ${marca} ${b.id.padEnd(22)} ${String(objetos.length).padStart(4)} objetos · ${String(refs.size).padStart(4)} referencias · ${String(huerfanos.length).padStart(4)} HUÉRFANOS · ${(bytes / 1024 / 1024).toFixed(2)} MB`,
  );
  for (const m of huerfanos.slice(0, 4)) linea(`        · ${m.name.slice(0, 66)}`);
  if (huerfanos.length > 4) linea(`        … y ${huerfanos.length - 4} más`);
}

const totalHuerf = informe.reduce((a, i) => a + (i.huerfanos ?? 0), 0);
const totalBytes = informe.reduce((a, i) => a + (i.bytesHuerfanos ?? 0), 0);
const sinMapa = informe.filter((i) => i.sinMapa && i.objetos > 0);

linea(`\n── TOTAL: ${totalHuerf} huérfanos · ${(totalBytes / 1024 / 1024).toFixed(2)} MB ──`);
linea(`   buckets sin mapa declarado (no se afirma nada sobre ellos): ${sinMapa.length}`);
for (const s of sinMapa) linea(`      · ${s.bucket} (${s.objetos} objetos) — públicos de catálogo/marca, sin tabla que los referencie por diseño`);
linea('\n   ⚠️ NO SE BORRA NADA (freno 3). La lista queda servida para el founder.\n');

guardarSeg2('b1-huerfanos.json', informe);
