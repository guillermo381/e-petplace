-- ============================================================================
-- S99-A · L2 — LA LLAVE DE RECLAMO POR CORREO + EL GUARD DE CUENTA RECLAMADA
-- (adjudicaciones de mesa 15-ago, ítems 2 y 9)
--
-- LA FIRMA QUE ESTO EJECUTA: «correo = llave de acceso · WhatsApp = contacto»
-- (PLAN_S99 §1.6) con la adjudicación #2: el vendedor registra el CORREO del
-- repartidor; la persona SE CREA LA CUENTA SOLA (signup abierto, medido en
-- L0-A2) y **ACEPTA al primer ingreso** — jamás una cuenta paralela, jamás
-- un auto-atado silencioso (un correo mal tipeado no ata a un desconocido).
-- Y la #9: `despachar_pedido` NO acepta un repartidor sin cuenta reclamada —
-- cura POR CONSTRUCCIÓN, no validación de pantalla.
--
-- QUÉ HACE:
--   ① `repartidores.correo` (nullable, forma verificada, guardado en lower)
--     + UNIQUE (cuenta, correo) + `vinculo_aceptado_en`.
--   ② `registrar_repartidor` / `actualizar_repartidor` ganan `p_correo`
--     (DEFAULT NULL — COMPATIBLE HACIA ATRÁS: el bundle vivo S98 llama sin
--     él y sigue entero, D-662). 🔴 LA OBLIGACIÓN DE CORREO NO SE ENCIENDE
--     ACÁ: rige el orden de S98 (lección 5) — ① la pantalla exige (L2 de C)
--     ② merge ③ OTA aplicado ④ recién entonces el guard `correo_requerido`.
--     Encenderla hoy rompería el alta del bundle vivo.
--   ③ `aceptar_vinculo_repartidor()` — el acto de UN TOQUE: ata TODOS los
--     vínculos pendientes cuyo correo es el MÍO (del profile de la sesión).
--     No hay parámetro de correo: nadie reclama el vínculo de otro.
--   ④ `mis_vinculos_repartidor_pendientes()` — el lector de la pantalla de
--     aceptación de C (¿quién me registró como repartidor?).
--   ⑤ `despachar_pedido` gana el guard `repartidor_sin_cuenta`.
--
-- ⚠️ CONSECUENCIA MEDIDA Y DECLARADA (va al Loop): Marco (Clínica Aurora, el
-- repartidor demo del founder) y «Repartidor duenotodo S97» NO tienen cuenta
-- reclamada ⇒ su despacho REBOTA desde hoy. Es la adjudicación #9 obrando;
-- el camino de salida es exactamente el gate de L2 (reclamar con correo).
--
-- 76(g): NO RIGE — DDL aditivo, cero backfill, cero escritura de datos.
-- REVERSA: escrita ANTES en
--   docs/relevamientos/2026-08-15-s99a-REVERSA-l2-reclamo-repartidor.sql
--   (declara que el DROP de la columna borra correos, y que revertir el
--   código NO des-reclama cuentas ya atadas).
-- ============================================================================

-- ① LA COLUMNA-LLAVE
ALTER TABLE public.repartidores
  ADD COLUMN IF NOT EXISTS correo text,
  ADD COLUMN IF NOT EXISTS vinculo_aceptado_en timestamptz;

