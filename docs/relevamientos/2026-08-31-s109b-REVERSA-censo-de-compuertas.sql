-- ═══ REVERSA de 20260907200000_s109b_el_censo_de_compuertas.sql ═══
-- Escrita ANTES de aplicar.
ALTER TABLE cat_sujetos_de_pago DROP CONSTRAINT IF EXISTS chk_sujeto_declara_su_compuerta;
ALTER TABLE cat_sujetos_de_pago DROP COLUMN IF EXISTS compuerta;
ALTER TABLE cat_sujetos_de_pago DROP COLUMN IF EXISTS compuerta_ausente_porque;
ALTER TABLE cat_sujetos_de_pago DROP COLUMN IF EXISTS cobrable_por_checkout;
DROP FUNCTION IF EXISTS verificar_censo_de_compuertas();
--
-- ⚠️ QUÉ **NO** DESHACE: nada de plata, nada de sujetos. Lo único que se pierde
-- es la OBLIGACIÓN de que un sujeto nuevo declare su compuerta — o sea,
-- exactamente el defecto que la migración vino a volver inexpresable. Revertir
-- devuelve la casa al estado en que se podía abrir una puerta de cobro sin
-- freno y sin que nada lo dijera (medido: `DF-2108181`, $90 cobrados con el
-- acto 2 caído).
