-- REVERSA de 20260817160000_s99a_l3_pago_confirmado_en_narrativa.sql
-- Escrita ANTES. Restaura la vista SIN pago_confirmado_en (definicion viva
-- capturada del objeto al momento de la migracion):
CREATE OR REPLACE VIEW public.v_pedidos_narrativa AS
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
-- NOTA: la columna es ADITIVA al final — revertir NO rompe lectores que no
-- la piden; el wrapper nuevo que la pida caeria a error de columna.
