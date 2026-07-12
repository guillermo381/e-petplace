// Asserts imperativos S57-B1 — la agenda más allá de hoy (D-317):
// la enmienda aditiva de rango en obtenerCitasPaseoDelDia es
// retrocompatible, el rango respeta verdad firme + orden + snapshot de
// duración, la marca del plan viaja, y el día de vacaciones se marca
// SIN tocar las citas confirmadas. Sesión demo, marca DEMO, limpieza
// por id verificada al final — 0 residuos.
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  cerrarSesion,
  obtenerMiPrestador,
  obtenerCitasPaseoDelDia,
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

const ESTADOS_FIRMES = new Set(['confirmada', 'en_curso', 'completada', 'no_show']);

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

const prestador = await obtenerMiPrestador();
check(prestador.ok, 'T1 obtenerMiPrestador');
if (!prestador.ok) process.exit(1);
const prestadorId = prestador.data.id;

const hoy = hoyLocal();
const hasta = sumarDias(hoy, 6);

// T2 — retrocompatibilidad: SIN fecha_hasta devuelve SOLO el día base
const soloHoy = await obtenerCitasPaseoDelDia({ prestador_id: prestadorId, fecha: hoy });
check(soloHoy.ok, 'T2 fetch sin fecha_hasta responde ok');
check(
  soloHoy.ok && soloHoy.data.every((c) => c.fecha === hoy),
  'T2b sin fecha_hasta = solo citas de hoy (contrato original intacto)',
  soloHoy.ok ? `${soloHoy.data.length} citas` : soloHoy.mensaje,
);

// T3 — el rango hoy..hoy+6: fechas dentro, verdad firme, orden, snapshot
const rango = await obtenerCitasPaseoDelDia({ prestador_id: prestadorId, fecha: hoy, fecha_hasta: hasta });
check(rango.ok, 'T3 fetch de rango responde ok');
if (!rango.ok) process.exit(1);
check(
  rango.data.every((c) => c.fecha !== null && c.fecha >= hoy && c.fecha <= hasta),
  'T3b todas las fechas caen dentro del rango inclusivo',
  `${rango.data.length} citas en 7 días`,
);
check(
  rango.data.every((c) => ESTADOS_FIRMES.has(c.estado)),
  'T3c verdad firme en el rango entero (solo estados firmes)',
);
const claves = rango.data.map((c) => `${c.fecha}T${c.hora ?? ''}`);
check(
  claves.every((k, i) => i === 0 || k >= claves[i - 1]),
  'T3d orden fecha+hora ascendente',
);
check(
  rango.data.every((c) => typeof c.duracion_minutos === 'number' && c.duracion_minutos > 0),
  'T3e duracion_minutos (snapshot S55-B2) viaja en cada fila',
);

// T4 — la marca "parte del plan" viaja en el rango (el demo tiene plan vivo D-338)
const delPlan = rango.data.filter((c) => c.suscripcion_servicio_id !== null).length;
check(delPlan > 0, 'T4 al menos una cita del rango trae suscripcion_servicio_id (marca del plan)', `${delPlan} del plan`);

// T5 — consistencia: la unión de 7 fetches por día = el fetch de rango
const porDia = [];
for (let i = 0; i <= 6; i++) {
  const r = await obtenerCitasPaseoDelDia({ prestador_id: prestadorId, fecha: sumarDias(hoy, i) });
  if (!r.ok) {
    console.log(`✗ FALLO T5 setup: fetch del día ${i} falló`);
    fallos += 1;
    break;
  }
  porDia.push(...r.data.map((c) => c.id));
}
const idsRango = new Set(rango.data.map((c) => c.id));
check(
  porDia.length === rango.data.length && porDia.every((id) => idsRango.has(id)),
  'T5 unión día-por-día ≡ fetch de rango (mismos ids)',
  `${porDia.length} vs ${rango.data.length}`,
);

// T6 — vacaciones visibles SIN tocar citas: bloqueo mañana → la lista lo
// trae, el día queda marcable (rango inclusive), y las citas confirmadas
// de ese día SIGUEN viniendo (el bloqueo jamás toca citas — P14/P16).
const manana = sumarDias(hoy, 1);
const citasMananaAntes = rango.data.filter((c) => c.fecha === manana).length;
const bloqueo = await crearBloqueoPrestador({
  prestadorId,
  fechaInicio: manana,
  fechaFin: manana,
  motivo: '[DEMO S57-B1] assert agenda semana — se borra al final del script',
});
check(bloqueo.ok, 'T6 crearBloqueoPrestador (mañana)', bloqueo.ok ? bloqueo.data.id : bloqueo.mensaje);
if (bloqueo.ok) {
  const lista = await obtenerBloqueosPrestador(prestadorId);
  const marcado =
    lista.ok && lista.data.some((b) => b.fechaInicio <= manana && manana <= b.fechaFin);
  check(marcado, 'T6b el día de mañana queda marcado como bloqueado (lectura de la pantalla)');
  const rango2 = await obtenerCitasPaseoDelDia({ prestador_id: prestadorId, fecha: hoy, fecha_hasta: hasta });
  check(
    rango2.ok && rango2.data.filter((c) => c.fecha === manana).length === citasMananaAntes,
    'T6c las citas confirmadas del día bloqueado SIGUEN (el bloqueo no las toca)',
    `${citasMananaAntes} citas`,
  );

  // T7 — limpieza por id + 0 residuos
  const quitar = await eliminarBloqueoPrestador(bloqueo.data.id);
  check(quitar.ok, 'T7 limpieza: eliminar el bloqueo DEMO');
  const listaFinal = await obtenerBloqueosPrestador(prestadorId);
  check(
    listaFinal.ok && !listaFinal.data.some((b) => b.id === bloqueo.data.id),
    'T7b cero residuos (el DEMO se borró)',
  );
}

await cerrarSesion();
console.log(fallos === 0 ? '\nTODO VERDE (15/15)' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
