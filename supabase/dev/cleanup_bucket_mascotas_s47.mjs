// S47-B0.1 — Barrido de los 22 huérfanos del bucket `mascotas`.
// Relevamiento fuente: reporte S47-B0 (23 objetos, 1 solo referenciado).
//
// La key vive en supabase/dev/.env.local (git-ignoreado, verificado con
// git check-ignore — L-130: jamás en repo ni chat). También se acepta por
// env de shell si está seteada.
//   DRY-RUN (default):  node supabase/dev/cleanup_bucket_mascotas_s47.mjs
//   EJECUTAR:           node supabase/dev/cleanup_bucket_mascotas_s47.mjs --ejecutar
//
// El dry-run imprime los 22 paths exactos y NO toca nada. --ejecutar corre
// .remove() y re-inventaría el bucket completo: resultado esperado = 1 objeto
// (la foto real de Zeus). Correr desde la raíz del monorepo.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../packages/api/package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');

const URL_PROYECTO = 'https://zyltipqscdsdsxnjclhp.supabase.co';
const BUCKET = 'mascotas';

// El ÚNICO objeto referenciado (mascotas.foto_url → Zeus, cuenta real del
// founder). Cinturón y tiradores: el script aborta si aparece en la lista.
const PROTEGIDO = '5db3e192-d209-402c-8e80-ef0f1ef93c7c/avatar-1783523261768.jpg';

// Los 22 huérfanos confirmados (#1-22 del reporte S47-B0, orden created_at).
const HUERFANOS = [
  '1f5035ac-476d-4a98-bb80-43a71480fd59/avatar.jpeg',
  '6285f04f-b505-42e4-955b-677f1f0340e3/avatar.jpeg',
  '4707c600-cb04-4e76-99eb-a17d40a2eec5/avatar.jpeg',
  'fd24ab45-789d-44c1-a67c-3c1e2c16035c/avatar.jpeg',
  '884a6e6d-b4ff-4ea5-b8d2-5d330963e9b2/avatar.jpeg',
  '2b266177-5358-4ae2-a960-926bf274be4d/avatar.jpeg',
  'e252947c-93e4-49b2-ae0e-70b63f344264/avatar.jpeg',
  '83e2fe1d-8661-40e6-ac98-10a8cd576b6e/avatar.jpeg',
  '16f07d8d-9a15-4128-8348-c39507f52a94/avatar.jpeg',
  'eb2f8fcb-e66c-4fb1-94b5-d8feff048c13/avatar.jpeg',
  '8765dd06-56a2-4ab0-b5e1-24fcc672a17c/avatar.jpeg',
  'dbf29c96-bf70-4a72-97ef-19ddcaf64a54/avatar.jpeg',
  'c4a6809e-123c-4e55-8b1d-b662802318cb/avatar.jpeg',
  '2adb8c82-9e7f-4225-be03-568f48b0fd06/avatar.jpg',
  'dec1843d-6107-4c54-9831-740d5ddd1749/avatar.jpg',
  'd23c1e3d-aa88-4582-a1ec-2fffb0945f23/avatar.jpg',
  '2badb6c0-2b5a-4ca4-866c-b23c715faf08/avatar.jpg',
  '1d3dd0d9-f7bb-4913-8615-1d8f064fc7f7/avatar-1783465278719.jpg',
  'f909c5a5-70ff-4e89-9a6b-0eb869ee8b22/avatar-diag-1783465408539.jpg',
  '7f794c5e-f8e1-446d-9e69-a17c09014425/avatar-grande-1783465490022.jpg',
  'afe61ba5-5972-4cbe-b002-7502222fea27/avatar-grande-1783465615085.jpg',
  'de56743d-348a-4917-9d4e-f0a27721a344/avatar-grande-1783465846134.jpg',
];

if (HUERFANOS.length !== 22) {
  console.error(`ABORT: la lista tiene ${HUERFANOS.length} paths, se esperaban 22.`);
  process.exit(1);
}
if (HUERFANOS.includes(PROTEGIDO)) {
  console.error('ABORT: el objeto protegido (Zeus) apareció en la lista de borrado.');
  process.exit(1);
}

function leerKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const raw = readFileSync(new URL('./.env.local', import.meta.url), 'utf8');
    const m = raw.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m);
    if (m) return m[1].trim();
  } catch {
    // sin archivo: cae al error de abajo
  }
  return '';
}

const key = leerKey();
if (!key) {
  console.error('Falta la key: pegala en supabase/dev/.env.local (línea SUPABASE_SERVICE_ROLE_KEY=...) — dashboard → Settings → API → service_role.');
  process.exit(1);
}

const supabase = createClient(URL_PROYECTO, key);
const ejecutar = process.argv.includes('--ejecutar');

/** Inventario completo (los paths son siempre <carpeta-uuid>/<archivo>). */
async function inventario() {
  const { data: carpetas, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000 });
  if (error) throw new Error(`inventario (raíz): ${error.message}`);
  const paths = [];
  for (const c of carpetas ?? []) {
    if (c.id !== null) { paths.push(c.name); continue; } // objeto suelto en la raíz
    const { data: archivos, error: e2 } = await supabase.storage.from(BUCKET).list(c.name, { limit: 1000 });
    if (e2) throw new Error(`inventario (${c.name}): ${e2.message}`);
    for (const a of archivos ?? []) paths.push(`${c.name}/${a.name}`);
  }
  return paths.sort();
}

console.log(`Bucket: ${BUCKET} · modo: ${ejecutar ? 'EJECUTAR' : 'DRY-RUN'}`);
console.log(`\nObjetos a borrar (${HUERFANOS.length}):`);
for (const p of HUERFANOS) console.log(`  - ${p}`);
console.log(`\nProtegido (NO se toca): ${PROTEGIDO}`);

const antes = await inventario();
console.log(`\nInventario ANTES: ${antes.length} objetos.`);

if (!ejecutar) {
  console.log('\nDRY-RUN: no se borró nada. Para ejecutar: agregar --ejecutar');
  process.exit(0);
}

const { data: borrados, error: errRemove } = await supabase.storage.from(BUCKET).remove(HUERFANOS);
if (errRemove) {
  console.error(`ERROR en remove(): ${errRemove.message}`);
  process.exit(1);
}
console.log(`\nremove() borró ${borrados?.length ?? 0} objetos.`);

const despues = await inventario();
console.log(`Inventario DESPUÉS (${despues.length} objeto(s)):`);
for (const p of despues) console.log(`  - ${p}`);

if (despues.length === 1 && despues[0] === PROTEGIDO) {
  console.log('\n✓ RESULTADO ESPERADO: queda exactamente 1 objeto y es el de Zeus.');
} else {
  console.error('\n✗ RESULTADO INESPERADO: revisar el inventario de arriba antes de seguir.');
  process.exit(1);
}
