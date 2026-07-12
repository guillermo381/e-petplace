// Asserts imperativos S56-B (TAREA 4) — obtenerComisionVigenteCita contra
// DB viva con la sesión demo (regla 47 / L-114). SOLO LECTURA: cero
// escrituras, cero limpieza necesaria. El valor esperado (15, default de
// plataforma) es la seed de fee_configs relevada literal en esta sesión:
// actor prestador_servicios · EC · transaccional · cita · {pct: 15}.
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  cerrarSesion,
  obtenerComisionVigenteCita,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
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

// T1 — sin sesión: error tipado, jamás un número
const sinSesion = await obtenerComisionVigenteCita();
check(!sinSesion.ok && sinSesion.codigo === 'sin_sesion', 'T1 sin sesión → sin_sesion');

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

// T2 — con la sesión demo del prestador: el fee vigente se lee del dato
const comision = await obtenerComisionVigenteCita();
check(comision.ok, 'T2 obtenerComisionVigenteCita responde ok', comision.ok ? '' : `${comision.codigo}: ${comision.mensaje}`);
if (comision.ok) {
  check(comision.data.porcentaje === 15, 'T2b porcentaje = 15 (la seed EC/cita, leída — no hardcodeada en el app)', `porcentaje=${comision.data.porcentaje}`);
  check(comision.data.esDefault === true, 'T2c esDefault = true (fee de plataforma, la cuenta demo no tiene fee negociado)', `esDefault=${comision.data.esDefault}`);
  const neto = 20 * (1 - comision.data.porcentaje / 100);
  check(Math.abs(neto - 17) < 1e-9, 'T2d neto de $20 con el dato = $17.00 (la cuenta que hace la UI)', `neto=${neto}`);
}

await cerrarSesion();
console.log(fallos === 0 ? '\nTODO VERDE (4/4 + guard)' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
