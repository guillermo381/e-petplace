-- ============================================================================
-- REVERSA de 20260817120000_s99a_l2_reclamo_repartidor_por_correo.sql
-- Escrita ANTES de aplicar. S99-A, 15-ago-2026.
--
-- QUÉ DESHACE: ① dropea las dos funciones nuevas del reclamo · ② restaura los
-- cuerpos PREVIOS de registrar_repartidor / actualizar_repartidor /
-- despachar_pedido (leídos del objeto con pg_get_functiondef el 15-ago) ·
-- ③ dropea la columna `correo` + `vinculo_aceptado_en` y sus constraints.
--
-- ⚠️ QUÉ NO PUEDE DESHACER LIMPIO: el DROP de `correo` BORRA los correos ya
-- registrados y el de `vinculo_aceptado_en` borra la marca de aceptación —
-- los user_id ya atados por aceptación QUEDAN atados (revertir el código no
-- des-reclama cuentas; des-reclamar sería un acto de datos aparte y a mano).
-- NOTA DE BUNDLES (D-662): las firmas de registrar/actualizar ganan un
-- parámetro CON DEFAULT — el bundle vivo (S98) llama sin él y sigue entero;
-- revertir tampoco lo rompe. El guard de despachar_pedido sí cambia
-- comportamiento: revertirlo re-permite despachar a repartidores sin cuenta.
-- ============================================================================

DROP FUNCTION IF EXISTS public.aceptar_vinculo_repartidor();
DROP FUNCTION IF EXISTS public.mis_vinculos_repartidor_pendientes();

