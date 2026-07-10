// Assert imperativo de VERDAD FIRME (S51-B3.2, test 8) contra DB viva:
// el día 2026-07-07 del prestador demo tiene 3 citas (2 confirmadas con
// atención cerrada + 1 pendiente) — el wrapper debe devolver SOLO las 2
// firmes. Sesión demo real (D-290), credenciales de .env.local.
import { readFileSync } from 'node:fs';
import { initApi, iniciarSesion, obtenerMiPrestador, obtenerCitasPaseoDelDia } from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}
const prestador = await obtenerMiPrestador();
if (!prestador.ok) {
  console.log('✗ sin prestador demo');
  process.exit(1);
}
const r = await obtenerCitasPaseoDelDia({ prestador_id: prestador.data.id, fecha: '2026-07-07' });
if (!r.ok) {
  console.log('✗ wrapper falló:', r.mensaje);
  process.exit(1);
}
const estados = r.data.map((c) => c.estado).sort();
const sinPendiente = !estados.includes('pendiente');
const dosFirmes = r.data.length === 2;
console.log(`estados devueltos: ${JSON.stringify(estados)} (de 3 citas en DB ese día)`);
console.log(`${sinPendiente ? '✓' : '✗ FALLO'} la cita 'pendiente' NO pasa el filtro`);
console.log(`${dosFirmes ? '✓' : '✗ FALLO'} devuelve exactamente las 2 firmes`);
process.exit(sinPendiente && dosFirmes ? 0 : 1);
