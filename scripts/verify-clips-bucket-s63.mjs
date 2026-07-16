// Asserts S63-B (tanda corta, cola de clips) — el BUCKET real y el
// paso 2 tipado, contra DB viva con sesión demo. El ciclo pleno
// subir+registrar exige atención EN CURSO (mañana, gate founder) —
// hoy se prueba lo probable: policies del bucket (path por prestador)
// y el rebote tipado del registro. LIMPIEZA por path, 0 residuos.
import { readFileSync } from 'node:fs';
import {
  initApi,
  getClient,
  iniciarSesion,
  cerrarSesion,
  obtenerMiPrestador,
  registrarClipAdiestramiento,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

let fallos = 0;
const check = (cond, nombre, detalle = '') => {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
};

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ sin sesión demo');
  process.exit(1);
}
const prestador = await obtenerMiPrestador();
if (!prestador.ok) process.exit(1);
const prestadorId = prestador.data.id;
const cliente = getClient();
const BUCKET = 'adiestramiento-clips';

// T1 — subir a la carpeta PROPIA pasa (policy insert por split_part)
const path = `${prestadorId}/clip-adiestramiento-verify-${Date.now()}.mp4`;
const bytes = new Uint8Array(24).fill(7);
const up = await cliente.storage.from(BUCKET).upload(path, bytes, { contentType: 'video/mp4', upsert: false });
check(up.error === null, 'T1 subida a carpeta propia', up.error?.message ?? path);

// T2 — subir a carpeta AJENA rebota (el path pattern es la policy)
const upAjeno = await cliente.storage
  .from(BUCKET)
  .upload(`00000000-0000-4000-8000-000000000000/intruso-${Date.now()}.mp4`, bytes, { contentType: 'video/mp4' });
check(upAjeno.error !== null, 'T2 carpeta ajena rebota', upAjeno.error === null ? 'PASÓ (mal)' : 'rechazada');

// T3 — el paso 2 con atención inexistente rebota TIPADO
const reg = await registrarClipAdiestramiento({
  adiestramiento_id: '00000000-0000-4000-8000-00000000dead',
  storage_path: path,
  orden: 1,
  duracion_segundos: 20,
});
check(
  !reg.ok && reg.codigo === 'atencion_adiestramiento_no_existe',
  'T3 registro sin atención rebota tipado',
  reg.ok ? 'REGISTRÓ (mal)' : reg.codigo,
);

// ── LIMPIEZA por path + verificación ──
const del = await cliente.storage.from(BUCKET).remove([path]);
check(del.error === null, 'L1 objeto de prueba borrado', del.error?.message ?? '');
const lista = await cliente.storage.from(BUCKET).list(prestadorId);
check(
  lista.error === null && !(lista.data ?? []).some((o) => `${prestadorId}/${o.name}` === path),
  'L2 cero residuos en el bucket',
);

await cerrarSesion();
console.log(fallos === 0 ? '\nASSERTS BUCKET CLIPS: 0 fallos' : `\nASSERTS: ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
