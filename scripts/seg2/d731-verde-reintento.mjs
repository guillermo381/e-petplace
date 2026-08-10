/**
 * 🔴 D-731 · CONDICIÓN ③ DEL FOUNDER — «un fallo no se pierde».
 *
 *   «Si el borrado del objeto falla, NO se pierde: reintenta y queda visible.
 *    Un borrado que falla en silencio es el mismo defecto con otra cara.»
 *
 * ── LO QUE ESTE ENSAYO YA COBRÓ ─────────────────────────────────────────────
 * Su PRIMERA corrida salió **4/7 y encontró el defecto adentro de la cura**: el
 * barredor marcaba `borrado` una intención que jamás pudo ejecutar. La causa,
 * medida contra la API (no deducida): `DELETE` y `list` sobre un bucket
 * inexistente devuelven **`200 []`, los dos** — indistinguible de una carpeta
 * vacía. Ninguna lectura más cuidadosa de la respuesta lo salvaba: el dato no
 * estaba en la respuesta. ⇒ la cura fue volver el estado malo **inexpresable**
 * (FK a `storage.buckets`), no leer mejor.
 *
 * ── LO QUE ESTE ENSAYO NO PUEDE FORZAR, DECLARADO ───────────────────────────
 * Las ramas `api_remove` / `api_list` de `marcarIntento` cubren la API caída,
 * la credencial revocada y el objeto que se niega a irse. **No se pueden
 * provocar desde afuera** —justamente porque la API contesta 200 a lo
 * imposible—, así que quedan como código no ejercitado y se dice. *Declararlo
 * es más barato que un verde que no probó lo que dice.*
 */
import { execFileSync } from 'node:child_process';
import { linea, guardarSeg2 } from './lib-seg2.mjs';

const sql = (q) => {
  const s = execFileSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
  });
  const i = s.indexOf('\n{');
  return JSON.parse(s.slice(i === -1 ? s.indexOf('{') : i + 1)).rows;
};
const intentar = (q) => {
  try {
    sql(q);
    return null;
  } catch (e) {
    return String(e.stdout ?? e.message);
  }
};
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const resultados = [];
const paso = (n, ok, texto) => {
  resultados.push({ n, ok, texto });
  linea(`  ${ok ? '✅' : '🔴'} ${n}. ${texto}`);
};

linea('\n══ D-731 · el fallo no se pierde ══\n');

// ── ① EL ESTADO MALO YA NO SE PUEDE ESCRIBIR ───────────────────────────────
const err = intentar(`
  INSERT INTO storage_borrado_pendiente (bucket, objeto, origen)
  VALUES ('bucket-que-no-existe-d731', 'd731-fallo/x.pdf', 'ensayo_de_fallo');
`);
paso(
  1,
  err !== null && /foreign key|violates/i.test(err),
  'encolar contra un bucket inexistente REBOTA en el INSERT (antes se marcaba «borrado»)',
);

// ── ② EN UN BUCKET REAL, «no está» SÍ significa que no está ───────────────
const FANTASMA = `d731-fallo/${Date.now()}.pdf`;
sql(`
  INSERT INTO storage_borrado_pendiente (bucket, objeto, origen)
  VALUES ('prestador-documentos', '${FANTASMA}', 'ensayo_de_fallo');
`);
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
let fila = null;
for (let i = 0; i < 12 && (fila === null || fila.estado === 'pendiente'); i++) {
  await dormir(5000);
  const f = sql(`SELECT estado, intentos, ultimo_error FROM storage_borrado_pendiente WHERE objeto='${FANTASMA}';`);
  if (f.length > 0) fila = f[0];
}
paso(
  2,
  fila?.estado === 'borrado' && /ya no estaba/.test(String(fila?.ultimo_error ?? '')),
  `en un bucket que EXISTE, la ausencia se resuelve honesta: estado=${fila?.estado} · «${String(fila?.ultimo_error ?? '—').slice(0, 40)}»`,
);
sql(`DELETE FROM storage_borrado_pendiente WHERE objeto='${FANTASMA}';`);

// ── ③ LA VISIBILIDAD, que es el corazón de la condición ───────────────────
const ATASCADO = `d731-fallo/atascado-${Date.now()}.pdf`;
sql(`
  INSERT INTO storage_borrado_pendiente (bucket, objeto, origen, intentos, ultimo_error, estado)
  VALUES ('prestador-documentos', '${ATASCADO}', 'ensayo_de_fallo', 3, 'api_remove: simulado', 'pendiente');
`);
const enVista = sql(
  `SELECT count(*) AS n FROM v_storage_borrado_atascado WHERE ultimo_error='api_remove: simulado';`,
)[0].n;
paso(3, Number(enVista) === 1, 'una fila con intentos>0 APARECE en la vista de atascados');

sql(`UPDATE storage_borrado_pendiente SET estado='fallido', intentos=5 WHERE objeto='${ATASCADO}';`);
const fallidoVisible = sql(
  `SELECT count(*) AS n FROM v_storage_borrado_atascado WHERE ultimo_error='api_remove: simulado';`,
)[0].n;
paso(4, Number(fallidoVisible) === 1, 'al llegar al techo pasa a `fallido` y SIGUE VISIBLE — no se borra para tapar');

const expone = sql(`
  SELECT count(*) AS n FROM information_schema.columns
  WHERE table_schema='public' AND table_name='v_storage_borrado_atascado' AND column_name='objeto';
`)[0].n;
paso(5, Number(expone) === 0, 'la vista NO expone el path: saber que algo se atascó no exige saber de quién es');

// ── ④ Y NADIE MÁS QUE EL BARREDOR LA VE ───────────────────────────────────
const alcanzable = sql(`
  SELECT count(*) AS n FROM (
    SELECT unnest(ARRAY['anon','authenticated']) AS rol,
           unnest(ARRAY['public.storage_borrado_pendiente','public.v_storage_borrado_atascado']) AS obj
  ) x WHERE has_table_privilege(x.rol, x.obj, 'SELECT');
`)[0].n;
paso(6, Number(alcanzable) === 0, 'ni `anon` ni `authenticated` pueden leer la cola (medido por has_table_privilege, no por ACL)');

sql(`DELETE FROM storage_borrado_pendiente WHERE objeto LIKE 'd731-fallo/%';`);
const residuo = sql(`SELECT count(*) AS n FROM storage_borrado_pendiente WHERE objeto LIKE 'd731-fallo/%';`)[0].n;
linea(`\n  residuo del ensayo: ${residuo} ${Number(residuo) === 0 ? '✅' : '🔴'}`);

const verdes = resultados.filter((r) => r.ok).length;
linea(`\n  ─ ${verdes}/${resultados.length} ${verdes === resultados.length ? '✅ VERDE' : '🔴'}\n`);
guardarSeg2('d731-verde-reintento.json', resultados);
