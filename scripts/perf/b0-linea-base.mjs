/**
 * S94-PERF · B0 — LA LÍNEA BASE.
 *
 * Sin esto, nada de lo que venga después significa. Contesta cuatro preguntas,
 * y ninguna de ellas es «¿es lento?»:
 *
 *   ① ¿Existe el instrumento? (`pg_stat_statements` — la única fuente de verdad
 *      de qué consulta consume tiempo REAL en producción, no en mi cabeza)
 *   ② ¿Qué consume el tiempo? Dos listas, no una: por tiempo TOTAL acumulado y
 *      por tiempo MEDIO. Una consulta de 20 ms llamada 5.000 veces pesa más que
 *      una de 2 s llamada una vez, **y solo la primera lista lo muestra**.
 *   ③ ¿Cuántos datos hay de verdad? (después de la purga de sondas de S92: el
 *      80% de las familias era prueba ⇒ **toda medición anterior está inflada**)
 *   ④ ¿Cuál es el piso? Latencia de red desde ESTA máquina hasta el proyecto.
 *      Ninguna cura puede bajar de ahí, y confundir ese piso con lentitud de la
 *      app es la forma más cara de perder una sesión.
 *
 * DÓNDE SE MIDE (R4, declarado y no supuesto): base REMOTA del proyecto vivo,
 * desde la máquina del founder, por la misma puerta que usa la app (PostgREST).
 * **No es el teléfono en red móvil.** Todo número de acá es un PISO optimista.
 */

import { sql, rest, linea, guardarPerf, cronometrar, humano, r1 } from './lib-perf.mjs';

const reporte = { medidoEn: new Date().toISOString(), donde: 'base remota · máquina del founder · PostgREST' };

linea('\n══════════════════════════════════════════════════════════════');
linea('  S94-PERF · B0 — LA LÍNEA BASE');
linea('══════════════════════════════════════════════════════════════\n');

// ── ① EL INSTRUMENTO ───────────────────────────────────────────────────────
linea('① ¿EXISTE EL INSTRUMENTO?\n');

const ext = await sql(
  `SELECT e.extname, e.extversion, n.nspname AS esquema
     FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname IN ('pg_stat_statements','pg_net','pg_cron','pgcrypto')
    ORDER BY 1;`,
  'perf-ext',
);
for (const e of ext) linea(`   · ${e.extname} v${e.extversion} (esquema ${e.esquema})`);
const tieneStat = ext.some((e) => e.extname === 'pg_stat_statements');
reporte.extensiones = ext;
reporte.pg_stat_statements = tieneStat;

if (!tieneStat) {
  const disp = await sql(
    `SELECT name, default_version FROM pg_available_extensions WHERE name='pg_stat_statements';`,
    'perf-ext-disp',
  );
  linea(`\n   🔴 pg_stat_statements NO instalada. Disponible: ${JSON.stringify(disp)}`);
}

// La versión de Postgres decide los nombres de columna (total_time vs
// total_exec_time). Se LEE, no se supone — asumirlo es un error que sale como
// «la extensión no tiene datos» y manda a buscar el problema al lugar equivocado.
const ver = await sql(`SELECT current_setting('server_version_num')::int AS num, version() AS txt;`, 'perf-ver');
const pgNum = Number(ver[0].num);
linea(`\n   · Postgres ${pgNum} — ${String(ver[0].txt).slice(0, 60)}…`);
reporte.postgres = pgNum;

