-- ===========================================================================
-- REVERSA de 20260825190000_s105a_alta_devuelve_uid.sql
-- ===========================================================================
-- Escrita ANTES de aplicar, con la definicion VIVA de pg_get_functiondef.
--
-- QUE DESHACE: `crear_alta_tarjeta` deja de devolver `uid` y vuelve a devolver
--   solo {ok, alta_id, expira_en}.
--
-- ⚠️ QUE NO DESHACE: las filas ya creadas en `usuario_proveedor_uid` quedan.
--   Es correcto: son la identidad de esa persona ante el proveedor y borrarlas
--   dejaria tarjetas cuyo uid nadie puede volver a calcular (ver la reversa de
--   20260825180000). **La reversa quita la SALIDA, no la identidad.**
--
-- ⚠️ Y si para entonces la app ya manda `uid` en la URL, revertir esto deja al
--   cliente sin de donde sacarlo => volveria a mandar `alta`, o sea el
--   comportamiento viejo. No rompe: retrocede.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.crear_alta_tarjeta(p_proveedor text DEFAULT 'nuvei'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_id  uuid;
  v_exp timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  END IF;

  IF p_proveedor NOT IN ('nuvei','deuna') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'proveedor_invalido');
  END IF;

  -- 🔴 TTL de 15 minutos: el mismo número que el hold de la agenda (S54).
  --    No es una constante nueva — es la ventana que la casa ya considera
  --    razonable para que una persona termine un trámite en una pantalla.
  v_exp := now() + interval '15 minutes';

  INSERT INTO public.altas_tarjeta (user_id, proveedor, expira_en)
  VALUES (v_uid, p_proveedor, v_exp)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true, 'alta_id', v_id, 'expira_en', v_exp
  );
END;
$function$

