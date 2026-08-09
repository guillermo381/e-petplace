/**
 * S92-A · B6 — LAS 64 SONDAS: cuentas borradas, datos MARCADOS COMO PRUEBA.
 *
 * **Firma del founder (9-ago-2026), vía (a):** *«borrar las cuentas de auth
 * (dejan de autenticar) y marcar los datos como prueba (excluidos de todo
 * conteo de producto). Verificación: las 64 rebotan al login + ninguna métrica
 * las cuenta. Conteo antes/después y constancia de que ningún dato real fue
 * tocado.»*
 *
 * ── POR QUÉ HAY QUE MARCAR ANTES DE BORRAR (y no es un rodeo) ─────────────
 * Los dos intentos de S92 abortaron contra CHECKs de procedencia:
 *   · `familia.chk_familia_creador_xor` — **XOR**: creador-usuario XOR
 *     creador-sistema ⇒ hay que mover LAS DOS columnas en el mismo UPDATE.
 *   · `eventos_mascota.chk_eventos_origen` — **OR**: basta con poblar
 *     `creado_por_sistema`, sin tocar `creado_por_user_id` (la FK lo anula).
 *
 * **La marca no es un parche para esquivar un CHECK: es lo que el CHECK pedía.**
 * El modelo ya tenía la convención (`created_by_sistema`, con precedente vivo
 * `backfill_s17_fase_c`), y al usarla los datos quedan **etiquetados y
 * rastreables** — que es exactamente lo que el founder pidió.
 *
 * ── LA MARCA ─────────────────────────────────────────────────────────────
 * `'sonda_s91d_purgada'` en `familia.created_by_sistema` y en
 * `eventos_mascota.creado_por_sistema`. Las MASCOTAS no llevan columna propia y
 * **no se inventa una** (esta sesión no hace DDL de producto): quedan
 * identificadas por su familia, con un solo join.
 *
 *   node scripts/s92/b6-sondas.mjs             → ENSAYO (ROLLBACK)
 *   node scripts/s92/b6-sondas.mjs --de-verdad → corrida real (COMMIT)
 */
import { sql, guardar, linea } from './lib-s92.mjs';

const DE_VERDAD = process.argv.includes('--de-verdad');
const MARCA = 'sonda_s91d_purgada';

const cuerpo = `
DO $limpieza$
DECLARE
  v_sondas int; v_reales_antes int; v_reales_despues int;
  v_fams int; v_evs int; v_borradas int;
BEGIN
  SELECT count(*) FILTER (WHERE email LIKE 's91d-%@epetplace.dev'),
         count(*) FILTER (WHERE email NOT LIKE 's91d-%@epetplace.dev')
    INTO v_sondas, v_reales_antes FROM auth.users;

  IF v_sondas <> 64 THEN
    RAISE EXCEPTION 'GUARD (a): el patron atrapa % y la firma fue sobre 64 — no se toca nada', v_sondas;
  END IF;

  -- ① FAMILIA — XOR: las dos columnas se mueven juntas o el CHECK salta
  UPDATE public.familia
     SET created_by_user_id = NULL,
         created_by_sistema = '${MARCA}'
   WHERE created_by_user_id IN (SELECT id FROM auth.users WHERE email LIKE 's91d-%@epetplace.dev');
  GET DIAGNOSTICS v_fams = ROW_COUNT;

  -- ② EVENTOS_MASCOTA — OR: alcanza con poblar el origen de sistema
  UPDATE public.eventos_mascota
     SET creado_por_sistema = COALESCE(creado_por_sistema, '${MARCA}')
   WHERE creado_por_user_id IN (SELECT id FROM auth.users WHERE email LIKE 's91d-%@epetplace.dev');
  GET DIAGNOSTICS v_evs = ROW_COUNT;

  -- ③ LAS CUENTAS
  DELETE FROM auth.users WHERE email LIKE 's91d-%@epetplace.dev';
  GET DIAGNOSTICS v_borradas = ROW_COUNT;

  SELECT count(*) INTO v_reales_despues FROM auth.users
   WHERE email NOT LIKE 's91d-%@epetplace.dev';

  IF v_borradas <> 64 THEN
    RAISE EXCEPTION 'GUARD (b): se borraron % y debian ser 64 — ABORTA', v_borradas;
  END IF;

  -- EL BRAZO QUE PROTEGE LO REAL
  IF v_reales_despues <> v_reales_antes THEN
    RAISE EXCEPTION 'GUARD (c): las cuentas NO-sonda pasaron de % a % — algo real se toco. ABORTA',
      v_reales_antes, v_reales_despues;
  END IF;

  RAISE NOTICE 'OK — % cuentas borradas · % familias marcadas · % eventos marcados · no-sondas intactas en %',
    v_borradas, v_fams, v_evs, v_reales_despues;
END
$limpieza$;

SELECT
  (SELECT count(*) FROM auth.users)::int AS usuarios_total,
  (SELECT count(*) FROM auth.users WHERE email LIKE 's91d-%@epetplace.dev')::int AS sondas,
  (SELECT count(*) FROM auth.users WHERE email NOT LIKE 's91d-%@epetplace.dev')::int AS reales,
  (SELECT count(*) FROM public.familia WHERE created_by_sistema = '${MARCA}')::int AS familias_marcadas,
  (SELECT count(*) FROM public.mascotas m
     WHERE m.familia_id IN (SELECT id FROM public.familia WHERE created_by_sistema='${MARCA}'))::int AS mascotas_de_prueba;`;

