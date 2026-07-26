-- ─────────────────────────────────────────────────────────────────────────
-- S77-A · REVERSA A MANO de la migración 20260726120000
-- (§11.1/§11.2 — baja del vínculo + tercer brazo por chip)
--
-- QUÉ ES: el botón de vuelta atrás, escrito ANTES de aplicar. NO ES UNA
-- MIGRACIÓN — vive en docs/relevamientos/ a propósito: si se corre, se corre
-- a mano y se declara. En migrations/ se aplicaría sola en cualquier entorno.
--
-- Los `qual`/`with_check` de abajo son LITERALES, leídos de pg_policies con
-- la DB viva el 26-jul-2026 ANTES de aplicar (L-166) — no transcritos.
--
-- 76(g): NO RIGE. Policies + DROP de funciones. Cero DML.
-- ─────────────────────────────────────────────────────────────────────────

-- ── (1) LAS DOS POLICIES, A SU FORMA PREVIA (dos brazos, sin el del chip) ─
DROP POLICY IF EXISTS cita_select_prestador ON public.evento_cita_servicio;
CREATE POLICY cita_select_prestador ON public.evento_cita_servicio
  FOR SELECT TO authenticated
  USING (((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))) OR (empleado_id IN ( SELECT prestador_empleados.id
   FROM prestador_empleados
  WHERE ((prestador_empleados.user_id = auth.uid()) AND (prestador_empleados.activo = true))))));

DROP POLICY IF EXISTS cita_update_prestador ON public.evento_cita_servicio;
CREATE POLICY cita_update_prestador ON public.evento_cita_servicio
  FOR UPDATE TO authenticated
  USING (((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))) OR (empleado_id IN ( SELECT prestador_empleados.id
   FROM prestador_empleados
  WHERE ((prestador_empleados.user_id = auth.uid()) AND (prestador_empleados.activo = true))))))
  WITH CHECK (((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))) OR (empleado_id IN ( SELECT prestador_empleados.id
   FROM prestador_empleados
  WHERE ((prestador_empleados.user_id = auth.uid()) AND (prestador_empleados.activo = true))))));

-- ── (2) MUEREN LAS TRES FUNCIONES NUEVAS (orden: las que llaman primero) ──
DROP FUNCTION IF EXISTS public.dar_de_baja_empleado(uuid);
DROP FUNCTION IF EXISTS public.contar_citas_despegables(uuid);
DROP FUNCTION IF EXISTS public._cita_despegable(uuid, uuid);

-- ── NOTA: la reversa NO re-pega las citas despegadas ─────────────────────
-- Si `dar_de_baja_empleado` llegó a correr, las citas que despegó quedaron
-- con `empleado_id = NULL` y **esta reversa no las devuelve a su persona**:
-- el dato de quién era se perdió al ponerlo en NULL. Revertir el CÓDIGO no
-- revierte los DATOS. Si hubo bajas reales entre aplicar y revertir, hay que
-- reconstruirlas a mano desde `prestador_atencion_log`/eventos, y esta línea
-- existe para que nadie lo descubra tarde.

DO $reversa$
DECLARE v_brazo int; v_fns int;
BEGIN
  SELECT count(*) INTO v_brazo FROM pg_policies
  WHERE schemaname='public' AND tablename='evento_cita_servicio'
    AND (coalesce(qual,'')||coalesce(with_check,'')) LIKE '%prestador_empleado_servicios%';
  IF v_brazo <> 0 THEN
    RAISE EXCEPTION 'reversa incompleta: queda el tercer brazo en % policies', v_brazo;
  END IF;
  SELECT count(*) INTO v_fns FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN ('_cita_despegable','contar_citas_despegables','dar_de_baja_empleado');
  IF v_fns <> 0 THEN
    RAISE EXCEPTION 'reversa incompleta: quedan % funciones vivas', v_fns;
  END IF;
  RAISE NOTICE 'reversa OK: 0 tercer brazo · 0 funciones nuevas';
END;
$reversa$;
