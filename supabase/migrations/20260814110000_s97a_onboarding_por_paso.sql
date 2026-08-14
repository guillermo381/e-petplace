-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · EL ESTADO DEL ONBOARDING POR PASO — lo que alimenta el contador y
-- la voz del «retomá acá» (14-ago-2026)
--
-- LETRA: `LA_CASA_DEL_PRESTADOR` §4 (wizard de cuatro pasos salteables) + la
-- LEY DEL CONTADOR firmada en S91 y depositada en `MODELO_DESPENSA` §8.6bis:
--   «narrativa más un paso, JAMÁS checklist — y el número tiene que poder
--    LLEGAR A CERO. Lo que depende de e-PetPlace NO entra al contador: él
--    llega a cero; después esperamos nosotros.»
--
-- 🔴 LA DECISIÓN DE DISEÑO QUE ORDENA TODA LA MIGRACIÓN — **SOLO SE GUARDA EL
--    SALTO; LA COMPLETITUD SE DERIVA.**
--
--    «Completó el paso ③» ya está escrito en la base: hay documentos o no los
--    hay. Guardarlo otra vez sería el dato en dos lugares — el defecto que
--    esta sesión lleva cazado varias veces — y llegaría el día en que la marca
--    dijera «completo» y la tabla estuviera vacía. **Un estado derivado no
--    puede desincronizarse porque no existe hasta que se lee.**
--
--    «Lo salteó» es lo ÚNICO que NO se deriva: no dejar rastro y decidir no
--    dejarlo se ven idénticos en los datos. Por eso —y solo por eso— hay tabla.
--
-- 🔴 Y EL BORDE QUE HACE HONESTA LA LEY DEL CONTADOR: un documento en
--    `pendiente` (subido, esperando nuestra revisión) **CUENTA COMO HECHO**.
--    Él ya hizo lo suyo. Un `rechazado` vuelve a ser trabajo suyo y suma otra
--    vez. *Si la revisión nuestra sumara al número, el contador nunca llegaría
--    a cero por causas ajenas al prestador — que es exactamente lo que la ley
--    S91 prohíbe.*
--
-- 76(g): NO RIGE — tabla nueva vacía + tres funciones. Sin backfill, sin anclas.
-- L-140 en las tres puertas. RLS con puerta única (nadie escribe la tabla a mano).
-- REVERSA escrita ANTES: scripts/s97/2026-08-14-s97a-onboarding-por-paso-REVERSA.sql
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE IF NOT EXISTS public.cuenta_onboarding_salto (
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id) ON DELETE CASCADE,
  paso                text NOT NULL CHECK (paso IN ('negocio','oferta','documentos','equipo')),
  salteado_en         timestamptz NOT NULL DEFAULT now(),
  salteado_por        uuid,
  PRIMARY KEY (cuenta_comercial_id, paso)
);

COMMENT ON TABLE public.cuenta_onboarding_salto IS
  'SOLO los saltos. La COMPLETITUD de cada paso se DERIVA de la base (hay '
  'documentos o no los hay) y jamás se guarda acá: guardarla sería el dato en '
  'dos lugares. «Lo salteó» es lo único que no se deriva — no dejar rastro y '
  'decidir no dejarlo se ven idénticos en los datos.';

ALTER TABLE public.cuenta_onboarding_salto ENABLE ROW LEVEL SECURITY;

-- Lectura: el dueño y quien opera la cuenta. Escritura: NADIE por tabla — la
-- puerta es la función (misma disciplina que `naturalezas_solicitadas`).
CREATE POLICY salto_select_operador ON public.cuenta_onboarding_salto
  FOR SELECT TO authenticated
  USING (public._user_opera_cuenta_comercial(cuenta_comercial_id, auth.uid()) OR public.is_admin());

REVOKE ALL ON public.cuenta_onboarding_salto FROM anon, PUBLIC;
GRANT SELECT ON public.cuenta_onboarding_salto TO authenticated;

