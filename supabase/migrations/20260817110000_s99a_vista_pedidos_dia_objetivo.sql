-- ============================================================================
-- S99-A · EL DÍA DEL PEDIDO ENTRA A LA VISTA DEL VENDEDOR (pedido de D, L4)
--
-- POR QUÉ: el dual del HOY (PLAN_S99 L4) necesita leer pedidos POR VENTANA DE
-- FECHAS con selector compartido, y `v_pedidos_narrativa` no exponía ningún
-- «día». La decisión de cuál columna ES el día no se inventa: el MOTOR ya la
-- tiene — `cupo_reparto_del_dia` cuenta lo prometido por
-- `pedidos.entrega_fecha_objetivo`. **El día del pedido es
-- `entrega_fecha_objetivo`, la misma verdad que consume el cupo** (una sola
-- fuente; `promesa_entrega_desde` es la VENTANA horaria dentro de ese día y
-- ya viajaba). El HOY deja de filtrar en memoria por date-part de la promesa.
--
-- QUÉ HACE: CREATE OR REPLACE VIEW — columna nueva AL FINAL, ACL intacto
-- (medido: authenticated SELECT, sin anon; security_invoker=true se re-declara
-- porque OR REPLACE la conserva pero la letra la deja explícita).
--
-- Los pedidos SIN día (entrega_fecha_objetivo NULL) siguen visibles: la vista
-- no filtra — decide el lector. El wrapper del rango los devuelve aparte y
-- SIEMPRE si están vivos (precedente D-439/S71: lo sin-fecha preside, jamás
-- desaparece por un .gte).
--
-- 76(g): NO RIGE — vista, cero datos.
-- REVERSA: escrita ANTES en
--   docs/relevamientos/2026-08-15-s99a-REVERSA-vista-dia-pedido.sql
--   (con su nota D-662: revertir la vista exige revertir el wrapper del rango).
-- ============================================================================

CREATE OR REPLACE VIEW public.v_pedidos_narrativa WITH (security_invoker = true) AS
 SELECT p.id AS pedido_id,
    p.user_id,
    p.cuenta_comercial_id,
    p.numero_orden,
    p.total,
    p.moneda,
    p.metodo_entrega,
    n.codigo AS narrativa,
        CASE
            WHEN n.codigo = 'en_camino'::text AND p.metodo_entrega = 'retiro'::text THEN 'Listo para retirar'::text
            ELSE n.nombre
        END AS narrativa_nombre,
    n.orden AS narrativa_orden,
    n.es_terminal,
    p.promesa_entrega_desde,
    p.promesa_entrega_hasta,
    p.created_at,
    p.updated_at,
    p.entrega_fecha_objetivo
   FROM pedidos p
     JOIN cat_estados_pedido e ON e.codigo = p.estado
     JOIN cat_narrativas_pedido n ON n.codigo = e.narrativa;

-- CINTURÓN: la columna está, el invoker sigue, anon sigue afuera.
DO $cinturon$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='v_pedidos_narrativa'
                    AND column_name='entrega_fecha_objetivo') THEN
    RAISE EXCEPTION 'cinturon: la vista no ganó entrega_fecha_objetivo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class
                  WHERE oid='public.v_pedidos_narrativa'::regclass
                    AND reloptions @> ARRAY['security_invoker=true']) THEN
    RAISE EXCEPTION 'cinturon: la vista perdió security_invoker';
  END IF;
  IF has_table_privilege('anon','public.v_pedidos_narrativa','SELECT') THEN
    RAISE EXCEPTION 'cinturon: anon puede leer la vista del vendedor';
  END IF;
  IF NOT has_table_privilege('authenticated','public.v_pedidos_narrativa','SELECT') THEN
    RAISE EXCEPTION 'cinturon: authenticated perdió el SELECT — el panel del vendedor quedaría ciego';
  END IF;
END $cinturon$;
