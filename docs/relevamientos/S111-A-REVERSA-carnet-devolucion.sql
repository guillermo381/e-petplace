/* REVERSA de `20260907620000_s111a_carnet_solo_en_recogida.sql` — ESCRITA ANTES.
   🔴 QUÉ NO DESHACE:
   1. **Volver `carnet_verificado` a `NOT NULL` FALLA si ya hay actas de
      devolución** — las de esta migración nacen con NULL a propósito. Y la
      única forma de hacerlo pasar sería **escribir un `false` en cada una**,
      que es exactamente la afirmación falsa que esta migración vino a impedir:
      *que el carnet se revisó al devolver y no estaba en orden.*
   2. `marcar_entregada_guarderia` vuelve a pedir un booleano que **no tiene
      valor honesto**, y la pantalla vuelve a estar obligada a inventarlo.
   ⇒ Mirar antes:
      SELECT direccion, count(*), count(carnet_verificado) FROM guarderia_actas GROUP BY 1; */
BEGIN;
ALTER TABLE public.guarderia_actas DROP CONSTRAINT IF EXISTS chk_carnet_solo_en_recogida;
-- ⚠️ Este ALTER FALLA si hay actas de devolución con NULL. Ver arriba.
ALTER TABLE public.guarderia_actas ALTER COLUMN carnet_verificado SET NOT NULL;
/* `levantar_acta_guarderia` y `marcar_entregada_guarderia` se reponen A MANO
   desde `20260829120000` y `20260907440000`. */
COMMIT;
