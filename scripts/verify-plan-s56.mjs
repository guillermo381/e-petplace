// Asserts imperativos S56-A Tarea 2 — wrappers del PLAN (D-338) contra
// DB viva con la sesión demo (regla 47 / L-114). ESTADO COMPARTIDO:
// escribe UN plan (sábados 17:00, lejos de los slots de otros verify) y
// lo deja PAUSADO; imprime SUSCRIPCION_TEST_ID y las citas para la
// limpieza quirúrgica por id (cleanup_citas_test.sql + DELETE de la
// suscripción server-side).
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  contratarPlanPaseo,
  obtenerMisPlanesPaseo,
  obtenerCitasDePlan,
  configurarRenovacionPlan,
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

// T1 — contratar plan semanal de sábados 17:00 (30')
const plan = await contratarPlanPaseo({
  prestador_id: PREST,
  prestador_servicio_id: SRV,
  mascota_id: MASC,
  dias: [6],
  hora: '17:00',
  frecuencia: 'semanal',
  auto_renovar: true,
});
check(plan.ok, 'T1 contratarPlanPaseo ok', plan.ok ? plan.data.suscripcion_id : `${plan.codigo}: ${plan.mensaje}`);
if (plan.ok) {
  const d = plan.data;
  check(d.citas_generadas >= 4 && d.citas_generadas <= 5, 'T1b citas del período (4-5 sábados)', String(d.citas_generadas));
  check(
    Math.abs(d.total_periodo - d.precio_unitario_efectivo * d.citas_generadas) < 0.01,
    'T1c plata exacta: total = unitario × N',
    `total=${d.total_periodo} unit=${d.precio_unitario_efectivo} n=${d.citas_generadas}`,
  );
}

// T2 — el hub lo ve (RLS solo-dueño)
const planes = await obtenerMisPlanesPaseo();
const mio = planes.ok && plan.ok ? planes.data.find((p) => p.id === plan.data.suscripcion_id) : null;
check(!!mio && mio.estado === 'activa' && mio.auto_renovar === true, 'T2 obtenerMisPlanesPaseo lo devuelve activo', JSON.stringify(mio ?? planes));

// T3 — las salidas del plan, firmes
const citas = plan.ok ? await obtenerCitasDePlan(plan.data.suscripcion_id) : { ok: false };
check(
  citas.ok && plan.ok && citas.data.length === plan.data.citas_generadas
    && citas.data.every((c) => c.estado === 'confirmada' && c.precio === plan.data.precio_unitario_efectivo),
  'T3 obtenerCitasDePlan: N firmes con precio unitario',
  citas.ok ? `${citas.data.length} citas` : 'error',
);

// T4 — plan duplicado rebota tipado
const dup = await contratarPlanPaseo({
  prestador_id: PREST, prestador_servicio_id: SRV, mascota_id: MASC,
  dias: [6], hora: '17:00', frecuencia: 'semanal', auto_renovar: true,
});
check(!dup.ok && dup.codigo === 'plan_duplicado', 'T4 plan duplicado → plan_duplicado', dup.ok ? 'PUDO' : dup.codigo);

// T5 — pausa de un toque (P14d) — el plan queda pausado para el cleanup
const pausa = plan.ok
  ? await configurarRenovacionPlan({ suscripcion_id: plan.data.suscripcion_id, auto_renovar: false })
  : { ok: false };
check(pausa.ok && pausa.data.auto_renovar === false, 'T5 configurarRenovacionPlan: pausa de un toque', pausa.ok ? 'auto_renovar=false' : 'error');

console.log(`\nSUSCRIPCION_TEST_ID=${plan.ok ? plan.data.suscripcion_id : 'NINGUNA'}`);
console.log(`CITAS_TEST_IDS=${citas.ok ? citas.data.map((c) => c.id).join(',') : 'NINGUNA'}`);
console.log(fallos === 0 ? 'TODOS LOS ASSERTS PASARON' : `${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
