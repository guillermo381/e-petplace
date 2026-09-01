-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · LAS ESTADÍAS SE TRAEN POR RANGO — la quinta pata se pliega al viaje
--
-- 76(g) VEDA: **NO RIGE.** Una función nueva. **Cero backfill.**
-- REVERSA: `docs/relevamientos/2026-09-07-s109a-REVERSA-M36.sql`.
--
-- ═══ POR QUÉ, con la medición de S109-D adentro ═══════════════════════════
-- Los otros cuatro lectores de la jornada traen **diez días en un fetch**
-- (S86-C) y elegir un día es **un filtro sobre memoria**.
-- `obtener_estadias_del_dia` toma **UNA fecha**, así que la quinta pata venía
-- **en su propio viaje** y se re-consultaba al cambiar de día.
--
-- 🔴 **Y D hizo lo correcto al NO inventar el rango llamando diez veces:**
--    *eso habría pagado DOS VECES la deuda que `D-738` existe para no
--    repetir* — el peaje por petición es fijo (~150 ms) y la casa ya midió que
--    **el techo no lo pone el servidor sino la cantidad de viajes por
--    pantalla** (`L-223`). Diez llamadas para pintar una rueda de diez días
--    son diez peajes por un dato que entra en uno.
--
-- ⇒ Con esto la quinta pata **se pliega al `Promise.all`** de las otras cuatro
--   y **su efecto propio muere**.
--
-- ═══ QUÉ CAMBIA Y QUÉ NO ══════════════════════════════════════════════════
-- 🟢 **`obtener_estadias_del_dia` NO se toca.** Tiene otros consumidores
--    (`atender.tsx`) que piden un día y sólo un día. *Reemplazarla por la de
--    rango obligaría a cada uno a filtrar lo que no pidió.*
-- 🔴 **La de rango DEVUELVE `fecha`, y sin eso no sirve para nada:** el
--    consumidor tiene que poder separar los días en memoria. *Un lector de
--    rango que no dice de qué día es cada fila obliga a volver a preguntar,
--    que es exactamente lo que vino a evitar.*
-- 🟢 **La verdad firme se conserva palabra por palabra**: `estado_reserva =
--    'pagada'` y `estado <> 'cancelada'`. *Un hold sin pagar no es una estadía:
--    es alguien mirando* — y una lista que los incluyera haría salir al
--    cuidador a buscar un animal que nadie compró.
-- 🟢 **Y la puerta es la misma**, no una nueva: `user_gestiona_prestador`.
--    *Un lector nuevo con su propio criterio de acceso es una segunda puerta
--    al mismo cuarto, y la segunda siempre se olvida.*
-- ⚠️ **Techo de 62 días**, para que un rango absurdo no traiga la historia
--    entera: el consumidor pide diez. *Sin techo, «por rango» es «por todo».*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_estadias_por_rango(
  p_prestador_id uuid, p_desde date, p_hasta date)