-- Firmas nuevas con p_correo: DROP explícito (L-119) antes de restaurar las viejas.
DROP FUNCTION IF EXISTS public.registrar_repartidor(uuid, text, text, text, uuid, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.actualizar_repartidor(uuid, boolean, text, text, uuid, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.registrar_repartidor(p_cuenta_comercial_id uuid, p_nombre text, p_documento text, p_telefono text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid, p_tipo_documento text DEFAULT NULL::text, p_documento_foto_path text DEFAULT NULL::text, p_foto_path text DEFAULT NULL::text, p_whatsapp text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  -- ── LOS DOS OBLIGATORIOS (firma del founder, leída igual por A y por C) ──
  -- «foto del repartidor, **obligatoria**» · «WhatsApp **no opcional**».
  -- Van ANTES del chequeo de idempotencia a propósito: un alta incompleta no
  -- debe poder «pasar» devolviendo el id de una fila que ya existía.
  IF p_foto_path IS NULL OR length(btrim(p_foto_path)) = 0 THEN
    RAISE EXCEPTION 'foto_persona_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_whatsapp IS NULL OR length(btrim(p_whatsapp)) = 0 THEN
    RAISE EXCEPTION 'whatsapp_requerido' USING ERRCODE = '22023';
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

CREATE OR REPLACE FUNCTION public.actualizar_repartidor(p_repartidor_id uuid, p_activo boolean DEFAULT NULL::boolean, p_nombre text DEFAULT NULL::text, p_telefono text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid, p_documento text DEFAULT NULL::text, p_tipo_documento text DEFAULT NULL::text, p_documento_foto_path text DEFAULT NULL::text, p_foto_path text DEFAULT NULL::text, p_whatsapp text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_cc uuid; v_doc text; v_pais text; v_tipo_final text; v_doc_final text; v_wa text;
BEGIN
  SELECT cuenta_comercial_id, country_code INTO v_cc, v_pais
    FROM repartidores WHERE id = p_repartidor_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'repartidor_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT es_vendedor_de(v_cc) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  v_doc := NULLIF(btrim(COALESCE(p_documento,'')),'');
  IF v_doc IS NOT NULL AND EXISTS (
    SELECT 1 FROM repartidores
     WHERE cuenta_comercial_id = v_cc AND documento = v_doc AND id <> p_repartidor_id
  ) THEN
    RAISE EXCEPTION 'documento_en_uso: otro repartidor de esta casa ya tiene ese documento'
      USING ERRCODE = '23505';
  END IF;

  v_wa := NULLIF(btrim(COALESCE(p_whatsapp,'')),'');
  IF p_telefono IS NOT NULL AND NULLIF(btrim(p_telefono),'') IS NOT NULL
     AND btrim(p_telefono) !~ '^\+[1-9][0-9]{6,14}$' THEN
    RAISE EXCEPTION 'telefono_invalido' USING ERRCODE = '22023';
  END IF;

  -- 🔴 La máscara se valida contra el par FINAL, no contra lo que vino.
  -- Cambiar SOLO el tipo tiene que chocar con el documento que YA está
  -- guardado — si se validara solo lo entrante, poner `tipo='CEDULA'` sobre un
  -- documento de 4 dígitos pasaría, y quedaría una fila internamente falsa.
  SELECT COALESCE(NULLIF(btrim(COALESCE(p_tipo_documento,'')),''), tipo_documento),
         COALESCE(v_doc, documento)
    INTO v_tipo_final, v_doc_final
    FROM repartidores WHERE id = p_repartidor_id;

  PERFORM _valida_identidad_repartidor(v_pais, v_tipo_final, v_doc_final, v_wa);

  UPDATE repartidores SET
    activo    = COALESCE(p_activo, activo),
    nombre    = COALESCE(NULLIF(btrim(COALESCE(p_nombre,'')),''), nombre),
    telefono  = CASE WHEN p_telefono IS NULL THEN telefono
                     ELSE NULLIF(btrim(p_telefono),'') END,
    user_id   = COALESCE(p_user_id, user_id),
    documento = COALESCE(v_doc, documento),
    tipo_documento      = COALESCE(NULLIF(btrim(COALESCE(p_tipo_documento,'')),''), tipo_documento),
    documento_foto_path = COALESCE(NULLIF(btrim(COALESCE(p_documento_foto_path,'')),''), documento_foto_path),
    foto_path           = COALESCE(NULLIF(btrim(COALESCE(p_foto_path,'')),''), foto_path),
    whatsapp            = COALESCE(v_wa, whatsapp),
    updated_at = now()
  WHERE id = p_repartidor_id;
  RETURN jsonb_build_object('ok', true, 'repartidor_id', p_repartidor_id);
END $function$;

-- despachar_pedido: cuerpo PREVIO verbatim (leído del objeto el 15-ago) —
-- sin el guard `repartidor_sin_cuenta`.
CREATE OR REPLACE FUNCTION public.despachar_pedido(p_pedido_id uuid, p_repartidor_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ped record; v_rep record; v_envio uuid; v_codigo text; v_reintento boolean := false;
BEGIN
  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;
  IF auth.uid() IS NOT NULL AND NOT es_vendedor_de(v_ped.cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  IF v_ped.metodo_entrega <> 'despacho' THEN
    -- El retiro no se despacha: se entrega en el mostrador contra el código.
    RAISE EXCEPTION 'retiro_no_se_despacha: este pedido es de retiro en tienda; se entrega en el mostrador'
      USING ERRCODE = '22023';
  END IF;

  -- La decisión ① del founder: la entrega la asigna el SELLER. El repartidor
  -- tiene que ser de SU casa y estar activo — asignarle el envío a un
  -- repartidor ajeno le abriría la dirección de una familia que no es suya.
  SELECT * INTO v_rep FROM repartidores
   WHERE id = p_repartidor_id AND cuenta_comercial_id = v_ped.cuenta_comercial_id AND activo;
  IF v_rep.id IS NULL THEN
    RAISE EXCEPTION 'repartidor_invalido: no existe, no es de esta casa o está inactivo'
      USING ERRCODE = '22023';
  END IF;

  IF v_ped.entrega_direccion IS NULL OR length(btrim(v_ped.entrega_direccion)) = 0 THEN
    -- Sin dirección no hay a dónde ir: el envío nacería con un destino vacío
    -- y el repartidor lo descubriría arriba de la moto.
    RAISE EXCEPTION 'pedido_sin_direccion' USING ERRCODE = '22023';
  END IF;

  v_reintento := (v_ped.estado = 'entrega_fallida');

  -- El envío: UNO por pedido. El reintento reusa la fila (mismo código — la
  -- familia ya lo tiene) y suma el intento; el primer despacho la crea con el
  -- SNAPSHOT que la pantalla del repartidor lee. El código es de 4 dígitos:
  -- se dice en una puerta, de viva voz, una sola vez.
  SELECT id INTO v_envio FROM envios WHERE pedido_id = p_pedido_id;
  IF v_envio IS NULL THEN
    v_codigo := lpad(floor(random() * 10000)::int::text, 4, '0');
    INSERT INTO envios (pedido_id, cuenta_comercial_id, country_code, transportista,
                        metodo, estado, repartidor_id, codigo_verificacion,
                        destino_ciudad, destino_direccion, destino_referencia,
                        instrucciones_entrega, destino_lat, destino_lon,
                        nombre_receptor, telefono_receptor,
                        promesa_entrega_desde, promesa_entrega_hasta,
                        entrega_programada, intentos_entrega, costo_envio, moneda,
                        pagado_por, salio_en)
      VALUES (p_pedido_id, v_ped.cuenta_comercial_id, COALESCE(v_ped.country_code,'EC'),
              'propio', 'despacho', 'en_reparto', p_repartidor_id,
              v_codigo,
              v_ped.entrega_ciudad, v_ped.entrega_direccion, v_ped.entrega_referencias,
              v_ped.entrega_instrucciones, v_ped.entrega_lat, v_ped.entrega_lon,
              v_ped.entrega_nombre_receptor, v_ped.entrega_telefono,
              v_ped.promesa_entrega_desde, v_ped.promesa_entrega_hasta,
              v_ped.entrega_programada, 0, COALESCE(v_ped.costo_envio, 0),
              COALESCE(v_ped.moneda,'USD'), 'seller', now())
      RETURNING id INTO v_envio;
  ELSE
    UPDATE envios SET repartidor_id = p_repartidor_id, estado = 'en_reparto',
                      salio_en = now(), hacia_destino_en = NULL, updated_at = now()
     WHERE id = v_envio;
    SELECT codigo_verificacion INTO v_codigo FROM envios WHERE id = v_envio;
  END IF;

  PERFORM _mover_estado_pedido(p_pedido_id, 'en_reparto', 'vendedor');

  RETURN jsonb_build_object('ok', true, 'envio_id', v_envio,
                            'repartidor_id', p_repartidor_id,
                            'codigo_verificacion', v_codigo,
                            'reintento', v_reintento,
                            'narrativa', 'en_camino');
END $function$;

-- La columna, al final (BORRA datos — ver cabecera):
ALTER TABLE public.repartidores DROP CONSTRAINT IF EXISTS chk_repartidores_correo_forma;
ALTER TABLE public.repartidores DROP CONSTRAINT IF EXISTS uq_repartidor_correo;
ALTER TABLE public.repartidores DROP COLUMN IF EXISTS correo;
ALTER TABLE public.repartidores DROP COLUMN IF EXISTS vinculo_aceptado_en;
