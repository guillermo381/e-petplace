// Asserts imperativos S54-A B2 — wrappers de agendamiento contra DB viva
// con la sesión demo (regla 47 / L-114: build verde ≠ contrato).
// SEGURO PARA ESTADO COMPARTIDO: escribe UN hold en un slot lejano
// (próximo sábado 17:30) y lo confirma; imprime el cita_id para la
// limpieza quirúrgica por id (las policies de INSERT/UPDATE del dueño
// murieron en S54 — el cleanup corre server-side, no desde acá).
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  obtenerOfertaPaseo,
  obtenerPaseadoresDisponibles,
  obtenerSlotsDisponibles,
  crearBloqueoAgenda,
  confirmarCitaPagada,
  obtenerCitasPaseoDelDia,
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

// próximo sábado (siempre futuro)
const hoy = new Date();
const sabado = new Date(hoy);
sabado.setDate(hoy.getDate() + ((6 - hoy.getDay() + 7) % 7 || 7));
const FECHA = sabado.toISOString().slice(0, 10);
const HORA = '17:30';

// T1 — oferta derivada: el paseador demo aparece con su precio real
const oferta = await obtenerOfertaPaseo();
check(oferta.ok, 'T1 obtenerOfertaPaseo responde');
const demo = oferta.ok ? oferta.data.find((o) => o.prestador_servicio_id === SRV) : null;
check(!!demo, 'T1b el paseador demo está en la oferta');
check(demo?.precio === 10, 'T1c precio real derivado (10)', String(demo?.precio));
check(demo?.servicio_nombre === '[DEMO S44] Paseo 30 min', 'T1d nombre_custom gana', demo?.servicio_nombre);

// T2 — slots derivados del sábado
const slots = await obtenerSlotsDisponibles({ prestador_id: PREST, prestador_servicio_id: SRV, desde: FECHA, hasta: FECHA });
check(slots.ok, 'T2 obtenerSlotsDisponibles responde');
const slot1730 = slots.ok ? slots.data.find((s) => s.hora === '17:30:00') : null;
check(!!slot1730, `T2b slot ${FECHA} 17:30 disponible`, slots.ok ? `${slots.data.length} slots` : '');

// T2c — momento-primero (S54-B3.2): el QUIÉN para la ventana
const antes = await obtenerPaseadoresDisponibles({ fecha: FECHA, hora: HORA, duracion_minutos: 30 });
check(antes.ok && antes.data.some((p) => p.prestador_servicio_id === SRV), 'T2c paseadores disponibles 17:30×30 incluye al demo', antes.ok ? `${antes.data.length}` : antes.codigo);
check(antes.ok && antes.data.every((p) => p.precio > 0), 'T2d precios reales en disponibles');

// T3 — hold: nace con snapshot de precio y expiración ~15 min
const hold = await crearBloqueoAgenda({ prestador_id: PREST, prestador_servicio_id: SRV, mascota_id: MASC, fecha: FECHA, hora: HORA });
check(hold.ok, 'T3 crearBloqueoAgenda ok', hold.ok ? hold.data.cita_id : `${hold.codigo}: ${hold.mensaje}`);
if (hold.ok) {
  const min = (new Date(hold.data.expira_en) - Date.now()) / 60000;
  check(min > 13 && min <= 15.5, 'T3b hold expira en ~15 min', `${min.toFixed(1)} min`);
  check(hold.data.precio === 10, 'T3c snapshot de precio en el hold', String(hold.data.precio));
}

// T4 — el hold OCUPA: el slot desaparece de la derivación
const slots2 = await obtenerSlotsDisponibles({ prestador_id: PREST, prestador_servicio_id: SRV, desde: FECHA, hasta: FECHA });
check(slots2.ok && !slots2.data.some((s) => s.hora === '17:30:00'), 'T4 el hold ocupa el slot (17:30 desaparece)');

// T4b — el hold también excluye en la consulta invertida
const despues = await obtenerPaseadoresDisponibles({ fecha: FECHA, hora: HORA, duracion_minutos: 30 });
check(despues.ok && !despues.data.some((p) => p.prestador_servicio_id === SRV), 'T4b el hold excluye al demo del QUIÉN');

// T5 — doble reserva rebota tipada
const doble = await crearBloqueoAgenda({ prestador_id: PREST, prestador_servicio_id: SRV, mascota_id: MASC, fecha: FECHA, hora: HORA });
check(!doble.ok && doble.codigo === 'slot_ocupado', 'T5 doble reserva → slot_ocupado', doble.ok ? 'PUDO' : doble.codigo);

// T6 — fuera de horario rebota tipada (domingo)
const domingo = new Date(sabado); domingo.setDate(sabado.getDate() + 1);
const fdh = await crearBloqueoAgenda({ prestador_id: PREST, prestador_servicio_id: SRV, mascota_id: MASC, fecha: domingo.toISOString().slice(0, 10), hora: HORA });
check(!fdh.ok && fdh.codigo === 'fuera_de_horario', 'T6 domingo → fuera_de_horario', fdh.ok ? 'PUDO' : fdh.codigo);

// T6b — GATE DOBLE (verdad firme, test 8): ANTES de pagar, la agenda del
// prestador NO muestra el hold (el user demo también ES el prestador demo)
const agendaAntes = await obtenerCitasPaseoDelDia({ prestador_id: PREST, fecha: FECHA });
check(
  agendaAntes.ok && !agendaAntes.data.some((c) => c.id === (hold.ok ? hold.data.cita_id : '')),
  'T6b ANTES de pagar: el hold es INVISIBLE en la agenda del prestador',
);

// T7 — el pago simulado confirma
const pago = hold.ok ? await confirmarCitaPagada({ cita_id: hold.data.cita_id }) : { ok: false, codigo: 'skip', mensaje: '' };
check(pago.ok && pago.data.estado === 'confirmada' && pago.data.estado_reserva === 'pagada', 'T7 confirmarCitaPagada → firme y pagada', pago.ok ? pago.data.pagado_en : `${pago.codigo}: ${pago.mensaje}`);

// T7b — GATE DOBLE: DESPUÉS de pagar, la cita SÍ aparece firme en la agenda
const agendaDespues = await obtenerCitasPaseoDelDia({ prestador_id: PREST, fecha: FECHA });
check(
  agendaDespues.ok && agendaDespues.data.some((c) => c.id === (hold.ok ? hold.data.cita_id : '') && c.estado === 'confirmada'),
  'T7b DESPUÉS de pagar: la cita es VISIBLE y confirmada en la agenda del prestador',
);

// T8 — re-pagar rebota tipada
const repago = hold.ok ? await confirmarCitaPagada({ cita_id: hold.data.cita_id }) : { ok: false, codigo: 'skip' };
check(!repago.ok && repago.codigo === 'cita_ya_confirmada', 'T8 re-pago → cita_ya_confirmada', repago.ok ? 'PUDO' : repago.codigo);

console.log(`\nCITA_TEST_ID=${hold.ok ? hold.data.cita_id : 'NINGUNA'} (limpieza quirúrgica server-side por id)`);
console.log(fallos === 0 ? 'TODOS LOS ASSERTS PASARON' : `${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
