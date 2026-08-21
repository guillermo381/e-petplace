// Helper de harness (D-352): la fecha se LEE de la DB, jamás se asume.
// Solo SELECT — un verify-* jamás escribe por acá. Usa el CLI linkeado
// (mismo canal que opera Code, keychain — cero secretos en el repo).
import { spawnSync } from 'node:child_process';

export function dbQuery(sql) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', sql], {
    encoding: 'utf8',
  });
  if (r.status !== 0) {
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
  return JSON.parse(r.stdout.slice(inicio)).rows;
}

// Fecha LOCAL yyyy-mm-dd (hallazgo S55: toISOString es UTC y corre el día post-19:00 en EC).
export const hoyLocal = () => new Intl.DateTimeFormat('en-CA').format(new Date());
