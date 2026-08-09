/**
 * S92-A · LA PRUEBA DE FUEGO DEL CINTURÓN — antes de confiarle la migración.
 *
 * L-192: una verificación cuyo modo de falla es el silencio no es una
 * verificación. Y el error ② de S91 fue peor que silencio: un cinturón que
 * abortó una migración de seguridad **con el agujero abierto**, por un LIKE mal
 * escrito. Un rojo verdadero por razón falsa se lee igual que uno bueno.
 *
 * Así que el cinturón se corre HOY, contra el estado SIN curar, donde tiene que
 * salir ROJO por las tres razones correctas. Si saliera verde acá, es
 * decorativo y la migración no se aplica.
 *
 * Nada de esto escribe: cada prueba corre dentro de su propia transacción con
 * ROLLBACK, y las dos últimas simulan la cura al revés para ver fallar (b) y (c).
 *
 * Corre: node scripts/s92/b1-probar-cinturon.mjs
 */

import { sql, linea } from './lib-s92.mjs';

const BRAZO_A = `
DO $c$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN ('mi_email','test_marca_nombre','_user_es_titular_familia')
    AND has_function_privilege('anon', p.oid, 'EXECUTE');
  IF v > 0 THEN RAISE EXCEPTION 'CINTURÓN (a): % siguen alcanzables por anon', v; END IF;
END $c$;`;

/**
 * ⚠️ HALLAZGO DE ESTA PRUEBA, y cambia cómo se escriben TODOS los revokes de la
 * sesión: la primera versión de este brazo revocaba `mi_email` solo de
 * `authenticated` y el cinturón daba VERDE. No era un cinturón flojo —
 * `has_function_privilege` decía la verdad: **`authenticated` seguía pudiendo
 * ejecutar porque PUBLIC tenía EXECUTE, y todo rol hereda de PUBLIC.**
 *
 * ⇒ Un `REVOKE … FROM anon` que deje PUBLIC intacto NO CIERRA NADA. Por eso
 * cada REVOKE de esta sesión nombra `anon, PUBLIC` juntos, y por eso esta
 * prueba tiene que sacar a PUBLIC primero para poder ver fallar el brazo (b).
 */
const BRAZO_B = `
BEGIN;
REVOKE EXECUTE ON FUNCTION public.mi_email() FROM authenticated, anon, PUBLIC;
DO $c$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN ('mi_email')
    AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE');
  IF v > 0 THEN RAISE EXCEPTION 'CINTURÓN (b): % helpers cerrados a authenticated', v; END IF;
END $c$;
ROLLBACK;`;

const BRAZO_C = `
DO $c$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN ('test_registry_insert','simular_cliente_crea_familia')
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE');
  IF v > 0 THEN RAISE EXCEPTION 'CINTURÓN (c): % del andamiaje al alcance de authenticated', v; END IF;
END $c$;`;

const pruebas = [
  ['(a) ¿caza funciones abiertas a anon?', BRAZO_A, 'CINTURÓN (a)'],
  ['(b) ¿caza un helper cerrado a authenticated por error?', BRAZO_B, 'CINTURÓN (b)'],
  ['(c) ¿caza andamiaje al alcance de authenticated?', BRAZO_C, 'CINTURÓN (c)'],
];

linea('\n══ PRUEBA DE FUEGO DEL CINTURÓN — tiene que salir ROJO tres veces ══\n');
let todosRojos = true;
for (const [rotulo, sqlTexto, esperado] of pruebas) {
  let salio;
  try {
    await sql(sqlTexto, `cinturon-${esperado.slice(-2, -1)}`);
    salio = '🟢 VERDE — el cinturón NO cazó nada. ES DECORATIVO.';
    todosRojos = false;
  } catch (e) {
    const msg = String(e.sqlStderr ?? e.message);
    if (msg.includes(esperado)) {
      salio = `🔴 ROJO por la razón correcta — «${msg.match(/CINTURÓN \([abc]\)[^\n"\\]*/)?.[0] ?? esperado}»`;
    } else {
      salio = `⚠️ rojo por OTRA razón (no prueba el cinturón): ${msg.slice(0, 200)}`;
      todosRojos = false;
    }
  }
  linea(`  ${rotulo}\n     ${salio}\n`);
}

linea(
  todosRojos
    ? '  ✅ LOS TRES BRAZOS PUEDEN SALIR ROJOS. El cinturón sirve; la migración se puede aplicar.\n'
    : '  🔴 ALGÚN BRAZO NO PRODUCE SU ROJO. NO se aplica la migración hasta arreglarlo.\n',
);
