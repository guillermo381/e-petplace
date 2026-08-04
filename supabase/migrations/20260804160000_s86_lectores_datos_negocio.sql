-- ─────────────────────────────────────────────────────────────────────
-- S86-A · LOS LECTORES DEL DASHBOARD DE **DATOS** DEL PRESTADOR
-- Contra la lámina FIRMADA por el founder el 4-ago-2026
-- (`docs/laminas/2026-08-04-s86-lamina-datos-dashboard.html`).
--
-- 76(g): **NO RIGE.** DDL puro + funciones STABLE que no escriben una
-- sola fila. Sin backfill, sin anclas, cero escritura sobre datos vivos.
-- L-140: REVOKE + GRANT explícitos al pie, con su verificación.
-- REVERSA escrita ANTES: `docs/relevamientos/2026-08-04-s86a-REVERSA-datos-negocio.sql`
--
-- ─── LAS CUATRO DECISIONES DE ESTE ARCHIVO ───────────────────────────
--
-- ① UNA SOLA DEFINICIÓN DE "ATENCIÓN QUE CUENTA", Y SE EXTRAE.
--    `obtener_plata_del_dia` (S85) ya llevaba la lista
--    ('confirmada','en_curso','completada') escrita adentro. Si estos
--    lectores la copiaran, el dashboard podría decir "24 atenciones ·
--    $312" con las dos mitades contando cosas distintas — y NADIE lo
--    vería, porque los dos números son plausibles por separado.
--    Es D-645 exacta: **el clon compila perfecto porque nunca dependió
--    del original.** Por eso nace `_estados_cita_contables()` y
--    `obtener_plata_del_dia` SE REESCRIBE para consumirlo. Dos
--    consumidores, una verdad.
--
-- ② LA FECHA SE LEE EN GUAYAQUIL, JAMÁS CON `current_date`.
--    Medido hoy contra el motor vivo: la sesión corre en **UTC**
--    (`pg_db_role_setting` sin override para NINGÚN rol), así que
--    `current_date` adelanta el día desde las 19:00 locales. Es el
--    mismo defecto que este archivo NO cura pero sí evita heredar
--    (queda como deuda propia con su número). El default es explícito
--    y el llamador puede pasar su fecha.
--    Hereda el hueco D-320 (tz hardcodeada) a propósito y declarado:
--    es lo que hace toda la casa desde S57, y divergir acá sería peor.
--
-- ③ EL DELTA COMPARA PORCIONES IGUALES — el número honesto, no el fácil.
--    La lámina dice "+4 vs anterior". Comparar una semana EMPEZADA
--    contra una semana COMPLETA fabrica una caída que no existe: un
--    martes siempre "baja" contra los 7 días previos. Acá la semana
--    anterior se trunca al MISMO día de la semana, y el payload expone
--    `diasTranscurridos` para que la superficie pueda decir contra qué
--    comparó. **Un delta sin su ventana es un verosímil-falso** (L-139).
--
-- ④ LA PLATA SE MODULA, EL RESTO NO. Gate del negocio = MEMBRESÍA
--    (`user_puede_acceder_prestador`: admin, titular o empleado activo).
--    Gate de la plata = **titular o admin**, espejo LITERAL de
--    `obtener_plata_del_dia` — S72-P1a con la corrección firmada del
--    3-ago: no es "la recepción", es TODO NO-TITULAR. Y el bloque de
--    plata devuelve `visible:false` en vez de desaparecer: un número
--    ausente sin voz se lee como pantalla rota (A3.5bis).
--
-- ⑤ EL ASTERISCO DE S85 VIAJA CON CADA MONTO: `sinPrecio` cuenta las
--    citas contables sin precio. La superficie SUMA LO QUE SABE Y
--    DECLARA LO QUE LE FALTA — jamás calla el hueco.
--
-- ⑥ TRAYECTORIA = HECHOS, JAMÁS SCORE (§2.7 · MODELO_LOYALTY §3).
--    Desde cuándo, cuántas atenciones, cuántas familias. Cero ranking,
--    cero nivel, cero racha. El motor de loyalty no asoma acá.
-- ─────────────────────────────────────────────────────────────────────

