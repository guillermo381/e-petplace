// Asserts imperativos S67 (D-430) — obtenerCitasActivasMascota contra
// DB viva con la sesión demo (regla 47 / L-114). SOLO LECTURA: cero
// escrituras, cero limpieza necesaria. La RLS es la puerta: la mascota
// ajena devuelve VACÍO (invisible), jamás filas ni error.
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  cerrarSesion,
  obtenerCitasActivasMascota,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

// Zeus DEMO (familia de la sesión demo, relevado vivo: 1 cita activa).
// NOTA DECLARADA: la sesión demo ES el prestador Andres — por
// mascota_acceso_prestador (otorgamiento por cita confirmada) VE las
// mascotas reales que atiende; eso es diseño, no fuga. El negativo de
// RLS se prueba con una mascota INEXISTENTE (invisible ⇒ vacío).
const ZEUS_DEMO = 'de300000-0000-4000-8000-000000000a5c';
const MASCOTA_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

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

// T1 — la mascota de la familia demo responde con sus citas activas
const r1 = await obtenerCitasActivasMascota(ZEUS_DEMO);
check(r1.ok, 'T1 responde ok', r1.ok ? `${r1.data.length} activas` : r1.mensaje);
if (r1.ok && r1.data.length > 0) {
  const c = r1.data[0];
  check(/^\d{4}-\d{2}-\d{2}$/.test(c.fecha), 'T2 fecha ISO', c.fecha);
  check(c.hora === null || /^\d{2}:\d{2}$/.test(c.hora), 'T3 hora HH:MM o null', String(c.hora));
  check(['firme', 'en_vivo', 'hold'].includes(c.estado), 'T4 estado del contrato', c.estado);
  check(typeof c.prestador_nombre === 'string' && c.prestador_nombre.length > 0,
    'T5 el prestador viaja con nombre (embed RLS pública)', c.prestador_nombre ?? 'null');
  check(c.estado !== 'en_vivo' || c.atencion_id !== null,
    'T6 en_vivo porta atencion_id (o el estado no es en_vivo)');
  const ordenada = r1.data.every((x, i, a) =>
    i === 0 || a[i - 1].fecha < x.fecha || (a[i - 1].fecha === x.fecha && (a[i - 1].hora ?? '') <= (x.hora ?? '')));
  check(ordenada, 'T7 orden fecha/hora ascendente (la primera es la próxima)');
} else if (r1.ok) {
  console.log('· nota: la familia demo no tiene citas activas hoy — shape sin ejercitar (T2..T7 saltados)');
}

// T8 — la mascota invisible/inexistente ⇒ VACÍO honesto (RLS filtra
// filas; el wrapper jamás lo disfraza de error).
const r2 = await obtenerCitasActivasMascota(MASCOTA_INEXISTENTE);
check(r2.ok && r2.data.length === 0, 'T8 mascota invisible ⇒ vacío', r2.ok ? `${r2.data.length}` : r2.mensaje);

await cerrarSesion();
console.log(fallos === 0 ? '\nTODOS LOS ASSERTS VERDES' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
