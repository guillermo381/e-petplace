-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA · S95-G2 — las tres puertas del alta del vendedor + la cuarta puerta
--   supabase/migrations/20260812030000_s95g2_puertas_vendedor.sql
--
-- ✅ Deshace la estructura entera: borra las tres funciones nuevas y devuelve
--    los dos helpers a su cuerpo de S95-C (sin el filtro de cuenta activa).
--
-- 🔴 REVERTIR REABRE UNA INCOHERENCIA MEDIDA: `es_vendedor_de` volvería a
--    dejar vender a una cuenta comercial que NO está activa, mientras
--    `generar_liquidacion` —la función que paga— sigue exigiendo que lo esté.
--    Un pedido tomado por una cuenta suspendida **se cobra y después no se
--    puede liquidar**: la plata queda atrapada entre dos reglas que no dicen
--    lo mismo.
--
-- ⚠️ NO deshace los DATOS: un rol otorgado, una regla de envío cargada o una
--    bodega creada siguen ahí. Se borran a mano si hace falta.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.otorgar_rol_vendedor(uuid, text);
DROP FUNCTION IF EXISTS public.definir_regla_envio_vendedor(uuid, text, jsonb, text, text[], integer);
DROP FUNCTION IF EXISTS public.crear_bodega_vendedor(uuid, text, text, text, time, integer, text);

CREATE OR REPLACE FUNCTION public._cuenta_es_vendedora(p_cuenta_comercial_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM cuentas_comerciales cc
    JOIN cuenta_roles cr ON cr.cuenta_comercial_id = cc.id
    WHERE cc.id = p_cuenta_comercial_id
      AND cr.tipo_actor = 'seller_productos' AND cr.estado = 'activo');
$$;

CREATE OR REPLACE FUNCTION public.es_vendedor_de(p_cuenta_comercial_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM cuentas_comerciales cc
    JOIN cuenta_roles cr ON cr.cuenta_comercial_id = cc.id
    WHERE cc.id = p_cuenta_comercial_id
      AND cc.owner_profile_id = auth.uid()
      AND cr.tipo_actor = 'seller_productos' AND cr.estado = 'activo');
$$;

COMMIT;
