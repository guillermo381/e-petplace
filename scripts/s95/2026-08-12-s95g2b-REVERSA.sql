-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA · S95-G2b — moto propia, cobertura y la costura de identidad
--   supabase/migrations/20260812040000_s95g2_moto_propia.sql
--
-- 🔴 REVERTIR TIENE UN COSTO CONCRETO Y HAY QUE SABERLO: el cotizador vuelve a
--    NO conocer el destino ⇒ **un pedido a Guayaquil se cotiza, se cobra, y
--    recién en el reparto se descubre que no se entrega ahí.** Eso no es un
--    error de logística: es una devolución, una disculpa y una familia que no
--    vuelve. Con la despensa abierta, revertir esto cuesta clientes.
--
-- ⚠️ NO borra las columnas de identidad de quien entrega. Son NULLABLE y no
--    molestan; borrarlas perdería el dato si alguna ya se llenó. Las columnas
--    muertas no se pudren.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- El cotizador vuelve a su firma de cinco argumentos (S95-D).
DROP FUNCTION IF EXISTS public.cotizar_envio_despensa(uuid, numeric, numeric, numeric, text, text);
--   \i supabase/migrations/20260812000000_s95_m13_motor.sql  -- restaura la v5
DROP FUNCTION IF EXISTS public.unaccent_simple(text);

-- El courier vuelve a v1.
UPDATE cat_estados_pedido SET activo = true, motivo_inactivo = NULL
 WHERE codigo IN ('en_transito', 'entregado_courier', 'devuelto_origen');

DELETE FROM cat_transiciones_pedido WHERE descripcion LIKE 'S95-G2 ·%';

UPDATE cat_tipos_regla_envio
   SET activo = false,
       motivo_inactivo = 'v1 no lo usa. Se enciende si el vendedor real reparte con moto propia (D-745).'
 WHERE codigo = 'flota_propia';

COMMIT;
