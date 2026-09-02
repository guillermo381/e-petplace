-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · 20260907840000 · LA IP DEL CONSENTIMIENTO LA PONE EL SERVIDOR, NO LA APP.
--
-- 🔴 LO DESTAPÓ C NEGÁNDOSE A RELLENAR UN CAMPO. Monté la aceptación con
-- `p_ip_hash` como parámetro del cliente; C montó la pantalla y **no lo mandó**,
-- con su razón: *«la app no conoce la IP, y fabricar un hash de algo que no
-- conozco sería inventar evidencia legal»*. Tiene razón — y eso deja el
-- registro probatorio SIN el dato que la adenda 2 exige, **para siempre y sin
-- que nadie lo note**.
--
-- ⇒ *Un campo que sólo puede llenar quien no lo conoce no se llena nunca.* Y su
-- modo de falla es el peor: la fila existe, se ve completa, y el dato falta.
--
-- **MEDIDO, y es más ancho que la adopción: `consentimientos.ip_hash` está en
-- NULL en las 97 filas de la casa.** Ningún escritor lo llenó jamás.
--
-- 🔴 Y MI PRIMERA MEDICIÓN DIJO QUE NO SE PODÍA: los headers me daban NULL
-- **porque yo medía por la Management API, no por PostgREST**. Por el camino
-- real, con un JWT de verdad, `x-forwarded-for` devolvió una IP pública.
-- *Era un falso negativo de mi instrumento — la misma clase que el router.d.ts
-- viejo y el typecheck sin dependencias.*
--
-- 76(g): NO RIGE — cero backfill. Las 97 filas viejas NO se tocan: su ip_hash
-- es NULL porque nunca se capturó, y rellenarlo ahora sería inventarlo.
-- REVERSA ESCRITA ANTES.
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.aceptar_documento_adopcion(text,text,text);

CREATE OR REPLACE FUNCTION public.aceptar_documento_adopcion(
  p_codigo text, p_dispositivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE
  v_u uuid := auth.uid(); v_d record; v_id uuid; v_ip text; v_hash text;
BEGIN
  IF v_u IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_codigo NOT IN ('terminos_refugio','condiciones_adopcion') THEN
    RAISE EXCEPTION 'documento_no_aceptable: %', p_codigo USING ERRCODE='22023';
  END IF;

  /* LA IP, DEL SERVIDOR, y HASHEADA: para probar «fue desde el mismo lugar»
     alcanza el hash, y guardar la IP en claro es guardar un dato personal que
     no hace falta. Si el header no llega queda NULL — **no se inventa**, que es
     el defecto que esta migración cura. */
  v_ip := split_part(coalesce(
            (current_setting('request.headers', true)::json->>'x-forwarded-for'), ''), ',', 1);
  v_hash := CASE WHEN btrim(v_ip) = '' THEN NULL
                 ELSE encode(sha256(convert_to(btrim(v_ip),'UTF8')),'hex') END;

  SELECT d.codigo, d.version, d.sha256 INTO v_d
    FROM adopcion_documentos d
   WHERE d.codigo = p_codigo AND d.vigente ORDER BY d.version DESC LIMIT 1;
  IF v_d.codigo IS NULL THEN
    RAISE EXCEPTION 'documento_no_disponible: %', p_codigo USING ERRCODE='22023';
  END IF;

  SELECT c.id INTO v_id FROM consentimientos c
   WHERE c.user_id = v_u AND c.tipo = v_d.codigo AND c.version = v_d.version::text
     AND c.aceptado IS TRUE LIMIT 1;
  IF v_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'ya_estaba', true, 'consentimiento_id', v_id,
                              'codigo', v_d.codigo, 'version', v_d.version);
  END IF;

  INSERT INTO consentimientos (user_id, tipo, aceptado, ip_hash, version,
                               documento_sha256, metadata)
       VALUES (v_u, v_d.codigo, true, v_hash, v_d.version::text, v_d.sha256,
               jsonb_build_object('dispositivo', p_dispositivo, 'origen', 'adopcion',
                                  'ip_capturada', v_hash IS NOT NULL))
    RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'ya_estaba', false, 'consentimiento_id', v_id,
                            'codigo', v_d.codigo, 'version', v_d.version,
                            'sha256', v_d.sha256, 'ip_capturada', v_hash IS NOT NULL);
END $fn$;

REVOKE ALL ON FUNCTION public.aceptar_documento_adopcion(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aceptar_documento_adopcion(text,text) TO authenticated;

DROP FUNCTION IF EXISTS public._sonda_headers_s112();

DO $cinturon$
DECLARE v_n int; v_args text;
BEGIN
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='aceptar_documento_adopcion';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'CINTURON: quedaron % sobrecargas (L-119)', v_n;
  END IF;
  SELECT pg_get_function_identity_arguments(p.oid) INTO v_args FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='aceptar_documento_adopcion';
  IF v_args LIKE '%p_ip_hash%' THEN
    RAISE EXCEPTION 'CINTURON: la firma todavia acepta la IP del cliente';
  END IF;
  RAISE NOTICE 'CINTURON VERDE: una sola firma, y la IP ya no la puede mandar el cliente';
END $cinturon$;
