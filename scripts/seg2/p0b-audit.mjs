/**
 * 🔴 P0-B · ② EL AUDIT DE AUTH — ¿alguien cambió una contraseña, y cuándo?
 *
 * **SOLO LEE.** La orden es medir; la recuperación la decide el founder.
 *
 * El precedente que la mesa nombró (regla 87, S88) distinguió una
 * re-autenticación de un reset completo mirando esta misma tabla. Acá se busca
 * lo mismo: `user_updated_password`, `user_recovery_requested`, y **cualquier
 * escritura** sobre las cuentas de prestador, con su fecha y su camino.
 */
import { sql, guardarSeg2, linea } from './lib-seg2.mjs';

const enmascarar = (email) => {
  if (!email) return '(sin email)';
  const [l, d] = email.split('@');
  return d === 'epetplace.dev' ? email : `${l.slice(0, 3)}${'*'.repeat(Math.max(0, l.length - 3))}@${d}`;
};

// ── ¿qué tipos de acción registra el audit, y cuántos de cada uno? ─────────
const tipos = await sql(
  `SELECT payload->>'action' AS accion, count(*)::int AS n,
          min(created_at)::text AS primera, max(created_at)::text AS ultima
   FROM auth.audit_log_entries
   GROUP BY 1 ORDER BY 2 DESC`,
  'p0b-tipos',
);
linea('\n══ P0-B · ② EL AUDIT DE AUTH ══\n');
linea(`  acciones registradas en total: ${tipos.reduce((a, t) => a + t.n, 0)}\n`);
linea('  acción                          n     primera              última');
linea('  ' + '─'.repeat(74));
for (const t of tipos) {
  linea(`  ${String(t.accion).padEnd(30)} ${String(t.n).padStart(4)}  ${t.primera?.slice(0, 19)}  ${t.ultima?.slice(0, 19)}`);
}

// ── LO QUE LA ORDEN PIDE: cambios de credencial, con fecha y camino ───────
const cambios = await sql(
  `SELECT a.created_at::text AS cuando,
          a.payload->>'action' AS accion,
          a.payload->>'actor_username' AS actor,
          a.payload->>'actor_via_sso' AS via_sso,
          a.payload->>'traits' AS traits,
          a.payload::text AS payload
   FROM auth.audit_log_entries a
   WHERE a.payload->>'action' ILIKE '%password%'
      OR a.payload->>'action' ILIKE '%recovery%'
      OR a.payload->>'action' ILIKE '%updated%'
   ORDER BY a.created_at DESC
   LIMIT 40`,
  'p0b-cambios',
);
linea(`\n══ CAMBIOS DE CREDENCIAL / RECUPERACIÓN / UPDATES: ${cambios.length} ══\n`);
if (cambios.length === 0) {
  linea('  ✅ NINGUNO. El audit no registra un solo cambio de contraseña ni una');
  linea('     solicitud de recuperación en toda la historia del proyecto.');
  linea('     ⇒ la contraseña del founder NO fue cambiada por el sistema.');
} else {
  for (const c of cambios) {
    linea(`  ${c.cuando?.slice(0, 19)}  ${c.accion}  actor=${enmascarar(c.actor)}`);
    linea(`     ${c.payload.slice(0, 200)}`);
  }
}

// ── la ventana de S92: ¿el audit registra ALGO el 8 o 9 de agosto? ────────
const ventana = await sql(
  `SELECT a.created_at::text AS cuando, a.payload->>'action' AS accion,
          a.payload->>'actor_username' AS actor
   FROM auth.audit_log_entries a
   WHERE a.created_at >= '2026-08-08 00:00:00+00'
   ORDER BY a.created_at`,
  'p0b-ventana',
);
linea(`\n══ LA VENTANA DE S92 (8-ago en adelante): ${ventana.length} entradas ══\n`);
const porAccion = {};
for (const v of ventana) porAccion[v.accion] = (porAccion[v.accion] ?? 0) + 1;
for (const [a, n] of Object.entries(porAccion)) linea(`  ${String(n).padStart(4)} × ${a}`);
const noLogin = ventana.filter((v) => !/login|logout|token/i.test(v.accion ?? ''));
linea(`\n  entradas que NO son login/logout/token en esa ventana: ${noLogin.length}`);
for (const v of noLogin.slice(0, 20)) linea(`     ${v.cuando?.slice(0, 19)}  ${v.accion}  ${enmascarar(v.actor)}`);

guardarSeg2('p0b-audit.json', { tipos, cambios: cambios.length, ventana: porAccion });
linea('');
