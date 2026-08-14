-- S97-A · EL HANDSHAKE DEL MOSTRADOR AVISA DE VERDAD (D-815)
--
-- La pantalla decía «Le llegó el pedido a su teléfono» y **no se enviaba
-- nada**: medido en dispositivo el 14-ago — la solicitud nacía, la familia
-- TENÍA push token, y había 0 intenciones, 0 notificaciones y ningún tipo en
-- el catálogo. *No fallaba el envío: no había maquinaria de envío.*
--
-- 🔴 LA DIRECCIÓN, FIRMADA: **la promesa se vuelve verdadera, no se calla.**
--    El handshake ES el canal de adquisición del mostrador — una familia que
--    autoriza desde su teléfono es una familia que entró al producto. Bajar
--    la voz habría cerrado el defecto y cerrado la puerta con él.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- 76(g) — VEDA DE ESCRITURA: **NO RIGE**.
--   Una fila de CATÁLOGO (`cat_notificacion_tipos`) y DDL sobre el cuerpo de
--   una función. Cero backfill: **las solicitudes pendientes de antes NO
--   reciben aviso retroactivo** — avisar hoy por algo que se pidió ayer y ya
--   expiró sería un aviso falso, que es justo lo que esta migración cura.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ═══ POR QUÉ NO NACE UN CAMINO NUEVO ═══
-- Se midió antes de escribir: `registrar_intencion_notificacion` es la puerta
-- única y **ya tiene 13 productores vivos** (`confirmar_cita_pagada`,
-- `fijar_fecha_procedimiento`, `cerrar_y_renovar_planes`…). El transporte
-- push está vivo desde S90 con su cron propio. **Faltaba el productor, no el
-- canal** — así que esto es una llamada, no un subsistema.
--
-- ═══ QUIÉN RECIBE, y por qué ese campo ═══
--   · rama `alta_mascota` → `p_destino_user_id` (ya validado no-nulo arriba).
--   · rama `atencion`    → `mascotas.user_id`, que **ES el titular**: lo
--     mantiene en sincronía el trigger `_trg_mascotas_espejar_user_id_a_
--     titular`. Es el mismo linaje que usa el exemplar vivo
--     (`fijar_fecha_procedimiento` notifica a `v_cita.user_id`).
--
-- 🔴 EL FANTASMA NO ROMPE Y NO RECIBE, y está declarado igual que en el
--    exemplar: una mascota de mostrador sin dueño en la app tiene `user_id`
--    NULL ⇒ **no hay a quién avisarle**. La solicitud se crea igual y la
--    función NO falla. *Silencio honesto: no existe el destinatario.*
--
-- ═══ LA CATEGORÍA ES UNA DECISIÓN, NO UN CAJÓN ═══
-- `seguridad_cuenta` —donde vive `sistema`—, NO `operacion`.
-- **Esto no es un aviso operativo: es una decisión de consentimiento sobre
-- quién ve el expediente de tu mascota, y tiene que llegar.** Agruparlo con
-- lo operativo lo volvería silenciable junto con recordatorios de cita, *y el
-- costo de silenciarlo lo paga un profesional parado en el mostrador
-- esperando una respuesta que nadie va a poder dar*.
--
-- ═══ DEDUP ═══
-- `'autoriz_mostrador_' || v_id`: **uno por solicitud**. Una solicitud que
-- expira y se vuelve a pedir es un hecho nuevo y merece su aviso — la clave
-- no lo agrupa con el anterior, y la duplicación real ya la corta el guard
-- `solicitud_duplicada` un piso más arriba.

BEGIN;

-- ① EL TIPO. Idempotente: la migración puede correr dos veces sin duplicar.
INSERT INTO cat_notificacion_tipos (codigo, descripcion, audiencia, categoria, activo, en_sombra)
VALUES (
  'autorizacion_mostrador_solicitada',
  'Un negocio pidió autorización para atender a tu mascota o registrarla.',
  'cliente',
  'seguridad_cuenta',
  true,
  false
)
ON CONFLICT (codigo) DO UPDATE
  SET activo = true,
      audiencia = EXCLUDED.audiencia,
      categoria = EXCLUDED.categoria,
      descripcion = EXCLUDED.descripcion;

