-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · D-791 (mitad de motor) — EL DOCUMENTO DEL REPARTIDOR SE PUEDE
-- CORREGIR (13-ago-2026)
--
-- El hueco medido: `registrar_repartidor` es idempotente por
-- (cuenta, documento) y `actualizar_repartidor` cubría activo/nombre/
-- teléfono/user_id — **pero NO documento**: un repartidor con la identidad
-- mal tipeada quedaba mal PARA SIEMPRE (el registrar con el documento
-- corregido crearía OTRO repartidor en silencio).
--
-- La otra puerta que C declaró sin reabrir —`definir_regla_envio_vendedor`—
-- SE MIDIÓ Y YA CORRIGE por re-invocación (desactiva la activa e inserta:
-- «redefinir NO apila reglas»); su mitad faltante es el LECTOR de prefill,
-- que va por wrapper (RLS `reglas_envio_select` ya concede al vendedor).
--
-- L-119: agregar un parámetro con DEFAULT crea una SOBRECARGA y deja la
-- firma vieja zombi (y PostgREST no resuelve ambigüedad) ⇒ DROP explícito
-- de la firma de 5 y CREATE con 6.
-- 76(g): NO RIGE — cirugía de una función, sin backfill, sin anclas.
-- Bundles vivos (D-662): el wrapper vivo llama por nombre con argumentos
-- NOMBRADOS vía PostgREST — la firma nueva conserva todos los nombres y
-- defaults viejos, así que las llamadas existentes resuelven igual.
-- REVERSA escrita ANTES: scripts/s97/2026-08-13-s97a-repartidor-documento-REVERSA.sql
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.actualizar_repartidor(uuid, boolean, text, text, uuid);

CREATE FUNCTION public.actualizar_repartidor(
  p_repartidor_id uuid,
  p_activo boolean DEFAULT NULL,
  p_nombre text DEFAULT NULL,
  p_telefono text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_documento text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_cc uuid; v_doc text;
BEGIN
  SELECT cuenta_comercial_id INTO v_cc FROM repartidores WHERE id = p_repartidor_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'repartidor_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT es_vendedor_de(v_cc) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  v_doc := NULLIF(btrim(COALESCE(p_documento,'')),'');
  IF v_doc IS NOT NULL AND EXISTS (
    SELECT 1 FROM repartidores
     WHERE cuenta_comercial_id = v_cc AND documento = v_doc AND id <> p_repartidor_id
  ) THEN
    -- Corregir la identidad jamás fusiona dos personas en silencio.
    RAISE EXCEPTION 'documento_en_uso: otro repartidor de esta casa ya tiene ese documento'
      USING ERRCODE = '23505';
  END IF;

  UPDATE repartidores SET
    activo    = COALESCE(p_activo, activo),
    nombre    = COALESCE(NULLIF(btrim(COALESCE(p_nombre,'')),''), nombre),
    telefono  = CASE WHEN p_telefono IS NULL THEN telefono
                     ELSE NULLIF(btrim(p_telefono),'') END,
    user_id   = COALESCE(p_user_id, user_id),
    documento = COALESCE(v_doc, documento),
    updated_at = now()
  WHERE id = p_repartidor_id;
  RETURN jsonb_build_object('ok', true, 'repartidor_id', p_repartidor_id);
END $function$;

-- L-140: la puerta nueva cierra anon/PUBLIC explícito.
REVOKE EXECUTE ON FUNCTION public.actualizar_repartidor(uuid, boolean, text, text, uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.actualizar_repartidor(uuid, boolean, text, text, uuid, text) TO authenticated;

-- ── Cinturón + fixture con discriminador (in-txn, ROLLBACK del fixture) ────
DO $$
DECLARE
  v_n int; v_rep uuid; v_rep2 uuid; v_cc uuid; v_admin uuid; v_doc text;
BEGIN
  -- una sola firma viva (L-119)
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='actualizar_repartidor';
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: % firmas de actualizar_repartidor (esperaba 1)', v_n; END IF;
  IF has_function_privilege('anon', 'public.actualizar_repartidor(uuid, boolean, text, text, uuid, text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: anon puede ejecutar (L-140)';
  END IF;

  -- fixture: corregir el documento FUNCIONA y la colisión REBOTA
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role','authenticated')::text, true);
  SELECT id, cuenta_comercial_id INTO v_rep, v_cc FROM repartidores WHERE documento='DEMO-REP-S97-001';
  IF v_rep IS NULL THEN RAISE EXCEPTION 'CINTURON: falta el repartidor S97 del fixture'; END IF;

  PERFORM actualizar_repartidor(v_rep, p_documento => 'DEMO-REP-S97-001-CORR');
  SELECT documento INTO v_doc FROM repartidores WHERE id = v_rep;
  IF v_doc <> 'DEMO-REP-S97-001-CORR' THEN RAISE EXCEPTION 'CINTURON: el documento no se corrigio (%)', v_doc; END IF;

  v_rep2 := (registrar_repartidor(v_cc, 'Colision de prueba', 'DEMO-REP-S97-COLISION', NULL, NULL) ->> 'repartidor_id')::uuid;
  BEGIN
    PERFORM actualizar_repartidor(v_rep2, p_documento => 'DEMO-REP-S97-001-CORR');
    RAISE EXCEPTION 'CINTURON: la colision NO rebato';
  EXCEPTION WHEN unique_violation THEN NULL; -- el rebote esperado
  END;

  -- el fixture se deshace: documento de vuelta, la colisión de prueba muere
  PERFORM actualizar_repartidor(v_rep, p_documento => 'DEMO-REP-S97-001');
  DELETE FROM repartidores WHERE id = v_rep2;
  PERFORM set_config('request.jwt.claims', NULL, true);
  RAISE NOTICE 'CINTURON D-791: corregir OK · colision rebota · residuo 0';
END $$;

COMMIT;
