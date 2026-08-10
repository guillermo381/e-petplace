/**
 * 🔴 D-710 · BORRADO DE LOS 27 SIN DUEÑO — por la STORAGE API.
 *
 * ⚠️ EL PRIMER INTENTO FUE POR SQL Y SUPABASE LO FRENÓ, con razón:
 *   `42501: Direct deletion from storage tables is not allowed. Use the Storage
 *    API instead. HINT: This prevents accidental data loss from orphaned objects.`
 * Un trigger (`storage.protect_delete`) protege contra exactamente esto. *Un
 * DELETE en `storage.objects` habría dejado el blob vivo en el backend y la
 * referencia muerta — o sea el huérfano al revés.* Se va por la puerta buena.
 *
 * ── R6: LA LLAVE NO SE TRANSCRIBE ───────────────────────────────────────────
 * El `service_role` se lee del `.env` en memoria y viaja solo en el header.
 * **Nunca se imprime, ni se guarda, ni entra al JSON de salida.**
 *
 * ── ALCANCE ESTRICTO ────────────────────────────────────────────────────────
 * Solo objetos que cumplen LAS DOS condiciones: ninguna fila los referencia
 * **y** su carpeta no es de ningún prestador ni usuario vivo. **Los 56 con
 * dueño vivo no se tocan** — y se verifica al final que siguen ahí.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { URL, linea, guardarSeg2 } from './lib-seg2.mjs';

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

const CONDICION = `
  o.bucket_id = 'prestador-documentos'
  AND NOT EXISTS (SELECT 1 FROM prestador_documentos d WHERE d.archivo_url LIKE '%' || o.name)
`;
const SIN_DUENNO = `
  AND NOT EXISTS (SELECT 1 FROM prestadores p WHERE p.id::text = split_part(o.name,'/',1))
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = split_part(o.name,'/',1))
`;

linea('\n══ D-710 · borrado de los huérfanos SIN DUEÑO ══\n');

const objetivos = sql(
  `SELECT o.name, (o.metadata->>'size')::bigint AS bytes FROM storage.objects o WHERE ${CONDICION} ${SIN_DUENNO};`,
);
const totalAntes = sql(
  `SELECT count(*) AS n FROM storage.objects WHERE bucket_id='prestador-documentos';`,
)[0].n;
const conDuenoAntes = sql(
  `SELECT count(*) AS n FROM storage.objects o WHERE ${CONDICION}
     AND (EXISTS (SELECT 1 FROM prestadores p WHERE p.id::text = split_part(o.name,'/',1))
       OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = split_part(o.name,'/',1)));`,
)[0].n;

const mb = objetivos.reduce((a, o) => a + Number(o.bytes ?? 0), 0) / 1048576;
linea(`  ANTES · bucket: ${totalAntes} objeto(s)`);
linea(`        · a borrar (sin dueño): ${objetivos.length} · ${mb.toFixed(1)} MB`);
linea(`        · con dueño vivo (NO se tocan): ${conDuenoAntes}`);

if (objetivos.length === 0) {
  linea('\n  nada que borrar.\n');
  process.exit(0);
}

// La Storage API borra por lotes de prefijos exactos.
const r = await fetch(`${URL}/storage/v1/object/prestador-documentos`, {
  method: 'DELETE',
  headers: {
    apikey: SERVICE,
    Authorization: `Bearer ${SERVICE}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ prefixes: objetivos.map((o) => o.name) }),
});
const cuerpo = await r.json().catch(() => null);
linea(`\n  DELETE por Storage API → HTTP ${r.status} · ${Array.isArray(cuerpo) ? `${cuerpo.length} borrado(s)` : ''}`);

const totalDespues = sql(
  `SELECT count(*) AS n FROM storage.objects WHERE bucket_id='prestador-documentos';`,
)[0].n;
const sinDuenoDespues = sql(
  `SELECT count(*) AS n FROM storage.objects o WHERE ${CONDICION} ${SIN_DUENNO};`,
)[0].n;
const conDuenoDespues = sql(
  `SELECT count(*) AS n FROM storage.objects o WHERE ${CONDICION}
     AND (EXISTS (SELECT 1 FROM prestadores p WHERE p.id::text = split_part(o.name,'/',1))
       OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = split_part(o.name,'/',1)));`,
)[0].n;

linea(`\n  DESPUÉS · bucket: ${totalDespues} objeto(s)  (antes ${totalAntes})`);
linea(`          · sin dueño restantes: ${sinDuenoDespues}  ${sinDuenoDespues === 0 ? '✅' : '🔴'}`);
linea(
  `          · con dueño vivo: ${conDuenoDespues}  ${conDuenoDespues === conDuenoAntes ? '✅ INTACTOS' : '🔴 SE TOCARON — revisar'}`,
);

guardarSeg2('d710-borrado.json', {
  totalAntes,
  totalDespues,
  borrados: objetivos.length,
  mb: Number(mb.toFixed(1)),
  conDuenoAntes,
  conDuenoDespues,
  sinDuenoDespues,
});
linea('');
