-- REVERSA de 20260816120000_s98a_repartidor_exige_identidad.sql
-- ESCRITA ANTES DE APLICAR.
--
-- QUÉ DESHACE: saca los dos guards de `registrar_repartidor`. El alta vuelve a
-- aceptar altas sin foto ni WhatsApp.
--
-- 🔴 QUÉ **NO** DESHACE:
--   · **Los repartidores registrados CON foto no pierden nada** — la reversa es
--     del guard, no del dato.
--   · **Pero la pantalla sigue exigiéndolos.** Revertir esto solo deja la
--     obligatoriedad viviendo únicamente en el bundle, que es el estado que
--     C pidió evitar. *Si se revierte el guard, se revierte también la
--     pantalla, o la regla queda donde cualquier otra escritura la esquiva.*
--   · No toca `actualizar_repartidor` porque el guard nunca estuvo ahí.

BEGIN;

CREATE OR REPLACE FUNCTION public.registrar_repartidor(
  p_cuenta_comercial_id uuid, p_nombre text, p_documento text,
  p_telefono text DEFAULT NULL, p_user_id uuid DEFAULT NULL,
  p_tipo_documento text DEFAULT NULL, p_documento_foto_path text DEFAULT NULL,
  p_foto_path text DEFAULT NULL, p_whatsapp text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $function$
DECLARE v_id uuid; v_existente uuid; v_pais text; v_tel text; v_wa text;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  IF p_nombre IS NULL OR length(btrim(p_nombre)) = 0 THEN
    RAISE EXCEPTION 'nombre_requerido' USING ERRCODE = '22023';
  END IF;
  IF p_documento IS NULL OR length(btrim(p_documento)) = 0 THEN
    RAISE EXCEPTION 'documento_requerido' USING ERRCODE = '22023';
  END IF;
  v_tel := NULLIF(btrim(COALESCE(p_telefono,'')),'');
  v_wa  := NULLIF(btrim(COALESCE(p_whatsapp,'')),'');
  IF v_tel IS NOT NULL AND v_tel !~ '^\+[1-9][0-9]{6,14}$' THEN
    RAISE EXCEPTION 'telefono_invalido' USING ERRCODE = '22023';
  END IF;
  v_pais := 'EC';
  PERFORM _valida_identidad_repartidor(v_pais, p_tipo_documento, p_documento, v_wa);
  SELECT id INTO v_existente FROM repartidores
   WHERE cuenta_comercial_id = p_cuenta_comercial_id AND documento = btrim(p_documento);
  IF v_existente IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'repartidor_id', v_existente, 'ya_existia', true);
  END IF;
  INSERT INTO repartidores (
      cuenta_comercial_id, nombre, documento, telefono, user_id,
      tipo_documento, documento_foto_path, foto_path, whatsapp)
    VALUES (
      p_cuenta_comercial_id, btrim(p_nombre), btrim(p_documento), v_tel, p_user_id,
      NULLIF(btrim(COALESCE(p_tipo_documento,'')),''),
      NULLIF(btrim(COALESCE(p_documento_foto_path,'')),''),
      NULLIF(btrim(COALESCE(p_foto_path,'')),''),
      v_wa)
    RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'repartidor_id', v_id, 'ya_existia', false);
END $function$;

REVOKE ALL ON FUNCTION public.registrar_repartidor(uuid,text,text,text,uuid,text,text,text,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_repartidor(uuid,text,text,text,uuid,text,text,text,text) TO authenticated;

COMMIT;