// ── ② QUÉ CONSUME EL TIEMPO ────────────────────────────────────────────────
if (tieneStat) {
  const colTotal = pgNum >= 130000 ? 'total_exec_time' : 'total_time';
  const colMean = pgNum >= 130000 ? 'mean_exec_time' : 'mean_time';

  const reset = await sql(
    `SELECT stats_reset FROM pg_stat_statements_info;`,
    'perf-reset',
  ).catch(() => [{ stats_reset: null }]);
  linea(`\n② QUÉ CONSUME EL TIEMPO  (ventana desde: ${reset[0]?.stats_reset ?? 'desconocido'})\n`);
  reporte.ventana = reset[0]?.stats_reset ?? null;

  const porTotal = await sql(
    `SELECT calls,
            round(${colTotal}::numeric, 1)  AS ms_total,
            round(${colMean}::numeric, 2)   AS ms_medio,
            round((100 * ${colTotal} / NULLIF(sum(${colTotal}) OVER (), 0))::numeric, 1) AS pct,
            rows,
            left(regexp_replace(query, '\\s+', ' ', 'g'), 150) AS consulta
       FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY ${colTotal} DESC
      LIMIT 25;`,
    'perf-top-total',
  );
  linea('   ── TOP 25 POR TIEMPO TOTAL ACUMULADO (lo que de verdad pesa) ──');
  for (const q of porTotal) {
    linea(`   ${String(q.pct).padStart(5)}% · ${String(q.ms_total).padStart(11)} ms · ${String(q.calls).padStart(8)} llam · ${String(q.ms_medio).padStart(8)} ms/u`);
    linea(`          ${q.consulta}`);
  }
  reporte.topPorTotal = porTotal;

  const porMedio = await sql(
    `SELECT calls,
            round(${colTotal}::numeric, 1) AS ms_total,
            round(${colMean}::numeric, 2)  AS ms_medio,
            rows,
            left(regexp_replace(query, '\\s+', ' ', 'g'), 150) AS consulta
       FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
        AND calls >= 5
      ORDER BY ${colMean} DESC
      LIMIT 25;`,
    'perf-top-medio',
  );
  linea('\n   ── TOP 25 POR TIEMPO MEDIO (con ≥5 llamadas: una sola corrida no es un dato) ──');
  for (const q of porMedio) {
    linea(`   ${String(q.ms_medio).padStart(9)} ms/u · ${String(q.calls).padStart(8)} llam · total ${String(q.ms_total).padStart(11)} ms`);
    linea(`          ${q.consulta}`);
  }
  reporte.topPorMedio = porMedio;
}

// ── ③ CUÁNTOS DATOS HAY DE VERDAD ──────────────────────────────────────────
linea('\n③ EL TAMAÑO REAL (post-purga de sondas de S92)\n');

const tablas = await sql(
  `SELECT c.relname AS tabla,
          c.reltuples::bigint            AS filas_estimadas,
          pg_total_relation_size(c.oid)  AS bytes_total,
          pg_relation_size(c.oid)        AS bytes_tabla,
          pg_indexes_size(c.oid)         AS bytes_indices,
          (SELECT count(*) FROM pg_index i WHERE i.indrelid = c.oid) AS n_indices
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r'
    ORDER BY pg_total_relation_size(c.oid) DESC
    LIMIT 30;`,
  'perf-tablas',
);
linea('   tabla                                 filas~     total     tabla   índices  #idx');
for (const t of tablas) {
  linea(
    `   ${t.tabla.padEnd(36)} ${String(t.filas_estimadas).padStart(8)} ${humano(t.bytes_total).padStart(9)} ${humano(t.bytes_tabla).padStart(9)} ${humano(t.bytes_indices).padStart(9)} ${String(t.n_indices).padStart(5)}`,
  );
}
reporte.tablas = tablas;

const totalDb = await sql(
  `SELECT pg_database_size(current_database()) AS bytes;`,
  'perf-dbsize',
);
linea(`\n   BASE ENTERA: ${humano(totalDb[0].bytes)}`);
reporte.tamanoBase = Number(totalDb[0].bytes);

// ── ④ EL PISO DE RED ───────────────────────────────────────────────────────
linea('\n④ EL PISO — latencia desde esta máquina (ninguna cura baja de acá)\n');

const pisoRest = await cronometrar(() => rest('/rest/v1/cat_especies?select=id&limit=1'), {
  veces: 15,
  calentar: 3,
  rotulo: 'PostgREST · lectura trivial de catálogo',
});
linea(`   PostgREST (lectura trivial):  p50 ${pisoRest.p50} ms · p95 ${pisoRest.p95} ms  (min ${pisoRest.min} / max ${pisoRest.max})`);

const pisoAuth = await cronometrar(() => fetch(`${process.env.SUPABASE_URL ?? ''}`).catch(() => null), {
  veces: 1,
  calentar: 0,
  rotulo: 'ignorado',
});
void pisoAuth;

reporte.piso = pisoRest;

linea(`\n   ⚠️  Este p50 es el PISO de una lectura sin trabajo: TLS + pooler + ida y vuelta.`);
linea(`      Toda consulta de la app paga esto ANTES de hacer nada. Una pantalla que`);
linea(`      dispara 20 peticiones paga ${r1(pisoRest.p50 * 20)} ms solo en idas y vueltas,`);
linea(`      aunque cada consulta fuera instantánea.\n`);

const p = guardarPerf('b0-linea-base.json', reporte);
linea(`   ── línea base guardada: ${p}\n`);
