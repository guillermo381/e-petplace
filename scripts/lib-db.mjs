// Helper de harness (D-352): la fecha se LEE de la DB, jamás se asume.
// Solo SELECT — un verify-* jamás escribe por acá. Usa el CLI linkeado
// (mismo canal que opera Code, keychain — cero secretos en el repo).
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export function dbQuery(sql) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', sql], {
    encoding: 'utf8',
  });
  /* 🔴 S110-A · UN TIMEOUT DE TELEMETRÍA HACÍA FALLAR UNA CONSULTA QUE RESPONDIÓ.
     Medido: el CLI imprime las filas y DESPUÉS sale con `exit 1` y
     `"Timeout while shutting down PostHog"`. *El dato estaba en la caja y el
     helper lo tiraba* — mismo modo de falla que S102-B curó un piso más
     arriba, y por eso se cura igual: se mira el CONTENIDO, no el código.
     ⚠️ ACOTADO A PROPÓSITO: sólo se perdona **ese** error y **sólo** si las
     filas se pudieron parsear. Cualquier otro exit≠0 sigue lanzando — *un
     helper que perdona todo exit≠0 deja de ser un instrumento.* */
  const soloTelemetria =
    r.status !== 0 &&
    /Timeout while shutting down PostHog/.test(`${r.stdout}${r.stderr}`) &&
    r.stdout.includes('"rows"');

  if (r.status !== 0 && !soloTelemetria) {
    /* 🔴 S102-B — ESTA LÍNEA DECÍA `(r.stderr || r.stdout || '')` Y ESCONDÍA LA
       CAUSA DE TODOS LOS FALLOS. Medido: el CLI manda a `stderr` un `npm warn`
       fijo (~200 chars) y **el error de Postgres va a `stdout`** ⇒ el `||`
       tomaba siempre la primera fuente, que nunca está vacía, y el slice de 400
       se llenaba de ruido de npm. **Un verify que falla decía «npm warn Unknown
       project config» en vez de `42703: column "creado_en" does not exist`.**
       *El diagnóstico venía en la caja y el helper lo tiraba.*
       ⚠️ Medido después de curar, para no prometer de más: se recuperan **el
       código SQLSTATE, el nombre del identificador y la línea**. El `HINT` del
       motor —que a veces trae el nombre correcto— **sigue cayendo fuera del
       corte**, porque el JSON viene escapado y es largo. Subir el corte es
       barato el día que haga falta; declararlo es lo que evita confiar en un
       dato que no llega.
       Cura: se leen LAS DOS, se saca el ruido conocido, y recién ahí se corta.
       Es estrictamente aditiva — ningún llamador recibe menos que antes. */
    const ruido = /^\s*(npm warn |Initialising login role)/;
    const salida = [r.stderr, r.stdout]
      .filter(Boolean)
      .join('\n')
      .split('\n')
      .filter((l) => l.trim() && !ruido.test(l))
      .join(' ')
      .slice(0, 600);
    throw new Error(`db query falló (exit ${r.status}): ${salida || '(sin salida)'}`);
  }
  const inicio = r.stdout.indexOf('{');
  if (inicio === -1) throw new Error(`db query sin JSON en el output: ${r.stdout.slice(0, 400)}`);
  /* El CLI puede pegar un SEGUNDO objeto JSON después del resultado (el error
     de telemetría de arriba). `JSON.parse` sobre el resto crudo revienta con
     «Unexpected non-whitespace character», que **no dice nada del dato**. Se
     corta en el primer objeto completo, contando llaves fuera de comillas. */
  const crudo = r.stdout.slice(inicio);
  let prof = 0, enTexto = false, escapado = false, fin = -1;
  for (let i = 0; i < crudo.length; i += 1) {
    const ch = crudo[i];
    if (escapado) { escapado = false; continue; }
    if (ch === '\\' && enTexto) { escapado = true; continue; }
    if (ch === '"') { enTexto = !enTexto; continue; }
    if (enTexto) continue;
    if (ch === '{') prof += 1;
    else if (ch === '}') { prof -= 1; if (prof === 0) { fin = i + 1; break; } }
  }
  if (fin === -1) throw new Error(`db query con JSON incompleto: ${crudo.slice(0, 400)}`);
  return JSON.parse(crudo.slice(0, fin)).rows;
}

// Fecha LOCAL yyyy-mm-dd (hallazgo S55: toISOString es UTC y corre el día post-19:00 en EC).
export const hoyLocal = () => new Intl.DateTimeFormat('en-CA').format(new Date());

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * `claveAnonDeEnv()` — LA CLAVE PÚBLICA, VERIFICADA POR SU CLAIM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **Hermana de `claveAnon()` de `scripts/s107/sonda-tocar.mjs` (C, 29-ago).**
 * No es una segunda implementación rival: es el MISMO criterio aplicado a
 * **otra fuente**. Aquella resuelve desde el CLI y cura el *«la primera
 * api_key»*; ésta resuelve desde `.env.local` y cura *«la variable que se
 * llama ANON_KEY»*.
 *
 * ── EL DEFECTO QUE CURA ──────────────────────────────────────────────────
 * **42 scripts de esta casa crean su cliente con una clave elegida por el
 * NOMBRE de la variable.** Hoy el valor de `EXPO_PUBLIC_SUPABASE_ANON_KEY`
 * tiene `role: "anon"` — medido. Pero eso es *cierto por el contenido de un
 * archivo*, no por diseño: el día que alguien pegue ahí una `service_role`
 * para destrabar algo, **todo gate de RLS pasa**.
 *
 * 🔴 **Y su modo de falla es un verde**: ninguna excepción, ninguna línea
 * roja — una medición creíble diciendo *«la familia puede»* sobre alguien que
 * puede todo. *Un arnés que corre con más permisos de los que dice medir no
 * mide lo que dice: mide otra cosa, y con confianza.*
 *
 * ⚠️ **Si el claim no es `anon`, LANZA.** Nunca degrada a «la que haya»: un
 * arnés sin la clave correcta tiene que parar, no seguir con más poder.
 *
 * 🔒 El valor no se imprime nunca — ni acá, ni en el error, ni en un log.
 */
export function claveAnonDeEnv(ruta = 'apps/cliente/.env.local') {
  const texto = readFileSync(ruta, 'utf8');
  const env = Object.fromEntries(
    texto.split('\n').filter((l) => l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
  );
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const jwt = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !jwt) throw new Error(`Falta URL o clave en ${ruta}. El arnés PARA.`);

  const partes = jwt.split('.');
  let rol = null;
  if (partes.length === 3) {
    try {
      rol = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8')).role ?? null;
    } catch { /* no era un JWT legible */ }
  }
  if (rol !== 'anon') {
    /* El mensaje NO lleva ningún fragmento de la clave — solo su claim. */
    throw new Error(
      `La clave de ${ruta} tiene claim role=${JSON.stringify(rol)}, no "anon". ` +
      'El arnés PARA: correr con otra sería medir permisos que la familia no tiene.',
    );
  }
  return { url, anon: jwt };
}
