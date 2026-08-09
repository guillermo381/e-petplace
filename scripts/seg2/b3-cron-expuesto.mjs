/**
 * S92-BIS · B3 — ¿QUIÉN PUEDE LEER LOS COMANDOS DEL CRON?
 *
 * Los dos jobs de despacho llevan la credencial **escrita en el texto del
 * comando** (`Authorization: Bearer <clave>`). Eso es normal y no sería grave
 * si `cron.job` fuera privada — pero el censo de S92 vio dos policies
 * `cron_job_policy [ALL] {public}` y `cron_job_run_details_policy [ALL]
 * {public}`, y `{public}` incluye a `anon`.
 *
 * **Si un anónimo puede leer `cron.job`, puede leer todo lo que los comandos
 * lleven adentro.** Hoy es la anon key (pública, no importa); mañana puede ser
 * un secret — y quien lo escriba ahí no va a saber que lo está publicando.
 *
 * Se mide por camino real y por catálogo. NO cura.
 */
import { sql, rest, tokenDe, guardarSeg2, linea } from './lib-seg2.mjs';
import { readFileSync } from 'node:fs';

const filas = [];
const anotar = (id, obtenido, ok) => {
  filas.push({ id, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(46)} ${obtenido}`);
};

linea('\n══ B3 · ¿ESTÁN EXPUESTOS LOS COMANDOS DEL CRON? ══\n');

// ── ① las policies y los grants sobre cron.job ────────────────────────────
const pol = await sql(
  `SELECT schemaname, tablename, policyname, cmd, roles::text AS roles
   FROM pg_policies WHERE schemaname='cron' ORDER BY tablename, policyname`,
  'cron-pol',
);
linea('  policies del schema `cron`:');
for (const p of pol) linea(`     · ${p.tablename}.${p.policyname} [${p.cmd}] ${p.roles}`);

const grants = await sql(
  `SELECT grantee, table_name, privilege_type
   FROM information_schema.role_table_grants
   WHERE table_schema='cron' AND grantee IN ('anon','authenticated','PUBLIC')
   ORDER BY table_name, grantee`,
  'cron-grants',
);
linea(`\n  grants de cron.* a roles de cliente: ${grants.length}`);
const porTabla = {};
for (const g of grants) (porTabla[`${g.table_name}·${g.grantee}`] ??= []).push(g.privilege_type);
for (const [k, v] of Object.entries(porTabla)) linea(`     · ${k}: ${v.join(', ')}`);
anotar('grants de cron.* a anon/authenticated', `${grants.length} grants`, grants.length === 0);

// ── ② el camino real: ¿el schema `cron` está expuesto por PostgREST? ──────
const env = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const t = await tokenDe(
  env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim(),
  env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim(),
);
for (const [rotulo, opts] of [
  ['anónimo', {}],
  ['autenticado', { token: t }],
]) {
  const r = await rest('/rest/v1/job?select=jobname,command&limit=2', opts);
  const expuesto = r.status === 200 && !/does not exist|PGRST/.test(r.cuerpo);
  anotar(`${rotulo} lee cron.job por PostgREST`, `HTTP ${r.status} · ${r.cuerpo.slice(0, 80)}`, !expuesto);
}

// ── ③ ¿qué credenciales llevan los comandos, y de qué tipo? ──────────────
const jobs = await sql(`SELECT jobid, jobname, command FROM cron.job ORDER BY jobid`, 'cron-jobs');
linea('\n  credenciales EMBEBIDAS en los comandos del cron:');
let conJwt = 0;
for (const j of jobs) {
  const m = String(j.command).match(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/);
  if (!m) continue;
  conJwt++;
  let role = '(no parseable)';
  try {
    role = JSON.parse(Buffer.from(m[0].split('.')[1], 'base64').toString('utf8')).role;
  } catch {
    /* ignora */
  }
  const alarma = role === 'service_role' ? '🔴🔴' : '  ';
  linea(`     ${alarma} job #${j.jobid} «${j.jobname}» → JWT con role=«${role}» (largo ${m[0].length}, …${m[0].slice(-4)})`);
}
anotar('jobs con JWT embebido', `${conJwt} de ${jobs.length}`, true);
anotar(
  'ninguno lleva service_role',
  jobs.every((j) => !/"role":"service_role"/.test(Buffer.from(String(j.command).match(/eyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)/)?.[1] ?? '', 'base64').toString('utf8')))
    ? 'ninguno'
    : '⚠️ alguno',
  true,
);

guardarSeg2('b3-cron.json', { policies: pol, grants, jobsConJwt: conJwt });
const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} rojas ──\n`);
