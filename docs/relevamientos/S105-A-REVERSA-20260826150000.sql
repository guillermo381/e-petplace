-- REVERSA de 20260826150000_s105a_uid_estable_al_guardar.sql
-- Escrita ANTES de aplicar.
-- QUÉ DESHACE: `resolver_alta_tarjeta` vuelve a anotar EL ID DEL ALTA como
-- `proveedor_uid`, y el `ON CONFLICT` vuelve a NO revivir el estado.
--
-- 🔴 CONSECUENCIAS MEDIDAS:
--   · Vuelve la MITAD ABIERTA de `D-921`: el uid estable existe y nadie lo
--     guarda ⇒ el día que la página mande el uid estable al proveedor, el token
--     nace bajo ése y nosotros anotamos otro ⇒ **`card/list` consulta con el uid
--     equivocado y no encuentra la tarjeta.**
--   · Una tarjeta `rechazada` que se vuelve a guardar con éxito queda
--     `rechazada` para siempre.
-- ⚠️ Las filas ya escritas con el uid estable NO se revierten: revertir el
--    código no reescribe los datos.
CREATE OR REPLACE FUNCTION public.resolver_alta_tarjeta(p_alta_id uuid, p_desenlace text, p_token text DEFAULT NULL::text, p_bin text DEFAULT NULL::text, p_ultimos4 text DEFAULT NULL::text, p_marca text DEFAULT NULL::text, p_titular text DEFAULT NULL::text, p_motivo text DEFAULT NULL::text, p_alias text DEFAULT NULL::text, p_stoken_valido boolean DEFAULT NULL::boolean, p_stoken_detalle text DEFAULT NULL::text, p_expira_mes smallint DEFAULT NULL::smallint, p_expira_anio smallint DEFAULT NULL::smallint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_a public.altas_tarjeta%ROWTYPE; v_t uuid;
BEGIN
  IF p_desenlace NOT IN ('guardada','rechazada','abandonada') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'desenlace_invalido');
  END IF;

  SELECT * INTO v_a FROM public.altas_tarjeta WHERE id = p_alta_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo', 'alta_no_existe'); END IF;

  IF v_a.estado <> 'pendiente' THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true,
      'estado', v_a.estado, 'tarjeta_id', v_a.tarjeta_id);
  END IF;

  IF now() > v_a.expira_en THEN
    UPDATE public.altas_tarjeta SET estado='abandonada', cerrada_en=now(), motivo='alta_vencida'
     WHERE id = p_alta_id;
    RETURN jsonb_build_object('ok', false, 'codigo', 'alta_vencida');
  END IF;

  IF p_desenlace = 'guardada' THEN
    IF p_token IS NULL OR btrim(p_token) = '' THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'token_ausente');
    END IF;

    INSERT INTO public.tarjetas_guardadas
      (user_id, proveedor, token, bin, ultimos4, marca, titular, estado, alias, proveedor_uid,
       -- 🔴 FASE 5: el proveedor manda el vencimiento en el alta y lo estábamos
       --    tirando. Se guarda ACÁ porque es el único momento en que llega.
       expira_mes, expira_anio)
    VALUES
      (v_a.user_id, v_a.proveedor, p_token, p_bin, p_ultimos4, p_marca, p_titular,
       'guardada', NULLIF(btrim(COALESCE(p_alias,'')),''),
       -- 🔴 EL HANDLE DEL ALTA ES EL uid ANTE EL PROVEEDOR.
       v_a.id::text, p_expira_mes, p_expira_anio)
    ON CONFLICT (proveedor, token) DO UPDATE
      SET actualizada_en = now(),
          alias = COALESCE(NULLIF(btrim(COALESCE(EXCLUDED.alias,'')),''),
                           public.tarjetas_guardadas.alias),
          -- El uid NO se pisa: el token sigue atado al uid con el que nació.
          proveedor_uid = COALESCE(public.tarjetas_guardadas.proveedor_uid, EXCLUDED.proveedor_uid),
          -- El vencimiento se completa si faltaba; una re-presentación no lo borra.
          expira_mes  = COALESCE(EXCLUDED.expira_mes,  public.tarjetas_guardadas.expira_mes),
          expira_anio = COALESCE(EXCLUDED.expira_anio, public.tarjetas_guardadas.expira_anio)
      WHERE public.tarjetas_guardadas.user_id = v_a.user_id
    RETURNING id INTO v_t;

    IF v_t IS NULL THEN
      UPDATE public.altas_tarjeta
         SET estado='rechazada', cerrada_en=now(), motivo='token_de_otro_dueno',
             stoken_valido=p_stoken_valido, stoken_detalle=p_stoken_detalle
       WHERE id = p_alta_id;
      RETURN jsonb_build_object('ok', false, 'codigo', 'token_de_otro_dueno');
    END IF;

    UPDATE public.altas_tarjeta
       SET estado='guardada', tarjeta_id=v_t, cerrada_en=now(),
           stoken_valido=p_stoken_valido, stoken_detalle=p_stoken_detalle
     WHERE id = p_alta_id;
    RETURN jsonb_build_object('ok', true, 'estado', 'guardada', 'tarjeta_id', v_t);
  END IF;

  UPDATE public.altas_tarjeta
     SET estado=p_desenlace, cerrada_en=now(),
         motivo=COALESCE(NULLIF(btrim(COALESCE(p_motivo,'')),''),
                         'sin_motivo_declarado:'||p_desenlace),
         stoken_valido=p_stoken_valido, stoken_detalle=p_stoken_detalle
   WHERE id = p_alta_id;
  RETURN jsonb_build_object('ok', true, 'estado', p_desenlace);
END;
$function$
;
