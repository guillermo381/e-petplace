// Asserts imperativos S55-A A0 (D-319) — obtenerEstadoHogar.proxima_cita
// contra DB viva con la sesión demo (regla 47 / L-114).
//
// DOS FASES porque el vencimiento del hold no se puede fabricar desde el
// cliente (expira_en lo pone el server a +15 min):
//   fase1: baseline null → hold vivo → la Zona 2 lo ve como reserva='hold'.
//   (entre fases, server-side: UPDATE expira_en al pasado — el estado del
//    hold vencido PRE-cron: estado='pendiente', estado_reserva='pendiente_pago')
//   fase2 <cita_id_vencida>: el hold vencido es INVISIBLE → un segundo hold
//   MÁS TARDE pagado aparece como reserva='firme' (el vencido más temprano
//   ya no lo tapa — el mecanismo exacto de "la pagada desaparece").
//
// SEGURO PARA ESTADO COMPARTIDO: slots del próximo sábado del prestador
// demo; imprime los cita_id para la limpieza quirúrgica por id server-side.
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  obtenerEstadoHogar,
  obtenerSlotsDisponibles,
  crearBloqueoAgenda,
  confirmarCitaPagada,
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

const fase = process.argv[2];
const citaVencidaId = process.argv[3] ?? null;
if (fase !== 'fase1' && fase !== 'fase2') {
  console.log('uso: node scripts/verify-hogar-zona2-s55.mjs fase1 | fase2 <cita_id_vencida>');
  process.exit(1);
}

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

const PREST = 'de300000-0000-4000-8000-0000000000e5';
const SRV   = 'de300000-0000-4000-8000-00000000a5e0';
const MASC  = 'de300000-0000-4000-8000-000000000a5c';

// próximo sábado (siempre futuro) — fecha LOCAL (toISOString es UTC y
// después de las 19:00 en UTC-5 corre el día — mismo fix que el S54)
const hoy = new Date();
const sabado = new Date(hoy);
sabado.setDate(hoy.getDate() + ((6 - hoy.getDay() + 7) % 7 || 7));
const FECHA = new Intl.DateTimeFormat('en-CA').format(sabado);

const slots = await obtenerSlotsDisponibles({ prestador_id: PREST, prestador_servicio_id: SRV, desde: FECHA, hasta: FECHA });
if (!slots.ok || slots.data.length < 2) {
  console.log('✗ sin slots suficientes el sábado para el ensayo:', slots.ok ? slots.data.length : slots.codigo);
  process.exit(1);
}
const horas = slots.data.map((s) => s.hora).sort();

if (fase === 'fase1') {
  // T1 — baseline: el hogar demo no tiene citas futuras vivas
  const base = await obtenerEstadoHogar([MASC]);
  check(base.ok, 'T1 obtenerEstadoHogar responde');
  check(base.ok && base.data.proxima_cita === null, 'T1b baseline sin próxima cita', base.ok ? JSON.stringify(base.data.proxima_cita) : '');

  // T2 — hold vivo en el PRIMER slot del sábado
  const hora1 = horas[0].slice(0, 5);
  const hold = await crearBloqueoAgenda({ prestador_id: PREST, prestador_servicio_id: SRV, mascota_id: MASC, fecha: FECHA, hora: hora1 });
  check(hold.ok, `T2 crearBloqueoAgenda ${FECHA} ${hora1}`, hold.ok ? hold.data.cita_id : `${hold.codigo}: ${hold.mensaje}`);

  // T3 — la Zona 2 ve el hold VIGENTE con voz de hold
  const con = await obtenerEstadoHogar([MASC]);
  check(con.ok && con.data.proxima_cita?.cita_id === (hold.ok ? hold.data.cita_id : ''), 'T3 el hold vigente ES la próxima cita');
  check(con.ok && con.data.proxima_cita?.reserva === 'hold', "T3b reserva='hold'", con.ok ? con.data.proxima_cita?.reserva : '');

  console.log(`\nCITA_HOLD_ID=${hold.ok ? hold.data.cita_id : 'NINGUNA'}`);
  console.log('siguiente paso: backdate server-side de expira_en y correr fase2 con ese id');
} else {
  if (!citaVencidaId) {
    console.log('✗ fase2 exige el cita_id del hold vencido');
    process.exit(1);
  }
  // T4 — el hold VENCIDO (pre-cron: sigue 'pendiente'/'pendiente_pago') es invisible
  const sin = await obtenerEstadoHogar([MASC]);
  check(sin.ok, 'T4 obtenerEstadoHogar responde');
  check(sin.ok && sin.data.proxima_cita?.cita_id !== citaVencidaId, 'T4b el hold vencido NO es la próxima cita');
  check(sin.ok && sin.data.proxima_cita === null, 'T4c sin otra cita, la zona calla (null)', sin.ok ? JSON.stringify(sin.data.proxima_cita) : '');

  // T5 — hold MÁS TARDE + pago simulado → firme
  const hora2 = horas[horas.length - 1].slice(0, 5);
  const hold2 = await crearBloqueoAgenda({ prestador_id: PREST, prestador_servicio_id: SRV, mascota_id: MASC, fecha: FECHA, hora: hora2 });
  check(hold2.ok, `T5 crearBloqueoAgenda ${FECHA} ${hora2}`, hold2.ok ? hold2.data.cita_id : `${hold2.codigo}: ${hold2.mensaje}`);
  const pago = hold2.ok ? await confirmarCitaPagada({ cita_id: hold2.data.cita_id }) : { ok: false, codigo: 'skip', mensaje: '' };
  check(pago.ok, 'T5b confirmarCitaPagada ok', pago.ok ? '' : `${pago.codigo}: ${pago.mensaje}`);

  // T6 — LA CURA D-319: la pagada aparece firme AUNQUE el hold vencido
  // más temprano siga 'pendiente' en la tabla (antes la tapaba el limit 1)
  const con2 = await obtenerEstadoHogar([MASC]);
  check(con2.ok && con2.data.proxima_cita?.cita_id === (hold2.ok ? hold2.data.cita_id : ''), 'T6 la cita PAGADA es la próxima (el vencido no la tapa)');
  check(con2.ok && con2.data.proxima_cita?.reserva === 'firme', "T6b reserva='firme'", con2.ok ? con2.data.proxima_cita?.reserva : '');

  console.log(`\nCITA_PAGADA_ID=${hold2.ok ? hold2.data.cita_id : 'NINGUNA'}`);
  console.log('limpieza quirúrgica por id server-side: el hold vencido + esta pagada');
}

console.log(fallos === 0 ? 'TODOS LOS ASSERTS PASARON' : `${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
