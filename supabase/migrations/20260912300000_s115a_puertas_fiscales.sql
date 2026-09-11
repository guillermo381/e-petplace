-- S115-A · TANDA 1 (⑤) — LAS PUERTAS
-- Letra: MODELO_FISCAL v0.4. Reversa: docs/relevamientos/S115-A-REVERSA-20260912300000-puertas-fiscales.sql
-- VEDA 76(g): NO RIGE.
--
-- 🔴 `documentos_fiscales` no se lee por PostgREST: su policy de SELECT es
--    `user_id = auth.uid() OR is_admin()`, y con `user_id` NULL en los recibidos
--    eso ya es fail-closed. Estas puertas son DEFINER y devuelven SÓLO lo que cada
--    quien puede ver — el cliente jamás arma su propio filtro.

BEGIN;

-- ① LO MÍO ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fiscal_mis_documentos()
RETURNS TABLE (id uuid, tipo text, estado text, estado_visible text, total numeric,
               moneda text, fecha_emision date, clave_acceso text, numero text,
               tiene_xml boolean, tiene_ride boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sin_sesion' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT d.id, d.tipo::text, d.estado::text,
         /* 🔴 `borrador` y `emitiendo` se muestran IGUAL: «preparando». La familia
            no tiene por qué conocer el estado interno del pipeline, y distinguirlos
            en pantalla invitaría a preguntar por qué su factura está «en borrador». */
         CASE d.estado
           WHEN 'borrador'  THEN 'preparando'
           WHEN 'emitiendo' THEN 'preparando'
           WHEN 'esperando_receptor' THEN 'faltan_tus_datos'
           WHEN 'autorizada' THEN 'lista'
           WHEN 'no_autorizada' THEN 'con_problema'
           WHEN 'pendiente_manual' THEN 'preparando'
           WHEN 'anulada' THEN 'anulada'
         END,
         d.total, d.moneda, d.fecha_emision, d.clave_acceso,
         CASE WHEN d.secuencial IS NOT NULL
              THEN d.establecimiento||'-'||d.punto_emision||'-'||d.secuencial
              ELSE d.numero_factura END,
         (d.xml_url IS NOT NULL), (d.pdf_url IS NOT NULL)
    FROM public.documentos_fiscales d
   WHERE d.user_id = auth.uid()
   ORDER BY d.created_at DESC;
END $fn$;

-- ② LA RUTA DEL ARCHIVO (la firma la hace el wrapper con service_role) ───────
CREATE OR REPLACE FUNCTION public.fiscal_ruta_archivo(p_documento_id uuid, p_cual text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_ruta text; v_dueno uuid;
BEGIN
  IF p_cual NOT IN ('xml','ride') THEN
    RAISE EXCEPTION 'archivo_desconocido' USING ERRCODE='22023';
  END IF;
  SELECT CASE WHEN p_cual='xml' THEN xml_url ELSE pdf_url END, user_id
    INTO v_ruta, v_dueno FROM public.documentos_fiscales WHERE id = p_documento_id;
  IF v_ruta IS NULL THEN RAISE EXCEPTION 'archivo_no_existe' USING ERRCODE='22023'; END IF;
  /* El gate vive ACÁ, del lado del servidor. Una autorización que decide el
     cliente es decorativa. */
  IF NOT (v_dueno = auth.uid() OR is_admin()) THEN
    RAISE EXCEPTION 'no_es_tuyo' USING ERRCODE='42501';
  END IF;
  RETURN v_ruta;
END $fn$;

-- ③ MI PERFIL TRIBUTARIO ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fiscal_tax_profile_mio()
RETURNS public.tax_profiles LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT * FROM public.tax_profiles
   WHERE user_id = auth.uid() AND es_predeterminado LIMIT 1;
$fn$;

CREATE OR REPLACE FUNCTION public.fiscal_tax_profile_upsert(
  p_tipo_identificacion text, p_identificacion text, p_razon_social text DEFAULT NULL,
  p_direccion text DEFAULT NULL, p_email text DEFAULT NULL, p_telefono text DEFAULT NULL,
  p_predeterminado boolean DEFAULT true)
RETURNS public.tax_profiles LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v public.tax_profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sin_sesion' USING ERRCODE='42501'; END IF;
  IF p_tipo_identificacion NOT IN ('ruc','cedula','pasaporte','consumidor_final') THEN
    RAISE EXCEPTION 'tipo_identificacion_invalido' USING ERRCODE='22023';
  END IF;
  IF p_tipo_identificacion='ruc' AND p_identificacion !~ '^[0-9]{13}$' THEN
    RAISE EXCEPTION 'ruc_invalido' USING ERRCODE='22023';
  END IF;
  IF p_tipo_identificacion='cedula' AND p_identificacion !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'cedula_invalida' USING ERRCODE='22023';
  END IF;
  /* Un RUC sin razón social no identifica a nadie ante el SRI. */
  IF p_tipo_identificacion='ruc' AND COALESCE(trim(p_razon_social),'') = '' THEN
    RAISE EXCEPTION 'ruc_sin_razon_social' USING ERRCODE='22023';
  END IF;

  IF p_predeterminado THEN
    UPDATE public.tax_profiles SET es_predeterminado = false WHERE user_id = auth.uid();
  END IF;

  INSERT INTO public.tax_profiles
    (user_id, tipo_identificacion, identificacion, razon_social, direccion, email, telefono, es_predeterminado)
  VALUES (auth.uid(), p_tipo_identificacion::public.tipo_identificacion_enum, trim(p_identificacion),
          p_razon_social, p_direccion, p_email, p_telefono, p_predeterminado)
  ON CONFLICT (user_id, tipo_identificacion, identificacion) DO UPDATE
    SET razon_social = EXCLUDED.razon_social, direccion = EXCLUDED.direccion,
        email = EXCLUDED.email, telefono = EXCLUDED.telefono,
        es_predeterminado = EXCLUDED.es_predeterminado, updated_at = now()
  RETURNING * INTO v;
  RETURN v;
END $fn$;

-- ④ ADMIN ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fiscal_admin_listar(
  p_estado text DEFAULT NULL, p_desde timestamptz DEFAULT NULL, p_hasta timestamptz DEFAULT NULL)
RETURNS SETOF public.documentos_fiscales
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'no_sos_admin' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT * FROM public.documentos_fiscales d
   WHERE (p_estado IS NULL OR d.estado::text = p_estado)
     AND (p_desde  IS NULL OR d.created_at >= p_desde)
     AND (p_hasta  IS NULL OR d.created_at <= p_hasta)
   ORDER BY d.created_at DESC LIMIT 500;
END $fn$;

CREATE OR REPLACE FUNCTION public.fiscal_admin_cerrar_manual(
  p_documento_id uuid, p_clave_acceso text, p_numero_autorizacion text DEFAULT NULL,
  p_autorizado_en timestamptz DEFAULT now())
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE d public.documentos_fiscales; v_suma int; v_peso int; v_dv int; v_i int;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'no_sos_admin' USING ERRCODE='42501'; END IF;
  SELECT * INTO d FROM public.documentos_fiscales WHERE id = p_documento_id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'documento_no_existe' USING ERRCODE='22023'; END IF;
  IF d.estado <> 'pendiente_manual' THEN
    RAISE EXCEPTION 'documento_no_esta_pendiente_manual' USING ERRCODE='22023',
      DETAIL=format('estado actual: %s', d.estado);
  END IF;

  /* 🔴 MÓDULO 11 LOCAL. La validación CONTRA EL SRI es tanda 2 y se dice: esto
     prueba que la clave está bien FORMADA, jamás que el SRI la haya autorizado.
     *Confundir las dos cosas daría por buena la clave de un comprobante que no
     existe.* */
  IF p_clave_acceso !~ '^[0-9]{49}$' THEN
    RAISE EXCEPTION 'clave_acceso_formato' USING ERRCODE='22023';
  END IF;
  v_suma := 0; v_peso := 2;
  FOR v_i IN REVERSE 48..1 LOOP
    v_suma := v_suma + substr(p_clave_acceso, v_i, 1)::int * v_peso;
    v_peso := CASE WHEN v_peso = 7 THEN 2 ELSE v_peso + 1 END;
  END LOOP;
  v_dv := 11 - (v_suma % 11);
  IF v_dv = 11 THEN v_dv := 0; ELSIF v_dv = 10 THEN v_dv := 1; END IF;
  IF v_dv <> substr(p_clave_acceso, 49, 1)::int THEN
    RAISE EXCEPTION 'clave_acceso_digito_verificador' USING ERRCODE='22023';
  END IF;

  UPDATE public.documentos_fiscales
     SET clave_acceso = p_clave_acceso,
         sri_numero_autorizacion = p_numero_autorizacion,
         autorizado_en = p_autorizado_en,
         estado = 'autorizada', motivo_rechazo = NULL
   WHERE id = p_documento_id;

  RETURN jsonb_build_object('ok', true, 'documento_id', p_documento_id,
    'validacion', 'modulo_11_local', 'contra_sri', false);
END $fn$;

-- ── L-140 EN LAS SEIS ───────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.fiscal_mis_documentos()            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fiscal_ruta_archivo(uuid, text)    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fiscal_tax_profile_mio()           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fiscal_tax_profile_upsert(text,text,text,text,text,text,boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fiscal_admin_listar(text, timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fiscal_admin_cerrar_manual(uuid, text, text, timestamptz) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.fiscal_mis_documentos()            TO authenticated;
GRANT EXECUTE ON FUNCTION public.fiscal_ruta_archivo(uuid, text)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.fiscal_tax_profile_mio()           TO authenticated;
GRANT EXECUTE ON FUNCTION public.fiscal_tax_profile_upsert(text,text,text,text,text,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fiscal_admin_listar(text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fiscal_admin_cerrar_manual(uuid, text, text, timestamptz) TO authenticated;

COMMIT;
