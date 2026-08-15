-- REVERSA de 20260816110000_s98a_puertas_repartidor.sql
-- ESCRITA ANTES DE APLICAR.
--
-- ── QUÉ DESHACE ────────────────────────────────────────────────────────────
-- Devuelve `registrar_repartidor` y `actualizar_repartidor` a su firma de
-- S96 (sin identidad), y mata las dos puertas de vehículo.
--
-- ── 🔴 QUÉ **NO** DESHACE ──────────────────────────────────────────────────
-- ① **Los datos escritos siguen ahí.** Las columnas de identidad y las filas
--    de `repartidor_vehiculos` NO se tocan: revertir la puerta deja los datos
--    vivos y **sin forma de mantenerlos**. Quedan legibles y congelados.
-- ② 🔴 **El orden importa:** esta reversa va PRIMERO y la del esquema DESPUÉS.
--    Al revés, entre una y otra las puertas apuntan a columnas inexistentes y
--    **el alta del repartidor queda rota** — no degradada: rota.
-- ③ La app que ya llame con los parámetros nuevos empezará a recibir
--    `PGRST202` (firma no resuelta), **no** un error hablado. *Revertir una
--    puerta sin revertir el bundle deja a la pantalla hablándole a una función
--    que no existe.*

BEGIN;

DROP FUNCTION IF EXISTS public.registrar_vehiculo_repartidor(uuid, text, text);
DROP FUNCTION IF EXISTS public.eliminar_vehiculo_repartidor(uuid);

-- L-119: la firma nueva se DROPea explícitamente; un CREATE OR REPLACE con la
-- vieja dejaría las DOS vivas y PostgREST elegiría por aridad.
DROP FUNCTION IF EXISTS public.registrar_repartidor(uuid, text, text, text, uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.actualizar_repartidor(uuid, boolean, text, text, uuid, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.registrar_repartidor(
  p_cuenta_comercial_id uuid, p_nombre text, p_documento text,
  p_telefono text DEFAULT NULL, p_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $function$
DECLARE v_id uuid; v_existente uuid;
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
  SELECT id INTO v_existente FROM repartidores
   WHERE cuenta_comercial_id = p_cuenta_comercial_id AND documento = btrim(p_documento);
  IF v_existente IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'repartidor_id', v_existente, 'ya_existia', true);
  END IF;
  INSERT INTO repartidores (cuenta_comercial_id, nombre, documento, telefono, user_id)
    VALUES (p_cuenta_comercial_id, btrim(p_nombre), btrim(p_documento),
            NULLIF(btrim(COALESCE(p_telefono,'')),''), p_user_id)
    RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'repartidor_id', v_id, 'ya_existia', false);
END $function$;

CREATE OR REPLACE FUNCTION public.actualizar_repartidor(
  p_repartidor_id uuid, p_activo boolean DEFAULT NULL, p_nombre text DEFAULT NULL,
  p_telefono text DEFAULT NULL, p_user_id uuid DEFAULT NULL, p_documento text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $function$
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
    RAISE EXCEPTION 'documento_en_uso: otro repartidor de esta casa ya tiene ese documento'
      USING ERRCODE = '23505';
  END IF;
  UPDATE repartidores SET
    activo = COALESCE(p_activo, activo),
    nombre = COALESCE(NULLIF(btrim(COALESCE(p_nombre,'')),''), nombre),
    telefono = CASE WHEN p_telefono IS NULL THEN telefono ELSE NULLIF(btrim(p_telefono),'') END,
    user_id = COALESCE(p_user_id, user_id),
    documento = COALESCE(v_doc, documento),
    updated_at = now()
  WHERE id = p_repartidor_id;
  RETURN jsonb_build_object('ok', true, 'repartidor_id', p_repartidor_id);
END $function$;

REVOKE ALL ON FUNCTION public.registrar_repartidor(uuid, text, text, text, uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.actualizar_repartidor(uuid, boolean, text, text, uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_repartidor(uuid, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_repartidor(uuid, boolean, text, text, uuid, text) TO authenticated;

COMMIT;
