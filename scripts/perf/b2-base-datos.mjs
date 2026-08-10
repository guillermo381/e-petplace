/**
 * S94-PERF · B1 — LA BASE DE DATOS.
 *
 * B0 ya dijo algo incómodo para la hipótesis con la que se abre toda sesión de
 * performance: **ninguna consulta de la app aparece entre las caras.** Las de
 * arriba son el poller de Realtime y la introspección del dashboard. Este
 * bloque va a buscar lo que igual habría que mirar aunque el podio estuviera
 * ocupado por otros: recorridos secuenciales, índices que nadie usa, funciones
 * volátiles en policies, y el reparto real entre red y trabajo.
 *
 * ── LA PREGUNTA QUE CONTESTA (R4) ──────────────────────────────────────────
 * «¿Hay algo en la base que, curado, se sienta?» — no «¿hay algo mejorable?».
 * Un índice sobre una tabla de 72 filas es mejorable y no se siente.
 */

import { sql, rest, linea, guardarPerf, cronometrar, humano, r1, URL as SUPA } from './lib-perf.mjs';

const rep = {};
linea('\n══════════════════════════════════════════════════════════════');
linea('  S94-PERF · B1 — LA BASE DE DATOS');
linea('══════════════════════════════════════════════════════════════\n');

// ── ① ¿ALGUNA TABLA SE RECORRE ENTERA, Y ESO CUESTA? ───────────────────────
linea('① RECORRIDOS SECUENCIALES (sobre tablas que justifiquen un índice)\n');
const seq = await sql(
  `SELECT relname AS tabla, seq_scan, seq_tup_read, idx_scan,
          n_live_tup AS filas,
          CASE WHEN seq_scan > 0 THEN round((seq_tup_read::numeric / seq_scan), 0) ELSE 0 END AS filas_por_recorrido
     FROM pg_stat_user_tables
    WHERE schemaname='public' AND seq_scan > 0
    ORDER BY seq_tup_read DESC
    LIMIT 15;`,
  'perf-seq',
);
linea('   tabla                              filas   seq_scan   filas/scan   idx_scan');
for (const t of seq) {
  linea(
    `   ${t.tabla.padEnd(34)} ${String(t.filas).padStart(6)} ${String(t.seq_scan).padStart(10)} ${String(t.filas_por_recorrido).padStart(12)} ${String(t.idx_scan ?? 0).padStart(10)}`,
  );
}
rep.seq = seq;
const grandes = seq.filter((t) => Number(t.filas) > 5000);
linea(
  `\n   ⇒ tablas con >5.000 filas recorridas enteras: ${grandes.length === 0 ? '**NINGUNA**' : grandes.map((t) => t.tabla).join(', ')}`,
);
linea('     Un recorrido de 150 filas cuesta menos que abrir un índice. Acá el');
linea('     dato manda sobre la intuición: esta base es CHICA.\n');

// ── ② ÍNDICES QUE NADIE USA (cuestan escritura y espacio) ──────────────────
linea('② ÍNDICES SIN UN SOLO ESCANEO\n');
const idx = await sql(
  `SELECT s.relname AS tabla, s.indexrelname AS indice, s.idx_scan,
          pg_relation_size(s.indexrelid) AS bytes,
          i.indisunique AS es_unico
     FROM pg_stat_user_indexes s
     JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.schemaname='public' AND s.idx_scan = 0
    ORDER BY pg_relation_size(s.indexrelid) DESC;`,
  'perf-idx',
);
const bytesIdx = idx.reduce((a, x) => a + Number(x.bytes), 0);
const noUnicos = idx.filter((x) => x.es_unico === false || x.es_unico === 'false');
linea(`   ${idx.length} índices con 0 escaneos · ${humano(bytesIdx)} en total`);
linea(`   de esos, ${noUnicos.length} NO son únicos (los únicos se conservan: sostienen una regla, no una lectura)`);
for (const x of noUnicos.slice(0, 15)) linea(`   · ${x.tabla}.${x.indice} — ${humano(x.bytes)}`);
rep.indicesSinUso = idx;
linea('\n   ⚠️ FRENO 1: borrarlos NO se hace en esta sesión. Un índice sin escaneos');
linea('      puede servir a un camino estacional (un cierre mensual, un informe)');
linea('      que la ventana de medición no vio. Se censa y se declara.\n');

