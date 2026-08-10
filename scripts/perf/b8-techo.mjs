/**
 * S94-PERF · B4 — CUÁNTOS USUARIOS AGUANTA HOY.
 *
 * La prueba de carga contra producción está PROHIBIDA (freno 2). Lo que sí se
 * puede hacer sin tocar nada es aritmética honesta sobre lo ya medido, con los
 * supuestos escritos al lado de cada número — porque una estimación cuyo
 * supuesto no se ve es indistinguible de una invención.
 *
 * Se calculan DOS techos, porque son dos cosas distintas y la app choca contra
 * el más bajo:
 *   ① el techo de CONEXIONES (cuántas sesiones simultáneas caben)
 *   ② el techo de TRABAJO (cuánta CPU de base consume una sesión típica)
 */

import { sql, linea, guardarPerf, r1 } from './lib-perf.mjs';

const rep = {};
linea('\n══════════════════════════════════════════════════════════════');
linea('  S94-PERF · B4 — EL TECHO');
linea('══════════════════════════════════════════════════════════════\n');

// ── ① CONEXIONES ───────────────────────────────────────────────────────────
const c = (
  await sql(
    `SELECT current_setting('max_connections')::int AS maximo,
            (SELECT count(*) FROM pg_stat_activity) AS en_uso,
            (SELECT count(*) FROM pg_stat_activity WHERE backend_type='client backend') AS de_clientes;`,
    'perf-t1',
  )
)[0];
linea('① CONEXIONES\n');
linea(`   máximo: ${c.maximo} · en uso ahora: ${c.en_uso} (de clientes: ${c.de_clientes})`);
linea(`   margen: ${c.maximo - c.en_uso} conexiones libres`);
linea('');
linea('   ⚠️ Y acá está lo que hace que este número NO sea el techo de usuarios:');
linea('     las apps NO abren una conexión por usuario. Hablan por PostgREST, que');
linea('     mantiene un pool chico y lo comparte entre TODAS las peticiones. Mil');
linea('     usuarios con la app abierta y sin tocar nada consumen CERO conexiones.');
linea('     **Lo que consume es la petición, no la persona.**');
rep.conexiones = c;

// ── ② TRABAJO ──────────────────────────────────────────────────────────────
const t = (
  await sql(
    `SELECT round(sum(total_exec_time)::numeric / 1000, 0) AS seg_totales,
            sum(calls) AS llamadas,
            round(EXTRACT(EPOCH FROM (now() - (SELECT stats_reset FROM pg_stat_statements_info)))::numeric, 0) AS ventana_seg
       FROM pg_stat_statements;`,
    'perf-t2',
  )
)[0];
const ocupacion = Number(t.seg_totales) / Number(t.ventana_seg);
linea('\n② TRABAJO — cuánta base se está usando de verdad\n');
linea(`   ventana medida: ${r1(Number(t.ventana_seg) / 86400)} días`);
linea(`   tiempo de consulta acumulado: ${t.seg_totales} s sobre ${t.llamadas} llamadas`);
linea(`   ⇒ ocupación media: **${r1(ocupacion * 100)} % de UN núcleo**, sostenida`);
rep.trabajo = { ...t, ocupacion };

// Lo que cuesta una petición de la app, no del dashboard ni de Realtime.
const app = (
  await sql(
    `SELECT round(avg(mean_exec_time)::numeric, 2) AS ms_medio,
            sum(calls) AS llamadas
       FROM pg_stat_statements
      WHERE query LIKE '%pgrst%';`,
    'perf-t3',
  )
)[0];
linea(`\n   coste medio de UNA petición de la app (las de PostgREST): ${app.ms_medio} ms de base`);
rep.appMedio = app;

// ── ③ LA ARITMÉTICA, CON SUS SUPUESTOS A LA VISTA ──────────────────────────
const PETICIONES_SESION = 60; // supuesto declarado, ver abajo
const msPorSesion = Number(app.ms_medio) * PETICIONES_SESION;
const SEGUNDOS_SESION = 180; // supuesto declarado
const concurrentes = (1000 * SEGUNDOS_SESION) / msPorSesion;

linea('\n③ LA CUENTA\n');
linea('   SUPUESTOS, declarados para que se puedan discutir:');
linea(`   · una sesión de usuario dispara ~${PETICIONES_SESION} peticiones (del censo de focos:`);
linea('     el HOY solo son 28, y el recorrido típico abre 3-4 pantallas más)');
linea(`   · una sesión dura ~${SEGUNDOS_SESION} s de uso activo`);
linea(`   · cada petición cuesta ${app.ms_medio} ms de base (medido, no supuesto)`);
linea(`   · se toma UN núcleo de capacidad útil y se reserva la mitad de margen`);
linea('');
linea(`   trabajo de base por sesión: ${r1(msPorSesion)} ms`);
linea(`   ⇒ caben ~${Math.round(concurrentes)} sesiones simultáneas antes de saturar un núcleo`);
linea(`   ⇒ con la mitad reservada de margen: **~${Math.round(concurrentes / 2)} usuarios concurrentes**`);
linea('');
linea('   ⚠️ ESTO NO ES UNA MEDICIÓN, ES UNA ESTIMACIÓN — y su número más frágil');
linea('     es el de peticiones por sesión, que sale de un censo estático. La');
linea('     prueba de carga real sigue sin correr (freno 2) y su guion queda');
linea('     escrito en el acta.');
linea('');
linea('   ⚠️ Y EL TECHO QUE VA A APARECER PRIMERO NO ES ÉSTE. Con esta base —87 MB,');
linea('     100 % de aciertos de caché, cero tabla que se recorra entera— el límite');
linea('     no lo pone el servidor: lo pone **la cantidad de viajes por pantalla**,');
linea('     que castiga al usuario mucho antes de que la base transpire.');
rep.estimacion = { PETICIONES_SESION, SEGUNDOS_SESION, msPorSesion, concurrentes };

// ── ④ LO QUE NO SE PUEDE VERIFICAR DESDE ACÁ (R5) ──────────────────────────
linea('\n④ LO QUE NO SE PUDO MEDIR, y por eso va ROJO y no verde (R5)\n');
linea('   · Los BACKUPS diarios: no son visibles por SQL ni por la anon key. Se');
linea('     verifican en el panel del proyecto (Database → Backups) y **eso es del');
linea('     founder**. Queda declarado como pendiente, no como verificado.');
linea('   · El plan del proyecto (NANO) y sus recursos: el panel los dice; desde');
linea(`     acá solo se ve su consecuencia (max_connections=${c.maximo}).`);

guardarPerf('b8-techo.json', rep);
linea('\n   ── guardado en scripts/perf/salida/b8-techo.json\n');
