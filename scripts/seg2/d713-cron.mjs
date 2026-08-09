/**
 * D-713 · paso 2 — EL CRON MANDA EL SECRETO.
 *
 * ── EL ORDEN IMPORTA, y es lo único delicado de esta cura ───────────────────
 * Primero el CRON, después el DEPLOY. Así:
 *   · ahora: el job manda el header y la function VIEJA lo ignora → sin daño;
 *   · después del deploy: la function nueva lo exige y el job ya lo manda.
 * Al revés habría una ventana de ~1 minuto con el push caído, y el push es el
 * canal que el founder gateó en dispositivo.
 *
 * Se reescribe SOLO el job #8 (`despachar-push-tick`), agregando una clave al
 * `jsonb_build_object` de headers. El #6 (correo) **no se toca**: llama a
 * `despachar-correo`, que no está en esta cura.
 *
 * El secreto se lee del scratchpad (fuera del repo) y **no se imprime**.
 */
import { readFileSync } from 'node:fs';
import { sql, guardarSeg2, huella, linea } from './lib-seg2.mjs';

const secreto = readFileSync(
  '/private/tmp/claude-501/-Users-guillo381gmail-com-proyectos-ePetPlace-e-petplace/54d5cc9f-58fb-44a3-bbfb-fe9d556a7d77/scratchpad/despacho-secret.txt',
  'utf8',
).trim();

linea('\n══ D-713 · paso 2 — EL CRON MANDA EL SECRETO ══\n');
linea(`  secreto a inyectar: ${huella(secreto)}`);

const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bHRpcHFzY2RzZHN4bmpjbGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDMxMDYsImV4cCI6MjA5MjM3OTEwNn0.kvHD9-JvaGytu0a7kAwgTyVXExrhIaGg1Z8_-99SOxA';

const comando = `
  SELECT net.http_post(
    url     := 'https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/despachar-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-despacho-secret', '${secreto}',
      'Authorization', 'Bearer ${ANON}'),
    body    := '{"origen":"pg_cron"}'::jsonb
  );
`;

const SQL = `
SELECT cron.alter_job(job_id := 8, command := $cmd$${comando}$cmd$);
SELECT jobid, jobname, active,
       (command LIKE '%x-despacho-secret%') AS manda_secreto,
       (command LIKE '%despachar-push%') AS sigue_apuntando_bien
FROM cron.job WHERE jobid = 8;`;

const r = await sql(SQL, 'd713-cron');
linea(`\n  job #${r[0].jobid} «${r[0].jobname}» · activo=${r[0].active}`);
linea(`     ¿manda el header del secreto? ...... ${r[0].manda_secreto ? '✅ SÍ' : '🔴 NO'}`);
linea(`     ¿sigue apuntando a despachar-push? . ${r[0].sigue_apuntando_bien ? '✅ SÍ' : '🔴 NO'}`);

// el job #6 no se toca — se verifica que quedó igual
const seis = await sql(
  `SELECT jobid, active, (command LIKE '%despachar-correo%') AS intacto FROM cron.job WHERE jobid=6`,
  'd713-seis',
);
linea(`\n  job #6 (correo) intacto: ${seis[0].intacto ? '✅' : '🔴'} · activo=${seis[0].active}`);

guardarSeg2('d713-cron-despues.json', { job8: r[0], job6: seis[0] });
linea('');
