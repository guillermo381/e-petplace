-- S85-A · UN NOMBRE, DOS CASAS, CERO DIVERGENCIA POSIBLE
--
-- FIRMA: *"la portada edita el nombre; el fiscal lo exhibe."*
-- ADJUDICACIÓN DE MESA (S85): gana la salida (a) de C — **el acto escribe LAS
-- DOS columnas, nunca una sola.**
--
-- ⚠️ POR QUÉ UNA RPC Y NO DOS UPDATE DESDE EL WRAPPER, que es la salida obvia:
-- dos escrituras desde el cliente **pueden fallar por separado**. Con la red
-- cortándose en el medio, el nombre quedaría cambiado en `prestadores` y viejo
-- en `cuentas_comerciales` — **y ninguna pantalla lo notaría**, porque cada una
-- lee su propia columna y las dos se verían correctas. *Es divergencia que no
-- da error, no rompe un build y nadie descubre.* Una transacción lo vuelve
-- INEXPRESABLE.
--
-- MEDIDO ANTES DE ESCRIBIR (S85-A, contra la DB viva):
--   · `nombre_comercial` existe en las DOS tablas, `text NOT NULL`.
--   · **7 de 7 filas COINCIDEN hoy** ⇒ **CERO backfill**. *Esta RPC no repara
--     una divergencia: impide la primera.*
--   · **7 de 7** tienen `prestadores.user_id = cuentas_comerciales.owner_profile_id`
--     y **cero** sin `cuenta_comercial_id`.
--   · **Ningún CHECK** sobre `nombre_comercial` en ninguna de las dos.
--
-- EL GATE, con sus DOS patas y el porqué de la segunda: exige ser **titular del
-- prestador** (`prestadores.user_id`) **Y owner de la cuenta**
-- (`cuentas_comerciales.owner_profile_id`). Hoy son la misma persona en las 7,
-- pero **la función escribe en una tabla owner-only** (el muro D-517): pedir
-- solo titularidad la volvería un camino para escribir la fila fiscal de otro.
-- *Un DEFINER salta la RLS — el gate ES la RLS que la función se saltea*
-- (L-167).
--
-- ⚠️ LO QUE NO SE INVENTA: **no se impone largo máximo.** No existe CHECK en
-- ninguna de las dos columnas ni límite en ninguna letra; poner un `120` acá
-- sería un número que nadie declaró vistiéndose de regla (L-180). **Si hace
-- falta, es CHECK con firma** — y entonces vive en la columna, no escondido en
-- una función.
--
-- 76(g) — DECLARADA: **NO RIGE.** Crea una función; cero DDL sobre tablas,
-- cero backfill, cero anclas sobre datos vivos.
--
-- REVERSA escrita ANTES:
--   docs/relevamientos/2026-08-03-s85a-REVERSA-nombre-comercial.sql

BEGIN;

