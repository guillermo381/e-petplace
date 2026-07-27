-- ═════════════════════════════════════════════════════════════════════
-- REVERSA de 20260727170000_s79_direccion_hogar_lat_lon.sql (escrita
-- ANTES de aplicar).
--
-- NOTA DE DATOS: revertir la FUNCIÓN no revierte las COORDENADAS que
-- los guardados posteriores hayan escrito en direcciones_guardadas.lat/
-- lon (columnas que existen desde S56) — quedan como estén; con la
-- función vieja simplemente dejan de actualizarse. Cero pérdida: la
-- función vieja es el body vivo pre-migración, verbatim.
-- ═════════════════════════════════════════════════════════════════════
begin;

DROP FUNCTION IF EXISTS public.guardar_direccion_hogar(text, text, text, text, text, double precision, double precision);

CREATE FUNCTION public.guardar_direccion_hogar(p_direccion text, p_ciudad text, p_sector text DEFAULT NULL::text, p_referencias text DEFAULT NULL::text, p_telefono text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_id   uuid;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_direccion IS NULL OR btrim(p_direccion) = '' THEN
    RAISE EXCEPTION 'direccion_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_ciudad IS NULL OR btrim(p_ciudad) = '' THEN
    RAISE EXCEPTION 'ciudad_requerida' USING ERRCODE = '22023';
  END IF;
  -- Espejo tipado del CHECK direcciones_guardadas_telefono_sin_plus
  -- (regla 28: E.164 sin '+'; el error tipado gana al constraint crudo).
  IF p_telefono IS NOT NULL AND p_telefono ~ '^\+' THEN
    RAISE EXCEPTION 'telefono_invalido' USING ERRCODE = '22023';
  END IF;

  INSERT INTO direcciones_guardadas AS d
    (user_id, alias, direccion, ciudad, sector, referencias, telefono, es_principal)
  VALUES
    (v_auth, 'Hogar', btrim(p_direccion), btrim(p_ciudad),
     NULLIF(btrim(p_sector), ''), NULLIF(btrim(p_referencias), ''),
     NULLIF(btrim(p_telefono), ''), true)
  ON CONFLICT (user_id) WHERE es_principal
  DO UPDATE SET
    direccion   = EXCLUDED.direccion,
    ciudad      = EXCLUDED.ciudad,
    sector      = EXCLUDED.sector,
    referencias = EXCLUDED.referencias,
    telefono    = EXCLUDED.telefono
  RETURNING d.id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'direccion_id', v_id,
    'snapshot', _direccion_hogar_snapshot(v_auth)
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.guardar_direccion_hogar(text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guardar_direccion_hogar(text, text, text, text, text) TO authenticated;

commit;
