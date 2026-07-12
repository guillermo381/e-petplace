// Asserts imperativos S56-B (ACTO 2) — precio_plan por la puerta única:
// escribir, leer, quitar (null), y el rechazo tipado. El valor del seed se
// RESTAURA al baseline exacto al final — 0 residuos.
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  cerrarSesion,
  obtenerMiPrestador,
  obtenerOfertasPaseoPropias,
  actualizarOfertaPaseo,
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

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

const prestador = await obtenerMiPrestador();
if (!prestador.ok) process.exit(1);
const ofertas = await obtenerOfertasPaseoPropias(prestador.data.id);
check(ofertas.ok && ofertas.data.length > 0, 'T1 hay ofertas del demo');
if (!ofertas.ok || ofertas.data.length === 0) process.exit(1);
const oferta = ofertas.data[0];
const baseline = oferta.precioPlan; // se restaura al final
console.log(`  (oferta ${oferta.duracionMinutos}' · precioPlan baseline = ${baseline === null ? 'null' : baseline})`);

// T2 — escribir un precio de plan
const setear = await actualizarOfertaPaseo({ id: oferta.id, precioPlan: 12.5 });
check(setear.ok && setear.data.precioPlan === 12.5, 'T2 escribir precioPlan 12.50 por RLS owner', setear.ok ? '' : setear.mensaje);

// T3 — releer por la puerta de lectura
const relectura = await obtenerOfertasPaseoPropias(prestador.data.id);
check(
  relectura.ok && relectura.data.find((o) => o.id === oferta.id)?.precioPlan === 12.5,
  'T3 la lectura trae el plan escrito',
);

// T4 — rechazo tipado: 0 no es precio de plan (vacío sí, cero no)
const cero = await actualizarOfertaPaseo({ id: oferta.id, precioPlan: 0 });
check(!cero.ok && cero.codigo === 'precio_plan_invalido', 'T4 precioPlan 0 → precio_plan_invalido');

// T5 — quitar el plan: null explícito
const quitar = await actualizarOfertaPaseo({ id: oferta.id, precioPlan: null });
check(quitar.ok && quitar.data.precioPlan === null, 'T5 precioPlan null = sin plan en el bloque');

// T6 — restaurar el baseline exacto (0 residuos)
const restaurar = await actualizarOfertaPaseo({ id: oferta.id, precioPlan: baseline });
check(restaurar.ok && restaurar.data.precioPlan === baseline, 'T6 baseline restaurado — cero residuos');

await cerrarSesion();
console.log(fallos === 0 ? '\nTODO VERDE (6/6)' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