CREATE OR REPLACE FUNCTION public.actualizar_nombre_comercial(p_nombre text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_nombre    text;
  v_prestador uuid;
  v_cuenta    uuid;
  v_owner     uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  v_nombre := btrim(coalesce(p_nombre, ''));
  IF v_nombre = '' THEN
    -- las dos columnas son NOT NULL: un nombre vacío no es "limpiar el campo",
    -- es un estado que la tabla no admite. Rebota hablado en vez de romper.
    RAISE EXCEPTION 'nombre_vacio';
  END IF;

  SELECT p.id, p.cuenta_comercial_id
    INTO v_prestador, v_cuenta
  FROM prestadores p
  WHERE p.user_id = v_uid;

  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'no_es_titular';
  END IF;
  IF v_cuenta IS NULL THEN
    -- estado real y no teórico: la cuenta puede no existir todavía en el alta.
    RAISE EXCEPTION 'sin_cuenta_comercial';
  END IF;

  SELECT cc.owner_profile_id INTO v_owner
  FROM cuentas_comerciales cc WHERE cc.id = v_cuenta;

  IF v_owner IS DISTINCT FROM v_uid THEN
    -- la segunda pata del gate: sin esto, un titular podría escribir la fila
    -- fiscal de una cuenta ajena por esta puerta (el DEFINER salta la RLS).
    RAISE EXCEPTION 'no_es_owner_de_la_cuenta';
  END IF;

  -- LAS DOS, en la MISMA transacción. Es la pieza entera: si la segunda
  -- falla, la primera se deshace sola y el nombre queda como estaba.
  UPDATE prestadores          SET nombre_comercial = v_nombre WHERE id = v_prestador;
  UPDATE cuentas_comerciales  SET nombre_comercial = v_nombre WHERE id = v_cuenta;

  RETURN jsonb_build_object('ok', true, 'nombre', v_nombre);
END;
$function$;

-- L-140, sin excepción: toda función nace con EXECUTE para anon por los
-- default privileges de Supabase, y `REVOKE FROM PUBLIC` NO lo quita.
REVOKE EXECUTE ON FUNCTION public.actualizar_nombre_comercial(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.actualizar_nombre_comercial(text) TO authenticated;

-- ── VERIFICACIÓN IMPERATIVA (L-063). El PAR, no el camino feliz solo. ──
DO $$
DECLARE
  v_acl    text;
  v_pid    uuid;
  v_uid    uuid;
  v_cta    uuid;
  v_antes  text;
  v_p      text;
  v_c      text;
  v_reboto boolean := false;
BEGIN
  SELECT proacl::text INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='actualizar_nombre_comercial';
  IF v_acl LIKE '%anon=X%' THEN
    RAISE EXCEPTION 'L-140: anon quedó con EXECUTE — %', v_acl;
  END IF;

  SELECT p.id, p.user_id, p.cuenta_comercial_id, p.nombre_comercial
    INTO v_pid, v_uid, v_cta, v_antes
  FROM prestadores p WHERE p.cuenta_comercial_id IS NOT NULL LIMIT 1;

  IF v_pid IS NULL THEN
    RAISE EXCEPTION 'ANCLA ROTA: cero prestadores con cuenta. El par no se puede probar (L-192).';
  END IF;

  -- (a) camino real, con el JWT del titular
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_uid::text, 'role','authenticated')::text, true);
  PERFORM public.actualizar_nombre_comercial('SONDA S85 nombre');

  SELECT p.nombre_comercial, cc.nombre_comercial INTO v_p, v_c
  FROM prestadores p JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
  WHERE p.id = v_pid;

  IF v_p <> 'SONDA S85 nombre' OR v_c <> 'SONDA S85 nombre' THEN
    RAISE EXCEPTION 'LAS DOS NO SE ESCRIBIERON: prestadores=% · cuenta=%', v_p, v_c;
  END IF;

  -- (b) contra-caso: vacío rebota. Sin esto, una función que acepta todo
  --     daría el mismo verde en (a).
  BEGIN
    PERFORM public.actualizar_nombre_comercial('   ');
  EXCEPTION WHEN others THEN
    v_reboto := (SQLERRM = 'nombre_vacio');
  END;
  IF NOT v_reboto THEN
    RAISE EXCEPTION 'VERIFICACIÓN DECORATIVA: el nombre vacío no rebotó.';
  END IF;

  -- restauración: la sonda NO deja residuo
  UPDATE prestadores         SET nombre_comercial = v_antes WHERE id = v_pid;
  UPDATE cuentas_comerciales SET nombre_comercial = v_antes WHERE id = v_cta;
  PERFORM set_config('request.jwt.claims', NULL, true);

  IF EXISTS (SELECT 1 FROM prestadores WHERE nombre_comercial = 'SONDA S85 nombre')
     OR EXISTS (SELECT 1 FROM cuentas_comerciales WHERE nombre_comercial = 'SONDA S85 nombre') THEN
    RAISE EXCEPTION 'RESIDUO: la sonda sobrevivió a su limpieza.';
  END IF;

  RAISE NOTICE 'S85 OK — las dos columnas escriben juntas · vacío rebota · residuo 0 · anon sin EXECUTE.';
END $$;

COMMIT;