// ── ③ FUNCIONES VOLÁTILES EN POLICIES (el sospechoso de S92) ───────────────
linea('③ VOLATILIDAD DE LOS HELPERS DE POLICY\n');
const vol = await sql(
  `SELECT p.proname,
          CASE p.provolatile WHEN 'i' THEN 'IMMUTABLE' WHEN 's' THEN 'STABLE' ELSE 'VOLATILE' END AS volatilidad,
          (SELECT count(*) FROM pg_policies pol
            WHERE COALESCE(pol.qual,'') LIKE '%'||p.proname||'%'
               OR COALESCE(pol.with_check,'') LIKE '%'||p.proname||'%') AS policies
     FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND p.proname IN ('is_admin','es_mi_prestador','prestador_activo','user_tiene_acceso_a_mascota','empleado_tiene_rol','user_acceso_clinico_a_mascota')
    ORDER BY 3 DESC;`,
  'perf-vol',
);
for (const v of vol) {
  const marca = v.volatilidad === 'VOLATILE' && Number(v.policies) > 0 ? '🔴' : '  ';
  linea(`   ${marca} ${v.proname.padEnd(32)} ${v.volatilidad.padEnd(10)} en ${String(v.policies).padStart(4)} policies`);
}
rep.volatilidad = vol;
linea('\n   Una función VOLATILE en un `USING` se re-evalúa **por fila**; una STABLE');
linea('   se puede cachear dentro de la consulta. Con 72 mascotas la diferencia');
linea('   no se siente; con 72.000 sí. **Es deuda de escala, no de hoy** — y su');
linea('   cura toca policies de seguridad ⇒ FRENO declarado, la firma es del founder.\n');

// ── ④ EL REPARTO: ¿RED O TRABAJO? ──────────────────────────────────────────
linea('④ EL REPARTO ENTRE RED Y TRABAJO\n');

const soloTls = await cronometrar(
  async () => {
    await fetch(`${SUPA}/rest/v1/`, { method: 'HEAD' }).catch(() => null);
  },
  { veces: 10, calentar: 3, rotulo: 'HEAD a la raíz de PostgREST (sin consulta)' },
);
const trivial = await cronometrar(() => rest('/rest/v1/cat_especies?select=id&limit=1'), {
  veces: 10,
  calentar: 3,
  rotulo: 'lectura de 1 fila de catálogo',
});
const pesada = await cronometrar(
  () => rest('/rest/v1/cat_razas?select=id,nombre,especie_id&limit=200'),
  { veces: 10, calentar: 3, rotulo: 'lectura de 200 filas con 3 columnas' },
);

linea(`   HEAD sin consulta        p50 ${soloTls.p50} ms`);
linea(`   1 fila de catálogo       p50 ${trivial.p50} ms   (+${r1(trivial.p50 - soloTls.p50)} ms de trabajo)`);
linea(`   200 filas × 3 columnas   p50 ${pesada.p50} ms   (+${r1(pesada.p50 - soloTls.p50)} ms de trabajo)`);
rep.reparto = { soloTls, trivial, pesada };
linea(`\n   ⇒ De los ~${trivial.p50} ms de una lectura típica, **${r1((soloTls.p50 / trivial.p50) * 100)} % es ir y volver**.`);
linea('     El trabajo de la base es ruido al lado del viaje. Esto decide la sesión:');
linea('     **no hay nada que optimizar en las consultas — hay viajes que eliminar.**\n');

// ── ⑤ EL TECHO (B4) ────────────────────────────────────────────────────────
linea('⑤ EL TECHO — cuántas conexiones y cuánto margen\n');
const conn = await sql(
  `SELECT current_setting('max_connections') AS max_conn,
          (SELECT count(*) FROM pg_stat_activity) AS en_uso,
          (SELECT count(*) FROM pg_stat_activity WHERE state='active') AS activas,
          (SELECT count(*) FROM pg_stat_activity WHERE state='idle') AS ociosas;`,
  'perf-conn',
);
linea(`   max_connections: ${conn[0].max_conn} · en uso: ${conn[0].en_uso} (activas ${conn[0].activas} / ociosas ${conn[0].ociosas})`);
const porApp = await sql(
  `SELECT COALESCE(application_name,'(sin nombre)') AS app, count(*) AS n
     FROM pg_stat_activity GROUP BY 1 ORDER BY 2 DESC LIMIT 10;`,
  'perf-conn-app',
);
for (const a of porApp) linea(`   · ${String(a.app).padEnd(34)} ${a.n}`);
rep.conexiones = { ...conn[0], porApp };

const cache = await sql(
  `SELECT round(100.0 * sum(blks_hit) / NULLIF(sum(blks_hit)+sum(blks_read),0), 2) AS pct_cache
     FROM pg_stat_database WHERE datname = current_database();`,
  'perf-cache',
);
linea(`\n   Aciertos de caché: ${cache[0].pct_cache} %  (bajo 95 % la base estaría leyendo de disco)`);
rep.cache = cache[0].pct_cache;

guardarPerf('b2-base-datos.json', rep);
linea('\n   ── guardado en scripts/perf/salida/b2-base-datos.json\n');
