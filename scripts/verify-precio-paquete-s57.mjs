// Asserts imperativos S57-B2 — precio_paquete por la puerta única
// (contrato commiteado de la A, 3dabd51 — patrón exacto de
// verify-precio-plan-s56): escribir, leer, quitar (null), y el rechazo
// tipado. El valor del seed se RESTAURA al baseline exacto — 0 residuos.
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
const baseline = oferta.precioPaquete; // se restaura al final

// OJO: sin `??` — el null del contrato es un VALOR (sin paquete), no un
// ausente; `?? undefined` lo pisaba y T4b daba falso rojo.
const releer = async () => {
  const r = await obtenerOfertasPaseoPropias(prestador.data.id);
  if (!r.ok) return 'error_lectura';
  const fila = r.data.find((o) => o.id === oferta.id);
  return fila === undefined ? 'no_encontrada' : fila.precioPaquete;
};

// T2 — escribir un precio por salida y releerlo
const escrito = await actualizarOfertaPaseo({ id: oferta.id, precioPaquete: 4.75 });
check(escrito.ok, 'T2 escribir precioPaquete 4.75', escrito.ok ? '' : escrito.mensaje);
check((await releer()) === 4.75, 'T2b releído 4.75 (columna real, no cache)');

// T3 — el cero es ilegal con error TIPADO (vacío sí, cero no)
const cero = await actualizarOfertaPaseo({ id: oferta.id, precioPaquete: 0 });
check(!cero.ok && cero.codigo === 'precio_paquete_invalido', 'T3 cero → precio_paquete_invalido');
check((await releer()) === 4.75, 'T3b el rechazo no tocó el valor');

// T4 — null explícito QUITA el paquete del bloque
const quitar = await actualizarOfertaPaseo({ id: oferta.id, precioPaquete: null });
check(quitar.ok, 'T4 null explícito = quitar');
check((await releer()) === null, 'T4b releído null (sin paquete en el bloque)');

// T5 — restauración exacta del baseline (0 residuos)
const restaurar = await actualizarOfertaPaseo({ id: oferta.id, precioPaquete: baseline });
check(restaurar.ok, 'T5 restaurar baseline');
check((await releer()) === baseline, 'T5b baseline exacto', `precioPaquete=${String(baseline)}`);

await cerrarSesion();
console.log(fallos === 0 ? '\nTODO VERDE (8/8)' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
