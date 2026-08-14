-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · `obtener_empleados_cuenta` GANA `user_id` — el camino «de tu
-- equipo» del paso ④ (14-ago-2026)
--
-- ORIGEN: bloqueo vivo de C, y **C frenó bien**. Montar el camino «elegí del
-- equipo» sin `user_id` crearía el repartidor **desligado de la persona** —
-- que es exactamente la doble carga que la firma existe para impedir.
--
-- LA LETRA QUE LO EXIGE (`MODELO_DESPENSA` §8.6bis ⑤, enmienda del 14-ago):
--   «LA ANTI-DUPLICACIÓN ES POR `user_id`, NO POR TABLA. La misma persona es
--    la misma persona porque es el mismo usuario, la cargue quien la cargue.»
-- ⇒ Sin `user_id` en el lector, la puerta «elegí del equipo» no puede cumplir
--   la regla que la justifica: ataría por NOMBRE, y dos personas homónimas o
--   una persona re-tipeada volverían a ser dos.
--
-- 🔴 L-119 EN SU FORMA MENOS OBVIA: acá NO se agrega un argumento — se cambia
--    la FORMA DEL RETORNO. `CREATE OR REPLACE` **no puede** cambiar el tipo
--    de retorno de una función (Postgres lo rechaza), así que es DROP +
--    CREATE obligatorio. No queda sobrecarga zombi: la firma de ARGUMENTOS
--    (uuid) no cambia, así que hay exactamente una función antes y después.
--
-- BUNDLES VIVOS (D-662): el cambio es ADITIVO para los consumidores. PostgREST
-- devuelve objetos JSON y sus dos consumidores leen por nombre
-- (`empleado_id`/`nombre`/`activo`) — un campo de más no rompe a nadie.
--
-- SOBRE EXPONER `user_id`, declarado y no colado: es un identificador interno,
-- **no dato de contacto**. La pantalla que lo recibe ya muestra el NOMBRE de
-- cada miembro, y el gate no se toca (`_user_opera_cuenta_comercial`). No se
-- ensancha la audiencia: se ensancha lo que ve quien ya veía.
--
-- 76(g): NO RIGE — cirugía de un lector, sin backfill, sin anclas.
-- REVERSA escrita ANTES, y AVISA que revertir deja sin camino al paso ④.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.obtener_empleados_cuenta(uuid);

CREATE FUNCTION public.obtener_empleados_cuenta(p_cuenta_comercial_id uuid)
RETURNS TABLE(empleado_id uuid, nombre text, activo boolean, user_id uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;

  -- Todas las personas de la cuenta con su flag `activo` (titular incluido);
  -- activas primero. El selector de "Fijar fecha" filtra activo=true.
  --
  -- S97-A · `user_id` viaja. Es la LLAVE de la anti-duplicación de
  -- `MODELO_DESPENSA` §8.6bis ⑤: el paso ④ ata el repartidor a la PERSONA,
  -- no a un nombre re-tipeado. Puede ser NULL — un empleado invitado y aún
  -- sin cuenta no tiene usuario todavía, y ese NULL es un DATO (no se puede
  -- elegir del equipo a quien todavía no existe como persona del sistema),
  -- jamás un error.
  RETURN QUERY
  SELECT pe.id, pe.nombre, pe.activo, pe.user_id
  FROM prestador_empleados pe
  JOIN prestadores p ON p.id = pe.prestador_id
  WHERE p.cuenta_comercial_id = p_cuenta_comercial_id
  ORDER BY pe.activo DESC, pe.nombre;
END;
$function$;

-- L-140
REVOKE EXECUTE ON FUNCTION public.obtener_empleados_cuenta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_empleados_cuenta(uuid) TO authenticated;

-- ── CINTURÓN CON DISCRIMINADOR ───────────────────────────────────────────
DO $$
DECLARE v_n int; v_cc uuid; v_uid uuid; v_con int; v_tot int;
BEGIN
  SET LOCAL ROLE postgres;

  -- L-119: exactamente UNA firma viva (el DROP no dejó zombi)
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_empleados_cuenta';
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: % firmas de obtener_empleados_cuenta (esperaba 1)', v_n; END IF;

  IF has_function_privilege('anon','public.obtener_empleados_cuenta(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: anon puede ejecutar (L-140)';
  END IF;

  -- EL DISCRIMINADOR: sobre una cuenta con equipo REAL, la columna llega Y
  -- trae valor. El fixture ABORTA si el caso no existe — un verde sobre una
  -- cuenta sin empleados no probaría nada.
  SELECT p.cuenta_comercial_id, cc.owner_profile_id INTO v_cc, v_uid
    FROM prestador_empleados pe
    JOIN prestadores p ON p.id = pe.prestador_id
    JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
   WHERE pe.user_id IS NOT NULL AND cc.owner_profile_id IS NOT NULL
   LIMIT 1;
  IF v_cc IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: no hay cuenta con empleado con user_id — la columna no se puede discriminar';
  END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role','authenticated')::text, true);
  SELECT count(*), count(user_id) INTO v_tot, v_con FROM obtener_empleados_cuenta(v_cc);
  IF v_tot = 0 THEN RAISE EXCEPTION 'CINTURON: el lector devolvio 0 miembros'; END IF;
  IF v_con = 0 THEN
    RAISE EXCEPTION 'CINTURON 🔴: la columna user_id llego VACIA en las % filas — el paso ④ ataria por nombre', v_tot;
  END IF;
  RAISE NOTICE 'OK user_id viaja: %/% miembros con persona atada', v_con, v_tot;

  -- Las tres columnas viejas SIGUEN — el ensanche es aditivo, no un rename.
  PERFORM empleado_id, nombre, activo FROM obtener_empleados_cuenta(v_cc) LIMIT 1;

  PERFORM set_config('request.jwt.claims', NULL, true);
  RAISE NOTICE 'CINTURON empleados: 1 firma viva (L-119) · anon fuera · user_id con valor · las 3 columnas viejas intactas';
END $$;

COMMIT;
