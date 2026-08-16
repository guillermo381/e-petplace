-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · L3 — `pago_confirmado_en` ENTRA A LA VISTA NARRATIVA (aditiva).
--
-- EL PORQUÉ (firma del Gate 1, adjudicada 16-ago): la cola del vendedor
-- ordena FIFO por HORA DE CONFIRMACIÓN DEL PAGO — y la fuente MEDIDA es
-- `pagos_intentos.cerrado_en` del intento aprobado (`pedidos.pagado_en`
-- está HEREDADA/BLOQUEADA y 0/14 poblada — su COMMENT lo declara). El dato
-- viaja en la MISMA vista que el lector de rango ya lee: cero ola nueva.
-- Columna AL FINAL (OR REPLACE exige orden estable) — los lectores que no
-- la piden no la ven.
--
-- 76(g): NO RIGE (vista, cero datos). Bundles vivos (D-662): ninguno pide
-- la columna (nace hoy) — compatible por definición.
-- Reversa ANTES: docs/relevamientos/2026-08-16-s99a-REVERSA-pago-confirmado-en-vista.sql
-- ═══════════════════════════════════════════════════════════════════════════
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
    p.entrega_fecha_objetivo,
    ( SELECT max(pi.cerrado_en)
        FROM pagos_intentos pi
       WHERE pi.pedido_id = p.id
         AND pi.estado::text = 'aprobado') AS pago_confirmado_en
   FROM pedidos p
     JOIN cat_estados_pedido e ON e.codigo = p.estado
     JOIN cat_narrativas_pedido n ON n.codigo = e.narrativa;

-- CINTURÓN: la columna existe, y DISCRIMINA — los pedidos con intento
-- aprobado la traen poblada y coincide con el max() leído aparte.
DO $$
DECLARE v_con int; v_esperado int;
BEGIN
  SELECT count(*) INTO v_con FROM public.v_pedidos_narrativa WHERE pago_confirmado_en IS NOT NULL;
  SELECT count(DISTINCT pedido_id) INTO v_esperado FROM public.pagos_intentos
   WHERE estado::text='aprobado' AND cerrado_en IS NOT NULL;
  IF v_con IS DISTINCT FROM v_esperado THEN
    RAISE EXCEPTION 'CINTURÓN: % pedidos con pago_confirmado_en vs % con intento aprobado', v_con, v_esperado;
  END IF;
  IF v_esperado = 0 THEN
    RAISE EXCEPTION 'CINTURÓN: cero intentos aprobados — el fixture no discrimina (habia 10 al medir)';
  END IF;
  RAISE NOTICE 'CINTURÓN pago_confirmado_en: verde (% pedidos)', v_con;
END $$;