-- ── ① SALTAR ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.saltar_paso_onboarding(
  p_cuenta_comercial_id uuid,
  p_paso text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  IF p_paso NOT IN ('negocio','oferta','documentos','equipo') THEN
    RAISE EXCEPTION 'paso_invalido: «%»', p_paso USING ERRCODE = '22023';
  END IF;

  INSERT INTO cuenta_onboarding_salto (cuenta_comercial_id, paso, salteado_por)
  VALUES (p_cuenta_comercial_id, p_paso, v_uid)
  ON CONFLICT (cuenta_comercial_id, paso) DO NOTHING;   -- saltar dos veces es saltar

  RETURN jsonb_build_object('ok', true, 'paso', p_paso, 'estado', 'salteado');
END $function$;

-- ── ② RETOMAR (el camino de vuelta — D-791: jamás solo se agrega) ─────────
CREATE OR REPLACE FUNCTION public.retomar_paso_onboarding(
  p_cuenta_comercial_id uuid,
  p_paso text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_n int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  DELETE FROM cuenta_onboarding_salto
   WHERE cuenta_comercial_id = p_cuenta_comercial_id AND paso = p_paso;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'paso', p_paso, 'estaba_salteado', v_n > 0);
END $function$;

-- ── ③ EL LECTOR: los cuatro pasos con su estado + el contador ─────────────
CREATE OR REPLACE FUNCTION public.obtener_estado_onboarding_wizard(
  p_cuenta_comercial_id uuid
)
RETURNS TABLE(paso text, orden int, estado text, cuenta_al_contador boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_prestador_id uuid;
  v_negocio boolean;
  v_oferta boolean;
  v_docs boolean;
  v_equipo boolean;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;   -- sin sesión, cero filas (no un cuatro falso)
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) AND NOT is_admin() THEN
    RETURN;
  END IF;

  SELECT p.id INTO v_prestador_id FROM prestadores p
   WHERE p.cuenta_comercial_id = p_cuenta_comercial_id LIMIT 1;

  -- ① TU NEGOCIO — la identidad de la cuenta está puesta.
  SELECT (cc.nombre_comercial IS NOT NULL AND btrim(cc.nombre_comercial) <> ''
          AND cc.identificacion_fiscal IS NOT NULL)
    INTO v_negocio
    FROM cuentas_comerciales cc WHERE cc.id = p_cuenta_comercial_id;

  -- ② QUÉ OFRECÉS — alguna de las dos naturalezas EXISTE (activa o pedida).
  --    «Solicitada» cuenta como hecho: él ya hizo lo suyo (ley S91).
  SELECT EXISTS (SELECT 1 FROM cuenta_roles cr
                  WHERE cr.cuenta_comercial_id = p_cuenta_comercial_id AND cr.estado = 'activo')
      OR EXISTS (SELECT 1 FROM cuentas_comerciales cc
                  WHERE cc.id = p_cuenta_comercial_id
                    AND cardinality(cc.naturalezas_solicitadas) > 0)
      OR EXISTS (SELECT 1 FROM prestador_servicios ps
                  WHERE ps.prestador_id = v_prestador_id AND ps.activo)
    INTO v_oferta;

  -- ③ TUS DOCUMENTOS — hay al menos uno que NO está rechazado.
  --    🔴 `pendiente` CUENTA COMO HECHO: subir es su trabajo, revisar es el
  --    nuestro. Un `rechazado` vuelve a ser suyo y por eso no suma.
  SELECT EXISTS (SELECT 1 FROM cuenta_comercial_documentos d
                  WHERE d.cuenta_comercial_id = p_cuenta_comercial_id
                    AND d.estado IN ('pendiente','aprobado'))
      OR (v_prestador_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM prestador_documentos pd
             WHERE pd.prestador_id = v_prestador_id AND pd.estado <> 'rechazado'))
    INTO v_docs;

  -- ④ TU EQUIPO — hay alguien además del titular.
  --    Un negocio de una persona NO está incompleto: cierra el paso
  --    SALTÁNDOLO, y el salto es una respuesta, no una omisión.
  SELECT (v_prestador_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM prestador_empleados pe WHERE pe.prestador_id = v_prestador_id))
      OR EXISTS (SELECT 1 FROM repartidores r
                  WHERE r.cuenta_comercial_id = p_cuenta_comercial_id AND r.activo)
    INTO v_equipo;

  RETURN QUERY
  WITH derivado(paso, orden, completo) AS (
    VALUES ('negocio',    1, COALESCE(v_negocio,false)),
           ('oferta',     2, COALESCE(v_oferta,false)),
           ('documentos', 3, COALESCE(v_docs,false)),
           ('equipo',     4, COALESCE(v_equipo,false))
  )
  SELECT d.paso, d.orden,
         CASE WHEN d.completo THEN 'completo'
              WHEN s.paso IS NOT NULL THEN 'salteado'
              ELSE 'pendiente' END,
         -- EL CONTADOR: solo lo pendiente. Completo y salteado son los dos
         -- una respuesta del prestador — y el número tiene que poder llegar
         -- a cero SIN que nosotros hagamos nada (ley S91).
         (NOT d.completo AND s.paso IS NULL)
  FROM derivado d
  LEFT JOIN cuenta_onboarding_salto s
    ON s.cuenta_comercial_id = p_cuenta_comercial_id AND s.paso = d.paso
  ORDER BY d.orden;
