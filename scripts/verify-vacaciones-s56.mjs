// Asserts imperativos S56-B (TAREA 2) — el bloqueo creado por la puerta de
// la pantalla MATA la oferta de su rango (D-341 vivo), y fuera del rango
// nada cambia (espejo A1/A4 del pedido). Sesión demo, marca DEMO, limpieza
// por id verificada al final — 0 residuos.
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  cerrarSesion,
  obtenerMiPrestador,
  obtenerOfertasPaseoPropias,
  obtenerFranjasHorario,
  obtenerSlotsDisponibles,
  obtenerBloqueosPrestador,
  crearBloqueoPrestador,
  eliminarBloqueoPrestador,
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
const hoyLocal = () => new Intl.DateTimeFormat('en-CA').format(new Date());
const sumarDias = (iso, n) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-CA').format(new Date(a, m - 1, d + n));
};

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

const prestador = await obtenerMiPrestador();
check(prestador.ok, 'T1 obtenerMiPrestador');
if (!prestador.ok) process.exit(1);
const prestadorId = prestador.data.id;

// T2 — rechazos tipados ANTES de tocar nada
const alReves = await crearBloqueoPrestador({ prestadorId, fechaInicio: sumarDias(hoyLocal(), 5), fechaFin: sumarDias(hoyLocal(), 2) });
check(!alReves.ok && alReves.codigo === 'rango_invalido', 'T2 fin antes del inicio → rango_invalido');
const pasado = await crearBloqueoPrestador({ prestadorId, fechaInicio: sumarDias(hoyLocal(), -1), fechaFin: hoyLocal() });
check(!pasado.ok && pasado.codigo === 'inicio_pasado', 'T2b inicio ayer → inicio_pasado');

// Setup: primera fecha ≥ mañana con franja activa (deletable: inicio > hoy)
const [ofertas, franjas] = await Promise.all([
  obtenerOfertasPaseoPropias(prestadorId),
  obtenerFranjasHorario(prestadorId),
]);
if (!ofertas.ok || !franjas.ok || ofertas.data.length === 0) {
  console.log('✗ SETUP: sin ofertas/franjas del demo');
  process.exit(1);
}
const servicio = ofertas.data.find((o) => o.activo) ?? ofertas.data[0];
const diasActivos = new Set(franjas.data.filter((f) => f.activo).map((f) => f.diaSemana));
let fecha = null;
for (let n = 1; n <= 14 && fecha === null; n++) {
  const iso = sumarDias(hoyLocal(), n);
  const [a, m, d] = iso.split('-').map(Number);
  if (diasActivos.has(new Date(a, m - 1, d).getDay())) fecha = iso;
}
if (fecha === null) {
  console.log('✗ SETUP: sin franja activa en 14 días');
  process.exit(1);
}
const fecha2 = sumarDias(fecha, 7); // mismo día de semana, fuera del rango

const slots = async (dia) => {
  const r = await obtenerSlotsDisponibles({ prestador_id: prestadorId, prestador_servicio_id: servicio.id, desde: dia, hasta: dia });
  return r.ok ? r.data.length : -1;
};
const base1 = await slots(fecha);
const base2 = await slots(fecha2);
check(base1 > 0, 'T3 baseline: hay oferta el día elegido', `${base1} slots el ${fecha}`);

// T4 — el bloqueo nace por la puerta de la pantalla
const bloqueo = await crearBloqueoPrestador({
  prestadorId,
  fechaInicio: fecha,
  fechaFin: fecha,
  motivo: '[DEMO S56-B] assert D-341 — se borra al final del script',
});
check(bloqueo.ok, 'T4 crearBloqueoPrestador', bloqueo.ok ? bloqueo.data.id : bloqueo.mensaje);
if (!bloqueo.ok) process.exit(1);

// T5 — dentro del rango la oferta MUERE; fuera, intacta (A1/A4 del pedido)
check((await slots(fecha)) === 0, 'T5 el bloqueo mata la oferta de su día (0 slots)');
check((await slots(fecha2)) === base2, 'T5b fuera del rango nada cambia (+7 días idéntico)');

// T6 — la lista lo trae; quitar futuro funciona; restauración exacta
const lista = await obtenerBloqueosPrestador(prestadorId);
check(lista.ok && lista.data.some((b) => b.id === bloqueo.data.id), 'T6 el bloqueo aparece en la lista');
const quitar = await eliminarBloqueoPrestador(bloqueo.data.id);
check(quitar.ok, 'T7 eliminar futuro → ok');
check((await slots(fecha)) === base1, 'T7b la oferta vuelve al baseline exacto');
const otraVez = await eliminarBloqueoPrestador(bloqueo.data.id);
check(!otraVez.ok && otraVez.codigo === 'no_eliminable', 'T7c re-eliminar → no_eliminable (jamás no-op silencioso)');

// T8 — 0 residuos
const listaFinal = await obtenerBloqueosPrestador(prestadorId);
check(listaFinal.ok && !listaFinal.data.some((b) => b.id === bloqueo.data.id), 'T8 cero residuos (el DEMO se borró)');

await cerrarSesion();
console.log(fallos === 0 ? '\nTODO VERDE (11/11)' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