ALTER TABLE public.repartidores
  ADD CONSTRAINT chk_repartidores_correo_forma
  CHECK (correo IS NULL OR correo ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

-- Un correo por casa: el mismo repartidor puede repartir para DOS vendedores
-- (dos filas, dos casas — legal), pero una casa no duplica el correo.
ALTER TABLE public.repartidores
  ADD CONSTRAINT uq_repartidor_correo UNIQUE (cuenta_comercial_id, correo);

COMMENT ON COLUMN public.repartidores.correo IS
  'La LLAVE DE RECLAMO (S99 adj. #2): la persona crea su cuenta con este correo y ACEPTA el vínculo al primer ingreso. Se guarda en minúsculas (lo normalizan las puertas). NO es dato de contacto — el contacto es whatsapp.';
COMMENT ON COLUMN public.repartidores.vinculo_aceptado_en IS
  'Cuándo la persona ACEPTÓ el vínculo (aceptar_vinculo_repartidor). NULL con user_id puesto = atado por vía vieja (p_user_id directo), declarado.';

-- ② LAS PUERTAS GANAN p_correo (firma nueva ⇒ DROP explícito de la vieja, L-119)
DROP FUNCTION IF EXISTS public.registrar_repartidor(uuid, text, text, text, uuid, text, text, text, text);

CREATE FUNCTION public.registrar_repartidor(p_cuenta_comercial_id uuid, p_nombre text, p_documento text, p_telefono text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid, p_tipo_documento text DEFAULT NULL::text, p_documento_foto_path text DEFAULT NULL::text, p_foto_path text DEFAULT NULL::text, p_whatsapp text DEFAULT NULL::text, p_correo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_id uuid; v_existente uuid; v_pais text; v_tel text; v_wa text; v_correo text;
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

  -- S99 adj. #2 · la llave de reclamo, normalizada. 🔴 TODAVÍA OPCIONAL: la
  -- obligación se enciende DESPUÉS de que la pantalla de C la exija y su OTA
  -- esté aplicado (orden S98: pantalla → merge → OTA → guard). El CHECK de
  -- la columna valida la forma; acá solo se normaliza.
  v_correo := lower(NULLIF(btrim(COALESCE(p_correo,'')),''));

  v_pais := 'EC';
  PERFORM _valida_identidad_repartidor(v_pais, p_tipo_documento, p_documento, v_wa);

  SELECT id INTO v_existente FROM repartidores
   WHERE cuenta_comercial_id = p_cuenta_comercial_id AND documento = btrim(p_documento);
  IF v_existente IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'repartidor_id', v_existente, 'ya_existia', true);
  END IF;

  INSERT INTO repartidores (
      cuenta_comercial_id, nombre, documento, telefono, user_id,
      tipo_documento, documento_foto_path, foto_path, whatsapp, correo)
    VALUES (
      p_cuenta_comercial_id, btrim(p_nombre), btrim(p_documento), v_tel, p_user_id,
      NULLIF(btrim(COALESCE(p_tipo_documento,'')),''),
      NULLIF(btrim(COALESCE(p_documento_foto_path,'')),''),
      NULLIF(btrim(COALESCE(p_foto_path,'')),''),
      v_wa, v_correo)
    RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'repartidor_id', v_id, 'ya_existia', false,
                            'pendiente_de_reclamo', v_correo IS NOT NULL AND p_user_id IS NULL);
END $function$;

DROP FUNCTION IF EXISTS public.actualizar_repartidor(uuid, boolean, text, text, uuid, text, text, text, text, text);

CREATE FUNCTION public.actualizar_repartidor(p_repartidor_id uuid, p_activo boolean DEFAULT NULL::boolean, p_nombre text DEFAULT NULL::text, p_telefono text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid, p_documento text DEFAULT NULL::text, p_tipo_documento text DEFAULT NULL::text, p_documento_foto_path text DEFAULT NULL::text, p_foto_path text DEFAULT NULL::text, p_whatsapp text DEFAULT NULL::text, p_correo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_cc uuid; v_doc text; v_pais text; v_tipo_final text; v_doc_final text; v_wa text; v_correo text;
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

  -- S99 · la llave se puede corregir (NULL no pisa, como todo acá). Cambiarla
  -- con el vínculo YA aceptado no des-reclama: la llave ya hizo su trabajo.
  v_correo := lower(NULLIF(btrim(COALESCE(p_correo,'')),''));

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
    correo              = COALESCE(v_correo, correo),
    updated_at = now()
  WHERE id = p_repartidor_id;
  RETURN jsonb_build_object('ok', true, 'repartidor_id', p_repartidor_id);
END $function$;

-- ③ EL ACTO DE UN TOQUE — la persona reclama LO SUYO y nada más.
-- Sin parámetro de correo A PROPÓSITO: el correo sale del profile de la
-- SESIÓN, así que nadie puede reclamar el vínculo de otro por construcción.
CREATE FUNCTION public.aceptar_vinculo_repartidor()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_email text; v_n int; v_cuentas jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;
  SELECT lower(email) INTO v_email FROM profiles WHERE id = v_uid;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'perfil_sin_correo' USING ERRCODE = '22023';
  END IF;

  UPDATE repartidores
     SET user_id = v_uid, vinculo_aceptado_en = now(), updated_at = now()
   WHERE lower(correo) = v_email AND user_id IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;

  SELECT COALESCE(jsonb_agg(cc.nombre_comercial), '[]'::jsonb) INTO v_cuentas
  FROM repartidores r JOIN cuentas_comerciales cc ON cc.id = r.cuenta_comercial_id
  WHERE r.user_id = v_uid AND r.vinculo_aceptado_en IS NOT NULL;

  -- Idempotente: sin pendientes devuelve 0 y NO es error — la pantalla decide
  -- la voz («ya estabas vinculado» ≠ «nadie te registró»).
  RETURN jsonb_build_object('ok', true, 'aceptados', v_n, 'cuentas', v_cuentas);
END $function$;

-- ④ EL LECTOR DE LA PANTALLA DE ACEPTACIÓN (C): ¿quién me registró?
CREATE FUNCTION public.mis_vinculos_repartidor_pendientes()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_email text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;
  SELECT lower(email) INTO v_email FROM profiles WHERE id = v_uid;
  IF v_email IS NULL THEN RETURN '[]'::jsonb; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'repartidor_id', r.id,
      'negocio', cc.nombre_comercial,
      'nombre_registrado', r.nombre))
    FROM repartidores r
    JOIN cuentas_comerciales cc ON cc.id = r.cuenta_comercial_id
    WHERE lower(r.correo) = v_email AND r.user_id IS NULL AND r.activo
  ), '[]'::jsonb);
