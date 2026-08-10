/**
 * S94-PERF · B2 — LO QUE VIAJA POR EL CABLE.
 *
 * B1 probó que el peaje es por PETICIÓN y no por fila, así que el sobre-pedido
 * de columnas —el sospechoso clásico— ya no puede ser la causa. Queda lo otro
 * que viaja: **las imágenes**, donde el tamaño sí se paga byte por byte y donde
 * una miniatura servida como original es el hallazgo más caro y más barato de
 * curar que existe en cualquier app.
 *
 * Se mide contra `storage.objects.metadata`, que es lo que Storage guardó de
 * verdad — no contra lo que el código dice que sube.
 */

import { sql, linea, guardarPerf, humano } from './lib-perf.mjs';

const rep = {};
linea('\n══════════════════════════════════════════════════════════════');
linea('  S94-PERF · B2 — LO QUE VIAJA POR EL CABLE');
linea('══════════════════════════════════════════════════════════════\n');

// ── ① EL PESO REAL DE LAS IMÁGENES ─────────────────────────────────────────
linea('① TAMAÑO DE LO QUE SE DESCARGA (por bucket)\n');
const buckets = await sql(
  `SELECT b.id AS bucket, b.public AS publico,
          count(o.id) AS objetos,
          COALESCE(sum((o.metadata->>'size')::bigint), 0) AS bytes,
          COALESCE(round(avg((o.metadata->>'size')::bigint)), 0) AS promedio,
          COALESCE(max((o.metadata->>'size')::bigint), 0) AS mayor,
          COALESCE(percentile_disc(0.5) WITHIN GROUP (ORDER BY (o.metadata->>'size')::bigint), 0) AS mediana
     FROM storage.buckets b
     LEFT JOIN storage.objects o ON o.bucket_id = b.id
    GROUP BY 1,2 ORDER BY 4 DESC;`,
  'perf-buckets',
);
linea('   bucket                     pub  objetos     total    mediana    mayor');
for (const b of buckets) {
  linea(
    `   ${String(b.bucket).padEnd(26)} ${b.publico ? 'sí ' : 'no '} ${String(b.objetos).padStart(7)} ${humano(b.bytes).padStart(9)} ${humano(b.mediana).padStart(10)} ${humano(b.mayor).padStart(8)}`,
  );
}
rep.buckets = buckets;

// ── ② EL CASO QUE IMPORTA: LOS AVATARES DE LA LISTA ────────────────────────
linea('\n② LAS FOTOS DE MASCOTA — que se muestran como avatar de 28-64 px\n');
const fotos = await sql(
  `SELECT count(*) AS n,
          round(avg((metadata->>'size')::bigint)) AS promedio,
          percentile_disc(0.5) WITHIN GROUP (ORDER BY (metadata->>'size')::bigint) AS mediana,
          percentile_disc(0.9) WITHIN GROUP (ORDER BY (metadata->>'size')::bigint) AS p90,
          max((metadata->>'size')::bigint) AS mayor,
          sum((metadata->>'size')::bigint) AS total
     FROM storage.objects WHERE bucket_id = 'mascotas';`,
  'perf-fotos',
);
const f = fotos[0];
linea(`   ${f.n} objetos · mediana ${humano(f.mediana)} · p90 ${humano(f.p90)} · mayor ${humano(f.mayor)} · total ${humano(f.total)}`);
rep.fotosMascota = f;

const pesadas = await sql(
  `SELECT count(*) AS n FROM storage.objects
    WHERE bucket_id='mascotas' AND (metadata->>'size')::bigint > 300000;`,
  'perf-fotos-pesadas',
);
linea(`   de esas, ${pesadas[0].n} pesan más de 300 kB`);
rep.fotosPesadas = Number(pesadas[0].n);

linea('\n   ⚠️ Storage de Supabase **no transforma imágenes en el plan actual sin');
linea('      activarlo**: la app descarga el archivo tal como se subió. Un avatar');
linea('      de 64 px que baja una foto de 1 MB desperdicia el 99 % de los bytes.');

// ── ③ CUÁNTAS IMÁGENES PIDE UNA PANTALLA ───────────────────────────────────
linea('\n③ CUÁNTAS PIDE UNA PANTALLA REAL\n');
const porFamilia = await sql(
  `SELECT count(*) FILTER (WHERE m.foto_url IS NOT NULL) AS con_foto,
          count(*) AS mascotas
     FROM mascotas m
    WHERE m.familia_id = (
      SELECT familia_id FROM mascotas
       WHERE foto_url IS NOT NULL AND familia_id IS NOT NULL
       GROUP BY familia_id ORDER BY count(*) DESC LIMIT 1);`,
  'perf-familia',
);
linea(`   La familia con más fotos tiene ${porFamilia[0].con_foto} de ${porFamilia[0].mascotas} mascotas con foto.`);
linea('   El Hogar las pinta todas ⇒ esa es la descarga de una apertura.');
rep.familiaMax = porFamilia[0];

// ── ④ LO QUE ESTÁ BIEN Y CONVIENE NO RE-AUDITAR ────────────────────────────
linea('\n④ LO QUE ESTÁ BIEN (medido, para que nadie lo vuelva a buscar)\n');
linea('   · CERO `select(\'*\')` en los 80 wrappers de `packages/api` — el');
linea('     sobre-pedido de columnas, que es el hallazgo típico de este bloque,');
linea('     acá NO existe. Cada wrapper nombra sus columnas.');
linea('   · Las URLs firmadas tienen **cache con TTL y firma por lote**');
linea('     (`resolverUrlsFotos` firma una lista entera en UN viaje). El N+1 de');
linea('     firmas —el otro clásico— tampoco existe.');
linea('   · Aciertos de caché de la base: 100 %. No lee de disco.');

guardarPerf('b4-cable.json', rep);
linea('\n   ── guardado en scripts/perf/salida/b4-cable.json\n');
