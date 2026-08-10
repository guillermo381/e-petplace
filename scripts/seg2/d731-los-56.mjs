/**
 * 🔴 D-731 · LOS 56 DOCUMENTOS CON DUEÑO VIVO — la lista para la firma.
 *
 * El founder pidió decidir con datos, no con peso: **agrupado por persona,
 * con cuenta y cantidad, y para cada grupo si esa persona SIGUE SIENDO
 * prestador vigente**. Su criterio, verbatim:
 *   · si NO lo es → se borran, es dato retenido sin razón;
 *   · si SÍ lo es → falta un documento que alguien necesita, y eso es un bug
 *     distinto.
 *
 * ── LO QUE ESTE SCRIPT NO IMPRIME (y es a propósito) ────────────────────────
 * Ni el nombre del archivo, ni su tipo, ni su path completo. **El nombre de un
 * archivo de identidad ES dato del documento** (`cedula-…`, `titulo_…`): dice
 * qué papel tiene esa persona. Se cuenta y se agrupa; no se transcribe.
 *
 * La carpeta del bucket es el **`user_id` del que subió**, NO el `prestador_id`
 * — medido en la vuelta anterior, y es la razón por la que el primer JOIN con
 * `prestadores` dio cero y pareció que los 56 no eran de nadie.
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

linea('\n══ D-731 · los 56 huérfanos con dueño vivo, por persona ══\n');

const grupos = sql(`
  WITH huerfanos AS (
    SELECT split_part(o.name, '/', 1) AS carpeta,
           count(*) AS docs,
           sum((o.metadata->>'size')::bigint) AS bytes,
           min(o.created_at) AS primero,
           max(o.created_at) AS ultimo
    FROM storage.objects o
    WHERE o.bucket_id = 'prestador-documentos'
      AND NOT EXISTS (
        SELECT 1 FROM prestador_documentos d WHERE d.archivo_url = o.name
      )
    GROUP BY 1
  )
  SELECT
    h.carpeta, h.docs, h.bytes, h.primero, h.ultimo,
    u.email,
    (u.id IS NOT NULL) AS cuenta_viva,
    p.id            AS prestador_id,
    p.nombre_comercial,
    p.estado        AS estado_prestador,
    (SELECT count(*) FROM prestador_documentos d WHERE d.prestador_id = p.id) AS docs_con_fila
  FROM huerfanos h
  LEFT JOIN auth.users u  ON u.id::text = h.carpeta
  LEFT JOIN prestadores p ON p.user_id  = u.id
  ORDER BY h.docs DESC;
`);

let vigentes = 0;
let noVigentes = 0;
const informe = [];

for (const g of grupos) {
  // «Vigente» = la fila existe y su `estado` es 'activo'. Los dos valores que
  // hoy tiene la columna son `activo` y `en_revision`; medidos, no supuestos.
  const esPrestador = g.prestador_id !== null;
  const vigente = esPrestador && g.estado_prestador === 'activo';
  if (vigente) vigentes += Number(g.docs);
  else noVigentes += Number(g.docs);

  const marca = vigente
    ? '🟠 VIGENTE            '
    : esPrestador
      ? '⚪ prestador NO activo'
      : '⚪ no es prestador    ';
  linea(
    `  ${marca} ${String(g.docs).padStart(2)} doc(s) · ${(Number(g.bytes ?? 0) / 1048576).toFixed(1)} MB · ${g.email ?? '(sin cuenta)'}`,
  );
  linea(
    `      ${esPrestador ? `negocio=${String(g.nombre_comercial).slice(0, 30)} · estado=${g.estado_prestador} · activo=${g.prestador_activo} · docs con fila=${g.docs_con_fila}` : 'esa cuenta no tiene fila en `prestadores`'}`,
  );
  linea(`      subidos entre ${String(g.primero).slice(0, 10)} y ${String(g.ultimo).slice(0, 10)}`);

  informe.push({
    email: g.email,
    docs: Number(g.docs),
    mb: Number((Number(g.bytes ?? 0) / 1048576).toFixed(1)),
    es_prestador: esPrestador,
    vigente,
    estado_prestador: g.estado_prestador,
    docs_con_fila: g.docs_con_fila === null ? null : Number(g.docs_con_fila),
    primero: g.primero,
    ultimo: g.ultimo,
  });
}

linea('');
linea(`  ─ de prestador VIGENTE (activo):        ${vigentes} doc(s)  ⇒ falta la fila: bug distinto`);
linea(`  ─ de quien NO es prestador vigente:     ${noVigentes} doc(s)  ⇒ dato retenido sin razón`);

guardarSeg2('d731-los-56.json', informe);
linea('');
