-- ============================================================================
-- S88-A · LOTE D-660 · TANDA ② — las policies de SERVICIOS y HORARIOS
--
-- Las dos `_own` decían, literal:
--     prestador_id IN (SELECT id FROM prestadores WHERE user_id = auth.uid())
--     OR is_admin()
-- — comparación de `user_id` a mano, escrita cuando «prestador = titular» era
-- verdad. Por eso el ADMINISTRADOR medía 0 filas en las dos.
--
-- Pasan al helper: `user_gestiona_prestador()` = titular OR administrador OR
-- admin-de-plataforma. **Es un SUPERSET exacto de lo que había** — nadie que
-- pasaba antes deja de pasar.
--
-- ⚠️ `ph_empleado_own` NO MIGRA, y es la clasificación que importa: gobierna
-- la franja PROPIA de cada persona (`empleado_id` = su fila). Es self-service,
-- como el handshake — abrirla dejaría a un administrador escribiendo la
-- jornada de otro POR ESA PUERTA, cuando eso ya tiene la suya
-- (`prestador_horarios_own`, que sí abre y es la correcta).
--
-- Las `_public` de SELECT tampoco se tocan: son la vitrina, ya gatean por
-- `estado='activo'`.
--
-- VEDA 76(g): NO RIGE — solo policies. REVERSA: el DDL anterior está arriba,
-- textual, y se re-aplica desde el historial.
-- ============================================================================

BEGIN;

DROP POLICY prestador_servicios_own ON public.prestador_servicios;
CREATE POLICY prestador_servicios_own ON public.prestador_servicios
  FOR ALL TO authenticated
  USING      (public.user_gestiona_prestador(prestador_id))
  WITH CHECK (public.user_gestiona_prestador(prestador_id));

DROP POLICY prestador_horarios_own ON public.prestador_horarios;
CREATE POLICY prestador_horarios_own ON public.prestador_horarios
  FOR ALL TO authenticated
  USING      (public.user_gestiona_prestador(prestador_id))
  WITH CHECK (public.user_gestiona_prestador(prestador_id));

-- ── CINTURÓN DE LA MIGRACIÓN — solo lo que NO tiene efectos laterales ───────
-- ⚠️ APRENDIDO AL APLICAR: `db query` (el seco) y `db push` (el apply) NO
-- corren con el mismo rol. La primera versión de este cinturón apagaba la fila
-- de `admin_users` para discriminar y el apply rebotó `permission denied` donde
-- el seco había pasado. ⇒ el cinturón se queda con lo que puede medir sin
-- tocar nada; EL PAR COMPLETO (con el admin) vive en el fixture, in-txn
-- ROLLBACK: `docs/relevamientos/2026-08-05-s88a-FIXTURE-d660-tanda2.sql`.
DO $$
DECLARE
  v_aur uuid := 'de680000-0000-4000-8000-0000000000e5';
  v_recep uuid := '31bb74c0-a769-4ce0-9db8-65d9b33f7652';
  v_tit uuid := '4f572081-26a5-4d3b-9d80-25ea751fdc9c';
  v_s int; v_h int; v_r text := '';
  -- ⚠️ SEGUNDA LECCIÓN DEL APPLY: `RESET ROLE` NO devuelve al rol de la
  -- migración bajo `db push` — el cuerpo corrió, el NOTICE salió, y después
  -- rebotó `permission denied for schema supabase_migrations` al registrarse:
  -- el DDL quedó aplicado y la migración SIN REGISTRAR. Se captura el rol y se
  -- restaura EXPLÍCITO. *Un guard que deja el estado partido es peor que uno
  -- que no corre.*
  v_rol text := current_user;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_recep,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE prestador_servicios SET activo=activo WHERE prestador_id=v_aur; GET DIAGNOSTICS v_s = ROW_COUNT;
  UPDATE prestador_horarios  SET activo=activo WHERE prestador_id=v_aur; GET DIAGNOSTICS v_h = ROW_COUNT;
  v_r := v_r || format('recepcion=%s/%s | ', v_s, v_h);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_tit,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE prestador_servicios SET activo=activo WHERE prestador_id=v_aur; GET DIAGNOSTICS v_s = ROW_COUNT;
  UPDATE prestador_horarios  SET activo=activo WHERE prestador_id=v_aur; GET DIAGNOSTICS v_h = ROW_COUNT;
  v_r := v_r || format('titular=%s/%s', v_s, v_h);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  -- Se cuenta ROW_COUNT, jamás la ausencia de error: un UPDATE que la RLS
  -- filtra NO FALLA, afecta CERO (la trampa medida en el censo de D-660).
  IF v_r <> 'recepcion=0/0 | titular=9/21' THEN
    RAISE EXCEPTION 'tanda2_no_discrimina: %', v_r;
  END IF;
  RAISE NOTICE 'tanda ② OK · %', v_r;
END $$;

COMMIT;
