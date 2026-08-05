-- ============================================================================
-- S88-A · LOTE D-660 · TANDA ③ — las SEIS policies mecánicas
--
--   tallas · programas · especialidades · zonas · bloqueos · documentos
--
-- Todas decían lo mismo con dos formas: por `prestador_id` directo (cuatro) o
-- resolviendo por `prestador_servicio_id` (tallas y programas). Las seis pasan
-- al helper — SUPERSET exacto: nadie que pasaba deja de pasar.
--
-- ⚠️ NINGUNA ES «acto de la persona sobre sí misma» (el criterio de
-- `ph_empleado_own`): las seis son configuración DEL NEGOCIO — cuánto cobra por
-- talla, qué programas ofrece, qué especialidades declara, dónde cubre, cuándo
-- cierra, qué papeles subió. **Un administrador que no puede tocarlas no
-- administra nada.**
--
-- ⚠️ Y LAS DOS LECCIONES DE LA TANDA ② YA APLICADAS ACÁ:
--   · el cinturón mide SIN efectos laterales (el par con el admin vive en el
--     fixture con ROLLBACK — discriminar el rol exige tocar `admin_users`, y
--     bajo `db push` el rol de la migración no puede);
--   · el rol se captura y se restaura EXPLÍCITO (`RESET ROLE` no alcanza bajo
--     push, y su fallo deja el estado partido: DDL aplicado, historial sin
--     registrar).
--
-- VEDA 76(g): NO RIGE — solo policies. REVERSA: el DDL anterior vive en el
-- historial; su forma literal quedó transcrita arriba en el censo de D-660.
-- ============================================================================

BEGIN;

-- ── forma A: por `prestador_id` ─────────────────────────────────────────────
DROP POLICY prestador_bloqueos_own ON public.prestador_bloqueos;
CREATE POLICY prestador_bloqueos_own ON public.prestador_bloqueos
  FOR ALL TO authenticated
  USING (public.user_gestiona_prestador(prestador_id))
  WITH CHECK (public.user_gestiona_prestador(prestador_id));

DROP POLICY prestador_documentos_own ON public.prestador_documentos;
CREATE POLICY prestador_documentos_own ON public.prestador_documentos
  FOR ALL TO authenticated
  USING (public.user_gestiona_prestador(prestador_id))
  WITH CHECK (public.user_gestiona_prestador(prestador_id));

DROP POLICY prestador_especialidades_own ON public.prestador_especialidades;
CREATE POLICY prestador_especialidades_own ON public.prestador_especialidades
  FOR ALL TO authenticated
  USING (public.user_gestiona_prestador(prestador_id))
  WITH CHECK (public.user_gestiona_prestador(prestador_id));

DROP POLICY prestador_zonas_own ON public.prestador_zonas;
CREATE POLICY prestador_zonas_own ON public.prestador_zonas
  FOR ALL TO authenticated
  USING (public.user_gestiona_prestador(prestador_id))
  WITH CHECK (public.user_gestiona_prestador(prestador_id));

-- ── forma B: por `prestador_servicio_id` — el helper se aplica al DUEÑO DE LA
--    OFERTA, resolviendo un salto. La forma vieja hacía el mismo JOIN; lo
--    único que cambia es a quién pregunta al final.
DROP POLICY pst_own ON public.prestador_servicio_tallas;
CREATE POLICY pst_own ON public.prestador_servicio_tallas
  FOR ALL TO authenticated
  USING (prestador_servicio_id IN (
    SELECT ps.id FROM public.prestador_servicios ps
     WHERE public.user_gestiona_prestador(ps.prestador_id)))
  WITH CHECK (prestador_servicio_id IN (
    SELECT ps.id FROM public.prestador_servicios ps
     WHERE public.user_gestiona_prestador(ps.prestador_id)));

DROP POLICY pp_own ON public.prestador_programas;
CREATE POLICY pp_own ON public.prestador_programas
  FOR ALL TO authenticated
  USING (prestador_servicio_id IN (
    SELECT ps.id FROM public.prestador_servicios ps
     WHERE public.user_gestiona_prestador(ps.prestador_id)))
  WITH CHECK (prestador_servicio_id IN (
    SELECT ps.id FROM public.prestador_servicios ps
     WHERE public.user_gestiona_prestador(ps.prestador_id)));

-- ── CINTURÓN — mide ESCRITURA, que es lo que esta migración cambia ─────────
-- ⚠️ TERCERA LECCIÓN, y la cazó este mismo cinturón al abortar: la primera
-- versión contaba FILAS VISIBLES y rebotó con `recepcion=1,2,0`. No era un
-- fallo de la migración: `prestador_especialidades` y `prestador_zonas` tienen
-- policies `_public` de SELECT — **la lectura es pública a propósito**. Un
-- cinturón que mide lectura sobre una migración que cambia escritura mide otra
-- cosa y acusa al inocente. Se cuenta `ROW_COUNT` de un UPDATE.
DO $$
DECLARE
  v_recep uuid := '31bb74c0-a769-4ce0-9db8-65d9b33f7652';
  v_tit uuid := '4f572081-26a5-4d3b-9d80-25ea751fdc9c';
  v_rol text := current_user;
  v_n int; v_r text := ''; v_t text := '';
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_recep,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE prestador_especialidades SET prestador_id=prestador_id; GET DIAGNOSTICS v_n=ROW_COUNT; v_r:=v_r||v_n::text||',';
  UPDATE prestador_zonas          SET prestador_id=prestador_id; GET DIAGNOSTICS v_n=ROW_COUNT; v_r:=v_r||v_n::text;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_tit,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE prestador_especialidades SET prestador_id=prestador_id; GET DIAGNOSTICS v_n=ROW_COUNT; v_t:=v_t||v_n::text||',';
  UPDATE prestador_zonas          SET prestador_id=prestador_id; GET DIAGNOSTICS v_n=ROW_COUNT; v_t:=v_t||v_n::text;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  IF v_r <> '0,0' THEN
    RAISE EXCEPTION 'tanda3_recepcion_escribe_de_mas: %', v_r;
  END IF;
  RAISE NOTICE 'tanda ③ OK · escritura recepcion=% · titular=%', v_r, v_t;
END $$;

COMMIT;
