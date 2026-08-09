/**
 * D-713 · paso 3 — EL VERDE DOBLE.
 *
 * BRAZO ① el ajeno REBOTA (con y sin anon key — la anon key es pública, así
 *          que tenerla no puede ser suficiente).
 * BRAZO ② el LLAMADOR LEGÍTIMO PASA — y acá el llamador es el cron, así que no
 *          alcanza con probar un curl con el secreto: hay que verificar que
 *          **el tick real siga entregando**. Se mira `cron.job_run_details`.
 */
import { readFileSync } from 'node:fs';
import { sql, guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';

const secreto = readFileSync(
  '/private/tmp/claude-501/-Users-guillo381gmail-com-proyectos-ePetPlace-e-petplace/54d5cc9f-58fb-44a3-bbfb-fe9d556a7d77/scratchpad/despacho-secret.txt',
  'utf8',
).trim();

const filas = [];
const anotar = (id, obtenido, ok) => {
  filas.push({ id, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(50)} ${obtenido}`);
};

async function llamar(slug, headers) {
  const r = await fetch(`${URL}/functions/v1/${slug}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ origen: 'seg2-verde' }),
  });
  return { status: r.status, cuerpo: (await r.text()).slice(0, 140) };
}

linea('\n══ D-713 · VERDE DOBLE ══\n');
linea('BRAZO ① — el ajeno REBOTA\n');
for (const slug of ['despachar-push', 'despachar-whatsapp']) {
  const sinNada = await llamar(slug, {});
  anotar(`${slug} · sin ninguna credencial`, `HTTP ${sinNada.status} · ${sinNada.cuerpo.slice(0, 60)}`, sinNada.status === 401);

  const conAnon = await llamar(slug, { apikey: ANON, Authorization: `Bearer ${ANON}` });
  anotar(`${slug} · CON la anon key del bundle`, `HTTP ${conAnon.status} · ${conAnon.cuerpo.slice(0, 60)}`, conAnon.status === 401);

  const secretoMalo = await llamar(slug, { 'x-despacho-secret': 'no-es-el-secreto' });
  anotar(`${slug} · con un secreto EQUIVOCADO`, `HTTP ${secretoMalo.status}`, secretoMalo.status === 401);
}

linea('\nBRAZO ② — el llamador legítimo PASA\n');
for (const slug of ['despachar-push', 'despachar-whatsapp']) {
  const ok = await llamar(slug, { 'x-despacho-secret': secreto });
  anotar(`${slug} · con el secreto correcto`, `HTTP ${ok.status} · ${ok.cuerpo.slice(0, 70)}`, ok.status === 200);
}

linea('\nBRAZO ②bis — Y EL QUE DE VERDAD IMPORTA: ¿el TICK sigue entregando?\n');
{
  // el job corre cada minuto; se espera a que pase uno y se lee su resultado
  linea('  esperando un tick del cron (hasta 80 s)…');
  const inicio = new Date();
  let corridas = [];
  for (let i = 0; i < 16; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    corridas = await sql(
      `SELECT status, return_message, start_time::text AS cuando
       FROM cron.job_run_details
       WHERE jobid = 8 AND start_time > now() - interval '3 minutes'
       ORDER BY start_time DESC LIMIT 3`,
      'd713-runs',
    );
    if (corridas.some((c) => new Date(c.cuando) > inicio)) break;
  }
  const nuevas = corridas.filter((c) => new Date(c.cuando) > inicio);
  if (nuevas.length === 0) {
    anotar('tick del cron tras la cura', '⚠️ no se observó ninguna corrida nueva en la ventana', false);
    for (const c of corridas) linea(`       (previa) ${c.cuando?.slice(0, 19)} · ${c.status} · ${String(c.return_message).slice(0, 60)}`);
  } else {
    for (const c of nuevas) {
      anotar(`tick del cron · ${c.cuando?.slice(11, 19)}`, `status=${c.status} · ${String(c.return_message ?? '').slice(0, 60)}`, c.status === 'succeeded');
    }
  }
}

guardarSeg2('d713-verde.json', filas);
const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} rojas ──`);
if (rojos.length) for (const r of rojos) linea(`   🔴 ${r.id}: ${r.obtenido}`);
linea('');