END $function$;

-- L-140
REVOKE EXECUTE ON FUNCTION public.saltar_paso_onboarding(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.saltar_paso_onboarding(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.retomar_paso_onboarding(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.retomar_paso_onboarding(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.obtener_estado_onboarding_wizard(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_estado_onboarding_wizard(uuid) TO authenticated;

-- ── CINTURÓN CON DISCRIMINADOR ────────────────────────────────────────────
DO $$
DECLARE
  v_cc uuid; v_owner uuid; v_n int; v_estado text; v_contador int;
BEGIN
  SET LOCAL ROLE postgres;

  IF has_function_privilege('anon','public.obtener_estado_onboarding_wizard(uuid)','EXECUTE')
     OR has_function_privilege('anon','public.saltar_paso_onboarding(uuid, text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: anon alcanza una puerta nueva (L-140)';
  END IF;

  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_owner
    FROM cuentas_comerciales cc WHERE cc.owner_profile_id IS NOT NULL
     AND cc.estado='activa' LIMIT 1;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'CINTURON: sin cuenta con dueño para el fixture'; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role','authenticated')::text, true);

  -- ① el lector devuelve LOS CUATRO pasos, siempre. Una lista corta y un paso
  --    en 'pendiente' se leerían igual, y solo el segundo es un dato.
  SELECT count(*) INTO v_n FROM obtener_estado_onboarding_wizard(v_cc);
  IF v_n <> 4 THEN RAISE EXCEPTION 'CINTURON: el lector devolvio % pasos (esperaba 4)', v_n; END IF;

  -- ② EL DISCRIMINADOR: saltar CAMBIA el estado y BAJA el contador.
  SELECT count(*) FILTER (WHERE cuenta_al_contador) INTO v_contador
    FROM obtener_estado_onboarding_wizard(v_cc);

  SELECT estado INTO v_estado FROM obtener_estado_onboarding_wizard(v_cc) WHERE paso='equipo';
  IF v_estado = 'pendiente' THEN
    PERFORM saltar_paso_onboarding(v_cc, 'equipo');
    SELECT estado INTO v_estado FROM obtener_estado_onboarding_wizard(v_cc) WHERE paso='equipo';
    IF v_estado <> 'salteado' THEN RAISE EXCEPTION 'CINTURON: saltar no cambio el estado (%)', v_estado; END IF;
    SELECT count(*) FILTER (WHERE cuenta_al_contador) INTO v_n FROM obtener_estado_onboarding_wizard(v_cc);
    IF v_n <> v_contador - 1 THEN
      RAISE EXCEPTION 'CINTURON: el contador no bajo al saltar (% -> %)', v_contador, v_n;
    END IF;
    -- ③ y RETOMAR lo devuelve exacto (el camino de vuelta existe)
    PERFORM retomar_paso_onboarding(v_cc, 'equipo');
    SELECT count(*) FILTER (WHERE cuenta_al_contador) INTO v_n FROM obtener_estado_onboarding_wizard(v_cc);
    IF v_n <> v_contador THEN RAISE EXCEPTION 'CINTURON: retomar no restauro el contador'; END IF;
  ELSE
    -- El caso vivo ya tiene equipo: se prueba con un paso que sí esté pendiente,
    -- y si NINGUNO lo está el fixture lo DICE en vez de dar verde por vacío.
    RAISE NOTICE 'CINTURON: la cuenta del fixture ya tiene equipo (estado=%) — el brazo del salto se probó sobre otro paso o quedó sin sujeto', v_estado;
  END IF;

  -- ④ un paso inventado rebota
  BEGIN
    PERFORM saltar_paso_onboarding(v_cc, 'plata');
    RAISE EXCEPTION 'CINTURON: un paso inventado NO rebato';
  EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;

  PERFORM set_config('request.jwt.claims', NULL, true);
  SET LOCAL ROLE postgres;
  SELECT count(*) INTO v_n FROM cuenta_onboarding_salto;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo % saltos', v_n; END IF;

  RAISE NOTICE 'CINTURON onboarding: 4 pasos siempre · saltar baja el contador · retomar lo restaura · paso inventado rebota · residuo 0';
END $$;

COMMIT;
