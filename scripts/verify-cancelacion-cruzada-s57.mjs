// ─────────────────────────────────────────────────────────────────────
// S57-B B3 — PRUEBA CRUZADA DE CANCELACIÓN (guion diseñado en la espera,
// LLENO con el contrato commiteado de la A: citaSuelta.ts P18 + RPC
// marcar_no_show_cita verificada por pg_get_functiondef).
//
// (a) cancelada por el dueño → desaparece de la agenda del PRESTADOR
//     (filtro positivo sin enmienda) y la franja REAPARECE en la oferta
//     del CLIENTE (restauración EXACTA, patrón vacaciones S56).
// (b) reagendada → mismo id en la franja nueva, cero residuo en la
//     vieja, de los dos lados.
// (c) no_show: c1 el candado cita_aun_no_ocurre rebota TIPADO sobre una
//     cita futura (sin efectos); c2 el DEVENGO se prueba en un bloque
//     SQL ROLLBACK generado por este script (la cita se retro-fecha
//     DENTRO de la transacción, el prestador la marca, la verdad de
//     Cobros se lee por RLS como authenticated, y TODO vuelve atrás:
//     el ledger queda en CERO — el Gate de Oro con Kary lo exige).
// 7.16: (a) y (b) crean CERO eventos económicos (assert explícito).
//
// La sesión demo es dueña de la mascota demo Y del prestador demo
// (seed S44/S54 — el patrón de verify-agendamiento-s54).
// LIMPIEZA: las citas de test quedan 'cancelada' al cerrar y el script
// IMPRIME sus ids — la limpieza quirúrgica corre después con la receta
// canónica D-322 (supabase/dev/cleanup_citas_test.sql) + verificación
// en run separado (L-135).
// ─────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  initApi,
  iniciarSesion,
  cerrarSesion,
  obtenerSesion,
  obtenerMiPrestador,
  obtenerOfertasPaseoPropias,
  obtenerFranjasHorario,
  obtenerSlotsDisponibles,
  obtenerCitasPaseoDelDia,
  obtenerResumenPendienteLiquidar,
  crearBloqueoAgenda,
  confirmarCitaPagada,
  cancelarCitaSuelta,
  reagendarCitaSuelta,
  marcarNoShowCita,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const MASC = 'de300000-0000-4000-8000-000000000a5c'; // mascota demo (seed S44)

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
const sesion = await obtenerSesion();
const userId = sesion.ok && sesion.data ? sesion.data.user_id : null;

const prestador = await obtenerMiPrestador();
if (!prestador.ok) process.exit(1);
const prestadorId = prestador.data.id;

// Setup: oferta activa + primer día ≥ hoy+2 con franja (≥24h garantizado)
const [ofertas, franjas] = await Promise.all([
  obtenerOfertasPaseoPropias(prestadorId),
  obtenerFranjasHorario(prestadorId),
]);
if (!ofertas.ok || !franjas.ok) process.exit(1);
const servicio = ofertas.data.find((o) => o.activo) ?? ofertas.data[0];
const diasActivos = new Set(franjas.data.filter((f) => f.activo).map((f) => f.diaSemana));
let D = null;
for (let n = 2; n <= 15 && D === null; n++) {
  const iso = sumarDias(hoyLocal(), n);
  const [a, m, d] = iso.split('-').map(Number);
  if (diasActivos.has(new Date(a, m - 1, d).getDay())) D = iso;
}
if (D === null) {
  console.log('✗ SETUP: sin franja activa en 15 días');
  process.exit(1);
}
const D2 = sumarDias(D, 7); // mismo día de semana

const slots = async (dia) => {
  const r = await obtenerSlotsDisponibles({ prestador_id: prestadorId, prestador_servicio_id: servicio.id, desde: dia, hasta: dia });
  return r.ok ? r.data.map((s) => s.hora).sort() : null;
};
const agendaDia = async (dia) => {
  const r = await obtenerCitasPaseoDelDia({ prestador_id: prestadorId, fecha: dia });
  return r.ok ? r.data : null;
};
const resumen = async () => {
  const r = await obtenerResumenPendienteLiquidar();
  return r.ok ? r.data.cantidad : null;
};

const eventosBase = await resumen();
check(eventosBase !== null, 'T0 baseline de Cobros legible', `${eventosBase} pendientes`);

