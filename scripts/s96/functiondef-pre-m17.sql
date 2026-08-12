-- Cuerpos VIVOS capturados ANTES de la M17 (12-ago-2026), para su reversa.

CREATE OR REPLACE FUNCTION public._trg_producto_composicion_estado()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.composicion_estado = 'verificada' THEN
      NEW.composicion_estado := 'declarada_sin_verificar';
    END IF;
    IF NEW.composicion_estado = 'ausente' AND NEW.ingredientes_activos <> '{}' THEN
      NEW.composicion_estado := 'declarada_sin_verificar';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.composicion_estado = OLD.composicion_estado THEN
    IF OLD.composicion_estado = 'verificada'
       AND (NEW.ingredientes_activos IS DISTINCT FROM OLD.ingredientes_activos
            OR NEW.alergenos IS DISTINCT FROM OLD.alergenos
            OR NEW.composicion_mercado IS DISTINCT FROM OLD.composicion_mercado) THEN
      NEW.composicion_estado := 'declarada_sin_verificar';
    ELSIF OLD.composicion_estado = 'ausente' AND NEW.ingredientes_activos <> '{}' THEN
      NEW.composicion_estado := 'declarada_sin_verificar';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.declarar_composicion_estado(p_producto_id uuid, p_estado text DEFAULT NULL::text, p_mercado text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ingredientes text[];
  v_estado_final  text;
  v_mercado_final text;
BEGIN
  IF p_estado IS NOT NULL
     AND p_estado NOT IN ('verificada','declarada_sin_verificar','ausente') THEN
    RAISE EXCEPTION 'composicion_estado_invalido: "%"', p_estado USING ERRCODE = '22023';
  END IF;
  IF p_mercado IS NOT NULL AND p_mercado <> 'global' THEN
    IF NOT EXISTS (SELECT 1 FROM country_config WHERE country_code = p_mercado) THEN
      RAISE EXCEPTION 'mercado_invalido: "%" no es un país configurado ni ''global''', p_mercado
        USING ERRCODE = '22023';
    END IF;
  END IF;
  IF p_estado IS NULL AND p_mercado IS NULL THEN
    RAISE EXCEPTION 'composicion_estado_invalido: nada que declarar' USING ERRCODE = '22023';
  END IF;

  SELECT ingredientes_activos,
         coalesce(p_estado, composicion_estado),
         coalesce(p_mercado, composicion_mercado)
    INTO v_ingredientes, v_estado_final, v_mercado_final
    FROM productos WHERE id = p_producto_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'producto_no_existe' USING ERRCODE = '22023';
  END IF;

  -- 'verificada' es un acto de curaduría de e-PetPlace, de nadie más.
  IF p_estado = 'verificada' AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_epetplace_verifica' USING ERRCODE = '42501';
  END IF;

  -- Quién puede declarar lo demás: el equipo, o un vendedor con SKU sobre
  -- alguna variante del producto. Sin sesión = el motor por dentro.
  IF p_estado IS DISTINCT FROM 'verificada'
     AND auth.uid() IS NOT NULL AND NOT is_admin() AND NOT EXISTS (
       SELECT 1 FROM vendedor_skus vs
       JOIN producto_variantes pv ON pv.id = vs.variante_id
       WHERE pv.producto_id = p_producto_id AND es_vendedor_de(vs.cuenta_comercial_id)) THEN
    RAISE EXCEPTION 'no_podes_tocar_este_producto' USING ERRCODE = '42501';
  END IF;

  -- Un 'ausente' con composición presente sería mentir.
  IF v_estado_final = 'ausente' AND v_ingredientes <> '{}' THEN
    RAISE EXCEPTION 'composicion_presente_no_puede_ser_ausente' USING ERRCODE = '22023';
  END IF;

  -- 🔴 LA REGLA DURA, HABLADA (el CHECK de ② es el cinturón mudo detrás):
  -- verificada exige saber CONTRA QUÉ FICHA — y la global no alcanza.
  IF v_estado_final = 'verificada'
     AND (v_mercado_final IS NULL OR v_mercado_final = 'global') THEN
    RAISE EXCEPTION 'verificada_exige_mercado: una ficha global (o sin fuente) no sostiene una verificación'
      USING ERRCODE = '22023';
  END IF;

  UPDATE productos
     SET composicion_estado  = v_estado_final,
         composicion_mercado = v_mercado_final,
         updated_at          = now()
   WHERE id = p_producto_id;

  RETURN jsonb_build_object(
    'producto_id', p_producto_id,
    'composicion_estado', v_estado_final,
    'composicion_mercado', v_mercado_final);
END;
$function$
;
