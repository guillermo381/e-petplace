-- ============================================================================
-- REVERSA de 20260817110000_s99a_vista_pedidos_dia_objetivo.sql
-- Escrita ANTES de aplicar. S99-A, 15-ago-2026.
-- Restaura v_pedidos_narrativa SIN entrega_fecha_objetivo (def viva leída del
-- objeto con pg_get_viewdef el 15-ago-2026). security_invoker se conserva.
-- QUÉ NO DESHACE: nada de datos (la migración no toca datos).
-- NOTA DE BUNDLES (D-662): revertir ROMPE a `listarPedidosDelVendedorEnRango`
-- (el wrapper nuevo pide la columna) — revertir la vista exige revertir
-- también el wrapper, o el lector del rango rebota con columna inexistente.
-- ============================================================================
DROP VIEW IF EXISTS public.v_pedidos_narrativa;
CREATE VIEW public.v_pedidos_narrativa WITH (security_invoker = true) AS
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
    p.updated_at
   FROM pedidos p
     JOIN cat_estados_pedido e ON e.codigo = p.estado
     JOIN cat_narrativas_pedido n ON n.codigo = e.narrativa;
GRANT SELECT ON public.v_pedidos_narrativa TO authenticated;