const antes = await sql(
  `SELECT count(*)::int AS total,
          count(*) FILTER (WHERE email LIKE 's91d-%@epetplace.dev')::int AS sondas,
          count(*) FILTER (WHERE email NOT LIKE 's91d-%@epetplace.dev')::int AS reales
   FROM auth.users`,
  'b6-antes',
);
linea(`\n══ B6 · SONDAS — ${DE_VERDAD ? 'CORRIDA REAL (COMMIT)' : 'ENSAYO (ROLLBACK)'} ══\n`);
linea(`  ANTES:  total ${antes[0].total} · sondas ${antes[0].sondas} · no-sondas ${antes[0].reales}`);

let dentro;
try {
  dentro = await sql(DE_VERDAD ? `BEGIN;\n${cuerpo}\nCOMMIT;` : `BEGIN;\n${cuerpo}\nROLLBACK;`, 'b6-sondas');
} catch (e) {
  const m = String(e.sqlStderr ?? e.message);
  linea(`\n  🔴 ABORTÓ (nada se tocó):\n     ${m.match(/ERROR:.{0,300}/)?.[0] ?? m.slice(0, 300)}\n`);
  process.exit(1);
}
linea(`  DENTRO: total ${dentro[0].usuarios_total} · sondas ${dentro[0].sondas} · no-sondas ${dentro[0].reales}`);
linea(`          familias marcadas ${dentro[0].familias_marcadas} · mascotas de prueba ${dentro[0].mascotas_de_prueba}`);

const control = await sql(
  `SELECT count(*)::int AS total,
          count(*) FILTER (WHERE email LIKE 's91d-%@epetplace.dev')::int AS sondas,
          count(*) FILTER (WHERE email NOT LIKE 's91d-%@epetplace.dev')::int AS reales
   FROM auth.users`,
  'b6-control',
);
linea(`  DESPUÉS (control real): total ${control[0].total} · sondas ${control[0].sondas} · no-sondas ${control[0].reales}`);
guardar(DE_VERDAD ? 'b6-sondas-real.json' : 'b6-sondas-ensayo.json', { antes: antes[0], dentro: dentro[0], control: control[0] });

if (DE_VERDAD) {
  const ok = control[0].sondas === 0 && control[0].reales === antes[0].reales;
  linea(ok
    ? `\n  ✅ 64 cuentas BORRADAS · ${control[0].reales} cuentas reales INTACTAS · datos marcados «${MARCA}»\n`
    : '\n  🔴 los números no cierran\n');
} else {
  linea(control[0].sondas === 64
    ? '\n  ✅ EL ENSAYO PASA de punta a punta y el ROLLBACK funcionó (las 64 siguen vivas).\n     Real: node scripts/s92/b6-sondas.mjs --de-verdad\n'
    : `\n  ⚠️ control raro: quedan ${control[0].sondas} sondas tras un ensayo que no debía borrar.\n`);
}
