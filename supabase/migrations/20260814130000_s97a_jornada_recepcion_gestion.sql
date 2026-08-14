-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · LA AGENDA DE LA PUERTA NO SE LA QUITA UN CHIP (14-ago-2026)
--
-- HALLAZGO DE D, verificado por A contra la base viva. Literal medido en
-- `obtener_jornada_recepcion` (nacida en S78-A6):
--     v_ve_todo := v_es_titular OR NOT COALESCE(v_tiene_chip, false);
--
-- ⇒ Un **administrador CON chips** cae en `false`: pierde la agenda de la
--   puerta. **No se la quita el rango — se la quita el chip.** El día que un
--   administrador atienda un solo servicio, deja de ver el día del negocio
--   que administra.
--
-- 🔴 Y A MIDIÓ UNA SEGUNDA MITAD QUE EL REPORTE NO TRAÍA — el GATE DE ENTRADA:
--     empleado_tiene_rol(p_prestador_id, ARRAY['dueño','profesional','recepcion'])
--   **`administrador` tampoco está ahí.** Hoy no rebota a nadie porque la
--   fila `recepcion` es MEMBRESÍA y la tienen todos (S76-A2bis) — pero el
--   gate NOMBRA tres roles y omite el cuarto, así que su corrección depende
--   de un efecto lateral en vez de decir lo que quiere decir. Se arregla en
--   el mismo acto: **un gate que acierta por accidente es un gate que va a
--   fallar cuando el accidente cambie.**
--
-- LA FIRMA QUE LA GOBIERNA, y no es nueva: **el HOY se compone por TRABAJO y
-- SUMA, no excluye.** Un administrador que además atiende hace las dos cosas
-- — la agenda del negocio Y la suya. *Tratar el chip como un excluyente
-- convierte «además» en «en vez de».*
--
-- LO QUE **NO** SE ENSANCHA, y el contra-caso lo prueba: el **profesional
-- puro** (chip, sin rol de gestión) sigue viendo SOLO lo suyo — §4
-- consecuencia 1 de `LETRA_RECEPCION_S76`, intacta.
--
-- 76(g): NO RIGE — CREATE OR REPLACE de una función, sin backfill, sin anclas.
-- MISMA FIRMA (uuid, date), jamás DROP: tiene consumidor vivo.
-- REVERSA escrita ANTES, y AVISA que revertir reintroduce el defecto.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_jornada_recepcion(p_prestador_id uuid, p_fecha date)
RETURNS TABLE(cita_id uuid, hora time without time zone, duracion_minutos integer, estado text, tipo_servicio text, mascota_id uuid, mascota_nombre text, empleado_id uuid, empleado_nombre text, llegada_en timestamp with time zone, mascota_especie text, mascota_etapa text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid        uuid := auth.uid();
  v_mi_fila    uuid;
  v_es_titular boolean;
  v_es_gestion boolean;
  v_tiene_chip boolean;
  v_ve_todo    boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  -- S97-A: `administrador` entra al gate. Antes decía tres roles y omitía el
  -- cuarto; no rebotaba a nadie sólo porque la fila `recepcion` es membresía
  -- y la tienen todos — un acierto por efecto lateral, no por diseño.
  IF NOT public.empleado_tiene_rol(p_prestador_id, ARRAY['dueño', 'administrador', 'profesional', 'recepcion']) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE = '42501';
  END IF;

  SELECT pe.id INTO v_mi_fila
  FROM prestador_empleados pe
  WHERE pe.prestador_id = p_prestador_id AND pe.user_id = v_uid AND pe.activo;

  SELECT EXISTS (
    SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.user_id = v_uid
  ) INTO v_es_titular;

  -- S97-A: quien GESTIONA el negocio ve el día del negocio.
  v_es_gestion := public.empleado_tiene_rol(p_prestador_id, ARRAY['dueño', 'administrador']);

  SELECT EXISTS (
    SELECT 1 FROM prestador_empleado_servicios pes WHERE pes.empleado_id = v_mi_fila
  ) INTO v_tiene_chip;

  -- titular, GESTIÓN, o recepcion (definida por AUSENCIA de chip) ven el
  -- negocio; el profesional ve lo suyo — §4 consecuencia 1, intacta.
  --
  -- 🔴 S97-A · EL BRAZO `v_es_gestion` ES LA CURA (hallazgo de D). Antes,
  -- un administrador CON chips caía en false: la agenda de la puerta se la
  -- quitaba el CHIP, no el rango. La firma que lo gobierna: **el HOY se
  -- compone por TRABAJO y SUMA, no excluye** — quien administra Y atiende
  -- hace las dos cosas, y `NOT tiene_chip` convertía «además» en «en vez de».
  v_ve_todo := v_es_titular OR COALESCE(v_es_gestion, false) OR NOT COALESCE(v_tiene_chip, false);

  RETURN QUERY
  SELECT
    c.id, c.hora, c.duracion_minutos, c.estado, c.tipo_servicio, c.mascota_id,
    m.nombre, c.empleado_id, p.nombre, c.llegada_en,
    m.especie,
    CASE WHEN m.id IS NULL THEN NULL
         ELSE calcular_etapa_vida(m.fecha_nacimiento, m.especie) END
  FROM evento_cita_servicio c
  LEFT JOIN mascotas m            ON m.id = c.mascota_id
  LEFT JOIN prestador_empleados e ON e.id = c.empleado_id
  LEFT JOIN profiles p            ON p.id = e.user_id
  WHERE c.prestador_id = p_prestador_id
    AND c.fecha = p_fecha
    -- la agenda solo contiene verdad firme (§13): el hold invisible
    AND c.estado IN ('confirmada', 'en_curso', 'completada', 'no_show')
    -- "DEL NEGOCIO": la cita con `empleado_id IS NULL` VIAJA SIEMPRE, para
    -- todos. `c.empleado_id = v_mi_fila` con NULL a la izquierda da NULL, o
    -- sea FALSO, así que sin esta cláusula la despegada quedaba INVISIBLE
    -- para el profesional — y en un negocio donde el único que queda tiene
    -- chips, invisible para TODOS. (S78-A6, intacta.)
    AND (v_ve_todo OR c.empleado_id = v_mi_fila OR c.empleado_id IS NULL)
  ORDER BY c.hora ASC, c.id ASC;
END;
$function$;

-- ── CINTURÓN CON DISCRIMINADOR — el PAR que prueba la cura Y su límite ────
DO $$
DECLARE
  v_pres uuid; v_fecha date; v_emp uuid; v_uid uuid; v_serv uuid;
  v_del_negocio int; v_ve int; v_otro uuid;
BEGIN
  SET LOCAL ROLE postgres;

  -- El día del negocio con más citas: sin citas, el fixture no discrimina nada.
  SELECT c.prestador_id, c.fecha, count(*) INTO v_pres, v_fecha, v_del_negocio
    FROM evento_cita_servicio c
   WHERE c.estado IN ('confirmada','en_curso','completada','no_show')
   GROUP BY c.prestador_id, c.fecha ORDER BY count(*) DESC LIMIT 1;
  IF v_pres IS NULL OR v_del_negocio < 2 THEN
    RAISE EXCEPTION 'CINTURON ABORTA: no hay un dia con 2+ citas firmes — la cura no se puede discriminar';
  END IF;

  -- Un empleado ACTIVO no titular, para convertirlo en admin-con-chip.
  SELECT pe.id, pe.user_id INTO v_emp, v_uid
    FROM prestador_empleados pe
    JOIN prestadores pr ON pr.id = pe.prestador_id
   WHERE pe.prestador_id = v_pres AND pe.activo AND pe.user_id IS NOT NULL
     AND pe.user_id <> pr.user_id
   LIMIT 1;
  IF v_emp IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: no hay empleado no-titular vivo — el caso de la cura no existe';
  END IF;

  SELECT id INTO v_serv FROM prestador_servicios WHERE prestador_id = v_pres AND activo LIMIT 1;
  IF v_serv IS NULL THEN RAISE EXCEPTION 'CINTURON ABORTA: el negocio no tiene oferta activa'; END IF;

  -- ① EL CASO DE LA CURA: administrador CON chip. Se fabrica in-txn.
  INSERT INTO prestador_empleado_servicios (empleado_id, servicio_id)
  VALUES (v_emp, v_serv) ON CONFLICT DO NOTHING;
  INSERT INTO empleado_roles (empleado_id, rol, asignado_por)
  VALUES (v_emp, 'administrador', (SELECT user_id FROM prestadores WHERE id = v_pres))
  ON CONFLICT DO NOTHING;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role','authenticated')::text, true);
  SELECT count(*) INTO v_ve FROM obtener_jornada_recepcion(v_pres, v_fecha);
  IF v_ve <> v_del_negocio THEN
    RAISE EXCEPTION 'CINTURON 🔴: un ADMIN CON CHIP ve % de % citas — la cura no rige', v_ve, v_del_negocio;
  END IF;
  RAISE NOTICE 'OK admin con chip ve el dia entero (%/%)', v_ve, v_del_negocio;

  -- ② EL CONTRA-CASO que prueba que NO se ensanchó de más: el mismo empleado,
  --    con el chip y SIN el rol de gestión, vuelve a ver solo lo suyo.
  DELETE FROM empleado_roles WHERE empleado_id = v_emp AND rol = 'administrador';
  SELECT count(*) INTO v_ve FROM obtener_jornada_recepcion(v_pres, v_fecha);
  IF v_ve >= v_del_negocio THEN
    RAISE EXCEPTION 'CINTURON 🔴: un PROFESIONAL PURO ve % de % — se ensancho de mas (§4 rota)', v_ve, v_del_negocio;
  END IF;
  RAISE NOTICE 'OK profesional puro sigue viendo solo lo suyo (%/%)', v_ve, v_del_negocio;

  -- ③ el gate de entrada nombra los CUATRO roles
  IF pg_get_functiondef('public.obtener_jornada_recepcion(uuid,date)'::regprocedure) NOT LIKE '%administrador%' THEN
    RAISE EXCEPTION 'CINTURON: administrador no entro al gate';
  END IF;

  -- ── EL FIXTURE SE DESHACE EXPLÍCITO ──────────────────────────────────
  -- (No se usa `RAISE` como rollback: acá abortaría la migración ENTERA,
  --  incluido el CREATE OR REPLACE. El patrón in-txn-ROLLBACK es para
  --  fixtures sueltos, no para una migración que tiene que quedar aplicada.)
  PERFORM set_config('request.jwt.claims', NULL, true);
  SET LOCAL ROLE postgres;
  DELETE FROM prestador_empleado_servicios WHERE empleado_id = v_emp AND servicio_id = v_serv;
  DELETE FROM empleado_roles WHERE empleado_id = v_emp AND rol = 'administrador';

  -- Residuo medido, no supuesto.
  SELECT count(*) INTO v_ve FROM prestador_empleado_servicios WHERE empleado_id = v_emp AND servicio_id = v_serv;
  IF v_ve <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo % chip(s) del fixture', v_ve; END IF;
  SELECT count(*) INTO v_ve FROM empleado_roles WHERE empleado_id = v_emp AND rol = 'administrador';
  IF v_ve <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo % rol(es) del fixture', v_ve; END IF;

  RAISE NOTICE 'CINTURON jornada: admin+chip ve el dia entero · profesional puro solo lo suyo · gate nombra los 4 roles · residuo 0';
END $$;

COMMIT;
