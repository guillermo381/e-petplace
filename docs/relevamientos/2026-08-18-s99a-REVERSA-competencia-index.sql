-- REVERSA de 20260818000000_s99a_competencia_index_por_cuenta.sql (ANTES)
-- ⚠️ NO PUEDE REVERTIR SI YA HAY COMPETENCIA: al volver al índice viejo
-- (UNIQUE por variante), dos ofertas publicadas del mismo producto pasan a
-- ser ilegales — la creación del índice FALLA si existen. Antes de revertir
-- hay que decidir CUÁL oferta sobrevive por variante y despublicar el resto
-- (acto de producto, no de migración: por eso no se automatiza acá).
--
--   SELECT variante_id, count(*) FROM ofertas WHERE estado='publicada'
--    GROUP BY 1 HAVING count(*) > 1;   -- las que bloquean la reversa
--
DROP INDEX IF EXISTS public.uq_oferta_publicada_por_cuenta_variante;
CREATE UNIQUE INDEX uq_oferta_publicada_por_variante
  ON public.ofertas USING btree (variante_id) WHERE (estado = 'publicada'::text);
