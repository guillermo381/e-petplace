-- ═════════════════════════════════════════════════════════════════════
-- S68-A9 — la conversión ATÓMICA de horarios a por_servicio
-- Origen: hallazgo de campo del founder en el gate S68 + su firma — el
-- cambio de modo deja de perder datos. La letra S60/D-386 queda INTACTA
-- (modos excluyentes, guards vivos): lo que nace es la CONVERSIÓN — en
-- una transacción, las franjas generales se replican día × oferta
-- cobrable activa en vez de morir.
--
-- 76(g) — declaración de veda: la migración solo CREA una RPC — sin
-- backfill, sin ancla sobre datos vivos (la conversión corre a demanda
-- del prestador autenticado). La veda NO rige. CERO lectores y CERO
-- triggers tocados (el ORDEN interno de la RPC satisface los guards
-- existentes: borrar generales → elegir modo → insertar específicas) →
-- sin byte-check. No toca catálogo → ley S67 no aplica (declarado).
--
-- La VUELTA (por_servicio → universal) NO pide RPC nueva — verificado:
-- `eliminarFranjasPrestador` borra las franjas del titular SIN filtrar
-- servicio_id (horarios-modo.ts) y `elegir_modo_horarios('universal')`
-- pasa con cero franjas vivas. Cubre el caso vivo N=1 (titular único);
-- con empleados N>1 la vuelta exigiría borrar franjas de TODOS —
-- declarado a la mesa, no curado (cero curas de paso).
-- ═════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.convertir_horarios_a_por_servicio()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_prestador uuid;
  v_franjas   int;
  v_servicios int;
  v_replicas  int;
BEGIN
  -- gate de identidad (espejo de elegir_modo_horarios)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  SELECT p.id INTO v_prestador
  FROM public.prestadores p
  WHERE p.user_id = auth.uid();
  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'prestador_no_encontrado' USING ERRCODE = 'P0002';
  END IF;

  -- sin generales no hay qué convertir. NOTA: esto CUBRE la idempotencia
  -- — en modo por_servicio las generales no pueden existir (guard D-386),
  -- así que la segunda llamada rebota acá, tipada.
  SELECT count(*) INTO v_franjas
  FROM public.prestador_horarios h
  WHERE h.prestador_id = v_prestador AND h.servicio_id IS NULL;
  IF v_franjas = 0 THEN
    RAISE EXCEPTION 'sin_franjas_generales' USING ERRCODE = '22023';
  END IF;

  -- oferta cobrable activa = activa Y reservable (los procedimientos y
  -- tipos no reservables no tienen agenda que servir — S68)
  SELECT count(*) INTO v_servicios
  FROM public.prestador_servicios ps
  WHERE ps.prestador_id = v_prestador AND ps.activo AND ps.reservable;
  IF v_servicios = 0 THEN
    RAISE EXCEPTION 'sin_servicios_activos' USING ERRCODE = '22023';
  END IF;

  -- (1) snapshot de las generales — de TODAS las personas del negocio
  -- (V0: la franja es de alguien; la réplica conserva a su dueño)
  DROP TABLE IF EXISTS pg_temp._conv_franjas;
  CREATE TEMP TABLE _conv_franjas ON COMMIT DROP AS
  SELECT h.empleado_id, h.dia_semana, h.hora_inicio, h.hora_fin,
         h.duracion_slot_minutos, h.max_citas_por_slot, h.activo
  FROM public.prestador_horarios h
  WHERE h.prestador_id = v_prestador AND h.servicio_id IS NULL;

  -- (2) mueren las generales (deja el terreno limpio para el trigger-red
  -- del cambio de modo — _modo_horarios_sin_franjas_ajenas, INTACTO)
  DELETE FROM public.prestador_horarios
  WHERE prestador_id = v_prestador AND servicio_id IS NULL;

  -- (3) la elección de modo por su ÚNICO escritor (D-386, intacto)
  PERFORM public.elegir_modo_horarios('por_servicio');

  -- (4) réplica día × oferta cobrable activa (el trigger
  -- _horarios_respetan_modo, INTACTO, ve modo por_servicio + específicas)
  INSERT INTO public.prestador_horarios
    (prestador_id, empleado_id, servicio_id, dia_semana, hora_inicio,
     hora_fin, duracion_slot_minutos, max_citas_por_slot, activo)
  SELECT v_prestador, f.empleado_id, ps.id, f.dia_semana, f.hora_inicio,
         f.hora_fin, f.duracion_slot_minutos, f.max_citas_por_slot, f.activo
  FROM _conv_franjas f
  CROSS JOIN public.prestador_servicios ps
  WHERE ps.prestador_id = v_prestador AND ps.activo AND ps.reservable;
  GET DIAGNOSTICS v_replicas = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'franjas_convertidas', v_replicas,
    'servicios', v_servicios
  );
END;
$function$;

-- L-140 de nacimiento
REVOKE ALL ON FUNCTION public.convertir_horarios_a_por_servicio() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convertir_horarios_a_por_servicio() TO authenticated, service_role;

-- Sonda probatoria L-140
DO $do$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname, p.proacl
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'convertir_horarios_a_por_servicio'
  LOOP
    RAISE NOTICE 'S68-A9 L-140 proacl %: %', r.proname, r.proacl;
    IF r.proacl::text LIKE '%anon=%' THEN
      RAISE EXCEPTION 'S68-A9 abort L-140: anon con EXECUTE en %', r.proname;
    END IF;
  END LOOP;
  RAISE NOTICE 'S68-A9 L-140: la conversión nace sin anon';
END;
$do$;

NOTIFY pgrst, 'reload schema';
