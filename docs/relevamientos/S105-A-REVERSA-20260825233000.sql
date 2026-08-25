-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260825233000_s105a_conciliar_por_proveedor.sql
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: devuelve `pagos_pendientes_de_conciliar` a su forma previa
-- byte-idéntica — un solo argumento, sin `proveedor` ni `referencia_corta` en
-- la tabla de salida.
--
-- 🔴 QUÉ **NO** DESHACE:
--   · **El barrido de DeUna vuelve a devolver `sin_candidatos`**, porque llama
--     con `p_proveedor` y esa firma deja de existir ⇒ 42883.
--   · Los pagos ya conciliados **quedan conciliados**.
--
-- ⚠️ El DROP de la firma nueva va PRIMERO y no se omite: sin él conviven dos
-- versiones y el resolvedor de sobrecargas elige por su cuenta (`L-119`).
-- ⛔ NO correr con el riel de DeUna en uso.
-- ══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.pagos_pendientes_de_conciliar(integer, text);

CREATE OR REPLACE FUNCTION public.pagos_pendientes_de_conciliar(p_minutos_de_gracia integer DEFAULT 10)
 RETURNS TABLE(compra_id uuid, transaction_id text, monto numeric, creado_en timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  -- Compras que intentaron pagar y no llegaron a `pagada`, con un intento que
  -- YA tiene id de transacción del proveedor: sin ese id no hay a quién
  -- preguntarle, y un intento recién nacido todavía puede estar en vuelo —
  -- de ahí los minutos de gracia.
  SELECT DISTINCT c.id, i.proveedor_transaction_id, c.total, i.creado_en
    FROM compras c
    JOIN pagos_intentos i ON i.compra_id = c.id
   WHERE c.estado IN ('creada','esperando_pago')
     AND i.proveedor_transaction_id IS NOT NULL
     AND i.creado_en < now() - make_interval(mins => p_minutos_de_gracia)
   ORDER BY i.creado_en;
$function$
;
