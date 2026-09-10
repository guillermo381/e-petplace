-- REVERSA de 20260912120000_s114a_asunto_voz_catalogo.sql
-- Restaura _asunto_del_caso usando v_o.titulo (el código crudo del servicio).
CREATE OR REPLACE FUNCTION public._asunto_del_caso(p_tipo text, p_id uuid)
 RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_o record; v_masc text;
BEGIN
  IF p_tipo = 'pedido' THEN RETURN 'tu pedido'; END IF;
  SELECT * INTO v_o FROM _caso_dueno_del_objeto(p_tipo, p_id);
  SELECT nombre INTO v_masc FROM mascotas WHERE id = v_o.mascota_id;
  IF v_masc IS NULL THEN RETURN COALESCE(v_o.titulo, 'tu caso'); END IF;
  RETURN CASE
    WHEN p_tipo = 'estadia' THEN 'la guardería de ' || v_masc
    ELSE COALESCE(v_o.titulo, 'servicio') || ' de ' || v_masc
  END;
END $function$;
