-- S98-A · LAS PUERTAS DEL REPARTIDOR APRENDEN SU IDENTIDAD Y SU VEHÍCULO
--          (par de 20260816100000; contrato de C §B ③④)
--
-- ═══════════════════════════════════════════════════════════════════════════
-- 76(g) — VEDA DE ESCRITURA: **NO RIGE**. Reemplazo de funciones + dos nuevas.
--   Cero backfill. El cinturón escribe y borra; su residuo se mide.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ═══ 🔴 L-119: LA FIRMA CAMBIA ⇒ SE DROPEA EXPLÍCITO ═══════════════════════
-- Agregar parámetros con DEFAULT **no reemplaza: SOBRECARGA.** Quedarían las
-- dos versiones vivas y PostgREST elegiría por aridad — o sea que el alta
-- vieja seguiría entrando por la puerta vieja y **el guard de obligatoriedad
-- que viene después no la tocaría.** El cinturón verifica `sobrecargas = 1`.
--
-- ═══ 🔴 LA DECISIÓN DEL TELÉFONO: LA PUERTA REBOTA, NO NORMALIZA ═══════════
-- C preguntó explícitamente si la puerta debía normalizar a E.164 o rebotar.
-- **Rebota, y la razón es de letra firmada, no de gusto:**
--
-- > **P21 prohíbe DERIVAR el país.** Normalizar `0999123456` a E.164 exige
-- > decidir que es ecuatoriano — y eso **la puerta no lo sabe**.
--
-- La pantalla SÍ lo sabe: tiene el selector de país, y C ya compone el E.164
-- ahí con `componerE164`. *El que tiene el dato compone; el que no lo tiene
-- valida.* Normalizar acá sería inventar un país por cada número sin `+`, que
-- es exactamente el defecto que P21 existe para impedir.
--
-- Lo que SÍ cambia: hoy el número crudo choca contra el CHECK y el vendedor
-- lee un texto de constraint. Ahora rebota `telefono_invalido` /
-- `whatsapp_invalido`, que la superficie puede hablar.
--
-- ═══ EL REGALO DEL CATÁLOGO: LA MÁSCARA YA EXISTÍA Y NADIE LA LEÍA ═════════
-- `cat_tipos_documento_titular` trae `mascara_validacion` por tipo
-- (CEDULA `^\d{10}$` · RUC `^\d{13}$` · PASAPORTE `^[A-Z0-9]{6,12}$`).
-- Estaba en la tabla desde mayo **sin un solo lector**. Con `tipo_documento`
-- declarado, el número se valida contra SU máscara ⇒ *el tipo deja de ser una
-- etiqueta y pasa a ser una regla.* Sin tipo declarado no se valida nada —
-- que es lo que mantiene legales las 4 filas vivas (todas `DEMO-*`).

BEGIN;

