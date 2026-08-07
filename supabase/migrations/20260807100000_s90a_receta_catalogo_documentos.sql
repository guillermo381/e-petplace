-- ═══════════════════════════════════════════════════════════════════════════
-- S90-A · ORDEN 1 — LA RECETA (tercer papel) + cat_documentos_mascota
--
-- FIRMA DE MESA (medición S89 §5): el catálogo de papeles NACE CON EL TERCER
-- PAPEL, en la MISMA migración — un tercer papel enumerado a mano es la
-- cuarta copia esperando divergir (19.9). Hasta hoy los dos papeles vivos
-- estaban enumerados en TRES lugares: el CHECK de documento_token, el mapa
-- FUNCION del wrapper y la superficie. Con esta migración:
--   · el CHECK muere → FK a cat_documentos_mascota
--   · el mapa del wrapper muere → la RPC devuelve `funcion` del catálogo
--   · la superficie podrá leer el catálogo (voz + orden) cuando C lo pida
--
-- LA RECETA (las cuatro decisiones firmadas, brief S90 ②):
--   1. «Firmar» v1 = nombre + matrícula IMPRESOS con procedencia declarada.
--      Sin firma criptográfica, sin imagen de firma (se recorta).
--   2. Sin folio y sin vigencia, DECLARADO en el papel.
--   3. La descarga el DUEÑO — misma puerta del expediente
--      (user_tiene_acceso_a_mascota; el papel no ensancha permisos).
--   4. UN PAPEL POR CONSULTA → el token gana `ref_id` (la cita de la
--      consulta); la RPC exige que esa cita tenga medicación de esa mascota.
--
-- El fallback del firmante vive en la Edge Function `documento-receta`:
-- profesional sin matrícula ⇒ emite el NEGOCIO — JAMÁS se inventa firmante.
-- (Medido hoy: 0 de 16 empleados activos con matrícula cargada — el 100%
-- de las recetas saldría con fallback; la captura en superficie es de B.)
--
-- certificado_salud NO SE SIEMBRA: su fila la entrega la pista D como SQL
-- literal (76b) — el catálogo nace con capacidad para los cinco, no con
-- filas inventadas por otra pista.
--
-- 76(g) VEDA: NO RIGE — DDL nuevo + seed ESTÁTICO de catálogo + FK que
--   valida las 9 filas existentes de documento_token; ningún paso computa
--   anclas sobre datos vivos.
-- D-662 (bundles vivos): los bundles llaman emitir_token_documento con
--   args nombrados {p_mascota_id, p_tipo}; la firma nueva agrega p_ref con
--   DEFAULT NULL ⇒ PostgREST resuelve igual. El retorno agrega la clave
--   `funcion` (aditivo); `token` y `tipo` se conservan. Cero contrato roto.
-- L-119: DROP explícito de la firma vieja (uuid, text) — sin zombis.
-- L-140: REVOKE + GRANT explícitos, cinturón con proacl.
-- REVERSA: docs/relevamientos/2026-08-07-s90a-REVERSA-receta-catalogo.sql
--   (escrita ANTES de aplicar).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① EL CATÁLOGO DE PAPELES ────────────────────────────────────────────────
CREATE TABLE public.cat_documentos_mascota (
  codigo       text PRIMARY KEY,
  voz          text NOT NULL,          -- el nombre del papel en superficie
  funcion_edge text NOT NULL,          -- slug de la Edge Function que lo compone
  requiere_ref boolean NOT NULL DEFAULT false, -- el token exige un ref (receta: la consulta)
  activo       boolean NOT NULL DEFAULT true,
  orden        integer NOT NULL DEFAULT 100,
  created_at   timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.cat_documentos_mascota IS
  'Catálogo de papeles emitibles del expediente (S90-A). Nació con el tercer papel (firma de mesa S89): el CHECK, el mapa del wrapper y la superficie dejan de enumerar a mano.';

ALTER TABLE public.cat_documentos_mascota ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cat_documentos_mascota FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.cat_documentos_mascota TO authenticated;
CREATE POLICY cat_documentos_select ON public.cat_documentos_mascota
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.cat_documentos_mascota (codigo, voz, funcion_edge, requiere_ref, activo, orden) VALUES
  ('carnet_vacunas',   'Carnet de vacunas',   'documento-carnet',           false, true, 10),
  ('historia_clinica', 'Historia clínica',    'documento-historia-clinica', false, true, 20),
  ('receta',           'Receta',              'documento-receta',           true,  true, 30),
  ('ficha_identidad',  'Ficha de identidad',  'documento-ficha-identidad',  false, true, 40);

-- ── ② documento_token: muere la enumeración a mano, nace el ref ────────────
ALTER TABLE public.documento_token DROP CONSTRAINT documento_token_tipo_check;
ALTER TABLE public.documento_token
  ADD CONSTRAINT documento_token_tipo_fkey
  FOREIGN KEY (tipo) REFERENCES public.cat_documentos_mascota(codigo);
ALTER TABLE public.documento_token ADD COLUMN ref_id uuid;
COMMENT ON COLUMN public.documento_token.ref_id IS
  'Alcance fino del papel cuando el tipo lo exige (requiere_ref): para receta, la cita de la consulta. NULL para papeles de expediente entero.';

-- ── ③ LA RPC: valida contra el catálogo y devuelve la función ──────────────
DROP FUNCTION public.emitir_token_documento(uuid, text);

CREATE FUNCTION public.emitir_token_documento(
  p_mascota_id uuid,
  p_tipo       text DEFAULT 'carnet_vacunas',
  p_ref        uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid   uuid := auth.uid();
  v_cat   record;
  v_token uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT codigo, funcion_edge, requiere_ref INTO v_cat
  FROM cat_documentos_mascota
  WHERE codigo = p_tipo AND activo;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'tipo_documento_invalido' USING ERRCODE = '22023';
  END IF;

  -- la misma puerta que el resto del expediente: el papel no ensancha permisos
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;

  IF v_cat.requiere_ref AND p_ref IS NULL THEN
    RAISE EXCEPTION 'ref_requerida' USING ERRCODE = '22023';
  END IF;

  -- Receta: un papel POR CONSULTA (decisión 4). El ref es la cita, y esa
  -- cita tiene que tener medicación prescrita DE ESTA mascota — una receta
  -- vacía no es un papel, y un ref ajeno sería leer por la ventana.
  IF v_cat.codigo = 'receta' THEN
    IF NOT EXISTS (
      SELECT 1 FROM evento_medicacion_prescrita m
      WHERE m.cita_id = p_ref AND m.mascota_id = p_mascota_id
    ) THEN
      RAISE EXCEPTION 'receta_sin_medicacion' USING ERRCODE = '22023';
    END IF;
  END IF;

  INSERT INTO documento_token (user_id, mascota_id, tipo, ref_id, expira_en)
  VALUES (v_uid, p_mascota_id, v_cat.codigo, p_ref, now() + interval '10 minutes')
  RETURNING id INTO v_token;

  RETURN jsonb_build_object(
    'ok', true,
    'token', v_token,
    'tipo', v_cat.codigo,
    'funcion', v_cat.funcion_edge
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.emitir_token_documento(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.emitir_token_documento(uuid, text, uuid) TO authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE
  v_acl aclitem[];
  v_n   integer;
  v_src text;
BEGIN
  -- L-140: sin anon/PUBLIC en la RPC nueva
  SELECT p.proacl INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'emitir_token_documento';
  IF EXISTS (SELECT 1 FROM unnest(coalesce(v_acl, '{}'::aclitem[])) a
             WHERE a::text LIKE 'anon=%' OR a::text LIKE '=%') THEN
    RAISE EXCEPTION 'cinturon_receta: la RPC quedó ejecutable por anon/PUBLIC (L-140)';
  END IF;
  -- L-119: una sola firma viva
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'emitir_token_documento';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon_receta: % firmas de emitir_token_documento — quedó una zombi (L-119)', v_n;
  END IF;
  -- el catálogo tiene los cuatro papeles de A (el quinto lo trae D)
  SELECT count(*) INTO v_n FROM cat_documentos_mascota;
  IF v_n <> 4 THEN
    RAISE EXCEPTION 'cinturon_receta: el catálogo tiene % filas, se esperaban 4', v_n;
  END IF;
  -- la RPC lee el catálogo, no una lista a mano
  SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'emitir_token_documento';
  IF v_src NOT LIKE '%cat_documentos_mascota%' THEN
    RAISE EXCEPTION 'cinturon_receta: la RPC no consulta el catálogo';
  END IF;
  -- la FK rige y las 9 filas históricas validan
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documento_token_tipo_fkey' AND convalidated) THEN
    RAISE EXCEPTION 'cinturon_receta: la FK del tipo no quedó validada';
  END IF;
  -- la tabla de tokens sigue ilegible por PostgREST
  IF has_table_privilege('authenticated', 'public.documento_token', 'SELECT') THEN
    RAISE EXCEPTION 'cinturon_receta: la tabla de tokens quedó legible por PostgREST';
  END IF;
  -- el catálogo NO es escribible por el aparato
  IF has_table_privilege('authenticated', 'public.cat_documentos_mascota', 'INSERT') THEN
    RAISE EXCEPTION 'cinturon_receta: el catálogo quedó escribible por authenticated';
  END IF;
END $cint$;
