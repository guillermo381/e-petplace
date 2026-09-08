-- REVERSA de `20260911690000_s114a_devengo_guarderia_despensa.sql`. Escrita ANTES.
-- 🔴 Repone dos huecos de plata: guardería y despensa vuelven a cobrar sin
--    devengar. No borra eventos ya creados. Recrear _guarderia_aplicar_acto
--    sin la línea del PERFORM exige su definición previa (historial).
DROP TRIGGER IF EXISTS trg_pedido_devenga_al_entregar ON public.pedido_estados;
DROP FUNCTION IF EXISTS public._trg_pedido_devenga();
DROP FUNCTION IF EXISTS public._devengar_pedido(uuid);
DROP FUNCTION IF EXISTS public._devengar_estadia(uuid);
