/**
 * S92-A · B5 — EL BORRADO DE LAS 64 CUENTAS DE SONDA (v2).
 *
 * Orden del founder al abrir S92: «las 64 cuentas s91d-* SE BORRAN en S92, con
 * conteo antes/después y verificación de que ningún dato real fue tocado».
 *
 * ── POR QUÉ ESTA VÍA, Y NO UN DELETE EN CASCADA ──────────────────────────
 * El primer intento abortó: la FK pone `familia.created_by_user_id` en NULL y
 * eso viola `chk_familia_creador_xor`. Al medirlo se vio el tamaño real de la
 * alternativa: **40 tablas con FK RESTRICT/NO ACTION cuelgan de una mascota**.
 * Borrar el árbol completo sería una limpieza de 40+ tablas que **nadie pidió**
 * — la orden dice «las cuentas», no «todo dato que las haya rozado».
 *
 * Y el modelo ofrece la vía correcta él mismo: el XOR contempla una familia sin
 * usuario creador **siempre que declare qué sistema la creó**. Ya hay precedente
 * vivo (`backfill_s17_fase_c`). Así que las 64 familias pasan a
 * `created_by_sistema = 'limpieza_s92_sondas'` —quedando rastreables para una
 * limpieza futura— y recién entonces las cuentas se borran.
 *
 * Lo que esto deja pendiente se declara y no se esconde: los DATOS de sonda
 * (64 familias, 48 mascotas) siguen en la base, sin cuenta y etiquetados.
 *
 * ── CÓMO CORRE ───────────────────────────────────────────────────────────
 *   node scripts/s92/b5-borrar-sondas.mjs            → ENSAYO (ROLLBACK)
 *   node scripts/s92/b5-borrar-sondas.mjs --de-verdad → corrida real (COMMIT)
 * El ensayo es la misma secuencia exacta: si pasa, la real es idéntica.
 */
import { sql, guardar, linea } from './lib-s92.mjs';

const DE_VERDAD = process.argv.includes('--de-verdad');

const cuerpo = `
DO $limpieza$
DECLARE
  v_sondas int; v_fams int; v_borradas int;
  v_reales_antes int; v_reales_despues int;
BEGIN
  SELECT count(*) FILTER (WHERE email LIKE 's91d-%@epetplace.dev'),
         count(*) FILTER (WHERE email NOT LIKE 's91d-%@epetplace.dev')
    INTO v_sondas, v_reales_antes FROM auth.users;

  IF v_sondas <> 64 THEN
    RAISE EXCEPTION 'GUARD (a): el patron atrapa % y el censo dijo 64 — no se toca nada', v_sondas;
  END IF;

  -- las familias declaran su origen de sistema y sueltan al usuario, en UN acto
  -- (el XOR exige que las dos columnas cambien juntas)
  UPDATE public.familia
     SET created_by_user_id = NULL,
         created_by_sistema = 'limpieza_s92_sondas'
   WHERE created_by_user_id IN (SELECT id FROM auth.users WHERE email LIKE 's91d-%@epetplace.dev');
  GET DIAGNOSTICS v_fams = ROW_COUNT;
  RAISE NOTICE 'familias reetiquetadas: %', v_fams;

  DELETE FROM auth.users WHERE email LIKE 's91d-%@epetplace.dev';
  GET DIAGNOSTICS v_borradas = ROW_COUNT;

  IF v_borradas <> 64 THEN
    RAISE EXCEPTION 'GUARD (b): se borraron % filas y debian ser 64 — ABORTA', v_borradas;
  END IF;

  SELECT count(*) INTO v_reales_despues FROM auth.users
   WHERE email NOT LIKE 's91d-%@epetplace.dev';

  -- EL BRAZO QUE PROTEGE LO REAL: si un CASCADE se hubiera llevado a alguien,
  -- salta acá y la transaccion entera se cae.
  IF v_reales_despues <> v_reales_antes THEN
    RAISE EXCEPTION 'GUARD (c): las cuentas NO-sonda pasaron de % a % — algo real se toco. ABORTA',
      v_reales_antes, v_reales_despues;
  END IF;

  RAISE NOTICE 'OK — % cuentas borradas · % familias reetiquetadas · no-sondas intactas en %',
    v_borradas, v_fams, v_reales_despues;
END
$limpieza$;

SELECT count(*)::int AS total,
       count(*) FILTER (WHERE email LIKE 's91d-%@epetplace.dev')::int AS sondas,
       count(*) FILTER (WHERE email NOT LIKE 's91d-%@epetplace.dev')::int AS reales
FROM auth.users;`;

const antes = await sql(
  `SELECT count(*)::int AS total,
          count(*) FILTER (WHERE email LIKE 's91d-%@epetplace.dev')::int AS sondas,
          count(*) FILTER (WHERE email NOT LIKE 's91d-%@epetplace.dev')::int AS reales
   FROM auth.users`,
  'b5v2-antes',
);

linea(`\n══ B5 · BORRADO DE SONDAS — ${DE_VERDAD ? 'CORRIDA REAL (COMMIT)' : 'ENSAYO (ROLLBACK)'} ══\n`);
linea(`  ANTES:  total ${antes[0].total} · sondas ${antes[0].sondas} · no-sondas ${antes[0].reales}`);

const sqlFinal = DE_VERDAD ? `BEGIN;\n${cuerpo}\nCOMMIT;` : `BEGIN;\n${cuerpo}\nROLLBACK;`;

let despues;
try {
  despues = await sql(sqlFinal, DE_VERDAD ? 'b5v2-real' : 'b5v2-ensayo');
  linea(`  DENTRO: total ${despues[0].total} · sondas ${despues[0].sondas} · no-sondas ${despues[0].reales}`);
} catch (e) {
  const m = String(e.sqlStderr ?? e.message);
  linea(`\n  🔴 ABORTÓ (y nada se tocó):\n     ${m.match(/ERROR:.{0,300}/)?.[0] ?? m.slice(0, 300)}\n`);
  process.exit(1);
}

const control = await sql(
  `SELECT count(*)::int AS total,
          count(*) FILTER (WHERE email LIKE 's91d-%@epetplace.dev')::int AS sondas,
          count(*) FILTER (WHERE email NOT LIKE 's91d-%@epetplace.dev')::int AS reales
   FROM auth.users`,
  'b5v2-control',
);
linea(`  DESPUÉS (control real): total ${control[0].total} · sondas ${control[0].sondas} · no-sondas ${control[0].reales}`);

guardar(DE_VERDAD ? 'b5-borrado-real.json' : 'b5-borrado-ensayo.json', { antes: antes[0], control: control[0] });

if (DE_VERDAD) {
  const ok = control[0].sondas === 0 && control[0].reales === antes[0].reales;
  linea(
    ok
      ? `\n  ✅ 64 sondas BORRADAS · las ${control[0].reales} cuentas no-sonda INTACTAS (mismo número antes y después)\n`
      : '\n  🔴 los números no cierran — revisar\n',
  );
} else {
  linea(
    control[0].sondas === 64
      ? '\n  ✅ EL ENSAYO PASA y el ROLLBACK funcionó (las 64 siguen vivas).\n     Para ejecutarlo de verdad: node scripts/s92/b5-borrar-sondas.mjs --de-verdad\n'
      : `\n  ⚠️ control raro: quedan ${control[0].sondas} sondas tras un ensayo que no debía borrar.\n`,
  );
}