-- ① EL PREDICADO, UNA VEZ ─────────────────────────────────────────────
-- Qué cuenta como atención del negocio. `pendiente` NO entra (todavía
-- no es verdad firme), `cancelada`/`no_show`/`rechazada` tampoco.
CREATE OR REPLACE FUNCTION public._estados_cita_contables()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$ SELECT ARRAY['confirmada','en_curso','completada']::text[] $$;

COMMENT ON FUNCTION public._estados_cita_contables() IS
  'S86-A · La lista de estados que cuentan como atención del negocio, UNA sola vez. '
  'Consumidores: obtener_plata_del_dia, obtener_datos_negocio. '
  'Si agregás un consumidor, consumí ESTO — no copies la lista (D-645).';


-- ② LOS LECTORES DEL DASHBOARD ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_datos_negocio(
  p_prestador_id uuid,
  p_hasta        date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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
  IF NOT (v_es_titular OR is_admin()) THEN
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
$function$;


-- ③ `obtener_plata_del_dia` PASA A CONSUMIR EL HELPER ─────────────────
-- Mismo gate, misma forma de salida, mismos números: lo ÚNICO que
-- cambia es de dónde sale la lista de estados. Sin esto, el helper
-- tendría UN consumidor y la copia seguiría viva (D-645).
CREATE OR REPLACE FUNCTION public.obtener_plata_del_dia(p_prestador_id uuid, p_fecha date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_es_titular boolean;
  v_total     numeric;
  v_contadas  integer;
  v_sin_precio integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT EXISTS (SELECT 1 FROM prestadores p WHERE p.id = p_prestador_id AND p.user_id = v_uid)
    INTO v_es_titular;

  IF NOT (v_es_titular OR is_admin()) THEN
    /* NO es un error: es la modulación. La superficie recibe `visible:false` y
       DICE algo — un tercer número ausente sin voz se lee como pantalla rota.
       (A3.5bis: no se esconde que existe, se modula qué se ve.) */
    RETURN jsonb_build_object('visible', false);
  END IF;

  SELECT
    coalesce(sum(c.precio), 0),
    count(*),
    count(*) FILTER (WHERE c.precio IS NULL)
  INTO v_total, v_contadas, v_sin_precio
  FROM evento_cita_servicio c
  WHERE c.prestador_id = p_prestador_id
    AND c.fecha = p_fecha
    AND c.estado = ANY(public._estados_cita_contables());   -- S86-A: una verdad

  RETURN jsonb_build_object(
    'visible', true,
    'total', v_total,
    'citas', v_contadas,
    'sinPrecio', v_sin_precio   -- >0 ⇒ el total es PARCIAL y la superficie lo dice
  );
END;
$function$;


-- ④ L-140 ────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public._estados_cita_contables()        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_datos_negocio(uuid,date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_plata_del_dia(uuid,date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public._estados_cita_contables()        TO authenticated;
GRANT  EXECUTE ON FUNCTION public.obtener_datos_negocio(uuid,date) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.obtener_plata_del_dia(uuid,date) TO authenticated;

DO $verificacion$
DECLARE
  v_nombre text;
  v_acl    text;
BEGIN
  FOREACH v_nombre IN ARRAY ARRAY['_estados_cita_contables','obtener_datos_negocio','obtener_plata_del_dia'] LOOP
    SELECT array_to_string(proacl, ' ') INTO v_acl
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = v_nombre;

    IF v_acl LIKE '%anon=X%' THEN
      RAISE EXCEPTION 'L-140: anon conserva EXECUTE en % — proacl=%', v_nombre, v_acl;
    END IF;
    IF v_acl NOT LIKE '%authenticated=X%' THEN
      RAISE EXCEPTION 'authenticated NO tiene EXECUTE en % — proacl=%', v_nombre, v_acl;
    END IF;
  END LOOP;
  RAISE NOTICE 'L-140 OK en las tres funciones';
END;
$verificacion$;
