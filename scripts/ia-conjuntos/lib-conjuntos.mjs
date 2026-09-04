/**
 * S113-E · Piezas compartidas de los conjuntos de prueba.
 *
 * 🔒 **NINGUNA CLAVE VIVE ACÁ, NI EN NINGÚN ARCHIVO DEL REPO.** La
 * `service_role` se resuelve EN EJECUCIÓN desde el CLI ya autenticado por
 * keychain, y no se imprime nunca — ni en un log, ni en un error.
 *
 * ⚠️ Y una advertencia operativa que costó un incidente: `supabase projects
 * api-keys` **imprime las claves EN CLARO por stdout**. Nunca se corre a mano
 * en una sesión cuyo transcript se guarda. Acá se corre capturando la salida y
 * extrayendo sólo lo necesario.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export const PROJECT_REF = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
export const URL_BASE = `https://${PROJECT_REF}.supabase.co`;

/** La `service_role`, resuelta al momento. Se devuelve, jamás se imprime. */
export function claveServicio() {
  const r = spawnSync('npx', ['supabase', 'projects', 'api-keys', '--project-ref', PROJECT_REF], {
    encoding: 'utf8',
  });
  const i = r.stdout.indexOf('{');
  if (i === -1) throw new Error('no pude leer las api-keys del proyecto (¿CLI sin sesión?)');
  const { keys } = JSON.parse(r.stdout.slice(i));
  const k = keys.find((x) => x.id === 'service_role')?.api_key;
  if (!k) throw new Error('no encontré la service_role. El arnés PARA.');
  // Se verifica el claim, como hace claveAnonDeEnv: correr con la clave
  // equivocada es medir otra cosa con confianza.
  const rol = JSON.parse(Buffer.from(k.split('.')[1], 'base64url').toString('utf8')).role;
  if (rol !== 'service_role') throw new Error(`la clave tiene claim role=${rol}. El arnés PARA.`);
  return k;
}

/** Una consulta de sólo lectura contra la base linkeada. */
export function consultar(sql) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', sql], {
    encoding: 'utf8',
  });
  const i = r.stdout.indexOf('{');
  if (i === -1) throw new Error(`db query sin JSON: ${(r.stderr || r.stdout).slice(0, 300)}`);
  /* 🔴 CURADO EN VIVO (S113-E): esta función DEVOLVÍA `[]` ante un error del
     motor, y un INSERT que rebotaba se veía igual que uno que no insertó nada.
     Costó un diagnóstico entero: la fixture reportó «el trigger no propagó»
     cuando lo que había pasado es que el INSERT nunca corrió (columna
     inexistente). *Una verificación cuyo modo de falla es el silencio no es
     una verificación.* Ahora el error del motor se lee y se lanza. */
  if (r.stdout.includes('"_tag":"Error"') || r.stdout.includes('Failed to run sql query')) {
    throw new Error(`db query RECHAZADA: ${r.stdout.slice(i, i + 500)}`);
  }
  // El CLI puede pegar un segundo objeto JSON (telemetría). Se corta el primero.
  const crudo = r.stdout.slice(i);
  let prof = 0, enTexto = false, esc = false, fin = -1;
  for (let j = 0; j < crudo.length; j += 1) {
    const c = crudo[j];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { enTexto = !enTexto; continue; }
    if (enTexto) continue;
    if (c === '{') prof += 1;
    else if (c === '}') { prof -= 1; if (prof === 0) { fin = j + 1; break; } }
  }
  return JSON.parse(crudo.slice(0, fin === -1 ? undefined : fin)).rows ?? [];
}

/** Descarga un objeto de Storage con service_role. Devuelve Buffer o null. */
export async function bajarObjeto(bucket, path, clave) {
  const url = `${URL_BASE}/storage/v1/object/${bucket}/${encodeURI(path)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${clave}`, apikey: clave } });
  if (!r.ok) return null;
  return Buffer.from(await r.arrayBuffer());
}

/**
 * Dónde vive el conjunto. **FUERA de todo lo que se commitea.**
 * `.ia-conjuntos/` está en `.gitignore` — el conjunto lleva rutas de fotos de
 * carnets reales y nombres de veterinarios reales, y eso no entra al repo ni
 * por accidente.
 */
export const DIR_CONJUNTOS = process.env.IA_CONJUNTOS_DIR ?? '.ia-conjuntos';
