-- S112-A · LA PORTADA TIENE UNA SOLA PUERTA (retiro con lápida)
-- 76(g) — NO RIGE: firma, sin backfill. L-119: DROP de la de 5 argumentos.
DROP FUNCTION IF EXISTS public.poblar_vitrina_refugio(text,text,text,text,text);
CREATE OR REPLACE FUNCTION public.poblar_vitrina_refugio(p_historia text DEFAULT NULL::text, p_ciudad text DEFAULT NULL::text, p_zona text DEFAULT NULL::text, p_logo_url text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_auth uuid := auth.uid(); v_ref jsonb; v_cc uuid; v_p record; v_creada boolean := false;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  v_ref := public.obtener_mi_cuenta_refugio();
  IF v_ref IS NULL OR v_ref->>'cuenta_comercial_id' IS NULL THEN
    RAISE EXCEPTION 'no_sos_refugio' USING ERRCODE='42501';
  END IF;
  v_cc := (v_ref->>'cuenta_comercial_id')::uuid;

  SELECT * INTO v_p FROM prestadores WHERE cuenta_comercial_id = v_cc FOR UPDATE;

  IF v_p.id IS NULL THEN
    IF EXISTS (SELECT 1 FROM prestadores WHERE user_id = v_auth) THEN
      RAISE EXCEPTION 'ya_tenes_prestador: %',
        (SELECT tipo FROM prestadores WHERE user_id = v_auth LIMIT 1) USING ERRCODE='22023';
    END IF;
    INSERT INTO prestadores (user_id, cuenta_comercial_id, tipo, nombre_comercial,
                             whatsapp, estado, descripcion, ciudad, sector, foto_url)
    SELECT v_auth, v_cc, 'refugio', cc.nombre_comercial, '', 'activo',
           p_historia, p_ciudad, p_zona, p_logo_url
      FROM cuentas_comerciales cc WHERE cc.id = v_cc
    RETURNING * INTO v_p;
    v_creada := true;
  ELSE
    UPDATE prestadores
       SET descripcion = COALESCE(p_historia, descripcion),
           ciudad      = COALESCE(p_ciudad,   ciudad),
           sector      = COALESCE(p_zona,     sector),
           foto_url    = COALESCE(p_logo_url, foto_url),
           updated_at  = now()
     WHERE id = v_p.id
    RETURNING * INTO v_p;
  END IF;

  
  /* ☠️ S112-A · AQUÍ ESCRIBÍA LA PORTADA, Y MURIÓ EL MISMO DÍA.
     Recibía `p_portada_url` y la guardaba en `prestador_fotos` — **que ya
     tiene su propia puerta**, la misma que usan las fotos del animal. C lo
     midió antes de consumirlo y no lo pidió: *un parámetro que duplica una
     puerta existente no agrega un camino, agrega una segunda verdad* — y el
     día que las dos escriban distinto, la vitrina muestra una y el editor la
     otra, las dos viéndose correctas.

     **UNA SOLA PUERTA: `prestador_fotos`.** El refugio ya tiene su fila de
     prestador desde que armó su página, así que no le falta nada. */

  RETURN jsonb_build_object('ok', true, 'prestador_id', v_p.id, 'creada', v_creada,
    'cuenta_comercial_id', v_cc,
    'tiene_pagina', (v_p.descripcion IS NOT NULL AND btrim(v_p.descripcion) <> ''),
    'tiene_portada', EXISTS (SELECT 1 FROM prestador_fotos WHERE prestador_id = v_p.id));
END $function$

;
REVOKE ALL ON FUNCTION public.poblar_vitrina_refugio(text,text,text,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.poblar_vitrina_refugio(text,text,text,text) TO authenticated;
DO $c$ BEGIN
  IF to_regprocedure('public.poblar_vitrina_refugio(text,text,text,text,text)') IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURON: la sobrecarga de 5 argumentos sigue viva — dos puertas (L-119)';
  END IF;
  IF to_regprocedure('public.poblar_vitrina_refugio(text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'CINTURON: se fueron las dos';
  END IF;
  RAISE NOTICE 'CINTURON VERDE: una sola firma, sin portada';
END $c$;
