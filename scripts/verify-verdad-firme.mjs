// Assert imperativo de VERDAD FIRME (S51-B3.2, test 8) contra DB viva:
// un día del prestador demo con citas firmes Y no-firmes mezcladas — el
// wrapper debe devolver SOLO las firmes. Sesión demo real (D-290),
// credenciales de .env.local. D-352: el día y los conteos esperados se
// LEEN de la DB (antes anclaba '2026-07-07' y "2 de 3" en duro).
import { readFileSync } from 'node:fs';
import { initApi, iniciarSesion, obtenerMiPrestador, obtenerCitasPaseoDelDia } from '../packages/api/src/index.ts';
import { dbQuery } from './lib-db.mjs';

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
// El día del assert se LEE de la DB (D-352): el mejor disponible — con
// firmes Y no-firmes mezcladas si existe (ejercita el filtro entero); si
// no, el día con más citas (ejercita conteo exacto y cero tentativas).
const dias = dbQuery(
  `SELECT fecha::text AS fecha,
          count(*) FILTER (WHERE estado IN ('confirmada','en_curso','completada','no_show'))::int AS firmes,
          count(*)::int AS total
     FROM evento_cita_servicio
    WHERE prestador_id='${prestador.data.id}' AND tipo_servicio='paseo'
    GROUP BY fecha
   HAVING count(*) FILTER (WHERE estado IN ('confirmada','en_curso','completada','no_show')) > 0
    ORDER BY (count(*) > count(*) FILTER (WHERE estado IN ('confirmada','en_curso','completada','no_show'))) DESC,
             count(*) DESC, fecha
    LIMIT 1`,
);
if (dias.length === 0) {
  console.log('✗ PRECONDICIÓN (D-352): el prestador demo no tiene ningún día con citas firmes — el assert no aplica hoy.');
  process.exit(2);
}
const { fecha, firmes, total } = dias[0];
if (total === firmes) {
  console.log(`(aviso honesto: el día ${fecha} no tiene citas no-firmes en DB — el filtrado de tentativas no se ejercita, solo el conteo exacto)`);
}
const r = await obtenerCitasPaseoDelDia({ prestador_id: prestador.data.id, fecha });
if (!r.ok) {
  console.log('✗ wrapper falló:', r.mensaje);
  process.exit(1);
}
const estados = r.data.map((c) => c.estado).sort();
const sinTentativas = estados.every((e) => ['confirmada', 'en_curso', 'completada', 'no_show'].includes(e));
const soloFirmes = r.data.length === firmes;
console.log(`día leído de DB: ${fecha} (${total} citas, ${firmes} firmes) — estados devueltos: ${JSON.stringify(estados)}`);
console.log(`${sinTentativas ? '✓' : '✗ FALLO'} ninguna cita tentativa pasa el filtro`);
console.log(`${soloFirmes ? '✓' : '✗ FALLO'} devuelve exactamente las ${firmes} firmes`);
process.exit(sinTentativas && soloFirmes ? 0 : 1);
