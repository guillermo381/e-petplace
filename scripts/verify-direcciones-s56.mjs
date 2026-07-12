// Asserts imperativos S56-A Tarea 1 — wrappers de dirección del hogar
// (D-339) contra DB viva con la sesión demo (regla 47 / L-114: build
// verde ≠ contrato). ESTADO COMPARTIDO: deja la dirección del hogar del
// user demo con marca [DEMO S56] (útil para los E2E del checkout) y UN
// hold en un slot lejano (próximo sábado 16:30) SIN pagar — expira solo
// en 15 min; imprime el cita_id para la limpieza quirúrgica por id
// (supabase/dev/cleanup_citas_test.sql).
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  obtenerDireccionHogar,
  guardarDireccionHogar,
  crearBloqueoAgenda,
  getClient,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

let fallos = 0;
function check(cond, nombre, detalle = '') {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
}

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

const PREST = 'de300000-0000-4000-8000-0000000000e5';
const SRV   = 'de300000-0000-4000-8000-00000000a5e0';
const MASC  = 'de300000-0000-4000-8000-000000000a5c';

// T1 — guardar la dirección del hogar (con marca DEMO)
const g1 = await guardarDireccionHogar({
  direccion: '[DEMO S56] Av. Siempreviva 742',
  ciudad: 'Quito',
  sector: 'La Floresta',
  referencias: 'Portón azul, timbre 2',
});
check(g1.ok, 'T1 guardarDireccionHogar ok', g1.ok ? g1.data.direccionId : `${g1.codigo}: ${g1.mensaje}`);

// T2 — leerla de vuelta (RLS solo-dueño)
const d1 = await obtenerDireccionHogar();
check(
  d1.ok && d1.data !== null && d1.data.direccion === '[DEMO S56] Av. Siempreviva 742' && d1.data.sector === 'La Floresta',
  'T2 obtenerDireccionHogar devuelve la guardada',
  d1.ok ? JSON.stringify(d1.data) : d1.codigo,
);

// T3 — upsert: guardar de nuevo NO duplica (mismo id)
const g2 = await guardarDireccionHogar({ direccion: '[DEMO S56] Av. Siempreviva 742', ciudad: 'Quito' });
check(
  g1.ok && g2.ok && g2.data.direccionId === g1.data.direccionId,
  'T3 upsert sobre la MISMA fila',
  g2.ok ? g2.data.direccionId : g2.codigo,
);

// T4 — teléfono con '+' rebota tipado (regla 28)
const g3 = await guardarDireccionHogar({ direccion: 'X', ciudad: 'Quito', telefono: '+593991234567' });
check(!g3.ok && g3.codigo === 'telefono_invalido', "T4 teléfono con '+' → telefono_invalido", g3.ok ? 'PUDO' : g3.codigo);

// T5 — el hold de paseo NACE con el snapshot congelado (server-side)
const hoy = new Date();
const sabado = new Date(hoy);
sabado.setDate(hoy.getDate() + ((6 - hoy.getDay() + 7) % 7 || 7));
const FECHA = new Intl.DateTimeFormat('en-CA').format(sabado);
const hold = await crearBloqueoAgenda({ prestador_id: PREST, prestador_servicio_id: SRV, mascota_id: MASC, fecha: FECHA, hora: '16:30' });
check(hold.ok, 'T5 hold en slot lejano ok', hold.ok ? hold.data.cita_id : `${hold.codigo}: ${hold.mensaje}`);

if (hold.ok) {
  const { data, error } = await getClient()
    .from('evento_cita_servicio')
    .select('direccion_snapshot')
    .eq('id', hold.data.cita_id)
    .single();
  const snap = error ? null : data?.direccion_snapshot;
  check(
    snap !== null && typeof snap === 'object' && snap.direccion === '[DEMO S56] Av. Siempreviva 742'
      && 'referencias' in snap && 'lat' in snap && 'lon' in snap && 'ciudad' in snap && 'sector' in snap,
    'T5b direccion_snapshot en la fila de la cita (claves fijas)',
    JSON.stringify(snap),
  );
}

console.log(`\nCITA_TEST_ID=${hold.ok ? hold.data.cita_id : 'NINGUNA'} (hold sin pagar — expira solo; limpieza quirúrgica por id)`);
console.log(fallos === 0 ? 'TODOS LOS ASSERTS PASARON' : `${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
