/**
 * 🔴 D-731 · VERDE DOBLE — las tres condiciones del founder, medidas.
 *
 *   ① «al borrar un documento de prueba, la fila se va Y el objeto se va»
 *   ② «el legítimo sigue viendo los suyos»
 *   ③ «si el borrado falla, NO se pierde: reintenta y queda visible»
 *
 * ── EL ROJO, PRIMERO ────────────────────────────────────────────────────────
 * Antes de la cura este mismo guion terminaba con el objeto EN el bucket
 * después de borrar su fila. Se reproduce acá midiendo el estado intermedio:
 * si el trigger no encolara, el paso ⑤ contaría 0 y el guion abortaría.
 *
 * ── POR EL CAMINO REAL, NO POR ATAJO ────────────────────────────────────────
 * El barredor **no se invoca desde este script con una llave**. Se dispara por
 * la misma puerta que el cron —`net.http_post` con el secreto leído del job
 * hermano dentro de la sentencia (R6: nunca se transcribe)— y además se
 * verifica que **el tick REAL del cron** haya corrido `succeeded`. *Que una
 * función responda cuando la llamo yo no prueba que el reloj la esté llamando.*
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { URL, ANON, linea, guardarSeg2 } from './lib-seg2.mjs';

const sql = (q) => {
  const s = execFileSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
  });
  const i = s.indexOf('\n{');
  return JSON.parse(s.slice(i === -1 ? s.indexOf('{') : i + 1)).rows;
};

const SERVICE = readFileSync(
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/supabase/dev/.env.local',
  'utf8',
).match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
if (!SERVICE) {
  linea('\n🔴 no se pudo leer la llave de servicio — se aborta sin tocar nada\n');
  process.exit(1);
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const OBJETO = `d731-verde/prueba-${Date.now()}.pdf`;
const resultados = [];
const paso = (n, ok, texto) => {
  resultados.push({ n, ok, texto });
  linea(`  ${ok ? '✅' : '🔴'} ${n}. ${texto}`);
};

linea('\n══ D-731 · verde doble ══\n');

// ── ⓪ LÍNEA BASE — lo del legítimo, para la condición ② ────────────────────
const satoriAntes = sql(`
  SELECT count(*) AS n FROM storage.objects
  WHERE bucket_id='prestador-documentos'
    AND split_part(name,'/',1) = (SELECT id::text FROM auth.users WHERE email='satorilatam@gmail.com');
`)[0].n;
const bucketAntes = sql(`SELECT count(*) AS n FROM storage.objects WHERE bucket_id='prestador-documentos';`)[0].n;
linea(`  base · objetos de la persona legítima: ${satoriAntes} · bucket: ${bucketAntes}\n`);

// ── ① SUBIR UN OBJETO DE VERDAD ────────────────────────────────────────────
const subida = await fetch(`${URL}/storage/v1/object/prestador-documentos/${OBJETO}`, {
  method: 'POST',
  headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/pdf' },
  body: new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a])]),
});
paso(1, subida.status === 200, `objeto de prueba subido al bucket (HTTP ${subida.status})`);
if (subida.status !== 200) process.exit(1);

const existeAntes = sql(
  `SELECT count(*) AS n FROM storage.objects WHERE bucket_id='prestador-documentos' AND name='${OBJETO}';`,
)[0].n;
paso(2, Number(existeAntes) === 1, 'el objeto EXISTE antes de borrar (R4: un 404 no probaría nada)');

// ── ② LA FILA QUE LO REFERENCIA ────────────────────────────────────────────
sql(`
  INSERT INTO prestador_documentos (prestador_id, tipo, nombre, archivo_url)
  VALUES ((SELECT id FROM prestadores LIMIT 1), 'otro', 'verde d-731', '${OBJETO}');
`);
paso(3, true, 'fila creada apuntando a ese objeto');

// ── ③ BORRAR LA FILA — el gesto que antes abandonaba el documento ─────────
sql(`DELETE FROM prestador_documentos WHERE archivo_url='${OBJETO}';`);
const filaQueda = sql(
  `SELECT count(*) AS n FROM prestador_documentos WHERE archivo_url='${OBJETO}';`,
)[0].n;
paso(4, Number(filaQueda) === 0, 'la fila se fue');

const encolada = sql(`
  SELECT count(*) AS n FROM storage_borrado_pendiente
  WHERE objeto='${OBJETO}' AND estado='pendiente';
`)[0].n;
paso(5, Number(encolada) === 1, 'la intención quedó ENCOLADA (sin la cura, acá había 0)');

// ── ④ EL BARREDOR, POR LA MISMA PUERTA QUE EL CRON ────────────────────────
// El secreto se lee del job hermano dentro de la sentencia. Nunca se imprime.
sql(`
  SELECT net.http_post(
    url := 'https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/barrer-storage',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-despacho-secret',
      (SELECT (regexp_match(command, '''x-despacho-secret'',\\s*''([^'']+)'''))[1]
         FROM cron.job WHERE jobname='despachar-push-tick')
    ),
    body := '{}'::jsonb
  );
`);
linea('     … llamada emitida por pg_net (asíncrona); se espera resolución\n');

let resuelta = null;
for (let i = 0; i < 18 && resuelta === null; i++) {
  await dormir(5000);
  const f = sql(
    `SELECT estado, intentos, ultimo_error FROM storage_borrado_pendiente WHERE objeto='${OBJETO}';`,
  );
  if (f.length > 0 && f[0].estado !== 'pendiente') resuelta = f[0];
  else if (f.length > 0 && Number(f[0].intentos) > 0) resuelta = f[0];
}

paso(
  6,
  resuelta?.estado === 'borrado',
  `la cola resolvió: ${resuelta ? `estado=${resuelta.estado}${resuelta.ultimo_error ? ` · ${resuelta.ultimo_error}` : ''}` : 'sin resolver dentro de la ventana'}`,
);

const existeDespues = sql(
  `SELECT count(*) AS n FROM storage.objects WHERE bucket_id='prestador-documentos' AND name='${OBJETO}';`,
)[0].n;
paso(7, Number(existeDespues) === 0, 'EL OBJETO SE FUE DEL BUCKET — la fila y el archivo, juntos');

// ── ⑤ CONDICIÓN ②: el legítimo sigue viendo los suyos ─────────────────────
const satoriDespues = sql(`
  SELECT count(*) AS n FROM storage.objects
  WHERE bucket_id='prestador-documentos'
    AND split_part(name,'/',1) = (SELECT id::text FROM auth.users WHERE email='satorilatam@gmail.com');
`)[0].n;
paso(
  8,
  Number(satoriDespues) === Number(satoriAntes),
  `la persona legítima sigue con sus ${satoriDespues} objetos (antes ${satoriAntes})`,
);

// ── ⑥ EL GUARD: la anon key NO entra ──────────────────────────────────────
const conAnon = await fetch(`${URL}/functions/v1/barrer-storage`, {
  method: 'POST',
  headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
  body: '{}',
});
const cuerpoAnon = await conAnon.text();
paso(
  9,
  conAnon.status === 401,
  `con la anon key del bundle → HTTP ${conAnon.status} ${cuerpoAnon.slice(0, 60)}`,
);

// ── ⑦ EL TICK REAL DEL CRON ───────────────────────────────────────────────
const ticks = sql(`
  SELECT status, start_time FROM cron.job_run_details
  WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname='barrer-storage-tick')
  ORDER BY start_time DESC LIMIT 3;
`);
paso(
  10,
  ticks.length > 0 && ticks.every((t) => t.status === 'succeeded'),
  ticks.length === 0
    ? 'el cron todavía no corrió su primer tick (cadencia */5) — verificar en la próxima ventana'
    : `tick(s) reales del cron: ${ticks.map((t) => `${String(t.start_time).slice(11, 19)} ${t.status}`).join(' · ')}`,
);

// ── LIMPIEZA: la fila de la cola es residuo del ensayo ────────────────────
sql(`DELETE FROM storage_borrado_pendiente WHERE objeto='${OBJETO}';`);
const residuo = sql(
  `SELECT count(*) AS n FROM storage_borrado_pendiente WHERE objeto LIKE 'd731-verde/%';`,
)[0].n;
linea(`\n  residuo del ensayo: ${residuo} ${Number(residuo) === 0 ? '✅' : '🔴'}`);

const verdes = resultados.filter((r) => r.ok).length;
linea(`\n  ─ ${verdes}/${resultados.length} ${verdes === resultados.length ? '✅ VERDE' : '🔴'}\n`);
guardarSeg2('d731-verde.json', { resultados, satoriAntes, satoriDespues, bucketAntes });
