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

/**
 * La `service_role`, resuelta al momento. Se devuelve, **jamás se imprime**.
 *
 * ── 🔴 LO QUE ESTA FUNCIÓN HACÍA Y POR QUÉ SE CURÓ (D-1013) ────────────────
 * La primera versión —la escribí yo en el lote 0, antes de que la ficha
 * existiera— corría `npx supabase projects api-keys`. Ese comando **imprime la
 * `anon` Y la `service_role` en texto plano por stdout**. Acá la salida se
 * capturaba, así que no llegaba al transcript; pero el riesgo no es teórico:
 * **cualquier rama de error que imprimiera `r.stdout` para diagnosticar
 * filtraba las dos claves**, y una función que sólo es segura mientras nadie
 * agregue un `console.log` no es segura: es afortunada.
 *
 * Ahora la clave sale del **llavero**, donde ya viven las otras siete de esta
 * casa (`epetplace-siembra-s97`, `epetplace-despacho-secret`, …), y **nunca
 * transita por la salida de ningún proceso**.
 *
 * ── Y SI NO ESTÁ, PARA. No cae de vuelta al comando viejo ──────────────────
 * *Un respaldo silencioso al camino inseguro convierte la cura en decoración:
 * el día que el llavero no tenga la entrada, el arnés volvería solo a la línea
 * prohibida y nadie se enteraría.* Por eso el mensaje trae el comando exacto.
 */
export function claveServicio() {
  const delLlavero = spawnSync('security',
    ['find-generic-password', '-a', 'medicion', '-s', 'epetplace-service-role', '-w'],
    { encoding: 'utf8' }).stdout.trim();
  const clave = delLlavero || (process.env.EPETPLACE_SERVICE_ROLE ?? '').trim();

  if (!clave) {
    throw new Error(
      'sin `service_role` en el llavero. El arnés PARA — NO cae al comando viejo.\n' +
      '  Guardala UNA vez (la lee el llavero, no la escribe ningún archivo del repo):\n' +
      '    security add-generic-password -a medicion -s epetplace-service-role -w \'<clave>\'\n' +
      '  (o exportá EPETPLACE_SERVICE_ROLE para una corrida suelta).');
  }

  /* El claim se verifica SIEMPRE, venga de donde venga: correr con la clave
     equivocada es medir otra cosa con confianza. Es el mismo control que tenía
     la versión vieja — lo que cambió es de dónde sale la clave, no qué se
     comprueba de ella. */
  let rol;
  try {
    rol = JSON.parse(Buffer.from(clave.split('.')[1], 'base64url').toString('utf8')).role;
  } catch {
    throw new Error('la clave guardada no es un JWT legible. El arnés PARA.');
  }
  if (rol !== 'service_role') throw new Error(`la clave tiene claim role=${rol}, no service_role. El arnés PARA.`);
  return clave;
}

/**
 * La `anon`, leída del repo y **verificada por su claim**.
 *
 * Es PÚBLICA por diseño —viaja en cada bundle publicado y ya vive commiteada
 * en migraciones y scripts de cron—, así que leerla de ahí no filtra nada. Lo
 * que evita es el motivo real de D-1013: **el único comando que la entregaba
 * también volcaba la `service_role` por stdout**. Se pedía una clave pública y
 * salían las dos.
 */
export function claveAnon() {
  const fuente = 'scripts/seg2/d713-cron.mjs';
  const m = readFileSync(fuente, 'utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  if (!m) throw new Error(`no encontré la anon en ${fuente}. El arnés PARA.`);
  const rol = JSON.parse(Buffer.from(m[0].split('.')[1], 'base64url').toString('utf8')).role;
  if (rol !== 'anon') throw new Error(`la clave de ${fuente} tiene role=${rol}, no anon. El arnés PARA.`);
  return m[0];
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
