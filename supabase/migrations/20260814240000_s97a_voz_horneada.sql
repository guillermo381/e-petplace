-- S97-A · LA VOZ DEL HANDSHAKE SE HORNEA AL ENCOLAR (cierra D-815)
--
-- 🔴 EL HUECO, medido con el push YA LLEGANDO al teléfono: la notificación
--    decía «Tienes una novedad en e-PetPlace · Abre la app para verla».
--    La rama de voz existía (`20260814230000`) **y nadie la llamaba.**
--
-- LA CAUSA, en dos lecturas de la fuente:
--   · `despachar-push` NO resuelve la voz: lee `datos.titulo` y cae a un
--     genérico si falta (su línea 205).
--   · `registrar_intencion_notificacion` **tampoco** la llama.
--   ⇒ **La hornea CADA PRODUCTOR.** Medido: los nueve que ya tienen voz lo
--     hacen con el mismo idioma — `jsonb_build_object(...) || _voz_notificacion(...)`.
--
-- *Escribir la rama de voz y no llamarla es «motor sin puerta» en chiquito:
--  el texto existe, es correcto, y no lo lee nadie.* Y su modo de falla es el
--  peor de todos: **no falla** — manda el genérico y parece que funcionó.
--
-- 76(g): NO RIGE — DDL sobre el cuerpo de una función. Cero filas tocadas.
-- Firma IDÉNTICA ⇒ L-119 no rige.

BEGIN;

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
  v_uid      uuid := auth.uid();
  v_id       uuid;
  v_destino  uuid;
  v_negocio  text;
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

    -- El titular, espejado por trigger. NULL ⇒ fantasma sin dueño en la app.
    SELECT user_id INTO v_destino FROM mascotas WHERE id = p_mascota_id;
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

    v_destino := p_destino_user_id;
  END IF;

  -- ═══ EL AVISO (D-815) ═══
  -- Sin destinatario NO se avisa y NO se rompe: la solicitud vale igual.
  IF v_destino IS NOT NULL THEN
    SELECT nombre_comercial INTO v_negocio
      FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id;

    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'autorizacion_mostrador_solicitada',
      p_destinatario_user_id => v_destino,
      p_mascota_id           => p_mascota_id,   -- NULL en la rama de alta: la
                                                -- mascota todavía no existe
      p_datos                => jsonb_build_object(
                                  'solicitud_id',         v_id,
                                  'tipo',                 p_tipo,
                                  'cuenta_comercial_id',  p_cuenta_comercial_id,
                                  'negocio',              v_negocio
                                )
                                -- LA VOZ SE HORNEA ACA, no en el transporte:
                                -- `despachar-push` lee `datos.titulo` (su
                                -- linea 205) y si no esta cae al generico.
                                -- Idioma canonico de la casa: `||` funde
                                -- titulo/mensaje adentro de datos.
                                || public._voz_notificacion(
                                     'autorizacion_mostrador_solicitada',
                                     v_destino,
                                     p_mascota_id,
                                     jsonb_build_object('negocio', v_negocio,
                                                        'tipo',    p_tipo)),
      p_clave_dedup          => 'autoriz_mostrador_' || v_id::text
    );
  END IF;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.crear_solicitud_autorizacion(uuid, text, uuid, uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_solicitud_autorizacion(uuid, text, uuid, uuid, jsonb, text) TO authenticated;

-- CINTURON: la voz tiene que quedar HORNEADA, no prometida.
DO $cinturon$
DECLARE v_t text;
BEGIN
  v_t := (public._voz_notificacion('autorizacion_mostrador_solicitada',
            (SELECT user_id FROM mascotas WHERE user_id IS NOT NULL LIMIT 1),
            (SELECT id FROM mascotas WHERE user_id IS NOT NULL LIMIT 1),
            jsonb_build_object('negocio','Clinica X','tipo','atencion')))->>'titulo';
  IF v_t IS NULL OR v_t = '' THEN
    RAISE EXCEPTION 'CINTURON ROJO: la voz devuelve vacio — el push caeria al generico.';
  END IF;
  IF position('Clinica X' in v_t) = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO: la voz ignora el negocio (titulo=%).', v_t;
  END IF;
  RAISE NOTICE 'CINTURON OK · la voz nombra al negocio: %', v_t;
END;
$cinturon$;

COMMIT;
