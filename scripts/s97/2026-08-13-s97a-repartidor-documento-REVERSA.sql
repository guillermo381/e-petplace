-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260813230000_s97a_d791_repartidor_documento.sql
-- Restaura la firma de 5 argumentos de `actualizar_repartidor` (sin
-- p_documento) — el cuerpo restaurado es el VIVO pre-migración, embebido acá
-- porque esta reversa es su única fuente.
-- ⚠️ No deshace datos: un documento ya corregido queda corregido.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.actualizar_repartidor(uuid, boolean, text, text, uuid, text);

CREATE OR REPLACE FUNCTION public.actualizar_repartidor(p_repartidor_id uuid, p_activo boolean DEFAULT NULL::boolean, p_nombre text DEFAULT NULL::text, p_telefono text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_cc uuid;
BEGIN
  SELECT cuenta_comercial_id INTO v_cc FROM repartidores WHERE id = p_repartidor_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'repartidor_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT es_vendedor_de(v_cc) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  UPDATE repartidores SET
    activo   = COALESCE(p_activo, activo),
    nombre   = COALESCE(NULLIF(btrim(COALESCE(p_nombre,'')),''), nombre),
    telefono = CASE WHEN p_telefono IS NULL THEN telefono
                    ELSE NULLIF(btrim(p_telefono),'') END,
    user_id  = COALESCE(p_user_id, user_id),
    updated_at = now()
  WHERE id = p_repartidor_id;
  RETURN jsonb_build_object('ok', true, 'repartidor_id', p_repartidor_id);
END $function$;

REVOKE EXECUTE ON FUNCTION public.actualizar_repartidor(uuid, boolean, text, text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.actualizar_repartidor(uuid, boolean, text, text, uuid) TO authenticated;

COMMIT;
