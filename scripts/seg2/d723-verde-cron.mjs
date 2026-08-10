/**
 * 🔴 D-723 · EL VERDE QUE IMPORTA — el tick REAL del cron después del deploy.
 *
 * Que la puerta rebote al desconocido es la mitad; la otra es **que el correo
 * siga saliendo**. Un guard que cierra para todos —incluido el cron— sería
 * peor que el agujero: apagaría el canal sin que nadie se entere.
 *
 * Espera a que el job corra (cada minuto) y verifica que su ejecución
 * **posterior al deploy** salió `succeeded`.
 */
import { execFileSync } from 'node:child_process';
import { linea, guardarSeg2 } from './lib-seg2.mjs';

const sql = (q) => {
  const salida = execFileSync(
    'npx',
    ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 8 },
  );
  // ⚠️ La salida trae ruido antes del JSON («Initialising login role…», avisos
  // de npm). Se corta desde la PRIMERA llave de objeto, no desde un literal
  // que puede cambiar de forma entre versiones del CLI.
  const i = salida.indexOf('\n{');
  return JSON.parse(salida.slice(i === -1 ? salida.indexOf('{') : i + 1)).rows;
};

linea('\n══ D-723 · el tick REAL del cron tras el deploy ══\n');
linea('  esperando ~75 s a que el job 6 corra al menos una vez…');
await new Promise((r) => setTimeout(r, 75000));

const filas = sql(
  `SELECT status, start_time::text AS cuando, left(coalesce(return_message,''),80) AS mensaje
   FROM cron.job_run_details WHERE jobid = 6
   ORDER BY start_time DESC LIMIT 4;`,
);

for (const f of filas) {
  linea(`  ${f.status === 'succeeded' ? '✅' : '🔴'} ${f.cuando} · ${f.status} ${f.mensaje}`);
}

const ok = filas.length > 0 && filas[0].status === 'succeeded';
linea(
  ok
    ? '\n  ⇒ el tick más reciente salió **succeeded** DESPUÉS de la cura: el correo sigue saliendo.'
    : '\n  🔴 el tick no salió succeeded — la cura habría apagado el canal. REVISAR.',
);
guardarSeg2('d723-verde-cron.json', filas);
linea('');
