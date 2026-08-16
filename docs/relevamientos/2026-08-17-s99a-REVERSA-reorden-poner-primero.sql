-- REVERSA de 20260817180000_s99a_l3_reorden_poner_primero.sql (escrita ANTES)
-- ⚠️ Qué deshace y qué NO:
--  · Tira las dos RPCs y la columna `movido_al_frente_en` — LAS MARCAS
--    MANUALES VIVAS SE PIERDEN CON LA COLUMNA (es un dato operativo efímero
--    de ordenamiento, no un hecho del pedido: perderlo degrada al FIFO puro,
--    no rompe nada — pero se declara).
--  · La vista vuelve a su forma previa (la de 20260817160000, con
--    pago_confirmado_en al final) — cuerpo tomado de pg_get_viewdef ANTES.
--  · Un bundle publicado que llame las RPCs recibirá PGRST202 (función
--    inexistente); el wrapper lo tipa como error y la pantalla habla.

DROP FUNCTION IF EXISTS public.poner_pedido_primero(uuid);
DROP FUNCTION IF EXISTS public.volver_pedido_al_orden(uuid);

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
            WHEN ((n.codigo = 'en_camino'::text) AND (p.metodo_entrega = 'retiro'::text)) THEN 'Listo para retirar'::text
            ELSE n.nombre
        END AS narrativa_nombre,
    n.orden AS narrativa_orden,
    n.es_terminal,
    p.promesa_entrega_desde,
    p.promesa_entrega_hasta,
    p.created_at,
    p.updated_at,
    p.entrega_fecha_objetivo,
    ( SELECT max(pi.cerrado_en) AS max
           FROM pagos_intentos pi
          WHERE ((pi.pedido_id = p.id) AND (pi.estado = 'aprobado'::text))) AS pago_confirmado_en
   FROM ((pedidos p
     JOIN cat_estados_pedido e ON ((e.codigo = p.estado)))
     JOIN cat_narrativas_pedido n ON ((n.codigo = e.narrativa)));

ALTER TABLE public.pedidos DROP COLUMN IF EXISTS movido_al_frente_en;