DROP FUNCTION IF EXISTS public.registrar_repartidor(uuid, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.actualizar_repartidor(uuid, boolean, text, text, uuid, text);

-- ── Helper único de validación de identidad ───────────────────────────────
-- Vive UNA vez porque las DOS puertas lo necesitan idéntico. *Dos copias de
-- una validación es cómo una de las dos se queda vieja sin que nadie lo note.*
CREATE OR REPLACE FUNCTION public._valida_identidad_repartidor(
  p_pais text, p_tipo_documento text, p_documento text, p_whatsapp text)
RETURNS void LANGUAGE plpgsql IMMUTABLE
SET search_path TO 'public', 'pg_temp' AS $fn$
DECLARE v_mascara text;
BEGIN
  IF p_whatsapp IS NOT NULL AND p_whatsapp !~ '^\+[1-9][0-9]{6,14}$' THEN
    -- La superficie compone el E.164 con su selector de país (P21: la puerta
    -- valida, jamás deduce de dónde es un número).
    RAISE EXCEPTION 'whatsapp_invalido' USING ERRCODE = '22023';
  END IF;

  IF p_tipo_documento IS NOT NULL THEN
    SELECT mascara_validacion INTO v_mascara
      FROM cat_tipos_documento_titular
     WHERE country_code = p_pais AND codigo = p_tipo_documento AND activo;
    IF NOT FOUND THEN
      -- La FK lo rebotaría igual, pero sin nombre. Acá el rebote HABLA.
      RAISE EXCEPTION 'tipo_documento_invalido' USING ERRCODE = '22023';
    END IF;
    IF v_mascara IS NOT NULL AND p_documento IS NOT NULL
       AND btrim(p_documento) !~ v_mascara THEN
      RAISE EXCEPTION 'documento_no_coincide_con_tipo' USING ERRCODE = '22023';
    END IF;
  END IF;
END $fn$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① registrar_repartidor
-- ═══════════════════════════════════════════════════════════════════════════
CREATE FUNCTION public.registrar_repartidor(
  p_cuenta_comercial_id uuid,
  p_nombre              text,
  p_documento           text,
  p_telefono            text DEFAULT NULL,
  p_user_id             uuid DEFAULT NULL,
  p_tipo_documento      text DEFAULT NULL,
  p_documento_foto_path text DEFAULT NULL,
  p_foto_path           text DEFAULT NULL,
  p_whatsapp            text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $function$
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

  v_tel := NULLIF(btrim(COALESCE(p_telefono,'')),'');
  v_wa  := NULLIF(btrim(COALESCE(p_whatsapp,'')),'');
  IF v_tel IS NOT NULL AND v_tel !~ '^\+[1-9][0-9]{6,14}$' THEN
    RAISE EXCEPTION 'telefono_invalido' USING ERRCODE = '22023';
  END IF;

  -- La fila todavía no existe, así que su país es el DEFAULT de la columna.
  -- Se escribe literal a sabiendas y **el cinturón verifica que el default
  -- siga siendo 'EC'**: si algún día cambia, la migración que lo cambie choca
  -- acá en vez de dejar esta validación mirando un país que ya no es.
  -- El backstop real de todos modos es la FK compuesta — esto solo existe para
  -- que el rebote tenga NOMBRE en vez de ser un error de constraint.
  v_pais := 'EC';

  PERFORM _valida_identidad_repartidor(v_pais, p_tipo_documento, p_documento, v_wa);

  -- IDEMPOTENTE por (cuenta, documento) — se conserva de la versión anterior.
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

-- ═══════════════════════════════════════════════════════════════════════════
-- ② actualizar_repartidor — «ausente = NO TOCA» en los cuatro campos nuevos
--
-- Misma semántica que C validó con su discriminador en los cortes: un `NULL`
-- conserva. *Si un campo ausente pusiera el default, corregir el nombre le
-- borraría la foto del documento al repartidor sin que nadie se entere.*
-- ═══════════════════════════════════════════════════════════════════════════
CREATE FUNCTION public.actualizar_repartidor(
  p_repartidor_id       uuid,
  p_activo              boolean DEFAULT NULL,
  p_nombre              text DEFAULT NULL,
  p_telefono            text DEFAULT NULL,
  p_user_id             uuid DEFAULT NULL,
  p_documento           text DEFAULT NULL,
  p_tipo_documento      text DEFAULT NULL,
  p_documento_foto_path text DEFAULT NULL,
  p_foto_path           text DEFAULT NULL,
  p_whatsapp            text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $function$
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

-- ═══════════════════════════════════════════════════════════════════════════
-- ③ LAS PUERTAS DEL VEHÍCULO
--
-- El `orden` **no lo elige el caller**: la puerta toma el primer hueco libre.
-- *Un parámetro de posición que el llamador tiene que administrar es un
--  parámetro que el llamador va a administrar mal* — y acá administrarlo mal
--  se ve como «se me borró la moto», porque un `orden` repetido pisa.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.registrar_vehiculo_repartidor(
  p_repartidor_id uuid, p_tipo text, p_placa text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $function$
DECLARE v_cc uuid; v_placa text; v_orden smallint; v_id uuid; v_existente uuid;
BEGIN
  SELECT cuenta_comercial_id INTO v_cc FROM repartidores WHERE id = p_repartidor_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'repartidor_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT es_vendedor_de(v_cc) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  IF p_tipo IS NULL OR p_tipo NOT IN ('moto','carro') THEN
    RAISE EXCEPTION 'tipo_vehiculo_invalido' USING ERRCODE = '22023';
  END IF;

  -- Solo mayúsculas y bordes: **no se quitan guiones ni espacios interiores**.
  -- Ecuador tiene formatos vivos con y sin guion, y *normalizar de más deforma
  -- lo que la persona leyó de la placa* — que es lo único con lo que después
  -- va a comparar.
  v_placa := upper(btrim(COALESCE(p_placa,'')));
  IF length(v_placa) = 0 THEN
    RAISE EXCEPTION 'placa_requerida' USING ERRCODE = '22023';
  END IF;

  -- IDEMPOTENTE por (repartidor, placa): registrar dos veces no duplica ni
  -- consume el segundo hueco. Mismo contrato que `registrar_repartidor`.
  SELECT id INTO v_existente FROM repartidor_vehiculos
   WHERE repartidor_id = p_repartidor_id AND placa = v_placa;
  IF v_existente IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'vehiculo_id', v_existente, 'ya_existia', true);
  END IF;

  SELECT o INTO v_orden FROM unnest(ARRAY[1,2]::smallint[]) AS o
   WHERE NOT EXISTS (SELECT 1 FROM repartidor_vehiculos v
                      WHERE v.repartidor_id = p_repartidor_id AND v.orden = o)
   ORDER BY o LIMIT 1;
  IF v_orden IS NULL THEN
    RAISE EXCEPTION 'vehiculo_tope_alcanzado' USING ERRCODE = '22023';
  END IF;

  INSERT INTO repartidor_vehiculos (repartidor_id, tipo, placa, orden)
    VALUES (p_repartidor_id, p_tipo, v_placa, v_orden) RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'vehiculo_id', v_id, 'ya_existia', false);
END $function$;

CREATE OR REPLACE FUNCTION public.eliminar_vehiculo_repartidor(p_vehiculo_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $function$
DECLARE v_cc uuid;
BEGIN
  SELECT r.cuenta_comercial_id INTO v_cc
    FROM repartidor_vehiculos v JOIN repartidores r ON r.id = v.repartidor_id
   WHERE v.id = p_vehiculo_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'vehiculo_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT es_vendedor_de(v_cc) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  DELETE FROM repartidor_vehiculos WHERE id = p_vehiculo_id;
  RETURN jsonb_build_object('ok', true);
END $function$;

-- ── L-140: nada de esto alcanza a `anon` ──────────────────────────────────
REVOKE ALL ON FUNCTION public._valida_identidad_repartidor(text,text,text,text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_repartidor(uuid,text,text,text,uuid,text,text,text,text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.actualizar_repartidor(uuid,boolean,text,text,uuid,text,text,text,text,text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_vehiculo_repartidor(uuid,text,text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.eliminar_vehiculo_repartidor(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_repartidor(uuid,text,text,text,uuid,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_repartidor(uuid,boolean,text,text,uuid,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_vehiculo_repartidor(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.eliminar_vehiculo_repartidor(uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN CON DISCRIMINADOR
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_cc uuid; v_rep uuid; v_r jsonb; v_v jsonb; v_n int; v_residuo int; v_admin uuid;
  v_r_wa boolean := false; v_r_tipo boolean := false; v_r_mask boolean := false;
  v_r_tope boolean := false; v_r_anon boolean; v_r_dueno boolean := false;
BEGIN
  -- ── L-119: UNA sola sobrecarga de cada puerta ──
  FOR v_n IN SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='registrar_repartidor' LOOP
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'CINTURON ROJO: registrar_repartidor tiene % sobrecargas. La vieja sigue viva y el alta entraria por ella.', v_n;
    END IF;
  END LOOP;
  FOR v_n IN SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='actualizar_repartidor' LOOP
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'CINTURON ROJO: actualizar_repartidor tiene % sobrecargas.', v_n;
    END IF;
  END LOOP;

  -- ── L-140: ninguna alcanzable por anon ──
  SELECT bool_or(has_function_privilege('anon', p.oid, 'EXECUTE')) INTO v_r_anon
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN
     ('registrar_repartidor','actualizar_repartidor','registrar_vehiculo_repartidor',
      'eliminar_vehiculo_repartidor','_valida_identidad_repartidor');
  IF v_r_anon THEN RAISE EXCEPTION 'CINTURON ROJO: alguna puerta quedo alcanzable por anon.'; END IF;

  -- ── La premisa del literal 'EC' en la puerta, verificada ──
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='repartidores'
                    AND column_name='country_code' AND column_default = '''EC''::text') THEN
    RAISE EXCEPTION
      'CINTURON ABORTA: el default de repartidores.country_code dejo de ser EC — la puerta valida contra un pais que ya no es el que la fila va a tener.';
  END IF;

  SELECT cuenta_comercial_id INTO v_cc FROM repartidores ORDER BY created_at LIMIT 1;
  IF v_cc IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: sin cuenta comercial con repartidores no se puede ejercer la puerta.';
  END IF;

  -- ── ROJO ⓪: SIN SESION la puerta rebota por el dueño ──
  -- Este brazo no estaba planeado: **lo regaló la primera corrida**, que
  -- abortó con `no_sos_el_vendedor` porque el cinturón corría sin claims.
  -- Se conserva a propósito en vez de solo arreglarlo: *era un discriminador
  -- gratis del gate de propiedad, y tirarlo habría sido tirar la única prueba
  -- de que ese gate no es decorativo.*
  BEGIN
    PERFORM registrar_repartidor(v_cc, 'Sin sesion', '1712345677');
  EXCEPTION WHEN insufficient_privilege THEN v_r_dueno := true;
  END;
  IF NOT v_r_dueno THEN
    RAISE EXCEPTION 'CINTURON ROJO: la puerta dejo registrar SIN ser el vendedor.';
  END IF;

  -- ── Claims de admin: se ENTRA por el gate, jamás se lo esquiva ──
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: no hay admin activo — sin identidad no se puede ejercer la puerta por su camino real.';
  END IF;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role', 'authenticated')::text, true);

  -- ── VERDE: el alta COMPLETA entra (y con un documento que SI cumple la mascara) ──
  v_r := registrar_repartidor(v_cc, 'Cinturon S98', '1712345678', '+593999111222', NULL,
                              'CEDULA', 'cinturon/doc.jpg', 'cinturon/cara.jpg', '+593999111222');
  v_rep := (v_r->>'repartidor_id')::uuid;
  IF v_rep IS NULL THEN RAISE EXCEPTION 'CINTURON ROJO: el alta completa no devolvio id.'; END IF;
  IF (SELECT whatsapp FROM repartidores WHERE id=v_rep) IS NULL
     OR (SELECT foto_path FROM repartidores WHERE id=v_rep) IS NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO: el alta acepto los campos y NO los guardo.';
  END IF;

  -- ── ROJO ①: whatsapp sin + ──
  BEGIN
    PERFORM registrar_repartidor(v_cc, 'X', '1712345679', NULL, NULL, NULL, NULL, NULL, '0999123456');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%whatsapp_invalido%' THEN v_r_wa := true;
    ELSE RAISE EXCEPTION 'CINTURON ABORTA: el brazo de whatsapp reboto por otra cosa: %', SQLERRM; END IF;
  END;
  IF NOT v_r_wa THEN RAISE EXCEPTION 'CINTURON ROJO: la puerta ACEPTO un whatsapp sin +.'; END IF;

  -- ── ROJO ②: tipo de documento fuera del catalogo ──
  BEGIN
    PERFORM registrar_repartidor(v_cc, 'X', '1712345680', NULL, NULL, 'LICENCIA', NULL, NULL, NULL);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%tipo_documento_invalido%' THEN v_r_tipo := true;
    ELSE RAISE EXCEPTION 'CINTURON ABORTA: el brazo del tipo reboto por otra cosa: %', SQLERRM; END IF;
  END;
  IF NOT v_r_tipo THEN RAISE EXCEPTION 'CINTURON ROJO: la puerta ACEPTO un tipo inexistente.'; END IF;

  -- ── ROJO ③: CEDULA con un numero que no cumple su mascara ──
  --    Es el brazo que prueba que el catalogo dejo de ser decorativo.
  BEGIN
    PERFORM registrar_repartidor(v_cc, 'X', '1234', NULL, NULL, 'CEDULA', NULL, NULL, NULL);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%documento_no_coincide_con_tipo%' THEN v_r_mask := true;
    ELSE RAISE EXCEPTION 'CINTURON ABORTA: el brazo de la mascara reboto por otra cosa: %', SQLERRM; END IF;
  END;
  IF NOT v_r_mask THEN RAISE EXCEPTION 'CINTURON ROJO: la mascara del catalogo NO se aplica.'; END IF;

  -- ── VEHICULOS: dos entran, el tercero rebota HABLADO (no por el UNIQUE) ──
  PERFORM registrar_vehiculo_repartidor(v_rep, 'moto', 'pba-1234');
  IF (SELECT placa FROM repartidor_vehiculos WHERE repartidor_id=v_rep) <> 'PBA-1234' THEN
    RAISE EXCEPTION 'CINTURON ROJO: la placa no se normalizo a mayusculas.';
  END IF;
  PERFORM registrar_vehiculo_repartidor(v_rep, 'carro', 'GYE-9876');
  -- Idempotencia: repetir la primera NO crea una tercera ni consume hueco.
  v_v := registrar_vehiculo_repartidor(v_rep, 'moto', 'PBA-1234');
  IF (v_v->>'ya_existia')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON ROJO: registrar la misma placa dos veces NO fue idempotente.';
  END IF;
  BEGIN
    PERFORM registrar_vehiculo_repartidor(v_rep, 'moto', 'UIO-0001');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%vehiculo_tope_alcanzado%' THEN v_r_tope := true;
    ELSE RAISE EXCEPTION 'CINTURON ABORTA: el tercer vehiculo reboto por otra cosa: %', SQLERRM; END IF;
  END;
  IF NOT v_r_tope THEN RAISE EXCEPTION 'CINTURON ROJO: entro un TERCER vehiculo por la puerta.'; END IF;

  -- ── «AUSENTE = NO TOCA»: corregir el nombre NO borra la foto ──
  --    Es el modo de falla exacto que C midio en los cortes, del otro lado.
  PERFORM actualizar_repartidor(v_rep, NULL, 'Cinturon S98 corregido');
  IF (SELECT foto_path FROM repartidores WHERE id=v_rep) IS NULL
     OR (SELECT whatsapp FROM repartidores WHERE id=v_rep) IS NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO: actualizar el nombre BORRO la identidad. «Ausente» se leyo como «vaciar».';
  END IF;

  -- ── TEARDOWN con residuo MEDIDO (los vehiculos caen por CASCADE) ──
  DELETE FROM repartidores WHERE id = v_rep;
  SELECT count(*) INTO v_residuo FROM repartidores WHERE nombre LIKE 'Cinturon S98%';
  IF v_residuo <> 0 THEN RAISE EXCEPTION 'CINTURON ABORTA: residuo en repartidores (%).', v_residuo; END IF;
  SELECT count(*) INTO v_residuo FROM repartidor_vehiculos;
  IF v_residuo <> 0 THEN RAISE EXCEPTION 'CINTURON ABORTA: residuo en repartidor_vehiculos (%).', v_residuo; END IF;

  RAISE NOTICE 'CINTURON OK · 1 sobrecarga por puerta · 0 anon · alta completa guardo · 4 rojos hablados · idempotencia · ausente-no-toca · residuo 0';
END;
$cinturon$;

COMMIT;
