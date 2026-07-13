-- S57-A (post-veredicto, observación de la B ratificada): precio_paquete
-- nació SIN el CHECK de sanidad que precio_plan sí tiene
-- (chk_precio_plan_valido, migración D-338). Fue omisión de la A en
-- 20260712180000 — espejo exacto ahora. La validación de venta (> 0)
-- sigue viviendo en la RPC y el wrapper; este CHECK es la red de
-- sanidad del dato (jamás negativo).
ALTER TABLE public.prestador_servicios
  ADD CONSTRAINT chk_precio_paquete_valido
  CHECK (precio_paquete IS NULL OR precio_paquete >= 0);
