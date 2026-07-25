-- ─────────────────────────────────────────────────────────────────────────
-- S77-A · REVERSA A MANO de la migración 20260725120000
-- (D-532: el flip §6.2 en los helpers de caso)
--
-- QUÉ ES ESTO: el botón de vuelta atrás, escrito ANTES de aplicar, porque el
-- founder viaja y una reconstrucción a las apuradas no es un plan. NO ES UNA
-- MIGRACIÓN — vive en docs/relevamientos/ a propósito: si se corre, se corre
-- a mano y se declara. Ponerlo en migrations/ lo haría parte del historial y
-- lo aplicaría en cualquier entorno nuevo, que es exactamente lo contrario.
--
-- CÓMO SE USA: pegarlo entero en el SQL editor (o
-- `npx supabase --experimental db query --linked --file <este archivo>`).
-- Deja la DB byte-idéntica al estado previo a 20260725120000.
--
-- LOS CUERPOS SON LITERALES, LEÍDOS DE LA DB VIVA con pg_get_functiondef el
-- 25-jul-2026 ANTES de aplicar — no transcritos de un reporte (L-166).
--
-- 76(g): NO RIGE. Cuatro sentencias de catálogo, cero DML, cero backfill.
--
-- ORDEN DE LA REVERSA (importa): primero los helpers y la de un argumento
-- vuelven a su cuerpo viejo — que NO cita la sobrecarga —, y recién entonces
-- la sobrecarga se puede DROPear sin dependencias colgando.
-- ─────────────────────────────────────────────────────────────────────────


-- ── (1) LOS DOS HELPERS DE CASO, A SU CUERPO PREVIO (gate por FILA DE ROL)

CREATE OR REPLACE FUNCTION public._user_clinica_tratante_del_caso(p_caso_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM caso_clinico cc
    JOIN cuentas_comerciales cco ON cco.id = cc.cuenta_comercial_tratante_id
    WHERE cc.id = p_caso_id
      AND (
        -- Caso A: user es owner de la cuenta tratante
        cco.owner_profile_id = p_user_id
        -- Caso B: user es empleado activo CON ROL CLINICO (D-464 S73)
        OR EXISTS (
          SELECT 1 FROM prestador_empleados pe
          JOIN prestadores p ON p.id = pe.prestador_id
          WHERE p.cuenta_comercial_id = cc.cuenta_comercial_tratante_id
            AND pe.user_id = p_user_id
            AND pe.activo = true
            AND EXISTS (
              SELECT 1 FROM empleado_roles er
              WHERE er.empleado_id = pe.id
                AND er.rol IN ('dueño', 'profesional')
            )
        )
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public._user_clinica_consultor_del_caso(p_caso_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM caso_clinico_consultor ccc
    JOIN cuentas_comerciales cco ON cco.id = ccc.cuenta_comercial_consultor_id
    WHERE ccc.caso_clinico_id = p_caso_id
      AND ccc.hasta IS NULL
      AND (
        cco.owner_profile_id = p_user_id
        OR EXISTS (
          SELECT 1 FROM prestador_empleados pe
          JOIN prestadores p ON p.id = pe.prestador_id
          WHERE p.cuenta_comercial_id = ccc.cuenta_comercial_consultor_id
            AND pe.user_id = p_user_id
            AND pe.activo = true
            AND EXISTS (
              SELECT 1 FROM empleado_roles er
              WHERE er.empleado_id = pe.id
                AND er.rol IN ('dueño', 'profesional')
            )
        )
      )
  );
$function$;

-- ── (2) LA DE UN ARGUMENTO, A SU CUERPO PREVIO (sin delegar) ────────────
CREATE OR REPLACE FUNCTION public.empleado_tiene_capacidad_clinica(p_prestador_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    is_admin()
    OR EXISTS (
      SELECT 1 FROM prestadores p
      WHERE p.id = p_prestador_id AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM prestador_empleados pe
      JOIN prestador_empleado_servicios pes ON pes.empleado_id = pe.id
      JOIN prestador_servicios ps            ON ps.id = pes.servicio_id
      JOIN tipos_servicio ts                 ON ts.codigo = ps.tipo_servicio
      WHERE pe.prestador_id = p_prestador_id
        AND pe.user_id = auth.uid()
        AND pe.activo = true
        AND ts.es_medico = true
    );
$function$;

-- ── (3) MUERE LA SOBRECARGA (ya sin consumidores tras (1) y (2)) ────────
DROP FUNCTION IF EXISTS public.empleado_tiene_capacidad_clinica(uuid, uuid);


-- ── (4) MUERE EL PISO RESTRICTIVE DE INSERT ────────────────────────────
-- Al caer, `prestadores` vuelve a admitir el INSERT con `cuenta_comercial_id`
-- ajeno por sus cuatro policies permisivas. Es el estado previo, y se revierte
-- porque una reversa que deja mitades es peor que no revertir.
DROP POLICY IF EXISTS prestadores_insert_cuenta_propia ON public.prestadores;


-- ── VERIFICACIÓN DE LA REVERSA (aborta si quedó a medias) ──────────────
DO $reversa$
DECLARE
  v_rezagadas  int;
  v_sobrecarga int;
  v_piso       int;
BEGIN
  -- las dos volvieron a gatear por FILA DE ROL (el estado previo)
  SELECT count(*) INTO v_rezagadas
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND pg_get_functiondef(p.oid) ~ 'er\.rol\s+IN\s*\(\s*''dueño''\s*,\s*''profesional''\s*\)';
  IF v_rezagadas <> 2 THEN
    RAISE EXCEPTION 'reversa incompleta: se esperaban las 2 funciones con gate por fila de rol, hay %', v_rezagadas;
  END IF;

  SELECT count(*) INTO v_sobrecarga
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.oid::regprocedure::text = 'empleado_tiene_capacidad_clinica(uuid,uuid)';
  IF v_sobrecarga <> 0 THEN
    RAISE EXCEPTION 'reversa incompleta: la sobrecarga sigue viva';
  END IF;

  SELECT count(*) INTO v_piso
  FROM pg_policies
  WHERE schemaname='public' AND tablename='prestadores'
    AND policyname='prestadores_insert_cuenta_propia';
  IF v_piso <> 0 THEN
    RAISE EXCEPTION 'reversa incompleta: la policy RESTRICTIVE sigue viva';
  END IF;

  RAISE NOTICE 'reversa OK: 2 helpers al gate por fila de rol · sobrecarga muerta · piso RESTRICTIVE muerto';
END;
$reversa$;
