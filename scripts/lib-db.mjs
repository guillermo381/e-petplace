// Helper de harness (D-352): la fecha se LEE de la DB, jamás se asume.
// Solo SELECT — un verify-* jamás escribe por acá. Usa el CLI linkeado
// (mismo canal que opera Code, keychain — cero secretos en el repo).
import { spawnSync } from 'node:child_process';

export function dbQuery(sql) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', sql], {
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    throw new Error(`db query falló (exit ${r.status}): ${(r.stderr || r.stdout || '').slice(0, 400)}`);
  }
  const inicio = r.stdout.indexOf('{');
  if (inicio === -1) throw new Error(`db query sin JSON en el output: ${r.stdout.slice(0, 400)}`);
  return JSON.parse(r.stdout.slice(inicio)).rows;
}

// Fecha LOCAL yyyy-mm-dd (hallazgo S55: toISOString es UTC y corre el día post-19:00 en EC).
export const hoyLocal = () => new Intl.DateTimeFormat('en-CA').format(new Date());