RETURNS TABLE(fecha date, estadia_id uuid, cita_id uuid, estado text,
              mascota_id uuid, mascota_nombre text, mascota_especie text,
              mascota_foto_url text, espacio_nombre text,
              direccion_snapshot jsonb, a_bordo_en timestamptz,
              llegada_en timestamptz, entregada_en timestamptz,
              estado_reserva text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  /* La MISMA puerta que la del día — no una nueva. */
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;
  IF p_desde IS NULL OR p_hasta IS NULL OR p_hasta < p_desde THEN
    RAISE EXCEPTION 'rango_invalido' USING ERRCODE = '22023';
  END IF;
  /* Sin techo, «por rango» es «por todo». */
  IF (p_hasta - p_desde) > 62 THEN
    RAISE EXCEPTION 'rango_demasiado_largo' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT c.fecha, g.id, c.id, g.estado,
         m.id, m.nombre, m.especie, m.foto_url,
         e.nombre, c.direccion_snapshot,
         g.a_bordo_en, g.llegada_en, g.entregada_en,
         c.estado_reserva
    FROM guarderia_estadias g
    JOIN evento_cita_servicio c ON c.id = g.cita_id
    JOIN mascotas m             ON m.id = c.mascota_id
    LEFT JOIN guarderia_espacios e ON e.id = g.espacio_id
   WHERE c.prestador_id = p_prestador_id
     AND c.fecha BETWEEN p_desde AND p_hasta
     /* 🔴 LA JORNADA SÓLO CONTIENE VERDAD FIRME — palabra por palabra la misma
        que la del día. *Un hold sin pagar no es una estadía: es alguien
        mirando.* */
     AND c.estado_reserva = 'pagada'
     AND g.estado <> 'cancelada'
   ORDER BY c.fecha, m.nombre;
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_estadias_por_rango(uuid,date,date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_estadias_por_rango(uuid,date,date) TO authenticated;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
-- Se ejerce el ACTO REAL contra las estadías vivas, y se exige que el rango
-- diga LO MISMO que N llamadas al lector del día. *Un lector nuevo que no
-- coincide con el que reemplaza no es una optimización: es otro dato.*
DO $cint$
DECLARE
  v_p uuid; v_f date; v_dia int; v_rango int; v_hoy date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_titular uuid; v_rol text := current_user;
BEGIN
  SELECT c.prestador_id, c.fecha INTO v_p, v_f
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE c.estado_reserva = 'pagada' AND g.estado <> 'cancelada'
   ORDER BY c.fecha DESC LIMIT 1;
  IF v_p IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no hay estadia firme contra la cual medir — un arnes que no encuentra caso no prueba nada';
  END IF;

  /* 🔴 LOS DOS LECTORES EXIGEN SESIÓN, así que el arnés tiene que TENERLA.
     Sin JWT `auth.uid()` es NULL y los dos rebotan `auth_required` — un rojo
     del INSTRUMENTO, no del producto (`L-437`). Se toma el titular REAL de ese
     prestador: medir con un usuario inventado probaría otra cosa.
     ⚠️ Y el rol se restaura con `SET LOCAL ROLE <capturado>`, jamás con
     `RESET ROLE`: bajo `db push` el RESET vuelve al rol de LOGIN del tool, no
     al de la migración — la casa ya lo pagó dos veces en un día. */
  SELECT pr.user_id INTO v_titular FROM prestadores pr WHERE pr.id = v_p;
  IF v_titular IS NULL THEN
    RAISE EXCEPTION 'CINTURON: el prestador no tiene titular — sin sesion real el arnes mediria otra cosa';
  END IF;
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_titular, 'role', 'authenticated')::text);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO v_dia   FROM public.obtener_estadias_del_dia(v_p, v_f);
  SELECT count(*) INTO v_rango FROM public.obtener_estadias_por_rango(v_p, v_f, v_f)
   WHERE fecha = v_f;
  IF v_dia <> v_rango THEN
    RAISE EXCEPTION 'CINTURON ①: el rango dice % y el dia dice % para la MISMA fecha — no es una optimizacion, es otro dato', v_rango, v_dia;
  END IF;
  IF v_dia = 0 THEN
    RAISE EXCEPTION 'CINTURON ①: los dos dieron CERO, asi que la coincidencia no prueba nada. Un censo vacio no discrimina.';
  END IF;
  RAISE NOTICE 'CINTURON ① OK - rango y dia coinciden en % fila(s) sobre la fecha %', v_dia, v_f;

  /* ② El techo existe de verdad. */
  BEGIN
    PERFORM public.obtener_estadias_por_rango(v_p, v_hoy - 400, v_hoy);
    RAISE EXCEPTION 'CINTURON ②: un rango de 400 dias paso — sin techo, "por rango" es "por todo"';
  EXCEPTION WHEN sqlstate '22023' THEN
    RAISE NOTICE 'CINTURON ② OK - el techo rebota el rango absurdo';
  END;

  /* ③ La fecha VIAJA: sin ella el consumidor no puede separar los dias y
     tendria que volver a preguntar, que es lo que este lector vino a evitar. */
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname='obtener_estadias_por_rango'
       AND pg_get_function_result(p.oid) ~ '^TABLE\(fecha date') THEN
    RAISE EXCEPTION 'CINTURON ③: la fecha no viaja en el retorno';
  END IF;
  RAISE NOTICE 'CINTURON ③ OK - la fecha viaja';

  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  RAISE NOTICE 'CINTURON VERDE - 3 brazos';
END $cint$;

COMMIT;
