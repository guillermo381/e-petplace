// Asserts imperativos S55-B (B1) — wrappers del desglose del ledger +
// liquidaciones propias contra DB viva con la sesión demo (regla 47 /
// L-114: build verde ≠ contrato). ASSERTS POR PATRÓN, no por valor
// (lección S54: el ledger es estado compartido — hoy 0 eventos, y el wow
// de S55 va a parir el primero; el script tiene que pasar en ambos mundos
// y REPORTAR literal lo que encuentra).
import { readFileSync } from 'node:fs';
import {
  initApi,
  getClient,
  iniciarSesion,
  cerrarSesion,
  obtenerResumenPendienteLiquidar,
  obtenerDesglosePendienteLiquidar,
  obtenerMisLiquidaciones,
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

// T1 — el desglose responde y cada fila tiene el shape del contrato
const d = await obtenerDesglosePendienteLiquidar();
check(d.ok, 'T1 obtenerDesglosePendienteLiquidar responde ok', d.ok ? `${d.data.length} evento(s)` : d.mensaje);
const eventos = d.ok ? d.data : [];
for (const e of eventos) {
  const shapeOk =
    typeof e.id === 'string' &&
    typeof e.tipoEvento === 'string' &&
    typeof e.montoBruto === 'number' &&
    typeof e.montoPlataforma === 'number' &&
    (e.montoPayout === null || typeof e.montoPayout === 'number') &&
    typeof e.moneda === 'string' &&
    /^\d{4}-\d{2}-\d{2}/.test(e.fechaDevengo) &&
    typeof e.pagoSimulado === 'boolean' &&
    (e.tipoServicio === null || typeof e.tipoServicio === 'string');
  check(shapeOk, `T1b shape del evento ${e.id.slice(0, 8)}`, JSON.stringify(e));
}

// T2 — coherencia desglose ⟷ resumen (mismas filas por RLS, misma suma)
const r = await obtenerResumenPendienteLiquidar();
check(r.ok, 'T2 resumen responde ok', r.ok ? JSON.stringify(r.data) : r.mensaje);
if (d.ok && r.ok) {
  check(r.data.cantidad === eventos.length, 'T2b cantidad desglose == resumen', `${eventos.length} vs ${r.data.cantidad}`);
  const suma = eventos.reduce((s, e) => s + (e.montoPayout ?? 0), 0);
  check(
    Math.abs(suma - r.data.montoPayout) < 0.005,
    'T2c suma de payouts desglose == resumen',
    `${suma} vs ${r.data.montoPayout}`,
  );
}

// T3 — verdad firme: el desglose trae EXACTAMENTE los pendiente_liquidar
// visibles por RLS (ningún otro estado se cuela; nada se pierde)
const { data: porEstado, error: errEstados } = await getClient()
  .from('eventos_economicos')
  .select('estado');
check(!errEstados && Array.isArray(porEstado), 'T3 lectura RLS directa de estados');
if (!errEstados && Array.isArray(porEstado)) {
  const conteo = {};
  for (const f of porEstado) conteo[f.estado] = (conteo[f.estado] ?? 0) + 1;
  console.log('  · estados visibles por RLS (literal):', JSON.stringify(conteo));
  check(
    (conteo['pendiente_liquidar'] ?? 0) === eventos.length,
    'T3b desglose == pendiente_liquidar visibles',
    `${eventos.length} vs ${conteo['pendiente_liquidar'] ?? 0}`,
  );
}

// T4 — liquidaciones propias: shape y estados del enum real (relevado S55)
const ESTADOS = ['borrador', 'calculado', 'aprobado', 'pagado', 'en_disputa', 'anulada'];
const l = await obtenerMisLiquidaciones();
check(l.ok, 'T4 obtenerMisLiquidaciones responde ok', l.ok ? `${l.data.length} liquidación(es)` : l.mensaje);
if (l.ok) {
  for (const liq of l.data) {
    check(
      typeof liq.id === 'string' &&
        typeof liq.numeroLiquidacion === 'string' &&
        /^\d{4}-\d{2}-\d{2}/.test(liq.periodoFin) &&
        typeof liq.montoNetoAPagar === 'number' &&
        ESTADOS.includes(liq.estado) &&
        typeof liq.eventosCount === 'number',
      `T4b shape de la liquidación ${liq.numeroLiquidacion}`,
      JSON.stringify(liq),
    );
  }
}

// T5 — sin sesión: error tipado sin_sesion en ambos wrappers nuevos
await cerrarSesion();
const d2 = await obtenerDesglosePendienteLiquidar();
check(!d2.ok && d2.codigo === 'sin_sesion', 'T5 desglose sin sesión → sin_sesion');
const l2 = await obtenerMisLiquidaciones();
check(!l2.ok && l2.codigo === 'sin_sesion', 'T5b liquidaciones sin sesión → sin_sesion');

console.log(fallos === 0 ? '\nTODOS LOS ASSERTS PASARON' : `\n${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
