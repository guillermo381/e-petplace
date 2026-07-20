-- S70-A8 — D-442: EQUIVALENCIA DE PREFIJO PAÍS EN TELÉFONOS (Opción A
-- ratificada en mesa). Hallazgo founder en campo: perfil real guardado
-- '3005604012' (CO, sin prefijo, cuenta de primeras versiones); la búsqueda
-- '+573005604012' bajo EC no matcheaba porque normalizar_telefono solo
-- strippeaba el prefijo del país PASADO (593), nunca el '57' del input.
--
-- Cura: cuando el input trae '+' EXPLÍCITO, el número es internacional →
-- strip del prefijo de CUALQUIER país de cat_paises (greedy por el prefijo
-- MÁS LARGO, para desambiguar 593 de 59/5). SIN '+', el comportamiento
-- ANTERIOR intacto (solo el prefijo del país pasado + troncal '0') — así un
-- nacional pelado que casualmente empiece con dígitos de un calling-code NO
-- se muerde. UNA función; los 5 puntos de match la heredan
-- (buscar_cliente_por_telefono · _trg_cpr_normaliza_telefono ·
-- _trg_completar_pendiente_registro · crear_alta_asistida_pendiente).
-- 76(g): aditiva (reemplazo de body, sin cambio de firma ni de datos).

CREATE OR REPLACE FUNCTION public.normalizar_telefono(p_texto text, p_country_code text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_d text;
  v_pref text;
  v_tiene_plus boolean;
BEGIN
  IF p_texto IS NULL THEN RETURN NULL; END IF;
  -- el '+' explícito marca forma internacional (D-442)
  v_tiene_plus := position('+' in p_texto) > 0;
  v_d := regexp_replace(p_texto, '\D', '', 'g');
  IF v_d = '' THEN RETURN NULL; END IF;

  IF v_tiene_plus THEN
    -- D-442: internacional → strip del prefijo de CUALQUIER país conocido,
    -- greedy por el MÁS LARGO (593 antes que 59/5). Cura cross-país.
    SELECT regexp_replace(cp.prefijo_telefono, '\D', '', 'g') INTO v_pref
    FROM cat_paises cp
    WHERE regexp_replace(cp.prefijo_telefono, '\D', '', 'g') <> ''
      AND length(v_d) > length(regexp_replace(cp.prefijo_telefono, '\D', '', 'g'))
      AND left(v_d, length(regexp_replace(cp.prefijo_telefono, '\D', '', 'g')))
          = regexp_replace(cp.prefijo_telefono, '\D', '', 'g')
    ORDER BY length(regexp_replace(cp.prefijo_telefono, '\D', '', 'g')) DESC
    LIMIT 1;
    IF v_pref IS NOT NULL THEN
      v_d := substr(v_d, length(v_pref) + 1);
    END IF;
  ELSE
    -- sin '+': comportamiento ANTERIOR — solo el prefijo del país pasado.
    SELECT regexp_replace(cp.prefijo_telefono, '\D', '', 'g') INTO v_pref
    FROM cat_paises cp WHERE cp.codigo_iso2 = p_country_code;
    IF v_pref IS NOT NULL AND length(v_d) > length(v_pref) AND left(v_d, length(v_pref)) = v_pref THEN
      v_d := substr(v_d, length(v_pref) + 1);
    END IF;
  END IF;

  v_d := ltrim(v_d, '0');
  RETURN NULLIF(v_d, '');
END;
$function$;

-- L-140: helper puro (lo llaman RPCs DEFINER como owner) — sin anon.
REVOKE EXECUTE ON FUNCTION public.normalizar_telefono(text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.normalizar_telefono(text, text) TO authenticated;
