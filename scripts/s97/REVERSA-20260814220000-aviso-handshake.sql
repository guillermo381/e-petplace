-- REVERSA de 20260814220000_s97a_aviso_handshake.sql (D-815)
-- ESCRITA ANTES DE APLICAR.
--
-- QUÉ DESHACE: devuelve `crear_solicitud_autorizacion` a su cuerpo previo
-- (sin encolar) y desactiva el tipo de notificación.
--
-- 🔴 QUÉ **NO** DESHACE, y hay que leerlo antes de correrla:
--   · **Las intenciones ya encoladas QUEDAN** y se despachan igual. Son
--     avisos legítimos de solicitudes que existieron: borrarlos sería
--     quitarle a una familia el aviso de que alguien pidió ver el expediente
--     de su mascota. **No se tocan.**
--   · El tipo se **DESACTIVA (`activo=false`), NO se borra.** Si se borrara,
--     las intenciones vivas quedarían apuntando a un código inexistente. *Un
--     catálogo del que se quita una fila referenciada no se limpia: se
--     rompe.*
--   · ⚠️ **Y el efecto de producto es el que hay que declarar:** revertir
--     devuelve la app al estado de D-815 — **la pantalla del mostrador vuelve
--     a decir que le llegó el pedido al teléfono de la familia y otra vez no
--     va a ser cierto.** Si se revierte esto, **la voz tiene que corregirse
--     en el mismo acto**, o se restituye la mentira.

BEGIN;

UPDATE cat_notificacion_tipos
   SET activo = false
 WHERE codigo = 'autorizacion_mostrador_solicitada';

CREATE OR REPLACE FUNCTION public.crear_solicitud_autorizacion(
  p_cuenta_comercial_id uuid,
  p_tipo text,
  p_mascota_id uuid DEFAULT NULL,
  p_destino_user_id uuid DEFAULT NULL,
  p_payload_alta jsonb DEFAULT NULL,
  p_country_code text DEFAULT 'EC'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id AND estado = 'activa') THEN
    RAISE EXCEPTION 'cuenta_no_activa' USING ERRCODE = '22023';
  END IF;
  IF p_tipo NOT IN ('atencion','alta_mascota') THEN
    RAISE EXCEPTION 'tipo_invalido' USING ERRCODE = '22023';
  END IF;

  IF p_tipo = 'atencion' THEN
    IF p_mascota_id IS NULL THEN RAISE EXCEPTION 'mascota_requerida' USING ERRCODE = '22023'; END IF;
    IF NOT EXISTS (SELECT 1 FROM mascotas WHERE id = p_mascota_id) THEN
      RAISE EXCEPTION 'mascota_no_existe' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1 FROM solicitud_autorizacion_mostrador
      WHERE cuenta_comercial_id = p_cuenta_comercial_id AND tipo = 'atencion'
        AND mascota_id = p_mascota_id AND estado = 'pendiente' AND expira_en > now()
    ) THEN RAISE EXCEPTION 'solicitud_duplicada' USING ERRCODE = '22023'; END IF;

    INSERT INTO solicitud_autorizacion_mostrador (cuenta_comercial_id, tipo, mascota_id, solicitada_por_user_id, country_code)
    VALUES (p_cuenta_comercial_id, 'atencion', p_mascota_id, v_uid, p_country_code)
    RETURNING id INTO v_id;
  ELSE
    IF p_destino_user_id IS NULL THEN RAISE EXCEPTION 'destino_requerido' USING ERRCODE = '22023'; END IF;
    IF p_payload_alta IS NULL OR NULLIF(trim(COALESCE(p_payload_alta->>'nombre','')),'') IS NULL
       OR NULLIF(trim(COALESCE(p_payload_alta->>'especie','')),'') IS NULL THEN
      RAISE EXCEPTION 'payload_alta_invalido' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1 FROM solicitud_autorizacion_mostrador
      WHERE cuenta_comercial_id = p_cuenta_comercial_id AND tipo = 'alta_mascota'
        AND destino_user_id = p_destino_user_id AND estado = 'pendiente' AND expira_en > now()
    ) THEN RAISE EXCEPTION 'solicitud_duplicada' USING ERRCODE = '22023'; END IF;

    INSERT INTO solicitud_autorizacion_mostrador (cuenta_comercial_id, tipo, destino_user_id, payload_alta, solicitada_por_user_id, country_code)
    VALUES (p_cuenta_comercial_id, 'alta_mascota', p_destino_user_id, p_payload_alta, v_uid, p_country_code)
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$function$;

COMMIT;
