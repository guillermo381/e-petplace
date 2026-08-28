-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — EL CUPO POR RANGO, EN UN SOLO VIAJE
--
-- Por qué existe, y no es comodidad: el contrato promete
-- `obtenerCupoGuarderia(prestadorId, desde, hasta)` porque **el calendario de
-- B pinta un mes**. Resolverlo llamando `cupo_guarderia_del_dia` treinta veces
-- desde el cliente son **treinta viajes**, y la casa ya midió lo que eso cuesta:
-- *«no hay consultas que optimizar, hay viajes que eliminar»* — un peaje fijo
-- de ~150 ms por petición, sin importar cuánto traiga (L-223, S94-PERF).
-- 🔴 **Un mes de cupo tiene que costar UN viaje.**
--
-- La función NO reimplementa la cuenta: **llama a la de un día**, para que no
-- puedan divergir. *Dos implementaciones del mismo dato se separan un día y
-- nadie se entera* (método §6).
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260828170000-cupo-por-rango.sql
-- 76(g): NO RIGE — aditiva pura, el cinturón sólo LEE.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE FUNCTION public.cupo_guarderia_del_rango(
  p_prestador_id uuid,
  p_desde        date,
  p_hasta        date
) RETURNS TABLE(fecha date, capacidad int, consumido int, disponible int, sobrevendido boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_dias int := (p_hasta - p_desde) + 1;
BEGIN
  IF p_hasta < p_desde THEN
    RAISE EXCEPTION 'rango_invertido' USING ERRCODE = '22023';
  END IF;
  /* Techo: un calendario pinta un mes, no un año. Sin techo, una pantalla
     distraída pide 3 años y el servidor los calcula. */
  IF v_dias > 62 THEN
    RAISE EXCEPTION 'rango_demasiado_largo' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT d::date,
         (c->>'capacidad')::int,
         (c->>'consumido')::int,
         (c->>'disponible')::int,
         (c->>'sobrevendido')::boolean
    FROM generate_series(p_desde, p_hasta, interval '1 day') d
    CROSS JOIN LATERAL public.cupo_guarderia_del_dia(p_prestador_id, d::date) c;
END $$;

-- L-140
REVOKE EXECUTE ON FUNCTION public.cupo_guarderia_del_rango(uuid, date, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.cupo_guarderia_del_rango(uuid, date, date) TO authenticated;

-- ── CINTURÓN (sólo lee) ────────────────────────────────────────────────────
DO $c$
DECLARE
  v_prestador uuid;
  v_desde date := public.hoy_local();
  v_filas int;
  v_dif   int;
BEGIN
  SELECT id INTO v_prestador FROM prestadores WHERE estado='activo' AND user_id IS NOT NULL LIMIT 1;
  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: no hay prestador activo contra el cual medir.';
  END IF;

  SELECT count(*) INTO v_filas
    FROM public.cupo_guarderia_del_rango(v_prestador, v_desde, v_desde + 29);
  IF v_filas <> 30 THEN
    RAISE EXCEPTION 'ROJO: 30 dias pedidos, % filas devueltas.', v_filas;
  END IF;

  /* 🔴 EL DISCRIMINADOR QUE IMPORTA: rango y día tienen que decir LO MISMO.
     Si divergen, el calendario del mes y la reserva del día contestarían
     distinto sobre la misma fecha — y ése es el defecto que se ve recién
     cuando alguien reserva. */
  SELECT count(*) INTO v_dif
    FROM public.cupo_guarderia_del_rango(v_prestador, v_desde, v_desde + 29) r
   WHERE r.disponible IS DISTINCT FROM
         (public.cupo_guarderia_del_dia(v_prestador, r.fecha)->>'disponible')::int;
  IF v_dif <> 0 THEN
    RAISE EXCEPTION 'ROJO: % dias en que el rango y el dia no coinciden.', v_dif;
  END IF;

  BEGIN
    PERFORM public.cupo_guarderia_del_rango(v_prestador, v_desde + 5, v_desde);
    RAISE EXCEPTION 'ROJO: un rango invertido PASO.';
  EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;

  RAISE NOTICE '✅ CINTURON rango: 30/30 filas · 0 divergencias con el dia · el invertido rebota';
END $c$;

COMMIT;
