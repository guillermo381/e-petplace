-- REVERSA de 20260826110000_s105d_ventana_antes_del_fetch.sql
-- Escrita ANTES de aplicar. S105-D · 25-ago-2026.
--
-- DESHACE: borra las dos funciones de consulta previa. Nada más — no toca
--          `registrar_reverso_nuvei` ni `registrar_reverso_deuna`, que siguen
--          verificando la ventana por su cuenta.
--
-- 🔴 NO DESHACE, y es lo que hay que leer antes de correrla:
--   **REVERTIR REABRE EL DEFECTO.** Sin estas funciones las edges vuelven a
--   pedirle el refund al proveedor ANTES de saber si la ventana está abierta.
--   El registro sigue rebotando —eso no se toca— pero el rebote llega DESPUÉS
--   de que la plata volvió ⇒ **plata devuelta sin rastro nuestro**, que es
--   exactamente el estado que la reversa del reverso ya advierte por escrito.
--
--   ⇒ **ORDEN: primero se retiran los dos cables de las edges, después esto.**

BEGIN;
DROP FUNCTION IF EXISTS public.puede_reversar_nuvei(uuid);
DROP FUNCTION IF EXISTS public.puede_reversar_deuna(uuid);
COMMIT;
