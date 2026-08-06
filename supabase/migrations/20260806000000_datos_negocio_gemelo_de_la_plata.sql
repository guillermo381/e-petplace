-- S88-A · EL GEMELO DE LA PLATA QUE NO MIGRÓ (censo de C, letra contestada)
--
-- 76(g) — VEDA: NO RIGE. `CREATE OR REPLACE` de una función de lectura.
--
-- C censó la voz «Only the owner sees earnings» del tab Data y preguntó si
-- tenía letra propia. **NO LA TIENE: era el síntoma de un gate sin migrar.**
--
--   obtener_plata_del_dia   →  mostrador-o-gestión   ✅ (curado S88)
--   obtener_datos_negocio   →  titular OR is_admin   🔴  el gemelo
--
-- **Dos lectores de LA MISMA PLATA con dos criterios distintos.** La letra
-- reconciliada —titular, administrador y recepción ven la plata— rige en los
-- dos. *Es L-206 por TERCERA vez en la sesión: se cura un lector y queda su
-- gemelo, y el que queda no falla: contesta distinto.*
--
-- ⇒ La voz de C no se cura en el texto: se cura acá, y el texto la sigue.

BEGIN;
CREATE OR REPLACE FUNCTION public.obtener_datos_negocio(p_prestador_id uuid, p_hasta date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid         uuid := auth.uid();
  v_es_titular  boolean;
  v_cuenta      uuid;
  v_hasta       date;
  v_sem_ini     date;
  v_sem_fin     date;
  v_dias        integer;
  v_prev_ini    date;
  v_prev_fin    date;
  v_mes_ini     date;
  v_estados     text[] := public._estados_cita_contables();

  v_at_sem      integer;
  v_at_prev     integer;
  v_vidas       integer;
  v_familias    integer;
  v_dia_a_dia   jsonb;
  v_mix         jsonb;
  v_mix_total   integer;
  v_plata       jsonb;
  v_tray_desde  date;
  v_tray_at     integer;
  v_tray_fam    integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  -- Gate del NEGOCIO = membresía (admin | titular | empleado activo).
  IF NOT public.user_puede_acceder_prestador(p_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;

  -- ② de la cabecera: la fecha NUNCA sale de `current_date` (UTC).
  v_hasta   := COALESCE(p_hasta, (now() AT TIME ZONE 'America/Guayaquil')::date);
  v_sem_ini := date_trunc('week', v_hasta::timestamp)::date;   -- lunes ISO
  v_sem_fin := v_sem_ini + 6;                                  -- domingo ISO
  v_dias    := (v_hasta - v_sem_ini) + 1;                      -- porción transcurrida
  v_prev_ini := v_sem_ini - 7;
  v_prev_fin := v_prev_ini + (v_dias - 1);                     -- ③: MISMA porción
  v_mes_ini := date_trunc('month', v_hasta::timestamp)::date;

  SELECT cuenta_comercial_id INTO v_cuenta FROM prestadores WHERE id = p_prestador_id;

  SELECT EXISTS (
    SELECT 1 FROM prestadores p WHERE p.id = p_prestador_id AND p.user_id = v_uid
  ) INTO v_es_titular;

  -- ── (a) TU SEMANA · atenciones y su delta ──────────────────────────
  SELECT count(*) INTO v_at_sem
  FROM evento_cita_servicio c
  WHERE c.prestador_id = p_prestador_id
    AND c.estado = ANY(v_estados)
    AND c.fecha BETWEEN v_sem_ini AND v_hasta;

  SELECT count(*) INTO v_at_prev
  FROM evento_cita_servicio c
  WHERE c.prestador_id = p_prestador_id
    AND c.estado = ANY(v_estados)
    AND c.fecha BETWEEN v_prev_ini AND v_prev_fin;

  -- ── (a) TU SEMANA · vidas nuevas y sus familias ────────────────────
  -- "Nueva" = la PRIMERA vez que este negocio tuvo acceso a esa vida.
  -- Se toma el MIN por mascota: un re-otorgamiento no la vuelve nueva.
  WITH primeras AS (
    SELECT map.mascota_id, MIN(map.otorgado_en) AS primera
    FROM mascota_acceso_prestador map
    WHERE map.cuenta_comercial_id = v_cuenta
    GROUP BY map.mascota_id
  )
  SELECT count(*), count(DISTINCT m.familia_id)
  INTO v_vidas, v_familias
  FROM primeras pr
  JOIN mascotas m ON m.id = pr.mascota_id
  WHERE (pr.primera AT TIME ZONE 'America/Guayaquil')::date BETWEEN v_sem_ini AND v_hasta;

  -- ── (b) DÍA POR DÍA · la semana ISO entera, por servicio ───────────
  -- Se emiten SOLO las combinaciones con atenciones: un día sin nada no
  -- emite fila. La superficie dibuja la semana completa; el motor no
  -- fabrica ceros (un cero fabricado no se distingue de un dato real).
  SELECT COALESCE(jsonb_agg(x ORDER BY x->>'fecha', x->>'servicio'), '[]'::jsonb)
  INTO v_dia_a_dia
  FROM (
    SELECT jsonb_build_object(
             'fecha',       c.fecha,
             'servicio',    c.tipo_servicio,
             'servicioVoz', ts.nombre,
             'atenciones',  count(*)
           ) AS x
    FROM evento_cita_servicio c
    LEFT JOIN tipos_servicio ts ON ts.codigo = c.tipo_servicio
    WHERE c.prestador_id = p_prestador_id
      AND c.estado = ANY(v_estados)
      AND c.fecha BETWEEN v_sem_ini AND v_sem_fin
    GROUP BY c.fecha, c.tipo_servicio, ts.nombre
  ) s;

  -- ── (c) EL MIX DEL MES ─────────────────────────────────────────────
  -- Se devuelven CUENTAS y el TOTAL, jamás porcentajes: el porcentaje es
  -- presentación, y si cada superficie lo recibe hecho, dos superficies
  -- pueden redondear distinto sobre el mismo dato.
  SELECT COALESCE(jsonb_agg(x ORDER BY (x->>'atenciones')::int DESC), '[]'::jsonb),
         COALESCE(sum((x->>'atenciones')::int), 0)
  INTO v_mix, v_mix_total
  FROM (
    SELECT jsonb_build_object(
             'servicio',    c.tipo_servicio,
             'servicioVoz', ts.nombre,
             'atenciones',  count(*)
           ) AS x
    FROM evento_cita_servicio c
    LEFT JOIN tipos_servicio ts ON ts.codigo = c.tipo_servicio
    WHERE c.prestador_id = p_prestador_id
      AND c.estado = ANY(v_estados)
      AND c.fecha BETWEEN v_mes_ini AND v_hasta
    GROUP BY c.tipo_servicio, ts.nombre
  ) s;

  -- ── (d) TRAYECTORIA · hechos, jamás score ──────────────────────────
  SELECT MIN(c.fecha), count(*), count(DISTINCT m.familia_id)
  INTO v_tray_desde, v_tray_at, v_tray_fam
  FROM evento_cita_servicio c
  LEFT JOIN mascotas m ON m.id = c.mascota_id
  WHERE c.prestador_id = p_prestador_id
    AND c.estado = ANY(v_estados);

  -- ── LA PLATA · modulada, con su asterisco ──────────────────────────
  /* ⚖️ S88 — EL GEMELO QUE NO MIGRÓ. Decía `v_es_titular OR is_admin()`
     mientras `obtener_plata_del_dia` ya usaba mostrador-o-gestión: **dos
     lectores de LA MISMA PLATA con dos criterios distintos**, y la voz de la
     tarjeta («Only the owner sees earnings») era el SÍNTOMA, no la letra.
     Es L-206 por tercera vez en la sesión: se cura un lector y queda su
     gemelo — y el que queda no falla: CONTESTA DISTINTO.
     **La letra reconciliada rige acá también.** */
  IF NOT public.empleado_es_mostrador_o_gestion(p_prestador_id) THEN
    v_plata := jsonb_build_object('visible', false);
  ELSE
    SELECT jsonb_build_object(
      'visible', true,
      'semana',      COALESCE(sum(c.precio) FILTER (WHERE c.fecha BETWEEN v_sem_ini AND v_hasta), 0),
      'mes',         COALESCE(sum(c.precio) FILTER (WHERE c.fecha BETWEEN v_mes_ini AND v_hasta), 0),
      -- ⑤ el asterisco de S85: cuántas de las contadas NO tenían precio.
      'sinPrecioSemana', count(*) FILTER (WHERE c.fecha BETWEEN v_sem_ini AND v_hasta AND c.precio IS NULL),
      'sinPrecioMes',    count(*) FILTER (WHERE c.fecha BETWEEN v_mes_ini AND v_hasta AND c.precio IS NULL)
    )
    INTO v_plata
    FROM evento_cita_servicio c
    WHERE c.prestador_id = p_prestador_id
      AND c.estado = ANY(v_estados)
      AND c.fecha BETWEEN LEAST(v_sem_ini, v_mes_ini) AND v_hasta;
  END IF;

  RETURN jsonb_build_object(
    'hasta', v_hasta,
    'semana', jsonb_build_object(
      'desde',             v_sem_ini,
      'hasta',             v_hasta,
      'diasTranscurridos', v_dias,          -- ③: contra qué se comparó
      'atenciones',        v_at_sem,
      'atencionesPrevias', v_at_prev,
      'delta',             v_at_sem - v_at_prev,
      'vidasNuevas',       COALESCE(v_vidas, 0),
      'familiasNuevas',    COALESCE(v_familias, 0)
    ),
    'diaPorDia',   v_dia_a_dia,
    'mix', jsonb_build_object('desde', v_mes_ini, 'total', v_mix_total, 'items', v_mix),
    'trayectoria', jsonb_build_object(
      'desde',            v_tray_desde,      -- NULL honesto si nunca atendió
      'atenciones',       COALESCE(v_tray_at, 0),
      'familiasServidas', COALESCE(v_tray_fam, 0)
    ),
    'plata', v_plata
  );
END;
$function$
;

DO $belt$
DECLARE v_d text := pg_get_functiondef('public.obtener_datos_negocio(uuid, date)'::regprocedure);
BEGIN
  IF v_d NOT LIKE '%empleado_es_mostrador_o_gestion%' THEN
    RAISE EXCEPTION 'CINTURON: el gemelo sigue con el gate viejo';
  END IF;
  IF v_d NOT LIKE '%''visible'', false%' THEN
    RAISE EXCEPTION 'CINTURON: se perdió la modulación (visible:false) — sin ella la tarjeta no habla';
  END IF;
  RAISE NOTICE 'CINTURON VERDE: el gemelo migrado, y la modulación intacta.';
END
$belt$;

COMMIT;