const crearPagada = async (fecha, hora) => {
  const hold = await crearBloqueoAgenda({
    prestador_id: prestadorId,
    prestador_servicio_id: servicio.id,
    mascota_id: MASC,
    fecha,
    hora: hora.slice(0, 5),
  });
  if (!hold.ok) return { error: `hold: ${hold.codigo}` };
  const pago = await confirmarCitaPagada({ cita_id: hold.data.cita_id });
  if (!pago.ok) return { error: `pago: ${pago.codigo}` };
  return { citaId: hold.data.cita_id };
};

// ═══ TRAMO (a) — CANCELADA: la franja se re-oferta SOLA ═══
const base1 = await slots(D);
check(Array.isArray(base1) && base1.length > 0, `A1 baseline de inicios del CLIENTE el ${D}`, `${base1?.length} slots`);
const H = base1[0];

const c1 = await crearPagada(D, H);
check(!('error' in c1), 'A2 cita suelta pagada creada (hold + pago simulado)', c1.error ?? c1.citaId);
if ('error' in c1) process.exit(1);

const ocupado = await slots(D);
check(ocupado !== null && !ocupado.includes(H), 'A3 la ventana pagada DESAPARECE de la oferta del cliente');
const enAgenda = await agendaDia(D);
check(enAgenda !== null && enAgenda.some((c) => c.id === c1.citaId), 'A4 el prestador la VE (confirmada, verdad firme)');

const cancel = await cancelarCitaSuelta(c1.citaId);
check(cancel.ok && cancel.data.reembolso_simulado === true, 'A5 cancelar ≥24h → reembolso simulado DECLARADO', cancel.ok ? `$${cancel.data.reembolso_monto}` : cancel.codigo);

const liberado = await slots(D);
check(
  liberado !== null && JSON.stringify(liberado) === JSON.stringify(base1),
  'A6 PRUEBA CRUZADA: la franja liberada REAPARECE — restauración EXACTA del baseline',
);
const agendaPost = await agendaDia(D);
check(agendaPost !== null && !agendaPost.some((c) => c.id === c1.citaId), 'A7 desapareció de la agenda del prestador (filtro positivo, sin enmienda)');
check((await resumen()) === eventosBase, 'A8 la cancelación creó CERO eventos económicos (7.16)');

// ═══ TRAMO (b) — REAGENDADA: se mueve sin residuo ═══
const c2 = await crearPagada(D, H);
check(!('error' in c2), 'B1 segunda cita pagada creada', c2.error ?? c2.citaId);
if ('error' in c2) process.exit(1);

const base2 = await slots(D2);
check(Array.isArray(base2) && base2.length > 0, `B2 baseline del día destino ${D2}`, `${base2?.length} slots`);
const H2 = base2.find((h) => h !== H) ?? base2[0];

const rea = await reagendarCitaSuelta({ cita_id: c2.citaId, nueva_fecha: D2, nueva_hora: H2.slice(0, 5) });
check(rea.ok && rea.data.fecha === D2, 'B3 reagendar ≥2h → ok', rea.ok ? `${rea.data.fecha} ${rea.data.hora}` : rea.codigo);

check(JSON.stringify(await slots(D)) === JSON.stringify(base1), 'B4 la ventana VIEJA quedó libre (cliente la ve de nuevo)');
const destinoOcupado = await slots(D2);
check(destinoOcupado !== null && !destinoOcupado.includes(H2), 'B4b la ventana NUEVA quedó ocupada');
const agendaVieja = await agendaDia(D);
const agendaNueva = await agendaDia(D2);
check(agendaVieja !== null && !agendaVieja.some((c) => c.id === c2.citaId), 'B5 cero residuo en el día viejo (prestador)');
check(
  agendaNueva !== null && agendaNueva.filter((c) => c.id === c2.citaId).length === 1,
  'B5b MISMO id, UNA fila, en el día nuevo (prestador)',
);
check((await resumen()) === eventosBase, 'B6 la reagenda creó CERO eventos económicos (7.16)');

// ═══ TRAMO (c1) — el candado del no_show rebota en futuro ═══
const rebote = await marcarNoShowCita(c2.citaId);
check(!rebote.ok && rebote.codigo === 'cita_aun_no_ocurre', 'C1 no_show antes de la hora → cita_aun_no_ocurre TIPADO');
const sigueConfirmada = await agendaDia(D2);
check(
  sigueConfirmada !== null && sigueConfirmada.some((c) => c.id === c2.citaId && c.estado === 'confirmada'),
  'C1b el rebote no tocó la cita',
);