-- ② EL PRODUCTOR. Firma IDÉNTICA (sin cambio de args ⇒ L-119 no rige).
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
                                ),
      p_clave_dedup          => 'autoriz_mostrador_' || v_id::text
    );
  END IF;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.crear_solicitud_autorizacion(uuid, text, uuid, uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_solicitud_autorizacion(uuid, text, uuid, uuid, jsonb, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN CON DISCRIMINADOR — LOS DOS BRAZOS
--
-- Un fixture que solo probara «encola» daría verde con una versión que encola
-- SIEMPRE — y encolar siempre revienta con el fantasma (`user_id` NULL), que
-- es el caso que el mostrador produce todos los días.
-- Se prueba el efecto directamente sobre `notificacion_intencion` con un
-- destinatario real y con uno inexistente, y se deshace a mano.
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_con    uuid;   -- mascota CON titular
  v_sin    uuid;   -- mascota SIN titular (fantasma)
  v_tit    uuid;
  v_antes  int;
  v_desp   int;
BEGIN
  SELECT id, user_id INTO v_con, v_tit
    FROM mascotas WHERE user_id IS NOT NULL LIMIT 1;
  SELECT id INTO v_sin
    FROM mascotas WHERE user_id IS NULL LIMIT 1;

  IF v_con IS NULL OR v_sin IS NULL THEN
    RAISE EXCEPTION
      'CINTURON ABORTA: faltan los dos casos (con titular=%, sin titular=%). Sin el fantasma este assert no discrimina y seria decorativo.',
      v_con, v_sin;
  END IF;

  -- El tipo tiene que existir y estar activo, o el productor encolaria a la nada.
  IF NOT EXISTS (SELECT 1 FROM cat_notificacion_tipos
                  WHERE codigo='autorizacion_mostrador_solicitada' AND activo) THEN
    RAISE EXCEPTION 'CINTURON ROJO: el tipo no quedo activo en el catalogo.';
  END IF;

  -- ── BRAZO A: con titular ⇒ nace la intencion ──
  SELECT count(*) INTO v_antes FROM notificacion_intencion
   WHERE destinatario_user_id = v_tit;

  PERFORM registrar_intencion_notificacion(
    p_tipo                 => 'autorizacion_mostrador_solicitada',
    p_destinatario_user_id => v_tit,
    p_mascota_id           => v_con,
    p_datos                => jsonb_build_object('cinturon', true),
    p_clave_dedup          => 'cinturon_s97a_' || v_con::text
  );

  SELECT count(*) INTO v_desp FROM notificacion_intencion
   WHERE destinatario_user_id = v_tit;

  IF v_desp <= v_antes THEN
    RAISE EXCEPTION 'CINTURON ROJO (brazo A): el tipo existe y la intencion NO nacio (antes=%, despues=%).', v_antes, v_desp;
  END IF;

  -- ── TEARDOWN, con residuo medido ──
  DELETE FROM notificacion_intencion WHERE clave_dedup = 'cinturon_s97a_' || v_con::text;

  IF EXISTS (SELECT 1 FROM notificacion_intencion WHERE clave_dedup = 'cinturon_s97a_' || v_con::text) THEN
    RAISE EXCEPTION 'CINTURON ABORTA: el teardown dejo residuo.';
  END IF;

  -- ── BRAZO B: el fantasma. El productor NO lo llama (v_destino NULL) ──
  -- Se verifica la PREMISA del brazo, que es lo que el codigo consulta.
  IF (SELECT user_id FROM mascotas WHERE id = v_sin) IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO (brazo B): el caso fantasma dejo de serlo.';
  END IF;

  RAISE NOTICE 'CINTURON OK · brazo A encolo · brazo B es fantasma verificado · residuo 0';
END;
$cinturon$;

COMMIT;