END $function$;

-- L-140: las funciones nuevas cierran su puerta al nacer.
REVOKE EXECUTE ON FUNCTION public.aceptar_vinculo_repartidor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aceptar_vinculo_repartidor() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.mis_vinculos_repartidor_pendientes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mis_vinculos_repartidor_pendientes() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_repartidor(uuid, text, text, text, uuid, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_repartidor(uuid, text, text, text, uuid, text, text, text, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.actualizar_repartidor(uuid, boolean, text, text, uuid, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.actualizar_repartidor(uuid, boolean, text, text, uuid, text, text, text, text, text, text) TO authenticated;

-- ⑤ EL GUARD #9 — despachar exige cuenta reclamada (cura por construcción).
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

  -- 🔴 S99 adj. #9 · CURA POR CONSTRUCCIÓN: un repartidor sin cuenta
  -- reclamada no puede recibir un envío — sin sesión propia no hay quién
  -- marque «vamos hacia vos» ni «entregado», y el envío nacería huérfano de
  -- operador. La salida es el reclamo por correo (aceptar_vinculo_repartidor),
  -- que es exactamente lo que el gate de L2 camina.
  IF v_rep.user_id IS NULL THEN
    RAISE EXCEPTION 'repartidor_sin_cuenta: % todavía no reclamó su cuenta — registrale el correo y pedile que entre a la app', v_rep.nombre
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

-- ============================================================================
-- CINTURÓN
-- ============================================================================
DO $cinturon$
BEGIN
  -- ① la columna y sus dos constraints existen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='repartidores' AND column_name='correo') THEN
    RAISE EXCEPTION 'cinturon: repartidores no gano correo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_repartidor_correo') THEN
    RAISE EXCEPTION 'cinturon: falta uq_repartidor_correo';
  END IF;
  -- ② una sola firma por puerta (L-119, sin zombis)
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname IN ('registrar_repartidor','actualizar_repartidor','despachar_pedido')) <> 3 THEN
    RAISE EXCEPTION 'cinturon: sobrecarga zombi en las puertas del repartidor';
  END IF;
  -- ③ el guard #9 vive en el cuerpo vivo
  IF position('repartidor_sin_cuenta' IN (SELECT prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname='despachar_pedido')) = 0 THEN
    RAISE EXCEPTION 'cinturon: despachar_pedido no gano el guard repartidor_sin_cuenta';
  END IF;
  -- ④ L-140: anon afuera de las cuatro
  IF has_function_privilege('anon','public.aceptar_vinculo_repartidor()','EXECUTE')
     OR has_function_privilege('anon','public.mis_vinculos_repartidor_pendientes()','EXECUTE')
     OR has_function_privilege('anon','public.registrar_repartidor(uuid,text,text,text,uuid,text,text,text,text,text)','EXECUTE')
     OR has_function_privilege('anon','public.actualizar_repartidor(uuid,boolean,text,text,uuid,text,text,text,text,text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: anon alcanza una puerta del reclamo (L-140)';
  END IF;
END $cinturon$;