// ═══ TRAMO (c2) — el DEVENGO del no_show, en ROLLBACK (ledger intacto) ═══
// La cita c2 se retro-fecha DENTRO de la transacción, el prestador la
// marca (jwt real de la sesión demo), Cobros se lee por RLS, y el
// RAISE EXCEPTION final devuelve el assert Y revierte todo.
if (userId === null) {
  check(false, 'C2 setup: sin user_id de la sesión demo');
} else {
  const sqlPath = `${process.env.TMPDIR ?? '/tmp'}/noshow-rollback-s57.sql`;
  writeFileSync(
    sqlPath,
    `DO $$
DECLARE
  v_cita uuid := '${c2.citaId}';
  v_res jsonb;
  v_pend int;
  v_ev record;
BEGIN
  UPDATE evento_cita_servicio SET fecha = current_date - 1 WHERE id = v_cita;
  PERFORM set_config('request.jwt.claims', '{"sub":"${userId}","role":"authenticated"}', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_res := marcar_no_show_cita(v_cita);
  SELECT count(*) INTO v_pend FROM eventos_economicos WHERE estado = 'pendiente_liquidar';
  SELECT ee.monto_bruto, ee.monto_payout, ee.metadata->>'cierre' AS cierre,
         ee.metadata->>'pago_simulado' AS simulado, ee.estado
    INTO v_ev
    FROM eventos_economicos ee
   WHERE ee.id = (v_res->>'evento_economico_id')::uuid;
  EXECUTE 'RESET ROLE';
  RAISE EXCEPTION 'NOSHOW_ASSERT %', jsonb_build_object(
    'estado_cita', v_res->>'estado',
    'evento_creado', (v_res->>'evento_economico_id') IS NOT NULL,
    'evento_estado', v_ev.estado,
    'pendientes_visibles_por_rls', v_pend,
    'monto_bruto', v_ev.monto_bruto,
    'monto_payout', v_ev.monto_payout,
    'cierre', v_ev.cierre,
    'pago_simulado', v_ev.simulado
  )::text;
END $$;`,
  );
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', '--file', sqlPath], {
    encoding: 'utf8',
  });
  const out = `${r.stdout}\n${r.stderr}`;
  const marca = out.indexOf('NOSHOW_ASSERT');
  if (marca === -1) {
    check(false, 'C2 el bloque ROLLBACK no devolvió el assert', out.slice(0, 300));
  } else {
    const ini = out.indexOf('{', marca);
    const fin = out.indexOf('}', ini);
    let payload = null;
    try {
      // el CLI escapa las comillas del mensaje de error (a veces doble) —
      // se desescapan todas antes de parsear
      payload = JSON.parse(out.slice(ini, fin + 1).replace(/\\+"/g, '"'));
    } catch {
      payload = null;
    }
    check(payload !== null, 'C2 assert del ROLLBACK legible', payload === null ? out.slice(marca, marca + 220) : '');
    if (payload !== null) {
      check(payload.estado_cita === 'no_show', 'C2b la cita vencida quedó no_show');
      check(payload.evento_creado === true && payload.evento_estado === 'pendiente_liquidar', 'C2c el cierre no_show DEVENGÓ (evento pendiente_liquidar)');
      check(payload.cierre === 'no_show' && payload.pago_simulado === 'true', 'C2d metadata honesta: cierre no_show + pago simulado');
      check(Number(payload.pendientes_visibles_por_rls) >= 1, 'C2e el prestador LO VE en Cobros (lectura por RLS)', `${payload.pendientes_visibles_por_rls} pendiente(s) · bruto $${payload.monto_bruto} · payout $${payload.monto_payout}`);
    }
  }
}

// El ledger REAL quedó intacto (el tramo c2 fue ROLLBACK)
check((await resumen()) === eventosBase, 'C3 el ledger real sigue en el baseline — cero residuos económicos');
// ...y la cita c2 sigue viva/futura tras el rollback
const c2Intacta = await agendaDia(D2);
check(
  c2Intacta !== null && c2Intacta.some((c) => c.id === c2.citaId && c.estado === 'confirmada'),
  'C3b la cita del fixture volvió intacta (el retro-fechado se revirtió)',
);

// ═══ LIMPIEZA de la cita viva (la cancelada del tramo (a) ya es terminal) ═══
const limpiar = await cancelarCitaSuelta(c2.citaId);
check(limpiar.ok, 'L1 cleanup: cancelar la segunda cita');
check(JSON.stringify(await slots(D2)) === JSON.stringify(base2), 'L2 el día destino volvió a su baseline exacto');

await cerrarSesion();
console.log(`\nIDS DE TEST (para la receta D-322 en run separado): ${c1.citaId}, ${c2.citaId}`);
console.log(fallos === 0 ? 'TODO VERDE (28/28)' : `${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
